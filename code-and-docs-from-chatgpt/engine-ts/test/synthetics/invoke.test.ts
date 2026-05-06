import { describe, it, expect, vi } from 'vitest';
import { buildExitConfig, invokeFire } from '../../src/synthetics/invoke.js';
import type { Synthetic, ExitConfig } from '../../src/types.js';

const cfgTemplate: Partial<ExitConfig> = {
  baseUrl: 'https://api.elections.kalshi.com/trade-api/v2',
  localServerPort: 7777,
  orderbookDepth: 20,
  minLevelSize: 1,
  tailSweepThreshold: 0,
  minAdaptiveChunk: 1,
  maxOrders: 1,
  loopDelayMs: 0,
  dryRun: false,
  killSwitchPath: './STOP',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
};

const stub = (kind: any, params: any): Synthetic => ({
  id: 's', kind, ticker: 'X', side: 'yes', positionSize: 100,
  params, state: {}, status: 'fired',
  createdAt: '2026-05-05T00:00:00Z',
  selfTradePrevention: 'taker_at_cross', autoCancelOnZeroPosition: true,
});

describe('buildExitConfig', () => {
  it('produces a complete ExitConfig from synthetic + template', () => {
    const s = stub('stop_loss', { triggerPriceCents: 30 });
    const cfg = buildExitConfig(s, cfgTemplate);
    expect(cfg.marketTicker).toBe('X');
    expect(cfg.heldSide).toBe('yes');
    expect(cfg.positionSize).toBe(100);
    expect(cfg.chunkSize).toBe(100);
    expect(cfg.orderTimeInForce).toBe('immediate_or_cancel');
    expect(cfg.floorPriceCents).toBe(1);
    expect(cfg.tailGtcOnFinish).toBe(true);
    expect(cfg.baseUrl).toContain('kalshi');
    expect(cfg.localServerPort).toBe(7777);
  });

  it('throws if template missing required keys', () => {
    const s = stub('stop_loss', { triggerPriceCents: 30 });
    expect(() => buildExitConfig(s, {})).toThrow(/template missing/i);
  });
});

describe('invokeFire', () => {
  it('routes stop_loss to runExit with built config', async () => {
    const runExit = vi.fn(async () => undefined);
    const postLimit = vi.fn();
    const s = stub('stop_loss', { triggerPriceCents: 30 });
    await invokeFire(s, {
      runExit, postLimit: postLimit as any,
      buildExitConfig: (ss) => buildExitConfig(ss, cfgTemplate),
    });
    expect(runExit).toHaveBeenCalledOnce();
    const cfg = (runExit.mock.calls[0][0] as any);
    expect(cfg.marketTicker).toBe('X');
  });

  it('routes stop_limit to postLimit at limitPriceCents', async () => {
    const runExit = vi.fn();
    const postLimit = vi.fn(async () => 'order-1');
    const s = stub('stop_limit', { triggerPriceCents: 30, limitPriceCents: 25, size: 100 });
    await invokeFire(s, {
      runExit: runExit as any, postLimit,
      buildExitConfig: () => ({} as any),
    });
    expect(postLimit).toHaveBeenCalledWith(expect.objectContaining({
      ticker: 'X', priceCents: 25, count: 100, action: 'sell', side: 'yes',
      selfTradePrevention: 'taker_at_cross',
    }));
  });

  it('is no-op for composite kinds (oco/bracket fire by child propagation)', async () => {
    const runExit = vi.fn();
    const postLimit = vi.fn();
    for (const kind of ['oco', 'bracket'] as const) {
      const s = stub(kind, {});
      await invokeFire(s, {
        runExit: runExit as any, postLimit: postLimit as any,
        buildExitConfig: () => ({} as any),
      });
    }
    expect(runExit).not.toHaveBeenCalled();
    expect(postLimit).not.toHaveBeenCalled();
  });
});
