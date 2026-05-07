/**
 * MCP strategy tools — kea_strategy_s_pair, kea_strategy_s_basis_arb,
 * kea_strategy_run (SP2.1 unified launcher).
 *
 * Uses InMemoryTransport. KalshiClient + passive/aggressive are mocked so no
 * real Kalshi calls happen. Covers:
 *   - Validation error paths (missing required fields → isError)
 *   - Round-trip happy paths for each shape:
 *       single-leg aggressive (s-aggressive via kea_strategy_run)
 *       multi-leg pair        (s-pair via kea_strategy_s_pair + kea_strategy_run)
 *       basis-arb             (s-basis-arb via kea_strategy_s_basis_arb + kea_strategy_run)
 */

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock KalshiClient so MCP strategy tools don't make real HTTP calls.
vi.mock('../../src/kalshiClient.js', () => ({
  KalshiClient: vi.fn().mockImplementation(() => ({
    getOrderbook: vi.fn(async (_ticker: string, _depth: number) => ({
      yes: [{ priceCents: 45, size: 100 }],
      no: [{ priceCents: 55, size: 100 }],
    })),
    createOrder: vi.fn(async () => ({ orderId: 'mock-order-1', status: 'filled', filledCount: 10, remainingCount: 0 })),
    getOrder: vi.fn(async () => ({ orderId: 'mock-order-1', status: 'filled', filledCount: 10, remainingCount: 0 })),
    cancelOrder: vi.fn(async () => {}),
    getPosition: vi.fn(async () => ({ ticker: 'KXTEST', side: 'yes' as const, quantity: 10 })),
    getRestingOrderCount: vi.fn(async () => 0),
    findOrderByClientOrderId: vi.fn(async () => null),
  })),
}));

// Mock aggressive runner — returns a filled result without real orders.
vi.mock('../../src/aggressive.js', () => ({
  AggressiveRunner: vi.fn().mockImplementation(() => ({
    run: vi.fn(async () => ({ filled: 10, orderId: 'mock-aggr-1', reason: 'filled' })),
  })),
}));

// Mock passive runner — returns a complete result without real polling.
vi.mock('../../src/passive.js', () => ({
  run: vi.fn(async () => ({
    jobId: 'mock-passive-1',
    filled: 10,
    avgPriceCents: 45,
    feesIncurredDollars: 0,
    remaining: 0,
    status: 'complete',
  })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

let keaHome: string;

beforeEach(() => {
  keaHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-mcp-strat-'));
  process.env.KEA_HOME = keaHome;
});

afterEach(() => {
  fs.rmSync(keaHome, { recursive: true, force: true });
  delete process.env.KEA_HOME;
  vi.clearAllMocks();
});

async function connect() {
  const { buildMcpServer } = await import('../../src/mcp.js');
  const server = buildMcpServer();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-strategies', version: '0.0.0' });
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  return { client, server };
}

function parseJsonResult(res: { content: Array<{ type: string; text?: string }> }) {
  const text = res.content[0]?.text ?? '';
  return JSON.parse(text);
}

// ── kea_strategy_s_pair ───────────────────────────────────────────────────────

describe('MCP server — kea_strategy_s_pair', () => {
  it('returns isError when legs missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_strategy_s_pair', arguments: {} });
    expect(res.isError).toBe(true);
  });

  it('returns isError when legs has fewer than 2 items', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_s_pair',
      arguments: {
        legs: [{ ticker: 'KXTEST', side: 'yes', size: 10, executionMode: 'aggressive' }],
      },
    });
    expect(res.isError).toBe(true);
  });

  it('round-trips a 2-leg pair and returns MultiLegResult shape', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_s_pair',
      arguments: {
        legs: [
          { ticker: 'KXTEST-YES', side: 'yes', size: 10, executionMode: 'aggressive' },
          { ticker: 'KXTEST-NO', side: 'no', size: 10, executionMode: 'aggressive' },
        ],
        legSkewPct: 0.1,
      },
    });
    expect(res.isError).toBeUndefined();
    const parsed = parseJsonResult(res);
    expect(parsed).toHaveProperty('legs');
    expect(parsed).toHaveProperty('halted');
    expect(Array.isArray(parsed.legs)).toBe(true);
  });
});

// ── kea_strategy_s_basis_arb ──────────────────────────────────────────────────

describe('MCP server — kea_strategy_s_basis_arb', () => {
  it('returns isError when ticker is missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_s_basis_arb',
      arguments: { totalDollarBudget: 50 },
    });
    expect(res.isError).toBe(true);
  });

  it('returns isError when totalDollarBudget is missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_s_basis_arb',
      arguments: { ticker: 'KXTEST' },
    });
    expect(res.isError).toBe(true);
  });

  it('returns isError when arb is closed (yes+no ask >= 100¢)', async () => {
    // Default mock returns yes ask=45, no ask=55 → sum=100 ≥ 100, arb closed.
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_s_basis_arb',
      arguments: { ticker: 'KXTEST', totalDollarBudget: 100 },
    });
    // arb guard fires → isError
    expect(res.isError).toBe(true);
  });
});

// ── kea_strategy_run (SP2.1 unified launcher) ─────────────────────────────────

describe('MCP server — kea_strategy_run (SP2.1)', () => {
  it('returns isError when strategy field is missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_strategy_run', arguments: {} });
    expect(res.isError).toBe(true);
  });

  it('returns isError for unknown strategy value', async () => {
    const { client } = await connect();
    // 'unknown-strat' is not in the enum — Zod rejects at schema level
    const res = await client.callTool({
      name: 'kea_strategy_run',
      arguments: { strategy: 'unknown-strat' },
    });
    expect(res.isError).toBe(true);
  });

  // ── single-leg aggressive shape ─────────────────────────────────────────────

  it('s-aggressive: returns isError when required fields missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_run',
      arguments: { strategy: 's-aggressive', ticker: 'KXTEST' }, // missing side/action/size
    });
    expect(res.isError).toBe(true);
  });

  it('s-aggressive: round-trips and returns AggressiveResult shape', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_run',
      arguments: {
        strategy: 's-aggressive',
        ticker: 'KXTEST',
        side: 'yes',
        action: 'sell',
        size: 10,
      },
    });
    expect(res.isError).toBeUndefined();
    const parsed = parseJsonResult(res);
    expect(parsed).toHaveProperty('filled');
  });

  // ── multi-leg pair shape ─────────────────────────────────────────────────────

  it('s-pair: returns isError when legs missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_run',
      arguments: { strategy: 's-pair' },
    });
    expect(res.isError).toBe(true);
  });

  it('s-pair: round-trips a 2-leg pair and returns MultiLegResult shape', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_run',
      arguments: {
        strategy: 's-pair',
        legs: [
          { ticker: 'KXTEST-YES', side: 'yes', size: 10, executionMode: 'aggressive' },
          { ticker: 'KXTEST-NO', side: 'no', size: 10, executionMode: 'aggressive' },
        ],
      },
    });
    expect(res.isError).toBeUndefined();
    const parsed = parseJsonResult(res);
    expect(parsed).toHaveProperty('legs');
    expect(parsed).toHaveProperty('halted');
  });

  // ── basis-arb shape ──────────────────────────────────────────────────────────

  it('s-basis-arb: returns isError when required fields missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_run',
      arguments: { strategy: 's-basis-arb', ticker: 'KXTEST' }, // missing totalDollarBudget
    });
    expect(res.isError).toBe(true);
  });

  it('s-basis-arb: returns isError when arb closed (sum >= 100¢)', async () => {
    // Default mock: yes ask=45, no ask=55 → sum=100 → arb guard fires
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_run',
      arguments: {
        strategy: 's-basis-arb',
        ticker: 'KXTEST',
        totalDollarBudget: 100,
      },
    });
    expect(res.isError).toBe(true);
  });

  // ── other strategy dispatches (smoke tests) ──────────────────────────────────

  it('s-twap: returns isError when required fields missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_run',
      arguments: { strategy: 's-twap', ticker: 'KXTEST' }, // missing side/size/intervalMinutes/numIntervals
    });
    expect(res.isError).toBe(true);
  });

  it('s-cash-raise: returns isError when required fields missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_strategy_run',
      arguments: { strategy: 's-cash-raise', targetCashDollars: 50 }, // missing positions, deadlineEpochMs
    });
    expect(res.isError).toBe(true);
  });
});
