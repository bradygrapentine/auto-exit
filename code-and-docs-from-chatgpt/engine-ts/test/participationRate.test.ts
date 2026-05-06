import { describe, it, expect } from 'vitest';
import {
  computeAllowedSharesPerMinute,
  computePaceDelayMs,
  type PovConfig,
} from '../src/participationRate.js';

describe('computeAllowedSharesPerMinute', () => {
  it('returns floor(rate × recentVolumePerMinute)', () => {
    expect(computeAllowedSharesPerMinute(0.25, 400)).toBe(100);
    expect(computeAllowedSharesPerMinute(0.10, 999)).toBe(99);
  });

  it('returns 0 when recent volume is 0', () => {
    expect(computeAllowedSharesPerMinute(0.25, 0)).toBe(0);
  });

  it('returns Infinity when rate is 0 (disabled)', () => {
    expect(computeAllowedSharesPerMinute(0, 400)).toBe(Infinity);
  });
});

describe('computePaceDelayMs', () => {
  const cfg: PovConfig = {
    maxParticipationRate: 0.25,
    recentMinuteVolume: 400,
  };

  it('returns the configured base delay when pace target not exceeded', () => {
    expect(computePaceDelayMs(50, cfg, 1_000)).toBe(1_000);
  });

  it('returns base delay when at exactly the allowed pace', () => {
    expect(computePaceDelayMs(100, cfg, 1_000)).toBe(1_000);
  });

  it('extends delay proportionally when overshooting allowed pace', () => {
    expect(computePaceDelayMs(200, cfg, 1_000)).toBe(2_000);
  });

  it('returns the base delay when participation rate is 0 (disabled)', () => {
    expect(computePaceDelayMs(10_000, { ...cfg, maxParticipationRate: 0 }, 1_000)).toBe(1_000);
  });

  it('caps at 10× base delay to prevent permanent stalls', () => {
    expect(computePaceDelayMs(1_000_000, cfg, 1_000)).toBeLessThanOrEqual(10_000);
    expect(computePaceDelayMs(1_000_000, cfg, 1_000)).toBe(10_000);
  });

  it('handles zero recent volume without divide-by-zero', () => {
    const zeroVol = { ...cfg, recentMinuteVolume: 0 };
    expect(computePaceDelayMs(50, zeroVol, 1_000)).toBe(10_000);
  });
});
