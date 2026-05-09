/**
 * sync.ts — pull recordings from a Fly.io scanner volume to local disk.
 *
 * Uses `fly ssh console -a <app> -C "tar czf - -C <parent> <basename>"`
 * piped to `tar xzf - -C <localDir>`.  No SSH keys, no fly proxy, no rsync —
 * Fly's own auth handles the session.
 *
 * Environment variable overrides (lowest precedence):
 *   KEA_SYNC_FLY_APP       — fly app name
 *   KEA_SYNC_REMOTE_PATH   — remote path (default /data/recordings)
 */

import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { PassThrough } from 'node:stream';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SyncOptions {
  flyApp: string;       // fly app name, e.g. 'auto-exit-scanner'
  remotePath: string;   // absolute path on remote volume, e.g. '/data/recordings'
  localDir: string;     // local extract destination
}

export interface SyncResult {
  filesTransferred: number;    // count of extracted files from tar -v output
  bytesTransferred?: number;   // not available from tar; kept for interface compat
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split '/data/recordings' → { parent: '/data', base: 'recordings' }.
 *  Normalises trailing slashes before splitting.
 */
export function splitRemotePath(remotePath: string): { parent: string; base: string } {
  const normalised = remotePath.replace(/\/+$/, '');
  return {
    parent: path.posix.dirname(normalised),
    base: path.posix.basename(normalised),
  };
}

/** Count non-empty lines in tar -v output (one line per extracted file). */
function countVerboseLines(text: string): number {
  return text.split('\n').filter((l) => l.trim().length > 0).length;
}

// ---------------------------------------------------------------------------
// syncRecordings
// ---------------------------------------------------------------------------

export async function syncRecordings(opts: SyncOptions): Promise<SyncResult> {
  const flyApp = opts.flyApp || process.env['KEA_SYNC_FLY_APP'] || '';
  const remotePath = opts.remotePath || process.env['KEA_SYNC_REMOTE_PATH'] || '/data/recordings';
  const { localDir } = opts;

  if (!flyApp) throw new Error('syncRecordings: flyApp is required (or set KEA_SYNC_FLY_APP)');

  const { parent, base } = splitRemotePath(remotePath);
  const remoteCmd = `tar czf - -C ${parent} ${base}`;

  const startMs = Date.now();

  return new Promise<SyncResult>((resolve, reject) => {
    // fly ssh console produces gzipped tar on stdout. We capture stderr too
    // (instead of inheriting) so we can surface remote-side errors and detect
    // the silent-failure mode described in SH-SCANNER-SYNC-FIX-2 — fly exits 0
    // with no stdout bytes, leaving the local tar with an empty input.
    const flyProc = spawn('fly', ['ssh', 'console', '-a', flyApp, '-C', remoteCmd], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // local tar extracts verbose to stderr, which we capture for file count
    const tarProc = spawn('tar', ['xzvf', '-', '-C', localDir], {
      stdio: ['pipe', 'inherit', 'pipe'],
    });

    // Count bytes piped from fly stdout to detect silent-failure mode where
    // fly exits cleanly without ever writing tar output. Use a PassThrough so
    // .pipe() handles backpressure for large transfers.
    let bytesPiped = 0;
    const counter = new PassThrough();
    counter.on('data', (chunk: Buffer) => { bytesPiped += chunk.length; });
    flyProc.stdout.pipe(counter).pipe(tarProc.stdin);

    // capture fly stderr — connection-banner messages are normal but errors
    // (auth, missing app, machine stopped) also flow here.
    const flyStderr: string[] = [];
    flyProc.stderr.on('data', (chunk: Buffer) => flyStderr.push(chunk.toString()));

    // capture tar verbose lines (goes to stderr with -v on some platforms)
    const tarVerbose: string[] = [];
    tarProc.stderr.on('data', (chunk: Buffer) => tarVerbose.push(chunk.toString()));

    let flyCode: number | null = null;
    let tarCode: number | null = null;
    let flyError: Error | null = null;
    let tarError: Error | null = null;

    function trySettle() {
      if (flyCode === null || tarCode === null) return; // wait for both

      if (flyError) {
        reject(new Error(`fly ssh console failed to start: ${flyError.message}`));
        return;
      }
      if (tarError) {
        reject(new Error(`local tar failed to start: ${tarError.message}`));
        return;
      }
      const stderrText = flyStderr.join('').trim();
      if (flyCode !== 0) {
        const detail = stderrText ? ` — fly stderr: ${stderrText}` : '';
        reject(new Error(`fly ssh console exited with code ${flyCode}${detail}`));
        return;
      }
      if (bytesPiped === 0) {
        const detail = stderrText ? ` — fly stderr: ${stderrText}` : '';
        reject(new Error(`no data piped from remote tar (fly exited 0 but stdout was empty)${detail}`));
        return;
      }
      if (tarCode !== 0) {
        reject(new Error(`local tar exited with code ${tarCode}`));
        return;
      }

      const verboseText = tarVerbose.join('');
      resolve({
        filesTransferred: countVerboseLines(verboseText),
        bytesTransferred: bytesPiped,
        durationMs: Date.now() - startMs,
      });
    }

    flyProc.on('error', (err) => {
      flyError = err;
      flyCode = -1;
      trySettle();
    });

    tarProc.on('error', (err) => {
      tarError = err;
      tarCode = -1;
      trySettle();
    });

    flyProc.on('close', (code) => {
      flyCode = code ?? -1;
      trySettle();
    });

    tarProc.on('close', (code) => {
      tarCode = code ?? -1;
      trySettle();
    });
  });
}
