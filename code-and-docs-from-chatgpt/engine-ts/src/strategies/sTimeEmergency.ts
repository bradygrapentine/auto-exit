/**
 * sTimeEmergency.ts — S16 time-to-expiry emergency unwind.
 *
 * Clock-driven escalation across 4 phases keyed off now() vs contractCloseEpochMs.
 *
 *   T-60..T-30 → Phase 1: S1 passive on remaining
 *   T-30..T-10 → Phase 2: S7 scale-out via injected callback
 *   T-10..T-2  → Phase 3: S2 aggressive
 *   T-2..T-0   → Phase 4: cross any available bid (single IoC at top bid, no floor)
 *
 * Engine transitions when clock crosses boundary AND previous phase returned
 * (don't preempt). Late start: if now is past a boundary, skip directly to
 * current phase (don't replay). After each phase, recompute remainingSize;
 * if 0, halt with time_emergency_finished.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds (time_emergency_started, time_emergency_phase_entered,
 * time_emergency_phase_completed, time_emergency_finished) are cast via the
 * jk() helper to avoid touching types.ts.
 */

import type { KalshiClientLike, Side, JournalKind } from '../types.js';
import { Journal } from '../journal.js';
import { AggressiveRunner } from '../aggressive.js';
import type { AggressiveConfig, AggressiveResult } from '../aggressive.js';
import type { PassiveConfig, PassiveResult } from '../passive.js';
import type { S7Config, S7Result } from './s7ScaleOut.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(k: string): JournalKind {
  return k as unknown as JournalKind;
}

// ── Phase boundaries (minutes before close) ───────────────────────────────────

const PHASE_BOUNDARIES = {
  PASSIVE_START: 60,   // T-60 min: start passive
  S7_START: 30,        // T-30 min: switch to S7
  AGGRESSIVE_START: 10, // T-10 min: switch to aggressive
  CROSS_START: 2,      // T-2 min: cross any bid
} as const;

export type Phase = 'passive' | 's7' | 'aggressive' | 'cross';

// ── Injectable function types ─────────────────────────────────────────────────

export type PassiveInvokeFn = (
  cfg: PassiveConfig,
  journal?: Journal,
) => Promise<PassiveResult>;

export type S7InvokeFn = (
  cfg: S7Config,
  journal?: Journal,
) => Promise<S7Result>;

export type AggressiveInvokeFn = (
  cfg: AggressiveConfig,
  journal?: Journal,
) => Promise<AggressiveResult>;

export type CrossAnyBidInvokeFn = (
  ticker: string,
  size: number,
  journal?: Journal,
) => Promise<{ filled: number }>;

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface STimeEmergencyConfig {
  ticker: string;
  /** S16 is sell-only. */
  side: 'sell';
  /** Total contracts to unwind. */
  size: number;
  /** Unix epoch milliseconds at which the contract closes. */
  contractCloseEpochMs: number;
  /**
   * Injectable for tests: override passive run invocation.
   * When omitted, calls the real passive.run() bound to the client.
   */
  passiveInvoke?: PassiveInvokeFn;
  /**
   * Injectable for tests: override S7 scale-out invocation.
   * When omitted, runs the real S7ScaleOut runner.
   */
  s7Invoke?: S7InvokeFn;
  /**
   * Injectable for tests: override aggressive run invocation.
   * When omitted, creates a real AggressiveRunner bound to the client.
   */
  aggressiveInvoke?: AggressiveInvokeFn;
  /**
   * Injectable for tests: cross any available bid (IoC at top bid, no floor).
   * When omitted, creates a real AggressiveRunner bound to the client.
   */
  crossAnyBidInvoke?: CrossAnyBidInvokeFn;
  /**
   * Injectable for tests: override Date.now().
   * When omitted, uses real Date.now().
   */
  now?: () => number;
  /** Override KEA_HOME (for tests). */
  keaHome?: string;
  /** Unique job ID for journaling. Auto-generated when omitted. */
  jobId?: string;
}

export interface PhaseResult {
  phase: Phase;
  filled: number;
}

export interface STimeEmergencyResult {
  phases: PhaseResult[];
  totalFilled: number;
  reason: 'time_emergency_finished' | 'position_closed' | 'not_in_window';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function minutesToClose(now: number, contractCloseEpochMs: number): number {
  return (contractCloseEpochMs - now) / 60_000;
}

/**
 * Returns the current phase based on minutes remaining before close.
 * Returns null if outside the emergency window (> T-60).
 */
function currentPhase(minsLeft: number): Phase | null {
  if (minsLeft > PHASE_BOUNDARIES.PASSIVE_START) return null;
  if (minsLeft > PHASE_BOUNDARIES.S7_START) return 'passive';
  if (minsLeft > PHASE_BOUNDARIES.AGGRESSIVE_START) return 's7';
  if (minsLeft > PHASE_BOUNDARIES.CROSS_START) return 'aggressive';
  return 'cross';
}

/**
 * Build a STimeEmergencyConfig with required fields.
 * Validates at call site — throws on invalid args.
 */
export function buildSTimeEmergencyArgs(args: {
  ticker: string;
  side: 'sell';
  size: number;
  contractCloseEpochMs: number;
}): Pick<STimeEmergencyConfig, 'ticker' | 'side' | 'size' | 'contractCloseEpochMs'> {
  if (args.side !== 'sell') {
    throw new Error('S16 is sell-only: side must be "sell"');
  }
  if (args.size <= 0) {
    throw new Error('S16 requires size > 0');
  }
  if (!args.contractCloseEpochMs || args.contractCloseEpochMs <= 0) {
    throw new Error('S16 requires contractCloseEpochMs > 0');
  }
  return {
    ticker: args.ticker,
    side: 'sell',
    size: args.size,
    contractCloseEpochMs: args.contractCloseEpochMs,
  };
}

// ── Runner ────────────────────────────────────────────────────────────────────

export class STimeEmergencyRunner {
  private readonly client: KalshiClientLike;
  private readonly config: STimeEmergencyConfig;
  private readonly journal: Journal;

  constructor(
    client: KalshiClientLike,
    config: STimeEmergencyConfig,
    journal?: Journal,
  ) {
    if (config.side !== 'sell') throw new Error('S16 is sell-only: side must be "sell"');
    if (config.size <= 0) throw new Error('S16 requires size > 0');
    if (!config.contractCloseEpochMs || config.contractCloseEpochMs <= 0) {
      throw new Error('S16 requires contractCloseEpochMs > 0');
    }

    this.client = client;
    this.config = config;
    this.journal = journal ?? new Journal(`s16-${Date.now()}`, config.keaHome);
  }

  async run(): Promise<STimeEmergencyResult> {
    const { ticker, size, contractCloseEpochMs } = this.config;

    const nowFn: () => number = this.config.now ?? (() => Date.now());

    // Resolve all invoke fns
    const passiveInvoke: PassiveInvokeFn =
      this.config.passiveInvoke ??
      ((cfg) => import('../passive.js').then((m) => m.run(this.client, cfg)));

    const s7Invoke: S7InvokeFn =
      this.config.s7Invoke ??
      ((cfg, j) =>
        import('./s7ScaleOut.js').then((m) => {
          const runner = new m.S7ScaleOutRunner(this.client, cfg, j);
          return runner.run();
        }));

    const aggressiveInvoke: AggressiveInvokeFn =
      this.config.aggressiveInvoke ??
      ((cfg, j) => new AggressiveRunner(this.client, cfg, j).run());

    const crossAnyBidInvoke: CrossAnyBidInvokeFn =
      this.config.crossAnyBidInvoke ??
      ((t, sz, j) =>
        new AggressiveRunner(
          this.client,
          {
            ticker: t,
            side: 'yes',
            action: 'sell',
            size: sz,
            confirmedAggressive: true,
          },
          j,
        ).run());

    // Determine starting phase
    const minsLeftAtStart = minutesToClose(nowFn(), contractCloseEpochMs);
    const startPhase = currentPhase(minsLeftAtStart);

    this.journal.append(jk('time_emergency_started'), {
      ticker,
      size,
      contractCloseEpochMs,
      minsLeftAtStart,
      startPhase,
    });

    if (startPhase === null) {
      this.journal.append(jk('time_emergency_finished'), {
        reason: 'not_in_window',
        minsLeftAtStart,
      });
      return { phases: [], totalFilled: 0, reason: 'not_in_window' };
    }

    // Phase execution order — skip phases already past
    const phaseOrder: Phase[] = ['passive', 's7', 'aggressive', 'cross'];
    const startIdx = phaseOrder.indexOf(startPhase);
    const phasesToRun = phaseOrder.slice(startIdx);

    let remainingSize = size;
    const phaseResults: PhaseResult[] = [];

    for (const phase of phasesToRun) {
      if (remainingSize <= 0) break;

      const minsLeft = minutesToClose(nowFn(), contractCloseEpochMs);

      this.journal.append(jk('time_emergency_phase_entered'), {
        phase,
        remainingSize,
        minutesToClose: minsLeft,
      });

      let phaseFilled = 0;

      if (phase === 'passive') {
        const cfg: PassiveConfig = {
          ticker,
          side: 'sell',
          size: remainingSize,
        };
        const result = await passiveInvoke(cfg, this.journal);
        phaseFilled = result.filled;
      } else if (phase === 's7') {
        const cfg: S7Config = {
          ticker,
          side: 'sell',
          totalSize: remainingSize,
          // Single rung at price 0: fires immediately to drain all remaining size.
          rungs: [{ priceCents: 0, sizePct: 100 }],
        };
        const result = await s7Invoke(cfg, this.journal);
        phaseFilled = result.totalFilled;
      } else if (phase === 'aggressive') {
        const cfg: AggressiveConfig = {
          ticker,
          side: 'yes',
          action: 'sell',
          size: remainingSize,
          confirmedAggressive: true,
        };
        const result = await aggressiveInvoke(cfg, this.journal);
        phaseFilled = result.filled;
      } else if (phase === 'cross') {
        // Single IoC at top bid, no floor
        const result = await crossAnyBidInvoke(ticker, remainingSize, this.journal);
        phaseFilled = result.filled;
      }

      remainingSize -= phaseFilled;
      phaseResults.push({ phase, filled: phaseFilled });

      this.journal.append(jk('time_emergency_phase_completed'), {
        phase,
        filled: phaseFilled,
        remainingSize,
      });

      // After each phase, recompute — if now() has jumped past next boundary
      // the for-loop naturally picks the next phase in sequence
    }

    const totalFilled = phaseResults.reduce((acc, p) => acc + p.filled, 0);
    const reason: STimeEmergencyResult['reason'] =
      remainingSize <= 0 ? 'position_closed' : 'time_emergency_finished';

    this.journal.append(jk('time_emergency_finished'), {
      reason,
      totalFilled,
      remainingSize,
    });

    return { phases: phaseResults, totalFilled, reason };
  }
}
