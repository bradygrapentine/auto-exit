/**
 * HTTP synthetics routes — integration tests against the actual http.Server.
 *
 * Starts the server on an ephemeral port (listen(0)), makes real fetch calls,
 * asserts JSON responses.  Uses setWatcherForTests / resetWatcherForTests so
 * no real Kalshi client is needed.
 */

import http from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Watcher } from '../../src/watcher.js';
import { setWatcherForTests, resetWatcherForTests } from '../../src/watcherSingleton.js';
import { createServer } from '../../src/server.js';
import type { ExitConfig, KalshiClientLike, Orderbook } from '../../src/types.js';

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
  maxSlippageCents: 5,
  feeRateBps: 0,
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

async function get(path: string) {
  return fetch(`${base}${path}`);
}

async function del(path: string) {
  return fetch(`${base}${path}`, { method: 'DELETE' });
}

const stopLossBody = {
  kind: 'stop_loss',
  ticker: 'KX',
  side: 'yes',
  positionSize: 10,
  params: { triggerPriceCents: 30 },
};

// ── Register ─────────────────────────────────────────────────────────────────

describe('POST /synthetics/register', () => {
  it('registers a stop_loss and returns an id', async () => {
    const res = await post('/synthetics/register', stopLossBody);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(typeof data.id).toBe('string');
    expect(data.id).toMatch(/^syn-/);
  });

  it('returns 400 when kind is missing', async () => {
    const res = await post('/synthetics/register', { ticker: 'KX', side: 'yes', positionSize: 10, params: {} });
    expect(res.status).toBe(400);
  });

  it('returns 400 when side is invalid', async () => {
    const res = await post('/synthetics/register', { ...stopLossBody, side: 'maybe' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is not valid JSON', async () => {
    const res = await fetch(`${base}/synthetics/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad json',
    });
    expect(res.status).toBe(400);
  });

  it('returns 503 when watcher not initialized', async () => {
    resetWatcherForTests();
    const res = await post('/synthetics/register', stopLossBody);
    expect(res.status).toBe(503);
    const data = await res.json() as any;
    expect(data.error).toMatch(/Watcher not initialized/);
  });
});

// ── List ─────────────────────────────────────────────────────────────────────

describe('GET /synthetics/list', () => {
  it('returns empty array when nothing registered', async () => {
    const res = await get('/synthetics/list');
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data).toEqual([]);
  });

  it('returns registered synthetics', async () => {
    await post('/synthetics/register', stopLossBody);
    const res = await get('/synthetics/list');
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data).toHaveLength(1);
    expect(data[0].kind).toBe('stop_loss');
  });

  it('returns 503 when watcher not initialized', async () => {
    resetWatcherForTests();
    const res = await get('/synthetics/list');
    expect(res.status).toBe(503);
  });
});

// ── GET /:id ──────────────────────────────────────────────────────────────────

describe('GET /synthetics/:id', () => {
  it('returns the synthetic by id', async () => {
    const registerRes = await post('/synthetics/register', stopLossBody);
    const { id } = await registerRes.json() as any;
    const res = await get(`/synthetics/${id}`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.id).toBe(id);
    expect(data.kind).toBe('stop_loss');
  });

  it('returns 404 for unknown id', async () => {
    const res = await get('/synthetics/syn-unknown-id');
    expect(res.status).toBe(404);
  });

  it('returns 503 when watcher not initialized', async () => {
    resetWatcherForTests();
    const res = await get('/synthetics/syn-whatever');
    expect(res.status).toBe(503);
  });
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────

describe('DELETE /synthetics/:id', () => {
  it('cancels a synthetic and returns { canceled: true }', async () => {
    const registerRes = await post('/synthetics/register', stopLossBody);
    const { id } = await registerRes.json() as any;
    const res = await del(`/synthetics/${id}`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.canceled).toBe(true);
  });

  it('subsequent list shows status=canceled', async () => {
    const registerRes = await post('/synthetics/register', stopLossBody);
    const { id } = await registerRes.json() as any;
    await del(`/synthetics/${id}`);
    const listRes = await get('/synthetics/list');
    const list = await listRes.json() as any[];
    const syn = list.find((s: any) => s.id === id);
    expect(syn?.status).toBe('canceled');
  });

  it('returns 404 for unknown id', async () => {
    const res = await del('/synthetics/syn-ghost');
    expect(res.status).toBe(404);
  });

  it('returns 503 when watcher not initialized', async () => {
    resetWatcherForTests();
    const res = await del('/synthetics/syn-whatever');
    expect(res.status).toBe(503);
  });
});

// ── Preview ───────────────────────────────────────────────────────────────────

const previewBook: Orderbook = { yes: [{ priceCents: 25, size: 10 }], no: [] };

describe('POST /synthetics/preview', () => {
  it('returns wouldFireNow=true when price crosses stop_loss trigger', async () => {
    // stop_loss fires when topBid <= triggerPriceCents; topBid=25 <= trigger=30 → fires
    const res = await post('/synthetics/preview', {
      ...stopLossBody,
      params: { triggerPriceCents: 30 },
      book: previewBook,
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.wouldFireNow).toBe(true);
    expect(data.topBidCents).toBe(25);
  });

  it('returns wouldFireNow=false when price does not cross trigger', async () => {
    // topBid=25, trigger=10 → does NOT fire
    const res = await post('/synthetics/preview', {
      ...stopLossBody,
      params: { triggerPriceCents: 10 },
      book: previewBook,
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.wouldFireNow).toBe(false);
    expect(data.topBidCents).toBe(25);
  });

  it('does NOT register the synthetic (dry-run)', async () => {
    await post('/synthetics/preview', { ...stopLossBody, book: previewBook });
    const listRes = await get('/synthetics/list');
    const list = await listRes.json() as any[];
    expect(list).toHaveLength(0);
  });

  it('returns 400 when book is missing', async () => {
    const res = await post('/synthetics/preview', stopLossBody);
    expect(res.status).toBe(400);
  });

  it('returns 400 when kind is missing', async () => {
    const res = await post('/synthetics/preview', { ticker: 'KX', side: 'yes', positionSize: 10, params: {}, book: previewBook });
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is not valid JSON', async () => {
    const res = await fetch(`${base}/synthetics/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    expect(res.status).toBe(400);
  });
});
