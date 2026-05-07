/**
 * attribution.test.ts — P&L decomposition model (spec §4).
 *
 * For each scenario, asserts:
 *   entryEdge + exitEdge + marketDrift + slippage + triggerQuality + residual === realizedPnL
 *   (within 1¢ = $0.01 tolerance).
 */

import { describe, it, expect } from 'vitest';
import { attribute } from '../../src/edge/attribution.js';
import type { Fire } from '../../src/types.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFire(overrides: Partial<Fire>): Fire {
  return {
    fireId: 'test-fire',
    jobId: 'test-job',
    strategy: 'S1',
    ticker: 'KXNFL-WC',
    marketCategory: 'nfl',
    side: 'yes',
    entryFills: [],
    exitFills: [],
    unresolved: false,
    ...overrides,
  };
}

const TOLERANCE = 0.01; // $0.01

function assertComponents(fire: Fire): void {
  const c = attribute(fire);
  const componentSum =
    c.entryEdgeDollars +
    c.exitEdgeDollars +
    c.marketDriftDollars +
    c.slippageDollars +
    c.triggerQualityDollars +
    c.residualDollars;
  expect(Math.abs(componentSum - c.realizedPnLDollars)).toBeLessThan(TOLERANCE);
}

// ── Scenario 1: Clean win ─────────────────────────────────────────────────────

describe('attribution — clean win', () => {
  const fire = makeFire({
    entryFills: [{ priceCents: 40, size: 10, ts: 't1' }],
    exitFills:  [{ priceCents: 70, size: 10, ts: 't2' }],
    arrivalMidCents: 42,
    decisionMidCents: 42,
    exitDecisionMidCents: 68,
    resolutionPriceCents: 100,
    unresolved: false,
  });

  it('components sum to realizedPnL within 1¢', () => {
    assertComponents(fire);
  });

  it('entryEdge is positive (filled below mid)', () => {
    const c = attribute(fire);
    // (42 − 40) × 10 / 100 = $0.20
    expect(c.entryEdgeDollars).toBeCloseTo(0.20, 2);
  });

  it('realizedPnL reflects exit proceeds − entry outlay + resolution tail', () => {
    const c = attribute(fire);
    // exitProceeds = 70×10 = 700¢; entryOutlay = 40×10 = 400¢; remaining = 0; pnl = 300¢ = $3.00
    expect(c.realizedPnLDollars).toBeCloseTo(3.00, 2);
  });
});

// ── Scenario 2: Clean loss ────────────────────────────────────────────────────

describe('attribution — clean loss', () => {
  const fire = makeFire({
    entryFills: [{ priceCents: 70, size: 20, ts: 't1' }],
    exitFills:  [{ priceCents: 30, size: 20, ts: 't2' }],
    arrivalMidCents: 72,
    decisionMidCents: 72,
    exitDecisionMidCents: 28,
    resolutionPriceCents: 0,
    unresolved: false,
  });

  it('components sum to realizedPnL within 1¢', () => {
    assertComponents(fire);
  });

  it('realizedPnL is negative for a losing trade', () => {
    const c = attribute(fire);
    // exit 30×20 − entry 70×20 = 600−1400 = −800¢ = −$8.00; no remaining
    expect(c.realizedPnLDollars).toBeCloseTo(-8.00, 2);
  });
});

// ── Scenario 3: Drift-dominated ───────────────────────────────────────────────

describe('attribution — drift-dominated', () => {
  // Entry at mid, exit at mid, but market moved a lot
  const fire = makeFire({
    entryFills: [{ priceCents: 50, size: 5, ts: 't1' }],
    exitFills:  [{ priceCents: 80, size: 5, ts: 't2' }],
    arrivalMidCents: 50,     // exactly mid → entryEdge = 0
    decisionMidCents: 50,
    exitDecisionMidCents: 80,
    resolutionPriceCents: 100,
    unresolved: false,
  });

  it('components sum to realizedPnL within 1¢', () => {
    assertComponents(fire);
  });

  it('marketDrift is large positive', () => {
    const c = attribute(fire);
    // (80 − 50) × 5 / 100 = $1.50
    expect(c.marketDriftDollars).toBeCloseTo(1.50, 2);
  });

  it('entryEdge is zero (filled exactly at mid)', () => {
    const c = attribute(fire);
    expect(c.entryEdgeDollars).toBeCloseTo(0, 5);
  });
});

// ── Scenario 4: Trigger fired too early ──────────────────────────────────────

describe('attribution — trigger fired too early', () => {
  const fire = makeFire({
    entryFills: [{ priceCents: 55, size: 8, ts: 't1' }],
    exitFills:  [{ priceCents: 60, size: 8, ts: 't2' }],
    arrivalMidCents: 57,
    decisionMidCents: 57,
    exitDecisionMidCents: 60,
    resolutionPriceCents: 100,
    triggerArmedAt: '2026-01-01T00:00:00Z',
    triggerKind: 'take_profit',
    peakBidCents: 80,  // market peaked at 80¢ but we exited at 60¢
    unresolved: false,
  });

  it('components sum to realizedPnL within 1¢', () => {
    assertComponents(fire);
  });

  it('triggerQuality is negative (exited below peak)', () => {
    const c = attribute(fire);
    // (60 − 80) × 8 / 100 = −$1.60
    expect(c.triggerQualityDollars).toBeCloseTo(-1.60, 2);
  });
});

// ── Scenario 5: Multi-chunk entry + TCA slippage ─────────────────────────────

describe('attribution — multi-chunk with slippage', () => {
  const fire = makeFire({
    entryFills: [
      { priceCents: 50, size: 5, ts: 't1' },
      { priceCents: 52, size: 5, ts: 't2' },
    ],
    exitFills: [
      { priceCents: 75, size: 5, ts: 't3' },
      { priceCents: 78, size: 5, ts: 't4' },
    ],
    arrivalMidCents: 51,
    decisionMidCents: 51,
    exitDecisionMidCents: 76,
    resolutionPriceCents: 100,
    slippageCents: 40,  // 40 cent×contracts total TCA slippage pre-computed
    unresolved: false,
  });

  it('components sum to realizedPnL within 1¢', () => {
    assertComponents(fire);
  });

  it('slippage component matches pre-computed value', () => {
    const c = attribute(fire);
    // 40¢·contracts / 100 = $0.40
    expect(c.slippageDollars).toBeCloseTo(0.40, 5);
  });
});

// ── Scenario 6: Unresolved (mark-to-mid) ─────────────────────────────────────

describe('attribution — unresolved fire', () => {
  const fire = makeFire({
    entryFills: [{ priceCents: 45, size: 10, ts: 't1' }],
    exitFills:  [{ priceCents: 60, size: 5, ts: 't2' }],
    arrivalMidCents: 46,
    decisionMidCents: 46,
    exitDecisionMidCents: 59,
    unresolved: true,
    // no resolutionPriceCents
  });

  it('components sum to realizedPnL within 1¢', () => {
    assertComponents(fire);
  });

  it('marks fire as unresolved', () => {
    expect(fire.unresolved).toBe(true);
  });
});
