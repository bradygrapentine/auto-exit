/**
 * aggressive-runtick.test.ts — Tests for AggressiveRunner.runOneTick() seam.
 *
 * Verifies that:
 *  1. runOneTick() returns { kind: 'done' } with a filled result on success.
 *  2. runOneTick() returns { kind: 'break_loop'; reason: 'empty_yes_book' } when
 *     the yes-side book is empty on a sell action.
 *  3. runOneTick() returns { kind: 'break_loop'; reason: 'empty_no_book' } when
 *     the no-side book is empty on a buy action.
 *  4. Full run() end-to-end regression — still resolves and returns AggressiveResult.
 *  5. run() re-throws empty-book break_loop as the original error messages.
 */

import { describe, it, expect, vi } from 'vitest';
import { AggressiveRunner } from '../src/aggressive.js';
import type { AggressiveConfig } from '../src/aggressive.js';
import type { KalshiClientLike, Orderbook, OrderResult } from '../src/types.js';
import { Journal } from '../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOrderbook(opts: { yesBid?: number; noBid?: number }): Orderbook {
  return {
    yes: opts.yesBid !== undefined ? [{ priceCents: opts.yesBid, size: 50 }] : [],
    no: opts.noBid !== undefined ? [{ priceCents: opts.noBid, size: 50 }] : [],
  };
}

function makeOrderResult(filled: number, total: number): OrderResult {
  return {
    orderId: 'mock-order-runtick',
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

function sellConfig(overrides: Partial<AggressiveConfig> = {}): AggressiveConfig {
  return {
    ticker: 'TICKER-YES',
    side: 'yes',
    action: 'sell',
    size: 10,
    confirmedAggressive: true,
    ...overrides,
  };
}

function buyConfig(overrides: Partial<AggressiveConfig> = {}): AggressiveConfig {
  return {
    ticker: 'TICKER-YES',
    side: 'yes',
    action: 'buy',
    size: 10,
    confirmedAggressive: true,
    ...overrides,
  };
}

// ── 1. runOneTick() → done outcome ────────────────────────────────────────────

describe('AggressiveRunner.runOneTick() — done outcome', () => {
  it('returns { kind: "done" } with filled result when book has liquidity', async () => {
    const client = makeClient({ yesBid: 72, noBid: 25, fillCount: 10 });
    const runner = new AggressiveRunner(client, sellConfig());

    const outcome = await runner.runOneTick();

    expect(outcome.kind).toBe('done');
    if (outcome.kind === 'done') {
      expect(outcome.result.filled).toBe(10);
      expect(outcome.result.orderId).toBe('mock-order-runtick');
      expect(outcome.result.reason).toBe('filled');
    }
  });

  it('returns partial reason when fill count < size', async () => {
    const client = makeClient({ yesBid: 60, noBid: 30, fillCount: 4 });
    const runner = new AggressiveRunner(client, sellConfig({ size: 10 }));

    const outcome = await runner.runOneTick();

    expect(outcome.kind).toBe('done');
    if (outcome.kind === 'done') {
      expect(outcome.result.reason).toBe('partial');
      expect(outcome.result.filled).toBe(4);
    }
  });

  it('returns unfilled reason when fill count is 0', async () => {
    const client = makeClient({ yesBid: 60, noBid: 30, fillCount: 0 });
    const runner = new AggressiveRunner(client, sellConfig());

    const outcome = await runner.runOneTick();

    expect(outcome.kind).toBe('done');
    if (outcome.kind === 'done') {
      expect(outcome.result.reason).toBe('unfilled');
    }
  });
});

// ── 2. runOneTick() → break_loop: empty yes book ──────────────────────────────

describe('AggressiveRunner.runOneTick() — break_loop: empty yes book', () => {
  it('returns { kind: "break_loop", reason: "empty_yes_book" } when yes-side is empty for sell', async () => {
    const client = makeClient({ noBid: 25 }); // no yes bids
    const runner = new AggressiveRunner(client, sellConfig());

    const outcome = await runner.runOneTick();

    expect(outcome.kind).toBe('break_loop');
    if (outcome.kind === 'break_loop') {
      expect(outcome.reason).toBe('empty_yes_book');
    }
    // order should NOT have been placed
    expect(client.createOrder).not.toHaveBeenCalled();
  });
});

// ── 3. runOneTick() → break_loop: empty no book ───────────────────────────────

describe('AggressiveRunner.runOneTick() — break_loop: empty no book', () => {
  it('returns { kind: "break_loop", reason: "empty_no_book" } when no-side is empty for buy', async () => {
    const client = makeClient({ yesBid: 72 }); // no no-bids
    const runner = new AggressiveRunner(client, buyConfig());

    const outcome = await runner.runOneTick();

    expect(outcome.kind).toBe('break_loop');
    if (outcome.kind === 'break_loop') {
      expect(outcome.reason).toBe('empty_no_book');
    }
    expect(client.createOrder).not.toHaveBeenCalled();
  });
});

// ── 4. run() end-to-end regression ───────────────────────────────────────────

describe('AggressiveRunner.run() — end-to-end regression', () => {
  it('still resolves to AggressiveResult via run() delegation to runOneTick()', async () => {
    const client = makeClient({ yesBid: 72, noBid: 25, fillCount: 10 });
    const runner = new AggressiveRunner(client, sellConfig());

    const result = await runner.run();

    expect(result.filled).toBe(10);
    expect(result.orderId).toBe('mock-order-runtick');
    expect(result.reason).toBe('filled');
    expect(client.createOrder).toHaveBeenCalledOnce();
  });

  it('run() journals aggressive_started before runOneTick() is called', async () => {
    const client = makeClient({ yesBid: 55, noBid: 40, fillCount: 5 });
    const journal = new Journal('test-runtick-job', '/tmp/aggressive-runtick-test');
    vi.spyOn(journal, 'append');

    const runner = new AggressiveRunner(client, sellConfig({ size: 5 }), journal);
    await runner.run();

    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const kinds = appendSpy.mock.calls.map((c) => c[0] as string);
    // aggressive_started must be first (emitted by run() before runOneTick())
    expect(kinds[0]).toBe('aggressive_started');
    expect(kinds).toContain('aggressive_order_placed');
    expect(kinds).toContain('aggressive_order_reconciled');
    expect(kinds).toContain('aggressive_finished');
  });
});

// ── 5. run() re-throws break_loop as original errors ─────────────────────────

describe('AggressiveRunner.run() — re-throws empty-book break as original error', () => {
  it('throws "empty yes-side book" error when sell hits empty_yes_book break', async () => {
    const client = makeClient({ noBid: 25 });
    const runner = new AggressiveRunner(client, sellConfig());

    await expect(runner.run()).rejects.toThrow(
      'S2 aggressive: empty yes-side book — cannot sell',
    );
  });

  it('throws "empty no-side book" error when buy hits empty_no_book break', async () => {
    const client = makeClient({ yesBid: 72 });
    const runner = new AggressiveRunner(client, buyConfig());

    await expect(runner.run()).rejects.toThrow(
      'S2 aggressive: empty no-side book — cannot buy',
    );
  });
});
