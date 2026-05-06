/**
 * S-trail — strategy preset wrapping the trailing_stop synthetic.
 *
 * Thin builder: produces a `RegisterArgs` for `Watcher.register()`. Calling code
 * (CLI subcommand `kea strategy s-trail`, MCP tool `kea_strategy_s_trail`)
 * passes the result through to the watcher singleton.
 */
import type { RegisterArgs } from '../synthetics/types.js';
import type { Side, TrailingStopParams } from '../types.js';

export interface STrailOpts {
  ticker: string;
  side: Side;
  positionSize: number;
  trailCents: number;
  floorPriceCents?: number;
  autoCancelOnZeroPosition?: boolean;
}

export function buildSTrailArgs(opts: STrailOpts): RegisterArgs {
  if (!opts.ticker) throw new Error('S-trail: ticker required');
  if (opts.positionSize <= 0) throw new Error('S-trail: positionSize must be > 0');
  if (opts.trailCents <= 0) throw new Error('S-trail: trailCents must be > 0');

  const params: TrailingStopParams = {
    trailCents: opts.trailCents,
    ...(opts.floorPriceCents !== undefined ? { floorPriceCents: opts.floorPriceCents } : {}),
  };

  return {
    kind: 'trailing_stop',
    ticker: opts.ticker,
    side: opts.side,
    positionSize: opts.positionSize,
    params,
    autoCancelOnZeroPosition: opts.autoCancelOnZeroPosition,
  };
}
