/**
 * sStopAndReverse.ts — S9 stop-and-reverse: two-phase aggressive orchestration.
 *
 * Phase 1: Aggressively close the existing position (sell).
 * Phase 2: Aggressively open the opposite position (buy).
 *
 * Both phases share a single journal. If phase 1 is fully unfilled, phase 2 is
 * skipped entirely. A partial fill on phase 1 still proceeds to phase 2.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds (reverse_started, reverse_phase1_close, reverse_phase2_open,
 * reverse_finished) are cast via the jk() helper to avoid touching types.ts.
 */

import type { KalshiClientLike, Side, JournalKind } from '../types.js';
import { Journal } from '../journal.js';
import { AggressiveRunner } from '../aggressive.js';
import type { AggressiveConfig, AggressiveResult } from '../aggressive.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(k: string): JournalKind {
  return k as unknown as JournalKind;
}

// ── Public interfaces ──────────────────────────────────────────────────────────

export type AggressiveInvokeFn = (
  cfg: AggressiveConfig,
  journal?: Journal,
) => Promise<AggressiveResult>;

export interface SStopAndReverseConfig {
  ticker: string;
  /** The side currently held (to be closed). */
  closeSide: Side;
  /** Size of the existing position to close. */
  closeSize: number;
  /** Target side to open (typically opposite of closeSide). */
  openSide: Side;
  /** Size to open on the new side. */
  openSize: number;
  /** Must be true; prevents accidental double-sided trades. */
  confirmedReverse: boolean;
  /** Forwarded to both AggressiveRunner phases. */
  oneTickIn?: boolean;
  /**
   * Injectable for tests: override AggressiveRunner invocation.
   * When omitted, creates a real AggressiveRunner bound to the client.
   */
  aggressiveInvoke?: AggressiveInvokeFn;
}

export interface SStopAndReverseResult {
  phase1: AggressiveResult;
  /** Undefined when halted on phase 1 unfilled. */
  phase2?: AggressiveResult;
  reason: 'complete' | 'phase1_unfilled' | 'phase1_partial_completed';
}

// ── Runner ─────────────────────────────────────────────────────────────────────

export class SStopAndReverseRunner {
  private readonly client: KalshiClientLike;
  private readonly config: SStopAndReverseConfig;
  private readonly journal: Journal;

  constructor(
    client: KalshiClientLike,
    config: SStopAndReverseConfig,
    journal?: Journal,
  ) {
    if (!config.confirmedReverse) throw new Error('S9 requires confirmedReverse=true');
    if (config.closeSize <= 0) throw new Error('sizes must be > 0');
    if (config.openSize <= 0) throw new Error('sizes must be > 0');
    if (!config.ticker) throw new Error('ticker required');

    this.client = client;
    this.config = config;
    this.journal = journal ?? new Journal(`s9-${Date.now()}`);
  }

  async run(): Promise<SStopAndReverseResult> {
    const { ticker, closeSide, closeSize, openSide, openSize, oneTickIn } = this.config;

    // Resolve invocation fn: injected mock or real AggressiveRunner.
    const invoke: AggressiveInvokeFn =
      this.config.aggressiveInvoke ??
      ((cfg, j) => new AggressiveRunner(this.client, cfg, j).run());

    this.journal.append(jk('reverse_started'), {
      ticker,
      closeSide,
      closeSize,
      openSide,
      openSize,
    });

    // ── Phase 1: close existing position ────────────────────────────────────
    const phase1Cfg: AggressiveConfig = {
      ticker,
      side: closeSide,
      action: 'sell',
      size: closeSize,
      confirmedAggressive: true,
      oneTickIn,
    };

    this.journal.append(jk('reverse_phase1_close'), { phase: 1, config: phase1Cfg });

    const phase1 = await invoke(phase1Cfg, this.journal);

    if (phase1.reason === 'unfilled') {
      this.journal.append(jk('reverse_finished'), {
        reason: 'phase1_unfilled',
        phase1Filled: phase1.filled,
      });
      return { phase1, reason: 'phase1_unfilled' };
    }

    const finalReason: SStopAndReverseResult['reason'] =
      phase1.reason === 'partial' ? 'phase1_partial_completed' : 'complete';

    // ── Phase 2: open new position ───────────────────────────────────────────
    const phase2Cfg: AggressiveConfig = {
      ticker,
      side: openSide,
      action: 'buy',
      size: openSize,
      confirmedAggressive: true,
      oneTickIn,
    };

    this.journal.append(jk('reverse_phase2_open'), { phase: 2, config: phase2Cfg });

    const phase2 = await invoke(phase2Cfg, this.journal);

    this.journal.append(jk('reverse_finished'), {
      reason: finalReason,
      phase1Filled: phase1.filled,
      phase2Filled: phase2.filled,
    });

    return { phase1, phase2, reason: finalReason };
  }
}
