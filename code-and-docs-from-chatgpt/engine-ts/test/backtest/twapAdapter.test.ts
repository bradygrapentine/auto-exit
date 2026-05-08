/**
 * SH-BACKTEST-RUNTICK Phase 2 — twapAdapter tests.
 *
 * Verifies multi-tick state accumulation, schedule_complete break_loop,
 * and integration with runBacktest.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { makeTwapAdapter } from '../../src/backtest/adapters/twapAdapter.js';
import { runBacktest } from '../../src/backtest/harness.js';
import type { SnapshotEntry } from '../../src/backtest/types.js';
import type { OrderPayload, OrderResult } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TICKER = 'KXTEST-TWAP';

function makeMockClient(opts: { yesBid: number; yesAsk: number } = { yesBid: 59, yesAsk: 70 }) {
  const orders: Array<{ payload: OrderPayload; result: OrderResult }> = [];

  return {
    async getOrderbook(_ticker: string, _depth: number) {
      return {
        yes: [{ priceCents: opts.yesAsk, size: 500 }],
        no: [{ priceCents: 100 - opts.yesBid, size: 500 }],
      };
    },
    async createOrder(payload: OrderPayload): Promise<OrderResult> {
      const orderId = `mock-twap-${orders.length + 1}`;
      const result: OrderResult = {
        orderId,
        status: 'filled',
        filledCount: payload.count,
        remainingCount: 0,
      };
      orders.push({ payload, result });
      return result;
    },
    async getOrder(orderId: string): Promise<OrderResult> {
      return orders.find((o) => o.result.orderId === orderId)?.result ?? {
        orderId, status: 'unknown', filledCount: 0, remainingCount: 0,
      };
    },
    async cancelOrder(orderId: string): Promise<OrderResult> {
      const entry = orders.find((o) => o.result.orderId === orderId);
      if (entry) entry.result.status = 'canceled';
      return entry?.result ?? { orderId, status: 'canceled', filledCount: 0, remainingCount: 0 };
    },
    async getPosition() { return { ticker: TICKER, side: 'yes' as const, quantity: 100 }; },
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
      yes: [[70, 500]],
      no: [[40, 500]],
    },
    depth_levels: 1,
  };
}

function writeTmpNdjson(dir: string, count = 6): string {
  const filePath = path.join(dir, 'twap-recording.ndjson');
  const lines = Array.from({ length: count }, (_, i) =>
    JSON.stringify(makeSnapshot(i + 1)),
  );
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
  return filePath;
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('makeTwapAdapter', () => {
  it('ticks once and advances interval index', async () => {
    const adapter = makeTwapAdapter({
      ticker: TICKER,
      side: 'sell',
      numIntervals: 3,
      intervalMinutes: 1,
    });

    const client = makeMockClient();
    const d1 = await adapter.tick(client as any, 100);

    // After first interval fires, we should see an interval result
    expect(d1).toMatch(/twap:/);
    expect(d1).not.toBe('');
  });

  it('returns empty string when remainingQty = 0', async () => {
    const adapter = makeTwapAdapter({ ticker: TICKER });
    const client = makeMockClient();
    const decision = await adapter.tick(client as any, 0);
    expect(decision).toBe('');
  });

  it('accumulates intervals across ticks and eventually returns break_loop:schedule_complete', async () => {
    const adapter = makeTwapAdapter({
      ticker: TICKER,
      side: 'sell',
      numIntervals: 2, // only 2 intervals → completes after 2 ticks
      intervalMinutes: 1,
    });

    const client = makeMockClient();
    const d1 = await adapter.tick(client as any, 100);
    const d2 = await adapter.tick(client as any, 100);

    // After 2 ticks on a 2-interval TWAP, schedule_complete
    expect(d1).not.toBe('');
    expect(d2).toMatch(/break_loop.*schedule_complete/);
  });

  it('no-ops after schedule_complete (stopped=true)', async () => {
    const adapter = makeTwapAdapter({
      ticker: TICKER,
      side: 'sell',
      numIntervals: 2,
      intervalMinutes: 1,
    });

    const client = makeMockClient();
    await adapter.tick(client as any, 100); // interval 0
    await adapter.tick(client as any, 100); // interval 1 → schedule_complete
    const d3 = await adapter.tick(client as any, 100); // should be no-op
    expect(d3).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Integration test
// ---------------------------------------------------------------------------

describe('runBacktest s-twap', () => {
  let dir: string;
  let recordingPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-twap-bt-'));
    recordingPath = writeTmpNdjson(dir, 6);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('resolves s-twap without throwing and returns a report', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-twap',
      params: {
        ticker: TICKER,
        side: 'sell',
        numIntervals: 3,
        intervalMinutes: 1,
      },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 100 },
      fillModel: 'naive',
    });

    expect(report.strategyId).toBe('s-twap');
    expect(Array.isArray(report.trace)).toBe(true);
    expect(report.trace.length).toBeGreaterThan(0);
  });

  it('trace has one row per snapshot tick (6 ticks)', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-twap',
      params: {
        ticker: TICKER,
        side: 'sell',
        numIntervals: 2,
        intervalMinutes: 1,
      },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 100 },
    });

    expect(report.trace).toHaveLength(6);
  });
});
