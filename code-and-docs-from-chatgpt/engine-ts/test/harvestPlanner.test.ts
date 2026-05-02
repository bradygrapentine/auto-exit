/**
 * harvestPlanner tests — pure unit tests, no I/O.
 *
 * Worked example:
 *   position: 500, costBasisCents: 4500, marketP: 0.72, privateP: 0.80, payoutCents: 100
 */

import { describe, expect, it } from 'vitest';
import { computeHarvestPlan } from '../src/harvestPlanner.js';
import type { HarvestPlannerInput, Orderbook } from '../src/types.js';

// ── fixtures ──────────────────────────────────────────────────────────────────

const BASE_INPUT: HarvestPlannerInput = {
  ticker: 'TEST-MARKET',
  side: 'sell',
  position: 500,
  costBasisCents: 4500,
  marketP: 0.72,
  privateP: 0.80,
  catalystType: 'soft',
  payoutCents: 100,
};

const BASE_ORDERBOOK: Orderbook = {
  yes: [
    { priceCents: 72, size: 200 },
    { priceCents: 71, size: 150 },
    { priceCents: 70, size: 100 },
  ],
  no: [
    { priceCents: 27, size: 300 },  // => YES ask = 100 - 27 = 73
  ],
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('computeHarvestPlan — worked example', () => {
  it('EV fields match worked example', () => {
    const plan = computeHarvestPlan(BASE_INPUT, BASE_ORDERBOOK);

    // pStar = privateP = 0.80
    expect(plan.pStar).toBeCloseTo(0.80, 10);

    // evHold = 500 × 0.80 × 1.00 = $400
    expect(plan.evHold).toBeCloseTo(400, 10);

    // evHarvestNow = 500 × 0.72 × 1.00 = $360
    expect(plan.evHarvestNow).toBeCloseTo(360, 10);

    // evPatientScaleOut = 500 × 0.76 × 1.00 = $380
    expect(plan.evPatientScaleOut).toBeCloseTo(380, 10);

    // harvestIsEvPositive = false (marketP 0.72 < pStar 0.80)
    expect(plan.harvestIsEvPositive).toBe(false);
  });

  it('harvestIsEvPositive = true when marketP >= privateP', () => {
    const input: HarvestPlannerInput = { ...BASE_INPUT, marketP: 0.80, privateP: 0.80 };
    const plan = computeHarvestPlan(input, BASE_ORDERBOOK);
    expect(plan.harvestIsEvPositive).toBe(true);

    const input2: HarvestPlannerInput = { ...BASE_INPUT, marketP: 0.85, privateP: 0.80 };
    const plan2 = computeHarvestPlan(input2, BASE_ORDERBOOK);
    expect(plan2.harvestIsEvPositive).toBe(true);
  });

  it('riskReductionTable has exactly 5 rows in order', () => {
    const plan = computeHarvestPlan(BASE_INPUT, BASE_ORDERBOOK);
    expect(plan.riskReductionTable).toHaveLength(5);
    expect(plan.riskReductionTable[0].fraction).toBe('10%');
    expect(plan.riskReductionTable[1].fraction).toBe('25%');
    expect(plan.riskReductionTable[2].fraction).toBe('50%');
    expect(plan.riskReductionTable[3].fraction).toBe('75%');
    expect(plan.riskReductionTable[4].fraction).toBe('no-loss-floor');
  });

  it('50% row matches worked example', () => {
    const plan = computeHarvestPlan(BASE_INPUT, BASE_ORDERBOOK);
    const row50 = plan.riskReductionTable.find((r) => r.fraction === '50%')!;

    // harvestQty = ceil(500 × 0.50) = 250
    expect(row50.harvestQty).toBe(250);

    // cashLocked = 250 × 0.72 × 1.00 = $180
    expect(row50.cashLocked).toBeCloseTo(180, 10);

    // evGiveUp = 250 × (0.80 - 0.72) × 1.00 = $20
    expect(row50.evGiveUp).toBeCloseTo(20, 10);
  });

  it('no-loss-floor row: cashLocked >= costBasisCents / 100', () => {
    const plan = computeHarvestPlan(BASE_INPUT, BASE_ORDERBOOK);
    const noLossRow = plan.riskReductionTable.find((r) => r.fraction === 'no-loss-floor')!;
    // cashLocked should cover cost basis ($45)
    expect(noLossRow.cashLocked).toBeGreaterThanOrEqual(BASE_INPUT.costBasisCents / 100);
  });

  it('thetaPerDay is undefined when no catalystExpectedDate', () => {
    const plan = computeHarvestPlan(BASE_INPUT, BASE_ORDERBOOK);
    expect(plan.greeks.thetaPerDay).toBeUndefined();
  });

  it('thetaPerDay is a number when catalystExpectedDate is in the future', () => {
    // Set date far in the future to guarantee positive daysToExpiry
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const input: HarvestPlannerInput = {
      ...BASE_INPUT,
      catalystExpectedDate: futureDate,
    };
    const plan = computeHarvestPlan(input, BASE_ORDERBOOK);
    expect(typeof plan.greeks.thetaPerDay).toBe('number');
  });

  it('suggestedStrategies is non-empty', () => {
    const plan = computeHarvestPlan(BASE_INPUT, BASE_ORDERBOOK);
    expect(plan.suggestedStrategies.length).toBeGreaterThan(0);
  });

  it('gammaProxy is a non-negative number', () => {
    const plan = computeHarvestPlan(BASE_INPUT, BASE_ORDERBOOK);
    expect(typeof plan.greeks.gammaProxy).toBe('number');
    expect(plan.greeks.gammaProxy).toBeGreaterThanOrEqual(0);
  });
});

describe('computeHarvestPlan — suggestedStrategies rules', () => {
  it('high marketP (>= 0.90) suggests scale-out + gamma scalp', () => {
    const input: HarvestPlannerInput = { ...BASE_INPUT, marketP: 0.92, privateP: 0.80 };
    const plan = computeHarvestPlan(input, BASE_ORDERBOOK);
    expect(plan.suggestedStrategies).toContain('S7 scale-out');
    expect(plan.suggestedStrategies).toContain('gamma scalp into expiry');
  });

  it('harvestIsEvPositive suggests S1 passive', () => {
    const input: HarvestPlannerInput = { ...BASE_INPUT, marketP: 0.85, privateP: 0.80 };
    const plan = computeHarvestPlan(input, BASE_ORDERBOOK);
    expect(plan.suggestedStrategies).toContain('S1 passive');
  });

  it('privateP > marketP (below 0.90) suggests hold', () => {
    const plan = computeHarvestPlan(BASE_INPUT, BASE_ORDERBOOK);
    // marketP=0.72, privateP=0.80 => hold path
    expect(plan.suggestedStrategies).toContain('hold');
  });

  it('marketP >= privateP (but < 0.90) suggests S1 passive not hold', () => {
    const input: HarvestPlannerInput = { ...BASE_INPUT, marketP: 0.82, privateP: 0.80 };
    const plan = computeHarvestPlan(input, BASE_ORDERBOOK);
    expect(plan.suggestedStrategies).not.toContain('hold');
    expect(plan.suggestedStrategies).toContain('S1 passive');
  });
});

describe('computeHarvestPlan — edge cases', () => {
  it('gammaProxy = 0 when orderbook is empty', () => {
    const emptyBook: Orderbook = { yes: [], no: [] };
    const plan = computeHarvestPlan(BASE_INPUT, emptyBook);
    expect(plan.greeks.gammaProxy).toBe(0);
  });

  it('no-loss-floor harvestQty clamped to position when cost basis very high', () => {
    const input: HarvestPlannerInput = {
      ...BASE_INPUT,
      costBasisCents: 1_000_000, // absurdly high cost basis
    };
    const plan = computeHarvestPlan(input, BASE_ORDERBOOK);
    const noLossRow = plan.riskReductionTable.find((r) => r.fraction === 'no-loss-floor')!;
    expect(noLossRow.harvestQty).toBeLessThanOrEqual(input.position);
  });

  it('default payoutCents = 100 when not specified', () => {
    const input: HarvestPlannerInput = { ...BASE_INPUT };
    delete (input as Partial<HarvestPlannerInput>).payoutCents;
    const plan = computeHarvestPlan(input, BASE_ORDERBOOK);
    // evHold should still be 400 (same as explicit payoutCents: 100)
    expect(plan.evHold).toBeCloseTo(400, 10);
  });
});
