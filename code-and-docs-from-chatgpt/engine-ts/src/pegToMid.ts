/**
 * Peg-to-mid pricing helper for S1 passive. Computes a quote relative to
 * the current orderbook midpoint and an offset. Returns null when the book
 * is one-sided (can't compute mid without both bid and ask).
 *
 * Sell-side: floor(mid − offset), clamped to floor.
 * Buy-side:  ceil(mid + offset).
 *
 * Note: Kalshi books store yes-side bids and no-side bids; the implied
 * yes-side ask = 100 - top_no_bid. Midpoint computed against
 * (top_yes_bid + yes_ask) / 2.
 */
import type { Orderbook } from './types.js';

export interface PegConfig {
  offsetCents: number;
  floorPriceCents: number;
}

export function computePeggedPrice(
  action: 'sell' | 'buy',
  book: Orderbook,
  offsetCents: number,
  floorPriceCents: number,
): number | null {
  const yesBid = book.yes[0]?.priceCents;
  const noBid = book.no[0]?.priceCents;
  if (yesBid === undefined || noBid === undefined) return null;

  const yesAsk = 100 - noBid;
  const mid = (yesBid + yesAsk) / 2;

  if (action === 'sell') {
    return Math.max(Math.floor(mid - offsetCents), floorPriceCents);
  } else {
    return Math.ceil(mid + offsetCents);
  }
}

export function shouldRepostPeg(computed: number, currentResting: number | null): boolean {
  return currentResting === null || computed !== currentResting;
}
