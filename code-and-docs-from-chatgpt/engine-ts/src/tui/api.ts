/** Pure data-fetching helpers for the TUI. Reuses the existing auth + sign infra
 *  (KalshiAccountClient) and adds the few raw endpoints the CLI also uses. */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { KalshiClient } from '../kalshiClient.js';
import { ExitRunner } from '../exitRunner.js';
import { loadActive } from '../credentials.js';
import type { ExitConfig, Orderbook, Side } from '../types.js';

interface SignedHeaders {
  'KALSHI-ACCESS-KEY': string;
  'KALSHI-ACCESS-TIMESTAMP': string;
  'KALSHI-ACCESS-SIGNATURE': string;
}

function sign(method: string, fullPath: string): SignedHeaders {
  const a = loadActive();
  const ts = Date.now().toString();
  const privateKey = fs.readFileSync(a.keyPath, 'utf8');
  const sig = crypto
    .sign('RSA-SHA256', Buffer.from(ts + method.toUpperCase() + fullPath), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    })
    .toString('base64');
  return { 'KALSHI-ACCESS-KEY': a.keyId, 'KALSHI-ACCESS-TIMESTAMP': ts, 'KALSHI-ACCESS-SIGNATURE': sig };
}

function baseUrl(): string {
  return loadActive().baseUrl;
}

function fullPath(endpoint: string): string {
  return new URL(baseUrl()).pathname.replace(/\/$/, '') + endpoint;
}

async function getJson<T>(endpoint: string): Promise<T> {
  const r = await fetch(baseUrl() + endpoint, { headers: sign('GET', fullPath(endpoint)) as unknown as Record<string, string> });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as T;
}

// ── domain types (lean projections of the raw responses) ────────────────────
export interface BalanceData {
  balanceDollars: number;
  portfolioValueDollars: number;
}

export interface PositionRow {
  ticker: string;
  rawPosition: number; // signed: positive=YES, negative=NO
  side: 'YES' | 'NO';
  quantity: number;
  exposureDollars: number;
  feesPaidDollars: number;
  realizedPnlDollars: number;
  restingOrdersCount: number;
}

export interface RestingOrderRow {
  orderId: string;
  ticker: string;
  side: string;
  action: string;
  remaining: number;
  priceDollars: string;
  createdTime: string;
}

// ── fetchers ─────────────────────────────────────────────────────────────────
export async function fetchBalance(): Promise<BalanceData> {
  const j = await getJson<{ balance: number; portfolio_value: number }>('/portfolio/balance');
  return { balanceDollars: j.balance / 100, portfolioValueDollars: j.portfolio_value / 100 };
}

export async function fetchPositions(): Promise<PositionRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j = await getJson<{ market_positions?: any[] }>('/portfolio/positions');
  return (j.market_positions ?? [])
    .map((p) => {
      const raw = Number.parseFloat(String(p.position_fp ?? p.position ?? 0));
      return {
        ticker: String(p.ticker ?? ''),
        rawPosition: raw,
        side: (raw >= 0 ? 'YES' : 'NO') as 'YES' | 'NO',
        quantity: Math.abs(raw),
        exposureDollars: Number.parseFloat(String(p.market_exposure_dollars ?? '0')),
        feesPaidDollars: Number.parseFloat(String(p.fees_paid_dollars ?? '0')),
        realizedPnlDollars: Number.parseFloat(String(p.realized_pnl_dollars ?? '0')),
        restingOrdersCount: Number(p.resting_orders_count ?? 0),
      } as PositionRow;
    })
    .filter((p) => p.quantity !== 0);
}

// Synthesize a minimal config for preview-only flows initiated from the TUI.
// No execution happens — previewOnce only reads the orderbook and runs pricing.
function previewConfig(ticker: string, heldSide: Side, positionSize: number): ExitConfig {
  return {
    baseUrl: baseUrl(),
    localServerPort: 0,
    marketTicker: ticker,
    heldSide,
    positionSize,
    chunkSize: positionSize,
    floorPriceCents: 1,
    orderbookDepth: 10,
    minLevelSize: 1,
    tailSweepThreshold: 0,
    minAdaptiveChunk: 1,
    maxOrders: 1,
    loopDelayMs: 0,
    dryRun: true,
    killSwitchPath: '',
    apiKeyEnv: 'KALSHI_ACCESS_KEY',
    privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  };
}

export interface PreviewResult {
  topBidCents: number | null;
  decisionSize: number;
  decisionPriceDollars: string;
  decisionReason: string;
  grossDollars: number;
  feesDollars: number;
  netDollars: number;
  effectiveRatePct: number;
  perLevel: { priceCents: number; size: number; fillCount: number; revenueDollars: number; feesDollars: number }[];
}

export async function fetchPreview(ticker: string, heldSide: Side, positionSize: number): Promise<PreviewResult> {
  const cfg = previewConfig(ticker, heldSide, positionSize);
  const client = new KalshiClient(cfg);
  const runner = new ExitRunner(cfg, client);
  const p = await runner.previewOnce();
  const sideLevels = heldSide === 'yes' ? p.orderbook.yes : p.orderbook.no;
  const topBidCents = sideLevels[0]?.priceCents ?? null;
  const proj = p.projection;
  return {
    topBidCents,
    decisionSize: p.decision.chunkSize,
    decisionPriceDollars: p.decision.priceDollars,
    decisionReason: p.decision.reason,
    grossDollars: proj.totalGrossDollars,
    feesDollars: proj.totalFeesDollars,
    netDollars: proj.netDollars,
    effectiveRatePct: proj.feeRatio * 100,
    perLevel: proj.fills.map((f) => ({
      priceCents: f.priceCents,
      size: f.shares,
      fillCount: f.shares,
      revenueDollars: f.grossDollars,
      feesDollars: f.feeDollars,
    })),
  };
}

export async function fetchOrderbook(ticker: string, depth = 10): Promise<Orderbook> {
  const cfg = previewConfig(ticker, 'yes', 1);
  const client = new KalshiClient(cfg);
  return client.getOrderbook(ticker, depth);
}

export interface JournalSummary {
  jobId: string;
  filePath: string;
  startedAt: string;
  lastTs: string;
  ticker: string;
  lastKind: string;
  finished: boolean;
  entries: number;
}

export function listJournalSummaries(limit = 20): JournalSummary[] {
  const home = process.env.KEA_HOME ?? path.join(os.homedir(), '.kalshi-exit-assistant');
  const dir = path.join(home, 'jobs');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
  const out: JournalSummary[] = [];
  for (const f of files) {
    const fp = path.join(dir, f);
    try {
      const raw = fs.readFileSync(fp, 'utf8');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lines = raw.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l) as any]; } catch { return []; } });
      if (lines.length === 0) continue;
      const first = lines[0];
      const last = lines[lines.length - 1];
      const ticker = lines.find((e) => e?.data?.ticker || e?.data?.config?.marketTicker)?.data?.ticker
        ?? lines.find((e) => e?.data?.config?.marketTicker)?.data?.config?.marketTicker
        ?? '—';
      out.push({
        jobId: f.replace(/\.jsonl$/, ''),
        filePath: fp,
        startedAt: String(first?.ts ?? ''),
        lastTs: String(last?.ts ?? ''),
        ticker: String(ticker),
        lastKind: String(last?.kind ?? ''),
        finished: last?.kind === 'loop_finished',
        entries: lines.length,
      });
    } catch { /* skip unreadable */ }
  }
  out.sort((a, b) => (b.lastTs.localeCompare(a.lastTs)));
  return out.slice(0, limit);
}

// ── Reports helpers ──────────────────────────────────────────────────────────

export interface TcaJobSummary {
  jobId: string;
  filePath: string;
  ticker: string;
  side: string;
  tcaChunks: number;
}

export interface TcaChunkRow {
  chunkIndex: number;
  arrivalMidCents: number;
  executedPriceCents: number;
  slippageCents: number;
  chunkSize: number;
}

export interface PortfolioPlanEntry {
  rank: number;
  ticker: string;
  side: 'yes' | 'no';
  size: number;
  markToBidDollars: number;
  evHoldDollars: number;
  overvaluedDollars: number;
  recommendedStrategy: 'aggressive' | 'passive';
}

/** Return jobs that have at least one tca entry, most-recent first. */
export function listTcaJobs(limit = 20): TcaJobSummary[] {
  const home = process.env.KEA_HOME ?? path.join(os.homedir(), '.kalshi-exit-assistant');
  const dir = path.join(home, 'jobs');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
  const out: TcaJobSummary[] = [];
  for (const f of files) {
    const fp = path.join(dir, f);
    try {
      const raw = fs.readFileSync(fp, 'utf8');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lines = raw.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l) as any]; } catch { return []; } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tcaLines = lines.filter((e: any) => e?.kind === 'tca');
      if (tcaLines.length === 0) continue;
      const first = tcaLines[0];
      out.push({
        jobId: f.replace(/\.jsonl$/, ''),
        filePath: fp,
        ticker: String(first?.data?.ticker ?? first?.ticker ?? '—'),
        side: String(first?.data?.side ?? first?.side ?? '—'),
        tcaChunks: tcaLines.length,
      });
    } catch { /* skip unreadable */ }
  }
  out.sort((a, b) => b.jobId.localeCompare(a.jobId));
  return out.slice(0, limit);
}

/** Read tca chunk rows from a journal file. */
export function readTcaEntries(filePath: string): TcaChunkRow[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines = raw.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l) as any]; } catch { return []; } });
  return lines
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((e: any) => e?.kind === 'tca')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => {
      const d = e?.data ?? e;
      return {
        chunkIndex: Number(d.chunkIndex ?? 0),
        arrivalMidCents: Number(d.arrivalMidCents ?? 0),
        executedPriceCents: Number(d.executedPriceCents ?? 0),
        slippageCents: Number(d.slippageCents ?? 0),
        chunkSize: Number(d.chunkSize ?? 0),
      } as TcaChunkRow;
    })
    .sort((a, b) => a.chunkIndex - b.chunkIndex);
}

/** POST /portfolio/plan with positions + synthetic bids/mids derived from positions.
 *  For v1 we send uniform bids=50 and mids=0.5 per position so the server can rank. */
export async function fetchPortfolioPlan(
  positions: { ticker: string; side: 'yes' | 'no'; size: number }[],
): Promise<PortfolioPlanEntry[]> {
  const bidByTicker: Record<string, number> = {};
  const midProbabilities: Record<string, number> = {};
  for (const p of positions) {
    bidByTicker[p.ticker] = 50;
    midProbabilities[p.ticker] = 0.5;
  }
  const body = {
    positions: positions.map((p) => ({ ticker: p.ticker, side: p.side, size: p.size })),
    bidByTicker,
    midProbabilities,
  };
  const r = await fetch('/portfolio/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j = await r.json() as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (j?.ranked ?? []) as PortfolioPlanEntry[];
}

export async function fetchRestingOrders(): Promise<RestingOrderRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j = await getJson<{ orders?: any[] }>('/portfolio/orders');
  return (j.orders ?? [])
    .filter((o) => o.status === 'resting')
    .map((o) => ({
      orderId: String(o.order_id ?? ''),
      ticker: String(o.ticker ?? ''),
      side: String(o.side ?? ''),
      action: String(o.action ?? ''),
      remaining: Number.parseFloat(String(o.remaining_count_fp ?? o.count_fp ?? 0)),
      priceDollars: String(o.yes_price_dollars ?? o.no_price_dollars ?? ''),
      createdTime: String(o.created_time ?? ''),
    }));
}
