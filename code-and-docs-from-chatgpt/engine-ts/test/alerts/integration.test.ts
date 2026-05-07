/**
 * Integration tests for the notify-only synthetic path.
 *
 * Tests the full stack: invokeFire(action='notify') → alerts/index.ts → channels.
 * Also verifies that action='fire' (or absent) still runs the order-placing path.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { invokeFire } from '../../src/synthetics/invoke.js';
import { Journal, generateJobId } from '../../src/journal.js';
import type { Synthetic } from '../../src/types.js';
import { _resetStateForTest } from '../../src/alerts/dedupe.js';

// Build a minimal journal backed by a temp file
function makeJournal(): Journal {
  const home = join(tmpdir(), `test-alerts-${Date.now()}`);
  return new Journal(generateJobId(), home);
}

// Build a notify synthetic
function notifySynthetic(overrides: Partial<Synthetic> = {}): Synthetic {
  return {
    id: `syn-${Date.now()}`,
    kind: 'stop_loss',
    ticker: 'KXTEST',
    side: 'yes',
    positionSize: 100,
    params: { triggerPriceCents: 5 },
    state: {},
    status: 'armed',
    createdAt: new Date().toISOString(),
    selfTradePrevention: 'taker_at_cross',
    autoCancelOnZeroPosition: true,
    action: 'notify',
    notifyChannels: [{ kind: 'webhook', webhookUrl: 'https://hook.example.com/alert' }],
    ...overrides,
  };
}

// Stub fire deps
const fireDeps = {
  runExit: vi.fn(async () => undefined),
  postLimit: vi.fn(async () => 'order-1'),
  buildExitConfig: () => ({} as any),
};

beforeEach(() => {
  _resetStateForTest();
  vi.clearAllMocks();
});

describe('notify path (action=notify)', () => {
  it('webhook channel: fetch called once with correct payload, no order placed', async () => {
    const journal = makeJournal();
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 }));
    const s = notifySynthetic();

    const result = await invokeFire(s, fireDeps, {
      alertCtx: { message: 'test alert', fetchFn: fetchFn as any },
      journal,
    });

    expect(result.kind).toBe('notified');
    expect(fireDeps.runExit).not.toHaveBeenCalled();
    expect(fetchFn).toHaveBeenCalledOnce();

    const callArgs = fetchFn.mock.calls[0]!;
    const body = JSON.parse((callArgs[1] as any).body);
    expect(body.syntheticId).toBe(s.id);
    expect(body.ticker).toBe('KXTEST');
    expect(body.message).toBe('test alert');
  });

  it('both webhook + desktop channels: both dispatched', async () => {
    const journal = makeJournal();
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 }));
    const notifierFn = vi.fn(async () => {});
    const s = notifySynthetic({
      notifyChannels: [
        { kind: 'webhook', webhookUrl: 'https://hook.example.com/a' },
        { kind: 'desktop' },
      ],
    });

    await invokeFire(s, fireDeps, {
      alertCtx: { message: 'dual alert', fetchFn: fetchFn as any, notifierFn },
      journal,
    });

    expect(fetchFn).toHaveBeenCalledOnce();
    expect(notifierFn).toHaveBeenCalledOnce();
  });

  it('webhook 500: alert_dispatch_failed journaled, watcher continues (no throw)', async () => {
    const journal = makeJournal();
    const fetchFn = vi.fn(async () => ({ ok: false, status: 500 }));
    const s = notifySynthetic();

    const result = await invokeFire(s, fireDeps, {
      alertCtx: { message: 'failing webhook', fetchFn: fetchFn as any },
      journal,
    });

    expect(result.kind).toBe('notified');
    const entries = journal.readAll();
    expect(entries.some(e => (e.kind as string) === 'alert_dispatch_failed')).toBe(true);
  });

  it('webhook 200: alert_dispatched journaled', async () => {
    const journal = makeJournal();
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 }));
    const s = notifySynthetic();

    await invokeFire(s, fireDeps, {
      alertCtx: { message: 'ok webhook', fetchFn: fetchFn as any },
      journal,
    });

    const entries = journal.readAll();
    expect(entries.some(e => (e.kind as string) === 'alert_dispatched')).toBe(true);
  });

  it('dedupe: 1st fires, 2nd within cooldown suppressed (alert_deduped journaled)', async () => {
    const journal = makeJournal();
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 }));
    const s = notifySynthetic({ id: 'syn-dedup-test' });
    const now = Date.now();

    const res1 = await invokeFire(s, fireDeps, {
      alertCtx: { message: 'first', fetchFn: fetchFn as any, nowMs: now, cooldownMs: 60_000 },
      journal,
    });
    const res2 = await invokeFire(s, fireDeps, {
      alertCtx: { message: 'second', fetchFn: fetchFn as any, nowMs: now + 1000, cooldownMs: 60_000 },
      journal,
    });

    expect(res1.kind).toBe('notified');
    expect(res2.kind).toBe('deduped');
    expect(fetchFn).toHaveBeenCalledOnce(); // only 1st fired
    const entries = journal.readAll();
    expect(entries.some(e => (e.kind as string) === 'alert_deduped')).toBe(true);
  });

  it('cooldown clears after window passes', async () => {
    const journal = makeJournal();
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 }));
    const s = notifySynthetic({ id: 'syn-window-test' });
    const now = Date.now();
    const cooldownMs = 1000;

    await invokeFire(s, fireDeps, {
      alertCtx: { message: 'first', fetchFn: fetchFn as any, nowMs: now, cooldownMs },
      journal,
    });
    const res = await invokeFire(s, fireDeps, {
      alertCtx: { message: 'after window', fetchFn: fetchFn as any, nowMs: now + cooldownMs + 1, cooldownMs },
      journal,
    });
    expect(res.kind).toBe('notified');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('notifyChannels=[] with action=notify → alert_no_channels journaled', async () => {
    const journal = makeJournal();
    const s = notifySynthetic({ notifyChannels: [] });

    const result = await invokeFire(s, fireDeps, {
      alertCtx: { message: 'no channels' },
      journal,
    });

    expect(result.kind).toBe('no_channels');
    const entries = journal.readAll();
    expect(entries.some(e => (e.kind as string) === 'alert_no_channels')).toBe(true);
  });

  it('webhook channel missing webhookUrl → alert_dispatch_failed journaled', async () => {
    const journal = makeJournal();
    const s = notifySynthetic({
      notifyChannels: [{ kind: 'webhook' }], // no webhookUrl
    });

    const result = await invokeFire(s, fireDeps, {
      alertCtx: { message: 'bad webhook config' },
      journal,
    });

    expect(result.kind).toBe('notified'); // dispatch was attempted, channel failed
    const entries = journal.readAll();
    expect(entries.some(e => (e.kind as string) === 'alert_dispatch_failed')).toBe(true);
  });
});

describe('fire path regression (action=fire or absent)', () => {
  it('action=fire → existing order-placing path runs', async () => {
    const journal = makeJournal();
    const runExit = vi.fn(async () => undefined);
    const s = notifySynthetic({ action: 'fire', notifyChannels: [] });

    const result = await invokeFire(s, {
      runExit,
      postLimit: vi.fn(async () => 'order-1'),
      buildExitConfig: () => ({} as any),
    });

    expect(result.kind).toBe('fired');
    expect(runExit).toHaveBeenCalledOnce();
  });

  it('action absent (undefined) → treated as fire, order-placing path runs', async () => {
    const journal = makeJournal();
    const runExit = vi.fn(async () => undefined);
    const s = notifySynthetic({ action: undefined, notifyChannels: [] });

    const result = await invokeFire(s, {
      runExit,
      postLimit: vi.fn(async () => 'order-1'),
      buildExitConfig: () => ({} as any),
    });

    expect(result.kind).toBe('fired');
    expect(runExit).toHaveBeenCalledOnce();
  });
});
