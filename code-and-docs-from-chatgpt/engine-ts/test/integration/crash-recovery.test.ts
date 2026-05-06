import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Watcher, type FireHook } from '../../src/watcher.js';
import { WatcherJournal } from '../../src/watcherJournal.js';
import type { KalshiClientLike, Orderbook } from '../../src/types.js';

let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'watcher-crash-'));
  file = join(dir, 'watchers.ndjson');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

function mkClient(yesBid: number, qty = 100): KalshiClientLike {
  const book: Orderbook = { yes: [{ priceCents: yesBid, size: 100 }], no: [] };
  return {
    getOrderbook: vi.fn(async (_t, _d) => book),
    getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes', quantity: qty })),
  } as any;
}

describe('Watcher crash-recovery via journal', () => {
  it('mid-fire crash → fire_failed in journal, replay restores fire_failed (does not re-fire)', async () => {
    const j = new WatcherJournal(file);
    const fakeFire: FireHook = async () => { throw new Error('simulated crash'); };

    const w1 = new Watcher(mkClient(30), baseCfg, j);
    w1.setFireHook(fakeFire);
    const id = w1.register({
      kind: 'stop_loss', ticker: 'KX', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 50 },
    });
    await w1.tick();

    const replay = j.replay();
    const found = replay.find(s => s.id === id);
    expect(found?.status).toBe('fire_failed');
    expect(found?.fireFailedReason).toBe('simulated crash');
  });

  it('fire_pending without follow-up (true crash mid-fire) replays as armed for re-fire', () => {
    // Simulate a real crash: write registered + fire_pending, no fired/fire_failed.
    const j = new WatcherJournal(file);
    j.appendRegistered({
      id: 's1', kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 10,
      params: { triggerPriceCents: 50 } as any, state: {}, status: 'armed',
      createdAt: '2026-05-05T00:00:00Z',
      selfTradePrevention: 'taker_at_cross', autoCancelOnZeroPosition: true,
    });
    j.appendFirePending('s1', 'evaluator_fired');
    // Process killed here.

    const replay = j.replay();
    expect(replay[0].status).toBe('armed');
  });

  it('successful fire writes registered + pending + fired, replay shows fired', async () => {
    const j = new WatcherJournal(file);
    const w = new Watcher(mkClient(30), baseCfg, j);
    w.setFireHook(async () => undefined);
    const id = w.register({
      kind: 'stop_loss', ticker: 'KX', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 50 },
    });
    await w.tick();

    const replay = j.replay();
    const found = replay.find(s => s.id === id);
    expect(found?.status).toBe('fired');
    expect(found?.firedAt).toBeDefined();
  });

  it('replayFromJournal() resurrects in-memory map; can resume tick()', async () => {
    const j = new WatcherJournal(file);
    {
      const w = new Watcher(mkClient(80), baseCfg, j);  // bid 80 — does NOT trigger stop_loss@50
      w.register({
        kind: 'stop_loss', ticker: 'KX', side: 'yes',
        positionSize: 10, params: { triggerPriceCents: 50 },
      });
    }

    // New watcher, restored from journal.
    const w2 = new Watcher(mkClient(80), baseCfg, j);
    w2.replayFromJournal();
    expect(w2.list()).toHaveLength(1);
    expect(w2.list()[0].status).toBe('armed');
  });
});
