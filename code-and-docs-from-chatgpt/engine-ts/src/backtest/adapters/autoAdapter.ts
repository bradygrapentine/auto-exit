// src/backtest/adapters/autoAdapter.ts
import type { StrategyAdapter } from '../harness.js';
import type { ReplayKalshiClient } from '../replayClient.js';
import { detectRegime, type SnapshotSlice } from '../../regime.js';
import { makeSTrailWatcherAdapter } from './watcherAdapter.js';
import { makePassiveAdapter } from './passiveAdapter.js';
import { makeAggressiveAdapter } from './aggressiveAdapter.js';
// stop_loss is defined inline in harness.ts — imported after exporting it there.
import { makeStopLossAdapter } from '../harness.js';

interface AutoParams {
  ticker?: string;
  side?: 'yes' | 'no';
  warmupTicks?: number;
  [key: string]: unknown;
}

export interface AutoStrategyAdapter extends StrategyAdapter {
  chosenStrategy: string | null;
  chosenRegime: string | null;
}

export function makeAutoAdapter(params: AutoParams = {}): AutoStrategyAdapter {
  const warmup = params.warmupTicks ?? 10;
  const buffer: SnapshotSlice[] = [];
  let inner: StrategyAdapter | null = null;
  let chosenStrategy: string | null = null;
  let chosenRegime: string | null = null;

  const adapter: AutoStrategyAdapter = {
    chosenStrategy: null,
    chosenRegime: null,
    async tick(client: ReplayKalshiClient, remainingQty: number): Promise<string> {
      if (remainingQty <= 0) return '';

      // Buffer recent snapshots for regime detection.
      const book = await client.getOrderbook(params.ticker ?? '', 5);
      buffer.push({ orderbook: { yes: book.yes, no: book.no } });

      if (!inner) {
        if (buffer.length < warmup) return '';
        const regime = detectRegime(buffer);
        chosenRegime = regime;
        adapter.chosenRegime = regime;
        switch (regime) {
          case 'rising':
            inner = makeSTrailWatcherAdapter({ ...params, trailCents: 10 });
            chosenStrategy = 's-trail';
            break;
          case 'falling':
            inner = makeStopLossAdapter({ ...params, stopPriceCents: 50, size: remainingQty });
            chosenStrategy = 'stop_loss';
            break;
          case 'sideways':
            inner = makePassiveAdapter({ ...params, chunkSize: 100, walkStepCents: 1 });
            chosenStrategy = 's-passive';
            break;
          case 'dead':
          default:
            inner = makeAggressiveAdapter({ ...params });
            chosenStrategy = 's-aggressive';
            break;
        }
        adapter.chosenStrategy = chosenStrategy;
      }

      return inner.tick(client, remainingQty);
    },
  };
  return adapter;
}
