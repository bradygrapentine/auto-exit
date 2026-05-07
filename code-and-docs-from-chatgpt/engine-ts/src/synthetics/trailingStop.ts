import type { Evaluator } from './types.js';
import type { TrailingStopParams, TrailingStopState } from '../types.js';

/**
 * Trailing-stop evaluator.
 *
 * State: { peakBidCentsExact: number }
 * Empty {} on first call → peakBidCentsExact initializes to current top-of-side bid.
 *
 * Per tick:
 *   peak = max(state.peakBidCentsExact ?? topBid, topBid)
 *   stop = max(peak - trailCents, floorPriceCents ?? 1)
 *   fire  ← topBid ≤ stop
 *   newState = { peakBidCentsExact: peak }
 *   distanceCentsToTrigger = topBid - stop
 */
export const evalTrailingStop: Evaluator = (s, book) => {
  const params = s.params as TrailingStopParams;
  const { trailCents, floorPriceCents } = params;
  const floor = floorPriceCents ?? 1;

  // Pick top-of-side price (float cents).
  const levels = s.side === 'yes' ? book.yes : book.no;
  const topBid: number = levels.length > 0 ? levels[0].priceCents : 0;

  // Resolve peak — empty state initializes from current bid.
  const prevState = s.state as Partial<TrailingStopState>;
  const currentPeak = prevState.peakBidCentsExact ?? topBid;
  const peak = Math.max(currentPeak, topBid);

  // Stop price: trail below peak, clamped to floor.
  const stop = Math.max(peak - trailCents, floor);

  const fire = topBid <= stop;
  const distance = topBid - stop;

  return {
    fire,
    reason: fire ? 'trailing_stop_breached' : undefined,
    newState: { peakBidCentsExact: peak } satisfies TrailingStopState,
    distanceCentsToTrigger: distance,
    ...(fire ? { peakBidCents: peak, triggerKind: 'trailing_stop' } : {}),
  };
};
