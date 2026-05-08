/**
 * sTwap-runtick.test.ts — unit tests for STwapRunner.runOneTick() seam.
 *
 * Verifies:
 *  1. continue outcome on a mid-schedule tick
 *  2. break_loop / schedule_complete on the final interval
 *  3. break_loop / caller_stopped when stop() is called
 *  4. Regression: full run() still completes the schedule end-to-end
 */

import { describe, it, expect, vi } from 'vitest';
import {
  STwapRunner,
  computeSliceSizes,
  type STwapConfig,
  type STwapTickState,
  type PassiveInvokeFn,
} from '../../src/strategies/sTwap.js';
import { Journal } from '../../src/journal.js';
import type { PassiveResult } from '../../src/passive.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePassiveResult(filled: number): PassiveResult {
  return {
    jobId: 'test-job',
    filled,
    avgPriceCents: 50,
    feesIncurredDollars: 0,
    remaining: 0,
    status: 'complete',
  };
}

function makeJournal(): Journal {
  const j = new Journal('runtick-test', '/tmp');
  vi.spyOn(j, 'append');
  return j;
}

function makeNow(date = new Date('2025-01-15T12:00:00Z')): () => Date {
  return () => date;
}

function makeFreshState(startMs: number = Date.now()): STwapTickState {
  return {
    intervalIndex: 0,
    totalFilled: 0,
    intervalsFired: 0,
    fillWindow: [],
    startMs,
  };
}

const BASE_CONFIG: STwapConfig = {
  ticker: 'RUNTICK-MKT',
  side: 'sell',
  size: 100,
  intervalMinutes: 1,
  numIntervals: 4,
  sleepMs: vi.fn().mockResolvedValue(undefined),
  now: makeNow(),
};

// ── 1. continue on a mid-schedule tick ───────────────────────────────────────

describe('runOneTick — continue outcome', () => {
  it('returns { kind: "continue" } after a non-final interval fires', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const journal = makeJournal();
    const runner = new STwapRunner({ ...BASE_CONFIG }, journal);
    const slices = computeSliceSizes(100, 4); // [25, 25, 25, 25]
    const state = makeFreshState();

    const outcome = await runner.runOneTick(state, { slices, passiveInvoke, now: makeNow() });

    expect(outcome).toEqual({ kind: 'continue' });
    // State advanced
    expect(state.intervalIndex).toBe(1);
    expect(state.totalFilled).toBe(25);
    expect(state.intervalsFired).toBe(1);
    // passive was invoked once with correct slice
    const calls = (passiveInvoke as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0][0].size).toBe(25);
  });

  it('accumulates totalFilled across multiple runOneTick calls', async () => {
    const fills = [25, 25];
    let idx = 0;
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockImplementation(async () =>
      makePassiveResult(fills[idx++] ?? 0),
    );
    const runner = new STwapRunner({ ...BASE_CONFIG }, makeJournal());
    const slices = computeSliceSizes(100, 4);
    const state = makeFreshState();

    await runner.runOneTick(state, { slices, passiveInvoke, now: makeNow() });
    const outcome2 = await runner.runOneTick(state, { slices, passiveInvoke, now: makeNow() });

    expect(outcome2).toEqual({ kind: 'continue' });
    expect(state.intervalIndex).toBe(2);
    expect(state.totalFilled).toBe(50);
    expect(state.intervalsFired).toBe(2);
  });
});

// ── 2. break_loop / schedule_complete on final interval ───────────────────────

describe('runOneTick — schedule_complete', () => {
  it('returns break_loop/schedule_complete when last interval fires', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const runner = new STwapRunner({ ...BASE_CONFIG }, makeJournal());
    const slices = computeSliceSizes(100, 4);
    // Start at the last interval (index 3 of 4)
    const state = makeFreshState();
    state.intervalIndex = 3;

    const outcome = await runner.runOneTick(state, { slices, passiveInvoke, now: makeNow() });

    expect(outcome).toEqual({ kind: 'break_loop', reason: 'schedule_complete' });
    expect(state.intervalIndex).toBe(4); // advanced past end
    expect(state.intervalsFired).toBe(1);
  });

  it('journals twap_interval_fired before returning schedule_complete', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(28));
    const journal = makeJournal();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const runner = new STwapRunner({ ...BASE_CONFIG }, journal);
    const slices = computeSliceSizes(100, 4);
    const state = makeFreshState();
    state.intervalIndex = 3;

    await runner.runOneTick(state, { slices, passiveInvoke, now: makeNow() });

    const kinds = appendSpy.mock.calls.map((c) => c[0] as string);
    expect(kinds).toContain('twap_interval_fired');
  });
});

// ── 3. break_loop / caller_stopped ───────────────────────────────────────────

describe('runOneTick — caller_stopped', () => {
  it('returns break_loop/caller_stopped immediately when stop() pre-called', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const runner = new STwapRunner({ ...BASE_CONFIG }, makeJournal());
    runner.stop();
    const slices = computeSliceSizes(100, 4);
    const state = makeFreshState();

    const outcome = await runner.runOneTick(state, { slices, passiveInvoke, now: makeNow() });

    expect(outcome).toEqual({ kind: 'break_loop', reason: 'caller_stopped' });
    // passive must NOT have been called (pre-invoke guard)
    expect(passiveInvoke).not.toHaveBeenCalled();
    // state must be unchanged
    expect(state.intervalIndex).toBe(0);
    expect(state.intervalsFired).toBe(0);
  });

  it('returns break_loop/caller_stopped when stop() called inside passiveInvoke', async () => {
    let runner!: STwapRunner;
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockImplementation(async () => {
      runner.stop();
      return makePassiveResult(25);
    });
    runner = new STwapRunner({ ...BASE_CONFIG }, makeJournal());
    const slices = computeSliceSizes(100, 4);
    const state = makeFreshState();

    const outcome = await runner.runOneTick(state, { slices, passiveInvoke, now: makeNow() });

    expect(outcome).toEqual({ kind: 'break_loop', reason: 'caller_stopped' });
    // fill was recorded even though we stopped after invoke
    expect(state.intervalsFired).toBe(1);
    expect(state.totalFilled).toBe(25);
  });
});

// ── 4. Regression: full run() still completes schedule end-to-end ─────────────

describe('STwapRunner.run() regression via runOneTick seam', () => {
  it('run() fires all 4 intervals, totalFilled=100, reason=complete', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const runner = new STwapRunner(
      { ...BASE_CONFIG, passiveInvoke, sleepMs: vi.fn().mockResolvedValue(undefined) },
      makeJournal(),
    );

    const result = await runner.run();

    expect(result.intervalsFired).toBe(4);
    expect(result.totalFilled).toBe(100);
    expect(result.reason).toBe('complete');
    expect(passiveInvoke).toHaveBeenCalledTimes(4);
  });

  it('run() respects stop() called after first interval → reason=caller_stopped', async () => {
    let callCount = 0;
    let runner!: STwapRunner;
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) runner.stop();
      return makePassiveResult(25);
    });
    runner = new STwapRunner(
      { ...BASE_CONFIG, passiveInvoke, sleepMs: vi.fn().mockResolvedValue(undefined) },
      makeJournal(),
    );

    const result = await runner.run();

    expect(result.reason).toBe('caller_stopped');
    expect(result.intervalsFired).toBe(1);
  });

  it('run() journals started → interval_fired×N → finished in order', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const journal = makeJournal();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const runner = new STwapRunner(
      { ...BASE_CONFIG, passiveInvoke, sleepMs: vi.fn().mockResolvedValue(undefined) },
      journal,
    );

    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0] as string);
    expect(kinds[0]).toBe('twap_started');
    expect(kinds[kinds.length - 1]).toBe('twap_finished');
    const fired = kinds.filter((k) => k === 'twap_interval_fired');
    expect(fired).toHaveLength(4);
  });
});
