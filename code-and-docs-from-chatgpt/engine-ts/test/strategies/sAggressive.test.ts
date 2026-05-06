/**
 * sAggressive.test.ts — TDD suite for buildSAggressiveOpts preset.
 *
 * 4 cases:
 *  1. Happy path — returns validated opts unchanged
 *  2. Missing ticker → throws
 *  3. size <= 0 → throws
 *  4. confirmedAggressive=false → throws
 */

import { describe, it, expect } from 'vitest';
import { buildSAggressiveOpts } from '../../src/strategies/sAggressive.js';
import type { SAggressiveOpts } from '../../src/strategies/sAggressive.js';

const VALID_OPTS: SAggressiveOpts = {
  ticker: 'TICKER-YES',
  side: 'yes',
  action: 'sell',
  size: 10,
  confirmedAggressive: true,
};

describe('buildSAggressiveOpts — happy path', () => {
  it('returns a copy of opts when all fields are valid', () => {
    const result = buildSAggressiveOpts(VALID_OPTS);
    expect(result).toEqual(VALID_OPTS);
    expect(result).not.toBe(VALID_OPTS); // defensive copy via spread
  });

  it('passes through optional oneTickIn=true', () => {
    const opts: SAggressiveOpts = { ...VALID_OPTS, oneTickIn: true };
    const result = buildSAggressiveOpts(opts);
    expect(result.oneTickIn).toBe(true);
  });
});

describe('buildSAggressiveOpts — validation errors', () => {
  it('throws when ticker is empty string', () => {
    expect(() =>
      buildSAggressiveOpts({ ...VALID_OPTS, ticker: '' }),
    ).toThrow('S-aggressive: ticker required');
  });

  it('throws when size is 0', () => {
    expect(() =>
      buildSAggressiveOpts({ ...VALID_OPTS, size: 0 }),
    ).toThrow('S-aggressive: size must be > 0');
  });

  it('throws when size is negative', () => {
    expect(() =>
      buildSAggressiveOpts({ ...VALID_OPTS, size: -1 }),
    ).toThrow('S-aggressive: size must be > 0');
  });

  it('throws when confirmedAggressive is false', () => {
    expect(() =>
      buildSAggressiveOpts({ ...VALID_OPTS, confirmedAggressive: false }),
    ).toThrow('S-aggressive: confirmation required (confirmedAggressive=true)');
  });
});
