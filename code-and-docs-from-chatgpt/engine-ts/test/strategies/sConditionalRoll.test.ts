import { describe, it, expect } from 'vitest';
import { buildSConditionalRollArgs } from '../../src/strategies/sConditionalRoll.js';
import type { OcoParams, TimeStopParams, TakeProfitParams } from '../../src/types.js';

const BASE_OPTS = {
  ticker: 'INXD-23DEC31-B4750',
  side: 'yes' as const,
  positionSize: 10,
  deadlineTimestamp: '2026-12-31T23:59:00Z',
  exitIfBelowCents: 30,
  takeProfitCents: 70,
};

describe('buildSConditionalRollArgs', () => {
  it('happy path — produces correct OCO shape with both legs and correct kinds + params', () => {
    const args = buildSConditionalRollArgs(BASE_OPTS);

    expect(args.kind).toBe('oco');
    expect(args.ticker).toBe(BASE_OPTS.ticker);
    expect(args.side).toBe('yes');
    expect(args.positionSize).toBe(10);

    const oco = args.params as OcoParams;
    expect(oco.legs).toHaveLength(2);

    const [leg1, leg2] = oco.legs;

    // leg 1: time_stop
    expect(leg1.kind).toBe('time_stop');
    const tsParams = leg1.params as TimeStopParams;
    expect(tsParams.deadlineTimestamp).toBe(BASE_OPTS.deadlineTimestamp);
    expect(tsParams.exitIfBelowCents).toBe(BASE_OPTS.exitIfBelowCents);

    // leg 2: take_profit
    expect(leg2.kind).toBe('take_profit');
    const tpParams = leg2.params as TakeProfitParams;
    expect(tpParams.triggerPriceCents).toBe(BASE_OPTS.takeProfitCents);
  });

  it('autoCancelOnZeroPosition passes through when set', () => {
    const args = buildSConditionalRollArgs({ ...BASE_OPTS, autoCancelOnZeroPosition: true });
    expect(args.autoCancelOnZeroPosition).toBe(true);
  });

  it('autoCancelOnZeroPosition is undefined when not set', () => {
    const args = buildSConditionalRollArgs(BASE_OPTS);
    expect(args.autoCancelOnZeroPosition).toBeUndefined();
  });

  it('throws on missing ticker', () => {
    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, ticker: '' }),
    ).toThrow('S-conditional-roll: ticker required');
  });

  it('throws on non-positive positionSize, takeProfitCents, or exitIfBelowCents', () => {
    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, positionSize: 0 }),
    ).toThrow('positionSize must be > 0');

    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, positionSize: -5 }),
    ).toThrow('positionSize must be > 0');

    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, takeProfitCents: 0 }),
    ).toThrow('takeProfitCents must be > 0');

    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, takeProfitCents: -1 }),
    ).toThrow('takeProfitCents must be > 0');

    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, exitIfBelowCents: 0 }),
    ).toThrow('exitIfBelowCents must be > 0');

    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, exitIfBelowCents: -10 }),
    ).toThrow('exitIfBelowCents must be > 0');
  });

  it('throws when takeProfitCents <= exitIfBelowCents', () => {
    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, takeProfitCents: 30, exitIfBelowCents: 30 }),
    ).toThrow('takeProfitCents must be > exitIfBelowCents');

    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, takeProfitCents: 20, exitIfBelowCents: 30 }),
    ).toThrow('takeProfitCents must be > exitIfBelowCents');
  });

  it('throws on invalid deadlineTimestamp', () => {
    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, deadlineTimestamp: 'not-a-date' }),
    ).toThrow('deadlineTimestamp is not a valid date');

    expect(() =>
      buildSConditionalRollArgs({ ...BASE_OPTS, deadlineTimestamp: '' }),
    ).toThrow('deadlineTimestamp is not a valid date');
  });
});
