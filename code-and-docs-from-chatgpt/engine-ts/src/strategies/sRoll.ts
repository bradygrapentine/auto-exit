/**
 * sRoll.ts — S11 roll: phase 1 passive close + phase 2 aggressive open.
 *
 * Phase 1: Close currentTicker via S1 passive (minimize self-impact).
 * Phase 2: Open targetTicker via S2 aggressive, sized to
 *          min(targetSize, actuallyClosed) — preserves cash neutrality.
 *
 * If phase 1 fills 0 contracts, phase 2 is skipped entirely.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds (roll_started, roll_phase1_passive_close,
 * roll_phase2_aggressive_open, roll_finished) are cast via the jk() helper
 * to avoid touching types.ts.
 */

import type { KalshiClientLike, Side, JournalKind } from '../types.js';
import { Journal } from '../journal.js';
import { AggressiveRunner } from '../aggressive.js';
import type { AggressiveConfig, AggressiveResult } from '../aggressive.js';
import type { PassiveConfig, PassiveResult } from '../passive.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(k: string): JournalKind {
  return k as unknown as JournalKind;
}

// ── Injectable function types ─────────────────────────────────────────────────

export type PassiveInvokeFn = (
  cfg: PassiveConfig,
  journal?: Journal,
) => Promise<PassiveResult>;

export type AggressiveInvokeFn = (
  cfg: AggressiveConfig,
  journal?: Journal,
) => Promise<AggressiveResult>;

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface SRollConfig {
  currentTicker: string;
  currentSide: Side;
  /** Size to close in phase 1. */
  currentSize: number;
  targetTicker: string;
  targetSide: Side;
  /** Requested size to open in phase 2 (capped by phase 1 actuallyClosed). */
  targetSize: number;
  /** Must be true; prevents accidental rolls. */
  confirmedRoll: boolean;
  /** Forwarded to phase 2 aggressive. */
  oneTickIn?: boolean;
  /**
   * Injectable for tests: override passive run invocation.
   * When omitted, calls the real passive.run() bound to the client.
   */
  passiveInvoke?: PassiveInvokeFn;
  /**
   * Injectable for tests: override aggressive run invocation.
   * When omitted, creates a real AggressiveRunner bound to the client.
   */
  aggressiveInvoke?: AggressiveInvokeFn;
}

export interface SRollResult {
  phase1: PassiveResult;
  /** Undefined when halted on phase 1 unfilled. */
  phase2?: AggressiveResult;
  reason: 'complete' | 'phase1_unfilled' | 'phase1_partial_completed';
  actuallyClosed: number;
  actuallyOpened: number;
}

// ── Runner ────────────────────────────────────────────────────────────────────

export class SRollRunner {
  private readonly client: KalshiClientLike;
  private readonly config: SRollConfig;
  private readonly journal: Journal;

  constructor(
    client: KalshiClientLike,
    config: SRollConfig,
    journal?: Journal,
  ) {
    if (!config.confirmedRoll) throw new Error('S11 requires confirmedRoll=true');
    if (!config.currentTicker || !config.targetTicker) throw new Error('tickers required');
    if (config.currentSize <= 0 || config.targetSize <= 0) throw new Error('sizes must be > 0');

    this.client = client;
    this.config = config;
    this.journal = journal ?? new Journal(`s11-${Date.now()}`);
  }

  async run(): Promise<SRollResult> {
    const {
      currentTicker,
      currentSide,
      currentSize,
      targetTicker,
      targetSide,
      targetSize,
      oneTickIn,
    } = this.config;

    // Resolve passive invocation fn: injected mock or real passive.run().
    const passiveInvoke: PassiveInvokeFn =
      this.config.passiveInvoke ??
      ((cfg) => import('../passive.js').then((m) => m.run(this.client, cfg)));

    // Resolve aggressive invocation fn: injected mock or real AggressiveRunner.
    const aggressiveInvoke: AggressiveInvokeFn =
      this.config.aggressiveInvoke ??
      ((cfg, j) => new AggressiveRunner(this.client, cfg, j).run());

    this.journal.append(jk('roll_started'), {
      currentTicker,
      currentSide,
      currentSize,
      targetTicker,
      targetSide,
      targetSize,
    });

    // ── Phase 1: close existing position via S1 passive ───────────────────────
    const phase1Cfg: PassiveConfig = {
      ticker: currentTicker,
      side: 'sell',
      size: currentSize,
    };

    this.journal.append(jk('roll_phase1_passive_close'), { phase: 1, config: phase1Cfg });

    const phase1 = await passiveInvoke(phase1Cfg, this.journal);
    const actuallyClosed = phase1.filled;

    if (actuallyClosed === 0) {
      this.journal.append(jk('roll_finished'), {
        reason: 'phase1_unfilled',
        actuallyClosed: 0,
        actuallyOpened: 0,
      });
      return {
        phase1,
        reason: 'phase1_unfilled',
        actuallyClosed: 0,
        actuallyOpened: 0,
      };
    }

    // ── Phase 2: open target position via S2 aggressive ───────────────────────
    const phase2Size = Math.min(targetSize, actuallyClosed);
    const phase2Cfg: AggressiveConfig = {
      ticker: targetTicker,
      side: targetSide,
      action: 'buy',
      size: phase2Size,
      confirmedAggressive: true,
      oneTickIn,
    };

    this.journal.append(jk('roll_phase2_aggressive_open'), { phase: 2, config: phase2Cfg });

    const phase2 = await aggressiveInvoke(phase2Cfg, this.journal);
    const actuallyOpened = phase2.filled;

    const reason: SRollResult['reason'] =
      actuallyClosed === currentSize ? 'complete' : 'phase1_partial_completed';

    this.journal.append(jk('roll_finished'), {
      reason,
      actuallyClosed,
      actuallyOpened,
    });

    return { phase1, phase2, reason, actuallyClosed, actuallyOpened };
  }
}
