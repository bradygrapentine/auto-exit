/**
 * MCP synthetics tool tests — register/list/get/cancel/preview.
 *
 * Uses InMemoryTransport so no real Kalshi calls happen.
 * Watcher is injected via setWatcherForTests with a minimal mock client.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Watcher } from '../../src/watcher.js';
import { setWatcherForTests, resetWatcherForTests } from '../../src/watcherSingleton.js';
import type { KalshiClientLike, Orderbook, WatcherConfig } from '../../src/types.js';

// ── Mock Kalshi client ────────────────────────────────────────────────────────

function makeMockClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async (_ticker: string, _depth: number): Promise<Orderbook> => ({
      yes: [{ priceCents: 55, size: 100 }],
      no: [{ priceCents: 45, size: 100 }],
    })),
    createOrder: vi.fn(async () => ({ orderId: 'o1', status: 'filled', filledCount: 10, remainingCount: 0 })),
    getOrder: vi.fn(async () => ({ orderId: 'o1', status: 'filled', filledCount: 10, remainingCount: 0 })),
    cancelOrder: vi.fn(async () => ({ orderId: 'o1', status: 'canceled', filledCount: 0, remainingCount: 10 })),
    getPosition: vi.fn(async () => ({ ticker: 'TEST-X', side: 'yes' as const, quantity: 10 })),
    getRestingOrderCount: vi.fn(async () => 0),
    findOrderByClientOrderId: vi.fn(async () => null),
  };
}

const baseCfg: WatcherConfig = {
  baseUrl: 'https://example.com',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
};

// ── MCP connect helper ────────────────────────────────────────────────────────

async function connect() {
  const { buildMcpServer } = await import('../../src/mcp.js');
  const server = buildMcpServer();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-synthetics', version: '0.0.0' });
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  return { client, server };
}

function parseJsonResult(res: { content: Array<{ type: string; text?: string }> }) {
  const text = res.content[0]?.text ?? '';
  return JSON.parse(text);
}

// ── Setup/teardown ────────────────────────────────────────────────────────────

beforeEach(() => {
  const watcher = new Watcher(makeMockClient(), baseCfg);
  setWatcherForTests(watcher);
});

afterEach(() => {
  resetWatcherForTests();
  vi.clearAllMocks();
});

// ── kea_synthetic_register ────────────────────────────────────────────────────

describe('kea_synthetic_register', () => {
  it('registers a stop_loss and returns an id', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
      },
    });
    const parsed = parseJsonResult(res);
    expect(parsed.id).toMatch(/^syn-/);
  });

  it('returns isError on invalid kind', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'not_a_kind',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: {},
      },
    });
    expect(res.isError).toBe(true);
  });

  it('returns isError on invalid side', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'maybe',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
      },
    });
    expect(res.isError).toBe(true);
  });

  it('returns isError on positionSize <= 0', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 0,
        params: { triggerPriceCents: 30 },
      },
    });
    expect(res.isError).toBe(true);
  });

  it('returns error when watcher not initialized', async () => {
    resetWatcherForTests();
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
      },
    });
    expect(res.isError).toBe(true);
    const text = res.content[0]?.text ?? '';
    expect(text).toMatch(/not initialized/i);
  });
});

// ── kea_synthetic_list ────────────────────────────────────────────────────────

describe('kea_synthetic_list', () => {
  it('returns empty array initially', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_list', arguments: {} });
    expect(parseJsonResult(res)).toEqual([]);
  });

  it('returns registered synthetics', async () => {
    const { client } = await connect();
    await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'take_profit',
        ticker: 'TEST-Y',
        side: 'no',
        positionSize: 5,
        params: { triggerPriceCents: 70 },
      },
    });
    const res = await client.callTool({ name: 'kea_synthetic_list', arguments: {} });
    const list = parseJsonResult(res);
    expect(list).toHaveLength(1);
    expect(list[0].kind).toBe('take_profit');
    expect(list[0].status).toBe('armed');
  });

  it('returns error when watcher not initialized', async () => {
    resetWatcherForTests();
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_list', arguments: {} });
    expect(res.isError).toBe(true);
  });
});

// ── kea_synthetic_get ─────────────────────────────────────────────────────────

describe('kea_synthetic_get', () => {
  it('returns the synthetic after register', async () => {
    const { client } = await connect();
    const regRes = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'trailing_stop',
        ticker: 'TEST-Z',
        side: 'yes',
        positionSize: 20,
        params: { trailCents: 5 },
      },
    });
    const { id } = parseJsonResult(regRes);
    const getRes = await client.callTool({ name: 'kea_synthetic_get', arguments: { id } });
    const synthetic = parseJsonResult(getRes);
    expect(synthetic.id).toBe(id);
    expect(synthetic.kind).toBe('trailing_stop');
  });

  it('returns null for unknown id', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_get', arguments: { id: 'syn-does-not-exist' } });
    expect(parseJsonResult(res)).toBeNull();
  });

  it('returns error when watcher not initialized', async () => {
    resetWatcherForTests();
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_get', arguments: { id: 'syn-x' } });
    expect(res.isError).toBe(true);
  });
});

// ── kea_synthetic_cancel ──────────────────────────────────────────────────────

describe('kea_synthetic_cancel', () => {
  it('cancels an armed synthetic', async () => {
    const { client } = await connect();
    const regRes = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'stop_limit',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 25, limitPriceCents: 20, size: 10 },
      },
    });
    const { id } = parseJsonResult(regRes);
    const cancelRes = await client.callTool({ name: 'kea_synthetic_cancel', arguments: { id } });
    expect(parseJsonResult(cancelRes)).toEqual({ canceled: true });
  });

  it('returns { canceled: false } for unknown id', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_cancel', arguments: { id: 'syn-nope' } });
    expect(parseJsonResult(res)).toEqual({ canceled: false });
  });

  it('register → get → cancel round-trip: status becomes canceled', async () => {
    const { client } = await connect();
    const regRes = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
      },
    });
    const { id } = parseJsonResult(regRes);

    await client.callTool({ name: 'kea_synthetic_cancel', arguments: { id } });

    const getRes = await client.callTool({ name: 'kea_synthetic_get', arguments: { id } });
    const synth = parseJsonResult(getRes);
    expect(synth.status).toBe('canceled');
  });

  it('returns { canceled: false } on double-cancel', async () => {
    const { client } = await connect();
    const regRes = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
      },
    });
    const { id } = parseJsonResult(regRes);
    await client.callTool({ name: 'kea_synthetic_cancel', arguments: { id } });
    const res2 = await client.callTool({ name: 'kea_synthetic_cancel', arguments: { id } });
    expect(parseJsonResult(res2)).toEqual({ canceled: false });
  });

  it('returns error when watcher not initialized', async () => {
    resetWatcherForTests();
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_cancel', arguments: { id: 'syn-x' } });
    expect(res.isError).toBe(true);
  });
});

// ── kea_synthetic_preview ─────────────────────────────────────────────────────

describe('kea_synthetic_preview', () => {
  const crossingBook = {
    yes: [{ priceCents: 25, size: 50 }],   // top bid = 25
    no: [{ priceCents: 75, size: 50 }],
  };

  const highBook = {
    yes: [{ priceCents: 60, size: 50 }],   // top bid = 60, above trigger
    no: [{ priceCents: 40, size: 50 }],
  };

  it('wouldFireNow=true when stop_loss top bid <= triggerPriceCents', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_preview',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
        book: crossingBook,
      },
    });
    const parsed = parseJsonResult(res);
    expect(parsed.wouldFireNow).toBe(true);
    expect(parsed.topBidCents).toBe(25);
  });

  it('wouldFireNow=false when stop_loss top bid > triggerPriceCents', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_preview',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
        book: highBook,
      },
    });
    const parsed = parseJsonResult(res);
    expect(parsed.wouldFireNow).toBe(false);
    expect(parsed.topBidCents).toBe(60);
  });

  it('returns topBidCents=0 on empty book', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_preview',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
        book: { yes: [], no: [] },
      },
    });
    const parsed = parseJsonResult(res);
    expect(parsed.topBidCents).toBe(0);
  });

  it('returns isError on invalid kind', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_preview',
      arguments: {
        kind: 'not_real',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: {},
        book: crossingBook,
      },
    });
    expect(res.isError).toBe(true);
  });

  it('does not require watcher to be initialized (pure evaluate call)', async () => {
    resetWatcherForTests();
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_synthetic_preview',
      arguments: {
        kind: 'stop_loss',
        ticker: 'TEST-X',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
        book: crossingBook,
      },
    });
    // Preview is stateless — works without watcher.
    expect(res.isError).toBeFalsy();
    const parsed = parseJsonResult(res);
    expect(parsed.wouldFireNow).toBe(true);
  });
});
