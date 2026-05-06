import { describe, it, expect } from 'vitest';
import { evalStepTrail } from '../../src/synthetics/stepTrail.js';
import type { Synthetic, Orderbook, SyntheticState, StepTrailState } from '../../src/types.js';

function makeSynth(
  trailCents: number,
  stepCents: number,
  floorPriceCents: number | undefined,
  side: 'yes' | 'no',
  initialState: SyntheticState = {},
): Synthetic {
  return {
    id: 'syn-test',
    kind: 'step_trail',
    ticker: 'TEST',
    side,
    positionSize: 10,
    params: { trailCents, stepCents, floorPriceCents },
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

/** Thread a sequence of bids through evalStepTrail, returning each result. */
function runSequence(
  bids: number[],
  trailCents: number,
  stepCents: number,
  floorPriceCents?: number,
  side: 'yes' | 'no' = 'yes',
) {
  let state: SyntheticState = {};
  return bids.map(bid => {
    const s = makeSynth(trailCents, stepCents, floorPriceCents, side, state);
    const book = makeBook(side === 'yes' ? bid : 0, side === 'no' ? bid : undefined);
    const result = evalStepTrail(s, book);
    state = result.newState ?? state;
    return result;
  });
}

describe('evalStepTrail', () => {
  it('peak only updates when topBid > peak + stepCents (stair-step)', () => {
    // Bids [4.0, 4.1, 4.2, 5.0, 5.05] with stepCents=1, trailCents=0.5:
    //   tick 1: peak init 4.0; stop max(3.5,1)=3.5; bid 4.0 > 3.5 → no fire
    //   tick 2: bid 4.1, 4.1 > 4.0+1=5.0? no → peak stays 4.0; stop 3.5; no fire
    //   tick 3: bid 4.2, 4.2 > 5.0? no → peak stays 4.0; no fire
    //   tick 4: bid 5.0, 5.0 > 5.0? no (strict >) → peak stays 4.0; stop 3.5; no fire
    //     then a tick with bid 5.5: 5.5 > 5.0 → peak jumps to 5.5; stop 5.0
    const results = runSequence([4.0, 4.1, 4.2, 5.0, 5.05], 0.5, 1);
    const peaks = results.map(r => (r.newState as StepTrailState).peakBidCentsExact);
    // Ticks 1-4: peak stays at 4.0 (none exceed 4.0+1=5.0 strictly).
    // Tick 5: 5.05 > 5.0 → peak jumps to 5.05. (The point of step-trail: small upticks
    // within the step window are ignored, but exceeding the step ratchets up.)
    expect(peaks).toEqual([4.0, 4.0, 4.0, 4.0, 5.05]);
    expect(results.every(r => r.fire === false)).toBe(true);
  });

  it('peak jumps once topBid > peak + stepCents', () => {
    // Bids [4.0, 5.5] with stepCents=1: 5.5 > 4.0+1=5.0 → peak becomes 5.5
    const results = runSequence([4.0, 5.5], 0.5, 1);
    const peaks = results.map(r => (r.newState as StepTrailState).peakBidCentsExact);
    expect(peaks).toEqual([4.0, 5.5]);
  });

  it('fires when topBid drops below the stop derived from a stepped peak', () => {
    // Bids [4.0, 6.0, 5.4] trailCents=0.5 stepCents=1:
    //   tick 1: peak=4.0 stop=3.5 bid=4.0 > 3.5 → no fire
    //   tick 2: 6.0 > 4.0+1=5.0 → peak=6.0 stop=5.5 bid=6.0 > 5.5 → no fire
    //   tick 3: 5.4 > 6.0+1? no → peak=6.0 stop=5.5 bid=5.4 ≤ 5.5 → FIRE
    const results = runSequence([4.0, 6.0, 5.4], 0.5, 1);
    expect(results[0].fire).toBe(false);
    expect(results[1].fire).toBe(false);
    expect(results[2].fire).toBe(true);
    expect(results[2].reason).toBe('step_trail_breached');
  });

  it('empty state on first call initializes peakBidCentsExact to current bid', () => {
    const s = makeSynth(2, 1, undefined, 'yes', {});
    const book = makeBook(10);
    const result = evalStepTrail(s, book);
    expect((result.newState as StepTrailState).peakBidCentsExact).toBe(10);
    expect(result.fire).toBe(false);  // stop 8, bid 10 > 8
  });

  it('clamps stop to floorPriceCents', () => {
    // peak=3, trail=10 → raw stop = -7, clamped to floor=1
    // bid=2 > 1 → no fire; bid=1 ≤ 1 → fire
    const r1 = runSequence([3, 2], 10, 1, 1);
    expect(r1[1].fire).toBe(false);
    const r2 = runSequence([3, 1], 10, 1, 1);
    expect(r2[1].fire).toBe(true);
  });

  it("side='no' uses book.no[0]", () => {
    const s = makeSynth(0.5, 1, 1, 'no', {});
    const book: Orderbook = { yes: [{ priceCents: 99, size: 10 }], no: [{ priceCents: 50, size: 10 }] };
    const result = evalStepTrail(s, book);
    expect((result.newState as StepTrailState).peakBidCentsExact).toBe(50);
  });

  it('distanceCentsToTrigger reflects bid - stop', () => {
    const s = makeSynth(2, 1, 1, 'yes', { peakBidCentsExact: 60 } as StepTrailState);
    const book = makeBook(58);
    const result = evalStepTrail(s, book);
    // stop = max(60-2, 1) = 58; distance = 58 - 58 = 0
    expect(result.distanceCentsToTrigger).toBe(0);
  });
});
