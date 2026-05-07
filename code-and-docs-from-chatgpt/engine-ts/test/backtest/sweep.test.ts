/**
 * SH-BACKTEST Phase B2 — sweep tests.
 *
 * Tests: 2x2 grid produces 4 rows; rankBy sorts correctly; empty grid → 1 row
 * with baseParams; cartesianProduct helper; NDJSON output one line per row.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runSweep, cartesianProduct } from '../../src/backtest/sweep.js';
import type { SnapshotEntry } from '../../src/backtest/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TICKER = 'KXTEST-SWEEP';

function makeSnapshot(i: number): SnapshotEntry {
  return {
    kind: 'snapshot',
    ts: `2026-05-07T10:0${i}:00.000Z`,
    ticker: TICKER,
    orderbook: {
      yes: [[50 + i, 100]],
      no: [[50 - i, 100]],
    },
    depth_levels: 1,
  };
}

function writeTmpNdjson(dir: string, count = 5): string {
  const filePath = path.join(dir, 'recording.ndjson');
  const lines = Array.from({ length: count }, (_, i) =>
    JSON.stringify(makeSnapshot(i)),
  );
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
  return filePath;
}

// ---------------------------------------------------------------------------
// cartesianProduct
// ---------------------------------------------------------------------------

describe('cartesianProduct', () => {
  it('empty grid → one empty combination', () => {
    const result = cartesianProduct({});
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({});
  });

  it('single key with 3 values → 3 combinations', () => {
    const result = cartesianProduct({ a: [1, 2, 3] });
    expect(result).toHaveLength(3);
    expect(result.map((r) => r['a'])).toEqual([1, 2, 3]);
  });

  it('2x2 grid → 4 combinations with all pairs', () => {
    const result = cartesianProduct({ a: [1, 2], b: ['x', 'y'] });
    expect(result).toHaveLength(4);
    const pairs = result.map((r) => `${r['a']}-${r['b']}`).sort();
    expect(pairs).toEqual(['1-x', '1-y', '2-x', '2-y']);
  });

  it('3x2x2 grid → 12 combinations', () => {
    const result = cartesianProduct({ a: [1, 2, 3], b: [10, 20], c: ['p', 'q'] });
    expect(result).toHaveLength(12);
  });
});

// ---------------------------------------------------------------------------
// runSweep
// ---------------------------------------------------------------------------

describe('runSweep', () => {
  let dir: string;
  let recordingPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-sweep-test-'));
    recordingPath = writeTmpNdjson(dir, 5);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('empty grid → 1 row with baseParams only', async () => {
    const result = await runSweep({
      recordingPath,
      strategyId: 'stub',
      baseParams: { ticker: TICKER, size: 5 },
      grid: {},
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 5 },
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.params['ticker']).toBe(TICKER);
    expect(result.rows[0]!.params['size']).toBe(5);
  });

  it('2x2 grid → 4 rows', async () => {
    const result = await runSweep({
      recordingPath,
      strategyId: 'stub',
      baseParams: { ticker: TICKER },
      grid: { size: [5, 10], stopPriceCents: [40, 45] },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
    });

    expect(result.rows).toHaveLength(4);
  });

  it('rows are sorted descending by default rankBy (pnl_cents)', async () => {
    const result = await runSweep({
      recordingPath,
      strategyId: 'stub',
      baseParams: { ticker: TICKER },
      grid: { size: [5, 10] },
    });

    const pnls = result.rows.map((r) => r.summary.pnl_cents);
    for (let i = 1; i < pnls.length; i++) {
      expect(pnls[i]!).toBeLessThanOrEqual(pnls[i - 1]!);
    }
  });

  it('rankBy fill_count sorts by fill count descending', async () => {
    const result = await runSweep({
      recordingPath,
      strategyId: 'stub',
      baseParams: { ticker: TICKER },
      grid: { size: [5, 10, 15] },
      rankBy: 'fill_count',
    });

    const counts = result.rows.map((r) => r.summary.fill_count);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]!).toBeLessThanOrEqual(counts[i - 1]!);
    }
  });

  it('NDJSON output has one line per row', async () => {
    const result = await runSweep({
      recordingPath,
      strategyId: 'stub',
      baseParams: { ticker: TICKER },
      grid: { size: [5, 10] },
    });

    const lines = result.ndjson.trim().split('\n');
    expect(lines).toHaveLength(result.rows.length);
    // Each line is valid JSON
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it('markdown table contains header with param and summary columns', async () => {
    const result = await runSweep({
      recordingPath,
      strategyId: 'stub',
      baseParams: { ticker: TICKER },
      grid: { size: [5, 10] },
    });

    expect(result.table).toContain('pnl_cents');
    expect(result.table).toContain('fill_count');
    expect(result.table).toContain('size');
  });

  it('each row summary has all required fields', async () => {
    const result = await runSweep({
      recordingPath,
      strategyId: 'stub',
      baseParams: { ticker: TICKER },
      grid: { size: [5] },
    });

    const s = result.rows[0]!.summary;
    expect(typeof s.pnl_cents).toBe('number');
    expect(typeof s.fill_count).toBe('number');
    expect(typeof s.fill_rate).toBe('number');
    expect(typeof s.avg_slippage_cents).toBe('number');
    expect(typeof s.time_to_full_exit_s).toBe('number');
    expect(typeof s.max_adverse_excursion_cents).toBe('number');
    expect(typeof s.max_favorable_excursion_cents).toBe('number');
  });
});
