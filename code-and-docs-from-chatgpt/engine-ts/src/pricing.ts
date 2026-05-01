import crypto from 'node:crypto';
import type { ExitConfig, Orderbook, OrderPayload, PriceDecision, PriceLevel } from './types.js';

export function normalizeLevels(levels: PriceLevel[], minLevelSize: number): PriceLevel[] {
  return levels
    .filter((level) => Number.isFinite(level.priceCents) && Number.isFinite(level.size))
    .filter((level) => level.priceCents > 0 && level.priceCents <= 99)
    .filter((level) => level.size >= minLevelSize)
    .sort((a, b) => b.priceCents - a.priceCents);
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
  const sideLevels = config.heldSide === 'yes' ? orderbook.yes : orderbook.no;
  const chunkSize = chooseChunkSize(remainingPosition, config, sideLevels);

  if (remainingPosition <= config.tailSweepThreshold) {
    return { chunkSize, priceCents: config.floorPriceCents, reason: 'final_tail_sweep', cumulativeSizeAtPrice: 0 };
  }

  const price = selectExecutablePrice(sideLevels, chunkSize, config.floorPriceCents, config.minLevelSize);
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
