/**
 * coverage.test.ts
 *
 * Verifies the coverage gate computation:
 *   - parseRecordingFilename handles the standard pattern
 *   - parseSinceToMs handles d/h/m/s suffixes + bare integers
 *   - computeCoverage groups files by ticker, computes per-ticker max gap
 *   - within-file gaps and cross-file gaps both surfaced
 *   - threshold filter sorts failures correctly
 *   - empty recordings dir returns ok=true with zero tickers
 *   - missing recordings dir does not throw
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  computeCoverage,
  formatCoverageReport,
  parseRecordingFilename,
  parseSinceToMs,
} from '../../src/backtest/coverage.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-cov-test-'));
}

function writeSnapshots(filePath: string, tsIsoList: string[]) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = tsIsoList.map((ts) =>
    JSON.stringify({ kind: 'snapshot', ts, ticker: 'X', orderbook: { yes: [], no: [] } }),
  );
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// parseRecordingFilename
// ---------------------------------------------------------------------------

describe('parseRecordingFilename', () => {
  it('extracts ticker and date from the standard pattern', () => {
    expect(parseRecordingFilename('KXWTI-26MAY12-T100.99-20260512.ndjson')).toEqual({
      ticker: 'KXWTI-26MAY12-T100.99',
      dateYyyymmdd: '20260512',
    });
  });

  it('returns null for non-matching names', () => {
    expect(parseRecordingFilename('not-a-recording.txt')).toBeNull();
    expect(parseRecordingFilename('missing-date.ndjson')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseSinceToMs
// ---------------------------------------------------------------------------

describe('parseSinceToMs', () => {
  it('handles d/h/m/s suffixes and bare integers', () => {
    const now = 10_000_000_000;
    expect(parseSinceToMs('30d', now)).toBe(now - 30 * 86400_000);
    expect(parseSinceToMs('12h', now)).toBe(now - 12 * 3600_000);
    expect(parseSinceToMs('60m', now)).toBe(now - 60 * 60_000);
    expect(parseSinceToMs('3600s', now)).toBe(now - 3600_000);
    expect(parseSinceToMs('7', now)).toBe(now - 7 * 86400_000); // default unit = days
  });

  it('throws on malformed input', () => {
    expect(() => parseSinceToMs('asdf')).toThrow(/unrecognized/);
  });
});

// ---------------------------------------------------------------------------
// computeCoverage
// ---------------------------------------------------------------------------

describe('computeCoverage', () => {
  it('returns ok with empty tickers for a missing recordings dir', async () => {
    const r = await computeCoverage({
      recordingsDir: '/does/not/exist',
      sinceMs: 0,
      maxGapSeconds: 600,
    });
    expect(r.ok).toBe(true);
    expect(r.tickers).toEqual([]);
  });

  it('returns ok with empty tickers for an empty recordings dir', async () => {
    const dir = tmpDir();
    const r = await computeCoverage({ recordingsDir: dir, sinceMs: 0, maxGapSeconds: 600 });
    expect(r.ok).toBe(true);
    expect(r.tickers).toEqual([]);
  });

  it('reports a small max gap when snapshots are dense', async () => {
    const dir = tmpDir();
    writeSnapshots(path.join(dir, 'KXA-1-20260512.ndjson'), [
      '2026-05-12T00:00:00.000Z',
      '2026-05-12T00:00:01.000Z',
      '2026-05-12T00:00:02.000Z',
    ]);
    const r = await computeCoverage({ recordingsDir: dir, sinceMs: 0, maxGapSeconds: 600 });
    expect(r.ok).toBe(true);
    expect(r.tickers).toHaveLength(1);
    expect(r.tickers[0].maxGapSeconds).toBeCloseTo(1.0);
    expect(r.tickers[0].snapshotCount).toBe(3);
  });

  it('catches a large intra-file gap', async () => {
    const dir = tmpDir();
    writeSnapshots(path.join(dir, 'KXA-1-20260512.ndjson'), [
      '2026-05-12T00:00:00.000Z',
      '2026-05-12T00:20:00.000Z', // 1200s gap
      '2026-05-12T00:20:01.000Z',
    ]);
    const r = await computeCoverage({ recordingsDir: dir, sinceMs: 0, maxGapSeconds: 600 });
    expect(r.ok).toBe(false);
    expect(r.failures).toHaveLength(1);
    expect(r.failures[0].maxGapSeconds).toBeCloseTo(1200, 0);
    expect(r.failures[0].maxGapWhere).toEqual({
      fromTs: '2026-05-12T00:00:00.000Z',
      toTs: '2026-05-12T00:20:00.000Z',
    });
  });

  it('catches gaps that straddle files of the same ticker', async () => {
    const dir = tmpDir();
    writeSnapshots(path.join(dir, 'KXA-1-20260511.ndjson'), [
      '2026-05-11T23:59:00.000Z',
      '2026-05-11T23:59:30.000Z',
    ]);
    writeSnapshots(path.join(dir, 'KXA-1-20260512.ndjson'), [
      '2026-05-12T00:30:00.000Z', // 30min gap from end of prior file
      '2026-05-12T00:30:01.000Z',
    ]);
    const r = await computeCoverage({ recordingsDir: dir, sinceMs: 0, maxGapSeconds: 600 });
    expect(r.ok).toBe(false);
    expect(r.failures[0].maxGapSeconds).toBeCloseTo(1830, 0);
  });

  it('ignores files dated before sinceMs', async () => {
    const dir = tmpDir();
    writeSnapshots(path.join(dir, 'KXA-1-20260101.ndjson'), [
      '2026-01-01T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z', // huge gap, but file is excluded
    ]);
    writeSnapshots(path.join(dir, 'KXA-1-20260512.ndjson'), [
      '2026-05-12T00:00:00.000Z',
      '2026-05-12T00:00:01.000Z',
    ]);
    const sinceMs = Date.UTC(2026, 4, 1); // May 1 2026
    const r = await computeCoverage({ recordingsDir: dir, sinceMs, maxGapSeconds: 600 });
    expect(r.ok).toBe(true);
    expect(r.tickers[0].fileCount).toBe(1);
  });

  it('groups by ticker correctly when multiple tickers share a directory', async () => {
    const dir = tmpDir();
    writeSnapshots(path.join(dir, 'KXA-1-20260512.ndjson'), [
      '2026-05-12T00:00:00.000Z',
      '2026-05-12T00:00:01.000Z',
    ]);
    writeSnapshots(path.join(dir, 'KXB-2-20260512.ndjson'), [
      '2026-05-12T00:00:00.000Z',
      '2026-05-12T01:00:00.000Z', // 3600s gap → fail
    ]);
    const r = await computeCoverage({ recordingsDir: dir, sinceMs: 0, maxGapSeconds: 600 });
    expect(r.ok).toBe(false);
    expect(r.failures.map((f) => f.ticker)).toEqual(['KXB-2']);
  });
});

// ---------------------------------------------------------------------------
// formatCoverageReport
// ---------------------------------------------------------------------------

describe('formatCoverageReport', () => {
  it('emits an OK header for a passing report', () => {
    const out = formatCoverageReport({
      ok: true,
      thresholdSeconds: 600,
      tickers: [],
      failures: [],
    });
    expect(out).toMatch(/coverage: OK/);
  });

  it('lists every failing ticker with its max gap', () => {
    const out = formatCoverageReport({
      ok: false,
      thresholdSeconds: 600,
      tickers: [
        {
          ticker: 'KXA-1',
          fileCount: 2,
          snapshotCount: 100,
          maxGapSeconds: 1800,
          maxGapWhere: { fromTs: '2026-05-12T00:00:00Z', toTs: '2026-05-12T00:30:00Z' },
        },
      ],
      failures: [
        {
          ticker: 'KXA-1',
          fileCount: 2,
          snapshotCount: 100,
          maxGapSeconds: 1800,
          maxGapWhere: { fromTs: '2026-05-12T00:00:00Z', toTs: '2026-05-12T00:30:00Z' },
        },
      ],
    });
    expect(out).toMatch(/FAIL/);
    expect(out).toMatch(/KXA-1: 1800.0s/);
  });
});
