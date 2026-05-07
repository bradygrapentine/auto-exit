/**
 * Tests for MultiLegJobRunner (src/multiLeg.ts).
 *
 * All sub-runners are mocked via aggressiveInvoke/passiveInvoke injections.
 * fetchOrderbook is mocked to return a well-formed book.
 * sleepMs is mocked to avoid real waits. now() is mocked for determinism.
 */

import { describe, it, expect, vi } from 'vitest';
import { MultiLegJobRunner } from '../src/multiLeg.js';
import type { MultiLegJobConfig, LegConfig, AggressiveInvokeFn, PassiveInvokeFn } from '../src/multiLeg.js';
import type { AggressiveResult } from '../src/aggressive.js';
import type { PassiveResult } from '../src/passive.js';
import type { KalshiClientLike, Orderbook } from '../src/types.js';
import { Journal } from '../src/journal.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// ── Helpers ───────────────────────────────────────────────────────────────────

function tmpJournal(): Journal {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'multileg-test-'));
  return new Journal(`test-${Date.now()}`, dir);
}

function makeMockClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(),
    createOrder: vi.fn(),
    getOrder: vi.fn(),
    cancelOrder: vi.fn(),
    getPosition: vi.fn(),
    getRestingOrderCount: vi.fn(),
    findOrderByClientOrderId: vi.fn(),
  };
}

function makeBook(yesSize = 100, noSize = 100): Orderbook {
  return {
    yes: [{ priceCents: 60, size: yesSize }],
    no: [{ priceCents: 40, size: noSize }],
  };
}

function makeAggressiveInvoke(filled: number): AggressiveInvokeFn {
  return vi.fn().mockResolvedValue({ filled, orderId: 'ord-1', reason: 'filled' } as AggressiveResult);
}

function makePassiveInvoke(filled: number): PassiveInvokeFn {
  return vi.fn().mockResolvedValue({
    jobId: 'passive-1',
    filled,
    avgPriceCents: 60,
    feesIncurredDollars: 0,
    remaining: 0,
    status: 'complete',
  } as PassiveResult);
}

const twoAggressiveLegs: LegConfig[] = [
  { ticker: 'AAAA-23', side: 'yes', size: 100, executionMode: 'aggressive' },
  { ticker: 'BBBB-23', side: 'yes', size: 100, executionMode: 'aggressive' },
];

/** sleepMs that actually yields to the macrotask queue (prevents tight microtask loops). */
const yieldSleep = (_ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, 0));

function baseConfig(overrides: Partial<MultiLegJobConfig> = {}): MultiLegJobConfig {
  const journal = tmpJournal();
  const client = makeMockClient();
  return {
    legs: twoAggressiveLegs,
    journal,
    client,
    aggressiveInvoke: makeAggressiveInvoke(100),
    passiveInvoke: makePassiveInvoke(100),
    fetchOrderbook: vi.fn().mockResolvedValue(makeBook()),
    now: vi.fn().mockReturnValueOnce(1000).mockReturnValue(2000),
    sleepMs: vi.fn().mockImplementation(yieldSleep),
    pollIntervalMs: 0,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MultiLegJobRunner', () => {
  it('1. construction succeeds with valid config', () => {
    const cfg = baseConfig();
    expect(() => new MultiLegJobRunner(cfg)).not.toThrow();
  });

  it('2. two legs in lockstep complete without skew pauses', async () => {
    const cfg = baseConfig({
      aggressiveInvoke: makeAggressiveInvoke(100),
      pollIntervalMs: 0,
    });
    const journalAppend = vi.spyOn(cfg.journal, 'append');
    const runner = new MultiLegJobRunner(cfg);
    const result = await runner.run();

    expect(result.halted).toBe(false);
    expect(result.legs).toHaveLength(2);
    expect(result.legs[0]!.filled).toBe(100);
    expect(result.legs[1]!.filled).toBe(100);

    const kinds = journalAppend.mock.calls.map((c) => c[0]);
    expect(kinds).not.toContain('multileg_skew_pause');
  });

  it('3. skew detected at 60/30 with 10% threshold → multileg_skew_pause journaled', async () => {
    // Leg 0 resolves with 60 fills immediately; leg 1 takes longer.
    // After leg 0 completes (state0.done=true, state0.filled=60),
    // the poll loop runs: skew = 60/100 - 0/100 = 0.60 > 0.10 → multileg_skew_pause.
    // Leg 1 is released with 30 fills, then an empty book halts the run.
    const journal = tmpJournal();
    const journalAppend = vi.spyOn(journal, 'append');

    let l1ResolveFn!: (r: AggressiveResult) => void;
    const l1Promise = new Promise<AggressiveResult>((res) => { l1ResolveFn = res; });

    let callIdx = 0;
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockImplementation(() => {
      if (callIdx++ === 0) {
        // leg 0: resolves immediately with 60 fills
        return Promise.resolve({ filled: 60, orderId: 'o0', reason: 'partial' } as AggressiveResult);
      }
      // leg 1: pending until released
      return l1Promise;
    });

    // fetchOrderbook: first 3 calls return healthy, then empty to halt
    let fetchCount = 0;
    const fetchOrderbook = vi.fn().mockImplementation(() => {
      fetchCount++;
      if (fetchCount <= 3) return Promise.resolve(makeBook());
      return Promise.resolve({ yes: [], no: [] });
    });

    const cfg: MultiLegJobConfig = {
      legs: [
        { ticker: 'AAAA', side: 'yes', size: 100, executionMode: 'aggressive' },
        { ticker: 'BBBB', side: 'yes', size: 100, executionMode: 'aggressive' },
      ],
      journal,
      client: makeMockClient(),
      aggressiveInvoke,
      passiveInvoke: makePassiveInvoke(0),
      fetchOrderbook,
      now: vi.fn().mockReturnValueOnce(0).mockReturnValue(100),
      sleepMs: vi.fn().mockImplementation(yieldSleep),
      pollIntervalMs: 0,
      legSkewPct: 0.10,
    };

    // Release leg 1 with 30 fills after a tick
    setTimeout(() => l1ResolveFn({ filled: 30, orderId: 'o1', reason: 'partial' }), 5);

    const runner = new MultiLegJobRunner(cfg);
    const result = await runner.run();

    // Halted by empty book
    expect(result.halted).toBe(true);
    expect(result.legs[0]!.filled).toBe(60);

    // Should have journaled a skew pause (leg 0 done at 60%, leg 1 at 0-30%)
    const pauseEntries = journalAppend.mock.calls.filter((c) => c[0] === 'multileg_skew_pause');
    expect(pauseEntries.length).toBeGreaterThan(0);
    expect((pauseEntries[0]![1] as { legIndex: number }).legIndex).toBe(0);
  });

  it('4. skew resume after laggard catches up (hysteresis)', async () => {
    // Leg 0 fills at 70% immediately; leg 1 takes longer to fill at 66%.
    // Between leg 0 completing and leg 1 completing, the poll loop should detect:
    //   pause: skew = 70% - 0% = 0.70 > 0.10
    //   resume: skew = 70% - 66% = 0.04 ≤ 0.05 (hysteresis)
    // Both legs eventually complete → run finishes without halt.
    const journal = tmpJournal();
    const journalAppend = vi.spyOn(journal, 'append');

    let l1ResolveFn!: (r: AggressiveResult) => void;
    const l1Promise = new Promise<AggressiveResult>((res) => { l1ResolveFn = res; });

    let callIdx = 0;
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockImplementation(() => {
      if (callIdx++ === 0) {
        return Promise.resolve({ filled: 70, orderId: 'o0', reason: 'partial' } as AggressiveResult);
      }
      return l1Promise;
    });

    const cfg: MultiLegJobConfig = {
      legs: [
        { ticker: 'AAAA', side: 'yes', size: 100, executionMode: 'aggressive' },
        { ticker: 'BBBB', side: 'yes', size: 100, executionMode: 'aggressive' },
      ],
      journal,
      client: makeMockClient(),
      aggressiveInvoke,
      passiveInvoke: makePassiveInvoke(0),
      fetchOrderbook: vi.fn().mockResolvedValue(makeBook()),
      now: vi.fn().mockReturnValueOnce(0).mockReturnValue(100),
      sleepMs: vi.fn().mockImplementation(yieldSleep),
      pollIntervalMs: 0,
      legSkewPct: 0.10,
    };

    // Release leg 1 with 66 fills after a tick (to allow pause detection first)
    setTimeout(() => l1ResolveFn({ filled: 66, orderId: 'o1', reason: 'partial' }), 5);

    const runner = new MultiLegJobRunner(cfg);
    const result = await runner.run();

    expect(result.halted).toBe(false); // both legs complete naturally
    expect(result.legs[0]!.filled).toBe(70);
    expect(result.legs[1]!.filled).toBe(66);

    const pauseEntries = journalAppend.mock.calls.filter((c) => c[0] === 'multileg_skew_pause');
    const resumeEntries = journalAppend.mock.calls.filter((c) => c[0] === 'multileg_skew_resume');

    // Pause should fire (leg 0 at 70%, leg 1 at 0% = 0.70 skew > 0.10)
    expect(pauseEntries.length).toBeGreaterThan(0);
    // Resume fires when leg 1 catches up: skew = 0.04 ≤ 0.05 (hysteresis)
    expect(resumeEntries.length).toBeGreaterThan(0);
  });

  it('5. empty book on one leg triggers multileg_halted with leg index + reason', async () => {
    const journal = tmpJournal();
    const journalAppend = vi.spyOn(journal, 'append');

    // First call returns empty book (leg 0), subsequent return healthy
    let bookCallCount = 0;
    const fetchOrderbook = vi.fn().mockImplementation(() => {
      bookCallCount++;
      if (bookCallCount === 1) {
        return Promise.resolve({ yes: [], no: [] });
      }
      return Promise.resolve(makeBook());
    });

    const cfg: MultiLegJobConfig = {
      legs: [
        { ticker: 'AAAA', side: 'yes', size: 100, executionMode: 'aggressive' },
        { ticker: 'BBBB', side: 'yes', size: 100, executionMode: 'aggressive' },
      ],
      journal,
      client: makeMockClient(),
      aggressiveInvoke: vi.fn().mockImplementation(() => new Promise(() => {})), // never resolves
      passiveInvoke: makePassiveInvoke(0),
      fetchOrderbook,
      now: vi.fn().mockReturnValueOnce(0).mockReturnValue(100),
      sleepMs: vi.fn().mockImplementation(yieldSleep),
      pollIntervalMs: 0,
    };

    const runner = new MultiLegJobRunner(cfg);
    const result = await runner.run();

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('empty book');

    const haltedEntries = journalAppend.mock.calls.filter((c) => c[0] === 'multileg_halted');
    expect(haltedEntries.length).toBe(1);
    expect((haltedEntries[0]![1] as { reason: string }).reason).toContain('empty book');
  });

  it('6. halt is idempotent — calling halt twice does not journal twice', async () => {
    const journal = tmpJournal();
    const journalAppend = vi.spyOn(journal, 'append');

    // Always empty book → halt on every iteration
    const fetchOrderbook = vi.fn().mockResolvedValue({ yes: [], no: [] });

    const cfg: MultiLegJobConfig = {
      legs: [
        { ticker: 'AAAA', side: 'yes', size: 100, executionMode: 'aggressive' },
        { ticker: 'BBBB', side: 'yes', size: 100, executionMode: 'aggressive' },
      ],
      journal,
      client: makeMockClient(),
      aggressiveInvoke: vi.fn().mockImplementation(() => new Promise(() => {})),
      passiveInvoke: makePassiveInvoke(0),
      fetchOrderbook,
      now: vi.fn().mockReturnValueOnce(0).mockReturnValue(100),
      sleepMs: vi.fn().mockImplementation(yieldSleep),
      pollIntervalMs: 0,
    };

    const runner = new MultiLegJobRunner(cfg);
    const result = await runner.run();

    expect(result.halted).toBe(true);
    const haltedEntries = journalAppend.mock.calls.filter((c) => c[0] === 'multileg_halted');
    expect(haltedEntries.length).toBe(1); // exactly once — idempotent
  });

  it('7. per-leg journal entries carry legIndex', async () => {
    const journal = tmpJournal();
    const journalAppend = vi.spyOn(journal, 'append');

    const cfg = baseConfig({ journal, pollIntervalMs: 0 });
    const runner = new MultiLegJobRunner(cfg);
    await runner.run();

    const legStarted = journalAppend.mock.calls.filter((c) => c[0] === 'multileg_leg_started');
    expect(legStarted.length).toBe(2);
    expect((legStarted[0]![1] as { legIndex: number }).legIndex).toBe(0);
    expect((legStarted[1]![1] as { legIndex: number }).legIndex).toBe(1);

    const legCompleted = journalAppend.mock.calls.filter((c) => c[0] === 'multileg_leg_completed');
    expect(legCompleted.length).toBe(2);
    expect((legCompleted[0]![1] as { legIndex: number }).legIndex).toBeGreaterThanOrEqual(0);
  });

  it('8. mixed execution modes (passive + aggressive) both run; result aggregates filled', async () => {
    const journal = tmpJournal();
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValue({
      filled: 50,
      orderId: 'o-agg',
      reason: 'filled',
    } as AggressiveResult);
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue({
      jobId: 'p1',
      filled: 75,
      avgPriceCents: 60,
      feesIncurredDollars: 0,
      remaining: 0,
      status: 'complete',
    } as PassiveResult);

    const cfg: MultiLegJobConfig = {
      legs: [
        { ticker: 'AAAA', side: 'yes', size: 50, executionMode: 'aggressive' },
        { ticker: 'BBBB', side: 'yes', size: 75, executionMode: 'passive' },
      ],
      journal,
      client: makeMockClient(),
      aggressiveInvoke,
      passiveInvoke,
      fetchOrderbook: vi.fn().mockResolvedValue(makeBook()),
      now: vi.fn().mockReturnValueOnce(0).mockReturnValue(100),
      sleepMs: vi.fn().mockImplementation(yieldSleep),
      pollIntervalMs: 0,
    };

    const runner = new MultiLegJobRunner(cfg);
    const result = await runner.run();

    expect(result.halted).toBe(false);
    expect(result.legs[0]!.filled).toBe(50);
    expect(result.legs[1]!.filled).toBe(75);
    expect(aggressiveInvoke).toHaveBeenCalledTimes(1);
    expect(passiveInvoke).toHaveBeenCalledTimes(1);
  });

  it('9. final result has correct halted flag + per-leg fills', async () => {
    const cfg = baseConfig({
      aggressiveInvoke: makeAggressiveInvoke(80),
      pollIntervalMs: 0,
    });
    const runner = new MultiLegJobRunner(cfg);
    const result = await runner.run();

    expect(result).toMatchObject({
      halted: false,
      legs: [
        { filled: 80, leg: expect.objectContaining({ ticker: 'AAAA-23' }) },
        { filled: 80, leg: expect.objectContaining({ ticker: 'BBBB-23' }) },
      ],
      durationMs: expect.any(Number),
    });
  });

  it('10. now() and sleepMs called during run; sleepMs called when legs are slow', async () => {
    const nowFn = vi.fn().mockReturnValue(1000);
    const sleepFn = vi.fn().mockImplementation(yieldSleep);

    // Use a slow leg to ensure poll loop runs multiple cycles → sleepMs gets called
    let l1ResolveFn!: (r: AggressiveResult) => void;
    const l1Promise = new Promise<AggressiveResult>((res) => { l1ResolveFn = res; });
    let callIdx = 0;
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockImplementation(() => {
      if (callIdx++ === 0) return Promise.resolve({ filled: 50, orderId: 'o0', reason: 'partial' } as AggressiveResult);
      return l1Promise;
    });

    setTimeout(() => l1ResolveFn({ filled: 50, orderId: 'o1', reason: 'partial' }), 5);

    const cfg = baseConfig({
      now: nowFn,
      sleepMs: sleepFn,
      aggressiveInvoke,
      pollIntervalMs: 1,
    });

    const runner = new MultiLegJobRunner(cfg);
    await runner.run();

    expect(nowFn).toHaveBeenCalled();
    expect(sleepFn).toHaveBeenCalled(); // sleepMs called at least once during the wait
  });

  it('11. pollIntervalMs=0 runs poll loop without real sleep', async () => {
    const sleepFn = vi.fn().mockImplementation(yieldSleep);
    const cfg = baseConfig({
      sleepMs: sleepFn,
      pollIntervalMs: 0,
    });

    const runner = new MultiLegJobRunner(cfg);
    const result = await runner.run();

    expect(result.halted).toBe(false);
    // The key assertion is that run() completed
    expect(result.legs).toHaveLength(2);
  });

  it('12. orderbook fetch throw propagates to halt-all', async () => {
    const journal = tmpJournal();
    const journalAppend = vi.spyOn(journal, 'append');

    const fetchOrderbook = vi.fn().mockRejectedValue(new Error('network timeout'));

    const cfg: MultiLegJobConfig = {
      legs: [
        { ticker: 'AAAA', side: 'yes', size: 100, executionMode: 'aggressive' },
        { ticker: 'BBBB', side: 'yes', size: 100, executionMode: 'aggressive' },
      ],
      journal,
      client: makeMockClient(),
      aggressiveInvoke: vi.fn().mockImplementation(() => new Promise(() => {})),
      passiveInvoke: makePassiveInvoke(0),
      fetchOrderbook,
      now: vi.fn().mockReturnValueOnce(0).mockReturnValue(100),
      sleepMs: vi.fn().mockImplementation(yieldSleep),
      pollIntervalMs: 0,
    };

    const runner = new MultiLegJobRunner(cfg);
    const result = await runner.run();

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('orderbook throw');
    expect(result.haltReason).toContain('network timeout');

    const haltedEntries = journalAppend.mock.calls.filter((c) => c[0] === 'multileg_halted');
    expect(haltedEntries.length).toBe(1);
  });
});
