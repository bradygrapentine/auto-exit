import { describe, it, expect } from 'vitest';
import { buildSBracketedExitArgs } from '../../src/strategies/sBracketedExit.js';

describe('buildSBracketedExitArgs', () => {
  it('builds a bracket RegisterArgs with correct shape', () => {
    const args = buildSBracketedExitArgs({
      ticker: 'KX', side: 'yes', positionSize: 100,
      takeProfitCents: 80, stopLossCents: 30,
    });
    expect(args.kind).toBe('bracket');
    expect(args.ticker).toBe('KX');
    expect(args.side).toBe('yes');
    expect(args.positionSize).toBe(100);
    expect((args.params as any).takeProfitCents).toBe(80);
    expect((args.params as any).stopLossCents).toBe(30);
    expect(args.autoCancelOnZeroPosition).toBeUndefined();
  });

  it('passes through autoCancelOnZeroPosition', () => {
    const args = buildSBracketedExitArgs({
      ticker: 'KX', side: 'no', positionSize: 50,
      takeProfitCents: 70, stopLossCents: 20,
      autoCancelOnZeroPosition: true,
    });
    expect(args.autoCancelOnZeroPosition).toBe(true);
  });

  it('throws on missing ticker', () => {
    expect(() => buildSBracketedExitArgs({
      ticker: '', side: 'yes', positionSize: 100,
      takeProfitCents: 80, stopLossCents: 30,
    })).toThrow(/ticker/);
  });

  it('throws on non-positive positionSize / takeProfitCents / stopLossCents', () => {
    expect(() => buildSBracketedExitArgs({
      ticker: 'KX', side: 'yes', positionSize: 0,
      takeProfitCents: 80, stopLossCents: 30,
    })).toThrow(/positionSize/);
    expect(() => buildSBracketedExitArgs({
      ticker: 'KX', side: 'yes', positionSize: 100,
      takeProfitCents: 0, stopLossCents: 30,
    })).toThrow(/takeProfitCents/);
    expect(() => buildSBracketedExitArgs({
      ticker: 'KX', side: 'yes', positionSize: 100,
      takeProfitCents: 80, stopLossCents: 0,
    })).toThrow(/stopLossCents/);
  });

  it('throws when takeProfitCents <= stopLossCents', () => {
    expect(() => buildSBracketedExitArgs({
      ticker: 'KX', side: 'yes', positionSize: 100,
      takeProfitCents: 30, stopLossCents: 30,
    })).toThrow(/takeProfitCents.*stopLossCents|takeProfitCents must be/);
    expect(() => buildSBracketedExitArgs({
      ticker: 'KX', side: 'yes', positionSize: 100,
      takeProfitCents: 20, stopLossCents: 30,
    })).toThrow(/takeProfitCents.*stopLossCents|takeProfitCents must be/);
  });
});
