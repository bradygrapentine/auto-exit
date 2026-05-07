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
    // fly ssh console produces gzipped tar on stdout
    const flyProc = spawn('fly', ['ssh', 'console', '-a', flyApp, '-C', remoteCmd], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });

    // local tar extracts verbose to stderr, which we capture for file count
    const tarProc = spawn('tar', ['xzvf', '-', '-C', localDir], {
      stdio: ['pipe', 'inherit', 'pipe'],
    });

    // pipe fly stdout → tar stdin
    flyProc.stdout.pipe(tarProc.stdin);

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
      if (flyCode !== 0) {
        reject(new Error(`fly ssh console exited with code ${flyCode}`));
        return;
      }
      if (tarCode !== 0) {
        reject(new Error(`local tar exited with code ${tarCode}`));
        return;
      }

      const verboseText = tarVerbose.join('');
      resolve({
        filesTransferred: countVerboseLines(verboseText),
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
      // Signal EOF to tar once fly is done
      tarProc.stdin.end();
      trySettle();
    });

    tarProc.on('close', (code) => {
      tarCode = code ?? -1;
      trySettle();
    });
  });
}
