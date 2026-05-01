import { describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import { buildSellPayload, decideLosingExitOrder } from '../src/pricing.js';
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
  safetySubmittedMultiple: 1.5,
};

const fatBook: Orderbook = { yes: [{ priceCents: 5, size: 10000 }], no: [] };

describe('GTC payload construction', () => {
  it('sets time_in_force to good_till_canceled and drops reduce_only', () => {
    const cfg: ExitConfig = { ...baseCfg, orderTimeInForce: 'good_till_canceled' };
    const decision = decideLosingExitOrder(fatBook, 100, cfg);
    const payload = buildSellPayload(cfg, decision);
    expect(payload.time_in_force).toBe('good_till_canceled');
    expect(payload.reduce_only).toBe(false);
  });

  it('IoC default keeps reduce_only true', () => {
    const decision = decideLosingExitOrder(fatBook, 100, baseCfg);
    const payload = buildSellPayload(baseCfg, decision);
    expect(payload.time_in_force).toBe('immediate_or_cancel');
    expect(payload.reduce_only).toBe(true);
  });

  it('applies gtcMinPriceDollars as a price floor (sell never below it)', () => {
    // Top YES bid is 0.5¢ but gtcMinPriceDollars says 3¢ — payload should send 3¢.
    const cfg: ExitConfig = {
      ...baseCfg,
      orderTimeInForce: 'good_till_canceled',
      gtcMinPriceDollars: '0.0300',
    };
    const lowBookBook: Orderbook = { yes: [{ priceCents: 0.5, size: 1000 }], no: [] };
    const decision = decideLosingExitOrder(lowBookBook, 100, cfg);
    const payload = buildSellPayload(cfg, decision);
    expect(payload.yes_price_dollars).toBe('0.0300');
  });

  it('does not lower price when decision is already above gtcMinPriceDollars', () => {
    const cfg: ExitConfig = {
      ...baseCfg,
      orderTimeInForce: 'good_till_canceled',
      gtcMinPriceDollars: '0.0100',
    };
    // top YES bid 50¢ — way above floor
    const decision = decideLosingExitOrder({ yes: [{ priceCents: 50, size: 1000 }], no: [] }, 100, cfg);
    const payload = buildSellPayload(cfg, decision);
    expect(payload.yes_price_dollars).toBe('0.5000');
  });

  it('handles malformed gtcMinPriceDollars gracefully (passes through)', () => {
    const cfg: ExitConfig = {
      ...baseCfg,
      orderTimeInForce: 'good_till_canceled',
      gtcMinPriceDollars: 'not-a-number',
    };
    const decision = decideLosingExitOrder(fatBook, 100, cfg);
    const payload = buildSellPayload(cfg, decision);
    expect(payload.yes_price_dollars).toBe('0.0500');
  });
});

class RestingGtcMockClient implements KalshiClientLike {
  public createCalls = 0;
  public reconcileCalls = 0;
  async getOrderbook(): Promise<Orderbook> { return fatBook; }
  async createOrder(): Promise<OrderResult> {
    this.createCalls += 1;
    return { orderId: `gtc-${this.createCalls}`, status: 'resting', filledCount: 0, remainingCount: 500 };
  }
  async getOrder(): Promise<OrderResult> {
    this.reconcileCalls += 1;
    return { orderId: 'should-not-be-called', status: 'resting', filledCount: 0, remainingCount: 500 };
  }
  async cancelOrder(): Promise<OrderResult> {
    return { orderId: 'should-not-be-canceled', status: 'canceled', filledCount: 0, remainingCount: 500 };
  }
  async getPosition(): Promise<Position> { return { ticker: 'KXTEST', side: 'yes', quantity: 1000 }; }
}

describe('GTC runner behavior', () => {
  it('places one resting GTC order then exits the loop without reconciling', async () => {
    const client = new RestingGtcMockClient();
    const cfg: ExitConfig = { ...baseCfg, orderTimeInForce: 'good_till_canceled' };
    const runner = new ExitRunner(cfg, client);
    const status = await runner.run();
    expect(client.createCalls).toBe(1);          // exactly one order placed
    expect(client.reconcileCalls).toBe(0);       // no polling for fill
    expect(status.events.some((e) => e.message === 'gtc_order_resting_exit')).toBe(true);
    expect(status.remaining).toBe(1000);         // nothing filled — order still resting on Kalshi
    expect(status.ordersAttempted).toBe(1);
  });

  it('still reconciles when GTC order fills immediately at placement', async () => {
    // GTC + status=filled at create — engine should treat as a normal fill, not as resting
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook],
      behaviors: [{ fillCount: 500 }],
    });
    const cfg: ExitConfig = { ...baseCfg, orderTimeInForce: 'good_till_canceled', positionSize: 500, chunkSize: 500, maxOrders: 1 };
    const runner = new ExitRunner(cfg, mock);
    const status = await runner.run();
    expect(status.filledTotal).toBe(500);
    expect(status.remaining).toBe(0);
  });
});
