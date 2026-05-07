/**
 * SH-BACKTEST Phase C — ExitRunner adapter for S1 passive strategy.
 *
 * Mirrors the S1 passive (post-and-walk) pricing logic tick-by-tick so the
 * harness can drive it via cursor advance rather than a blocking event loop.
 *
 * Why not instantiate ExitRunner or passive.run() directly?
 * Both are blocking loops that use sleep() / timebox polling internally.
 * Neither exposes a tick-callable seam. Wiring either runner without
 * modification would require running its event loop in a background task and
 * coordinating it with the harness cursor — complexity that outweighs the
 * benefit for a backtest.
 *
 * TODO: replace with real ExitRunner once a tick-callable seam is added to
 *   src/exitRunner.ts (e.g. a `runOneTick(orderbook)` method that emits a
 *   decision without sleeping). Track as follow-up after Phase C validates
 *   the DI pattern.
 *
 * Known limitation: this adapter omits the Journal and safety guard-rails
 *   that live ExitRunner/passive.run() enforce. It is intentionally
 *   lightweight — its purpose is counterfactual price analysis, not
 *   production safety.
 *
 * Pricing logic (mirrors passive.ts §3):
 *   - Sell side (YES exit): post limit sell at bestAsk − walkStepCents.
 *   - Walk: each tick where the prior resting order is still open, shift
 *     iterPrice down by walkStepCents until it hits the floor.
 *   - Buy side (NO exit): post limit buy at bestBid + walkStepCents.
 *     Walk up each tick until ceiling is hit.
 *   - One-sided book guard: if no counterparty liquidity, skip the tick.
 *   - Spread-too-tight guard: skip when spread < walkStepCents.
 */

import type { ReplayKalshiClient } from '../replayClient.js';
import type { StrategyAdapter } from '../harness.js';

// ---------------------------------------------------------------------------
// Config extracted from BacktestConfig.params
// ---------------------------------------------------------------------------

export interface PassiveAdapterParams {
  /** Market ticker. Required. */
  ticker: string;
  /** Position side being exited. Default 'sell'. */
  side?: 'sell' | 'buy';
  /** Sell floor in cents. Default 1. */
  minPriceCents?: number;
  /** Buy ceiling in cents. Default 99. */
  maxPriceCents?: number;
  /** Walk increment per tick in cents. Default 1. */
  walkStepCents?: number;
  /** Max contracts per order chunk. Default: full remaining quantity. */
  chunkSize?: number;
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface AdapterState {
  ticker: string;
  side: 'sell' | 'buy';
  minPriceCents: number;
  maxPriceCents: number;
  walkStepCents: number;
  chunkSize: number | null;
  /** Current iterPrice; null = not yet set (derive from book on first tick). */
  iterPrice: number | null;
  /** orderId of the resting GTC order we placed last tick, if any. */
  restingOrderId: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const roundCents = (c: number): number => Math.round(c * 10_000) / 10_000;

function centsToPrice(cents: number): string {
  return (cents / 100).toFixed(4);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a passive-strategy StrategyAdapter.
 *
 * Compatible with the harness StrategyAdapter interface (tick-by-tick).
 * Registered in the harness strategy registry under 's-passive'.
 *
 * Divergence from live passive.ts:
 *   - No Journal writes.
 *   - No safety guard-rails (forbidden tickers, dailyCircuitBreaker, etc.).
 *   - No timebox / sleep: one order per tick, walked each tick.
 *   - No dryRun toggle: harness fill simulator handles fill simulation.
 */
export function makePassiveAdapter(params: Record<string, unknown>): StrategyAdapter {
  const ticker = (params['ticker'] as string | undefined) ?? '';
  const side: 'sell' | 'buy' = (params['side'] as 'sell' | 'buy' | undefined) ?? 'sell';
  const minPriceCents = (params['minPriceCents'] as number | undefined) ?? 1;
  const maxPriceCents = (params['maxPriceCents'] as number | undefined) ?? 99;
  const walkStepCents = (params['walkStepCents'] as number | undefined) ?? 1;
  const chunkSizeParam = params['chunkSize'] as number | undefined;

  const state: AdapterState = {
    ticker,
    side,
    minPriceCents,
    maxPriceCents,
    walkStepCents,
    chunkSize: chunkSizeParam ?? null,
    iterPrice: null,
    restingOrderId: null,
  };

  return {
    async tick(client: ReplayKalshiClient, remainingQty: number): Promise<string> {
      if (remainingQty <= 0) return '';

      const book = await client.getOrderbook(state.ticker, 20);

      // Derive best ask / best bid (mirrors passive.ts §1)
      const yesAsks = book.yes.filter((l) => l.size > 0).sort((a, b) => a.priceCents - b.priceCents);
      const noAsks = book.no.filter((l) => l.size > 0).sort((a, b) => a.priceCents - b.priceCents);

      const bestAskCents = yesAsks[0]?.priceCents ?? 99;
      const bestBidCents = noAsks[0] != null ? 100 - noAsks[0].priceCents : 1;

      // One-sided book guard
      const counterpartyEmpty =
        state.side === 'sell' ? noAsks.length === 0 : yesAsks.length === 0;
      if (counterpartyEmpty) {
        return 's-passive: skip tick — no counterparty liquidity';
      }

      // Spread check
      const spreadCents = bestAskCents - bestBidCents;
      if (spreadCents < state.walkStepCents) {
        return `s-passive: skip tick — spread ${spreadCents}c < walkStep ${state.walkStepCents}c`;
      }

      // Derive iterPrice on first tick, or walk if already set
      if (state.iterPrice === null) {
        state.iterPrice = roundCents(
          state.side === 'sell'
            ? bestAskCents - state.walkStepCents
            : bestBidCents + state.walkStepCents,
        );
      } else {
        // Walk one tick in passive direction each tick where prior order may not have filled
        state.iterPrice = roundCents(
          state.side === 'sell'
            ? state.iterPrice - state.walkStepCents
            : state.iterPrice + state.walkStepCents,
        );
      }

      // Floor guard (sell side)
      if (state.side === 'sell' && state.iterPrice < state.minPriceCents) {
        return `s-passive: floor hit — iterPrice ${state.iterPrice}c < floor ${state.minPriceCents}c`;
      }

      // Ceiling guard (buy side)
      if (state.side === 'buy' && state.iterPrice > state.maxPriceCents) {
        return `s-passive: ceiling hit — iterPrice ${state.iterPrice}c > ceiling ${state.maxPriceCents}c`;
      }

      const chunk = state.chunkSize != null
        ? Math.min(state.chunkSize, remainingQty)
        : remainingQty;

      const kalshiSide = state.ticker.endsWith('_NO') ? 'no' : 'yes';
      const clientOrderId = `kea-passive-bt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const result = await client.createOrder({
        ticker: state.ticker,
        action: state.side,
        side: kalshiSide,
        count: chunk,
        type: 'limit',
        reduce_only: false,
        time_in_force: 'good_till_canceled',
        client_order_id: clientOrderId,
        yes_price_dollars: kalshiSide === 'yes' ? centsToPrice(state.iterPrice) : undefined,
        no_price_dollars: kalshiSide === 'no' ? centsToPrice(state.iterPrice) : undefined,
      });

      state.restingOrderId = result.orderId;

      return (
        `s-passive: placed ${state.side} ${chunk}@${state.iterPrice}c ` +
        `(orderId=${result.orderId}, status=${result.status})`
      );
    },
  };
}
