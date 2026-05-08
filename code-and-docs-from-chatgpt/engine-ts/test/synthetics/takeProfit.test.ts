import { describe, it, expect } from 'vitest';
import { evalTakeProfit } from '../../src/synthetics/takeProfit.js';
import type { Synthetic, Orderbook } from '../../src/types.js';

const BASE_SYNTHETIC: Omit<Synthetic, 'params' | 'state' | 'side'> = {
  id: 'syn-test',
  kind: 'take_profit',
  ticker: 'TEST-MKT',
  positionSize: 100,
  status: 'armed',
  createdAt: '2026-01-01T00:00:00Z',
  selfTradePrevention: 'taker_at_cross',
  autoCancelOnZeroPosition: false,
};

function makeSynth(
  side: 'yes' | 'no',
  params: Synthetic['params'],
  state: Synthetic['state'] = {},
): Synthetic {
  return { ...BASE_SYNTHETIC, side, params, state } as Synthetic;
}

function makeBook(yesBid: number, noBid: number): Orderbook {
  return {
    yes: yesBid > 0 ? [{ priceCents: yesBid, size: 100 }] : [],
    no: noBid > 0 ? [{ priceCents: noBid, size: 100 }] : [],
  };
}

const FOUR_RUNGS = [
  { priceCents: 30, sizePct: 25 },
  { priceCents: 50, sizePct: 25 },
  { priceCents: 70, sizePct: 25 },
  { priceCents: 90, sizePct: 25 },
];

// ── Test 1: single trigger — fires only after upward cross ───────────
describe('evalTakeProfit — single trigger', () => {
  it('fires when topBid crosses up through triggerPriceCents (armed then above)', () => {
    // Tick 1: below trigger → arm
    const s = makeSynth('yes', { triggerPriceCents: 60 }, {});
    const bookBelow = makeBook(55, 0);
    const r1 = evalTakeProfit(s, bookBelow);
    expect(r1.fire).toBe(false);

    // Tick 2: above trigger with armed state → fire
    const armedState = (r1.newState ?? {}) as Record<string, unknown>;
    const s2 = makeSynth('yes', { triggerPriceCents: 60 }, armedState as Synthetic['state']);
    const book = makeBook(65, 0);
    const result = evalTakeProfit(s2, book);
    expect(result.fire).toBe(true);
    expect(result.unregister).toBe(true);
    expect(result.reason).toBe('take_profit_rung_0_fired');
  });

  // ── Test 2: single trigger, below price → no fire ────────────────
  it('does not fire when topBid < triggerPriceCents, distance positive', () => {
    const s = makeSynth('yes', { triggerPriceCents: 60 }, {});
    const book = makeBook(55, 0);
    const result = evalTakeProfit(s, book);
    expect(result.fire).toBe(false);
    expect(result.distanceCentsToTrigger).toBeGreaterThan(0);
    expect(result.distanceCentsToTrigger).toBe(5);
  });
});

// ── Test 3: multi-rung, crosses up through rung 0 ───────────────────
describe('evalTakeProfit — multi-rung', () => {
  it('fires rung 0 when bid crosses up from below 30¢', () => {
    // Tick 1: bid=25 (below rung 0 at 30¢) → arms
    const s = makeSynth('yes', { rungs: FOUR_RUNGS }, {});
    const r1 = evalTakeProfit(s, makeBook(25, 0));
    expect(r1.fire).toBe(false);

    // Tick 2: bid=35 (above rung 0) with armed state → fires rung 0
    const armedState = (r1.newState ?? {}) as Synthetic['state'];
    const s2 = makeSynth('yes', { rungs: FOUR_RUNGS }, armedState);
    const result = evalTakeProfit(s2, makeBook(35, 0));
    expect(result.fire).toBe(true);
    expect(result.reason).toBe('take_profit_rung_0_fired');
    expect((result.newState as any).firedRungIndices).toEqual([0]);
    expect(result.unregister).toBeUndefined();
  });

  // ── Test 4: rung 0 already fired, bid=55 → fires rung 1 only ─────
  it('fires only rung 1 (smallest unfired) when bid=55, rung 0 already fired', () => {
    const s = makeSynth('yes', { rungs: FOUR_RUNGS }, { firedRungIndices: [0] });
    const book = makeBook(55, 0);
    const result = evalTakeProfit(s, book);
    expect(result.fire).toBe(true);
    expect(result.reason).toBe('take_profit_rung_1_fired');
    expect((result.newState as any).firedRungIndices).toEqual([0, 1]);
    expect(result.unregister).toBeUndefined();
  });

  // ── Test 5: all 4 rungs fired, bid=100 → unregister, no fire ─────
  it('returns fire:false, unregister:true when all rungs already fired', () => {
    const s = makeSynth('yes', { rungs: FOUR_RUNGS }, { firedRungIndices: [0, 1, 2, 3] });
    const book = makeBook(100, 0);
    const result = evalTakeProfit(s, book);
    expect(result.fire).toBe(false);
    expect(result.unregister).toBe(true);
  });

  // ── Test 6: last rung fires → unregister:true ─────────────────────
  it('fires rung 3 and unregisters when state=[0,1,2] and bid=95', () => {
    const s = makeSynth('yes', { rungs: FOUR_RUNGS }, { firedRungIndices: [0, 1, 2] });
    const book = makeBook(95, 0);
    const result = evalTakeProfit(s, book);
    expect(result.fire).toBe(true);
    expect(result.reason).toBe('take_profit_rung_3_fired');
    expect((result.newState as any).firedRungIndices).toEqual([0, 1, 2, 3]);
    expect(result.unregister).toBe(true);
  });

    // ── Test 7: side='no' uses book.no — crosses up from below ──────────
  it("uses book.no[0].priceCents when side='no' — fires only after upward cross", () => {
    const s = makeSynth('no', { triggerPriceCents: 40 }, {});
    // Tick 1: bid below trigger → arms
    const bookBelow: Orderbook = {
      yes: [{ priceCents: 10, size: 100 }],
      no: [{ priceCents: 35, size: 100 }],
    };
    const r1 = evalTakeProfit(s, bookBelow);
    expect(r1.fire).toBe(false);

    // Tick 2: bid crosses above trigger with armed state
    const armedState = (r1.newState ?? {}) as Record<string, unknown>;
    const s2 = makeSynth('no', { triggerPriceCents: 40 }, armedState as Synthetic['state']);
    const bookAbove: Orderbook = {
      yes: [{ priceCents: 10, size: 100 }],
      no: [{ priceCents: 45, size: 100 }],
    };
    const r2 = evalTakeProfit(s2, bookAbove);
    expect(r2.fire).toBe(true);
    expect(r2.reason).toBe('take_profit_rung_0_fired');
    expect(r2.unregister).toBe(true);
  });
});

// ── Arming tests ─────────────────────────────────────────────────────────────
describe('evalTakeProfit — armed guard (no false-positive on registration)', () => {
  // ── Test 8: starts above trigger → MUST NOT fire ──────────────────
  it('does NOT fire when bestBid is already >= trigger at tick 0 (no upward cross)', () => {
    const s = makeSynth('yes', { triggerPriceCents: 40 }, {});
    const book = makeBook(65, 0);  // bid 65 >> target 40 from the start
    const result = evalTakeProfit(s, book);
    expect(result.fire).toBe(false);
  });

  // ── Test 9: starts below, crosses up → MUST fire ──────────────────
  it('fires when bestBid starts below trigger then crosses upward', () => {
    // Tick 1: bid below trigger — arms
    const s = makeSynth('yes', { triggerPriceCents: 60 }, {});
    const book1 = makeBook(55, 0);
    const r1 = evalTakeProfit(s, book1);
    expect(r1.fire).toBe(false);

    // Tick 2: bid crosses above trigger
    const armedState = (r1.newState ?? {}) as Record<string, unknown>;
    const s2 = makeSynth('yes', { triggerPriceCents: 60 }, armedState as Synthetic['state']);
    const book2 = makeBook(65, 0);
    const r2 = evalTakeProfit(s2, book2);
    expect(r2.fire).toBe(true);
    expect(r2.reason).toBe('take_profit_rung_0_fired');
  });
});
