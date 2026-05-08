// test/backtest/autoAdapter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { makeAutoAdapter } from '../../src/backtest/adapters/autoAdapter.js';

function fakeClient(books: Array<{ yes: number; no: number }>) {
  let i = -1;
  return {
    advance: () => { i++; return i < books.length; },
    currentTimestamp: () => `t-${i}`,
    getOrderbook: async () => ({
      yes: [{ priceCents: books[i].yes, size: 100 }],
      no:  [{ priceCents: books[i].no,  size: 100 }],
    }),
    getPosition: async (_ticker: string) => ({ ticker: _ticker, side: 'yes' as const, quantity: 100 }),
    createOrder: vi.fn(async () => ({ orderId: 'o-1', status: 'filled', filledCount: 100, remainingCount: 0 })),
    getFillLog: () => [],
  };
}

describe('makeAutoAdapter', () => {
  it('picks s-trail (trailCents=10) on a rising window', async () => {
    const adapter = makeAutoAdapter({ ticker: 'KX-TEST', warmupTicks: 3 });
    const books = [
      { yes: 30, no: 60 }, { yes: 35, no: 55 }, { yes: 45, no: 45 },  // mids 35, 40, 50 — rising
      { yes: 50, no: 40 },
    ];
    const client = fakeClient(books);
    while (client.advance()) await adapter.tick(client as never, 100);
    expect(adapter.chosenStrategy).toBe('s-trail');
  });

  it('picks stop_loss on a falling window', async () => {
    const adapter = makeAutoAdapter({ ticker: 'KX-TEST', warmupTicks: 3 });
    const books = [
      { yes: 60, no: 30 }, { yes: 55, no: 35 }, { yes: 40, no: 50 },  // mids 65, 60, 45 — falling
      { yes: 35, no: 55 },
    ];
    const client = fakeClient(books);
    while (client.advance()) await adapter.tick(client as never, 100);
    expect(adapter.chosenStrategy).toBe('stop_loss');
  });

  it('picks s-passive-slow on a sideways window', async () => {
    const adapter = makeAutoAdapter({ ticker: 'KX-TEST', warmupTicks: 3 });
    const books = [
      { yes: 45, no: 45 }, { yes: 47, no: 43 }, { yes: 46, no: 44 },  // mids 50, 52, 51 — sideways
      { yes: 47, no: 43 },
    ];
    const client = fakeClient(books);
    while (client.advance()) await adapter.tick(client as never, 100);
    expect(adapter.chosenStrategy).toBe('s-passive-slow');
  });

  it('SH-SLOW-EXECUTION-STRATEGY: sideways regime labels chosenStrategy as s-passive-slow', async () => {
    const adapter = makeAutoAdapter({ ticker: 'KX-TEST', warmupTicks: 3 });
    const books = [
      { yes: 45, no: 45 }, { yes: 47, no: 43 }, { yes: 46, no: 44 },  // mids 50, 52, 51 — sideways
      { yes: 47, no: 43 },
    ];
    const client = fakeClient(books);
    while (client.advance()) await adapter.tick(client as never, 100);
    expect(adapter.chosenStrategy).toBe('s-passive-slow');
  });

  it('falls through to s-aggressive on dead window', async () => {
    const adapter = makeAutoAdapter({ ticker: 'KX-TEST', warmupTicks: 3 });
    const books = [
      { yes: 50, no: 50 }, { yes: 50, no: 50 }, { yes: 50, no: 50 },
    ];
    const client = fakeClient(books);
    while (client.advance()) await adapter.tick(client as never, 100);
    expect(adapter.chosenStrategy).toBe('s-aggressive');
  });

  // ── SH-AUTO-ROLLING-RECLASSIFY ─────────────────────────────────────────────
  describe('rolling re-classification', () => {
    it('reclassifyInterval=0 keeps v5 single-shot behavior (no switch)', async () => {
      const adapter = makeAutoAdapter({ ticker: 'KX-TEST', warmupTicks: 3, reclassifyInterval: 0 });
      // 3 dead snapshots (warmup) → s-aggressive. Then strong rise — auto should NOT switch.
      const books = [
        { yes: 50, no: 50 }, { yes: 50, no: 50 }, { yes: 50, no: 50 },
        { yes: 70, no: 30 }, { yes: 75, no: 25 }, { yes: 80, no: 20 }, { yes: 85, no: 15 },
      ];
      const client = fakeClient(books);
      while (client.advance()) await adapter.tick(client as never, 100);
      expect(adapter.chosenStrategy).toBe('s-aggressive');
      expect(adapter.switchCount).toBe(0);
    });

    it('switches inner adapter when regime changes after hysteresis satisfied', async () => {
      const adapter = makeAutoAdapter({
        ticker: 'KX-TEST', warmupTicks: 3, reclassifyInterval: 1, hysteresisTicks: 2,
      });
      // First 3 ticks dead → aggressive. Then 4 ticks strongly rising — at least 2
      // consecutive re-classifications produce 'rising', so hysteresis triggers a switch.
      // (The exact switch tick depends on rolling window content; we just assert switch happened.)
      const books = [
        { yes: 50, no: 50 }, { yes: 50, no: 50 }, { yes: 50, no: 50 }, // warmup → dead
        { yes: 60, no: 40 }, { yes: 65, no: 35 }, { yes: 70, no: 30 }, { yes: 75, no: 25 },
      ];
      const client = fakeClient(books);
      while (client.advance()) await adapter.tick(client as never, 100);
      expect(adapter.switchCount).toBeGreaterThan(0);
      expect(adapter.chosenStrategy).not.toBe('s-aggressive');
    });

    it('hysteresis prevents single-tick flip', async () => {
      const adapter = makeAutoAdapter({
        ticker: 'KX-TEST', warmupTicks: 3, reclassifyInterval: 1, hysteresisTicks: 5,
      });
      // 3 dead warmup → aggressive. Then ONE rising-classifying tick — hysteresis=5 means no switch.
      // Then back to dead — pendingStreak resets.
      const books = [
        { yes: 50, no: 50 }, { yes: 50, no: 50 }, { yes: 50, no: 50 },
        { yes: 70, no: 30 },                      // single rising tick
        { yes: 50, no: 50 }, { yes: 50, no: 50 }, // back to dead
      ];
      const client = fakeClient(books);
      while (client.advance()) await adapter.tick(client as never, 100);
      expect(adapter.switchCount).toBe(0);
      expect(adapter.chosenStrategy).toBe('s-aggressive');
    });
  });
});
