/**
 * Phase 4 Track C — rich MCP synthetic tools.
 * Tests kea_bracket_arm, kea_trailing_status, kea_synthetic_history.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Watcher } from '../../src/watcher.js';
import { getWatcher, setWatcherForTests, resetWatcherForTests } from '../../src/watcherSingleton.js';
import type { KalshiClientLike, Orderbook, WatcherConfig } from '../../src/types.js';

function makeMockClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async (): Promise<Orderbook> => ({
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

async function connect() {
  const { buildMcpServer } = await import('../../src/mcp.js');
  const server = buildMcpServer();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-synthetics-rich', version: '0.0.0' });
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  return { client };
}

function parseJsonResult(res: { content: Array<{ type: string; text?: string }> }) {
  const text = res.content[0]?.text ?? '';
  return JSON.parse(text);
}

let keaHomeDir: string;

beforeEach(() => {
  keaHomeDir = mkdtempSync(join(tmpdir(), 'mcp-rich-'));
  process.env.KEA_HOME = keaHomeDir;
  setWatcherForTests(new Watcher(makeMockClient(), baseCfg));
});

afterEach(() => {
  resetWatcherForTests();
  rmSync(keaHomeDir, { recursive: true, force: true });
  delete process.env.KEA_HOME;
  vi.clearAllMocks();
});

// ── kea_bracket_arm ──────────────────────────────────────────────────────────

describe('kea_bracket_arm', () => {
  it('registers a bracket and returns the parent id', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_bracket_arm',
      arguments: {
        ticker: 'TEST-X', side: 'yes', positionSize: 100,
        takeProfitCents: 70, stopLossCents: 30,
      },
    });
    const parsed = parseJsonResult(res);
    expect(parsed.id).toMatch(/^syn-/);

    // verify it expanded into 2 children via list
    const listRes = await client.callTool({ name: 'kea_synthetic_list', arguments: {} });
    const all = parseJsonResult(listRes);
    expect(all).toHaveLength(3);  // parent + 2 children
    const children = all.filter((s: { parentId?: string }) => s.parentId === parsed.id);
    expect(children).toHaveLength(2);
    expect(children.map((c: { kind: string }) => c.kind).sort()).toEqual(['stop_loss', 'take_profit']);
  });

  it('returns isError when watcher not initialized', async () => {
    resetWatcherForTests();
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_bracket_arm',
      arguments: {
        ticker: 'TEST-X', side: 'yes', positionSize: 100,
        takeProfitCents: 70, stopLossCents: 30,
      },
    });
    expect(res.isError).toBe(true);
  });
});

// ── kea_trailing_status ──────────────────────────────────────────────────────

describe('kea_trailing_status', () => {
  it('returns peak/current/stop/distance for a registered trailing-stop', async () => {
    const { client } = await connect();
    const reg = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'trailing_stop', ticker: 'TEST-X', side: 'yes',
        positionSize: 10, params: { trailCents: 5, floorPriceCents: 1 },
      },
    });
    const { id } = parseJsonResult(reg);

    // Manually seed peak via the watcher state — simulate prior tick at peak=60
    const w = setupTrailingPeak(id, 60);

    const res = await client.callTool({
      name: 'kea_trailing_status',
      arguments: {
        id,
        book: { yes: [{ priceCents: 58, size: 10 }], no: [] },
      },
    });
    const parsed = parseJsonResult(res);
    expect(parsed.peakBidCentsExact).toBe(60);
    expect(parsed.currentBidCentsExact).toBe(58);
    expect(parsed.stopPriceCentsExact).toBe(55);  // max(60-5, 1)
    expect(parsed.distanceCentsExact).toBe(3);  // 58 - 55

    void w;
  });

  it('initializes peak from current bid when state is empty', async () => {
    const { client } = await connect();
    const reg = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'trailing_stop', ticker: 'TEST-X', side: 'yes',
        positionSize: 10, params: { trailCents: 5 },
      },
    });
    const { id } = parseJsonResult(reg);

    const res = await client.callTool({
      name: 'kea_trailing_status',
      arguments: { id, book: { yes: [{ priceCents: 50, size: 10 }], no: [] } },
    });
    const parsed = parseJsonResult(res);
    expect(parsed.peakBidCentsExact).toBe(50);
    expect(parsed.stopPriceCentsExact).toBe(45);
  });

  it('returns isError when synthetic is not trailing_stop', async () => {
    const { client } = await connect();
    const reg = await client.callTool({
      name: 'kea_synthetic_register',
      arguments: {
        kind: 'stop_loss', ticker: 'TEST-X', side: 'yes',
        positionSize: 10, params: { triggerPriceCents: 30 },
      },
    });
    const { id } = parseJsonResult(reg);

    const res = await client.callTool({
      name: 'kea_trailing_status',
      arguments: { id, book: { yes: [{ priceCents: 50, size: 10 }], no: [] } },
    });
    expect(res.isError).toBe(true);
  });

  it('returns isError when synthetic id is unknown', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'kea_trailing_status',
      arguments: { id: 'syn-nonexistent', book: { yes: [], no: [] } },
    });
    expect(res.isError).toBe(true);
  });
});

// ── kea_synthetic_history ────────────────────────────────────────────────────

describe('kea_synthetic_history', () => {
  it('returns empty entries when journal does not exist', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_history', arguments: {} });
    const parsed = parseJsonResult(res);
    expect(parsed.entries).toEqual([]);
  });

  it('reads journal and returns entries', async () => {
    const journalPath = join(keaHomeDir, 'watchers.ndjson');
    writeFileSync(journalPath, [
      JSON.stringify({ kind: 'synthetic_registered', ts: '2026-05-05T00:00:00Z', synthetic: { id: 's1', ticker: 'KX', kind: 'stop_loss' } }),
      JSON.stringify({ kind: 'synthetic_fire_pending', ts: '2026-05-05T00:00:01Z', id: 's1', reason: 'evaluator_fired' }),
      JSON.stringify({ kind: 'synthetic_fired', ts: '2026-05-05T00:00:02Z', id: 's1', reason: 'evaluator_fired' }),
    ].join('\n') + '\n');

    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_history', arguments: {} });
    const parsed = parseJsonResult(res);
    expect(parsed.entries).toHaveLength(3);
    expect(parsed.totalCount).toBe(3);
  });

  it('filters by ticker', async () => {
    const journalPath = join(keaHomeDir, 'watchers.ndjson');
    writeFileSync(journalPath, [
      JSON.stringify({ kind: 'synthetic_registered', synthetic: { id: 's1', ticker: 'KX', kind: 'stop_loss' } }),
      JSON.stringify({ kind: 'synthetic_registered', synthetic: { id: 's2', ticker: 'KY', kind: 'stop_loss' } }),
      JSON.stringify({ kind: 'synthetic_fired', id: 's1', reason: 'r' }),
      JSON.stringify({ kind: 'synthetic_fired', id: 's2', reason: 'r' }),
    ].join('\n') + '\n');

    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_history', arguments: { ticker: 'KX' } });
    const parsed = parseJsonResult(res);
    expect(parsed.filteredCount).toBe(2);  // 1 registered + 1 fired for KX
    expect(parsed.totalCount).toBe(4);
  });

  it('honors limit (last N entries)', async () => {
    const journalPath = join(keaHomeDir, 'watchers.ndjson');
    const lines = Array.from({ length: 10 }, (_, i) =>
      JSON.stringify({ kind: 'synthetic_registered', synthetic: { id: `s${i}`, ticker: 'KX', kind: 'stop_loss' } }),
    );
    writeFileSync(journalPath, lines.join('\n') + '\n');

    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_history', arguments: { limit: 3 } });
    const parsed = parseJsonResult(res);
    expect(parsed.entries).toHaveLength(3);
    // last 3 — s7, s8, s9
    const ids = parsed.entries.map((e: { synthetic?: { id: string } }) => e.synthetic?.id);
    expect(ids).toEqual(['s7', 's8', 's9']);
  });

  it('skips malformed lines silently', async () => {
    const journalPath = join(keaHomeDir, 'watchers.ndjson');
    writeFileSync(journalPath,
      'not-json\n' +
      JSON.stringify({ kind: 'synthetic_registered', synthetic: { id: 's1', ticker: 'KX', kind: 'stop_loss' } }) + '\n' +
      '{broken\n',
    );
    const { client } = await connect();
    const res = await client.callTool({ name: 'kea_synthetic_history', arguments: {} });
    const parsed = parseJsonResult(res);
    expect(parsed.entries).toHaveLength(1);
  });
});

// ── helpers ──────────────────────────────────────────────────────────────────

function setupTrailingPeak(id: string, peak: number): void {
  const s = getWatcher().get(id);
  if (s) s.state = { peakBidCentsExact: peak };
}
