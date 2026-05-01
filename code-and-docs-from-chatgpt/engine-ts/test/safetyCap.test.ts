import { describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import { chooseChunkSize, normalizeLevels } from '../src/pricing.js';
import type { ExitConfig, Orderbook } from '../src/types.js';

const baseCfg: ExitConfig = {
  baseUrl: 'https://example.test',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 100,
  chunkSize: 50,
  floorPriceCents: 1,
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
  killSwitchPath: './STOP_NONEXISTENT',
  apiKeyEnv: 'X',
  privateKeyPathEnv: 'Y',
  safetySubmittedMultiple: 1.5,
};

const liquidBook: Orderbook = {
  yes: [{ priceCents: 5, size: 10000 }],
  no: [],
};

describe('runtime safetySubmittedMultiple cap (defends against parser misreads)', () => {
  it('halts with safety_submitted_cap_reached when total submitted exceeds positionSize * multiple', async () => {
    // Scenario: parser bug — orders come back "filled" but we report filledCount=0, so the engine
    // would re-submit indefinitely. With multiple=1.5 and positionSize=100, the cap is 150.
    // chunkSize=50 means we can submit at most 3 chunks before tripping the cap.
    const mock = new MockKalshiClient({
      orderbookSnapshots: Array.from({ length: 10 }, () => liquidBook),
      // All orders return filled but with filledCount=0 — simulates the parser bug fixed in 8355645.
      // (We achieve this by reporting "canceled" status with no fill, which the engine treats the same.)
      behaviors: Array.from({ length: 10 }, () => ({ fillCount: 0 })),
    });
    const runner = new ExitRunner({ ...baseCfg, maxOrders: 50 }, mock);
    // Bypass the config-validation cap; simulate the runtime cap firing with a generous maxOrders.
    const status = await runner.run();
    expect(status.submittedTotal).toBe(150); // positionSize 100 * multiple 1.5
    expect(status.events.some((e) => e.message === 'safety_submitted_cap_reached')).toBe(true);
    expect(status.remaining).toBe(100); // nothing actually filled
  });

  it('does not trip when fills are reported correctly', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: Array.from({ length: 5 }, () => liquidBook),
      behaviors: [{ fillCount: 50 }, { fillCount: 50 }],
    });
    const runner = new ExitRunner(baseCfg, mock);
    const status = await runner.run();
    expect(status.filledTotal).toBe(100);
    expect(status.remaining).toBe(0);
    expect(status.events.some((e) => e.message === 'safety_submitted_cap_reached')).toBe(false);
  });
});

describe('chooseChunkSize adaptive path', () => {
  it('uses min(chunkSize, floor(topSize * 0.8)) when mildAdaptive is true', () => {
    const cfg: ExitConfig = { ...baseCfg, mildAdaptive: true, minAdaptiveChunk: 5 };
    const levels = [{ priceCents: 5, size: 100 }]; // topSize=100, 0.8*100=80
    const chosen = chooseChunkSize(200, cfg, levels);
    expect(chosen).toBe(50); // capped to chunkSize=50
  });

  it('clamps adaptive chunk to minAdaptiveChunk floor', () => {
    const cfg: ExitConfig = { ...baseCfg, mildAdaptive: true, minAdaptiveChunk: 30, chunkSize: 50 };
    const levels = [{ priceCents: 5, size: 10 }]; // 0.8*10 = 8 < 30 → clamps to 30
    const chosen = chooseChunkSize(200, cfg, levels);
    expect(chosen).toBe(30);
  });

  it('returns remaining when remaining is below tailSweepThreshold', () => {
    const cfg: ExitConfig = { ...baseCfg, tailSweepThreshold: 100 };
    const chosen = chooseChunkSize(50, cfg, [{ priceCents: 5, size: 1000 }]);
    expect(chosen).toBe(50);
  });
});

describe('normalizeLevels filters', () => {
  it('drops zero-or-negative prices', () => {
    const got = normalizeLevels([
      { priceCents: 0, size: 100 },
      { priceCents: -1, size: 100 },
      { priceCents: 5, size: 100 },
    ], 1);
    expect(got).toEqual([{ priceCents: 5, size: 100 }]);
  });

  it('drops prices > 99', () => {
    const got = normalizeLevels([
      { priceCents: 100, size: 100 },
      { priceCents: 99, size: 100 },
    ], 1);
    expect(got).toEqual([{ priceCents: 99, size: 100 }]);
  });

  it('drops levels with non-finite price or size', () => {
    const got = normalizeLevels([
      { priceCents: NaN, size: 100 },
      { priceCents: 5, size: Infinity },
      { priceCents: 5, size: 100 },
    ], 1);
    expect(got).toEqual([{ priceCents: 5, size: 100 }]);
  });
});

describe('buildSellPayload heldSide=no', () => {
  it('uses no_price_dollars not yes_price_dollars', async () => {
    const { buildSellPayload, decideLosingExitOrder } = await import('../src/pricing.js');
    const noCfg: ExitConfig = { ...baseCfg, heldSide: 'no', floorPriceCents: 0 };
    const ob: Orderbook = {
      yes: [],
      no: [{ priceCents: 0.7, size: 1000 }],
    };
    const decision = decideLosingExitOrder(ob, 100, noCfg);
    const payload = buildSellPayload(noCfg, decision);
    expect(payload.no_price_dollars).toBe('0.0070');
    expect(payload.yes_price_dollars).toBeUndefined();
    expect(payload.side).toBe('no');
  });
});
