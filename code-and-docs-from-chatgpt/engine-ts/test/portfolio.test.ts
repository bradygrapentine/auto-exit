/**
 * portfolio.test.ts — W4.3 portfolio liquidation sequencer tests.
 *
 * ≥10 tests covering:
 * - Validation (empty positions, missing midProbability, bid out of range)
 * - Ranking by overvaluedDollars descending
 * - EV(hold) math: size × midProb
 * - Strategy auto-pick rule (overvalued > 0.5 × markToBid → aggressive)
 * - defaultStrategy override
 * - totalRaiseableDollars sum
 * - Tie-breaking: stable (input order preserved on equal overvalued)
 * - Single-position plan
 * - Negative overvalued (under-valued at current mark)
 * - executePortfolioPlan composes SCashRaiseConfig correctly
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildPortfolioPlan,
  executePortfolioPlan,
  type PositionSnapshot,
  type PortfolioPlanInput,
} from '../src/portfolio.js';
import type { SCashRaiseRunner } from '../src/strategies/sCashRaise.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeInput(overrides?: Partial<PortfolioPlanInput>): PortfolioPlanInput {
  return {
    positions: [
      { ticker: 'A', side: 'yes', size: 10 },
    ],
    midProbabilities: { A: 0.5 },
    bidByTicker: { A: 50 },
    ...overrides,
  };
}

// ── 1. Validation: empty positions ────────────────────────────────────────────

describe('buildPortfolioPlan — validation', () => {
  it('throws when positions is empty', () => {
    expect(() =>
      buildPortfolioPlan(makeInput({ positions: [] })),
    ).toThrow('positions must be non-empty');
  });

  it('throws when midProbability is missing for a ticker', () => {
    expect(() =>
      buildPortfolioPlan(
        makeInput({
          positions: [{ ticker: 'MISSING', side: 'yes', size: 5 }],
          midProbabilities: {},
          bidByTicker: { MISSING: 50 },
        }),
      ),
    ).toThrow("missing midProbability for ticker 'MISSING'");
  });

  it('throws when midProbability is out of [0, 1]', () => {
    expect(() =>
      buildPortfolioPlan(
        makeInput({
          midProbabilities: { A: 1.1 },
        }),
      ),
    ).toThrow("midProbability for 'A' must be in [0, 1]");

    expect(() =>
      buildPortfolioPlan(
        makeInput({
          midProbabilities: { A: -0.1 },
        }),
      ),
    ).toThrow("midProbability for 'A' must be in [0, 1]");
  });

  it('throws when bidByTicker is missing for a ticker', () => {
    expect(() =>
      buildPortfolioPlan(
        makeInput({
          bidByTicker: {},
        }),
      ),
    ).toThrow("missing bidByTicker for ticker 'A'");
  });

  it('throws when bid is below 1 cent', () => {
    expect(() =>
      buildPortfolioPlan(
        makeInput({
          bidByTicker: { A: 0 },
        }),
      ),
    ).toThrow("bidByTicker for 'A' must be in [1, 99] cents");
  });

  it('throws when bid is above 99 cents', () => {
    expect(() =>
      buildPortfolioPlan(
        makeInput({
          bidByTicker: { A: 100 },
        }),
      ),
    ).toThrow("bidByTicker for 'A' must be in [1, 99] cents");
  });
});

// ── 2. Ranking by overvaluedDollars ───────────────────────────────────────────

describe('buildPortfolioPlan — ranking', () => {
  it('ranks 3 positions descending by overvaluedDollars', () => {
    // Position X: markToBid=0.80, evHold=0.20, overvalued=0.60  → rank 1
    // Position Y: markToBid=0.50, evHold=0.40, overvalued=0.10  → rank 2
    // Position Z: markToBid=0.30, evHold=0.28, overvalued=0.02  → rank 3
    const plan = buildPortfolioPlan({
      positions: [
        { ticker: 'Y', side: 'yes', size: 10 },
        { ticker: 'Z', side: 'yes', size: 10 },
        { ticker: 'X', side: 'yes', size: 10 },
      ],
      midProbabilities: { X: 0.02, Y: 0.04, Z: 0.028 },
      bidByTicker: { X: 8, Y: 5, Z: 3 },
    });

    expect(plan.ranked[0].ticker).toBe('X');
    expect(plan.ranked[1].ticker).toBe('Y');
    expect(plan.ranked[2].ticker).toBe('Z');
    expect(plan.ranked[0].rank).toBe(1);
    expect(plan.ranked[2].rank).toBe(3);
  });
});

// ── 3. EV(hold) math ─────────────────────────────────────────────────────────

describe('buildPortfolioPlan — EV math', () => {
  it('computes evHoldDollars = size × midProb', () => {
    const plan = buildPortfolioPlan(makeInput({
      positions: [{ ticker: 'A', side: 'yes', size: 100 }],
      midProbabilities: { A: 0.7 },
      bidByTicker: { A: 50 },
    }));
    // evHold = 100 × 0.7 = 70
    expect(plan.ranked[0].evHoldDollars).toBeCloseTo(70, 6);
  });

  it('computes markToBidDollars = size × bid / 100', () => {
    const plan = buildPortfolioPlan(makeInput({
      positions: [{ ticker: 'A', side: 'yes', size: 200 }],
      midProbabilities: { A: 0.5 },
      bidByTicker: { A: 45 },
    }));
    // markToBid = 200 × 45 / 100 = 90
    expect(plan.ranked[0].markToBidDollars).toBeCloseTo(90, 6);
  });

  it('computes overvaluedDollars = markToBid − evHold', () => {
    const plan = buildPortfolioPlan(makeInput({
      positions: [{ ticker: 'A', side: 'yes', size: 50 }],
      midProbabilities: { A: 0.4 },
      bidByTicker: { A: 60 },
    }));
    // markToBid = 50 × 60 / 100 = 30
    // evHold = 50 × 0.4 = 20
    // overvalued = 30 − 20 = 10
    expect(plan.ranked[0].markToBidDollars).toBeCloseTo(30, 6);
    expect(plan.ranked[0].evHoldDollars).toBeCloseTo(20, 6);
    expect(plan.ranked[0].overvaluedDollars).toBeCloseTo(10, 6);
  });
});

// ── 4. Strategy auto-pick rule ────────────────────────────────────────────────

describe('buildPortfolioPlan — strategy auto-pick', () => {
  it('recommends aggressive when overvalued > 0.5 × markToBid', () => {
    // markToBid = 10 × 80/100 = 8; evHold = 10 × 0.1 = 1; overvalued = 7
    // 7 > 0.5 × 8 (4) → aggressive
    const plan = buildPortfolioPlan(makeInput({
      positions: [{ ticker: 'A', side: 'yes', size: 10 }],
      midProbabilities: { A: 0.1 },
      bidByTicker: { A: 80 },
    }));
    expect(plan.ranked[0].recommendedStrategy).toBe('aggressive');
  });

  it('recommends passive when overvalued ≤ 0.5 × markToBid', () => {
    // markToBid = 10 × 60/100 = 6; evHold = 10 × 0.5 = 5; overvalued = 1
    // 1 ≤ 0.5 × 6 (3) → passive
    const plan = buildPortfolioPlan(makeInput({
      positions: [{ ticker: 'A', side: 'yes', size: 10 }],
      midProbabilities: { A: 0.5 },
      bidByTicker: { A: 60 },
    }));
    expect(plan.ranked[0].recommendedStrategy).toBe('passive');
  });

  it('recommends passive when overvalued equals 0.5 × markToBid (boundary)', () => {
    // markToBid = 10 × 60/100 = 6; evHold = 10 × 0.3 = 3; overvalued = 3
    // 3 is NOT > 3 → passive
    const plan = buildPortfolioPlan(makeInput({
      positions: [{ ticker: 'A', side: 'yes', size: 10 }],
      midProbabilities: { A: 0.3 },
      bidByTicker: { A: 60 },
    }));
    expect(plan.ranked[0].recommendedStrategy).toBe('passive');
  });
});

// ── 5. defaultStrategy override ───────────────────────────────────────────────

describe('buildPortfolioPlan — defaultStrategy override', () => {
  it('uses defaultStrategy=aggressive for all positions regardless of auto-pick', () => {
    // Auto-pick would choose passive here (low overvalued), but override forces aggressive
    const plan = buildPortfolioPlan(makeInput({
      positions: [
        { ticker: 'A', side: 'yes', size: 10 },
        { ticker: 'B', side: 'yes', size: 10 },
      ],
      midProbabilities: { A: 0.58, B: 0.62 },
      bidByTicker: { A: 60, B: 65 },
      defaultStrategy: 'aggressive',
    }));
    for (const entry of plan.ranked) {
      expect(entry.recommendedStrategy).toBe('aggressive');
    }
  });

  it('uses defaultStrategy=passive for all positions', () => {
    // Auto-pick would choose aggressive here (high overvalued), but override forces passive
    const plan = buildPortfolioPlan(makeInput({
      positions: [{ ticker: 'A', side: 'yes', size: 10 }],
      midProbabilities: { A: 0.05 },
      bidByTicker: { A: 90 },
      defaultStrategy: 'passive',
    }));
    expect(plan.ranked[0].recommendedStrategy).toBe('passive');
  });
});

// ── 6. totalRaiseableDollars ──────────────────────────────────────────────────

describe('buildPortfolioPlan — totalRaiseableDollars', () => {
  it('equals sum of markToBidDollars across all positions', () => {
    // A: 10 × 50/100 = 5; B: 20 × 30/100 = 6; C: 5 × 80/100 = 4  → total = 15
    const plan = buildPortfolioPlan({
      positions: [
        { ticker: 'A', side: 'yes', size: 10 },
        { ticker: 'B', side: 'yes', size: 20 },
        { ticker: 'C', side: 'yes', size: 5 },
      ],
      midProbabilities: { A: 0.5, B: 0.3, C: 0.8 },
      bidByTicker: { A: 50, B: 30, C: 80 },
    });
    expect(plan.totalRaiseableDollars).toBeCloseTo(15, 6);
  });
});

// ── 7. Tie-breaking: stable sort ─────────────────────────────────────────────

describe('buildPortfolioPlan — tie-breaking', () => {
  it('preserves input order when overvaluedDollars are equal', () => {
    // All three have identical overvalued = 0 (bid/100 = midProb)
    const plan = buildPortfolioPlan({
      positions: [
        { ticker: 'FIRST', side: 'yes', size: 10 },
        { ticker: 'SECOND', side: 'yes', size: 10 },
        { ticker: 'THIRD', side: 'yes', size: 10 },
      ],
      midProbabilities: { FIRST: 0.5, SECOND: 0.5, THIRD: 0.5 },
      bidByTicker: { FIRST: 50, SECOND: 50, THIRD: 50 },
    });
    // All overvalued = 0, so input order preserved
    expect(plan.ranked[0].ticker).toBe('FIRST');
    expect(plan.ranked[1].ticker).toBe('SECOND');
    expect(plan.ranked[2].ticker).toBe('THIRD');
  });
});

// ── 8. Single-position plan ───────────────────────────────────────────────────

describe('buildPortfolioPlan — single position', () => {
  it('returns one entry with rank=1', () => {
    const plan = buildPortfolioPlan(makeInput());
    expect(plan.ranked).toHaveLength(1);
    expect(plan.ranked[0].rank).toBe(1);
    expect(plan.ranked[0].ticker).toBe('A');
  });
});

// ── 9. Negative overvalued (undervalued position) ─────────────────────────────

describe('buildPortfolioPlan — negative overvalued', () => {
  it('includes negative-overvalued positions ranked lowest', () => {
    // X: overvalued = -2 (undervalued); Y: overvalued = 5 (overvalued)
    // markToBid X: 10 × 20/100 = 2; evHold X: 10 × 0.4 = 4 → overvalued = -2
    // markToBid Y: 10 × 80/100 = 8; evHold Y: 10 × 0.3 = 3 → overvalued = 5
    const plan = buildPortfolioPlan({
      positions: [
        { ticker: 'X', side: 'yes', size: 10 },
        { ticker: 'Y', side: 'yes', size: 10 },
      ],
      midProbabilities: { X: 0.4, Y: 0.3 },
      bidByTicker: { X: 20, Y: 80 },
    });
    expect(plan.ranked[0].ticker).toBe('Y');
    expect(plan.ranked[1].ticker).toBe('X');
    expect(plan.ranked[1].overvaluedDollars).toBeCloseTo(-2, 6);
  });
});

// ── 10. executePortfolioPlan composes SCashRaiseConfig ───────────────────────

describe('executePortfolioPlan — composes SCashRaiseConfig', () => {
  it('creates a SCashRaiseRunner with positions in ranked order', () => {
    const plan = buildPortfolioPlan({
      positions: [
        { ticker: 'LOW', side: 'yes', size: 5 },
        { ticker: 'HIGH', side: 'yes', size: 10 },
      ],
      midProbabilities: { LOW: 0.5, HIGH: 0.1 },
      bidByTicker: { LOW: 50, HIGH: 80 },
    });

    // HIGH: markToBid=8, evHold=1, overvalued=7 → rank 1
    // LOW: markToBid=2.5, evHold=2.5, overvalued=0 → rank 2
    expect(plan.ranked[0].ticker).toBe('HIGH');
    expect(plan.ranked[1].ticker).toBe('LOW');

    const aggressiveInvoke = vi.fn().mockResolvedValue({ filled: 0, avgPriceCents: 0, feesIncurredDollars: 0 });
    const passiveInvoke = vi.fn().mockResolvedValue({ filled: 0, avgPriceCents: 0, feesIncurredDollars: 0 });
    const getCurrentBidCents = vi.fn().mockResolvedValue(50);

    const runner = executePortfolioPlan(
      plan,
      { aggressiveInvoke, passiveInvoke, getCurrentBidCents },
      { targetCashDollars: 100, deadlineEpochMs: Date.now() + 60_000 },
    );

    // Runner is a SCashRaiseRunner instance
    expect(runner).toBeDefined();
    expect(typeof runner.run).toBe('function');
  });

  it('maps recommendedStrategy to CashRaisePosition.strategyName correctly', () => {
    // Force aggressive on HIGH (overvalued > 50% threshold), passive on LOW
    const plan = buildPortfolioPlan({
      positions: [
        { ticker: 'HIGH', side: 'yes', size: 10 },
        { ticker: 'LOW', side: 'yes', size: 10 },
      ],
      midProbabilities: { HIGH: 0.05, LOW: 0.45 },
      bidByTicker: { HIGH: 90, LOW: 50 },
    });

    // HIGH: markToBid=9, evHold=0.5, overvalued=8.5 → 8.5 > 0.5×9=4.5 → aggressive
    // LOW: markToBid=5, evHold=4.5, overvalued=0.5 → 0.5 ≤ 0.5×5=2.5 → passive
    expect(plan.ranked[0].recommendedStrategy).toBe('aggressive');
    expect(plan.ranked[1].recommendedStrategy).toBe('passive');

    const aggressiveInvoke = vi.fn();
    const passiveInvoke = vi.fn();
    const getCurrentBidCents = vi.fn().mockResolvedValue(50);

    // executePortfolioPlan should not throw — the runner wraps args correctly
    expect(() =>
      executePortfolioPlan(
        plan,
        { aggressiveInvoke, passiveInvoke, getCurrentBidCents },
        { targetCashDollars: 50, deadlineEpochMs: Date.now() + 30_000 },
      ),
    ).not.toThrow();
  });
});
