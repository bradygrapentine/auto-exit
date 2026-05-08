/**
 * aggressive.ts — S2 aggressive strategy: one-shot IoC across the spread.
 *
 * Posts a single IoC order for the entire size at the top bid (sell) or
 * implied ask = 100 − top-no-bid (buy). No chunking, no adaptive sizing,
 * no polling loop.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds (aggressive_started, aggressive_order_placed,
 * aggressive_order_reconciled, aggressive_finished) are cast via the jk()
 * helper to avoid touching types.ts, following the same pattern as passive.ts.
 */

import type { KalshiClientLike, OrderPayload, Side, JournalKind } from './types.js';
import { Journal } from './journal.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

// ── Public interfaces ──────────────────────────────────────────────────────────

export interface AggressiveConfig {
  ticker: string;
  side: Side;           // side held (yes/no)
  action: 'buy' | 'sell';
  size: number;
  confirmedAggressive: boolean;
  /** default false; if true, cross by one tick beyond best price */
  oneTickIn?: boolean;
}

export interface AggressiveResult {
  filled: number;
  orderId: string;
  reason: 'filled' | 'partial' | 'unfilled';
}

// ── Tick outcome ───────────────────────────────────────────────────────────────

/**
 * Outcome of a single runOneTick() call.
 * - 'done'       : order placed & reconciled; result carries fill details.
 * - 'break_loop' : a non-throwing break condition (empty book, no liquidity).
 *
 * Note: the aggressive strategy is single-shot (no sweep loop), so 'continue'
 * is intentionally absent. The loop in run() terminates after the first tick.
 */
export type AggressiveTickOutcome =
  | { kind: 'done'; result: AggressiveResult }
  | { kind: 'break_loop'; reason: string };

// ── Runner ─────────────────────────────────────────────────────────────────────

export class AggressiveRunner {
  constructor(
    private readonly client: KalshiClientLike,
    private readonly config: AggressiveConfig,
    private readonly journal?: Journal,
  ) {
    if (!config.confirmedAggressive) {
      throw new Error('S2 aggressive requires confirmedAggressive=true');
    }
    if (config.size <= 0) throw new Error('size must be > 0');
  }

  /**
   * Execute one tick of the aggressive sweep: fetch book, compute limit price,
   * post IoC order, reconcile fill, journal entries.
   *
   * Returns AggressiveTickOutcome:
   *  - { kind: 'done'; result }   — order placed and reconciled (loop should stop).
   *  - { kind: 'break_loop'; reason } — empty book or no liquidity; loop should stop.
   */
  async runOneTick(): Promise<AggressiveTickOutcome> {
    const book = await this.client.getOrderbook(this.config.ticker, 5);

    // Determine limit price.
    // Sell: hit the top YES bid.
    // Buy:  lift the implied YES ask = 100 − top NO bid.
    let limitPriceCents: number;
    if (this.config.action === 'sell') {
      const levels = book.yes.filter((l) => l.size > 0).sort((a, b) => b.priceCents - a.priceCents);
      const topBid = levels[0]?.priceCents;
      if (topBid === undefined) {
        return { kind: 'break_loop', reason: 'empty_yes_book' };
      }
      limitPriceCents = this.config.oneTickIn ? Math.max(1, topBid - 1) : topBid;
    } else {
      const levels = book.no.filter((l) => l.size > 0).sort((a, b) => b.priceCents - a.priceCents);
      const topNoBid = levels[0]?.priceCents;
      if (topNoBid === undefined) {
        return { kind: 'break_loop', reason: 'empty_no_book' };
      }
      const ask = 100 - topNoBid;
      limitPriceCents = this.config.oneTickIn ? Math.min(99, ask + 1) : ask;
    }

    const payload: OrderPayload = {
      ticker: this.config.ticker,
      side: this.config.side,
      action: this.config.action,
      type: 'limit',
      time_in_force: 'immediate_or_cancel',
      count: this.config.size,
      yes_price: this.config.side === 'yes' ? limitPriceCents : undefined,
      no_price: this.config.side === 'no' ? limitPriceCents : undefined,
      reduce_only: true,
      client_order_id: `kea-aggressive-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };

    this.journal?.append(jk('aggressive_order_placed'), { payload });

    const order = await this.client.createOrder(payload);
    this.journal?.append(jk('aggressive_order_reconciled'), {
      orderId: order.orderId,
      status: order.status,
      filled: order.filledCount,
    });

    const reason: AggressiveResult['reason'] =
      order.filledCount === this.config.size
        ? 'filled'
        : order.filledCount > 0
          ? 'partial'
          : 'unfilled';

    this.journal?.append(jk('aggressive_finished'), {
      filled: order.filledCount,
      reason,
    });

    return {
      kind: 'done',
      result: { filled: order.filledCount, orderId: order.orderId, reason },
    };
  }

  async run(): Promise<AggressiveResult> {
    this.journal?.append(jk('aggressive_started'), {
      ticker: this.config.ticker,
      action: this.config.action,
      size: this.config.size,
    });

    const outcome = await this.runOneTick();

    if (outcome.kind === 'break_loop') {
      // Re-raise as errors to preserve original throwing behaviour.
      if (outcome.reason === 'empty_yes_book') {
        throw new Error('S2 aggressive: empty yes-side book — cannot sell');
      }
      if (outcome.reason === 'empty_no_book') {
        throw new Error('S2 aggressive: empty no-side book — cannot buy');
      }
      throw new Error(`S2 aggressive: unexpected break: ${outcome.reason}`);
    }

    return outcome.result;
  }
}
