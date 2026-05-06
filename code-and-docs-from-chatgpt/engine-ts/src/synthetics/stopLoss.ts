import type { Synthetic, Orderbook, SyntheticEvalResult } from '../types.js';
import type { Evaluator } from './types.js';
import type { StopLossParams } from '../types.js';

/**
 * Stop-loss evaluator.
 *
 * Fires when the top bid on the synthetic's side falls at or below
 * `triggerPriceCents`.  Empty book → topBid treated as 0.
 *
 * distanceCentsToTrigger = topBid - triggerPriceCents
 *   positive → price is above trigger (safe)
 *   zero     → touching trigger (fires)
 *   negative → price has breached trigger (fires)
 */
export const evalStopLoss: Evaluator = (
  s: Synthetic,
  book: Orderbook,
): SyntheticEvalResult => {
  const params = s.params as StopLossParams;
  const { triggerPriceCents } = params;

  const topBid: number =
    s.side === 'yes'
      ? (book.yes[0]?.priceCents ?? 0)
      : (book.no[0]?.priceCents ?? 0);

  const distanceCentsToTrigger = topBid - triggerPriceCents;
  const fire = topBid <= triggerPriceCents;

  if (!fire) {
    return { fire: false, distanceCentsToTrigger };
  }

  return {
    fire: true,
    reason: 'stop_loss_breached',
    distanceCentsToTrigger,
  };
};
