/**
 * resolution.test.ts — SH-EDGE Task 7
 *
 * Lazy resolution fetch + disk cache.
 *  1. cache miss → calls fetcher, writes cache, returns price
 *  2. cache hit → does NOT call fetcher
 *  3. unresolved market (status=open) → returns null, does NOT cache
 *  4. fetcher error → propagates, does NOT cache
 *  5. resolveAll batches a set of tickers, deduping
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  fetchResolution,
  resolveAll,
  type MarketResolutionFetcher,
  type MarketResolution,
} from '../../src/edge/resolution.js';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'edge-resolution-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function makeFetcher(map: Record<string, MarketResolution>): MarketResolutionFetcher & { calls: string[] } {
  const calls: string[] = [];
  const fn: any = async (ticker: string) => {
    calls.push(ticker);
    return map[ticker] ?? { status: 'open', resolutionPriceCents: null };
  };
  fn.calls = calls;
  return fn;
}

describe('fetchResolution', () => {
  it('cache miss → calls fetcher, writes cache, returns price', async () => {
    const fetcher = makeFetcher({
      'KX-A': { status: 'settled', resolutionPriceCents: 100 },
    });
    const out = await fetchResolution('KX-A', fetcher, tmp);
    expect(out).toBe(100);
    expect(fetcher.calls).toEqual(['KX-A']);
    const cachePath = join(tmp, 'resolutions.json');
    expect(existsSync(cachePath)).toBe(true);
    const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
    expect(cache['KX-A']).toBe(100);
  });

  it('cache hit → does not call fetcher', async () => {
    const fetcher = makeFetcher({
      'KX-A': { status: 'settled', resolutionPriceCents: 0 },
    });
    await fetchResolution('KX-A', fetcher, tmp);
    expect(fetcher.calls.length).toBe(1);

    const out = await fetchResolution('KX-A', fetcher, tmp);
    expect(out).toBe(0);
    expect(fetcher.calls.length).toBe(1); // unchanged
  });

  it('unresolved market → returns null, does NOT cache', async () => {
    const fetcher = makeFetcher({
      'KX-OPEN': { status: 'open', resolutionPriceCents: null },
    });
    const out = await fetchResolution('KX-OPEN', fetcher, tmp);
    expect(out).toBeNull();
    const cachePath = join(tmp, 'resolutions.json');
    if (existsSync(cachePath)) {
      const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
      expect(cache['KX-OPEN']).toBeUndefined();
    }
    // Second call re-hits fetcher (no cache entry)
    await fetchResolution('KX-OPEN', fetcher, tmp);
    expect(fetcher.calls.length).toBe(2);
  });

  it('fetcher error → propagates, does NOT cache', async () => {
    const fetcher: MarketResolutionFetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'));
    await expect(fetchResolution('KX-X', fetcher, tmp)).rejects.toThrow('network down');
    const cachePath = join(tmp, 'resolutions.json');
    expect(existsSync(cachePath)).toBe(false);
  });
});

describe('resolveAll', () => {
  it('batches a set of tickers, deduping, returning per-ticker map', async () => {
    const fetcher = makeFetcher({
      'KX-A': { status: 'settled', resolutionPriceCents: 100 },
      'KX-B': { status: 'settled', resolutionPriceCents: 0 },
      'KX-C': { status: 'open', resolutionPriceCents: null },
    });
    const out = await resolveAll(['KX-A', 'KX-B', 'KX-C', 'KX-A'], fetcher, tmp);
    expect(out).toEqual({ 'KX-A': 100, 'KX-B': 0, 'KX-C': null });
    // KX-A only fetched once even though listed twice
    expect(fetcher.calls.filter((t) => t === 'KX-A').length).toBe(1);
  });
});
