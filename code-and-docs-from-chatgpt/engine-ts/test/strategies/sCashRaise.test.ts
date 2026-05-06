/**
 * sCashRaise.test.ts — TDD suite for S10 cash-raise sequencer.
 *
 * All invokes are mocked via injectable functions. Journal is mocked with vi.spyOn.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SCashRaiseRunner,
  buildSCashRaiseArgs,
} from '../../src/strategies/sCashRaise.js';
import type {
  SCashRaiseArgs,
  AggressiveInvokeFn,
  PassiveInvokeFn,
  CashRaisePosition,
} from '../../src/strategies/sCashRaise.js';
import type { AggressiveResult } from '../../src/aggressive.js';
import type { PassiveResult } from '../../src/passive.js';
import { Journal } from '../../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const FUTURE_MS = Date.now() + 60_000;

function makeAggressiveResult(filled: number): AggressiveResult {
  return { filled, orderId: 'order-test', reason: filled > 0 ? 'filled' : 'unfilled' };
}

function makePassiveResult(filled: number): PassiveResult {
  return {
    jobId: 'passive-job',
    filled,
    avgPriceCents: filled > 0 ? 60 : 0,
    feesIncurredDollars: 0,
    remaining: 0,
    status: filled > 0 ? 'complete' : 'partial',
  };
}

function makeJournalSpy(id = 'test-s10'): Journal {
  const j = new Journal(id, '/tmp/s10-test-home');
  vi.spyOn(j, 'append');
  return j;
}

function makeBasePositions(): CashRaisePosition[] {
  return [
    { ticker: 'MKT-A', side: 'sell', size: 100, strategyName: 'aggressive' },
    { ticker: 'MKT-B', side: 'sell', size: 50, strategyName: 'passive' },
    { ticker: 'MKT-C', side: 'sell', size: 80, strategyName: 'aggressive' },
  ];
}

function makeBaseArgs(overrides: Partial<SCashRaiseArgs> = {}): SCashRaiseArgs {
  return {
    positions: makeBasePositions(),
    targetCashDollars: 200,
    deadlineEpochMs: FUTURE_MS,
    aggressiveInvoke: vi.fn().mockResolvedValue(makeAggressiveResult(100)),
    passiveInvoke: vi.fn().mockResolvedValue(makePassiveResult(50)),
    now: () => Date.now(),
    getCurrentBidCents: vi.fn().mockResolvedValue(60),
    ...overrides,
  };
}

// ── 1. Validation ─────────────────────────────────────────────────────────────

describe('buildSCashRaiseArgs — validation', () => {
  it('throws when positions is empty', () => {
    expect(() =>
      buildSCashRaiseArgs(makeBaseArgs({ positions: [] })),
    ).toThrow('positions must be non-empty');
  });

  it('throws when a position side is not sell', () => {
    const positions: CashRaisePosition[] = [
      { ticker: 'MKT-A', side: 'sell', size: 100, strategyName: 'aggressive' },
      // Force bad side via cast
      { ticker: 'MKT-B', side: 'buy' as 'sell', size: 50, strategyName: 'passive' },
    ];
    expect(() =>
      buildSCashRaiseArgs(makeBaseArgs({ positions })),
    ).toThrow("position side must be 'sell'");
  });

  it('throws when a position size is <= 0', () => {
    const positions: CashRaisePosition[] = [
      { ticker: 'MKT-A', side: 'sell', size: 0, strategyName: 'aggressive' },
    ];
    expect(() =>
      buildSCashRaiseArgs(makeBaseArgs({ positions })),
    ).toThrow('position size must be > 0');
  });

  it('throws when targetCashDollars is <= 0', () => {
    expect(() =>
      buildSCashRaiseArgs(makeBaseArgs({ targetCashDollars: 0 })),
    ).toThrow('targetCashDollars must be > 0');
  });

  it('throws when deadlineEpochMs is in the past', () => {
    expect(() =>
      buildSCashRaiseArgs(makeBaseArgs({ deadlineEpochMs: Date.now() - 1000 })),
    ).toThrow('deadlineEpochMs must be in the future');
  });

  it('accepts valid args without throwing', () => {
    expect(() => buildSCashRaiseArgs(makeBaseArgs())).not.toThrow();
  });
});

// ── 2. Happy path: all 3 positions, target met after pos 2 ───────────────────

describe('SCashRaiseRunner — target met after 2nd position', () => {
  it('halts after pos 2, returns target_met, pos 3 not invoked', async () => {
    // pos1: 100 shares × 60¢ = $60. pos2: 50 shares × 60¢ = $30. Total=$90.
    // targetCashDollars=90 → target met after pos2, pos3 skipped.
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(100));
    const passiveInvoke: PassiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makePassiveResult(50));

    const args = makeBaseArgs({
      positions: [
        { ticker: 'MKT-A', side: 'sell', size: 100, strategyName: 'aggressive' },
        { ticker: 'MKT-B', side: 'sell', size: 50, strategyName: 'passive' },
        { ticker: 'MKT-C', side: 'sell', size: 80, strategyName: 'aggressive' },
      ],
      targetCashDollars: 90,
      aggressiveInvoke,
      passiveInvoke,
      getCurrentBidCents: vi.fn().mockResolvedValue(60),
    });

    const runner = new SCashRaiseRunner(args);
    const result = await runner.run();

    expect(result.reason).toBe('target_met');
    expect(result.positions.length).toBe(2); // pos3 not run
    expect(result.totalRaisedDollars).toBeCloseTo(90);
    expect(aggressiveInvoke).toHaveBeenCalledTimes(1); // only pos1 (aggressive)
    expect(passiveInvoke).toHaveBeenCalledTimes(1);    // pos2 (passive)
  });

  it('cash math: 100 shares × 60¢ = $60 raised', async () => {
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(100));

    const args = makeBaseArgs({
      positions: [{ ticker: 'MKT-A', side: 'sell', size: 100, strategyName: 'aggressive' }],
      targetCashDollars: 999, // won't be met — we check position math
      aggressiveInvoke,
      passiveInvoke: vi.fn(),
      getCurrentBidCents: vi.fn().mockResolvedValue(60),
    });

    const runner = new SCashRaiseRunner(args);
    const result = await runner.run();

    expect(result.positions[0].filledShares).toBe(100);
    expect(result.positions[0].bidCentsAtFill).toBe(60);
    expect(result.positions[0].raisedDollars).toBeCloseTo(60);
    expect(result.totalRaisedDollars).toBeCloseTo(60);
  });
});

// ── 3. Deadline hit mid-sequence ──────────────────────────────────────────────

describe('SCashRaiseRunner — deadline hit', () => {
  it('deadline expires before pos 2 starts → deadline_hit, pos 2 not invoked', async () => {
    let callCount = 0;
    // First call: before pos1 (future), second call: before pos2 (past)
    const now = vi.fn().mockImplementation(() => {
      callCount++;
      // Calls: 1=validation, 2=before pos1 check, then after pos1 check
      // We want to expire after pos1 completes
      return callCount >= 4 ? FUTURE_MS + 1000 : Date.now();
    });

    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(50));
    const passiveInvoke: PassiveInvokeFn = vi.fn();

    const args: SCashRaiseArgs = {
      positions: [
        { ticker: 'MKT-A', side: 'sell', size: 50, strategyName: 'aggressive' },
        { ticker: 'MKT-B', side: 'sell', size: 50, strategyName: 'passive' },
      ],
      targetCashDollars: 999,
      deadlineEpochMs: FUTURE_MS,
      aggressiveInvoke,
      passiveInvoke,
      now,
      getCurrentBidCents: vi.fn().mockResolvedValue(60),
    };

    const runner = new SCashRaiseRunner(args);
    const result = await runner.run();

    expect(result.reason).toBe('deadline_hit');
    expect(passiveInvoke).not.toHaveBeenCalled();
  });
});

// ── 4. Position failure: continue to next ─────────────────────────────────────

describe('SCashRaiseRunner — position failure resilience', () => {
  it('pos 2 throws → journals cashraise_position_failed, continues to pos 3', async () => {
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;

    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValueOnce(makeAggressiveResult(50)) // pos1 ok
      .mockRejectedValueOnce(new Error('market closed'))  // pos2 fails
      .mockResolvedValueOnce(makeAggressiveResult(80));   // pos3 ok

    const args = makeBaseArgs({
      positions: [
        { ticker: 'MKT-A', side: 'sell', size: 50, strategyName: 'aggressive' },
        { ticker: 'MKT-B', side: 'sell', size: 50, strategyName: 'aggressive' },
        { ticker: 'MKT-C', side: 'sell', size: 80, strategyName: 'aggressive' },
      ],
      targetCashDollars: 999,
      aggressiveInvoke,
      passiveInvoke: vi.fn(),
      getCurrentBidCents: vi.fn().mockResolvedValue(60),
    });

    const runner = new SCashRaiseRunner(args, journal);
    const result = await runner.run();

    // pos3 ran
    expect(aggressiveInvoke).toHaveBeenCalledTimes(3);
    expect(result.positions).toHaveLength(3);

    // pos2 has error field
    expect(result.positions[1].error).toBe('market closed');
    expect(result.positions[1].filledShares).toBe(0);

    // journal includes position_failed for pos2
    const failedKinds = appendSpy.mock.calls
      .map((c) => c[0] as string)
      .filter((k) => k === 'cashraise_position_failed');
    expect(failedKinds).toHaveLength(1);
  });
});

// ── 5. All positions complete with no halt ────────────────────────────────────

describe('SCashRaiseRunner — all positions complete (no halt)', () => {
  it('returns finished when target not met and no deadline hit', async () => {
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(1)); // tiny fills, won't hit target

    const args = makeBaseArgs({
      positions: [
        { ticker: 'MKT-A', side: 'sell', size: 1, strategyName: 'aggressive' },
        { ticker: 'MKT-B', side: 'sell', size: 1, strategyName: 'aggressive' },
      ],
      targetCashDollars: 9999,
      aggressiveInvoke,
      passiveInvoke: vi.fn(),
      getCurrentBidCents: vi.fn().mockResolvedValue(1),
    });

    const runner = new SCashRaiseRunner(args);
    const result = await runner.run();

    expect(result.reason).toBe('finished');
    expect(result.positions).toHaveLength(2);
  });
});

// ── 6. Strategy dispatch per branch ──────────────────────────────────────────

describe('SCashRaiseRunner — strategy dispatch routing', () => {
  it('aggressive position calls aggressiveInvoke with confirmedAggressive=true', async () => {
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(10));
    const passiveInvoke: PassiveInvokeFn = vi.fn();

    const args = makeBaseArgs({
      positions: [{ ticker: 'MKT-X', side: 'sell', size: 10, strategyName: 'aggressive' }],
      targetCashDollars: 9999,
      aggressiveInvoke,
      passiveInvoke,
      getCurrentBidCents: vi.fn().mockResolvedValue(50),
    });

    await new SCashRaiseRunner(args).run();

    expect(aggressiveInvoke).toHaveBeenCalledTimes(1);
    expect(passiveInvoke).not.toHaveBeenCalled();

    const callArg = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg).toMatchObject({
      ticker: 'MKT-X',
      action: 'sell',
      size: 10,
      confirmedAggressive: true,
    });
  });

  it('passive position calls passiveInvoke with correct ticker + side + size', async () => {
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn();
    const passiveInvoke: PassiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makePassiveResult(20));

    const args = makeBaseArgs({
      positions: [{ ticker: 'MKT-Y', side: 'sell', size: 20, strategyName: 'passive' }],
      targetCashDollars: 9999,
      aggressiveInvoke,
      passiveInvoke,
      getCurrentBidCents: vi.fn().mockResolvedValue(50),
    });

    await new SCashRaiseRunner(args).run();

    expect(passiveInvoke).toHaveBeenCalledTimes(1);
    expect(aggressiveInvoke).not.toHaveBeenCalled();

    const callArg = (passiveInvoke as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg).toMatchObject({
      ticker: 'MKT-Y',
      side: 'sell',
      size: 20,
    });
  });
});

// ── 7. Journal order ──────────────────────────────────────────────────────────

describe('SCashRaiseRunner — journal ordering', () => {
  it('full run: cashraise_started → per-pos → cashraise_finished', async () => {
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;

    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(1));

    const args = makeBaseArgs({
      positions: [
        { ticker: 'MKT-A', side: 'sell', size: 1, strategyName: 'aggressive' },
      ],
      targetCashDollars: 9999,
      aggressiveInvoke,
      passiveInvoke: vi.fn(),
      getCurrentBidCents: vi.fn().mockResolvedValue(1),
    });

    const runner = new SCashRaiseRunner(args, journal);
    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0] as string);
    expect(kinds[0]).toBe('cashraise_started');
    expect(kinds[1]).toBe('cashraise_position_started');
    expect(kinds[2]).toBe('cashraise_position_completed');
    expect(kinds[kinds.length - 1]).toBe('cashraise_finished');
  });

  it('target_met: ends with cashraise_target_met journal entry', async () => {
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;

    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(100));

    const args = makeBaseArgs({
      positions: [{ ticker: 'MKT-A', side: 'sell', size: 100, strategyName: 'aggressive' }],
      targetCashDollars: 1, // easily met
      aggressiveInvoke,
      passiveInvoke: vi.fn(),
      getCurrentBidCents: vi.fn().mockResolvedValue(60),
    });

    const runner = new SCashRaiseRunner(args, journal);
    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0] as string);
    expect(kinds[kinds.length - 1]).toBe('cashraise_target_met');
  });
});

// ── 8. target_met after exactly 2 positions (precise targeting) ───────────────

describe('SCashRaiseRunner — target met precise', () => {
  it('target=$90, pos1=100×60¢=$60, pos2=50×60¢=$30 → total=$90 → target_met, pos3 skipped', async () => {
    const aggressiveInvoke: AggressiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makeAggressiveResult(100));
    const passiveInvoke: PassiveInvokeFn = vi
      .fn()
      .mockResolvedValue(makePassiveResult(50));

    const args = makeBaseArgs({
      positions: [
        { ticker: 'MKT-A', side: 'sell', size: 100, strategyName: 'aggressive' },
        { ticker: 'MKT-B', side: 'sell', size: 50, strategyName: 'passive' },
        { ticker: 'MKT-C', side: 'sell', size: 80, strategyName: 'aggressive' },
      ],
      targetCashDollars: 90,
      aggressiveInvoke,
      passiveInvoke,
      getCurrentBidCents: vi.fn().mockResolvedValue(60),
    });

    const runner = new SCashRaiseRunner(args);
    const result = await runner.run();

    expect(result.reason).toBe('target_met');
    expect(result.positions).toHaveLength(2);
    expect(result.totalRaisedDollars).toBeCloseTo(90);
    // pos3 (aggressive) not called
    expect(aggressiveInvoke).toHaveBeenCalledTimes(1);
  });
});

// ── 9. Negative size validation ───────────────────────────────────────────────

describe('buildSCashRaiseArgs — negative size', () => {
  it('throws on negative size', () => {
    expect(() =>
      buildSCashRaiseArgs(
        makeBaseArgs({
          positions: [{ ticker: 'MKT-A', side: 'sell', size: -5, strategyName: 'aggressive' }],
        }),
      ),
    ).toThrow('position size must be > 0');
  });
});

// ── 10. Invalid strategyName ──────────────────────────────────────────────────

describe('buildSCashRaiseArgs — invalid strategyName', () => {
  it('throws on unknown strategyName', () => {
    expect(() =>
      buildSCashRaiseArgs(
        makeBaseArgs({
          positions: [
            {
              ticker: 'MKT-A',
              side: 'sell',
              size: 10,
              strategyName: 'limit' as 'aggressive',
            },
          ],
        }),
      ),
    ).toThrow("strategyName must be 'aggressive' or 'passive'");
  });
});
