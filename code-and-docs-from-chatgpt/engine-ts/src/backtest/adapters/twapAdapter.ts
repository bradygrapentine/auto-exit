/**
 * SH-BACKTEST-RUNTICK Phase 2 — TWAP adapter backed by STwapRunner.runOneTick().
 *
 * Each harness tick calls STwapRunner.runOneTick(state, opts), advancing the
 * TWAP schedule one interval at a time. The inter-interval sleep lives in
 * STwapRunner.run() — it is NOT used here. The harness cursor is the clock.
 *
 * Design:
 *   - passiveInvoke is stubbed: instead of calling the real passive.run()
 *     (which sleeps), we call a lightweight in-process passive execution using
 *     the replay client. In practice we use a passiveInvoke that simply
 *     invokes passive.runOneTick in dryRun mode for a single iteration,
 *     matching the fill semantics of the passiveAdapter.
 *   - now() is wired to the real Date.now() — the backtest doesn't patch time.
 *   - State persists across adapter ticks so interval progress accumulates.
 *   - Runner and state are created lazily on first tick.
 */

import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { STwapRunner, computeSliceSizes } from '../../strategies/sTwap.js';
import type { STwapConfig, STwapTickState, PassiveInvokeFn } from '../../strategies/sTwap.js';
import { Journal, generateJobId } from '../../journal.js';
import { runOneTick as passiveRunOneTick } from '../../passive.js';
import type { PassiveConfig, PassiveRunState } from '../../passive.js';
import type { ReplayKalshiClient } from '../replayClient.js';
import type { StrategyAdapter } from '../harness.js';
import type { KalshiClientLike } from '../../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpJournal(jobId: string): { journal: Journal; tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-bt-twap-'));
  const journal = new Journal(jobId, tmpDir);
  return { journal, tmpDir };
}

const roundCents = (c: number): number => Math.round(c * 10_000) / 10_000;

/**
 * Build a passiveInvoke that uses passive.runOneTick (dryRun) against the
 * live replay client for the current tick. This avoids sleeping and gives
 * realistic fill simulation via the harness fill model.
 *
 * The function signature matches PassiveInvokeFn: (cfg, journal?) => Promise<PassiveResult>
 */
function makeBacktestPassiveInvoke(client: KalshiClientLike): PassiveInvokeFn {
  return async (cfg: PassiveConfig, _journal?: Journal | unknown) => {
    const walkStepCents = cfg.walkStepCents ?? 1;
    const chunkSize = cfg.chunkSize ?? 100;
    const kalshiSide: 'yes' | 'no' = cfg.ticker.endsWith('_NO') ? 'no' : 'yes';
    const effectiveFloorCents = cfg.side === 'sell' ? Math.max(0, cfg.minPriceCents ?? 0) : 0;
    const safetyMultiple = cfg.safetySubmittedMultiple ?? 5;
    const submittedCap = cfg.size * safetyMultiple;

    // Use a throw-away tmp journal for this passive invocation
    const invJobId = generateJobId();
    const invTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-bt-twap-passive-'));
    const invJournal = new Journal(invJobId, invTmpDir);

    const state: PassiveRunState = {
      filled: 0,
      remaining: cfg.size,
      totalNotionalCents: 0,
      feesIncurredDollars: 0,
      totalSubmittedShares: 0,
      guardHit: false,
      oneSidedWarned: false,
    };

    try {
      await passiveRunOneTick(state, {
        client,
        config: { ...cfg, dryRun: true },
        journal: invJournal,
        chunkSize: Math.min(chunkSize, cfg.size),
        passiveTimeboxMs: 0,
        walkStepCents,
        submittedCap,
        effectiveFloorCents,
        kalshiSide,
        roundCents,
      });
    } catch {
      // Ignore errors in backtest passive invoke — return partial result
    } finally {
      try { fs.rmSync(invTmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }

    const avgPriceCents =
      state.filled > 0
        ? Number((state.totalNotionalCents / state.filled).toFixed(4))
        : 0;

    return {
      jobId: invJobId,
      filled: state.filled,
      avgPriceCents,
      feesIncurredDollars: state.feesIncurredDollars,
      remaining: state.remaining,
      status: state.remaining <= 0 ? 'complete' : state.filled > 0 ? 'partial' : 'spread_too_tight',
    };
  };
}

function buildSTwapConfig(
  params: Record<string, unknown>,
  size: number,
  client: KalshiClientLike,
): STwapConfig {
  return {
    ticker: (params['ticker'] as string | undefined) ?? '',
    side: (params['side'] as STwapConfig['side'] | undefined) ?? 'sell',
    size,
    intervalMinutes: (params['intervalMinutes'] as number | undefined) ?? 1,
    numIntervals: (params['numIntervals'] as number | undefined) ?? 2,
    s1Template: params['s1Template'] as Partial<PassiveConfig> | undefined,
    maxParticipationRate: params['maxParticipationRate'] as number | undefined,
    // No sleep in backtest — inter-interval timing is controlled by harness cursor.
    sleepMs: async () => { /* no-op */ },
    // Inject backtest passiveInvoke
    passiveInvoke: makeBacktestPassiveInvoke(client),
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a TWAP strategy StrategyAdapter backed by STwapRunner.runOneTick().
 *
 * Each harness tick advances one TWAP interval. The adapter stops after
 * all intervals fire (break_loop: schedule_complete) or if stop() is called.
 *
 * Registered in harness.ts under 's-twap'.
 */
export function makeTwapAdapter(params: Record<string, unknown>): StrategyAdapter {
  let runner: STwapRunner | null = null;
  let state: STwapTickState | null = null;
  let slices: number[] | null = null;
  let stopped = false;
  let tmpDir: string | null = null;

  return {
    async tick(client: ReplayKalshiClient, remainingQty: number): Promise<string> {
      if (stopped || remainingQty <= 0) return '';

      const kalshiClient = client as unknown as KalshiClientLike;

      if (!runner) {
        const jobId = generateJobId();
        const { journal, tmpDir: td } = makeTmpJournal(jobId);
        tmpDir = td;

        const config = buildSTwapConfig(params, remainingQty, kalshiClient);
        runner = new STwapRunner(config, journal);

        const numIntervals = config.numIntervals;
        slices = computeSliceSizes(remainingQty, numIntervals);

        state = {
          intervalIndex: 0,
          totalFilled: 0,
          intervalsFired: 0,
          fillWindow: [],
          startMs: Date.now(),
        };
      }

      const passiveInvoke = makeBacktestPassiveInvoke(kalshiClient);
      const outcome = await runner.runOneTick(state!, {
        slices: slices!,
        passiveInvoke,
        now: () => new Date(),
      });

      if (outcome.kind === 'break_loop') {
        stopped = true;
        if (tmpDir) {
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
          tmpDir = null;
        }
        return `twap: break_loop reason=${outcome.reason}`;
      }

      return `twap: interval=${state!.intervalIndex - 1} totalFilled=${state!.totalFilled}`;
    },
  };
}
