import type { Synthetic, Orderbook, SyntheticEvalResult, TakeProfitParams, TakeProfitState } from '../types.js';
import type { Evaluator } from './types.js';

export const evalTakeProfit: Evaluator = (s: Synthetic, book: Orderbook): SyntheticEvalResult => {
  const params = s.params as TakeProfitParams;

  const topBid: number =
    s.side === 'yes'
      ? (book.yes[0]?.priceCents ?? 0)
      : (book.no[0]?.priceCents ?? 0);

  // ── Single-trigger mode ────────────────────────────────────────────
  if (params.triggerPriceCents !== undefined && !params.rungs) {
    const trigger = params.triggerPriceCents;
    const distance = trigger - topBid; // positive when below trigger

    if (topBid >= trigger) {
      return {
        fire: true,
        reason: 'take_profit_rung_0_fired',
        unregister: true,
        distanceCentsToTrigger: distance,
      };
    }
    return {
      fire: false,
      distanceCentsToTrigger: distance,
    };
  }

  // ── Multi-rung mode ────────────────────────────────────────────────
  if (params.rungs && params.rungs.length > 0) {
    const rungs = params.rungs;
    const prevState = s.state as (TakeProfitState | Record<string, never>);
    const firedRungIndices: number[] =
      'firedRungIndices' in prevState ? [...prevState.firedRungIndices] : [];

    // Pre-tick: all rungs already fired
    if (firedRungIndices.length >= rungs.length) {
      return { fire: false, unregister: true };
    }

    // Find smallest-index unfired rung that topBid has reached
    let firedIdx: number | null = null;
    for (let i = 0; i < rungs.length; i++) {
      if (!firedRungIndices.includes(i) && topBid >= rungs[i].priceCents) {
        firedIdx = i;
        break;
      }
    }

    if (firedIdx === null) {
      // No rung triggered — compute distance to nearest unfired rung
      const nearestUnfired = rungs.find((_, i) => !firedRungIndices.includes(i));
      const distance = nearestUnfired ? nearestUnfired.priceCents - topBid : Infinity;
      return {
        fire: false,
        newState: { firedRungIndices },
        distanceCentsToTrigger: distance,
      };
    }

    const newFired = [...firedRungIndices, firedIdx];
    const allFired = newFired.length >= rungs.length;

    return {
      fire: true,
      reason: `take_profit_rung_${firedIdx}_fired`,
      newState: { firedRungIndices: newFired },
      unregister: allFired ? true : undefined,
      distanceCentsToTrigger: rungs[firedIdx].priceCents - topBid,
    };
  }

  // Fallback — no valid params
  return { fire: false };
};
