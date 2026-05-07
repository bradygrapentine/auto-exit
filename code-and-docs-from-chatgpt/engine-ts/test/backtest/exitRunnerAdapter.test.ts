/**
 * SH-BACKTEST Phase C — ExitRunner adapter tests.
 *
 * Unit tests: verify passive adapter pricing against a mock ReplayKalshiClient.
 * Integration test: runBacktest({ strategy: 's-passive', ... }) with a minimal
 *   fixture produces a CounterfactualReport with non-zero fills and a trace.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { makePassiveAdapter } from '../../src/backtest/adapters/exitRunnerAdapter.js';
import { runBacktest } from '../../src/backtest/harness.js';
import { createReplayClient } from '../../src/backtest/replayClient.js';
import type { SnapshotEntry } from '../../src/backtest/types.js';
import type { OrderPayload, OrderResult } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TICKER = 'KXTEST-PASSIVE';

/**
 * Minimal mock ReplayKalshiClient that:
 *  - Returns a static book with a two-sided spread.
 *  - Records all createOrder calls.
 *  - Returns 'resting' for GTC orders (fills on advance).
 */
function makeMockClient(opts: {
  yesBid: number;   // best bid cents
  yesAsk: number;   // best ask cents
  fillImmediately?: boolean;
}) {
  const orders: Array<{ payload: OrderPayload; result: OrderResult }> = [];
  let fillLog: Array<{ orderId: string; filled: number; priceCents: number }> = [];
  let _advanceCount = 0;

  const client = {
    async getOrderbook(_ticker: string, _depth: number) {
      return {
        yes: [{ priceCents: opts.yesAsk, size: 200 }],
        no: [{ priceCents: 100 - opts.yesBid, size: 200 }],
      };
    },
    async createOrder(payload: OrderPayload): Promise<OrderResult> {
      const orderId = `mock-order-${orders.length + 1}`;
      const status = opts.fillImmediately ? 'filled' : 'resting';
      const filled = opts.fillImmediately ? payload.count : 0;
      const result: OrderResult = {
        orderId,
        status: status as OrderResult['status'],
        filledCount: filled,
        remainingCount: payload.count - filled,
      };
      orders.push({ payload, result });
      if (opts.fillImmediately) {
        fillLog.push({ orderId, filled, priceCents: opts.yesAsk });
      }
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
    async getRestingOrderCount(_ticker: string) { return 0; },
    async findOrderByClientOrderId(_id: string) { return null; },
    advance() {
      _advanceCount++;
      return true;
    },
    currentTimestamp() { return new Date().toISOString(); },
    getFillLog() { return []; },
    // test helpers
    getOrders() { return orders; },
  };

  return client;
}

/**
 * Make a snapshot entry for the fixture recording.
 *
 * Fill mechanics: passive adapter posts GTC sell at bestAsk - walkStep.
 * The fill simulator sweeps yes[] levels ≤ limitPrice on cursor advance.
 * So fills happen when the next tick's yes[] has a level ≤ the resting limit.
 *
 * Design: yes[] ask decreases each tick (sellers lower price).
 *   Tick 1: yes=[[69,200]], no=[[40,200]] → bestAsk=69, bestBid=60, spread=9.
 *     adapter posts sell@68 (69-1). Rests as GTC.
 *   Tick 2: yes=[[68,200]]. advance() sweeps resting@68 vs yes[]≤68 → fills@68!
 */
function makeSnapshot(i: number): SnapshotEntry {
  return {
    kind: 'snapshot',
    ts: `2026-05-07T10:0${i}:00.000Z`,
    ticker: TICKER,
    orderbook: {
      yes: [[70 - i, 200]],   // YES ask decreases each tick
      no: [[40, 200]],        // NO ask constant → implied YES bid = 60
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

describe('makePassiveAdapter', () => {
  it('places a limit sell on first tick at bestAsk − walkStep', async () => {
    const adapter = makePassiveAdapter({
      ticker: TICKER,
      side: 'sell',
      walkStepCents: 1,
    });

    const client = makeMockClient({ yesBid: 59, yesAsk: 61 });
    // Inject a fixed remainingQty
    const decision = await adapter.tick(client as any, 10);

    expect(decision).toMatch(/s-passive: placed sell/);
    // First tick: iterPrice = 61 - 1 = 60
    expect(decision).toMatch(/60/);
    expect(client.getOrders()).toHaveLength(1);
    expect(client.getOrders()[0]!.payload.count).toBe(10);
  });

  it('respects chunkSize param', async () => {
    const adapter = makePassiveAdapter({
      ticker: TICKER,
      side: 'sell',
      walkStepCents: 1,
      chunkSize: 3,
    });

    const client = makeMockClient({ yesBid: 59, yesAsk: 61 });
    await adapter.tick(client as any, 10);

    expect(client.getOrders()[0]!.payload.count).toBe(3);
  });

  it('walks down by walkStepCents on subsequent ticks', async () => {
    const adapter = makePassiveAdapter({
      ticker: TICKER,
      side: 'sell',
      walkStepCents: 2,
    });

    const client = makeMockClient({ yesBid: 59, yesAsk: 65 });

    // tick 1: iterPrice = 65 - 2 = 63
    const d1 = await adapter.tick(client as any, 10);
    expect(d1).toMatch(/63/);

    // tick 2: iterPrice = 63 - 2 = 61
    const d2 = await adapter.tick(client as any, 10);
    expect(d2).toMatch(/61/);
  });

  it('stops when floor is hit (sell)', async () => {
    const adapter = makePassiveAdapter({
      ticker: TICKER,
      side: 'sell',
      walkStepCents: 1,
      minPriceCents: 60,
    });

    const client = makeMockClient({ yesBid: 59, yesAsk: 61 });

    // tick 1: iterPrice = 61 - 1 = 60 — at floor, should still place (60 >= 60)
    const d1 = await adapter.tick(client as any, 10);
    expect(d1).toMatch(/s-passive: placed/);

    // tick 2: iterPrice = 60 - 1 = 59 — below floor
    const d2 = await adapter.tick(client as any, 10);
    expect(d2).toMatch(/floor hit/);
  });

  it('skips when no counterparty liquidity (sell, no NO-side bids)', async () => {
    const adapter = makePassiveAdapter({ ticker: TICKER, side: 'sell' });

    const emptyNoClient = {
      async getOrderbook() {
        return { yes: [{ priceCents: 60, size: 100 }], no: [] };
      },
      async createOrder(): Promise<OrderResult> {
        throw new Error('should not be called');
      },
    };

    const decision = await adapter.tick(emptyNoClient as any, 10);
    expect(decision).toMatch(/no counterparty liquidity/);
  });

  it('skips when spread < walkStepCents', async () => {
    const adapter = makePassiveAdapter({
      ticker: TICKER,
      side: 'sell',
      walkStepCents: 5,
    });

    // bid=59, ask=61, spread=2 < walkStep=5
    const client = makeMockClient({ yesBid: 59, yesAsk: 61 });
    const decision = await adapter.tick(client as any, 10);
    expect(decision).toMatch(/spread.*<.*walkStep/);
  });

  it('returns empty string when remainingQty = 0', async () => {
    const adapter = makePassiveAdapter({ ticker: TICKER });
    const client = makeMockClient({ yesBid: 59, yesAsk: 61 });
    const decision = await adapter.tick(client as any, 0);
    expect(decision).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Integration test — runBacktest with 's-passive'
// ---------------------------------------------------------------------------

describe('runBacktest s-passive integration', () => {
  let dir: string;
  let recordingPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-passive-bt-'));
    recordingPath = writeTmpNdjson(dir, 6);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns a CounterfactualReport with non-zero fills and a populated trace', async () => {
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

    // Shape
    expect(report.strategyId).toBe('s-passive');
    expect(Array.isArray(report.trace)).toBe(true);
    expect(report.trace.length).toBeGreaterThan(0);
    expect(Array.isArray(report.fills)).toBe(true);
    expect(Array.isArray(report.assumptions_warning)).toBe(true);
    expect(report.assumptions_warning.length).toBeGreaterThan(0);

    // With a 200-contract book at each tick, a sell of 10 should fill
    expect(report.fill_count).toBeGreaterThan(0);
    expect(report.fills.length).toBeGreaterThan(0);
    expect(report.fill_rate).toBeGreaterThan(0);
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

  it('summary mirrors top-level convenience aliases', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-passive',
      params: { ticker: TICKER, side: 'sell' },
    });

    expect(report.pnl_cents).toBe(report.summary.pnl_cents);
    expect(report.fill_count).toBe(report.summary.fill_count);
    expect(report.fill_rate).toBe(report.summary.fill_rate);
  });

  it('positions fully exit when book has enough depth', async () => {
    // 10 contracts, book at 200 depth per tick — should exit completely
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
    });

    // remaining should be 0 somewhere in the trace
    const anyFullExit = report.trace.some((r) => r.remaining === 0);
    expect(anyFullExit).toBe(true);
    expect(report.summary.time_to_full_exit_s).toBeGreaterThanOrEqual(0);
  });
});
