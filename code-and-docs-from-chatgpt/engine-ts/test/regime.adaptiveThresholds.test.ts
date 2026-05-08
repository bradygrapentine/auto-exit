import { describe, it, expect } from 'vitest';
import { detectRegime, proportionalThresholds, type SnapshotSlice } from '../src/regime.js';

function snap(yesTop: number, noTop: number): SnapshotSlice {
  return {
    orderbook: {
      yes: [{ priceCents: yesTop, size: 100 }],
      no:  [{ priceCents: noTop,  size: 100 }],
    },
  };
}

describe('detectRegime — adaptive thresholds (SH-DETECT-REGIME-ADAPTIVE-THRESHOLD)', () => {
  it('proportionalThresholds(10) returns lenient defaults for short windows', () => {
    const t = proportionalThresholds(10);
    expect(t.deadRangeCents).toBeLessThanOrEqual(1);
    expect(t.directionalDeltaCents).toBeLessThanOrEqual(2);
  });

  it('proportionalThresholds(500) returns strict thresholds for long windows', () => {
    const t = proportionalThresholds(500);
    expect(t.deadRangeCents).toBeGreaterThanOrEqual(50);
    expect(t.directionalDeltaCents).toBeGreaterThanOrEqual(100);
  });

  it('classifies a 10-tick window with 3¢ rise as rising under proportional thresholds', () => {
    // mids 50, 51, 52, 51, 53, 52, 51, 53, 52, 53 — delta=+3, range=3
    const window = [
      snap(45, 45), snap(46, 44), snap(47, 43), snap(46, 44), snap(48, 42),
      snap(47, 43), snap(46, 44), snap(48, 42), snap(47, 43), snap(48, 42),
    ];
    expect(detectRegime(window, proportionalThresholds(window.length))).toBe('rising');
    // With FIXED thresholds (delta > 5), the same window classifies as sideways.
    expect(detectRegime(window)).toBe('sideways');
  });

  it('classifies a stable 10-tick book as dead under proportional thresholds', () => {
    const window = Array.from({ length: 10 }, () => snap(50, 50));
    expect(detectRegime(window, proportionalThresholds(window.length))).toBe('dead');
  });

  it('default behavior (no thresholds arg) is unchanged from v5', () => {
    const window = [
      snap(45, 45), snap(46, 44), snap(47, 43), snap(46, 44), snap(48, 42),
      snap(47, 43), snap(46, 44), snap(48, 42), snap(47, 43), snap(48, 42),
    ];
    expect(detectRegime(window)).toBe('sideways');
  });

  it('proportional thresholds at 100-tick window: 15¢ rise stays sideways (threshold=20)', () => {
    // 100-tick window: deadRange=10, directionalDelta=20. 15¢ rise crosses
    // deadRange (not dead) but not directional threshold → sideways.
    const window: SnapshotSlice[] = [];
    for (let i = 0; i < 100; i++) window.push(snap(40 + Math.floor(i * 0.3), 50));
    // bestYesBid_0=40 → mid=45; bestYesBid_99=69 floor → 40+29=69 → mid=59.5 → delta≈14.5 → sideways
    expect(detectRegime(window, proportionalThresholds(window.length))).toBe('sideways');
  });

  it('proportional thresholds at 100-tick window: 25¢ rise classifies as rising', () => {
    // 100-tick window: directionalDelta = 20. 25¢ rise crosses threshold.
    const window: SnapshotSlice[] = [];
    for (let i = 0; i < 100; i++) window.push(snap(20 + Math.floor(i * 0.5), 50));
    // bestYesBid_0=20, bestNoBid_0=50 → mid=35
    // bestYesBid_99=69, bestNoBid_99=50 → mid=59.5 → delta≈24.5 → rising
    expect(detectRegime(window, proportionalThresholds(window.length))).toBe('rising');
  });
});
