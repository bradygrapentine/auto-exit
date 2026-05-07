/**
 * MCP decision-layer tool tests — kea_portfolio_plan, kea_alert_register,
 * kea_recommend, kea_ev, kea_size.
 *
 * Uses InMemoryTransport so no real Kalshi calls happen.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Watcher } from '../../src/watcher.js';
import { setWatcherForTests, resetWatcherForTests } from '../../src/watcherSingleton.js';
import type { KalshiClientLike } from '../../src/types.js';

// ── mock client ───────────────────────────────────────────────────────────────

function makeMockClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async () => ({ yes: [{ priceCents: 50, size: 10 }], no: [] })),
    getPosition: vi.fn(async () => ({ ticker: 'KX', side: 'yes' as const, quantity: 10 })),
  } as any;
}

const baseCfg = {
  baseUrl: 'https://example.com',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
};

// ── MCP connect helper ────────────────────────────────────────────────────────

async function connect() {
  const { buildMcpServer } = await import('../../src/mcp.js');
  const server = buildMcpServer();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-decision', version: '0.0.0' });
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  return { client, server };
}

function parseJsonResult(res: { content: Array<{ type: string; text?: string }> }) {
  const text = res.content[0]?.text ?? '';
  return JSON.parse(text);
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  setWatcherForTests(new Watcher(makeMockClient(), baseCfg));
});

afterEach(() => {
  resetWatcherForTests();
  vi.clearAllMocks();
});

// ── kea_portfolio_plan ────────────────────────────────────────────────────────

describe('kea_portfolio_plan', () => {
  it('returns a ranked plan for valid input', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_portfolio_plan',
      arguments: {
        positions: [
          { ticker: 'KXABC', side: 'yes', size: 10 },
          { ticker: 'KXDEF', side: 'no', size: 5 },
        ],
        bidByTicker: { KXABC: 80, KXDEF: 40 },
        midProbabilities: { KXABC: 0.7, KXDEF: 0.4 },
      },
    });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('ranked');
    expect(result.ranked).toHaveLength(2);
    expect(result.ranked[0]).toHaveProperty('rank', 1);
    expect(result.ranked[0]).toHaveProperty('ticker');
    expect(result.ranked[0]).toHaveProperty('recommendedStrategy');
    expect(result).toHaveProperty('totalRaiseableDollars');
  });

  it('returns error for empty positions', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_portfolio_plan',
      arguments: {
        positions: [{ ticker: 'KXABC', side: 'yes', size: 10 }],
        bidByTicker: { KXABC: 80 },
        midProbabilities: { KXABC: 0.7 },
      },
    });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('ranked');
  });

  it('respects defaultStrategy override', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_portfolio_plan',
      arguments: {
        positions: [{ ticker: 'KXABC', side: 'yes', size: 10 }],
        bidByTicker: { KXABC: 80 },
        midProbabilities: { KXABC: 0.7 },
        defaultStrategy: 'aggressive',
      },
    });
    const result = parseJsonResult(res);
    expect(result.ranked[0].recommendedStrategy).toBe('aggressive');
  });
});

// ── kea_alert_register ────────────────────────────────────────────────────────

describe('kea_alert_register', () => {
  it('registers a stop_loss notify synthetic and returns an id', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_alert_register',
      arguments: {
        kind: 'stop_loss',
        ticker: 'KXABC',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
      },
    });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('id');
    expect(result.id).toMatch(/^syn-/);
  });

  it('registered synthetic has action=notify', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_alert_register',
      arguments: {
        kind: 'take_profit',
        ticker: 'KXABC',
        side: 'yes',
        positionSize: 5,
        params: { triggerPriceCents: 80 },
        notifyChannels: [{ kind: 'desktop' }],
      },
    });
    const { id } = parseJsonResult(res);
    // Verify via kea_synthetic_get
    const getRes = await client.callTool({
      name: 'kea_synthetic_get',
      arguments: { id },
    });
    const syn = parseJsonResult(getRes);
    expect(syn.action).toBe('notify');
    expect(syn.notifyChannels).toEqual([{ kind: 'desktop' }]);
  });

  it('defaults to desktop channel when notifyChannels not provided', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_alert_register',
      arguments: {
        kind: 'stop_loss',
        ticker: 'KXABC',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
      },
    });
    const { id } = parseJsonResult(res);
    const getRes = await client.callTool({ name: 'kea_synthetic_get', arguments: { id } });
    const syn = parseJsonResult(getRes);
    expect(syn.notifyChannels).toEqual([{ kind: 'desktop' }]);
  });
});

// ── kea_ev ────────────────────────────────────────────────────────────────────

describe('kea_ev', () => {
  it('computes enter-yes EV correctly', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_ev',
      arguments: {
        ticker: 'KXABC',
        bidCents: 60,
        askCents: 62,
        midProbability: 0.65,
        action: 'enter-yes',
      },
    });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('evDollars');
    expect(result).toHaveProperty('rationale');
    expect(typeof result.evDollars).toBe('number');
  });

  it('computes exit-aggressive EV with position', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_ev',
      arguments: {
        ticker: 'KXABC',
        bidCents: 60,
        askCents: 62,
        midProbability: 0.65,
        action: 'exit-aggressive',
        position: { side: 'yes', size: 10, costBasisCents: 50 },
      },
    });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('evDollars');
    expect(result.evDollars).toBeGreaterThan(0);
  });

  it('returns error for out-of-range midProbability', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_ev',
      arguments: {
        ticker: 'KXABC',
        bidCents: 60,
        askCents: 62,
        midProbability: 1.5,
        action: 'hold',
      },
    });
    expect(res.isError).toBe(true);
  });
});

// ── kea_size ──────────────────────────────────────────────────────────────────

describe('kea_size', () => {
  it('computes Kelly size for positive edge', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_size',
      arguments: {
        edgeProbability: 0.7,
        marketProbability: 0.5,
        bankrollDollars: 1000,
      },
    });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('fullKellyFractionOfBankroll');
    expect(result).toHaveProperty('recommendedFraction');
    expect(result).toHaveProperty('recommendedDollars');
    expect(result.recommendedDollars).toBeGreaterThan(0);
    expect(result.recommendedDollars).toBeLessThanOrEqual(1000);
  });

  it('respects fractionalKelly override', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_size',
      arguments: {
        edgeProbability: 0.7,
        marketProbability: 0.5,
        bankrollDollars: 1000,
        fractionalKelly: 0.25,
      },
    });
    const half = parseJsonResult(res);
    const res2 = await client.callTool({
      name: 'kea_size',
      arguments: {
        edgeProbability: 0.7,
        marketProbability: 0.5,
        bankrollDollars: 1000,
        fractionalKelly: 0.5,
      },
    });
    const full = parseJsonResult(res2);
    expect(half.recommendedDollars).toBeLessThan(full.recommendedDollars);
  });

  it('caps by maxPositionDollars', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_size',
      arguments: {
        edgeProbability: 0.9,
        marketProbability: 0.5,
        bankrollDollars: 10000,
        maxPositionDollars: 50,
      },
    });
    const result = parseJsonResult(res);
    expect(result.recommendedDollars).toBeLessThanOrEqual(50);
  });
});

// ── kea_recommend ─────────────────────────────────────────────────────────────

describe('kea_recommend', () => {
  it('returns ranked recommendations for positive edge', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_recommend',
      arguments: {
        ticker: 'KXABC',
        bidCents: 60,
        askCents: 62,
        midProbability: 0.65,
        marketProbability: 0.5,
        edgeProbability: 0.65,
        bankrollDollars: 1000,
        availableStrategies: ['s-passive', 's-aggressive'],
      },
    });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('returns noRecommendation when edge is negative', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_recommend',
      arguments: {
        ticker: 'KXABC',
        bidCents: 60,
        askCents: 62,
        midProbability: 0.3,
        marketProbability: 0.6,
        edgeProbability: 0.3,
        bankrollDollars: 1000,
        availableStrategies: ['s-passive', 's-aggressive'],
      },
    });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('noRecommendation');
    expect(result.recommendations).toHaveLength(0);
  });

  it('handles empty availableStrategies gracefully', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_recommend',
      arguments: {
        ticker: 'KXABC',
        bidCents: 60,
        askCents: 62,
        midProbability: 0.65,
        marketProbability: 0.5,
        edgeProbability: 0.65,
        bankrollDollars: 1000,
        availableStrategies: ['unknown-strat'],
      },
    });
    const result = parseJsonResult(res);
    expect(result.recommendations).toHaveLength(0);
    expect(result.noRecommendation).toBeDefined();
  });
});
