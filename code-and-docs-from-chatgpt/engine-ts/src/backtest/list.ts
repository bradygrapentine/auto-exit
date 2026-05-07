/**
 * SH-BACKTEST Phase A — list recording files in a directory.
 *
 * Returns metadata for both .ndjson and .ndjson.gz files, sorted by date desc.
 * Handles missing directory gracefully (returns []).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RecordingFile } from './types.js';

// Matches: <ticker>-<YYYYMMDD>.ndjson or <ticker>-<YYYYMMDD>.ndjson.gz
// ticker may contain letters, digits, and hyphens; date is exactly 8 digits.
const FILE_RE = /^(.+)-(\d{8})\.ndjson(\.gz)?$/;

/**
 * List all recording files in `dir`.
 * Does NOT include files in the `archive/` subdirectory.
 * Returns sorted by date descending (newest first).
 */
export function listRecordings(dir: string): RecordingFile[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const results: RecordingFile[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const m = FILE_RE.exec(entry.name);
    if (!m) continue;

    const ticker = m[1]!;
    const date = m[2]!;
    const gzipped = m[3] === '.gz';
    const fp = path.join(dir, entry.name);

    let sizeBytes = 0;
    try {
      sizeBytes = fs.statSync(fp).size;
    } catch {
      // file disappeared between readdir and stat — skip
      continue;
    }

    results.push({ path: fp, ticker, date, sizeBytes, gzipped });
  }

  // Sort by date descending, then by ticker ascending as tiebreak.
  results.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return a.ticker.localeCompare(b.ticker);
  });

  return results;
}
