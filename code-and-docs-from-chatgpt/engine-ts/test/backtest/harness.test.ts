/**
 * SH-BACKTEST Phase B2 — harness tests.
 *
 * End-to-end: write 5 snapshot entries to a temp NDJSON file, run
 * runBacktest with 'stub' strategy (no orders) and 'stop_loss' strategy,
 * assert report shape, assumptions_warning populated, fills accumulate.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runBacktest } from '../../src/backtest/harness.js';
import type { SnapshotEntry } from '../../src/backtest/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TICKER = 'KXTEST-HARNESS';

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
// Tests
// ---------------------------------------------------------------------------

describe('runBacktest', () => {
  let dir: string;
  let recordingPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-harness-test-'));
    recordingPath = writeTmpNdjson(dir, 5);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns a valid CounterfactualReport shape', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 'stub',
      params: { ticker: TICKER, size: 10 },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
    });

    expect(report.strategyId).toBe('stub');
    expect(report.recordingPath).toBe(recordingPath);
    expect(typeof report.pnl_cents).toBe('number');
    expect(typeof report.fill_count).toBe('number');
    expect(typeof report.fill_rate).toBe('number');
    expect(typeof report.avg_slippage_cents).toBe('number');
    expect(Array.isArray(report.trace)).toBe(true);
    expect(Array.isArray(report.mark_curve)).toBe(true);
    expect(Array.isArray(report.fills)).toBe(true);
    expect(Array.isArray(report.assumptions_warning)).toBe(true);
    expect(typeof report.generated_at).toBe('string');
  });

  it('trace has one row per snapshot tick (5 ticks → 5 trace rows)', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 'stub',
      params: { ticker: TICKER },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
    });

    expect(report.trace).toHaveLength(5);
    expect(report.mark_curve).toHaveLength(5);
  });

  it('assumptions_warning contains all 5 fidelity caveats', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 'stub',
      params: { ticker: TICKER },
    });

    expect(report.assumptions_warning).toHaveLength(5);
    expect(report.assumptions_warning[0]).toMatch(/caveat-1/);
    expect(report.assumptions_warning[4]).toMatch(/caveat-5/);
  });

  it('stub strategy produces no fills', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 'stub',
      params: { ticker: TICKER },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
    });

    expect(report.fills).toHaveLength(0);
    expect(report.fill_count).toBe(0);
    expect(report.fill_rate).toBe(0);
  });

  it('stop_loss triggers when best bid ≤ stopPriceCents and creates fills', async () => {
    // Ticks have yes bid at 50, 51, 52, 53, 54 cents.
    // stop at 52 → triggers on tick 0 (bid=50 ≤ 52)
    const report = await runBacktest({
      recordingPath,
      strategyId: 'stop_loss',
      params: {
        ticker: TICKER,
        side: 'yes',
        stopPriceCents: 52,
        size: 5,
      },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 5 },
    });

    // At least one fill should appear (stop triggered on first tick)
    expect(report.fill_count).toBeGreaterThan(0);
    expect(report.fills.length).toBeGreaterThan(0);
  });

  it('summary mirrors top-level convenience aliases', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 'stub',
      params: { ticker: TICKER },
    });

    expect(report.pnl_cents).toBe(report.summary.pnl_cents);
    expect(report.fill_count).toBe(report.summary.fill_count);
    expect(report.fill_rate).toBe(report.summary.fill_rate);
    expect(report.avg_slippage_cents).toBe(report.summary.avg_slippage_cents);
  });

  it('unknown strategyId throws', async () => {
    await expect(
      runBacktest({
        recordingPath,
        strategyId: 'nonexistent-strategy',
        params: {},
      }),
    ).rejects.toThrow(/unknown strategyId/);
  });

  it('s-aggressive resolves without throwing and returns a report', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-aggressive',
      params: {
        ticker: TICKER,
        side: 'yes',
        action: 'sell',
      },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 5 },
      fillModel: 'naive',
    });

    expect(report.strategyId).toBe('s-aggressive');
    expect(Array.isArray(report.trace)).toBe(true);
    expect(report.trace.length).toBeGreaterThan(0);
  });

  it('s-twap resolves without throwing and returns a report', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-twap',
      params: {
        ticker: TICKER,
        side: 'sell',
        numIntervals: 2,
        intervalMinutes: 1,
      },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
      fillModel: 'naive',
    });

    expect(report.strategyId).toBe('s-twap');
    expect(Array.isArray(report.trace)).toBe(true);
    expect(report.trace.length).toBeGreaterThan(0);
  });

  it('empty recording (no snapshots) returns zero trace', async () => {
    const emptyPath = path.join(dir, 'empty.ndjson');
    fs.writeFileSync(emptyPath, '', 'utf-8');

    const report = await runBacktest({
      recordingPath: emptyPath,
      strategyId: 'stub',
      params: {},
    });

    expect(report.trace).toHaveLength(0);
    expect(report.fills).toHaveLength(0);
  });
});
