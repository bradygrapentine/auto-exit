/**
 * runner.ts — SH-MICRO-EXECUTION-LOOP §3.2
 *
 * Single-trial runner. Orchestrates the lifecycle:
 *
 *   1. Compute daily-spent total from journal history.
 *   2. Pre-flight: `gateTrial` (caps + allowlist).
 *   3. Pre-flight: MANDATORY TTY confirmation — no skip flag, no auto-confirm.
 *   4. Open journal under trialId; append `micro_trial_started`.
 *   5. Dispatch to the strategy executor (DI; reuses existing s-* runners).
 *   6. Append `micro_trial_finished` with outcome.
 *   7. Return result.
 *
 * The `confirm` and `executeStrategy` functions are dependency-injected so
 * tests can run end-to-end without TTY or real Kalshi calls.
 *
 * The runner does NOT call `checkLiveness` itself — that's the strategy
 * runner's responsibility (already wired into AggressiveRunner via Sub-story
 * 2). The harness only enforces the validation-specific safety envelope.
 */

import { Journal } from '../journal.js';
import { getSafety } from '../safety.js';
import { gateTrial, type GateResult, type MicroTrialConfig, type MicroTrialResult } from './trial.js';
import type { JournalKind } from '../types.js';

// Cast helper for journal kinds added by the harness — same pattern as
// passive.ts / aggressive.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

export interface StrategyExecResult {
  /** Total contracts filled across the trial. */
  filled: number;
  /** Optional id for downstream attribution; falls back to journal's jobId. */
  fireId?: string;
  /** Optional terminal status the strategy reports. */
  status?: 'complete' | 'failed';
}

export interface TrialDeps {
  /**
   * Execute the strategy. The runner has already opened `journal` with the
   * trialId as jobId, so the strategy's existing `loop_started` / `order_*`
   * entries naturally land under the same jobId for SH-EDGE attribution.
   */
  executeStrategy: (config: MicroTrialConfig, journal: Journal) => Promise<StrategyExecResult>;
  /**
   * MANDATORY TTY confirmation. Returns true iff the operator typed an
   * affirmative response. The runner refuses to run if this resolves false.
   */
  confirm: (config: MicroTrialConfig) => Promise<boolean>;
  /**
   * Read past `micro_trial_started` entries for the current UTC day and
   * return the sum of their `maxNotionalDollars`. Pure function over
   * `journalEntries` so callers can supply a stub in tests.
   */
  dailySpentDollars: () => Promise<number>;
  /** Wall clock (testable). */
  now?: () => Date;
  /** Override safety read — defaults to getSafety(). */
  readSafety?: () => ReturnType<typeof getSafety>;
}

/**
 * Default TTY confirmation prompt. Refuses (returns false) when stdin isn't
 * a TTY — operator-approved hard rule, no opt-out flag.
 */
export async function defaultConfirm(config: MicroTrialConfig): Promise<boolean> {
  if (!process.stdin.isTTY) {
    process.stderr.write('\n[micro-harness] stdin is not a TTY — live trials require an interactive terminal. Refusing.\n');
    return false;
  }
  const readline = await import('node:readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write(
      `\n[micro-harness] About to run a live trial:\n` +
      `  ticker:        ${config.ticker}\n` +
      `  side:          ${config.side}\n` +
      `  strategy:      ${config.strategy}\n` +
      `  max notional:  $${config.maxNotionalDollars.toFixed(2)}\n` +
      `  intent:        ${config.intent}\n` +
      `  trial id:      ${config.trialId}\n`,
    );
    const answer = await rl.question(`Type the ticker (${config.ticker}) to confirm, or anything else to abort: `);
    return answer.trim() === config.ticker;
  } finally {
    rl.close();
  }
}

/**
 * Runs one micro-trial.
 *
 * The function is intentionally linear: each gate produces a `MicroTrialResult`
 * with status='rejected' and a reason. Only after all gates pass does the
 * strategy actually execute.
 */
export async function runTrial(
  config: MicroTrialConfig,
  deps: TrialDeps,
): Promise<MicroTrialResult> {
  const now = deps.now ?? (() => new Date());
  const startedAt = now().toISOString();

  const base: MicroTrialResult = {
    trialId: config.trialId,
    ticker: config.ticker,
    strategy: config.strategy,
    startedAt,
    status: 'pending',
  };

  // 1. Safety gate.
  const safety = (deps.readSafety ?? getSafety)();
  const dailySpent = await deps.dailySpentDollars();
  const gate: GateResult = gateTrial(config, safety.microHarness, dailySpent);
  if (!gate.ok) {
    return {
      ...base,
      status: 'rejected',
      rejectReason: `${gate.reason}: ${gate.detail}`,
      finishedAt: now().toISOString(),
    };
  }

  // 2. TTY confirmation (mandatory — no skip flag).
  const confirmed = await deps.confirm(config);
  if (!confirmed) {
    return {
      ...base,
      status: 'rejected',
      rejectReason: 'operator_declined: TTY confirmation was not affirmative',
      finishedAt: now().toISOString(),
    };
  }

  // 3. Open journal under trialId-as-jobId so SH-EDGE attributes the fire.
  const journal = new Journal(config.trialId);
  journal.append(jk('micro_trial_started'), {
    trialId: config.trialId,
    ticker: config.ticker,
    side: config.side,
    strategy: config.strategy,
    maxNotionalDollars: config.maxNotionalDollars,
    intent: config.intent,
    params: config.params,
    startedAt,
  });

  // 4. Execute via the injected strategy runner. Errors propagate as 'failed'.
  let exec: StrategyExecResult;
  try {
    exec = await deps.executeStrategy(config, journal);
  } catch (err) {
    const finishedAt = now().toISOString();
    journal.append(jk('micro_trial_finished'), {
      trialId: config.trialId,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
      finishedAt,
    });
    return {
      ...base,
      status: 'failed',
      rejectReason: err instanceof Error ? err.message : String(err),
      finishedAt,
    };
  }

  const finishedAt = now().toISOString();
  const fireId = exec.fireId ?? `fire-${config.trialId}`;
  journal.append(jk('micro_trial_finished'), {
    trialId: config.trialId,
    fireId,
    filled: exec.filled,
    status: exec.status ?? 'complete',
    finishedAt,
  });

  return {
    ...base,
    status: exec.status ?? 'complete',
    fireId,
    finishedAt,
  };
}

/**
 * Sum `maxNotionalDollars` from `micro_trial_started` entries whose
 * `startedAt` falls within the current UTC day. Pure over its input.
 */
export function sumDailySpent(
  entries: ReadonlyArray<{ kind: string; data: Record<string, unknown> }>,
  now: Date = new Date(),
): number {
  const todayUtc = now.toISOString().slice(0, 10);
  let sum = 0;
  for (const e of entries) {
    if (e.kind !== 'micro_trial_started') continue;
    const startedAt = e.data['startedAt'];
    if (typeof startedAt !== 'string' || startedAt.slice(0, 10) !== todayUtc) continue;
    const cap = e.data['maxNotionalDollars'];
    if (typeof cap === 'number' && Number.isFinite(cap)) sum += cap;
  }
  return sum;
}
