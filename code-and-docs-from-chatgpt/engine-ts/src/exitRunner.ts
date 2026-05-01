import fs from 'node:fs';
import { KalshiClient } from './kalshiClient.js';
import { Journal, generateJobId } from './journal.js';
import { buildSellPayload, decideLosingExitOrder } from './pricing.js';
import type { ExitConfig, JobStatus, KalshiClientLike, LoopEvent, OrderResult, Position } from './types.js';

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
    return { orderbook, decision, payload };
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

    const pending = this.journal.pendingOrders();
    if (pending.length > 0) {
      this.journal.append('resume_started', { jobId: this.jobId, pendingCount: pending.length });
      this.log('info', 'resume_started', { jobId: this.jobId, pendingCount: pending.length });

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

  async run(): Promise<JobStatus> {
    if (this.status.running) throw new Error('runner already running');
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

    // ── Normal loop ──────────────────────────────────────────────────────────
    this.journal.append('loop_started', {
      ticker: this.config.marketTicker,
      side: this.config.heldSide,
      dryRun: this.config.dryRun,
      remaining: this.status.remaining,
    });
    this.log('info', 'exit_loop_started', { ticker: this.config.marketTicker, side: this.config.heldSide, dryRun: this.config.dryRun });

    try {
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
          const created = await this.client.createOrder(payload);
          this.log('info', 'order_created', { orderId: created.orderId, status: created.status });

          // ── Journal: order placed (durable before reconcile) ──────────────
          this.journal.append('order_placed', {
            orderId: created.orderId,
            payload,
            decisionRequested: decision.chunkSize,
          });

          const reconciled = await this.reconcileOrder(created);
          const filled = Math.max(0, Math.min(decision.chunkSize, reconciled.filledCount));
          this.status.filledTotal += filled;
          this.status.remaining = Math.max(0, this.status.remaining - filled);
          if (reconciled.status === 'canceled' && filled < decision.chunkSize) {
            this.status.canceledTotal += decision.chunkSize - filled;
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
          if (filled === 0 && reconciled.status === 'canceled') {
            this.log('warn', 'no_fill_on_chunk', { ordersAttempted: this.status.ordersAttempted });
          }
        }

        if (this.config.loopDelayMs > 0) await sleep(this.config.loopDelayMs);
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
    }
    return this.getStatus();
  }
}
