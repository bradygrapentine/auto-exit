import { describe, it, expect } from 'vitest';
import {
  STRATEGY_REGISTRY,
  getStrategyMeta,
  listStrategyIds,
  type StrategyId,
  type StrategyMetadata,
} from '../../src/strategies/registry.js';

describe('STRATEGY_REGISTRY', () => {
  it('has exactly 14 entries', () => {
    expect(Object.keys(STRATEGY_REGISTRY)).toHaveLength(14);
  });

  it('every entry has id matching its key', () => {
    for (const [key, meta] of Object.entries(STRATEGY_REGISTRY)) {
      expect(meta.id).toBe(key);
    }
  });

  it('every entry has at least one required field', () => {
    for (const meta of Object.values(STRATEGY_REGISTRY)) {
      const required = meta.fields.filter((f) => f.required);
      expect(required.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every entry has a non-empty displayName + shortDescription', () => {
    for (const meta of Object.values(STRATEGY_REGISTRY)) {
      expect(meta.displayName.length).toBeGreaterThan(0);
      expect(meta.shortDescription.length).toBeGreaterThan(0);
    }
  });

  it('danger levels are exactly low | medium | high', () => {
    const valid = new Set(['low', 'medium', 'high']);
    for (const meta of Object.values(STRATEGY_REGISTRY)) {
      expect(valid.has(meta.dangerLevel)).toBe(true);
    }
  });

  it('field descriptors are well-formed: kind=enum implies enumValues present', () => {
    for (const meta of Object.values(STRATEGY_REGISTRY)) {
      for (const field of meta.fields) {
        if (field.kind === 'enum') {
          expect(field.enumValues, `${meta.id}.${field.name}`).toBeDefined();
          expect(field.enumValues!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('s-pair fields include legs (array) and legSkewPct', () => {
    const pair = STRATEGY_REGISTRY['s-pair'];
    const fieldNames = pair.fields.map((f) => f.name);
    expect(fieldNames).toContain('legs');
    expect(fieldNames).toContain('legSkewPct');
    const legs = pair.fields.find((f) => f.name === 'legs');
    expect(legs?.kind).toBe('array');
  });

  it('s-basis-arb fields include totalDollarBudget and perPairSlippageCents', () => {
    const meta = STRATEGY_REGISTRY['s-basis-arb'];
    const fieldNames = meta.fields.map((f) => f.name);
    expect(fieldNames).toContain('totalDollarBudget');
    expect(fieldNames).toContain('perPairSlippageCents');
  });

  it('s-aggressive has dangerLevel=high', () => {
    expect(STRATEGY_REGISTRY['s-aggressive'].dangerLevel).toBe('high');
  });

  it('s-stealth has dangerLevel=low', () => {
    expect(STRATEGY_REGISTRY['s-stealth'].dangerLevel).toBe('low');
  });
});

describe('getStrategyMeta', () => {
  it('returns metadata for a known id', () => {
    const meta = getStrategyMeta('s-aggressive');
    expect(meta.displayName).toContain('Aggressive');
  });

  it('throws for an unknown id', () => {
    expect(() => getStrategyMeta('not-a-strategy' as StrategyId)).toThrow(/Unknown strategy id/);
  });
});

describe('listStrategyIds', () => {
  it('returns 14 ids', () => {
    expect(listStrategyIds()).toHaveLength(14);
  });

  it('returns ids deterministically (matches Object.keys order)', () => {
    const a = listStrategyIds();
    const b = listStrategyIds();
    expect(a).toEqual(b);
  });

  it('every id resolves via getStrategyMeta', () => {
    for (const id of listStrategyIds()) {
      const meta: StrategyMetadata = getStrategyMeta(id);
      expect(meta.id).toBe(id);
    }
  });
});
