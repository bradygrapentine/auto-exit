/**
 * sPrependThenSweep.ts — S15 GTC-prepend-then-sweep strategy.
 *
 * Three-phase hybrid passive→aggressive exit:
 *
 *   Phase 1: Post a single GTC sell order at ask−1¢ (or buy at bid+1¢) for
 *            FULL position size. Journal: prepend_posted.
 *
 *   Phase 2: Wait prependWindowMs. Then cancel the GTC, confirm via getOrder
 *            to read the authoritative fill count (handles race where order
 *            fills mid-cancel). Journal: prepend_window_expired, prepend_cancelled.
 *
 *   Phase 3: Sweep the REMAINING (unfilled) size via S2 aggressive.
 *            If GTC was fully filled, skip sweep entirely.
 *            Journal: prepend_sweep_started, prepend_then_sweep_complete.
 *
 * Cancel race safety: after cancelOrder() resolves, getOrder() is called to
 * confirm the authoritative filledCount. The sweep is sized from that value —
 * not from any snapshot taken before the cancel.
 *
 * Halt conditions:
 *   - cancelOrder() throws → journal prepend_cancel_failed, halt (throw).
 *   - getOrder() throws post-cancel → same.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds (prepend_posted, prepend_window_expired, prepend_cancelled,
 * prepend_cancel_failed, prepend_sweep_started, prepend_then_sweep_complete)
 * are cast via the jk() helper to avoid touching types.ts.
 */

import type { KalshiClientLike, Side, JournalKind } from '../types.js';
import { Journal } from '../journal.js';
import { AggressiveRunner } from '../aggressive.js';
import type { AggressiveConfig, AggressiveResult } from '../aggressive.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(k: string): JournalKind {
  return k as unknown as JournalKind;
}

// ── Injectable function types ──────────────────────────────────────────────────

/** Injectable for posting the initial GTC order. Returns the new order's id. */
export type PostGtcInvokeFn = (
  ticker: string,
  side: Side,
  action: 'buy' | 'sell',
  priceCents: number,
  size: number,
) => Promise<string>;

/** Injectable for cancelling the GTC order. */
export type CancelGtcInvokeFn = (orderId: string) => Promise<void>;

/** Injectable for confirming final fill after cancel. Returns authoritative filledCount. */
export type FetchFilledQtyFn = (orderId: string) => Promise<number>;

/** Injectable for the sweep phase (S2 aggressive). */
export type AggressiveInvokeFn = (
  cfg: AggressiveConfig,
  journal?: Journal,
) => Promise<AggressiveResult>;

/** Injectable sleep to enable fake timers in tests. */
export type SleepMsFn = (ms: number) => Promise<void>;

// ── Public interfaces ──────────────────────────────────────────────────────────

export interface SPrependThenSweepConfig {
  ticker: string;
  /** Side currently held (yes/no). */
  side: Side;
  /** action: sell to close a long; buy to close a short. */
  action: 'buy' | 'sell';
  /** Full position size. GTC is posted for this; sweep covers what remains. */
  size: number;
  /** How long to let the GTC rest before cancelling and sweeping. Milliseconds. */
  prependWindowMs: number;
  /** Must be true; prevents accidental use. */
  confirmedPrepend: boolean;
  /** Forwarded to sweep's AggressiveRunner. Default false. */
  oneTickIn?: boolean;
  // ── Injectables (all optional; real impls used when absent) ──────────────────
  postGtcInvoke?: PostGtcInvokeFn;
  cancelGtcInvoke?: CancelGtcInvokeFn;
  fetchFilledQty?: FetchFilledQtyFn;
  aggressiveInvoke?: AggressiveInvokeFn;
  sleepMs?: SleepMsFn;
}

export interface SPrependThenSweepResult {
  gtcOrderId: string;
  filledFromGtc: number;
  /** undefined when fully filled by GTC (no sweep needed). */
  sweep?: AggressiveResult;
  reason: 'complete' | 'gtc_fully_filled' | 'sweep_partial';
}

// ── Args builder with validation ───────────────────────────────────────────────

export function buildSPrependThenSweepArgs(
  opts: SPrependThenSweepConfig,
): SPrependThenSweepConfig {
  if (!opts.ticker) throw new Error('S15: ticker required');
  if (opts.size <= 0) throw new Error('S15: size must be > 0');
  if (!opts.action) throw new Error('S15: action required (buy | sell)');
  if (opts.action !== 'buy' && opts.action !== 'sell')
    throw new Error('S15: action must be "buy" or "sell"');
  if (!opts.side) throw new Error('S15: side required (yes | no)');
  if (opts.prependWindowMs === undefined || opts.prependWindowMs <= 0)
    throw new Error('S15: prependWindowMs must be > 0');
  if (!opts.confirmedPrepend) throw new Error('S15: confirmedPrepend=true required');
  return { ...opts };
}

// ── Runner ─────────────────────────────────────────────────────────────────────

export class SPrependThenSweepRunner {
  private readonly client: KalshiClientLike;
  private readonly config: SPrependThenSweepConfig;
  private readonly journal: Journal;

  constructor(
    client: KalshiClientLike,
    config: SPrependThenSweepConfig,
    journal?: Journal,
  ) {
    if (!config.confirmedPrepend) throw new Error('S15: confirmedPrepend=true required');
    if (!config.ticker) throw new Error('S15: ticker required');
    if (config.size <= 0) throw new Error('S15: size must be > 0');
    if (config.prependWindowMs <= 0) throw new Error('S15: prependWindowMs must be > 0');

    this.client = client;
    this.config = config;
    this.journal = journal ?? new Journal(`s15-${Date.now()}`);
  }

  async run(): Promise<SPrependThenSweepResult> {
    const { ticker, side, action, size, prependWindowMs, oneTickIn } = this.config;

    // Resolve injectables.
    const postGtcInvoke: PostGtcInvokeFn =
      this.config.postGtcInvoke ??
      (async (tkr, sd, act, priceCents, sz) => {
        const order = await this.client.createOrder({
          ticker: tkr,
          side: sd,
          action: act,
          type: 'limit',
          time_in_force: 'good_till_canceled',
          count: sz,
          yes_price: sd === 'yes' ? priceCents : undefined,
          no_price: sd === 'no' ? priceCents : undefined,
        } as Parameters<KalshiClientLike['createOrder']>[0]);
        return order.orderId;
      });

    const cancelGtcInvoke: CancelGtcInvokeFn =
      this.config.cancelGtcInvoke ??
      (async (orderId) => { await this.client.cancelOrder(orderId); });

    const fetchFilledQty: FetchFilledQtyFn =
      this.config.fetchFilledQty ??
      (async (orderId) => {
        const order = await this.client.getOrder(orderId);
        return order.filledCount;
      });

    const aggressiveInvoke: AggressiveInvokeFn =
      this.config.aggressiveInvoke ??
      ((cfg, j) => new AggressiveRunner(this.client, cfg, j).run());

    const sleepMs: SleepMsFn =
      this.config.sleepMs ??
      ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

    // ── Phase 1: determine GTC price and post ───────────────────────────────
    const book = await this.client.getOrderbook(ticker, 5);

    let gtcPriceCents: number;
    if (action === 'sell') {
      // Sell: post at ask−1¢ (just inside the spread, passive).
      const askLevels = book.yes.filter((l) => l.size > 0).sort((a, b) => a.priceCents - b.priceCents);
      const bestAsk = askLevels[0]?.priceCents;
      if (bestAsk === undefined) throw new Error('S15: empty yes-side book — cannot determine ask');
      gtcPriceCents = Math.max(1, bestAsk - 1);
    } else {
      // Buy: post at bid+1¢ (just inside the spread, passive).
      const noBidLevels = book.no.filter((l) => l.size > 0).sort((a, b) => b.priceCents - a.priceCents);
      const topNoBid = noBidLevels[0]?.priceCents;
      if (topNoBid === undefined) throw new Error('S15: empty no-side book — cannot determine bid');
      const impliedBid = 100 - topNoBid; // best YES bid implied from NO side
      gtcPriceCents = Math.min(99, impliedBid + 1);
    }

    this.journal.append(jk('prepend_posted'), {
      ticker,
      side,
      action,
      size,
      gtcPriceCents,
      prependWindowMs,
    });

    const gtcOrderId = await postGtcInvoke(ticker, side, action, gtcPriceCents, size);

    // ── Phase 2: wait window, then cancel + confirm ──────────────────────────
    await sleepMs(prependWindowMs);

    this.journal.append(jk('prepend_window_expired'), { gtcOrderId, prependWindowMs });

    let filledFromGtc: number;
    try {
      await cancelGtcInvoke(gtcOrderId);
      // Post-cancel confirmation: authoritative fill (handles cancel race).
      filledFromGtc = await fetchFilledQty(gtcOrderId);
    } catch (err) {
      this.journal.append(jk('prepend_cancel_failed'), {
        gtcOrderId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    this.journal.append(jk('prepend_cancelled'), { gtcOrderId, filledFromGtc });

    // ── Phase 3: sweep remainder via S2 aggressive ───────────────────────────
    const remainingSize = size - filledFromGtc;

    if (remainingSize <= 0) {
      // GTC fully filled — no sweep needed.
      this.journal.append(jk('prepend_then_sweep_complete'), {
        reason: 'gtc_fully_filled',
        filledFromGtc,
        swept: 0,
      });
      return {
        gtcOrderId,
        filledFromGtc,
        reason: 'gtc_fully_filled',
      };
    }

    this.journal.append(jk('prepend_sweep_started'), {
      remainingSize,
      filledFromGtc,
    });

    const sweepCfg: AggressiveConfig = {
      ticker,
      side,
      action,
      size: remainingSize,
      confirmedAggressive: true,
      oneTickIn,
    };

    const sweep = await aggressiveInvoke(sweepCfg, this.journal);

    const reason: SPrependThenSweepResult['reason'] =
      sweep.reason === 'filled' ? 'complete' : 'sweep_partial';

    this.journal.append(jk('prepend_then_sweep_complete'), {
      reason,
      filledFromGtc,
      swept: sweep.filled,
    });

    return {
      gtcOrderId,
      filledFromGtc,
      sweep,
      reason,
    };
  }
}
