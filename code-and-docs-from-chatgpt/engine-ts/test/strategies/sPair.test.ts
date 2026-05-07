/**
 * Tests for SPairRunner + buildSPairArgs (src/strategies/sPair.ts).
 *
 * All sub-runners are mocked via aggressiveInvoke/passiveInvoke injections.
 */

import { describe, it, expect, vi } from 'vitest';
import { SPairRunner, buildSPairArgs } from '../../src/strategies/sPair.js';
import type { SPairArgs } from '../../src/strategies/sPair.js';
import type { AggressiveInvokeFn, PassiveInvokeFn } from '../../src/multiLeg.js';
import type { AggressiveResult } from '../../src/aggressive.js';
import type { PassiveResult } from '../../src/passive.js';
import type { KalshiClientLike, Orderbook } from '../../src/types.js';
import { Journal } from '../../src/journal.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// ── Helpers ───────────────────────────────────────────────────────────────────

function tmpJournal(): Journal {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spair-test-'));
  return new Journal(`spair-${Date.now()}`, dir);
}

function makeMockClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(),
    createOrder: vi.fn(),
    getOrder: vi.fn(),
    cancelOrder: vi.fn(),
    getPosition: vi.fn(),
    getRestingOrderCount: vi.fn(),
    findOrderByClientOrderId: vi.fn(),
  };
}

function makeBook(): Orderbook {
  return {
    yes: [{ priceCents: 60, size: 100 }],
    no: [{ priceCents: 40, size: 100 }],
  };
}

function makeAggressiveInvoke(filled = 100): AggressiveInvokeFn {
  return vi.fn().mockResolvedValue({ filled, orderId: 'o1', reason: 'filled' } satisfies AggressiveResult);
}

function makePassiveInvoke(filled = 100): PassiveInvokeFn {
  return vi.fn().mockResolvedValue({
    jobId: 'p1',
    filled,
    avgPriceCents: 60,
    feesIncurredDollars: 0,
    remaining: 0,
    status: 'complete',
  } satisfies PassiveResult);
}

function baseArgs(overrides: Partial<SPairArgs> = {}): SPairArgs {
  return {
    legs: [
      { ticker: 'AAAA-23', side: 'yes', size: 100, executionMode: 'aggressive' },
      { ticker: 'BBBB-23', side: 'yes', size: 100, executionMode: 'aggressive' },
    ],
    journal: tmpJournal(),
    client: makeMockClient(),
    aggressiveInvoke: makeAggressiveInvoke(),
    passiveInvoke: makePassiveInvoke(),
    fetchOrderbook: vi.fn().mockResolvedValue(makeBook()),
    now: vi.fn().mockReturnValue(1000),
    sleepMs: vi.fn().mockResolvedValue(undefined),
    pollIntervalMs: 0,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildSPairArgs validation', () => {
  it('1a. rejects legs.length < 2', () => {
    expect(() =>
      buildSPairArgs({
        ...baseArgs(),
        legs: [{ ticker: 'AAAA', side: 'yes', size: 100, executionMode: 'aggressive' }],
      }),
    ).toThrow('at least 2 legs');
  });

  it('1b. rejects leg with size <= 0', () => {
    expect(() =>
      buildSPairArgs({
        ...baseArgs(),
        legs: [
          { ticker: 'AAAA', side: 'yes', size: 0, executionMode: 'aggressive' },
          { ticker: 'BBBB', side: 'yes', size: 100, executionMode: 'aggressive' },
        ],
      }),
    ).toThrow('size must be > 0');
  });

  it('1c. rejects legSkewPct out of [0, 1] (negative)', () => {
    expect(() =>
      buildSPairArgs({ ...baseArgs(), legSkewPct: -0.01 }),
    ).toThrow('legSkewPct must be in [0, 1]');
  });

  it('1d. rejects legSkewPct out of [0, 1] (> 1)', () => {
    expect(() =>
      buildSPairArgs({ ...baseArgs(), legSkewPct: 1.01 }),
    ).toThrow('legSkewPct must be in [0, 1]');
  });

  it('1e. rejects duplicate (ticker, side) pairs', () => {
    expect(() =>
      buildSPairArgs({
        ...baseArgs(),
        legs: [
          { ticker: 'AAAA', side: 'yes', size: 100, executionMode: 'aggressive' },
          { ticker: 'AAAA', side: 'yes', size: 50, executionMode: 'passive' }, // duplicate!
        ],
      }),
    ).toThrow('duplicate (ticker, side)');
  });

  it('2. valid config builds without throw', () => {
    expect(() => buildSPairArgs(baseArgs())).not.toThrow();
  });
});

describe('SPairRunner', () => {
  it('3. happy path: two legs complete via injected invokers', async () => {
    const args = baseArgs({
      aggressiveInvoke: makeAggressiveInvoke(100),
    });
    const runner = new SPairRunner(args);
    const result = await runner.run();

    expect(result.halted).toBe(false);
    expect(result.legs).toHaveLength(2);
    expect(result.legs[0]!.filled).toBe(100);
    expect(result.legs[1]!.filled).toBe(100);
  });

  it('4. pair_started and pair_finished journal entries fire', async () => {
    const journal = tmpJournal();
    const journalAppend = vi.spyOn(journal, 'append');

    const args = baseArgs({ journal });
    const runner = new SPairRunner(args);
    await runner.run();

    const kinds = journalAppend.mock.calls.map((c) => c[0]);
    expect(kinds).toContain('pair_started');
    expect(kinds).toContain('pair_finished');

    // pair_started before pair_finished
    const startIdx = kinds.indexOf('pair_started');
    const finishIdx = kinds.indexOf('pair_finished');
    expect(startIdx).toBeLessThan(finishIdx);
  });

  it('5. halt propagates to result', async () => {
    const journal = tmpJournal();
    const fetchOrderbook = vi.fn().mockResolvedValue({ yes: [], no: [] }); // empty → halt

    const args: SPairArgs = {
      ...baseArgs({ journal }),
      aggressiveInvoke: vi.fn().mockImplementation(() => new Promise(() => {})), // never resolves
      fetchOrderbook,
    };

    const runner = new SPairRunner(args);
    const result = await runner.run();

    expect(result.halted).toBe(true);
    expect(result.haltReason).toBeTruthy();
  });

  it('6. default legSkewPct = 0.10 when omitted', () => {
    const args = baseArgs();
    delete (args as Partial<SPairArgs>).legSkewPct;
    const built = buildSPairArgs(args);
    expect(built.legSkewPct).toBe(0.10);
  });
});
