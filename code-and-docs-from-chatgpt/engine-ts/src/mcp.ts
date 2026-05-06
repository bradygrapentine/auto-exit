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
 *   kea_safety_get    — read current safety config
 *   kea_safety_set    — update scalar safety fields
 *   kea_forbidden_list— list forbidden tickers
 *   kea_forbidden_add — add a ticker to the forbidden list
 *   kea_forbidden_remove — remove a ticker from the forbidden list
 *   kea_harvest_planner — EV-weighted harvest vs hold analysis
 *   kea_tca_summary     — per-chunk slippage vs arrival mid for a completed job
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
import { loadActive } from './credentials.js';
import { getSafety, setSafety, listForbidden, addForbiddenTicker, removeForbiddenTicker } from './safety.js';
import { computeHarvestPlan } from './harvestPlanner.js';
import { Journal } from './journal.js';
import type { ExitConfig, Side, TcaEntry, PriceLevel } from './types.js';
import { getWatcher, isWatcherInitialized } from './watcherSingleton.js';
import { evaluate } from './synthetics/index.js';
import type { Synthetic } from './types.js';

// ── Synthetic kind validation ─────────────────────────────────────────────────
const SYNTHETIC_KINDS = ['stop_loss', 'stop_limit', 'trailing_stop', 'take_profit', 'oco', 'bracket', 'time_stop', 'step_trail'] as const;

const PriceLevelSchema = z.object({
  priceCents: z.number(),
  size: z.number(),
});

const OrderbookSchema = z.object({
  yes: z.array(PriceLevelSchema),
  no: z.array(PriceLevelSchema),
});

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
function tryLoadBaseUrl(): string {
  try { return loadActive().baseUrl; }
  catch { return process.env.KALSHI_BASE_URL ?? 'https://api.elections.kalshi.com/trade-api/v2'; }
}

function defaultEngineConfig(): ExitConfig {
  return {
    baseUrl: tryLoadBaseUrl(),
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
    'kea_whoami',
    {
      description: 'Returns the active credentials profile (name, last-4 of key id, base URL, demo flag). Read-only; no secrets in response.',
      inputSchema: {},
    },
    async () => {
      try {
        const a = loadActive();
        return jsonContent({
          activeProfile: a.profileName,
          keyIdLast4: a.keyId.slice(-4),
          baseUrl: a.baseUrl,
          isDemo: a.baseUrl.includes('demo'),
        });
      } catch (err) { return errorContent(err); }
    },
  );

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

  server.registerTool(
    'kea_safety_get',
    {
      description: 'Returns the current safety guard-rail config (safetySubmittedMultiple, floorPriceCents, tailSweepThreshold, forbiddenTickers).',
      inputSchema: {},
    },
    () => {
      try { return jsonContent(getSafety()); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_safety_set',
    {
      description: 'Update one or more scalar safety fields. Guard-rails only tighten at job start — setting a looser value here is stored but will only apply if the job config is also loose.',
      inputSchema: {
        safetySubmittedMultiple: z.number().min(1.0).max(1.2).optional().describe('Multiplier cap on submitted shares [1.0, 1.2]'),
        floorPriceCents: z.number().int().min(0).max(99).optional().describe('Minimum sell price in cents [0, 99]'),
        tailSweepThreshold: z.number().min(0).max(1_000_000).optional().describe('Tail sweep threshold [0, 1_000_000]'),
      },
    },
    (args) => {
      try { return jsonContent(setSafety(args)); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_forbidden_list',
    {
      description: 'Lists all tickers on the forbidden list. The engine refuses to run against these.',
      inputSchema: {},
    },
    () => {
      try { return jsonContent({ forbidden: listForbidden() }); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_forbidden_add',
    {
      description: 'Add a ticker to the forbidden list. The engine will refuse to run against it.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        reason: z.string().min(1).describe('Why this ticker is forbidden'),
      },
    },
    ({ ticker, reason }) => {
      try { return jsonContent(addForbiddenTicker(ticker, reason, 'mcp')); }
      catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_forbidden_remove',
    {
      description: 'Remove a ticker from the forbidden list.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker to unblock'),
      },
    },
    ({ ticker }) => {
      try {
        removeForbiddenTicker(ticker);
        return jsonContent({ removed: ticker });
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_harvest_planner',
    {
      description: 'EV-weighted harvest vs hold analysis. Computes EV crossover, risk-reduction table, Greeks, and suggested strategies for a binary position.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        position: z.number().int().positive().describe('Number of contracts held'),
        costBasisCents: z.number().nonnegative().describe('Total cost basis in cents'),
        marketP: z.number().min(0).max(1).describe('Market-implied probability (current bid / 100)'),
        privateP: z.number().min(0).max(1).describe("Operator's private probability estimate"),
        catalystType: z.enum(['soft', 'hard']).describe('Catalyst type'),
        catalystExpectedDate: z.string().optional().describe('ISO8601 expected catalyst date (for theta)'),
        payoutCents: z.number().optional().describe('Payout in cents per contract (default 100)'),
      },
    },
    async (args) => {
      try {
        const orderbook = await fetchOrderbook(args.ticker);
        const plan = computeHarvestPlan({ ...args, side: 'sell' }, orderbook);
        return jsonContent(plan);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_tca_summary',
    {
      description: 'Returns TCA (Transaction Cost Analysis) for a completed job: per-chunk slippage, avg slippage vs arrival mid, estimated fees.',
      inputSchema: { jobId: z.string() },
    },
    async ({ jobId }) => {
      try {
        const journal = new Journal(jobId);
        const entries = journal.readAll();
        const tcaEntries = entries
          .filter((e) => e.kind === 'tca')
          .map((e) => e.data as Omit<TcaEntry, 'kind' | 'ts'>);
        if (tcaEntries.length === 0) {
          return jsonContent({ jobId, chunks: 0, avgSlippageCents: 0, entries: [] });
        }
        const avgSlippageCents = tcaEntries.reduce((s, e) => s + e.slippageCents, 0) / tcaEntries.length;
        return jsonContent({ jobId, chunks: tcaEntries.length, avgSlippageCents, entries: tcaEntries });
      } catch (err) { return errorContent(err); }
    },
  );

  // ── Synthetic order tools ────────────────────────────────────────────────────

  server.registerTool(
    'kea_synthetic_register',
    {
      description:
        'Register a new synthetic order (stop-loss, stop-limit, trailing-stop, take-profit, OCO, bracket). ' +
        'Returns the synthetic id. Watcher singleton must be initialized.',
      inputSchema: {
        kind: z.enum(SYNTHETIC_KINDS).describe('Synthetic order kind'),
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['yes', 'no']).describe('Side of the position held'),
        positionSize: z.number().positive().describe('Number of contracts held'),
        params: z.record(z.unknown()).describe('Kind-specific params (e.g. { triggerPriceCents: 30 })'),
        autoCancelOnZeroPosition: z.boolean().optional().describe('Auto-cancel when position reaches zero (default true)'),
        selfTradePrevention: z.enum(['taker_at_cross', 'maker']).optional().describe('STP mode'),
      },
    },
    (args) => {
      try {
        if (!isWatcherInitialized()) {
          return errorContent(new Error('Watcher singleton not initialized. Call initWatcher() or setWatcherForTests() first.'));
        }
        const id = getWatcher().register({
          kind: args.kind,
          ticker: args.ticker,
          side: args.side as 'yes' | 'no',
          positionSize: args.positionSize,
          params: args.params as Synthetic['params'],
          autoCancelOnZeroPosition: args.autoCancelOnZeroPosition,
          selfTradePrevention: args.selfTradePrevention,
        });
        return jsonContent({ id });
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_synthetic_list',
    {
      description: 'List all registered synthetics (all statuses) from the Watcher singleton.',
      inputSchema: {},
    },
    () => {
      try {
        if (!isWatcherInitialized()) {
          return errorContent(new Error('Watcher singleton not initialized. Call initWatcher() or setWatcherForTests() first.'));
        }
        return jsonContent(getWatcher().list());
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_synthetic_get',
    {
      description: 'Get a single synthetic by id. Returns null if not found.',
      inputSchema: {
        id: z.string().min(1).describe('Synthetic id (syn-<uuid>)'),
      },
    },
    ({ id }) => {
      try {
        if (!isWatcherInitialized()) {
          return errorContent(new Error('Watcher singleton not initialized. Call initWatcher() or setWatcherForTests() first.'));
        }
        return jsonContent(getWatcher().get(id) ?? null);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_synthetic_cancel',
    {
      description: 'Cancel an armed synthetic by id. Returns { canceled: true } on success, false if already fired/canceled.',
      inputSchema: {
        id: z.string().min(1).describe('Synthetic id to cancel'),
      },
    },
    ({ id }) => {
      try {
        if (!isWatcherInitialized()) {
          return errorContent(new Error('Watcher singleton not initialized. Call initWatcher() or setWatcherForTests() first.'));
        }
        return jsonContent({ canceled: getWatcher().cancel(id) });
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_synthetic_preview',
    {
      description:
        'Dry-run evaluation: given a synthetic spec and a snapshot orderbook, returns whether it would fire now and the distance to trigger. ' +
        'DEVIATION FROM PLAN: caller must supply `book` (yes/no PriceLevel arrays) rather than fetching live — avoids coupling preview to the live client. ' +
        'Use kea_orderbook to fetch a book snapshot first.',
      inputSchema: {
        kind: z.enum(SYNTHETIC_KINDS).describe('Synthetic order kind'),
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['yes', 'no']).describe('Side of the position held'),
        positionSize: z.number().positive().describe('Number of contracts held'),
        params: z.record(z.unknown()).describe('Kind-specific params'),
        book: OrderbookSchema.describe('Orderbook snapshot ({ yes: PriceLevel[]; no: PriceLevel[] })'),
      },
    },
    (args) => {
      try {
        const ephemeral: Synthetic = {
          id: 'preview',
          kind: args.kind,
          ticker: args.ticker,
          side: args.side as 'yes' | 'no',
          positionSize: args.positionSize,
          params: args.params as Synthetic['params'],
          state: {},
          status: 'armed',
          createdAt: new Date().toISOString(),
          selfTradePrevention: 'taker_at_cross',
          autoCancelOnZeroPosition: true,
        };

        const book = args.book as { yes: PriceLevel[]; no: PriceLevel[] };
        const result = evaluate(ephemeral, book);

        const topBidCents = (book.yes[0]?.priceCents ?? 0);

        return jsonContent({
          wouldFireNow: result.fire,
          reason: result.reason,
          topBidCents,
          distanceCentsToTrigger: result.distanceCentsToTrigger,
        });
      } catch (err) { return errorContent(err); }
    },
  );

  // ── Rich synthetic tools (Phase 4 Track C) ──────────────────────────────────

  server.registerTool(
    'kea_bracket_arm',
    {
      description:
        'Convenience wrapper to register a bracket synthetic (paired take-profit + stop-loss children). ' +
        'Returns { id } of the bracket parent.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['yes', 'no']).describe('Side of the position held'),
        positionSize: z.number().positive().describe('Number of contracts held'),
        takeProfitCents: z.number().positive().describe('Take-profit trigger price (cents)'),
        stopLossCents: z.number().positive().describe('Stop-loss trigger price (cents)'),
        autoCancelOnZeroPosition: z.boolean().optional().describe('Auto-cancel when position reaches zero (default true)'),
        selfTradePrevention: z.enum(['taker_at_cross', 'maker']).optional().describe('STP mode'),
      },
    },
    (args) => {
      try {
        if (!isWatcherInitialized()) {
          return errorContent(new Error('Watcher singleton not initialized. Call initWatcher() or setWatcherForTests() first.'));
        }
        const id = getWatcher().register({
          kind: 'bracket',
          ticker: args.ticker,
          side: args.side as 'yes' | 'no',
          positionSize: args.positionSize,
          params: {
            takeProfitCents: args.takeProfitCents,
            stopLossCents: args.stopLossCents,
          } as Synthetic['params'],
          autoCancelOnZeroPosition: args.autoCancelOnZeroPosition,
          selfTradePrevention: args.selfTradePrevention,
        });
        return jsonContent({ id });
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_trailing_status',
    {
      description:
        'Live readout for a trailing-stop synthetic: peak bid, current bid, current stop price, distance to trigger. ' +
        'Caller must supply `book` (use kea_orderbook first). Errors if synthetic is not kind=trailing_stop.',
      inputSchema: {
        id: z.string().min(1).describe('Trailing-stop synthetic id'),
        book: OrderbookSchema.describe('Orderbook snapshot'),
      },
    },
    ({ id, book }) => {
      try {
        if (!isWatcherInitialized()) {
          return errorContent(new Error('Watcher singleton not initialized. Call initWatcher() or setWatcherForTests() first.'));
        }
        const s = getWatcher().get(id);
        if (!s) return errorContent(new Error(`Synthetic not found: ${id}`));
        if (s.kind !== 'trailing_stop') return errorContent(new Error(`Synthetic ${id} is kind=${s.kind}, not trailing_stop`));

        const params = s.params as { trailCents: number; floorPriceCents?: number };
        const state = s.state as { peakBidCentsExact?: number };
        const trail = params.trailCents;
        const floor = params.floorPriceCents ?? 1;
        const levels = s.side === 'yes' ? book.yes : book.no;
        const currentBidCentsExact = (levels[0]?.priceCents as number | undefined) ?? 0;
        const peakBidCentsExact = state.peakBidCentsExact ?? currentBidCentsExact;
        const stopPriceCentsExact = Math.max(peakBidCentsExact - trail, floor);
        const distanceCentsExact = currentBidCentsExact - stopPriceCentsExact;

        return jsonContent({
          peakBidCentsExact,
          currentBidCentsExact,
          stopPriceCentsExact,
          distanceCentsExact,
        });
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_synthetic_history',
    {
      description:
        'Read recent watcher journal entries (NDJSON), optionally filtered by ticker. Returns last N entries (default 50). ' +
        'Reads from the watcher journal file at $KEA_HOME/watchers.ndjson (or ~/.kalshi-exit-assistant/watchers.ndjson if KEA_HOME unset).',
      inputSchema: {
        ticker: z.string().optional().describe('Optional: filter to entries for synthetics on this ticker'),
        limit: z.number().int().positive().optional().describe('Max entries to return (default 50)'),
      },
    },
    ({ ticker, limit }) => {
      try {
        const home = process.env.KEA_HOME ?? path.join(os.homedir(), '.kalshi-exit-assistant');
        const journalPath = path.join(home, 'watchers.ndjson');
        if (!fs.existsSync(journalPath)) {
          return jsonContent({ entries: [], journalPath, note: 'journal file does not exist (no synthetics ever registered)' });
        }

        const max = limit ?? 50;
        const tickerById = new Map<string, string>();
        const entries: Record<string, unknown>[] = [];

        for (const line of fs.readFileSync(journalPath, 'utf-8').split('\n')) {
          if (!line.trim()) continue;
          try {
            const e = JSON.parse(line) as Record<string, unknown>;
            if (e.kind === 'synthetic_registered' && e.synthetic) {
              const syn = e.synthetic as { id: string; ticker: string };
              tickerById.set(syn.id, syn.ticker);
            }
            entries.push(e);
          } catch { /* skip malformed */ }
        }

        const filtered = ticker
          ? entries.filter(e => {
              const id = (e.id as string | undefined) ?? (e.synthetic as { id?: string } | undefined)?.id;
              const synTicker = (e.synthetic as { ticker?: string } | undefined)?.ticker;
              if (synTicker === ticker) return true;
              return id !== undefined && tickerById.get(id) === ticker;
            })
          : entries;

        return jsonContent({
          entries: filtered.slice(-max),
          journalPath,
          totalCount: entries.length,
          filteredCount: filtered.length,
        });
      } catch (err) { return errorContent(err); }
    },
  );

  return server;
}

export async function startStdio(transport?: { start?: () => Promise<void> } & object): Promise<void> {
  const server = buildMcpServer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t: any = transport ?? new StdioServerTransport();
  await server.connect(t);
}

export { defaultEngineConfig };

export function isMainModule(): boolean {
  return import.meta.url === `file://${process.argv[1]}`;
}

export function runIfMain(opts?: { start?: () => Promise<void>; isMain?: () => boolean; onError?: (err: unknown) => void }): void {
  const isMain = opts?.isMain ?? isMainModule;
  if (!isMain()) return;
  const start = opts?.start ?? startStdio;
  const onError = opts?.onError ?? ((err: unknown) => {
    console.error('mcp: fatal', err);
    process.exit(1);
  });
  start().catch(onError);
}

runIfMain();
