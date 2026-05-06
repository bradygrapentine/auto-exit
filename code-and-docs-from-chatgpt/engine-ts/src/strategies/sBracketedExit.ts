/**
 * S-bracketed-exit — strategy preset wrapping the bracket synthetic.
 *
 * Thin builder: produces a `RegisterArgs` for `Watcher.register()`. Calling code
 * (CLI subcommand `kea strategy s-bracketed-exit`, MCP tool `kea_strategy_s_bracketed_exit`)
 * passes the result through to the watcher singleton.
 */
import type { RegisterArgs } from '../synthetics/types.js';
import type { Side, BracketParams } from '../types.js';

export interface SBracketedExitOpts {
  ticker: string;
  side: Side;
  positionSize: number;
  takeProfitCents: number;
  stopLossCents: number;
  autoCancelOnZeroPosition?: boolean;
}

export function buildSBracketedExitArgs(opts: SBracketedExitOpts): RegisterArgs {
  if (!opts.ticker) throw new Error('S-bracketed-exit: ticker required');
  if (opts.positionSize <= 0) throw new Error('S-bracketed-exit: positionSize must be > 0');
  if (opts.takeProfitCents <= 0) throw new Error('S-bracketed-exit: takeProfitCents must be > 0');
  if (opts.stopLossCents <= 0) throw new Error('S-bracketed-exit: stopLossCents must be > 0');
  if (opts.takeProfitCents <= opts.stopLossCents) {
    throw new Error('S-bracketed-exit: takeProfitCents must be > stopLossCents');
  }

  const params: BracketParams = {
    takeProfitCents: opts.takeProfitCents,
    stopLossCents: opts.stopLossCents,
  };

  return {
    kind: 'bracket',
    ticker: opts.ticker,
    side: opts.side,
    positionSize: opts.positionSize,
    params,
    autoCancelOnZeroPosition: opts.autoCancelOnZeroPosition,
  };
}
