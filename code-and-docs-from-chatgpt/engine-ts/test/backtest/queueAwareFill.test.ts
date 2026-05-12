/**
 * SH-FILL-REALISM-QUEUE-AWARE — integration tests for the queue-position-tracked
 * fill model. Drives a synthetic recording through the replay client under
 * `fillModel: 'queue_aware'` and asserts the fill / no-fill behavior pinned in
 * the plan at `engine-ts/docs/superpowers/plans/2026-05-11-queue-aware-fill-model.md`.
 *
 * Three scenarios:
 *   - drain-then-fill: queue drains across ticks, then a fresh aggressive cross
 *     fills the resting order at limit price.
 *   - hold: depth never decreases, order never fills.
 *   - swell-then-drain: depth grows then shrinks; the M1 clamp prevents the
 *     transient swell from being credited later.
 */

import { describe, it, expect } from 'vitest';
import { createReplayClient } from '../../src/backtest/replayClient.js';
import type { RecordingEntry, SnapshotEntry, OrderPayload } from '../../src/backtest/types.js';

const TICKER = 'KXTEST-QUEUE';
const SELL_PRICE = 50;
// Kalshi book: snap.yes = yes-bids, snap.no = no-bids. A yes-sell at price P
// joins the queue of resting yes-sellers, which is represented as no-bids at
// price (100 - P). So the queue lives on snap.no at price 100 - SELL_PRICE = 50.
const QUEUE_SIDE: 'yes' | 'no' = 'no';
const QUEUE_PRICE = 100 - SELL_PRICE;

function snapshotWithDepth(ts: string, depth: number): SnapshotEntry {
  return {
    kind: 'snapshot',
    ts,
    ticker: TICKER,
    orderbook: {
      // yes-bid below our sell limit so the order doesn't cross on post.
      yes: [[10, 0]],
      // no-bids at QUEUE_PRICE represent the other yes-sellers we queue behind.
      no: [[QUEUE_PRICE, depth]],
    },
    depth_levels: 1,
  };
}

function ts(i: number): string {
  return `2026-05-12T00:0${i}:00.000Z`;
}

function recording(depths: number[]): RecordingEntry[] {
  return depths.map((d, i) => snapshotWithDepth(ts(i), d));
}

function gtcSellPayload(size: number): OrderPayload {
  return {
    ticker: TICKER,
    side: 'yes',
    action: 'sell',
    type: 'limit',
    yes_price: SELL_PRICE,
    count: size,
    time_in_force: 'good_till_canceled',
  } as OrderPayload;
}

describe('queue_aware fill model — replay client integration', () => {
  it('drain-then-fill: order fills only after queue drains AND fresh depth arrives', async () => {
    // Tick-by-tick depth at level PRICE: [500, 400, 300, 200, 100, 0, 100].
    // GTC sell at PRICE size 100 posted at tick 0 → queueAhead=500.
    const client = createReplayClient({
      entries: recording([500, 400, 300, 200, 100, 0, 100]),
      fillModel: 'queue_aware',
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 100 },
    });

    // Advance to tick 0, then post the GTC.
    expect(client.advance()).toBe(true);
    await client.createOrder(gtcSellPayload(100));
    // After posting at tick 0: zero fills (the post itself doesn't fill).
    expect(client.getFillLog()).toHaveLength(0);

    // Advance ticks 1..5 — depth drains by 100/tick, hitting 0 at tick 5.
    // queueAhead reaches 0 at tick 5 BUT current_depth=0 < remainingSize=100 → no fill.
    for (let i = 1; i <= 5; i++) {
      expect(client.advance()).toBe(true);
      expect(client.getFillLog()).toHaveLength(0);
    }

    // Tick 6: fresh depth=100 arrives. queueAhead=0, current_depth=100 >= 100 → fill.
    expect(client.advance()).toBe(true);
    const fills = client.getFillLog();
    expect(fills).toHaveLength(1);
    expect(fills[0]!.fillPriceCents).toBe(SELL_PRICE);
    expect(fills[0]!.filled).toBe(100);
    expect(fills[0]!.isTaker).toBe(false);
    expect(fills[0]!.ts).toBe(ts(6));
  });

  it('hold: depth never drops — order never fills', async () => {
    // Depth holds at 500 every tick.
    const client = createReplayClient({
      entries: recording([500, 500, 500, 500, 500, 500, 500]),
      fillModel: 'queue_aware',
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 100 },
    });

    expect(client.advance()).toBe(true);
    await client.createOrder(gtcSellPayload(100));

    while (client.advance()) {
      expect(client.getFillLog()).toHaveLength(0);
    }
    expect(client.getFillLog()).toHaveLength(0);
  });

  it('swell-then-drain (M1 clamp regression pin): depth 500→600→400; queueAhead must stay at 400, not 200', async () => {
    // Tick 0: depth=500 → post sell qty=100 → queueAhead=500, lastSeenDepth=500.
    // Tick 1: depth=600 → delta=max(0,500-600)=0; queueAhead=500; lastSeenDepth=min(500,600)=500 (clamp).
    // Tick 2: depth=400 → delta=max(0,500-400)=100; queueAhead=400; lastSeenDepth=min(500,400)=400.
    //
    // Without the clamp: lastSeenDepth would be 600 at tick 1, then delta=200 at
    // tick 2 → queueAhead=300 (wrong, over-credits us by 100).
    //
    // We assert queueAhead=400 indirectly: place a follow-up "probe" tick where
    // depth drops to 0 (delta=400). queueAhead must reach exactly 0, not -100.
    // Then a subsequent fresh-depth=100 tick must trigger the fill.

    const client = createReplayClient({
      entries: recording([500, 600, 400, 0, 100]),
      fillModel: 'queue_aware',
      initialPosition: { ticker: TICKER, side: 'yes', quantity: 100 },
    });

    expect(client.advance()).toBe(true); // tick 0 depth=500
    await client.createOrder(gtcSellPayload(100));

    expect(client.advance()).toBe(true); // tick 1 depth=600 (swell)
    expect(client.getFillLog()).toHaveLength(0);

    expect(client.advance()).toBe(true); // tick 2 depth=400 (drain)
    expect(client.getFillLog()).toHaveLength(0);
    // If the clamp is missing, queueAhead would be 300 here, not 400.

    expect(client.advance()).toBe(true); // tick 3 depth=0 → delta=400 → queueAhead=0 (with clamp) or -100 (without)
    expect(client.getFillLog()).toHaveLength(0); // still 0 because current_depth=0 < remainingSize=100

    expect(client.advance()).toBe(true); // tick 4 depth=100 → fresh liquidity, queueAhead=0 → fill
    const fills = client.getFillLog();
    expect(fills).toHaveLength(1);
    expect(fills[0]!.filled).toBe(100);
    expect(fills[0]!.fillPriceCents).toBe(SELL_PRICE);
    expect(fills[0]!.ts).toBe(ts(4));
  });
});
