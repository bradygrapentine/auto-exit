/**
 * SH-BACKTEST Phase B1 — fill simulator.
 *
 * Simulates order fills against a recorded orderbook snapshot.
 * Implements spec §7.3–§7.4 fill rules:
 *   - naive: cross-the-spread fills, market sweeps, partial-fill modeling.
 *   - queue_aware: experimental stub — returns 0 fill (no opposite-side data).
 *   - IOC/FOK per spec §7.3.
 *
 * Fees use Kalshi schedule: rawFee = 0.07 * shares * p * (1-p), min $0.01.
 * Cents-as-integers throughout.
 */

import type { FillResult, FillModel } from './types.js';

// ---------------------------------------------------------------------------
// Types consumed from the recording / order payload
// ---------------------------------------------------------------------------

/** A single price level from a recorded snapshot — [priceCents, qty] tuple. */
export type BookLevel = [number, number];

/** Recorded orderbook at the cursor position. */
export interface SnapshotOrderbook {
  yes: BookLevel[];
  no: BookLevel[];
}

/** Minimal order descriptor passed by the replay client. */
export interface SimOrder {
  side: 'yes' | 'no';
  /** 'limit' | 'market' — market orders walk the full book. */
  type: 'limit' | 'market';
  size: number;
  /** Required for limit orders (integer cents). */
  limitPriceCents?: number;
  timeInForce: 'immediate_or_cancel' | 'fill_or_kill' | 'good_till_canceled';
}

// ---------------------------------------------------------------------------
// Fee calculation — mirrors pricing.ts projectFullExit logic
// ---------------------------------------------------------------------------

/**
 * Compute Kalshi taker fee for a single fill segment.
 * rawFee = 0.07 * shares * (priceCents/100) * (1 - priceCents/100)
 * Fee rounded up to cent; minimum $0.01 per fill.
 * Returns integer cents.
 */
function computeFeeCents(shares: number, priceCents: number): number {
  const p = priceCents / 100;
  const rawFee = 0.07 * shares * p * (1 - p);
  // round up to cent, $0.01 minimum
  return Math.max(Math.ceil(rawFee * 100), 1);
}

// ---------------------------------------------------------------------------
// Book helpers
// ---------------------------------------------------------------------------

/**
 * Get the opposing liquidity levels for a given order side.
 *
 * For a YES buy order, liquidity comes from the NO side (sellers of YES/buyers
 * of NO). For a NO buy order, liquidity comes from the YES side.
 *
 * On Kalshi a "yes ask" is the ask price of YES contracts — stored in `no`
 * levels (the no-side bid = yes-side ask at 100 - price). However, the
 * recorded orderbook stores YES and NO levels as the prices at which those
 * sides are offered. To fill a YES buy we consume the NO side's best offer
 * (lowest no-price = 100 - best_yes_ask). To keep the simulation simple and
 * consistent with how the recorder captures the book (both sides posted as
 * their own prices), we treat the same side's book as the resting liquidity
 * to fill against — the recorded `yes` levels represent resting YES sellers
 * the buyer can hit.
 *
 * Spec §7.3 "naive": a limit order at price ≥ best ask fills instantly up to
 * displayed size at the displayed price. "Best ask" on Kalshi's YES side is
 * the lowest yes-ask = the price appearing in the `yes` book levels sorted
 * ascending. Buyers walk the book from lowest ask upward.
 */
function getLiquidityLevels(
  orderbook: SnapshotOrderbook,
  side: 'yes' | 'no',
): BookLevel[] {
  // Return levels for the same side as the order, sorted ascending by price
  // (lowest ask first — the cheapest available liquidity).
  const levels = side === 'yes' ? orderbook.yes : orderbook.no;
  return [...levels].sort(([a], [b]) => a - b);
}

/**
 * Total available depth (sum of all qty) across provided levels.
 */
function totalDepth(levels: BookLevel[]): number {
  return levels.reduce((sum, [, qty]) => sum + qty, 0);
}

// ---------------------------------------------------------------------------
// Core sweep logic
// ---------------------------------------------------------------------------

interface SweepResult {
  filled: number;
  fillPriceCents: number; // weighted average
  feesCents: number;
  segments: Array<{ priceCents: number; qty: number }>;
}

/**
 * Walk book levels from cheapest ask upward, filling `wantSize` contracts.
 * For a limit order, stops at levels above `maxPriceCents`.
 * For a market order, maxPriceCents is effectively Infinity.
 *
 * Returns filled qty, weighted-average fill price, fees, and per-level segments.
 */
function sweepBook(
  levels: BookLevel[],
  wantSize: number,
  maxPriceCents: number,
): SweepResult {
  let filled = 0;
  let weightedPriceSum = 0;
  let feesCents = 0;
  const segments: Array<{ priceCents: number; qty: number }> = [];

  for (const [priceCents, qty] of levels) {
    if (filled >= wantSize) break;
    if (priceCents > maxPriceCents) break; // limit price exceeded
    if (qty <= 0) continue;

    const take = Math.min(qty, wantSize - filled);
    filled += take;
    weightedPriceSum += take * priceCents;
    feesCents += computeFeeCents(take, priceCents);
    segments.push({ priceCents, qty: take });
  }

  const fillPriceCents =
    filled > 0 ? Math.round(weightedPriceSum / filled) : 0;

  return { filled, fillPriceCents, feesCents, segments };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Simulate an order fill against the current snapshot.
 *
 * @param order - The order to simulate.
 * @param snapshot - The recorded orderbook at the current cursor.
 * @param model - Fill model ('naive' default; 'queue_aware' experimental stub).
 * @returns FillResult with integer cents.
 */
export function simulateFill(
  order: SimOrder,
  snapshot: SnapshotOrderbook,
  model: FillModel = 'naive',
): FillResult {
  const assumptions: string[] = [];

  // ── queue_aware stub ────────────────────────────────────────────────────
  if (model === 'queue_aware') {
    assumptions.push(
      'queue_aware: experimental — no opposite-side fill data in this recording; all fills return 0',
    );
    return {
      filled: 0,
      remaining: order.size,
      fillPriceCents: 0,
      isTaker: false,
      feesCents: 0,
      assumptionsAdded: assumptions,
    };
  }

  // ── naive model ─────────────────────────────────────────────────────────

  // Always surface fidelity caveats (spec §8)
  assumptions.push(
    'naive: fill rates may over-estimate live; no market-impact modeled (spec §8.1, §8.2)',
  );

  const levels = getLiquidityLevels(snapshot, order.side);
  const maxPrice =
    order.type === 'market'
      ? Number.MAX_SAFE_INTEGER
      : (order.limitPriceCents ?? 0);

  // ── FOK: fill entire size atomically, else cancel ───────────────────────
  if (order.timeInForce === 'fill_or_kill') {
    const available = levels
      .filter(([p]) => p <= maxPrice)
      .reduce((s, [, q]) => s + q, 0);

    if (available < order.size) {
      return {
        filled: 0,
        remaining: order.size,
        fillPriceCents: 0,
        isTaker: false,
        feesCents: 0,
        assumptionsAdded: assumptions,
      };
    }

    // Sufficient depth — fill fully
    const result = sweepBook(levels, order.size, maxPrice);
    return {
      filled: result.filled,
      remaining: order.size - result.filled,
      fillPriceCents: result.fillPriceCents,
      isTaker: true,
      feesCents: result.feesCents,
      assumptionsAdded: assumptions,
    };
  }

  // ── IOC / GTC (naive treats GTC same as IOC at current snapshot) ────────
  const result = sweepBook(levels, order.size, maxPrice);

  // IOC: any unfilled remainder is cancelled (not queued)
  // GTC: unfilled remainder becomes a resting order — caller (replayClient) handles queuing
  const isTaker = result.filled > 0;

  return {
    filled: result.filled,
    remaining: order.size - result.filled,
    fillPriceCents: result.fillPriceCents,
    isTaker,
    feesCents: result.feesCents,
    assumptionsAdded: assumptions,
  };
}
