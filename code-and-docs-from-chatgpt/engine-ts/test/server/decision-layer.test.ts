/**
 * HTTP decision-layer routes — integration tests.
 *
 * Routes tested:
 *   POST /portfolio/plan
 *   POST /alerts/register
 *   GET  /alerts/list
 *   DELETE /alerts/cancel
 *   POST /recommend
 *   POST /ev
 *   POST /size
 */

import http from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Watcher } from '../../src/watcher.js';
import { setWatcherForTests, resetWatcherForTests, getWatcher } from '../../src/watcherSingleton.js';
import { createServer } from '../../src/server.js';
import type { ExitConfig, KalshiClientLike } from '../../src/types.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockClient(): KalshiClientLike {
  return {
    getOrderbook: async () => ({ yes: [{ priceCents: 50, size: 10 }], no: [] }),
    getPosition: async () => ({ ticker: 'KX', side: 'yes', quantity: 10 }),
  } as any;
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

const exitCfg: ExitConfig = {
  baseUrl: 'https://test.example',
  localServerPort: 0,
  marketTicker: 'KX',
  heldSide: 'yes',
  positionSize: 10,
  chunkSize: 5,
  floorPriceCents: 1,
  orderbookDepth: 20,
  dryRun: true,
};

let server: http.Server;
let base: string;

beforeEach(async () => {
  setWatcherForTests(new Watcher(mockClient(), baseCfg));
  server = createServer(exitCfg);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as { port: number };
  base = `http://127.0.0.1:${addr.port}`;
});

afterEach(async () => {
  resetWatcherForTests();
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

async function post(path: string, body: unknown) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function del(path: string, body: unknown) {
  return fetch(`${base}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── POST /portfolio/plan ──────────────────────────────────────────────────────

describe('POST /portfolio/plan', () => {
  it('returns 200 with ranked plan', async () => {
    const res = await post('/portfolio/plan', {
      positions: [{ ticker: 'KXABC', side: 'yes', size: 10 }],
      bidByTicker: { KXABC: 80 },
      midProbabilities: { KXABC: 0.7 },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.plan).toHaveProperty('ranked');
    expect(body.plan.ranked).toHaveLength(1);
  });

  it('returns 400 when positions missing', async () => {
    const res = await post('/portfolio/plan', {
      bidByTicker: { KXABC: 80 },
      midProbabilities: { KXABC: 0.7 },
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
  });

  it('returns 400 when bidByTicker missing', async () => {
    const res = await post('/portfolio/plan', {
      positions: [{ ticker: 'KXABC', side: 'yes', size: 10 }],
      midProbabilities: { KXABC: 0.7 },
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when midProbabilities missing', async () => {
    const res = await post('/portfolio/plan', {
      positions: [{ ticker: 'KXABC', side: 'yes', size: 10 }],
      bidByTicker: { KXABC: 80 },
    });
    expect(res.status).toBe(400);
  });
});

// ── POST /alerts/register ─────────────────────────────────────────────────────

describe('POST /alerts/register', () => {
  it('returns 201 with id and sets action=notify', async () => {
    const res = await post('/alerts/register', {
      kind: 'stop_loss',
      ticker: 'KXABC',
      side: 'yes',
      positionSize: 10,
      params: { triggerPriceCents: 30 },
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.id).toMatch(/^syn-/);
    const syn = getWatcher().get(body.id);
    expect(syn?.action).toBe('notify');
  });

  it('returns 400 when kind missing', async () => {
    const res = await post('/alerts/register', {
      ticker: 'KXABC',
      side: 'yes',
      positionSize: 10,
      params: { triggerPriceCents: 30 },
    });
    expect(res.status).toBe(400);
  });

  it('accepts webhook channel config', async () => {
    const res = await post('/alerts/register', {
      kind: 'take_profit',
      ticker: 'KXABC',
      side: 'yes',
      positionSize: 10,
      params: { triggerPriceCents: 80 },
      notifyChannels: [{ kind: 'webhook', webhookUrl: 'https://hooks.example.com/test' }],
    });
    expect(res.status).toBe(201);
    const { id } = await res.json() as any;
    const syn = getWatcher().get(id);
    expect(syn?.notifyChannels?.[0]?.kind).toBe('webhook');
  });
});

// ── GET /alerts/list ──────────────────────────────────────────────────────────

describe('GET /alerts/list', () => {
  it('returns empty array when no alerts registered', async () => {
    const res = await fetch(`${base}/alerts/list`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.alerts).toHaveLength(0);
  });

  it('returns registered notify synthetics', async () => {
    await post('/alerts/register', {
      kind: 'stop_loss',
      ticker: 'KXABC',
      side: 'yes',
      positionSize: 10,
      params: { triggerPriceCents: 30 },
    });
    const res = await fetch(`${base}/alerts/list`);
    const body = await res.json() as any;
    expect(body.alerts).toHaveLength(1);
    expect(body.alerts[0].ticker).toBe('KXABC');
    expect(body.alerts[0].action).toBe('notify');
  });
});

// ── DELETE /alerts/cancel ─────────────────────────────────────────────────────

describe('DELETE /alerts/cancel', () => {
  it('cancels a registered alert', async () => {
    const regRes = await post('/alerts/register', {
      kind: 'stop_loss',
      ticker: 'KXABC',
      side: 'yes',
      positionSize: 10,
      params: { triggerPriceCents: 30 },
    });
    const { id } = await regRes.json() as any;

    const cancelRes = await del('/alerts/cancel', { id });
    expect(cancelRes.status).toBe(200);
    const body = await cancelRes.json() as any;
    expect(body.ok).toBe(true);
    expect(body.canceled).toBe(true);
  });

  it('returns 400 when id missing', async () => {
    const res = await del('/alerts/cancel', {});
    expect(res.status).toBe(400);
  });
});

// ── POST /ev ──────────────────────────────────────────────────────────────────

describe('POST /ev', () => {
  it('returns 200 with evDollars for enter-yes action', async () => {
    const res = await post('/ev', {
      ticker: 'KXABC',
      bidCents: 60,
      askCents: 62,
      midProbability: 0.65,
      action: 'enter-yes',
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty('evDollars');
    expect(body).toHaveProperty('rationale');
  });

  it('returns 400 when action missing', async () => {
    const res = await post('/ev', {
      ticker: 'KXABC',
      bidCents: 60,
      askCents: 62,
      midProbability: 0.65,
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid midProbability', async () => {
    const res = await post('/ev', {
      ticker: 'KXABC',
      bidCents: 60,
      askCents: 62,
      midProbability: 2.0,
      action: 'hold',
    });
    expect(res.status).toBe(400);
  });
});

// ── POST /size ────────────────────────────────────────────────────────────────

describe('POST /size', () => {
  it('returns 200 with Kelly sizing output', async () => {
    const res = await post('/size', {
      edgeProbability: 0.7,
      marketProbability: 0.5,
      bankrollDollars: 1000,
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty('fullKellyFractionOfBankroll');
    expect(body).toHaveProperty('recommendedDollars');
    expect(body.recommendedDollars).toBeGreaterThan(0);
  });

  it('returns 400 when required fields missing', async () => {
    const res = await post('/size', { edgeProbability: 0.7 });
    expect(res.status).toBe(400);
  });
});

// ── POST /recommend ───────────────────────────────────────────────────────────

describe('POST /recommend', () => {
  it('returns 200 with recommendations', async () => {
    const res = await post('/recommend', {
      ticker: 'KXABC',
      bidCents: 60,
      askCents: 62,
      midProbability: 0.65,
      marketProbability: 0.5,
      edgeProbability: 0.65,
      bankrollDollars: 1000,
      availableStrategies: ['s-passive', 's-aggressive'],
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty('recommendations');
    expect(Array.isArray(body.recommendations)).toBe(true);
  });

  it('returns 400 when availableStrategies missing', async () => {
    const res = await post('/recommend', {
      ticker: 'KXABC',
      bidCents: 60,
      askCents: 62,
      midProbability: 0.65,
      marketProbability: 0.5,
      edgeProbability: 0.65,
      bankrollDollars: 1000,
    });
    expect(res.status).toBe(400);
  });
});
