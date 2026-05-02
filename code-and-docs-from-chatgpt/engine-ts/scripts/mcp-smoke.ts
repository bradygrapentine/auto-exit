#!/usr/bin/env -S npx tsx
/**
 * MCP read-only smoke. Spawns src/mcp.ts as a subprocess via stdio, calls every
 * read-only tool against the user's active Kalshi profile, validates each
 * response against a Zod schema. Exits non-zero on any failure.
 *
 * Usage: npm run smoke:mcp
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';

const NO_CREDS_MESSAGE = 'No Kalshi credentials configured. Run `kea login` to connect.';
import {
  BalanceSchema, PositionsSchema, RestingOrdersSchema, OrderbookSchema,
  PreviewSchema, JournalListSchema, JournalReadSchema, ReplaySchema, WhoamiSchema,
} from './mcp-smoke-schemas.js';

interface Case {
  name: string;
  args: Record<string, unknown>;
  schema: z.ZodTypeAny;
  // Some tools require a real ticker / job id from the active account.
  // Resolved at runtime from kea_positions / kea_journal_list.
  argsResolver?: (state: SmokeState) => Record<string, unknown> | null;
}

interface SmokeState {
  firstTicker?: string;
  firstJobId?: string;
}

const CASES: Case[] = [
  { name: 'kea_whoami',         args: {}, schema: WhoamiSchema },
  { name: 'kea_balance',        args: {}, schema: BalanceSchema },
  { name: 'kea_positions',      args: {}, schema: PositionsSchema },
  { name: 'kea_resting_orders', args: {}, schema: RestingOrdersSchema },
  { name: 'kea_journal_list',   args: { limit: 20 }, schema: JournalListSchema },
  {
    name: 'kea_orderbook',
    args: {},
    argsResolver: (s) => s.firstTicker ? { ticker: s.firstTicker, depth: 5 } : null,
    schema: OrderbookSchema,
  },
  {
    name: 'kea_preview',
    args: {},
    // NOTE: the MCP tool uses `size` (not `positionSize`) per src/mcp.ts inputSchema.
    argsResolver: (s) => s.firstTicker ? { ticker: s.firstTicker, side: 'yes', size: 1 } : null,
    schema: PreviewSchema,
  },
  {
    name: 'kea_journal_read',
    args: {},
    argsResolver: (s) => s.firstJobId ? { jobId: s.firstJobId } : null,
    schema: JournalReadSchema,
  },
  {
    name: 'kea_replay',
    args: {},
    argsResolver: (s) => s.firstJobId ? { jobId: s.firstJobId } : null,
    schema: ReplaySchema,
  },
];

async function main() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', 'src/mcp.ts'],
  });
  const client = new Client({ name: 'mcp-smoke', version: '0.1.0' }, { capabilities: {} });
  await client.connect(transport);

  const tools = await client.listTools();
  process.stdout.write(`server reports ${tools.tools.length} tools\n\n`);

  // Phase 1: tools that need no resolver run first to populate state.
  const state: SmokeState = {};
  let pass = 0, fail = 0, skip = 0;
  const results: { name: string; ms: number; status: 'PASS' | 'FAIL' | 'SKIP'; detail?: string }[] = [];

  for (const c of CASES) {
    const args = c.argsResolver ? c.argsResolver(state) : c.args;
    if (args === null) {
      results.push({ name: c.name, ms: 0, status: 'SKIP', detail: 'no fixture available (empty positions/journal)' });
      skip += 1;
      continue;
    }
    const t0 = Date.now();
    try {
      const r = await client.callTool({ name: c.name, arguments: args });
      const text = (r.content?.[0] as { text: string } | undefined)?.text ?? '';
      // Server returns error text exactly "error: <message>" on auth failure.
      if (text === `error: ${NO_CREDS_MESSAGE}`) {
        results.push({ name: c.name, ms: Date.now() - t0, status: 'SKIP', detail: 'no credentials' });
        skip += 1;
        continue;
      }
      const parsed = JSON.parse(text);
      c.schema.parse(parsed);
      const ms = Date.now() - t0;
      results.push({ name: c.name, ms, status: 'PASS' });
      pass += 1;

      // Populate state from positions and journal_list to drive later cases.
      if (c.name === 'kea_positions' && Array.isArray(parsed) && parsed.length > 0) {
        state.firstTicker = parsed[0].ticker as string;
      }
      if (c.name === 'kea_journal_list' && Array.isArray(parsed) && parsed.length > 0) {
        state.firstJobId = (parsed[0] as { jobId: string }).jobId;
      }
    } catch (e) {
      const ms = Date.now() - t0;
      results.push({ name: c.name, ms, status: 'FAIL', detail: e instanceof Error ? e.message : String(e) });
      fail += 1;
    }
  }

  await client.close();

  // Report
  process.stdout.write('Results:\n');
  for (const r of results) {
    const tag = r.status === 'PASS' ? '\x1b[32m✓\x1b[0m' : r.status === 'FAIL' ? '\x1b[31m✗\x1b[0m' : '\x1b[33m–\x1b[0m';
    process.stdout.write(`  ${tag} ${r.name.padEnd(22)} ${String(r.ms).padStart(5)}ms  ${r.detail ?? ''}\n`);
  }
  process.stdout.write(`\n${pass} pass, ${fail} fail, ${skip} skip\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  // Skip gracefully when credentials are missing — useful for CI without secrets.
  if (e instanceof Error && e.message === NO_CREDS_MESSAGE) {
    process.stdout.write('skipped: no Kalshi credentials configured\n');
    process.exit(0);
  }
  process.stderr.write(`smoke runner crashed: ${e instanceof Error ? e.stack : String(e)}\n`);
  process.exit(2);
});
