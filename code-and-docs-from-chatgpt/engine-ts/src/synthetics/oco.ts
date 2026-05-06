/**
 * OCO (One-Cancels-the-Other) — pure-helper module.
 *
 * OCO is a *composite* synthetic: registering one expands into two child
 * synthetics with `parentId` set. The first child to fire marks the parent
 * `fired` and cancels its sibling — all in the same tick.
 *
 * Composite expansion lives in `src/watcher.ts` (see `Watcher.expandComposite`
 * and `Watcher.tick`'s `parentFiredThisTick` race-safe guard). This module
 * exists so callers can `import { evalOco } from './synthetics/oco.js'` if
 * they want to reference the kind by file. The actual evaluator is a no-op
 * because OCO never fires directly — it fires by child propagation.
 *
 * Same-tick double-cross safety: the watcher processes armed synthetics in
 * registration order. When child A fires, the watcher records its parent
 * in `parentFiredThisTick` and cancels child B's siblings *immediately*. If
 * child B were also crossable in the same tick, the watcher's per-iteration
 * check `if (s.parentId && parentFiredThisTick.has(s.parentId)) continue`
 * skips its evaluation — guaranteeing exactly one child fires per OCO.
 */
import type { Evaluator } from './types.js';

export const evalOco: Evaluator = () => ({ fire: false });
