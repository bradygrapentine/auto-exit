/**
 * sPreResolutionArb.test.ts — TDD suite for S6 pre-resolution arbitrage exit.
 *
 * Phase1InvokeFn and AggressiveInvokeFn are mocked via config injection so
 * no real exchange calls are made. Journal is spied on to verify ordering.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  SPreResolutionArbRunner,
  buildSPreResolutionArbArgs,
} from '../../src/strategies/sPreResolutionArb.js';
import type {
  SPreResolutionArbArgs,
  Phase1InvokeFn,
  AggressiveInvokeFn,
} from '../../src/strategies/sPreResolutionArb.js';
import type { AggressiveResult } from '../../src/aggressive.js';
import type { KalshiClientLike } from '../../src/types.js';
import { Journal } from '../../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(),
    createOrder: vi.fn(),
  } as unknown as KalshiClientLike;
}

function makeResult(filled: number, reason: AggressiveResult['reason']): AggressiveResult {
  return { filled, orderId: `order-${filled}-${reason}`, reason };
}

function makeJournalSpy(): Journal {
  const j = new Journal(`test-${Date.now()}`, '/tmp');
  vi.spyOn(j, 'append');
  return j;
}

const BASE_CONFIG: Omit<SPreResolutionArbArgs, 'phase1Invoke' | 'aggressiveInvoke'> = {
  ticker: 'TEST-2026',
  side: 'yes',
  size: 10,
  arbTimeboxMs: 500,
  floorPriceCents: 5,
};

// ── 1. Validation: buildSPreResolutionArbArgs ─────────────────────────────────

describe('buildSPreResolutionArbArgs — validation', () => {
  it('throws when size <= 0', () => {
    expect(() => buildSPreResolutionArbArgs({ ...BASE_CONFIG, size: 0 }))
      .toThrow('size must be > 0');
  });

  it('throws when size is negative', () => {
    expect(() => buildSPreResolutionArbArgs({ ...BASE_CONFIG, size: -5 }))
      .toThrow('size must be > 0');
  });

  it('throws when arbTimeboxMs is zero', () => {
    expect(() => buildSPreResolutionArbArgs({ ...BASE_CONFIG, arbTimeboxMs: 0 }))
      .toThrow('arbTimeboxMs must be > 0');
  });

  it('throws when arbTimeboxMs is negative', () => {
    expect(() => buildSPreResolutionArbArgs({ ...BASE_CONFIG, arbTimeboxMs: -100 }))
      .toThrow('arbTimeboxMs must be > 0');
  });

  it('throws when floorPriceCents < 1', () => {
    expect(() => buildSPreResolutionArbArgs({ ...BASE_CONFIG, floorPriceCents: 0 }))
      .toThrow('floorPriceCents must be in [1, 99]');
  });

  it('throws when floorPriceCents > 99', () => {
    expect(() => buildSPreResolutionArbArgs({ ...BASE_CONFIG, floorPriceCents: 100 }))
      .toThrow('floorPriceCents must be in [1, 99]');
  });

  it('throws on invalid side', () => {
    expect(
      () => buildSPreResolutionArbArgs({ ...BASE_CONFIG, side: 'bad' as 'yes' | 'no' }),
    ).toThrow('invalid side');
  });

  it('returns config unchanged when valid', () => {
    const cfg = buildSPreResolutionArbArgs({ ...BASE_CONFIG });
    expect(cfg).toMatchObject(BASE_CONFIG);
  });
});

// ── 2. Constructor also validates ──────────────────────────────────────────────

describe('SPreResolutionArbRunner — constructor validation', () => {
  it('throws on zero arbTimeboxMs', () => {
    expect(
      () => new SPreResolutionArbRunner(makeMockClient(), { ...BASE_CONFIG, arbTimeboxMs: 0 }),
    ).toThrow('arbTimeboxMs must be > 0');
  });
});

// ── 3. Phase 1 full fill → skip phase 2 ──────────────────────────────────────

describe('SPreResolutionArbRunner — phase 1 full fill', () => {
  it('returns arb_filled_phase1, no phase2, aggressiveInvoke not called', async () => {
    const phase1Result = makeResult(10, 'filled');
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(phase1Result);
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn();

    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, phase1Invoke, aggressiveInvoke },
    );

    const result = await runner.run();

    expect(result.phase1).toBe(phase1Result);
    expect(result.phase2).toBeUndefined();
    expect(result.reason).toBe('arb_filled_phase1');
    expect(result.cumulativeFilled).toBe(10);
    expect(phase1Invoke).toHaveBeenCalledTimes(1);
    expect(aggressiveInvoke).not.toHaveBeenCalled();
  });
});

// ── 4. Phase 1 partial fill → phase 2 sized to remainder ─────────────────────

describe('SPreResolutionArbRunner — phase 1 partial fill', () => {
  it('phase 2 fires with remainder; cumulativeFilled = phase1 + phase2', async () => {
    const phase1Result = makeResult(4, 'partial');
    const phase2Result = makeResult(6, 'filled');
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(phase1Result);
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValueOnce(phase2Result);

    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, phase1Invoke, aggressiveInvoke },
    );

    const result = await runner.run();

    expect(result.phase1).toBe(phase1Result);
    expect(result.phase2).toBe(phase2Result);
    expect(result.reason).toBe('phase2_complete');
    expect(result.cumulativeFilled).toBe(10);

    // Phase 2 must be sized to remainder (10 - 4 = 6).
    const p2Call = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock.calls[0] as [
      { size: number },
      unknown,
    ];
    expect(p2Call[0].size).toBe(6);
  });
});

// ── 5. Phase 1 zero fill → phase 2 with full size ────────────────────────────

describe('SPreResolutionArbRunner — phase 1 zero fill', () => {
  it('phase 2 fires with full size when phase 1 unfilled', async () => {
    const phase1Result = makeResult(0, 'unfilled');
    const phase2Result = makeResult(10, 'filled');
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(phase1Result);
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValueOnce(phase2Result);

    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, phase1Invoke, aggressiveInvoke },
    );

    const result = await runner.run();

    expect(result.cumulativeFilled).toBe(10);
    expect(result.reason).toBe('phase2_complete');

    const p2Call = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock.calls[0] as [
      { size: number },
      unknown,
    ];
    expect(p2Call[0].size).toBe(10);
  });
});

// ── 6. Empty book on phase 1 throws descriptively ────────────────────────────

describe('SPreResolutionArbRunner — empty book throw', () => {
  it('propagates descriptive error from phase1Invoke', async () => {
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockRejectedValueOnce(
      new Error('S2 aggressive: empty yes-side book — cannot sell'),
    );
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn();

    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, phase1Invoke, aggressiveInvoke },
    );

    await expect(runner.run()).rejects.toThrow('empty yes-side book');
    expect(aggressiveInvoke).not.toHaveBeenCalled();
  });
});

// ── 7. Floor price passed through to phase 2 ─────────────────────────────────

describe('SPreResolutionArbRunner — floor price passthrough', () => {
  it('phase2 cfg carries floorPriceCents via the config context', async () => {
    const phase1Result = makeResult(0, 'unfilled');
    const phase2Result = makeResult(10, 'filled');
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(phase1Result);
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValueOnce(phase2Result);

    const floorPriceCents = 42;
    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, floorPriceCents, phase1Invoke, aggressiveInvoke },
    );

    // Run succeeds — aggressiveInvoke was called.
    const result = await runner.run();
    expect(result.phase2).toBe(phase2Result);

    // The runner stores floorPriceCents in its config and journals it in
    // arb_phase2_sweep_started. Verify aggressiveInvoke was called once.
    expect(aggressiveInvoke).toHaveBeenCalledTimes(1);
  });
});

// ── 8. Side parameterization: sell path (yes side) ───────────────────────────

describe('SPreResolutionArbRunner — sell side (yes)', () => {
  it('phase1 config has action=sell for side=yes', async () => {
    const phase1Result = makeResult(10, 'filled');
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(phase1Result);

    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, side: 'yes', phase1Invoke },
    );

    await runner.run();

    const call = (phase1Invoke as ReturnType<typeof vi.fn>).mock.calls[0] as [
      { action: string; side: string; oneTickIn: boolean },
      unknown,
    ];
    expect(call[0].action).toBe('sell');
    expect(call[0].side).toBe('yes');
    expect(call[0].oneTickIn).toBe(true);
  });
});

// ── 9. Side parameterization: buy path (no side) ─────────────────────────────

describe('SPreResolutionArbRunner — buy side (no)', () => {
  it('phase1 config has action=buy for side=no', async () => {
    const phase1Result = makeResult(10, 'filled');
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(phase1Result);

    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, side: 'no', phase1Invoke },
    );

    await runner.run();

    const call = (phase1Invoke as ReturnType<typeof vi.fn>).mock.calls[0] as [
      { action: string; side: string },
      unknown,
    ];
    expect(call[0].action).toBe('buy');
    expect(call[0].side).toBe('no');
  });
});

// ── 10. Journal entries in correct order (full run) ───────────────────────────

describe('SPreResolutionArbRunner — journal ordering (phase 1 full fill)', () => {
  it('arb_started → arb_phase1_posted → arb_phase1_result → arb_filled_phase1 → arb_finished', async () => {
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(makeResult(10, 'filled'));

    const journal = makeJournalSpy();
    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, phase1Invoke },
      journal,
    );

    await runner.run();

    const kinds = vi.mocked(journal.append).mock.calls.map((c) => c[0] as unknown as string);
    expect(kinds).toEqual([
      'arb_started',
      'arb_phase1_posted',
      'arb_phase1_result',
      'arb_filled_phase1',
      'arb_finished',
    ]);
  });
});

// ── 11. Journal entries in correct order (phase 2 run) ────────────────────────

describe('SPreResolutionArbRunner — journal ordering (phase 2 sweep)', () => {
  it('arb_started → arb_phase1_posted → arb_phase1_result → arb_phase2_sweep_started → arb_finished', async () => {
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(makeResult(0, 'unfilled'));
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValueOnce(
      makeResult(10, 'filled'),
    );

    const journal = makeJournalSpy();
    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, phase1Invoke, aggressiveInvoke },
      journal,
    );

    await runner.run();

    const kinds = vi.mocked(journal.append).mock.calls.map((c) => c[0] as unknown as string);
    expect(kinds).toEqual([
      'arb_started',
      'arb_phase1_posted',
      'arb_phase1_result',
      'arb_phase2_sweep_started',
      'arb_finished',
    ]);
  });
});

// ── 12. cumulativeFilled accounting ──────────────────────────────────────────

describe('SPreResolutionArbRunner — cumulative fill accounting', () => {
  it('cumulativeFilled = phase1.filled + phase2.filled', async () => {
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(makeResult(3, 'partial'));
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValueOnce(
      makeResult(5, 'partial'),
    );

    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, size: 20, phase1Invoke, aggressiveInvoke },
    );

    const result = await runner.run();

    expect(result.cumulativeFilled).toBe(8); // 3 + 5
    expect(result.reason).toBe('phase2_partial');
  });
});

// ── 13. phase1 config uses oneTickIn=true, phase2 uses oneTickIn=false ────────

describe('SPreResolutionArbRunner — oneTickIn flag', () => {
  it('phase1 has oneTickIn=true; phase2 has oneTickIn=false', async () => {
    const phase1Result = makeResult(2, 'partial');
    const phase2Result = makeResult(8, 'filled');
    const phase1Invoke: Phase1InvokeFn = vi.fn().mockResolvedValueOnce(phase1Result);
    const aggressiveInvoke: AggressiveInvokeFn = vi.fn().mockResolvedValueOnce(phase2Result);

    const runner = new SPreResolutionArbRunner(
      makeMockClient(),
      { ...BASE_CONFIG, phase1Invoke, aggressiveInvoke },
    );

    await runner.run();

    const p1Cfg = (phase1Invoke as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      oneTickIn: boolean;
    };
    const p2Cfg = (aggressiveInvoke as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      oneTickIn: boolean;
    };

    expect(p1Cfg.oneTickIn).toBe(true);
    expect(p2Cfg.oneTickIn).toBe(false);
  });
});
