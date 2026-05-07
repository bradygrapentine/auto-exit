/**
 * strategyRecommender.ts — compose EV + Kelly into ranked strategy recommendations.
 *
 * No I/O, no side effects. Agent supplies all market state via inputs.
 * Sits alongside harvestPlanner.ts as part of the SH-RECOMMENDER stack.
 *
 * Ranking metric: evDollars × sqrt(sizeDollars)
 *   — rewards both positive EV and size (Kelly-justified sizing).
 *   Larger size with same EV wins; same size with larger EV wins.
 */

import { computeDecisionEV, type DecisionContext, type DecisionAction } from './decisionEv.js';
import { computeKellySize, type KellyContext } from './kellySizer.js';

/** Optional SH-EDGE prior data — degrades gracefully when absent. */
export type EdgeDataSummary = {
  edgeProbabilityOverride?: number; // if present, use instead of KellyContext.edgeProbability
  historicalAccuracy?: number;      // informational; unused in ranking math v1
  sampleCount?: number;             // informational
};

export type RecommendContext = DecisionContext &
  KellyContext & {
    availableStrategies: string[];  // names from current S library
    edgeData?: EdgeDataSummary;     // optional SH-EDGE prior
  };

export type Recommendation = {
  rank: number;
  strategy: string;
  sizeDollars: number;
  evDollars: number;
  rationale: string;
};

/** Map from strategy name to a canonical DecisionAction. */
const STRATEGY_TO_ACTION: Record<string, DecisionAction> = {
  's-passive':         'exit-passive',
  's-aggressive':      'exit-aggressive',
  'exit-passive':      'exit-passive',
  'exit-aggressive':   'exit-aggressive',
  's-scale-50':        'scale-out-50',
  's-scale-25':        'scale-out-25',
  'scale-out-50':      'scale-out-50',
  'scale-out-25':      'scale-out-25',
  'hold':              'hold',
  'enter-yes':         'enter-yes',
  'enter-no':          'enter-no',
  'no-action':         'no-action',
};

const MAX_RECOMMENDATIONS = 3;

/**
 * Recommend up to 3 strategies ranked by `evDollars × sqrt(sizeDollars)`.
 *
 * If edgeData.edgeProbabilityOverride is present it takes precedence over
 * ctx.edgeProbability when computing Kelly size — SH-EDGE integration hook.
 *
 * When no available strategies produce positive EV, returns empty
 * recommendations with `noRecommendation` reason.
 */
export function recommendStrategies(ctx: RecommendContext): {
  recommendations: Recommendation[];
  noRecommendation?: string;
} {
  const { availableStrategies, edgeData } = ctx;

  if (availableStrategies.length === 0) {
    return {
      recommendations: [],
      noRecommendation: 'no available strategies provided',
    };
  }

  // Resolve effective edge probability
  const effectiveEdgeP =
    edgeData?.edgeProbabilityOverride !== undefined
      ? edgeData.edgeProbabilityOverride
      : ctx.edgeProbability;

  const kellyCtx: KellyContext = {
    edgeProbability: effectiveEdgeP,
    marketProbability: ctx.marketProbability,
    bankrollDollars: ctx.bankrollDollars,
    fractionalKelly: ctx.fractionalKelly,
    maxPositionDollars: ctx.maxPositionDollars,
  };

  const droppedStrategies: string[] = [];
  const candidates: Array<{
    strategy: string;
    action: DecisionAction;
    evDollars: number;
    sizeDollars: number;
    rationale: string;
    score: number;
  }> = [];

  for (const strategy of availableStrategies) {
    const action = STRATEGY_TO_ACTION[strategy];
    if (action === undefined) {
      // Unknown strategy — skip silently, note it
      droppedStrategies.push(strategy);
      continue;
    }

    // Compute EV
    let evResult: { evDollars: number; rationale: string };
    try {
      evResult = computeDecisionEV(ctx, action);
    } catch {
      // Position required but not supplied, or other validation error
      droppedStrategies.push(strategy);
      continue;
    }

    // Skip non-positive EV strategies
    if (evResult.evDollars <= 0) {
      continue;
    }

    // Compute Kelly size
    let sizeDollars: number;
    try {
      const kellyResult = computeKellySize(kellyCtx);
      sizeDollars = kellyResult.recommendedDollars;
    } catch {
      sizeDollars = 0;
    }

    // Ranking score = EV × sqrt(size); size=0 treated as size=1 to keep EV-positive
    // strategies in the ranking even when Kelly recommends 0 (e.g. pure hold).
    const effectiveSize = Math.max(sizeDollars, 1);
    const score = evResult.evDollars * Math.sqrt(effectiveSize);

    candidates.push({
      strategy,
      action,
      evDollars: evResult.evDollars,
      sizeDollars,
      rationale: evResult.rationale,
      score,
    });
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, MAX_RECOMMENDATIONS);

  const recommendations: Recommendation[] = top.map((c, i) => ({
    rank: i + 1,
    strategy: c.strategy,
    sizeDollars: c.sizeDollars,
    evDollars: c.evDollars,
    rationale: c.rationale,
  }));

  const noRecommendation = buildNoRecommendation(
    recommendations,
    droppedStrategies,
    availableStrategies,
    effectiveEdgeP,
    ctx.marketProbability,
  );

  return { recommendations, noRecommendation };
}

function buildNoRecommendation(
  recommendations: Recommendation[],
  droppedStrategies: string[],
  availableStrategies: string[],
  edgeP: number,
  marketP: number,
): string | undefined {
  const parts: string[] = [];

  if (recommendations.length === 0) {
    if (edgeP <= marketP) {
      parts.push(`negative edge (edgeP=${edgeP.toFixed(3)} ≤ marketP=${marketP.toFixed(3)}): all actions EV-negative`);
    } else {
      parts.push('no positive-EV options found among available strategies');
    }
  }

  if (droppedStrategies.length > 0) {
    parts.push(`dropped ${droppedStrategies.length} unknown strategies: ${droppedStrategies.join(', ')}`);
  }

  // Warn when all strategies are unknown
  if (droppedStrategies.length === availableStrategies.length && droppedStrategies.length > 0) {
    parts.push('all provided strategies are unknown; check strategy names against S library');
  }

  return parts.length > 0 ? parts.join('; ') : undefined;
}
