import type { Evaluator } from './types.js';
import type { StepTrailParams, StepTrailState } from '../types.js';

/**
 * Step-trail evaluator — discretized variant of trailing-stop.
 *
 * State: { peakBidCentsExact: number }. Empty {} initializes peak to current top bid.
 *
 * Per tick:
 *   peak unchanged unless topBid > peak + stepCents → peak = topBid (one-step jump)
 *   stop = max(peak − trailCents, floorPriceCents ?? 1)
 *   fire ← topBid ≤ stop
 *   newState = { peakBidCentsExact: peak }
 *   distanceCentsToTrigger = topBid − stop
 *
 * Smoother than continuous-peak trailing on noisy books — small upticks within
 * the step window don't ratchet the stop higher, avoiding premature exits on
 * normal market noise.
 */
export const evalStepTrail: Evaluator = (s, book) => {
  const params = s.params as StepTrailParams;
  const { trailCents, stepCents, floorPriceCents } = params;
  const floor = floorPriceCents ?? 1;

  const levels = s.side === 'yes' ? book.yes : book.no;
  const topBid: number = levels.length > 0 ? levels[0].priceCents : 0;

  const prevState = s.state as Partial<StepTrailState>;
  const currentPeak = prevState.peakBidCentsExact ?? topBid;
  const peak = topBid > currentPeak + stepCents ? topBid : currentPeak;

  const stop = Math.max(peak - trailCents, floor);
  const fire = topBid <= stop;

  return {
    fire,
    reason: fire ? 'step_trail_breached' : undefined,
    newState: { peakBidCentsExact: peak } satisfies StepTrailState,
    distanceCentsToTrigger: topBid - stop,
  };
};
