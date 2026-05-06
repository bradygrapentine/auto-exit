import { describe, it, expect } from 'vitest';
import { computePeggedPrice, shouldRepostPeg } from '../src/pegToMid.js';
import type { Orderbook } from '../src/types.js';

const book: Orderbook = {
  yes: [{ priceCents: 50, size: 100 }],
  no: [{ priceCents: 45, size: 100 }],
};

describe('computePeggedPrice', () => {
  it('sell side: floor(midpoint - offset)', () => {
    // yesBid=50, yesAsk=100-45=55; mid=(50+55)/2=52.5; sell at 52.5-1=51.5 → floor 51
    expect(computePeggedPrice('sell', book, 1, 1)).toBe(51);
  });

  it('buy side: ceil(midpoint + offset)', () => {
    // mid=52.5; buy at 52.5+1=53.5 → ceil 54
    expect(computePeggedPrice('buy', book, 1, 1)).toBe(54);
  });

  it('clamps sell to floorPriceCents', () => {
    const thinBook: Orderbook = {
      yes: [{ priceCents: 1, size: 1 }],
      no: [{ priceCents: 1, size: 1 }],
    };
    // yesAsk = 100-1 = 99; mid = (1+99)/2 = 50; sell offset 100 → -50 → clamped to floor 1
    expect(computePeggedPrice('sell', thinBook, 100, 1)).toBe(1);
  });

  it('returns null when yes side is empty', () => {
    const empty: Orderbook = { yes: [], no: [{ priceCents: 50, size: 1 }] };
    expect(computePeggedPrice('sell', empty, 1, 1)).toBeNull();
  });

  it('returns null when no side is empty', () => {
    const empty: Orderbook = { yes: [{ priceCents: 50, size: 1 }], no: [] };
    expect(computePeggedPrice('sell', empty, 1, 1)).toBeNull();
  });

  it('zero offset returns floor of mid (sell) or ceil of mid (buy)', () => {
    expect(computePeggedPrice('sell', book, 0, 1)).toBe(52);  // floor(52.5)
    expect(computePeggedPrice('buy', book, 0, 1)).toBe(53);   // ceil(52.5)
  });
});

describe('shouldRepostPeg', () => {
  it('returns true when computed price differs from current resting price', () => {
    expect(shouldRepostPeg(51, 52)).toBe(true);
  });

  it('returns false when prices match', () => {
    expect(shouldRepostPeg(51, 51)).toBe(false);
  });

  it('returns true when there is no resting order yet (current null)', () => {
    expect(shouldRepostPeg(51, null)).toBe(true);
  });
});
