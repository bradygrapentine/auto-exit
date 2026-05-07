/**
 * sync.ts — rsync recordings from a remote scanner host to local disk.
 *
 * Wraps: rsync -avz --partial --info=stats1 <remoteHost>:<remotePath>/ <localDir>/
 * Assumes operator's ~/.ssh/config has the host configured.
 * Returns lists of transferred and errored files.
 */

import { spawn } from 'node:child_process';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SyncOptions {
  remoteHost: string;
  remotePath: string;
  localDir: string;
}

export interface SyncResult {
  transferred: string[];
  errored: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse transferred file paths from rsync stdout.
 *
 * rsync outputs one line per transferred file (relative paths).
 * Lines beginning with special prefixes (sending, receiving, sent, total, etc.)
 * are metadata — skip those and keep bare path lines.
 */
function parseTransferred(stdout: string): string[] {
  return stdout
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      // Skip rsync status lines
      if (/^(sending|receiving|sent|total|Number|speedup|created|deleting)/i.test(l)) return false;
      // Skip lines that look like "X files transferred"
      if (/^\d/.test(l)) return false;
      return true;
    });
}

// ---------------------------------------------------------------------------
// syncRecordings
// ---------------------------------------------------------------------------

export function syncRecordings(opts: SyncOptions): Promise<SyncResult> {
  const { remoteHost, remotePath, localDir } = opts;
  const src = `${remoteHost}:${remotePath}/`;
  const dst = `${localDir}/`;

  return new Promise((resolve) => {
    const chunks: string[] = [];
    const errChunks: string[] = [];

    const child = spawn('rsync', ['-avz', '--partial', '--info=stats1', src, dst]);

    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => errChunks.push(chunk.toString()));

    child.on('close', (code) => {
      const stdout = chunks.join('');
      if (code === 0) {
        resolve({ transferred: parseTransferred(stdout), errored: [] });
      } else {
        // rsync exit 23/24 = partial transfer; still parse what we got
        const transferred = parseTransferred(stdout);
        const stderrText = errChunks.join('').trim();
        resolve({
          transferred,
          errored: stderrText ? [stderrText] : [`rsync exited with code ${code}`],
        });
      }
    });

    child.on('error', (err) => {
      resolve({ transferred: [], errored: [err.message] });
    });
  });
}
