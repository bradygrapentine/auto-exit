// GET /portfolio/positions?ticker=<ticker> returns { market_positions: [{ ticker, position_fp, ... }] }.
// `position_fp` is a string-encoded signed decimal: positive = long YES on this market ticker,
// negative = short YES (= long NO). Verified against prod fixture test/fixtures/positions.real.json.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { loadActive } from './credentials.js';
import type { ExitConfig, Position } from './types.js';

interface RawMarketPosition {
  ticker: string;
  position_fp?: string | number;
  position?: string | number;
}

export function parsePositionsResponse(json: unknown, ticker: string): Position {
  const positions = ((json as { market_positions?: RawMarketPosition[] })?.market_positions) ?? [];
  const entry = positions.find((p) => p.ticker === ticker);
  if (!entry) {
    throw new Error(`No position held for ticker ${ticker}`);
  }
  const rawValue = entry.position_fp ?? entry.position ?? 0;
  const raw = typeof rawValue === 'string' ? Number.parseFloat(rawValue) : Number(rawValue);
  if (!Number.isFinite(raw) || raw === 0) {
    throw new Error(`No position held for ticker ${ticker}`);
  }
  const restingRaw = (entry as { resting_orders_count?: unknown }).resting_orders_count;
  const restingOrdersCount =
    typeof restingRaw === 'number' && Number.isFinite(restingRaw) ? restingRaw : undefined;
  return {
    ticker,
    side: raw > 0 ? 'yes' : 'no',
    quantity: Math.abs(raw),
    restingOrdersCount,
  };
}

export class KalshiAccountClient {
  constructor(private config: ExitConfig) {}

  private authHeaders(method: string, endpointPath: string): Record<string, string> {
    const a = loadActive();
    const apiKey = a.keyId;
    const keyPath = a.keyPath;
    const timestamp = Date.now().toString();
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    // Kalshi requires the FULL URL path (including /trade-api/v2 prefix) in the signed message
    // for /portfolio/* endpoints. Some endpoints tolerate the abbreviated form, but /portfolio/positions
    // and /portfolio/orders?... reject it as INCORRECT_API_KEY_SIGNATURE.
    const baseUrlPath = new URL(this.config.baseUrl).pathname.replace(/\/$/, '');
    const fullPath = baseUrlPath + endpointPath;
    const message = timestamp + method.toUpperCase() + fullPath;
    // Kalshi v2 uses RSA-PSS (not PKCS#1 v1.5) with SHA-256 + salt length = digest length.
    const signature = crypto
      .sign('RSA-SHA256', Buffer.from(message), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      })
      .toString('base64');
    return {
      'KALSHI-ACCESS-KEY': apiKey,
      'KALSHI-ACCESS-TIMESTAMP': timestamp,
      'KALSHI-ACCESS-SIGNATURE': signature,
    };
  }

  async getPosition(ticker: string): Promise<Position> {
    // Kalshi rejects signature when the path includes a query string for /portfolio/positions
    // (returns 401 INCORRECT_API_KEY_SIGNATURE). Fetch the unfiltered list and filter client-side.
    const path = '/portfolio/positions';
    const res = await fetch(this.config.baseUrl + path, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders('GET', path) },
    });
    if (!res.ok) {
      throw new Error(`getPosition failed: ${res.status} ${await res.text()}`);
    }
    return parsePositionsResponse(await res.json(), ticker);
  }
}
