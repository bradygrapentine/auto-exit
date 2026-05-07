/**
 * SH-BACKTEST Phase B1 — recording loader.
 *
 * Reads `.ndjson` or `.ndjson.gz` files produced by recorder.ts and returns
 * a sorted, optionally time-filtered array of RecordingEntry objects.
 *
 * Pure — no side effects, no global state.
 */

import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createInterface } from 'node:readline';
import type { RecordingEntry } from './types.js';

export interface LoadOptions {
  /** Only include entries with ts >= tsFrom (ISO string, inclusive). */
  tsFrom?: string;
  /** Only include entries with ts <= tsTo (ISO string, inclusive). */
  tsTo?: string;
}

/**
 * Load a recording file and return its entries sorted ascending by ts.
 *
 * Supports `.ndjson` (plain text) and `.ndjson.gz` (gzip-compressed).
 * Lines that cannot be parsed as JSON are silently skipped (corrupt / partial
 * writes are expected at the tail of a live recording file).
 */
export async function loadRecording(
  filePath: string,
  opts: LoadOptions = {},
): Promise<RecordingEntry[]> {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    return [];
  }

  const { tsFrom, tsTo } = opts;
  const entries: RecordingEntry[] = [];

  const fileStream = fs.createReadStream(filePath);
  const isGzipped = filePath.endsWith('.gz');

  // Build the stream pipeline: file → [gunzip] → readline
  const rl = await (async () => {
    if (isGzipped) {
      const gunzip = zlib.createGunzip();
      // pipeline forwards errors; we attach rl after piping
      fileStream.pipe(gunzip);
      return createInterface({ input: gunzip, crlfDelay: Infinity });
    }
    return createInterface({ input: fileStream, crlfDelay: Infinity });
  })();

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let entry: RecordingEntry;
    try {
      entry = JSON.parse(trimmed) as RecordingEntry;
    } catch {
      // Corrupt / partial write — skip
      continue;
    }

    // Validate minimal discriminant — guard against non-entry junk lines
    if (!entry.kind || !entry.ts) continue;

    // Time-window filtering
    if (tsFrom !== undefined && entry.ts < tsFrom) continue;
    if (tsTo !== undefined && entry.ts > tsTo) continue;

    entries.push(entry);
  }

  // Ensure ascending order by ts (files should already be ordered, but
  // multi-file merges or recorder rotations may introduce brief disorder)
  entries.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));

  return entries;
}

/**
 * Convenience: load multiple recording files and merge into a single
 * sorted stream (useful when a session spans a UTC midnight rotation).
 */
export async function loadRecordings(
  filePaths: string[],
  opts: LoadOptions = {},
): Promise<RecordingEntry[]> {
  const arrays = await Promise.all(filePaths.map((p) => loadRecording(p, opts)));
  const merged = arrays.flat();
  merged.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  return merged;
}

// Ensure pipeline is importable but also usable for future gz write tests
export { pipeline };
