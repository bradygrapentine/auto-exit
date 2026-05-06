/**
 * sIceberg.ts — S13 Iceberg: hides total remaining behind a single visible quote.
 *
 * Posts a single resting limit order of size `visibleSize` (or the remaining
 * size, whichever is smaller). Polls until the slice is fully filled, then
 * immediately reposts another slice. Continues until `cumulativeFilled >= size`
 * or `stop()` is called.
 *
 * The total order size is never revealed to the book — only the visible slice is
 * ever resting at one time.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts or journal.ts.
 * Journal kinds cast via jk() to avoid touching types.ts.
 */

import { Journal, generateJobId } from '../journal.js';
import type { JournalKind, Side } from '../types.js';

// Cast unknown string → JournalKind without touching types.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

const DEFAULT_POLL_INTERVAL_MS = 1_000;

// ── Injectable invoke types ───────────────────────────────────────────────────

/** Post a new resting limit order; returns the exchange order ID. */
export type PostOrderInvoke = (
  qty: number,
  side: Side,
  priceCents: number,
) => Promise<string>;

/** Poll the status of an existing order. */
export type GetOrderStatusInvoke = (
  orderId: string,
) => Promise<{ filled: number; remaining: number }>;

/** Cancel an existing order by ID. */
export type CancelOrderInvoke = (orderId: string) => Promise<void>;

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface S13Config {
  ticker: string;
  side: Side;
  /** Total contracts to fill across all slices. */
  size: number;
  /** Size of each visible resting slice. Final slice may be smaller. */
  visibleSize: number;
  /** Limit price in integer cents [1, 99]. */
  priceCents: number;
  /** Injectable for tests: post a resting order. */
  postOrderInvoke: PostOrderInvoke;
  /** Injectable for tests: poll order status. */
  getOrderStatusInvoke: GetOrderStatusInvoke;
  /** Injectable for tests: cancel a resting order. */
  cancelOrderInvoke: CancelOrderInvoke;
  /** Injectable sleep for deterministic tests. Defaults to real setTimeout. */
  sleepMs?: (ms: number) => Promise<void>;
  /** How often to poll the order status. Default 1000 ms. */
  pollIntervalMs?: number;
  /** Override KEA_HOME (for tests). */
  keaHome?: string;
  /** Unique job ID for journaling. Auto-generated when omitted. */
  jobId?: string;
}

export interface S13Result {
  cumulativeFilled: number;
  slices: number;
  reason: 'complete' | 'caller_stopped';
}

// ── Args builder ─────────────────────────────────────────────────────────────

export interface BuildS13IcebergArgs {
  ticker: string;
  side: Side;
  size: number;
  visibleSize: number;
  priceCents: number;
}

/**
 * Build and validate flat iceberg args. Returns the validated args (no invokes
 * attached) — callers must attach postOrderInvoke / getOrderStatusInvoke /
 * cancelOrderInvoke before constructing IcebergRunner.
 */
export function buildSIcebergArgs(opts: BuildS13IcebergArgs): BuildS13IcebergArgs {
  if (opts.size <= 0) {
    throw new Error('S13Config: size must be > 0');
  }
  if (opts.visibleSize < 1) {
    throw new Error('S13Config: visibleSize must be >= 1');
  }
  if (opts.visibleSize > opts.size) {
    throw new Error('S13Config: visibleSize must be <= size');
  }
  if (opts.priceCents < 1 || opts.priceCents > 99) {
    throw new Error('S13Config: priceCents must be in [1, 99]');
  }
  if (opts.side !== 'yes' && opts.side !== 'no') {
    throw new Error('S13Config: side must be "yes" or "no"');
  }
  return { ...opts };
}

// ── Validation (internal) ─────────────────────────────────────────────────────

function validateConfig(cfg: S13Config): void {
  if (!cfg.ticker || cfg.ticker.trim() === '') {
    throw new Error('S13Config: ticker must be non-empty');
  }
  if (cfg.size <= 0) {
    throw new Error('S13Config: size must be > 0');
  }
  if (cfg.visibleSize < 1) {
    throw new Error('S13Config: visibleSize must be >= 1');
  }
  if (cfg.visibleSize > cfg.size) {
    throw new Error('S13Config: visibleSize must be <= size');
  }
  if (cfg.priceCents < 1 || cfg.priceCents > 99) {
    throw new Error('S13Config: priceCents must be in [1, 99]');
  }
  if (cfg.side !== 'yes' && cfg.side !== 'no') {
    throw new Error('S13Config: side must be "yes" or "no"');
  }
  if (typeof cfg.postOrderInvoke !== 'function') {
    throw new Error('S13Config: postOrderInvoke must be a function');
  }
  if (typeof cfg.getOrderStatusInvoke !== 'function') {
    throw new Error('S13Config: getOrderStatusInvoke must be a function');
  }
  if (typeof cfg.cancelOrderInvoke !== 'function') {
    throw new Error('S13Config: cancelOrderInvoke must be a function');
  }
}

// ── Runner class ──────────────────────────────────────────────────────────────

export class IcebergRunner {
  private readonly config: S13Config;
  private readonly journal: Journal;
  private readonly jobId: string;
  private stopped = false;

  constructor(config: S13Config, journal?: Journal | unknown) {
    validateConfig(config);
    this.config = config;
    this.jobId = config.jobId ?? generateJobId();
    this.journal = (journal instanceof Journal)
      ? journal
      : new Journal(this.jobId, config.keaHome);
  }

  /** Signal the runner to stop after the current poll cycle completes. */
  stop(): void {
    this.stopped = true;
  }

  async run(): Promise<S13Result> {
    const {
      ticker,
      side,
      size,
      visibleSize,
      priceCents,
      postOrderInvoke,
      getOrderStatusInvoke,
      cancelOrderInvoke,
      sleepMs = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    } = this.config;

    const pollIntervalMs = this.config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

    let cumulativeFilled = 0;
    let slices = 0;

    this.journal.append(jk('iceberg_started'), {
      ticker,
      side,
      size,
      visibleSize,
      priceCents,
      pollIntervalMs,
      jobId: this.jobId,
    });

    while (cumulativeFilled < size) {
      // Check stop before posting a new slice.
      if (this.stopped) {
        this.journal.append(jk('iceberg_stopped'), {
          cumulativeFilled,
          slices,
          remaining: size - cumulativeFilled,
        });
        return { cumulativeFilled, slices, reason: 'caller_stopped' };
      }

      const sizeRemaining = size - cumulativeFilled;
      const sliceQty = Math.min(visibleSize, sizeRemaining);

      // Post the slice.
      const orderId = await postOrderInvoke(sliceQty, side, priceCents);
      slices += 1;

      this.journal.append(jk('iceberg_slice_posted'), {
        sliceIndex: slices - 1,
        orderId,
        sliceQty,
        cumulativeFilled,
        remaining: sizeRemaining,
      });

      // Poll until fully filled or stop is requested.
      let sliceFilled = 0;
      let pendingOrderId: string | null = orderId;

      while (sliceFilled < sliceQty) {
        if (this.stopped) {
          // Cancel the pending slice and journal stop.
          if (pendingOrderId !== null) {
            await cancelOrderInvoke(pendingOrderId);
            pendingOrderId = null;
          }
          this.journal.append(jk('iceberg_stopped'), {
            cumulativeFilled: cumulativeFilled + sliceFilled,
            slices,
            remaining: size - cumulativeFilled - sliceFilled,
          });
          return {
            cumulativeFilled: cumulativeFilled + sliceFilled,
            slices,
            reason: 'caller_stopped',
          };
        }

        await sleepMs(pollIntervalMs);

        const status = await getOrderStatusInvoke(orderId);
        sliceFilled = status.filled;
      }

      cumulativeFilled += sliceFilled;

      this.journal.append(jk('iceberg_slice_filled'), {
        sliceIndex: slices - 1,
        orderId,
        sliceFilled,
        cumulativeFilled,
        remaining: size - cumulativeFilled,
      });
    }

    this.journal.append(jk('iceberg_finished'), {
      cumulativeFilled,
      slices,
    });

    return { cumulativeFilled, slices, reason: 'complete' };
  }
}
