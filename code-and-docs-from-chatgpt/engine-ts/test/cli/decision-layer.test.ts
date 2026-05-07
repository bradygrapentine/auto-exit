/**
 * test/cli/decision-layer.test.ts
 *
 * Tests for `kea portfolio`, `kea alerts`, `kea ev`, `kea size`, `kea recommend`.
 * Uses in-process CLI harness — stdout captured via vi.spyOn.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Watcher } from '../../src/watcher.js';
import {
  setWatcherForTests,
  resetWatcherForTests,
  getWatcher,
  isWatcherInitialized,
} from '../../src/watcherSingleton.js';
import { runCli } from '../../src/cli.js';
import type { KalshiClientLike } from '../../src/types.js';

function makeClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async () => ({ yes: [], no: [] })),
    getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes', quantity: 10 })),
  } as any;
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

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

beforeEach(() => {
  setWatcherForTests(new Watcher(makeClient(), baseCfg));
});

afterEach(() => {
  resetWatcherForTests();
  vi.clearAllMocks();
});

// ── portfolio plan ────────────────────────────────────────────────────────────

describe('kea portfolio plan', () => {
  it('outputs a ranked plan JSON', async () => {
    const out = await captureOut(() =>
      runCli([
        'portfolio', 'plan',
        '--positions', JSON.stringify([{ ticker: 'KXABC', side: 'yes', size: 10 }]),
        '--bids', JSON.stringify({ KXABC: 80 }),
        '--mids', JSON.stringify({ KXABC: 0.7 }),
      ]),
    );
    const parsed = JSON.parse(out);
    expect(parsed).toHaveProperty('ranked');
    expect(parsed.ranked).toHaveLength(1);
    expect(parsed.ranked[0].ticker).toBe('KXABC');
  });

  it('respects --strategy override', async () => {
    const out = await captureOut(() =>
      runCli([
        'portfolio', 'plan',
        '--positions', JSON.stringify([{ ticker: 'KXABC', side: 'yes', size: 10 }]),
        '--bids', JSON.stringify({ KXABC: 80 }),
        '--mids', JSON.stringify({ KXABC: 0.7 }),
        '--strategy', 'passive',
      ]),
    );
    const parsed = JSON.parse(out);
    expect(parsed.ranked[0].recommendedStrategy).toBe('passive');
  });

  it('dies without required flags', async () => {
    await expect(runCli(['portfolio', 'plan'])).rejects.toThrow();
  });
});

// ── alerts ────────────────────────────────────────────────────────────────────

describe('kea alerts list', () => {
  it('shows empty message when no notify synthetics', async () => {
    const out = await captureOut(() => runCli(['alerts', 'list']));
    expect(out).toContain('no alert synthetics');
  });

  it('lists registered notify synthetics', async () => {
    // Register one directly
    const id = getWatcher().register({
      kind: 'stop_loss',
      ticker: 'KXABC',
      side: 'yes',
      positionSize: 10,
      params: { triggerPriceCents: 30 } as any,
    });
    const syn = getWatcher().get(id);
    if (syn) { syn.action = 'notify'; syn.notifyChannels = [{ kind: 'desktop' }]; }

    const out = await captureOut(() => runCli(['alerts', 'list']));
    expect(out).toContain(id);
    expect(out).toContain('KXABC');
  });
});

describe('kea alerts register', () => {
  it('registers a notify synthetic and outputs its id', async () => {
    const out = await captureOut(() =>
      runCli([
        'alerts', 'register',
        '--ticker', 'KXABC',
        '--kind', 'stop_loss',
        '--side', 'yes',
        '--size', '10',
        '--params', JSON.stringify({ triggerPriceCents: 30 }),
      ]),
    );
    expect(out.trim()).toMatch(/^syn-/);
    // Verify action=notify was set
    const id = out.trim();
    const syn = getWatcher().get(id);
    expect(syn?.action).toBe('notify');
    expect(syn?.notifyChannels).toEqual([{ kind: 'desktop' }]);
  });

  it('uses provided --channels', async () => {
    const channels = [{ kind: 'webhook', webhookUrl: 'https://example.com/hook' }];
    const out = await captureOut(() =>
      runCli([
        'alerts', 'register',
        '--ticker', 'KXABC',
        '--kind', 'stop_loss',
        '--side', 'yes',
        '--size', '10',
        '--params', JSON.stringify({ triggerPriceCents: 30 }),
        '--channels', JSON.stringify(channels),
      ]),
    );
    const id = out.trim();
    const syn = getWatcher().get(id);
    expect(syn?.notifyChannels).toEqual(channels);
  });
});

describe('kea alerts cancel', () => {
  it('cancels an existing notify synthetic', async () => {
    const id = getWatcher().register({
      kind: 'stop_loss',
      ticker: 'KXABC',
      side: 'yes',
      positionSize: 10,
      params: { triggerPriceCents: 30 } as any,
    });
    const out = await captureOut(() =>
      runCli(['alerts', 'cancel', '--id', id]),
    );
    expect(out).toContain(`canceled ${id}`);
    expect(getWatcher().get(id)?.status).toBe('canceled');
  });

  it('reports not found for unknown id', async () => {
    const out = await captureOut(() =>
      runCli(['alerts', 'cancel', '--id', 'syn-nonexistent-id']),
    );
    expect(out).toContain('not found');
  });
});

// ── ev ────────────────────────────────────────────────────────────────────────

describe('kea ev', () => {
  it('outputs EV JSON for enter-yes action', async () => {
    const out = await captureOut(() =>
      runCli([
        'ev',
        '--ticker', 'KXABC',
        '--bid-cents', '60',
        '--ask-cents', '62',
        '--mid-prob', '0.65',
        '--action', 'enter-yes',
      ]),
    );
    const result = JSON.parse(out);
    expect(result).toHaveProperty('evDollars');
    expect(result).toHaveProperty('rationale');
  });

  it('outputs EV JSON for exit-aggressive with position', async () => {
    const out = await captureOut(() =>
      runCli([
        'ev',
        '--ticker', 'KXABC',
        '--bid-cents', '60',
        '--ask-cents', '62',
        '--mid-prob', '0.65',
        '--action', 'exit-aggressive',
        '--position-size', '10',
        '--side', 'yes',
        '--cost-basis-cents', '50',
      ]),
    );
    const result = JSON.parse(out);
    expect(result.evDollars).toBeGreaterThan(0);
  });

  it('dies without required flags', async () => {
    await expect(runCli(['ev', '--ticker', 'KXABC'])).rejects.toThrow();
  });
});

// ── size ──────────────────────────────────────────────────────────────────────

describe('kea size', () => {
  it('outputs Kelly size JSON', async () => {
    const out = await captureOut(() =>
      runCli([
        'size',
        '--edge-p', '0.7',
        '--market-p', '0.5',
        '--bankroll', '1000',
      ]),
    );
    const result = JSON.parse(out);
    expect(result).toHaveProperty('fullKellyFractionOfBankroll');
    expect(result).toHaveProperty('recommendedDollars');
    expect(result.recommendedDollars).toBeGreaterThan(0);
  });

  it('caps by --max-position', async () => {
    const out = await captureOut(() =>
      runCli([
        'size',
        '--edge-p', '0.9',
        '--market-p', '0.5',
        '--bankroll', '10000',
        '--max-position', '50',
      ]),
    );
    const result = JSON.parse(out);
    expect(result.recommendedDollars).toBeLessThanOrEqual(50);
  });

  it('dies without required flags', async () => {
    await expect(runCli(['size'])).rejects.toThrow();
  });
});

// ── recommend ─────────────────────────────────────────────────────────────────

describe('kea recommend', () => {
  it('outputs ranked recommendations JSON', async () => {
    const out = await captureOut(() =>
      runCli([
        'recommend',
        '--market-p', '0.5',
        '--edge-p', '0.65',
        '--bankroll', '1000',
        '--strategies', 's-passive,s-aggressive',
        '--ticker', 'KXABC',
        '--bid-cents', '60',
        '--ask-cents', '62',
      ]),
    );
    const result = JSON.parse(out);
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('includes noRecommendation when edge is negative', async () => {
    const out = await captureOut(() =>
      runCli([
        'recommend',
        '--market-p', '0.7',
        '--edge-p', '0.3',
        '--bankroll', '1000',
        '--strategies', 's-passive,s-aggressive',
      ]),
    );
    const result = JSON.parse(out);
    expect(result.noRecommendation).toBeDefined();
    expect(result.recommendations).toHaveLength(0);
  });

  it('dies without required flags', async () => {
    await expect(runCli(['recommend'])).rejects.toThrow();
  });
});
