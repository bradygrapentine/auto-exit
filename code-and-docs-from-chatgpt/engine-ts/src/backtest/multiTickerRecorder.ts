/**
 * multiTickerRecorder.ts — orchestrate independent per-ticker recording loops.
 *
 * Each ticker runs its own setInterval at the configured cadenceMs.
 * A globally-shared token bucket (default 30 req/sec, override via KEA_SCANNER_RATE_PER_SEC)
 * paces all polls to prevent 429 throttling from Kalshi.
 * Polls client.getOrderbook, hands snapshots to individual Recorders.
 * Graceful shutdown on SIGINT/SIGTERM (stop all intervals, close all recorders).
 */

import { createRecorder } from './recorder.js';
import type { Recorder } from './types.js';
import type { Orderbook } from '../types.js';

// ---------------------------------------------------------------------------
// Token bucket
// ---------------------------------------------------------------------------

export interface TokenBucket {
  capacity: number;
  refillPerSec: number;
  tokens: number;
  lastRefillMs: number;
}

export function createTokenBucket(refillPerSec: number, burstCapacity?: number): TokenBucket {
  const capacity = burstCapacity ?? refillPerSec * 2;
  return { capacity, refillPerSec, tokens: capacity, lastRefillMs: Date.now() };
}

export async function acquireToken(bucket: TokenBucket): Promise<void> {
  while (true) {
    const now = Date.now();
    const elapsedSec = (now - bucket.lastRefillMs) / 1000;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + elapsedSec * bucket.refillPerSec);
    bucket.lastRefillMs = now;
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return;
    }
    const waitMs = Math.max(50, ((1 - bucket.tokens) / bucket.refillPerSec) * 1000);
    await new Promise<void>((r) => setTimeout(r, waitMs));
  }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TickerEntry {
  ticker: string;
  cadenceMs: number;
}

export interface TickerStats {
  ticker: string;
  snapshotsWritten: number;
  lastPollAt: string | null;
  lastError: string | null;
}

export interface MultiTickerRecorderOptions {
  tickers: TickerEntry[];
  dir: string;
  client: {
    getOrderbook(ticker: string, depth: number): Promise<Orderbook>;
  };
  /** Orderbook depth to record. Defaults to 10. */
  depthLevels?: number;
  /**
   * Shared token bucket for rate-limiting all polls.
   * If omitted, one is created using KEA_SCANNER_RATE_PER_SEC (default 30 req/sec).
   */
  rateBucket?: TokenBucket;
}

export interface MultiTickerRecorder {
  start(): void;
  stop(): void;
  getStats(): TickerStats[];
}

// ---------------------------------------------------------------------------
// Internal state per ticker
// ---------------------------------------------------------------------------

interface TickerState {
  entry: TickerEntry;
  recorder: Recorder;
  snapshotsWritten: number;
  lastPollAt: string | null;
  lastError: string | null;
  intervalId: ReturnType<typeof setInterval> | null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMultiTickerRecorder(
  opts: MultiTickerRecorderOptions,
): MultiTickerRecorder {
  const { tickers, dir, client } = opts;
  const depthLevels = opts.depthLevels ?? 10;
  const ratePerSec = Number(process.env.KEA_SCANNER_RATE_PER_SEC ?? '30');
  const bucket = opts.rateBucket ?? createTokenBucket(ratePerSec);

  const states: TickerState[] = tickers.map((entry) => ({
    entry,
    recorder: createRecorder({ dir, ticker: entry.ticker, depthLevels }),
    snapshotsWritten: 0,
    lastPollAt: null,
    lastError: null,
    intervalId: null,
  }));

  let signalHandled = false;

  function stopAll(): void {
    for (const s of states) {
      if (s.intervalId !== null) {
        clearInterval(s.intervalId);
        s.intervalId = null;
      }
      try { s.recorder.close(); } catch { /* ignore close errors on shutdown */ }
    }
  }

  function attachSignalHandlers(): void {
    if (signalHandled) return;
    signalHandled = true;
    const handler = () => { stopAll(); };
    process.once('SIGINT', handler);
    process.once('SIGTERM', handler);
  }

  async function poll(state: TickerState): Promise<void> {
    await acquireToken(bucket);
    const t0 = Date.now();
    try {
      const book = await client.getOrderbook(state.entry.ticker, depthLevels);
      const latencyMs = Date.now() - t0;
      state.recorder.appendSnapshot(book, undefined, latencyMs);
      state.snapshotsWritten += 1;
      state.lastPollAt = new Date().toISOString();
      state.lastError = null;
    } catch (err) {
      state.lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    start() {
      attachSignalHandlers();
      for (const state of states) {
        if (state.intervalId !== null) continue; // already running
        // Fire immediately then repeat
        void poll(state);
        state.intervalId = setInterval(() => { void poll(state); }, state.entry.cadenceMs);
      }
    },

    stop() {
      stopAll();
    },

    getStats(): TickerStats[] {
      return states.map((s) => ({
        ticker: s.entry.ticker,
        snapshotsWritten: s.snapshotsWritten,
        lastPollAt: s.lastPollAt,
        lastError: s.lastError,
      }));
    },
  };
}
