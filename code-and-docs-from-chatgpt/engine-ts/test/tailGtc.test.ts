import { describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { oneTickBelowCents } from '../src/pricing.js';
import type { ExitConfig, KalshiClientLike, OrderPayload, OrderResult, Orderbook, Position } from '../src/types.js';

const baseCfg: ExitConfig = {
  baseUrl: 'https://example.test',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 100,
  chunkSize: 50,
  floorPriceCents: 0.1,
  orderbookDepth: 20,
  minLevelSize: 1,
  tailSweepThreshold: 0,
  mildAdaptive: false,
  minAdaptiveChunk: 1,
  maxOrders: 1,
  loopDelayMs: 0,
  reconcilePollMs: 0,
  reconcileMaxPolls: 1,
  cancelOnStale: false,
  dryRun: false,
  killSwitchPath: '',
  apiKeyEnv: 'X',
  privateKeyPathEnv: 'Y',
  safetySubmittedMultiple: 1.5,
  // SH-MIN-CHUNK: this suite tests tail-GTC behavior, not the min-chunk
  // guard. Some fixtures use sub-cent floors × small chunks that would
  // otherwise trip the default $0.15 threshold (e.g. 50 × 0.1¢ = $0.05).
  minChunkValueDollars: 0,
};

describe('oneTickBelowCents', () => {
  it('uses 0.1¢ tick below 10¢', () => {
    expect(oneTickBelowCents(1.2, 0)).toBeCloseTo(1.1, 5);
    expect(oneTickBelowCents(0.5, 0)).toBeCloseTo(0.4, 5);
    expect(oneTickBelowCents(10, 0)).toBeCloseTo(9.9, 5);
  });

  it('uses 1¢ tick at/above 10¢', () => {
    expect(oneTickBelowCents(50, 0)).toBe(49);
    expect(oneTickBelowCents(11, 0)).toBe(10);
  });

  it('clamps to floor', () => {
    expect(oneTickBelowCents(0.1, 0.1)).toBe(0.1);
    expect(oneTickBelowCents(0.05, 0.1)).toBe(0.1);
  });
});

// Mock client that captures every order it receives.
class CapturingClient implements KalshiClientLike {
  public submitted: OrderPayload[] = [];
  public restingCount = 0;
  constructor(private orderbook: Orderbook) {}
  async getOrderbook(): Promise<Orderbook> { return this.orderbook; }
  async createOrder(payload: OrderPayload): Promise<OrderResult> {
    this.submitted.push(payload);
    // First call (main loop) → resting; second (tail GTC) → resting too
    return { orderId: `mock-${this.submitted.length}`, status: 'resting', filledCount: 0, remainingCount: payload.count };
  }
  async getOrder(): Promise<OrderResult> {
    return { orderId: 'mock-1', status: 'canceled', filledCount: 0, remainingCount: 50 };
  }
  async cancelOrder(): Promise<OrderResult> {
    return { orderId: 'mock-1', status: 'canceled', filledCount: 0, remainingCount: 50 };
  }
  async getPosition(): Promise<Position> { return { ticker: 'KXTEST', side: 'yes', quantity: 100 }; }
  async getRestingOrderCount(): Promise<number> { return this.restingCount; }
}

describe('tailGtcOnFinish: posts a resting GTC for the remainder after main loop ends', () => {
  it('posts one tick below the top opposite-side bid when no explicit price is set', async () => {
    // Top YES bid = 5¢ × 0 (none), top NO bid = 95¢ → our YES ask = 100 - 95 = 5¢ → undercut = 4.9¢
    const ob: Orderbook = {
      yes: [], // no bids — IoC main loop will not fill
      no: [{ priceCents: 95, size: 1000 }, { priceCents: 90, size: 200 }],
    };
    const client = new CapturingClient(ob);
    const cfg: ExitConfig = { ...baseCfg, tailGtcOnFinish: true, cancelOnStale: false };
    const runner = new ExitRunner(cfg, client);
    const status = await runner.run();

    // Should have at least 2 orders: the IoC attempt that didn't fill + the tail GTC
    expect(client.submitted.length).toBeGreaterThanOrEqual(2);
    const tail = client.submitted[client.submitted.length - 1];
    expect(tail.time_in_force).toBe('good_till_canceled');
    expect(tail.reduce_only).toBe(false);
    expect(tail.yes_price_dollars).toBe('0.0490'); // 4.9¢ — one 0.1¢ tick under our 5¢ ask
    expect(status.events.some((e) => e.message === 'tail_gtc_posted')).toBe(true);
  });

  it('honors explicit tailGtcPriceDollars override', async () => {
    const ob: Orderbook = {
      yes: [],
      no: [{ priceCents: 90, size: 1000 }], // would imply our ask 10¢, but we override
    };
    const client = new CapturingClient(ob);
    const cfg: ExitConfig = {
      ...baseCfg,
      tailGtcOnFinish: true,
      tailGtcPriceDollars: '0.0100', // post all at 1¢ regardless of book
      cancelOnStale: false,
    };
    const runner = new ExitRunner(cfg, client);
    await runner.run();

    const tail = client.submitted[client.submitted.length - 1];
    expect(tail.yes_price_dollars).toBe('0.0100');
    expect(tail.time_in_force).toBe('good_till_canceled');
    expect(tail.reduce_only).toBe(false);
  });

  it('skips when no opposite-side bid exists and no explicit price is set', async () => {
    const ob: Orderbook = { yes: [], no: [] };
    const client = new CapturingClient(ob);
    const cfg: ExitConfig = { ...baseCfg, tailGtcOnFinish: true, cancelOnStale: false };
    const runner = new ExitRunner(cfg, client);
    const status = await runner.run();
    expect(status.events.some((e) => e.message === 'tail_gtc_skipped_no_opposite_bid')).toBe(true);
  });

  it('does not post the tail when remaining is 0 (main loop drained the position)', async () => {
    // Fat YES bid book — main loop fills 100 shares immediately
    const ob: Orderbook = { yes: [{ priceCents: 5, size: 10000 }], no: [] };
    const client: KalshiClientLike = {
      getOrderbook: async () => ob,
      createOrder: async (p) => ({ orderId: 'x', status: 'filled', filledCount: p.count, remainingCount: 0 }),
      getOrder: async () => ({ orderId: 'x', status: 'filled', filledCount: 50, remainingCount: 0 }),
      cancelOrder: async () => ({ orderId: 'x', status: 'canceled', filledCount: 0, remainingCount: 0 }),
      getPosition: async () => ({ ticker: 'KXTEST', side: 'yes', quantity: 100 }),
      getRestingOrderCount: async () => 0,
    };
    const cfg: ExitConfig = { ...baseCfg, tailGtcOnFinish: true, chunkSize: 100, maxOrders: 1 };
    const runner = new ExitRunner(cfg, client);
    const status = await runner.run();
    expect(status.events.some((e) => e.message === 'tail_gtc_posted')).toBe(false);
    expect(status.remaining).toBe(0);
  });

  it('SKIPS the tail post when a resting order already exists for the ticker', async () => {
    // This is the regression test for the duplicate-post bug. Re-running the engine
    // while a prior tail-GTC is still resting would post a second sell, and GTC drops
    // reduce_only — both filling could flip the position short.
    //
    // The signal comes from getRestingOrderCount (queries /portfolio/orders), NOT
    // from position.restingOrdersCount which Kalshi returns as 0 even when orders
    // are actively resting.
    const ob: Orderbook = {
      yes: [],
      no: [{ priceCents: 95, size: 1000 }],
    };
    const captured: OrderPayload[] = [];
    const client: KalshiClientLike = {
      getOrderbook: async () => ob,
      createOrder: async (p) => {
        captured.push(p);
        return { orderId: `m-${captured.length}`, status: 'resting', filledCount: 0, remainingCount: p.count };
      },
      getOrder: async () => ({ orderId: 'x', status: 'canceled', filledCount: 0, remainingCount: 0 }),
      cancelOrder: async () => ({ orderId: 'x', status: 'canceled', filledCount: 0, remainingCount: 0 }),
      getPosition: async () => ({ ticker: 'KXTEST', side: 'yes', quantity: 100 }),
      // Authoritative signal: 1 resting order on this ticker from a previous run
      getRestingOrderCount: async () => 1,
    };
    const cfg: ExitConfig = {
      ...baseCfg,
      tailGtcOnFinish: true,
      tailGtcPriceDollars: '0.0100',
      cancelOnStale: false,
    };
    const runner = new ExitRunner(cfg, client);
    const status = await runner.run();

    // Main loop ran (1 IoC attempt that didn't fill), but tail post must have been blocked.
    const tailEvents = status.events.filter((e) => e.message === 'tail_gtc_posted');
    expect(tailEvents).toHaveLength(0);
    const blockedEvents = status.events.filter((e) => e.message === 'tail_gtc_skipped_existing_resting_order');
    expect(blockedEvents).toHaveLength(1);
    // No GTC payload was submitted
    const gtcSubmissions = captured.filter((p) => p.time_in_force === 'good_till_canceled');
    expect(gtcSubmissions).toHaveLength(0);
  });

  it('skips when getRestingOrderCount lookup fails before the tail post (defensive)', async () => {
    const ob: Orderbook = { yes: [], no: [{ priceCents: 95, size: 1000 }] };
    const client: KalshiClientLike = {
      getOrderbook: async () => ob,
      createOrder: async () => ({ orderId: 'm-1', status: 'resting', filledCount: 0, remainingCount: 0 }),
      getOrder: async () => ({ orderId: 'x', status: 'canceled', filledCount: 0, remainingCount: 0 }),
      cancelOrder: async () => ({ orderId: 'x', status: 'canceled', filledCount: 0, remainingCount: 0 }),
      getPosition: async () => ({ ticker: 'KXTEST', side: 'yes', quantity: 100 }),
      getRestingOrderCount: async () => { throw new Error('orders_api_unavailable'); },
    };
    const cfg: ExitConfig = {
      ...baseCfg,
      tailGtcOnFinish: true,
      tailGtcPriceDollars: '0.0100',
      cancelOnStale: false,
    };
    const runner = new ExitRunner(cfg, client);
    const status = await runner.run();

    expect(status.events.some((e) => e.message === 'tail_gtc_skipped_resting_count_lookup_failed')).toBe(true);
    expect(status.events.some((e) => e.message === 'tail_gtc_posted')).toBe(false);
  });

  it('floors fractional remainder before submitting (Kalshi rejects float count)', async () => {
    const ob: Orderbook = { yes: [], no: [{ priceCents: 95, size: 1000 }] };
    const captured: OrderPayload[] = [];
    const client: KalshiClientLike = {
      getOrderbook: async () => ob,
      createOrder: async (p) => {
        captured.push(p);
        return { orderId: `m-${captured.length}`, status: 'resting', filledCount: 0, remainingCount: p.count };
      },
      getOrder: async () => ({ orderId: 'x', status: 'canceled', filledCount: 0, remainingCount: 0 }),
      cancelOrder: async () => ({ orderId: 'x', status: 'canceled', filledCount: 0, remainingCount: 0 }),
      // Fractional position (e.g. fee dust)
      getPosition: async () => ({ ticker: 'KXTEST', side: 'yes', quantity: 1386.59 }),
      getRestingOrderCount: async () => 0,
    };
    const cfg: ExitConfig = {
      ...baseCfg,
      positionSize: 1387,
      chunkSize: 1387,
      maxOrders: 1,
      tailGtcOnFinish: true,
      tailGtcPriceDollars: '0.0100',
      preflight: true,
      safetySubmittedMultiple: 1.1,
    };
    const runner = new ExitRunner(cfg, client);
    await runner.run();
    const tail = captured[captured.length - 1];
    expect(tail.count).toBe(1386); // floored
    expect(Number.isInteger(tail.count)).toBe(true);
  });
});
