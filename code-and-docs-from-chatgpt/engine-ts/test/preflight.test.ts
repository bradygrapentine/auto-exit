import { describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { ExitConfig, Orderbook } from '../src/types.js';

const fatBook: Orderbook = {
  yes: [{ priceCents: 5, size: 10000 }],
  no: [{ priceCents: 5, size: 10000 }],
};

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
  dryRun: true,
  killSwitchPath: './STOP_DOES_NOT_EXIST',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  reconcilePollMs: 0,
  reconcileMaxPolls: 3,
  cancelOnStale: true,
};

describe('ExitRunner preflight', () => {
  it('passes through when observed quantity matches config positionSize', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [fatBook] });
    mock.setPosition('KXTEST', 'yes', 1000);
    const runner = new ExitRunner(baseCfg, mock);
    const position = await runner.preflight();
    expect(position.side).toBe('yes');
    expect(position.quantity).toBe(1000);
    // positionSize should remain unchanged
    const status = runner.getStatus();
    expect(status.initialPosition).toBe(1000);
    expect(status.remaining).toBe(1000);
  });

  it('clamps positionSize when observed quantity is less than config positionSize', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [fatBook] });
    mock.setPosition('KXTEST', 'yes', 600); // less than configured 1000
    const runner = new ExitRunner(baseCfg, mock);
    const position = await runner.preflight();
    expect(position.quantity).toBe(600);
    const status = runner.getStatus();
    // Runner should have clamped remaining and initialPosition to observed
    expect(status.initialPosition).toBe(600);
    expect(status.remaining).toBe(600);
    // position_clamped event logged
    const clamped = status.events.find((e) => e.message === 'position_clamped');
    expect(clamped).toBeDefined();
    expect(clamped?.level).toBe('warn');
  });

  it('throws when observed side mismatches config heldSide', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [fatBook] });
    mock.setPosition('KXTEST', 'no', 1000); // side mismatch: config expects 'yes'
    const runner = new ExitRunner(baseCfg, mock);
    await expect(runner.preflight()).rejects.toThrow(/side mismatch/i);
  });

  it('throws when position is zero / not held', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [fatBook] });
    // no setPosition call → getPosition throws "No position held"
    const runner = new ExitRunner(baseCfg, mock);
    await expect(runner.preflight()).rejects.toThrow(/No position held/i);
  });

  it('run() aborts before the loop when side mismatches', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [fatBook, fatBook, fatBook] });
    mock.setPosition('KXTEST', 'no', 1000); // side mismatch
    const runner = new ExitRunner({ ...baseCfg, dryRun: false, preflight: true }, mock);
    const status = await runner.run();
    // Should finish with lastError set and no orders attempted
    expect(status.lastError).toMatch(/side mismatch/i);
    expect(status.ordersAttempted).toBe(0);
    expect(status.stopped).toBe(true);
  });

  it('run() with clamped position exits fully using clamped quantity', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook, fatBook],
      behaviors: [{ fillCount: 600 }],
    });
    mock.setPosition('KXTEST', 'yes', 600); // less than configured 1000
    const runner = new ExitRunner({ ...baseCfg, dryRun: false, chunkSize: 600, preflight: true }, mock);
    const status = await runner.run();
    expect(status.filledTotal).toBe(600);
    expect(status.remaining).toBe(0);
  });
});
