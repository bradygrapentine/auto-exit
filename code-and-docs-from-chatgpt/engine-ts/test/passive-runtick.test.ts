/**
 * passive-runtick.test.ts — Tests for the runOneTick() seam extracted from passive.ts.
 *
 * Covers:
 *   1. continue outcome — dry-run tick fills chunk, decrements remaining
 *   2. break_loop reason: 'floor_hit' — sell price below effectiveFloorCents
 *   3. break_loop reason: 'safety_cap_breached' — totalSubmittedShares hits cap
 *   4. break_loop reason: 'spread_too_tight' — spread < walkStepCents
 *   5. break_loop reason: 'ceiling_hit' — buy price above maxPriceCents
 *   6. Regression: full run() still drives multiple ticks and terminates correctly
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  run,
  runOneTick,
  type PassiveRunDeps,
  type PassiveRunState,
  type PassiveConfig,
} from '../src/passive.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import { Journal, generateJobId } from '../src/journal.js';
import type { Orderbook } from '../src/types.js';

// ── Safety mock ───────────────────────────────────────────────────────────────
vi.mock('../src/safety.js', async () => {
  const actual = await vi.importActual<typeof import('../src/safety.js')>('../src/safety.js');
  return {
    ...actual,
    getSafety: vi.fn(() => ({
      version: 1 as const,
      safetySubmittedMultiple: 1.1,
      floorPriceCents: 0,
      tailSweepThreshold: 0,
      forbiddenTickers: [],
    })),
  };
});

// ── Temp dir ──────────────────────────────────────────────────────────────────
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-passive-runtick-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** 5¢ spread: YES ask=55¢, implied YES bid=50¢ */
const normalBook: Orderbook = {
  yes: [{ priceCents: 55, size: 10000 }],
  no: [{ priceCents: 50, size: 10000 }],
};

/** Zero spread: bid == ask */
const tightBook: Orderbook = {
  yes: [{ priceCents: 50, size: 10000 }],
  no: [{ priceCents: 50, size: 10000 }],
};

function makeState(overrides: Partial<PassiveRunState> = {}): PassiveRunState {
  return {
    filled: 0,
    remaining: 100,
    totalNotionalCents: 0,
    feesIncurredDollars: 0,
    totalSubmittedShares: 0,
    guardHit: false,
    oneSidedWarned: false,
    ...overrides,
  };
}

function makeDeps(
  client: MockKalshiClient,
  config: Partial<PassiveConfig> & Pick<PassiveConfig, 'ticker' | 'side' | 'size'>,
  overrides: Partial<Omit<PassiveRunDeps, 'client' | 'config' | 'journal'>> = {},
): PassiveRunDeps {
  const jobId = generateJobId();
  const journal = new Journal(jobId, tmpDir);
  const fullConfig: PassiveConfig = {
    chunkSize: 100,
    loopDelayMs: 0,
    dryRun: true,
    passiveTimeboxMs: 100,
    keaHome: tmpDir,
    walkStepCents: 1,
    safetySubmittedMultiple: 5,
    ...config,
  };
  return {
    client,
    config: fullConfig,
    journal,
    chunkSize: fullConfig.chunkSize ?? 100,
    passiveTimeboxMs: fullConfig.passiveTimeboxMs ?? 100,
    walkStepCents: fullConfig.walkStepCents ?? 1,
    submittedCap: config.size * (fullConfig.safetySubmittedMultiple ?? 5),
    effectiveFloorCents: 0,
    kalshiSide: 'yes',
    roundCents: (c: number) => Math.round(c * 10_000) / 10_000,
    ...overrides,
  };
}

// ── Test 1: continue outcome (dry-run fill) ───────────────────────────────────

describe('runOneTick: continue outcome', () => {
  it('dry-run tick returns continue and decrements remaining by chunkSize', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [normalBook] });
    const state = makeState({ remaining: 100 });
    // config.dryRun defaults to true in makeDeps
    const deps = makeDeps(mock, { ticker: 'KXTEST', side: 'sell', size: 100 });

    const outcome = await runOneTick(state, deps);

    expect(outcome.kind).toBe('continue');
    expect(state.filled).toBe(100);
    expect(state.remaining).toBe(0);
    expect(state.totalSubmittedShares).toBe(100);
    expect(state.totalNotionalCents).toBe(100 * 54); // sell at ask-1 = 54¢
    expect(mock.events).toContain('getOrderbook');
    expect(mock.events).not.toContain('createOrder'); // dry-run skips real create
  });

  it('dry-run tick: buy side posts at bid + walkStep', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [normalBook] });
    const state = makeState({ remaining: 50 });
    const deps = makeDeps(
      mock,
      { ticker: 'KXTEST', side: 'buy', size: 50 },
      { chunkSize: 50, effectiveFloorCents: 0 },
    );

    const outcome = await runOneTick(state, deps);

    expect(outcome.kind).toBe('continue');
    expect(state.filled).toBe(50);
    // buy: bestBid = 100 - noAsks[0].priceCents = 100 - 50 = 50, post at 50 + 1 = 51¢
    expect(state.totalNotionalCents).toBe(50 * 51);
  });
});

// ── Test 2: break_loop — floor_hit ────────────────────────────────────────────

describe('runOneTick: break_loop floor_hit', () => {
  it('returns break_loop/floor_hit when iterPrice < effectiveFloorCents (sell)', async () => {
    // normalBook: sell iterPrice = ask(55) - walkStep(1) = 54¢
    // Set floor to 55 so 54 < 55 → floor_hit immediately
    const mock = new MockKalshiClient({ orderbookSnapshots: [normalBook] });
    const state = makeState();
    const deps = makeDeps(
      mock,
      { ticker: 'KXTEST', side: 'sell', size: 100 },
      { effectiveFloorCents: 55 },
    );

    const outcome = await runOneTick(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { kind: 'break_loop'; reason: string }).reason).toBe('floor_hit');
    expect(state.guardHit).toBe(true);
    // No fill happened
    expect(state.filled).toBe(0);
    expect(state.totalSubmittedShares).toBe(0);
  });
});

// ── Test 3: break_loop — safety_cap_breached ──────────────────────────────────

describe('runOneTick: break_loop safety_cap_breached', () => {
  it('returns break_loop/safety_cap_breached when totalSubmittedShares + chunk > cap', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [normalBook] });
    // cap = size(100) * multiple(1) = 100; already have 50 submitted → 50+100 > 100
    const state = makeState({ totalSubmittedShares: 50 });
    const deps = makeDeps(
      mock,
      { ticker: 'KXTEST', side: 'sell', size: 100 },
      { submittedCap: 100 },
    );

    const outcome = await runOneTick(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { kind: 'break_loop'; reason: string }).reason).toBe('safety_cap_breached');
    expect(state.guardHit).toBe(true);
    expect(state.filled).toBe(0);
  });
});

// ── Test 4: break_loop — spread_too_tight ─────────────────────────────────────

describe('runOneTick: break_loop spread_too_tight', () => {
  it('returns break_loop/spread_too_tight when spread < walkStepCents', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [tightBook] });
    const state = makeState();
    const deps = makeDeps(mock, { ticker: 'KXTEST', side: 'sell', size: 100 });

    const outcome = await runOneTick(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { kind: 'break_loop'; reason: string }).reason).toBe('spread_too_tight');
    // No fill, no order
    expect(state.filled).toBe(0);
    expect(mock.events).not.toContain('createOrder');
  });
});

// ── Test 5: break_loop — ceiling_hit ─────────────────────────────────────────

describe('runOneTick: break_loop ceiling_hit', () => {
  it('returns break_loop/ceiling_hit when buy iterPrice > maxPriceCents', async () => {
    // normalBook: bid=50, buy iterPrice = 50 + 1 = 51¢; set ceiling at 50 → 51 > 50
    const mock = new MockKalshiClient({ orderbookSnapshots: [normalBook] });
    const state = makeState();
    const deps = makeDeps(
      mock,
      { ticker: 'KXTEST', side: 'buy', size: 100, maxPriceCents: 50 },
      { effectiveFloorCents: 0 },
    );

    const outcome = await runOneTick(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { kind: 'break_loop'; reason: string }).reason).toBe('ceiling_hit');
    expect(state.guardHit).toBe(true);
  });
});

// ── Test 6: Regression — full run() drives multiple ticks and terminates ──────

describe('run() regression: drives multiple ticks via runOneTick internally', () => {
  it('multi-chunk run fills 200 contracts over 2 ticks (dry-run)', async () => {
    // size=200, chunkSize=100 → 2 outer iterations
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook, normalBook],
    });
    const result = await run(mock, {
      ticker: 'KXTEST',
      side: 'sell',
      size: 200,
      chunkSize: 100,
      loopDelayMs: 0,
      dryRun: true,
      keaHome: tmpDir,
    });

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(200);
    expect(result.remaining).toBe(0);
    // Both chunks at 54¢
    expect(result.avgPriceCents).toBe(54);
    // 2 orderbook fetches
    expect(mock.events.filter((e) => e === 'getOrderbook').length).toBe(2);
  });

  it('run() terminates on floor_hit mid-walk: returns partial', async () => {
    // size=200, chunkSize=100; floor=55 > iterPrice=54 → floor_hit on first tick
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
      behaviors: [{ fillCount: 0 }],
    });
    const result = await run(mock, {
      ticker: 'KXTEST',
      side: 'sell',
      size: 200,
      chunkSize: 100,
      minPriceCents: 55,
      loopDelayMs: 0,
      dryRun: false,
      passiveTimeboxMs: 1,
      keaHome: tmpDir,
    });

    expect(result.status).toBe('partial');
    expect(result.filled).toBe(0);
  });

  it('run() returns spread_too_tight from full pipeline', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [tightBook] });
    const result = await run(mock, {
      ticker: 'KXTEST',
      side: 'sell',
      size: 100,
      chunkSize: 100,
      dryRun: false,
      keaHome: tmpDir,
    });

    expect(result.status).toBe('spread_too_tight');
    expect(result.filled).toBe(0);
    expect(result.remaining).toBe(100);
  });
});
