/**
 * discover.ts — sample open Kalshi markets via category-aware series+events API.
 *
 * Flow per category:
 *   1. GET /series?category=<cat>&include_volume=true → top-K series by volume_fp
 *   2. GET /events?series_ticker=<s>&status=open&with_nested_markets=true&min_close_ts=<now+86400>
 *       → collect events with >24h close; pick representative market per event
 *   3. Sort events by aggregate 24h volume; take top perCategory
 *   4. Assign cadenceMs: first hotPerCategory → 1000ms, rest → 5000ms
 *
 * 'other' is not a Kalshi category; all six CATEGORIES are real API values.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TickerEntry } from './multiTickerRecorder.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoverClient {
  listSeries(opts?: {
    category?: string;
    include_volume?: boolean;
    cursor?: string;
    limit?: number;
  }): Promise<{
    series: Array<{ ticker: string; title?: string; category?: string; volume_fp?: number }>;
    cursor?: string;
  }>;
  listEvents(opts?: {
    series_ticker?: string;
    status?: 'open' | 'closed' | 'settled';
    with_nested_markets?: boolean;
    min_close_ts?: number;
    max_close_ts?: number;
    cursor?: string;
    limit?: number;
  }): Promise<{
    events: Array<{
      event_ticker: string;
      series_ticker?: string;
      title?: string;
      markets?: Array<{
        ticker: string;
        volume_24h_fp?: number;
        last_price_dollars?: number;
        close_time?: string;
        status?: string;
      }>;
    }>;
    cursor?: string;
  }>;
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
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = ['Sports', 'Politics', 'Climate and Weather', 'Economics', 'Crypto', 'Entertainment', 'Companies', 'Financials'] as const;
type Category = (typeof CATEGORIES)[number];

/** Markets must close at least 24h from now to be eligible. */
const MIN_CLOSE_LOOKAHEAD_SEC = 86400;

// ---------------------------------------------------------------------------
// discoverTickers
// ---------------------------------------------------------------------------

export async function discoverTickers(opts: DiscoverOptions): Promise<TickerEntry[]> {
  const { client } = opts;
  const perCategory = opts.perCategory ?? 8;
  const hotPerCategory = opts.hotPerCategory ?? 2;

  // min_close_ts filter is OFF by default — event-family dedup already prevents
  // any single event from dominating. Set KEA_DISCOVER_MIN_CLOSE_HOURS=24 to opt in.
  const lookaheadHours = Number(process.env.KEA_DISCOVER_MIN_CLOSE_HOURS ?? '0');
  const nowSec = Math.floor(Date.now() / 1000);
  const minCloseTs = lookaheadHours > 0 ? nowSec + lookaheadHours * 3600 : undefined;

  const result: TickerEntry[] = [];

  for (const category of CATEGORIES) {
    // Step 1: top series in this category by volume_fp
    const seriesPage = await client.listSeries({ category, include_volume: true, limit: 50 });
    const topSeries = seriesPage.series
      .slice()
      .sort((a, b) => (b.volume_fp ?? 0) - (a.volume_fp ?? 0))
      .slice(0, perCategory * 3); // 3× buffer in case some series have no qualifying events

    // Step 2: collect events across these series
    const eventsByVolume: Array<{
      event_ticker: string;
      representativeMarket: string;
      eventVolume: number;
    }> = [];

    for (const series of topSeries) {
      const eventsPage = await client.listEvents({
        series_ticker: series.ticker,
        status: 'open',
        with_nested_markets: true,
        ...(minCloseTs !== undefined ? { min_close_ts: minCloseTs } : {}),
        limit: 50,
      });

      for (const event of eventsPage.events) {
        const markets = (event.markets ?? []).filter((m) => m.status === 'open');
        if (markets.length === 0) continue;

        // Representative market: highest volume_24h_fp; tiebreak smallest |price - 0.5|
        const rep = markets.slice().sort((a, b) => {
          const vDiff = (b.volume_24h_fp ?? 0) - (a.volume_24h_fp ?? 0);
          if (vDiff !== 0) return vDiff;
          const aDist = Math.abs((a.last_price_dollars ?? 0.5) - 0.5);
          const bDist = Math.abs((b.last_price_dollars ?? 0.5) - 0.5);
          return aDist - bDist;
        })[0];

        const eventVolume = markets.reduce((sum, m) => sum + (m.volume_24h_fp ?? 0), 0);
        eventsByVolume.push({
          event_ticker: event.event_ticker,
          representativeMarket: rep.ticker,
          eventVolume,
        });
      }
    }

    // Step 3: top N events by aggregate 24h volume
    eventsByVolume.sort((a, b) => b.eventVolume - a.eventVolume);
    const topEvents = eventsByVolume.slice(0, perCategory);

    const categoryCount = topEvents.length;
    const hotCount = Math.min(hotPerCategory, categoryCount);
    console.log(
      `[discover] ${category.padEnd(13)}: ${categoryCount} event${categoryCount !== 1 ? 's' : ''}` +
        (categoryCount > 0 ? ` (${hotCount} hot)` : '  ← no qualifying events'),
    );

    topEvents.forEach((e, idx) => {
      result.push({
        ticker: e.representativeMarket,
        cadenceMs: idx < hotPerCategory ? 1000 : 5000,
      });
    });
  }

  console.log(`[discover] wrote ${result.length} tickers`);
  return result;
}

// ---------------------------------------------------------------------------
// writeTickerFile / readTickerFile
// ---------------------------------------------------------------------------

export function writeTickerFile(tickers: TickerEntry[], filePath: string): void {
  const content: TickerFileContent = {
    tickers,
    discoveredAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`[discover] wrote ${tickers.length} tickers → ${filePath}`);
}

export function readTickerFile(filePath: string): TickerFileContent {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as TickerFileContent;
}
