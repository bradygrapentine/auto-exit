/**
 * resolution.ts — SH-EDGE Task 7
 *
 * Lazy + disk-cached fetch of Kalshi market resolution outcomes. Used by the
 * edge pipeline to convert "unresolved fire (mark-to-mid)" into "resolved fire
 * (resolution at 0¢ or 100¢)" once the market settles.
 *
 * Cache format: $KEA_HOME/edge-snapshots/resolutions.json — flat object
 * { ticker: cents } where cents ∈ {0, 100}. Append-only; never expired (a
 * resolved market can't unresolve).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';

export interface MarketResolution {
  status: 'open' | 'closed' | 'settled' | string;
  /** 100 if YES resolved, 0 if NO resolved, null if not yet settled. */
  resolutionPriceCents: number | null;
}

export type MarketResolutionFetcher = (ticker: string) => Promise<MarketResolution>;

const CACHE_FILENAME = 'resolutions.json';

function cachePath(dir: string): string {
  return join(dir, CACHE_FILENAME);
}

function readCache(dir: string): Record<string, number> {
  const path = cachePath(dir);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

function writeCache(dir: string, cache: Record<string, number>): void {
  mkdirSync(dirname(cachePath(dir)), { recursive: true });
  const path = cachePath(dir);
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(cache, null, 2));
  renameSync(tmp, path);
}

/**
 * Returns resolution price in cents (0 or 100) for a settled market, or null
 * for unresolved markets. Caches resolved outcomes; never caches unresolved
 * (re-checks every call until the market settles).
 */
export async function fetchResolution(
  ticker: string,
  fetcher: MarketResolutionFetcher,
  dir: string,
): Promise<number | null> {
  const cache = readCache(dir);
  if (Object.prototype.hasOwnProperty.call(cache, ticker)) {
    return cache[ticker];
  }
  const result = await fetcher(ticker);
  if (result.resolutionPriceCents === null) {
    return null;
  }
  cache[ticker] = result.resolutionPriceCents;
  writeCache(dir, cache);
  return result.resolutionPriceCents;
}

/**
 * Resolve a set of tickers, deduping and using the same disk cache.
 * Returns a map ticker → cents-or-null.
 */
export async function resolveAll(
  tickers: string[],
  fetcher: MarketResolutionFetcher,
  dir: string,
): Promise<Record<string, number | null>> {
  const unique = Array.from(new Set(tickers));
  const out: Record<string, number | null> = {};
  for (const t of unique) {
    out[t] = await fetchResolution(t, fetcher, dir);
  }
  return out;
}
