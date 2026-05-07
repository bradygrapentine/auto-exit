/**
 * Pure SimplePredicate evaluator. No I/O, no mutation.
 *
 * Field paths:
 *   'event.X' → ctx.event[X]
 *   'var.Y'   → ctx.vars[Y]
 *
 * Numeric ops (gte/lte/gt/lt) return false when either side isn't numeric
 * — they don't throw. Field-not-found returns false for eq, true for neq
 * (so neq behaves correctly for missing keys).
 *
 * Vacuous: `{all: []}` → true, `{any: []}` → false.
 */
import type { SimplePredicate, EvaluationContext, LeafPredicate } from './types.js';

export function evaluatePredicate(p: SimplePredicate, ctx: EvaluationContext): boolean {
  if ('all' in p) return p.all.every((sub) => evaluatePredicate(sub, ctx));
  if ('any' in p) return p.any.some((sub) => evaluatePredicate(sub, ctx));
  return evaluateLeaf(p, ctx);
}

function evaluateLeaf(p: LeafPredicate, ctx: EvaluationContext): boolean {
  const lhs = resolveField(p.field, ctx);
  const present = lhs !== undefined;

  switch (p.op) {
    case 'eq':
      return present && lhs === p.value;
    case 'neq':
      return !present || lhs !== p.value;
    case 'in': {
      if (!Array.isArray(p.value)) return false;
      return present && (p.value as unknown[]).includes(lhs);
    }
    case 'gte':
    case 'lte':
    case 'gt':
    case 'lt': {
      if (typeof lhs !== 'number' || typeof p.value !== 'number') return false;
      if (p.op === 'gte') return lhs >= p.value;
      if (p.op === 'lte') return lhs <= p.value;
      if (p.op === 'gt') return lhs > p.value;
      return lhs < p.value;
    }
  }
}

function resolveField(field: string, ctx: EvaluationContext): unknown {
  const dot = field.indexOf('.');
  if (dot === -1) return undefined;
  const root = field.slice(0, dot);
  const key = field.slice(dot + 1);
  if (root === 'event') return ctx.event?.[key];
  if (root === 'var') return ctx.vars[key];
  return undefined;
}
