/**
 * discoverForecasters.test.ts
 *
 * Verifies the forecaster-targeted discovery flow:
 *  - Each forecaster series contributes all open markets across all open events
 *  - Cadence assigned per series (KXWTI=500ms, KXHIGH*=1500ms by default)
 *  - Pagination — cursor returns more events, all collected
 *  - Closed/settled markets within an open event are filtered out
 *  - minSecondsUntilClose skips events resolving within the window
 *  - Forecaster context injected into metadata per ticker
 *  - writeForecasterTickers writes both tickers.json and tickers.metadata.json
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  discoverForecasters,
  writeForecasterTickers,
  FORECASTER_SERIES,
  resolveForecasterRoot,
} from '../../src/backtest/discoverForecasters.js';
import type {
  ForecasterDiscoverClient,
  ForecasterContext,
} from '../../src/backtest/discoverForecasters.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type EventPage = NonNullable<
  Awaited<ReturnType<ForecasterDiscoverClient['listEvents']>>
>;

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-fdisc-test-'));
}

function mockClient(eventsBySeries: Record<string, EventPage['events']>): ForecasterDiscoverClient {
  return {
    async listEvents(opts) {
      const st = opts.series_ticker ?? '';
      return { events: eventsBySeries[st] ?? [] };
    },
  };
}

const NOOP_CONTEXT = (): undefined => undefined;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('discoverForecasters', () => {
  it('emits one TickerEntry per open market across all forecaster series', async () => {
    const client = mockClient({
      KXWTI: [
        {
          event_ticker: 'KXWTI-26MAY12',
          markets: [
            { ticker: 'KXWTI-26MAY12-T99.99', status: 'open' },
            { ticker: 'KXWTI-26MAY12-T100.99', status: 'open' },
          ],
        },
      ],
      KXHIGHNY: [
        {
          event_ticker: 'KXHIGHNY-26MAY12',
          markets: [{ ticker: 'KXHIGHNY-26MAY12-B65', status: 'open' }],
        },
      ],
    });

    const result = await discoverForecasters({
      client,
      series: [
        { series: 'KXWTI', cadenceMs: 500, forecaster: 'oil' },
        { series: 'KXHIGHNY', cadenceMs: 1500, forecaster: 'weather' },
      ],
      contextLookup: NOOP_CONTEXT,
    });

    expect(result.tickers).toHaveLength(3);
    expect(result.tickers).toEqual(
      expect.arrayContaining([
        { ticker: 'KXWTI-26MAY12-T99.99', cadenceMs: 500 },
        { ticker: 'KXWTI-26MAY12-T100.99', cadenceMs: 500 },
        { ticker: 'KXHIGHNY-26MAY12-B65', cadenceMs: 1500 },
      ]),
    );
  });

  it('filters out non-open markets inside open events', async () => {
    const client = mockClient({
      KXWTI: [
        {
          event_ticker: 'KXWTI-26MAY12',
          markets: [
            { ticker: 'KXWTI-26MAY12-T99', status: 'open' },
            { ticker: 'KXWTI-26MAY12-T100', status: 'closed' },
            { ticker: 'KXWTI-26MAY12-T101', status: 'settled' },
          ],
        },
      ],
    });

    const result = await discoverForecasters({
      client,
      series: [{ series: 'KXWTI', cadenceMs: 500, forecaster: 'oil' }],
      contextLookup: NOOP_CONTEXT,
    });

    expect(result.tickers.map((t) => t.ticker)).toEqual(['KXWTI-26MAY12-T99']);
  });

  it('paginates events via cursor', async () => {
    let calls = 0;
    const client: ForecasterDiscoverClient = {
      async listEvents(_opts) {
        calls++;
        if (calls === 1) {
          return {
            events: [
              { event_ticker: 'A', markets: [{ ticker: 'A-1', status: 'open' }] },
            ],
            cursor: 'next',
          };
        }
        return {
          events: [
            { event_ticker: 'B', markets: [{ ticker: 'B-1', status: 'open' }] },
          ],
        };
      },
    };

    const result = await discoverForecasters({
      client,
      series: [{ series: 'KXWTI', cadenceMs: 500, forecaster: 'oil' }],
      contextLookup: NOOP_CONTEXT,
    });

    expect(calls).toBe(2);
    expect(result.tickers.map((t) => t.ticker).sort()).toEqual(['A-1', 'B-1']);
  });

  it('skips events whose close_time is within minSecondsUntilClose', async () => {
    const soonClose = new Date(Date.now() + 30 * 1000).toISOString(); // 30s away
    const farClose = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h away
    const client = mockClient({
      KXWTI: [
        {
          event_ticker: 'SOON',
          markets: [{ ticker: 'SOON-1', status: 'open', close_time: soonClose }],
        },
        {
          event_ticker: 'FAR',
          markets: [{ ticker: 'FAR-1', status: 'open', close_time: farClose }],
        },
      ],
    });

    const result = await discoverForecasters({
      client,
      series: [{ series: 'KXWTI', cadenceMs: 500, forecaster: 'oil' }],
      contextLookup: NOOP_CONTEXT,
      minSecondsUntilClose: 300,
    });

    expect(result.tickers.map((t) => t.ticker)).toEqual(['FAR-1']);
  });

  it('joins forecaster context into metadata per ticker', async () => {
    const oilCtx: ForecasterContext = { source: 'oil', pNow: 101.5, sigma: 0.018 };
    const wxCtx: ForecasterContext = { source: 'weather', meanF: 65, sigma: 2.5 };
    const client = mockClient({
      KXWTI: [{ event_ticker: 'E1', markets: [{ ticker: 'KXWTI-E1-T100', status: 'open' }] }],
      KXHIGHNY: [{ event_ticker: 'E2', markets: [{ ticker: 'KXHIGHNY-E2-B65', status: 'open' }] }],
    });

    const result = await discoverForecasters({
      client,
      series: [
        { series: 'KXWTI', cadenceMs: 500, forecaster: 'oil' },
        { series: 'KXHIGHNY', cadenceMs: 1500, forecaster: 'weather' },
      ],
      contextLookup: (f) => (f === 'oil' ? oilCtx : wxCtx),
    });

    expect(result.metadata).toEqual([
      { ticker: 'KXWTI-E1-T100', series: 'KXWTI', forecaster: 'oil', context: oilCtx },
      { ticker: 'KXHIGHNY-E2-B65', series: 'KXHIGHNY', forecaster: 'weather', context: wxCtx },
    ]);
  });

  it('FORECASTER_SERIES contains the 7 documented series', () => {
    const expected = new Set([
      'KXWTI',
      'KXHIGHNY',
      'KXHIGHCHI',
      'KXHIGHPHIL',
      'KXHIGHMIA',
      'KXHIGHLAX',
      'KXHIGHDEN',
    ]);
    const actual = new Set(FORECASTER_SERIES.map((s) => s.series));
    expect(actual).toEqual(expected);
  });
});

describe('writeForecasterTickers', () => {
  it('writes tickers.json and tickers.metadata.json side-by-side', () => {
    const dir = tmpDir();
    const outPath = path.join(dir, 'tickers.forecaster.json');

    const result = writeForecasterTickers(
      {
        tickers: [{ ticker: 'A', cadenceMs: 500 }],
        metadata: [{ ticker: 'A', series: 'KXWTI', forecaster: 'oil' }],
      },
      outPath,
    );

    expect(result.tickersPath).toBe(outPath);
    expect(result.metadataPath).toBe(path.join(dir, 'tickers.forecaster.metadata.json'));

    const tickerFile = JSON.parse(fs.readFileSync(result.tickersPath, 'utf8'));
    expect(tickerFile.tickers).toEqual([{ ticker: 'A', cadenceMs: 500 }]);
    expect(tickerFile.source).toBe('forecaster');
    expect(typeof tickerFile.discoveredAt).toBe('string');

    const metaFile = JSON.parse(fs.readFileSync(result.metadataPath, 'utf8'));
    expect(metaFile.metadata).toEqual([
      { ticker: 'A', series: 'KXWTI', forecaster: 'oil' },
    ]);
  });
});

describe('resolveForecasterRoot', () => {
  it('honors KEA_FORECASTER_*_ROOT env overrides', () => {
    const prev = process.env.KEA_FORECASTER_OIL_ROOT;
    process.env.KEA_FORECASTER_OIL_ROOT = '/custom/oil-root';
    try {
      expect(resolveForecasterRoot('oil')).toBe('/custom/oil-root');
    } finally {
      if (prev === undefined) delete process.env.KEA_FORECASTER_OIL_ROOT;
      else process.env.KEA_FORECASTER_OIL_ROOT = prev;
    }
  });
});
