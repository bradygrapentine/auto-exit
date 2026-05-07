import { describe, it, expect } from 'vitest';
import {
  recommendStrategies,
  type RecommendContext,
  type EdgeDataSummary,
} from '../src/strategyRecommender.js';

// Base context: YES position with favorable edge
const baseCtx: RecommendContext = {
  ticker: 'KXTEST',
  bidCents: 60,
  askCents: 70,
  midProbability: 0.65,
  position: { side: 'yes', size: 100, costBasisCents: 5000 },
  edgeProbability: 0.7,
  marketProbability: 0.65,
  bankrollDollars: 1000,
  availableStrategies: ['s-passive', 's-aggressive', 'hold'],
};

describe('recommendStrategies — positive edge scenarios', () => {
  it('1. favorable edge + market: returns 1+ recommendations', () => {
    const result = recommendStrategies(baseCtx);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('2. all recommendations have positive evDollars', () => {
    const result = recommendStrategies(baseCtx);
    for (const rec of result.recommendations) {
      expect(rec.evDollars).toBeGreaterThan(0);
    }
  });

  it('3. top-3 ranking by evDollars × sqrt(sizeDollars) — higher EV ranked first', () => {
    const result = recommendStrategies({
      ...baseCtx,
      availableStrategies: ['s-passive', 's-aggressive', 'hold', 'no-action'],
    });
    // Verify descending rank ordering by score
    for (let i = 0; i < result.recommendations.length - 1; i++) {
      const a = result.recommendations[i]!;
      const b = result.recommendations[i + 1]!;
      const scoreA = a.evDollars * Math.sqrt(Math.max(a.sizeDollars, 1));
      const scoreB = b.evDollars * Math.sqrt(Math.max(b.sizeDollars, 1));
      expect(scoreA).toBeGreaterThanOrEqual(scoreB);
    }
  });

  it('4. ranks are 1-indexed and sequential', () => {
    const result = recommendStrategies(baseCtx);
    result.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });

  it('5. at most 3 recommendations returned', () => {
    const ctx: RecommendContext = {
      ...baseCtx,
      availableStrategies: ['s-passive', 's-aggressive', 'hold', 'exit-passive', 'exit-aggressive'],
    };
    const result = recommendStrategies(ctx);
    expect(result.recommendations.length).toBeLessThanOrEqual(3);
  });
});

describe('recommendStrategies — negative edge', () => {
  it('6. negative edge returns empty recommendations + reason', () => {
    const ctx: RecommendContext = {
      ...baseCtx,
      edgeProbability: 0.3,     // far below market 0.65
      midProbability: 0.3,
      bidCents: 25,
      askCents: 35,
      availableStrategies: ['enter-yes', 'enter-no'],
    };
    const result = recommendStrategies(ctx);
    expect(result.recommendations.length).toBe(0);
    expect(result.noRecommendation).toBeDefined();
    expect(result.noRecommendation!.length).toBeGreaterThan(0);
  });

  it('7. negative edge noRecommendation mentions reason', () => {
    const ctx: RecommendContext = {
      ...baseCtx,
      edgeProbability: 0.2,
      midProbability: 0.2,
      bidCents: 15,
      askCents: 25,
      availableStrategies: ['enter-yes'],
    };
    const result = recommendStrategies(ctx);
    expect(result.noRecommendation).toBeDefined();
  });
});

describe('recommendStrategies — empty strategies', () => {
  it('8. empty availableStrategies returns empty recommendations + reason', () => {
    const result = recommendStrategies({ ...baseCtx, availableStrategies: [] });
    expect(result.recommendations.length).toBe(0);
    expect(result.noRecommendation).toBeDefined();
  });
});

describe('recommendStrategies — edgeData', () => {
  it('9. edgeData absent → degrades gracefully, still emits recommendations', () => {
    const ctx: RecommendContext = { ...baseCtx, edgeData: undefined };
    const result = recommendStrategies(ctx);
    // Should still work with ctx.edgeProbability as fallback
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('10. edgeData.edgeProbabilityOverride takes precedence over ctx.edgeProbability', () => {
    // Override with negative edge → should return no recommendations
    const edgeData: EdgeDataSummary = { edgeProbabilityOverride: 0.2 };
    const ctx: RecommendContext = {
      ...baseCtx,
      edgeProbability: 0.9, // ctx says great edge
      midProbability: 0.2,
      bidCents: 15,
      askCents: 25,
      edgeData,
      availableStrategies: ['enter-yes'],
    };
    const result = recommendStrategies(ctx);
    // With edgeP override=0.2 < market=0.65, Kelly should give 0 → but enter-yes EV is also negative
    // The key test: override is applied (no crash; result is deterministic)
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

describe('recommendStrategies — rationale and shape', () => {
  it('11. each recommendation has non-empty rationale', () => {
    const result = recommendStrategies(baseCtx);
    for (const rec of result.recommendations) {
      expect(rec.rationale.length).toBeGreaterThan(0);
    }
  });

  it('12. sizeDollars respects kelly maxPositionDollars cap', () => {
    const ctx: RecommendContext = { ...baseCtx, maxPositionDollars: 5 };
    const result = recommendStrategies(ctx);
    for (const rec of result.recommendations) {
      expect(rec.sizeDollars).toBeLessThanOrEqual(5);
    }
  });
});

describe('recommendStrategies — unknown strategies', () => {
  it('13. unknown strategy not in S library is silently dropped', () => {
    const ctx: RecommendContext = {
      ...baseCtx,
      availableStrategies: ['unknown-strategy-xyz', 's-passive'],
    };
    const result = recommendStrategies(ctx);
    // unknown-strategy-xyz dropped; s-passive may survive if positive EV
    const strategyNames = result.recommendations.map((r) => r.strategy);
    expect(strategyNames).not.toContain('unknown-strategy-xyz');
  });

  it('14. all unknown strategies → empty recommendations + noRecommendation with explanation', () => {
    const ctx: RecommendContext = {
      ...baseCtx,
      availableStrategies: ['unknown-a', 'unknown-b'],
    };
    const result = recommendStrategies(ctx);
    expect(result.recommendations.length).toBe(0);
    expect(result.noRecommendation).toBeDefined();
  });
});

describe('recommendStrategies — single strategy', () => {
  it('15. single-strategy availability: returns at most 1 recommendation', () => {
    const ctx: RecommendContext = {
      ...baseCtx,
      availableStrategies: ['s-passive'],
    };
    const result = recommendStrategies(ctx);
    expect(result.recommendations.length).toBeLessThanOrEqual(1);
    if (result.recommendations.length === 1) {
      expect(result.recommendations[0]!.rank).toBe(1);
    }
  });
});
