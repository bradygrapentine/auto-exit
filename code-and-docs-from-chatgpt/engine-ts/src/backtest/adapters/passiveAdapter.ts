/**
 * SH-BACKTEST-RUNTICK Phase 2 — passive adapter backed by real runOneTick seam.
 *
 * Replaces the hand-rolled clone in exitRunnerAdapter.ts with a thin wrapper
 * that delegates each harness tick to passive.runOneTick().
 *
 * Design choices:
 *   - dryRun: false — the adapter calls client.createOrder() so fills are
 *     tracked in the replay client's fill log and visible to the harness.
 *   - passiveTimeboxMs: 0 — deadline = Date.now() + 0, which expires before
 *     the first poll attempt. No sleep occurs. The inner walk loop's "timebox
 *     expired" path cancels the resting order and walks the price down by one
 *     step. This continues until a guard (floor/ceiling/safety_cap) fires.
 *
 * Fill behavior note: with passiveTimeboxMs=0 the inner loop immediately cancels
 * each GTC order before next-tick fills can occur. Direct fills only happen if
 * the replay client's naive fill model fills the order at createOrder time (i.e.
 * the limit price sweeps available book levels). This is correct for counterfactual
 * analysis: the adapter exercises real pricing logic tick-by-tick.
 *
 * Journal writes go to a per-run tmp dir; cleaned up on break_loop.
 * State is initialised lazily on first tick.
 */

import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { runOneTick as passiveRunOneTick } from '../../passive.js';
import type { PassiveRunState, PassiveRunDeps, PassiveConfig } from '../../passive.js';
import { Journal, generateJobId } from '../../journal.js';
import type { KalshiClientLike } from '../../types.js';
import type { ReplayKalshiClient } from '../replayClient.js';
import type { StrategyAdapter } from '../harness.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpJournal(jobId: string): { journal: Journal; tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-bt-passive-'));
  const journal = new Journal(jobId, tmpDir);
  return { journal, tmpDir };
}

function buildPassiveConfig(
  params: Record<string, unknown>,
  size: number,
): PassiveConfig {
  return {
    ticker: (params['ticker'] as string | undefined) ?? '',
    side: (params['side'] as PassiveConfig['side'] | undefined) ?? 'sell',
    size,
    minPriceCents: params['minPriceCents'] as number | undefined,
    maxPriceCents: params['maxPriceCents'] as number | undefined,
    chunkSize: params['chunkSize'] as number | undefined,
    walkStepCents: params['walkStepCents'] as number | undefined,
    safetySubmittedMultiple: (params['safetySubmittedMultiple'] as number | undefined) ?? 5,
    useMidpointPeg: params['useMidpointPeg'] as boolean | undefined,
    pegOffsetCents: params['pegOffsetCents'] as number | undefined,
    dryRun: false,
  };
}

const roundCents = (c: number): number => Math.round(c * 10_000) / 10_000;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a passive strategy StrategyAdapter backed by passive.runOneTick().
 *
 * Registered in harness.ts under 's-passive'.
 */
export function makePassiveAdapter(params: Record<string, unknown>): StrategyAdapter {
  let state: PassiveRunState | null = null;
  let deps: PassiveRunDeps | null = null;
  let stopped = false;
  let tmpDir: string | null = null;

  return {
    async tick(client: ReplayKalshiClient, remainingQty: number): Promise<string> {
      if (stopped || remainingQty <= 0) return '';

      if (!state) {
        const jobId = generateJobId();
        const { journal, tmpDir: td } = makeTmpJournal(jobId);
        tmpDir = td;

        const config = buildPassiveConfig(params, remainingQty);
        const walkStepCents = config.walkStepCents ?? 1;
        const safetyMultiple = config.safetySubmittedMultiple ?? 5;
        const chunkSize = config.chunkSize ?? 100;
        const kalshiSide: 'yes' | 'no' = config.ticker.endsWith('_NO') ? 'no' : 'yes';
        const effectiveFloorCents =
          config.side === 'sell' ? Math.max(0, config.minPriceCents ?? 0) : 0;
        const submittedCap = remainingQty * safetyMultiple;

        state = {
          filled: 0,
          remaining: remainingQty,
          totalNotionalCents: 0,
          feesIncurredDollars: 0,
          totalSubmittedShares: 0,
          guardHit: false,
          oneSidedWarned: false,
        };

        deps = {
          client: client as unknown as KalshiClientLike,
          config,
          journal,
          chunkSize,
          // passiveTimeboxMs=0: deadline expires immediately, no sleep, no poll.
          // GTC orders that don't fill at createOrder time are immediately cancelled
          // by the inner loop's "timebox expired" path.
          passiveTimeboxMs: 0,
          walkStepCents,
          submittedCap,
          effectiveFloorCents,
          kalshiSide,
          roundCents,
        };
      } else {
        // Keep state.remaining in sync with harness-tracked remainingQty
        state.remaining = remainingQty;
      }

      const outcome = await passiveRunOneTick(state, deps!);

      if (outcome.kind === 'break_loop') {
        stopped = true;
        if (tmpDir) {
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
          tmpDir = null;
        }
        return `passive: break_loop reason=${outcome.reason}`;
      }

      return `passive: continue (filled=${state.filled} remaining=${state.remaining})`;
    },
  };
}
