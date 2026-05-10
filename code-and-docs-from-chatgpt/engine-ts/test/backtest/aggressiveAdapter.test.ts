/**
 * SH-BACKTEST-RUNTICK Phase 2 — aggressiveAdapter tests.
 *
 * Verifies single-shot semantics, break_loop propagation, and
 * integration with runBacktest.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { makeAggressiveAdapter } from '../../src/backtest/adapters/aggressiveAdapter.js';
import { runBacktest } from '../../src/backtest/harness.js';
import type { SnapshotEntry } from '../../src/backtest/types.js';
import type { OrderPayload, OrderResult } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TICKER = 'KXTEST-AGG';

function makeMockClient(opts: {
  yesBid: number;
  yesAsk: number;
  fillAll?: boolean;
}) {
  const orders: Array<{ payload: OrderPayload; result: OrderResult }> = [];

  return {
    async getOrderbook(_ticker: string, _depth: number) {
      return {
        yes: [{ priceCents: opts.yesAsk, size: 200 }],
        no: [{ priceCents: 100 - opts.yesBid, size: 200 }],
      };
    },
    async createOrder(payload: OrderPayload): Promise<OrderResult> {
      const orderId = `mock-agg-${orders.length + 1}`;
      const filled = opts.fillAll !== false ? payload.count : 0;
      const result: OrderResult = {
        orderId,
        status: filled > 0 ? 'filled' : 'resting',
        filledCount: filled,
        remainingCount: payload.count - filled,
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

function makeEmptyBookClient() {
  return {
    async getOrderbook() {
      return { yes: [], no: [] };
    },
    async createOrder(): Promise<OrderResult> {
      throw new Error('should not be called on empty book');
    },
    async getOrder(orderId: string): Promise<OrderResult> {
      return { orderId, status: 'unknown', filledCount: 0, remainingCount: 0 };
    },
    async cancelOrder(orderId: string): Promise<OrderResult> {
      return { orderId, status: 'canceled', filledCount: 0, remainingCount: 0 };
    },
    async getPosition() { return { ticker: TICKER, side: 'yes' as const, quantity: 10 }; },
    async getRestingOrderCount() { return 0; },
    async findOrderByClientOrderId() { return null; },
    advance() { return true; },
    currentTimestamp() { return new Date().toISOString(); },
    getFillLog() { return []; },
  };
}

function makeSnapshot(i: number): SnapshotEntry {
  return {
    kind: 'snapshot',
    ts: `2026-05-07T10:0${i}:00.000Z`,
    ticker: TICKER,
    orderbook: {
      yes: [[60, 200]],
      no: [[40, 200]],
    },
    depth_levels: 1,
  };
}

function writeTmpNdjson(dir: string, count = 4): string {
  const filePath = path.join(dir, 'aggressive-recording.ndjson');
  const lines = Array.from({ length: count }, (_, i) =>
    JSON.stringify(makeSnapshot(i + 1)),
  );
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
  return filePath;
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('makeAggressiveAdapter', () => {
  it('returns done result with filled count on first tick', async () => {
    const adapter = makeAggressiveAdapter({
      ticker: TICKER,
      side: 'yes',
      action: 'sell',
    });

    const client = makeMockClient({ yesBid: 60, yesAsk: 70 });
    const decision = await adapter.tick(client as any, 10);

    expect(decision).toMatch(/aggressive: done/);
    expect(decision).toMatch(/filled=10/);
  });

  it('is single-shot — second tick returns empty string', async () => {
    const adapter = makeAggressiveAdapter({
      ticker: TICKER,
      side: 'yes',
      action: 'sell',
    });

    const client = makeMockClient({ yesBid: 60, yesAsk: 70 });
    await adapter.tick(client as any, 10); // tick 1 → done
    const d2 = await adapter.tick(client as any, 10); // tick 2 → no-op
    expect(d2).toBe('');
  });

  it('propagates break_loop when yes book is empty', async () => {
    const adapter = makeAggressiveAdapter({
      ticker: TICKER,
      side: 'yes',
      action: 'sell',
    });

    const decision = await adapter.tick(makeEmptyBookClient() as any, 10);
    expect(decision).toMatch(/break_loop.*empty_yes_book/);
  });

  it('returns empty string when remainingQty = 0', async () => {
    const adapter = makeAggressiveAdapter({ ticker: TICKER });
    const client = makeMockClient({ yesBid: 60, yesAsk: 70 });
    const decision = await adapter.tick(client as any, 0);
    expect(decision).toBe('');
  });

  // SH-AGGRESSIVE-PARTIAL-SIZE
  it('respects params.size when smaller than remainingQty (partial harvest)', async () => {
    const adapter = makeAggressiveAdapter({
      ticker: TICKER,
      side: 'yes',
      action: 'sell',
      size: 3,                  // smaller than remainingQty=10
    });
    const client = makeMockClient({ yesBid: 60, yesAsk: 70 });
    const decision = await adapter.tick(client as any, 10);
    expect(decision).toMatch(/filled=3/);
  });

  it('caps params.size to remainingQty when larger', async () => {
    const adapter = makeAggressiveAdapter({
      ticker: TICKER,
      side: 'yes',
      action: 'sell',
      size: 100,                // larger than remainingQty=10
    });
    const client = makeMockClient({ yesBid: 60, yesAsk: 70 });
    const decision = await adapter.tick(client as any, 10);
    expect(decision).toMatch(/filled=10/);
  });

  it('falls back to remainingQty when params.size is absent (legacy behavior)', async () => {
    const adapter = makeAggressiveAdapter({
      ticker: TICKER,
      side: 'yes',
      action: 'sell',
      // no size
    });
    const client = makeMockClient({ yesBid: 60, yesAsk: 70 });
    const decision = await adapter.tick(client as any, 10);
    expect(decision).toMatch(/filled=10/);
  });
});

// ---------------------------------------------------------------------------
// Integration test
// ---------------------------------------------------------------------------

describe('runBacktest s-aggressive', () => {
  let dir: string;
  let recordingPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-agg-bt-'));
    recordingPath = writeTmpNdjson(dir, 4);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('resolves s-aggressive without throwing and returns a report', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-aggressive',
      params: {
        ticker: TICKER,
        side: 'yes',
        action: 'sell',
      },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
      fillModel: 'naive',
    });

    expect(report.strategyId).toBe('s-aggressive');
    expect(Array.isArray(report.trace)).toBe(true);
    expect(report.trace.length).toBeGreaterThan(0);
  });

  it('fills happen on first tick only (aggressive single-shot)', async () => {
    const report = await runBacktest({
      recordingPath,
      strategyId: 's-aggressive',
      params: {
        ticker: TICKER,
        side: 'yes',
        action: 'sell',
      },
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 10 },
      fillModel: 'naive',
    });

    // All fills should happen at the first tick timestamp
    if (report.fills.length > 0) {
      const firstTickTs = report.trace[0]?.ts;
      for (const fill of report.fills) {
        expect(fill.ts).toBe(firstTickTs);
      }
    }
  });
});
