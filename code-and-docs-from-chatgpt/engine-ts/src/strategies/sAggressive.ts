/**
 * S-aggressive — strategy preset wrapping AggressiveRunner.
 *
 * Distinct from synthetic kinds (no Watcher polling); this is a one-shot run.
 *
 * Returns a validated `AggressiveConfig` that callers pass directly to
 * `AggressiveRunner`. The CLI/MCP/HTTP layers wrap this in their own
 * confirmation prompts.
 */

import type { Side } from '../types.js';

export interface SAggressiveOpts {
  ticker: string;
  side: Side;
  action: 'buy' | 'sell';
  size: number;
  confirmedAggressive: boolean;
  oneTickIn?: boolean;
}

export function buildSAggressiveOpts(opts: SAggressiveOpts): SAggressiveOpts {
  if (!opts.ticker) throw new Error('S-aggressive: ticker required');
  if (opts.size <= 0) throw new Error('S-aggressive: size must be > 0');
  if (!opts.confirmedAggressive)
    throw new Error('S-aggressive: confirmation required (confirmedAggressive=true)');
  return { ...opts };
}
