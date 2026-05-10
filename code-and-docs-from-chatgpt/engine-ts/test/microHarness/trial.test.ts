/**
 * trial.test.ts — SH-MICRO-EXECUTION-LOOP §3.1
 */

import { describe, it, expect } from 'vitest';
import {
  gateTrial,
  isTickerAllowlisted,
  newTrialId,
  tickerMatches,
} from '../../src/microHarness/trial.js';
import type { MicroTrialConfig } from '../../src/microHarness/trial.js';
import type { MicroHarnessSafety } from '../../src/types.js';

const SAFETY: MicroHarnessSafety = {
  perTrialCapDollars: 1.00,
  dailyAggregateCapDollars: 2.50,
  tickerAllowlist: ['KXBTC*', 'KXETH-25*', 'KXNFL-EXACT'],
};

function trial(overrides: Partial<MicroTrialConfig> = {}): MicroTrialConfig {
  return {
    trialId: 'test-1',
    ticker: 'KXBTC-26MAY09',
    side: 'yes',
    strategy: 's-passive',
    maxNotionalDollars: 0.50,
    params: {},
    intent: 'validation smoke',
    ...overrides,
  };
}

describe('tickerMatches — glob', () => {
  it('exact match', () => {
    expect(tickerMatches('KXBTC-26', 'KXBTC-26')).toBe(true);
  });
  it('wildcard prefix', () => {
    expect(tickerMatches('KXBTC-26MAY09', 'KXBTC*')).toBe(true);
  });
  it('wildcard middle', () => {
    expect(tickerMatches('KXETH-25APR-YES', 'KXETH-25*')).toBe(true);
  });
  it('no match', () => {
    expect(tickerMatches('KXNFL-1', 'KXBTC*')).toBe(false);
  });
  it('escapes regex metacharacters in non-wildcard parts', () => {
    expect(tickerMatches('KX.A', 'KX.A')).toBe(true);
    expect(tickerMatches('KXAA', 'KX.A')).toBe(false);
  });
});

describe('isTickerAllowlisted', () => {
  it('matches first pattern', () => {
    expect(isTickerAllowlisted('KXBTC-26', SAFETY.tickerAllowlist)).toBe(true);
  });
  it('matches second pattern', () => {
    expect(isTickerAllowlisted('KXETH-25APR21', SAFETY.tickerAllowlist)).toBe(true);
  });
  it('rejects non-allowlisted', () => {
    expect(isTickerAllowlisted('KXMOVVA-26', SAFETY.tickerAllowlist)).toBe(false);
  });
  it('empty allowlist rejects everything', () => {
    expect(isTickerAllowlisted('KXBTC-26', [])).toBe(false);
  });
});

describe('gateTrial', () => {
  it('rejects when microHarness section is missing', () => {
    const result = gateTrial(trial(), undefined, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('no_micro_safety_config');
  });

  it('rejects when notional exceeds per-trial cap', () => {
    const result = gateTrial(trial({ maxNotionalDollars: 1.50 }), SAFETY, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('per_trial_cap_exceeded');
  });

  it('rejects when daily aggregate cap would be exceeded', () => {
    // Already spent $2.00 today; this $0.75 trial pushes to $2.75 > $2.50.
    const result = gateTrial(trial({ maxNotionalDollars: 0.75 }), SAFETY, 2.00);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('daily_aggregate_cap_exceeded');
  });

  it('rejects when ticker not in allowlist', () => {
    const result = gateTrial(trial({ ticker: 'KXMOVVA-26' }), SAFETY, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('ticker_not_allowlisted');
  });

  it('rejects negative notional', () => {
    const result = gateTrial(trial({ maxNotionalDollars: -1 }), SAFETY, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_notional');
  });

  it('accepts when within all caps and allowlisted', () => {
    const result = gateTrial(trial({ maxNotionalDollars: 0.50 }), SAFETY, 1.00);
    expect(result.ok).toBe(true);
  });

  it('accepts at exact per-trial cap boundary', () => {
    const result = gateTrial(trial({ maxNotionalDollars: 1.00 }), SAFETY, 0);
    expect(result.ok).toBe(true);
  });

  it('accepts at exact daily-aggregate cap boundary', () => {
    // Spent $1.50 + this $1.00 = $2.50 = exact cap → accepted.
    const result = gateTrial(trial({ maxNotionalDollars: 1.00 }), SAFETY, 1.50);
    expect(result.ok).toBe(true);
  });
});

describe('newTrialId', () => {
  it('starts with `micro-` and contains the timestamp', () => {
    const fixed = new Date('2026-05-09T12:00:00.000Z');
    const id = newTrialId(() => fixed);
    expect(id).toMatch(/^micro-2026-05-09T12-00-00-000Z-[a-z0-9]{6}$/);
  });
  it('produces distinct ids on rapid calls', () => {
    const a = newTrialId();
    const b = newTrialId();
    expect(a).not.toBe(b);
  });
});
