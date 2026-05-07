/**
 * SH-BACKTEST Phase A — retention helpers for recording files.
 *
 * No automatic deletion — operator must explicitly call pruneRecordings().
 * All functions return { processed, skipped } for observability.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';

export interface RetentionResult {
  processed: string[];
  skipped: string[];
}

const NDJSON_RE = /^.+-\d{8}\.ndjson$/;

/** Milliseconds per day */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function ageInDays(filePath: string, now = Date.now()): number {
  try {
    const stat = fs.statSync(filePath);
    return (now - stat.mtimeMs) / MS_PER_DAY;
  } catch {
    return -1;
  }
}

function listNdjson(dir: string): string[] {
  try {
    return fs.readdirSync(dir)
      .filter(f => NDJSON_RE.test(f))
      .map(f => path.join(dir, f));
  } catch {
    return [];
  }
}

/**
 * Gzip .ndjson files older than `ageDays` days (default 7).
 * Writes <file>.ndjson.gz and removes the original.
 */
export function gzipOldRecordings(dir: string, ageDays = 7): RetentionResult {
  const processed: string[] = [];
  const skipped: string[] = [];

  for (const fp of listNdjson(dir)) {
    if (ageInDays(fp) >= ageDays) {
      try {
        const data = fs.readFileSync(fp);
        const gz = zlib.gzipSync(data);
        fs.writeFileSync(fp + '.gz', gz);
        fs.unlinkSync(fp);
        processed.push(fp);
      } catch {
        skipped.push(fp);
      }
    } else {
      skipped.push(fp);
    }
  }

  return { processed, skipped };
}

/**
 * Move .ndjson and .ndjson.gz files older than `ageDays` (default 90)
 * into <dir>/archive/.
 */
export function archiveOldRecordings(dir: string, ageDays = 90): RetentionResult {
  const processed: string[] = [];
  const skipped: string[] = [];

  const archiveDir = path.join(dir, 'archive');
  const allFiles = (() => {
    try {
      return fs.readdirSync(dir)
        .filter(f => f.endsWith('.ndjson') || f.endsWith('.ndjson.gz'))
        .map(f => path.join(dir, f));
    } catch {
      return [];
    }
  })();

  for (const fp of allFiles) {
    if (ageInDays(fp) >= ageDays) {
      try {
        fs.mkdirSync(archiveDir, { recursive: true });
        const dest = path.join(archiveDir, path.basename(fp));
        fs.renameSync(fp, dest);
        processed.push(fp);
      } catch {
        skipped.push(fp);
      }
    } else {
      skipped.push(fp);
    }
  }

  return { processed, skipped };
}

/**
 * Remove .ndjson and .ndjson.gz files (and archived copies) older than
 * `retentionDays` days.  Defaults to `KEA_RECORDING_RETENTION_DAYS` env var,
 * or 365 if unset.
 *
 * IMPORTANT: No automatic deletion — operator must call this explicitly.
 */
export function pruneRecordings(dir: string, retentionDays?: number): RetentionResult {
  const days = retentionDays
    ?? (process.env['KEA_RECORDING_RETENTION_DAYS']
      ? Number(process.env['KEA_RECORDING_RETENTION_DAYS'])
      : 365);

  const processed: string[] = [];
  const skipped: string[] = [];

  const dirsToScan = [dir, path.join(dir, 'archive')];

  for (const scanDir of dirsToScan) {
    let entries: string[];
    try {
      entries = fs.readdirSync(scanDir)
        .filter(f => f.endsWith('.ndjson') || f.endsWith('.ndjson.gz'))
        .map(f => path.join(scanDir, f));
    } catch {
      continue;
    }

    for (const fp of entries) {
      if (ageInDays(fp) >= days) {
        try {
          fs.unlinkSync(fp);
          processed.push(fp);
        } catch {
          skipped.push(fp);
        }
      } else {
        skipped.push(fp);
      }
    }
  }

  return { processed, skipped };
}
