import { describe, it, expect, vi, afterEach } from 'vitest';
import { Watcher } from '../src/watcher.js';
import { evaluators } from '../src/synthetics/index.js';
import type { KalshiClientLike, Orderbook } from '../src/types.js';

const book: Orderbook = { yes: [{ priceCents: 50, size: 1 }], no: [] };

function makeClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async (_t: string, _d: number) => book),
    getPosition: vi.fn(async () => ({ ticker: 'X', side: 'yes', quantity: 10 })),
  } as any;
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

const originalStopLoss = evaluators.stop_loss;
afterEach(() => { evaluators.stop_loss = originalStopLoss; });

describe('Watcher', () => {
  it('starts empty and reports zero registered', () => {
    const w = new Watcher(makeClient(), baseCfg);
    expect(w.list().length).toBe(0);
  });

  it('register() returns syn-<uuid> id', () => {
    const w = new Watcher(makeClient(), baseCfg);
    const id = w.register({
      kind: 'stop_loss', ticker: 'KX', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 30 },
    });
    expect(id).toMatch(/^syn-/);
  });

  it('cancel() marks status canceled', () => {
    const w = new Watcher(makeClient(), baseCfg);
    const id = w.register({
      kind: 'stop_loss', ticker: 'KX', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 30 },
    });
    expect(w.cancel(id)).toBe(true);
    expect(w.get(id)?.status).toBe('canceled');
  });

  it('tick() coalesces book fetches per unique ticker with depth arg', async () => {
    const client = makeClient();
    const w = new Watcher(client, { ...baseCfg, orderbookDepth: 20 });
    w.register({ kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 10, params: { triggerPriceCents: 30 } });
    w.register({ kind: 'take_profit', ticker: 'KX', side: 'yes', positionSize: 10, params: { triggerPriceCents: 90 } });
    w.register({ kind: 'stop_loss', ticker: 'KY', side: 'yes', positionSize: 10, params: { triggerPriceCents: 30 } });
    await w.tick();
    expect((client.getOrderbook as any).mock.calls).toHaveLength(2);
    expect((client.getOrderbook as any).mock.calls[0][1]).toBe(20);
  });

  it('tick() returns idle interval when nothing armed', async () => {
    const client = makeClient();
    const w = new Watcher(client, { ...baseCfg, idleIntervalMs: 10000 });
    const result = await w.tick();
    expect(result.nextDelayMs).toBe(10000);
    expect((client.getOrderbook as any).mock.calls).toHaveLength(0);
  });

  it('tick() returns near-trigger cadence when within threshold', async () => {
    // Patch stop_loss to report distance = 2¢ (within threshold of 3).
    evaluators.stop_loss = (_s, _book) => ({ fire: false, distanceCentsToTrigger: 2 });
    const w = new Watcher(makeClient(), {
      ...baseCfg, pollIntervalMs: 2000,
      nearTriggerCadenceMs: 250, nearTriggerThresholdCents: 3,
    });
    w.register({ kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 10, params: { triggerPriceCents: 48 } });
    const result = await w.tick();
    expect(result.nextDelayMs).toBe(250);
  });

  it('register() of OCO expands to two children', () => {
    const w = new Watcher(makeClient(), baseCfg);
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
  });
});
