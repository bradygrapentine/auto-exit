/**
 * sPrependThenSweep.test.ts — TDD suite for S15 GTC-prepend-then-sweep runner.
 *
 * All injectables (postGtcInvoke, cancelGtcInvoke, fetchFilledQty,
 * aggressiveInvoke, sleepMs) are mocked via config. getOrderbook is mocked on
 * the client. Journal is spied on to verify ordering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SPrependThenSweepRunner,
  buildSPrependThenSweepArgs,
} from '../../src/strategies/sPrependThenSweep.js';
import type {
  SPrependThenSweepConfig,
  PostGtcInvokeFn,
  CancelGtcInvokeFn,
  FetchFilledQtyFn,
  AggressiveInvokeFn,
  SleepMsFn,
} from '../../src/strategies/sPrependThenSweep.js';
import type { AggressiveConfig, AggressiveResult } from '../../src/aggressive.js';
import type { KalshiClientLike } from '../../src/types.js';
import { Journal } from '../../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn().mockResolvedValue({
      yes: [{ priceCents: 60, size: 100 }],
      no: [{ priceCents: 35, size: 100 }],
    }),
    createOrder: vi.fn(),
    getOrder: vi.fn(),
    cancelOrder: vi.fn(),
    getPositions: vi.fn(),
    getBalance: vi.fn(),
    getMarket: vi.fn(),
    getFills: vi.fn(),
    getOrders: vi.fn(),
    getSettlements: vi.fn(),
    getOrdersByMarket: vi.fn(),
    getPortfolio: vi.fn(),
    getOrderbookDepth: vi.fn(),
    getMarketHistory: vi.fn(),
    getTradeHistory: vi.fn(),
    getOrderCount: vi.fn(),
    findOrderByClientOrderId: vi.fn(),
  } as unknown as KalshiClientLike;
}

function makeJournalSpy(keaHome = '/tmp/s15-test-home'): Journal {
  const j = new Journal('test-s15-job', keaHome);
  vi.spyOn(j, 'append');
  return j;
}

function makeAggressiveResult(
  filled: number,
  reason: AggressiveResult['reason'],
): AggressiveResult {
  return { filled, orderId: `sweep-order-${reason}`, reason };
}

const BASE_CONFIG: Omit<
  SPrependThenSweepConfig,
  'postGtcInvoke' | 'cancelGtcInvoke' | 'fetchFilledQty' | 'aggressiveInvoke' | 'sleepMs'
> = {
  ticker: 'TEST-MKT',
  side: 'yes',
  action: 'sell',
  size: 100,
  prependWindowMs: 30_000,
  confirmedPrepend: true,
};

function makeInjectables(overrides: Partial<{
  postGtcInvoke: PostGtcInvokeFn;
  cancelGtcInvoke: CancelGtcInvokeFn;
  fetchFilledQty: FetchFilledQtyFn;
  aggressiveInvoke: AggressiveInvokeFn;
  sleepMs: SleepMsFn;
}> = {}) {
  return {
    postGtcInvoke: overrides.postGtcInvoke ?? vi.fn().mockResolvedValue('gtc-order-1'),
    cancelGtcInvoke: overrides.cancelGtcInvoke ?? vi.fn().mockResolvedValue(undefined),
    fetchFilledQty: overrides.fetchFilledQty ?? vi.fn().mockResolvedValue(0),
    aggressiveInvoke: overrides.aggressiveInvoke ??
      (vi.fn().mockResolvedValue(makeAggressiveResult(100, 'filled')) as AggressiveInvokeFn),
    sleepMs: overrides.sleepMs ?? vi.fn().mockResolvedValue(undefined),
  };
}

// ── 1. Validation (buildSPrependThenSweepArgs) ────────────────────────────────

describe('buildSPrependThenSweepArgs — validation', () => {
  it('returns config unchanged on valid input', () => {
    const result = buildSPrependThenSweepArgs({ ...BASE_CONFIG });
    expect(result.ticker).toBe('TEST-MKT');
    expect(result.size).toBe(100);
  });

  it('throws when ticker is empty', () => {
    expect(() =>
      buildSPrependThenSweepArgs({ ...BASE_CONFIG, ticker: '' }),
    ).toThrow('S15: ticker required');
  });

  it('throws when size is 0', () => {
    expect(() =>
      buildSPrependThenSweepArgs({ ...BASE_CONFIG, size: 0 }),
    ).toThrow('S15: size must be > 0');
  });

  it('throws when size is negative', () => {
    expect(() =>
      buildSPrependThenSweepArgs({ ...BASE_CONFIG, size: -5 }),
    ).toThrow('S15: size must be > 0');
  });

  it('throws when action is invalid', () => {
    expect(() =>
      buildSPrependThenSweepArgs({ ...BASE_CONFIG, action: 'hold' as 'buy' | 'sell' }),
    ).toThrow('S15: action must be "buy" or "sell"');
  });

  it('throws when prependWindowMs is 0', () => {
    expect(() =>
      buildSPrependThenSweepArgs({ ...BASE_CONFIG, prependWindowMs: 0 }),
    ).toThrow('S15: prependWindowMs must be > 0');
  });

  it('throws when confirmedPrepend is false', () => {
    expect(() =>
      buildSPrependThenSweepArgs({ ...BASE_CONFIG, confirmedPrepend: false }),
    ).toThrow('S15: confirmedPrepend=true required');
  });
});

// ── 2. Constructor validation (SPrependThenSweepRunner) ───────────────────────

describe('SPrependThenSweepRunner — constructor validation', () => {
  it('throws when confirmedPrepend=false', () => {
    expect(
      () => new SPrependThenSweepRunner(makeMockClient(), { ...BASE_CONFIG, confirmedPrepend: false }),
    ).toThrow('S15: confirmedPrepend=true required');
  });

  it('throws when ticker is empty', () => {
    expect(
      () => new SPrependThenSweepRunner(makeMockClient(), { ...BASE_CONFIG, ticker: '' }),
    ).toThrow('S15: ticker required');
  });

  it('throws when size <= 0', () => {
    expect(
      () => new SPrependThenSweepRunner(makeMockClient(), { ...BASE_CONFIG, size: 0 }),
    ).toThrow('S15: size must be > 0');
  });

  it('throws when prependWindowMs <= 0', () => {
    expect(
      () => new SPrependThenSweepRunner(makeMockClient(), { ...BASE_CONFIG, prependWindowMs: 0 }),
    ).toThrow('S15: prependWindowMs must be > 0');
  });
});

// ── 3. Happy path — full fill by GTC (no sweep needed) ───────────────────────

describe('SPrependThenSweepRunner — GTC fully fills (skip sweep)', () => {
  it('returns gtc_fully_filled reason and no sweep result', async () => {
    const client = makeMockClient();
    const inj = makeInjectables({
      fetchFilledQty: vi.fn().mockResolvedValue(100), // fully filled
      aggressiveInvoke: vi.fn(), // should NOT be called
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, ...inj });
    const result = await runner.run();

    expect(result.reason).toBe('gtc_fully_filled');
    expect(result.filledFromGtc).toBe(100);
    expect(result.sweep).toBeUndefined();
    expect(inj.aggressiveInvoke).not.toHaveBeenCalled();
  });

  it('calls sleepMs with prependWindowMs', async () => {
    const client = makeMockClient();
    const inj = makeInjectables({
      fetchFilledQty: vi.fn().mockResolvedValue(100),
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, prependWindowMs: 45_000, ...inj });
    await runner.run();

    expect(inj.sleepMs).toHaveBeenCalledWith(45_000);
  });
});

// ── 4. Partial fill — sweep remainder ────────────────────────────────────────

describe('SPrependThenSweepRunner — partial GTC fill → sweep remainder', () => {
  it('sweeps only the unfilled remainder (size − filledFromGtc)', async () => {
    const client = makeMockClient();
    const aggressiveInvoke = vi.fn().mockResolvedValue(makeAggressiveResult(60, 'filled')) as AggressiveInvokeFn;
    const inj = makeInjectables({
      fetchFilledQty: vi.fn().mockResolvedValue(40), // 40 filled by GTC
      aggressiveInvoke,
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, size: 100, ...inj });
    const result = await runner.run();

    const aggressiveCalls = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock
      .calls as [AggressiveConfig][];
    expect(aggressiveCalls[0][0].size).toBe(60); // 100 - 40
    expect(result.filledFromGtc).toBe(40);
    expect(result.sweep?.filled).toBe(60);
    expect(result.reason).toBe('complete');
  });

  it('sweep config inherits ticker + side + action', async () => {
    const client = makeMockClient();
    const aggressiveInvoke = vi.fn().mockResolvedValue(makeAggressiveResult(100, 'filled')) as AggressiveInvokeFn;
    const inj = makeInjectables({
      fetchFilledQty: vi.fn().mockResolvedValue(0),
      aggressiveInvoke,
    });

    const runner = new SPrependThenSweepRunner(client, {
      ...BASE_CONFIG,
      ticker: 'SWEEP-MKT',
      side: 'yes',
      action: 'sell',
      ...inj,
    });
    await runner.run();

    const aggressiveCalls = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock
      .calls as [AggressiveConfig][];
    expect(aggressiveCalls[0][0]).toMatchObject({
      ticker: 'SWEEP-MKT',
      side: 'yes',
      action: 'sell',
      confirmedAggressive: true,
    });
  });

  it('sweep reason=sweep_partial when aggressive returns partial', async () => {
    const client = makeMockClient();
    const inj = makeInjectables({
      fetchFilledQty: vi.fn().mockResolvedValue(0),
      aggressiveInvoke: vi.fn().mockResolvedValue(makeAggressiveResult(50, 'partial')),
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, ...inj });
    const result = await runner.run();

    expect(result.reason).toBe('sweep_partial');
  });

  it('forwarded oneTickIn=true to sweep config', async () => {
    const client = makeMockClient();
    const aggressiveInvoke = vi.fn().mockResolvedValue(makeAggressiveResult(100, 'filled')) as AggressiveInvokeFn;
    const inj = makeInjectables({
      fetchFilledQty: vi.fn().mockResolvedValue(0),
      aggressiveInvoke,
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, oneTickIn: true, ...inj });
    await runner.run();

    const aggressiveCalls = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock
      .calls as [AggressiveConfig][];
    expect(aggressiveCalls[0][0].oneTickIn).toBe(true);
  });
});

// ── 5. GTC price computation ──────────────────────────────────────────────────

describe('SPrependThenSweepRunner — GTC price (ask−1¢ sell, bid+1¢ buy)', () => {
  it('sell: posts GTC at ask−1¢ (yes-side best ask minus 1)', async () => {
    const client = makeMockClient();
    // yes book: [60], no book: [35] → ask=60, GTC price = 59
    (client.getOrderbook as ReturnType<typeof vi.fn>).mockResolvedValue({
      yes: [{ priceCents: 60, size: 100 }],
      no: [{ priceCents: 35, size: 100 }],
    });

    const postGtcInvoke = vi.fn().mockResolvedValue('gtc-order-1') as PostGtcInvokeFn;
    const inj = makeInjectables({ postGtcInvoke });

    const runner = new SPrependThenSweepRunner(client, {
      ...BASE_CONFIG,
      action: 'sell',
      ...inj,
    });
    await runner.run();

    const calls = (postGtcInvoke as ReturnType<typeof vi.fn>).mock.calls;
    // postGtcInvoke(ticker, side, action, priceCents, size)
    expect(calls[0][3]).toBe(59); // ask=60, gtcPrice=59
  });

  it('buy: posts GTC at implied-bid+1¢', async () => {
    const client = makeMockClient();
    // no book: [40] → implied yes bid = 100−40 = 60; GTC price = 61
    (client.getOrderbook as ReturnType<typeof vi.fn>).mockResolvedValue({
      yes: [{ priceCents: 65, size: 100 }],
      no: [{ priceCents: 40, size: 100 }],
    });

    const postGtcInvoke = vi.fn().mockResolvedValue('gtc-order-1') as PostGtcInvokeFn;
    const inj = makeInjectables({ postGtcInvoke });

    const runner = new SPrependThenSweepRunner(client, {
      ...BASE_CONFIG,
      action: 'buy',
      ...inj,
    });
    await runner.run();

    const calls = (postGtcInvoke as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][3]).toBe(61); // implied bid = 100−40=60, gtcPrice = 61
  });

  it('sell: clamps GTC price to minimum of 1', async () => {
    const client = makeMockClient();
    (client.getOrderbook as ReturnType<typeof vi.fn>).mockResolvedValue({
      yes: [{ priceCents: 1, size: 100 }],
      no: [{ priceCents: 35, size: 100 }],
    });

    const postGtcInvoke = vi.fn().mockResolvedValue('gtc-order-1') as PostGtcInvokeFn;
    const inj = makeInjectables({ postGtcInvoke });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, action: 'sell', ...inj });
    await runner.run();

    const calls = (postGtcInvoke as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][3]).toBe(1); // clamped from 0
  });
});

// ── 6. Cancel-race safety (post-cancel getOrder confirmation) ─────────────────

describe('SPrependThenSweepRunner — cancel race safety', () => {
  it('sizes sweep off post-cancel confirmed fill, not pre-cancel snapshot', async () => {
    // Simulates race: cancel succeeds but order had actually filled 80 mid-cancel.
    const client = makeMockClient();
    let fetchCallCount = 0;
    const fetchFilledQty: FetchFilledQtyFn = vi.fn().mockImplementation(async () => {
      fetchCallCount++;
      return 80; // authoritative post-cancel fill
    });

    const aggressiveInvoke = vi.fn().mockResolvedValue(makeAggressiveResult(20, 'filled')) as AggressiveInvokeFn;
    const inj = makeInjectables({ fetchFilledQty, aggressiveInvoke });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, size: 100, ...inj });
    const result = await runner.run();

    expect(fetchCallCount).toBe(1); // post-cancel confirmation called
    const aggressiveCalls = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock
      .calls as [AggressiveConfig][];
    expect(aggressiveCalls[0][0].size).toBe(20); // 100 − 80 (authoritative)
    expect(result.filledFromGtc).toBe(80);
  });

  it('calls cancelGtcInvoke with the gtcOrderId from postGtcInvoke', async () => {
    const client = makeMockClient();
    const cancelGtcInvoke = vi.fn().mockResolvedValue(undefined) as CancelGtcInvokeFn;
    const inj = makeInjectables({
      postGtcInvoke: vi.fn().mockResolvedValue('my-gtc-order-xyz'),
      cancelGtcInvoke,
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, ...inj });
    await runner.run();

    expect(cancelGtcInvoke).toHaveBeenCalledWith('my-gtc-order-xyz');
  });
});

// ── 7. Cancel failure halts run ───────────────────────────────────────────────

describe('SPrependThenSweepRunner — cancel failure halts', () => {
  it('throws when cancelGtcInvoke rejects, no sweep called', async () => {
    const client = makeMockClient();
    const aggressiveInvoke = vi.fn() as AggressiveInvokeFn;
    const inj = makeInjectables({
      cancelGtcInvoke: vi.fn().mockRejectedValue(new Error('cancel failed: server error')),
      aggressiveInvoke,
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, ...inj });
    await expect(runner.run()).rejects.toThrow('cancel failed: server error');
    expect(aggressiveInvoke).not.toHaveBeenCalled();
  });

  it('throws when fetchFilledQty rejects after cancel', async () => {
    const client = makeMockClient();
    const aggressiveInvoke = vi.fn() as AggressiveInvokeFn;
    const inj = makeInjectables({
      cancelGtcInvoke: vi.fn().mockResolvedValue(undefined),
      fetchFilledQty: vi.fn().mockRejectedValue(new Error('getOrder timeout')),
      aggressiveInvoke,
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, ...inj });
    await expect(runner.run()).rejects.toThrow('getOrder timeout');
    expect(aggressiveInvoke).not.toHaveBeenCalled();
  });
});

// ── 8. Journal ordering ───────────────────────────────────────────────────────

describe('SPrependThenSweepRunner — journal ordering', () => {
  it('full partial fill: prepend_posted → prepend_window_expired → prepend_cancelled → prepend_sweep_started → prepend_then_sweep_complete', async () => {
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const client = makeMockClient();
    const inj = makeInjectables({
      fetchFilledQty: vi.fn().mockResolvedValue(30),
      aggressiveInvoke: vi.fn().mockResolvedValue(makeAggressiveResult(70, 'filled')),
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, ...inj }, journal);
    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0]);
    expect(kinds).toEqual([
      'prepend_posted',
      'prepend_window_expired',
      'prepend_cancelled',
      'prepend_sweep_started',
      'prepend_then_sweep_complete',
    ]);
  });

  it('full GTC fill: prepend_posted → prepend_window_expired → prepend_cancelled → prepend_then_sweep_complete (no sweep_started)', async () => {
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const client = makeMockClient();
    const inj = makeInjectables({
      fetchFilledQty: vi.fn().mockResolvedValue(100),
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, ...inj }, journal);
    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0]);
    expect(kinds).toEqual([
      'prepend_posted',
      'prepend_window_expired',
      'prepend_cancelled',
      'prepend_then_sweep_complete',
    ]);
  });

  it('cancel failure: prepend_posted → prepend_window_expired → prepend_cancel_failed', async () => {
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const client = makeMockClient();
    const inj = makeInjectables({
      cancelGtcInvoke: vi.fn().mockRejectedValue(new Error('fail')),
    });

    const runner = new SPrependThenSweepRunner(client, { ...BASE_CONFIG, ...inj }, journal);
    await expect(runner.run()).rejects.toThrow();

    const kinds = appendSpy.mock.calls.map((c) => c[0]);
    expect(kinds).toEqual([
      'prepend_posted',
      'prepend_window_expired',
      'prepend_cancel_failed',
    ]);
  });
});

// ── 9. Buy-side (action=buy) ──────────────────────────────────────────────────

describe('SPrependThenSweepRunner — buy side', () => {
  it('full buy-side run completes with sweep', async () => {
    const client = makeMockClient();
    (client.getOrderbook as ReturnType<typeof vi.fn>).mockResolvedValue({
      yes: [{ priceCents: 65, size: 100 }],
      no: [{ priceCents: 30, size: 100 }],
    });

    const inj = makeInjectables({
      fetchFilledQty: vi.fn().mockResolvedValue(0),
      aggressiveInvoke: vi.fn().mockResolvedValue(makeAggressiveResult(50, 'filled')),
    });

    const runner = new SPrependThenSweepRunner(client, {
      ...BASE_CONFIG,
      action: 'buy',
      side: 'no',
      ...inj,
    });
    const result = await runner.run();

    expect(result.sweep?.filled).toBe(50);
    expect(result.reason).toBe('complete');
  });
});
