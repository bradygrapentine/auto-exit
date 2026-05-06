import type { Synthetic, Orderbook, SyntheticEvalResult, SyntheticKind } from '../types.js';
import type { EvaluatorMap, Evaluator } from './types.js';

const noop: Evaluator = () => ({ fire: false });

export const evaluators: EvaluatorMap = {
  stop_loss: noop,
  stop_limit: noop,
  trailing_stop: noop,
  take_profit: noop,
  oco: noop,
  bracket: noop,
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
