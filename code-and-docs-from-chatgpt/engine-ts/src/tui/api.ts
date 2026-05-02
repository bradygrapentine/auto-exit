/** Pure data-fetching helpers for the TUI. Reuses the existing auth + sign infra
 *  (KalshiAccountClient) and adds the few raw endpoints the CLI also uses. */

import crypto from 'node:crypto';
import fs from 'node:fs';

interface SignedHeaders {
  'KALSHI-ACCESS-KEY': string;
  'KALSHI-ACCESS-TIMESTAMP': string;
  'KALSHI-ACCESS-SIGNATURE': string;
}

function sign(method: string, fullPath: string): SignedHeaders {
  const apiKey = process.env.KALSHI_ACCESS_KEY;
  const keyPath = process.env.KALSHI_PRIVATE_KEY_PATH;
  if (!apiKey || !keyPath) throw new Error('Missing KALSHI_ACCESS_KEY or KALSHI_PRIVATE_KEY_PATH');
  const ts = Date.now().toString();
  const privateKey = fs.readFileSync(keyPath, 'utf8');
  const sig = crypto
    .sign('RSA-SHA256', Buffer.from(ts + method.toUpperCase() + fullPath), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    })
    .toString('base64');
  return { 'KALSHI-ACCESS-KEY': apiKey, 'KALSHI-ACCESS-TIMESTAMP': ts, 'KALSHI-ACCESS-SIGNATURE': sig };
}

function baseUrl(): string {
  return process.env.KALSHI_BASE_URL ?? 'https://api.elections.kalshi.com/trade-api/v2';
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
