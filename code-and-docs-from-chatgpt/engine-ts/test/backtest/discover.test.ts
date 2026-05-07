/**
 * discover.test.ts
 *
 * Verifies the events+series discovery flow:
 *  - Happy path: multiple categories × series × events → expected ticker count
 *  - Empty category: listSeries returns [] → contributes 0, others unaffected
 *  - Empty events: series present but no qualifying events → 0 contribution
 *  - Representative market selection: highest volume_24h_fp wins; tiebreak by |price - 0.5|
 *  - Event family dedup: multiple markets per event → only representative in output
 *  - Cadence assignment: top hotPerCategory per category get 1000ms, rest 5000ms
 *  - writeTickerFile / readTickerFile round-trips
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { discoverTickers, writeTickerFile, readTickerFile } from '../../src/backtest/discover.js';
import type { DiscoverClient } from '../../src/backtest/discover.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-disc-test-'));
}

type SeriesRow = { ticker: string; title?: string; category?: string; volume_fp?: number };
type MarketRow = { ticker: string; volume_24h_fp?: number; last_price_dollars?: number; close_time?: string; status?: string };
type EventRow = { event_ticker: string; series_ticker?: string; title?: string; markets?: MarketRow[] };

/** Build a mock DiscoverClient from maps of category → series and series_ticker → events. */
function mockClient(opts: {
  seriesByCategory?: Record<string, SeriesRow[]>;
  eventsBySeries?: Record<string, EventRow[]>;
}): DiscoverClient {
  const seriesByCategory = opts.seriesByCategory ?? {};
  const eventsBySeries = opts.eventsBySeries ?? {};
  return {
    async listSeries(o = {}) {
      const cat = o.category ?? '';
      return { series: seriesByCategory[cat] ?? [] };
    },
    async listEvents(o = {}) {
      const st = o.series_ticker ?? '';
      return { events: eventsBySeries[st] ?? [] };
    },
  };
}

/** Open market that closes far in the future (qualifies for >24h filter). */
function openMarket(ticker: string, volume_24h_fp = 1000, last_price_dollars = 0.5): MarketRow {
  return { ticker, volume_24h_fp, last_price_dollars, status: 'open' };
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('discoverTickers — happy path', () => {
  it('6 categories × 1 series × 2 events → up to 6×2 tickers (perCategory=8)', async () => {
    const seriesByCategory: Record<string, SeriesRow[]> = {
      Sports:        [{ ticker: 'KXSPORTS', volume_fp: 5000 }],
      Politics:      [{ ticker: 'KXPOL', volume_fp: 4000 }],
      'Climate and Weather': [{ ticker: 'KXCLIM', volume_fp: 3000 }],
      Economics:     [{ ticker: 'KXECON', volume_fp: 2000 }],
      Crypto:        [{ ticker: 'KXCRYPTO', volume_fp: 1000 }],
      Entertainment: [{ ticker: 'KXENT', volume_fp: 500 }],
      Companies:     [{ ticker: 'KXCOMP', volume_fp: 400 }],
      Financials:    [{ ticker: 'KXFIN', volume_fp: 300 }],
    };
    const eventsBySeries: Record<string, EventRow[]> = {
      KXSPORTS:  [
        { event_ticker: 'KXSPORTS-EV1', markets: [openMarket('KXSPORTS-EV1-A', 100)] },
        { event_ticker: 'KXSPORTS-EV2', markets: [openMarket('KXSPORTS-EV2-A', 200)] },
      ],
      KXPOL:     [
        { event_ticker: 'KXPOL-EV1', markets: [openMarket('KXPOL-EV1-A', 100)] },
        { event_ticker: 'KXPOL-EV2', markets: [openMarket('KXPOL-EV2-A', 200)] },
      ],
      KXCLIM:    [
        { event_ticker: 'KXCLIM-EV1', markets: [openMarket('KXCLIM-EV1-A', 100)] },
        { event_ticker: 'KXCLIM-EV2', markets: [openMarket('KXCLIM-EV2-A', 200)] },
      ],
      KXECON:    [
        { event_ticker: 'KXECON-EV1', markets: [openMarket('KXECON-EV1-A', 100)] },
        { event_ticker: 'KXECON-EV2', markets: [openMarket('KXECON-EV2-A', 200)] },
      ],
      KXCRYPTO:  [
        { event_ticker: 'KXCRYPTO-EV1', markets: [openMarket('KXCRYPTO-EV1-A', 100)] },
        { event_ticker: 'KXCRYPTO-EV2', markets: [openMarket('KXCRYPTO-EV2-A', 200)] },
      ],
      KXENT:     [
        { event_ticker: 'KXENT-EV1', markets: [openMarket('KXENT-EV1-A', 100)] },
        { event_ticker: 'KXENT-EV2', markets: [openMarket('KXENT-EV2-A', 200)] },
      ],
      KXCOMP:    [
        { event_ticker: 'KXCOMP-EV1', markets: [openMarket('KXCOMP-EV1-A', 100)] },
        { event_ticker: 'KXCOMP-EV2', markets: [openMarket('KXCOMP-EV2-A', 200)] },
      ],
      KXFIN:     [
        { event_ticker: 'KXFIN-EV1', markets: [openMarket('KXFIN-EV1-A', 100)] },
        { event_ticker: 'KXFIN-EV2', markets: [openMarket('KXFIN-EV2-A', 200)] },
      ],
    };
    const client = mockClient({ seriesByCategory, eventsBySeries });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 2 });
    expect(tickers.length).toBe(16); // 8 categories × 2 events each
  });
});

// ---------------------------------------------------------------------------
// Empty category
// ---------------------------------------------------------------------------

describe('discoverTickers — empty category', () => {
  it('category with no series contributes 0, others unaffected', async () => {
    const client = mockClient({
      seriesByCategory: {
        Sports:        [], // empty
        Politics:      [],
        'Climate and Weather': [],
        Economics:     [],
        Crypto:        [{ ticker: 'KXBTC', volume_fp: 50000 }],
        Entertainment: [],
      },
      eventsBySeries: {
        KXBTC: [
          { event_ticker: 'KXBTC-EV1', markets: [openMarket('KXBTC-EV1-YES', 9999)] },
          { event_ticker: 'KXBTC-EV2', markets: [openMarket('KXBTC-EV2-YES', 8888)] },
        ],
      },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    expect(tickers.length).toBe(2);
    expect(tickers.every((t) => t.ticker.startsWith('KXBTC'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Empty events
// ---------------------------------------------------------------------------

describe('discoverTickers — empty events', () => {
  it('series present but listEvents returns [] → 0 contribution', async () => {
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 10000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: { KXBTC: [] },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 2 });
    expect(tickers.length).toBe(0);
  });

  it('event with no open markets is skipped', async () => {
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 5000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: {
        KXBTC: [
          {
            event_ticker: 'KXBTC-EV1',
            markets: [
              { ticker: 'KXBTC-EV1-YES', volume_24h_fp: 500, status: 'closed' }, // not open
            ],
          },
        ],
      },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    expect(tickers.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Representative market selection
// ---------------------------------------------------------------------------

describe('discoverTickers — representative market selection', () => {
  it('picks highest volume_24h_fp as representative', async () => {
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 5000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: {
        KXBTC: [
          {
            event_ticker: 'KXBTC-EV1',
            markets: [
              openMarket('KXBTC-EV1-LOW', 100, 0.5),
              openMarket('KXBTC-EV1-HIGH', 9999, 0.5),
              openMarket('KXBTC-EV1-MID', 500, 0.5),
            ],
          },
        ],
      },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    expect(tickers).toHaveLength(1);
    expect(tickers[0].ticker).toBe('KXBTC-EV1-HIGH');
  });

  it('tiebreaks by smallest |price - 0.5| when volumes equal', async () => {
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 5000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: {
        KXBTC: [
          {
            event_ticker: 'KXBTC-EV1',
            markets: [
              openMarket('KXBTC-EV1-FAR', 1000, 0.9),  // |0.9-0.5| = 0.4
              openMarket('KXBTC-EV1-MID', 1000, 0.55), // |0.55-0.5| = 0.05 ← wins
            ],
          },
        ],
      },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    expect(tickers[0].ticker).toBe('KXBTC-EV1-MID');
  });
});

// ---------------------------------------------------------------------------
// Event family dedup
// ---------------------------------------------------------------------------

describe('discoverTickers — event family dedup', () => {
  it('two markets in same event → only one ticker in output', async () => {
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 5000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: {
        KXBTC: [
          {
            event_ticker: 'KXBTC-EV1',
            markets: [
              openMarket('KXBTC-EV1-YES', 500, 0.7),
              openMarket('KXBTC-EV1-NO', 200, 0.3),
            ],
          },
        ],
      },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    expect(tickers).toHaveLength(1);
    expect(tickers[0].ticker).toBe('KXBTC-EV1-YES'); // higher volume_24h_fp
  });
});

// ---------------------------------------------------------------------------
// Cadence assignment
// ---------------------------------------------------------------------------

describe('discoverTickers — cadence assignment', () => {
  it('top hotPerCategory per category get 1000ms cadence, rest get 5000ms', async () => {
    // 4 events for Crypto
    const events: EventRow[] = Array.from({ length: 4 }, (_, i) => ({
      event_ticker: `KXBTC-EV${i}`,
      markets: [openMarket(`KXBTC-EV${i}-M`, (4 - i) * 1000)],
    }));
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 10000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: { KXBTC: events },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 2 });
    expect(tickers).toHaveLength(4);
    // Events are sorted by aggregate eventVolume desc; verify cadence by position
    expect(tickers[0].cadenceMs).toBe(1000);
    expect(tickers[1].cadenceMs).toBe(1000);
    expect(tickers[2].cadenceMs).toBe(5000);
    expect(tickers[3].cadenceMs).toBe(5000);
  });

  it('hotPerCategory=0 → all 5000ms', async () => {
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 5000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: {
        KXBTC: [
          { event_ticker: 'KXBTC-EV1', markets: [openMarket('KXBTC-EV1-M', 100)] },
          { event_ticker: 'KXBTC-EV2', markets: [openMarket('KXBTC-EV2-M', 200)] },
        ],
      },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 0 });
    for (const t of tickers) {
      expect(t.cadenceMs).toBe(5000);
    }
  });

  it('perCategory caps output per category', async () => {
    const events: EventRow[] = Array.from({ length: 10 }, (_, i) => ({
      event_ticker: `KXBTC-EV${i}`,
      markets: [openMarket(`KXBTC-EV${i}-M`, (10 - i) * 100)],
    }));
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 10000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: { KXBTC: events },
    });
    const tickers = await discoverTickers({ client, perCategory: 4, hotPerCategory: 1 });
    expect(tickers).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Event volume ordering
// ---------------------------------------------------------------------------

describe('discoverTickers — event ordering by volume', () => {
  it('returns events sorted by aggregate event volume desc', async () => {
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 5000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: {
        KXBTC: [
          { event_ticker: 'KXBTC-LOW',  markets: [openMarket('KXBTC-LOW-M', 100)] },
          { event_ticker: 'KXBTC-HIGH', markets: [openMarket('KXBTC-HIGH-M', 9999)] },
          { event_ticker: 'KXBTC-MID',  markets: [openMarket('KXBTC-MID-M', 5000)] },
        ],
      },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    expect(tickers[0].ticker).toBe('KXBTC-HIGH-M');
    expect(tickers[1].ticker).toBe('KXBTC-MID-M');
    expect(tickers[2].ticker).toBe('KXBTC-LOW-M');
  });

  it('aggregates multi-market event volume correctly', async () => {
    const client = mockClient({
      seriesByCategory: {
        Crypto: [{ ticker: 'KXBTC', volume_fp: 5000 }],
        Sports: [], Politics: [], 'Climate and Weather': [], Economics: [], Entertainment: [],
      },
      eventsBySeries: {
        KXBTC: [
          {
            event_ticker: 'KXBTC-EV1',
            // Two markets: combined vol = 2000+3000 = 5000
            markets: [
              openMarket('KXBTC-EV1-YES', 2000, 0.6),
              openMarket('KXBTC-EV1-NO', 3000, 0.4),
            ],
          },
          {
            event_ticker: 'KXBTC-EV2',
            markets: [openMarket('KXBTC-EV2-M', 4999)],
          },
        ],
      },
    });
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    // EV1 aggregate = 5000 > EV2 = 4999 → EV1 first
    expect(tickers[0].ticker).toBe('KXBTC-EV1-NO'); // highest individual vol in EV1 is NO(3000)
    expect(tickers[1].ticker).toBe('KXBTC-EV2-M');
  });
});

// ---------------------------------------------------------------------------
// writeTickerFile / readTickerFile round-trip
// ---------------------------------------------------------------------------

describe('writeTickerFile + readTickerFile', () => {
  let dir: string;

  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('round-trips tickers through disk', () => {
    const tickers = [
      { ticker: 'KXBTC-EV1-YES', cadenceMs: 1000 },
      { ticker: 'KXPOL-EV2-M', cadenceMs: 5000 },
    ];
    const filePath = path.join(dir, 'tickers.json');
    writeTickerFile(tickers, filePath);

    const loaded = readTickerFile(filePath);
    expect(loaded.tickers).toEqual(tickers);
    expect(loaded.discoveredAt).toBeTruthy();
    expect(new Date(loaded.discoveredAt).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('creates parent directories if needed', () => {
    const nested = path.join(dir, 'a', 'b', 'c', 'tickers.json');
    writeTickerFile([{ ticker: 'KXBTC-T', cadenceMs: 1000 }], nested);
    expect(fs.existsSync(nested)).toBe(true);
  });

  it('output is valid JSON', () => {
    const filePath = path.join(dir, 'out.json');
    writeTickerFile([{ ticker: 'KXBTC-X', cadenceMs: 1000 }], filePath);
    const raw = fs.readFileSync(filePath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
