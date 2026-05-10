// test/backtest/passiveSpreadFallback.test.ts
import { describe, it, expect } from 'vitest';
import { runOneTick, runOneTickBacktest } from '../../src/passive.js';
import type { PassiveRunState, PassiveRunDeps } from '../../src/passive.js';
import { Journal } from '../../src/journal.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

function makeDeps(orderbook: { yes: { priceCents: number; size: number }[]; no: { priceCents: number; size: number }[] }): PassiveRunDeps {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-passive-spread-test-'));
  const journal = new Journal('test-job', tmpDir);

  const fakeClient = {
    getOrderbook: async () => orderbook,
    createOrder: async () => ({ orderId: 'o-1', status: 'resting' as const, filledCount: 0, remainingCount: 100 }),
    getOrder: async () => ({ orderId: 'o-1', status: 'resting' as const, filledCount: 0, remainingCount: 100 }),
    cancelOrder: async () => ({ orderId: 'o-1', status: 'canceled' as const, filledCount: 0, remainingCount: 100 }),
  };

  return {
    client: fakeClient as never,
    config: {
      ticker: 'KX-TEST', side: 'sell', size: 100,
      safetySubmittedMultiple: 5, dryRun: false,
    },
    journal,
    chunkSize: 100,
    passiveTimeboxMs: 0,
    walkStepCents: 1,
    submittedCap: 500,
    effectiveFloorCents: 0,
    kalshiSide: 'yes',
    roundCents: (c: number) => Math.round(c * 10_000) / 10_000,
  };
}

function makeBuyDeps(orderbook: { yes: { priceCents: number; size: number }[]; no: { priceCents: number; size: number }[] }): PassiveRunDeps {
  const deps = makeDeps(orderbook);
  return { ...deps, config: { ...deps.config, side: 'buy' } };
}

describe('passive spread fallback (SH-PASSIVE-SPREAD-LOGIC)', () => {
  it('posts an order on a one-sided book (no-side empty)', async () => {
    const orderbook = {
      yes: [
        { priceCents: 14, size: 22 },
        { priceCents: 39, size: 50 },
        { priceCents: 55, size: 100 },
      ],
      no: [],
    };
    const deps = makeDeps(orderbook);
    const state: PassiveRunState = {
      filled: 0, remaining: 100, totalNotionalCents: 0,
      feesIncurredDollars: 0, totalSubmittedShares: 0,
      guardHit: false, oneSidedWarned: false,
    };

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('continue');
    expect(state.pendingOrderId).toBe('o-1');
  });

  it('breaks loop on degenerate book (single yes level, no no-side) AFTER first tick', async () => {
    // SH-PASSIVE-SPREAD-LOGIC: spread guard now skipped on tick 1 (filled=0,
    // pendingOrderId=undefined). Simulate post-tick-1 by setting filled>0.
    const orderbook = {
      yes: [{ priceCents: 50, size: 100 }],
      no: [],
    };
    const deps = makeDeps(orderbook);
    const state: PassiveRunState = {
      filled: 5, remaining: 95, totalNotionalCents: 0,
      feesIncurredDollars: 0, totalSubmittedShares: 0,
      guardHit: false, oneSidedWarned: false,
    };

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { reason?: string }).reason).toBe('spread_too_tight');
  });

  it('SH-PASSIVE-STILL-NO-FILLS: posts a sell on a KXINXU-shape two-sided book', async () => {
    // KXINXU first snapshot: yes=[14,34,...,55], no=[5,7,...,12]. Pre-fix this
    // produced bestAsk=14, bestBid=95 → spread=-81 → spread_too_tight. Post-fix
    // sell-side uses yes-depth: bestAsk=55, bestBid=14, spread=41 → posts.
    const orderbook = {
      yes: [
        { priceCents: 14, size: 22 },
        { priceCents: 34, size: 101 },
        { priceCents: 55, size: 112 },
      ],
      no: [
        { priceCents: 5, size: 35 },
        { priceCents: 12, size: 22 },
      ],
    };
    const deps = makeDeps(orderbook);
    const state: PassiveRunState = {
      filled: 0, remaining: 100, totalNotionalCents: 0,
      feesIncurredDollars: 0, totalSubmittedShares: 0,
      guardHit: false, oneSidedWarned: false,
    };

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('continue');
    expect(state.pendingOrderId).toBe('o-1');
  });

  it('buy-side semantics unchanged: cross-side bid/ask still applies', async () => {
    // Two-sided book where buy-side cross-conversion still works:
    // yesAsk = 65 (lowest yes), bestBid = 100-41 = 59, spread = 6 → posts.
    const orderbook = {
      yes: [{ priceCents: 65, size: 100 }, { priceCents: 70, size: 50 }],
      no:  [{ priceCents: 41, size: 100 }],
    };
    const deps = makeBuyDeps(orderbook);
    const state: PassiveRunState = {
      filled: 0, remaining: 100, totalNotionalCents: 0,
      feesIncurredDollars: 0, totalSubmittedShares: 0,
      guardHit: false, oneSidedWarned: false,
    };

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('continue');
    expect(state.pendingOrderId).toBe('o-1');
  });
});

describe('passive spread fallback — live path runOneTick', () => {
  // The live path used to immediately break_loop when the cross-quoted
  // spread was inverted (e.g. yes=[14,55], no=[5] → bestAsk=14, bestBid=95,
  // spread=-81). Mirrors the backtest path: cross-spread validity check
  // + yes-depth fallback + first-tick skip.

  it('does not break_loop on a one-sided book (no-side empty)', async () => {
    const orderbook = {
      yes: [
        { priceCents: 14, size: 22 },
        { priceCents: 39, size: 50 },
        { priceCents: 55, size: 100 },
      ],
      no: [],
    };
    const outcome = await runOneTick(
      {
        filled: 0, remaining: 100, totalNotionalCents: 0,
        feesIncurredDollars: 0, totalSubmittedShares: 0,
        guardHit: false, oneSidedWarned: false,
      },
      makeDeps(orderbook),
    );
    // Live path inner walk may hit floor_hit on the mock client (orders
    // never fill, timebox expires, walks to 0). The contract here is just
    // that the spread guard at tick 1 does NOT short-circuit before the
    // inner walk runs at all.
    expect((outcome as { reason?: string }).reason).not.toBe('spread_too_tight');
  });

  it('does not break_loop on a skewed book where cross-spread is inverted', async () => {
    const orderbook = {
      yes: [
        { priceCents: 14, size: 22 },
        { priceCents: 55, size: 100 },
      ],
      no: [{ priceCents: 5, size: 50 }],
    };
    const outcome = await runOneTick(
      {
        filled: 0, remaining: 100, totalNotionalCents: 0,
        feesIncurredDollars: 0, totalSubmittedShares: 0,
        guardHit: false, oneSidedWarned: false,
      },
      makeDeps(orderbook),
    );
    // Live path inner walk may hit floor_hit on the mock client (orders
    // never fill, timebox expires, walks to 0). The contract here is just
    // that the spread guard at tick 1 does NOT short-circuit before the
    // inner walk runs at all.
    expect((outcome as { reason?: string }).reason).not.toBe('spread_too_tight');
  });

  it('still break_loops on a truly degenerate book (single yes level, no no-side)', async () => {
    // yes=[50], no=[] → fallback ask=50 (only level), bid=50 → spread=0.
    // Spread guard fires immediately — no first-tick skip on the live path.
    const orderbook = {
      yes: [{ priceCents: 50, size: 100 }],
      no: [],
    };
    const outcome = await runOneTick(
      {
        filled: 0, remaining: 100, totalNotionalCents: 0,
        feesIncurredDollars: 0, totalSubmittedShares: 0,
        guardHit: false, oneSidedWarned: false,
      },
      makeDeps(orderbook),
    );
    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { reason?: string }).reason).toBe('spread_too_tight');
  });
});
