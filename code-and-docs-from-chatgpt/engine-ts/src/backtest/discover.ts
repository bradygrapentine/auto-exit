/**
 * discover.ts — sample open Kalshi markets, assign cadences, produce TickerEntry[].
 *
 * Calls client.listMarkets({status:'open'}), groups by prefix → category,
 * ranks by volume descending, takes top perCategory per category,
 * marks the hotPerCategory fastest as cadenceMs:500, rest as 2000.
 * 'other' category is excluded from output.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TickerEntry } from './multiTickerRecorder.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawMarket {
  ticker: string;
  volume?: number;
  dollar_volume?: number;
  [key: string]: unknown;
}

export interface DiscoverClient {
  listMarkets(params: { status?: 'open' | 'closed' | 'settled'; limit?: number; cursor?: string }): Promise<{ markets: RawMarket[]; cursor?: string }>;
}

export interface DiscoverOptions {
  client: DiscoverClient;
  perCategory?: number;
  hotPerCategory?: number;
}

export interface TickerFileContent {
  tickers: TickerEntry[];
  discoveredAt: string;
}

// ---------------------------------------------------------------------------
// Prefix → category table (longest prefix first within each category)
// ---------------------------------------------------------------------------

type Category =
  | 'sports'
  | 'political'
  | 'weather'
  | 'entertainment'
  | 'economics'
  | 'crypto'
  | 'other';

const PREFIX_TABLE: Array<[string, Category]> = [
  // sports
  ['KXNFL',   'sports'],
  ['KXNBA',   'sports'],
  ['KXMLB',   'sports'],
  ['KXNHL',   'sports'],
  // political
  ['KXPRES',  'political'],
  ['KXSEN',   'political'],
  ['KXHOUSE', 'political'],
  // weather
  ['KXTEMP',  'weather'],
  ['KXSNOW',  'weather'],
  ['KXRAIN',  'weather'],
  // entertainment (longest first)
  ['KXMETGALA',  'entertainment'],
  ['KXEMMY',     'entertainment'],
  ['KXOSCAR',    'entertainment'],
  // economics
  ['KXFEDRATE', 'economics'],
  ['KXJOBS',    'economics'],
  ['KXCPI',     'economics'],
  // crypto
  ['KXBTC', 'crypto'],
  ['KXETH', 'crypto'],
];

const KNOWN_CATEGORIES: Category[] = [
  'sports',
  'political',
  'weather',
  'entertainment',
  'economics',
  'crypto',
];

function categorize(ticker: string): Category {
  const upper = ticker.toUpperCase();
  for (const [prefix, cat] of PREFIX_TABLE) {
    if (upper.startsWith(prefix)) return cat;
  }
  return 'other';
}

function marketVolume(m: RawMarket): number {
  const v = m.dollar_volume ?? m.volume ?? 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

// ---------------------------------------------------------------------------
// discoverTickers
// ---------------------------------------------------------------------------

export async function discoverTickers(opts: DiscoverOptions): Promise<TickerEntry[]> {
  const { client } = opts;
  const perCategory = opts.perCategory ?? 8;
  const hotPerCategory = opts.hotPerCategory ?? 2;

  // Paginate through all open markets (Kalshi caps page size; cursor-based).
  const markets: RawMarket[] = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const page = await client.listMarkets({ status: 'open', limit: 1000, cursor });
    markets.push(...page.markets);
    cursor = page.cursor;
    pages++;
    if (pages > 20) break; // safety cap — 20k markets is more than Kalshi will ever return
  } while (cursor);

  // Group by category
  const byCategory: Map<Category, RawMarket[]> = new Map();
  for (const cat of KNOWN_CATEGORIES) byCategory.set(cat, []);

  for (const m of markets) {
    const cat = categorize(m.ticker);
    if (cat === 'other') continue;
    byCategory.get(cat)!.push(m);
  }

  const result: TickerEntry[] = [];

  for (const cat of KNOWN_CATEGORIES) {
    const sorted = byCategory.get(cat)!.sort(
      (a, b) => marketVolume(b) - marketVolume(a),
    );
    const top = sorted.slice(0, perCategory);

    top.forEach((m, idx) => {
      result.push({
        ticker: m.ticker,
        cadenceMs: idx < hotPerCategory ? 500 : 2000,
      });
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// writeTickerFile
// ---------------------------------------------------------------------------

export function writeTickerFile(tickers: TickerEntry[], filePath: string): void {
  const content: TickerFileContent = {
    tickers,
    discoveredAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

export function readTickerFile(filePath: string): TickerFileContent {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as TickerFileContent;
}
