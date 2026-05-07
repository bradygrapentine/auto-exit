/**
 * sBasisArb.ts — S14 cross-resolution basis arbitrage.
 *
 * Buys YES + NO of the same ticker simultaneously when their combined ask price
 * is below $1 (100¢), locking a $1 terminal payoff per pair. Reuses the S5
 * MultiLegJobRunner for parallel execution.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts.
 * Journal kinds (basis_arb_started, basis_arb_closed_midflight, basis_arb_finished)
 * are cast via jk() to avoid touching types.ts.
 */

import type { KalshiClientLike, JournalKind, Orderbook } from '../types.js';
import { Journal } from '../journal.js';
import {
  MultiLegJobRunner,
  type MultiLegResult,
  type AggressiveInvokeFn,
  type PassiveInvokeFn,
  type FetchOrderbookFn,
} from '../multiLeg.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

// ── Injectable function types ──────────────────────────────────────────────────

/**
 * Injectable for tests: wraps MultiLegJobRunner execution.
 * Receives two-leg config arguments and returns a MultiLegResult.
 */
export type PairRunInvokeFn = (args: {
  ticker: string;
  pairsToBuy: number;
  journal: Journal;
  client: KalshiClientLike;
  aggressiveInvoke?: AggressiveInvokeFn;
  passiveInvoke?: PassiveInvokeFn;
  fetchOrderbook?: FetchOrderbookFn;
  now?: () => number;
  sleepMs?: (ms: number) => Promise<void>;
  pollIntervalMs?: number;
}) => Promise<MultiLegResult>;

export type FetchOrderbookInvokeFn = (ticker: string) => Promise<Orderbook | null>;

// ── Public interfaces ──────────────────────────────────────────────────────────

export interface SBasisArbArgs {
  ticker: string;
  totalDollarBudget: number;
  perPairSlippageCents?: number;   // default 0 (strict arb)
  journal: Journal;
  client: KalshiClientLike;
  /** Injectable for tests: override multi-leg execution. */
  pairRunInvoke?: PairRunInvokeFn;
  /** Injectable for tests: override orderbook fetching. */
  fetchOrderbookInvoke?: FetchOrderbookInvokeFn;
  /** Forwarded to the underlying MultiLegJobRunner. */
  aggressiveInvoke?: AggressiveInvokeFn;
  passiveInvoke?: PassiveInvokeFn;
  now?: () => number;
  sleepMs?: (ms: number) => Promise<void>;
  pollIntervalMs?: number;
}

export interface SBasisArbResult extends MultiLegResult {
  pairsToBuy: number;
  yesAskCents: number;
  noAskCents: number;
}

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Validate and return normalized SBasisArbArgs. Throws on invalid input.
 */
export function buildSBasisArbArgs(args: SBasisArbArgs): SBasisArbArgs {
  if (!args.ticker || args.ticker.trim() === '') {
    throw new Error('sBasisArb: ticker must be non-empty');
  }
  if (args.totalDollarBudget <= 0) {
    throw new Error(`sBasisArb: totalDollarBudget must be > 0, got ${args.totalDollarBudget}`);
  }
  if (args.perPairSlippageCents !== undefined) {
    if (args.perPairSlippageCents < 0 || args.perPairSlippageCents > 99) {
      throw new Error(
        `sBasisArb: perPairSlippageCents must be in [0, 99], got ${args.perPairSlippageCents}`,
      );
    }
  }
  return {
    ...args,
    perPairSlippageCents: args.perPairSlippageCents ?? 0,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Get the best ask in cents from an orderbook side.
 * Returns the lowest ask price with available size, or Infinity if none.
 */
function bestAsk(levels: Array<{ priceCents: number; size: number }>): number {
  const available = levels.filter((l) => l.size > 0);
  if (available.length === 0) return Infinity;
  return Math.min(...available.map((l) => l.priceCents));
}

/**
 * Default pairRunInvoke: creates a MultiLegJobRunner with YES + NO legs.
 */
const defaultPairRunInvoke: PairRunInvokeFn = async ({
  ticker,
  pairsToBuy,
  journal,
  client,
  aggressiveInvoke,
  passiveInvoke,
  fetchOrderbook,
  now,
  sleepMs,
  pollIntervalMs,
}) => {
  const runner = new MultiLegJobRunner({
    legs: [
      { ticker, side: 'yes', size: pairsToBuy, executionMode: 'aggressive' },
      { ticker, side: 'no', size: pairsToBuy, executionMode: 'aggressive' },
    ],
    journal,
    client,
    aggressiveInvoke,
    passiveInvoke,
    fetchOrderbook,
    now,
    sleepMs,
    pollIntervalMs,
  });
  return runner.run();
};

// ── Runner ─────────────────────────────────────────────────────────────────────

export class SBasisArbRunner {
  private readonly args: SBasisArbArgs & { perPairSlippageCents: number };
  private readonly journal: Journal;

  constructor(args: SBasisArbArgs) {
    const validated = buildSBasisArbArgs(args);
    this.args = validated as SBasisArbArgs & { perPairSlippageCents: number };
    this.journal = args.journal;
  }

  async run(): Promise<SBasisArbResult> {
    const {
      ticker,
      totalDollarBudget,
      perPairSlippageCents,
      journal,
      client,
      pairRunInvoke = defaultPairRunInvoke,
      fetchOrderbookInvoke,
      aggressiveInvoke,
      passiveInvoke,
      now,
      sleepMs,
      pollIntervalMs,
    } = this.args;

    // Resolve fetchOrderbook: injected mock or real client call.
    const fetchBook: FetchOrderbookInvokeFn =
      fetchOrderbookInvoke ??
      ((t: string) => client.getOrderbook(t, 5));

    // ── Pre-flight: check arb still open ──────────────────────────────────────

    const preflight = await fetchBook(ticker);
    if (preflight === null) {
      throw new Error(`sBasisArb: empty book on pre-flight for ${ticker}`);
    }

    const yesAskCents = bestAsk(preflight.yes);
    const noAskCents = bestAsk(preflight.no);

    if (!isFinite(yesAskCents) || !isFinite(noAskCents)) {
      throw new Error(
        `sBasisArb: empty book side on pre-flight for ${ticker} (yesAsk=${yesAskCents}, noAsk=${noAskCents})`,
      );
    }

    const threshold = 100 + perPairSlippageCents;
    if (yesAskCents + noAskCents >= threshold) {
      throw new Error(
        `arb closed: yesAsk + noAsk = ${yesAskCents + noAskCents}¢ ≥ ${threshold}¢`,
      );
    }

    // ── Compute pair count ─────────────────────────────────────────────────────

    const pairsToBuy = Math.floor((totalDollarBudget * 100) / (yesAskCents + noAskCents));

    if (pairsToBuy <= 0) {
      throw new Error(
        `sBasisArb: budget $${totalDollarBudget} insufficient to buy even 1 pair at ${yesAskCents + noAskCents}¢`,
      );
    }

    journal.append(jk('basis_arb_started'), {
      ticker,
      pairsToBuy,
      yesAskCents,
      noAskCents,
      totalCostCents: pairsToBuy * (yesAskCents + noAskCents),
      legYesSize: pairsToBuy,
      legNoSize: pairsToBuy,
      perPairSlippageCents,
    });

    // ── Mid-flight monitor: wrap fetchOrderbook to detect arb close ───────────

    let midflightHalted = false;

    const monitoredFetchOrderbook: FetchOrderbookFn = async (t: string) => {
      const book = await fetchBook(t);
      if (book === null) return null;

      // Re-check arb condition on every poll cycle.
      const currentYesAsk = bestAsk(book.yes);
      const currentNoAsk = bestAsk(book.no);
      if (
        isFinite(currentYesAsk) &&
        isFinite(currentNoAsk) &&
        currentYesAsk + currentNoAsk >= threshold &&
        !midflightHalted
      ) {
        midflightHalted = true;
        journal.append(jk('basis_arb_closed_midflight'), {
          ticker: t,
          yesAskCents: currentYesAsk,
          noAskCents: currentNoAsk,
          sum: currentYesAsk + currentNoAsk,
          threshold,
        });
        // Return null to trigger halt-all in the MultiLegJobRunner.
        return null;
      }

      return book;
    };

    // ── Execute both legs via MultiLegJobRunner ───────────────────────────────

    const result = await pairRunInvoke({
      ticker,
      pairsToBuy,
      journal,
      client,
      aggressiveInvoke,
      passiveInvoke,
      fetchOrderbook: monitoredFetchOrderbook,
      now,
      sleepMs,
      pollIntervalMs,
    });

    journal.append(jk('basis_arb_finished'), {
      ticker,
      pairsToBuy,
      halted: result.halted,
      haltReason: result.haltReason,
      durationMs: result.durationMs,
      legs: result.legs.map((l) => ({ side: l.leg.side, filled: l.filled })),
    });

    return {
      ...result,
      pairsToBuy,
      yesAskCents,
      noAskCents,
    };
  }
}
