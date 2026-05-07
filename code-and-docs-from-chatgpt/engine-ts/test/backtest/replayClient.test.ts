/**
 * SH-BACKTEST Phase B1 — replay client tests.
 *
 * Tests: cursor advance terminates, getOrderbook returns correct snapshot,
 * placeOrder + getPositions reflects simulated fill, multiple fills accumulate
 * position, cancelOrder removes from resting state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createReplayClient } from '../../src/backtest/replayClient.js';
import type { RecordingEntry, SnapshotEntry } from '../../src/backtest/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSnapshot(
  ts: string,
  ticker: string,
  askCents: number,
  askQty: number,
): SnapshotEntry {
  return {
    kind: 'snapshot',
    ts,
    ticker,
    orderbook: {
      yes: [[askCents, askQty]],
      no: [[100 - askCents, askQty]],
    },
    depth_levels: 1,
  };
}

const TICKER = 'KXTEST-REPLAY';

function baseEntries(count = 3): RecordingEntry[] {
  return Array.from({ length: count }, (_, i) =>
    makeSnapshot(
      `2026-05-07T10:0${i}:00.000Z`,
      TICKER,
      50 + i,
      100,
    ),
  );
}

// Minimal order payload helpers
function limitBuyOrder(
  priceCents: number,
  size: number,
  tif: 'immediate_or_cancel' | 'fill_or_kill' | 'good_till_canceled' = 'immediate_or_cancel',
) {
  return {
    ticker: TICKER,
    action: 'buy' as const,
    side: 'yes' as const,
    count: size,
    type: 'limit' as const,
    yes_price: priceCents,
    reduce_only: false,
    time_in_force: tif,
    client_order_id: `test-${Date.now()}-${Math.random()}`,
  };
}

function limitSellOrder(
  priceCents: number,
  size: number,
  tif: 'immediate_or_cancel' | 'fill_or_kill' | 'good_till_canceled' = 'immediate_or_cancel',
) {
  return {
    ticker: TICKER,
    action: 'sell' as const,
    side: 'yes' as const,
    count: size,
    type: 'limit' as const,
    yes_price: priceCents,
    reduce_only: false,
    time_in_force: tif,
    client_order_id: `test-${Date.now()}-${Math.random()}`,
  };
}

// ---------------------------------------------------------------------------
// Cursor tests
// ---------------------------------------------------------------------------

describe('ReplayKalshiClient — cursor', () => {
  it('advance() returns true for each snapshot entry', () => {
    const client = createReplayClient({ entries: baseEntries(3) });
    expect(client.advance()).toBe(true);
    expect(client.advance()).toBe(true);
    expect(client.advance()).toBe(true);
  });

  it('advance() returns false at end of recording', () => {
    const client = createReplayClient({ entries: baseEntries(2) });
    expect(client.advance()).toBe(true);
    expect(client.advance()).toBe(true);
    expect(client.advance()).toBe(false); // no more snapshots
    expect(client.advance()).toBe(false); // remains false
  });

  it('currentTimestamp() returns empty string before first advance', () => {
    const client = createReplayClient({ entries: baseEntries(1) });
    expect(client.currentTimestamp()).toBe('');
  });

  it('currentTimestamp() returns ts of current snapshot after advance', () => {
    const client = createReplayClient({ entries: baseEntries(3) });
    client.advance();
    expect(client.currentTimestamp()).toBe('2026-05-07T10:00:00.000Z');
    client.advance();
    expect(client.currentTimestamp()).toBe('2026-05-07T10:01:00.000Z');
  });

  it('empty recording: advance() returns false immediately', () => {
    const client = createReplayClient({ entries: [] });
    expect(client.advance()).toBe(false);
    expect(client.currentTimestamp()).toBe('');
  });
});

// ---------------------------------------------------------------------------
// getOrderbook tests
// ---------------------------------------------------------------------------

describe('ReplayKalshiClient — getOrderbook', () => {
  it('throws when called before advance()', async () => {
    const client = createReplayClient({ entries: baseEntries(1) });
    await expect(client.getOrderbook(TICKER, 10)).rejects.toThrow('cursor');
  });

  it('returns current snapshot orderbook at cursor', async () => {
    const client = createReplayClient({ entries: baseEntries(3) });
    client.advance(); // ts=10:00, ask=50
    const ob = await client.getOrderbook(TICKER, 10);
    expect(ob.yes[0]!.priceCents).toBe(50);
    expect(ob.yes[0]!.size).toBe(100);
  });

  it('advances reflect new snapshot', async () => {
    const client = createReplayClient({ entries: baseEntries(3) });
    client.advance(); // ts=10:00, ask=50
    client.advance(); // ts=10:01, ask=51
    const ob = await client.getOrderbook(TICKER, 10);
    expect(ob.yes[0]!.priceCents).toBe(51);
  });

  it('depth parameter truncates levels', async () => {
    const entries: RecordingEntry[] = [
      {
        kind: 'snapshot',
        ts: '2026-05-07T10:00:00.000Z',
        ticker: TICKER,
        orderbook: {
          yes: [
            [50, 100],
            [51, 200],
            [52, 300],
          ],
          no: [],
        },
        depth_levels: 3,
      },
    ];
    const client = createReplayClient({ entries });
    client.advance();
    const ob = await client.getOrderbook(TICKER, 2);
    expect(ob.yes).toHaveLength(2);
  });

  it('returns empty book for unmatched ticker', async () => {
    const client = createReplayClient({ entries: baseEntries(1) });
    client.advance();
    const ob = await client.getOrderbook('DIFFERENT-TICKER', 10);
    expect(ob.yes).toHaveLength(0);
    expect(ob.no).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// placeOrder + getPosition tests
// ---------------------------------------------------------------------------

describe('ReplayKalshiClient — placeOrder + getPosition', () => {
  it('placeOrder fills against current snapshot and updates position', async () => {
    const client = createReplayClient({
      entries: baseEntries(1),
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 0 },
    });
    client.advance(); // ask=50, qty=100

    const result = await client.createOrder(limitBuyOrder(50, 20));
    expect(result.filledCount).toBe(20);
    expect(result.remainingCount).toBe(0);
    expect(result.status).toBe('filled');

    const pos = await client.getPosition(TICKER);
    expect(pos.quantity).toBe(20);
    expect(pos.side).toBe('yes');
  });

  it('multiple buys accumulate position', async () => {
    const client = createReplayClient({
      entries: baseEntries(3),
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 0 },
    });

    client.advance();
    await client.createOrder(limitBuyOrder(50, 10));
    client.advance();
    await client.createOrder(limitBuyOrder(51, 15));

    const pos = await client.getPosition(TICKER);
    expect(pos.quantity).toBe(25);
  });

  it('sell reduces position', async () => {
    const client = createReplayClient({
      entries: baseEntries(3),
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 50 },
    });

    client.advance();
    await client.createOrder(limitSellOrder(50, 20));

    const pos = await client.getPosition(TICKER);
    expect(pos.quantity).toBe(30);
  });

  it('initial position is respected', async () => {
    const client = createReplayClient({
      entries: baseEntries(1),
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 100 },
    });
    client.advance();
    const pos = await client.getPosition(TICKER);
    expect(pos.quantity).toBe(100);
  });

  it('fill log accumulates across multiple orders', async () => {
    const client = createReplayClient({ entries: baseEntries(3) });
    client.advance();
    await client.createOrder(limitBuyOrder(50, 5));
    client.advance();
    await client.createOrder(limitBuyOrder(51, 8));

    const log = client.getFillLog();
    expect(log).toHaveLength(2);
    expect(log[0]!.filled).toBe(5);
    expect(log[1]!.filled).toBe(8);
  });

  it('unfilled IOC order leaves fill log empty', async () => {
    const client = createReplayClient({ entries: baseEntries(1) });
    client.advance(); // ask=50

    const result = await client.createOrder(limitBuyOrder(40, 20)); // limit below ask
    expect(result.filledCount).toBe(0);
    expect(result.status).toBe('canceled');

    const log = client.getFillLog();
    expect(log).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// GTC resting order tests
// ---------------------------------------------------------------------------

describe('ReplayKalshiClient — GTC resting orders', () => {
  it('GTC order fills on next tick when book improves', async () => {
    // Snapshot 0: ask=55 (limit 50 won't fill)
    // Snapshot 1: ask=50 (limit 50 fills)
    const entries: RecordingEntry[] = [
      {
        kind: 'snapshot',
        ts: '2026-05-07T10:00:00.000Z',
        ticker: TICKER,
        orderbook: { yes: [[55, 100]], no: [] },
        depth_levels: 1,
      },
      {
        kind: 'snapshot',
        ts: '2026-05-07T10:01:00.000Z',
        ticker: TICKER,
        orderbook: { yes: [[50, 100]], no: [] },
        depth_levels: 1,
      },
    ];

    const client = createReplayClient({ entries });
    client.advance(); // tick 0: ask=55

    const result = await client.createOrder(limitBuyOrder(50, 20, 'good_till_canceled'));
    // At tick 0, ask=55 > limit=50, so no immediate fill
    expect(result.filledCount).toBe(0);
    expect(result.status).toBe('resting');

    client.advance(); // tick 1: ask=50, resting order fills
    const updatedResult = await client.getOrder(result.orderId);
    expect(updatedResult.filledCount).toBe(20);
    expect(updatedResult.status).toBe('filled');

    const pos = await client.getPosition(TICKER);
    expect(pos.quantity).toBe(20);
  });

  it('getRestingOrderCount reflects active GTC orders', async () => {
    const entries: RecordingEntry[] = [
      {
        kind: 'snapshot',
        ts: '2026-05-07T10:00:00.000Z',
        ticker: TICKER,
        orderbook: { yes: [[55, 100]], no: [] }, // ask above limit
        depth_levels: 1,
      },
    ];
    const client = createReplayClient({ entries });
    client.advance();

    await client.createOrder(limitBuyOrder(50, 20, 'good_till_canceled'));
    expect(await client.getRestingOrderCount(TICKER)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// cancelOrder tests
// ---------------------------------------------------------------------------

describe('ReplayKalshiClient — cancelOrder', () => {
  it('cancelOrder removes order from resting state', async () => {
    const entries: RecordingEntry[] = [
      {
        kind: 'snapshot',
        ts: '2026-05-07T10:00:00.000Z',
        ticker: TICKER,
        orderbook: { yes: [[55, 100]], no: [] }, // ask above limit
        depth_levels: 1,
      },
      {
        kind: 'snapshot',
        ts: '2026-05-07T10:01:00.000Z',
        ticker: TICKER,
        orderbook: { yes: [[50, 100]], no: [] }, // ask improves
        depth_levels: 1,
      },
    ];

    const client = createReplayClient({ entries });
    client.advance(); // tick 0

    const result = await client.createOrder(limitBuyOrder(50, 20, 'good_till_canceled'));
    expect(result.status).toBe('resting');

    await client.cancelOrder(result.orderId);
    expect(await client.getRestingOrderCount(TICKER)).toBe(0);

    client.advance(); // tick 1 — would have filled, but cancelled
    const pos = await client.getPosition(TICKER);
    expect(pos.quantity).toBe(0); // no fill happened
  });

  it('cancelOrder returns canceled status', async () => {
    const entries: RecordingEntry[] = [
      {
        kind: 'snapshot',
        ts: '2026-05-07T10:00:00.000Z',
        ticker: TICKER,
        orderbook: { yes: [[55, 100]], no: [] },
        depth_levels: 1,
      },
    ];
    const client = createReplayClient({ entries });
    client.advance();

    const placed = await client.createOrder(limitBuyOrder(50, 10, 'good_till_canceled'));
    const canceled = await client.cancelOrder(placed.orderId);
    expect(canceled.status).toBe('canceled');
  });

  it('canceling non-existent order returns canceled status gracefully', async () => {
    const client = createReplayClient({ entries: baseEntries(1) });
    client.advance();
    const result = await client.cancelOrder('nonexistent-order-id');
    expect(result.status).toBe('canceled');
  });
});

// ---------------------------------------------------------------------------
// findOrderByClientOrderId tests
// ---------------------------------------------------------------------------

describe('ReplayKalshiClient — findOrderByClientOrderId', () => {
  it('returns order result by client order id', async () => {
    const client = createReplayClient({ entries: baseEntries(1) });
    client.advance();

    const payload = limitBuyOrder(50, 10);
    const result = await client.createOrder(payload);

    const found = await client.findOrderByClientOrderId(payload.client_order_id);
    expect(found).not.toBeNull();
    expect(found!.orderId).toBe(result.orderId);
  });

  it('returns null for unknown client order id', async () => {
    const client = createReplayClient({ entries: baseEntries(1) });
    client.advance();

    const found = await client.findOrderByClientOrderId('unknown-coid');
    expect(found).toBeNull();
  });
});
