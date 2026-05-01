// GET /portfolio/positions?ticker=<ticker> returns { market_positions: [{ ticker, position_fp, ... }] }.
// `position_fp` is a string-encoded signed decimal: positive = long YES on this market ticker,
// negative = short YES (= long NO). Verified against prod fixture test/fixtures/positions.real.json.
import crypto from 'node:crypto';
import fs from 'node:fs';
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
  return {
    ticker,
    side: raw > 0 ? 'yes' : 'no',
    quantity: Math.abs(raw),
  };
}

export class KalshiAccountClient {
  constructor(private config: ExitConfig) {}

  private authHeaders(method: string, path: string): Record<string, string> {
    const apiKey = process.env[this.config.apiKeyEnv];
    const keyPath = process.env[this.config.privateKeyPathEnv];
    if (!apiKey || !keyPath) {
      throw new Error(`Missing ${this.config.apiKeyEnv} or ${this.config.privateKeyPathEnv}`);
    }
    const timestamp = Date.now().toString();
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    const message = timestamp + method.toUpperCase() + path;
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
    const path = `/portfolio/positions?ticker=${encodeURIComponent(ticker)}`;
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
