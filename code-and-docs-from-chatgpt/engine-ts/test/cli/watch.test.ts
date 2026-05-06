/**
 * test/cli/watch.test.ts
 *
 * Tests for `kea watch` subcommand tree.
 * Uses in-process CLI harness — stdout captured via vi.spyOn.
 * Watcher injected via setWatcherForTests; daemon mocked at module level.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Watcher } from '../../src/watcher.js';
import {
  setWatcherForTests,
  resetWatcherForTests,
  isWatcherInitialized,
  getWatcher,
} from '../../src/watcherSingleton.js';
import { runCli } from '../../src/cli.js';
import type { KalshiClientLike } from '../../src/types.js';

// ── mock KalshiClient ─────────────────────────────────────────────────────────

function makeClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async () => ({ yes: [], no: [] })),
    getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes', quantity: 10 })),
  } as any;
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

// ── capture stdout ────────────────────────────────────────────────────────────

async function captureOut(fn: () => Promise<void>): Promise<string> {
  const out: string[] = [];
  const spy = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { out.push(String(s)); return true; });
  try {
    await fn();
  } finally {
    spy.mockRestore();
  }
  return out.join('');
}

// ── setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  setWatcherForTests(new Watcher(makeClient(), baseCfg));
});

afterEach(() => {
  resetWatcherForTests();
  vi.restoreAllMocks();
});

// ── kea watch register ────────────────────────────────────────────────────────

describe('kea watch register', () => {
  it('stop_loss — returns id, shows in list', async () => {
    const out = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'stop_loss', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trigger', '30']),
    );
    expect(out.trim()).toMatch(/^syn-/);
    const id = out.trim();

    const listOut = await captureOut(() => runCli(['watch', 'list']));
    expect(listOut).toContain(id);
    expect(listOut).toContain('stop_loss');
    expect(listOut).toContain('KX');
  });

  it('take_profit single trigger — returns id', async () => {
    const out = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'take_profit', '--ticker', 'KX', '--side', 'yes', '--size', '5', '--trigger', '80']),
    );
    expect(out.trim()).toMatch(/^syn-/);
  });

  it('stop_limit — returns id', async () => {
    const out = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'stop_limit', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trigger', '30', '--limit', '28']),
    );
    expect(out.trim()).toMatch(/^syn-/);
  });

  it('trailing_stop — returns id', async () => {
    const out = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'trailing_stop', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trail', '5']),
    );
    expect(out.trim()).toMatch(/^syn-/);
  });

  it('take_profit multi-rung — returns id', async () => {
    const rungs = JSON.stringify([{ priceCents: 70, sizePct: 0.5 }, { priceCents: 85, sizePct: 0.5 }]);
    const out = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'take_profit', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--rungs', rungs]),
    );
    expect(out.trim()).toMatch(/^syn-/);
  });

  it('oco — returns id', async () => {
    const legs = JSON.stringify([
      { kind: 'take_profit', params: { triggerPriceCents: 80 } },
      { kind: 'stop_loss', params: { triggerPriceCents: 30 } },
    ]);
    const out = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'oco', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--legs', legs]),
    );
    expect(out.trim()).toMatch(/^syn-/);
  });

  it('bracket — returns id', async () => {
    const out = await captureOut(() =>
      runCli([
        'watch', 'register',
        '--kind', 'bracket',
        '--ticker', 'KX',
        '--side', 'yes',
        '--size', '10',
        '--take-profit', '80',
        '--stop-loss', '30',
      ]),
    );
    expect(out.trim()).toMatch(/^syn-/);
  });

  it('--no-auto-cancel sets autoCancelOnZeroPosition=false', async () => {
    const idOut = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'stop_loss', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trigger', '30', '--no-auto-cancel']),
    );
    const id = idOut.trim();
    const s = getWatcher().get(id);
    expect(s?.autoCancelOnZeroPosition).toBe(false);
  });

  it('missing --kind writes to stderr and exits', async () => {
    const errChunks: string[] = [];
    const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((s: any) => { errChunks.push(String(s)); return true; });
    const spyExit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('process.exit'); }) as any);
    try {
      await runCli(['watch', 'register', '--ticker', 'KX', '--side', 'yes', '--size', '10']);
    } catch { /* swallow exit throw */ }
    spyErr.mockRestore();
    spyExit.mockRestore();
    expect(errChunks.join('')).toMatch(/kind/);
  });
});

// ── kea watch list ────────────────────────────────────────────────────────────

describe('kea watch list', () => {
  it('empty — prints no synthetics registered', async () => {
    const out = await captureOut(() => runCli(['watch', 'list']));
    expect(out).toContain('no synthetics');
  });

  it('1 entry — shows id, kind, ticker, side, status', async () => {
    const idOut = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'stop_loss', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trigger', '30']),
    );
    const id = idOut.trim();

    const out = await captureOut(() => runCli(['watch', 'list']));
    expect(out).toContain(id);
    expect(out).toContain('stop_loss');
    expect(out).toContain('KX');
    expect(out).toContain('yes');
    expect(out).toContain('armed');
  });

  it('N entries — all appear', async () => {
    await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'stop_loss', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trigger', '30']),
    );
    await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'take_profit', '--ticker', 'KY', '--side', 'no', '--size', '5', '--trigger', '70']),
    );
    const out = await captureOut(() => runCli(['watch', 'list']));
    expect(out).toContain('KX');
    expect(out).toContain('KY');
    expect(out).toContain('stop_loss');
    expect(out).toContain('take_profit');
  });
});

// ── kea watch get ─────────────────────────────────────────────────────────────

describe('kea watch get', () => {
  it('known id — prints JSON with id and kind', async () => {
    const idOut = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'stop_loss', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trigger', '30']),
    );
    const id = idOut.trim();

    const out = await captureOut(() => runCli(['watch', 'get', id]));
    const parsed = JSON.parse(out);
    expect(parsed.id).toBe(id);
    expect(parsed.kind).toBe('stop_loss');
  });

  it('unknown id — prints "not found"', async () => {
    const out = await captureOut(() => runCli(['watch', 'get', 'syn-does-not-exist']));
    expect(out).toContain('not found');
  });

  it('missing id arg — writes error to stderr', async () => {
    const errChunks: string[] = [];
    const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((s: any) => { errChunks.push(String(s)); return true; });
    const spyExit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('process.exit'); }) as any);
    try {
      await runCli(['watch', 'get']);
    } catch { /* swallow */ }
    spyErr.mockRestore();
    spyExit.mockRestore();
    expect(errChunks.join('')).toMatch(/id/);
  });
});

// ── kea watch cancel ──────────────────────────────────────────────────────────

describe('kea watch cancel', () => {
  it('known id — cancels and prints confirmation with id', async () => {
    const idOut = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'stop_loss', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trigger', '30']),
    );
    const id = idOut.trim();

    const out = await captureOut(() => runCli(['watch', 'cancel', id]));
    expect(out).toContain('canceled');
    expect(out).toContain(id);
  });

  it('unknown id — prints not found / already terminal', async () => {
    const out = await captureOut(() => runCli(['watch', 'cancel', 'syn-nope']));
    expect(out).toMatch(/not found|already terminal/);
  });

  it('already canceled id — second cancel returns already terminal', async () => {
    const idOut = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'stop_loss', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trigger', '30']),
    );
    const id = idOut.trim();
    await captureOut(() => runCli(['watch', 'cancel', id]));

    const out = await captureOut(() => runCli(['watch', 'cancel', id]));
    expect(out).toMatch(/not found|already terminal/);
  });
});

// ── kea watch status ──────────────────────────────────────────────────────────

describe('kea watch status', () => {
  it('reports initialized=true when watcher is set', async () => {
    const out = await captureOut(() => runCli(['watch', 'status']));
    const parsed = JSON.parse(out);
    expect(parsed.initialized).toBe(true);
  });

  it('reports initialized=false when watcher not set', async () => {
    resetWatcherForTests();
    const out = await captureOut(() => runCli(['watch', 'status']));
    const parsed = JSON.parse(out);
    expect(parsed.initialized).toBe(false);
  });

  it('registeredCount=0 when no synthetics', async () => {
    const out = await captureOut(() => runCli(['watch', 'status']));
    const parsed = JSON.parse(out);
    expect(parsed.registeredCount).toBe(0);
    expect(parsed.armedCount).toBe(0);
  });

  it('counts correct after register and cancel', async () => {
    // Register two, cancel one
    const id1Out = await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'stop_loss', '--ticker', 'KX', '--side', 'yes', '--size', '10', '--trigger', '30']),
    );
    const id1 = id1Out.trim();
    await captureOut(() =>
      runCli(['watch', 'register', '--kind', 'take_profit', '--ticker', 'KY', '--side', 'yes', '--size', '5', '--trigger', '70']),
    );
    await captureOut(() => runCli(['watch', 'cancel', id1]));

    const out = await captureOut(() => runCli(['watch', 'status']));
    const parsed = JSON.parse(out);
    expect(parsed.registeredCount).toBe(2);
    expect(parsed.armedCount).toBe(1);
    expect(parsed.canceledCount).toBe(1);
  });
});

// ── kea watch start (parse-level / mock) ─────────────────────────────────────

describe('kea watch start', () => {
  it('calls runWatcherDaemon and prints started message', async () => {
    const watcherDaemon = await import('../../src/watcherDaemon.js');
    const mockWatcher = new Watcher(makeClient(), baseCfg);
    const mockStart = vi.fn(async () => {});
    const mockStop = vi.fn();
    const mockDaemon = vi.spyOn(watcherDaemon, 'runWatcherDaemon').mockReturnValue({
      watcher: mockWatcher,
      start: mockStart,
      stop: mockStop,
    });

    // Reset singleton so initWatcher inside cmdWatch succeeds
    resetWatcherForTests();

    const cfgPath = path.join(os.tmpdir(), `kea-watch-test-${Date.now()}.json`);
    fs.writeFileSync(cfgPath, JSON.stringify({
      baseUrl: 'https://api.elections.kalshi.com/trade-api/v2',
      apiKeyEnv: 'KALSHI_ACCESS_KEY',
      privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
      pollIntervalMs: 2000,
    }));

    try {
      const out = await captureOut(() => runCli(['watch', 'start', '--config', cfgPath]));
      expect(mockDaemon).toHaveBeenCalledOnce();
      expect(mockStart).toHaveBeenCalledOnce();
      expect(out).toContain('started kea-watch daemon');
    } finally {
      mockDaemon.mockRestore();
      fs.rmSync(cfgPath, { force: true });
      // restore beforeEach watcher so afterEach resetWatcherForTests doesn't explode
      setWatcherForTests(new Watcher(makeClient(), baseCfg));
    }
  });

  it('exits with error if --config is missing', async () => {
    const errChunks: string[] = [];
    const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((s: any) => { errChunks.push(String(s)); return true; });
    const spyExit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('process.exit'); }) as any);
    try {
      await runCli(['watch', 'start']);
    } catch { /* swallow */ }
    spyErr.mockRestore();
    spyExit.mockRestore();
    expect(errChunks.join('')).toMatch(/config/);
  });
});
