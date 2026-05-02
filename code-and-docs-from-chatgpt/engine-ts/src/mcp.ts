/**
 * MCP server — exposes engine primitives to LLM/agent consumers.
 *
 * READ-ONLY surface only in this first slice. Mutating tools (create/cancel
 * order) will land later behind explicit per-call dollar caps and the
 * forbiddenTickers list — see docs/MCP_DESIGN.md.
 *
 * Tools registered:
 *   kea_balance       — portfolio cash + total value
 *   kea_positions     — open positions (signed, side-decoded)
 *   kea_resting_orders— resting orders on the book right now
 *   kea_orderbook     — current orderbook for a ticker
 *   kea_preview       — full exit preview: decision + projection + per-level fills
 *   kea_journal_list  — recent jobs from $KEA_HOME/jobs
 *   kea_journal_read  — full journal contents for one jobId
 *   kea_replay        — replay a journal: assert engine reproduces every recorded decision
 *
 * Run: `npx tsx src/mcp.ts` (stdio transport — register in your MCP host config).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fetchBalance, fetchPositions, fetchRestingOrders, fetchOrderbook, fetchPreview, listJournalSummaries } from './tui/api.js';
import { loadJournalReplay, replayAll } from './replay.js';
import type { ExitConfig, Side } from './types.js';

function jsonContent(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

function errorContent(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: 'text' as const, text: `error: ${message}` }], isError: true };
}

// Engine config used when replay needs to re-run decideLosingExitOrder. Defaults
// match the conservative `previewConfig` shape in src/tui/api.ts so replay reproduces
// the same decisions the TUI's preview tab would.
function defaultEngineConfig(): ExitConfig {
  return {
    baseUrl: process.env.KALSHI_BASE_URL ?? 'https://api.elections.kalshi.com/trade-api/v2',
    localServerPort: 0,
    marketTicker: 'PLACEHOLDER',
    heldSide: 'yes',
    positionSize: 0,
    chunkSize: 0,
    floorPriceCents: 1,
    orderbookDepth: 20,
    minLevelSize: 1,
    tailSweepThreshold: 0,
    minAdaptiveChunk: 1,
    maxOrders: 50,
    loopDelayMs: 0,
    dryRun: true,
    killSwitchPath: '',
    apiKeyEnv: 'KALSHI_ACCESS_KEY',
    privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  };
}

export function buildMcpServer(): McpServer {
  const server = new McpServer({ name: 'kea-engine', version: '0.2.0' });

  server.registerTool(
    'kea_balance',
    {
      description: 'Returns the trading account balance and total portfolio value in dollars.',
      inputSchema: {},
    },
    async () => {
      try { return jsonContent(await fetchBalance()); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_positions',
    {
      description: 'Lists open positions with side (YES/NO), quantity, exposure, fees paid, and resting order count.',
      inputSchema: {},
    },
    async () => {
      try { return jsonContent(await fetchPositions()); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_resting_orders',
    {
      description: 'Lists currently-resting (unfilled) limit orders on the book.',
      inputSchema: {},
    },
    async () => {
      try { return jsonContent(await fetchRestingOrders()); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_orderbook',
    {
      description: 'Returns the YES + NO orderbook ladders for a market.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        depth: z.number().int().positive().max(100).default(10).describe('Levels to fetch per side (max 100)'),
      },
    },
    async ({ ticker, depth }) => {
      try { return jsonContent(await fetchOrderbook(ticker, depth)); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_preview',
    {
      description:
        'Runs the engine\'s full exit projection for a position: top bid, decision (size/price/reason), gross/fees/net dollars, effective fee rate, and per-level fills. Read-only.',
      inputSchema: {
        ticker: z.string().min(1),
        side: z.enum(['yes', 'no']).describe('Side of the position to exit (the side held)'),
        size: z.number().int().positive().describe('Number of shares to exit'),
      },
    },
    async ({ ticker, side, size }) => {
      try { return jsonContent(await fetchPreview(ticker, side as Side, size)); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_journal_list',
    {
      description: 'Lists recent engine job journals: jobId, ticker, last status, finished flag, entry count.',
      inputSchema: {
        limit: z.number().int().positive().max(100).default(20),
      },
    },
    async ({ limit }) => {
      try { return jsonContent(listJournalSummaries(limit)); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_journal_read',
    {
      description: 'Returns the raw JSONL entries for one jobId. Use kea_journal_list to find jobIds.',
      inputSchema: {
        jobId: z.string().min(1),
      },
    },
    async ({ jobId }) => {
      try {
        const home = process.env.KEA_HOME ?? path.join(os.homedir(), '.kalshi-exit-assistant');
        const fp = path.join(home, 'jobs', `${jobId}.jsonl`);
        if (!fs.existsSync(fp)) return errorContent(new Error(`journal not found: ${jobId}`));
        const raw = fs.readFileSync(fp, 'utf8');
        const entries = raw.split('\n').filter((l) => l.trim().length > 0).flatMap((l) => {
          try { return [JSON.parse(l)]; } catch { return []; }
        });
        return jsonContent({ jobId, entries });
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_replay',
    {
      description:
        'Replays a recorded job journal: re-runs decideLosingExitOrder against each saved orderbook+decision pair and reports any field-level diffs. Use to cross-validate engine pricing across releases.',
      inputSchema: {
        jobId: z.string().min(1),
      },
    },
    async ({ jobId }) => {
      try {
        const home = process.env.KEA_HOME ?? path.join(os.homedir(), '.kalshi-exit-assistant');
        const fp = path.join(home, 'jobs', `${jobId}.jsonl`);
        if (!fs.existsSync(fp)) return errorContent(new Error(`journal not found: ${jobId}`));
        const replay = loadJournalReplay(fp);
        const results = replayAll(replay, defaultEngineConfig());
        return jsonContent({
          jobId: replay.jobId,
          ticker: replay.ticker,
          side: replay.side,
          initialPosition: replay.initialPosition,
          replayed: results.length,
          skipped: replay.skipped,
          mismatches: results.filter((r) => !r.decisionMatches).map((r) => ({
            ts: r.entry.ts,
            orderId: r.entry.orderId,
            recordedDecision: r.entry.recordedDecision,
            recomputedDecision: r.recomputed,
            diff: r.decisionDiff,
          })),
          allMatch: results.every((r) => r.decisionMatches),
        });
      } catch (err) { return errorContent(err); }
    },
  );

  return server;
}

export async function startStdio(): Promise<void> {
  const server = buildMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  startStdio().catch((err) => {
    console.error('mcp: fatal', err);
    process.exit(1);
  });
}
