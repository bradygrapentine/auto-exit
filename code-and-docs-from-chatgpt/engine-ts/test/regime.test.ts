// test/regime.test.ts
import { describe, it, expect } from 'vitest';
import { detectRegime, type SnapshotSlice } from '../src/regime.js';

function snap(yesTop: number, noTop: number): SnapshotSlice {
  return {
    orderbook: {
      yes: [{ priceCents: yesTop, size: 100 }],
      no:  [{ priceCents: noTop,  size: 100 }],
    },
  };
}

describe('detectRegime', () => {
  it('classifies rising when last mid > first mid + 5¢', () => {
    const window = [snap(40, 50), snap(45, 45), snap(55, 35)]; // mids 45, 50, 60
    expect(detectRegime(window)).toBe('rising');
  });

  it('classifies falling when last mid < first mid - 5¢', () => {
    const window = [snap(60, 30), snap(50, 40), snap(40, 50)]; // mids 65, 55, 45
    expect(detectRegime(window)).toBe('falling');
  });

  it('classifies sideways when |delta| ≤ 5 and range > 1', () => {
    const window = [snap(45, 45), snap(48, 42), snap(46, 44)]; // mids 50, 53, 51
    expect(detectRegime(window)).toBe('sideways');
  });

  it('classifies dead when range ≤ 1', () => {
    const window = [snap(50, 50), snap(50, 50), snap(50, 50)];
    expect(detectRegime(window)).toBe('dead');
  });

  it('handles empty no-side via fallback (yes-only book)', () => {
    const window = [
      { orderbook: { yes: [{ priceCents: 40, size: 100 }], no: [] } },
      { orderbook: { yes: [{ priceCents: 50, size: 100 }], no: [] } },
    ];
    // mid = bestYesBid in this fallback path → 40, 50 → +10 → rising
    expect(detectRegime(window)).toBe('rising');
  });

  it('handles single-snapshot input as dead', () => {
    expect(detectRegime([snap(40, 50)])).toBe('dead');
  });

  it('handles empty input as dead', () => {
    expect(detectRegime([])).toBe('dead');
  });
});
