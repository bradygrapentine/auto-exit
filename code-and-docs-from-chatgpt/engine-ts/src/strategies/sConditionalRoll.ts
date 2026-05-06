/**
 * S-conditional-roll — strategy preset wrapping an OCO (one-cancels-other) composite
 * of time_stop + take_profit synthetics.
 *
 * Thin builder: produces a `RegisterArgs` for `Watcher.register()`. Calling code
 * (CLI subcommand `kea strategy s-conditional-roll`, MCP tool `kea_strategy_s_conditional_roll`)
 * passes the result through to the watcher singleton.
 *
 * TODO: when S11 Roll lands in the strategy library, this preset should chain into S11
 * (sell current contract → open the same thesis on next cycle's contract). For now this
 * is a pure exit composite: if take_profit fires, the position is closed at TP; if
 * time_stop fires, the position is closed at deadline. No actual roll until S11 exists.
 */
import type { RegisterArgs } from '../synthetics/types.js';
import type {
  Side, OcoParams, TimeStopParams, TakeProfitParams, SyntheticDescriptor,
} from '../types.js';

export interface SConditionalRollOpts {
  ticker: string;
  side: Side;
  positionSize: number;
  /** ISO 8601 deadline — time_stop leg fires when wall-clock passes this. */
  deadlineTimestamp: string;
  /** time_stop only exits if top-bid is below this (cents). Acts as a soft SL-equivalent. */
  exitIfBelowCents: number;
  /** take_profit fires when top-bid reaches this price (cents). Must be > exitIfBelowCents. */
  takeProfitCents: number;
  autoCancelOnZeroPosition?: boolean;
}

export function buildSConditionalRollArgs(opts: SConditionalRollOpts): RegisterArgs {
  if (!opts.ticker) {
    throw new Error('S-conditional-roll: ticker required');
  }
  if (opts.positionSize <= 0) {
    throw new Error('S-conditional-roll: positionSize must be > 0');
  }
  if (opts.takeProfitCents <= 0) {
    throw new Error('S-conditional-roll: takeProfitCents must be > 0');
  }
  if (opts.exitIfBelowCents <= 0) {
    throw new Error('S-conditional-roll: exitIfBelowCents must be > 0');
  }
  if (opts.takeProfitCents <= opts.exitIfBelowCents) {
    throw new Error(
      'S-conditional-roll: takeProfitCents must be > exitIfBelowCents (TP must be above SL-equivalent)',
    );
  }
  const deadline = new Date(opts.deadlineTimestamp);
  if (isNaN(deadline.getTime())) {
    throw new Error(
      `S-conditional-roll: deadlineTimestamp is not a valid date: "${opts.deadlineTimestamp}"`,
    );
  }

  const timeStopLeg: SyntheticDescriptor = {
    kind: 'time_stop',
    params: {
      deadlineTimestamp: opts.deadlineTimestamp,
      exitIfBelowCents: opts.exitIfBelowCents,
    } as TimeStopParams,
  };

  const takeProfitLeg: SyntheticDescriptor = {
    kind: 'take_profit',
    params: {
      triggerPriceCents: opts.takeProfitCents,
    } as TakeProfitParams,
  };

  const ocoParams: OcoParams = {
    legs: [timeStopLeg, takeProfitLeg],
  };

  return {
    kind: 'oco',
    ticker: opts.ticker,
    side: opts.side,
    positionSize: opts.positionSize,
    params: ocoParams,
    autoCancelOnZeroPosition: opts.autoCancelOnZeroPosition,
  };
}
