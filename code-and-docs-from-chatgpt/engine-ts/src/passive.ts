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

  let filled = 0;
  let remaining = config.size;
  let totalNotionalCents = 0;
  let feesIncurredDollars = 0;
  let totalSubmittedShares = 0;
  let resultStatus: PassiveResult['status'] = 'complete';
  let guardHit = false; // floor/ceiling stop — not an error
  let oneSidedWarned = false; // journal the no-opposite-liquidity event only once per run

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
    outer: while (remaining > 0) {
      // ── 1. Fetch orderbook ──────────────────────────────────────────────
      const orderbook = await client.getOrderbook(config.ticker, 20);

      // Derive best ask / best bid:
      //   bestAsk = lowest priceCents in yes[] (YES sellers)
      //   bestBid = 100 − lowest priceCents in no[] (NO sellers → implied YES bid)
      const yesAsks = orderbook.yes
        .filter((l) => l.size > 0)
        .sort((a, b) => a.priceCents - b.priceCents);
      const noAsks = orderbook.no
        .filter((l) => l.size > 0)
        .sort((a, b) => a.priceCents - b.priceCents);

      const bestAskCents = yesAsks[0]?.priceCents ?? 99;
      const bestBidCents =
        noAsks[0] != null ? 100 - noAsks[0].priceCents : 1;

      // One-sided book guard: detect missing liquidity on the side we depend on.
      // SELL needs counterparty buyers (=> noAsks), BUY needs counterparty sellers (=> yesAsks).
      const counterpartyEmpty =
        config.side === 'sell' ? noAsks.length === 0 : yesAsks.length === 0;
      if (counterpartyEmpty && !oneSidedWarned) {
        journal.append(jk('passive_no_opposite_liquidity'), {
          side: config.side,
          bestAskCents,
          bestBidCents,
        });
        oneSidedWarned = true;
      }

      const spreadCents = bestAskCents - bestBidCents;

      // ── 2. Spread check ─────────────────────────────────────────────────
      // Use the walk increment as the spread floor so a deci-cent walk on a
      // 0.5¢ spread isn't rejected as too tight.
      if (spreadCents < walkStepCents) {
        journal.append(jk('passive_spread_too_tight'), {
          bestBidCents,
          bestAskCents,
          spreadCents,
        });
        journal.append('loop_finished', {
          remaining,
          filled,
          status: 'spread_too_tight',
        });
        return buildResult(
          jobId,
          filled,
          totalNotionalCents,
          feesIncurredDollars,
          remaining,
          'spread_too_tight',
        );
      }

      // ── 3. Posting price for this chunk iteration ───────────────────────
      // spec: sell → ask − walkStep, buy → bid + walkStep
      // When `useMidpointPeg` is set (W3.3), prefer peg-to-mid; fall through
      // to default behavior if the book is one-sided.
      let iterPrice: number;
      if (config.useMidpointPeg) {
        const action = config.side === 'sell' ? 'sell' : 'buy';
        const offset = config.pegOffsetCents ?? 1;
        const pegged = computePeggedPrice(action, orderbook, offset, effectiveFloorCents);
        iterPrice = pegged !== null
          ? pegged
          : roundCents(config.side === 'sell' ? bestAskCents - walkStepCents : bestBidCents + walkStepCents);
      } else {
        iterPrice = roundCents(
          config.side === 'sell' ? bestAskCents - walkStepCents : bestBidCents + walkStepCents,
        );
      }

      const chunk = Math.min(chunkSize, remaining);

      // ── 4. Inner walk loop: post → wait timebox → cancel-replace ────────
      while (true) {
        // Guard: sell floor
        if (config.side === 'sell' && iterPrice < effectiveFloorCents) {
          journal.append(jk('passive_floor_hit'), {
            iterPrice,
            effectiveFloorCents,
          });
          guardHit = true;
          resultStatus = 'partial';
          break outer;
        }

        // Guard: buy ceiling
        if (
          config.side === 'buy' &&
          config.maxPriceCents !== undefined &&
          iterPrice > config.maxPriceCents
        ) {
          journal.append(jk('passive_ceiling_hit'), {
            iterPrice,
            maxPriceCents: config.maxPriceCents,
          });
          guardHit = true;
          resultStatus = 'partial';
          break outer;
        }

        // Safety cap on cumulative submitted shares across all reposts.
        if (totalSubmittedShares + chunk > submittedCap) {
          journal.append(jk('passive_safety_cap_breached'), {
            totalSubmittedShares,
            attemptedChunk: chunk,
            cap: submittedCap,
          });
          guardHit = true;
          resultStatus = 'partial';
          break outer;
        }

        if (config.dryRun) {
          // ── Dry-run: simulate immediate fill ──────────────────────────
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
          totalSubmittedShares += chunk;
          journal.append('order_placed', {
            orderId: dryOrderId,
            dryRun: true,
            decisionRequested: chunk,
          });
          filled += chunk;
          remaining = Math.max(0, remaining - chunk);
          totalNotionalCents += chunk * iterPrice;
          feesIncurredDollars = Number(
            (
              feesIncurredDollars +
              chunk * (iterPrice / 100) * KALSHI_FEE_RATE
            ).toFixed(4),
          );
          journal.append('order_reconciled', {
            orderId: dryOrderId,
            status: 'filled',
            filled: chunk,
            requested: chunk,
            remainingPosition: remaining,
          });
          break; // chunk done — continue outer loop

        } else {
          // ── Live path: post GTC ────────────────────────────────────────
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
          totalSubmittedShares += chunk;
          journal.append('order_placed', {
            orderId: created.orderId,
            payload,
            decisionRequested: chunk,
          });

          // ── Poll for fill within timebox ───────────────────────────────
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
            filled += actualFilled;
            remaining = Math.max(0, remaining - actualFilled);
            totalNotionalCents += actualFilled * iterPrice;
            feesIncurredDollars = Number(
              (
                feesIncurredDollars +
                actualFilled * (iterPrice / 100) * KALSHI_FEE_RATE
              ).toFixed(4),
            );
            journal.append('order_reconciled', {
              orderId: current.orderId,
              status: current.status,
              filled: actualFilled,
              requested: chunk,
              remainingPosition: remaining,
            });
            break; // chunk done (or partial fill — outer loop will re-chunk)

          } else {
            // ── Timebox expired — cancel and walk one tick ──────────────
            let cancelFilled = 0;
            try {
              const cancelled = await client.cancelOrder(created.orderId);
              cancelFilled = Math.max(0, Math.min(chunk, cancelled.filledCount));
              if (cancelFilled > 0) {
                filled += cancelFilled;
                remaining = Math.max(0, remaining - cancelFilled);
                totalNotionalCents += cancelFilled * iterPrice;
                feesIncurredDollars = Number(
                  (
                    feesIncurredDollars +
                    cancelFilled * (iterPrice / 100) * KALSHI_FEE_RATE
                  ).toFixed(4),
                );
              }
              journal.append('order_reconciled', {
                orderId: created.orderId,
                status: 'canceled',
                filled: cancelFilled,
                requested: chunk,
                remainingPosition: remaining,
              });
            } catch {
              // Ignore cancel errors
            }

            if (cancelFilled >= chunk || remaining <= 0) {
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

        if (loopDelayMs > 0) await sleep(loopDelayMs);
      } // end inner walk loop
    } // end outer while

  } catch (err) {
    if (!guardHit) {
      resultStatus = 'error';
      const msg = err instanceof Error ? err.message : String(err);
      journal.append('loop_error', { error: msg });
    }
  } finally {
    if (resultStatus === 'complete' && remaining > 0) {
      resultStatus = 'partial';
    }
    journal.append('loop_finished', { remaining, filled, status: resultStatus });
  }

  return buildResult(
    jobId,
    filled,
    totalNotionalCents,
    feesIncurredDollars,
    remaining,
    resultStatus,
  );
}
