import type { Evaluator } from './types.js';
import type { StopLimitParams } from '../types.js';

/**
 * Stop-limit evaluator.
 *
 * Fires when topBid ≤ triggerPriceCents (same condition as stop-loss).
 * On fire the watcher reads `reason` verbatim to post a passive GTC limit
 * at limitPriceCents for `size` contracts.
 *
 * reason format: stop_limit_triggered:limit=<limitPriceCents>,size=<size>
 */
export const evalStopLimit: Evaluator = (s, book) => {
  const params = s.params as StopLimitParams;
  const { triggerPriceCents, limitPriceCents, size } = params;

  const topBid: number =
    s.side === 'yes'
      ? (book.yes[0]?.priceCents ?? 0)
      : (book.no[0]?.priceCents ?? 0);

  const distanceCentsToTrigger = topBid - triggerPriceCents;

  if (topBid <= triggerPriceCents) {
    return {
      fire: true,
      reason: `stop_limit_triggered:limit=${limitPriceCents},size=${size}`,
      distanceCentsToTrigger,
      triggerKind: 'stop_limit',
    };
  }

  return {
    fire: false,
    distanceCentsToTrigger,
  };
};
