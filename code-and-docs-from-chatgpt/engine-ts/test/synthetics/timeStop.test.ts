import { describe, it, expect } from 'vitest';
import { evalTimeStop } from '../../src/synthetics/timeStop.js';
import type { Synthetic, Orderbook, TimeStopParams } from '../../src/types.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSynth(params: TimeStopParams, side: 'yes' | 'no' = 'yes'): Synthetic {
  return {
    id: 'syn-ts-test',
    kind: 'time_stop',
    ticker: 'TEST-TICKER',
    side,
    positionSize: 10,
    params,
    state: {},
    createdAt: new Date('2026-01-01T00:00:00Z'),
  } as Synthetic;
}

function makeBook(yesBid: number, noBid: number = 50): Orderbook {
  return {
    yes: yesBid > 0 ? [{ priceCents: yesBid, size: 10 }] : [],
    no: noBid > 0 ? [{ priceCents: noBid, size: 10 }] : [],
  };
}

const FUTURE = new Date('2099-12-31T23:59:59Z');
const PAST   = new Date('2020-01-01T00:00:00Z');
const EXACT  = new Date('2026-06-01T12:00:00Z');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('evalTimeStop', () => {
  it('1. deadline future, no exitIfBelowCents → no fire', () => {
    const s = makeSynth({ deadlineTimestamp: FUTURE.toISOString() });
    const result = evalTimeStop(s, makeBook(60), new Date());
    expect(result.fire).toBe(false);
    expect(result.reason).toBeUndefined();
    expect(result.unregister).toBeUndefined();
    // No price gate → no distanceCentsToTrigger
    expect(result.distanceCentsToTrigger).toBeUndefined();
  });

  it('2. deadline future, exitIfBelowCents set + topBid below threshold → no fire (deadline not passed)', () => {
    const s = makeSynth({
      deadlineTimestamp: FUTURE.toISOString(),
      exitIfBelowCents: 70,
    });
    // topBid=40 is below threshold, but deadline is in the future
    const result = evalTimeStop(s, makeBook(40), new Date());
    expect(result.fire).toBe(false);
    // distance = max(0, 70 - 40) = 30
    expect(result.distanceCentsToTrigger).toBe(30);
  });

  it('3. deadline past, no exitIfBelowCents → fire with unregister + correct reason', () => {
    const s = makeSynth({ deadlineTimestamp: PAST.toISOString() });
    const result = evalTimeStop(s, makeBook(60), new Date());
    expect(result.fire).toBe(true);
    expect(result.reason).toBe('time_stop_breached');
    expect(result.unregister).toBe(true);
  });

  it('4. deadline past, exitIfBelowCents set + topBid below threshold → fire', () => {
    const s = makeSynth({
      deadlineTimestamp: PAST.toISOString(),
      exitIfBelowCents: 70,
    });
    // topBid=40 < 70 AND deadline past → fire
    const result = evalTimeStop(s, makeBook(40), new Date());
    expect(result.fire).toBe(true);
    expect(result.reason).toBe('time_stop_breached');
    expect(result.unregister).toBe(true);
  });

  it('5. deadline past, exitIfBelowCents set + topBid >= threshold → no fire; distanceCentsToTrigger reflects gap', () => {
    const s = makeSynth({
      deadlineTimestamp: PAST.toISOString(),
      exitIfBelowCents: 50,
    });
    // topBid=80 >= 50 → waiting for price to drop
    const result = evalTimeStop(s, makeBook(80), new Date());
    expect(result.fire).toBe(false);
    expect(result.reason).toBeUndefined();
    // distance = max(0, 50 - 80) = 0 (already at or above threshold — distance is 0, not negative)
    expect(result.distanceCentsToTrigger).toBe(0);
  });

  it('5b. deadline past, exitIfBelowCents set + topBid just above threshold → distance = threshold gap', () => {
    const s = makeSynth({
      deadlineTimestamp: PAST.toISOString(),
      exitIfBelowCents: 50,
    });
    // topBid=60, threshold=50 → distance = max(0, 50-60) = 0
    const result = evalTimeStop(s, makeBook(60), new Date());
    expect(result.fire).toBe(false);
    expect(result.distanceCentsToTrigger).toBe(0);

    // topBid=45, threshold=50 → distance = max(0, 50-45) = 5
    // But since deadline IS past, topBid=45 < 50 → fires
    const result2 = evalTimeStop(s, makeBook(45), new Date());
    expect(result2.fire).toBe(true);
  });

  it('6. side=no uses book.no[0].priceCents', () => {
    const s = makeSynth({
      deadlineTimestamp: PAST.toISOString(),
      exitIfBelowCents: 30,
    }, 'no');
    // yes bid is 80 (should be ignored); no bid is 20 (below 30)
    const book: Orderbook = {
      yes: [{ priceCents: 80, size: 10 }],
      no: [{ priceCents: 20, size: 10 }],
    };
    const result = evalTimeStop(s, book, new Date());
    expect(result.fire).toBe(true);
    expect(result.reason).toBe('time_stop_breached');

    // Flip: no bid = 80 (above 30) → no fire despite deadline past
    const book2: Orderbook = {
      yes: [{ priceCents: 20, size: 10 }],
      no: [{ priceCents: 80, size: 10 }],
    };
    const result2 = evalTimeStop(s, book2, new Date());
    expect(result2.fire).toBe(false);
  });

  it('7. empty book on chosen side → topBid=0; fires if deadline past + exitIfBelowCents > 0', () => {
    const s = makeSynth({
      deadlineTimestamp: PAST.toISOString(),
      exitIfBelowCents: 10,
    });
    // Empty yes book → topBid=0, threshold=10 → 0 < 10 AND deadline past → fire
    const book: Orderbook = { yes: [], no: [{ priceCents: 50, size: 10 }] };
    const result = evalTimeStop(s, book, new Date());
    expect(result.fire).toBe(true);
    expect(result.reason).toBe('time_stop_breached');
  });

  it('8. time-equality boundary: currentTime === deadline exactly → fires (>= inclusive)', () => {
    const s = makeSynth({ deadlineTimestamp: EXACT.toISOString() });
    // Pass exactly the deadline as `now`
    const result = evalTimeStop(s, makeBook(50), EXACT);
    expect(result.fire).toBe(true);
    expect(result.reason).toBe('time_stop_breached');
    expect(result.unregister).toBe(true);
  });
});
