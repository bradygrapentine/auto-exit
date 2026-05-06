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

// ── Test 1: single trigger, above price → fires ──────────────────────
describe('evalTakeProfit — single trigger', () => {
  it('fires when topBid >= triggerPriceCents', () => {
    const s = makeSynth('yes', { triggerPriceCents: 60 }, {});
    const book = makeBook(65, 0);
    const result = evalTakeProfit(s, book);
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

// ── Test 3: multi-rung, bid=35, fires rung 0 ─────────────────────────
describe('evalTakeProfit — multi-rung', () => {
  it('fires rung 0 when bid=35, state starts empty', () => {
    const s = makeSynth('yes', { rungs: FOUR_RUNGS }, {});
    const book = makeBook(35, 0);
    const result = evalTakeProfit(s, book);
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

  // ── Test 7: side='no' uses book.no ────────────────────────────────
  it("uses book.no[0].priceCents when side='no'", () => {
    const s = makeSynth('no', { triggerPriceCents: 40 }, {});
    // yes bid is low, no bid is above trigger
    const book: Orderbook = {
      yes: [{ priceCents: 10, size: 100 }],
      no: [{ priceCents: 45, size: 100 }],
    };
    const result = evalTakeProfit(s, book);
    expect(result.fire).toBe(true);
    expect(result.reason).toBe('take_profit_rung_0_fired');
    expect(result.unregister).toBe(true);
  });
});
