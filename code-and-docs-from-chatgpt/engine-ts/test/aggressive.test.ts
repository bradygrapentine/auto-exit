/**
 * aggressive.test.ts — TDD suite for S2 AggressiveRunner.
 *
 * 6 cases per spec:
 *  1. Sell side — full size IoC at top bid
 *  2. Buy side — full size IoC at implied ask (100 − top no-bid)
 *  3. confirmedAggressive=false → throws at construction
 *  4. oneTickIn: sell goes one tick lower, buy goes one tick higher
 *  5. Empty book on the relevant side → throws
 *  6. Journal entries appended in order
 */

import { describe, it, expect, vi } from 'vitest';
import { AggressiveRunner } from '../src/aggressive.js';
import type { AggressiveConfig } from '../src/aggressive.js';
import type { KalshiClientLike, Orderbook, OrderResult } from '../src/types.js';
import { Journal } from '../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOrderbook(opts: {
  yesBid?: number;
  noBid?: number;
}): Orderbook {
  return {
    yes: opts.yesBid !== undefined ? [{ priceCents: opts.yesBid, size: 50 }] : [],
    no: opts.noBid !== undefined ? [{ priceCents: opts.noBid, size: 50 }] : [],
  };
}

function makeOrderResult(filled: number, total: number): OrderResult {
  return {
    orderId: 'mock-order-1',
    status: filled === total ? 'filled' : filled > 0 ? 'partial' : 'resting',
    filledCount: filled,
    remainingCount: total - filled,
  };
}

function makeClient(opts: {
  yesBid?: number;
  noBid?: number;
  fillCount?: number;
}): KalshiClientLike {
  const orderbook = makeOrderbook({ yesBid: opts.yesBid, noBid: opts.noBid });
  const filled = opts.fillCount ?? 10;
  return {
    getOrderbook: vi.fn().mockResolvedValue(orderbook),
    createOrder: vi.fn().mockResolvedValue(makeOrderResult(filled, 10)),
    getOrder: vi.fn(),
    cancelOrder: vi.fn(),
    getPosition: vi.fn(),
    getRestingOrderCount: vi.fn(),
    findOrderByClientOrderId: vi.fn(),
  };
}

function makeJournal(keaHome = '/tmp/aggressive-test-home'): Journal {
  const j = new Journal('test-aggressive-job', keaHome);
  vi.spyOn(j, 'append');
  return j;
}

// ── 1. Sell side — IoC at top bid ─────────────────────────────────────────────

describe('AggressiveRunner — sell side', () => {
  it('posts one IoC order at top YES bid for full size', async () => {
    const client = makeClient({ yesBid: 72, noBid: 25 });
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'sell',
      size: 10,
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config);
    const result = await runner.run();

    expect(client.createOrder).toHaveBeenCalledOnce();
    const payload = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload.action).toBe('sell');
    expect(payload.yes_price).toBe(72);
    expect(payload.count).toBe(10);
    expect(payload.time_in_force).toBe('immediate_or_cancel');
    expect(result.reason).toBe('filled');
  });
});

// ── 2. Buy side — IoC at implied ask ──────────────────────────────────────────

describe('AggressiveRunner — buy side', () => {
  it('posts one IoC order at implied ask (100 − top no-bid) for full size', async () => {
    const client = makeClient({ yesBid: 72, noBid: 25 });
    // implied YES ask = 100 - 25 = 75
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'buy',
      size: 10,
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config);
    await runner.run();

    expect(client.createOrder).toHaveBeenCalledOnce();
    const payload = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload.action).toBe('buy');
    expect(payload.yes_price).toBe(75);  // 100 - 25
    expect(payload.count).toBe(10);
    expect(payload.time_in_force).toBe('immediate_or_cancel');
  });
});

// ── 3. confirmedAggressive=false throws ───────────────────────────────────────

describe('AggressiveRunner — confirmation gate', () => {
  it('throws at construction when confirmedAggressive is false', () => {
    const client = makeClient({ yesBid: 72 });
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'sell',
      size: 10,
      confirmedAggressive: false,
    };
    expect(() => new AggressiveRunner(client, config)).toThrow(
      'S2 aggressive requires confirmedAggressive=true',
    );
  });
});

// ── 4. oneTickIn adjustments ──────────────────────────────────────────────────

describe('AggressiveRunner — oneTickIn', () => {
  it('sell with oneTickIn goes one tick below top bid', async () => {
    const client = makeClient({ yesBid: 72, noBid: 25 });
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'sell',
      size: 5,
      confirmedAggressive: true,
      oneTickIn: true,
    };
    const runner = new AggressiveRunner(client, config);
    await runner.run();

    const payload = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload.yes_price).toBe(71); // 72 - 1
  });

  it('buy with oneTickIn goes one tick above implied ask', async () => {
    const client = makeClient({ yesBid: 72, noBid: 25 });
    // implied ask = 100 - 25 = 75; +1 = 76
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'buy',
      size: 5,
      confirmedAggressive: true,
      oneTickIn: true,
    };
    const runner = new AggressiveRunner(client, config);
    await runner.run();

    const payload = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload.yes_price).toBe(76); // 75 + 1
  });
});

// ── 4b. Float-imprecision rounding (SH-AGGRESSIVE-FLOAT-CENTS) ────────────────

describe('AggressiveRunner — float-cents rounding', () => {
  it('rounds IEEE-754 imprecise prices to integer for sell side', async () => {
    // Top YES bid arrives as 6.000000000000001 (e.g. orderbook math artifact).
    // Without rounding, Kalshi rejects: "cannot unmarshal number into Go int".
    const client = makeClient({ yesBid: 6.000000000000001, noBid: 25 });
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'sell',
      size: 10,
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config);
    await runner.run();

    const payload = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Number.isInteger(payload.yes_price)).toBe(true);
    expect(payload.yes_price).toBe(6);
  });

  it('rounds IEEE-754 imprecise prices to integer for buy side', async () => {
    // Top NO bid arrives as 25.000000000000004 → implied YES ask = 74.999...
    // Math.round → 75 (integer).
    const client = makeClient({ yesBid: 6, noBid: 25.000000000000004 });
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'buy',
      size: 10,
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config);
    await runner.run();

    const payload = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Number.isInteger(payload.yes_price)).toBe(true);
    expect(payload.yes_price).toBe(75);
  });

  it('rounds price for side=no orders (no_price field)', async () => {
    // Sell-NO action: limit pulled from top YES bid (6.0000...001), assigned
    // to no_price field. Must be integer.
    const client = makeClient({ yesBid: 6.000000000000001, noBid: 25 });
    const config: AggressiveConfig = {
      ticker: 'TICKER-NO',
      side: 'no',
      action: 'sell',
      size: 10,
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config);
    await runner.run();

    const payload = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Number.isInteger(payload.no_price)).toBe(true);
    expect(payload.no_price).toBe(6);
    expect(payload.yes_price).toBeUndefined();
  });
});

// ── 5. Empty book throws ──────────────────────────────────────────────────────

describe('AggressiveRunner — empty book guard', () => {
  it('throws descriptive error when yes-side book is empty for sell', async () => {
    const client = makeClient({ noBid: 25 }); // no yes bids
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'sell',
      size: 5,
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config);
    await expect(runner.run()).rejects.toThrow(
      'S2 aggressive: empty yes-side book — cannot sell',
    );
  });

  it('throws descriptive error when no-side book is empty for buy', async () => {
    const client = makeClient({ yesBid: 72 }); // no no-bids
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'buy',
      size: 5,
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config);
    await expect(runner.run()).rejects.toThrow(
      'S2 aggressive: empty no-side book — cannot buy',
    );
  });
});

// ── 5b. SH-DEPTH-WALK-STALE-SNAPSHOT — pre-trade liveness ────────────────────

describe('AggressiveRunner — pre-trade liveness (SH-DEPTH-WALK-STALE-SNAPSHOT)', () => {
  it('rejects sized trade when fresh book shows projected level vanished', async () => {
    // MOVVA replay: first fetch shows 12,000@93¢ NO bid. Between projection and
    // submission, that resting size is pulled — fresh fetch shows 100@93¢. The
    // runner must abort rather than walk through a collapsed book.
    const firstBook: Orderbook = { yes: [{ priceCents: 93, size: 12_000 }], no: [] };
    const freshBook: Orderbook = { yes: [{ priceCents: 93, size: 100 }], no: [] };
    const getOrderbook = vi.fn()
      .mockResolvedValueOnce(firstBook)
      .mockResolvedValueOnce(freshBook);
    const client: KalshiClientLike = {
      getOrderbook,
      createOrder: vi.fn(),
      getOrder: vi.fn(),
      cancelOrder: vi.fn(),
      getPosition: vi.fn(),
      getRestingOrderCount: vi.fn(),
      findOrderByClientOrderId: vi.fn(),
    };
    const config: AggressiveConfig = {
      ticker: 'KX-MOVVA',
      side: 'yes',
      action: 'sell',
      size: 12_000, // >= default livenessGateSize (100)
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config);
    const outcome = await runner.runOneTick();

    expect(outcome.kind).toBe('break_loop');
    if (outcome.kind === 'break_loop') {
      expect(outcome.reason).toBe('liveness_rejected:size_collapsed');
    }
    expect(client.createOrder).not.toHaveBeenCalled();
    expect(getOrderbook).toHaveBeenCalledTimes(2);
  });

  it('skips liveness gate for small trades below livenessGateSize', async () => {
    // size 10 (default tests) is below the 100-contract gate — no second fetch,
    // order goes through as before. Pin the no-regression behaviour.
    const client = makeClient({ yesBid: 72, noBid: 25 });
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'sell',
      size: 10,
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config);
    await runner.run();
    expect((client.getOrderbook as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    expect(client.createOrder).toHaveBeenCalledOnce();
  });

  it('honors livenessCheckEnabled=false (operator opt-out for backtests)', async () => {
    const client = makeClient({ yesBid: 72, noBid: 25 });
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'sell',
      size: 5_000,
      confirmedAggressive: true,
      livenessCheckEnabled: false,
    };
    const runner = new AggressiveRunner(client, config);
    await runner.run();
    expect((client.getOrderbook as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    expect(client.createOrder).toHaveBeenCalledOnce();
  });
});

// ── 6. Journal entries ────────────────────────────────────────────────────────

describe('AggressiveRunner — journal entries', () => {
  it('appends aggressive_started, aggressive_order_placed, aggressive_order_reconciled, aggressive_finished in order', async () => {
    const client = makeClient({ yesBid: 72, noBid: 25, fillCount: 10 });
    const journal = makeJournal('/tmp/aggressive-journal-test');
    const config: AggressiveConfig = {
      ticker: 'TICKER-YES',
      side: 'yes',
      action: 'sell',
      size: 10,
      confirmedAggressive: true,
    };
    const runner = new AggressiveRunner(client, config, journal);
    await runner.run();

    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const kinds = appendSpy.mock.calls.map((c) => c[0] as string);
    expect(kinds).toEqual([
      'aggressive_started',
      'aggressive_order_placed',
      'aggressive_order_reconciled',
      'aggressive_finished',
    ]);
  });
});
