/**
 * s7ScaleOut.ts — S7 Scale-out ladder: rung-driven partial exits via S1 passive.
 *
 * Polls the orderbook on a configurable interval. Each rung fires an independent
 * S1 (passive) sell pass for its slice of totalSize when the top bid crosses the
 * rung's priceCents threshold. Rungs are checked in-order; each fires at most once.
 *
 * File-touch boundary: this file only. Does NOT edit passive.ts or types.ts.
 * Journal kinds (s7_rung_fired, s7_run_complete) are cast via the jk() helper
 * to avoid touching types.ts, following the same pattern as passive.ts.
 */

import { Journal, generateJobId } from '../journal.js';
import { run as passiveRun } from '../passive.js';
import type { PassiveConfig } from '../passive.js';
import type {
  JournalKind,
  KalshiClientLike,
} from '../types.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_MAX_ITERATIONS = 1_000;

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface S7Rung {
  /** The bid price (in cents) at which this rung fires. */
  priceCents: number;
  /** Percentage of totalSize to sell at this rung (0–100). */
  sizePct: number;
}

/**
 * Optional override for how S1 is invoked. Defaults to the real passive `run`.
 * Provide a mock in tests to avoid spinning up the actual passive strategy.
 */
export type S1InvokeFn = (
  client: KalshiClientLike,
  config: PassiveConfig,
) => Promise<{ filled: number }>;

export interface S7Config {
  ticker: string;
  /** S7 is sell-only; buy-side is out of scope. */
  side: 'sell';
  /** Total contracts to distribute across all rungs. */
  totalSize: number;
  rungs: S7Rung[];
  pollIntervalMs?: number;
  maxIterations?: number;
  /**
   * Base PassiveConfig fields to pass through to S1 for each rung.
   * Per-rung overrides (ticker, side, size) are applied on top.
   */
  s1Template?: Partial<PassiveConfig>;
  /**
   * Optional override for S1 invocation — injectable for tests.
   * When omitted, uses the real passive `run` function.
   */
  s1Invoke?: S1InvokeFn;
  /** Override KEA_HOME (for tests). */
  keaHome?: string;
  /** Unique job ID for journaling. Auto-generated when omitted. */
  jobId?: string;
}

export interface S7Result {
  /** Indices (into config.rungs) that fired during this run. */
  firedRungs: number[];
  /** Total contracts filled across all fired rungs. */
  totalFilled: number;
  /** Number of poll iterations executed. */
  iterations: number;
  reason: 'all_rungs_fired' | 'max_iterations' | 'caller_stopped';
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateConfig(config: S7Config): void {
  if (config.side !== 'sell') {
    throw new Error(`S7: side must be 'sell' — buy-side scale-out is not supported (got '${config.side}')`);
  }
  if (config.totalSize <= 0) {
    throw new Error(`S7: totalSize must be > 0 (got ${config.totalSize})`);
  }
  if (!config.rungs || config.rungs.length === 0) {
    throw new Error('S7: rungs must be a non-empty array');
  }
  let sumPct = 0;
  for (let i = 0; i < config.rungs.length; i++) {
    const r = config.rungs[i];
    if (r.priceCents <= 0) {
      throw new Error(`S7: rung[${i}].priceCents must be > 0 (got ${r.priceCents})`);
    }
    if (r.sizePct <= 0) {
      throw new Error(`S7: rung[${i}].sizePct must be > 0 (got ${r.sizePct})`);
    }
    sumPct += r.sizePct;
  }
  if (sumPct > 100) {
    throw new Error(`S7: sum(sizePct) must be <= 100 (got ${sumPct})`);
  }
}

// ── Runner class ──────────────────────────────────────────────────────────────

export class S7ScaleOutRunner {
  private readonly config: S7Config;
  private readonly client: KalshiClientLike;
  private readonly journal: Journal;
  private readonly jobId: string;
  private stopped = false;

  constructor(
    client: KalshiClientLike,
    config: S7Config,
    journal?: Journal | unknown,
  ) {
    validateConfig(config);
    this.client = client;
    this.config = config;
    this.jobId = config.jobId ?? generateJobId();
    // Accept an injected Journal (for tests) or construct a fresh one.
    this.journal = (journal instanceof Journal)
      ? journal
      : new Journal(this.jobId, config.keaHome);
  }

  /** Signal the runner to stop after the current poll iteration completes. */
  stop(): void {
    this.stopped = true;
  }

  async run(): Promise<S7Result> {
    const {
      ticker,
      totalSize,
      rungs,
      s1Template = {},
      s1Invoke,
    } = this.config;

    const pollIntervalMs = this.config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const maxIterations = this.config.maxIterations ?? DEFAULT_MAX_ITERATIONS;

    // Resolve S1 invocation function: injected mock or real passive.run.
    const invoke: S1InvokeFn = s1Invoke ?? passiveRun;

    const firedRungs: number[] = [];
    let totalFilled = 0;
    let iterations = 0;

    this.journal.append(jk('s7_run_started'), {
      ticker,
      totalSize,
      rungCount: rungs.length,
      pollIntervalMs,
      maxIterations,
    });

    // Main poll loop.
    while (true) {
      // Graceful stop (from stop() call).
      if (this.stopped) {
        this.journal.append(jk('s7_run_complete'), {
          reason: 'caller_stopped',
          firedRungs,
          totalFilled,
          iterations,
        });
        return { firedRungs, totalFilled, iterations, reason: 'caller_stopped' };
      }

      // Safety cap on iterations.
      if (iterations >= maxIterations) {
        this.journal.append(jk('s7_run_complete'), {
          reason: 'max_iterations',
          firedRungs,
          totalFilled,
          iterations,
        });
        return { firedRungs, totalFilled, iterations, reason: 'max_iterations' };
      }

      // Fetch orderbook.
      const book = await this.client.getOrderbook(ticker, 20);
      // Top bid: highest priceCents in yes[] (buyers willing to pay).
      // yes[] is sorted ascending by convention; top bid = last entry.
      // Guard against empty book.
      const sortedYesBids = book.yes
        .filter((l) => l.size > 0)
        .sort((a, b) => b.priceCents - a.priceCents);
      const topBid = sortedYesBids[0]?.priceCents ?? 0;

      iterations++;

      // Check each unfired rung in order.
      for (let i = 0; i < rungs.length; i++) {
        if (firedRungs.includes(i)) continue;
        const rung = rungs[i];
        if (topBid >= rung.priceCents) {
          const rungSize = Math.floor(totalSize * rung.sizePct / 100);
          // Build per-rung PassiveConfig from the template + rung-specific overrides.
          const passiveCfg: PassiveConfig = {
            // Sensible defaults for fields not in template.
            dryRun: false,
            ...s1Template,
            ticker,
            side: 'sell',
            size: rungSize,
            keaHome: this.config.keaHome,
          };

          let fillCount = 0;
          try {
            const result = await invoke(this.client, passiveCfg);
            fillCount = result.filled;
          } catch (err) {
            this.journal.append(jk('s7_rung_error'), {
              rungIndex: i,
              priceCents: rung.priceCents,
              sizePct: rung.sizePct,
              rungSize,
              error: String(err),
            });
            // Continue; mark rung fired anyway to avoid infinite retry on errors.
          }

          firedRungs.push(i);
          totalFilled += fillCount;

          this.journal.append(jk('s7_rung_fired'), {
            rungIndex: i,
            priceCents: rung.priceCents,
            sizePct: rung.sizePct,
            rungSize,
            topBidAtFire: topBid,
            fillCount,
          });
        }
      }

      // All rungs fired?
      if (firedRungs.length === rungs.length) {
        this.journal.append(jk('s7_run_complete'), {
          reason: 'all_rungs_fired',
          firedRungs,
          totalFilled,
          iterations,
        });
        return { firedRungs, totalFilled, iterations, reason: 'all_rungs_fired' };
      }

      // Sleep before next poll (check stop flag again after wake).
      await sleep(pollIntervalMs);
    }
  }
}
