/**
 * clientRetry.test.ts
 *
 * Integration tests for KalshiClient retry behaviour using an injected fake fetch.
 * The fake fetch returns scripted responses from a queue.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KalshiClient, type FetchFn } from '../src/kalshiClient.js';
import type { ExitConfig, OrderPayload } from '../src/types.js';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Minimal config — auth env vars are not set, so we stub authHeaders too. */
const cfg: ExitConfig = {
  baseUrl: 'https://api.kalshi.test',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 1000,
  chunkSize: 100,
  floorPriceCents: 1,
  orderbookDepth: 5,
  minLevelSize: 1,
  tailSweepThreshold: 50,
  mildAdaptive: false,
  minAdaptiveChunk: 10,
  maxOrders: 20,
  loopDelayMs: 0,
  dryRun: false,
  killSwitchPath: '/tmp/kill',
  apiKeyEnv: 'KALSHI_KEY',
  privateKeyPathEnv: 'KALSHI_KEY_PATH',
};

/** Build a fake Response with the given status and JSON body. */
function fakeResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  const headersMap = new Headers(headers);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: headersMap,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

/** Build a fetch fn that serves responses from a queue. */
function makeQueuedFetch(responses: Array<Response | (() => Promise<never>)>): FetchFn {
  let i = 0;
  return async (_url: string, _init?: RequestInit): Promise<Response> => {
    if (i >= responses.length) throw new Error('No more queued responses');
    const item = responses[i++];
    if (typeof item === 'function') return item();
    return item;
  };
}

/**
 * Build a KalshiClient with a stubbed authHeaders so tests don't need
 * real env vars / key files.
 */
function makeClient(fetchFn: FetchFn): KalshiClient {
  const client = new KalshiClient(cfg, fetchFn);
  // Stub out authHeaders to return a dummy header set
  (client as any).authHeaders = (_method: string, _path: string) => ({
    'KALSHI-ACCESS-KEY': 'test-key',
    'KALSHI-ACCESS-TIMESTAMP': '0',
    'KALSHI-ACCESS-SIGNATURE': 'sig',
  });
  return client;
}

/** Minimal orderbook JSON */
const orderbookJson = {
  orderbook: {
    yes: [[50, 200]],
    no: [[50, 200]],
  },
};

/** Minimal order JSON */
function orderJson(id: string, status = 'resting', filled = 0, remaining = 100) {
  return { order: { order_id: id, status, filled_count: filled, remaining_count: remaining, count: 100 } };
}

const samplePayload: OrderPayload = {
  ticker: 'KXTEST',
  action: 'sell',
  side: 'yes',
  count: 100,
  type: 'limit',
  yes_price: 50,
  reduce_only: true,
  client_order_id: 'cloid-abc-123',
};

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('KalshiClient retry integration', () => {
  beforeEach(() => {
    // Skip real sleep delays
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler) => {
      if (typeof fn === 'function') fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── getOrderbook: 503 then 200 ──────────────────────────────────────────────

  it('getOrderbook: retries on 503 and succeeds on second attempt', async () => {
    const fetchFn = makeQueuedFetch([
      fakeResponse(503, { error: 'unavailable' }),
      fakeResponse(200, orderbookJson),
    ]);
    const client = makeClient(fetchFn);
    const ob = await client.getOrderbook('KXTEST', 5);
    expect(ob.yes).toHaveLength(1);
    expect(ob.yes[0].priceCents).toBe(50);
  });

  it('getOrderbook: fails fast on 400', async () => {
    const fetchFn = makeQueuedFetch([
      fakeResponse(400, { error: 'bad request' }),
    ]);
    const client = makeClient(fetchFn);
    await expect(client.getOrderbook('KXTEST', 5)).rejects.toThrow('HTTP 400');
  });

  // ── getOrder: 429 with Retry-After ─────────────────────────────────────────

  it('getOrder: honors Retry-After header on 429', async () => {
    const setTimeoutDelays: number[] = [];
    // Override the beforeEach spy to also record delay values
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler, ms?: number) => {
      setTimeoutDelays.push(ms ?? 0);
      if (typeof fn === 'function') (fn as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    const fetchFn = makeQueuedFetch([
      fakeResponse(429, {}, { 'Retry-After': '2' }), // 2 seconds → 2000ms
      fakeResponse(200, orderJson('ord-1')),
    ]);
    const client = makeClient(fetchFn);
    const result = await client.getOrder('ord-1');
    expect(result.orderId).toBe('ord-1');
    expect(setTimeoutDelays[0]).toBe(2000);
  });

  // ── createOrder: network error → find by cloid succeeds (idempotent recovery) ─

  it('createOrder: network error followed by find-by-cloid success', async () => {
    // First POST → network error; second GET (find by cloid) → order found
    let call = 0;
    const fetchFn: FetchFn = async (url) => {
      call++;
      if (call === 1) {
        // POST — simulate network error
        throw new Error('ECONNRESET');
      }
      if (url.includes('client_order_id=cloid-abc-123')) {
        // GET by cloid — order was actually created
        return fakeResponse(200, { orders: [orderJson('ord-99', 'resting', 0, 100).order] });
      }
      // Should not reach here
      throw new Error(`Unexpected call to ${url}`);
    };
    const client = makeClient(fetchFn);
    const result = await client.createOrder(samplePayload);
    expect(result.orderId).toBe('ord-99');
  });

  // ── createOrder: genuine network failure (no existing order) → retries POST and succeeds ─

  it('createOrder: genuine network failure retries POST and succeeds on second attempt', async () => {
    let postCount = 0;
    let cloidCheckCount = 0;
    const fetchFn: FetchFn = async (url, init) => {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'POST') {
        postCount++;
        if (postCount === 1) throw new Error('ECONNREFUSED'); // first POST fails
        // second POST succeeds
        return fakeResponse(200, orderJson('ord-200', 'resting', 0, 100));
      }
      // GET by cloid — not found (order didn't land)
      if (url.includes('client_order_id=')) {
        cloidCheckCount++;
        return fakeResponse(200, { orders: [] });
      }
      throw new Error(`Unexpected: ${method} ${url}`);
    };
    const client = makeClient(fetchFn);
    const result = await client.createOrder(samplePayload);
    expect(result.orderId).toBe('ord-200');
    expect(postCount).toBe(2);
    expect(cloidCheckCount).toBe(1);
  });

  // ── createOrder: 5xx → dedup finds existing order → short-circuit (no retry POST) ─

  it('createOrder: 5xx dedup short-circuit returns existing order without retry POST', async () => {
    let fetchCount = 0;
    const fetchFn: FetchFn = async (url, init) => {
      fetchCount++;
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'POST') {
        // Attempt 1: 503 response (order may have landed server-side)
        return fakeResponse(503, { error: 'service unavailable' });
      }
      // Dedup GET by cloid — order was actually created before the 503
      if (url.includes('client_order_id=')) {
        return fakeResponse(200, { orders: [orderJson('ord-503', 'resting', 0, 100).order] });
      }
      throw new Error(`Unexpected: ${method} ${url}`);
    };
    const client = makeClient(fetchFn);
    const result = await client.createOrder(samplePayload);
    expect(result.orderId).toBe('ord-503');
    // fetch called exactly twice: initial POST + dedup GET (no retry POST)
    expect(fetchCount).toBe(2);
  });

  // ── createOrder: exhausts retries when server keeps returning 503 ───────────
  // With 5xx dedup: each POST 503 triggers a dedup GET returning empty orders,
  // then retries. maxAttempts=4: 4 POSTs + 4 dedup GETs (including last attempt).

  it('createOrder: throws after maxAttempts of 5xx', async () => {
    const fetchFn: FetchFn = async (url, init) => {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'POST') return fakeResponse(503, {});
      if (url.includes('client_order_id=')) return fakeResponse(200, { orders: [] });
      throw new Error(`Unexpected: ${method} ${url}`);
    };
    const client = makeClient(fetchFn);
    await expect(client.createOrder(samplePayload)).rejects.toThrow('HTTP 503');
  });

  // ── cancelOrder: retries on 5xx ─────────────────────────────────────────────

  it('cancelOrder: retries on 5xx and succeeds', async () => {
    const fetchFn = makeQueuedFetch([
      fakeResponse(502, {}),
      fakeResponse(200, orderJson('ord-3', 'canceled', 0, 0)),
    ]);
    const client = makeClient(fetchFn);
    const result = await client.cancelOrder('ord-3');
    expect(result.status).toBe('canceled');
  });
});
