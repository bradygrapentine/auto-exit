/**
 * passive.ts — S1 Passive strategy: post-and-walk, side-parameterized.
 *
 * Posts a GTC limit order one tick inside the spread each iteration.
 * If unfilled within passiveTimeboxMs, cancels and shifts one tick in the
 * passive direction (lower for sell, higher for buy), then re-posts.
 *
 * Spread detection:
 *   bestAsk = lowest priceCents in yes[] (sellers' ask for YES)
 *   bestBid = 100 − lowest priceCents in no[] (implied YES bid from NO side)
 *   spread  = bestAsk − bestBid (cents)
 *
 * If spread < 1¢, returns status 'spread_too_tight' without placing any order.
 *
 * File-touch boundary: this file only. Does NOT import aggressive.ts.
 */

import crypto from 'node:crypto';
import { Journal, generateJobId } from './journal.js';
import { getSafety } from './safety.js';
import { computePeggedPrice } from './pegToMid.js';
import type {
  JournalKind,
  KalshiClientLike,
  OrderPayload,
  OrderResult,
  SafetyConfig,
} from './types.js';

// Passive-specific journal event kinds not yet in the JournalKind union.
// We cast at call-site to avoid touching types.ts (per file-touch boundary).
function jk(s: string): JournalKind {
  return s as JournalKind;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_PASSIVE_TIMEBOX_MS = 60_000;
const DEFAULT_LOOP_DELAY_MS = 0;
const KALSHI_FEE_RATE = 0.015; // 1.5% of notional

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface PassiveConfig {
  ticker: string;
  side: 'buy' | 'sell';
  size: number;
  /** Buy side: max price ceiling in cents. Walk stops if iterPrice would exceed this. */
  maxPriceCents?: number;
  /** Sell side: min price floor in cents. Overrides SafetyConfig.floorPriceCents when higher. */
  minPriceCents?: number;
  /** Contracts per order chunk. Default 100. */
  chunkSize?: number;
  /** How long to wait for a resting GTC fill before cancelling and walking. Default 60_000ms. */
  passiveTimeboxMs?: number;
  /** Delay between chunk iterations. Default 0. */
  loopDelayMs?: number;
  /**
   * Walk increment per timebox iteration, in cents. Default 1. Set to 0.1 for
   * deci-cent ticks (Kalshi quotes 0.001-dollar ticks below 10¢; without
   * sub-cent walks the strategy degenerates to a single price on cheap markets).
   * Initial post is also offset by this amount: sell → bestAsk − walkStep,
   * buy → bestBid + walkStep.
   */
  walkStepCents?: number;
  /**
   * Hard cap on cumulative submitted-share volume across reposts as a multiple
   * of `size`. Counts ALL createOrder sizes regardless of fills, so a strategy
   * that timeboxes-and-reposts indefinitely cannot oversubmit. **Default 5.**
   * Higher than `ExitConfig.safetySubmittedMultiple` (1.5) because passive
   * walks legitimately re-submit the same intent at different prices —
   * counting walk-reposts toward the cap requires more headroom than a
   * one-shot IoC sweep.
   */
  safetySubmittedMultiple?: number;
  /**
   * Opt-in: use peg-to-mid pricing (W3.3) instead of static ask−walkStep / bid+walkStep.
   * When true, iterPrice is set to floor(mid − pegOffsetCents) (sell) or
   * ceil(mid + pegOffsetCents) (buy). Falls through to default behavior when the
   * book is one-sided (peg cannot compute mid).
   */
  useMidpointPeg?: boolean;
  /** Offset from mid when peg is enabled. Default 1¢. */
  pegOffsetCents?: number;
  dryRun?: boolean;
  jobId?: string;
  /** Override KEA_HOME (for tests). */
  keaHome?: string;
}

export interface PassiveResult {
  jobId: string;
  filled: number;
  avgPriceCents: number;
  feesIncurredDollars: number;
  remaining: number;
  status: 'complete' | 'partial' | 'error' | 'spread_too_tight';
}

// ── Per-tick seam (callable by backtest adapters without sleep) ───────────────

/**
 * Discriminated outcome returned by `runOneTick`.
 * `continue` → caller should loop again.
 * `break_loop` → caller should exit the outer while loop (reason encodes why).
 *
 * Reasons map 1:1 to the original `break outer` / early-return conditions:
 *   - 'spread_too_tight'      : spread < walkStepCents on first fetch of this tick
 *   - 'floor_hit'             : sell price walked below effectiveFloorCents
 *   - 'ceiling_hit'           : buy price walked above maxPriceCents
 *   - 'safety_cap_breached'   : cumulative submitted shares would exceed cap
 */
export type PassiveTickOutcome =
  | { kind: 'continue' }
  | { kind: 'break_loop'; reason: string };

/** Mutable per-run accumulators threaded through runOneTick. */
export interface PassiveRunState {
  filled: number;
  remaining: number;
  totalNotionalCents: number;
  feesIncurredDollars: number;
  totalSubmittedShares: number;
  guardHit: boolean;
  oneSidedWarned: boolean;
  /** Backtest mode only: orderId of the resting GTC carried across ticks. */
  pendingOrderId?: string;
  /** Backtest mode only: limit price of the resting GTC, used to decide cancel/replace. */
  pendingPriceCents?: number;
}

/** Everything runOneTick needs that isn't the mutable state. */
export interface PassiveRunDeps {
  client: KalshiClientLike;
  config: PassiveConfig;
  journal: Journal;
  chunkSize: number;
  passiveTimeboxMs: number;
  walkStepCents: number;
  submittedCap: number;
  effectiveFloorCents: number;
  kalshiSide: 'yes' | 'no';
  roundCents: (c: number) => number;
}

/**
 * Execute ONE outer-loop iteration of the passive strategy.
 *
 * Performs: fetch book → spread check → price decide → inner walk loop
 * (post GTC, poll timebox, cancel-replace).
 *
 * The `await sleep(loopDelayMs)` between outer iterations stays in `run()`,
 * not here, so backtest adapters can call this synchronously without sleeping.
 */
export async function runOneTick(
  state: PassiveRunState,
  deps: PassiveRunDeps,
): Promise<PassiveTickOutcome> {
  const { client, config, journal, chunkSize, passiveTimeboxMs, walkStepCents,
          submittedCap, effectiveFloorCents, kalshiSide, roundCents } = deps;

  // ── 1. Fetch orderbook ──────────────────────────────────────────────────────
  const orderbook = await client.getOrderbook(config.ticker, 20);

  const yesAsks = orderbook.yes
    .filter((l) => l.size > 0)
    .sort((a, b) => a.priceCents - b.priceCents);
  const noAsks = orderbook.no
    .filter((l) => l.size > 0)
    .sort((a, b) => a.priceCents - b.priceCents);

  // SH-PASSIVE-SPREAD-LOGIC: derive `decisionAskCents` / `decisionBidCents` —
  // the prices passive will reference for spread + posting math. Mirrors
  // `runOneTickBacktest`'s cross-spread-validity logic so production and
  // backtest paths stay semantically aligned.
  //
  //   • Cross-quoted (no-side present AND cross-spread positive): use
  //     the real yes ask = lowest yes level, yes bid = 100 − lowest no.
  //   • Yes-depth fallback (no-side empty OR cross-spread inverted —
  //     e.g. yes=[14,55], no=[5] would give ask=14, bid=95, spread=−81):
  //     synthesize from yes depth — ask = highest yes, bid = lowest yes.
  //     Neither is a true quote, but the spread guard + walk math need a
  //     positive spread to run. Inverted cross-spreads are transient
  //     arbitrage states that Kalshi auto-matches; passive shouldn't
  //     break_loop on them.
  //
  // For SELL under yes-depth fallback `iterPrice = decisionAsk − walkStep`
  // sits BELOW visible yes levels — intentional. Kalshi matches at the
  // actual best bid regardless of how low the limit is.
  //
  // Journal field names (`bestAskCents`, `bestBidCents`) preserved for
  // backward compat with on-disk journal data.
  const crossAskCents = yesAsks[0]?.priceCents ?? 99;
  const crossBidCents = noAsks[0] != null
    ? 100 - noAsks[0].priceCents
    : Number.NEGATIVE_INFINITY;
  const crossSpreadValid = noAsks.length > 0 && crossAskCents - crossBidCents > 0;

  const decisionAskCents = crossSpreadValid
    ? crossAskCents
    : (yesAsks[yesAsks.length - 1]?.priceCents ?? 99);
  const decisionBidCents = crossSpreadValid
    ? crossBidCents
    : (yesAsks[0]?.priceCents ?? 1);

  const counterpartyEmpty =
    config.side === 'sell' ? noAsks.length === 0 : yesAsks.length === 0;
  if (counterpartyEmpty && !state.oneSidedWarned) {
    journal.append(jk('passive_no_opposite_liquidity'), {
      side: config.side,
      bestAskCents: decisionAskCents,
      bestBidCents: decisionBidCents,
    });
    state.oneSidedWarned = true;
  }

  const spreadCents = decisionAskCents - decisionBidCents;

  // ── 2. Spread check ─────────────────────────────────────────────────────────
  if (spreadCents < walkStepCents) {
    journal.append(jk('passive_spread_too_tight'), {
      bestBidCents: decisionBidCents,
      bestAskCents: decisionAskCents,
      spreadCents,
    });
    // Note: loop_finished is written by run()'s finally block, not here.
    return { kind: 'break_loop', reason: 'spread_too_tight' };
  }

  // ── 3. Posting price ────────────────────────────────────────────────────────
  let iterPrice: number;
  if (config.useMidpointPeg) {
    const action = config.side === 'sell' ? 'sell' : 'buy';
    const offset = config.pegOffsetCents ?? 1;
    const pegged = computePeggedPrice(action, orderbook, offset, effectiveFloorCents);
    iterPrice = pegged !== null
      ? pegged
      : roundCents(config.side === 'sell' ? decisionAskCents - walkStepCents : decisionBidCents + walkStepCents);
  } else {
    iterPrice = roundCents(
      config.side === 'sell' ? decisionAskCents - walkStepCents : decisionBidCents + walkStepCents,
    );
  }

  const chunk = Math.min(chunkSize, state.remaining);

  // ── 4. Inner walk loop: post → wait timebox → cancel-replace ────────────────
  while (true) {
    // Guard: sell floor
    if (config.side === 'sell' && iterPrice < effectiveFloorCents) {
      journal.append(jk('passive_floor_hit'), { iterPrice, effectiveFloorCents });
      state.guardHit = true;
      return { kind: 'break_loop', reason: 'floor_hit' };
    }

    // Guard: buy ceiling
    if (
      config.side === 'buy' &&
      config.maxPriceCents !== undefined &&
      iterPrice > config.maxPriceCents
    ) {
      journal.append(jk('passive_ceiling_hit'), { iterPrice, maxPriceCents: config.maxPriceCents });
      state.guardHit = true;
      return { kind: 'break_loop', reason: 'ceiling_hit' };
    }

    // Safety cap on cumulative submitted shares
    if (state.totalSubmittedShares + chunk > submittedCap) {
      journal.append(jk('passive_safety_cap_breached'), {
        totalSubmittedShares: state.totalSubmittedShares,
        attemptedChunk: chunk,
        cap: submittedCap,
      });
      state.guardHit = true;
      return { kind: 'break_loop', reason: 'safety_cap_breached' };
    }

    if (config.dryRun) {
      // ── Dry-run: simulate immediate fill ──────────────────────────────────
      const clientOrderId = `kea-passive-dry-${Date.now()}-${crypto.randomUUID()}`;
      journal.append('order_intent', {
        clientOrderId,
        payload: {
          ticker: config.ticker,
          action: config.side,
          side: kalshiSide,
          count: chunk,
          priceCents: iterPrice,
          client_order_id: clientOrderId,
        },
      });
      const dryOrderId = `dry-${clientOrderId}`;
      state.totalSubmittedShares += chunk;
      journal.append('order_placed', {
        orderId: dryOrderId,
        dryRun: true,
        decisionRequested: chunk,
      });
      state.filled += chunk;
      state.remaining = Math.max(0, state.remaining - chunk);
      state.totalNotionalCents += chunk * iterPrice;
      state.feesIncurredDollars = Number(
        (state.feesIncurredDollars + chunk * (iterPrice / 100) * KALSHI_FEE_RATE).toFixed(4),
      );
      journal.append('order_reconciled', {
        orderId: dryOrderId,
        status: 'filled',
        filled: chunk,
        requested: chunk,
        remainingPosition: state.remaining,
      });
      break; // chunk done — continue outer loop

    } else {
      // ── Live path: post GTC ────────────────────────────────────────────────
      const clientOrderId = `kea-passive-${Date.now()}-${crypto.randomUUID()}`;
      const payload: OrderPayload = {
        ticker: config.ticker,
        action: config.side === 'sell' ? 'sell' : 'buy',
        side: kalshiSide,
        count: chunk,
        type: 'limit',
        reduce_only: false,
        time_in_force: 'good_till_canceled',
        client_order_id: clientOrderId,
        yes_price_dollars:
          kalshiSide === 'yes' ? centsToPrice(iterPrice) : undefined,
        no_price_dollars:
          kalshiSide === 'no' ? centsToPrice(iterPrice) : undefined,
      };

      journal.append('order_intent', { clientOrderId, payload });

      const created = await client.createOrder(payload);
      state.totalSubmittedShares += chunk;
      journal.append('order_placed', {
        orderId: created.orderId,
        payload,
        decisionRequested: chunk,
      });

      // ── Poll for fill within timebox ─────────────────────────────────────
      const deadline = Date.now() + passiveTimeboxMs;
      let current: OrderResult = created;
      while (Date.now() < deadline && !isTerminal(current)) {
        const waitMs = Math.min(500, Math.max(0, deadline - Date.now()));
        if (waitMs > 0) await sleep(waitMs);
        try {
          current = await client.getOrder(created.orderId);
        } catch {
          break;
        }
      }

      if (isTerminal(current) && current.status !== 'canceled') {
        // Filled within timebox (fully or partially)
        const actualFilled = Math.max(0, Math.min(chunk, current.filledCount));
        state.filled += actualFilled;
        state.remaining = Math.max(0, state.remaining - actualFilled);
        state.totalNotionalCents += actualFilled * iterPrice;
        state.feesIncurredDollars = Number(
          (state.feesIncurredDollars + actualFilled * (iterPrice / 100) * KALSHI_FEE_RATE).toFixed(4),
        );
        journal.append('order_reconciled', {
          orderId: current.orderId,
          status: current.status,
          filled: actualFilled,
          requested: chunk,
          remainingPosition: state.remaining,
        });
        break; // chunk done

      } else {
        // ── Timebox expired — cancel and walk one tick ─────────────────────
        let cancelFilled = 0;
        try {
          const cancelled = await client.cancelOrder(created.orderId);
          cancelFilled = Math.max(0, Math.min(chunk, cancelled.filledCount));
          if (cancelFilled > 0) {
            state.filled += cancelFilled;
            state.remaining = Math.max(0, state.remaining - cancelFilled);
            state.totalNotionalCents += cancelFilled * iterPrice;
            state.feesIncurredDollars = Number(
              (state.feesIncurredDollars + cancelFilled * (iterPrice / 100) * KALSHI_FEE_RATE).toFixed(4),
            );
          }
          journal.append('order_reconciled', {
            orderId: created.orderId,
            status: 'canceled',
            filled: cancelFilled,
            requested: chunk,
            remainingPosition: state.remaining,
          });
        } catch {
          // Ignore cancel errors
        }

        if (cancelFilled >= chunk || state.remaining <= 0) {
          break; // filled on cancel (or remaining exhausted), chunk done
        }

        // Shift one tick in passive direction and loop
        iterPrice = roundCents(
          config.side === 'sell' ? iterPrice - walkStepCents : iterPrice + walkStepCents,
        );
        journal.append(jk('passive_walk_tick'), {
          newPriceCents: iterPrice,
          side: config.side,
          walkStepCents,
        });
      }
    }
  } // end inner walk loop

  return { kind: 'continue' };
}

/**
 * Backtest-mode passive runOneTick. Designed for tick-by-tick replay drivers.
 *
 * Differences from production runOneTick:
 *   - No inner walk loop. Each call posts ONE GTC (or checks existing one),
 *     returns continue. Multiple harness ticks accumulate fills naturally.
 *   - Tracks resting order across ticks via state.pendingOrderId / pendingPriceCents.
 *   - Reuses guard checks (spread / one-sided / floor / ceiling / safety_cap).
 *
 * The adapter (passiveAdapter.ts) calls this instead of runOneTick so that
 * resting GTC orders are not immediately cancelled before the replay client's
 * naive fill model can register the fill. passiveTimeboxMs is irrelevant here.
 */
export async function runOneTickBacktest(
  state: PassiveRunState,
  deps: PassiveRunDeps,
): Promise<PassiveTickOutcome> {
  if (state.remaining <= 0) return { kind: 'break_loop', reason: 'filled' };

  const { client, config, journal, chunkSize, walkStepCents,
          submittedCap, effectiveFloorCents, kalshiSide, roundCents } = deps;

  // ── 1. Fetch orderbook ──────────────────────────────────────────────────────
  const orderbook = await client.getOrderbook(config.ticker, 20);

  const yesAsks = orderbook.yes
    .filter((l) => l.size > 0)
    .sort((a, b) => a.priceCents - b.priceCents);
  const noAsks = orderbook.no
    .filter((l) => l.size > 0)
    .sort((a, b) => a.priceCents - b.priceCents);

  // SH-PASSIVE-STILL-NO-FILLS: real Kalshi recordings store yes-side BIDS (not
  // cross-side asks), so `crossAsk = yesAsks[0]` and `crossBid = 100 - noAsks[0]`
  // can produce a NEGATIVE spread (e.g. KXINXU: yes=14, no=5 → ask=14, bid=95,
  // spread=-81). When that happens we fall back to a yes-depth interpretation
  // (ask = highest yes, bid = lowest yes). The cross-quoted path is preserved
  // for live-style books and existing tests.
  const crossAskCents = yesAsks[0]?.priceCents ?? 99;
  const crossBidCents = noAsks[0] != null ? 100 - noAsks[0].priceCents : Number.NEGATIVE_INFINITY;
  const crossSpreadValid = noAsks.length > 0 && crossAskCents - crossBidCents > 0;

  // SH-PASSIVE-SELL-LIMIT: these aren't true ask/bid quotes — they're derived
  // "decision" prices that vary depending on whether the cross-spread fallback
  // applies (cross-quoted live books vs. bid-quoted recordings). For SELL on
  // bid-quoted books, `iterPrice = decisionAsk − walkStep` deliberately sits
  // below all visible yes levels: production Kalshi matches at the real best
  // bid regardless of how low the limit is, while the backtest fill model
  // treats the limit as a floor (per SH-FILL-SIM-DIRECTIONAL) and walks
  // descending until a yes level crosses. Journal field names preserved
  // (bestAskCents / bestBidCents) for backward compat with on-disk data.
  const decisionAskCents = crossSpreadValid
    ? crossAskCents
    : (yesAsks[yesAsks.length - 1]?.priceCents ?? 99);
  const decisionBidCents = crossSpreadValid
    ? crossBidCents
    : (yesAsks[0]?.priceCents ?? 1);

  // One-sided book warning (same as runOneTick)
  const counterpartyEmpty =
    config.side === 'sell' ? noAsks.length === 0 : yesAsks.length === 0;
  if (counterpartyEmpty && !state.oneSidedWarned) {
    journal.append(jk('passive_no_opposite_liquidity'), {
      side: config.side,
      bestAskCents: decisionAskCents,
      bestBidCents: decisionBidCents,
    });
    state.oneSidedWarned = true;
  }

  const spreadCents = decisionAskCents - decisionBidCents;

  // ── 2. Check pending order status FIRST — always drain a fill before spread/guard checks.
  //       If a resting GTC filled while the spread tightened, we must record the fill.
  if (state.pendingOrderId) {
    let statusResult: OrderResult;
    try {
      statusResult = await client.getOrder(state.pendingOrderId);
    } catch {
      // Can't query — treat as still resting; next tick will retry
      return { kind: 'continue' };
    }

    if (statusResult.status === 'filled' || statusResult.remainingCount <= 0) {
      const filledNow = statusResult.filledCount;
      const priceCentsUsed = state.pendingPriceCents ?? decisionAskCents;
      state.filled += filledNow;
      state.remaining = Math.max(0, state.remaining - filledNow);
      if (statusResult.takerFeesDollars) state.feesIncurredDollars += statusResult.takerFeesDollars;
      state.totalNotionalCents += filledNow * priceCentsUsed;
      state.pendingOrderId = undefined;
      state.pendingPriceCents = undefined;
      if (state.remaining <= 0) return { kind: 'break_loop', reason: 'filled' };
    } else if (statusResult.status === 'canceled') {
      state.pendingOrderId = undefined;
      state.pendingPriceCents = undefined;
    }
    // else: still resting — fall through to spread/price checks
  }

  // ── 3. Spread check ─────────────────────────────────────────────────────────
  // SH-PASSIVE-SPREAD-LOGIC: skip the spread guard on the FIRST tick (no
  // pending order yet, no fills yet). The guard is a stop-loop safety after
  // we've already posted; firing it on tick 1 prevents passive from ever
  // testing the book on skewed / one-sided markets where the cross-spread
  // fallback math computes a tight spread but the yes-depth is healthy.
  const isFirstTick = state.pendingOrderId === undefined && state.filled === 0;
  if (!isFirstTick && spreadCents < walkStepCents) {
    // Cancel any resting order before stopping — spread too tight to repost.
    if (state.pendingOrderId) {
      try { await client.cancelOrder(state.pendingOrderId); } catch { /* ignore */ }
      state.pendingOrderId = undefined;
      state.pendingPriceCents = undefined;
    }
    journal.append(jk('passive_spread_too_tight'), {
      bestBidCents: decisionBidCents,
      bestAskCents: decisionAskCents,
      spreadCents,
    });
    return { kind: 'break_loop', reason: 'spread_too_tight' };
  }

  // ── 4. Decide this tick's posting price ─────────────────────────────────────
  let iterPrice: number;
  if (config.useMidpointPeg) {
    const offset = config.pegOffsetCents ?? 1;
    const pegged = computePeggedPrice(
      config.side === 'sell' ? 'sell' : 'buy',
      orderbook,
      offset,
      effectiveFloorCents,
    );
    iterPrice = pegged !== null
      ? pegged
      : roundCents(config.side === 'sell' ? decisionAskCents - walkStepCents : decisionBidCents + walkStepCents);
  } else {
    iterPrice = roundCents(
      config.side === 'sell' ? decisionAskCents - walkStepCents : decisionBidCents + walkStepCents,
    );
  }

  // ── 5. Guard: sell floor ─────────────────────────────────────────────────────
  if (config.side === 'sell' && iterPrice < effectiveFloorCents) {
    journal.append(jk('passive_floor_hit'), { iterPrice, effectiveFloorCents });
    state.guardHit = true;
    return { kind: 'break_loop', reason: 'floor_hit' };
  }

  // ── 6. Guard: buy ceiling ────────────────────────────────────────────────────
  if (
    config.side === 'buy' &&
    config.maxPriceCents !== undefined &&
    iterPrice > config.maxPriceCents
  ) {
    journal.append(jk('passive_ceiling_hit'), { iterPrice, maxPriceCents: config.maxPriceCents });
    state.guardHit = true;
    return { kind: 'break_loop', reason: 'ceiling_hit' };
  }

  // ── 7. Cancel+replace if price decision changed ──────────────────────────────
  if (state.pendingOrderId && state.pendingPriceCents !== iterPrice) {
    try {
      const cancelled = await client.cancelOrder(state.pendingOrderId);
      const cancelFilled = Math.max(0, Math.min(state.remaining, cancelled.filledCount));
      if (cancelFilled > 0) {
        state.filled += cancelFilled;
        state.remaining = Math.max(0, state.remaining - cancelFilled);
        state.totalNotionalCents += cancelFilled * (state.pendingPriceCents ?? iterPrice);
        if (cancelled.takerFeesDollars) state.feesIncurredDollars += cancelled.takerFeesDollars;
      }
    } catch {
      // Ignore cancel errors
    }
    state.pendingOrderId = undefined;
    state.pendingPriceCents = undefined;
    if (state.remaining <= 0) return { kind: 'break_loop', reason: 'filled' };
  }

  // ── 8. Post GTC if no pending order ─────────────────────────────────────────
  if (!state.pendingOrderId) {
    const chunk = Math.min(chunkSize, state.remaining);

    // Guard: safety cap
    if (state.totalSubmittedShares + chunk > submittedCap) {
      journal.append(jk('passive_safety_cap_breached'), {
        totalSubmittedShares: state.totalSubmittedShares,
        attemptedChunk: chunk,
        cap: submittedCap,
      });
      state.guardHit = true;
      return { kind: 'break_loop', reason: 'safety_cap_breached' };
    }

    const clientOrderId = `kea-passive-bt-${Date.now()}-${crypto.randomUUID()}`;
    const payload: OrderPayload = {
      ticker: config.ticker,
      action: config.side === 'sell' ? 'sell' : 'buy',
      side: kalshiSide,
      count: chunk,
      type: 'limit',
      reduce_only: false,
      time_in_force: 'good_till_canceled',
      client_order_id: clientOrderId,
      yes_price_dollars:
        kalshiSide === 'yes' ? centsToPrice(iterPrice) : undefined,
      no_price_dollars:
        kalshiSide === 'no' ? centsToPrice(iterPrice) : undefined,
    };

    journal.append('order_intent', { clientOrderId, payload });

    state.totalSubmittedShares += chunk;
    const result = await client.createOrder(payload);

    journal.append('order_placed', {
      orderId: result.orderId,
      payload,
      decisionRequested: chunk,
      backtestMode: true,
    });

    if (result.status === 'filled' || result.remainingCount <= 0) {
      // Replay client filled immediately at createOrder time
      const filledNow = result.filledCount;
      state.filled += filledNow;
      state.remaining = Math.max(0, state.remaining - filledNow);
      state.totalNotionalCents += filledNow * iterPrice;
      if (result.takerFeesDollars) state.feesIncurredDollars += result.takerFeesDollars;
      journal.append('order_reconciled', {
        orderId: result.orderId,
        status: result.status,
        filled: filledNow,
        requested: chunk,
        remainingPosition: state.remaining,
      });
      if (state.remaining <= 0) return { kind: 'break_loop', reason: 'filled' };
    } else {
      // Order is resting — carry across ticks
      state.pendingOrderId = result.orderId;
      state.pendingPriceCents = iterPrice;
    }
  }

  return { kind: 'continue' };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function checkForbiddenTickers(ticker: string, safety: SafetyConfig): void {
  const forbidden = safety.forbiddenTickers.map((e) => e.ticker);
  if (forbidden.includes(ticker)) {
    throw new Error(
      `ticker '${ticker}' is in forbiddenTickers — PassiveRunner refuses to start`,
    );
  }
}

function centsToPrice(cents: number): string {
  return (cents / 100).toFixed(4);
}

function isTerminal(result: OrderResult): boolean {
  return result.status === 'filled' || result.status === 'canceled' || result.remainingCount <= 0;
}

function buildResult(
  jobId: string,
  filled: number,
  totalNotionalCents: number,
  feesIncurredDollars: number,
  remaining: number,
  status: PassiveResult['status'],
): PassiveResult {
  const avgPriceCents =
    filled > 0 ? Number((totalNotionalCents / filled).toFixed(4)) : 0;
  return { jobId, filled, avgPriceCents, feesIncurredDollars, remaining, status };
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Run the passive (post-and-walk) strategy.
 */
export async function run(
  client: KalshiClientLike,
  config: PassiveConfig,
): Promise<PassiveResult> {
  const jobId = config.jobId ?? generateJobId();
  const journal = new Journal(jobId, config.keaHome);

  // ── Safety guard-rails ────────────────────────────────────────────────────
  const safety = getSafety();
  checkForbiddenTickers(config.ticker, safety);

  journal.append('safety_loaded', {
    floorPriceCents: safety.floorPriceCents,
    forbiddenCount: safety.forbiddenTickers.length,
  });

  const chunkSize = config.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const passiveTimeboxMs = config.passiveTimeboxMs ?? DEFAULT_PASSIVE_TIMEBOX_MS;
  const loopDelayMs = config.loopDelayMs ?? DEFAULT_LOOP_DELAY_MS;
  const walkStepCents = config.walkStepCents ?? 1;
  const safetyMultiple = config.safetySubmittedMultiple ?? 5;
  const submittedCap = config.size * safetyMultiple;
  const kalshiSide = config.ticker.endsWith('_NO') ? 'no' : 'yes';

  // Float-cleanup helper so deci-cent arithmetic doesn't accumulate drift
  // (0.1 + 0.2 != 0.3 etc.). Round to 4 decimals, the precision Kalshi accepts.
  const roundCents = (c: number): number => Math.round(c * 10_000) / 10_000;

  // Effective floor for sell side: Math.max is correct because higher floor = tighter constraint for seller
  const effectiveFloorCents =
    config.side === 'sell'
      ? Math.max(safety.floorPriceCents, config.minPriceCents ?? 0)
      : 0;

  const state: PassiveRunState = {
    filled: 0,
    remaining: config.size,
    totalNotionalCents: 0,
    feesIncurredDollars: 0,
    totalSubmittedShares: 0,
    guardHit: false,
    oneSidedWarned: false,
  };

  const deps: PassiveRunDeps = {
    client,
    config,
    journal,
    chunkSize,
    passiveTimeboxMs,
    walkStepCents,
    submittedCap,
    effectiveFloorCents,
    kalshiSide,
    roundCents,
  };

  let resultStatus: PassiveResult['status'] = 'complete';

  journal.append('loop_started', {
    ticker: config.ticker,
    side: config.side,
    size: config.size,
    dryRun: config.dryRun ?? false,
    passiveTimeboxMs,
    effectiveFloorCents,
    strategy: 'passive',
  });

  try {
    while (state.remaining > 0) {
      const outcome = await runOneTick(state, deps);
      if (outcome.kind === 'break_loop') {
        if (outcome.reason === 'spread_too_tight') {
          resultStatus = 'spread_too_tight';
        } else {
          // floor_hit / ceiling_hit / safety_cap_breached
          resultStatus = 'partial';
        }
        break;
      }
      if (loopDelayMs > 0) await sleep(loopDelayMs);
    }

  } catch (err) {
    if (!state.guardHit) {
      resultStatus = 'error';
      const msg = err instanceof Error ? err.message : String(err);
      journal.append('loop_error', { error: msg });
    }
  } finally {
    if (resultStatus === 'complete' && state.remaining > 0) {
      resultStatus = 'partial';
    }
    // Don't overwrite a terminal status set by break_loop handling
    journal.append('loop_finished', {
      remaining: state.remaining,
      filled: state.filled,
      status: resultStatus,
    });
  }

  return buildResult(
    jobId,
    state.filled,
    state.totalNotionalCents,
    state.feesIncurredDollars,
    state.remaining,
    resultStatus,
  );
}
