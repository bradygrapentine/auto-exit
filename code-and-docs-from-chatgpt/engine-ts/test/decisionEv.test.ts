import { describe, it, expect } from 'vitest';
import { computeDecisionEV, type DecisionContext } from '../src/decisionEv.js';

// Base context: no position; used for entry-side tests
const baseCtx: DecisionContext = {
  ticker: 'KXTEST',
  bidCents: 45,
  askCents: 55,
  midProbability: 0.6,
};

// Context with a YES position
const withYesPosition: DecisionContext = {
  ...baseCtx,
  position: { side: 'yes', size: 100, costBasisCents: 4000 }, // 100 contracts, $40 cost
};

describe('computeDecisionEV — enter-yes', () => {
  it('1. calculates correct EV for enter-yes worked example', () => {
    // p=0.6, ask=55¢, fees=0 → EV = (0.6×100 − 55)/100 = 0.05
    const result = computeDecisionEV(baseCtx, 'enter-yes');
    expect(result.evDollars).toBeCloseTo(0.05, 4);
  });

  it('2. includes fees in enter-yes calculation', () => {
    const ctx: DecisionContext = { ...baseCtx, feesEstimateCents: 2 };
    // EV = (0.6×100 − 55 − 2)/100 = 0.03
    const result = computeDecisionEV(ctx, 'enter-yes');
    expect(result.evDollars).toBeCloseTo(0.03, 4);
  });

  it('3. returns non-empty rationale for enter-yes', () => {
    const result = computeDecisionEV(baseCtx, 'enter-yes');
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result.rationale).toContain('enter-yes');
  });
});

describe('computeDecisionEV — enter-no', () => {
  it('4. calculates correct EV for enter-no', () => {
    // noAsk = 100 - bid = 55; p(no wins) = 0.4; EV = (0.4×100 − 55)/100 = -0.15
    const result = computeDecisionEV(baseCtx, 'enter-no');
    expect(result.evDollars).toBeCloseTo(-0.15, 4);
  });

  it('5. enter-no returns non-empty rationale', () => {
    const result = computeDecisionEV(baseCtx, 'enter-no');
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result.rationale).toContain('enter-no');
  });
});

describe('computeDecisionEV — hold', () => {
  it('6. hold EV = expected terminal payoff − cost basis', () => {
    // size=100, p=0.6, payout=100¢, costBasis=4000¢
    // EV = (100 × 0.6 × 100 − 4000) / 100 = (6000 − 4000) / 100 = $20
    const result = computeDecisionEV(withYesPosition, 'hold');
    expect(result.evDollars).toBeCloseTo(20, 4);
  });

  it('7. hold returns non-empty rationale', () => {
    const result = computeDecisionEV(withYesPosition, 'hold');
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result.rationale).toContain('hold');
  });

  it('8. hold throws without position', () => {
    expect(() => computeDecisionEV(baseCtx, 'hold')).toThrow();
  });
});

describe('computeDecisionEV — exit-aggressive', () => {
  it('9. exit-aggressive EV with fees', () => {
    // bid=45¢, size=100, fees=5¢ → EV = (100×45 − 5)/100 = 44.95
    const ctx: DecisionContext = { ...withYesPosition, feesEstimateCents: 5 };
    const result = computeDecisionEV(ctx, 'exit-aggressive');
    expect(result.evDollars).toBeCloseTo(44.95, 4);
  });

  it('10. exit-aggressive throws without position', () => {
    expect(() => computeDecisionEV(baseCtx, 'exit-aggressive')).toThrow();
  });

  it('11. exit-aggressive returns non-empty rationale', () => {
    const result = computeDecisionEV(withYesPosition, 'exit-aggressive');
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result.rationale).toContain('exit-aggressive');
  });
});

describe('computeDecisionEV — scale-out-50', () => {
  it('12. scale-out-50 is approximately half of exit-aggressive on full position', () => {
    // scale-out-50 exits floor(100/2) = 50 contracts at bid=45¢
    // exit-aggressive on full 100 = 100×45/100 = $45
    // scale-out-50 = 50×45/100 = $22.50
    const scaleResult = computeDecisionEV(withYesPosition, 'scale-out-50');
    const fullResult = computeDecisionEV(withYesPosition, 'exit-aggressive');
    expect(scaleResult.evDollars).toBeCloseTo(fullResult.evDollars / 2, 1);
  });

  it('13. scale-out-50 throws without position', () => {
    expect(() => computeDecisionEV(baseCtx, 'scale-out-50')).toThrow();
  });

  it('14. scale-out-50 returns non-empty rationale', () => {
    const result = computeDecisionEV(withYesPosition, 'scale-out-50');
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result.rationale).toContain('scale-out-50');
  });
});

describe('computeDecisionEV — scale-out-25', () => {
  it('15. scale-out-25 exits ~25% of position', () => {
    // floor(100/4) = 25 contracts at bid=45¢ → $11.25
    const result = computeDecisionEV(withYesPosition, 'scale-out-25');
    expect(result.evDollars).toBeCloseTo(11.25, 4);
  });

  it('16. scale-out-25 throws without position', () => {
    expect(() => computeDecisionEV(baseCtx, 'scale-out-25')).toThrow();
  });
});

describe('computeDecisionEV — no-action', () => {
  it('17. no-action returns evDollars = 0', () => {
    const result = computeDecisionEV(baseCtx, 'no-action');
    expect(result.evDollars).toBe(0);
  });

  it('18. no-action returns non-empty rationale', () => {
    const result = computeDecisionEV(baseCtx, 'no-action');
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result.rationale).toContain('no-action');
  });
});

describe('computeDecisionEV — validation', () => {
  it('19. throws when midProbability > 1', () => {
    expect(() => computeDecisionEV({ ...baseCtx, midProbability: 1.1 }, 'no-action')).toThrow(
      RangeError,
    );
  });

  it('20. throws when midProbability < 0', () => {
    expect(() => computeDecisionEV({ ...baseCtx, midProbability: -0.1 }, 'no-action')).toThrow(
      RangeError,
    );
  });

  it('21. negative EV branches return correctly negative numbers (no clamping)', () => {
    // p=0.1, ask=55 → EV = (0.1×100 − 55)/100 = -0.45
    const result = computeDecisionEV({ ...baseCtx, midProbability: 0.1 }, 'enter-yes');
    expect(result.evDollars).toBeLessThan(0);
    expect(result.evDollars).toBeCloseTo(-0.45, 4);
  });

  it('22. timeToCloseHours absent → EV still computed (undiscounted model)', () => {
    // No timeToCloseHours provided; function should not throw
    const ctx: DecisionContext = { ...baseCtx };
    expect(() => computeDecisionEV(ctx, 'enter-yes')).not.toThrow();
  });

  it('23. boundary: midProbability=0 returns correct EV for enter-yes', () => {
    // p=0, ask=55 → EV = (0×100 − 55)/100 = -0.55
    const result = computeDecisionEV({ ...baseCtx, midProbability: 0 }, 'enter-yes');
    expect(result.evDollars).toBeCloseTo(-0.55, 4);
  });

  it('24. boundary: midProbability=1 returns correct EV for enter-yes', () => {
    // p=1, ask=55 → EV = (1×100 − 55)/100 = 0.45
    const result = computeDecisionEV({ ...baseCtx, midProbability: 1 }, 'enter-yes');
    expect(result.evDollars).toBeCloseTo(0.45, 4);
  });
});
