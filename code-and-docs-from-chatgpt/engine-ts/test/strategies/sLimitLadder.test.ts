/**
 * sLimitLadder.test.ts — TDD suite for buildSLimitLadderArgs (S8 preset).
 */

import { describe, it, expect } from 'vitest';
import { buildSLimitLadderArgs } from '../../src/strategies/sLimitLadder.js';

const BASE_OPTS = {
  ticker: 'TEST-TICKER',
  side: 'yes' as const,
  action: 'sell' as const,
  totalSize: 100,
  rungs: [
    { priceCents: 60, sizePct: 50 },
    { priceCents: 70, sizePct: 50 },
  ],
};

// ── Happy path ────────────────────────────────────────────────────────────────

describe('buildSLimitLadderArgs — happy path', () => {
  it('returns a valid S8Config for well-formed opts', () => {
    const config = buildSLimitLadderArgs(BASE_OPTS);

    expect(config.ticker).toBe('TEST-TICKER');
    expect(config.side).toBe('yes');
    expect(config.action).toBe('sell');
    expect(config.totalSize).toBe(100);
    expect(config.rungs).toEqual(BASE_OPTS.rungs);
  });

  it('passes through optional jobId and keaHome', () => {
    const config = buildSLimitLadderArgs({
      ...BASE_OPTS,
      jobId: 'my-job',
      keaHome: '/tmp/kea',
    });

    expect(config.jobId).toBe('my-job');
    expect(config.keaHome).toBe('/tmp/kea');
  });

  it('accepts action=buy', () => {
    const config = buildSLimitLadderArgs({ ...BASE_OPTS, action: 'buy' });
    expect(config.action).toBe('buy');
  });

  it('accepts side=no', () => {
    const config = buildSLimitLadderArgs({ ...BASE_OPTS, side: 'no' });
    expect(config.side).toBe('no');
  });

  it('accepts sum(sizePct) < 100 (partial ladder)', () => {
    const config = buildSLimitLadderArgs({
      ...BASE_OPTS,
      rungs: [{ priceCents: 60, sizePct: 40 }],
    });
    expect(config.rungs).toHaveLength(1);
  });
});

// ── Validation errors ─────────────────────────────────────────────────────────

describe('buildSLimitLadderArgs — validation errors', () => {
  it('throws on empty ticker', () => {
    expect(() => buildSLimitLadderArgs({ ...BASE_OPTS, ticker: '' }))
      .toThrow(/ticker/);
  });

  it('throws on totalSize <= 0', () => {
    expect(() => buildSLimitLadderArgs({ ...BASE_OPTS, totalSize: 0 }))
      .toThrow(/totalSize/);
  });

  it('throws on invalid action', () => {
    expect(() => buildSLimitLadderArgs({ ...BASE_OPTS, action: 'hold' as 'buy' }))
      .toThrow(/action/);
  });

  it('throws on empty rungs array', () => {
    expect(() => buildSLimitLadderArgs({ ...BASE_OPTS, rungs: [] }))
      .toThrow(/rungs/);
  });

  it('throws on non-positive priceCents', () => {
    expect(() => buildSLimitLadderArgs({
      ...BASE_OPTS,
      rungs: [{ priceCents: 0, sizePct: 100 }],
    })).toThrow(/priceCents/);
  });

  it('throws on non-positive sizePct', () => {
    expect(() => buildSLimitLadderArgs({
      ...BASE_OPTS,
      rungs: [{ priceCents: 60, sizePct: 0 }],
    })).toThrow(/sizePct/);
  });

  it('throws when sum(sizePct) > 100', () => {
    expect(() => buildSLimitLadderArgs({
      ...BASE_OPTS,
      rungs: [
        { priceCents: 50, sizePct: 60 },
        { priceCents: 70, sizePct: 50 },
      ],
    })).toThrow(/sum\(sizePct\)/);
  });
});
