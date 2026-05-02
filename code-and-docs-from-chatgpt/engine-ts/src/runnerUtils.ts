/**
 * runnerUtils.ts — shared chunk-sizing helpers for ExitRunner and BuyRunner.
 *
 * The sell-side helpers in pricing.ts are tightly coupled to ExitConfig.
 * These wrappers expose a generic ChunkConfig interface so the buy runner
 * can reuse the same logic without depending on ExitConfig.
 */

import type { Orderbook } from './types.js';

export interface ChunkConfig {
  /** Fixed chunk size (contracts per order). */
  chunkSize: number;
  /** Minimum adaptive chunk floor. Default: 1. */
  minAdaptiveChunk?: number;
}

/**
 * Choose a fixed chunk size, capped at `remaining`.
 * Buy-side equivalent of the sell-side fixed path in pricing.chooseChunkSize.
 */
export function chooseChunkSize(
  _book: Orderbook,
  remaining: number,
  config: ChunkConfig,
): number {
  return Math.min(config.chunkSize, remaining);
}

/**
 * Compute an adaptive chunk size based on the top-of-book ask depth.
 * On the buy side we look at the side we're crossing (ask = YES asks or NO asks).
 * Uses 80% of top-level size, bounded to [minAdaptiveChunk, chunkSize].
 */
export function computeAdaptiveChunk(
  book: Orderbook,
  remaining: number,
  config: ChunkConfig,
  side: 'yes' | 'no' = 'yes',
): number {
  const levels = (side === 'yes' ? book.yes : book.no)
    .filter((l) => l.size > 0)
    .sort((a, b) => a.priceCents - b.priceCents); // ascending — lowest ask first

  const topSize = levels[0]?.size ?? 0;
  const adaptive = topSize > 0 ? Math.floor(topSize * 0.8) : config.chunkSize;
  const min = config.minAdaptiveChunk ?? 1;
  const bounded = Math.max(min, Math.min(config.chunkSize, adaptive));
  return Math.min(remaining, bounded);
}
