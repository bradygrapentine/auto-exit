// Assumes GET /portfolio/positions?ticker=<ticker> returns { market_positions: [{ ticker, position, ... }] }
// where position > 0 means YES holdings, position < 0 means NO holdings, 0 means not held.
import crypto from 'node:crypto';
import fs from 'node:fs';
import type { ExitConfig, Position } from './types.js';

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
    const signature = crypto
      .sign('RSA-SHA256', Buffer.from(message), privateKey)
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
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders('GET', path),
      },
    });
    if (!res.ok) {
      throw new Error(`getPosition failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { market_positions?: Array<{ ticker: string; position: number }> };
    const positions = json.market_positions ?? [];
    const entry = positions.find((p) => p.ticker === ticker);
    const raw = entry?.position ?? 0;
    if (raw === 0) {
      throw new Error(`No position held for ticker ${ticker}`);
    }
    return {
      ticker,
      side: raw > 0 ? 'yes' : 'no',
      quantity: Math.abs(raw),
    };
  }
}
