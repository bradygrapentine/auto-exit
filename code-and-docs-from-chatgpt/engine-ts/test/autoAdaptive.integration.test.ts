import { describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { ExitConfig, Orderbook } from '../src/types.js';

// End-to-end exercise of the auto-adaptive chunking heuristic. Synthesizes orderbook
// shapes the live scanner couldn't find on Kalshi prod (Kalshi's cheap-tail markets
// almost never have 2+ YES bid levels with a real cliff) and runs the full engine.

const cliffBook: Orderbook = {
  // Top 20 shares @ 0.9¢, then a real cliff: 1000 @ 0.5¢ (gap 0.4¢ ≥ 0.2¢ threshold)
  yes: [
    { priceCents: 0.9, size: 20 },
    { priceCents: 0.5, size: 1000 },
  ],
  no: [],
};

const fatBook: Orderbook = {
  // Fat top: 500 @ 0.9¢ — chunkSize 50 fits comfortably (top >= 5x chunkSize)
  yes: [
    { priceCents: 0.9, size: 500 },
    { priceCents: 0.5, size: 1000 },
  ],
  no: [],
};

function baseCfg(): ExitConfig {
  // mildAdaptive intentionally omitted → auto-decide path
  return {
    baseUrl: 'https://example.test',
    localServerPort: 7777,
    marketTicker: 'KXTEST',
    heldSide: 'yes',
    positionSize: 80,
    chunkSize: 50,
    floorPriceCents: 0.1,
    orderbookDepth: 20,
    minLevelSize: 1,
    tailSweepThreshold: 0,
    minAdaptiveChunk: 1,
    maxOrders: 20,
    loopDelayMs: 0,
    reconcilePollMs: 0,
    reconcileMaxPolls: 1,
    cancelOnStale: true,
    dryRun: false,
    killSwitchPath: '',
    apiKeyEnv: 'X',
    privateKeyPathEnv: 'Y',
    safetySubmittedMultiple: 2,
  };
}

describe('auto-adaptive chunking — end-to-end', () => {
  it('thin-top + cliff: shrinks chunks to top-level depth and prices at top, never sweeping the cliff', async () => {
    // Same book repeated — simulates an MM that refills the top after each fill.
    // Each iteration the engine sees 20 @ 0.9¢, decides adaptive chunk = floor(20*0.8) = 16.
    const snapshots = Array.from({ length: 10 }, () => cliffBook);
    const mock = new MockKalshiClient({
      orderbookSnapshots: snapshots,
      // Each create fills the requested chunk fully (top has the depth — 20 >= 16)
      behaviors: Array.from({ length: 10 }, () => ({})),
    });
    const runner = new ExitRunner(baseCfg(), mock);
    const status = await runner.run();

    // Every order should have been chunked at 16 (adaptive), not 50 (fixed)
    const orderDecisions = status.events
      .filter((e) => e.message === 'order_decision')
      .map((e) => (e.data as { decision: { chunkSize: number; priceCentsExact: number } }).decision);

    expect(orderDecisions.length).toBeGreaterThan(0);
    for (const d of orderDecisions) {
      expect(d.chunkSize).toBe(16);          // adaptive math: floor(20 * 0.8)
      expect(d.priceCentsExact).toBeCloseTo(0.9, 5);  // priced at top — never drops to cliff
    }
    expect(status.filledTotal).toBe(80);
    expect(status.remaining).toBe(0);
  });

  it('counterfactual: same book with mildAdaptive: false sweeps into the cliff at fixed chunkSize', async () => {
    const snapshots = Array.from({ length: 10 }, () => cliffBook);
    const mock = new MockKalshiClient({
      orderbookSnapshots: snapshots,
      behaviors: Array.from({ length: 10 }, () => ({})),
    });
    const cfg = { ...baseCfg(), mildAdaptive: false as const };
    const runner = new ExitRunner(cfg, mock);
    const status = await runner.run();

    const orderDecisions = status.events
      .filter((e) => e.message === 'order_decision')
      .map((e) => (e.data as { decision: { chunkSize: number; priceCentsExact: number } }).decision);

    expect(orderDecisions.length).toBeGreaterThan(0);
    // Fixed chunk = 50 (≤ remaining). Top has 20 @ 0.9¢ → not enough depth → drops to next level (0.5¢).
    expect(orderDecisions[0].chunkSize).toBe(50);
    expect(orderDecisions[0].priceCentsExact).toBeCloseTo(0.5, 5);
  });

  it('fat-top book: auto-mode returns fixed chunkSize (no behavior change vs prior default)', async () => {
    const snapshots = Array.from({ length: 5 }, () => fatBook);
    const mock = new MockKalshiClient({
      orderbookSnapshots: snapshots,
      behaviors: Array.from({ length: 5 }, () => ({})),
    });
    const runner = new ExitRunner(baseCfg(), mock);
    const status = await runner.run();

    const orderDecisions = status.events
      .filter((e) => e.message === 'order_decision')
      .map((e) => (e.data as { decision: { chunkSize: number; priceCentsExact: number } }).decision);

    expect(orderDecisions.length).toBeGreaterThan(0);
    for (const d of orderDecisions) {
      // Fat top (500 ≥ 5 × 50) → heuristic returns fixed
      expect(d.chunkSize).toBeLessThanOrEqual(50);
      expect(d.priceCentsExact).toBeCloseTo(0.9, 5);
    }
    // Total chunks should sum to position
    const totalChunked = orderDecisions.reduce((s, d) => s + d.chunkSize, 0);
    expect(totalChunked).toBe(80);
  });
});
