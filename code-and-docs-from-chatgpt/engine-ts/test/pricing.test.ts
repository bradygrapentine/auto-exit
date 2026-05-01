import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSellPayload, decideLosingExitOrder, selectExecutablePrice } from '../src/pricing.js';
import { parseOrderbookResponse } from '../src/kalshiClient.js';
import type { ExitConfig, Orderbook } from '../src/types.js';

const cfg: ExitConfig = {
  baseUrl: 'https://example.test',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 1000,
  chunkSize: 500,
  floorPriceCents: 1,
  orderbookDepth: 20,
  minLevelSize: 50,
  tailSweepThreshold: 500,
  mildAdaptive: false,
  minAdaptiveChunk: 100,
  maxOrders: 1000,
  loopDelayMs: 0,
  dryRun: true,
  killSwitchPath: './STOP',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
};

describe('pricing', () => {
  it('uses cumulative depth to choose one executable price', () => {
    const result = selectExecutablePrice([
      { priceCents: 3, size: 100 },
      { priceCents: 2, size: 700 },
      { priceCents: 1, size: 10000 },
    ], 500, 1, 50);
    expect(result.priceCents).toBe(2);
    expect(result.reason).toBe('full_depth_cumulative_price');
  });

  it('filters tiny liquidity levels', () => {
    const result = selectExecutablePrice([
      { priceCents: 4, size: 2 },
      { priceCents: 3, size: 20 },
      { priceCents: 2, size: 500 },
    ], 500, 1, 50);
    expect(result.priceCents).toBe(2);
  });

  it('falls back to floor when depth is insufficient', () => {
    const result = selectExecutablePrice([{ priceCents: 3, size: 100 }], 500, 1, 50);
    expect(result.priceCents).toBe(1);
  });

  it('tail sweeps at floor', () => {
    const decision = decideLosingExitOrder({ yes: [{ priceCents: 3, size: 1000 }], no: [] }, 300, cfg);
    expect(decision.reason).toBe('final_tail_sweep');
    expect(decision.priceCents).toBe(1);
  });
});

describe('direct-side pricing (Kalshi sells match same-side bids only, not cross-side)', () => {
  it('selling YES prices at the highest YES bid that supports the chunk', () => {
    const orderbook: Orderbook = {
      yes: [{ priceCents: 7, size: 1000 }, { priceCents: 5, size: 5000 }],
      no: [{ priceCents: 95, size: 100000 }], // present but irrelevant for sells
    };
    const decision = decideLosingExitOrder(orderbook, 800, cfg);
    expect(decision.priceCents).toBe(7);
  });

  it('selling YES does NOT use NO bids (no cross-matching for sells)', () => {
    // YES has no usable bids. NO has plenty. Engine should fall through to floor, not invert NO.
    const orderbook: Orderbook = {
      yes: [],
      no: [{ priceCents: 95, size: 100000 }],
    };
    const decision = decideLosingExitOrder(orderbook, 800, cfg);
    expect(decision.priceCents).toBe(cfg.floorPriceCents); // floor, not 5 (would be inverse)
    expect(decision.reason).toBe('fallback_floor_price_insufficient_depth');
  });

  it('preserves sub-cent precision through to the payload (deci-cent)', () => {
    const subCentCfg: ExitConfig = { ...cfg, floorPriceCents: 0, tailSweepThreshold: 0 };
    const orderbook: Orderbook = {
      yes: [{ priceCents: 0.9, size: 5000 }],
      no: [],
    };
    const decision = decideLosingExitOrder(orderbook, 100, subCentCfg);
    expect(decision.priceCents).toBe(0); // floored display
    expect(decision.priceCentsExact).toBeCloseTo(0.9, 4);
    expect(decision.priceDollars).toBe('0.0090');
  });

  it('buildSellPayload uses yes_price_dollars (string), not yes_price (integer)', () => {
    const subCentCfg: ExitConfig = { ...cfg, floorPriceCents: 0, tailSweepThreshold: 0 };
    const orderbook: Orderbook = {
      yes: [{ priceCents: 0.9, size: 5000 }],
      no: [],
    };
    const decision = decideLosingExitOrder(orderbook, 100, subCentCfg);
    const payload = buildSellPayload(subCentCfg, decision);
    expect(payload.yes_price_dollars).toBe('0.0090');
    expect(payload.yes_price).toBeUndefined();
    expect(payload.reduce_only).toBe(true);
    expect(payload.time_in_force).toBe('immediate_or_cancel');
  });
});

const obFixturePath = path.resolve(__dirname, 'fixtures', 'orderbook.real.json');

describe('decideLosingExitOrder against real prod orderbook fixture', () => {
  const exists = fs.existsSync(obFixturePath);
  const fixture = exists ? JSON.parse(fs.readFileSync(obFixturePath, 'utf8')) : null;
  const isLiquid = exists && (fixture?.orderbook_fp?.yes_dollars?.length ?? 0) > 0;

  it.skipIf(!isLiquid)('prices a sell-YES at the highest YES bid (sub-cent), not via NO inverse', () => {
    const ob = parseOrderbookResponse(fixture);
    const exitCfg: ExitConfig = { ...cfg, tailSweepThreshold: 0, minLevelSize: 1, floorPriceCents: 0 };
    const decision = decideLosingExitOrder(ob, 100, exitCfg);
    expect(decision.reason).toBe('full_depth_cumulative_price');
    const dollarValue = Number.parseFloat(decision.priceDollars);
    expect(dollarValue).toBeGreaterThan(0);
    expect(dollarValue).toBeLessThanOrEqual(0.01); // sub-cent
  });
});
