import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadConfig, mergeConfig, parseArgs } from './config.js';
import { ExitRunner } from './exitRunner.js';
import type { ExitConfig, ExitConfigPatch, JobStatus, Synthetic, Orderbook } from './types.js';
import { getWatcher, isWatcherInitialized } from './watcherSingleton.js';
import { evaluate } from './synthetics/index.js';
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
import { buildSPairArgs, SPairRunner } from './strategies/sPair.js';
import { buildSBasisArbArgs, SBasisArbRunner } from './strategies/sBasisArb.js';
import { MarketMakingRunner } from './strategies/sMarketMake.js';
import type { S12Config } from './marketMaking.js';
import { Journal, generateJobId } from './journal.js';
import { buildPortfolioPlan } from './portfolio.js';
import { computeDecisionEV } from './decisionEv.js';
import { computeKellySize } from './kellySizer.js';
import { recommendStrategies } from './strategyRecommender.js';
import { getSafety, addForbiddenTicker, removeForbiddenTicker } from './safety.js';
import {
  getWorkflowEngine,
  isWorkflowEngineInitialized,
  getPolicyEngine,
  isPolicyEngineInitialized,
  listTemplates,
  getTemplate,
} from './workflows/index.js';
import { validateWorkflow } from './workflows/validate.js';
import type { Policy } from './workflows/policies.js';
import { joinFires } from './edge/lifecycle.js';
import { groupByStrategy, groupByMarket, triggerHistogram, paramSensitivity } from './edge/aggregate.js';
import { attribute } from './edge/attribution.js';

function json(res: http.ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

async function readJson(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new SyntaxError('Invalid JSON body');
  }
}

/** Build and return the http.Server without starting it. Exported for tests. */
export function createServer(baseConfig: ExitConfig): http.Server {
  let activeRunner: ExitRunner | null = null;
  let lastStatus: JobStatus | null = null;

  function effectiveConfig(patch?: Partial<ExitConfigPatch>): ExitConfig {
    return mergeConfig(baseConfig, patch ?? {});
  }

  return http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return json(res, 204, {});
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

      if (req.method === 'GET' && url.pathname === '/health') {
        return json(res, 200, { ok: true, name: 'kalshi-exit-assistant-local-engine', running: activeRunner?.getStatus().running ?? false });
      }

      if (req.method === 'GET' && url.pathname === '/status') {
        return json(res, 200, activeRunner?.getStatus() ?? lastStatus ?? { running: false, stopped: true, events: [] });
      }

      if (req.method === 'POST' && url.pathname === '/preview') {
        const body = await readJson(req);
        const config = effectiveConfig(body.config);
        const runner = new ExitRunner({ ...config, dryRun: true });
        const preview = await runner.previewOnce();
        return json(res, 200, { ok: true, config: { ...config, dryRun: true }, ...preview });
      }

      if (req.method === 'POST' && url.pathname === '/start') {
        if (activeRunner?.getStatus().running) return json(res, 409, { ok: false, error: 'A job is already running' });
        const body = await readJson(req);
        const config = effectiveConfig(body.config);
        activeRunner = new ExitRunner(config);
        activeRunner.run().then((status) => { lastStatus = status; }).catch((err) => { console.error(err); });
        return json(res, 202, { ok: true, jobId: activeRunner.jobId, status: activeRunner.getStatus() });
      }

      if (req.method === 'POST' && url.pathname === '/resume') {
        if (activeRunner?.getStatus().running) return json(res, 409, { ok: false, error: 'A job is already running' });
        const body = await readJson(req);
        if (!body.jobId || typeof body.jobId !== 'string') {
          return json(res, 400, { ok: false, error: 'jobId is required' });
        }
        const config = effectiveConfig(body.config);
        activeRunner = new ExitRunner(config, undefined, { resumeFromJobId: body.jobId });
        activeRunner.run().then((status) => { lastStatus = status; }).catch((err) => { console.error(err); });
        return json(res, 202, { ok: true, jobId: activeRunner.jobId, status: activeRunner.getStatus() });
      }

      if (req.method === 'POST' && url.pathname === '/stop') {
        activeRunner?.stop('stop_requested_from_extension');
        return json(res, 200, { ok: true, status: activeRunner?.getStatus() ?? lastStatus });
      }

      if (req.method === 'POST' && url.pathname === '/preflight') {
        const body = await readJson(req);
        const config = effectiveConfig(body.config);
        const runner = new ExitRunner(config);
        const position = await runner.preflight();
        return json(res, 200, { ok: true, observed: position, requested: { ticker: config.marketTicker, side: config.heldSide, quantity: config.positionSize } });
      }

      // ── Synthetics routes ────────────────────────────────────────────────

      if (req.method === 'POST' && url.pathname === '/synthetics/register') {
        if (!isWatcherInitialized()) {
          return json(res, 503, { ok: false, error: 'Watcher not initialized. Start the watcher daemon first.' });
        }
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { kind, ticker, side, positionSize, params, autoCancelOnZeroPosition, selfTradePrevention } = body ?? {};
        if (!kind || !ticker || !side || positionSize == null || !params) {
          return json(res, 400, { ok: false, error: 'Missing required fields: kind, ticker, side, positionSize, params' });
        }
        const validSides = ['yes', 'no'];
        if (!validSides.includes(side)) {
          return json(res, 400, { ok: false, error: `Invalid side: ${side}. Must be 'yes' or 'no'` });
        }
        const id = getWatcher().register({ kind, ticker, side, positionSize, params, autoCancelOnZeroPosition, selfTradePrevention });
        return json(res, 200, { id });
      }

      if (req.method === 'GET' && url.pathname === '/synthetics/list') {
        if (!isWatcherInitialized()) {
          return json(res, 503, { ok: false, error: 'Watcher not initialized. Start the watcher daemon first.' });
        }
        return json(res, 200, getWatcher().list());
      }

      const synIdMatch = url.pathname.match(/^\/synthetics\/([^/]+)$/);
      if (synIdMatch) {
        const id = synIdMatch[1];

        if (req.method === 'GET') {
          if (!isWatcherInitialized()) {
            return json(res, 503, { ok: false, error: 'Watcher not initialized. Start the watcher daemon first.' });
          }
          const s = getWatcher().get(id);
          if (!s) return json(res, 404, { ok: false, error: `Synthetic not found: ${id}` });
          return json(res, 200, s);
        }

        if (req.method === 'DELETE') {
          if (!isWatcherInitialized()) {
            return json(res, 503, { ok: false, error: 'Watcher not initialized. Start the watcher daemon first.' });
          }
          const s = getWatcher().get(id);
          if (!s) return json(res, 404, { ok: false, error: `Synthetic not found: ${id}` });
          const canceled = getWatcher().cancel(id);
          return json(res, 200, { canceled });
        }
      }

      if (req.method === 'POST' && url.pathname === '/synthetics/preview') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { kind, ticker, side, positionSize, params, book } = body ?? {};
        if (!kind || !ticker || !side || positionSize == null || !params || !book) {
          return json(res, 400, { ok: false, error: 'Missing required fields: kind, ticker, side, positionSize, params, book' });
        }
        const validSides = ['yes', 'no'];
        if (!validSides.includes(side)) {
          return json(res, 400, { ok: false, error: `Invalid side: ${side}. Must be 'yes' or 'no'` });
        }
        const ephemeral: Synthetic = {
          id: 'preview',
          kind,
          ticker,
          side,
          positionSize,
          params,
          state: {},
          status: 'armed',
          createdAt: new Date().toISOString(),
          selfTradePrevention: 'taker_at_cross',
          autoCancelOnZeroPosition: true,
        };
        const result = evaluate(ephemeral, book as Orderbook);
        const topBid = (book as Orderbook).yes?.[0]?.priceCents ?? 0;
        return json(res, 200, {
          wouldFireNow: result.fire,
          reason: result.reason,
          topBidCents: topBid,
          distanceCentsToTrigger: result.distanceCentsToTrigger,
        });
      }

      // ── Strategy routes (Phase D) ────────────────────────────────────────────

      if (req.method === 'POST' && url.pathname === '/strategies/aggressive') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, side, action, size, oneTickIn } = body ?? {};
        if (!ticker || !side || !action || size == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, side, action, size' });
        }
        try {
          const config = buildSAggressiveOpts({ ticker, side, action, size, confirmedAggressive: true, oneTickIn });
          const client = new KalshiClient(baseConfig);
          const result = await new AggressiveRunner(client, config).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/stealth') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, side, action, size, priceCents, baseChunkSize, baseDelayMs, jitterChunkSizePct, jitterDelayPct, safetySubmittedMultiple, jobId } = body ?? {};
        if (!ticker || !side || !action || size == null || priceCents == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, side, action, size, priceCents' });
        }
        try {
          const s4config = buildSStealthArgs({ ticker, side, action, size, priceCents, baseChunkSize, baseDelayMs, jitterChunkSizePct, jitterDelayPct, safetySubmittedMultiple, jobId });
          const client = new KalshiClient(baseConfig);
          const result = await new StealthRunner(client, s4config).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/limit-ladder') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, side, action, totalSize, rungs, jobId } = body ?? {};
        if (!ticker || !side || !action || totalSize == null || !rungs) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, side, action, totalSize, rungs' });
        }
        try {
          const s8config = buildSLimitLadderArgs({ ticker, side, action, totalSize, rungs, jobId });
          const client = new KalshiClient(baseConfig);
          const result = await new LimitLadderRunner(client, s8config).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/stop-and-reverse') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, closeSide, closeSize, openSide, openSize, oneTickIn } = body ?? {};
        if (!ticker || !closeSide || closeSize == null || !openSide || openSize == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, closeSide, closeSize, openSide, openSize' });
        }
        try {
          const client = new KalshiClient(baseConfig);
          const result = await new SStopAndReverseRunner(client, {
            ticker, closeSide, closeSize, openSide, openSize, confirmedReverse: true, oneTickIn,
          }).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/roll') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { currentTicker, currentSide, currentSize, targetTicker, targetSide, targetSize, oneTickIn } = body ?? {};
        if (!currentTicker || !currentSide || currentSize == null || !targetTicker || !targetSide || targetSize == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: currentTicker, currentSide, currentSize, targetTicker, targetSide, targetSize' });
        }
        try {
          const client = new KalshiClient(baseConfig);
          const result = await new SRollRunner(client, {
            currentTicker, currentSide, currentSize, targetTicker, targetSide, targetSize, confirmedRoll: true, oneTickIn,
          }).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/prepend-then-sweep') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, side, action, size, prependWindowMs, oneTickIn } = body ?? {};
        if (!ticker || !side || !action || size == null || prependWindowMs == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, side, action, size, prependWindowMs' });
        }
        try {
          const s15config = buildSPrependThenSweepArgs({ ticker, side, action, size, prependWindowMs, confirmedPrepend: true, oneTickIn });
          const client = new KalshiClient(baseConfig);
          const result = await new SPrependThenSweepRunner(client, s15config).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/s-twap') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, side, size, intervalMinutes, numIntervals, jobId } = body ?? {};
        if (!ticker || !side || size == null || intervalMinutes == null || numIntervals == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, side, size, intervalMinutes, numIntervals' });
        }
        try {
          const config = buildSTwapArgs({ ticker, side, size, intervalMinutes, numIntervals, jobId });
          const client = new KalshiClient(baseConfig);
          const result = await new STwapRunner({
            ...config,
            passiveInvoke: async (cfg) => {
              const { run } = await import('./passive.js');
              return run(client, cfg);
            },
          }).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/s-pre-resolution-arb') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, side, size, arbTimeboxMs, floorPriceCents } = body ?? {};
        if (!ticker || !side || size == null || arbTimeboxMs == null || floorPriceCents == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, side, size, arbTimeboxMs, floorPriceCents' });
        }
        try {
          const config = buildSPreResolutionArbArgs({ ticker, side, size, arbTimeboxMs, floorPriceCents });
          const client = new KalshiClient(baseConfig);
          const result = await new SPreResolutionArbRunner(client, config).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/s-cash-raise') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { positions, targetCashDollars, deadlineEpochMs } = body ?? {};
        if (!positions || targetCashDollars == null || deadlineEpochMs == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: positions, targetCashDollars, deadlineEpochMs' });
        }
        try {
          const client = new KalshiClient(baseConfig);
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
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/s-iceberg') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, side, size, visibleSize, priceCents, jobId } = body ?? {};
        if (!ticker || !side || size == null || visibleSize == null || priceCents == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, side, size, visibleSize, priceCents' });
        }
        try {
          const validatedArgs = buildSIcebergArgs({ ticker, side, size, visibleSize, priceCents });
          const client = new KalshiClient(baseConfig);
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
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/s-time-emergency') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, size, contractCloseEpochMs, jobId } = body ?? {};
        if (!ticker || size == null || contractCloseEpochMs == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, size, contractCloseEpochMs' });
        }
        try {
          const config = buildSTimeEmergencyArgs({ ticker, side: 'sell', size, contractCloseEpochMs });
          const client = new KalshiClient(baseConfig);
          const result = await new STimeEmergencyRunner(client, { ...config, jobId }).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/s-pair') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { legs, legSkewPct, jobId } = body ?? {};
        if (!Array.isArray(legs) || legs.length < 2) {
          return json(res, 400, { ok: false, error: 'Missing required field: legs (array of 2+)' });
        }
        try {
          const journal = new Journal(jobId ?? generateJobId());
          const ticker = legs[0]?.ticker ?? 'PLACEHOLDER';
          const client = new KalshiClient(baseConfig);
          const args = buildSPairArgs({
            legs,
            legSkewPct,
            journal,
            client,
            aggressiveInvoke: async (cfg) => {
              const { AggressiveRunner: AR } = await import('./aggressive.js');
              return new AR(client, cfg).run();
            },
            passiveInvoke: async (cfg) => {
              const { run } = await import('./passive.js');
              return run(client, cfg);
            },
            fetchOrderbook: async (t) => client.getOrderbook(t, 5),
          });
          void ticker;
          const result = await new SPairRunner(args).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/s-basis-arb') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, totalDollarBudget, perPairSlippageCents, jobId } = body ?? {};
        if (!ticker || totalDollarBudget == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, totalDollarBudget' });
        }
        try {
          const journal = new Journal(jobId ?? generateJobId());
          const client = new KalshiClient(baseConfig);
          const args = buildSBasisArbArgs({
            ticker,
            totalDollarBudget,
            perPairSlippageCents,
            journal,
            client,
            aggressiveInvoke: async (cfg) => {
              const { AggressiveRunner: AR } = await import('./aggressive.js');
              return new AR(client, cfg).run();
            },
            passiveInvoke: async (cfg) => {
              const { run } = await import('./passive.js');
              return run(client, cfg);
            },
            fetchOrderbookInvoke: async (t) => client.getOrderbook(t, 5),
          });
          const result = await new SBasisArbRunner(args).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/s-market-make') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, targetInventory, maxInventory, quoteOffsetCents, jobId } = body ?? {};
        if (!ticker || targetInventory == null || maxInventory == null || quoteOffsetCents == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: ticker, targetInventory, maxInventory, quoteOffsetCents' });
        }
        try {
          const client = new KalshiClient(baseConfig);
          const config: S12Config = {
            ticker,
            targetInventory,
            maxInventory,
            quoteOffsetCents,
            jobId,
            postOrderInvoke: async (qty, side, priceCents) => {
              const r = await client.createOrder({
                ticker,
                side,
                action: side === 'yes' ? 'buy' : 'sell',
                type: 'limit',
                count: qty,
                yes_price: priceCents,
                time_in_force: 'good_till_canceled',
                reduce_only: false,
                client_order_id: `kea-mm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              });
              return r.orderId;
            },
            cancelOrderInvoke: async (orderId) => { await client.cancelOrder(orderId); },
            getOrderStatusInvoke: async (orderId) => {
              const r = await client.getOrder(orderId);
              return { filled: r.filledCount, remaining: r.remainingCount };
            },
            getTopOfBookInvoke: async (t) => {
              const book = await client.getOrderbook(t, 1);
              return {
                bidCents: book.yes[0]?.priceCents ?? null,
                askCents: book.no[0] ? 100 - book.no[0].priceCents : null,
              };
            },
            aggressiveFlattenInvoke: async (t, side, qty) => {
              const { buildSAggressiveOpts: b } = await import('./strategies/sAggressive.js');
              const { AggressiveRunner: AR } = await import('./aggressive.js');
              const cfg = b({ ticker: t, side, action: side === 'yes' ? 'sell' : 'buy', size: qty, confirmedAggressive: true });
              const result = await new AR(client, cfg).run();
              return { filled: result.filled };
            },
          };
          const result = await new MarketMakingRunner(config).run();
          return json(res, 200, { ok: true, result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/strategies/run') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { strategy } = body ?? {};
        if (!strategy || typeof strategy !== 'string') {
          return json(res, 400, { ok: false, error: 'Missing required field: strategy' });
        }
        try {
          const client = new KalshiClient(baseConfig);
          const { jobId } = body;
          switch (strategy) {
            case 's-aggressive': {
              const { ticker, side, action, size, oneTickIn } = body;
              if (!ticker || !side || !action || size == null) throw new Error('s-aggressive requires: ticker, side, action, size');
              const { buildSAggressiveOpts: b } = await import('./strategies/sAggressive.js');
              const { AggressiveRunner: AR } = await import('./aggressive.js');
              const config = b({ ticker, side, action, size, confirmedAggressive: true, oneTickIn });
              return json(res, 200, { ok: true, result: await new AR(client, config).run() });
            }
            case 's-pair': {
              const { legs, legSkewPct } = body;
              if (!Array.isArray(legs) || legs.length < 2) throw new Error('s-pair requires: legs (2+)');
              const journal = new Journal(jobId ?? generateJobId());
              const args = buildSPairArgs({
                legs, legSkewPct, journal, client,
                aggressiveInvoke: async (cfg) => { const { AggressiveRunner: AR } = await import('./aggressive.js'); return new AR(client, cfg).run(); },
                passiveInvoke: async (cfg) => { const { run } = await import('./passive.js'); return run(client, cfg); },
                fetchOrderbook: async (t) => client.getOrderbook(t, 5),
              });
              return json(res, 200, { ok: true, result: await new SPairRunner(args).run() });
            }
            case 's-basis-arb': {
              const { ticker, totalDollarBudget, perPairSlippageCents } = body;
              if (!ticker || totalDollarBudget == null) throw new Error('s-basis-arb requires: ticker, totalDollarBudget');
              const journal = new Journal(jobId ?? generateJobId());
              const args = buildSBasisArbArgs({
                ticker, totalDollarBudget, perPairSlippageCents, journal, client,
                aggressiveInvoke: async (cfg) => { const { AggressiveRunner: AR } = await import('./aggressive.js'); return new AR(client, cfg).run(); },
                passiveInvoke: async (cfg) => { const { run } = await import('./passive.js'); return run(client, cfg); },
                fetchOrderbookInvoke: async (t) => client.getOrderbook(t, 5),
              });
              return json(res, 200, { ok: true, result: await new SBasisArbRunner(args).run() });
            }
            case 's-market-make': {
              const { ticker, targetInventory, maxInventory, quoteOffsetCents } = body;
              if (!ticker || targetInventory == null || maxInventory == null || quoteOffsetCents == null) {
                throw new Error('s-market-make requires: ticker, targetInventory, maxInventory, quoteOffsetCents');
              }
              const mmConfig: S12Config = {
                ticker, targetInventory, maxInventory, quoteOffsetCents, jobId,
                postOrderInvoke: async (qty, side, priceCents) => {
                  const r = await client.createOrder({ ticker, side, action: side === 'yes' ? 'buy' : 'sell', type: 'limit', count: qty, yes_price: priceCents, time_in_force: 'good_till_canceled', reduce_only: false, client_order_id: `kea-mm-${Date.now()}-${Math.random().toString(36).slice(2)}` });
                  return r.orderId;
                },
                cancelOrderInvoke: async (orderId) => { await client.cancelOrder(orderId); },
                getOrderStatusInvoke: async (orderId) => { const r = await client.getOrder(orderId); return { filled: r.filledCount, remaining: r.remainingCount }; },
                getTopOfBookInvoke: async (t) => {
                  const book = await client.getOrderbook(t, 1);
                  return { bidCents: book.yes[0]?.priceCents ?? null, askCents: book.no[0] ? 100 - book.no[0].priceCents : null };
                },
                aggressiveFlattenInvoke: async (t, side, qty) => {
                  const { buildSAggressiveOpts: b } = await import('./strategies/sAggressive.js');
                  const { AggressiveRunner: AR } = await import('./aggressive.js');
                  const cfg = b({ ticker: t, side, action: side === 'yes' ? 'sell' : 'buy', size: qty, confirmedAggressive: true });
                  const r = await new AR(client, cfg).run();
                  return { filled: r.filled };
                },
              };
              return json(res, 200, { ok: true, result: await new MarketMakingRunner(mmConfig).run() });
            }
            default:
              return json(res, 400, { ok: false, error: `unknown strategy: ${strategy}` });
          }
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      // ── Decision-layer routes ──────────────────────────────────────────────

      if (req.method === 'POST' && url.pathname === '/portfolio/plan') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { positions, bidByTicker, midProbabilities, defaultStrategy } = body ?? {};
        if (!Array.isArray(positions) || positions.length === 0) {
          return json(res, 400, { ok: false, error: 'Missing required field: positions (non-empty array)' });
        }
        if (!bidByTicker || typeof bidByTicker !== 'object') {
          return json(res, 400, { ok: false, error: 'Missing required field: bidByTicker (object)' });
        }
        if (!midProbabilities || typeof midProbabilities !== 'object') {
          return json(res, 400, { ok: false, error: 'Missing required field: midProbabilities (object)' });
        }
        try {
          const plan = buildPortfolioPlan({ positions, bidByTicker, midProbabilities, defaultStrategy });
          return json(res, 200, { ok: true, plan });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/alerts/register') {
        if (!isWatcherInitialized()) {
          return json(res, 503, { ok: false, error: 'Watcher not initialized. Start the watcher daemon first.' });
        }
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { kind, ticker, side, positionSize, params, notifyChannels } = body ?? {};
        if (!kind || !ticker || !side || positionSize == null || !params) {
          return json(res, 400, { ok: false, error: 'Missing required fields: kind, ticker, side, positionSize, params' });
        }
        try {
          const id = getWatcher().register({ kind, ticker, side, positionSize, params });
          const syn = getWatcher().get(id);
          if (syn) {
            syn.action = 'notify';
            syn.notifyChannels = notifyChannels ?? [{ kind: 'desktop' }];
          }
          return json(res, 201, { ok: true, id });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'GET' && url.pathname === '/alerts/list') {
        if (!isWatcherInitialized()) {
          return json(res, 200, { ok: true, alerts: [] });
        }
        const all = getWatcher().list();
        const alerts = all.filter((s: Synthetic) => s.action === 'notify');
        return json(res, 200, { ok: true, alerts });
      }

      if (req.method === 'DELETE' && url.pathname === '/alerts/cancel') {
        if (!isWatcherInitialized()) {
          return json(res, 503, { ok: false, error: 'Watcher not initialized.' });
        }
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { id } = body ?? {};
        if (!id || typeof id !== 'string') {
          return json(res, 400, { ok: false, error: 'Missing required field: id' });
        }
        const canceled = getWatcher().cancel(id);
        return json(res, 200, { ok: true, canceled });
      }

      if (req.method === 'POST' && url.pathname === '/recommend') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        if (!body?.availableStrategies || !Array.isArray(body.availableStrategies)) {
          return json(res, 400, { ok: false, error: 'Missing required field: availableStrategies (array)' });
        }
        try {
          const result = recommendStrategies(body);
          return json(res, 200, { ok: true, ...result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/ev') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { action } = body ?? {};
        if (!action) {
          return json(res, 400, { ok: false, error: 'Missing required field: action' });
        }
        try {
          const result = computeDecisionEV(body, action);
          return json(res, 200, { ok: true, ...result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/size') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        if (body?.edgeProbability == null || body?.marketProbability == null || body?.bankrollDollars == null) {
          return json(res, 400, { ok: false, error: 'Missing required fields: edgeProbability, marketProbability, bankrollDollars' });
        }
        try {
          const result = computeKellySize(body);
          return json(res, 200, { ok: true, ...result });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      // ── Account / profile routes (SP1.7) ─────────────────────────────────
      // No profile system exists yet — /whoami returns a stub single-profile state.
      // POST /whoami returns 501 until a real profile switcher is implemented.

      if (req.method === 'GET' && url.pathname === '/whoami') {
        return json(res, 200, { active: 'default', available: ['default'] });
      }

      if (req.method === 'POST' && url.pathname === '/whoami') {
        return json(res, 501, { ok: false, error: 'Profile switching not implemented — no profile system exists yet.' });
      }

      // ── Safety routes (SP1.8) ─────────────────────────────────────────────

      if (req.method === 'GET' && url.pathname === '/safety') {
        try {
          return json(res, 200, { ok: true, safety: getSafety() });
        } catch (err) { return json(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'POST' && url.pathname === '/safety/forbidden/add') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        const { ticker, reason } = body ?? {};
        if (!ticker || typeof ticker !== 'string') {
          return json(res, 400, { ok: false, error: 'Missing required field: ticker' });
        }
        if (!reason || typeof reason !== 'string') {
          return json(res, 400, { ok: false, error: 'Missing required field: reason' });
        }
        try {
          const entry = addForbiddenTicker(ticker, reason, 'extension');
          return json(res, 200, { ok: true, entry });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      const forbiddenDeleteMatch = url.pathname.match(/^\/safety\/forbidden\/([^/]+)$/);
      if (forbiddenDeleteMatch && req.method === 'DELETE') {
        const ticker = decodeURIComponent(forbiddenDeleteMatch[1]!);
        try {
          const removed = removeForbiddenTicker(ticker);
          if (!removed) return json(res, 404, { ok: false, error: `Ticker not on forbidden list: ${ticker}` });
          return json(res, 200, { ok: true, removed });
        } catch (err) { return json(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      // ── Workflow routes ───────────────────────────────────────────────────────

      if (req.method === 'POST' && url.pathname === '/workflows/register') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        if (!isWorkflowEngineInitialized()) return json(res, 503, { ok: false, error: 'WorkflowEngine not initialized' });
        const engine = getWorkflowEngine();
        let def;
        if (body?.templateId) {
          def = getTemplate(body.templateId as string);
          if (!def) return json(res, 404, { ok: false, error: `Unknown template: ${body.templateId}` });
        } else if (body?.definition) {
          const result = validateWorkflow(body.definition);
          if (!result.ok) return json(res, 400, { ok: false, error: result.errors.join('; ') });
          def = result.def;
        } else {
          return json(res, 400, { ok: false, error: 'Provide templateId or definition' });
        }
        try {
          const { instanceId } = engine.register(def);
          return json(res, 201, { ok: true, instanceId, definitionId: def.id });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'GET' && url.pathname === '/workflows') {
        if (!isWorkflowEngineInitialized()) return json(res, 200, { ok: true, instances: [] });
        const statusFilter = url.searchParams.get('status');
        const all = getWorkflowEngine().list();
        const instances = statusFilter && statusFilter !== 'all'
          ? all.filter((i) => i.status === statusFilter)
          : all;
        return json(res, 200, { ok: true, instances, total: instances.length });
      }

      const workflowGetMatch = url.pathname.match(/^\/workflows\/([^/]+)$/);
      if (workflowGetMatch && req.method === 'GET') {
        const instanceId = decodeURIComponent(workflowGetMatch[1]!);
        if (!isWorkflowEngineInitialized()) return json(res, 503, { ok: false, error: 'WorkflowEngine not initialized' });
        const inst = getWorkflowEngine().get(instanceId);
        if (!inst) return json(res, 404, { ok: false, error: `Workflow instance not found: ${instanceId}` });
        return json(res, 200, { ok: true, instance: inst });
      }

      const workflowCancelMatch = url.pathname.match(/^\/workflows\/([^/]+)\/cancel$/);
      if (workflowCancelMatch && req.method === 'POST') {
        const instanceId = decodeURIComponent(workflowCancelMatch[1]!);
        if (!isWorkflowEngineInitialized()) return json(res, 503, { ok: false, error: 'WorkflowEngine not initialized' });
        getWorkflowEngine().cancel(instanceId);
        return json(res, 200, { ok: true, canceled: instanceId });
      }

      // ── Template routes ───────────────────────────────────────────────────────

      if (req.method === 'GET' && url.pathname === '/workflows/templates') {
        const templates = listTemplates().map((t) => ({
          id: t.id,
          version: t.version,
          initialState: t.initialState,
          stateCount: t.states.length,
          maxTransitions: t.maxTransitions,
        }));
        return json(res, 200, { ok: true, templates });
      }

      const templateGetMatch = url.pathname.match(/^\/workflows\/templates\/([^/]+)$/);
      if (templateGetMatch && req.method === 'GET') {
        const id = decodeURIComponent(templateGetMatch[1]!);
        const tmpl = getTemplate(id);
        if (!tmpl) return json(res, 404, { ok: false, error: `Unknown template: ${id}` });
        return json(res, 200, { ok: true, template: tmpl });
      }

      // ── Policy routes ─────────────────────────────────────────────────────────

      if (req.method === 'GET' && url.pathname === '/policies') {
        if (!isPolicyEngineInitialized()) return json(res, 200, { ok: true, policies: [] });
        const policies = getPolicyEngine().listPolicies();
        return json(res, 200, { ok: true, policies, total: policies.length });
      }

      if (req.method === 'POST' && url.pathname === '/policies') {
        let body: any;
        try { body = await readJson(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON body' }); }
        if (!isPolicyEngineInitialized()) return json(res, 503, { ok: false, error: 'PolicyEngine not initialized' });
        try {
          getPolicyEngine().addPolicy(body as Policy);
          return json(res, 201, { ok: true, added: (body as Policy).id });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      const policyDeleteMatch = url.pathname.match(/^\/policies\/([^/]+)$/);
      if (policyDeleteMatch && req.method === 'DELETE') {
        const policyId = decodeURIComponent(policyDeleteMatch[1]!);
        if (!isPolicyEngineInitialized()) return json(res, 503, { ok: false, error: 'PolicyEngine not initialized' });
        const removed = getPolicyEngine().removePolicy(policyId);
        if (!removed) return json(res, 404, { ok: false, error: `Policy not found: ${policyId}` });
        return json(res, 200, { ok: true, removed: policyId });
      }

      // ── Edge analytics routes ─────────────────────────────────────────────

      if (req.method === 'GET' && url.pathname === '/edge/summary') {
        try {
          const sinceParam = url.searchParams.get('since');
          const untilParam = url.searchParams.get('until');
          const minNotionalParam = url.searchParams.get('minNotional');
          const sinceMs = sinceParam ? new Date(sinceParam).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;
          const untilMs = untilParam ? new Date(untilParam).getTime() : Date.now();
          const minNotional = minNotionalParam ? parseFloat(minNotionalParam) : 0;

          const home = process.env['KEA_HOME'] ?? path.join(os.homedir(), '.kalshi-exit-assistant');
          const jobsDir = path.join(home, 'jobs');
          const allEntries = fs.existsSync(jobsDir)
            ? fs.readdirSync(jobsDir)
                .filter((f) => f.endsWith('.jsonl'))
                .flatMap((f) => {
                  try {
                    return fs.readFileSync(path.join(jobsDir, f), 'utf8')
                      .split('\n')
                      .filter((l) => l.trim().length > 0)
                      .flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
                  } catch { return []; }
                })
            : [];

          const fires = joinFires(allEntries).filter((fire) => {
            const jobTs = parseInt(fire.jobId.split('-')[0] ?? '0', 10);
            if (jobTs < sinceMs || jobTs > untilMs) return false;
            const notional = (fire.entryFills.reduce((s, f) => s + (f.size ?? 0), 0) * (fire.decisionMidCents ?? 50)) / 100 / 100;
            return notional >= minNotional;
          });

          const groups = groupByStrategy(fires);
          const table = groups.map((g) => ({
            strategy: g.strategy,
            fires: g.fires.length,
            totalRealizedPnLDollars: g.totalRealizedPnLDollars,
            avgEdgePerFireDollars: g.avgEdgePerFireDollars,
            sharpeIsh: g.sharpeIsh,
            attribution: g.attribution,
          }));

          const noiseWarning = groups.some((g) => g.fires.length < 5)
            ? 'Some strategies have n<5 fires; edge estimates unreliable.'
            : undefined;

          return json(res, 200, { ok: true, since: new Date(sinceMs).toISOString(), until: new Date(untilMs).toISOString(), totalFires: fires.length, strategies: table, ...(noiseWarning ? { noiseWarning } : {}) });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      if (req.method === 'GET' && url.pathname === '/edge/per-strategy') {
        try {
          const strategy = url.searchParams.get('strategy');
          if (!strategy) return json(res, 400, { ok: false, error: 'Missing required query param: strategy' });
          const sinceParam = url.searchParams.get('since');
          const paramNameParam = url.searchParams.get('paramName');
          const sinceMs = sinceParam ? new Date(sinceParam).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;

          const home = process.env['KEA_HOME'] ?? path.join(os.homedir(), '.kalshi-exit-assistant');
          const jobsDir = path.join(home, 'jobs');
          const allEntries = fs.existsSync(jobsDir)
            ? fs.readdirSync(jobsDir)
                .filter((f) => f.endsWith('.jsonl'))
                .flatMap((f) => {
                  try {
                    return fs.readFileSync(path.join(jobsDir, f), 'utf8')
                      .split('\n')
                      .filter((l) => l.trim().length > 0)
                      .flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
                  } catch { return []; }
                })
            : [];

          const fires = joinFires(allEntries).filter((fire) => {
            if (fire.strategy !== strategy) return false;
            const jobTs = parseInt(fire.jobId.split('-')[0] ?? '0', 10);
            return jobTs >= sinceMs;
          });

          if (fires.length === 0) {
            return json(res, 200, { ok: true, strategy, fires: 0, message: 'No fires found for this strategy in the given window.' });
          }

          const components = fires.map((f) => ({ fireId: f.fireId, jobId: f.jobId, ticker: f.ticker, ts: f.jobId.split('-')[0], ...attribute(f) }));
          const marketGroups = groupByMarket(fires).map((g) => ({ category: g.category, fires: g.fires.length, totalRealizedPnLDollars: g.totalRealizedPnLDollars }));
          const histogram = triggerHistogram(fires);
          const sensitivity = paramNameParam ? paramSensitivity(fires, paramNameParam) : undefined;
          const noiseWarning = fires.length < 5 ? `n=${fires.length} fires; edge estimate unreliable.` : undefined;

          return json(res, 200, { ok: true, strategy, since: new Date(sinceMs).toISOString(), fires: fires.length, components, marketSegmentation: marketGroups, triggerHistogram: histogram, ...(sensitivity ? { paramSensitivity: sensitivity } : {}), ...(noiseWarning ? { noiseWarning } : {}) });
        } catch (err) { return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) }); }
      }

      return json(res, 404, { ok: false, error: 'not_found' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return json(res, 500, { ok: false, error: msg });
    }
  });
}

// ── Process entrypoint ───────────────────────────────────────────────────────
const { configPath } = parseArgs();
const baseConfig = loadConfig(configPath);
const server = createServer(baseConfig);
server.listen(baseConfig.localServerPort, () => {
  console.log(`Kalshi Exit Assistant local engine listening on http://127.0.0.1:${baseConfig.localServerPort}`);
});
