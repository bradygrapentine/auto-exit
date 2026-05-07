/**
 * Tests for DefaultPolicyEngine (Task B.2).
 *
 * All tests inject callbacks — no real file I/O goes to ~/.kalshi-exit-assistant.
 * Persistence tests use tmp dirs created per-test and cleaned up after.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DefaultPolicyEngine, type Policy, type DetectedPosition } from '../../src/workflows/policies.js';
import { evaluatePredicate } from '../../src/workflows/predicate.js';
import type { SimplePredicate } from '../../src/workflows/types.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-policies-test-'));
}

function makeDeps(overrides: Partial<Parameters<typeof DefaultPolicyEngine>[0]> = {}) {
  const registerSyntheticFn = vi.fn();
  const runStrategyFn = vi.fn();
  const alertFn = vi.fn();
  const now = vi.fn(() => Date.now());
  return {
    deps: {
      predicateEval: evaluatePredicate,
      registerSyntheticFn,
      runStrategyFn,
      alertFn,
      now,
      ...overrides,
    },
    registerSyntheticFn,
    runStrategyFn,
    alertFn,
    now,
  };
}

/** Always-true predicate. */
const ALWAYS_TRUE: SimplePredicate = { any: [{ field: 'event.ticker', op: 'neq', value: '__never__' }] };

/** Always-false predicate. */
const ALWAYS_FALSE: SimplePredicate = { all: [{ field: 'event.ticker', op: 'eq', value: '__never__' }] };

function makePolicy(id: string, condition: SimplePredicate = ALWAYS_TRUE): Policy {
  return {
    id,
    condition,
    action: [{ type: 'alert', channel: 'log', message: `fired:${id}` }],
    applyOncePerPosition: true,
  };
}

const POS_YES: DetectedPosition = { ticker: 'ABC', side: 'yes' };
const POS_NO: DetectedPosition = { ticker: 'ABC', side: 'no' };
const POS_XYZ: DetectedPosition = { ticker: 'XYZ', side: 'yes' };

// ── tests ─────────────────────────────────────────────────────────────────────

describe('DefaultPolicyEngine', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── Test 1: addPolicy + listPolicies round-trip ────────────────────────────
  it('addPolicy + listPolicies round-trip', () => {
    const { deps } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    expect(engine.listPolicies()).toHaveLength(0);

    const p = makePolicy('p1');
    engine.addPolicy(p);

    const list = engine.listPolicies();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('p1');
  });

  // ── Test 2: removePolicy by id ─────────────────────────────────────────────
  it('removePolicy by id returns true and removes the policy', () => {
    const { deps } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    engine.addPolicy(makePolicy('p1'));
    engine.addPolicy(makePolicy('p2'));

    const removed = engine.removePolicy('p1');
    expect(removed).toBe(true);
    expect(engine.listPolicies()).toHaveLength(1);
    expect(engine.listPolicies()[0]?.id).toBe('p2');
  });

  // ── Test 3: removePolicy non-existent returns false ─────────────────────────
  it('removePolicy returns false for unknown id', () => {
    const { deps } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    const removed = engine.removePolicy('does-not-exist');
    expect(removed).toBe(false);
  });

  // ── Test 4: handlePositionDetected fires matching action ───────────────────
  it('handlePositionDetected fires alertFn for matching policy', () => {
    const { deps, alertFn } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    engine.addPolicy(makePolicy('p1'));
    engine.handlePositionDetected(POS_YES);

    expect(alertFn).toHaveBeenCalledOnce();
    expect(alertFn).toHaveBeenCalledWith('log', 'fired:p1');
  });

  // ── Test 5: non-matching condition ignored ─────────────────────────────────
  it('handlePositionDetected ignores non-matching policy', () => {
    const { deps, alertFn } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    engine.addPolicy(makePolicy('p1', ALWAYS_FALSE));
    engine.handlePositionDetected(POS_YES);

    expect(alertFn).not.toHaveBeenCalled();
  });

  // ── Test 6: applyOncePerPosition guards re-fire ────────────────────────────
  it('applyOncePerPosition: same (ticker,side) does not re-fire', () => {
    const { deps, alertFn } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    engine.addPolicy(makePolicy('p1'));
    engine.handlePositionDetected(POS_YES);
    engine.handlePositionDetected(POS_YES);
    engine.handlePositionDetected(POS_YES);

    expect(alertFn).toHaveBeenCalledOnce();
  });

  // ── Test 7: different ticker fires independently ───────────────────────────
  it('different ticker fires even after first position was applied', () => {
    const { deps, alertFn } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    engine.addPolicy(makePolicy('p1'));
    engine.handlePositionDetected(POS_YES);   // ABC yes — fires
    engine.handlePositionDetected(POS_XYZ);  // XYZ yes — different ticker, should fire

    expect(alertFn).toHaveBeenCalledTimes(2);
  });

  // ── Test 8: same ticker different side fires independently ─────────────────
  it('same ticker different side (yes vs no) are independent', () => {
    const { deps, alertFn } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    engine.addPolicy(makePolicy('p1'));
    engine.handlePositionDetected(POS_YES);  // ABC yes
    engine.handlePositionDetected(POS_NO);   // ABC no — different side, should fire

    expect(alertFn).toHaveBeenCalledTimes(2);
  });

  // ── Test 9: persist + reload from file ────────────────────────────────────
  it('persist + reload: new engine instance reads back saved policies', () => {
    const filePath = path.join(tmpDir, 'policies.json');
    const { deps: deps1 } = makeDeps({ persistencePath: filePath });
    const engine1 = new DefaultPolicyEngine(deps1);

    engine1.addPolicy(makePolicy('p-persist'));

    // New engine same file
    const { deps: deps2, alertFn: alertFn2 } = makeDeps({ persistencePath: filePath });
    const engine2 = new DefaultPolicyEngine(deps2);

    expect(engine2.listPolicies()).toHaveLength(1);
    expect(engine2.listPolicies()[0]?.id).toBe('p-persist');

    engine2.handlePositionDetected(POS_YES);
    expect(alertFn2).toHaveBeenCalledOnce();
  });

  // ── Test 10: atomic write — tmp file removed after rename ─────────────────
  it('atomic write: .tmp file does not persist after addPolicy', () => {
    const filePath = path.join(tmpDir, 'policies.json');
    const { deps } = makeDeps({ persistencePath: filePath });
    const engine = new DefaultPolicyEngine(deps);

    engine.addPolicy(makePolicy('p1'));

    const tmpFile = `${filePath}.tmp`;
    expect(fs.existsSync(tmpFile)).toBe(false);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  // ── Test 11: action dispatch via injected callbacks ───────────────────────
  it('run_strategy action dispatches through runStrategyFn', () => {
    const { deps, runStrategyFn } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    const policy: Policy = {
      id: 'run-strat',
      condition: ALWAYS_TRUE,
      action: [{ type: 'run_strategy', strategy: 'passive', params: { qty: 10 } }],
      applyOncePerPosition: true,
    };
    engine.addPolicy(policy);
    engine.handlePositionDetected(POS_YES);

    expect(runStrategyFn).toHaveBeenCalledOnce();
    expect(runStrategyFn).toHaveBeenCalledWith('passive', { qty: 10 });
  });

  // ── Test 12: register_synthetic action dispatches through registerSyntheticFn
  it('register_synthetic action dispatches through registerSyntheticFn', () => {
    const { deps, registerSyntheticFn } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    const policy: Policy = {
      id: 'reg-syn',
      condition: ALWAYS_TRUE,
      action: [{ type: 'register_synthetic', synthetic: { kind: 'deci_walk', ticker: 'ABC' } }],
      applyOncePerPosition: true,
    };
    engine.addPolicy(policy);
    engine.handlePositionDetected(POS_YES);

    expect(registerSyntheticFn).toHaveBeenCalledOnce();
    expect(registerSyntheticFn).toHaveBeenCalledWith({ kind: 'deci_walk', ticker: 'ABC' });
  });

  // ── Test 13: empty policy list is no-op ───────────────────────────────────
  it('empty policy list: handlePositionDetected is a no-op', () => {
    const { deps, alertFn, runStrategyFn, registerSyntheticFn } = makeDeps({
      persistencePath: path.join(tmpDir, 'policies.json'),
    });
    const engine = new DefaultPolicyEngine(deps);

    engine.handlePositionDetected(POS_YES);

    expect(alertFn).not.toHaveBeenCalled();
    expect(runStrategyFn).not.toHaveBeenCalled();
    expect(registerSyntheticFn).not.toHaveBeenCalled();
  });

  // ── Test 14: duplicate addPolicy throws ──────────────────────────────────
  it('addPolicy throws on duplicate id', () => {
    const { deps } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    engine.addPolicy(makePolicy('dup'));
    expect(() => engine.addPolicy(makePolicy('dup'))).toThrow(/already exists/);
  });

  // ── Test 15: predicate condition evaluated against event fields ────────────
  it('condition evaluated against event.ticker field', () => {
    const { deps, alertFn } = makeDeps({ persistencePath: path.join(tmpDir, 'policies.json') });
    const engine = new DefaultPolicyEngine(deps);

    const tickerABC: SimplePredicate = { field: 'event.ticker', op: 'eq', value: 'ABC' };
    engine.addPolicy({ id: 'abc-only', condition: tickerABC, action: [{ type: 'alert', channel: 'log', message: 'hit' }], applyOncePerPosition: true });

    engine.handlePositionDetected({ ticker: 'XYZ', side: 'yes' });
    expect(alertFn).not.toHaveBeenCalled();

    engine.handlePositionDetected({ ticker: 'ABC', side: 'yes' });
    expect(alertFn).toHaveBeenCalledOnce();
  });
});
