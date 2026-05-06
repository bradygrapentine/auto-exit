/**
 * stealth.test.ts — unit tests for src/stealth.ts helpers.
 *
 * Tests buildS4OrderPayload and re-exported jitter helpers.
 */

import { describe, it, expect } from 'vitest';
import { buildS4OrderPayload } from '../src/stealth.js';
import { jitterChunkSize, jitterDelay } from '../src/stealth.js';

describe('buildS4OrderPayload', () => {
  it('always sets time_in_force to immediate_or_cancel', () => {
    const p = buildS4OrderPayload({
      ticker: 'T',
      action: 'sell',
      side: 'yes',
      count: 10,
      priceCents: 65,
      clientOrderId: 'cid-1',
    });
    expect(p.time_in_force).toBe('immediate_or_cancel');
  });

  it('sets yes_price_dollars for side=yes', () => {
    const p = buildS4OrderPayload({
      ticker: 'T',
      action: 'sell',
      side: 'yes',
      count: 5,
      priceCents: 70,
      clientOrderId: 'cid-2',
    });
    expect(p.yes_price_dollars).toBeDefined();
    expect(p.no_price_dollars).toBeUndefined();
  });

  it('sets no_price_dollars for side=no', () => {
    const p = buildS4OrderPayload({
      ticker: 'T',
      action: 'sell',
      side: 'no',
      count: 5,
      priceCents: 30,
      clientOrderId: 'cid-3',
    });
    expect(p.no_price_dollars).toBeDefined();
    expect(p.yes_price_dollars).toBeUndefined();
  });

  it('sets correct count, ticker, action, side', () => {
    const p = buildS4OrderPayload({
      ticker: 'XYZ',
      action: 'buy',
      side: 'no',
      count: 42,
      priceCents: 40,
      clientOrderId: 'cid-4',
    });
    expect(p.count).toBe(42);
    expect(p.ticker).toBe('XYZ');
    expect(p.action).toBe('buy');
    expect(p.side).toBe('no');
    expect(p.type).toBe('limit');
  });

  it('sets reduce_only=false', () => {
    const p = buildS4OrderPayload({
      ticker: 'T',
      action: 'sell',
      side: 'yes',
      count: 1,
      priceCents: 50,
      clientOrderId: 'cid-5',
    });
    expect(p.reduce_only).toBe(false);
  });
});

describe('jitter re-exports from stealth.ts', () => {
  it('jitterChunkSize returns base when pct=0', () => {
    expect(jitterChunkSize(100, { chunkSizePct: 0, loopDelayPct: 0 })).toBe(100);
  });

  it('jitterDelay returns base when pct=0', () => {
    expect(jitterDelay(5000, { chunkSizePct: 0, loopDelayPct: 0 })).toBe(5000);
  });

  it('jitterChunkSize respects injected rng', () => {
    // rng always returns 1 → signed = 1 → factor = 1 + 1*0.5 = 1.5 → 150
    const result = jitterChunkSize(100, { chunkSizePct: 0.5, loopDelayPct: 0 }, () => 1);
    expect(result).toBe(150);
  });

  it('jitterDelay respects injected rng', () => {
    // rng always returns 0 → signed = -1 → factor = 1 - 1*0.3 = 0.7 → 700
    const result = jitterDelay(1000, { chunkSizePct: 0, loopDelayPct: 0.3 }, () => 0);
    expect(result).toBe(700);
  });
});
