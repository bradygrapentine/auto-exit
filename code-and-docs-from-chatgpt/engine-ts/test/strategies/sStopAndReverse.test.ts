/**
 * sStopAndReverse.test.ts — TDD suite for S9 stop-and-reverse runner.
 *
 * AggressiveRunner invocation is mocked via config.aggressiveInvoke so we
 * never spin up the real aggressive strategy. Journal is mocked with vi.spyOn.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SStopAndReverseRunner } from '../../src/strategies/sStopAndReverse.js';
import type {
  SStopAndReverseConfig,
  AggressiveInvokeFn,
} from '../../src/strategies/sStopAndReverse.js';
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
    getPosition: vi.fn(),
    getRestingOrderCount: vi.fn(),
    findOrderByClientOrderId: vi.fn(),
  } as unknown as KalshiClientLike;
}

function makeJournalSpy(keaHome = '/tmp/s9-test-home'): Journal {
  const j = new Journal('test-s9-job', keaHome);
  vi.spyOn(j, 'append');
  return j;
}

function makeResult(
  filled: number,
  reason: AggressiveResult['reason'],
): AggressiveResult {
  return { filled, orderId: `order-${reason}`, reason };
}

const BASE_CONFIG: Omit<SStopAndReverseConfig, 'aggressiveInvoke'> = {
  ticker: 'TEST-MARKET',
  closeSide: 'yes',
  closeSize: 10,
  openSide: 'no',
  openSize: 10,
  confirmedReverse: true,
};

// ── 1. Validation tests ───────────────────────────────────────────────────────

describe('SStopAndReverseRunner — validation', () => {
  it('throws when confirmedReverse=false', () => {
    expect(
      () => new SStopAndReverseRunner(makeMockClient(), { ...BASE_CONFIG, confirmedReverse: false }),
    ).toThrow('S9 requires confirmedReverse=true');
  });

  it('throws when closeSize <= 0', () => {
    expect(
      () => new SStopAndReverseRunner(makeMockClient(), { ...BASE_CONFIG, closeSize: 0 }),
    ).toThrow('sizes must be > 0');
  });

  it('throws when openSize <= 0', () => {
    expect(
      () => new SStopAndReverseRunner(makeMockClient(), { ...BASE_CONFIG, openSize: -1 }),
    ).toThrow('sizes must be > 0');
  });

  it('throws when ticker is empty', () => {
    expect(
      () => new SStopAndReverseRunner(makeMockClient(), { ...BASE_CONFIG, ticker: '' }),
    ).toThrow('ticker required');
  });
});

// ── 2. Happy path ─────────────────────────────────────────────────────────────

describe('SStopAndReverseRunner — happy path', () => {
  it('phase 1 fills → phase 2 fires; both in result', async () => {
    const phase1Result = makeResult(10, 'filled');
    const phase2Result = makeResult(10, 'filled');
    const invoke: AggressiveInvokeFn = vi.fn()
      .mockResolvedValueOnce(phase1Result)
      .mockResolvedValueOnce(phase2Result);

    const runner = new SStopAndReverseRunner(
      makeMockClient(),
      { ...BASE_CONFIG, aggressiveInvoke: invoke },
    );

    const result = await runner.run();

    expect(result.phase1).toBe(phase1Result);
    expect(result.phase2).toBe(phase2Result);
    expect(result.reason).toBe('complete');
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});

// ── 3. Phase 1 unfilled → halt ────────────────────────────────────────────────

describe('SStopAndReverseRunner — phase 1 unfilled', () => {
  it('returns phase1_unfilled, no phase2, invoke called once', async () => {
    const phase1Result = makeResult(0, 'unfilled');
    const invoke: AggressiveInvokeFn = vi.fn().mockResolvedValueOnce(phase1Result);

    const runner = new SStopAndReverseRunner(
      makeMockClient(),
      { ...BASE_CONFIG, aggressiveInvoke: invoke },
    );

    const result = await runner.run();

    expect(result.phase1).toBe(phase1Result);
    expect(result.phase2).toBeUndefined();
    expect(result.reason).toBe('phase1_unfilled');
    expect(invoke).toHaveBeenCalledTimes(1);
  });
});

// ── 4. Phase 1 partial → phase 2 still fires ─────────────────────────────────

describe('SStopAndReverseRunner — phase 1 partial', () => {
  it('phase 2 fires; reason=phase1_partial_completed', async () => {
    const phase1Result = makeResult(5, 'partial');
    const phase2Result = makeResult(10, 'filled');
    const invoke: AggressiveInvokeFn = vi.fn()
      .mockResolvedValueOnce(phase1Result)
      .mockResolvedValueOnce(phase2Result);

    const runner = new SStopAndReverseRunner(
      makeMockClient(),
      { ...BASE_CONFIG, aggressiveInvoke: invoke },
    );

    const result = await runner.run();

    expect(result.phase1).toBe(phase1Result);
    expect(result.phase2).toBe(phase2Result);
    expect(result.reason).toBe('phase1_partial_completed');
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});

// ── 5. Config args passed correctly to each phase ─────────────────────────────

describe('SStopAndReverseRunner — injectable config verification', () => {
  it('calls phase 1 with sell config and phase 2 with buy config', async () => {
    const invoke: AggressiveInvokeFn = vi.fn()
      .mockResolvedValueOnce(makeResult(10, 'filled'))
      .mockResolvedValueOnce(makeResult(10, 'filled'));

    const cfg: SStopAndReverseConfig = {
      ...BASE_CONFIG,
      ticker: 'MKTX',
      closeSide: 'yes',
      closeSize: 5,
      openSide: 'no',
      openSize: 8,
      oneTickIn: true,
      aggressiveInvoke: invoke,
    };

    const runner = new SStopAndReverseRunner(makeMockClient(), cfg);
    await runner.run();

    const calls = (invoke as ReturnType<typeof vi.fn>).mock.calls as [AggressiveConfig, Journal | undefined][];

    // Phase 1 config
    expect(calls[0][0]).toMatchObject({
      ticker: 'MKTX',
      side: 'yes',
      action: 'sell',
      size: 5,
      confirmedAggressive: true,
      oneTickIn: true,
    });

    // Phase 2 config
    expect(calls[1][0]).toMatchObject({
      ticker: 'MKTX',
      side: 'no',
      action: 'buy',
      size: 8,
      confirmedAggressive: true,
      oneTickIn: true,
    });
  });
});

// ── 6. Journal entries in order ───────────────────────────────────────────────

describe('SStopAndReverseRunner — journal ordering', () => {
  it('full run: reverse_started → reverse_phase1_close → reverse_phase2_open → reverse_finished', async () => {
    const invoke: AggressiveInvokeFn = vi.fn()
      .mockResolvedValueOnce(makeResult(10, 'filled'))
      .mockResolvedValueOnce(makeResult(10, 'filled'));

    const journal = makeJournalSpy();
    const runner = new SStopAndReverseRunner(
      makeMockClient(),
      { ...BASE_CONFIG, aggressiveInvoke: invoke },
      journal,
    );

    await runner.run();

    const appendSpy = vi.mocked(journal.append);
    const kinds = appendSpy.mock.calls.map((c) => c[0] as unknown as string);
    expect(kinds).toEqual([
      'reverse_started',
      'reverse_phase1_close',
      'reverse_phase2_open',
      'reverse_finished',
    ]);
  });

  it('halted run: reverse_started → reverse_phase1_close → reverse_finished', async () => {
    const invoke: AggressiveInvokeFn = vi.fn()
      .mockResolvedValueOnce(makeResult(0, 'unfilled'));

    const journal = makeJournalSpy();
    const runner = new SStopAndReverseRunner(
      makeMockClient(),
      { ...BASE_CONFIG, aggressiveInvoke: invoke },
      journal,
    );

    await runner.run();

    const appendSpy = vi.mocked(journal.append);
    const kinds = appendSpy.mock.calls.map((c) => c[0] as unknown as string);
    expect(kinds).toEqual([
      'reverse_started',
      'reverse_phase1_close',
      'reverse_finished',
    ]);
  });
});
