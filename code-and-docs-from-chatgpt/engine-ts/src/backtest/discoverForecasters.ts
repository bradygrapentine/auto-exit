/**
 * discoverForecasters.ts — build a ticker set from the live Kalshi grid for the
 * series that the oil-forecaster and weather-forecaster projects target.
 *
 * Unlike `discover.ts` (which picks top-K by category volume), this module is
 * targeted: it enumerates a fixed set of forecaster series and includes every
 * open event under each series, regardless of volume rank.
 *
 * Strike/bracket grids are NOT read from forecaster YAML — those configs
 * explicitly document that "actual Kalshi strikes vary day-to-day with spot;
 * the comparison view uses the live grid pulled from the API, not this file."
 * We follow the same convention: query Kalshi, take what's live.
 *
 * Optional sidecar `<out>.metadata.json` records per-ticker forecaster context
 * (probability + sigma) joined from each project's latest
 * `data/forecasts/{date}.jsonl` row. Recorded at scrape time because backfilling
 * historical conviction is expensive.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { TickerEntry } from './multiTickerRecorder.js';

// ---------------------------------------------------------------------------
// Series → cadence policy
// ---------------------------------------------------------------------------

/** Series ticker → poll cadence in ms. */
export const FORECASTER_SERIES: ReadonlyArray<{ series: string; cadenceMs: number; forecaster: 'oil' | 'weather' }> = [
  { series: 'KXWTI', cadenceMs: 500, forecaster: 'oil' },
  { series: 'KXHIGHNY', cadenceMs: 1500, forecaster: 'weather' },
  { series: 'KXHIGHCHI', cadenceMs: 1500, forecaster: 'weather' },
  { series: 'KXHIGHPHIL', cadenceMs: 1500, forecaster: 'weather' },
  { series: 'KXHIGHMIA', cadenceMs: 1500, forecaster: 'weather' },
  { series: 'KXHIGHLAX', cadenceMs: 1500, forecaster: 'weather' },
  { series: 'KXHIGHDEN', cadenceMs: 1500, forecaster: 'weather' },
];

// ---------------------------------------------------------------------------
// Minimal client surface — kept narrow so tests can inject a fake easily.
// ---------------------------------------------------------------------------

export interface ForecasterDiscoverClient {
  listEvents(opts: {
    series_ticker?: string;
    status?: 'open' | 'closed' | 'settled';
    with_nested_markets?: boolean;
    min_close_ts?: number;
    cursor?: string;
    limit?: number;
  }): Promise<{
    events: Array<{
      event_ticker: string;
      series_ticker?: string;
      markets?: Array<{ ticker: string; status?: string; close_time?: string }>;
    }>;
    cursor?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Forecaster context — joined from sibling repos' JSONL outputs
// ---------------------------------------------------------------------------

export interface ForecasterContext {
  source: 'oil' | 'weather';
  forecastTs?: string;
  pNow?: number;       // oil: spot at forecast time
  meanF?: number;      // weather: ensemble mean
  sigma?: number;      // dist sigma (both)
  /** Subset of tail_probs from the row, for downstream conviction signal. */
  tailProbs?: Record<string, number>;
}

export interface ForecasterTickerMetadata {
  ticker: string;
  series: string;
  forecaster: 'oil' | 'weather';
  context?: ForecasterContext;
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

export interface DiscoverForecastersOptions {
  client: ForecasterDiscoverClient;
  /** Override the default series list (used by tests). */
  series?: ReadonlyArray<{ series: string; cadenceMs: number; forecaster: 'oil' | 'weather' }>;
  /** Override the forecaster-context lookup (used by tests). Default reads sibling repos. */
  contextLookup?: (forecaster: 'oil' | 'weather') => ForecasterContext | undefined;
  /** Minimum seconds until event close — skip events resolving within this window. */
  minSecondsUntilClose?: number;
}

export interface DiscoverForecastersResult {
  tickers: TickerEntry[];
  metadata: ForecasterTickerMetadata[];
}

export async function discoverForecasters(
  opts: DiscoverForecastersOptions,
): Promise<DiscoverForecastersResult> {
  const series = opts.series ?? FORECASTER_SERIES;
  const minSecs = opts.minSecondsUntilClose ?? 0;
  const nowMs = Date.now();
  const contextLookup = opts.contextLookup ?? defaultContextLookup;

  const tickers: TickerEntry[] = [];
  const metadata: ForecasterTickerMetadata[] = [];

  for (const { series: seriesTicker, cadenceMs, forecaster } of series) {
    const context = contextLookup(forecaster);

    const events = await collectAllEvents(opts.client, seriesTicker);
    for (const event of events) {
      // Filter events that close within the minimum window.
      if (minSecs > 0 && event.markets) {
        const closeTime = event.markets[0]?.close_time;
        if (closeTime) {
          const closeMs = Date.parse(closeTime);
          if (Number.isFinite(closeMs) && (closeMs - nowMs) / 1000 < minSecs) continue;
        }
      }

      for (const market of event.markets ?? []) {
        if (market.status && market.status !== 'open') continue;
        tickers.push({ ticker: market.ticker, cadenceMs });
        metadata.push({ ticker: market.ticker, series: seriesTicker, forecaster, context });
      }
    }
  }

  return { tickers, metadata };
}

async function collectAllEvents(
  client: ForecasterDiscoverClient,
  seriesTicker: string,
): Promise<NonNullable<Awaited<ReturnType<ForecasterDiscoverClient['listEvents']>>['events']>> {
  const all: Awaited<ReturnType<ForecasterDiscoverClient['listEvents']>>['events'] = [];
  let cursor: string | undefined;
  do {
    const page = await client.listEvents({
      series_ticker: seriesTicker,
      status: 'open',
      with_nested_markets: true,
      cursor,
      limit: 200,
    });
    all.push(...page.events);
    cursor = page.cursor || undefined;
  } while (cursor);
  return all;
}

// ---------------------------------------------------------------------------
// Default forecaster-context lookup — read sibling-repo JSONL outputs
// ---------------------------------------------------------------------------

/** Resolve the sibling-repo path; honors KEA_FORECASTER_<NAME>_ROOT env override. */
export function resolveForecasterRoot(forecaster: 'oil' | 'weather'): string {
  const envKey = forecaster === 'oil' ? 'KEA_FORECASTER_OIL_ROOT' : 'KEA_FORECASTER_WEATHER_ROOT';
  return process.env[envKey] ?? path.join(os.homedir(), 'projects', `${forecaster}-forecaster`);
}

function defaultContextLookup(forecaster: 'oil' | 'weather'): ForecasterContext | undefined {
  const root = resolveForecasterRoot(forecaster);
  const forecastsDir = path.join(root, 'data', 'forecasts');
  if (!fs.existsSync(forecastsDir)) return undefined;

  const files = fs
    .readdirSync(forecastsDir)
    .filter((f) => f.endsWith('.jsonl'))
    .sort();
  const latest = files[files.length - 1];
  if (!latest) return undefined;

  const lastRow = readLastJsonlRow(path.join(forecastsDir, latest));
  if (!lastRow) return undefined;

  return forecaster === 'oil' ? extractOilContext(lastRow) : extractWeatherContext(lastRow);
}

function extractOilContext(row: Record<string, unknown>): ForecasterContext {
  const dist = row.dist as { sigma?: number } | undefined;
  return {
    source: 'oil',
    forecastTs: typeof row.ts === 'string' ? row.ts : undefined,
    pNow: typeof row.p_now === 'number' ? row.p_now : undefined,
    sigma: typeof dist?.sigma === 'number' ? dist.sigma : undefined,
    tailProbs: row.tail_probs as Record<string, number> | undefined,
  };
}

function extractWeatherContext(row: Record<string, unknown>): ForecasterContext {
  const ensemble = row.ensemble as { mean_f?: number; std_f?: number } | undefined;
  const dist = row.dist as { sigma?: number } | undefined;
  return {
    source: 'weather',
    forecastTs: typeof row.ts === 'string' ? row.ts : undefined,
    meanF: typeof ensemble?.mean_f === 'number' ? ensemble.mean_f : undefined,
    sigma: typeof dist?.sigma === 'number' ? dist.sigma : (typeof ensemble?.std_f === 'number' ? ensemble.std_f : undefined),
    tailProbs: row.tail_probs as Record<string, number> | undefined,
  };
}

function readLastJsonlRow(filePath: string): Record<string, unknown> | undefined {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const last = lines[lines.length - 1];
  if (!last) return undefined;
  try {
    return JSON.parse(last) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

export interface ForecasterTickerFile {
  tickers: TickerEntry[];
  discoveredAt: string;
  source: 'forecaster';
}

export interface ForecasterMetadataFile {
  metadata: ForecasterTickerMetadata[];
  discoveredAt: string;
}

export function writeForecasterTickers(
  result: DiscoverForecastersResult,
  outPath: string,
): { tickersPath: string; metadataPath: string } {
  const discoveredAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const tickerFile: ForecasterTickerFile = {
    tickers: result.tickers,
    discoveredAt,
    source: 'forecaster',
  };
  fs.writeFileSync(outPath, JSON.stringify(tickerFile, null, 2) + '\n', 'utf8');

  const metadataPath = outPath.replace(/\.json$/, '.metadata.json');
  const metadataFile: ForecasterMetadataFile = {
    metadata: result.metadata,
    discoveredAt,
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadataFile, null, 2) + '\n', 'utf8');

  return { tickersPath: outPath, metadataPath };
}
