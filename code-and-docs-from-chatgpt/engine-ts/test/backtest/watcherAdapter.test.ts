/**
 * SH-BACKTEST-PHASE-D — makeWatcherAdapter unit tests.
 *
 * Tests:
 *   1. Continue while not fired — book above trigger, no order placed.
 *   2. Fires when condition met — book below trigger, createOrder called once.
 *   3. Subsequent ticks no-op — after firing, tick returns '' regardless of book.
 */

import { describe, it, expect, vi } from 'vitest';
import { makeWatcherAdapter } from '../../src/backtest/adapters/watcherAdapter.js';
import type { RegisterArgs } from '../../src/synthetics/types.js';
import type { OrderPayload, OrderResult } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TICKER = 'KXTEST-WATCHER';

function makeStubClient(opts: {
  yesBid: number;
  positionQty?: number;
}) {
  const orders: OrderPayload[] = [];

  return {
    async getOrderbook(_ticker: string, _depth: number) {
      return {
        yes: [{ priceCents: opts.yesBid, size: 100 }],
        no: [{ priceCents: 100 - opts.yesBid, size: 100 }],
      };
    },
    async getPosition(_ticker: string) {
      return {
        ticker: TICKER,
        side: 'yes' as const,
        quantity: opts.positionQty ?? 10,
      };
    },
    async createOrder(payload: OrderPayload): Promise<OrderResult> {
      orders.push(payload);
      return {
        orderId: `mock-watcher-${orders.length}`,
        status: 'filled',
        filledCount: payload.count,
        remainingCount: 0,
      };
    },
    async cancelOrder(orderId: string): Promise<OrderResult> {
      return { orderId, status: 'canceled', filledCount: 0, remainingCount: 0 };
    },
    async getOrder(orderId: string): Promise<OrderResult> {
      return { orderId, status: 'unknown', filledCount: 0, remainingCount: 0 };
    },
    async getRestingOrderCount() { return 0; },
    async findOrderByClientOrderId() { return null; },
    advance() { return true; },
    currentTimestamp() { return new Date().toISOString(); },
    getFillLog() { return []; },
    getOrders() { return orders; },
    getOrderPayloads() { return orders; },
  };
}

/**
 * buildArgs factory: registers a stop_loss synthetic with the given triggerPriceCents.
 */
function makeStopLossBuilder(triggerPriceCents: number): (params: Record<string, unknown>) => RegisterArgs {
  return (_params) => ({
    kind: 'stop_loss',
    ticker: TICKER,
    side: 'yes',
    positionSize: 10,
    params: { triggerPriceCents },
    autoCancelOnZeroPosition: false,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('makeWatcherAdapter', () => {
  it('returns continue string when trigger not met (book above stop)', async () => {
    // stop_loss fires when topBid <= triggerPriceCents
    // Book yesBid=60, triggerPriceCents=10 → 60 > 10 → no fire
    const adapter = makeWatcherAdapter(makeStopLossBuilder(10), {});
    const client = makeStubClient({ yesBid: 60 });

    const result = await adapter.tick(client as any, 10);

    expect(result).toMatch(/watcher: continue/);
    expect(client.getOrderPayloads()).toHaveLength(0);
  });

  it('fires and calls createOrder when trigger is met (book below stop)', async () => {
    // stop_loss fires when topBid <= triggerPriceCents
    // Book yesBid=25, triggerPriceCents=30 → 25 <= 30 → fires
    const adapter = makeWatcherAdapter(makeStopLossBuilder(30), {});
    const client = makeStubClient({ yesBid: 25 });

    const result = await adapter.tick(client as any, 10);

    expect(result).toMatch(/watcher: fired/);
    const orders = client.getOrderPayloads();
    expect(orders).toHaveLength(1);
    expect(orders[0]!.action).toBe('sell');
    expect(orders[0]!.ticker).toBe(TICKER);
    expect(orders[0]!.count).toBe(10);
  });

  it('subsequent ticks return empty string after firing', async () => {
    // After firing, all subsequent ticks must be no-ops
    const adapter = makeWatcherAdapter(makeStopLossBuilder(30), {});
    const client = makeStubClient({ yesBid: 25 });

    const first = await adapter.tick(client as any, 10);
    expect(first).toMatch(/watcher: fired/);

    // Second tick — regardless of book state
    const second = await adapter.tick(client as any, 10);
    expect(second).toBe('');

    // Third tick too
    const third = await adapter.tick(client as any, 10);
    expect(third).toBe('');

    // createOrder was called exactly once
    expect(client.getOrderPayloads()).toHaveLength(1);
  });

  it('returns empty string immediately when remainingQty = 0', async () => {
    const adapter = makeWatcherAdapter(makeStopLossBuilder(30), {});
    const client = makeStubClient({ yesBid: 25 });

    const result = await adapter.tick(client as any, 0);
    expect(result).toBe('');
    expect(client.getOrderPayloads()).toHaveLength(0);
  });
});
