// test/backtest/watcherSizeThreading.test.ts
import { describe, it, expect } from 'vitest';
import { makeSTrailWatcherAdapter } from '../../src/backtest/adapters/watcherAdapter.js';
import { makeTrailingStopAdapter } from '../../src/backtest/adapters/watcherAdapter.js';
import { makeTakeProfitAdapter } from '../../src/backtest/adapters/watcherAdapter.js';

// Minimal fake replay client with a yes-side book.
function makeFakeClient() {
  return {
    getOrderbook: async () => ({
      yes: [{ priceCents: 50, size: 200 }],
      no:  [{ priceCents: 50, size: 200 }],
    }),
    createOrder: async () => ({ orderId: 'o-1', status: 'filled' as const, filledCount: 100, remainingCount: 0 }),
    getPosition: async () => ({ quantity: 100 }),
    advance: () => true,
    currentTimestamp: () => '2026-05-08T00:00:00Z',
    getFillLog: () => [],
  };
}

describe('watcher adapters thread harness remainingQty as positionSize', () => {
  it('s-trail does not error when params.size is unset', async () => {
    const adapter = makeSTrailWatcherAdapter({ ticker: 'KX-TEST', trailCents: 5 });
    const client = makeFakeClient();
    // First tick should not throw "positionSize must be > 0"
    await expect(adapter.tick(client as never, 100)).resolves.not.toThrow();
  });

  it('trailing_stop registers with positionSize=remainingQty', async () => {
    const adapter = makeTrailingStopAdapter({ ticker: 'KX-TEST', trailCents: 5 });
    const client = makeFakeClient();
    await expect(adapter.tick(client as never, 100)).resolves.not.toThrow();
  });

  it('take_profit registers with positionSize=remainingQty', async () => {
    const adapter = makeTakeProfitAdapter({ ticker: 'KX-TEST', triggerPriceCents: 75 });
    const client = makeFakeClient();
    await expect(adapter.tick(client as never, 100)).resolves.not.toThrow();
  });
});
