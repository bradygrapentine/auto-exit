/**
 * sTwap.ts — S3 TWAP runner: time-sliced S1 passive across N intervals.
 *
 * Divides `size` into `numIntervals` equal slices (floor division; remainder
 * rolls into the last interval) and fires an S1 passive invocation for each
 * slice on a fixed schedule. Scheduling is drift-free: each interval fires at
 * `startTime + i * intervalMs` (absolute boundaries), so setTimeout chain drift
 * does not accumulate.
 *
 * Optional `sessionWindow` pauses the runner outside the UTC window and resumes
 * at the next session start, journaling `twap_session_paused` / `twap_session_resumed`.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds cast via jk() to avoid touching types.ts.
 */

import { Journal, generateJobId } from '../journal.js';
import type { PassiveConfig, PassiveResult } from '../passive.js';
import type { JournalKind } from '../types.js';
import { computePaceDelayMs } from '../participationRate.js';

/** Direction for TWAP — matches PassiveConfig.side. */
type TwapSide = 'buy' | 'sell';

// Cast unknown string → JournalKind without touching types.ts.
function jk(s: string): JournalKind {
  return s as unknown as JournalKind;
}

// ── Injectable function type (re-exported for consumers) ─────────────────────

export type PassiveInvokeFn = (
  cfg: PassiveConfig,
  journal?: Journal,
) => Promise<PassiveResult>;

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface SessionWindow {
  /** UTC start time in HH:MM format, e.g. "09:00" */
  startUtc: string;
  /** UTC end time in HH:MM format, e.g. "17:00" */
  endUtc: string;
}

export interface STwapConfig {
  ticker: string;
  side: TwapSide;
  size: number;
  intervalMinutes: number;
  numIntervals: number;
  sessionWindow?: SessionWindow;
  /**
   * Injectable for tests: override passive run invocation.
   * When omitted, calls the real passive.run().
   */
  passiveInvoke?: PassiveInvokeFn;
  /**
   * Injectable sleep for deterministic tests. Defaults to real setTimeout.
   */
  sleepMs?: (ms: number) => Promise<void>;
  /**
   * Injectable clock for deterministic tests. Defaults to () => new Date().
   */
  now?: () => Date;
  /** Passthrough to each S1 passive invocation. */
  s1Template?: Partial<PassiveConfig>;
  /** Override KEA_HOME (for tests). */
  keaHome?: string;
  /** Unique job ID for journaling. Auto-generated when omitted. */
  jobId?: string;
  /**
   * W3.1 POV pacing: maximum participation rate as a fraction of recent
   * minute volume (e.g. 0.1 = 10%). When set, the inter-interval delay is
   * inflated if recent fills exceed the allowed rate. Default undefined = off.
   */
  maxParticipationRate?: number;
}

export interface STwapResult {
  totalFilled: number;
  intervalsFired: number;
  reason: 'complete' | 'caller_stopped';
}

// ── Validation ────────────────────────────────────────────────────────────────

const HH_MM_RE = /^\d{2}:\d{2}$/;

function validateSessionWindow(win: SessionWindow): void {
  if (!HH_MM_RE.test(win.startUtc)) {
    throw new Error(`STwapConfig: sessionWindow.startUtc must be HH:MM, got "${win.startUtc}"`);
  }
  if (!HH_MM_RE.test(win.endUtc)) {
    throw new Error(`STwapConfig: sessionWindow.endUtc must be HH:MM, got "${win.endUtc}"`);
  }
  const [sh, sm] = win.startUtc.split(':').map(Number);
  const [eh, em] = win.endUtc.split(':').map(Number);
  if (sh > 23 || sm > 59) {
    throw new Error(`STwapConfig: sessionWindow.startUtc out of range: "${win.startUtc}"`);
  }
  if (eh > 23 || em > 59) {
    throw new Error(`STwapConfig: sessionWindow.endUtc out of range: "${win.endUtc}"`);
  }
}

function validateConfig(cfg: STwapConfig): void {
  if (!cfg.ticker || cfg.ticker.trim() === '') {
    throw new Error('STwapConfig: ticker must be non-empty');
  }
  if ((cfg.side as string) !== 'buy' && (cfg.side as string) !== 'sell') {
    throw new Error(`STwapConfig: side must be "buy" or "sell", got "${cfg.side}"`);
  }
  if (cfg.size <= 0) {
    throw new Error('STwapConfig: size must be > 0');
  }
  if (cfg.intervalMinutes <= 0) {
    throw new Error('STwapConfig: intervalMinutes must be > 0');
  }
  if (!Number.isInteger(cfg.numIntervals) || cfg.numIntervals < 2) {
    throw new Error('STwapConfig: numIntervals must be an integer >= 2');
  }
  if (cfg.sessionWindow !== undefined) {
    validateSessionWindow(cfg.sessionWindow);
  }
}

// ── Session window helpers ────────────────────────────────────────────────────

/**
 * Returns minutes since midnight UTC for a Date.
 */
function utcMinutesSinceMidnight(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Parses "HH:MM" to minutes since midnight.
 */
function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Returns true if `nowDate` is within the session window [startUtc, endUtc).
 * Handles windows that don't cross midnight (startUtc < endUtc) only — TWAP
 * windows are typically intraday business windows.
 */
function isInSessionWindow(nowDate: Date, win: SessionWindow): boolean {
  const nowMin = utcMinutesSinceMidnight(nowDate);
  const startMin = parseHHMM(win.startUtc);
  const endMin = parseHHMM(win.endUtc);
  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  // Overnight window: startMin >= endMin (e.g. 22:00..06:00)
  return nowMin >= startMin || nowMin < endMin;
}

/**
 * Returns the ms until the next session start from `nowDate`.
 */
function msUntilNextSessionStart(nowDate: Date, win: SessionWindow): number {
  const nowMin = utcMinutesSinceMidnight(nowDate);
  const startMin = parseHHMM(win.startUtc);

  // Seconds/ms within the current minute that have already elapsed
  const msIntoCurrentMin =
    (nowDate.getUTCSeconds() * 1000 + nowDate.getUTCMilliseconds());

  let minutesUntilStart: number;
  if (startMin > nowMin) {
    minutesUntilStart = startMin - nowMin;
  } else {
    // startMin <= nowMin → next occurrence is tomorrow
    minutesUntilStart = 1440 - nowMin + startMin;
  }

  return minutesUntilStart * 60_000 - msIntoCurrentMin;
}

// ── Slice distribution ────────────────────────────────────────────────────────

/**
 * Returns an array of slice sizes of length numIntervals.
 * floor(size/numIntervals) for each; last slice absorbs the remainder.
 */
export function computeSliceSizes(size: number, numIntervals: number): number[] {
  const base = Math.floor(size / numIntervals);
  const remainder = size - base * numIntervals;
  const slices = Array<number>(numIntervals).fill(base);
  slices[numIntervals - 1] += remainder;
  return slices;
}

// ── Tick outcome type ─────────────────────────────────────────────────────────

/**
 * Outcome of a single runOneTick() call.
 *
 * `continue`   — tick executed normally; caller should advance to the next interval.
 * `break_loop` — runner should stop; `reason` encodes why:
 *   - "caller_stopped"     — stop() was called before or after the passive invoke
 *   - "schedule_complete"  — all numIntervals have fired
 */
export type STwapTickOutcome =
  | { kind: 'continue' }
  | { kind: 'break_loop'; reason: 'caller_stopped' | 'schedule_complete' };

// ── Mutable tick state (passed by reference through run / runOneTick) ─────────

/** Internal mutable state threaded through runOneTick() calls. */
export interface STwapTickState {
  intervalIndex: number;
  totalFilled: number;
  intervalsFired: number;
  fillWindow: Array<{ ts: number; size: number }>;
  startMs: number;
}

// ── Runner class ──────────────────────────────────────────────────────────────

export class STwapRunner {
  private readonly config: STwapConfig;
  private readonly journal: Journal;
  private readonly jobId: string;
  private stopped = false;

  constructor(config: STwapConfig, journal?: Journal | unknown) {
    validateConfig(config);
    this.jobId = config.jobId ?? generateJobId();
    this.journal = journal instanceof Journal
      ? journal
      : new Journal(this.jobId, config.keaHome);
    this.config = config;
  }

  /** Signal the runner to stop after the current interval completes. */
  stop(): void {
    this.stopped = true;
  }

  /**
   * Execute one TWAP tick for the interval at `state.intervalIndex`.
   *
   * Responsibilities:
   * - Checks the kill-switch (stopped) before and after passive invoke.
   * - Fires the S1 passive invocation for the current slice.
   * - Updates state.totalFilled, state.intervalsFired, state.fillWindow in place.
   * - Journals twap_interval_fired.
   * - Does NOT sleep — callers own the inter-interval delay and session-window sleep.
   *
   * Returns `{ kind: 'break_loop', reason: 'caller_stopped' }` if stop() was called,
   * `{ kind: 'break_loop', reason: 'schedule_complete' }` after the final interval fires,
   * or `{ kind: 'continue' }` otherwise.
   */
  async runOneTick(
    state: STwapTickState,
    opts: {
      slices: number[];
      passiveInvoke: PassiveInvokeFn;
      now: () => Date;
    },
  ): Promise<STwapTickOutcome> {
    const { ticker, side, s1Template = {} } = this.config;
    const numIntervals = this.config.numIntervals;
    const povRate = this.config.maxParticipationRate;
    const { slices, passiveInvoke, now } = opts;
    const i = state.intervalIndex;

    // ── Graceful stop (pre-invoke) ────────────────────────────────────────────
    if (this.stopped) {
      return { kind: 'break_loop', reason: 'caller_stopped' };
    }

    // ── Fire S1 passive for this slice ────────────────────────────────────────
    const sliceSize = slices[i];
    const passiveCfg: PassiveConfig = {
      ...s1Template,
      ticker,
      side,
      size: sliceSize,
      keaHome: this.config.keaHome,
    };

    const result = await passiveInvoke(passiveCfg, this.journal);
    state.totalFilled += result.filled;
    state.intervalsFired += 1;

    // W3.1 POV pacing: record fills in rolling window
    if (povRate !== undefined && result.filled > 0) {
      state.fillWindow.push({ ts: now().getTime(), size: result.filled });
    }

    this.journal.append(jk('twap_interval_fired'), {
      intervalIndex: i,
      sliceSize,
      filled: result.filled,
      totalFilled: state.totalFilled,
      result,
    });

    // ── Graceful stop (post-invoke) ───────────────────────────────────────────
    if (this.stopped) {
      return { kind: 'break_loop', reason: 'caller_stopped' };
    }

    // ── Advance interval index ────────────────────────────────────────────────
    state.intervalIndex += 1;

    if (state.intervalIndex >= numIntervals) {
      return { kind: 'break_loop', reason: 'schedule_complete' };
    }

    return { kind: 'continue' };
  }

  async run(): Promise<STwapResult> {
    const {
      ticker,
      side,
      size,
      intervalMinutes,
      numIntervals,
      sessionWindow,
      s1Template = {},
    } = this.config;

    const sleepMs: (ms: number) => Promise<void> =
      this.config.sleepMs ??
      ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

    const now: () => Date = this.config.now ?? (() => new Date());

    const passiveInvoke: PassiveInvokeFn =
      this.config.passiveInvoke ??
      ((cfg) => import('../passive.js').then((m) => m.run(undefined as never, cfg)));

    const intervalMs = intervalMinutes * 60_000;
    const slices = computeSliceSizes(size, numIntervals);

    this.journal.append(jk('twap_started'), {
      ticker,
      side,
      size,
      intervalMinutes,
      numIntervals,
      slices,
      sessionWindow: sessionWindow ?? null,
      jobId: this.jobId,
    });

    const state: STwapTickState = {
      intervalIndex: 0,
      totalFilled: 0,
      intervalsFired: 0,
      fillWindow: [],
      startMs: now().getTime(),
    };

    // W3.1 POV pacing helper (used by run() for inter-interval delay only)
    const povRate = this.config.maxParticipationRate;
    const recentMinuteFills = (): number => {
      const cutoff = now().getTime() - 60_000;
      let i = 0;
      while (i < state.fillWindow.length && state.fillWindow[i].ts < cutoff) i++;
      state.fillWindow.splice(0, i);
      return state.fillWindow.reduce((s, e) => s + e.size, 0);
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // ── Session window check (sleep stays in run, not runOneTick) ────────────
      if (sessionWindow) {
        const nowDate = now();
        if (!isInSessionWindow(nowDate, sessionWindow)) {
          const waitMs = msUntilNextSessionStart(nowDate, sessionWindow);
          this.journal.append(jk('twap_session_paused'), {
            intervalIndex: state.intervalIndex,
            nowIso: nowDate.toISOString(),
            waitMs,
          });
          await sleepMs(waitMs);
          this.journal.append(jk('twap_session_resumed'), {
            intervalIndex: state.intervalIndex,
            nowIso: now().toISOString(),
          });
        }
      }

      // ── Delegate tick body to runOneTick ──────────────────────────────────
      const outcome = await this.runOneTick(state, { slices, passiveInvoke, now });

      if (outcome.kind === 'break_loop') {
        // Map internal reason to STwapResult reason
        const reason: STwapResult['reason'] =
          outcome.reason === 'caller_stopped' ? 'caller_stopped' : 'complete';

        this.journal.append(jk('twap_finished'), {
          reason,
          totalFilled: state.totalFilled,
          intervalsFired: state.intervalsFired,
          numIntervals,
        });

        return { totalFilled: state.totalFilled, intervalsFired: state.intervalsFired, reason };
      }

      // ── Drift-free sleep until next absolute boundary (stays in run) ──────
      const i = state.intervalIndex - 1; // index just completed
      if (i < numIntervals - 1) {
        const nextFireAt = state.startMs + state.intervalIndex * intervalMs;
        const waitUntilNext = nextFireAt - now().getTime();
        if (waitUntilNext > 0) {
          // W3.1 POV pacing: inflate delay if exceeding participation rate
          const effectiveWait = (povRate !== undefined)
            ? computePaceDelayMs(
                recentMinuteFills(),
                { maxParticipationRate: povRate, recentMinuteVolume: slices[i] },
                waitUntilNext,
              )
            : waitUntilNext;
          await sleepMs(effectiveWait);
        }
        // If negative (we're late), proceed immediately — no drift accumulation.
      }
    }
  }
}

// ── Preset builder ────────────────────────────────────────────────────────────

export interface BuildSTwapArgs {
  ticker: string;
  side: TwapSide;
  size: number;
  intervalMinutes: number;
  numIntervals: number;
  sessionWindow?: SessionWindow;
  s1Template?: Partial<PassiveConfig>;
  keaHome?: string;
  jobId?: string;
  maxParticipationRate?: number;
}

/**
 * Build a validated STwapConfig from flat args.
 * Throws on invalid input, matching STwapRunner constructor validation exactly.
 */
export function buildSTwapArgs(opts: BuildSTwapArgs): STwapConfig {
  validateConfig(opts as STwapConfig);
  return { ...opts };
}
