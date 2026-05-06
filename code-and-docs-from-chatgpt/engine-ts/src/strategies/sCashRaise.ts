/**
 * sCashRaise.ts — S10 cash-raise sequencer.
 *
 * Executes a pre-ranked list of sell positions sequentially until a target
 * cash amount is raised or a deadline is hit. Supports both aggressive and
 * passive dispatch per position.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds (cashraise_started, cashraise_position_started,
 * cashraise_position_completed, cashraise_target_met, cashraise_deadline_hit,
 * cashraise_finished, cashraise_position_failed) are cast via jk() to avoid
 * touching types.ts.
 */

import type { JournalKind } from '../types.js';
import { Journal } from '../journal.js';
import type { AggressiveConfig, AggressiveResult } from '../aggressive.js';
import type { PassiveConfig, PassiveResult } from '../passive.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(k: string): JournalKind {
  return k as unknown as JournalKind;
}

// ── Injectable function types (re-exported from sRoll for consistency) ────────

export type AggressiveInvokeFn = (
  cfg: AggressiveConfig,
  journal?: Journal,
) => Promise<AggressiveResult>;

export type PassiveInvokeFn = (
  cfg: PassiveConfig,
  journal?: Journal,
) => Promise<PassiveResult>;

// ── Position entry ────────────────────────────────────────────────────────────

export interface CashRaisePosition {
  ticker: string;
  side: 'sell';
  size: number;
  strategyName: 'aggressive' | 'passive';
}

// ── Per-position result ───────────────────────────────────────────────────────

export interface CashRaisePositionResult {
  ticker: string;
  filledShares: number;
  bidCentsAtFill: number;
  raisedDollars: number;
  /** Present only when the position invocation threw. */
  error?: string;
}

// ── Top-level result ──────────────────────────────────────────────────────────

export interface SCashRaiseResult {
  positions: CashRaisePositionResult[];
  totalRaisedDollars: number;
  reason: 'target_met' | 'deadline_hit' | 'finished';
}

// ── Args builder ──────────────────────────────────────────────────────────────

export interface SCashRaiseArgs {
  positions: CashRaisePosition[];
  targetCashDollars: number;
  deadlineEpochMs: number;
  aggressiveInvoke: AggressiveInvokeFn;
  passiveInvoke: PassiveInvokeFn;
  /** Injectable clock; defaults to Date.now. */
  now?: () => number;
  /** Injectable bid-price lookup; returns current best bid in cents. */
  getCurrentBidCents: (ticker: string) => Promise<number>;
}

/**
 * Validate and return a normalized SCashRaiseArgs. Throws on invalid input.
 */
export function buildSCashRaiseArgs(args: SCashRaiseArgs): SCashRaiseArgs {
  const nowFn = args.now ?? (() => Date.now());

  if (!args.positions || args.positions.length === 0) {
    throw new Error('positions must be non-empty');
  }
  for (const p of args.positions) {
    if (p.side !== 'sell') {
      throw new Error(`position side must be 'sell', got '${p.side}' for ${p.ticker}`);
    }
    if (p.size <= 0) {
      throw new Error(`position size must be > 0, got ${p.size} for ${p.ticker}`);
    }
    if (p.strategyName !== 'aggressive' && p.strategyName !== 'passive') {
      throw new Error(
        `strategyName must be 'aggressive' or 'passive', got '${p.strategyName}' for ${p.ticker}`,
      );
    }
  }
  if (args.targetCashDollars <= 0) {
    throw new Error(`targetCashDollars must be > 0, got ${args.targetCashDollars}`);
  }
  if (args.deadlineEpochMs <= nowFn()) {
    throw new Error('deadlineEpochMs must be in the future');
  }

  return { ...args, now: nowFn };
}

// ── Runner ────────────────────────────────────────────────────────────────────

export class SCashRaiseRunner {
  private readonly args: Required<SCashRaiseArgs>;
  private readonly journal: Journal;

  constructor(args: SCashRaiseArgs, journal?: Journal) {
    // Re-validate; buildSCashRaiseArgs may have already been called but
    // we accept raw args too.
    const validated = buildSCashRaiseArgs(args);
    this.args = validated as Required<SCashRaiseArgs>;
    this.journal = journal ?? new Journal(`s10-${Date.now()}`);
  }

  async run(): Promise<SCashRaiseResult> {
    const { positions, targetCashDollars, deadlineEpochMs, aggressiveInvoke, passiveInvoke, now, getCurrentBidCents } = this.args;
    const nowFn = now;

    this.journal.append(jk('cashraise_started'), {
      positionCount: positions.length,
      targetCashDollars,
      deadlineEpochMs,
    });

    const positionResults: CashRaisePositionResult[] = [];
    let totalRaisedDollars = 0;

    for (const pos of positions) {
      // Deadline check before each position
      if (nowFn() >= deadlineEpochMs) {
        this.journal.append(jk('cashraise_deadline_hit'), {
          raisedDollars: totalRaisedDollars,
          targetCashDollars,
          ticker: pos.ticker,
        });
        return { positions: positionResults, totalRaisedDollars, reason: 'deadline_hit' };
      }

      this.journal.append(jk('cashraise_position_started'), {
        ticker: pos.ticker,
        size: pos.size,
        strategyName: pos.strategyName,
        raisedSoFar: totalRaisedDollars,
      });

      let filledShares = 0;
      let bidCentsAtFill = 0;
      let posError: string | undefined;

      try {
        // Dispatch to strategy
        if (pos.strategyName === 'aggressive') {
          const cfg: AggressiveConfig = {
            ticker: pos.ticker,
            side: 'yes',
            action: 'sell',
            size: pos.size,
            confirmedAggressive: true,
          };
          const result = await aggressiveInvoke(cfg, this.journal);
          filledShares = result.filled;
        } else {
          const cfg: PassiveConfig = {
            ticker: pos.ticker,
            side: 'sell',
            size: pos.size,
          };
          const result = await passiveInvoke(cfg, this.journal);
          filledShares = result.filled;
        }

        // Fetch bid price after fill for cash calculation
        bidCentsAtFill = await getCurrentBidCents(pos.ticker);
      } catch (err) {
        posError = err instanceof Error ? err.message : String(err);
        this.journal.append(jk('cashraise_position_failed'), {
          ticker: pos.ticker,
          error: posError,
        });
      }

      const raisedThisPos = filledShares * bidCentsAtFill / 100;
      totalRaisedDollars += raisedThisPos;

      const posResult: CashRaisePositionResult = {
        ticker: pos.ticker,
        filledShares,
        bidCentsAtFill,
        raisedDollars: raisedThisPos,
        ...(posError !== undefined ? { error: posError } : {}),
      };
      positionResults.push(posResult);

      if (posError === undefined) {
        this.journal.append(jk('cashraise_position_completed'), {
          ticker: pos.ticker,
          filledShares,
          bidCentsAtFill,
          raisedThisPos,
          totalRaisedDollars,
        });
      }

      // Target check after each position
      if (totalRaisedDollars >= targetCashDollars) {
        this.journal.append(jk('cashraise_target_met'), {
          totalRaisedDollars,
          targetCashDollars,
        });
        return { positions: positionResults, totalRaisedDollars, reason: 'target_met' };
      }

      // Deadline check after each position (in case fill took time)
      if (nowFn() >= deadlineEpochMs) {
        this.journal.append(jk('cashraise_deadline_hit'), {
          raisedDollars: totalRaisedDollars,
          targetCashDollars,
        });
        return { positions: positionResults, totalRaisedDollars, reason: 'deadline_hit' };
      }
    }

    this.journal.append(jk('cashraise_finished'), {
      totalRaisedDollars,
      targetCashDollars,
      positionsRun: positionResults.length,
    });

    return { positions: positionResults, totalRaisedDollars, reason: 'finished' };
  }
}
