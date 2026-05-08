/**
 * SH-BACKTEST-RUNTICK Phase 2 — passiveAdapter tests.
 *
 * Tests the real runOneTick-driven passiveAdapter, replacing the clone-specific
 * assertions from exitRunnerAdapter.test.ts.
 *
 * Each test uses a lightweight mock client that returns deterministic books
 * so the inner passive.runOneTick (dryRun=true) runs synchronously.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { makePassiveAdapter } from '../../src/backtest/adapters/passiveAdapter.js';
import { runBacktest } from '../../src/backtest/harness.js';
import type { SnapshotEntry } from '../../src/backtest/types.js';
import type { OrderPayload, OrderResult } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TICKER = 'KXTEST-PASSIVE2';

function makeMockClient(opts: {
  yesBid: number;
  yesAsk: number;
  /** When false, createOrder returns 'resting' so orders carry across ticks. Default true. */
  fillImmediately?: boolean;
}) {
  const orders: Array<{ payload: OrderPayload; result: OrderResult }> = [];
  const fillImm = opts.fillImmediately !== false; // default true for backward compat

  return {
    async getOrderbook(_ticker: string, _depth: number) {
      return {
        yes: [{ priceCents: opts.yesAsk, size: 200 }],
        no: [{ priceCents: 100 - opts.yesBid, size: 200 }],
      };
    },
    async createOrder(payload: OrderPayload): Promise<OrderResult> {
      const orderId = `mock-${orders.length + 1}`;
      const result: OrderResult = {
        orderId,
        status: fillImm ? 'filled' : 'resting',
        filledCount: fillImm ? payload.count : 0,
        remainingCount: fillImm ? 0 : payload.count,
      };
      orders.push({ payload, result });
      return result;
    },
    async getOrder(orderId: string): Promise<OrderResult> {
      return orders.find((o) => o.result.orderId === orderId)?.result ?? {
        orderId,
        status: 'unknown',
        filledCount: 0,
        remainingCount: 0,
      };
    },
    async cancelOrder(orderId: string): Promise<OrderResult> {
      const entry = orders.find((o) => o.result.orderId === orderId);
      if (entry) entry.result.status = 'canceled';
      return entry?.result ?? { orderId, status: 'canceled', filledCount: 0, remainingCount: 0 };
    },
    async getPosition(_ticker: string) {
      return { ticker: TICKER, side: 'yes' as const, quantity: 10 };
    },
    async getRestingOrderCount() { return 0; },
    async findOrderByClientOrderId() { return null; },
    advance() { return true; },
    currentTimestamp() { return new Date().toISOString(); },
    getFillLog() { return []; },
    getOrders() { return orders; },
  };
}

function makeSnapshot(i: number): SnapshotEntry {
  return {
    kind: 'snapshot',
    ts: `2026-05-07T10:0${i}:00.000Z`,
    ticker: TICKER,
    orderbook: {
      yes: [[70 - i, 200]],
      no: [[40, 200]],
    },
    depth_levels: 1,
  };
}

function writeTmpNdjson(dir: string, count = 6): string {
  const filePath = path.join(dir, 'passive-recording.ndjson');
  const lines = Array.from({ length: count }, (_, i) =>
    JSON.stringify(makeSnapshot(i + 1)),
  );
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
  return filePath;
}

// ---------------------------------------------------------------------------
// Unit tests — adapter directly
// ---------------------------------------------------------------------------

describe('makePassiveAdapter (runOneTick-driven)', () => {
  it('returns continue result on first tick with normal spread (resting order)', async () => {
    const adapter = makePassiveAdapter({
      ticker: TICKER,
      side: 'sell',
      walkStepCents: 1,
    });

    // fillImmediately=false: createOrder returns 'resting', so order carries across ticks.
    // runOneTickBacktest posts GTC, sees resting result → sets pendingOrderId → continue.
    const client = makeMockClient({ yesBid: 59, yesAsk: 65, fillImmediately: false });
    const decision = await adapter.tick(client as any, 10);

    expect(decision).toMatch(/passive: continue/);
  });

  it('returns empty string when remainingQty = 0', async () => {
    const adapter = makePassiveAdapter({ ticker: TICKER });
    const client = makeMockClient({ yesBid: 59, yesAsk: 65 });
    const decision = await adapter.tick(client as any, 0);
    expect(decision).toBe('');
  });

  it('reports break_loop when floor is hit after walking down', async () => {
    // minPriceCents=64, walkStepCents=1, yesAsk=65
    // First tick: iterPrice = 65-1 = 64 — at floor, dryRun fills immediately → continue
    // Second tick (remaining=0 path or we force it): adapter stops on floor_hit if we
    // set minPriceCents=65 so iterPrice=64 < 65 on first tick.
    const adapter = makePassiveAdapter({
      ticker: TICKER,
      side: 'sell',
      walkStepCents: 1,
      minPriceCents: 65, // floor above iterPrice from tick 1 (65-1=64 < 65)
    });

    const client = makeMockClient({ yesBid: 59, yesAsk: 65 });
    const decision = await adapter.tick(client as any, 10);

    // iterPrice = 65-1 = 64, but floor=65, so floor_hit
    expect(decision).toMatch(/break_loop.*floor_hit|passive: continue/);
    // Note: passive.runOneTick checks floor inside the inner walk loop.
    // With dryRun=true, it posts and marks done before the floor check is re-evaluated.
    // The floor check happens at the TOP of the inner loop before posting.
    // iterPrice=64 < effectiveFloorCents=65 → break_loop: floor_hit
    expect(decision).toMatch(/break_loop/);
  });

  it('second tick is no-op after break_loop (stopped=true)', async () => {
    const adapter = makePassiveAdapter({
      ticker: TICKER,
      side: 'sell',
      walkStepCents: 1,
      minPriceCents: 65, // triggers floor_hit on first tick
    });

    const client = makeMockClient({ yesBid: 59, yesAsk: 65 });
    await adapter.tick(client as any, 10); // tick 1 → break_loop
    const decision2 = await adapter.tick(client as any, 10); // tick 2 → stopped
    expect(decision2).toBe('');
  });

  it('accumulates state across ticks (resting order stays pending)', async () => {
    const adapter = makePassiveAdapter({
      ticker: TICKER,
      side: 'sell',
      walkStepCents: 1,
      minPriceCents: 1,
    });

    // fillImmediately=false: order rests across ticks, adapter returns continue each tick.
    const client = makeMockClient({ yesBid: 59, yesAsk: 70, fillImmediately: false });

    const d1 = await adapter.tick(client as any, 10);
    // tick1: posts GTC, resting → continue
    expect(d1).toMatch(/passive: continue/);

    // tick2: resting order still pending (getOrder returns resting) → continue
    const d2 = await adapter.tick(client as any, 10);
    expect(d2).toMatch(/passive: continue/);
  });
});

// ---------------------------------------------------------------------------
// Integration test — runBacktest with 's-passive'
// ---------------------------------------------------------------------------

describe('runBacktest s-passive (Phase 2 adapter)', () => {
  let dir: string;
  let recordingPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-passive2-bt-'));
    recordingPath = writeTmpNdjson(dir, 6);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns CounterfactualReport with populated trace', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-passive',
      params: {
        ticker: TICKER,
        side: 'sell',
        walkStepCents: 1,
        minPriceCents: 1,
      },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
      fillModel: 'naive',
    });

    expect(report.strategyId).toBe('s-passive');
    expect(Array.isArray(report.trace)).toBe(true);
    expect(report.trace.length).toBeGreaterThan(0);
    expect(Array.isArray(report.assumptions_warning)).toBe(true);
    expect(report.assumptions_warning.length).toBeGreaterThan(0);
  });

  it('trace has one row per snapshot (6 ticks → 6 trace rows)', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-passive',
      params: { ticker: TICKER, side: 'sell', walkStepCents: 1 },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
    });

    expect(report.trace).toHaveLength(6);
    expect(report.mark_curve).toHaveLength(6);
  });

  it('summary mirrors top-level convenience aliases and has >0 fills', async () => {
    // Book: yes ask walks down from 69→64 across 6 ticks; no asks stay at 40 (bid=60).
    // Sell iterPrice = yesAsk - 1. GTC rests tick N, fills on tick N+1 when ask drops to iterPrice.
    // runOneTickBacktest carries resting order across ticks → real fills accumulate.
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-passive',
      params: { ticker: TICKER, side: 'sell', walkStepCents: 1, minPriceCents: 1 },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
      fillModel: 'naive',
    });

    expect(report.pnl_cents).toBe(report.summary.pnl_cents);
    expect(report.fill_count).toBe(report.summary.fill_count);
    expect(report.fill_rate).toBe(report.summary.fill_rate);
    // Regression: runOneTickBacktest must produce real fills (not 0 like the old timebox=0 path)
    expect(report.fill_count).toBeGreaterThan(0);
  });
});
