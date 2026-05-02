import { describe, it, expect } from 'vitest';
import { computeProgress, formatElapsed } from '../../../extension/popup/ProgressBar';

describe('computeProgress', () => {
  it('returns 0 when filled is 0', () => {
    expect(computeProgress(0, 1000)).toBe(0);
  });

  it('returns 50 at half filled', () => {
    expect(computeProgress(500, 1000)).toBe(50);
  });

  it('returns 100 when fully filled', () => {
    expect(computeProgress(1000, 1000)).toBe(100);
  });

  it('clamps to 100 when filled exceeds total', () => {
    expect(computeProgress(1050, 1000)).toBe(100);
  });

  it('returns 0 when total is 0', () => {
    expect(computeProgress(0, 0)).toBe(0);
  });
});

describe('formatElapsed', () => {
  it('returns 0s for sub-second input', () => {
    expect(formatElapsed(999)).toBe('0s');
  });

  it('returns 1s for exactly 1000ms', () => {
    expect(formatElapsed(1000)).toBe('1s');
  });

  it('returns 1m 5s for 65000ms', () => {
    expect(formatElapsed(65000)).toBe('1m 5s');
  });

  it('returns 60m 0s for 3600000ms', () => {
    expect(formatElapsed(3600000)).toBe('60m 0s');
  });
});
