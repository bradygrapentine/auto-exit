/**
 * MCP edge tools — kea_edge_summary, kea_edge_per_strategy.
 *
 * Uses InMemoryTransport. Journal reads are mocked via KEA_HOME temp dir so
 * no real file I/O depends on the operator's home directory.
 */

import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../src/kalshiClient.js', () => ({
  KalshiClient: vi.fn().mockImplementation(() => ({
    getOrderbook: vi.fn(async () => ({ yes: [], no: [] })),
    getPosition: vi.fn(async () => ({ ticker: 'KXTEST', side: 'yes' as const, quantity: 0 })),
  })),
}));

vi.mock('../../src/aggressive.js', () => ({
  AggressiveRunner: vi.fn().mockImplementation(() => ({
    run: vi.fn(async () => ({ filled: 0, avgPriceCents: 0, slippageCents: 0 })),
  })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

let tmpDir: string;

function makeJobEntries(opts: {
  jobId: string;
  strategy: string;
  ticker: string;
  entryPriceCents: number;
  exitPriceCents: number;
  size: number;
  resolutionPriceCents?: number;
}): object[] {
  const ts = new Date(parseInt(opts.jobId.split('-')[0] ?? '0', 10)).toISOString();
  return [
    {
      ts,
      kind: 'loop_started',
      data: { jobId: opts.jobId, ticker: opts.ticker, strategy: opts.strategy, side: 'yes' },
    },
    {
      ts,
      kind: 'order_reconciled',
      data: {
        jobId: opts.jobId,
        executedPriceCents: opts.entryPriceCents,
        filledCount: opts.size,
        action: 'buy',
      },
    },
    {
      ts,
      kind: 'order_reconciled',
      data: {
        jobId: opts.jobId,
        executedPriceCents: opts.exitPriceCents,
        filledCount: opts.size,
        action: 'sell',
        resolutionPriceCents: opts.resolutionPriceCents ?? opts.exitPriceCents,
      },
    },
  ];
}

function writeJobFile(jobId: string, entries: object[]): void {
  const jobsDir = path.join(tmpDir, 'jobs');
  fs.mkdirSync(jobsDir, { recursive: true });
  const content = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(path.join(jobsDir, `${jobId}.jsonl`), content, 'utf8');
}

// Use a timestamp far in the past so since-filter defaults (30d window) include them
const BASE_TS = Date.now() - 5 * 24 * 60 * 60 * 1000; // 5 days ago

async function connect() {
  const { buildMcpServer } = await import('../../src/mcp.js');
  const server = buildMcpServer();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-edge', version: '0.0.0' });
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  return { client, server };
}

function parseJsonResult(res: { content: Array<{ type: string; text?: string }> }) {
  const text = res.content[0]?.text ?? '';
  return JSON.parse(text);
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-edge-test-'));
  process.env['KEA_HOME'] = tmpDir;
  vi.resetModules();
});

afterEach(() => {
  delete process.env['KEA_HOME'];
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

// ── kea_edge_summary ──────────────────────────────────────────────────────────

describe('kea_edge_summary', () => {
  it('returns empty strategies array when no job files exist', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_edge_summary', arguments: {} });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('strategies');
    expect(result.strategies).toEqual([]);
    expect(result.totalFires).toBe(0);
  });

  it('groups fires by strategy and returns per-strategy rows', async () => {
    const jobId1 = `${BASE_TS}-aabb1100`;
    const jobId2 = `${BASE_TS + 1000}-ccdd2200`;
    writeJobFile(jobId1, makeJobEntries({ jobId: jobId1, strategy: 's-trail', ticker: 'KXTEST', entryPriceCents: 40, exitPriceCents: 60, size: 10, resolutionPriceCents: 100 }));
    writeJobFile(jobId2, makeJobEntries({ jobId: jobId2, strategy: 's-trail', ticker: 'KXTEST', entryPriceCents: 45, exitPriceCents: 55, size: 5, resolutionPriceCents: 100 }));

    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_edge_summary', arguments: {} });
    const result = parseJsonResult(res);
    expect(result.totalFires).toBe(2);
    expect(result.strategies).toHaveLength(1);
    expect(result.strategies[0].strategy).toBe('s-trail');
    expect(result.strategies[0].fires).toBe(2);
  });

  it('separates fires from different strategies into distinct rows', async () => {
    const jobId1 = `${BASE_TS}-aabb0001`;
    const jobId2 = `${BASE_TS + 1000}-ccdd0002`;
    writeJobFile(jobId1, makeJobEntries({ jobId: jobId1, strategy: 's-trail', ticker: 'KXTEST', entryPriceCents: 40, exitPriceCents: 80, size: 10, resolutionPriceCents: 100 }));
    writeJobFile(jobId2, makeJobEntries({ jobId: jobId2, strategy: 's-aggressive', ticker: 'KXTEST2', entryPriceCents: 50, exitPriceCents: 70, size: 5, resolutionPriceCents: 100 }));

    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_edge_summary', arguments: {} });
    const result = parseJsonResult(res);
    expect(result.totalFires).toBe(2);
    expect(result.strategies).toHaveLength(2);
    const names = result.strategies.map((s: { strategy: string }) => s.strategy).sort();
    expect(names).toEqual(['s-aggressive', 's-trail']);
  });

  it('attaches noiseWarning when any strategy has fewer than 5 fires', async () => {
    const jobId = `${BASE_TS}-noise0001`;
    writeJobFile(jobId, makeJobEntries({ jobId, strategy: 's-trail', ticker: 'KXTEST', entryPriceCents: 40, exitPriceCents: 60, size: 10, resolutionPriceCents: 100 }));

    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_edge_summary', arguments: {} });
    const result = parseJsonResult(res);
    expect(result).toHaveProperty('noiseWarning');
    expect(typeof result.noiseWarning).toBe('string');
  });
});

// ── kea_edge_per_strategy ─────────────────────────────────────────────────────

describe('kea_edge_per_strategy', () => {
  it('returns zero-fire message when strategy has no matching fires', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_edge_per_strategy', arguments: { strategy: 's-nonexistent' } });
    const result = parseJsonResult(res);
    expect(result.fires).toBe(0);
    expect(result).toHaveProperty('message');
  });

  it('returns components and market segmentation for matching fires', async () => {
    const jobId = `${BASE_TS}-perst001`;
    writeJobFile(jobId, makeJobEntries({ jobId, strategy: 's-trail', ticker: 'KXTEST', entryPriceCents: 40, exitPriceCents: 70, size: 10, resolutionPriceCents: 100 }));

    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_edge_per_strategy', arguments: { strategy: 's-trail' } });
    const result = parseJsonResult(res);
    expect(result.strategy).toBe('s-trail');
    expect(result.fires).toBe(1);
    expect(Array.isArray(result.components)).toBe(true);
    expect(result.components[0]).toHaveProperty('realizedPnLDollars');
    expect(Array.isArray(result.marketSegmentation)).toBe(true);
    expect(Array.isArray(result.triggerHistogram)).toBe(true);
  });
});
