import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSellPayload, CHUNK_TOO_SMALL_REASON, decideLosingExitOrder, selectExecutablePrice } from '../src/pricing.js';
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

  it.skipIf(!isLiquid)('prices a sell-YES at the highest YES bid (no cross-side, no inversion)', () => {
    const ob = parseOrderbookResponse(fixture);
    const exitCfg: ExitConfig = { ...cfg, tailSweepThreshold: 0, minLevelSize: 1, floorPriceCents: 0 };
    const decision = decideLosingExitOrder(ob, 100, exitCfg);
    expect(decision.reason).toBe('full_depth_cumulative_price');
    // Whatever the actual top YES bid is, the engine's chosen priceCentsExact must be one of the
    // YES bid prices (not derived from NO via inversion).
    const yesBidPrices = ob.yes.map((l) => l.priceCents).sort((a, b) => b - a);
    expect(yesBidPrices).toContain(decision.priceCentsExact);
  });
});

// ── SH-MIN-CHUNK — minChunkValueDollars guard ────────────────────────────────

describe('SH-MIN-CHUNK — minChunkValueDollars guard', () => {
  // Reuse the existing top-of-file `cfg: ExitConfig`. Override per case.
  function withCfg(overrides: Partial<ExitConfig>): ExitConfig {
    return { ...cfg, ...overrides };
  }

  it('refuses chunks below minChunkValueDollars', () => {
    const config = withCfg({
      chunkSize: 1, minChunkValueDollars: 0.15, heldSide: 'yes',
      tailSweepThreshold: 0, minLevelSize: 1,
    });
    // Top yes-bid at 1¢ → chunk value = 1 × 0.01 = $0.01 ≪ $0.15.
    const book: Orderbook = {
      yes: [{ priceCents: 1, size: 100 }],
      no: [{ priceCents: 99, size: 100 }],
    };
    const decision = decideLosingExitOrder(book, 1, config);
    expect(decision.chunkSize).toBe(0);
    expect(decision.reason).toBe(CHUNK_TOO_SMALL_REASON);
    expect(Number.isFinite(decision.priceCents)).toBe(true);
  });

  it('does NOT fire when chunk value is comfortably above threshold', () => {
    const config = withCfg({
      chunkSize: 100, minChunkValueDollars: 0.15, heldSide: 'yes',
      tailSweepThreshold: 0, minLevelSize: 1,
    });
    const book: Orderbook = { yes: [{ priceCents: 50, size: 200 }], no: [] };
    const decision = decideLosingExitOrder(book, 100, config);
    expect(decision.chunkSize).toBe(100); // 100 × 0.50 = $50.00 ≫ threshold
    expect(decision.reason).not.toBe(CHUNK_TOO_SMALL_REASON);
  });

  it('uses default minChunkValueDollars=0.15 when unset', () => {
    const config = withCfg({
      chunkSize: 1, heldSide: 'yes',
      tailSweepThreshold: 0, minLevelSize: 1,
    });
    // minChunkValueDollars undefined; engine defaults to 0.15.
    const book: Orderbook = { yes: [{ priceCents: 5, size: 100 }], no: [] };
    // 1 × $0.05 = $0.05 < default 0.15 → guard fires.
    const decision = decideLosingExitOrder(book, 1, config);
    expect(decision.reason).toBe(CHUNK_TOO_SMALL_REASON);
  });

  it('disables when minChunkValueDollars=0', () => {
    const config = withCfg({
      chunkSize: 1, minChunkValueDollars: 0, heldSide: 'yes',
      tailSweepThreshold: 0, minLevelSize: 1,
    });
    const book: Orderbook = { yes: [{ priceCents: 5, size: 100 }], no: [] };
    const decision = decideLosingExitOrder(book, 1, config);
    expect(decision.chunkSize).toBe(1);
    expect(decision.reason).not.toBe(CHUNK_TOO_SMALL_REASON);
  });

  it('does not fire on tail-sweep path — tail-sweep returns earlier by design', () => {
    const config = withCfg({
      chunkSize: 1, tailSweepThreshold: 5, minChunkValueDollars: 0.15, heldSide: 'yes',
      minLevelSize: 1,
    });
    const book: Orderbook = { yes: [{ priceCents: 1, size: 100 }], no: [] };
    const decision = decideLosingExitOrder(book, 3, config); // remaining < threshold
    expect(decision.reason).toBe('final_tail_sweep');
  });

  it('does NOT mis-attribute when chooseChunkSize returns 0 (remaining=0)', () => {
    // chooseChunkSize → Math.min(config.chunkSize, remaining=0) = 0.
    // Guard's `chunkSize > 0` precondition prevents re-attributing to
    // CHUNK_TOO_SMALL_REASON.
    const config = withCfg({
      chunkSize: 100, minChunkValueDollars: 0.15, heldSide: 'yes',
      tailSweepThreshold: 0, minLevelSize: 1,
    });
    const book: Orderbook = { yes: [{ priceCents: 50, size: 200 }], no: [] };
    const decision = decideLosingExitOrder(book, 0, config);
    expect(decision.reason).not.toBe(CHUNK_TOO_SMALL_REASON);
  });
});
