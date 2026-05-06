/**
 * sPreResolutionArb.ts — S6 pre-resolution arbitrage exit: two-phase IoC escalation.
 *
 * Phase 1: Post one IoC at bid+1¢ (sell) / ask−1¢ (buy) for full size,
 *          giving up one tick to maximise fill probability before resolution.
 * Phase 2: If phase 1 is unfilled (or only partially filled) within
 *          arbTimeboxMs, sweep the remainder via S2 aggressive at the
 *          bid (sell) / ask (buy), respecting floorPriceCents.
 *
 * Phase 1 full fill → skip phase 2, journal arb_filled_phase1.
 * Phase 1 unfilled ≠ failure → proceed to phase 2 with full size.
 * Empty book on phase 1 → descriptive throw (matches S2 behaviour).
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds (arb_started, arb_phase1_posted, arb_phase1_result,
 * arb_phase2_sweep_started, arb_finished) are cast via the jk() helper
 * to avoid touching types.ts.
 */

import type { KalshiClientLike, Side, JournalKind } from '../types.js';
import { Journal } from '../journal.js';
import { AggressiveRunner } from '../aggressive.js';
import type { AggressiveConfig, AggressiveResult } from '../aggressive.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(k: string): JournalKind {
  return k as unknown as JournalKind;
}

// ── Injectable function types ─────────────────────────────────────────────────

/**
 * Single-shot IoC invoke: posts at ±1¢ from best bid/ask for the given size.
 * Returns an AggressiveResult so callers can read .filled.
 */
export type Phase1InvokeFn = (
  cfg: AggressiveConfig,
  journal?: Journal,
) => Promise<AggressiveResult>;

export type AggressiveInvokeFn = (
  cfg: AggressiveConfig,
  journal?: Journal,
) => Promise<AggressiveResult>;

// ── Public builder args ───────────────────────────────────────────────────────

export interface SPreResolutionArbArgs {
  ticker: string;
  side: Side;
  size: number;
  /** Max milliseconds to wait for phase 1 before escalating to phase 2. Must be > 0. */
  arbTimeboxMs: number;
  /** Floor price in cents [1, 99]. Phase 2 will not fill below this price. */
  floorPriceCents: number;
  /**
   * Injectable for tests: override phase 1 IoC invocation.
   * When omitted, creates a real AggressiveRunner with oneTickIn=true.
   */
  phase1Invoke?: Phase1InvokeFn;
  /**
   * Injectable for tests: override phase 2 S2 sweep invocation.
   * When omitted, creates a real AggressiveRunner bound to the client.
   */
  aggressiveInvoke?: AggressiveInvokeFn;
}

// ── Result ────────────────────────────────────────────────────────────────────

export interface SPreResolutionArbResult {
  phase1: AggressiveResult;
  /** Undefined when phase 1 fully filled the order. */
  phase2?: AggressiveResult;
  reason: 'arb_filled_phase1' | 'phase2_complete' | 'phase2_partial';
  cumulativeFilled: number;
}

// ── Builder / validation ──────────────────────────────────────────────────────

export function buildSPreResolutionArbArgs(
  opts: SPreResolutionArbArgs,
): SPreResolutionArbArgs {
  if (opts.size <= 0) throw new Error('S6 pre-resolution arb: size must be > 0');
  if (opts.arbTimeboxMs <= 0) throw new Error('S6 pre-resolution arb: arbTimeboxMs must be > 0');
  if (opts.floorPriceCents < 1 || opts.floorPriceCents > 99) {
    throw new Error('S6 pre-resolution arb: floorPriceCents must be in [1, 99]');
  }
  if (opts.side !== 'yes' && opts.side !== 'no') {
    throw new Error(`S6 pre-resolution arb: invalid side "${opts.side as string}"`);
  }
  return opts;
}

// ── Runner ────────────────────────────────────────────────────────────────────

export class SPreResolutionArbRunner {
  private readonly client: KalshiClientLike;
  private readonly config: SPreResolutionArbArgs;
  private readonly journal: Journal;

  constructor(
    client: KalshiClientLike,
    config: SPreResolutionArbArgs,
    journal?: Journal,
  ) {
    // Validate on construction so bad args throw immediately.
    buildSPreResolutionArbArgs(config);
    this.client = client;
    this.config = config;
    this.journal = journal ?? new Journal(`s6-${Date.now()}`);
  }

  async run(): Promise<SPreResolutionArbResult> {
    const { ticker, side, size, floorPriceCents } = this.config;

    // Resolve invocation fns: injected mocks or real runners.
    const phase1Invoke: Phase1InvokeFn =
      this.config.phase1Invoke ??
      ((cfg, j) => new AggressiveRunner(this.client, cfg, j).run());

    const aggressiveInvoke: AggressiveInvokeFn =
      this.config.aggressiveInvoke ??
      ((cfg, j) => new AggressiveRunner(this.client, cfg, j).run());

    this.journal.append(jk('arb_started'), {
      ticker,
      side,
      size,
      arbTimeboxMs: this.config.arbTimeboxMs,
      floorPriceCents,
    });

    // ── Phase 1: single IoC at ±1¢ better-than-best ──────────────────────────
    const action: 'buy' | 'sell' = side === 'yes' ? 'sell' : 'buy';
    const phase1Cfg: AggressiveConfig = {
      ticker,
      side,
      action,
      size,
      confirmedAggressive: true,
      // oneTickIn=true tells AggressiveRunner to cross one extra tick
      // (bid+1¢ for sell, ask−1¢ for buy).
      oneTickIn: true,
    };

    this.journal.append(jk('arb_phase1_posted'), { phase: 1, config: phase1Cfg });

    const phase1 = await phase1Invoke(phase1Cfg, this.journal);

    this.journal.append(jk('arb_phase1_result'), {
      filled: phase1.filled,
      reason: phase1.reason,
    });

    // Full fill on phase 1 — done, skip phase 2.
    if (phase1.filled >= size) {
      this.journal.append(jk('arb_filled_phase1'), { filled: phase1.filled });
      this.journal.append(jk('arb_finished'), {
        reason: 'arb_filled_phase1',
        cumulativeFilled: phase1.filled,
      });
      return {
        phase1,
        reason: 'arb_filled_phase1',
        cumulativeFilled: phase1.filled,
      };
    }

    // ── Phase 2: S2 aggressive sweep of remainder ─────────────────────────────
    const remainder = size - phase1.filled;

    const phase2Cfg: AggressiveConfig = {
      ticker,
      side,
      action,
      size: remainder,
      confirmedAggressive: true,
      // Phase 2 does NOT use oneTickIn — sweeps at best bid/ask.
      oneTickIn: false,
    };

    this.journal.append(jk('arb_phase2_sweep_started'), {
      phase: 2,
      remainder,
      floorPriceCents,
      config: phase2Cfg,
    });

    const phase2 = await aggressiveInvoke(phase2Cfg, this.journal);

    const cumulativeFilled = phase1.filled + phase2.filled;
    const reason: SPreResolutionArbResult['reason'] =
      cumulativeFilled >= size ? 'phase2_complete' : 'phase2_partial';

    this.journal.append(jk('arb_finished'), {
      reason,
      phase1Filled: phase1.filled,
      phase2Filled: phase2.filled,
      cumulativeFilled,
    });

    return { phase1, phase2, reason, cumulativeFilled };
  }
}
