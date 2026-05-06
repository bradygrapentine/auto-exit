import { describe, it, expect, vi } from 'vitest';
import { Watcher } from '../../src/watcher.js';
import type { KalshiClientLike, Orderbook } from '../../src/types.js';

function makeClient(book: Orderbook, positionQty = 100): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async (_t: string, _d: number) => book),
    getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes', quantity: positionQty })),
  } as any;
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

describe('OCO race-safety integration', () => {
  it('register OCO[stop_loss@30, take_profit@70] expands to two children', () => {
    const w = new Watcher(makeClient({ yes: [{ priceCents: 50, size: 1 }], no: [] }), baseCfg);
    const ocoId = w.register({
      kind: 'oco', ticker: 'KX', side: 'yes', positionSize: 100,
      params: {
        legs: [
          { kind: 'stop_loss', params: { triggerPriceCents: 30 } as any },
          { kind: 'take_profit', params: { triggerPriceCents: 70 } as any },
        ],
      } as any,
    });
    const all = w.list();
    expect(all).toHaveLength(3);
    const children = all.filter(s => s.parentId === ocoId);
    expect(children).toHaveLength(2);
    expect(children.map(c => c.kind).sort()).toEqual(['stop_loss', 'take_profit']);
  });

  it('bid drops to 30 → stop_loss child fires, parent fires, take_profit sibling canceled in same tick', async () => {
    const book: Orderbook = { yes: [{ priceCents: 30, size: 1 }], no: [] };
    const w = new Watcher(makeClient(book), baseCfg);
    const ocoId = w.register({
      kind: 'oco', ticker: 'KX', side: 'yes', positionSize: 100,
      params: {
        legs: [
          { kind: 'stop_loss', params: { triggerPriceCents: 30 } as any },
          { kind: 'take_profit', params: { triggerPriceCents: 70 } as any },
        ],
      } as any,
    });
    const result = await w.tick();
    expect(result.firedThisTick).toHaveLength(1);

    const all = w.list();
    const parent = all.find(s => s.id === ocoId)!;
    const stopLoss = all.find(s => s.parentId === ocoId && s.kind === 'stop_loss')!;
    const takeProfit = all.find(s => s.parentId === ocoId && s.kind === 'take_profit')!;

    expect(stopLoss.status).toBe('fired');
    expect(parent.status).toBe('fired');
    expect(takeProfit.status).toBe('canceled');
  });

  it('same-tick double cross: when both children would fire, only the first-registered fires; sibling canceled', async () => {
    // Configure OCO with two stop_loss legs at different triggers — both fire at bid=25.
    // The watcher must process children in registration order and skip the second via parentFiredThisTick.
    const book: Orderbook = { yes: [{ priceCents: 25, size: 1 }], no: [] };
    const w = new Watcher(makeClient(book), baseCfg);
    const ocoId = w.register({
      kind: 'oco', ticker: 'KX', side: 'yes', positionSize: 100,
      params: {
        legs: [
          { kind: 'stop_loss', params: { triggerPriceCents: 40 } as any },  // would fire (25 ≤ 40)
          { kind: 'stop_loss', params: { triggerPriceCents: 30 } as any },  // would also fire (25 ≤ 30)
        ],
      } as any,
    });
    const result = await w.tick();

    expect(result.firedThisTick).toHaveLength(1);  // exactly one child fired
    const children = w.list().filter(s => s.parentId === ocoId);
    const fired = children.filter(s => s.status === 'fired');
    const canceled = children.filter(s => s.status === 'canceled');
    expect(fired).toHaveLength(1);
    expect(canceled).toHaveLength(1);

    const parent = w.get(ocoId)!;
    expect(parent.status).toBe('fired');
  });

  it('manual cancel of OCO parent cancels both children', () => {
    const w = new Watcher(makeClient({ yes: [{ priceCents: 50, size: 1 }], no: [] }), baseCfg);
    const ocoId = w.register({
      kind: 'oco', ticker: 'KX', side: 'yes', positionSize: 100,
      params: {
        legs: [
          { kind: 'stop_loss', params: { triggerPriceCents: 30 } as any },
          { kind: 'take_profit', params: { triggerPriceCents: 70 } as any },
        ],
      } as any,
    });
    expect(w.cancel(ocoId)).toBe(true);

    const all = w.list();
    const parent = all.find(s => s.id === ocoId)!;
    const children = all.filter(s => s.parentId === ocoId);
    expect(parent.status).toBe('canceled');
    expect(children).toHaveLength(2);
    expect(children.every(c => c.status === 'canceled')).toBe(true);
  });
});
