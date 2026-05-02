import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  BalanceSchema, PositionsSchema, RestingOrdersSchema, OrderbookSchema,
  PreviewSchema, JournalListSchema, JournalReadSchema, ReplaySchema, WhoamiSchema,
} from '../../scripts/mcp-smoke-schemas.js';
import { spawnClient, runCase, recordLatency, type HarnessCase } from './runner.js';

const CASES: HarnessCase[] = [
  { name: 'kea_whoami',         schema: WhoamiSchema,        args: {} },
  { name: 'kea_balance',        schema: BalanceSchema,       args: {} },
  { name: 'kea_positions',      schema: PositionsSchema,     args: {} },
  { name: 'kea_resting_orders', schema: RestingOrdersSchema, args: {} },
  { name: 'kea_journal_list',   schema: JournalListSchema,   args: {} },
  { name: 'kea_orderbook',      schema: OrderbookSchema,
    argsResolver: (s) => s.firstTicker ? { ticker: s.firstTicker, depth: 5 } : null },
  { name: 'kea_preview',        schema: PreviewSchema,
    argsResolver: (s) => s.firstTicker ? { ticker: s.firstTicker, side: 'yes', size: 1 } : null },
  { name: 'kea_journal_read',   schema: JournalReadSchema,
    argsResolver: (s) => s.firstJobId ? { jobId: s.firstJobId } : null },
  { name: 'kea_replay',         schema: ReplaySchema,
    argsResolver: (s) => s.firstJobId ? { jobId: s.firstJobId } : null },
];

describe.runIf(process.env.HARNESS === '1')('MCP read-only harness', () => {
  let client: Client;
  let close: () => Promise<void>;
  const state: Record<string, unknown> = {};

  beforeAll(async () => {
    const r = await spawnClient();
    client = r.client; close = r.close;
  });
  afterAll(async () => { await close(); });

  for (const c of CASES) {
    it(c.name, async () => {
      const result = await runCase(client, c, state);
      if (result.status === 'SKIP') return;
      expect(result.schemaError, `schema error: ${result.schemaError}`).toBeUndefined();
      expect(result.drift ?? [], `schema drift: ${(result.drift ?? []).join(', ')}`).toEqual([]);
      expect(result.latencyExceeded, JSON.stringify(result.latencyExceeded)).toBeUndefined();
      recordLatency(c.name, result.ms);

      // Populate state for downstream cases.
      // (Harness is single-process so test order matters — Vitest runs serially within a describe by default.)
      // Re-fetch parsed payload for state extraction:
      if (c.name === 'kea_positions' || c.name === 'kea_journal_list') {
        const r2 = await client.callTool({ name: c.name, arguments: {} });
        const parsed = JSON.parse((r2.content?.[0] as { text: string }).text);
        if (c.name === 'kea_positions' && Array.isArray(parsed) && parsed.length > 0) state.firstTicker = parsed[0].ticker;
        if (c.name === 'kea_journal_list' && Array.isArray(parsed) && parsed.length > 0) state.firstJobId = parsed[0].jobId;
      }
    });
  }
});
