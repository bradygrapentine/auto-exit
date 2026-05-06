import type { Synthetic, Orderbook, SyntheticEvalResult, SyntheticKind } from '../types.js';
import type { EvaluatorMap, Evaluator } from './types.js';
import { evalStopLoss } from './stopLoss.js';
import { evalStopLimit } from './stopLimit.js';
import { evalTrailingStop } from './trailingStop.js';
import { evalTakeProfit } from './takeProfit.js';

const noop: Evaluator = () => ({ fire: false });

export const evaluators: EvaluatorMap = {
  stop_loss: evalStopLoss,
  stop_limit: evalStopLimit,
  trailing_stop: evalTrailingStop,
  take_profit: evalTakeProfit,
  oco: noop,    // composite — fires by child propagation in Watcher
  bracket: noop,
  time_stop: noop,    // wired by Phase 5 batch 5a
  step_trail: noop,   // wired by Phase 5 batch 5b track G
};

export function evaluate(s: Synthetic, book: Orderbook, now: Date = new Date()): SyntheticEvalResult {
  const ev = evaluators[s.kind];
  if (!ev) throw new Error(`No evaluator for synthetic kind: ${s.kind}`);
  return ev(s, book, now);
}

export function registerEvaluator(kind: SyntheticKind, ev: Evaluator): void {
  evaluators[kind] = ev;
}

const COMPOSITE_KINDS = new Set<SyntheticKind>(['oco', 'bracket']);
export function isComposite(kind: SyntheticKind): boolean {
  return COMPOSITE_KINDS.has(kind);
}
