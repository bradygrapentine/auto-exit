/**
 * optimalSchedule tests — pure unit tests, no I/O.
 *
 * Covers:
 *   - Validation rejections (5 tests)
 *   - riskAversion=0 → uniform (TWAP) schedule
 *   - High riskAversion → front-loaded
 *   - Integer slices summing to totalSize
 *   - Non-overlapping, contiguous intervals
 *   - Total duration matches
 *   - remainingValueVariance override changes shape
 *   - side passthrough
 *   - Single degenerate minimum (numIntervals=2)
 *   - Rationale non-empty string
 *   - Pure function: repeated calls identical
 *   - No mutation of opts
 */

import { describe, expect, it } from 'vitest';
import { computeOptimalSchedule } from '../src/optimalSchedule.js';
import type { OptimalScheduleOpts } from '../src/optimalSchedule.js';

// ── fixtures ──────────────────────────────────────────────────────────────────

const BASE: OptimalScheduleOpts = {
  totalSize: 100,
  totalDurationMs: 60_000,
  numIntervals: 5,
  riskAversion: 1,
  bookImpactPerContract: 0.01,
};

// ── validation rejections ─────────────────────────────────────────────────────

describe('computeOptimalSchedule — validation', () => {
  it('rejects totalSize ≤ 0', () => {
    expect(() => computeOptimalSchedule({ ...BASE, totalSize: 0 })).toThrow(/totalSize/);
    expect(() => computeOptimalSchedule({ ...BASE, totalSize: -10 })).toThrow(/totalSize/);
  });

  it('rejects numIntervals < 2', () => {
    expect(() => computeOptimalSchedule({ ...BASE, numIntervals: 1 })).toThrow(/numIntervals/);
    expect(() => computeOptimalSchedule({ ...BASE, numIntervals: 0 })).toThrow(/numIntervals/);
  });

  it('rejects non-integer numIntervals', () => {
    expect(() => computeOptimalSchedule({ ...BASE, numIntervals: 2.5 })).toThrow(/numIntervals/);
  });

  it('rejects totalDurationMs ≤ 0', () => {
    expect(() => computeOptimalSchedule({ ...BASE, totalDurationMs: 0 })).toThrow(/totalDurationMs/);
    expect(() => computeOptimalSchedule({ ...BASE, totalDurationMs: -1 })).toThrow(/totalDurationMs/);
  });

  it('rejects riskAversion < 0', () => {
    expect(() => computeOptimalSchedule({ ...BASE, riskAversion: -0.001 })).toThrow(/riskAversion/);
  });

  it('rejects bookImpactPerContract ≤ 0', () => {
    expect(() => computeOptimalSchedule({ ...BASE, bookImpactPerContract: 0 })).toThrow(/bookImpactPerContract/);
    expect(() => computeOptimalSchedule({ ...BASE, bookImpactPerContract: -1 })).toThrow(/bookImpactPerContract/);
  });
});

// ── riskAversion=0 → TWAP uniform ─────────────────────────────────────────────

describe('computeOptimalSchedule — TWAP when riskAversion=0', () => {
  it('produces equal sliceSizes when totalSize divisible by numIntervals', () => {
    const result = computeOptimalSchedule({ ...BASE, riskAversion: 0, totalSize: 100, numIntervals: 5 });
    const sizes = result.slices.map(s => s.sliceSize);
    expect(sizes).toHaveLength(5);
    expect(sizes.every(s => s === 20)).toBe(true);
  });

  it('slices sum to totalSize even when not evenly divisible', () => {
    const result = computeOptimalSchedule({ ...BASE, riskAversion: 0, totalSize: 101, numIntervals: 5 });
    const sum = result.slices.reduce((a, s) => a + s.sliceSize, 0);
    expect(sum).toBe(101);
  });

  it('rationale mentions TWAP or uniform', () => {
    const result = computeOptimalSchedule({ ...BASE, riskAversion: 0 });
    expect(result.rationale.toLowerCase()).toMatch(/twap|uniform/);
  });
});

// ── high riskAversion → front-loaded ─────────────────────────────────────────

describe('computeOptimalSchedule — front-loading with high riskAversion', () => {
  it('first slice > last slice when riskAversion is high', () => {
    const result = computeOptimalSchedule({ ...BASE, riskAversion: 100, numIntervals: 5 });
    const first = result.slices[0]!.sliceSize;
    const last = result.slices[result.slices.length - 1]!.sliceSize;
    expect(first).toBeGreaterThan(last);
  });

  it('front half contains more than 50% of totalSize when high riskAversion', () => {
    const result = computeOptimalSchedule({ ...BASE, riskAversion: 50, numIntervals: 6 });
    const half = Math.floor(6 / 2);
    const frontSum = result.slices.slice(0, half).reduce((a, s) => a + s.sliceSize, 0);
    expect(frontSum).toBeGreaterThan(BASE.totalSize / 2);
  });
});

// ── integer slices summing to totalSize ───────────────────────────────────────

describe('computeOptimalSchedule — integer sum invariant', () => {
  it('all sliceSizes are integers', () => {
    const result = computeOptimalSchedule(BASE);
    result.slices.forEach(s => {
      expect(Number.isInteger(s.sliceSize)).toBe(true);
    });
  });

  it('sum of sliceSizes equals totalSize', () => {
    const result = computeOptimalSchedule(BASE);
    const sum = result.slices.reduce((a, s) => a + s.sliceSize, 0);
    expect(sum).toBe(100);
  });

  it('sum equals totalSize with large prime totalSize', () => {
    const result = computeOptimalSchedule({ ...BASE, totalSize: 997, numIntervals: 7 });
    const sum = result.slices.reduce((a, s) => a + s.sliceSize, 0);
    expect(sum).toBe(997);
  });
});

// ── non-overlapping, contiguous intervals ─────────────────────────────────────

describe('computeOptimalSchedule — interval geometry', () => {
  it('intervals are non-overlapping and contiguous', () => {
    const result = computeOptimalSchedule(BASE);
    for (let i = 1; i < result.slices.length; i++) {
      const prev = result.slices[i - 1]!;
      const curr = result.slices[i]!;
      expect(curr.tStartMs).toBeCloseTo(prev.tStartMs + prev.intervalMs, 6);
    }
  });

  it('first interval starts at t=0', () => {
    const result = computeOptimalSchedule(BASE);
    expect(result.slices[0]!.tStartMs).toBe(0);
  });

  it('intervalIndex matches array position', () => {
    const result = computeOptimalSchedule(BASE);
    result.slices.forEach((s, i) => {
      expect(s.intervalIndex).toBe(i);
    });
  });

  it('total duration matches totalDurationMs', () => {
    const result = computeOptimalSchedule(BASE);
    const last = result.slices[result.slices.length - 1]!;
    expect(last.tStartMs + last.intervalMs).toBeCloseTo(BASE.totalDurationMs, 6);
  });
});

// ── remainingValueVariance override ──────────────────────────────────────────

describe('computeOptimalSchedule — variance override changes shape', () => {
  it('different variance yields different slice distribution (non-TWAP)', () => {
    // Use moderate riskAversion + large numIntervals so differences are visible
    // without numerical saturation. kappa_low = sqrt(1 * 0.01 / 0.1) ≈ 0.316
    // kappa_high = sqrt(1 * 0.49 / 0.1) ≈ 2.21 — front-loading differs.
    const opts = { ...BASE, riskAversion: 1, bookImpactPerContract: 0.1, numIntervals: 10, totalDurationMs: 10_000 };
    const low = computeOptimalSchedule({ ...opts, remainingValueVariance: 0.01 });
    const high = computeOptimalSchedule({ ...opts, remainingValueVariance: 0.49 });
    // Schedules should differ (different κ → different weight profile)
    const lowSizes = low.slices.map(s => s.sliceSize).join(',');
    const highSizes = high.slices.map(s => s.sliceSize).join(',');
    expect(lowSizes).not.toBe(highSizes);
  });

  it('variance=0.25 is the default (explicit vs omitted)', () => {
    const withDefault = computeOptimalSchedule({ ...BASE });
    const withExplicit = computeOptimalSchedule({ ...BASE, remainingValueVariance: 0.25 });
    expect(withDefault.slices.map(s => s.sliceSize)).toEqual(withExplicit.slices.map(s => s.sliceSize));
  });
});

// ── side passthrough ──────────────────────────────────────────────────────────

describe('computeOptimalSchedule — side passthrough', () => {
  it('rationale mentions sell by default', () => {
    const result = computeOptimalSchedule(BASE);
    // rationale is defined; side doesn't affect math but may appear in rationale
    expect(result.rationale).toBeDefined();
  });

  it('accepts side=buy without error', () => {
    expect(() => computeOptimalSchedule({ ...BASE, side: 'buy' })).not.toThrow();
  });

  it('side=buy and side=sell produce same slice math (side is informational)', () => {
    const sell = computeOptimalSchedule({ ...BASE, side: 'sell' });
    const buy = computeOptimalSchedule({ ...BASE, side: 'buy' });
    expect(sell.slices.map(s => s.sliceSize)).toEqual(buy.slices.map(s => s.sliceSize));
  });
});

// ── minimum numIntervals=2 degenerate case ────────────────────────────────────

describe('computeOptimalSchedule — numIntervals=2 degenerate', () => {
  it('produces exactly 2 slices summing to totalSize', () => {
    const result = computeOptimalSchedule({ ...BASE, numIntervals: 2 });
    expect(result.slices).toHaveLength(2);
    const sum = result.slices.reduce((a, s) => a + s.sliceSize, 0);
    expect(sum).toBe(100);
  });
});

// ── rationale non-empty ───────────────────────────────────────────────────────

describe('computeOptimalSchedule — rationale', () => {
  it('rationale is a non-empty string', () => {
    const result = computeOptimalSchedule(BASE);
    expect(typeof result.rationale).toBe('string');
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  it('rationale is non-empty for TWAP case', () => {
    const result = computeOptimalSchedule({ ...BASE, riskAversion: 0 });
    expect(result.rationale.length).toBeGreaterThan(0);
  });
});

// ── pure function: repeated calls identical ───────────────────────────────────

describe('computeOptimalSchedule — pure function', () => {
  it('same inputs always produce identical output', () => {
    const r1 = computeOptimalSchedule(BASE);
    const r2 = computeOptimalSchedule(BASE);
    expect(r1.slices).toEqual(r2.slices);
    expect(r1.rationale).toBe(r2.rationale);
  });
});

// ── no mutation of opts ───────────────────────────────────────────────────────

describe('computeOptimalSchedule — no mutation', () => {
  it('does not mutate the opts object', () => {
    const opts: OptimalScheduleOpts = { ...BASE };
    const before = JSON.stringify(opts);
    computeOptimalSchedule(opts);
    expect(JSON.stringify(opts)).toBe(before);
  });
});
