import { describe, it, expect } from 'vitest';
import { jitterChunkSize, jitterDelay, type JitterConfig } from '../src/jitter.js';

const cfg: JitterConfig = { chunkSizePct: 0.15, loopDelayPct: 0.30 };

describe('jitterChunkSize', () => {
  it('returns base when pct is 0', () => {
    expect(jitterChunkSize(100, { chunkSizePct: 0, loopDelayPct: 0 }, () => 0.5)).toBe(100);
  });

  it('produces an integer chunk size within [base*(1-pct), base*(1+pct)]', () => {
    const out = jitterChunkSize(100, cfg, () => 0.5);
    expect(out).toBeGreaterThanOrEqual(85);
    expect(out).toBeLessThanOrEqual(115);
    expect(Number.isInteger(out)).toBe(true);
  });

  it('clamps at the minimum of 1 share', () => {
    expect(jitterChunkSize(1, { chunkSizePct: 1.0, loopDelayPct: 0 }, () => 0)).toBe(1);
  });

  it('uses provided rng for deterministic tests', () => {
    const a = jitterChunkSize(100, cfg, () => 0);
    const b = jitterChunkSize(100, cfg, () => 1);
    expect(a).not.toBe(b);
  });

  it('rng=0 produces minimum-end result, rng=1 produces maximum-end', () => {
    const min = jitterChunkSize(100, cfg, () => 0);  // factor = 1 - 0.15 = 0.85
    const max = jitterChunkSize(100, cfg, () => 1);  // factor = 1 + 0.15 = 1.15
    expect(min).toBe(85);
    expect(max).toBe(115);
  });
});

describe('jitterDelay', () => {
  it('returns base when pct is 0', () => {
    expect(jitterDelay(2000, { chunkSizePct: 0, loopDelayPct: 0 }, () => 0.5)).toBe(2000);
  });

  it('produces a delay within [base*(1-pct), base*(1+pct)]', () => {
    const out = jitterDelay(2000, cfg, () => 0.5);
    expect(out).toBeGreaterThanOrEqual(1400);
    expect(out).toBeLessThanOrEqual(2600);
  });

  it('clamps at minimum of 0', () => {
    expect(jitterDelay(0, cfg, () => 0)).toBe(0);
  });

  it('rng=0 produces minimum delay, rng=1 produces maximum', () => {
    expect(jitterDelay(2000, cfg, () => 0)).toBe(1400);
    expect(jitterDelay(2000, cfg, () => 1)).toBe(2600);
  });
});
