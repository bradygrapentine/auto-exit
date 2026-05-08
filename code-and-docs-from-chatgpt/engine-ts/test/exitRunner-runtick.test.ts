/**
 * Tests for ExitRunner.runOneTick() seam.
 * Drives the loss-cutting exit logic tick-by-tick without the blocking sleep loop.
 */
import { describe, expect, it, vi } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import type { ExitTickOutcome } from '../src/exitRunner.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { ExitConfig, KalshiClientLike, Orderbook, OrderPayload, OrderResult } from '../src/types.js';

// Mock safety to be permissive so unit tests aren't affected by guard-rail defaults.
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
    checkPreTradeRisk: vi.fn().mockResolvedValue(undefined),
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
  safetySubmittedMultiple: 2.0,
};

const fatBook: Orderbook = {
  yes: [{ priceCents: 5, size: 10000 }],
  no: [{ priceCents: 5, size: 10000 }],
};

/** Bootstrap a runner so runOneTick() can be called directly, bypassing run() preamble. */
function makeRunner(cfg: Partial<ExitConfig> = {}, mock?: KalshiClientLike): ExitRunner {
  const config = { ...baseCfg, ...cfg };
  const client = mock ?? new MockKalshiClient({ orderbookSnapshots: [fatBook, fatBook, fatBook, fatBook] });
  const runner = new ExitRunner(config, client);
  // Bypass run() preamble: set running=true and initialPosition so safety cap math works.
  (runner as any).status.running = true;
  (runner as any).status.initialPosition = config.positionSize;
  return runner;
}

// ── Test 1: continue — chunk fills, remaining decrements ─────────────────────
describe('runOneTick: continue on chunk fill', () => {
  it('returns continue and decrements remaining after a full-chunk fill', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook],
      behaviors: [{ fillCount: 500 }],
    });
    const runner = makeRunner({}, mock);

    const outcome = await runner.runOneTick();

    expect(outcome).toEqual({ kind: 'continue' });
    const status = runner.getStatus();
    expect(status.remaining).toBe(500);
    expect(status.filledTotal).toBe(500);
    expect(status.ordersAttempted).toBe(1);
  });
});

// ── Test 2: break_loop:max_orders ─────────────────────────────────────────────
describe('runOneTick: break_loop:max_orders', () => {
  it('returns max_orders break when ordersAttempted >= maxOrders', async () => {
    const runner = makeRunner({ maxOrders: 3 });
    (runner as any).status.ordersAttempted = 3; // already at limit

    const outcome = await runner.runOneTick();

    expect(outcome).toEqual({ kind: 'break_loop', reason: 'max_orders' });
    // No order was created
    expect(runner.getStatus().ordersAttempted).toBe(3);
  });
});

// ── Test 3: break_loop:gtc_resting ───────────────────────────────────────────
describe('runOneTick: break_loop:gtc_resting', () => {
  it('returns gtc_resting break when GTC order lands on the book', async () => {
    // MockKalshiClient returns 'resting' when fillCount=0 and payload.count > 0
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook],
      behaviors: [{ fillCount: 0 }],
    });
    const runner = makeRunner({ orderTimeInForce: 'good_till_canceled' }, mock);

    const outcome = await runner.runOneTick();

    expect(outcome).toEqual({ kind: 'break_loop', reason: 'gtc_resting' });
  });
});

// ── Test 4: break_loop:safety_cap ────────────────────────────────────────────
describe('runOneTick: break_loop:safety_cap', () => {
  it('returns safety_cap break when submittedTotal would exceed cap', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook],
      behaviors: [{ fillCount: 500 }],
    });
    // safetySubmittedMultiple=1.0, positionSize=1000 → cap=1000
    // submittedTotal already at 600, chunkSize=500 → 600+500=1100 > 1000 → cap hit
    const runner = makeRunner({ safetySubmittedMultiple: 1.0 }, mock);
    (runner as any).status.submittedTotal = 600;

    const outcome = await runner.runOneTick();

    expect(outcome).toEqual({ kind: 'break_loop', reason: 'safety_cap' });
  });
});

// ── Test 5: break_loop:stop_requested ────────────────────────────────────────
describe('runOneTick: break_loop:stop_requested', () => {
  it('returns stop_requested break immediately when stop() has been called', async () => {
    const runner = makeRunner();
    runner.stop();

    const outcome = await runner.runOneTick();

    expect(outcome).toEqual({ kind: 'break_loop', reason: 'stop_requested' });
    // No orderbook fetch happened
    expect(runner.getStatus().ordersAttempted).toBe(0);
  });
});

// ── Test 6: regression — full run() still drains a small position ────────────
describe('run() regression: drains position end-to-end', () => {
  it('drains a 100-share position in two 50-share chunks via run()', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook, fatBook],
      behaviors: [{ fillCount: 50 }, { fillCount: 50 }],
    });
    const runner = new ExitRunner({ ...baseCfg, positionSize: 100, chunkSize: 50 }, mock);
    const status = await runner.run();

    expect(status.remaining).toBe(0);
    expect(status.filledTotal).toBe(100);
    expect(status.ordersAttempted).toBe(2);
  });
});
