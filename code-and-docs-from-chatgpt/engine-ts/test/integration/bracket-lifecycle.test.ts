import { describe, it, expect, vi } from 'vitest';
import { Watcher } from '../../src/watcher.js';
import type { KalshiClientLike, Orderbook } from '../../src/types.js';

function makeClient(book: Orderbook, positionQty = 100): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async (_t: string, _d: number) => book),
    getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes', quantity: positionQty })),
  } as any;
}

function makeMutableClient(initialBook: Orderbook, positionQty = 100) {
  let book = initialBook;
  return {
    setBook(b: Orderbook) { book = b; },
    getOrderbook: vi.fn(async (_t: string, _d: number) => book),
    getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes', quantity: positionQty })),
  } as any;
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

describe('Bracket lifecycle integration', () => {
  it('register exit-side bracket expands to two children with full position size', () => {
    const w = new Watcher(makeClient({ yes: [{ priceCents: 50, size: 1 }], no: [] }), baseCfg);
    const brId = w.register({
      kind: 'bracket', ticker: 'KX', side: 'yes', positionSize: 100,
      params: { takeProfitCents: 70, stopLossCents: 30 } as any,
    });
    const all = w.list();
    expect(all).toHaveLength(3);
    const children = all.filter(s => s.parentId === brId);
    expect(children).toHaveLength(2);
    expect(children.map(c => c.kind).sort()).toEqual(['stop_loss', 'take_profit']);
    expect(children.every(c => c.positionSize === 100)).toBe(true);
  });

  it('take-profit fires → bracket parent fired, stop-loss canceled', async () => {
    // Tick 1: bid=60 (below takeProfitCents=70) → arms TP
    // Tick 2: bid=75 (above takeProfitCents=70) → TP fires
    const client = makeMutableClient({ yes: [{ priceCents: 60, size: 1 }], no: [] });
    const w = new Watcher(client, baseCfg);
    const brId = w.register({
      kind: 'bracket', ticker: 'KX', side: 'yes', positionSize: 100,
      params: { takeProfitCents: 70, stopLossCents: 30 } as any,
    });
    await w.tick(); // arms TP
    client.setBook({ yes: [{ priceCents: 75, size: 1 }], no: [] });
    await w.tick(); // TP fires

    const all = w.list();
    const parent = all.find(s => s.id === brId)!;
    const tp = all.find(s => s.parentId === brId && s.kind === 'take_profit')!;
    const sl = all.find(s => s.parentId === brId && s.kind === 'stop_loss')!;

    expect(tp.status).toBe('fired');
    expect(parent.status).toBe('fired');
    expect(sl.status).toBe('canceled');
  });

  it('stop-loss fires → bracket parent fired, take-profit canceled', async () => {
    const book: Orderbook = { yes: [{ priceCents: 25, size: 1 }], no: [] };
    const w = new Watcher(makeClient(book), baseCfg);
    const brId = w.register({
      kind: 'bracket', ticker: 'KX', side: 'yes', positionSize: 100,
      params: { takeProfitCents: 70, stopLossCents: 30 } as any,
    });
    await w.tick();

    const all = w.list();
    const parent = all.find(s => s.id === brId)!;
    const tp = all.find(s => s.parentId === brId && s.kind === 'take_profit')!;
    const sl = all.find(s => s.parentId === brId && s.kind === 'stop_loss')!;

    expect(sl.status).toBe('fired');
    expect(parent.status).toBe('fired');
    expect(tp.status).toBe('canceled');
  });

  it('auto-cancel: position drops to zero → both children canceled', async () => {
    const book: Orderbook = { yes: [{ priceCents: 50, size: 1 }], no: [] };
    const w = new Watcher(makeClient(book, /* positionQty */ 0), baseCfg);
    const brId = w.register({
      kind: 'bracket', ticker: 'KX', side: 'yes', positionSize: 100,
      params: { takeProfitCents: 70, stopLossCents: 30 } as any,
    });
    await w.tick();

    const children = w.list().filter(s => s.parentId === brId);
    expect(children).toHaveLength(2);
    expect(children.every(c => c.status === 'canceled')).toBe(true);
  });
});
