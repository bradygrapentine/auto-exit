import { describe, expect, it } from 'vitest';
import { decideLosingExitOrder, selectExecutablePrice } from '../src/pricing.js';
import type { ExitConfig } from '../src/types.js';

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
