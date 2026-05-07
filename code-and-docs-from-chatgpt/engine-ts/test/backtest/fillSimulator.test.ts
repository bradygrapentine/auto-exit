/**
 * SH-BACKTEST Phase B1 — fill simulator tests.
 *
 * Tests: naive limit instant-fill at touch, partial fill, market sweep across
 * levels, FOK rejects when depth insufficient, IOC partial+cancel,
 * queue_aware returns no-fill stub.
 */

import { describe, it, expect } from 'vitest';
import { simulateFill, type SnapshotOrderbook, type SimOrder } from '../../src/backtest/fillSimulator.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Build a simple orderbook with a yes-side ask at `askCents` with `askQty`.
 * Optionally add a second level.
 */
function book(
  askCents: number,
  askQty: number,
  ask2?: { priceCents: number; qty: number },
): SnapshotOrderbook {
  const yes: Array<[number, number]> = [[askCents, askQty]];
  if (ask2) yes.push([ask2.priceCents, ask2.qty]);
  return { yes, no: [] };
}

const IOC = 'immediate_or_cancel' as const;
const FOK = 'fill_or_kill' as const;
const GTC = 'good_till_canceled' as const;

// ---------------------------------------------------------------------------
// naive model
// ---------------------------------------------------------------------------

describe('simulateFill — naive model', () => {
  it('limit at touch fills instantly up to displayed size', () => {
    const snap = book(50, 100); // yes ask at 50¢, 100 qty
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 50,
      limitPriceCents: 50,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(50);
    expect(result.remaining).toBe(0);
    expect(result.fillPriceCents).toBe(50);
    expect(result.isTaker).toBe(true);
    expect(result.feesCents).toBeGreaterThan(0);
  });

  it('limit above touch fills at displayed price (not limit price)', () => {
    const snap = book(50, 100);
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 20,
      limitPriceCents: 60, // willing to pay up to 60, but ask is 50
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(20);
    expect(result.fillPriceCents).toBe(50); // fills at ask, not limit
  });

  it('partial fill when order size > displayed depth', () => {
    const snap = book(50, 30); // only 30 available
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 100,
      limitPriceCents: 50,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(30);
    expect(result.remaining).toBe(70);
    expect(result.isTaker).toBe(true);
  });

  it('limit below touch does not fill', () => {
    const snap = book(55, 100); // ask is 55
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 50,
      limitPriceCents: 50, // willing to pay only 50, below ask
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(0);
    expect(result.remaining).toBe(50);
    expect(result.isTaker).toBe(false);
  });

  it('market order sweeps across multiple levels', () => {
    const snap: SnapshotOrderbook = {
      yes: [
        [50, 40],
        [52, 60],
        [55, 30],
      ],
      no: [],
    };
    const order: SimOrder = {
      side: 'yes',
      type: 'market',
      size: 90,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(90); // 40 + 50
    expect(result.remaining).toBe(0);
    // weighted avg: (40*50 + 50*52) / 90 = (2000 + 2600) / 90 = 4600/90 ≈ 51
    expect(result.fillPriceCents).toBe(Math.round((40 * 50 + 50 * 52) / 90));
    expect(result.isTaker).toBe(true);
  });

  it('market order exhausts book — partial fill when book shallow', () => {
    const snap = book(50, 10);
    const order: SimOrder = {
      side: 'yes',
      type: 'market',
      size: 100,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(10);
    expect(result.remaining).toBe(90);
  });

  it('fee calculation — non-zero for taker fill', () => {
    const snap = book(50, 100);
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 10,
      limitPriceCents: 50,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    // rawFee = 0.07 * 10 * 0.50 * 0.50 = 0.175 → ceil to 0.18 → 18 cents? or min $0.01
    // 0.07 * 10 * 0.5 * 0.5 = 0.175 → ceil(0.175 * 100) = ceil(17.5) = 18 cents
    expect(result.feesCents).toBe(18);
  });

  it('fee minimum — 1 cent for very small orders', () => {
    const snap = book(1, 1000); // 1-cent price
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 1,
      limitPriceCents: 1,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    // rawFee = 0.07 * 1 * 0.01 * 0.99 ≈ 0.000693 → well below $0.01
    expect(result.feesCents).toBe(1); // $0.01 minimum
  });

  // ── IOC semantics ─────────────────────────────────────────────────────────

  it('IOC fills marketable portion, remainder reported as unexecuted', () => {
    const snap = book(50, 30); // only 30 available
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 50,
      limitPriceCents: 50,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(30);
    expect(result.remaining).toBe(20); // caller (replayClient) cancels IOC remainder
  });

  // ── FOK semantics ─────────────────────────────────────────────────────────

  it('FOK fills atomically when displayed depth covers size', () => {
    const snap = book(50, 100);
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 50,
      limitPriceCents: 50,
      timeInForce: FOK,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(50);
    expect(result.remaining).toBe(0);
    expect(result.isTaker).toBe(true);
  });

  it('FOK cancels when displayed depth is insufficient', () => {
    const snap = book(50, 30); // only 30, need 50
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 50,
      limitPriceCents: 50,
      timeInForce: FOK,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(0);
    expect(result.remaining).toBe(50);
    expect(result.isTaker).toBe(false);
    expect(result.feesCents).toBe(0);
  });

  it('FOK cancels when price constraint excludes levels', () => {
    const snap: SnapshotOrderbook = {
      yes: [
        [50, 30],
        [55, 30], // above limit price
      ],
      no: [],
    };
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 50, // would need both levels but 55 is above limit
      limitPriceCents: 52,
      timeInForce: FOK,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(0); // FOK cancels — can only see 30 at ≤52
    expect(result.remaining).toBe(50);
  });

  it('GTC partial fill — filled portion returned, remainder for caller to queue', () => {
    const snap = book(50, 30);
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 100,
      limitPriceCents: 50,
      timeInForce: GTC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(30);
    expect(result.remaining).toBe(70); // caller (replayClient) queues remainder
  });

  it('empty book — returns zero fill', () => {
    const snap: SnapshotOrderbook = { yes: [], no: [] };
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 50,
      limitPriceCents: 50,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.filled).toBe(0);
    expect(result.remaining).toBe(50);
    expect(result.fillPriceCents).toBe(0);
    expect(result.feesCents).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// queue_aware stub
// ---------------------------------------------------------------------------

describe('simulateFill — queue_aware model', () => {
  it('returns 0 fill and flags experimental caveat', () => {
    const snap = book(50, 1000);
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 10,
      limitPriceCents: 50,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'queue_aware');
    expect(result.filled).toBe(0);
    expect(result.remaining).toBe(10);
    expect(result.isTaker).toBe(false);
    expect(result.feesCents).toBe(0);
    expect(result.assumptionsAdded.some((w) => w.includes('queue_aware'))).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// assumptions_warning always populated
// ---------------------------------------------------------------------------

describe('simulateFill — assumptions_warning', () => {
  it('naive model always includes fidelity caveat in assumptionsAdded', () => {
    const snap = book(50, 100);
    const order: SimOrder = {
      side: 'yes',
      type: 'limit',
      size: 1,
      limitPriceCents: 50,
      timeInForce: IOC,
    };
    const result = simulateFill(order, snap, 'naive');
    expect(result.assumptionsAdded.length).toBeGreaterThan(0);
    expect(result.assumptionsAdded[0]).toContain('naive');
  });
});
