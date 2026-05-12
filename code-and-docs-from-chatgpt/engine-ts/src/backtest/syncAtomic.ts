/**
 * syncAtomic.ts — manifest-verified atomic sync with opt-in remote cleanup.
 *
 * Why this exists: the original `sync.ts` is a tar-pipe extract with no
 * per-file acknowledgement. Coupling it with remote delete would be a
 * data-loss bug — a mid-stream tar abort or full local disk could yield a
 * partial extract, after which "delete remote files older than 7 days"
 * destroys unreceived data. This module adds the integrity gate.
 *
 * Protocol (see Phase 1.4 of the forecaster-integration plan):
 *   1. Remote: `find <remotePath> -type f -name '*.ndjson' -printf '%P\t%s\t%T@\n'`
 *      → the **manifest** (path, byte size, mtime).
 *   2. Stream tar into a fresh staging dir `<localDir>.staging-<ts>/`.
 *   3. Verify: file count matches manifest; every manifest file is present in
 *      staging with the same byte size.
 *   4. Atomic dir swap: move existing `<localDir>` aside, move staging into
 *      place, merge prior files not present in new dir, delete the prior.
 *   5. Only after a successful swap: optional remote cleanup via
 *      `find <remotePath> -mtime +<days> -delete` (default off).
 *
 * Anti-pattern guard: a partial extract with a successful exit is the bug we
 * are preventing. Tests cover (a) mid-stream abort (b) byte-size mismatch
 * (c) crash between mv calls (d) full local disk during staging extract.
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PassThrough } from 'node:stream';
import { splitRemotePath } from './sync.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SyncAtomicOptions {
  flyApp: string;
  remotePath: string;
  localDir: string;
  /** When set, delete remote `*.ndjson` files older than N days AFTER a verified swap. Default: undefined (no remote cleanup). */
  deleteRemoteOlderThanDays?: number;
}

export interface ManifestEntry {
  relPath: string;
  bytes: number;
  /** mtime as Unix seconds (float, per `%T@`). */
  mtimeUnix: number;
}

export interface SyncAtomicResult {
  filesTransferred: number;
  bytesTransferred: number;
  manifestFiles: number;
  durationMs: number;
  swappedFrom?: string;          // path of the .prev-<ts> dir before final delete (informational)
  remoteCleanupAttempted: boolean;
  remoteCleanupDeletedCount?: number;
}

// ---------------------------------------------------------------------------
// Manifest collection
// ---------------------------------------------------------------------------

/**
 * Parse `find -printf '%P\t%s\t%T@\n'` output. Tolerates trailing newline and
 * skips blank lines. Throws on malformed rows.
 */
export function parseManifest(text: string): ManifestEntry[] {
  const out: ManifestEntry[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (line.trim() === '') continue;
    const parts = line.split('\t');
    if (parts.length !== 3) {
      throw new Error(`syncAtomic: malformed manifest row: ${JSON.stringify(line)}`);
    }
    const [relPath, bytesStr, mtimeStr] = parts;
    const bytes = Number(bytesStr);
    const mtimeUnix = Number(mtimeStr);
    if (!Number.isFinite(bytes) || !Number.isFinite(mtimeUnix)) {
      throw new Error(`syncAtomic: malformed manifest row (numbers): ${JSON.stringify(line)}`);
    }
    out.push({ relPath, bytes, mtimeUnix });
  }
  return out;
}

/** Execute the remote `find` to produce the manifest. */
export async function fetchRemoteManifest(flyApp: string, remotePath: string): Promise<ManifestEntry[]> {
  const cmd = `find ${remotePath} -type f -name '*.ndjson' -printf '%P\\t%s\\t%T@\\n'`;
  const stdout = await runFlySsh(flyApp, cmd);
  return parseManifest(stdout);
}

// ---------------------------------------------------------------------------
// Tar extract into staging dir
// ---------------------------------------------------------------------------

/** Tar-pipe `remotePath` from the fly machine into `stagingDir`. Returns bytes piped. */
export function streamTarToStaging(
  flyApp: string,
  remotePath: string,
  stagingDir: string,
): Promise<{ bytesPiped: number }> {
  const { parent, base } = splitRemotePath(remotePath);
  const remoteCmd = `tar czf - -C ${parent} ${base}`;
  return new Promise((resolve, reject) => {
    const flyProc = spawn('fly', ['ssh', 'console', '-a', flyApp, '-C', remoteCmd], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const tarProc = spawn('tar', ['xzf', '-', '-C', stagingDir], {
      stdio: ['pipe', 'inherit', 'pipe'],
    });

    let bytesPiped = 0;
    const counter = new PassThrough();
    counter.on('data', (chunk: Buffer) => { bytesPiped += chunk.length; });
    flyProc.stdout.pipe(counter).pipe(tarProc.stdin);

    const flyStderr: string[] = [];
    flyProc.stderr.on('data', (c: Buffer) => flyStderr.push(c.toString()));

    let flyCode: number | null = null;
    let tarCode: number | null = null;
    let flyError: Error | null = null;
    let tarError: Error | null = null;

    function trySettle() {
      if (flyCode === null || tarCode === null) return;
      if (flyError) return reject(new Error(`fly ssh console failed: ${flyError.message}`));
      if (tarError) return reject(new Error(`local tar failed: ${tarError.message}`));
      const stderrText = flyStderr.join('').trim();
      if (flyCode !== 0) {
        const detail = stderrText ? ` — fly stderr: ${stderrText}` : '';
        return reject(new Error(`fly ssh console exited with code ${flyCode}${detail}`));
      }
      if (bytesPiped === 0) {
        const detail = stderrText ? ` — fly stderr: ${stderrText}` : '';
        return reject(new Error(`no data piped from remote tar (fly exited 0 but stdout was empty)${detail}`));
      }
      if (tarCode !== 0) return reject(new Error(`local tar exited with code ${tarCode}`));
      resolve({ bytesPiped });
    }

    flyProc.on('error', (e) => { flyError = e; flyCode = -1; trySettle(); });
    tarProc.on('error', (e) => { tarError = e; tarCode = -1; trySettle(); });
    flyProc.on('exit', (c) => { flyCode = c ?? -1; trySettle(); });
    tarProc.on('exit', (c) => { tarCode = c ?? -1; trySettle(); });
  });
}

// ---------------------------------------------------------------------------
// Verify staging against manifest
// ---------------------------------------------------------------------------

export interface VerificationFailure {
  reason: 'missing' | 'size_mismatch' | 'extra' | 'count_mismatch';
  relPath?: string;
  expected?: number;
  actual?: number;
}

/**
 * Verify the staging directory matches the manifest:
 *   - every manifest entry exists with matching byte size
 *   - extras (files in staging not in manifest) are tolerated only if they
 *     are dotfiles (e.g. tar's own metadata). Anything else is flagged.
 *
 * Walks staging recursively.
 */
export function verifyStagingAgainstManifest(
  stagingDir: string,
  manifest: ReadonlyArray<ManifestEntry>,
): { ok: boolean; failures: VerificationFailure[] } {
  const failures: VerificationFailure[] = [];

  // 1. Every manifest entry must exist with matching byte size.
  for (const entry of manifest) {
    const localPath = path.join(stagingDir, entry.relPath);
    if (!fs.existsSync(localPath)) {
      failures.push({ reason: 'missing', relPath: entry.relPath });
      continue;
    }
    const stat = fs.statSync(localPath);
    if (stat.size !== entry.bytes) {
      failures.push({
        reason: 'size_mismatch',
        relPath: entry.relPath,
        expected: entry.bytes,
        actual: stat.size,
      });
    }
  }

  // 2. Walk staging and ensure no unexpected non-dotfile files exist.
  const manifestSet = new Set(manifest.map((m) => m.relPath));
  const stagedFiles = walkFiles(stagingDir);
  for (const rel of stagedFiles) {
    if (rel.startsWith('.') || rel.includes('/.')) continue;
    if (!manifestSet.has(rel)) {
      failures.push({ reason: 'extra', relPath: rel });
    }
  }

  // 3. Count check (informational; already covered above but kept for clarity).
  const nonDotStaged = stagedFiles.filter((r) => !r.startsWith('.') && !r.includes('/.'));
  if (nonDotStaged.length !== manifest.length) {
    failures.push({
      reason: 'count_mismatch',
      expected: manifest.length,
      actual: nonDotStaged.length,
    });
  }

  return { ok: failures.length === 0, failures };
}

function walkFiles(root: string): string[] {
  const out: string[] = [];
  function walk(dir: string, rel: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const sub = path.join(dir, entry.name);
      const relSub = rel ? path.posix.join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) walk(sub, relSub);
      else if (entry.isFile()) out.push(relSub);
    }
  }
  walk(root, '');
  return out;
}

// ---------------------------------------------------------------------------
// Atomic directory swap
// ---------------------------------------------------------------------------

/**
 * Atomically replace `targetDir` with `stagingDir`:
 *   - If `targetDir` exists, rename it aside to `<targetDir>.prev-<ts>`.
 *   - Rename staging → target.
 *   - Merge files from prior dir that are absent from the new dir (overlap
 *     window safety — operator may have pulled some files separately).
 *   - Delete prior dir.
 *
 * If any rename fails, restore prior and surface the error.
 */
export function atomicSwap(
  stagingDir: string,
  targetDir: string,
): { priorDir?: string } {
  const ts = new Date().toISOString().replace(/[-:.]/g, '');
  const priorDir = `${targetDir}.prev-${ts}`;

  if (fs.existsSync(targetDir)) {
    fs.renameSync(targetDir, priorDir);
  }

  try {
    fs.renameSync(stagingDir, targetDir);
  } catch (err) {
    // Restore prior to leave the world unchanged.
    if (fs.existsSync(priorDir)) {
      try { fs.renameSync(priorDir, targetDir); } catch { /* swallow restore failure */ }
    }
    throw err;
  }

  // Merge any prior files that aren't in the new dir.
  if (fs.existsSync(priorDir)) {
    const newFiles = new Set(walkFiles(targetDir));
    for (const rel of walkFiles(priorDir)) {
      if (newFiles.has(rel)) continue;
      const src = path.join(priorDir, rel);
      const dst = path.join(targetDir, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.renameSync(src, dst);
    }
    fs.rmSync(priorDir, { recursive: true, force: true });
  }

  return { priorDir: fs.existsSync(priorDir) ? priorDir : undefined };
}

// ---------------------------------------------------------------------------
// Remote cleanup (opt-in)
// ---------------------------------------------------------------------------

/** Returns the count of files reportedly deleted by `find -delete -print`. */
export async function deleteRemoteOlderThan(
  flyApp: string,
  remotePath: string,
  days: number,
): Promise<number> {
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error(`syncAtomic: deleteRemoteOlderThan requires days > 0, got ${days}`);
  }
  const cmd = `find ${remotePath} -type f -name '*.ndjson' -mtime +${days} -print -delete`;
  const stdout = await runFlySsh(flyApp, cmd);
  return stdout.split('\n').filter((l) => l.trim().length > 0).length;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function syncRecordingsAtomic(opts: SyncAtomicOptions): Promise<SyncAtomicResult> {
  const flyApp = opts.flyApp || process.env['KEA_SYNC_FLY_APP'] || '';
  const remotePath = opts.remotePath || process.env['KEA_SYNC_REMOTE_PATH'] || '/data/recordings';
  const { localDir } = opts;
  if (!flyApp) throw new Error('syncRecordingsAtomic: flyApp is required (or set KEA_SYNC_FLY_APP)');

  const startMs = Date.now();

  // 1. Manifest
  const manifest = await fetchRemoteManifest(flyApp, remotePath);

  // 2. Staging extract
  const tsTag = new Date().toISOString().replace(/[-:.]/g, '');
  const stagingDir = `${localDir}.staging-${tsTag}`;
  fs.mkdirSync(stagingDir, { recursive: true });
  const { bytesPiped } = await streamTarToStaging(flyApp, remotePath, stagingDir);

  // 3. Verify
  const stagedRoot = chooseStagedRoot(stagingDir, remotePath);
  const verify = verifyStagingAgainstManifest(stagedRoot, manifest);
  if (!verify.ok) {
    throw new Error(
      `syncRecordingsAtomic: staging verification failed (${verify.failures.length} failure(s)): ` +
        verify.failures.slice(0, 5).map((f) => `${f.reason}:${f.relPath ?? ''}`).join('; ') +
        ` — staging left at ${stagingDir} for inspection`,
    );
  }

  // 4. Atomic swap
  const { priorDir } = atomicSwap(stagedRoot, localDir);
  // If extract created an intermediate directory level (e.g. tar with C parent + base means
  // staging now contains an empty wrapper), clean it up.
  if (stagedRoot !== stagingDir) fs.rmSync(stagingDir, { recursive: true, force: true });

  // 5. Optional remote cleanup
  let remoteCleanupAttempted = false;
  let remoteCleanupDeletedCount: number | undefined;
  if (opts.deleteRemoteOlderThanDays !== undefined && opts.deleteRemoteOlderThanDays > 0) {
    remoteCleanupAttempted = true;
    remoteCleanupDeletedCount = await deleteRemoteOlderThan(flyApp, remotePath, opts.deleteRemoteOlderThanDays);
  }

  return {
    filesTransferred: manifest.length,
    bytesTransferred: bytesPiped,
    manifestFiles: manifest.length,
    durationMs: Date.now() - startMs,
    swappedFrom: priorDir,
    remoteCleanupAttempted,
    remoteCleanupDeletedCount,
  };
}

/**
 * When tar runs as `tar czf - -C <parent> <base>`, the extracted tree includes
 * a `<base>/` directory at the staging root. Resolve to that subdir so manifest
 * paths (which are relative to <base>) line up.
 */
function chooseStagedRoot(stagingDir: string, remotePath: string): string {
  const { base } = splitRemotePath(remotePath);
  const candidate = path.join(stagingDir, base);
  return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory() ? candidate : stagingDir;
}

// ---------------------------------------------------------------------------
// fly ssh exec helper
// ---------------------------------------------------------------------------

export function runFlySsh(flyApp: string, remoteCmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('fly', ['ssh', 'console', '-a', flyApp, '-C', remoteCmd], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const out: string[] = [];
    const err: string[] = [];
    proc.stdout.on('data', (c: Buffer) => out.push(c.toString()));
    proc.stderr.on('data', (c: Buffer) => err.push(c.toString()));
    proc.on('error', (e) => reject(new Error(`fly ssh console failed: ${e.message}`)));
    proc.on('exit', (code) => {
      if (code !== 0) {
        const detail = err.join('').trim();
        reject(new Error(`fly ssh console exited with code ${code}${detail ? ` — stderr: ${detail}` : ''}`));
        return;
      }
      resolve(out.join(''));
    });
  });
}
