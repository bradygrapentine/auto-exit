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

  it('picks s-passive on a sideways window', async () => {
    const adapter = makeAutoAdapter({ ticker: 'KX-TEST', warmupTicks: 3 });
    const books = [
      { yes: 45, no: 45 }, { yes: 47, no: 43 }, { yes: 46, no: 44 },  // mids 50, 52, 51 — sideways
      { yes: 47, no: 43 },
    ];
    const client = fakeClient(books);
    while (client.advance()) await adapter.tick(client as never, 100);
    expect(adapter.chosenStrategy).toBe('s-passive');
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
});
