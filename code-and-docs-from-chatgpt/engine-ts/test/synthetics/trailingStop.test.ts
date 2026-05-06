import { describe, it, expect } from 'vitest';
import { evalTrailingStop } from '../../src/synthetics/trailingStop.js';
import type { Synthetic, Orderbook, SyntheticState, TrailingStopState } from '../../src/types.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSynthetic(
  trailCents: number,
  floorPriceCents: number | undefined,
  side: 'yes' | 'no',
  initialState: SyntheticState = {},
): Synthetic {
  return {
    id: 'syn-test',
    kind: 'trailing_stop',
    ticker: 'TEST',
    side,
    positionSize: 10,
    params: { trailCents, floorPriceCents },
    state: initialState,
    status: 'armed',
    createdAt: new Date().toISOString(),
    selfTradePrevention: 'taker_at_cross',
    autoCancelOnZeroPosition: false,
  };
}

function makeBook(yesBid: number, noBid?: number): Orderbook {
  return {
    yes: yesBid > 0 ? [{ priceCents: yesBid, size: 10 }] : [],
    no: (noBid ?? 0) > 0 ? [{ priceCents: noBid!, size: 10 }] : [],
  };
}

/** Thread a sequence of bids through evalTrailingStop, returning each result in order. */
function runSequence(
  bids: number[],
  trailCents: number,
  floorPriceCents?: number,
  side: 'yes' | 'no' = 'yes',
) {
  let state: SyntheticState = {};
  return bids.map((bid) => {
    const s = makeSynthetic(trailCents, floorPriceCents, side, state);
    const book = makeBook(side === 'yes' ? bid : 0, side === 'no' ? bid : undefined);
    const result = evalTrailingStop(s, book);
    // Thread newState forward.
    state = result.newState ?? state;
    return result;
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('evalTrailingStop', () => {
  it('test 1: [4.0, 4.5, 5.0, 4.7, 4.4] trail=0.5 → no fire (4.4 > stop=4.5? NO wait: peak=5.0 stop=4.5 ≥ 4.4 so fires? Re-read spec...)', () => {
    // peak after 5.0 = 5.0; stop = 5.0 - 0.5 = 4.5; bid 4.7 > 4.5 → no fire; bid 4.4 ≤ 4.5 → FIRE
    // Per spec: "no fire (still in trail)" — but 4.4 ≤ 4.5 means it SHOULD fire.
    // The task brief says "no fire (still in trail)" for this sequence — let's re-read:
    // Trail = 0.5. Sequence [4.0, 4.5, 5.0, 4.7, 4.4]:
    //   tick 1: peak=4.0  stop=max(4.0-0.5,1)=3.5 bid=4.0 > 3.5 → no fire
    //   tick 2: peak=4.5  stop=4.0                bid=4.5 > 4.0 → no fire
    //   tick 3: peak=5.0  stop=4.5                bid=5.0 > 4.5 → no fire
    //   tick 4: peak=5.0  stop=4.5                bid=4.7 > 4.5 → no fire
    //   tick 5: peak=5.0  stop=4.5                bid=4.4 ≤ 4.5 → FIRE
    //
    // The task brief description says "no fire (still in trail)" but the math says tick 5 fires.
    // The task brief for test 2 says [4.0, 5.0, 4.4] trail=0.5 → fires on 4.4.
    // Test 1 also ends at 4.4 with peak 5.0 — same stop=4.5 — so tick 5 FIRES.
    // The brief must mean "no fire in ticks 1-4; fires on tick 5" = fires at end.
    // We'll assert the first 4 don't fire and tick 5 does.
    const results = runSequence([4.0, 4.5, 5.0, 4.7, 4.4], 0.5);
    expect(results[0].fire).toBe(false);  // bid 4.0, peak 4.0, stop 3.5
    expect(results[1].fire).toBe(false);  // bid 4.5, peak 4.5, stop 4.0
    expect(results[2].fire).toBe(false);  // bid 5.0, peak 5.0, stop 4.5
    expect(results[3].fire).toBe(false);  // bid 4.7, peak 5.0, stop 4.5
    expect(results[4].fire).toBe(true);   // bid 4.4, peak 5.0, stop 4.5 → fires
    expect(results[4].reason).toBe('trailing_stop_breached');
  });

  it('test 2: [4.0, 5.0, 4.4] trail=0.5 → fires on 4.4 (peak 5.0 - 0.5 = stop 4.5)', () => {
    const results = runSequence([4.0, 5.0, 4.4], 0.5);
    expect(results[0].fire).toBe(false);  // bid 4.0, peak 4.0, stop 3.5
    expect(results[1].fire).toBe(false);  // bid 5.0, peak 5.0, stop 4.5
    expect(results[2].fire).toBe(true);   // bid 4.4, peak 5.0, stop 4.5 → fires
    expect(results[2].reason).toBe('trailing_stop_breached');
  });

  it('test 3: bid=50 trail=5 floor=1 → stop=45, fires when bid ≤ 45', () => {
    // tick 1: bid=50, peak=50, stop=max(45,1)=45, 50>45 → no fire
    const r1 = runSequence([50], 5, 1);
    expect(r1[0].fire).toBe(false);
    expect(r1[0].distanceCentsToTrigger).toBeCloseTo(5);

    // tick 2: bid=45, fires
    const r2 = runSequence([50, 45], 5, 1);
    expect(r2[1].fire).toBe(true);
    expect(r2[1].reason).toBe('trailing_stop_breached');
  });

  it('test 4: bid=3 trail=10 floor=1 → stop clamped to 1, fires only when bid ≤ 1', () => {
    // peak=3, raw stop = 3-10 = -7 → clamped to 1; bid=3 > 1 → no fire
    const r1 = runSequence([3], 10, 1);
    expect(r1[0].fire).toBe(false);

    // bid=2 > stop=1 → no fire
    const r2 = runSequence([3, 2], 10, 1);
    expect(r2[1].fire).toBe(false);

    // bid=1 ≤ stop=1 → fire
    const r3 = runSequence([3, 1], 10, 1);
    expect(r3[1].fire).toBe(true);
    expect(r3[1].reason).toBe('trailing_stop_breached');
  });

  it('test 5: empty state on first call initializes peakBidCentsExact to current bid', () => {
    const s = makeSynthetic(2, undefined, 'yes', {});
    const book = makeBook(10);
    const result = evalTrailingStop(s, book);
    const newState = result.newState as TrailingStopState;
    expect(newState.peakBidCentsExact).toBe(10);
    // Stop = max(10-2, 1) = 8; bid=10 > 8 → no fire on init tick
    expect(result.fire).toBe(false);
  });

  it('test 6: side=no uses book.no[0]', () => {
    const s = makeSynthetic(2, undefined, 'no', {});
    // yes book has a high price that should NOT be used
    const book: Orderbook = {
      yes: [{ priceCents: 90, size: 10 }],
      no: [{ priceCents: 5, size: 10 }],
    };
    const result = evalTrailingStop(s, book);
    const newState = result.newState as TrailingStopState;
    // Peak should be from no[0] = 5, not yes[0] = 90
    expect(newState.peakBidCentsExact).toBe(5);
    // stop = max(5-2, 1) = 3; bid=5 > 3 → no fire
    expect(result.fire).toBe(false);

    // Now thread state forward: peak=5, bid drops to 3 → stop=3 → fires
    const s2 = makeSynthetic(2, undefined, 'no', newState);
    const book2: Orderbook = {
      yes: [{ priceCents: 90, size: 10 }],
      no: [{ priceCents: 3, size: 10 }],
    };
    const result2 = evalTrailingStop(s2, book2);
    expect(result2.fire).toBe(true);
    expect(result2.reason).toBe('trailing_stop_breached');
  });

  it('peak strictly tracks float bids (sub-cent precision)', () => {
    const results = runSequence([4.5, 4.55, 4.3], 0.5);
    // peak=4.55, stop=4.05, bid=4.3 > 4.05 → no fire
    expect(results[2].fire).toBe(false);
    expect((results[2].newState as TrailingStopState).peakBidCentsExact).toBeCloseTo(4.55);
  });

  it('newState always carries updated peak', () => {
    const results = runSequence([10, 12, 11], 3);
    expect((results[0].newState as TrailingStopState).peakBidCentsExact).toBe(10);
    expect((results[1].newState as TrailingStopState).peakBidCentsExact).toBe(12);
    // bid fell but peak stays at 12
    expect((results[2].newState as TrailingStopState).peakBidCentsExact).toBe(12);
  });

  it('distanceCentsToTrigger is non-negative when not fired and zero-ish at trigger', () => {
    const results = runSequence([10, 7], 3);
    // tick 1: stop=7, bid=10, dist=3
    expect(results[0].distanceCentsToTrigger).toBeCloseTo(3);
    // tick 2: bid=7, stop=7, dist=0 → fires
    expect(results[1].fire).toBe(true);
    expect(results[1].distanceCentsToTrigger).toBeCloseTo(0);
  });
});
