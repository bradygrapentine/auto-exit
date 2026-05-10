/**
 * trial.ts — SH-MICRO-EXECUTION-LOOP §3.1
 *
 * Pure config + types + safety-gating logic for the validation harness.
 * No runner, no I/O beyond the existing `safety.json` reader.
 *
 * Operator-approved caps (2026-05-09):
 *   - Per-trial cap range: $0.10–$1.00 (default $1.00 in safety.json).
 *   - Daily aggregate cap: $2.50.
 *   - Mandatory TTY confirmation per trial — no skip flag, no auto-confirm.
 *
 * The `gateTrial` function is the safety primitive: it does not place orders,
 * it only returns ok / reject. The runner (Task 3.2) calls it pre-flight.
 */

import type { MicroHarnessSafety } from '../types.js';

// ── Public types ──────────────────────────────────────────────────────────────

export type MicroStrategy = 's-passive' | 's-aggressive' | 's-trail' | 's-twap' | 's-auto';

export interface MicroTrialConfig {
  trialId: string;
  ticker: string;
  side: 'yes' | 'no';
  strategy: MicroStrategy;
  /** Cap on the trial's notional ($); enforced pre-trade. */
  maxNotionalDollars: number;
  /** Strategy-specific params forwarded to the runner (e.g. trailCents for s-trail). */
  params: Record<string, unknown>;
  /** Operator's intent message — included in journal for SH-EDGE attribution. */
  intent: string;
}

export interface MicroTrialResult {
  trialId: string;
  ticker: string;
  strategy: string;
  startedAt: string;
  finishedAt?: string;
  status: 'pending' | 'running' | 'complete' | 'rejected' | 'failed';
  rejectReason?: string;
  /** Embedded Fire id (post-execution) for downstream SH-EDGE attribution. */
  fireId?: string;
}

export type GateRejectReason =
  | 'no_micro_safety_config'
  | 'per_trial_cap_exceeded'
  | 'daily_aggregate_cap_exceeded'
  | 'ticker_not_allowlisted'
  | 'invalid_notional';

export type GateResult =
  | { ok: true }
  | { ok: false; reason: GateRejectReason; detail: string };

// ── Pure helpers ──────────────────────────────────────────────────────────────

/**
 * Glob match — supports `*` (any chars) and exact strings. Conservative on
 * purpose: ticker symbols don't contain shell metacharacters, so we don't
 * need a full fnmatch implementation.
 */
export function tickerMatches(ticker: string, pattern: string): boolean {
  if (pattern === ticker) return true;
  if (!pattern.includes('*')) return false;
  // Escape regex metacharacters except `*`, then replace `*` with `.*`.
  const re = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return re.test(ticker);
}

export function isTickerAllowlisted(ticker: string, allowlist: string[]): boolean {
  return allowlist.some((p) => tickerMatches(ticker, p));
}

// ── The gate ──────────────────────────────────────────────────────────────────

/**
 * Pre-trade gate. Pure: takes the trial config, the safety subsection, and
 * the day's already-spent notional ($) — returns ok or a structured rejection.
 *
 * `dailySpentDollars` is the sum of `maxNotionalDollars` from all trials in
 * the current UTC day (running + completed; rejected trials don't count).
 * The runner is responsible for computing it from journal entries.
 */
export function gateTrial(
  config: MicroTrialConfig,
  safety: MicroHarnessSafety | undefined,
  dailySpentDollars: number,
): GateResult {
  if (!safety) {
    return {
      ok: false,
      reason: 'no_micro_safety_config',
      detail: 'safety.json is missing the `microHarness` section; live trials are disabled. Run `kea safety set --micro-per-trial-cap 1.00 --micro-daily-cap 2.50 --micro-allowlist KX*` first.',
    };
  }

  if (!Number.isFinite(config.maxNotionalDollars) || config.maxNotionalDollars <= 0) {
    return {
      ok: false,
      reason: 'invalid_notional',
      detail: `maxNotionalDollars must be > 0; got ${config.maxNotionalDollars}`,
    };
  }

  if (config.maxNotionalDollars > safety.perTrialCapDollars) {
    return {
      ok: false,
      reason: 'per_trial_cap_exceeded',
      detail: `requested $${config.maxNotionalDollars.toFixed(2)} exceeds per-trial cap $${safety.perTrialCapDollars.toFixed(2)}`,
    };
  }

  if (dailySpentDollars + config.maxNotionalDollars > safety.dailyAggregateCapDollars) {
    return {
      ok: false,
      reason: 'daily_aggregate_cap_exceeded',
      detail: `this trial ($${config.maxNotionalDollars.toFixed(2)}) plus today's spent ($${dailySpentDollars.toFixed(2)}) exceeds daily cap $${safety.dailyAggregateCapDollars.toFixed(2)}`,
    };
  }

  if (!isTickerAllowlisted(config.ticker, safety.tickerAllowlist)) {
    return {
      ok: false,
      reason: 'ticker_not_allowlisted',
      detail: `ticker ${config.ticker} not in allowlist [${safety.tickerAllowlist.join(', ')}]`,
    };
  }

  return { ok: true };
}

/**
 * Compose a fresh trial id. Includes a timestamp prefix so it sorts
 * chronologically, plus a 6-char random suffix to avoid collisions inside
 * the same millisecond.
 */
export function newTrialId(now: () => Date = () => new Date()): string {
  const iso = now().toISOString().replace(/[:.]/g, '-');
  const rnd = Math.random().toString(36).slice(2, 8);
  return `micro-${iso}-${rnd}`;
}
