/**
 * sweep.ts — SH-MICRO-EXECUTION-LOOP §3.3
 *
 * Run N trials sequentially per (strategy × ticker × params) cell. Each
 * trial respects every safety gate. The sweep aborts cleanly the first
 * time a trial is rejected by the safety gate (caps, allowlist, missing
 * config) — that's the operator's signal to stop and reconsider, not to
 * retry the next cell.
 *
 * Sweep does NOT bypass the per-trial TTY confirmation. Each trial in the
 * sweep prompts independently. This is operator-approved: the loop steps
 * through one trial at a time with operator-in-the-loop.
 */

import { runTrial, type TrialDeps } from './runner.js';
import {
  newTrialId,
  type MicroStrategy,
  type MicroTrialConfig,
  type MicroTrialResult,
} from './trial.js';

export interface SweepCell {
  strategy: MicroStrategy;
  ticker: string;
  side: 'yes' | 'no';
  /** Strategy-specific params (forwarded to the runner). */
  params: Record<string, unknown>;
  /** Trials to run in this cell, e.g. 5. */
  trialsPerCell: number;
}

export interface SweepPlan {
  cells: SweepCell[];
  /** Pause between trials (ms). Default 30_000. */
  perTrialDelayMs?: number;
  /** Per-trial cap; must be ≤ safety.json:microHarness.perTrialCapDollars. */
  maxNotionalDollars: number;
  /** Operator's intent message, included on every trial for SH-EDGE attribution. */
  intent: string;
}

export interface SweepDeps extends TrialDeps {
  /** Sleep override for tests (skips real waits). */
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_DELAY_MS = 30_000;

function sleepDefault(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs the sweep. Returns the per-trial results in the order they ran.
 *
 * Termination: the sweep aborts (returns early) the first time a trial
 * is rejected by the safety gate — i.e. `rejectReason` matches one of the
 * gate-level prefixes. Operator-declined / strategy-failed trials do NOT
 * abort the sweep; the operator can decline a single trial without
 * blowing up the rest.
 */
export async function runSweep(
  plan: SweepPlan,
  deps: SweepDeps,
): Promise<MicroTrialResult[]> {
  const sleep = deps.sleep ?? sleepDefault;
  const delay = plan.perTrialDelayMs ?? DEFAULT_DELAY_MS;
  const results: MicroTrialResult[] = [];
  let firstTrial = true;

  for (const cell of plan.cells) {
    for (let i = 0; i < cell.trialsPerCell; i++) {
      if (!firstTrial) {
        await sleep(delay);
      }
      firstTrial = false;

      const config: MicroTrialConfig = {
        trialId: newTrialId(deps.now),
        ticker: cell.ticker,
        side: cell.side,
        strategy: cell.strategy,
        maxNotionalDollars: plan.maxNotionalDollars,
        params: cell.params,
        intent: plan.intent,
      };

      const result = await runTrial(config, deps);
      results.push(result);

      if (result.status === 'rejected' && isGateRejection(result.rejectReason)) {
        // Hard abort: caps or allowlist failed. Operator must investigate.
        return results;
      }
    }
  }

  return results;
}

/**
 * Returns true iff the rejection came from `gateTrial` (caps/allowlist),
 * vs an operator decline or strategy failure. Used to decide whether to
 * abort the sweep.
 */
function isGateRejection(reason: string | undefined): boolean {
  if (!reason) return false;
  return (
    reason.startsWith('per_trial_cap_exceeded') ||
    reason.startsWith('daily_aggregate_cap_exceeded') ||
    reason.startsWith('ticker_not_allowlisted') ||
    reason.startsWith('no_micro_safety_config') ||
    reason.startsWith('invalid_notional')
  );
}

/**
 * Per-cell summary suitable for printing after a sweep. The actual edge
 * breakdown comes from SH-EDGE's `generateSnapshot`; this is a thin
 * preview the operator sees while waiting on attribution data.
 */
export interface CellSummary {
  strategy: string;
  ticker: string;
  trialsRun: number;
  completed: number;
  rejected: number;
  failed: number;
}

export function summarizeByCell(results: MicroTrialResult[]): CellSummary[] {
  const byKey = new Map<string, CellSummary>();
  for (const r of results) {
    const key = `${r.strategy}|${r.ticker}`;
    let row = byKey.get(key);
    if (!row) {
      row = { strategy: r.strategy, ticker: r.ticker, trialsRun: 0, completed: 0, rejected: 0, failed: 0 };
      byKey.set(key, row);
    }
    row.trialsRun++;
    if (r.status === 'complete') row.completed++;
    else if (r.status === 'rejected') row.rejected++;
    else if (r.status === 'failed') row.failed++;
  }
  return [...byKey.values()];
}
