/**
 * sRoll.test.ts — TDD suite for S11 roll runner.
 *
 * Both passiveInvoke and aggressiveInvoke are mocked via config so we
 * never spin up real S1/S2 runners. Journal is mocked with vi.spyOn.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SRollRunner } from '../../src/strategies/sRoll.js';
import type {
  SRollConfig,
  PassiveInvokeFn,
  AggressiveInvokeFn,
} from '../../src/strategies/sRoll.js';
import type { PassiveResult } from '../../src/passive.js';
import type { AggressiveConfig, AggressiveResult } from '../../src/aggressive.js';
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

function makeJournalSpy(keaHome = '/tmp/s11-test-home'): Journal {
  const j = new Journal('test-s11-job', keaHome);
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

function makeAggressiveResult(
  filled: number,
  reason: AggressiveResult['reason'],
): AggressiveResult {
  return { filled, orderId: `order-${reason}`, reason };
}

const BASE_CONFIG: Omit<SRollConfig, 'passiveInvoke' | 'aggressiveInvoke'> = {
  currentTicker: 'CURR-MKT',
  currentSide: 'yes',
  currentSize: 100,
  targetTicker: 'NEXT-MKT',
  targetSide: 'yes',
  targetSize: 100,
  confirmedRoll: true,
};

// ── 1. Validation ─────────────────────────────────────────────────────────────

describe('SRollRunner — validation', () => {
  it('throws when confirmedRoll=false', () => {
    expect(
      () => new SRollRunner(makeMockClient(), { ...BASE_CONFIG, confirmedRoll: false }),
    ).toThrow('S11 requires confirmedRoll=true');
  });

  it('throws when currentTicker is empty', () => {
    expect(
      () => new SRollRunner(makeMockClient(), { ...BASE_CONFIG, currentTicker: '' }),
    ).toThrow('tickers required');
  });

  it('throws when targetTicker is empty', () => {
    expect(
      () => new SRollRunner(makeMockClient(), { ...BASE_CONFIG, targetTicker: '' }),
    ).toThrow('tickers required');
  });

  it('throws when currentSize <= 0', () => {
    expect(
      () => new SRollRunner(makeMockClient(), { ...BASE_CONFIG, currentSize: 0 }),
    ).toThrow('sizes must be > 0');
  });

  it('throws when targetSize <= 0', () => {
    expect(
      () => new SRollRunner(makeMockClient(), { ...BASE_CONFIG, targetSize: -1 }),
    ).toThrow('sizes must be > 0');
  });
});

// ── 2. Happy path: full phase 1 fill → phase 2 with targetSize ────────────────

describe('SRollRunner — happy path (full phase 1 fill)', () => {
  it('phase 2 fires with targetSize when phase 1 fills currentSize; reason=complete', async () => {
    const passiveResult = makePassiveResult(100);
    const aggressiveResult = makeAggressiveResult(100, 'filled');

    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(passiveResult);
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValue(aggressiveResult);

    const runner = new SRollRunner(makeMockClient(), {
      ...BASE_CONFIG,
      passiveInvoke,
      aggressiveInvoke,
    });
    const result = await runner.run();

    expect(result.reason).toBe('complete');
    expect(result.actuallyClosed).toBe(100);
    expect(result.actuallyOpened).toBe(100);
    expect(result.phase1).toBe(passiveResult);
    expect(result.phase2).toBe(aggressiveResult);
    expect(aggressiveInvoke).toHaveBeenCalledTimes(1);
  });
});

// ── 3. Partial phase 1 — cash-neutrality cap ─────────────────────────────────

describe('SRollRunner — partial phase 1 fill (cash-neutrality)', () => {
  it('targetSize=80 but phase1 filled=60 → phase2 size=60 (capped)', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(60));
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(60, 'filled'));

    const runner = new SRollRunner(makeMockClient(), {
      ...BASE_CONFIG,
      currentSize: 100,
      targetSize: 80,
      passiveInvoke,
      aggressiveInvoke,
    });
    const result = await runner.run();

    expect(result.actuallyClosed).toBe(60);
    expect(result.reason).toBe('phase1_partial_completed');

    const aggressiveCalls = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock
      .calls as [AggressiveConfig][];
    expect(aggressiveCalls[0][0].size).toBe(60); // capped to closed
  });

  it('targetSize=40 and phase1 filled=60 → phase2 size=40 (targetSize is smaller)', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(60));
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(40, 'filled'));

    const runner = new SRollRunner(makeMockClient(), {
      ...BASE_CONFIG,
      currentSize: 100,
      targetSize: 40,
      passiveInvoke,
      aggressiveInvoke,
    });
    const result = await runner.run();

    expect(result.actuallyClosed).toBe(60);
    const aggressiveCalls = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock
      .calls as [AggressiveConfig][];
    expect(aggressiveCalls[0][0].size).toBe(40); // targetSize wins since 40 < 60
  });
});

// ── 4. Phase 1 unfilled → no phase 2 ─────────────────────────────────────────

describe('SRollRunner — phase 1 unfilled', () => {
  it('returns phase1_unfilled, no phase 2 invocation', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(0));
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn();

    const runner = new SRollRunner(makeMockClient(), {
      ...BASE_CONFIG,
      passiveInvoke,
      aggressiveInvoke,
    });
    const result = await runner.run();

    expect(result.reason).toBe('phase1_unfilled');
    expect(result.actuallyClosed).toBe(0);
    expect(result.actuallyOpened).toBe(0);
    expect(result.phase2).toBeUndefined();
    expect(aggressiveInvoke).not.toHaveBeenCalled();
  });
});

// ── 5. Injectable callback config verification ────────────────────────────────

describe('SRollRunner — injectable config verification', () => {
  it('passiveInvoke receives currentTicker + sell + currentSize', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(50));
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(50, 'filled'));

    const cfg: SRollConfig = {
      currentTicker: 'CURR-X',
      currentSide: 'yes',
      currentSize: 50,
      targetTicker: 'NEXT-X',
      targetSide: 'no',
      targetSize: 50,
      confirmedRoll: true,
      oneTickIn: true,
      passiveInvoke,
      aggressiveInvoke,
    };

    const runner = new SRollRunner(makeMockClient(), cfg);
    await runner.run();

    const passiveCalls = (passiveInvoke as ReturnType<typeof vi.fn>).mock.calls;
    expect(passiveCalls[0][0]).toMatchObject({
      ticker: 'CURR-X',
      side: 'sell',
      size: 50,
    });
  });

  it('aggressiveInvoke receives targetTicker + targetSide + buy + capped size', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(50));
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(50, 'filled'));

    const cfg: SRollConfig = {
      currentTicker: 'CURR-X',
      currentSide: 'yes',
      currentSize: 50,
      targetTicker: 'NEXT-X',
      targetSide: 'no',
      targetSize: 50,
      confirmedRoll: true,
      oneTickIn: true,
      passiveInvoke,
      aggressiveInvoke,
    };

    const runner = new SRollRunner(makeMockClient(), cfg);
    await runner.run();

    const aggressiveCalls = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock
      .calls as [AggressiveConfig][];
    expect(aggressiveCalls[0][0]).toMatchObject({
      ticker: 'NEXT-X',
      side: 'no',
      action: 'buy',
      size: 50,
      confirmedAggressive: true,
      oneTickIn: true,
    });
  });
});

// ── 6. Journal entries in order ───────────────────────────────────────────────

describe('SRollRunner — journal ordering', () => {
  it('full run: roll_started → roll_phase1_passive_close → roll_phase2_aggressive_open → roll_finished', async () => {
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;

    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(10));
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(10, 'filled'));

    const runner = new SRollRunner(
      makeMockClient(),
      { ...BASE_CONFIG, currentSize: 10, targetSize: 10, passiveInvoke, aggressiveInvoke },
      journal,
    );
    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0]);
    expect(kinds).toEqual([
      'roll_started',
      'roll_phase1_passive_close',
      'roll_phase2_aggressive_open',
      'roll_finished',
    ]);
  });

  it('phase1 unfilled: roll_started → roll_phase1_passive_close → roll_finished (no phase2 entry)', async () => {
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;

    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(0));

    const runner = new SRollRunner(
      makeMockClient(),
      { ...BASE_CONFIG, passiveInvoke, aggressiveInvoke: vi.fn() },
      journal,
    );
    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0]);
    expect(kinds).toEqual([
      'roll_started',
      'roll_phase1_passive_close',
      'roll_finished',
    ]);
  });
});

// ── 7. confirmedAggressive=true auto-set ──────────────────────────────────────

describe('SRollRunner — confirmedAggressive enforcement', () => {
  it('phase 2 config always has confirmedAggressive=true (user confirmed the roll)', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(20));
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(20, 'filled'));

    const runner = new SRollRunner(makeMockClient(), {
      ...BASE_CONFIG,
      currentSize: 20,
      targetSize: 20,
      passiveInvoke,
      aggressiveInvoke,
    });
    await runner.run();

    const aggressiveCalls = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock
      .calls as [AggressiveConfig][];
    expect(aggressiveCalls[0][0].confirmedAggressive).toBe(true);
  });
});
