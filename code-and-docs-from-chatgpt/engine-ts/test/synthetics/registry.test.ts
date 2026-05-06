import { describe, it, expect } from 'vitest';
import { evaluators, evaluate, isComposite } from '../../src/synthetics/index.js';
import type { Synthetic, Orderbook, SyntheticKind } from '../../src/types.js';

const fakeBook: Orderbook = { yes: [{ priceCents: 50, size: 100 }], no: [] };
const stub = (kind: SyntheticKind): Synthetic => ({
  id: 's', kind, ticker: 'X', side: 'yes', positionSize: 10,
  params: { triggerPriceCents: 30 } as any, state: {}, status: 'armed',
  createdAt: '2026-05-05T00:00:00Z',
  selfTradePrevention: 'taker_at_cross',
  autoCancelOnZeroPosition: true,
});

describe('synthetics/index', () => {
  const kinds: SyntheticKind[] = ['stop_loss', 'stop_limit', 'trailing_stop', 'take_profit', 'oco', 'bracket'];

  it('exports an evaluator for every kind', () => {
    for (const k of kinds) expect(evaluators[k]).toBeDefined();
  });

  it('evaluate() routes by kind and returns SyntheticEvalResult', () => {
    const r = evaluate(stub('stop_loss'), fakeBook);
    expect(r).toHaveProperty('fire');
  });

  it('evaluate() throws on unknown kind', () => {
    expect(() => evaluate({ ...stub('stop_loss'), kind: 'nope' as any }, fakeBook)).toThrow();
  });

  it('isComposite() flags oco and bracket as composite', () => {
    expect(isComposite('oco')).toBe(true);
    expect(isComposite('bracket')).toBe(true);
    expect(isComposite('stop_loss')).toBe(false);
  });
});
