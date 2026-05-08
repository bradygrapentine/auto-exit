/**
 * SH-BACKTEST-PHASE-D — generic Watcher-driven adapter framework.
 *
 * Each harness tick:
 *   1. Lazily construct Watcher pointed at the replay client.
 *   2. Lazily register a synthetic via the provided RegisterArgs builder.
 *   3. Call Watcher.tick() — the existing per-tick evaluator at watcher.ts:148.
 *   4. If the registered synthetic fired during this tick, the fireHook
 *      translates it into a sell on the replay client.
 *   5. Subsequent ticks return '' (single-shot — most synthetics fire once).
 *
 * Concrete strategy IDs (s-trail, trailing_stop, take_profit, oco, bracket)
 * are wired in a follow-up Task 3.
 */

import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { Watcher } from '../../watcher.js';
import { WatcherJournal } from '../../watcherJournal.js';
import type { RegisterArgs } from '../../synthetics/types.js';
import type { ReplayKalshiClient } from '../replayClient.js';
import type { StrategyAdapter } from '../harness.js';
import type { KalshiClientLike, WatcherConfig } from '../../types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ArgsBuilder = (params: Record<string, unknown>) => RegisterArgs;

// Minimal WatcherConfig sufficient for backtest use (no real API credentials needed).
const BACKTEST_WATCHER_CONFIG: WatcherConfig = {
  baseUrl: 'https://trading-api.kalshi.com',
  apiKeyEnv: 'KALSHI_API_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  pollIntervalMs: 0,
  idleIntervalMs: 0,
  orderbookDepth: 20,
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a StrategyAdapter that drives a real Watcher instance via Watcher.tick()
 * per harness tick. The fireHook translates any synthetic fire into a sell on the
 * replay client.
 *
 * @param buildArgs  Factory that produces RegisterArgs from the params object.
 * @param params     Strategy parameters forwarded to buildArgs and used at init time.
 */
export function makeWatcherAdapter(
  buildArgs: ArgsBuilder,
  params: Record<string, unknown>,
): StrategyAdapter {
  let watcher: Watcher | null = null;
  let synthId: string | null = null;
  let fired = false;
  let tmpDir: string | null = null;

  return {
    async tick(client: ReplayKalshiClient, remainingQty: number): Promise<string> {
      if (fired || remainingQty <= 0) return '';

      // Lazy init — construct Watcher and register synthetic on first tick.
      if (!watcher) {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-bt-watcher-'));
        const journalPath = path.join(tmpDir, 'synthetics.ndjson');
        const journal = new WatcherJournal(journalPath);

        watcher = new Watcher(
          client as unknown as KalshiClientLike,
          BACKTEST_WATCHER_CONFIG,
          journal,
        );

        watcher.setFireHook(async (s, _reason) => {
          await (client as unknown as KalshiClientLike).createOrder({
            ticker: s.ticker,
            action: 'sell',
            side: s.side,
            count: s.positionSize,
            type: 'limit',
            time_in_force: 'immediate_or_cancel',
            reduce_only: true,
            client_order_id: `bt-watcher-${Date.now()}`,
            ...(s.side === 'yes' ? { yes_price: 99 } : { no_price: 99 }),
          });
          fired = true;
        });

        const args = buildArgs(params);
        synthId = watcher.register(args);
      }

      const result = await watcher.tick();

      if (fired) {
        if (tmpDir) {
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
          tmpDir = null;
        }
        return `watcher: fired synthId=${synthId}`;
      }

      return `watcher: continue (armed=${result.armedCount})`;
    },
  };
}
