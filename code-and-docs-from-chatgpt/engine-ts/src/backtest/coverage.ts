/**
 * coverage.ts — recording continuity gate.
 *
 * Acceptance signal for "did the scanner actually capture data": for each
 * ticker discovered in the recordings directory, find the largest gap (in
 * seconds) between consecutive snapshots within the lookback window. If any
 * ticker's max gap exceeds the threshold, coverage fails.
 *
 * Cheaper than full-snapshot semantic validation (just timestamps), but more
 * rigorous than a file-existence count — a 200-byte file passes a count
 * check despite representing zero real coverage.
 *
 * Recording filename convention: `<TICKER>-<YYYYMMDD>.ndjson` (one file per
 * ticker per day). Snapshots are NDJSON rows with an ISO-8601 `ts` field.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CoverageOptions {
  /** Directory containing `<TICKER>-<YYYYMMDD>.ndjson` files. */
  recordingsDir: string;
  /** Inclusive lower bound — only files dated on/after this (millis since epoch). */
  sinceMs: number;
  /** Threshold for the max acceptable gap between consecutive snapshots. */
  maxGapSeconds: number;
}

export interface TickerCoverage {
  ticker: string;
  /** Number of files contributing to this ticker (within the window). */
  fileCount: number;
  /** Total snapshots across all files. */
  snapshotCount: number;
  /** Largest gap in seconds between consecutive snapshots, across all files (joined). */
  maxGapSeconds: number;
  /** Where the max gap occurred — useful when surfacing failures. */
  maxGapWhere?: { fromTs: string; toTs: string };
  /** Snapshots straddling files contribute too (last of file N → first of file N+1). */
}

export interface CoverageReport {
  ok: boolean;
  thresholdSeconds: number;
  tickers: TickerCoverage[];
  failures: TickerCoverage[];
}

// ---------------------------------------------------------------------------
// Filename parsing
// ---------------------------------------------------------------------------

/** `KXWTI-26MAY12-T100-20260512.ndjson` → { ticker: 'KXWTI-26MAY12-T100', dateYyyymmdd: '20260512' } */
export function parseRecordingFilename(name: string): { ticker: string; dateYyyymmdd: string } | null {
  const m = name.match(/^(.+)-(\d{8})\.ndjson$/);
  if (!m) return null;
  return { ticker: m[1], dateYyyymmdd: m[2] };
}

function yyyymmddToMs(yyyymmdd: string): number {
  // Use UTC midnight to align with how Date.UTC parses ISO dates.
  const y = Number(yyyymmdd.slice(0, 4));
  const mo = Number(yyyymmdd.slice(4, 6)) - 1;
  const d = Number(yyyymmdd.slice(6, 8));
  return Date.UTC(y, mo, d);
}

// ---------------------------------------------------------------------------
// Coverage computation
// ---------------------------------------------------------------------------

export async function computeCoverage(opts: CoverageOptions): Promise<CoverageReport> {
  if (!fs.existsSync(opts.recordingsDir)) {
    return { ok: true, thresholdSeconds: opts.maxGapSeconds, tickers: [], failures: [] };
  }

  // Group files by ticker, within the date window.
  const byTicker = new Map<string, Array<{ filePath: string; dateMs: number }>>();
  for (const name of fs.readdirSync(opts.recordingsDir)) {
    const parsed = parseRecordingFilename(name);
    if (!parsed) continue;
    const dateMs = yyyymmddToMs(parsed.dateYyyymmdd);
    if (dateMs < opts.sinceMs) continue;
    const filePath = path.join(opts.recordingsDir, name);
    let list = byTicker.get(parsed.ticker);
    if (!list) {
      list = [];
      byTicker.set(parsed.ticker, list);
    }
    list.push({ filePath, dateMs });
  }

  const tickers: TickerCoverage[] = [];
  for (const [ticker, files] of byTicker) {
    files.sort((a, b) => a.dateMs - b.dateMs);
    tickers.push(await analyzeTicker(ticker, files.map((f) => f.filePath)));
  }
  tickers.sort((a, b) => b.maxGapSeconds - a.maxGapSeconds);

  const failures = tickers.filter((t) => t.maxGapSeconds > opts.maxGapSeconds);
  return {
    ok: failures.length === 0,
    thresholdSeconds: opts.maxGapSeconds,
    tickers,
    failures,
  };
}

async function analyzeTicker(ticker: string, filePaths: string[]): Promise<TickerCoverage> {
  let snapshotCount = 0;
  let lastTsMs: number | null = null;
  let lastTsIso: string | null = null;
  let maxGapSeconds = 0;
  let maxGapWhere: { fromTs: string; toTs: string } | undefined;

  for (const filePath of filePaths) {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of rl) {
      if (line.trim() === '') continue;
      const ts = extractTs(line);
      if (ts === null) continue;
      snapshotCount += 1;
      if (lastTsMs !== null && lastTsIso !== null) {
        const gapSec = (ts.ms - lastTsMs) / 1000;
        if (gapSec > maxGapSeconds) {
          maxGapSeconds = gapSec;
          maxGapWhere = { fromTs: lastTsIso, toTs: ts.iso };
        }
      }
      lastTsMs = ts.ms;
      lastTsIso = ts.iso;
    }
  }

  return {
    ticker,
    fileCount: filePaths.length,
    snapshotCount,
    maxGapSeconds,
    maxGapWhere,
  };
}

/**
 * Pull `ts` out of an NDJSON line without parsing the full payload. We use a
 * substring match for performance — full JSON.parse on 5M+ lines would
 * dominate runtime. Fall back to JSON.parse if the fast path fails.
 */
function extractTs(line: string): { iso: string; ms: number } | null {
  // Fast path: look for `"ts":"<ISO>"` near the start.
  const fast = line.match(/"ts"\s*:\s*"([^"]+)"/);
  if (fast) {
    const iso = fast[1];
    const ms = Date.parse(iso);
    if (Number.isFinite(ms)) return { iso, ms };
  }
  // Slow path: full parse.
  try {
    const obj = JSON.parse(line) as { ts?: unknown };
    if (typeof obj.ts === 'string') {
      const ms = Date.parse(obj.ts);
      if (Number.isFinite(ms)) return { iso: obj.ts, ms };
    }
  } catch {
    // ignore malformed line
  }
  return null;
}

// ---------------------------------------------------------------------------
// Since-string parser (used by CLI)
// ---------------------------------------------------------------------------

/** Parse "30d" / "12h" / "60m" / "3600s" or a raw integer (treated as days). */
export function parseSinceToMs(input: string, nowMs: number = Date.now()): number {
  const m = input.match(/^(\d+)\s*(d|h|m|s)?$/i);
  if (!m) throw new Error(`coverage: unrecognized --since value: ${JSON.stringify(input)}`);
  const n = Number(m[1]);
  const unit = (m[2] ?? 'd').toLowerCase();
  const multSec = unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1;
  return nowMs - n * multSec * 1000;
}

// ---------------------------------------------------------------------------
// CLI-friendly summary formatter
// ---------------------------------------------------------------------------

export function formatCoverageReport(report: CoverageReport): string {
  const lines: string[] = [];
  lines.push(
    `coverage: ${report.ok ? 'OK' : 'FAIL'} — ${report.tickers.length} ticker(s), threshold=${report.thresholdSeconds}s`,
  );
  if (report.failures.length > 0) {
    lines.push('failures (max-gap > threshold):');
    for (const t of report.failures) {
      const where = t.maxGapWhere ? ` (${t.maxGapWhere.fromTs} → ${t.maxGapWhere.toTs})` : '';
      lines.push(`  ${t.ticker}: ${t.maxGapSeconds.toFixed(1)}s${where} [${t.snapshotCount} snaps in ${t.fileCount} file(s)]`);
    }
  }
  return lines.join('\n');
}
