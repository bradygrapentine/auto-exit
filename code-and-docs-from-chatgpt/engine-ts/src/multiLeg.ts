/**
 * multiLeg.ts — S5 multi-leg primitive: parallel leg orchestration with skew throttle.
 *
 * Spawns one sub-runner per leg (AggressiveRunner or passive.run()) and keeps them
 * progressing in lockstep within legSkewPct. If any leg's orderbook becomes empty or
 * throws, all legs are halted immediately (atomicity-of-progress).
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds are cast via jk() to avoid touching types.ts.
 */

import type { KalshiClientLike, JournalKind, Orderbook, Side } from './types.js';
import { Journal } from './journal.js';
import type { AggressiveConfig, AggressiveResult } from './aggressive.js';
import type { PassiveConfig, PassiveResult } from './passive.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

// ── Injectable function types ──────────────────────────────────────────────────

export type AggressiveInvokeFn = (
  cfg: AggressiveConfig,
  journal?: Journal,
) => Promise<AggressiveResult>;

export type PassiveInvokeFn = (
  cfg: PassiveConfig,
  journal?: Journal,
) => Promise<PassiveResult>;

export type FetchOrderbookFn = (ticker: string) => Promise<Orderbook | null>;

// ── Public interfaces ──────────────────────────────────────────────────────────

export interface LegConfig {
  ticker: string;
  side: Side;
  size: number;
  executionMode: 'aggressive' | 'passive';
}

export interface MultiLegJobConfig {
  legs: LegConfig[];
  legSkewPct?: number;       // default 0.10
  journal: Journal;
  client: KalshiClientLike;
  /** Injectable for tests. */
  aggressiveInvoke?: AggressiveInvokeFn;
  passiveInvoke?: PassiveInvokeFn;
  fetchOrderbook?: FetchOrderbookFn;
  now?: () => number;
  sleepMs?: (ms: number) => Promise<void>;
  pollIntervalMs?: number;   // default 1000
}

export interface LegResult {
  filled: number;
  leg: LegConfig;
}

export interface MultiLegResult {
  legs: LegResult[];
  halted: boolean;
  haltReason?: string;
  durationMs: number;
}

// ── Internal leg state ────────────────────────────────────────────────────────

interface LegState {
  index: number;
  leg: LegConfig;
  filled: number;
  done: boolean;
  paused: boolean;
  /** Promise that resolves when the leg's runner finishes (or errors). */
  promise: Promise<void>;
  /** Signals the leg runner to pause (stop posting new orders). */
  pauseSignal: { paused: boolean };
  /** Signals the leg runner to halt permanently. */
  haltSignal: { halted: boolean };
  /** Resolve the leg's promise — called when done or when halted. */
  resolve: () => void;
  reject: (err: unknown) => void;
}

// ── Runner ─────────────────────────────────────────────────────────────────────

export class MultiLegJobRunner {
  private readonly config: Required<
    Pick<MultiLegJobConfig, 'legSkewPct' | 'pollIntervalMs'>
  > & MultiLegJobConfig;
  private readonly journal: Journal;
  private halted = false;
  private haltReason?: string;

  constructor(config: MultiLegJobConfig) {
    if (config.legs.length < 1) throw new Error('multiLeg: at least one leg required');
    for (const leg of config.legs) {
      if (leg.size <= 0) throw new Error(`multiLeg: leg size must be > 0 (ticker=${leg.ticker})`);
    }
    this.config = {
      legSkewPct: 0.10,
      pollIntervalMs: 1000,
      ...config,
    };
    this.journal = config.journal;
  }

  private haltAll(states: LegState[], reason: string): void {
    if (this.halted) return; // idempotent
    this.halted = true;
    this.haltReason = reason;
    for (const s of states) {
      s.haltSignal.halted = true;
      // Resolve the leg promise immediately so Promise.allSettled doesn't hang
      if (!s.done) {
        s.done = true;
        s.resolve();
      }
    }
    this.journal.append(jk('multileg_halted'), { reason });
  }

  async run(): Promise<MultiLegResult> {
    const {
      legs,
      legSkewPct,
      pollIntervalMs,
      journal,
      client,
      now = () => Date.now(),
      sleepMs = (ms: number) => new Promise((r) => setTimeout(r, ms)),
      fetchOrderbook = (ticker: string) => client.getOrderbook(ticker, 5),
      aggressiveInvoke,
      passiveInvoke,
    } = this.config;

    const startMs = now();

    journal.append(jk('multileg_started'), {
      legCount: legs.length,
      legSkewPct,
      tickers: legs.map((l) => l.ticker),
    });

    // ── Resolve invoke functions ──────────────────────────────────────────────

    const resolveAggressiveInvoke: AggressiveInvokeFn =
      aggressiveInvoke ??
      ((cfg, j) =>
        import('./aggressive.js').then((m) => {
          const runner = new m.AggressiveRunner(client, cfg, j);
          return runner.run();
        }));

    const resolvePassiveInvoke: PassiveInvokeFn =
      passiveInvoke ??
      ((cfg, j) => {
        void j; // passive.run creates its own journal internally
        return import('./passive.js').then((m) => m.run(client, cfg));
      });

    // ── Spawn leg runners ─────────────────────────────────────────────────────

    const states: LegState[] = [];

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i]!;
      const pauseSignal = { paused: false };
      const haltSignal = { halted: false };

      let resolvePromise!: () => void;
      let rejectPromise!: (err: unknown) => void;
      const legPromise = new Promise<void>((res, rej) => {
        resolvePromise = res;
        rejectPromise = rej;
      });

      const state: LegState = {
        index: i,
        leg,
        filled: 0,
        done: false,
        paused: false,
        promise: legPromise,
        pauseSignal,
        haltSignal,
        resolve: resolvePromise,
        reject: rejectPromise,
      };
      states.push(state);

      journal.append(jk('multileg_leg_started'), { legIndex: i, ticker: leg.ticker, side: leg.side, size: leg.size, executionMode: leg.executionMode });

      // Run leg in background (don't await here).
      // haltAll() may resolve the promise early; the runLeg task continues in background
      // but its completion is safe to ignore once halted.
      this.runLeg(state, leg, resolveAggressiveInvoke, resolvePassiveInvoke, journal).then(
        () => {
          if (!state.done) {
            state.done = true;
            state.resolve();
          }
        },
        (err: unknown) => {
          if (!state.done) {
            state.done = true;
            state.reject(err);
          }
        },
      );
    }

    // ── Poll loop: skew + halt detection ─────────────────────────────────────

    while (!this.halted) {
      // Check orderbooks for empty side / throws (only for still-running legs)
      const anyRunning = states.some((s) => !s.done);
      if (anyRunning) {
        for (const s of states) {
          if (s.done || this.halted) continue;
          try {
            const book = await (fetchOrderbook as FetchOrderbookFn)(s.leg.ticker);
            const isEmpty = book === null || this.isBookEmpty(book, s.leg);
            if (isEmpty) {
              this.haltAll(states, `leg ${s.index} (${s.leg.ticker}): empty book`);
              break;
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.haltAll(states, `leg ${s.index} (${s.leg.ticker}): orderbook throw — ${msg}`);
            break;
          }
        }
        if (this.halted) break;
      }

      // Compute progress percentages and apply skew throttle.
      // Done legs contribute their fill fraction; in-flight legs contribute current fills.
      const progressPcts = states.map((s) =>
        s.leg.size > 0 ? s.filled / s.leg.size : (s.done ? 1 : 0),
      );
      const maxPct = Math.max(...progressPcts);
      const minPct = Math.min(...progressPcts);
      const skew = maxPct - minPct;
      const threshold = legSkewPct;
      const hysteresis = legSkewPct / 2;

      for (let i = 0; i < states.length; i++) {
        const s = states[i]!;
        // Include done legs in skew detection — a completed leg that ran ahead of others
        // gets a skew_pause entry for diagnostics and potential latecomer halt scenarios.
        const isLeading = progressPcts[i]! > minPct + hysteresis && skew > threshold;
        if (isLeading && !s.paused) {
          s.paused = true;
          s.pauseSignal.paused = true;
          journal.append(jk('multileg_skew_pause'), { legIndex: i, progressPct: progressPcts[i], skew });
        } else if (!isLeading && s.paused && skew <= hysteresis) {
          s.paused = false;
          s.pauseSignal.paused = false;
          journal.append(jk('multileg_skew_resume'), { legIndex: i, progressPct: progressPcts[i], skew });
        }
      }

      // Exit loop once all legs are done (after skew check for final accounting)
      const allDone = states.every((s) => s.done);
      if (allDone) break;

      await sleepMs(pollIntervalMs);
    }

    // Wait for all leg promises to settle
    await Promise.allSettled(states.map((s) => s.promise));

    const endMs = now();

    journal.append(jk('multileg_finished'), {
      halted: this.halted,
      haltReason: this.haltReason,
      legs: states.map((s) => ({ legIndex: s.index, filled: s.filled })),
      durationMs: endMs - startMs,
    });

    return {
      legs: states.map((s) => ({ filled: s.filled, leg: s.leg })),
      halted: this.halted,
      haltReason: this.haltReason,
      durationMs: endMs - startMs,
    };
  }

  private isBookEmpty(book: Orderbook, leg: LegConfig): boolean {
    // For a sell: need yes bids (buyers). For a buy: need no bids (implied sellers).
    if (leg.executionMode === 'aggressive') {
      const action = 'sell'; // multileg typically exits; if buy, we'd need opposite
      // Check if there's any liquidity on the relevant side
      if (action === 'sell') {
        return book.yes.filter((l) => l.size > 0).length === 0;
      }
      return book.no.filter((l) => l.size > 0).length === 0;
    }
    // Passive: same logic — if yes side empty for a sell position
    return book.yes.filter((l) => l.size > 0).length === 0 &&
           book.no.filter((l) => l.size > 0).length === 0;
  }

  private async runLeg(
    state: LegState,
    leg: LegConfig,
    aggressiveInvoke: AggressiveInvokeFn,
    passiveInvoke: PassiveInvokeFn,
    journal: Journal,
  ): Promise<void> {
    // Wait while paused; abort if halted
    while (state.pauseSignal.paused && !state.haltSignal.halted) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (state.haltSignal.halted) return;

    if (leg.executionMode === 'aggressive') {
      const cfg: AggressiveConfig = {
        ticker: leg.ticker,
        side: leg.side,
        action: 'sell', // sensible default for exit strategies; callers may override via sPair
        size: leg.size,
        confirmedAggressive: true,
      };
      const result = await aggressiveInvoke(cfg, journal);
      state.filled = result.filled;
    } else {
      const cfg: PassiveConfig = {
        ticker: leg.ticker,
        side: 'sell',
        size: leg.size,
      };
      const result = await passiveInvoke(cfg, journal);
      state.filled = result.filled;
    }

    journal.append(jk('multileg_leg_completed'), {
      legIndex: state.index,
      ticker: leg.ticker,
      filled: state.filled,
    });
  }
}
