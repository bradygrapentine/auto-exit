/**
 * stealth.ts — S4 stealth core: jittered IoC chunk helpers.
 *
 * Re-exports jitter helpers + provides the buildS4OrderPayload helper used
 * by StealthRunner. No resting orders — every chunk is immediate_or_cancel.
 *
 * Pricing convention (no orderbook read):
 *   sell YES → use top yes-bid (we lift the best available bid)
 *   buy  YES → use 100 − top no-bid (we cross at best available ask)
 *   sell NO  → use top no-bid
 *   buy  NO  → use 100 − top yes-bid
 *
 * For S4 we don't fetch the orderbook at all; the caller specifies an explicit
 * priceCents (crossable mid-or-better).  This file simply encapsulates the
 * OrderPayload construction so StealthRunner stays readable.
 */

import { centsFloatToDollarString } from './pricing.js';
import type { OrderPayload, Side } from './types.js';

export { jitterChunkSize, jitterDelay } from './jitter.js';

export interface StealthOrderOpts {
  ticker: string;
  action: 'buy' | 'sell';
  side: Side;
  count: number;
  /** Integer cents 1..99. Converted to yes_price_dollars / no_price_dollars. */
  priceCents: number;
  clientOrderId: string;
}

/** Build an IoC limit order payload. Never GTC — always immediate_or_cancel. */
export function buildS4OrderPayload(opts: StealthOrderOpts): OrderPayload {
  const payload: OrderPayload = {
    ticker: opts.ticker,
    action: opts.action,
    side: opts.side,
    count: opts.count,
    type: 'limit',
    reduce_only: false,
    time_in_force: 'immediate_or_cancel',
    client_order_id: opts.clientOrderId,
  };

  const priceDollars = centsFloatToDollarString(opts.priceCents);
  if (opts.side === 'yes') {
    payload.yes_price_dollars = priceDollars;
  } else {
    payload.no_price_dollars = priceDollars;
  }

  return payload;
}
