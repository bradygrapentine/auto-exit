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

    const prevState = s.state as (TakeProfitState | Record<string, never>);
    const wasArmed = 'armed' in prevState ? (prevState.armed ?? false) : false;

    // Arm when price dips below trigger
    const nowArmed = wasArmed || topBid < trigger;

    if (nowArmed && topBid >= trigger) {
      return {
        fire: true,
        reason: 'take_profit_rung_0_fired',
        unregister: true,
        distanceCentsToTrigger: distance,
        triggerKind: 'take_profit',
      };
    }
    return {
      fire: false,
      newState: { firedRungIndices: [], armed: nowArmed },
      distanceCentsToTrigger: distance,
    };
  }

  // ── Multi-rung mode ────────────────────────────────────────────────
  if (params.rungs && params.rungs.length > 0) {
    const rungs = params.rungs;
    const prevState = s.state as (TakeProfitState | Record<string, never>);
    const firedRungIndices: number[] =
      'firedRungIndices' in prevState ? [...prevState.firedRungIndices] : [];
    const wasArmed = 'armed' in prevState ? (prevState.armed ?? false) : false;

    // Pre-tick: all rungs already fired
    if (firedRungIndices.length >= rungs.length) {
      return { fire: false, unregister: true };
    }

    // Once any rung has previously fired, the synthetic is inherently armed —
    // it had to cross upward to fire the first rung. Only the very first
    // evaluation (no rungs fired, no armed state) requires the arming check.
    const nextUnfiredRung = rungs.find((_, i) => !firedRungIndices.includes(i));
    const alreadyFiredSome = firedRungIndices.length > 0;
    const nowArmed = alreadyFiredSome || wasArmed || (nextUnfiredRung !== undefined && topBid < nextUnfiredRung.priceCents);

    // Find smallest-index unfired rung that topBid has reached (only if armed)
    let firedIdx: number | null = null;
    if (nowArmed) {
      for (let i = 0; i < rungs.length; i++) {
        if (!firedRungIndices.includes(i) && topBid >= rungs[i].priceCents) {
          firedIdx = i;
          break;
        }
      }
    }

    if (firedIdx === null) {
      // No rung triggered — compute distance to nearest unfired rung
      const distance = nextUnfiredRung ? nextUnfiredRung.priceCents - topBid : Infinity;
      return {
        fire: false,
        newState: { firedRungIndices, armed: nowArmed },
        distanceCentsToTrigger: distance,
      };
    }

    const newFired = [...firedRungIndices, firedIdx];
    const allFired = newFired.length >= rungs.length;

    return {
      fire: true,
      reason: `take_profit_rung_${firedIdx}_fired`,
      newState: { firedRungIndices: newFired, armed: nowArmed },
      unregister: allFired ? true : undefined,
      distanceCentsToTrigger: rungs[firedIdx].priceCents - topBid,
      triggerKind: 'take_profit',
    };
  }

  // Fallback — no valid params
  return { fire: false };
};
