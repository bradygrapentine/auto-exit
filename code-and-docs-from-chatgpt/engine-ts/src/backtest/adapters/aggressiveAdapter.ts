/**
 * SH-BACKTEST-RUNTICK Phase 2 — aggressive adapter backed by AggressiveRunner.runOneTick().
 *
 * Aggressive is single-shot: one runOneTick() call posts an IoC sweep.
 * After it returns done | break_loop, the adapter is finished — subsequent
 * harness ticks are no-ops.
 *
 * Design:
 *   - confirmedAggressive is forced to true (backtest explicit opt-in context).
 *   - Journal pointed at a per-run tmp dir.
 *   - done flag prevents re-running after the first tick.
 */

import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { AggressiveRunner } from '../../aggressive.js';
import type { AggressiveConfig } from '../../aggressive.js';
import { Journal, generateJobId } from '../../journal.js';
import type { ReplayKalshiClient } from '../replayClient.js';
import type { StrategyAdapter } from '../harness.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpJournal(jobId: string): { journal: Journal; tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-bt-aggressive-'));
  const journal = new Journal(jobId, tmpDir);
  return { journal, tmpDir };
}

function buildAggressiveConfig(
  params: Record<string, unknown>,
  size: number,
): AggressiveConfig {
  return {
    ticker: (params['ticker'] as string | undefined) ?? '',
    side: (params['side'] as AggressiveConfig['side'] | undefined) ?? 'yes',
    action: (params['action'] as AggressiveConfig['action'] | undefined) ?? 'sell',
    size,
    // Force confirmedAggressive — backtest callers explicitly request this strategy.
    confirmedAggressive: true,
    oneTickIn: params['oneTickIn'] as boolean | undefined,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an aggressive strategy StrategyAdapter backed by AggressiveRunner.runOneTick().
 *
 * Single-shot: after the first tick returns done | break_loop, no further
 * ticks are attempted.
 *
 * Registered in harness.ts under 's-aggressive'.
 */
export function makeAggressiveAdapter(params: Record<string, unknown>): StrategyAdapter {
  let runner: AggressiveRunner | null = null;
  let done = false;
  let tmpDir: string | null = null;

  return {
    async tick(client: ReplayKalshiClient, remainingQty: number): Promise<string> {
      if (done || remainingQty <= 0) return '';

      if (!runner) {
        const jobId = generateJobId();
        const { journal, tmpDir: td } = makeTmpJournal(jobId);
        tmpDir = td;

        const config = buildAggressiveConfig(params, remainingQty);
        runner = new AggressiveRunner(
          client as unknown as import('../../types.js').KalshiClientLike,
          config,
          journal,
        );
      }

      // Aggressive is always single-shot — mark done regardless of outcome.
      done = true;
      const outcome = await runner.runOneTick();

      // Clean up tmp dir
      if (tmpDir) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
        tmpDir = null;
      }

      if (outcome.kind === 'break_loop') {
        return `aggressive: break_loop reason=${outcome.reason}`;
      }

      return `aggressive: done filled=${outcome.result.filled} reason=${outcome.result.reason}`;
    },
  };
}
