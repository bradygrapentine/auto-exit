/**
 * pipeline.test.ts — SH-EDGE Task 8
 *
 * End-to-end pipeline integration:
 *  1. Empty journals → empty snapshot
 *  2. Single fire fixture → snapshot with one fire
 *  3. With resolution fetcher → unresolved fires get enriched
 *  4. Without resolution fetcher → fires stay unresolved (back-compat)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { generateSnapshot, enrichWithResolutions } from '../../src/edge/pipeline.js';
import type { Fire } from '../../src/types.js';
import type { MarketResolutionFetcher } from '../../src/edge/resolution.js';

let kea: string;

beforeEach(() => {
  kea = mkdtempSync(join(tmpdir(), 'edge-pipeline-'));
  process.env['KEA_HOME'] = kea;
  mkdirSync(join(kea, 'jobs'), { recursive: true });
});

afterEach(() => {
  rmSync(kea, { recursive: true, force: true });
  delete process.env['KEA_HOME'];
});

describe('generateSnapshot — empty', () => {
  it('returns empty snapshot when no journal data', async () => {
    const snap = await generateSnapshot({
      since: new Date('2026-01-01'),
      until: new Date('2026-12-31'),
    });
    expect(snap.totalFires).toBe(0);
    expect(snap.perStrategy).toEqual([]);
    expect(snap.perMarket).toEqual([]);
  });
});

describe('generateSnapshot — fixture journal', () => {
  it('produces snapshot with at least one fire from a journal', async () => {
    // Minimal viable journal: one job with order_intent → order_placed → order_reconciled → tca
    const jobId = 'test-job-1';
    const ticker = 'KXBTC-26MAY09H1700-B85000';
    const entries = [
      {
        ts: '2026-05-09T10:00:00.000Z',
        kind: 'loop_started',
        data: { jobId, ticker, side: 'yes', size: 10, strategy: 's-trail' },
      },
      {
        ts: '2026-05-09T10:00:01.000Z',
        kind: 'order_intent',
        data: { jobId, arrivalMidCents: 51, clientOrderId: 'co-1', payload: { ticker, side: 'yes', action: 'sell', count: 10, yes_price: 50, time_in_force: 'immediate_or_cancel' } },
      },
      {
        ts: '2026-05-09T10:00:02.000Z',
        kind: 'order_placed',
        data: {
          jobId,
          orderId: 'o-1',
          payload: { ticker, side: 'yes', action: 'sell', count: 10, yes_price: 50, time_in_force: 'immediate_or_cancel' },
          orderbook: { yes: [{ priceCents: 50, size: 100 }], no: [{ priceCents: 52, size: 100 }] },
        },
      },
      {
        ts: '2026-05-09T10:00:03.000Z',
        kind: 'order_reconciled',
        data: { jobId, orderId: 'o-1', executedPriceCents: 50, filledCount: 10, action: 'sell' },
      },
      {
        ts: '2026-05-09T10:00:04.000Z',
        kind: 'tca',
        data: {
          jobId,
          ticker,
          side: 'sell',
          chunkIndex: 0,
          arrivalMidCents: 51,
          executedPriceCents: 50,
          slippageCents: -1,
          chunkSize: 10,
          depthTier: 1,
        },
      },
      {
        ts: '2026-05-09T10:00:05.000Z',
        kind: 'loop_finished',
        data: { jobId, reason: 'filled' },
      },
    ];
    writeFileSync(
      join(kea, 'jobs', `${jobId}.jsonl`),
      entries.map((e) => JSON.stringify(e)).join('\n') + '\n',
    );

    const snap = await generateSnapshot({
      since: new Date('2026-05-09T00:00:00Z'),
      until: new Date('2026-05-09T23:59:59Z'),
    });
    expect(snap.totalFires).toBeGreaterThanOrEqual(1);
    expect(snap.totals.realizedPnLDollars).toBeTypeOf('number');
  });
});

describe('enrichWithResolutions', () => {
  function makeFire(ticker: string, unresolved: boolean): Fire {
    return {
      fireId: `fire-${ticker}`,
      jobId: `job-${ticker}`,
      strategy: 's-trail',
      ticker,
      marketCategory: 'other',
      side: 'yes',
      arrivalMidCents: 50,
      decisionMidCents: 50,
      entryFills: [{ priceCents: 50, size: 10, ts: '2026-05-09T10:00:00Z' }],
      exitFills: [],
      resolutionPriceCents: undefined,
      unresolved,
    };
  }

  it('populates resolutionPriceCents when fetcher returns settled price', async () => {
    const fetcher: MarketResolutionFetcher = vi.fn(async (ticker: string) => {
      if (ticker === 'KX-A') return { status: 'settled', resolutionPriceCents: 100 };
      return { status: 'open', resolutionPriceCents: null };
    });
    const fires = [makeFire('KX-A', true), makeFire('KX-B', true)];
    const enriched = await enrichWithResolutions(fires, fetcher, kea);
    expect(enriched[0].resolutionPriceCents).toBe(100);
    expect(enriched[0].unresolved).toBe(false);
    expect(enriched[1].resolutionPriceCents).toBeUndefined();
    expect(enriched[1].unresolved).toBe(true);
  });

  it('skips fires already resolved (does not re-fetch)', async () => {
    const fetcher: MarketResolutionFetcher = vi.fn(async () => ({
      status: 'settled',
      resolutionPriceCents: 100,
    }));
    const f = makeFire('KX-A', false);
    f.resolutionPriceCents = 0;
    const enriched = await enrichWithResolutions([f], fetcher, kea);
    expect(enriched[0].resolutionPriceCents).toBe(0);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
