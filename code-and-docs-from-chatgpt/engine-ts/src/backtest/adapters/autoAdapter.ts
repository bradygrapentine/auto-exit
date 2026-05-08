// src/backtest/adapters/autoAdapter.ts
import type { StrategyAdapter } from '../harness.js';
import type { ReplayKalshiClient } from '../replayClient.js';
import { detectRegime, proportionalThresholds, type SnapshotSlice, type RegimeThresholds, type RegimeLabel } from '../../regime.js';
import { makeSTrailWatcherAdapter } from './watcherAdapter.js';
import { makePassiveAdapter } from './passiveAdapter.js';
import { makeAggressiveAdapter } from './aggressiveAdapter.js';
// stop_loss is defined inline in harness.ts — imported after exporting it there.
import { makeStopLossAdapter } from '../harness.js';

interface AutoParams {
  ticker?: string;
  side?: 'yes' | 'no';
  warmupTicks?: number;
  /** 'fixed' (default — v4 thresholds) or 'proportional' (scales with warmup). */
  thresholdMode?: 'fixed' | 'proportional';
  /** Re-classify every N ticks after the warmup completes. 0 = never (v5 behavior). */
  reclassifyInterval?: number;
  /** Require N consecutive different-regime classifications before switching. Default 3. */
  hysteresisTicks?: number;
  [key: string]: unknown;
}

export interface AutoStrategyAdapter extends StrategyAdapter {
  chosenStrategy: string | null;
  chosenRegime: string | null;
  /** Switches recorded over the run (for v7 sweep diagnostics). */
  switchCount: number;
}

function makeInnerForRegime(
  regime: RegimeLabel,
  params: AutoParams,
  remainingQty: number,
): { inner: StrategyAdapter; label: string } {
  switch (regime) {
    case 'rising':
      return { inner: makeSTrailWatcherAdapter({ ...params, trailCents: 10 }), label: 's-trail' };
    case 'falling':
      return { inner: makeStopLossAdapter({ ...params, stopPriceCents: 50, size: remainingQty }), label: 'stop_loss' };
    case 'sideways':
      return { inner: makePassiveAdapter({ ...params, chunkSize: 100, walkStepCents: 1 }), label: 's-passive' };
    case 'dead':
    default:
      return { inner: makeAggressiveAdapter({ ...params }), label: 's-aggressive' };
  }
}

export function makeAutoAdapter(params: AutoParams = {}): AutoStrategyAdapter {
  const warmup = params.warmupTicks ?? 10;
  const reclassifyInterval = params.reclassifyInterval ?? 0;
  const hysteresisTicks = params.hysteresisTicks ?? 3;
  const buffer: SnapshotSlice[] = [];
  let inner: StrategyAdapter | null = null;
  let chosenRegime: RegimeLabel | null = null;
  let tickCount = 0;
  // Hysteresis: track a streak of consecutive different-regime classifications
  // before actually switching, so single-tick noise doesn't thrash adapters.
  let pendingRegime: RegimeLabel | null = null;
  let pendingStreak = 0;

  function classify(): RegimeLabel {
    const window = buffer.slice(-warmup);
    const thresholds: RegimeThresholds | undefined =
      params.thresholdMode === 'proportional' ? proportionalThresholds(window.length) : undefined;
    return detectRegime(window, thresholds);
  }

  const adapter: AutoStrategyAdapter = {
    chosenStrategy: null,
    chosenRegime: null,
    switchCount: 0,
    async tick(client: ReplayKalshiClient, remainingQty: number): Promise<string> {
      if (remainingQty <= 0) return '';
      tickCount++;

      // Buffer recent snapshots for regime detection.
      const book = await client.getOrderbook(params.ticker ?? '', 5);
      buffer.push({ orderbook: { yes: book.yes, no: book.no } });

      // Initial classification at warmup.
      if (!inner) {
        if (buffer.length < warmup) return '';
        chosenRegime = classify();
        adapter.chosenRegime = chosenRegime;
        const built = makeInnerForRegime(chosenRegime, params, remainingQty);
        inner = built.inner;
        adapter.chosenStrategy = built.label;
        return inner.tick(client, remainingQty);
      }

      // Rolling re-classification (only if enabled and at the right interval).
      if (reclassifyInterval > 0 && tickCount % reclassifyInterval === 0) {
        const candidate = classify();
        if (candidate !== chosenRegime) {
          if (candidate === pendingRegime) {
            pendingStreak += 1;
          } else {
            pendingRegime = candidate;
            pendingStreak = 1;
          }
          if (pendingStreak >= hysteresisTicks) {
            // Hysteresis satisfied — switch the inner adapter. Old adapter's
            // resting orders stay on the book; the new one starts on next tick.
            chosenRegime = candidate;
            adapter.chosenRegime = candidate;
            const built = makeInnerForRegime(candidate, params, remainingQty);
            inner = built.inner;
            adapter.chosenStrategy = built.label;
            adapter.switchCount += 1;
            pendingRegime = null;
            pendingStreak = 0;
          }
        } else {
          // Same regime as current → reset pending streak.
          pendingRegime = null;
          pendingStreak = 0;
        }
      }

      return inner.tick(client, remainingQty);
    },
  };
  return adapter;
}
