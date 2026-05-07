import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import {
  shouldDedupe,
  checkAndRecord,
  loadState,
  flushState,
  _resetStateForTest,
  _setLastFiredForTest,
  DEFAULT_COOLDOWN_MS,
} from '../../src/alerts/dedupe.js';

const COOLDOWN = 5 * 60 * 1000; // 5 min

beforeEach(() => {
  _resetStateForTest();
});

describe('shouldDedupe (pure function)', () => {
  it('first call (nothing in map) returns false', () => {
    const map = new Map<string, number>();
    expect(shouldDedupe('syn-1', 1000, COOLDOWN, map)).toBe(false);
  });

  it('within cooldown window returns true', () => {
    const lastFired = 1000;
    const map = new Map([['syn-1', lastFired]]);
    const nowMs = lastFired + COOLDOWN - 1;
    expect(shouldDedupe('syn-1', nowMs, COOLDOWN, map)).toBe(true);
  });

  it('exactly at cooldown boundary returns false', () => {
    const lastFired = 1000;
    const map = new Map([['syn-1', lastFired]]);
    const nowMs = lastFired + COOLDOWN;
    expect(shouldDedupe('syn-1', nowMs, COOLDOWN, map)).toBe(false);
  });

  it('after cooldown window returns false', () => {
    const lastFired = 1000;
    const map = new Map([['syn-1', lastFired]]);
    const nowMs = lastFired + COOLDOWN + 1;
    expect(shouldDedupe('syn-1', nowMs, COOLDOWN, map)).toBe(false);
  });

  it('different syntheticIds do not dedupe each other', () => {
    const map = new Map([['syn-1', 1000]]);
    // syn-2 not in map → should not be deduped
    expect(shouldDedupe('syn-2', 1001, COOLDOWN, map)).toBe(false);
  });
});

describe('checkAndRecord (module-level stateful)', () => {
  it('first call returns false (no dedupe), second within window returns true', () => {
    const now = Date.now();
    expect(checkAndRecord('syn-A', now, COOLDOWN)).toBe(false);
    expect(checkAndRecord('syn-A', now + 1000, COOLDOWN)).toBe(true);
  });

  it('after cooldown, fires again', () => {
    const now = Date.now();
    checkAndRecord('syn-B', now, COOLDOWN);
    // simulate time past cooldown
    expect(checkAndRecord('syn-B', now + COOLDOWN + 1, COOLDOWN)).toBe(false);
  });

  it('per-ID isolation: separate IDs fire independently', () => {
    const now = Date.now();
    checkAndRecord('syn-C', now, COOLDOWN);
    // syn-D not yet fired — should not be deduped
    expect(checkAndRecord('syn-D', now + 1, COOLDOWN)).toBe(false);
  });
});

describe('state persistence (flush + load)', () => {
  let tmpPath: string;

  beforeEach(() => {
    tmpPath = join(tmpdir(), `alert-state-test-${Date.now()}.json`);
    _resetStateForTest();
  });

  afterEach(() => {
    if (existsSync(tmpPath)) rmSync(tmpPath);
    _resetStateForTest();
  });

  it('flushes in-memory state to JSON, reload survives restart', () => {
    const now = Date.now();
    _setLastFiredForTest('syn-persist', now);
    flushState(tmpPath);

    // Simulate process restart
    _resetStateForTest();
    loadState(tmpPath);

    // Within window → should dedupe after reload
    expect(checkAndRecord('syn-persist', now + 1000, DEFAULT_COOLDOWN_MS)).toBe(true);
  });

  it('does not crash on missing state file', () => {
    expect(() => loadState('/tmp/definitely-does-not-exist-xyz.json')).not.toThrow();
  });

  it('does not crash on corrupt state file', async () => {
    const { writeFileSync } = await import('node:fs');
    const corruptPath = join(tmpdir(), `corrupt-${Date.now()}.json`);
    writeFileSync(corruptPath, 'not json at all !!!');
    expect(() => loadState(corruptPath)).not.toThrow();
    rmSync(corruptPath);
  });
});
