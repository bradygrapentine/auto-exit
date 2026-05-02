import crypto from 'node:crypto';
import fs from 'node:fs';
import { KalshiClient } from './kalshiClient.js';
import { Journal, generateJobId } from './journal.js';
import { buildSellPayload, centsFloatToDollarString, decideLosingExitOrder, normalizeLevels, oneTickBelowCents, projectFullExit } from './pricing.js';
import { mergeIntoExitConfig, getSafety, checkPreTradeRisk, appendRealizedLoss } from './safety.js';
import type { ExitConfig, JobStatus, KalshiClientLike, LoopEvent, OrderPayload, OrderResult, Position, TcaEntry } from './types.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ExitRunnerOptions {
  /** If set, attempt crash-safe resume from this jobId's journal. */
  resumeFromJobId?: string;
  /** Override the KEA_HOME directory (mainly for tests). */
  keaHome?: string;
}

export class ExitRunner {
  // Resume strategy: pass `resumeFromJobId` via ExitRunnerOptions so a single
  // constructor handles both "new job" and "resume" without a separate factory.
  readonly jobId: string;
  private status: JobStatus;
  private stopRequested = false;
  private client: KalshiClientLike;
  private journal: Journal;

  constructor(private config: ExitConfig, client?: KalshiClientLike, opts?: ExitRunnerOptions) {
    this.client = client ?? new KalshiClient(config);
    this.jobId = opts?.resumeFromJobId ?? generateJobId();
    this.journal = new Journal(this.jobId, opts?.keaHome);
    this.status = {
      running: false,
      stopped: false,
      dryRun: config.dryRun,
      remaining: config.positionSize,
      initialPosition: config.positionSize,
      ordersAttempted: 0,
      filledTotal: 0,
      canceledTotal: 0,
      submittedTotal: 0,
      feesIncurredDollars: 0,
      events: [],
    };
  }

  getStatus(): JobStatus {
    return { ...this.status, events: [...this.status.events].slice(-100) };
  }

  stop(reason = 'stop_requested') {
    this.stopRequested = true;
    this.log('warn', reason);
  }

  private log(level: LoopEvent['level'], message: string, data?: unknown) {
    const evt = { ts: new Date().toISOString(), level, message, data };
    this.status.events.push(evt);
    if (this.status.events.length > 300) this.status.events.shift();
    console.log(JSON.stringify(evt));
  }

  private killSwitchExists(): boolean {
    return Boolean(this.config.killSwitchPath && fs.existsSync(this.config.killSwitchPath));
  }

  /** Fetch the real position from the exchange, validate against config, and optionally clamp positionSize.
   *  Returns the observed Position for use in the /preflight route.
   *  Throws if side mismatches or no position is held.
   */
  async preflight(): Promise<Position> {
    const observed = await this.client.getPosition(this.config.marketTicker);

    if (observed.side !== this.config.heldSide) {
      throw new Error(
        `Preflight side mismatch: config says ${this.config.heldSide} but exchange shows ${observed.side} for ${this.config.marketTicker}`,
      );
    }

    if (observed.quantity < this.config.positionSize) {
      this.log('warn', 'position_clamped', {
        ticker: this.config.marketTicker,
        configuredSize: this.config.positionSize,
        observedSize: observed.quantity,
      });
      this.config = { ...this.config, positionSize: observed.quantity };
      this.status.remaining = observed.quantity;
      this.status.initialPosition = observed.quantity;
    } else {
      this.log('info', 'preflight_ok', {
        ticker: this.config.marketTicker,
        side: observed.side,
        quantity: observed.quantity,
      });
    }

    return observed;
  }

  async previewOnce() {
    const orderbook = await this.client.getOrderbook(this.config.marketTicker, this.config.orderbookDepth);
    const decision = decideLosingExitOrder(orderbook, this.config.positionSize, this.config);
    const payload = buildSellPayload(this.config, decision);
    const sideLevels = this.config.heldSide === 'yes' ? orderbook.yes : orderbook.no;
    const projection = projectFullExit(sideLevels, this.config.positionSize, this.config);
    return { orderbook, decision, payload, projection };
  }

  private isTerminal(result: OrderResult): boolean {
    return result.status === 'filled' || result.status === 'canceled' || result.remainingCount <= 0;
  }

  private async reconcileOrder(initial: OrderResult): Promise<OrderResult> {
    if (this.isTerminal(initial)) return initial;
    const pollMs = this.config.reconcilePollMs ?? 250;
    const maxPolls = this.config.reconcileMaxPolls ?? 8;
    let current = initial;
    for (let i = 0; i < maxPolls; i += 1) {
      if (this.stopRequested) break;
      await sleep(pollMs);
      try {
        current = await this.client.getOrder(initial.orderId);
      } catch (err) {
        this.log('warn', 'get_order_failed', { error: err instanceof Error ? err.message : String(err) });
        continue;
      }
      if (this.isTerminal(current)) return current;
    }
    if (this.config.cancelOnStale ?? true) {
      try {
        const canceled = await this.client.cancelOrder(initial.orderId);
        this.log('warn', 'order_canceled_stale', { orderId: initial.orderId, filled: canceled.filledCount });
        return canceled;
      } catch (err) {
        this.log('error', 'cancel_failed', { error: err instanceof Error ? err.message : String(err) });
      }
    }
    return current;
  }

  /**
   * Crash-safe resume: read journal, reconcile any in-flight orders that never
   * got an `order_reconciled` entry, then recompute `remaining` from fills so
   * the live loop picks up where it crashed.
   *
   * Returns true if the job was already finished (caller should skip the loop).
   */
  private async resumeFromJournal(): Promise<boolean> {
    if (this.journal.isFinished()) {
      this.log('info', 'resume_noop', { jobId: this.jobId, reason: 'loop_finished in journal' });
      return true;
    }

    // ── Phase 1: reconcile order_intent entries with no matching order_placed ────
    // These represent the crash window: createOrder returned but the process was
    // killed before order_placed was appended. Look up by clientOrderId to learn
    // whether the order actually landed on the exchange.
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
          // Order never reached the exchange — treat as never-placed.
          this.log('warn', 'resume_intent_not_found', {
            clientOrderId: intent.clientOrderId,
            note: 'order likely never reached exchange; skipping decrement',
          });
          continue;
        }

        // Synthesize an order_placed entry so subsequent pendingOrders() picks it up
        // and normal reconcile flow handles the fill/cancel state.
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

    // ── Phase 2: reconcile order_placed entries with no matching order_reconciled ─
    const pending = this.journal.pendingOrders();
    if (pending.length > 0 || pendingIntents.length > 0) {
      if (pendingIntents.length === 0) {
        // Only append resume_started if phase 1 didn't already do it
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
          // Still resting / partially filled — run the full reconcile (poll + cancel if stale)
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

    // Recompute remaining from journal fills so the live loop is accurate
    const filledSoFar = this.journal.computeFilledTotal();
    this.status.filledTotal = filledSoFar;
    this.status.remaining = Math.max(0, this.config.positionSize - filledSoFar);
    return false;
  }

  /** Post a single GTC sell for the remaining position. Price is either the explicit
   *  `tailGtcPriceDollars` config override or one tick under our side's ask (derived
   *  from the top opposite-side bid). Skips if no opposite-side bid exists or remaining
   *  rounds to < 1 share. */
  private async postTailGtcOrder(): Promise<void> {
    const remainingInt = Math.floor(this.status.remaining);
    if (remainingInt < 1) {
      this.log('info', 'tail_gtc_skipped_below_one_share', { remaining: this.status.remaining });
      return;
    }

    // Guard: don't double-post if a resting order already exists on this market.
    // Without this, re-running the engine while a previous tail-GTC is still
    // resting would post a second sell — and since GTC drops reduce_only, both
    // filling could flip the position short.
    //
    // Source-of-truth note: /portfolio/orders (queried via getRestingOrderCount)
    // is authoritative. The position.restingOrdersCount field returned by
    // /portfolio/positions has been observed reporting 0 while orders WERE
    // actively resting on the book — using it here would silently allow
    // double-posts. See the 2026-05-01 P1 cleanup investigation for the trace.
    try {
      const restingCount = await this.client.getRestingOrderCount(this.config.marketTicker);
      if (restingCount > 0) {
        this.log('warn', 'tail_gtc_skipped_existing_resting_order', {
          ticker: this.config.marketTicker,
          restingCount,
        });
        return;
      }
    } catch (err) {
      this.log('warn', 'tail_gtc_skipped_resting_count_lookup_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    let priceDollars: string | undefined;
    if (this.config.tailGtcPriceDollars) {
      priceDollars = this.config.tailGtcPriceDollars;
    } else {
      let orderbook;
      try {
        orderbook = await this.client.getOrderbook(this.config.marketTicker, this.config.orderbookDepth);
      } catch (err) {
        this.log('warn', 'tail_gtc_skipped_orderbook_failed', { error: err instanceof Error ? err.message : String(err) });
        return;
      }
      // Our ask = 100¢ - opposite-side top bid (in cents). Sell YES → look at NO bids.
      const oppRaw = this.config.heldSide === 'yes' ? orderbook.no : orderbook.yes;
      const opp = normalizeLevels(oppRaw, this.config.minLevelSize).sort((a, b) => b.priceCents - a.priceCents);
      if (opp.length === 0) {
        this.log('warn', 'tail_gtc_skipped_no_opposite_bid', {});
        return;
      }
      const ourAskCents = 100 - opp[0].priceCents;
      const undercutCents = oneTickBelowCents(ourAskCents, this.config.floorPriceCents);
      if (undercutCents <= 0) {
        this.log('warn', 'tail_gtc_skipped_undercut_below_floor', { ourAskCents, floor: this.config.floorPriceCents });
        return;
      }
      priceDollars = centsFloatToDollarString(undercutCents);
    }

    const payload: OrderPayload = {
      ticker: this.config.marketTicker,
      action: 'sell',
      side: this.config.heldSide,
      count: remainingInt,
      type: 'limit',
      reduce_only: false, // Kalshi requires reduce_only=false for GTC
      time_in_force: 'good_till_canceled',
      client_order_id: `kea-tail-${Date.now()}-${crypto.randomUUID()}`,
    };
    if (this.config.heldSide === 'yes') payload.yes_price_dollars = priceDollars;
    else payload.no_price_dollars = priceDollars;

    try {
      const result = await this.client.createOrder(payload);
      this.journal.append('tail_gtc_posted', { orderId: result.orderId, count: remainingInt, priceDollars });
      this.log('info', 'tail_gtc_posted', { orderId: result.orderId, count: remainingInt, priceDollars, status: result.status });
    } catch (err) {
      this.log('error', 'tail_gtc_failed', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  async run(): Promise<JobStatus> {
    if (this.status.running) throw new Error('runner already running');

    // ── Load and merge safety guard-rails (always, before forbidden check) ──
    const safetySnapshot = getSafety();
    this.config = mergeIntoExitConfig(this.config, safetySnapshot);

    // Forbidden-ticker check — defense in depth even if config validation was bypassed
    const forbidden = this.config.forbiddenTickers ?? [];
    if (forbidden.includes(this.config.marketTicker)) {
      throw new Error(
        `marketTicker '${this.config.marketTicker}' is in forbiddenTickers — engine refuses to start`,
      );
    }
    this.status.running = true;
    this.status.startedAt = new Date().toISOString();

    // ── Resume path ──────────────────────────────────────────────────────────
    const wasFinished = await this.resumeFromJournal();
    if (wasFinished) {
      this.status.running = false;
      this.status.stopped = true;
      this.status.finishedAt = new Date().toISOString();
      return this.getStatus();
    }

    // ── Write safety_loaded after confirming we're running a live job ────────
    this.journal.append('safety_loaded', {
      safetySubmittedMultiple: safetySnapshot.safetySubmittedMultiple,
      floorPriceCents: safetySnapshot.floorPriceCents,
      tailSweepThreshold: safetySnapshot.tailSweepThreshold,
      forbiddenCount: safetySnapshot.forbiddenTickers.length,
    });

    // ── Normal loop ──────────────────────────────────────────────────────────
    this.journal.append('loop_started', {
      ticker: this.config.marketTicker,
      side: this.config.heldSide,
      dryRun: this.config.dryRun,
      remaining: this.status.remaining,
    });
    this.log('info', 'exit_loop_started', { ticker: this.config.marketTicker, side: this.config.heldSide, dryRun: this.config.dryRun });

    try {
      // ── Pre-trade risk checks ──────────────────────────────────────────────
      // TODO(W1.3): use live orderbook mid-price once runner has fetchOrderbook in scope
      const fallbackPriceCents = 50;
      const sizeDollars = this.config.positionSize * (fallbackPriceCents / 100);
      await checkPreTradeRisk({
        ticker: this.config.marketTicker,
        sizeDollars,
        portfolioNAVDollars: 0, // TODO: pass real NAV when fetchBalance is available
        safety: safetySnapshot,
      });

      if (this.config.preflight) {
        await this.preflight();
      }

      while (this.status.remaining > 0) {
        if (this.stopRequested) break;
        if (this.killSwitchExists()) {
          this.log('warn', 'kill_switch_found', { path: this.config.killSwitchPath });
          break;
        }
        if (this.status.ordersAttempted >= this.config.maxOrders) {
          this.log('error', 'max_orders_reached', { maxOrders: this.config.maxOrders });
          break;
        }

        const orderbook = await this.client.getOrderbook(this.config.marketTicker, this.config.orderbookDepth);
        // Arrival mid: (top YES bid + top YES ask) / 2.
        // YES ask = 100 - top NO bid. If either side is empty, fall back to 0.
        const topYesBid = orderbook.yes[0]?.priceCents ?? 0;
        const topYesAsk = orderbook.no[0] != null ? (100 - orderbook.no[0].priceCents) : 100;
        const arrivalMidCents = (topYesBid + topYesAsk) / 2;
        const decision = decideLosingExitOrder(orderbook, this.status.remaining, this.config);
        const payload = buildSellPayload(this.config, decision);
        this.status.lastDecision = decision;
        this.status.lastPayload = payload;
        this.status.ordersAttempted += 1;
        this.log('info', 'order_decision', { remaining: this.status.remaining, decision, payload });

        if (this.config.dryRun) {
          this.status.filledTotal += decision.chunkSize;
          this.status.remaining -= decision.chunkSize;
        } else {
          // Runtime safety bound — defends against parser/fill misreads where the engine
          // would re-submit executed orders. We track every share submitted (regardless of
          // the reported fill outcome) and halt before exceeding the configured multiple.
          const multiple = this.config.safetySubmittedMultiple ?? 1.5;
          const cap = this.status.initialPosition * multiple;
          if (this.status.submittedTotal + decision.chunkSize > cap) {
            this.log('error', 'safety_submitted_cap_reached', {
              submittedTotal: this.status.submittedTotal,
              wouldSubmit: decision.chunkSize,
              cap,
              initialPosition: this.status.initialPosition,
              multiple,
            });
            break;
          }
          this.status.submittedTotal += decision.chunkSize;

          // ── Journal: order intent (pre-call, crash-safe) ─────────────────
          // Written BEFORE createOrder so that if the process is killed between
          // createOrder returning and order_placed being appended, resume can
          // still find the order via clientOrderId lookup.
          this.journal.append('order_intent', {
            clientOrderId: payload.client_order_id,
            payload,
          });

          const created = await this.client.createOrder(payload);
          this.log('info', 'order_created', { orderId: created.orderId, status: created.status });

          // ── Journal: order placed (durable before reconcile) ──────────────
          // Includes orderbook + decision so the entry is self-describing for
          // post-hoc replay / cross-validation against the engine's pricing.
          this.journal.append('order_placed', {
            orderId: created.orderId,
            payload,
            decisionRequested: decision.chunkSize,
            orderbook,
            decision,
          });

          // ── Test-only: deliberate pause to reproduce the crash-mid-flight scenario.
          // The journal already has `order_placed`; sleeping here gives a Ctrl-C window
          // before `order_reconciled` is appended. Production configs leave this at 0.
          const pauseMs = this.config.deliberatePauseAfterPlaceMs ?? 0;
          if (pauseMs > 0) {
            this.log('warn', 'deliberate_pause_after_place', { ms: pauseMs, orderId: created.orderId });
            await sleep(pauseMs);
          }

          // ── GTC: leave a resting order on the book and exit the loop ─────
          // The order is durable on Kalshi until filled/canceled. The user comes back
          // later (next /start invocation) to check fill state or place more.
          const tif = this.config.orderTimeInForce ?? 'immediate_or_cancel';
          if (tif === 'good_till_canceled' && created.status === 'resting') {
            this.journal.append('gtc_resting', { orderId: created.orderId, requested: decision.chunkSize });
            this.log('info', 'gtc_order_resting_exit', { orderId: created.orderId, priceDollars: decision.priceDollars });
            break;
          }

          const reconciled = await this.reconcileOrder(created);
          const filled = Math.max(0, Math.min(decision.chunkSize, reconciled.filledCount));
          this.status.filledTotal += filled;
          this.status.remaining = Math.max(0, this.status.remaining - filled);
          if (reconciled.status === 'canceled' && filled < decision.chunkSize) {
            this.status.canceledTotal += decision.chunkSize - filled;
          }
          if (reconciled.takerFeesDollars && Number.isFinite(reconciled.takerFeesDollars)) {
            this.status.feesIncurredDollars = Number(
              (this.status.feesIncurredDollars + reconciled.takerFeesDollars).toFixed(4),
            );
          }

          // ── Journal: order reconciled ──────────────────────────────────────
          this.journal.append('order_reconciled', {
            orderId: reconciled.orderId,
            status: reconciled.status,
            filled,
            requested: decision.chunkSize,
            remainingPosition: this.status.remaining,
          });

          this.log('info', 'order_reconciled', {
            orderId: reconciled.orderId,
            status: reconciled.status,
            filled,
            requested: decision.chunkSize,
            remainingPosition: this.status.remaining,
          });

          // ── Journal: TCA entry ─────────────────────────────────────────────
          const executedPriceCents = decision.priceCentsExact;
          const slippageCents = executedPriceCents - arrivalMidCents;
          const depthTier = decision.cumulativeSizeAtPrice > 0
            ? Math.ceil(decision.cumulativeSizeAtPrice / decision.chunkSize)
            : 1;
          this.journal.append('tca', {
            jobId: this.journal.jobId,
            ticker: this.config.marketTicker,
            side: 'sell',
            chunkIndex: this.status.ordersAttempted - 1,
            arrivalMidCents,
            executedPriceCents,
            slippageCents,
            chunkSize: decision.chunkSize,
            depthTier,
          } satisfies Omit<TcaEntry, 'kind' | 'ts'>);

          if (filled === 0 && reconciled.status === 'canceled') {
            this.log('warn', 'no_fill_on_chunk', { ordersAttempted: this.status.ordersAttempted });
          }
        }

        if (this.config.loopDelayMs > 0) await sleep(this.config.loopDelayMs);
      }

      // Tail GTC drain: post any leftover shares as a resting order so they exit passively.
      if (this.config.tailGtcOnFinish && this.status.remaining > 0 && !this.stopRequested) {
        await this.postTailGtcOrder();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.status.lastError = msg;
      this.journal.append('loop_error', { error: msg });
      this.log('error', 'exit_loop_failed', { error: msg });
    } finally {
      this.status.running = false;
      this.status.stopped = true;
      this.status.finishedAt = new Date().toISOString();
      this.journal.append('loop_finished', { remaining: this.status.remaining, filled: this.status.filledTotal });
      this.log('info', 'exit_loop_finished', { remaining: this.status.remaining, filled: this.status.filledTotal });

      // Record realized loss if fills were below floor price
      if (this.status.filledTotal > 0 && !this.config.dryRun) {
        const avgFillCents = this.status.filledTotal > 0
          ? (this.status.feesIncurredDollars === 0
            ? this.config.floorPriceCents  // fallback: assume floor
            : this.config.floorPriceCents)
          : this.config.floorPriceCents;
        // pnl = filled × (avgFill - floor) / 100; negative = loss
        const pnlDollars = this.status.filledTotal * (avgFillCents - this.config.floorPriceCents) / 100;
        if (pnlDollars < 0) {
          appendRealizedLoss({ ticker: this.config.marketTicker, lossAmount: Math.abs(pnlDollars) });
        }
      }
    }
    return this.getStatus();
  }
}
