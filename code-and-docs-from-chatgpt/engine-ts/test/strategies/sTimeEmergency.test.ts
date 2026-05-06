/**
 * sTimeEmergency.test.ts — TDD suite for S16 time-to-expiry emergency unwind.
 *
 * All phase invocations are mocked via config so we never spin up real runners.
 * Journal is mocked with vi.spyOn.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  STimeEmergencyRunner,
  buildSTimeEmergencyArgs,
} from '../../src/strategies/sTimeEmergency.js';
import type {
  STimeEmergencyConfig,
  PassiveInvokeFn,
  S7InvokeFn,
  AggressiveInvokeFn,
  CrossAnyBidInvokeFn,
} from '../../src/strategies/sTimeEmergency.js';
import type { PassiveResult } from '../../src/passive.js';
import type { AggressiveResult } from '../../src/aggressive.js';
import type { S7Result } from '../../src/strategies/s7ScaleOut.js';
import type { KalshiClientLike } from '../../src/types.js';
import { Journal } from '../../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(),
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

function makeJournalSpy(keaHome = '/tmp/s16-test-home'): Journal {
  const j = new Journal('test-s16-job', keaHome);
  vi.spyOn(j, 'append');
  return j;
}

function makePassiveResult(filled: number): PassiveResult {
  return {
    jobId: 'test-job',
    filled,
    avgPriceCents: filled > 0 ? 55 : 0,
    feesIncurredDollars: 0,
    remaining: 0,
    status: filled > 0 ? 'complete' : 'partial',
  };
}

function makeAggressiveResult(filled: number): AggressiveResult {
  return { filled, orderId: 'order-id', reason: filled > 0 ? 'filled' : 'unfilled' };
}

function makeS7Result(filled: number): S7Result {
  return { firedRungs: [0], totalFilled: filled, iterations: 1 };
}

/** Returns epoch ms = now + minutesFromNow * 60_000 */
function closeEpoch(minutesFromNow: number): number {
  return Date.now() + minutesFromNow * 60_000;
}

/** Fixed now() for deterministic tests: close is always `minsLeft` minutes away */
function makeNow(minsLeft: number, closeMs: number): () => number {
  const nowVal = closeMs - minsLeft * 60_000;
  return () => nowVal;
}

const TICKER = 'TEST-MKT';
const KEA_HOME = '/tmp/s16-test-home';

function makeConfig(
  overrides: Partial<STimeEmergencyConfig> & {
    minsLeft?: number;
    closeMs?: number;
  } = {},
): STimeEmergencyConfig {
  const closeMs = overrides.closeMs ?? Date.now() + 65 * 60_000;
  const minsLeft = overrides.minsLeft ?? 65;
  const now = makeNow(minsLeft, closeMs);
  return {
    ticker: TICKER,
    side: 'sell',
    size: overrides.size ?? 100,
    contractCloseEpochMs: closeMs,
    now,
    keaHome: KEA_HOME,
    ...overrides,
  };
}

// ── 1. buildSTimeEmergencyArgs validation ────────────────────────────────────

describe('buildSTimeEmergencyArgs — validation', () => {
  it('throws when side is not sell', () => {
    expect(() =>
      buildSTimeEmergencyArgs({
        ticker: TICKER,
        side: 'buy' as 'sell',
        size: 100,
        contractCloseEpochMs: Date.now() + 60_000,
      }),
    ).toThrow('sell-only');
  });

  it('throws when size <= 0', () => {
    expect(() =>
      buildSTimeEmergencyArgs({
        ticker: TICKER,
        side: 'sell',
        size: 0,
        contractCloseEpochMs: Date.now() + 60_000,
      }),
    ).toThrow('size > 0');
  });

  it('throws when size is negative', () => {
    expect(() =>
      buildSTimeEmergencyArgs({
        ticker: TICKER,
        side: 'sell',
        size: -5,
        contractCloseEpochMs: Date.now() + 60_000,
      }),
    ).toThrow('size > 0');
  });

  it('throws when contractCloseEpochMs <= 0', () => {
    expect(() =>
      buildSTimeEmergencyArgs({
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: 0,
      }),
    ).toThrow('contractCloseEpochMs > 0');
  });

  it('returns valid config when args are correct', () => {
    const ms = Date.now() + 60_000;
    const result = buildSTimeEmergencyArgs({
      ticker: TICKER,
      side: 'sell',
      size: 50,
      contractCloseEpochMs: ms,
    });
    expect(result).toEqual({ ticker: TICKER, side: 'sell', size: 50, contractCloseEpochMs: ms });
  });
});

// ── 2. Constructor validation ─────────────────────────────────────────────────

describe('STimeEmergencyRunner — constructor validation', () => {
  it('throws when side is not sell', () => {
    expect(
      () =>
        new STimeEmergencyRunner(
          makeMockClient(),
          makeConfig({ side: 'buy' as 'sell' }),
        ),
    ).toThrow('sell-only');
  });

  it('throws when size <= 0', () => {
    expect(
      () => new STimeEmergencyRunner(makeMockClient(), makeConfig({ size: 0 })),
    ).toThrow('size > 0');
  });

  it('throws when contractCloseEpochMs is 0', () => {
    expect(
      () =>
        new STimeEmergencyRunner(
          makeMockClient(),
          makeConfig({ contractCloseEpochMs: 0 }),
        ),
    ).toThrow('contractCloseEpochMs > 0');
  });
});

// ── 3. Happy path from T-55 (inside passive window) — all 4 phases ──────────

describe('STimeEmergencyRunner — happy path T-55 all 4 phases', () => {
  it('runs all 4 phases in sequence and journals correctly', async () => {
    // Start at T-55: inside passive window (T-60..T-30)
    const closeMs = Date.now() + 55 * 60_000;
    const journal = makeJournalSpy();

    // now() is called: (1) initial phase, (2+) once per phase_entered
    // We keep returning T-55 — the phase loop runs all phases sequentially
    // since phasesToRun is sliced once at start and each phase returns partial fills
    const nowFn = () => closeMs - 55 * 60_000;

    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const s7Invoke: S7InvokeFn = vi.fn().mockResolvedValue(makeS7Result(25));
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValue(makeAggressiveResult(25));
    const crossAnyBidInvoke: CrossAnyBidInvokeFn = vi.fn().mockResolvedValue({ filled: 25 });

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: nowFn,
        passiveInvoke,
        s7Invoke,
        aggressiveInvoke,
        crossAnyBidInvoke,
        keaHome: KEA_HOME,
      },
      journal,
    );

    const result = await runner.run();

    expect(result.phases).toHaveLength(4);
    expect(result.phases[0].phase).toBe('passive');
    expect(result.phases[1].phase).toBe('s7');
    expect(result.phases[2].phase).toBe('aggressive');
    expect(result.phases[3].phase).toBe('cross');
    expect(result.totalFilled).toBe(100);
    expect(result.reason).toBe('position_closed');

    expect(passiveInvoke).toHaveBeenCalledOnce();
    expect(s7Invoke).toHaveBeenCalledOnce();
    expect(aggressiveInvoke).toHaveBeenCalledOnce();
    expect(crossAnyBidInvoke).toHaveBeenCalledOnce();
  });

  it('journals time_emergency_started with correct fields', async () => {
    // T-55: inside passive window
    const closeMs = Date.now() + 55 * 60_000;
    const journal = makeJournalSpy();
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(100));

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 55 * 60_000,
        passiveInvoke,
        s7Invoke: vi.fn().mockResolvedValue(makeS7Result(0)),
        aggressiveInvoke: vi.fn().mockResolvedValue(makeAggressiveResult(0)),
        crossAnyBidInvoke: vi.fn().mockResolvedValue({ filled: 0 }),
        keaHome: KEA_HOME,
      },
      journal,
    );

    await runner.run();

    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const startedCall = appendSpy.mock.calls.find(([kind]) => String(kind) === 'time_emergency_started');
    expect(startedCall).toBeDefined();
    expect(startedCall![1]).toMatchObject({ ticker: TICKER, size: 100 });
  });
});

// ── 4. Late start at T-9 — skip passive and S7, start at aggressive ──────────
// Phase boundaries: passive=T-60..T-30, s7=T-30..T-10, aggressive=T-10..T-2
// T-9 is inside aggressive range, so both passive and s7 are skipped.

describe('STimeEmergencyRunner — late start at T-9', () => {
  it('skips passive and s7 phases, starts at aggressive', async () => {
    const closeMs = Date.now() + 9 * 60_000;
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(0));
    const s7Invoke: S7InvokeFn = vi.fn().mockResolvedValue(makeS7Result(0));
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValue(makeAggressiveResult(100));
    const crossAnyBidInvoke: CrossAnyBidInvokeFn = vi.fn().mockResolvedValue({ filled: 0 });

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 9 * 60_000,
        passiveInvoke,
        s7Invoke,
        aggressiveInvoke,
        crossAnyBidInvoke,
        keaHome: KEA_HOME,
      },
    );

    const result = await runner.run();

    expect(passiveInvoke).not.toHaveBeenCalled();
    expect(s7Invoke).not.toHaveBeenCalled();
    expect(aggressiveInvoke).toHaveBeenCalledOnce();
    expect(result.phases[0].phase).toBe('aggressive');
    expect(result.totalFilled).toBe(100);
    expect(result.reason).toBe('position_closed');
  });

  it('late start at T-15 (S7 range) — skips passive, starts at s7', async () => {
    const closeMs = Date.now() + 15 * 60_000;
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(0));
    const s7Invoke: S7InvokeFn = vi.fn().mockResolvedValue(makeS7Result(100));

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 15 * 60_000,
        passiveInvoke,
        s7Invoke,
        keaHome: KEA_HOME,
      },
    );

    const result = await runner.run();

    expect(passiveInvoke).not.toHaveBeenCalled();
    expect(s7Invoke).toHaveBeenCalledOnce();
    expect(result.phases[0].phase).toBe('s7');
    expect(result.reason).toBe('position_closed');
  });
});

// ── 5. Expired — single crossAnyBid at T-1 ───────────────────────────────────

describe('STimeEmergencyRunner — expired T-1', () => {
  it('only calls crossAnyBidInvoke when at T-1', async () => {
    const closeMs = Date.now() + 1 * 60_000;
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(0));
    const s7Invoke: S7InvokeFn = vi.fn().mockResolvedValue(makeS7Result(0));
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValue(makeAggressiveResult(0));
    const crossAnyBidInvoke: CrossAnyBidInvokeFn = vi.fn().mockResolvedValue({ filled: 50 });

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 50,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 1 * 60_000,
        passiveInvoke,
        s7Invoke,
        aggressiveInvoke,
        crossAnyBidInvoke,
        keaHome: KEA_HOME,
      },
    );

    const result = await runner.run();

    expect(passiveInvoke).not.toHaveBeenCalled();
    expect(s7Invoke).not.toHaveBeenCalled();
    expect(aggressiveInvoke).not.toHaveBeenCalled();
    expect(crossAnyBidInvoke).toHaveBeenCalledOnce();
    expect(crossAnyBidInvoke).toHaveBeenCalledWith(TICKER, 50, expect.anything());
    expect(result.phases).toHaveLength(1);
    expect(result.phases[0].phase).toBe('cross');
    expect(result.reason).toBe('position_closed');
  });
});

// ── 6. Not in window — T-70 ───────────────────────────────────────────────────

describe('STimeEmergencyRunner — not in window', () => {
  it('returns not_in_window when > T-60', async () => {
    const closeMs = Date.now() + 70 * 60_000;
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(0));

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 70 * 60_000,
        passiveInvoke,
        keaHome: KEA_HOME,
      },
    );

    const result = await runner.run();

    expect(result.reason).toBe('not_in_window');
    expect(result.phases).toHaveLength(0);
    expect(result.totalFilled).toBe(0);
    expect(passiveInvoke).not.toHaveBeenCalled();
  });
});

// ── 7. Position closed mid-phase halts before next ───────────────────────────

describe('STimeEmergencyRunner — position closed mid-phase', () => {
  it('halts after passive fills everything, does not call subsequent phases', async () => {
    // T-55: inside passive window
    const closeMs = Date.now() + 55 * 60_000;
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(100));
    const s7Invoke: S7InvokeFn = vi.fn().mockResolvedValue(makeS7Result(0));
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValue(makeAggressiveResult(0));
    const crossAnyBidInvoke: CrossAnyBidInvokeFn = vi.fn().mockResolvedValue({ filled: 0 });

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 55 * 60_000,
        passiveInvoke,
        s7Invoke,
        aggressiveInvoke,
        crossAnyBidInvoke,
        keaHome: KEA_HOME,
      },
    );

    const result = await runner.run();

    expect(passiveInvoke).toHaveBeenCalledOnce();
    expect(s7Invoke).not.toHaveBeenCalled();
    expect(aggressiveInvoke).not.toHaveBeenCalled();
    expect(crossAnyBidInvoke).not.toHaveBeenCalled();
    expect(result.reason).toBe('position_closed');
    expect(result.phases).toHaveLength(1);
    expect(result.phases[0]).toEqual({ phase: 'passive', filled: 100 });
  });

  it('halts after s7 fills everything, does not call aggressive or cross', async () => {
    const closeMs = Date.now() + 25 * 60_000;
    const s7Invoke: S7InvokeFn = vi.fn().mockResolvedValue(makeS7Result(80));
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValue(makeAggressiveResult(0));
    const crossAnyBidInvoke: CrossAnyBidInvokeFn = vi.fn().mockResolvedValue({ filled: 0 });

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 80,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 25 * 60_000,
        s7Invoke,
        aggressiveInvoke,
        crossAnyBidInvoke,
        keaHome: KEA_HOME,
      },
    );

    const result = await runner.run();

    expect(s7Invoke).toHaveBeenCalledOnce();
    expect(aggressiveInvoke).not.toHaveBeenCalled();
    expect(crossAnyBidInvoke).not.toHaveBeenCalled();
    expect(result.reason).toBe('position_closed');
  });
});

// ── 8. remainingSize threading ────────────────────────────────────────────────

describe('STimeEmergencyRunner — remainingSize threading', () => {
  it('threads remaining size across phases correctly', async () => {
    // Start at T-55 inside passive window; now() stays fixed — all phases run in sequence
    const closeMs = Date.now() + 55 * 60_000;
    const nowFn = () => closeMs - 55 * 60_000;

    // passive fills 40 of 100 → s7 gets 60, fills 30 → aggressive gets 30, fills 20 → cross gets 10
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(40));
    const s7Invoke: S7InvokeFn = vi.fn().mockImplementation(async (cfg) => ({
      firedRungs: [0],
      totalFilled: cfg.totalSize === 60 ? 30 : 0,
      iterations: 1,
    }));
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockImplementation(async (cfg) => ({
      filled: cfg.size === 30 ? 20 : 0,
      orderId: 'id',
      reason: 'partial' as const,
    }));
    const crossAnyBidInvoke: CrossAnyBidInvokeFn = vi.fn().mockImplementation(async (_ticker, sz) => ({
      filled: sz,
    }));

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: nowFn,
        passiveInvoke,
        s7Invoke,
        aggressiveInvoke,
        crossAnyBidInvoke,
        keaHome: KEA_HOME,
      },
    );

    const result = await runner.run();

    // Verify s7 was called with remaining 60
    expect(s7Invoke).toHaveBeenCalledWith(
      expect.objectContaining({ totalSize: 60 }),
      expect.anything(),
    );
    // Verify aggressive was called with remaining 30
    expect(aggressiveInvoke).toHaveBeenCalledWith(
      expect.objectContaining({ size: 30 }),
      expect.anything(),
    );
    // Verify cross was called with remaining 10
    expect(crossAnyBidInvoke).toHaveBeenCalledWith(TICKER, 10, expect.anything());
    expect(result.totalFilled).toBe(100);
  });
});

// ── 9. Journal order ──────────────────────────────────────────────────────────

describe('STimeEmergencyRunner — journal order', () => {
  it('emits started → phase_entered → phase_completed → finished', async () => {
    // T-55: inside passive window
    const closeMs = Date.now() + 55 * 60_000;
    const journal = makeJournalSpy();
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(100));

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 55 * 60_000,
        passiveInvoke,
        s7Invoke: vi.fn().mockResolvedValue(makeS7Result(0)),
        aggressiveInvoke: vi.fn().mockResolvedValue(makeAggressiveResult(0)),
        crossAnyBidInvoke: vi.fn().mockResolvedValue({ filled: 0 }),
        keaHome: KEA_HOME,
      },
      journal,
    );

    await runner.run();

    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const kinds = appendSpy.mock.calls.map(([kind]) => String(kind));

    const startedIdx = kinds.indexOf('time_emergency_started');
    const enteredIdx = kinds.indexOf('time_emergency_phase_entered');
    const completedIdx = kinds.indexOf('time_emergency_phase_completed');
    const finishedIdx = kinds.indexOf('time_emergency_finished');

    expect(startedIdx).toBeLessThan(enteredIdx);
    expect(enteredIdx).toBeLessThan(completedIdx);
    expect(completedIdx).toBeLessThan(finishedIdx);
  });

  it('emits phase_entered with phase name and minutesToClose', async () => {
    // T-55: inside passive window
    const closeMs = Date.now() + 55 * 60_000;
    const journal = makeJournalSpy();
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(100));

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 55 * 60_000,
        passiveInvoke,
        keaHome: KEA_HOME,
      },
      journal,
    );

    await runner.run();

    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const enteredCall = appendSpy.mock.calls.find(([kind]) => String(kind) === 'time_emergency_phase_entered');
    expect(enteredCall).toBeDefined();
    expect(enteredCall![1]).toMatchObject({ phase: 'passive' });
    expect(typeof enteredCall![1].minutesToClose).toBe('number');
  });
});

// ── 10. crossAnyBid only called at T-2 or below ──────────────────────────────

describe('STimeEmergencyRunner — crossAnyBid gate', () => {
  it('does NOT call crossAnyBidInvoke at T-5 (aggressive phase)', async () => {
    const closeMs = Date.now() + 5 * 60_000;
    const crossAnyBidInvoke: CrossAnyBidInvokeFn = vi.fn().mockResolvedValue({ filled: 0 });
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValue(makeAggressiveResult(50));

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 50,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 5 * 60_000,
        aggressiveInvoke,
        crossAnyBidInvoke,
        keaHome: KEA_HOME,
      },
    );

    await runner.run();

    expect(aggressiveInvoke).toHaveBeenCalledOnce();
    expect(crossAnyBidInvoke).not.toHaveBeenCalled();
  });

  it('calls crossAnyBidInvoke with ticker and remaining size', async () => {
    const closeMs = Date.now() + 1 * 60_000;
    const crossAnyBidInvoke: CrossAnyBidInvokeFn = vi.fn().mockResolvedValue({ filled: 33 });

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 33,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 1 * 60_000,
        crossAnyBidInvoke,
        keaHome: KEA_HOME,
      },
    );

    await runner.run();

    expect(crossAnyBidInvoke).toHaveBeenCalledWith(TICKER, 33, expect.anything());
  });
});

// ── 11. now() called at every boundary check ─────────────────────────────────

describe('STimeEmergencyRunner — now() invocation', () => {
  it('calls now() at least once per phase entered', async () => {
    // T-55: inside passive window — now() called for initial phase + phase_entered
    const closeMs = Date.now() + 55 * 60_000;
    let nowCallCount = 0;
    const nowFn = () => {
      nowCallCount++;
      return closeMs - 55 * 60_000;
    };
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(100));

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: nowFn,
        passiveInvoke,
        keaHome: KEA_HOME,
      },
    );

    await runner.run();

    // now() should be called at minimum: once for initial phase + once per phase_entered
    expect(nowCallCount).toBeGreaterThanOrEqual(2);
  });
});

// ── 12. Partial fills — reason is time_emergency_finished ────────────────────

describe('STimeEmergencyRunner — partial fill outcome', () => {
  it('returns time_emergency_finished when not all contracts filled after all phases', async () => {
    const closeMs = Date.now() + 1 * 60_000;
    const crossAnyBidInvoke: CrossAnyBidInvokeFn = vi.fn().mockResolvedValue({ filled: 30 });

    const runner = new STimeEmergencyRunner(
      makeMockClient(),
      {
        ticker: TICKER,
        side: 'sell',
        size: 100,
        contractCloseEpochMs: closeMs,
        now: () => closeMs - 1 * 60_000,
        crossAnyBidInvoke,
        keaHome: KEA_HOME,
      },
    );

    const result = await runner.run();

    expect(result.reason).toBe('time_emergency_finished');
    expect(result.totalFilled).toBe(30);
  });
});
