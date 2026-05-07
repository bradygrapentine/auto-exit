/**
 * portfolio.ts — W4.3 portfolio liquidation sequencer.
 *
 * Pure computation: reads position snapshots + market data, ranks by
 * overvalued-to-hold (markToBid − EV(hold)), emits a sequenced exit plan.
 * Optional auto-execute hands off to SCashRaiseRunner (already shipped).
 *
 * No I/O, no side effects in buildPortfolioPlan. All math operates on inputs.
 * File-touch boundary: this file only.
 */

import type {
  SCashRaiseArgs,
  AggressiveInvokeFn,
  PassiveInvokeFn,
  CashRaisePosition,
} from './strategies/sCashRaise.js';
import { SCashRaiseRunner } from './strategies/sCashRaise.js';
import type { Journal } from './journal.js';

// ── Input types ───────────────────────────────────────────────────────────────

/**
 * Minimal position snapshot fed to the planner.
 * Compatible with the PositionRow shape from tui/api.ts — callers may pass
 * those directly or supply a leaner object.
 */
export interface PositionSnapshot {
  ticker: string;
  /** 'yes' | 'no' (lowercase). Callers receiving PositionRow 'YES'/'NO' should
   *  normalise before calling buildPortfolioPlan. */
  side: 'yes' | 'no';
  /** Number of contracts held (> 0). */
  size: number;
}

export interface PortfolioPlanInput {
  /** Non-empty array of positions to sequence. */
  positions: PositionSnapshot[];
  /**
   * Agent-supplied mid probability for each ticker (0–1 inclusive).
   * Represents the agent's belief of the YES leg resolving to $1.
   */
  midProbabilities: Record<string, number>;
  /**
   * Current top-of-book bid in cents [1, 99] for each ticker.
   * Used to compute mark-to-bid value.
   */
  bidByTicker: Record<string, number>;
  /** Optional per-ticker fee estimate in dollars (reduces net proceeds). */
  feesByTicker?: Record<string, number>;
  /**
   * Default strategy when auto-pick is indeterminate or overridden.
   * If set, ALL positions use this strategy regardless of the auto-pick rule.
   * Default: undefined (auto-pick per position).
   */
  defaultStrategy?: 'aggressive' | 'passive';
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface PortfolioPlanEntry {
  /** 1-indexed rank (1 = exit first). */
  rank: number;
  ticker: string;
  side: 'yes' | 'no';
  size: number;
  /** size × bid / 100 */
  markToBidDollars: number;
  /** size × midProb × $1 terminal payoff */
  evHoldDollars: number;
  /** markToBid − evHold; positive = current mark exceeds EV, exit first */
  overvaluedDollars: number;
  /** Engine-side strategy recommendation (auto-pick or defaultStrategy override). */
  recommendedStrategy: 'aggressive' | 'passive';
}

export interface PortfolioPlan {
  ranked: PortfolioPlanEntry[];
  /** Sum of markToBidDollars across all positions. */
  totalRaiseableDollars: number;
}

// ── Auto-execute types ────────────────────────────────────────────────────────

export interface ExecutePortfolioPlanRunners {
  aggressiveInvoke: AggressiveInvokeFn;
  passiveInvoke: PassiveInvokeFn;
  getCurrentBidCents: (ticker: string) => Promise<number>;
}

export interface ExecutePortfolioPlanOpts {
  targetCashDollars: number;
  deadlineEpochMs: number;
  now?: () => number;
  journal?: Journal;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(input: PortfolioPlanInput): void {
  if (!input.positions || input.positions.length === 0) {
    throw new Error('positions must be non-empty');
  }

  for (const pos of input.positions) {
    const { ticker } = pos;

    // midProbability presence + range
    if (!(ticker in input.midProbabilities)) {
      throw new Error(`missing midProbability for ticker '${ticker}'`);
    }
    const prob = input.midProbabilities[ticker];
    if (prob < 0 || prob > 1) {
      throw new Error(`midProbability for '${ticker}' must be in [0, 1], got ${prob}`);
    }

    // bidByTicker presence + range
    if (!(ticker in input.bidByTicker)) {
      throw new Error(`missing bidByTicker for ticker '${ticker}'`);
    }
    const bid = input.bidByTicker[ticker];
    if (bid < 1 || bid > 99) {
      throw new Error(`bidByTicker for '${ticker}' must be in [1, 99] cents, got ${bid}`);
    }
  }
}

// ── Strategy auto-pick rule ───────────────────────────────────────────────────

/**
 * Auto-pick strategy for a position entry.
 *
 * Rule: if overvaluedDollars > 0.5 × markToBidDollars → 'aggressive' (≥50%
 * gap from EV, urgency high); else 'passive'.
 */
function autoPickStrategy(
  overvaluedDollars: number,
  markToBidDollars: number,
): 'aggressive' | 'passive' {
  return overvaluedDollars > 0.5 * markToBidDollars ? 'aggressive' : 'passive';
}

// ── Core planner ──────────────────────────────────────────────────────────────

/**
 * Build a ranked portfolio exit plan from position snapshots + market data.
 *
 * The plan is pure data — no orders are placed. Pass to executePortfolioPlan
 * to run via SCashRaiseRunner.
 *
 * @throws if validation fails (see validate() above).
 */
export function buildPortfolioPlan(input: PortfolioPlanInput): PortfolioPlan {
  validate(input);

  // Compute per-position metrics preserving input order (for stable sort).
  const entries: Array<{
    inputIndex: number;
    ticker: string;
    side: 'yes' | 'no';
    size: number;
    markToBidDollars: number;
    evHoldDollars: number;
    overvaluedDollars: number;
    recommendedStrategy: 'aggressive' | 'passive';
  }> = input.positions.map((pos, idx) => {
    const bid = input.bidByTicker[pos.ticker];
    const midProb = input.midProbabilities[pos.ticker];

    // mark-to-bid: contracts × bid_cents / 100
    const markToBidDollars = pos.size * bid / 100;

    // EV(hold): contracts × p × $1 terminal payoff
    const evHoldDollars = pos.size * midProb;

    const overvaluedDollars = markToBidDollars - evHoldDollars;

    const recommendedStrategy: 'aggressive' | 'passive' =
      input.defaultStrategy !== undefined
        ? input.defaultStrategy
        : autoPickStrategy(overvaluedDollars, markToBidDollars);

    return {
      inputIndex: idx,
      ticker: pos.ticker,
      side: pos.side,
      size: pos.size,
      markToBidDollars,
      evHoldDollars,
      overvaluedDollars,
      recommendedStrategy,
    };
  });

  // Stable sort descending by overvaluedDollars.
  // Tie-breaker: preserve input order (stable via inputIndex).
  entries.sort((a, b) => {
    const diff = b.overvaluedDollars - a.overvaluedDollars;
    if (diff !== 0) return diff;
    return a.inputIndex - b.inputIndex; // stable tie-breaker
  });

  const ranked: PortfolioPlanEntry[] = entries.map((e, i) => ({
    rank: i + 1,
    ticker: e.ticker,
    side: e.side,
    size: e.size,
    markToBidDollars: e.markToBidDollars,
    evHoldDollars: e.evHoldDollars,
    overvaluedDollars: e.overvaluedDollars,
    recommendedStrategy: e.recommendedStrategy,
  }));

  const totalRaiseableDollars = ranked.reduce(
    (sum, e) => sum + e.markToBidDollars,
    0,
  );

  return { ranked, totalRaiseableDollars };
}

// ── Auto-execute path ─────────────────────────────────────────────────────────

/**
 * Execute a PortfolioPlan by wrapping it into an SCashRaiseArgs and running
 * via SCashRaiseRunner.
 *
 * The `targetCashDollars` and `deadlineEpochMs` are caller-supplied — the plan
 * itself is agnostic to these execution parameters.
 */
export function executePortfolioPlan(
  plan: PortfolioPlan,
  runners: ExecutePortfolioPlanRunners,
  opts: ExecutePortfolioPlanOpts,
): SCashRaiseRunner {
  const positions: CashRaisePosition[] = plan.ranked.map((entry) => ({
    ticker: entry.ticker,
    side: 'sell' as const,
    size: entry.size,
    strategyName: entry.recommendedStrategy,
  }));

  const args: SCashRaiseArgs = {
    positions,
    targetCashDollars: opts.targetCashDollars,
    deadlineEpochMs: opts.deadlineEpochMs,
    aggressiveInvoke: runners.aggressiveInvoke,
    passiveInvoke: runners.passiveInvoke,
    getCurrentBidCents: runners.getCurrentBidCents,
    ...(opts.now !== undefined ? { now: opts.now } : {}),
  };

  return new SCashRaiseRunner(args, opts.journal);
}
