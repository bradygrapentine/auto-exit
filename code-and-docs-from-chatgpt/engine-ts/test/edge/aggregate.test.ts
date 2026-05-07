/**
 * aggregate.test.ts — groupByStrategy, groupByMarket, triggerHistogram, paramSensitivity.
 */

import { describe, it, expect } from 'vitest';
import {
  groupByStrategy,
  groupByMarket,
  triggerHistogram,
  paramSensitivity,
} from '../../src/edge/aggregate.js';
import type { Fire } from '../../src/types.js';

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeFire(
  overrides: Partial<Fire> & { strategy: string; ticker: string },
): Fire {
  return {
    fireId: `fire-${Math.random().toString(36).slice(2)}`,
    jobId: `job-${Math.random().toString(36).slice(2)}`,
    strategy: overrides.strategy,
    ticker: overrides.ticker,
    marketCategory: overrides.marketCategory ?? 'other',
    side: 'yes',
    entryFills: [{ priceCents: 40, size: 10, ts: 't1' }],
    exitFills: [{ priceCents: 70, size: 10, ts: 't2' }],
    arrivalMidCents: 42,
    decisionMidCents: 42,
    exitDecisionMidCents: 68,
    resolutionPriceCents: 100,
    unresolved: false,
    ...overrides,
  };
}

// 10-fire fixture: 3 strategies, 3 market categories, 4 triggered
const FIRES: Fire[] = [
  // S1 — nfl (3 fires)
  makeFire({ strategy: 'S1', ticker: 'KXNFL-WC',   marketCategory: 'nfl' }),
  makeFire({ strategy: 'S1', ticker: 'KXNFL-SB',   marketCategory: 'nfl' }),
  makeFire({ strategy: 'S1', ticker: 'KXNFL-MVP',  marketCategory: 'nfl' }),
  // S2 — political (4 fires)
  makeFire({ strategy: 'S2', ticker: 'KXPRES-D',   marketCategory: 'political' }),
  makeFire({ strategy: 'S2', ticker: 'KXPRES-R',   marketCategory: 'political' }),
  makeFire({ strategy: 'S2', ticker: 'KXSEN-GA',   marketCategory: 'political' }),
  makeFire({ strategy: 'S2', ticker: 'KXHOUSE-CA', marketCategory: 'political' }),
  // S3 — entertainment (3 fires, with triggers)
  makeFire({
    strategy: 'S3', ticker: 'KXOSCAR-BP', marketCategory: 'entertainment',
    triggerArmedAt: 't0', triggerKind: 'trailing_stop', peakBidCents: 72,
  }),
  makeFire({
    strategy: 'S3', ticker: 'KXEMMY-BD',  marketCategory: 'entertainment',
    triggerArmedAt: 't0', triggerKind: 'trailing_stop', peakBidCents: 72,
    triggerParams: { trailCents: 5 },
  }),
  makeFire({
    strategy: 'S3', ticker: 'KXMETGALA',  marketCategory: 'entertainment',
    triggerArmedAt: 't0', triggerKind: 'trailing_stop', peakBidCents: 68,
    triggerParams: { trailCents: 8 },
    exitFills: [{ priceCents: 68, size: 10, ts: 't3' }], // on-time
  }),
];

// ── groupByStrategy ────────────────────────────────────────────────────────────

describe('groupByStrategy', () => {
  it('returns 3 groups', () => {
    const groups = groupByStrategy(FIRES);
    expect(groups).toHaveLength(3);
  });

  it('groups are sorted alphabetically', () => {
    const groups = groupByStrategy(FIRES);
    expect(groups.map((g) => g.strategy)).toEqual(['S1', 'S2', 'S3']);
  });

  it('S1 has 3 fires', () => {
    const groups = groupByStrategy(FIRES);
    const s1 = groups.find((g) => g.strategy === 'S1')!;
    expect(s1.fires).toHaveLength(3);
  });

  it('S2 has 4 fires', () => {
    const groups = groupByStrategy(FIRES);
    const s2 = groups.find((g) => g.strategy === 'S2')!;
    expect(s2.fires).toHaveLength(4);
  });

  it('summed attribution realizedPnL matches sum of individual fires', () => {
    const groups = groupByStrategy(FIRES);
    for (const g of groups) {
      const total = g.attribution.realizedPnLDollars;
      expect(total).toBeCloseTo(g.totalRealizedPnLDollars, 5);
    }
  });
});

// ── groupByMarket ──────────────────────────────────────────────────────────────

describe('groupByMarket', () => {
  it('returns 3 market groups', () => {
    const groups = groupByMarket(FIRES);
    expect(groups).toHaveLength(3);
  });

  it('nfl group has 3 fires', () => {
    const groups = groupByMarket(FIRES);
    const nfl = groups.find((g) => g.category === 'nfl')!;
    expect(nfl.fires).toHaveLength(3);
  });

  it('political group has 4 fires', () => {
    const groups = groupByMarket(FIRES);
    const pol = groups.find((g) => g.category === 'political')!;
    expect(pol.fires).toHaveLength(4);
  });

  it('entertainment group has 3 fires', () => {
    const groups = groupByMarket(FIRES);
    const ent = groups.find((g) => g.category === 'entertainment')!;
    expect(ent.fires).toHaveLength(3);
  });
});

// ── triggerHistogram ───────────────────────────────────────────────────────────

describe('triggerHistogram', () => {
  it('only counts fires with triggerArmedAt', () => {
    const hist = triggerHistogram(FIRES);
    const total = hist.reduce((s, h) => s + h.totalFires, 0);
    expect(total).toBe(3);  // only S3 fires have triggers
  });

  it('trailing_stop bucket exists', () => {
    const hist = triggerHistogram(FIRES);
    const trail = hist.find((h) => h.triggerKind === 'trailing_stop');
    expect(trail).toBeDefined();
    expect(trail!.totalFires).toBe(3);
  });

  it('bins sum to totalFires', () => {
    const hist = triggerHistogram(FIRES);
    for (const h of hist) {
      expect(h.tooEarly + h.onTime + h.tooLate).toBe(h.totalFires);
    }
  });
});

// ── paramSensitivity ───────────────────────────────────────────────────────────

describe('paramSensitivity', () => {
  it('returns rows for trailCents', () => {
    const ps = paramSensitivity(FIRES, 'trailCents');
    // Only 2 fires have triggerParams.trailCents (5 and 8)
    expect(ps.paramName).toBe('trailCents');
    expect(ps.rows).toHaveLength(2);
  });

  it('rows are sorted by paramValue ascending', () => {
    const ps = paramSensitivity(FIRES, 'trailCents');
    expect(ps.rows[0]!.paramValue).toBe(5);
    expect(ps.rows[1]!.paramValue).toBe(8);
  });

  it('returns empty rows for absent param', () => {
    const ps = paramSensitivity(FIRES, 'nonExistentParam');
    expect(ps.rows).toHaveLength(0);
  });
});
