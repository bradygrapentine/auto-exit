import { describe, expect, it, vi } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { ExitConfig, Orderbook } from '../src/types.js';

// Mock safety to be permissive so existing tests aren't affected by guard-rail defaults.
vi.mock('../src/safety.js', async () => {
  const actual = await vi.importActual<typeof import('../src/safety.js')>('../src/safety.js');
  return {
    ...actual,
    getSafety: vi.fn(() => ({
      version: 1 as const,
      safetySubmittedMultiple: 2.0,
      floorPriceCents: 0,
      tailSweepThreshold: 0,
      forbiddenTickers: [],
    })),
    mergeIntoExitConfig: (config: ExitConfig) => config,
  };
});

const baseCfg: ExitConfig = {
  baseUrl: 'https://example.test',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 1000,
  chunkSize: 500,
  floorPriceCents: 1,
  orderbookDepth: 20,
  minLevelSize: 50,
  tailSweepThreshold: 100,
  mildAdaptive: false,
  minAdaptiveChunk: 100,
  maxOrders: 20,
  loopDelayMs: 0,
  dryRun: false,
  killSwitchPath: './STOP_DOES_NOT_EXIST',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  reconcilePollMs: 0,
  reconcileMaxPolls: 3,
  cancelOnStale: true,
};

const fatBook: Orderbook = {
  yes: [{ priceCents: 5, size: 10000 }],
  no: [{ priceCents: 5, size: 10000 }],
};

describe('ExitRunner reconciliation', () => {
  it('decrements remaining only by actual fills (full fill)', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook, fatBook],
      behaviors: [{ fillCount: 500 }, { fillCount: 500 }],
    });
    const runner = new ExitRunner(baseCfg, mock);
    const status = await runner.run();
    expect(status.remaining).toBe(0);
    expect(status.filledTotal).toBe(1000);
    expect(status.ordersAttempted).toBe(2);
    expect(mock.events.filter((e) => e === 'createOrder').length).toBe(2);
  });

  it('credits only the filled portion when an order is canceled stale', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook, fatBook, fatBook],
      behaviors: [
        { fillCount: 100 },
        { fillCount: 500 },
        { fillCount: 400 },
      ],
    });
    const runner = new ExitRunner(baseCfg, mock);
    const status = await runner.run();
    expect(status.filledTotal).toBe(1000);
    expect(status.remaining).toBe(0);
    expect(mock.events).toContain('cancelOrder');
    expect(status.canceledTotal).toBeGreaterThan(0);
  });

  it('absorbs late fills observed during polling', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook],
      behaviors: [
        { fillCount: 0, fillOnPoll: 500 },
        { fillCount: 500 },
      ],
    });
    const runner = new ExitRunner(baseCfg, mock);
    const status = await runner.run();
    expect(status.filledTotal).toBe(1000);
    expect(status.remaining).toBe(0);
    expect(mock.events).toContain('getOrder');
  });

  it('respects maxOrders when nothing fills', async () => {
    const cfg: ExitConfig = { ...baseCfg, maxOrders: 3, tailSweepThreshold: 0 };
    const mock = new MockKalshiClient({
      orderbookSnapshots: Array.from({ length: 10 }, () => fatBook),
      behaviors: Array.from({ length: 10 }, () => ({ fillCount: 0 })),
    });
    const runner = new ExitRunner(cfg, mock);
    const status = await runner.run();
    expect(status.ordersAttempted).toBe(3);
    expect(status.filledTotal).toBe(0);
    expect(status.remaining).toBe(1000);
  });

  it('dry-run path skips client mutating calls', async () => {
    const cfg: ExitConfig = { ...baseCfg, dryRun: true };
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook, fatBook],
    });
    const runner = new ExitRunner(cfg, mock);
    const status = await runner.run();
    expect(status.remaining).toBe(0);
    expect(mock.events).not.toContain('createOrder');
    expect(mock.events).not.toContain('getOrder');
  });
});
