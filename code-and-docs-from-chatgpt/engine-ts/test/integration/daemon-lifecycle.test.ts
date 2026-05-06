import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDaemon } from '../../src/watcherDaemon.js';
import { WatcherJournal } from '../../src/watcherJournal.js';
import type { KalshiClientLike, Orderbook } from '../../src/types.js';

let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'watcher-daemon-'));
  file = join(dir, 'watchers.ndjson');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function mkClient(initialBid: number, qty = 100): { client: KalshiClientLike; setBid: (bid: number) => void } {
  let book: Orderbook = { yes: [{ priceCents: initialBid, size: 100 }], no: [] };
  const client = {
    getOrderbook: vi.fn(async (_t, _d) => book),
    getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes', quantity: qty })),
  } as any as KalshiClientLike;
  return { client, setBid: (bid) => { book = { yes: [{ priceCents: bid, size: 100 }], no: [] }; } };
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

describe('Watcher daemon lifecycle (in-process)', () => {
  it('builds daemon, replays empty journal, accepts register + tick', async () => {
    const { client } = mkClient(80);
    const journal = new WatcherJournal(file);

    // Use a stub fireDeps so runExit doesn't actually try to hit Kalshi.
    const runExit = vi.fn(async () => undefined);
    const daemon = buildDaemon({
      client, journal, config: { ...baseCfg, exitConfigTemplate: {} },
      fireDeps: { runExit, postLimit: vi.fn(), buildExitConfig: () => ({} as any) },
    });

    const id = daemon.watcher.register({
      kind: 'stop_loss', ticker: 'KX', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 50 },
    });
    expect(id).toMatch(/^syn-/);

    // bid 80, trigger 50 → no fire
    await daemon.watcher.tick();
    expect(daemon.watcher.get(id)?.status).toBe('armed');
    expect(runExit).not.toHaveBeenCalled();
  });

  it('full lifecycle: register → bid drops past trigger → fireHook called → journal records fired', async () => {
    const { client, setBid } = mkClient(80);
    const journal = new WatcherJournal(file);

    const runExit = vi.fn(async () => undefined);
    const daemon = buildDaemon({
      client, journal, config: { ...baseCfg, exitConfigTemplate: {} },
      fireDeps: { runExit, postLimit: vi.fn(), buildExitConfig: () => ({} as any) },
    });

    const id = daemon.watcher.register({
      kind: 'stop_loss', ticker: 'KX', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 50 },
    });

    setBid(40);  // breach
    await daemon.watcher.tick();

    expect(runExit).toHaveBeenCalledOnce();
    expect(daemon.watcher.get(id)?.status).toBe('fired');

    const replay = journal.replay();
    expect(replay.find(s => s.id === id)?.status).toBe('fired');
  });

  it('replay-on-startup: previous journal is replayed when new daemon binds the same file', async () => {
    const { client } = mkClient(80);
    const journal = new WatcherJournal(file);

    // Round 1: register a synthetic, exit.
    const d1 = buildDaemon({
      client, journal, config: { ...baseCfg, exitConfigTemplate: {} },
      fireDeps: { runExit: vi.fn(), postLimit: vi.fn(), buildExitConfig: () => ({} as any) },
    });
    d1.watcher.register({
      kind: 'stop_loss', ticker: 'KX', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 50 },
    });

    // Round 2: new daemon, same journal file → replayFromJournal seeds the map.
    const journal2 = new WatcherJournal(file);
    const d2 = buildDaemon({
      client: mkClient(80).client, journal: journal2, config: { ...baseCfg, exitConfigTemplate: {} },
      fireDeps: { runExit: vi.fn(), postLimit: vi.fn(), buildExitConfig: () => ({} as any) },
    });
    expect(d2.watcher.list()).toHaveLength(1);
    expect(d2.watcher.list()[0].status).toBe('armed');
  });

  it('start() loop runs until stop() is called', async () => {
    const { client } = mkClient(80);
    const journal = new WatcherJournal(file);

    const daemon = buildDaemon({
      client, journal,
      config: { ...baseCfg, idleIntervalMs: 5, pollIntervalMs: 5, exitConfigTemplate: {} },
      fireDeps: { runExit: vi.fn(), postLimit: vi.fn(), buildExitConfig: () => ({} as any) },
    });

    const startPromise = daemon.start();
    // Let a few ticks happen.
    await new Promise(r => setTimeout(r, 20));
    daemon.stop();
    await startPromise;
    // No assertion needed — the test passes if start() resolves after stop().
    expect(true).toBe(true);
  });
});
