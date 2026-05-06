/**
 * Bracket — pure-helper module.
 *
 * A bracket pairs a take-profit and a stop-loss on a held position. Like
 * OCO, it's composite: registering expands into two children (TP + SL)
 * with `parentId` set; the first to fire marks the parent `fired` and
 * cancels the sibling.
 *
 * Composite expansion lives in `src/watcher.ts` (see
 * `Watcher.expandComposite`). The TP child uses `params.takeProfitCents`,
 * the SL child uses `params.stopLossCents`; both inherit `positionSize`
 * from the parent.
 *
 * The evaluator is a no-op because brackets fire by child propagation,
 * not direct evaluation.
 */
import type { Evaluator } from './types.js';

export const evalBracket: Evaluator = () => ({ fire: false });
