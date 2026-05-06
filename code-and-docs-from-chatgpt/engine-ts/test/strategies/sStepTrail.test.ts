import { describe, it, expect } from 'vitest';
import { buildSStepTrailArgs } from '../../src/strategies/sStepTrail.js';

describe('buildSStepTrailArgs', () => {
  it('builds a step_trail RegisterArgs with required fields', () => {
    const args = buildSStepTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 100,
      trailCents: 5, stepCents: 1,
    });
    expect(args.kind).toBe('step_trail');
    expect(args.ticker).toBe('KX');
    expect(args.side).toBe('yes');
    expect(args.positionSize).toBe(100);
    expect((args.params as any).trailCents).toBe(5);
    expect((args.params as any).stepCents).toBe(1);
    expect((args.params as any).floorPriceCents).toBeUndefined();
  });

  it('includes floorPriceCents when supplied', () => {
    const args = buildSStepTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 100,
      trailCents: 5, stepCents: 1, floorPriceCents: 2,
    });
    expect((args.params as any).floorPriceCents).toBe(2);
  });

  it('passes through autoCancelOnZeroPosition', () => {
    const args = buildSStepTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 100,
      trailCents: 5, stepCents: 1, autoCancelOnZeroPosition: false,
    });
    expect(args.autoCancelOnZeroPosition).toBe(false);
  });

  it('throws on missing ticker', () => {
    expect(() => buildSStepTrailArgs({
      ticker: '', side: 'yes', positionSize: 100, trailCents: 5, stepCents: 1,
    })).toThrow(/ticker/);
  });

  it('throws on non-positive positionSize / trailCents / stepCents', () => {
    expect(() => buildSStepTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 0, trailCents: 5, stepCents: 1,
    })).toThrow(/positionSize/);
    expect(() => buildSStepTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 100, trailCents: 0, stepCents: 1,
    })).toThrow(/trailCents/);
    expect(() => buildSStepTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 100, trailCents: 5, stepCents: 0,
    })).toThrow(/stepCents/);
  });
});
