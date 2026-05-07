import { describe, it, expect, vi, afterEach } from 'vitest';
import { Watcher } from '../src/watcher.js';
import { evaluators } from '../src/synthetics/index.js';
import type { KalshiClientLike, Orderbook } from '../src/types.js';
import type { WatcherJournal } from '../src/watcherJournal.js';

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

  it('tick() coalesces book + position fetches per unique ticker with depth arg', async () => {
    const client = makeClient();
    const w = new Watcher(client, { ...baseCfg, orderbookDepth: 20 });
    w.register({ kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 10, params: { triggerPriceCents: 30 } });
    w.register({ kind: 'take_profit', ticker: 'KX', side: 'yes', positionSize: 10, params: { triggerPriceCents: 90 } });
    w.register({ kind: 'stop_loss', ticker: 'KY', side: 'yes', positionSize: 10, params: { triggerPriceCents: 30 } });
    await w.tick();
    // 3 synthetics across 2 tickers → exactly 2 orderbook fetches.
    expect((client.getOrderbook as any).mock.calls).toHaveLength(2);
    expect((client.getOrderbook as any).mock.calls[0][1]).toBe(20);
    // All 3 default to autoCancelOnZeroPosition=true, so position fetched once per ticker (2 calls).
    expect((client.getPosition as any).mock.calls).toHaveLength(2);
  });

  it('tick() skips position fetch entirely when no synthetic on a ticker has autoCancelOnZeroPosition', async () => {
    const client = makeClient();
    const w = new Watcher(client, { ...baseCfg });
    w.register({
      kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 10,
      params: { triggerPriceCents: 30 }, autoCancelOnZeroPosition: false,
    });
    await w.tick();
    expect((client.getOrderbook as any).mock.calls).toHaveLength(1);
    expect((client.getPosition as any).mock.calls).toHaveLength(0);
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

  it('tick() passes peakBidCents + triggerKind to journal when trailing_stop fires', async () => {
    // Book: top bid 40¢. trailing_stop with trail=5 → peak initializes to 40, stop=35.
    // Bid is AT stop (40 - 5 = 35). Use a book where bid <= stop: bid=30, trail=5 → stop=max(30-5,1)=25, fire only if bid<=stop.
    // Easiest: pre-seed state with peakBidCentsExact=50 so stop=45, and book topBid=40 → 40<=45 → fires.
    const firedBook: Orderbook = { yes: [{ priceCents: 40, size: 1 }], no: [] };
    const client = {
      getOrderbook: vi.fn(async () => firedBook),
      getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes', quantity: 5 })),
    } as any;

    const firedCalls: Array<{ id: string; reason: string; meta?: { peakBidCents?: number; triggerKind?: string } }> = [];
    const journal = {
      appendRegistered: vi.fn(),
      appendFirePending: vi.fn(),
      appendFired: vi.fn((id: string, reason: string, meta?: { peakBidCents?: number; triggerKind?: string }) => {
        firedCalls.push({ id, reason, meta });
      }),
      appendFireFailed: vi.fn(),
      appendCanceled: vi.fn(),
      appendStateUpdate: vi.fn(),
      replay: vi.fn(() => []),
    } as unknown as WatcherJournal;

    const w = new Watcher(client, baseCfg, journal);
    const id = w.register({
      kind: 'trailing_stop', ticker: 'KX', side: 'yes', positionSize: 5,
      params: { trailCents: 5, floorPriceCents: 1 },
    });
    // Pre-seed peak so trigger fires immediately: set state on the synthetic
    w.get(id)!.state = { peakBidCentsExact: 50 };

    await w.tick();

    const fired = firedCalls.find(c => c.id === id);
    expect(fired).toBeDefined();
    expect(fired!.meta?.peakBidCents).toBe(50); // peak stays 50 (topBid=40 < 50)
    expect(fired!.meta?.triggerKind).toBe('trailing_stop');
  });

  it('tick() passes triggerKind but no peakBidCents to journal when stop_loss fires', async () => {
    // stop_loss fires when topBid (50) <= triggerPriceCents (50)
    const client = {
      getOrderbook: vi.fn(async () => ({ yes: [{ priceCents: 50, size: 1 }], no: [] })),
      getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes', quantity: 5 })),
    } as any;

    const firedCalls: Array<{ id: string; reason: string; meta?: { peakBidCents?: number; triggerKind?: string } }> = [];
    const journal = {
      appendRegistered: vi.fn(),
      appendFirePending: vi.fn(),
      appendFired: vi.fn((id: string, reason: string, meta?: { peakBidCents?: number; triggerKind?: string }) => {
        firedCalls.push({ id, reason, meta });
      }),
      appendFireFailed: vi.fn(),
      appendCanceled: vi.fn(),
      appendStateUpdate: vi.fn(),
      replay: vi.fn(() => []),
    } as unknown as WatcherJournal;

    const w = new Watcher(client, baseCfg, journal);
    const id = w.register({
      kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 5,
      params: { triggerPriceCents: 50 },
    });

    await w.tick();

    const fired = firedCalls.find(c => c.id === id);
    expect(fired).toBeDefined();
    expect(fired!.meta?.peakBidCents).toBeUndefined();
    expect(fired!.meta?.triggerKind).toBe('stop_loss');
  });
});
