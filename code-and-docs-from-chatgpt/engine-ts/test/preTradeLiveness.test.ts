/**
 * preTradeLiveness.test.ts — SH-DEPTH-WALK-STALE-SNAPSHOT Task 2.1
 *
 *  1. book unchanged → ok
 *  2. bid shifted within tolerance → ok
 *  3. bid shifted past tolerance → bid_shifted
 *  4. size at projected level collapsed past tolerance → size_collapsed
 *  5. side empty → side_empty
 *  6. MOVVA replay: 12,336@93.8¢ projection vs 0@93¢ + 91¢ top → size_collapsed
 *  7. custom tolerances honored
 */

import { describe, it, expect } from 'vitest';
import { checkLiveness } from '../src/preTradeLiveness.js';
import type { Orderbook } from '../src/types.js';

function bookFromSells(side: 'yes' | 'no', levels: Array<[number, number]>): Orderbook {
  const ls = levels.map(([priceCents, size]) => ({ priceCents, size }));
  return side === 'yes' ? { yes: ls, no: [] } : { yes: [], no: ls };
}

describe('checkLiveness', () => {
  it('returns ok when book is unchanged', () => {
    const result = checkLiveness(
      { sellingSide: 'no', topBidCents: 93, expectedSize: 12_336 },
      bookFromSells('no', [[93, 12_336]]),
    );
    expect(result.ok).toBe(true);
    expect(result.observed?.topBidCents).toBe(93);
  });

  it('returns ok when bid shifted within tolerance', () => {
    const result = checkLiveness(
      { sellingSide: 'no', topBidCents: 93, expectedSize: 12_336 },
      // Top bid moved up to 94¢ — that's a shift of +1, which equals the default
      // tolerance and should pass. Size at the new level is healthy.
      bookFromSells('no', [[94, 12_000], [93, 12_336]]),
    );
    expect(result.ok).toBe(true);
  });

  it('rejects when bid shifted past tolerance', () => {
    const result = checkLiveness(
      { sellingSide: 'no', topBidCents: 93, expectedSize: 12_336 },
      bookFromSells('no', [[91, 5_000]]),
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('bid_shifted');
    expect(result.drift?.bidCents).toBe(-2);
  });

  it('rejects when size at projected level collapsed past tolerance', () => {
    const result = checkLiveness(
      { sellingSide: 'no', topBidCents: 93, expectedSize: 12_336 },
      // Same top bid (93¢) but only 100 contracts — projection is unsupportable.
      bookFromSells('no', [[93, 100]]),
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('size_collapsed');
    expect(result.drift?.sizeShrinkPct).toBeGreaterThan(0.99);
  });

  it('rejects when the side is empty', () => {
    const result = checkLiveness(
      { sellingSide: 'no', topBidCents: 93, expectedSize: 12_336 },
      { yes: [], no: [] },
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('side_empty');
  });

  it('MOVVA replay: 12,336@93.8¢ projection vs 0@93¢ + 91¢ top → size_collapsed or bid_shifted', () => {
    // The actual 2026-05-09 MOVVA failure: the 93.8¢ bid was pulled, and top
    // collapsed to 91.1¢. Either rejection reason is correct (top moved AND
    // expected size vanished). We require the call to fail with one of them.
    const result = checkLiveness(
      { sellingSide: 'no', topBidCents: 94, expectedSize: 12_336 },
      bookFromSells('no', [[91, 5_000]]),
    );
    expect(result.ok).toBe(false);
    expect(['bid_shifted', 'size_collapsed']).toContain(result.reason);
  });

  it('honors custom tolerances', () => {
    // Tighter shift tolerance (0.5¢) → 1¢ shift now rejected.
    const tight = checkLiveness(
      { sellingSide: 'no', topBidCents: 93, expectedSize: 100 },
      bookFromSells('no', [[94, 100]]),
      { maxBidShiftCents: 0 },
    );
    expect(tight.ok).toBe(false);
    expect(tight.reason).toBe('bid_shifted');

    // Looser shrink tolerance (90%) → 50% size drop now passes.
    const loose = checkLiveness(
      { sellingSide: 'no', topBidCents: 93, expectedSize: 100 },
      bookFromSells('no', [[93, 50]]),
      { maxSizeShrinkPct: 0.90 },
    );
    expect(loose.ok).toBe(true);
  });
});
