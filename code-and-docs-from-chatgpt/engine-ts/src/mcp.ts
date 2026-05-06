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
import { KalshiClient } from './kalshiClient.js';
import { buildSAggressiveOpts } from './strategies/sAggressive.js';
import { AggressiveRunner } from './aggressive.js';
import { buildSStealthArgs, StealthRunner } from './strategies/sStealth.js';
import { buildSLimitLadderArgs } from './strategies/sLimitLadder.js';
import { LimitLadderRunner } from './limitLadder.js';
import { SStopAndReverseRunner } from './strategies/sStopAndReverse.js';
import { SRollRunner } from './strategies/sRoll.js';
import { buildSPrependThenSweepArgs, SPrependThenSweepRunner } from './strategies/sPrependThenSweep.js';
import { buildSTwapArgs, STwapRunner } from './strategies/sTwap.js';
import { buildSPreResolutionArbArgs, SPreResolutionArbRunner } from './strategies/sPreResolutionArb.js';
import { buildSCashRaiseArgs, SCashRaiseRunner } from './strategies/sCashRaise.js';
import { buildSIcebergArgs, IcebergRunner } from './strategies/sIceberg.js';
import { buildSTimeEmergencyArgs, STimeEmergencyRunner } from './strategies/sTimeEmergency.js';

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
        maxParticipationRate: z.number().min(0).max(1).optional().describe('W3.1: Max fraction of recent-minute volume to submit per minute [0, 1]. 0 = disabled.'),
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

  // ── Strategy execution tools (Phase D) ──────────────────────────────────────

  server.registerTool(
    'kea_strategy_aggressive',
    {
      description:
        'S2: One-shot IoC sweep. Aggressively buy or sell a full position in a single immediate_or_cancel order. ' +
        'Use when speed is more important than price. confirmedAggressive is always set to true by this tool.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['yes', 'no']).describe('Side held (yes/no)'),
        action: z.enum(['buy', 'sell']).describe('Order direction'),
        size: z.number().int().positive().describe('Number of contracts'),
        oneTickIn: z.boolean().optional().describe('Cross one tick beyond best price (default false)'),
      },
    },
    async ({ ticker, side, action, size, oneTickIn }) => {
      try {
        const config = buildSAggressiveOpts({ ticker, side, action, size, confirmedAggressive: true, oneTickIn });
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: ticker });
        const result = await new AggressiveRunner(client, config).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_stealth',
    {
      description:
        'S4: Stealth jittered IoC chunk execution. Splits a large order into randomized small IoC chunks ' +
        'to reduce market impact and avoid detectable patterns. Loops until filled or safety cap hit.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['yes', 'no']).describe('Side held (yes/no)'),
        action: z.enum(['buy', 'sell']).describe('Order direction'),
        size: z.number().int().positive().describe('Total contracts to fill'),
        priceCents: z.number().int().min(1).max(99).describe('Crossable limit price in integer cents (1–99)'),
        baseChunkSize: z.number().int().positive().optional().describe('Base chunk size per IoC order (default 10)'),
        baseDelayMs: z.number().int().min(0).optional().describe('Base inter-chunk delay in ms (default 5000)'),
        jitterChunkSizePct: z.number().positive().max(1).optional().describe('Jitter fraction for chunk size 0–1 (default 0.3)'),
        jitterDelayPct: z.number().positive().max(1).optional().describe('Jitter fraction for delay 0–1 (default 0.5)'),
        safetySubmittedMultiple: z.number().positive().optional().describe('Max submitted / size ratio before halting (default 1.5)'),
        jobId: z.string().optional().describe('Optional job ID for journaling'),
      },
    },
    async ({ ticker, side, action, size, priceCents, baseChunkSize, baseDelayMs, jitterChunkSizePct, jitterDelayPct, safetySubmittedMultiple, jobId }) => {
      try {
        const s4config = buildSStealthArgs({ ticker, side, action, size, priceCents, baseChunkSize, baseDelayMs, jitterChunkSizePct, jitterDelayPct, safetySubmittedMultiple, jobId });
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: ticker });
        const result = await new StealthRunner(client, s4config).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_limit_ladder',
    {
      description:
        'S8: Multi-rung limit ladder. Posts GTC limit orders at multiple price levels simultaneously, ' +
        'distributing totalSize across rungs by percentage. Good for patient large exits.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['yes', 'no']).describe('Side held (yes/no)'),
        action: z.enum(['buy', 'sell']).describe('Order direction'),
        totalSize: z.number().int().positive().describe('Total contracts to distribute across rungs'),
        rungs: z.array(z.object({
          priceCents: z.number().int().min(1).max(99).describe('Limit price in integer cents'),
          sizePct: z.number().positive().max(100).describe('Percentage of totalSize at this rung'),
        })).min(1).describe('Array of {priceCents, sizePct} rung definitions (sum of sizePct must be <= 100)'),
        jobId: z.string().optional().describe('Optional job ID for journaling'),
      },
    },
    async ({ ticker, side, action, totalSize, rungs, jobId }) => {
      try {
        const s8config = buildSLimitLadderArgs({ ticker, side, action, totalSize, rungs, jobId });
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: ticker });
        const result = await new LimitLadderRunner(client, s8config).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_stop_and_reverse',
    {
      description:
        'S9: Stop-and-reverse. Phase 1 aggressively closes the existing position; ' +
        'Phase 2 aggressively opens the opposite position. Skips phase 2 if phase 1 is entirely unfilled.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        closeSide: z.enum(['yes', 'no']).describe('Side currently held (will be closed)'),
        closeSize: z.number().int().positive().describe('Size of the existing position to close'),
        openSide: z.enum(['yes', 'no']).describe('Target side to open (typically opposite of closeSide)'),
        openSize: z.number().int().positive().describe('Size to open on the new side'),
        oneTickIn: z.boolean().optional().describe('Cross one tick beyond best price for both phases (default false)'),
      },
    },
    async ({ ticker, closeSide, closeSize, openSide, openSize, oneTickIn }) => {
      try {
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: ticker });
        const result = await new SStopAndReverseRunner(client, {
          ticker, closeSide, closeSize, openSide, openSize, confirmedReverse: true, oneTickIn,
        }).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_roll',
    {
      description:
        'S11: Roll position. Phase 1 passively closes the current ticker position; ' +
        'Phase 2 aggressively opens on a new ticker. Useful for expiry rollovers or event switches.',
      inputSchema: {
        currentTicker: z.string().min(1).describe('Ticker of the position to close'),
        currentSide: z.enum(['yes', 'no']).describe('Side held in the current position'),
        currentSize: z.number().int().positive().describe('Size of the current position to close'),
        targetTicker: z.string().min(1).describe('Ticker to open a new position on'),
        targetSide: z.enum(['yes', 'no']).describe('Side to open on the target ticker'),
        targetSize: z.number().int().positive().describe('Requested size to open (capped by phase 1 actuallyClosed)'),
        oneTickIn: z.boolean().optional().describe('Cross one tick beyond best for phase 2 aggressive (default false)'),
      },
    },
    async ({ currentTicker, currentSide, currentSize, targetTicker, targetSide, targetSize, oneTickIn }) => {
      try {
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: currentTicker });
        const result = await new SRollRunner(client, {
          currentTicker, currentSide, currentSize, targetTicker, targetSide, targetSize, confirmedRoll: true, oneTickIn,
        }).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_prepend_then_sweep',
    {
      description:
        'S15: GTC prepend then aggressive sweep. Posts a GTC limit order first; waits prependWindowMs ' +
        'for passive fills; then cancels and sweeps any remaining size with an IoC aggressive order.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['yes', 'no']).describe('Side held (yes/no)'),
        action: z.enum(['buy', 'sell']).describe('Order direction'),
        size: z.number().int().positive().describe('Full position size (GTC and sweep combined)'),
        prependWindowMs: z.number().int().positive().describe('How long (ms) to let the GTC rest before sweeping'),
        oneTickIn: z.boolean().optional().describe('Cross one tick beyond best price for sweep (default false)'),
      },
    },
    async ({ ticker, side, action, size, prependWindowMs, oneTickIn }) => {
      try {
        const s15config = buildSPrependThenSweepArgs({ ticker, side, action, size, prependWindowMs, confirmedPrepend: true, oneTickIn });
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: ticker });
        const result = await new SPrependThenSweepRunner(client, s15config).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_s_twap',
    {
      description:
        'S3: Time-Weighted Average Price (TWAP). Splits a position into N equal time slices, ' +
        'executing each slice via S1 passive at fixed intervals. Minimizes market impact over time. ' +
        'side is "buy" or "sell" (not yes/no — passive direction).',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['buy', 'sell']).describe('Direction of the TWAP execution'),
        size: z.number().int().positive().describe('Total contracts to execute'),
        intervalMinutes: z.number().positive().describe('Minutes between each TWAP slice'),
        numIntervals: z.number().int().min(2).describe('Number of time slices (minimum 2)'),
        jobId: z.string().optional().describe('Optional job ID for journaling'),
      },
    },
    async ({ ticker, side, size, intervalMinutes, numIntervals, jobId }) => {
      try {
        const config = buildSTwapArgs({ ticker, side, size, intervalMinutes, numIntervals, jobId });
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: ticker });
        const result = await new STwapRunner({
          ...config,
          passiveInvoke: async (cfg) => {
            const { run } = await import('./passive.js');
            return run(client, cfg);
          },
        }).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_s_pre_resolution_arb',
    {
      description:
        'S6: Pre-resolution arbitrage exit. Phase 1 posts an IoC at bid+1¢ (sell) / ask-1¢ (buy) ' +
        'for full size. If unfilled within arbTimeboxMs, phase 2 sweeps remainder via S2 aggressive ' +
        'at best bid/ask respecting floorPriceCents.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['yes', 'no']).describe('Side held (yes/no)'),
        size: z.number().int().positive().describe('Total contracts to exit'),
        arbTimeboxMs: z.number().int().positive().describe('Max ms to wait for phase 1 before escalating to phase 2'),
        floorPriceCents: z.number().int().min(1).max(99).describe('Minimum fill price in cents for phase 2 [1, 99]'),
      },
    },
    async ({ ticker, side, size, arbTimeboxMs, floorPriceCents }) => {
      try {
        const config = buildSPreResolutionArbArgs({ ticker, side, size, arbTimeboxMs, floorPriceCents });
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: ticker });
        const result = await new SPreResolutionArbRunner(client, config).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_s_cash_raise',
    {
      description:
        'S10: Cash-raise sequencer. Executes a pre-ranked list of sell positions sequentially until ' +
        'a target cash amount is raised or a deadline is hit. Stops early when target met or deadline passed.',
      inputSchema: {
        positions: z.array(z.object({
          ticker: z.string().min(1).describe('Market ticker for this position'),
          side: z.literal('sell').describe('Side (always sell for cash-raise)'),
          size: z.number().int().positive().describe('Number of contracts to sell'),
          strategyName: z.enum(['aggressive', 'passive']).describe('Execution strategy for this position'),
        })).min(1).describe('Ordered list of positions to liquidate'),
        targetCashDollars: z.number().positive().describe('Target cash to raise in dollars'),
        deadlineEpochMs: z.number().int().positive().describe('Unix epoch ms after which sequencer halts'),
      },
    },
    async ({ positions, targetCashDollars, deadlineEpochMs }) => {
      try {
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: 'PLACEHOLDER' });
        const config = buildSCashRaiseArgs({
          positions,
          targetCashDollars,
          deadlineEpochMs,
          aggressiveInvoke: async (cfg) => {
            const { AggressiveRunner: AR } = await import('./aggressive.js');
            return new AR(client, cfg).run();
          },
          passiveInvoke: async (cfg) => {
            const { run } = await import('./passive.js');
            return run(client, cfg);
          },
          getCurrentBidCents: async (ticker) => {
            const book = await client.getOrderbook(ticker, 1);
            return book.yes[0]?.priceCents ?? 0;
          },
        });
        const result = await new SCashRaiseRunner(config).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_s_iceberg',
    {
      description:
        'S13: Iceberg order. Hides the total order size by only showing a small visible slice at one time. ' +
        'Reposts a fresh slice immediately after each fill until fully executed or stopped.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        side: z.enum(['yes', 'no']).describe('Side held (yes/no)'),
        size: z.number().int().positive().describe('Total contracts to fill across all slices'),
        visibleSize: z.number().int().positive().describe('Visible slice size per resting order (must be <= size)'),
        priceCents: z.number().int().min(1).max(99).describe('Limit price in integer cents [1, 99]'),
        jobId: z.string().optional().describe('Optional job ID for journaling'),
      },
    },
    async ({ ticker, side, size, visibleSize, priceCents, jobId }) => {
      try {
        const validatedArgs = buildSIcebergArgs({ ticker, side, size, visibleSize, priceCents });
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: ticker });
        const result = await new IcebergRunner({
          ...validatedArgs,
          postOrderInvoke: async (qty, orderSide, price) => {
            const r = await client.createOrder({
              ticker,
              side: orderSide,
              action: 'sell',
              type: 'limit',
              count: qty,
              yes_price: price,
              time_in_force: 'good_till_canceled',
              reduce_only: false,
              client_order_id: `kea-iceberg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            });
            return r.orderId;
          },
          getOrderStatusInvoke: async (orderId) => {
            const r = await client.getOrder(orderId);
            return { filled: r.filledCount, remaining: r.remainingCount };
          },
          cancelOrderInvoke: async (orderId) => { await client.cancelOrder(orderId); },
          jobId,
        }).run();
        return jsonContent(result);
      } catch (err) { return errorContent(err); }
    },
  );

  server.registerTool(
    'kea_strategy_s_time_emergency',
    {
      description:
        'S16: Time-to-expiry emergency unwind (sell-only). Clock-driven 4-phase escalation: ' +
        'T-60min passive → T-30min S7 scale-out → T-10min aggressive → T-2min cross-any-bid. ' +
        'Transitions after each phase completes; skips phases already past at start time.',
      inputSchema: {
        ticker: z.string().min(1).describe('Kalshi market ticker'),
        size: z.number().int().positive().describe('Total contracts to unwind (sell-only)'),
        contractCloseEpochMs: z.number().int().positive().describe('Unix epoch ms when the contract closes'),
        jobId: z.string().optional().describe('Optional job ID for journaling'),
      },
    },
    async ({ ticker, size, contractCloseEpochMs, jobId }) => {
      try {
        const config = buildSTimeEmergencyArgs({ ticker, side: 'sell', size, contractCloseEpochMs });
        const client = new KalshiClient({ ...defaultEngineConfig(), marketTicker: ticker });
        const result = await new STimeEmergencyRunner(client, { ...config, jobId }).run();
        return jsonContent(result);
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
