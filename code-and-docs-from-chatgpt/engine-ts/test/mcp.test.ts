/**
 * MCP server tests — drive tool calls via an in-memory client↔server transport
 * pair, with the api + replay modules mocked so no real Kalshi calls happen.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

vi.mock('../src/tui/api.js', () => ({
  fetchBalance: vi.fn(async () => ({ balanceDollars: 100, portfolioValueDollars: 200 })),
  fetchPositions: vi.fn(async () => ([{ ticker: 'KXA', side: 'YES', quantity: 5, exposureDollars: 1, feesPaidDollars: 0, realizedPnlDollars: 0, restingOrdersCount: 0, rawPosition: 5 }])),
  fetchRestingOrders: vi.fn(async () => ([])),
  fetchOrderbook: vi.fn(async (ticker: string, depth: number) => ({ yes: [{ priceCents: 30, size: 100 }], no: [], _echo: { ticker, depth } } as unknown)),
  fetchPreview: vi.fn(async (ticker: string, side: string, size: number) => ({
    topBidCents: 30, decisionSize: size, decisionPriceDollars: '0.3000', decisionReason: 'top_bid',
    grossDollars: 1.5, feesDollars: 0.05, netDollars: 1.45, effectiveRatePct: 3.33,
    perLevel: [{ priceCents: 30, size, fillCount: size, revenueDollars: 1.5, feesDollars: 0.05 }],
    _echo: { ticker, side },
  })),
  listJournalSummaries: vi.fn((limit?: number) => ([{ jobId: `mock-${limit ?? 20}`, ticker: 'KXA', startedAt: 't0', lastTs: 't1', lastKind: 'loop_finished', finished: true, entries: 3, filePath: '/tmp/x' }])),
}));

vi.mock('../src/replay.js', () => ({
  loadJournalReplay: vi.fn((fp: string) => ({
    jobId: path.basename(fp, '.jsonl'),
    ticker: 'KXA', side: 'yes', initialPosition: 5, skipped: 0,
    entries: [{
      ts: 't', orderId: 'o1', ticker: 'KXA', side: 'yes', remaining: 5,
      orderbook: { yes: [{ priceCents: 30, size: 100 }], no: [] },
      recordedDecision: { chunkSize: 5, priceCents: 30, priceCentsExact: 30, priceDollars: '0.3000', cumulativeSizeAtPrice: 100, reason: 'top_bid' },
    }],
  })),
  replayAll: vi.fn(() => ([
    { entry: { ts: 't', orderId: 'o1' }, recomputed: {}, projection: {}, decisionMatches: true, decisionDiff: [] },
  ])),
}));

let keaHome: string;

async function connect() {
  const { buildMcpServer } = await import('../src/mcp.js');
  const server = buildMcpServer();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  return { client, server };
}

function parseJsonResult(res: { content: Array<{ type: string; text?: string }> }) {
  const text = res.content[0]?.text ?? '';
  return JSON.parse(text);
}

beforeEach(() => {
  keaHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-mcp-'));
  process.env.KEA_HOME = keaHome;
});
afterEach(() => {
  fs.rmSync(keaHome, { recursive: true, force: true });
  delete process.env.KEA_HOME;
  vi.clearAllMocks();
});

describe('MCP server — tool registration', () => {
  it('registers the expected read-only tool surface', async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'kea_balance', 'kea_journal_list', 'kea_journal_read',
      'kea_orderbook', 'kea_positions', 'kea_preview',
      'kea_replay', 'kea_resting_orders',
    ]);
    // No mutating tool is exposed in this slice.
    expect(names.find((n) => /create|cancel|exit|sell|buy/.test(n))).toBeUndefined();
  });
});

describe('MCP server — read-only tools', () => {
  it('kea_balance returns balance JSON', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_balance', arguments: {} });
    expect(parseJsonResult(res)).toEqual({ balanceDollars: 100, portfolioValueDollars: 200 });
  });

  it('kea_positions returns positions JSON', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_positions', arguments: {} });
    const parsed = parseJsonResult(res);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].ticker).toBe('KXA');
  });

  it('kea_resting_orders returns array', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_resting_orders', arguments: {} });
    expect(parseJsonResult(res)).toEqual([]);
  });

  it('kea_orderbook passes ticker and depth through', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_orderbook', arguments: { ticker: 'KXA', depth: 5 } });
    const parsed = parseJsonResult(res);
    expect(parsed._echo).toEqual({ ticker: 'KXA', depth: 5 });
  });

  it('kea_orderbook applies default depth=10 when not provided', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_orderbook', arguments: { ticker: 'KXA' } });
    const parsed = parseJsonResult(res);
    expect(parsed._echo.depth).toBe(10);
  });

  it('kea_orderbook rejects invalid args', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_orderbook', arguments: { ticker: '' } });
    expect(res.isError).toBe(true);
  });

  it('kea_preview returns full projection', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_preview', arguments: { ticker: 'KXA', side: 'yes', size: 10 } });
    const parsed = parseJsonResult(res);
    expect(parsed.decisionSize).toBe(10);
    expect(parsed._echo).toEqual({ ticker: 'KXA', side: 'yes' });
  });

  it('kea_preview rejects invalid side', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_preview', arguments: { ticker: 'KXA', side: 'maybe', size: 1 } });
    expect(res.isError).toBe(true);
  });

  it('kea_journal_list passes limit', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_journal_list', arguments: { limit: 5 } });
    const parsed = parseJsonResult(res);
    expect(parsed[0].jobId).toBe('mock-5');
  });

  it('kea_journal_read returns parsed entries', async () => {
    const jobs = path.join(keaHome, 'jobs');
    fs.mkdirSync(jobs, { recursive: true });
    fs.writeFileSync(path.join(jobs, 'abc.jsonl'),
      JSON.stringify({ ts: 't', kind: 'loop_started', data: { ticker: 'X' } }) + '\n' +
      'malformed\n');
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_journal_read', arguments: { jobId: 'abc' } });
    const parsed = parseJsonResult(res);
    expect(parsed.jobId).toBe('abc');
    expect(parsed.entries).toHaveLength(1);
  });

  it('kea_journal_read returns isError when missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_journal_read', arguments: { jobId: 'nope' } });
    expect(res.isError).toBe(true);
    expect((res.content as Array<{ text: string }>)[0].text).toMatch(/not found/);
  });

  it('kea_replay returns allMatch=true for clean journal', async () => {
    const jobs = path.join(keaHome, 'jobs');
    fs.mkdirSync(jobs, { recursive: true });
    fs.writeFileSync(path.join(jobs, 'abc.jsonl'), 'placeholder\n'); // mock loadJournalReplay ignores content
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_replay', arguments: { jobId: 'abc' } });
    const parsed = parseJsonResult(res);
    expect(parsed.allMatch).toBe(true);
    expect(parsed.replayed).toBe(1);
    expect(parsed.mismatches).toEqual([]);
  });

  it('kea_replay isError when journal missing', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_replay', arguments: { jobId: 'nope' } });
    expect(res.isError).toBe(true);
  });
});

describe('MCP server — error surfacing', () => {
  it('surfaces api errors as isError content', async () => {
    const { fetchBalance } = await import('../src/tui/api.js');
    (fetchBalance as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('upstream 500'));
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_balance', arguments: {} });
    expect(res.isError).toBe(true);
    expect((res.content as Array<{ text: string }>)[0].text).toMatch(/upstream 500/);
  });

  it('surfaces fetchPositions error', async () => {
    const { fetchPositions } = await import('../src/tui/api.js');
    (fetchPositions as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('pos fail'));
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_positions', arguments: {} });
    expect(res.isError).toBe(true);
  });

  it('surfaces fetchRestingOrders error', async () => {
    const { fetchRestingOrders } = await import('../src/tui/api.js');
    (fetchRestingOrders as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('resting fail'));
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_resting_orders', arguments: {} });
    expect(res.isError).toBe(true);
  });

  it('surfaces fetchOrderbook error', async () => {
    const { fetchOrderbook } = await import('../src/tui/api.js');
    (fetchOrderbook as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('book fail'));
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_orderbook', arguments: { ticker: 'KXA' } });
    expect(res.isError).toBe(true);
  });

  it('surfaces fetchPreview error', async () => {
    const { fetchPreview } = await import('../src/tui/api.js');
    (fetchPreview as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('preview fail'));
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_preview', arguments: { ticker: 'KXA', side: 'yes', size: 1 } });
    expect(res.isError).toBe(true);
  });

  it('surfaces listJournalSummaries throw', async () => {
    const { listJournalSummaries } = await import('../src/tui/api.js');
    (listJournalSummaries as ReturnType<typeof vi.fn>).mockImplementationOnce(() => { throw new Error('disk fail'); });
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_journal_list', arguments: {} });
    expect(res.isError).toBe(true);
  });
});
