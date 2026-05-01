import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { combinedSellLevels, decideLosingExitOrder, selectExecutablePrice } from '../src/pricing.js';
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

describe('cross-side pricing (Kalshi YES+NO=$1 matching)', () => {
  it('selling YES uses NO-side inverse when it offers a better price', () => {
    // YES bids max out at 1¢; NO bids start at 95¢ (= effective YES ask at 5¢).
    // Engine should price the YES sell at 5¢, not 1¢.
    const orderbook: Orderbook = {
      yes: [{ priceCents: 1, size: 10000 }],
      no: [{ priceCents: 95, size: 5000 }, { priceCents: 96, size: 2000 }],
    };
    const decision = decideLosingExitOrder(orderbook, 1000, cfg);
    expect(decision.priceCents).toBe(5); // 100 - 95 = 5
    expect(decision.reason).toBe('full_depth_cumulative_price');
  });

  it('selling YES uses direct YES bids when they beat the NO inverse', () => {
    // YES bids at 50¢; NO bids only at 60¢ (= YES ask at 40¢). Direct YES side wins.
    const orderbook: Orderbook = {
      yes: [{ priceCents: 50, size: 10000 }],
      no: [{ priceCents: 60, size: 10000 }],
    };
    const decision = decideLosingExitOrder(orderbook, 1000, cfg);
    expect(decision.priceCents).toBe(50);
  });

  it('selling NO uses YES-side inverse when better', () => {
    // NO bids at 1¢; YES bids at 95¢ → NO ask at 5¢.
    const orderbook: Orderbook = {
      yes: [{ priceCents: 95, size: 10000 }],
      no: [{ priceCents: 1, size: 10000 }],
    };
    const noCfg: ExitConfig = { ...cfg, heldSide: 'no' };
    const decision = decideLosingExitOrder(orderbook, 1000, noCfg);
    expect(decision.priceCents).toBe(5);
  });

  it('combinedSellLevels merges direct + inverted opposite side', () => {
    const ob: Orderbook = {
      yes: [{ priceCents: 5, size: 100 }],
      no: [{ priceCents: 90, size: 200 }],
    };
    const merged = combinedSellLevels(ob, 'yes');
    expect(merged).toEqual([
      { priceCents: 5, size: 100 },
      { priceCents: 10, size: 200 }, // 100-90
    ]);
  });
});

const obFixturePath = path.resolve(__dirname, 'fixtures', 'orderbook.real.json');

describe('decideLosingExitOrder against real prod orderbook fixture', () => {
  const exists = fs.existsSync(obFixturePath);
  const fixture = exists ? JSON.parse(fs.readFileSync(obFixturePath, 'utf8')) : null;
  const isLiquid = exists && (fixture?.orderbook_fp?.yes_dollars?.length ?? 0) > 0;

  it.skipIf(!isLiquid)('prices a sell-YES via the NO side, beating raw YES bids', () => {
    const ob = parseOrderbookResponse(fixture);
    // Raw YES bids in the prod fixture are sub-cent (mostly round to 0–1¢).
    // The NO side has bids at 95.1¢+ → effective YES asks at 4.9¢ and below.
    // Engine should pick the NO-inverse side and price >= 4¢.
    const exitCfg: ExitConfig = { ...cfg, tailSweepThreshold: 0, minLevelSize: 1 };
    const decision = decideLosingExitOrder(ob, 100, exitCfg);
    expect(decision.priceCents).toBeGreaterThanOrEqual(4);
    expect(decision.reason).toBe('full_depth_cumulative_price');
  });
});
