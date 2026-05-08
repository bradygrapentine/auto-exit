/**
 * passive-runtick-backtest.test.ts — Tests for runOneTickBacktest().
 *
 * Covers:
 *   1. First call with no resting order → posts GTC, returns continue, pendingOrderId set.
 *   2. Resting GTC fills when book moves — state accumulates filled, continue or break_loop.
 *   3. state.remaining <= 0 at start → break_loop:filled.
 *   4. Guard: spread_too_tight → break_loop.
 *   5. Guard: floor_hit → break_loop.
 *   6. Guard: safety_cap_breached → break_loop.
 *   7. Cancel+replace when price decision changes between ticks.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  runOneTickBacktest,
  type PassiveRunDeps,
  type PassiveRunState,
  type PassiveConfig,
} from '../src/passive.js';
import { Journal, generateJobId } from '../src/journal.js';
import type { OrderPayload, OrderResult } from '../src/types.js';

// ── Safety mock ───────────────────────────────────────────────────────────────

vi.mock('../src/safety.js', async () => {
  const actual = await vi.importActual<typeof import('../src/safety.js')>('../src/safety.js');
  return {
    ...actual,
    getSafety: vi.fn(() => ({
      version: 1 as const,
      safetySubmittedMultiple: 5,
      floorPriceCents: 0,
      tailSweepThreshold: 0,
      forbiddenTickers: [],
    })),
  };
});

// ── Temp dir ──────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-passive-bt-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Stub client ───────────────────────────────────────────────────────────────

/**
 * Minimal KalshiClientLike stub for backtest tests.
 *
 * Tracks resting orders: Map<orderId, {priceCents, remaining}>.
 * createOrder fills immediately if sell limit <= yesBid (naive model).
 * getOrder returns the current order state (resting or filled).
 * cancelOrder marks order canceled and removes it from resting map.
 */
function makeStubClient(opts: {
  yesAsk: number;  // lowest yes ask (sellers' ask)
  yesBid: number;  // implied yes bid = 100 - lowest no ask
}) {
  let _yesAsk = opts.yesAsk;
  let _yesBid = opts.yesBid;

  const resting = new Map<string, { priceCents: number; remaining: number; action: 'sell' | 'buy' }>();
  const results = new Map<string, OrderResult>();
  let orderSeq = 0;

  function nextId(): string {
    return `stub-order-${++orderSeq}`;
  }

  /**
   * Naive fill: sell fills if limitPrice <= best bid (buyer exists at this price).
   * buy fills if limitPrice >= best ask.
   */
  function tryFill(
    action: 'sell' | 'buy',
    limitPriceCents: number,
    count: number,
  ): { filled: number; status: OrderResult['status'] } {
    if (action === 'sell') {
      if (limitPriceCents <= _yesBid) {
        return { filled: count, status: 'filled' };
      }
    } else {
      if (limitPriceCents >= _yesAsk) {
        return { filled: count, status: 'filled' };
      }
    }
    return { filled: 0, status: 'resting' };
  }

  return {
    // ── Test controls ───────────────────────────────────────────────────────

    /** Move the best bid; any resting sell GTCs at or below the new bid fill. */
    moveBid(newYesBid: number): void {
      _yesBid = newYesBid;
      for (const [id, order] of resting.entries()) {
        if (order.action === 'sell' && order.priceCents <= _yesBid) {
          const filled = order.remaining;
          resting.delete(id);
          results.set(id, {
            orderId: id,
            status: 'filled',
            filledCount: filled,
            remainingCount: 0,
          });
        }
      }
    },

    moveAsk(newYesAsk: number): void {
      _yesAsk = newYesAsk;
    },

    // ── KalshiClientLike ────────────────────────────────────────────────────

    async getOrderbook(_ticker: string, _depth: number) {
      return {
        yes: [{ priceCents: _yesAsk, size: 200 }],
        no: [{ priceCents: 100 - _yesBid, size: 200 }],
      };
    },

    async createOrder(payload: OrderPayload): Promise<OrderResult> {
      const orderId = nextId();
      const limitPriceCents = payload.yes_price_dollars != null
        ? Math.round(parseFloat(payload.yes_price_dollars) * 100)
        : payload.no_price_dollars != null
          ? Math.round(parseFloat(payload.no_price_dollars) * 100)
          : (payload.yes_price ?? payload.no_price ?? 0);

      const action = payload.action;
      const { filled, status } = tryFill(action, limitPriceCents, payload.count);

      const result: OrderResult = {
        orderId,
        status: filled === payload.count ? 'filled' : status,
        filledCount: filled,
        remainingCount: payload.count - filled,
      };
      results.set(orderId, result);

      if (status === 'resting' && filled < payload.count) {
        resting.set(orderId, {
          priceCents: limitPriceCents,
          remaining: payload.count - filled,
          action,
        });
      }

      return result;
    },

    async getOrder(orderId: string): Promise<OrderResult> {
      return results.get(orderId) ?? {
        orderId,
        status: 'unknown',
        filledCount: 0,
        remainingCount: 0,
      };
    },

    async cancelOrder(orderId: string): Promise<OrderResult> {
      resting.delete(orderId);
      const existing = results.get(orderId);
      const updated: OrderResult = {
        orderId,
        status: 'canceled',
        filledCount: existing?.filledCount ?? 0,
        remainingCount: 0,
      };
      results.set(orderId, updated);
      return updated;
    },

    async getPosition(_ticker: string) {
      return { ticker: 'KXTEST-BT', side: 'yes' as const, quantity: 10 };
    },

    async getRestingOrderCount() { return resting.size; },
    async findOrderByClientOrderId() { return null; },
    async listMarkets() { return { markets: [] }; },
    async listSeries() { return { series: [] }; },
    async listEvents() { return { events: [] }; },
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TICKER = 'KXTEST-BT';

function makeState(overrides: Partial<PassiveRunState> = {}): PassiveRunState {
  return {
    filled: 0,
    remaining: 200,
    totalNotionalCents: 0,
    feesIncurredDollars: 0,
    totalSubmittedShares: 0,
    guardHit: false,
    oneSidedWarned: false,
    ...overrides,
  };
}

function makeDeps(
  client: ReturnType<typeof makeStubClient>,
  configOverrides: Partial<PassiveConfig> = {},
  depsOverrides: Partial<Omit<PassiveRunDeps, 'client' | 'config' | 'journal'>> = {},
): PassiveRunDeps {
  const jobId = generateJobId();
  const journal = new Journal(jobId, tmpDir);
  const config: PassiveConfig = {
    ticker: TICKER,
    side: 'sell',
    size: 200,
    chunkSize: 100,
    walkStepCents: 1,
    safetySubmittedMultiple: 5,
    dryRun: false,
    keaHome: tmpDir,
    ...configOverrides,
  };
  const effectiveFloorCents =
    depsOverrides.effectiveFloorCents !== undefined
      ? depsOverrides.effectiveFloorCents
      : config.side === 'sell'
        ? Math.max(0, config.minPriceCents ?? 0)
        : 0;
  return {
    client: client as any,
    config,
    journal,
    chunkSize: config.chunkSize ?? 100,
    passiveTimeboxMs: 0, // not used by runOneTickBacktest
    walkStepCents: config.walkStepCents ?? 1,
    submittedCap: (config.size ?? 200) * (config.safetySubmittedMultiple ?? 5),
    effectiveFloorCents,
    kalshiSide: 'yes',
    roundCents: (c: number) => Math.round(c * 10_000) / 10_000,
    ...depsOverrides,
  };
}

// ── Test 1: First call → posts GTC, continue, pendingOrderId set ──────────────

describe('runOneTickBacktest: first tick no resting order', () => {
  it('posts GTC, returns continue, sets pendingOrderId when order does not fill immediately', async () => {
    // yesAsk=70, yesBid=55. sell iterPrice = 70-1 = 69. bid=55 < 69 → resting.
    const client = makeStubClient({ yesAsk: 70, yesBid: 55 });
    const state = makeState();
    const deps = makeDeps(client);

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('continue');
    expect(state.pendingOrderId).toBeDefined();
    expect(state.pendingPriceCents).toBe(69);
    // Nothing filled yet
    expect(state.filled).toBe(0);
    expect(state.totalSubmittedShares).toBe(100); // one chunk submitted
  });

  it('returns break_loop:filled immediately when full order fills at createOrder time', async () => {
    // yesAsk=70, yesBid=69. spread=1=walkStep (passes check).
    // sell iterPrice = 70-1 = 69. bid=69 >= 69 → fills immediately.
    const client = makeStubClient({ yesAsk: 70, yesBid: 69 });
    const state = makeState({ remaining: 100 });
    const deps = makeDeps(client, { size: 100, chunkSize: 100 });

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { kind: 'break_loop'; reason: string }).reason).toBe('filled');
    expect(state.filled).toBe(100);
    expect(state.remaining).toBe(0);
    expect(state.pendingOrderId).toBeUndefined();
  });
});

// ── Test 2: Resting GTC fills when book moves ─────────────────────────────────

describe('runOneTickBacktest: resting order fills on subsequent tick', () => {
  it('accumulates filled when book moves to cross the resting limit price', async () => {
    // Tick 1: yesAsk=70, yesBid=55. sell iterPrice=69. bid=55 < 69 → resting.
    // moveBid(69): bid=69 >= 69 → stub fills the resting order.
    // Tick 2: step 2 (pending check first) sees filled; remaining=0 → break_loop:filled.
    const client = makeStubClient({ yesAsk: 70, yesBid: 55 });
    const state = makeState({ remaining: 100 });
    const deps = makeDeps(client, { size: 100, chunkSize: 100 });

    // Tick 1: posts GTC, resting
    const t1 = await runOneTickBacktest(state, deps);
    expect(t1.kind).toBe('continue');
    expect(state.pendingOrderId).toBeDefined();
    expect(state.filled).toBe(0);

    // Simulate book moving: bid crosses the resting limit (69)
    client.moveBid(69);

    // Tick 2: pending order fill detected before spread check → break_loop:filled
    const t2 = await runOneTickBacktest(state, deps);

    expect(state.filled).toBe(100);
    expect(state.remaining).toBe(0);
    expect(state.pendingOrderId).toBeUndefined();
    expect(t2.kind).toBe('break_loop');
    expect((t2 as { kind: 'break_loop'; reason: string }).reason).toBe('filled');
  });

  it('returns continue after chunk fills with remaining > 0', async () => {
    // Two chunks of 100. Tick 1: post first chunk GTC@69 (yesAsk=70, yesBid=55), resting.
    // moveBid(69): fills resting 69. Tick 2: first chunk fills (remaining=100).
    // Spread still open (ask=70, bid=69, spread=1=walkStep). New GTC posted → continue.
    const client = makeStubClient({ yesAsk: 70, yesBid: 55 });
    const state = makeState({ remaining: 200 });
    const deps = makeDeps(client, { size: 200, chunkSize: 100 });

    // Tick 1: post first chunk GTC@69, resting
    const t1 = await runOneTickBacktest(state, deps);
    expect(t1.kind).toBe('continue');
    expect(state.pendingOrderId).toBeDefined();

    // Book moves: bid=69 exactly crosses the resting limit (69 <= 69)
    client.moveBid(69);

    // Tick 2: first chunk fills, remaining=100. New GTC@69 posted: bid=69 >= 69 → fills immediately.
    // Then remaining=0 → break_loop:filled. Use lower bid so second order also rests.
    // Reset bid back to 55 so second posted order (at 69) doesn't immediately fill.
    client.moveBid(55);

    const t2 = await runOneTickBacktest(state, deps);

    expect(state.filled).toBe(100);
    expect(state.remaining).toBe(100);
    expect(t2.kind).toBe('continue');
    // New pending order for second chunk
    expect(state.pendingOrderId).toBeDefined();
  });
});

// ── Test 3: remaining <= 0 at start → break_loop:filled ──────────────────────

describe('runOneTickBacktest: remaining=0 at start', () => {
  it('returns break_loop:filled without touching the client', async () => {
    const client = makeStubClient({ yesAsk: 70, yesBid: 55 });
    const state = makeState({ remaining: 0 });
    const deps = makeDeps(client);

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { kind: 'break_loop'; reason: string }).reason).toBe('filled');
    expect(state.totalSubmittedShares).toBe(0);
  });
});

// ── Test 4: spread_too_tight ──────────────────────────────────────────────────

describe('runOneTickBacktest: spread_too_tight guard', () => {
  it('returns break_loop:spread_too_tight when spread < walkStepCents', async () => {
    // yesAsk=55, yesBid=55: spread=0 < walkStep=1
    const client = makeStubClient({ yesAsk: 55, yesBid: 55 });
    const state = makeState();
    const deps = makeDeps(client);

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { kind: 'break_loop'; reason: string }).reason).toBe('spread_too_tight');
    expect(state.filled).toBe(0);
    expect(state.totalSubmittedShares).toBe(0);
  });
});

// ── Test 5: floor_hit ─────────────────────────────────────────────────────────

describe('runOneTickBacktest: floor_hit guard', () => {
  it('returns break_loop:floor_hit when sell iterPrice < effectiveFloorCents', async () => {
    // yesAsk=60, walkStep=1 → iterPrice=59. effectiveFloorCents=60 > 59 → floor_hit
    const client = makeStubClient({ yesAsk: 60, yesBid: 50 });
    const state = makeState();
    const deps = makeDeps(
      client,
      { minPriceCents: 60 },
      { effectiveFloorCents: 60 },
    );

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { kind: 'break_loop'; reason: string }).reason).toBe('floor_hit');
    expect(state.guardHit).toBe(true);
    expect(state.filled).toBe(0);
  });
});

// ── Test 6: safety_cap_breached ───────────────────────────────────────────────

describe('runOneTickBacktest: safety_cap_breached guard', () => {
  it('returns break_loop:safety_cap_breached when totalSubmittedShares + chunk > cap', async () => {
    // submittedCap=100, already 50 submitted → 50+100 > 100
    const client = makeStubClient({ yesAsk: 70, yesBid: 55 });
    const state = makeState({ totalSubmittedShares: 50 });
    const deps = makeDeps(
      client,
      { size: 100, chunkSize: 100 },
      { submittedCap: 100 },
    );

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { kind: 'break_loop'; reason: string }).reason).toBe('safety_cap_breached');
    expect(state.guardHit).toBe(true);
    expect(state.filled).toBe(0);
  });
});

// ── Test 7: cancel+replace when price changes ─────────────────────────────────

describe('runOneTickBacktest: cancel+replace on price change', () => {
  it('cancels resting order and reposts at new price when ask moves', async () => {
    // Tick 1: yesAsk=70, sell iterPrice=69, resting. pendingPriceCents=69.
    // Tick 2: ask drops to 65, new iterPrice=64 ≠ 69 → cancel+repost at 64.
    const client = makeStubClient({ yesAsk: 70, yesBid: 30 });
    const state = makeState({ remaining: 100 });
    const deps = makeDeps(client, { size: 100, chunkSize: 100, walkStepCents: 1 });

    // Tick 1: post at 69, resting
    const t1 = await runOneTickBacktest(state, deps);
    expect(t1.kind).toBe('continue');
    const firstOrderId = state.pendingOrderId;
    expect(firstOrderId).toBeDefined();
    expect(state.pendingPriceCents).toBe(69);

    // Book moves: ask drops to 65, new iterPrice will be 64
    client.moveAsk(65);

    // Tick 2: pendingPriceCents=69 ≠ new iterPrice=64 → cancel first order, post new one
    const t2 = await runOneTickBacktest(state, deps);

    expect(t2.kind).toBe('continue');
    // New pending order at new price (64)
    expect(state.pendingPriceCents).toBe(64);
    // pendingOrderId should be a new order (different from first)
    expect(state.pendingOrderId).not.toBe(firstOrderId);
    // totalSubmittedShares: 100 (tick1) + 100 (tick2 repost) = 200
    expect(state.totalSubmittedShares).toBe(200);
  });
});
