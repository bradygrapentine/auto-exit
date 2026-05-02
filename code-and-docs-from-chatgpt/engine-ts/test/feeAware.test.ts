import { describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import { projectFullExit } from '../src/pricing.js';
import type { ExitConfig, KalshiClientLike, Orderbook, OrderResult, Position } from '../src/types.js';

const baseCfg: ExitConfig = {
  baseUrl: 'https://example.test',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 1000,
  chunkSize: 500,
  floorPriceCents: 0,
  orderbookDepth: 20,
  minLevelSize: 1,
  tailSweepThreshold: 0,
  mildAdaptive: false,
  minAdaptiveChunk: 1,
  maxOrders: 5,
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

describe('projectFullExit', () => {
  it('walks one fat level cleanly when the chunk fits', () => {
    const proj = projectFullExit([{ priceCents: 5, size: 10000 }], 1000, baseCfg);
    expect(proj.totalSharesFilled).toBe(1000);
    expect(proj.totalGrossDollars).toBeCloseTo(50, 1); // 1000 × $0.05 (priceCents=5 → 5¢/share)
    expect(proj.estimatedChunks).toBe(2); // chunkSize=500
    expect(proj.feeRatio).toBeGreaterThan(0);
    expect(proj.feeRatio).toBeLessThan(0.10); // ≤ 10% at 5¢
    expect(proj.unfillableAtAnyBid).toBe(0);
    expect(proj.hitsMaxOrders).toBe(false);
  });

  it('walks across multiple levels for a single chunk', () => {
    // Chunk 500: top 200@0.8¢ then 300@0.6¢
    const cfg: ExitConfig = { ...baseCfg, chunkSize: 500, positionSize: 500, maxOrders: 1 };
    const proj = projectFullExit(
      [{ priceCents: 0.8, size: 200 }, { priceCents: 0.6, size: 1000 }],
      500,
      cfg,
    );
    expect(proj.totalSharesFilled).toBe(500);
    expect(proj.fills.length).toBe(2);
    expect(proj.fills[0].priceCents).toBe(0.8);
    expect(proj.fills[0].shares).toBe(200);
    expect(proj.fills[1].priceCents).toBe(0.6);
    expect(proj.fills[1].shares).toBe(300);
    // Total gross: 200 × 0.008 + 300 × 0.006 = 1.60 + 1.80 = 3.40
    expect(proj.totalGrossDollars).toBeCloseTo(3.40, 2);
  });

  it('reports unfillable shares when book is exhausted', () => {
    // Position 1000, book only has 600 of bids
    const proj = projectFullExit([{ priceCents: 5, size: 600 }], 1000, baseCfg);
    expect(proj.totalSharesFilled).toBe(600);
    expect(proj.unfillableAtAnyBid).toBe(400);
  });

  it('flags hitsMaxOrders when chunks run out before drain', () => {
    const cfg: ExitConfig = { ...baseCfg, maxOrders: 1, chunkSize: 100, positionSize: 1000 };
    const proj = projectFullExit([{ priceCents: 5, size: 10000 }], 1000, cfg);
    expect(proj.totalSharesFilled).toBe(100);
    expect(proj.hitsMaxOrders).toBe(true);
  });

  it('per-fill $0.01 minimum applies on tiny fills (deep-tail dust)', () => {
    // 1 share @ 1¢: raw fee = 0.07 × 1 × 0.01 × 0.99 = $0.000693 → rounded up + $0.01 minimum
    const cfg: ExitConfig = { ...baseCfg, chunkSize: 1, positionSize: 1, maxOrders: 1, minLevelSize: 1 };
    const proj = projectFullExit([{ priceCents: 1, size: 100 }], 1, cfg);
    expect(proj.fills[0].feeDollars).toBe(0.01); // hit the minimum
    expect(proj.feeRatio).toBeCloseTo(1.0, 1); // 100% effective fee rate at this size
  });

  it('approximates real P1-shape book — 5 levels, ~93k fillable', () => {
    // Shape from the real P1 exit
    const levels = [
      { priceCents: 0.8, size: 32355 },
      { priceCents: 0.6, size: 22673 },
      { priceCents: 0.4, size: 600 },
      { priceCents: 0.3, size: 7880 },
      { priceCents: 0.1, size: 30000 },
    ];
    const cfg: ExitConfig = { ...baseCfg, chunkSize: 2000, positionSize: 95000, maxOrders: 50, safetySubmittedMultiple: 1.1 };
    const proj = projectFullExit(levels, 95000, cfg);
    expect(proj.totalSharesFilled).toBe(93508); // 32355 + 22673 + 600 + 7880 + 30000
    expect(proj.unfillableAtAnyBid).toBe(1492);
    expect(proj.totalGrossDollars).toBeCloseTo(450.92, 1); // matches the real-world depth-aware ceiling
    expect(proj.totalFeesDollars).toBeGreaterThan(20);
    expect(proj.totalFeesDollars).toBeLessThan(60);
    expect(proj.netDollars).toBeGreaterThan(390);
    expect(proj.netDollars).toBeLessThan(430);
  });
});

describe('previewOnce: includes projection', () => {
  it('returns a projection alongside the single-chunk decision', async () => {
    const ob: Orderbook = { yes: [{ priceCents: 5, size: 10000 }], no: [] };
    const mock = new MockKalshiClient({ orderbookSnapshots: [ob] });
    const runner = new ExitRunner(baseCfg, mock);
    const preview = await runner.previewOnce();
    expect(preview.decision).toBeDefined();
    expect(preview.payload).toBeDefined();
    expect(preview.projection).toBeDefined();
    expect(preview.projection.totalSharesFilled).toBe(1000);
    expect(preview.projection.estimatedChunks).toBe(2);
  });
});

describe('feesIncurredDollars: accumulated from reconciled orders', () => {
  it('sums takerFeesDollars across the run', async () => {
    let n = 0;
    const client: KalshiClientLike = {
      getOrderbook: async (): Promise<Orderbook> => ({ yes: [{ priceCents: 5, size: 10000 }], no: [] }),
      createOrder: async (p) => {
        n += 1;
        return {
          orderId: `o-${n}`,
          status: 'filled' as const,
          filledCount: p.count,
          remainingCount: 0,
          takerFeesDollars: 0.17, // mock per-order fee
        };
      },
      getOrder: async () => ({ orderId: 'x', status: 'filled' as const, filledCount: 0, remainingCount: 0 }),
      cancelOrder: async () => ({ orderId: 'x', status: 'canceled' as const, filledCount: 0, remainingCount: 0 }),
      getPosition: async (): Promise<Position> => ({ ticker: 'KXTEST', side: 'yes', quantity: 1000 }),
    };
    const cfg: ExitConfig = { ...baseCfg, positionSize: 1000, chunkSize: 500, maxOrders: 2 };
    const runner = new ExitRunner(cfg, client);
    const status = await runner.run();
    expect(status.filledTotal).toBe(1000);
    expect(status.feesIncurredDollars).toBeCloseTo(0.34, 4); // 2 orders × $0.17
  });

  it('handles orders without takerFeesDollars (legacy / mock) without crashing', async () => {
    const ob: Orderbook = { yes: [{ priceCents: 5, size: 10000 }], no: [] };
    const mock = new MockKalshiClient({ orderbookSnapshots: [ob], behaviors: [{ fillCount: 500 }, { fillCount: 500 }] });
    const cfg: ExitConfig = { ...baseCfg, positionSize: 1000, chunkSize: 500, maxOrders: 2 };
    const runner = new ExitRunner(cfg, mock);
    const status = await runner.run();
    expect(status.feesIncurredDollars).toBe(0); // no fee data → stays 0, no NaN
  });
});
