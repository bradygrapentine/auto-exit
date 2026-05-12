/**
 * wsRecorder.ts — SH-SCANNER-WS Task 4
 *
 * WebSocket-driven multi-ticker recorder. Subscribes once to the
 * `orderbook_delta` channel for all tickers, maintains per-ticker book
 * state via WsBookTracker, and emits synthesized snapshots into existing
 * Recorder instances at each ticker's `cadenceMs` — matching the NDJSON
 * shape the REST scanner produces.
 *
 * REST scanner stays the default; WS is opt-in via `--transport ws`.
 */

import * as fs from 'node:fs';
import { createRecorder } from './recorder.js';
import type { Recorder } from './types.js';
import { WsBookTracker } from '../wsBookTracker.js';
import { connectKalshiWs, type WsConnection, type WsMessage } from '../wsClient.js';
import type {
  MultiTickerRecorder,
  TickerEntry,
  TickerStats,
} from './multiTickerRecorder.js';

// ---------------------------------------------------------------------------
// Pause-sentinel helper
// ---------------------------------------------------------------------------
//
// If a file exists at the configured sentinel path, the recorder skips all
// snapshot writes until it is removed. Used as a kill switch when the recorder
// must be silenced fast without redeploying. Default path matches the Fly
// machine layout (`/data/PAUSE`); override via env or option.

const PAUSE_CACHE_TTL_MS = 2_000;

interface PauseState {
  lastCheckMs: number;
  paused: boolean;
}

export function makePauseChecker(sentinelPath: string): () => boolean {
  const state: PauseState = { lastCheckMs: 0, paused: false };
  return (): boolean => {
    const now = Date.now();
    if (now - state.lastCheckMs >= PAUSE_CACHE_TTL_MS) {
      state.paused = fs.existsSync(sentinelPath);
      state.lastCheckMs = now;
    }
    return state.paused;
  };
}

export interface WsRecorderOptions {
  tickers: TickerEntry[];
  dir: string;
  /** Kalshi API credentials (passed through to wsClient). */
  apiKey: string;
  privateKey: string;
  /** Snapshot depth recorded into NDJSON. Defaults to 10. */
  depthLevels?: number;
  /** Override the WS connector (test seam). */
  connectFn?: typeof connectKalshiWs;
  /**
   * Reconnect on disconnect with exponential backoff (250ms → 30s cap).
   * Default true. Set false in tests that don't simulate reconnect cycles.
   */
  autoReconnect?: boolean;
  /**
   * Force a re-subscribe (and book reset) for any ticker silent for this many
   * ms. Default 60000. Set 0 to disable. Re-subscribe pulls a fresh
   * `orderbook_snapshot` per Kalshi's WS contract — no REST round-trip needed.
   */
  staleAfterMs?: number;
  /**
   * Path to a pause sentinel file. When present, the recorder skips all
   * snapshot writes (kill switch). Default: `/data/PAUSE` (Fly layout).
   * Override via env `KEA_RECORDER_PAUSE_SENTINEL` or this option.
   */
  pauseSentinelPath?: string;
}

interface TickerState {
  entry: TickerEntry;
  recorder: Recorder;
  snapshotsWritten: number;
  lastPollAt: string | null;
  lastError: string | null;
  intervalId: ReturnType<typeof setInterval> | null;
}

export function createWsRecorder(opts: WsRecorderOptions): MultiTickerRecorder {
  const { tickers, dir, apiKey, privateKey } = opts;
  const depthLevels = opts.depthLevels ?? 10;
  const connectFn = opts.connectFn ?? connectKalshiWs;
  const autoReconnect = opts.autoReconnect ?? true;
  const staleAfterMs = opts.staleAfterMs ?? 60_000;
  const STALE_CHECK_MS = 5_000;
  const pauseSentinelPath =
    opts.pauseSentinelPath ?? process.env.KEA_RECORDER_PAUSE_SENTINEL ?? '/data/PAUSE';
  const isPaused = makePauseChecker(pauseSentinelPath);

  const tracker = new WsBookTracker();
  const states: TickerState[] = tickers.map((entry) => ({
    entry,
    recorder: createRecorder({ dir, ticker: entry.ticker, depthLevels }),
    snapshotsWritten: 0,
    lastPollAt: null,
    lastError: null,
    intervalId: null,
  }));

  let conn: WsConnection | null = null;
  let signalHandled = false;
  let stopping = false;
  let reconnectAttempt = 0;
  let staleCheckId: ReturnType<typeof setInterval> | null = null;

  function clearEmitIntervals(): void {
    for (const s of states) {
      if (s.intervalId !== null) {
        clearInterval(s.intervalId);
        s.intervalId = null;
      }
    }
  }

  function stopAll(): void {
    stopping = true;
    clearEmitIntervals();
    for (const s of states) {
      try { s.recorder.close(); } catch { /* shutdown swallow */ }
    }
    if (staleCheckId !== null) {
      clearInterval(staleCheckId);
      staleCheckId = null;
    }
    if (conn) {
      void conn.close();
      conn = null;
    }
  }

  function attachSignalHandlers(): void {
    if (signalHandled) return;
    signalHandled = true;
    const handler = (): void => { stopAll(); };
    process.once('SIGINT', handler);
    process.once('SIGTERM', handler);
  }

  function emit(state: TickerState): void {
    if (isPaused()) {
      state.lastError = `paused (sentinel: ${pauseSentinelPath})`;
      return;
    }
    const book = tracker.getSnapshot(state.entry.ticker, depthLevels);
    if (!book) return;
    try {
      state.recorder.appendSnapshot(book, undefined, 0);
      state.snapshotsWritten += 1;
      state.lastPollAt = new Date().toISOString();
      state.lastError = null;
    } catch (err) {
      state.lastError = err instanceof Error ? err.message : String(err);
    }
  }

  function backoffMs(attempt: number): number {
    return Math.min(30_000, 250 * Math.pow(2, attempt));
  }

  async function connectAndSubscribe(): Promise<boolean> {
    try {
      conn = await connectFn({ apiKey, privateKey });
    } catch (err) {
      for (const s of states) s.lastError = err instanceof Error ? err.message : String(err);
      return false;
    }
    conn.onMessage((msg: WsMessage) => tracker.apply(msg));
    conn.onClose((reason) => {
      if (stopping) return;
      conn = null;
      clearEmitIntervals();
      if (!autoReconnect) return;
      const delay = backoffMs(reconnectAttempt++);
      for (const s of states) s.lastError = `disconnect: ${reason ?? 'unknown'}; reconnect in ${delay}ms`;
      setTimeout(() => { void connectAndSubscribe(); }, delay);
    });
    try {
      await conn.subscribe(['orderbook_delta'], states.map((s) => s.entry.ticker));
    } catch (err) {
      for (const s of states) s.lastError = err instanceof Error ? err.message : String(err);
      return false;
    }
    reconnectAttempt = 0;
    for (const s of states) s.lastError = null;
    for (const state of states) {
      if (state.intervalId !== null) continue;
      state.intervalId = setInterval(() => emit(state), state.entry.cadenceMs);
    }
    return true;
  }

  function checkStaleness(): void {
    if (staleAfterMs <= 0 || !conn) return;
    const stale: string[] = [];
    for (const s of states) {
      const ms = tracker.msSinceLastUpdate(s.entry.ticker);
      if (ms !== null && ms >= staleAfterMs) stale.push(s.entry.ticker);
    }
    if (stale.length === 0) return;
    // Drop local state and re-subscribe — Kalshi sends a fresh snapshot on subscribe.
    for (const t of stale) tracker.forget(t);
    void conn.subscribe(['orderbook_delta'], stale).catch((err: unknown) => {
      for (const s of states) {
        if (stale.includes(s.entry.ticker)) s.lastError = `resync failed: ${err instanceof Error ? err.message : String(err)}`;
      }
    });
  }

  return {
    start(): void {
      attachSignalHandlers();
      stopping = false;
      void connectAndSubscribe();
      if (staleAfterMs > 0 && staleCheckId === null) {
        staleCheckId = setInterval(checkStaleness, STALE_CHECK_MS);
      }
    },

    stop(): void { stopAll(); },

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
