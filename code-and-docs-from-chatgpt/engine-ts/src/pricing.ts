import crypto from 'node:crypto';
import type { ExitConfig, Orderbook, OrderPayload, PriceDecision, PriceLevel } from './types.js';

export function normalizeLevels(levels: PriceLevel[], minLevelSize: number): PriceLevel[] {
  return levels
    .filter((level) => Number.isFinite(level.priceCents) && Number.isFinite(level.size))
    // priceCents may be sub-cent float (e.g. 0.9 from 0.0090 dollars). Allow >0 through 99 inclusive.
    .filter((level) => level.priceCents > 0 && level.priceCents <= 99)
    .filter((level) => level.size >= minLevelSize)
    .sort((a, b) => b.priceCents - a.priceCents);
}

/** Format float cents as a 4-decimal dollar string ("0.0090"). Kalshi accepts up to 6 decimals. */
export function centsFloatToDollarString(priceCentsFloat: number): string {
  return (priceCentsFloat / 100).toFixed(4);
}

/** One tick below `cents`, clamped to `floorCents`. Kalshi uses 0.1¢ ticks below 10¢ and 1¢ ticks
 *  at/above 10¢. Used by the tail-GTC undercut logic — we post one tick under our side's ask. */
export function oneTickBelowCents(cents: number, floorCents: number): number {
  const tick = cents <= 10 ? 0.1 : 1;
  return Math.max(cents - tick, floorCents);
}

export interface PriceSelection {
  priceCents: number;            // floor of priceCentsExact, integer for log/display
  priceCentsExact: number;       // float, e.g. 0.9
  priceDollars: string;          // "0.0090"
  cumulativeSizeAtPrice: number;
  reason: string;
}

export function selectExecutablePrice(
  rawLevels: PriceLevel[],
  desiredChunk: number,
  floorPriceCents: number,
  minLevelSize: number,
): PriceSelection {
  const levels = normalizeLevels(rawLevels, minLevelSize);
  let cumulative = 0;

  for (const level of levels) {
    cumulative += level.size;
    if (cumulative >= desiredChunk) {
      const exact = Math.max(level.priceCents, floorPriceCents);
      return {
        priceCents: Math.floor(exact),
        priceCentsExact: exact,
        priceDollars: centsFloatToDollarString(exact),
        cumulativeSizeAtPrice: cumulative,
        reason: 'full_depth_cumulative_price',
      };
    }
  }

  return {
    priceCents: floorPriceCents,
    priceCentsExact: floorPriceCents,
    priceDollars: centsFloatToDollarString(floorPriceCents),
    cumulativeSizeAtPrice: cumulative,
    reason: 'fallback_floor_price_insufficient_depth',
  };
}

/** True when the top of book is thin AND the next level is a real cliff (≥ 2 deci-cent ticks
 *  below). In that shape, fixed chunkSize would sweep through the cliff and take a worse blended
 *  price, so we shrink the chunk to fit the top level. Fat tops or shallow cliffs see no benefit
 *  from adaptive sizing — selectExecutablePrice already prices each chunk at the level needed. */
function shouldAutoAdapt(levels: PriceLevel[], chunkSize: number): boolean {
  const top = levels[0];
  if (!top) return false;
  if (top.size >= 5 * chunkSize) return false; // fat top — fixed chunk fits comfortably
  const next = levels[1];
  if (!next) return false;                     // single-level book — no cliff to dodge
  return top.priceCents - next.priceCents >= 0.2; // ≥ 2 deci-cent ticks gap
}

export function chooseChunkSize(remaining: number, config: ExitConfig, rawLevels: PriceLevel[]): number {
  const fixed = Math.min(config.chunkSize, remaining);
  if (remaining <= config.tailSweepThreshold) return remaining;
  // Explicit opt-out: caller pinned the strategy to fixed. Skip the heuristic.
  if (config.mildAdaptive === false) return fixed;

  const levels = normalizeLevels(rawLevels, config.minLevelSize);
  if (levels.length === 0) return fixed;

  // mildAdaptive === true forces adaptive; undefined runs the auto heuristic.
  const useAdaptive = config.mildAdaptive === true || shouldAutoAdapt(levels, config.chunkSize);
  if (!useAdaptive) return fixed;

  const adaptive = Math.floor(levels[0].size * 0.8);
  const bounded = Math.max(config.minAdaptiveChunk, Math.min(config.chunkSize, adaptive));
  return Math.min(remaining, bounded);
}

export function decideLosingExitOrder(orderbook: Orderbook, remainingPosition: number, config: ExitConfig): PriceDecision {
  // To exit a YES long we sell into existing YES BIDS. To exit a NO long we sell into existing NO BIDS.
  // Kalshi does NOT cross-match SELL orders against opposite-side bids — only BUYS do that to mint a
  // fresh pair. So we only consult the same-side bids.
  const sideLevels = config.heldSide === 'yes' ? orderbook.yes : orderbook.no;
  const chunkSize = chooseChunkSize(remainingPosition, config, sideLevels);

  if (remainingPosition <= config.tailSweepThreshold) {
    return {
      chunkSize,
      priceCents: config.floorPriceCents,
      priceCentsExact: config.floorPriceCents,
      priceDollars: centsFloatToDollarString(config.floorPriceCents),
      reason: 'final_tail_sweep',
      cumulativeSizeAtPrice: 0,
    };
  }

  const price = selectExecutablePrice(sideLevels, chunkSize, config.floorPriceCents, config.minLevelSize);
  return { chunkSize, ...price };
}

export function buildSellPayload(config: ExitConfig, decision: PriceDecision): OrderPayload {
  const clientOrderId = `kea-${Date.now()}-${crypto.randomUUID()}`;
  const tif = config.orderTimeInForce ?? 'immediate_or_cancel';
  // reduce_only requires IoC per Kalshi server-side check. For GTC drips we must drop reduce_only.
  const reduceOnly = tif === 'immediate_or_cancel';

  const payload: OrderPayload = {
    ticker: config.marketTicker,
    action: 'sell',
    side: config.heldSide,
    // Kalshi's CreateOrderRequest.count is `int` — fractional values are rejected with
    // "cannot unmarshal number X into Go struct field CreateOrderRequest.count of type int".
    // Positions can be fractional (Kalshi deducts fees in shares), so floor here.
    count: Math.floor(decision.chunkSize),
    type: 'limit',
    reduce_only: reduceOnly,
    time_in_force: tif,
    client_order_id: clientOrderId,
  };

  // Use *_dollars (FixedPointDollars string) to support sub-cent prices. Below 10¢ Kalshi quotes in
  // 0.001 ticks; integer yes_price/no_price (1..99) cannot represent those.
  const priceStr = applyGtcMinFloor(decision.priceDollars, config.gtcMinPriceDollars);
  if (config.heldSide === 'yes') payload.yes_price_dollars = priceStr;
  else payload.no_price_dollars = priceStr;
  return payload;
}

/** If a gtcMinPriceDollars floor is set, take the max of (decision price, floor). */
function applyGtcMinFloor(decisionDollars: string, gtcMin?: string): string {
  if (!gtcMin) return decisionDollars;
  const a = Number.parseFloat(decisionDollars);
  const b = Number.parseFloat(gtcMin);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return decisionDollars;
  return a >= b ? decisionDollars : gtcMin;
}
