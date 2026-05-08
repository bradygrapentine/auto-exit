// test/backtest/passiveSpreadFallback.test.ts
import { describe, it, expect } from 'vitest';
import { runOneTickBacktest } from '../../src/passive.js';
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

  it('breaks loop on degenerate book (single yes level, no no-side)', async () => {
    const orderbook = {
      yes: [{ priceCents: 50, size: 100 }],
      no: [],
    };
    const deps = makeDeps(orderbook);
    const state: PassiveRunState = {
      filled: 0, remaining: 100, totalNotionalCents: 0,
      feesIncurredDollars: 0, totalSubmittedShares: 0,
      guardHit: false, oneSidedWarned: false,
    };

    const outcome = await runOneTickBacktest(state, deps);

    expect(outcome.kind).toBe('break_loop');
    expect((outcome as { reason?: string }).reason).toBe('spread_too_tight');
  });

  it('preserves existing behavior when no-side is present', async () => {
    // Normal two-sided book: yesAsk=65, implied yesBid=100-41=59, spread=6
    const orderbook = {
      yes: [{ priceCents: 65, size: 100 }],
      no:  [{ priceCents: 41, size: 100 }],
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
});
