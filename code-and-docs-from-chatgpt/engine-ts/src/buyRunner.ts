import crypto from 'node:crypto';
import fs from 'node:fs';
import { Journal, generateJobId } from './journal.js';
import { getSafety, checkPreTradeRisk, appendRealizedLoss } from './safety.js';
import { getPortfolioNAVDollars } from './balance.js';
import { chooseChunkSize } from './runnerUtils.js';
import type { BuyConfig, BuyResult, JobStatus, KalshiClientLike, LoopEvent, OrderPayload, OrderResult, SafetyConfig, TcaEntry } from './types.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_MAX_ORDERS = 50;
const DEFAULT_ORDERBOOK_DEPTH = 20;
const DEFAULT_LOOP_DELAY_MS = 0;
const KALSHI_FEE_RATE = 0.015; // 1.5% of notional

export interface BuyRunnerOptions {
  /** If set, attempt crash-safe resume from this jobId's journal. */
  resumeFromJobId?: string;
  /** Override the KEA_HOME directory (mainly for tests). */
  keaHome?: string;
}

/** Check forbidden tickers from safety config. Throws if ticker is forbidden. */
function checkForbiddenTickers(ticker: string, safety: SafetyConfig): void {
  const forbidden = safety.forbiddenTickers.map((e) => e.ticker);
  if (forbidden.includes(ticker)) {
    throw new Error(
      `ticker '${ticker}' is in forbiddenTickers — BuyRunner refuses to start`,
    );
  }
}

export class BuyRunner {
  readonly jobId: string;
  private stopRequested = false;
  private client: KalshiClientLike;
  private journal: Journal;
  private events: LoopEvent[] = [];
  private filled = 0;
  private totalNotionalCents = 0; // filled × priceCents, for avgPriceCents computation
  private feesIncurredDollars = 0;
  private remaining: number;
  private ordersAttempted = 0;

  constructor(client: KalshiClientLike, private config: BuyConfig, opts?: BuyRunnerOptions) {
    this.client = client;
    this.jobId = opts?.resumeFromJobId ?? config.jobId ?? generateJobId();
    this.journal = new Journal(this.jobId, opts?.keaHome);
    this.remaining = config.size;
  }

  stop(reason = 'stop_requested') {
    this.stopRequested = true;
    this.log('warn', reason);
  }

  private log(level: LoopEvent['level'], message: string, data?: unknown) {
    const evt = { ts: new Date().toISOString(), level, message, data };
    this.events.push(evt);
    if (this.events.length > 300) this.events.shift();
    console.log(JSON.stringify(evt));
  }

  private killSwitchExists(): boolean {
    return Boolean(this.config.killSwitchPath && fs.existsSync(this.config.killSwitchPath));
  }

  private isTerminal(result: OrderResult): boolean {
    return result.status === 'filled' || result.status === 'canceled' || result.remainingCount <= 0;
  }

  private async reconcileOrder(initial: OrderResult): Promise<OrderResult> {
    if (this.isTerminal(initial)) return initial;
    let current = initial;
    // Simple poll loop (no cancel-on-stale for buys — just poll twice)
    for (let i = 0; i < 4; i += 1) {
      if (this.stopRequested) break;
      await sleep(250);
      try {
        current = await this.client.getOrder(initial.orderId);
      } catch {
        continue;
      }
      if (this.isTerminal(current)) return current;
    }
    return current;
  }

  /**
   * Resume path: read journal, compute already-filled quantity from reconciled entries.
   * Returns true if job was already finished.
   */
  private async resumeFromJournal(): Promise<boolean> {
    if (this.journal.isFinished()) {
      this.log('info', 'resume_noop', { jobId: this.jobId, reason: 'buy_loop_finished in journal' });
      return true;
    }

    // Phase 1: reconcile pending order_intent entries (crash window)
    const pendingIntents = this.journal.pendingIntents();
    if (pendingIntents.length > 0) {
      this.journal.append('resume_started', { jobId: this.jobId, pendingIntentCount: pendingIntents.length });
      this.log('info', 'resume_intent_reconcile_started', { jobId: this.jobId, pendingIntentCount: pendingIntents.length });

      for (const intent of pendingIntents) {
        let found: OrderResult | null = null;
        try {
          found = await this.client.findOrderByClientOrderId(intent.clientOrderId);
        } catch (err) {
          this.log('warn', 'resume_find_by_client_order_id_failed', {
            clientOrderId: intent.clientOrderId,
            error: err instanceof Error ? err.message : String(err),
          });
        }

        if (!found) {
          this.log('warn', 'resume_intent_not_found', {
            clientOrderId: intent.clientOrderId,
            note: 'order likely never reached exchange; skipping decrement',
          });
          continue;
        }

        this.journal.append('order_placed', {
          orderId: found.orderId,
          payload: intent.payload,
          decisionRequested: intent.payload.count,
        });
        this.log('info', 'resume_intent_recovered', {
          clientOrderId: intent.clientOrderId,
          orderId: found.orderId,
          status: found.status,
        });
      }
    }

    // Phase 2: reconcile order_placed with no matching order_reconciled
    const pending = this.journal.pendingOrders();
    if (pending.length > 0 || pendingIntents.length > 0) {
      if (pendingIntents.length === 0) {
        this.journal.append('resume_started', { jobId: this.jobId, pendingCount: pending.length });
        this.log('info', 'resume_started', { jobId: this.jobId, pendingCount: pending.length });
      }

      for (const op of pending) {
        let result: OrderResult;
        try {
          result = await this.client.getOrder(op.orderId);
        } catch (err) {
          this.log('warn', 'resume_get_order_failed', { orderId: op.orderId, error: err instanceof Error ? err.message : String(err) });
          continue;
        }

        if (!this.isTerminal(result)) {
          result = await this.reconcileOrder(result);
        }

        const filled = Math.max(0, Math.min(op.decisionRequested, result.filledCount));
        this.journal.append('resume_reconciled', {
          orderId: op.orderId,
          status: result.status,
          filled,
          requested: op.decisionRequested,
        });
        this.log('info', 'resume_reconciled', { orderId: op.orderId, status: result.status, filled });
      }
    }

    // Recompute remaining from journal
    const filledSoFar = this.journal.computeFilledTotal();
    this.filled = filledSoFar;
    this.remaining = Math.max(0, this.config.size - filledSoFar);
    return false;
  }

  async run(): Promise<BuyResult> {
    // Load safety and check forbidden tickers
    const safetySnapshot = getSafety();
    checkForbiddenTickers(this.config.ticker, safetySnapshot);

    // Resume path
    const wasFinished = await this.resumeFromJournal();
    if (wasFinished) {
      return this.buildResult('complete');
    }

    // Write safety_loaded AFTER confirming we're running a live job
    this.journal.append('safety_loaded', {
      forbiddenCount: safetySnapshot.forbiddenTickers.length,
    });

    const chunkSize = this.config.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const maxOrders = this.config.maxOrders ?? DEFAULT_MAX_ORDERS;
    const orderbookDepth = this.config.orderbookDepth ?? DEFAULT_ORDERBOOK_DEPTH;
    const loopDelayMs = this.config.loopDelayMs ?? DEFAULT_LOOP_DELAY_MS;

    this.journal.append('buy_loop_started', {
      ticker: this.config.ticker,
      side: this.config.side,
      size: this.config.size,
      dryRun: this.config.dryRun,
      remaining: this.remaining,
    });
    this.log('info', 'buy_loop_started', {
      ticker: this.config.ticker,
      size: this.config.size,
      dryRun: this.config.dryRun,
    });

    let resultStatus: BuyResult['status'] = 'complete';

    try {
      // ── Pre-trade risk checks ──────────────────────────────────────────────
      // Use fallback price of 0.5 ($0.50) when no live price available.
      const fallbackPriceCents = 50;
      const sizeDollars = this.config.size * (fallbackPriceCents / 100);
      const navDollars = await getPortfolioNAVDollars(this.client);
      await checkPreTradeRisk({
        ticker: this.config.ticker,
        sizeDollars,
        portfolioNAVDollars: navDollars,
        safety: safetySnapshot,
      });

      while (this.remaining > 0) {
        if (this.stopRequested) break;
        if (this.killSwitchExists()) {
          this.log('warn', 'kill_switch_found', { path: this.config.killSwitchPath });
          break;
        }
        if (this.ordersAttempted >= maxOrders) {
          this.log('error', 'max_orders_reached', { maxOrders });
          break;
        }

        const orderbook = await this.client.getOrderbook(this.config.ticker, orderbookDepth);
        const chunk = chooseChunkSize(orderbook, this.remaining, {
          chunkSize,
          minAdaptiveChunk: this.config.minAdaptiveChunk,
        });
        this.ordersAttempted += 1;

        if (this.config.dryRun) {
          // Dry-run: simulate a fill at midpoint (50¢) for accounting
          const dryPriceCents = 50;
          this.filled += chunk;
          this.remaining -= chunk;
          this.totalNotionalCents += chunk * dryPriceCents;
          this.feesIncurredDollars = Number(
            (this.feesIncurredDollars + chunk * (dryPriceCents / 100) * KALSHI_FEE_RATE).toFixed(4),
          );
          this.log('info', 'dry_run_chunk', { chunk, remaining: this.remaining });
        } else {
          // Determine ask price ceiling
          const askLevels = (this.config.ticker.endsWith('_NO') ? orderbook.no : orderbook.yes)
            .filter((l) => l.size > 0)
            .sort((a, b) => a.priceCents - b.priceCents);

          const topAskCents = askLevels[0]?.priceCents ?? 99;

          // Arrival mid at decision time: (topBid + topAsk) / 2
          // topBid: best resting bid on the same side (sorted descending)
          const bidLevels = (this.config.ticker.endsWith('_NO') ? orderbook.no : orderbook.yes)
            .filter((l) => l.size > 0)
            .sort((a, b) => b.priceCents - a.priceCents);
          const topBidCents = bidLevels[0]?.priceCents ?? 0;
          const arrivalMidCents = (topBidCents + topAskCents) / 2;
          const maxCents = this.config.maxPriceCents ?? 99;

          if (topAskCents > maxCents) {
            this.log('warn', 'ask_above_ceiling', { topAskCents, maxPriceCents: maxCents });
            if (loopDelayMs > 0) await sleep(loopDelayMs);
            continue;
          }

          const priceDollars = (topAskCents / 100).toFixed(4);
          const side = this.config.ticker.endsWith('_NO') ? 'no' : 'yes';
          const clientOrderId = `kea-buy-${Date.now()}-${crypto.randomUUID()}`;

          const payload: OrderPayload = {
            ticker: this.config.ticker,
            action: 'buy',
            side,
            count: chunk,
            type: 'limit',
            reduce_only: false,
            time_in_force: 'immediate_or_cancel',
            client_order_id: clientOrderId,
            yes_price_dollars: side === 'yes' ? priceDollars : undefined,
            no_price_dollars: side === 'no' ? priceDollars : undefined,
          };

          // Write order_intent BEFORE createOrder (crash-safe)
          this.journal.append('order_intent', {
            clientOrderId,
            payload,
          });

          const created = await this.client.createOrder(payload);
          this.log('info', 'order_created', { orderId: created.orderId, status: created.status });

          this.journal.append('order_placed', {
            orderId: created.orderId,
            payload,
            decisionRequested: chunk,
          });

          const reconciled = await this.reconcileOrder(created);
          const actualFilled = Math.max(0, Math.min(chunk, reconciled.filledCount));
          this.filled += actualFilled;
          this.remaining = Math.max(0, this.remaining - actualFilled);

          // Accumulate notional for avg price computation
          this.totalNotionalCents += actualFilled * topAskCents;
          const feeForOrder = actualFilled * (topAskCents / 100) * KALSHI_FEE_RATE;
          this.feesIncurredDollars = Number(
            (this.feesIncurredDollars + feeForOrder).toFixed(4),
          );

          this.journal.append('order_reconciled', {
            orderId: reconciled.orderId,
            status: reconciled.status,
            filled: actualFilled,
            requested: chunk,
            remainingPosition: this.remaining,
          });

          this.log('info', 'order_reconciled', {
            orderId: reconciled.orderId,
            status: reconciled.status,
            filled: actualFilled,
            requested: chunk,
            remainingPosition: this.remaining,
          });

          // ── Journal: TCA entry ─────────────────────────────────────────────
          const executedPriceCents = topAskCents;
          const slippageCents = executedPriceCents - arrivalMidCents;
          this.journal.append('tca', {
            jobId: this.journal.jobId,
            ticker: this.config.ticker,
            side: 'buy',
            chunkIndex: this.ordersAttempted - 1,
            arrivalMidCents,
            executedPriceCents,
            slippageCents,
            chunkSize: chunk,
            depthTier: 1,
          } satisfies Omit<TcaEntry, 'kind' | 'ts'>);
        }

        if (loopDelayMs > 0) await sleep(loopDelayMs);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      resultStatus = 'error';
      this.journal.append('buy_loop_error', { error: msg });
      this.log('error', 'buy_loop_failed', { error: msg });
    } finally {
      if (this.remaining > 0 && resultStatus !== 'error') {
        resultStatus = 'partial';
      }
      this.journal.append('buy_loop_finished', {
        remaining: this.remaining,
        filled: this.filled,
        status: resultStatus,
      });
      this.log('info', 'buy_loop_finished', {
        remaining: this.remaining,
        filled: this.filled,
        status: resultStatus,
      });

      // Record realized loss if avg fill price is below floor (safety.floorPriceCents)
      if (this.filled > 0 && !this.config.dryRun) {
        const avgFillCents = this.filled > 0
          ? this.totalNotionalCents / this.filled
          : 0;
        const floorCents = safetySnapshot.floorPriceCents;
        const pnlDollars = this.filled * (avgFillCents - floorCents) / 100;
        if (pnlDollars < 0) {
          appendRealizedLoss({ ticker: this.config.ticker, lossAmount: Math.abs(pnlDollars) });
        }
      }
    }

    return this.buildResult(resultStatus);
  }

  private buildResult(status: BuyResult['status']): BuyResult {
    const avgPriceCents = this.filled > 0
      ? Number((this.totalNotionalCents / this.filled).toFixed(4))
      : 0;
    return {
      jobId: this.jobId,
      filled: this.filled,
      avgPriceCents,
      feesIncurredDollars: this.feesIncurredDollars,
      remaining: this.remaining,
      status,
    };
  }
}

/** Convenience top-level function mirroring exitRunner's `run()` export. */
export function run(client: KalshiClientLike, config: BuyConfig, opts?: BuyRunnerOptions): Promise<BuyResult> {
  return new BuyRunner(client, config, opts).run();
}
