import type { Synthetic, Orderbook, SyntheticEvalResult } from '../types.js';
import type { Evaluator } from './types.js';
import type { TimeStopParams } from '../types.js';

/**
 * Time-stop evaluator.
 *
 * Fires when `now >= deadlineTimestamp` AND the optional price gate is met.
 *
 * Price gate (exitIfBelowCents):
 *   - Unset  → fires purely on deadline.
 *   - Set    → fires only when BOTH deadline has passed AND topBid < exitIfBelowCents.
 *              If the deadline has passed but topBid >= exitIfBelowCents the order waits
 *              (price hasn't dropped into the exit zone yet).
 *
 * distanceCentsToTrigger:
 *   - When exitIfBelowCents is set and not yet firing: Math.max(0, exitIfBelowCents - topBid).
 *   - Omitted when the trigger is purely time-driven (no price gate).
 *
 * Fires once — returns unregister: true so the watcher removes the synthetic.
 */
export const evalTimeStop: Evaluator = (
  s: Synthetic,
  book: Orderbook,
  now?: Date,
): SyntheticEvalResult => {
  const params = s.params as TimeStopParams;
  const { deadlineTimestamp, exitIfBelowCents } = params;

  const currentTime = now ?? new Date();
  const deadline = new Date(deadlineTimestamp);

  const topBid: number =
    s.side === 'yes'
      ? (book.yes[0]?.priceCents ?? 0)
      : (book.no[0]?.priceCents ?? 0);

  const deadlinePassed = currentTime >= deadline;

  // Price gate: if exitIfBelowCents is set, topBid must be below it to fire.
  const priceGateMet =
    exitIfBelowCents === undefined || topBid < exitIfBelowCents;

  if (deadlinePassed && priceGateMet) {
    return {
      fire: true,
      reason: 'time_stop_breached',
      unregister: true,
    };
  }

  // Not firing — compute distance if price gate is set.
  if (exitIfBelowCents !== undefined) {
    const distanceCentsToTrigger = Math.max(0, exitIfBelowCents - topBid);
    return { fire: false, distanceCentsToTrigger };
  }

  return { fire: false };
};
