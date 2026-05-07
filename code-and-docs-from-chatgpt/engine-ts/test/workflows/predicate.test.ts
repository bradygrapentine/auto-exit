import { describe, it, expect } from 'vitest';
import { evaluatePredicate } from '../../src/workflows/predicate.js';
import type { EvaluationContext, SimplePredicate } from '../../src/workflows/types.js';

const ctx = (event: Record<string, unknown> = {}, vars: Record<string, unknown> = {}): EvaluationContext => ({ event, vars });

describe('evaluatePredicate — leaf eq/neq', () => {
  it('eq matches when event.field equals value', () => {
    const p: SimplePredicate = { field: 'event.ticker', op: 'eq', value: 'KX-1' };
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-1' }))).toBe(true);
  });

  it('eq returns false when value differs', () => {
    const p: SimplePredicate = { field: 'event.ticker', op: 'eq', value: 'KX-2' };
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-1' }))).toBe(false);
  });

  it('neq inverts eq', () => {
    const p: SimplePredicate = { field: 'event.ticker', op: 'neq', value: 'KX-2' };
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-1' }))).toBe(true);
  });

  it('eq returns false when field path missing', () => {
    const p: SimplePredicate = { field: 'event.ticker', op: 'eq', value: 'KX-1' };
    expect(evaluatePredicate(p, ctx({}))).toBe(false);
  });

  it('neq returns true when field path missing', () => {
    const p: SimplePredicate = { field: 'event.ticker', op: 'neq', value: 'KX-1' };
    expect(evaluatePredicate(p, ctx({}))).toBe(true);
  });
});

describe('evaluatePredicate — leaf in', () => {
  it('in matches when value is in array', () => {
    const p: SimplePredicate = { field: 'event.ticker', op: 'in', value: ['KX-1', 'KX-2'] };
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-1' }))).toBe(true);
  });

  it('in returns false when value not in array', () => {
    const p: SimplePredicate = { field: 'event.ticker', op: 'in', value: ['KX-1', 'KX-2'] };
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-3' }))).toBe(false);
  });

  it('in returns false when value is not array', () => {
    const p = { field: 'event.ticker', op: 'in', value: 'KX-1' } as unknown as SimplePredicate;
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-1' }))).toBe(false);
  });
});

describe('evaluatePredicate — numeric ops', () => {
  it('gte/lte/gt/lt compare numerically', () => {
    expect(evaluatePredicate({ field: 'event.priceCents', op: 'gte', value: 50 }, ctx({ priceCents: 50 }))).toBe(true);
    expect(evaluatePredicate({ field: 'event.priceCents', op: 'gt', value: 50 }, ctx({ priceCents: 50 }))).toBe(false);
    expect(evaluatePredicate({ field: 'event.priceCents', op: 'lte', value: 50 }, ctx({ priceCents: 49 }))).toBe(true);
    expect(evaluatePredicate({ field: 'event.priceCents', op: 'lt', value: 50 }, ctx({ priceCents: 50 }))).toBe(false);
  });

  it('returns false (no throw) when lhs is non-numeric for numeric op', () => {
    const p: SimplePredicate = { field: 'event.ticker', op: 'gte', value: 50 };
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-1' }))).toBe(false);
  });

  it('returns false when rhs is non-numeric for numeric op', () => {
    const p = { field: 'event.priceCents', op: 'gte', value: 'high' } as unknown as SimplePredicate;
    expect(evaluatePredicate(p, ctx({ priceCents: 50 }))).toBe(false);
  });
});

describe('evaluatePredicate — var resolution', () => {
  it('var.X resolves from ctx.vars', () => {
    const p: SimplePredicate = { field: 'var.threshold', op: 'lt', value: 100 };
    expect(evaluatePredicate(p, ctx({}, { threshold: 50 }))).toBe(true);
  });
});

describe('evaluatePredicate — combinators', () => {
  it('all: [] is vacuously true', () => {
    expect(evaluatePredicate({ all: [] }, ctx())).toBe(true);
  });

  it('any: [] is vacuously false', () => {
    expect(evaluatePredicate({ any: [] }, ctx())).toBe(false);
  });

  it('all: [...] requires every leaf to match', () => {
    const p: SimplePredicate = {
      all: [
        { field: 'event.ticker', op: 'eq', value: 'KX-1' },
        { field: 'event.priceCents', op: 'gte', value: 50 },
      ],
    };
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-1', priceCents: 60 }))).toBe(true);
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-1', priceCents: 40 }))).toBe(false);
  });

  it('any: [...] requires at least one leaf to match', () => {
    const p: SimplePredicate = {
      any: [
        { field: 'event.ticker', op: 'eq', value: 'KX-1' },
        { field: 'event.ticker', op: 'eq', value: 'KX-2' },
      ],
    };
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-2' }))).toBe(true);
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-3' }))).toBe(false);
  });

  it('nested all/any evaluates recursively', () => {
    const p: SimplePredicate = {
      all: [
        { any: [{ field: 'event.ticker', op: 'eq', value: 'KX-1' }, { field: 'event.ticker', op: 'eq', value: 'KX-2' }] },
        { field: 'event.priceCents', op: 'gte', value: 50 },
      ],
    };
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-2', priceCents: 60 }))).toBe(true);
    expect(evaluatePredicate(p, ctx({ ticker: 'KX-3', priceCents: 60 }))).toBe(false);
  });
});

describe('evaluatePredicate — purity', () => {
  it('does not mutate ctx', () => {
    const c = ctx({ ticker: 'KX-1' }, { v: 1 });
    const before = JSON.stringify(c);
    evaluatePredicate({ field: 'event.ticker', op: 'eq', value: 'KX-1' }, c);
    expect(JSON.stringify(c)).toBe(before);
  });

  it('returns same result on repeated calls', () => {
    const p: SimplePredicate = { field: 'event.ticker', op: 'eq', value: 'KX-1' };
    const c = ctx({ ticker: 'KX-1' });
    expect(evaluatePredicate(p, c)).toBe(evaluatePredicate(p, c));
  });
});
