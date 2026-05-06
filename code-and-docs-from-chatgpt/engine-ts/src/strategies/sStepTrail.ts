/**
 * S-step-trail — strategy preset wrapping the step_trail synthetic.
 *
 * Thin builder: produces a `RegisterArgs` for `Watcher.register()`. Calling code
 * (CLI subcommand `kea strategy s-step-trail`, MCP tool `kea_strategy_s_step_trail`)
 * passes the result through to the watcher singleton.
 */
import type { RegisterArgs } from '../synthetics/types.js';
import type { Side, StepTrailParams } from '../types.js';

export interface SStepTrailOpts {
  ticker: string;
  side: Side;
  positionSize: number;
  trailCents: number;
  stepCents: number;
  floorPriceCents?: number;
  autoCancelOnZeroPosition?: boolean;
}

export function buildSStepTrailArgs(opts: SStepTrailOpts): RegisterArgs {
  if (!opts.ticker) throw new Error('S-step-trail: ticker required');
  if (opts.positionSize <= 0) throw new Error('S-step-trail: positionSize must be > 0');
  if (opts.trailCents <= 0) throw new Error('S-step-trail: trailCents must be > 0');
  if (opts.stepCents <= 0) throw new Error('S-step-trail: stepCents must be > 0');

  const params: StepTrailParams = {
    trailCents: opts.trailCents,
    stepCents: opts.stepCents,
    ...(opts.floorPriceCents !== undefined ? { floorPriceCents: opts.floorPriceCents } : {}),
  };

  return {
    kind: 'step_trail',
    ticker: opts.ticker,
    side: opts.side,
    positionSize: opts.positionSize,
    params,
    autoCancelOnZeroPosition: opts.autoCancelOnZeroPosition,
  };
}
