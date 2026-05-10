/**
 * preTradeLiveness.ts — SH-DEPTH-WALK-STALE-SNAPSHOT Task 2.1
 *
 * Pure function: given a projection's depth-walk assumption (target side +
 * top bid + expected size at that level) and a fresh orderbook snapshot
 * pulled seconds before submission, return either { ok: true } or a
 * rejection with the specific drift that violated tolerance.
 *
 * The 2026-05-09 MOVVA incident — top-of-book bid pulled 5m18s before our
 * IoC arrived, projection $8,294 → actual $5,093, $3,201 miss — is exactly
 * what this primitive prevents. The runner should re-query, call this, and
 * abort the trade rather than walking through a collapsed book.
 *
 * No I/O; the runner is responsible for fetching the fresh snapshot and
 * deciding what to do with the result.
 */

import type { Orderbook } from './types.js';

export interface ProjectionAssumptions {
  /** Side whose top bid we're SELLING into (i.e. the side whose collapse hurts us). */
  sellingSide: 'yes' | 'no';
  /** Top bid (cents) we projected against — the price we expected to fill near. */
  topBidCents: number;
  /** Size we expected to be available at that level (or summed within tolerance). */
  expectedSize: number;
}

export interface LivenessConfig {
  /** Reject if observed top bid moved by more than this many cents. Default 1. */
  maxBidShiftCents?: number;
  /** Reject if size at projected level shrank by more than this fraction (0..1). Default 0.50. */
  maxSizeShrinkPct?: number;
}

export type LivenessReason = 'bid_shifted' | 'size_collapsed' | 'side_empty';

export interface LivenessResult {
  ok: boolean;
  reason?: LivenessReason;
  observed?: { topBidCents: number; sizeAtProjectedLevel: number };
  drift?: { bidCents: number; sizeShrinkPct: number };
}

const DEFAULT_BID_SHIFT_CENTS = 1;
const DEFAULT_SIZE_SHRINK_PCT = 0.50;

/**
 * Returns the level array for the side we're selling into. For SELL on the
 * `yes` side, that's `book.yes` (we sell into yes bids); for SELL on `no`,
 * `book.no`.
 */
function levelsForSide(book: Orderbook, sellingSide: 'yes' | 'no'): { priceCents: number; size: number }[] {
  return sellingSide === 'yes' ? book.yes : book.no;
}

/**
 * Top of the book on the side we're selling into — the bid most relevant to
 * our projection. The level array is unsorted in general; pick the highest
 * priceCents level.
 */
function topBid(levels: { priceCents: number; size: number }[]): { priceCents: number; size: number } | null {
  if (levels.length === 0) return null;
  let best = levels[0]!;
  for (const l of levels) if (l.priceCents > best.priceCents) best = l;
  return best;
}

/**
 * Pure liveness check. Compares freshBook against assumptions; returns ok or
 * a rejection with the specific drift. Does NOT mutate inputs and does NOT
 * perform I/O.
 */
export function checkLiveness(
  assumptions: ProjectionAssumptions,
  freshBook: Orderbook,
  config?: LivenessConfig,
): LivenessResult {
  const maxBidShift = config?.maxBidShiftCents ?? DEFAULT_BID_SHIFT_CENTS;
  const maxSizeShrink = config?.maxSizeShrinkPct ?? DEFAULT_SIZE_SHRINK_PCT;

  const levels = levelsForSide(freshBook, assumptions.sellingSide);
  const top = topBid(levels);
  if (!top) {
    return {
      ok: false,
      reason: 'side_empty',
      observed: { topBidCents: 0, sizeAtProjectedLevel: 0 },
      drift: { bidCents: -assumptions.topBidCents, sizeShrinkPct: 1 },
    };
  }

  const bidDrift = top.priceCents - assumptions.topBidCents;
  if (Math.abs(bidDrift) > maxBidShift) {
    return {
      ok: false,
      reason: 'bid_shifted',
      observed: { topBidCents: top.priceCents, sizeAtProjectedLevel: top.size },
      drift: { bidCents: bidDrift, sizeShrinkPct: 0 },
    };
  }

  // Size at the projected level: prefer the level at exactly assumptions.topBidCents
  // (since drift is within tolerance, that level should still exist); fall back to
  // the new top if it doesn't.
  const sameLevel = levels.find((l) => l.priceCents === assumptions.topBidCents);
  const sizeAtProjectedLevel = sameLevel ? sameLevel.size : top.size;

  const sizeShrinkPct = assumptions.expectedSize > 0
    ? Math.max(0, (assumptions.expectedSize - sizeAtProjectedLevel) / assumptions.expectedSize)
    : 0;

  if (sizeShrinkPct > maxSizeShrink) {
    return {
      ok: false,
      reason: 'size_collapsed',
      observed: { topBidCents: top.priceCents, sizeAtProjectedLevel },
      drift: { bidCents: bidDrift, sizeShrinkPct },
    };
  }

  return { ok: true, observed: { topBidCents: top.priceCents, sizeAtProjectedLevel } };
}
