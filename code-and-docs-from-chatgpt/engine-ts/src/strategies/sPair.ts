/**
 * sPair.ts — S5 pair preset: thin builder + runner wrapping multiLeg.
 *
 * Validates a 2-leg (or N-leg) spread configuration, then delegates to
 * MultiLegJobRunner for parallel execution with skew throttle.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds (pair_started, pair_finished) are cast via jk() to avoid touching types.ts.
 */

import type { KalshiClientLike, JournalKind } from '../types.js';
import { Journal } from '../journal.js';
import {
  MultiLegJobRunner,
  type MultiLegJobConfig,
  type MultiLegResult,
  type LegConfig,
  type AggressiveInvokeFn,
  type PassiveInvokeFn,
  type FetchOrderbookFn,
} from '../multiLeg.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

// ── Public interfaces ──────────────────────────────────────────────────────────

export interface SPairArgs {
  legs: LegConfig[];
  legSkewPct?: number;
  journal: Journal;
  client: KalshiClientLike;
  aggressiveInvoke?: AggressiveInvokeFn;
  passiveInvoke?: PassiveInvokeFn;
  fetchOrderbook?: FetchOrderbookFn;
  now?: () => number;
  sleepMs?: (ms: number) => Promise<void>;
  pollIntervalMs?: number;
}

export interface SPairResult extends MultiLegResult {}

// ── Validation + builder ───────────────────────────────────────────────────────

/**
 * Validate and return normalized SPairArgs. Throws on invalid input.
 */
export function buildSPairArgs(args: SPairArgs): SPairArgs {
  if (args.legs.length < 2) {
    throw new Error('sPair: requires at least 2 legs');
  }

  for (const leg of args.legs) {
    if (leg.size <= 0) {
      throw new Error(`sPair: leg size must be > 0 (ticker=${leg.ticker})`);
    }
  }

  if (args.legSkewPct !== undefined) {
    if (args.legSkewPct < 0 || args.legSkewPct > 1) {
      throw new Error(`sPair: legSkewPct must be in [0, 1], got ${args.legSkewPct}`);
    }
  }

  // Check for duplicate (ticker, side) pairs
  const seen = new Set<string>();
  for (const leg of args.legs) {
    const key = `${leg.ticker}:${leg.side}`;
    if (seen.has(key)) {
      throw new Error(`sPair: duplicate (ticker, side) pair: ${leg.ticker} / ${leg.side}`);
    }
    seen.add(key);
  }

  return {
    ...args,
    legSkewPct: args.legSkewPct ?? 0.10,
  };
}

// ── Runner ─────────────────────────────────────────────────────────────────────

export class SPairRunner {
  private readonly args: SPairArgs;
  private readonly journal: Journal;

  constructor(args: SPairArgs) {
    this.args = buildSPairArgs(args);
    this.journal = args.journal;
  }

  async run(): Promise<SPairResult> {
    const { legs, legSkewPct, journal, client, aggressiveInvoke, passiveInvoke, fetchOrderbook, now, sleepMs, pollIntervalMs } = this.args;

    journal.append(jk('pair_started'), {
      legCount: legs.length,
      legSkewPct: legSkewPct ?? 0.10,
      tickers: legs.map((l) => l.ticker),
    });

    const config: MultiLegJobConfig = {
      legs,
      legSkewPct,
      journal,
      client,
      aggressiveInvoke,
      passiveInvoke,
      fetchOrderbook,
      now,
      sleepMs,
      pollIntervalMs,
    };

    const runner = new MultiLegJobRunner(config);
    const result = await runner.run();

    journal.append(jk('pair_finished'), {
      halted: result.halted,
      haltReason: result.haltReason,
      durationMs: result.durationMs,
      legs: result.legs.map((l) => ({ ticker: l.leg.ticker, filled: l.filled })),
    });

    return result;
  }
}
