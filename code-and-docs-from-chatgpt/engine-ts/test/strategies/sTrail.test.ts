import { describe, it, expect } from 'vitest';
import { buildSTrailArgs } from '../../src/strategies/sTrail.js';

describe('buildSTrailArgs', () => {
  it('builds a trailing_stop RegisterArgs with required fields', () => {
    const args = buildSTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 100, trailCents: 5,
    });
    expect(args.kind).toBe('trailing_stop');
    expect(args.ticker).toBe('KX');
    expect(args.side).toBe('yes');
    expect(args.positionSize).toBe(100);
    expect((args.params as any).trailCents).toBe(5);
    expect((args.params as any).floorPriceCents).toBeUndefined();
  });

  it('includes floorPriceCents when supplied', () => {
    const args = buildSTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 100, trailCents: 5, floorPriceCents: 2,
    });
    expect((args.params as any).floorPriceCents).toBe(2);
  });

  it('passes through autoCancelOnZeroPosition', () => {
    const args = buildSTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 100, trailCents: 5, autoCancelOnZeroPosition: false,
    });
    expect(args.autoCancelOnZeroPosition).toBe(false);
  });

  it('throws on missing ticker', () => {
    expect(() => buildSTrailArgs({
      ticker: '', side: 'yes', positionSize: 100, trailCents: 5,
    })).toThrow(/ticker/);
  });

  it('throws on non-positive positionSize / trailCents', () => {
    expect(() => buildSTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 0, trailCents: 5,
    })).toThrow(/positionSize/);
    expect(() => buildSTrailArgs({
      ticker: 'KX', side: 'yes', positionSize: 100, trailCents: 0,
    })).toThrow(/trailCents/);
  });
});
