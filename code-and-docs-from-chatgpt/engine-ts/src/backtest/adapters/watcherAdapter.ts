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
import { buildSTrailArgs } from '../../strategies/sTrail.js';

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

// ---------------------------------------------------------------------------
// Concrete strategy factories (SH-BACKTEST-PHASE-D Task 3)
// ---------------------------------------------------------------------------

/**
 * s-trail adapter — wraps the trailing_stop synthetic via buildSTrailArgs.
 * STrailOpts requires: ticker, side, positionSize, trailCents.
 */
export function makeSTrailWatcherAdapter(params: Record<string, unknown>): StrategyAdapter {
  return makeWatcherAdapter((p) => {
    const ticker = (p['ticker'] as string | undefined) ?? '';
    const side = (p['side'] as 'yes' | 'no' | undefined) ?? 'yes';
    const positionSize = (p['size'] as number | undefined) ?? 0;
    const trailCents = (p['trailCents'] as number | undefined) ?? 5;
    const floorPriceCents = p['floorPriceCents'] as number | undefined;
    const autoCancelOnZeroPosition = p['autoCancelOnZeroPosition'] as boolean | undefined;
    return buildSTrailArgs({ ticker, side, positionSize, trailCents, floorPriceCents, autoCancelOnZeroPosition });
  }, params);
}

/**
 * trailing_stop adapter — registers a trailing_stop synthetic directly.
 * params: { ticker, side, size, trailCents, executionStrategy?, floorPriceCents? }
 */
export function makeTrailingStopAdapter(params: Record<string, unknown>): StrategyAdapter {
  return makeWatcherAdapter((p) => ({
    kind: 'trailing_stop',
    ticker: (p['ticker'] as string | undefined) ?? '',
    side: (p['side'] as 'yes' | 'no' | undefined) ?? 'yes',
    positionSize: (p['size'] as number | undefined) ?? 0,
    params: {
      trailCents: (p['trailCents'] as number | undefined) ?? 5,
      executionStrategy: p['executionStrategy'] as 'losing_exit' | 'aggressive' | undefined,
      floorPriceCents: p['floorPriceCents'] as number | undefined,
    },
  }), params);
}

/**
 * take_profit adapter — registers a take_profit synthetic.
 * params: { ticker, side, size, triggerPriceCents?, executionStrategy? }
 */
export function makeTakeProfitAdapter(params: Record<string, unknown>): StrategyAdapter {
  return makeWatcherAdapter((p) => ({
    kind: 'take_profit',
    ticker: (p['ticker'] as string | undefined) ?? '',
    side: (p['side'] as 'yes' | 'no' | undefined) ?? 'yes',
    positionSize: (p['size'] as number | undefined) ?? 0,
    params: {
      triggerPriceCents: (p['triggerPriceCents'] as number | undefined) ?? 75,
      executionStrategy: p['executionStrategy'] as 'scale_out' | 'passive' | 'aggressive' | undefined,
    },
  }), params);
}

/**
 * oco adapter — registers an OCO (one-cancels-other) composite synthetic.
 * Leg 1: take_profit at targetPriceCents; Leg 2: stop_loss at stopPriceCents.
 * params: { ticker, side, size, targetPriceCents?, stopPriceCents? }
 */
export function makeOcoAdapter(params: Record<string, unknown>): StrategyAdapter {
  return makeWatcherAdapter((p) => ({
    kind: 'oco',
    ticker: (p['ticker'] as string | undefined) ?? '',
    side: (p['side'] as 'yes' | 'no' | undefined) ?? 'yes',
    positionSize: (p['size'] as number | undefined) ?? 0,
    params: {
      legs: [
        { kind: 'take_profit', params: { triggerPriceCents: (p['targetPriceCents'] as number | undefined) ?? 75 } },
        { kind: 'stop_loss',   params: { triggerPriceCents: (p['stopPriceCents']  as number | undefined) ?? 30 } },
      ],
    },
  }), params);
}

/**
 * bracket adapter — registers a bracket composite synthetic.
 * Fires take_profit at takeProfitCents, stop_loss at stopLossCents.
 * params: { ticker, side, size, takeProfitCents?, stopLossCents? }
 */
export function makeBracketAdapter(params: Record<string, unknown>): StrategyAdapter {
  return makeWatcherAdapter((p) => ({
    kind: 'bracket',
    ticker: (p['ticker'] as string | undefined) ?? '',
    side: (p['side'] as 'yes' | 'no' | undefined) ?? 'yes',
    positionSize: (p['size'] as number | undefined) ?? 0,
    params: {
      takeProfitCents: (p['takeProfitCents'] as number | undefined) ?? 75,
      stopLossCents:   (p['stopLossCents']   as number | undefined) ?? 30,
    },
  }), params);
}
