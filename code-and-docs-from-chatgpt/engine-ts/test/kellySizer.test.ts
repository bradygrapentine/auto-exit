import { describe, it, expect } from 'vitest';
import { computeKellySize, type KellyContext } from '../src/kellySizer.js';

// Standard worked example: p=0.6, market=0.5
// b = (1-0.5)/0.5 = 1; q = 0.4
// f* = (0.6×1 − 0.4)/1 = 0.2
const baseCtx: KellyContext = {
  edgeProbability: 0.6,
  marketProbability: 0.5,
  bankrollDollars: 1000,
};

describe('computeKellySize — standard formula', () => {
  it('1. standard f* = (pb−q)/b: p=0.6, market=0.5 → f*=0.2', () => {
    const result = computeKellySize({ ...baseCtx, fractionalKelly: 1.0 });
    expect(result.fullKellyFractionOfBankroll).toBeCloseTo(0.2, 4);
  });

  it('2. half-Kelly halves the recommended fraction (default fractionalKelly=0.5)', () => {
    const fullKellyResult = computeKellySize({ ...baseCtx, fractionalKelly: 1.0 });
    const halfKellyResult = computeKellySize(baseCtx); // default 0.5
    expect(halfKellyResult.recommendedFraction).toBeCloseTo(
      fullKellyResult.fullKellyFractionOfBankroll * 0.5,
      4,
    );
  });

  it('3. bankroll × recommendedFraction = recommendedDollars (uncapped)', () => {
    const result = computeKellySize(baseCtx);
    expect(result.recommendedDollars).toBeCloseTo(
      result.recommendedFraction * baseCtx.bankrollDollars,
      4,
    );
  });

  it('4. full Kelly (fractionalKelly=1.0) returns full fraction', () => {
    const result = computeKellySize({ ...baseCtx, fractionalKelly: 1.0 });
    expect(result.recommendedFraction).toBeCloseTo(result.fullKellyFractionOfBankroll, 4);
    expect(result.recommendedDollars).toBeCloseTo(
      result.fullKellyFractionOfBankroll * baseCtx.bankrollDollars,
      4,
    );
  });

  it('5. fractionalKelly=0 returns recommendedDollars=0', () => {
    const result = computeKellySize({ ...baseCtx, fractionalKelly: 0 });
    expect(result.recommendedDollars).toBe(0);
    expect(result.recommendedFraction).toBe(0);
  });
});

describe('computeKellySize — negative edge / no-bet cases', () => {
  it('6. negative edge returns recommendedDollars=0 with "negative edge" note', () => {
    // p=0.4 < market=0.5 → edge negative
    const result = computeKellySize({ ...baseCtx, edgeProbability: 0.4 });
    expect(result.recommendedDollars).toBe(0);
    expect(result.notes.some((n) => n.includes('negative edge'))).toBe(true);
  });

  it('7. p ≤ market returns 0 recommended (equal probabilities)', () => {
    const result = computeKellySize({ ...baseCtx, edgeProbability: 0.5 });
    expect(result.recommendedDollars).toBe(0);
  });

  it('8. p=0 returns 0 with descriptive note', () => {
    const result = computeKellySize({ ...baseCtx, edgeProbability: 0 });
    expect(result.recommendedDollars).toBe(0);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it('9. p=1 (degenerate certainty) returns 0 with note', () => {
    const result = computeKellySize({ ...baseCtx, edgeProbability: 1 });
    expect(result.recommendedDollars).toBe(0);
    expect(result.notes.length).toBeGreaterThan(0);
  });
});

describe('computeKellySize — maxPositionDollars cap', () => {
  it('10. maxPositionDollars caps recommendedDollars when exceeded', () => {
    // f*=0.2 × 0.5 (half-Kelly) = 0.1 × $1000 = $100; cap at $50
    const result = computeKellySize({ ...baseCtx, maxPositionDollars: 50 });
    expect(result.recommendedDollars).toBe(50);
    expect(result.notes.some((n) => n.includes('capped'))).toBe(true);
  });

  it('11. maxPositionDollars does NOT cap when uncapped value is below cap', () => {
    // $100 < cap of $500 → no cap applied
    const result = computeKellySize({ ...baseCtx, maxPositionDollars: 500 });
    expect(result.recommendedDollars).toBeCloseTo(100, 4); // 0.1 × 1000
    expect(result.notes.some((n) => n.includes('capped'))).toBe(false);
  });

  it('12. half-Kelly + cap stack correctly', () => {
    // half-Kelly → $100; cap at $75
    const result = computeKellySize({ ...baseCtx, fractionalKelly: 0.5, maxPositionDollars: 75 });
    expect(result.recommendedDollars).toBe(75);
    expect(result.notes.some((n) => n.includes('capped'))).toBe(true);
    expect(result.notes.some((n) => n.includes('fractional'))).toBe(true);
  });
});

describe('computeKellySize — worked numbers', () => {
  it('13. asymmetric odds: p=0.7, market=0.4 → b=1.5, f*=(0.7×1.5−0.3)/1.5', () => {
    // b=(1-0.4)/0.4=1.5; q=0.3; f*=(0.7×1.5−0.3)/1.5=(1.05−0.3)/1.5=0.75/1.5=0.5
    const result = computeKellySize({
      edgeProbability: 0.7,
      marketProbability: 0.4,
      bankrollDollars: 1000,
      fractionalKelly: 1.0,
    });
    expect(result.fullKellyFractionOfBankroll).toBeCloseTo(0.5, 4);
  });

  it('14. notes array is always an array (never undefined)', () => {
    const result = computeKellySize(baseCtx);
    expect(Array.isArray(result.notes)).toBe(true);
  });
});
