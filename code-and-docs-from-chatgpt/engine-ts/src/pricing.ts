import crypto from 'node:crypto';
import type { ExitConfig, Orderbook, OrderPayload, PriceDecision, PriceLevel, Side } from './types.js';

export function normalizeLevels(levels: PriceLevel[], minLevelSize: number): PriceLevel[] {
  return levels
    .filter((level) => Number.isFinite(level.priceCents) && Number.isFinite(level.size))
    .filter((level) => level.priceCents > 0 && level.priceCents <= 99)
    .filter((level) => level.size >= minLevelSize)
    .sort((a, b) => b.priceCents - a.priceCents);
}

/**
 * Produce the effective book of "sell-side" prices the engine can hit for `heldSide`.
 *
 * Kalshi's matching engine crosses YES and NO sides via the YES+NO=$1 invariant: a YES sell at price P
 * matches both (a) YES bids at >= P AND (b) NO bids at >= (1-P). So the best price for selling YES is
 * max(highest YES bid, $1 - lowest NO bid). We compute this by merging the direct side's book with the
 * other side's book inverted (price -> 100 - price), then letting `selectExecutablePrice` walk the
 * combined book by descending price.
 */
export function combinedSellLevels(orderbook: Orderbook, heldSide: Side): PriceLevel[] {
  const direct = heldSide === 'yes' ? orderbook.yes : orderbook.no;
  const opposite = heldSide === 'yes' ? orderbook.no : orderbook.yes;
  const inverse = opposite.map((lvl) => ({ priceCents: 100 - lvl.priceCents, size: lvl.size }));
  return [...direct, ...inverse];
}

export function selectExecutablePrice(
  rawLevels: PriceLevel[],
  desiredChunk: number,
  floorPriceCents: number,
  minLevelSize: number,
): { priceCents: number; cumulativeSizeAtPrice: number; reason: string } {
  const levels = normalizeLevels(rawLevels, minLevelSize);
  let cumulative = 0;

  for (const level of levels) {
    cumulative += level.size;
    if (cumulative >= desiredChunk) {
      return {
        priceCents: Math.max(level.priceCents, floorPriceCents),
        cumulativeSizeAtPrice: cumulative,
        reason: 'full_depth_cumulative_price',
      };
    }
  }

  return {
    priceCents: floorPriceCents,
    cumulativeSizeAtPrice: cumulative,
    reason: 'fallback_floor_price_insufficient_depth',
  };
}

export function chooseChunkSize(remaining: number, config: ExitConfig, rawLevels: PriceLevel[]): number {
  const fixed = Math.min(config.chunkSize, remaining);
  if (remaining <= config.tailSweepThreshold) return remaining;
  if (!config.mildAdaptive) return fixed;

  const levels = normalizeLevels(rawLevels, config.minLevelSize);
  const topSize = levels[0]?.size ?? 0;
  const adaptive = Math.floor(topSize * 0.8);
  const bounded = Math.max(config.minAdaptiveChunk, Math.min(config.chunkSize, adaptive));
  return Math.min(remaining, bounded);
}

export function decideLosingExitOrder(orderbook: Orderbook, remainingPosition: number, config: ExitConfig): PriceDecision {
  const sellLevels = combinedSellLevels(orderbook, config.heldSide);
  const chunkSize = chooseChunkSize(remainingPosition, config, sellLevels);

  if (remainingPosition <= config.tailSweepThreshold) {
    return { chunkSize, priceCents: config.floorPriceCents, reason: 'final_tail_sweep', cumulativeSizeAtPrice: 0 };
  }

  const price = selectExecutablePrice(sellLevels, chunkSize, config.floorPriceCents, config.minLevelSize);
  return { chunkSize, ...price };
}

export function buildSellPayload(config: ExitConfig, decision: PriceDecision): OrderPayload {
  const clientOrderId = `kea-${Date.now()}-${crypto.randomUUID()}`;
  const payload: OrderPayload = {
    ticker: config.marketTicker,
    action: 'sell',
    side: config.heldSide,
    count: decision.chunkSize,
    type: 'limit',
    reduce_only: true,
    client_order_id: clientOrderId,
  };

  if (config.heldSide === 'yes') payload.yes_price = decision.priceCents;
  else payload.no_price = decision.priceCents;
  return payload;
}
