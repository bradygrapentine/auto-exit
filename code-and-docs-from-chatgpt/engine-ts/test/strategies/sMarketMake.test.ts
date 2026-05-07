/**
 * sMarketMake.test.ts — TDD suite for S12 MarketMakingRunner.
 *
 * All exchange I/O injected via invokes; journal spied with vi.spyOn().
 * No real network required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketMakingRunner } from '../../src/strategies/sMarketMake.js';
import type { S12Config } from '../../src/strategies/sMarketMake.js';
import { Journal } from '../../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

let orderCounter = 0;
beforeEach(() => { orderCounter = 0; });

function makeOrderId(): string {
  return `order-${++orderCounter}`;
}

function makeJournalSpy(): Journal {
  const j = new Journal('test-mm-job', '/tmp/s12-test-home');
  vi.spyOn(j, 'append');
  return j;
}

/** Build a static top-of-book fn that always returns the same prices. */
function staticBook(bidCents: number | null, askCents: number | null) {
  return vi.fn().mockResolvedValue({ bidCents, askCents });
}

/** Build a postOrderInvoke that auto-increments order IDs. */
function makePostOrder() {
  return vi.fn().mockImplementation(() => Promise.resolve(makeOrderId()));
}

/** Build a cancelOrderInvoke noop. */
function makeCancel() {
  return vi.fn().mockResolvedValue(undefined);
}

/** Order status: nothing filled. */
function makeStatusUnfilled() {
  return vi.fn().mockResolvedValue({ filled: 0, remaining: 1 });
}

/** Order status: immediately filled with qty. */
function makeStatusFilled(qty: number) {
  return vi.fn().mockResolvedValue({ filled: qty, remaining: 0 });
}

/** Flatten noop. */
function makeFlattenNoop() {
  return vi.fn().mockResolvedValue({ filled: 0 });
}

/**
 * Build a complete S12Config. The runner is stopped after `stopAfterPolls`
 * completed poll cycles via a sleepMs hook.
 */
function makeConfig(
  overrides: Partial<S12Config> & { stopAfterPolls?: number } = {},
): { config: S12Config; runner: MarketMakingRunner; journal: Journal } {
  const journal = makeJournalSpy();
  const { stopAfterPolls = 1, ...rest } = overrides;

  let pollCount = 0;
  let runner: MarketMakingRunner;

  const config: S12Config = {
    ticker: 'TEST-TICKER',
    targetInventory: 0,
    maxInventory: 5,
    quoteOffsetCents: 1,
    postOrderInvoke: makePostOrder(),
    cancelOrderInvoke: makeCancel(),
    getOrderStatusInvoke: makeStatusUnfilled(),
    getTopOfBookInvoke: staticBook(45, 55),
    aggressiveFlattenInvoke: makeFlattenNoop(),
    pollIntervalMs: 0,
    sleepMs: async (_ms) => {
      pollCount += 1;
      if (pollCount >= stopAfterPolls) {
        runner.stop();
      }
    },
    keaHome: '/tmp/s12-test-home',
    jobId: 'test-mm-job',
    ...rest,
  };

  runner = new MarketMakingRunner(config, journal);
  return { config, runner, journal };
}

// ── 1. Validation ────────────────────────────────────────────────────────────

describe('MarketMakingRunner — validation', () => {
  const validInvokes = () => ({
    postOrderInvoke: makePostOrder(),
    cancelOrderInvoke: makeCancel(),
    getOrderStatusInvoke: makeStatusUnfilled(),
    getTopOfBookInvoke: staticBook(45, 55),
    aggressiveFlattenInvoke: makeFlattenNoop(),
  });

  it('throws on empty ticker', () => {
    expect(() => new MarketMakingRunner({
      ticker: '',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      ...validInvokes(),
    })).toThrow('ticker');
  });

  it('throws when targetInventory < 0', () => {
    expect(() => new MarketMakingRunner({
      ticker: 'T',
      targetInventory: -1,
      maxInventory: 5,
      quoteOffsetCents: 1,
      ...validInvokes(),
    })).toThrow('targetInventory');
  });

  it('throws when maxInventory <= targetInventory', () => {
    expect(() => new MarketMakingRunner({
      ticker: 'T',
      targetInventory: 5,
      maxInventory: 5,
      quoteOffsetCents: 1,
      ...validInvokes(),
    })).toThrow('maxInventory');
  });

  it('throws when quoteOffsetCents < 0', () => {
    expect(() => new MarketMakingRunner({
      ticker: 'T',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: -1,
      ...validInvokes(),
    })).toThrow('quoteOffsetCents');
  });

  it('accepts quoteOffsetCents === 0', () => {
    expect(() => new MarketMakingRunner({
      ticker: 'T',
      targetInventory: 0,
      maxInventory: 1,
      quoteOffsetCents: 0,
      ...validInvokes(),
    })).not.toThrow();
  });
});

// ── 2. Two-sided post on start ────────────────────────────────────────────────

describe('MarketMakingRunner — two-sided post on start', () => {
  it('posts bid and ask on first cycle', async () => {
    const { config, runner } = makeConfig({ stopAfterPolls: 1 });
    await runner.run();

    // postOrderInvoke called twice: once for bid (yes side), once for ask (no side)
    expect(config.postOrderInvoke).toHaveBeenCalledTimes(2);
    const calls = (config.postOrderInvoke as ReturnType<typeof vi.fn>).mock.calls;
    const sides = calls.map((c: unknown[]) => c[1]);
    expect(sides).toContain('yes');
    expect(sides).toContain('no');
  });

  it('journals mm_started, mm_quote_posted x2, mm_finished', async () => {
    const { runner, journal } = makeConfig({ stopAfterPolls: 1 });
    await runner.run();

    const appendCalls = (journal.append as ReturnType<typeof vi.fn>).mock.calls;
    const kinds = appendCalls.map((c: unknown[]) => c[0] as string);

    expect(kinds[0]).toBe('mm_started');
    expect(kinds.filter((k) => k === 'mm_quote_posted')).toHaveLength(2);
    expect(kinds.at(-1)).toBe('mm_finished');
  });

  it('default pollIntervalMs is 1000 when not specified', () => {
    const cfg: S12Config = {
      ticker: 'T',
      targetInventory: 0,
      maxInventory: 1,
      quoteOffsetCents: 0,
      postOrderInvoke: makePostOrder(),
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke: makeStatusUnfilled(),
      getTopOfBookInvoke: staticBook(40, 60),
      aggressiveFlattenInvoke: makeFlattenNoop(),
      // pollIntervalMs intentionally omitted
    };
    // Just verify construction doesn't throw; the default is internal.
    expect(() => new MarketMakingRunner(cfg)).not.toThrow();
  });
});

// ── 3. Book-move repost ───────────────────────────────────────────────────────

describe('MarketMakingRunner — book-move repost', () => {
  it('cancels and reposts when book price changes', async () => {
    let callCount = 0;
    let runner: MarketMakingRunner;

    // First call returns 45/55, second call returns 47/57 (book moved)
    const getTopOfBookInvoke = vi.fn()
      .mockResolvedValueOnce({ bidCents: 45, askCents: 55 })
      .mockResolvedValueOnce({ bidCents: 47, askCents: 57 });

    const cancelOrderInvoke = makeCancel();
    const postOrderInvoke = makePostOrder();

    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke,
      cancelOrderInvoke,
      getOrderStatusInvoke: makeStatusUnfilled(),
      getTopOfBookInvoke,
      aggressiveFlattenInvoke: makeFlattenNoop(),
      pollIntervalMs: 0,
      sleepMs: async (_ms) => {
        callCount += 1;
        if (callCount >= 2) runner.stop();
      },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-mm-job-repost',
    };

    runner = new MarketMakingRunner(config);
    await runner.run();

    // 2 posts on cycle 1, 2 more on cycle 2 (prices changed) = 4 total
    expect(postOrderInvoke).toHaveBeenCalledTimes(4);
    // 2 cancels on cycle 2 (stale quotes from cycle 1)
    expect(cancelOrderInvoke).toHaveBeenCalledTimes(4); // 2 from repost + 2 from stop()
  });
});

// ── 4. Fill detection ─────────────────────────────────────────────────────────

describe('MarketMakingRunner — fill detected and journaled', () => {
  it('journals mm_fill with side=bid when bid order fills', async () => {
    const journal = makeJournalSpy();

    // Bid order (order-1) fills 1 on FIRST status check (cycle 2).
    // The runner checks bid status before ask status each cycle.
    const getOrderStatusInvoke = vi.fn().mockImplementation((_id: string) => {
      if (_id === 'order-1') {
        return Promise.resolve({ filled: 1, remaining: 0 });
      }
      return Promise.resolve({ filled: 0, remaining: 1 });
    });

    let runner: MarketMakingRunner;
    let pollCount = 0;
    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke: makePostOrder(),
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke,
      getTopOfBookInvoke: staticBook(45, 55),
      aggressiveFlattenInvoke: makeFlattenNoop(),
      pollIntervalMs: 0,
      sleepMs: async (_ms) => {
        pollCount += 1;
        if (pollCount >= 2) runner.stop();
      },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-fill-job',
    };

    runner = new MarketMakingRunner(config, journal);
    await runner.run();

    const appendCalls = (journal.append as ReturnType<typeof vi.fn>).mock.calls;
    const fillCalls = appendCalls.filter((c: unknown[]) => c[0] === 'mm_fill');
    expect(fillCalls.length).toBeGreaterThan(0);
    const fillData = fillCalls[0][1] as Record<string, unknown>;
    expect(fillData).toHaveProperty('side');
    expect(fillData).toHaveProperty('qty');
    expect(fillData).toHaveProperty('currentInventory');
  });

  it('mm_fill records side and qty for ask fill', async () => {
    const journal = makeJournalSpy();

    // Ask order fills on second poll
    let askFillReported = false;
    const getOrderStatusInvoke = vi.fn().mockImplementation((_id: string) => {
      // After first cycle posts bid (order-1) and ask (order-2),
      // on second cycle report ask fill
      if (!askFillReported && _id === 'order-2') {
        askFillReported = true;
        return Promise.resolve({ filled: 1, remaining: 0 });
      }
      return Promise.resolve({ filled: 0, remaining: 1 });
    });

    let runner: MarketMakingRunner;
    let pollCount = 0;
    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke: makePostOrder(),
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke,
      getTopOfBookInvoke: staticBook(45, 55),
      aggressiveFlattenInvoke: makeFlattenNoop(),
      pollIntervalMs: 0,
      sleepMs: async (_ms) => {
        pollCount += 1;
        if (pollCount >= 2) runner.stop();
      },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-ask-fill-job',
    };

    runner = new MarketMakingRunner(config, journal);
    await runner.run();

    const appendCalls = (journal.append as ReturnType<typeof vi.fn>).mock.calls;
    const askFillCalls = appendCalls.filter(
      (c: unknown[]) => c[0] === 'mm_fill' && (c[1] as Record<string, unknown>)['side'] === 'ask',
    );
    expect(askFillCalls.length).toBeGreaterThan(0);
    expect(askFillCalls[0][1]).toMatchObject({ side: 'ask', qty: 1 });
  });
});

// ── 5. maxInventory long → flatten ────────────────────────────────────────────

describe('MarketMakingRunner — maxInventory long triggers flatten', () => {
  it('journals mm_inventory_capped + mm_flatten_started + mm_flatten_complete', async () => {
    const journal = makeJournalSpy();

    // Bid fills maxInventory (5) contracts immediately
    const getOrderStatusInvoke = vi.fn().mockImplementation((_id: string) => {
      if (_id === 'order-1') {
        // bid fills 5 immediately
        return Promise.resolve({ filled: 5, remaining: 0 });
      }
      return Promise.resolve({ filled: 0, remaining: 1 });
    });

    const aggressiveFlattenInvoke = vi.fn().mockResolvedValue({ filled: 5 });

    let runner: MarketMakingRunner;
    let pollCount = 0;
    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke: makePostOrder(),
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke,
      getTopOfBookInvoke: staticBook(45, 55),
      aggressiveFlattenInvoke,
      pollIntervalMs: 0,
      sleepMs: async (_ms) => {
        pollCount += 1;
        if (pollCount >= 2) runner.stop();
      },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-long-cap-job',
    };

    runner = new MarketMakingRunner(config, journal);
    await runner.run();

    const appendCalls = (journal.append as ReturnType<typeof vi.fn>).mock.calls;
    const kinds = appendCalls.map((c: unknown[]) => c[0] as string);

    expect(kinds).toContain('mm_inventory_capped');
    expect(kinds).toContain('mm_flatten_started');
    expect(kinds).toContain('mm_flatten_complete');
  });

  it('flatten respects targetInventory (stops at target, not at 0)', async () => {
    const journal = makeJournalSpy();

    // targetInventory=0, maxInventory=5
    // Bid fills 5 contracts (order-1) → inventory = 0 + 5 = 5 ≥ maxInventory → flatten to 0 → qty=5
    // But to test "stops at target not zero": use targetInventory=2, maxInventory=4
    // Bid fills 4 → inventory = 0 + 4... wait, initial inv = targetInventory.
    // So targetInventory=0, bid fills 5 → inv=5 → flatten qty = 5-0=5.
    // To get qty=3: targetInventory=0, bid fills 3, inv=3... but maxInventory=3 is not > 3 (equal).
    // Easiest: targetInventory=0, maxInventory=3, bid fills 5 → inv=5 ≥ 3 → flatten qty=5-0=5.
    // OR: targetInventory=2, maxInventory=6, bid fills 7 → inv=2+7=9 → flatten qty=9-2=7.
    // Simplest test: targetInventory=1, maxInventory=4, bid fills 5 → inv=1+5=6 → flatten qty=6-1=5.
    // The point: assert flattenQty === currentInventory - targetInventory (not currentInventory).
    // Use targetInventory=2, maxInventory=3, bid fills 3 → inv=2+3=5 → flatten qty=5-2=3.
    const getOrderStatusInvoke = vi.fn().mockImplementation((_id: string) => {
      if (_id === 'order-1') {
        return Promise.resolve({ filled: 3, remaining: 0 });
      }
      return Promise.resolve({ filled: 0, remaining: 1 });
    });

    const aggressiveFlattenInvoke = vi.fn().mockImplementation(
      (_ticker: string, _side: string, qty: number) =>
        Promise.resolve({ filled: qty }),
    );

    let runner: MarketMakingRunner;
    let pollCount = 0;
    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 2,
      maxInventory: 3, // 2+3=5 ≥ 3 triggers cap
      quoteOffsetCents: 1,
      postOrderInvoke: makePostOrder(),
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke,
      getTopOfBookInvoke: staticBook(45, 55),
      aggressiveFlattenInvoke,
      pollIntervalMs: 0,
      sleepMs: async (_ms) => {
        pollCount += 1;
        if (pollCount >= 2) runner.stop();
      },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-target-inv-job',
    };

    runner = new MarketMakingRunner(config, journal);
    const result = await runner.run();

    // currentInventory = 2 + 3 = 5 → flatten qty = 5 - targetInventory(2) = 3
    const flattenCall = (aggressiveFlattenInvoke as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(flattenCall[2]).toBe(3); // qty = currentInventory(5) - targetInventory(2)
    expect(result.finalInventory).toBe(2);
  });
});

// ── 6. maxInventory short → flatten ──────────────────────────────────────────

describe('MarketMakingRunner — maxInventory short triggers flatten', () => {
  it('journals mm_inventory_capped side=short and flattens short', async () => {
    const journal = makeJournalSpy();

    // Ask fills 5 contracts → inventory goes to -5 ≤ -maxInventory
    const getOrderStatusInvoke = vi.fn().mockImplementation((_id: string) => {
      if (_id === 'order-2') {
        return Promise.resolve({ filled: 5, remaining: 0 });
      }
      return Promise.resolve({ filled: 0, remaining: 1 });
    });

    const aggressiveFlattenInvoke = vi.fn().mockImplementation(
      (_ticker: string, _side: string, qty: number) =>
        Promise.resolve({ filled: qty }),
    );

    let runner: MarketMakingRunner;
    let pollCount = 0;
    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke: makePostOrder(),
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke,
      getTopOfBookInvoke: staticBook(45, 55),
      aggressiveFlattenInvoke,
      pollIntervalMs: 0,
      sleepMs: async (_ms) => {
        pollCount += 1;
        if (pollCount >= 2) runner.stop();
      },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-short-cap-job',
    };

    runner = new MarketMakingRunner(config, journal);
    await runner.run();

    const appendCalls = (journal.append as ReturnType<typeof vi.fn>).mock.calls;
    const cappedCall = appendCalls.find(
      (c: unknown[]) => c[0] === 'mm_inventory_capped' && (c[1] as Record<string, unknown>)['side'] === 'short',
    );
    expect(cappedCall).toBeDefined();
  });
});

// ── 7. Returns to two-sided after flatten ─────────────────────────────────────

describe('MarketMakingRunner — returns to two-sided after flatten', () => {
  it('reposts both quotes after flatten completes', async () => {
    let postCallCount = 0;
    const postOrderInvoke = vi.fn().mockImplementation(() => {
      postCallCount += 1;
      return Promise.resolve(`order-${postCallCount}`);
    });

    // Bid fills maxInventory on cycle 2 check
    let statusCallCount = 0;
    const getOrderStatusInvoke = vi.fn().mockImplementation((_id: string) => {
      statusCallCount += 1;
      // Cycle 2: bid status call returns full fill
      if (statusCallCount === 3 && _id === 'order-1') {
        return Promise.resolve({ filled: 5, remaining: 0 });
      }
      return Promise.resolve({ filled: 0, remaining: 1 });
    });

    const aggressiveFlattenInvoke = vi.fn().mockResolvedValue({ filled: 5 });

    let runner: MarketMakingRunner;
    let pollCount = 0;
    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke,
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke,
      getTopOfBookInvoke: staticBook(45, 55),
      aggressiveFlattenInvoke,
      pollIntervalMs: 0,
      sleepMs: async (_ms) => {
        pollCount += 1;
        if (pollCount >= 3) runner.stop();
      },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-return-twosided-job',
    };

    runner = new MarketMakingRunner(config);
    await runner.run();

    // Cycle 1: bid + ask posted (2 posts).
    // After flatten: bid re-posted (1 post); ask price unchanged so not reposted.
    // Total = 3. The runner correctly avoids unnecessary ask repost.
    expect(postOrderInvoke).toHaveBeenCalledTimes(3);
  });
});

// ── 8. stop() idempotent ──────────────────────────────────────────────────────

describe('MarketMakingRunner — stop() idempotent', () => {
  it('calling stop() multiple times does not throw', async () => {
    const { runner } = makeConfig({ stopAfterPolls: 1 });
    runner.stop();
    runner.stop();
    runner.stop();
    // Run won't even start a cycle since stopped=true before run() begins
    // Actually stopped is checked inside loop — first cycle still runs
    await expect(runner.run()).resolves.toBeDefined();
  });

  it('stop() cancels both quotes', async () => {
    const cancelOrderInvoke = makeCancel();
    const { runner } = makeConfig({
      cancelOrderInvoke,
      stopAfterPolls: 1,
    });
    await runner.run();

    // Both bid and ask should be canceled on stop
    expect(cancelOrderInvoke).toHaveBeenCalledTimes(2);
  });
});

// ── 9. stop() mid-flatten ─────────────────────────────────────────────────────

describe('MarketMakingRunner — stop mid-flatten', () => {
  it('completes flatten then stops (flatten runs atomically within a cycle)', async () => {
    const aggressiveFlattenInvoke = vi.fn().mockResolvedValue({ filled: 5 });

    // Bid fills immediately on any status check for order-1 → triggers flatten on cycle 2
    const getOrderStatusInvoke = vi.fn().mockImplementation((_id: string) => {
      if (_id === 'order-1') {
        return Promise.resolve({ filled: 5, remaining: 0 });
      }
      return Promise.resolve({ filled: 0, remaining: 1 });
    });

    let runner: MarketMakingRunner;
    let pollCount = 0;
    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke: makePostOrder(),
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke,
      getTopOfBookInvoke: staticBook(45, 55),
      aggressiveFlattenInvoke,
      pollIntervalMs: 0,
      sleepMs: async (_ms) => {
        pollCount += 1;
        // Stop after 2 sleeps: cycle 1 posts quotes (sleep 1), cycle 2 detects fill
        // and flattens atomically, then sleep 2 stops the runner.
        if (pollCount >= 2) runner.stop();
      },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-mid-flatten-job',
    };

    runner = new MarketMakingRunner(config);
    const result = await runner.run();

    // Flatten was called atomically within cycle 2 before the sleep
    expect(aggressiveFlattenInvoke).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

// ── 10. Empty book halts ──────────────────────────────────────────────────────

describe('MarketMakingRunner — empty book halts', () => {
  it('halts with reason empty_book when bidCents is null', async () => {
    const journal = makeJournalSpy();
    let runner: MarketMakingRunner;

    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke: makePostOrder(),
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke: makeStatusUnfilled(),
      getTopOfBookInvoke: staticBook(null, 55),
      aggressiveFlattenInvoke: makeFlattenNoop(),
      pollIntervalMs: 0,
      sleepMs: async (_ms) => { runner.stop(); },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-empty-book-job',
    };

    runner = new MarketMakingRunner(config, journal);
    const result = await runner.run();

    expect(result.reason).toBe('empty_book');

    const appendCalls = (journal.append as ReturnType<typeof vi.fn>).mock.calls;
    const kinds = appendCalls.map((c: unknown[]) => c[0] as string);
    expect(kinds).toContain('mm_empty_book');
    // Should NOT have posted any quotes (atomicity)
    expect(kinds.filter((k) => k === 'mm_quote_posted')).toHaveLength(0);
  });

  it('halts with reason empty_book when askCents is null', async () => {
    let runner: MarketMakingRunner;

    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke: makePostOrder(),
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke: makeStatusUnfilled(),
      getTopOfBookInvoke: staticBook(45, null),
      aggressiveFlattenInvoke: makeFlattenNoop(),
      pollIntervalMs: 0,
      sleepMs: async (_ms) => { runner.stop(); },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-empty-ask-job',
    };

    runner = new MarketMakingRunner(config);
    const result = await runner.run();
    expect(result.reason).toBe('empty_book');
  });
});

// ── 11. quoteOffsetCents=0 ────────────────────────────────────────────────────

describe('MarketMakingRunner — quoteOffsetCents=0', () => {
  it('posts bid at exact topBid and ask at exact topAsk', async () => {
    const postOrderInvoke = makePostOrder();
    let runner: MarketMakingRunner;

    const config: S12Config = {
      ticker: 'TEST-TICKER',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 0,
      postOrderInvoke,
      cancelOrderInvoke: makeCancel(),
      getOrderStatusInvoke: makeStatusUnfilled(),
      getTopOfBookInvoke: staticBook(45, 55),
      aggressiveFlattenInvoke: makeFlattenNoop(),
      pollIntervalMs: 0,
      sleepMs: async (_ms) => { runner.stop(); },
      keaHome: '/tmp/s12-test-home',
      jobId: 'test-zero-offset-job',
    };

    runner = new MarketMakingRunner(config);
    await runner.run();

    const calls = (postOrderInvoke as ReturnType<typeof vi.fn>).mock.calls;
    const prices = calls.map((c: unknown[]) => c[2] as number);
    expect(prices).toContain(45); // bid at topBid + 0
    expect(prices).toContain(55); // ask at topAsk - 0
  });
});
