/**
 * discover.test.ts
 *
 * Verifies:
 *  - sampling honors perCategory + hotPerCategory
 *  - sort order (hot first, then standard, by volume)
 *  - categories cap at perCategory
 *  - 'other' category excluded
 *  - writeTickerFile / readTickerFile round-trips
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { discoverTickers, writeTickerFile, readTickerFile } from '../../src/backtest/discover.js';
import type { RawMarket, DiscoverClient } from '../../src/backtest/discover.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-disc-test-'));
}

function makeMarket(ticker: string, volume: number): RawMarket {
  return { ticker, volume };
}

function makeDollarMarket(ticker: string, dollar_volume: number): RawMarket {
  return { ticker, dollar_volume };
}

function mockClient(markets: RawMarket[]): DiscoverClient {
  return {
    async listMarkets(_params) {
      return markets;
    },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SPORTS_MARKETS: RawMarket[] = [
  makeMarket('KXNFL-2024-WK1', 9000),
  makeMarket('KXNFL-2024-WK2', 8000),
  makeMarket('KXNBA-FINALS', 7000),
  makeMarket('KXNBA-EAST1', 6000),
  makeMarket('KXMLB-WS24', 5000),
  makeMarket('KXNHL-CUP24', 4000),
  makeMarket('KXNFL-2024-WK3', 3000),
  makeMarket('KXNFL-2024-WK4', 2000),
  makeMarket('KXNFL-2024-WK5', 1000), // 9th — should be excluded at perCategory=8
];

const CRYPTO_MARKETS: RawMarket[] = [
  makeMarket('KXBTC-100K', 50000),
  makeMarket('KXETH-5K', 30000),
];

const OTHER_MARKETS: RawMarket[] = [
  makeMarket('KXUNKNOWN-123', 99999), // should be excluded (other)
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('discoverTickers', () => {
  it('caps at perCategory per category', async () => {
    const client = mockClient([...SPORTS_MARKETS, ...CRYPTO_MARKETS]);
    const tickers = await discoverTickers({ client, perCategory: 4, hotPerCategory: 1 });
    const sports = tickers.filter((t) => t.ticker.startsWith('KXN') || t.ticker.startsWith('KXMLB'));
    expect(sports.length).toBeLessThanOrEqual(4);
  });

  it('assigns hot cadence to first hotPerCategory entries per category', async () => {
    const client = mockClient([...CRYPTO_MARKETS]);
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    const btc = tickers.find((t) => t.ticker === 'KXBTC-100K');
    const eth = tickers.find((t) => t.ticker === 'KXETH-5K');
    expect(btc?.cadenceMs).toBe(500);   // hotPerCategory=1 → first is hot
    expect(eth?.cadenceMs).toBe(2000);  // second is standard
  });

  it('excludes other category markets', async () => {
    const client = mockClient([...CRYPTO_MARKETS, ...OTHER_MARKETS]);
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 2 });
    const unknown = tickers.find((t) => t.ticker.startsWith('KXUNKNOWN'));
    expect(unknown).toBeUndefined();
  });

  it('sorts by volume descending within each category', async () => {
    const markets: RawMarket[] = [
      makeMarket('KXBTC-LOW', 100),
      makeMarket('KXBTC-HIGH', 9999),
      makeMarket('KXBTC-MID', 5000),
    ];
    const client = mockClient(markets);
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    const crypto = tickers.filter((t) => t.ticker.startsWith('KXBTC'));
    expect(crypto[0]!.ticker).toBe('KXBTC-HIGH');
    expect(crypto[1]!.ticker).toBe('KXBTC-MID');
    expect(crypto[2]!.ticker).toBe('KXBTC-LOW');
  });

  it('handles dollar_volume field when volume is absent', async () => {
    const markets: RawMarket[] = [
      makeDollarMarket('KXBTC-A', 1000),
      makeDollarMarket('KXBTC-B', 5000),
    ];
    const client = mockClient(markets);
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    const crypto = tickers.filter((t) => t.ticker.startsWith('KXBTC'));
    expect(crypto[0]!.ticker).toBe('KXBTC-B'); // higher dollar_volume first
  });

  it('returns only non-empty categories', async () => {
    const client = mockClient(CRYPTO_MARKETS); // only crypto present
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 1 });
    expect(tickers.every((t) => t.ticker.startsWith('KX'))).toBe(true);
    expect(tickers.length).toBe(2);
  });

  it('hotPerCategory=0 → all standard cadence', async () => {
    const client = mockClient(CRYPTO_MARKETS);
    const tickers = await discoverTickers({ client, perCategory: 8, hotPerCategory: 0 });
    for (const t of tickers) {
      expect(t.cadenceMs).toBe(2000);
    }
  });

  it('default perCategory=8, hotPerCategory=2', async () => {
    const manyBtc = Array.from({ length: 10 }, (_, i) =>
      makeMarket(`KXBTC-${String(i).padStart(2, '0')}`, (10 - i) * 1000),
    );
    const client = mockClient(manyBtc);
    const tickers = await discoverTickers({ client });
    const crypto = tickers.filter((t) => t.ticker.startsWith('KXBTC'));
    expect(crypto).toHaveLength(8); // default perCategory=8
    expect(crypto.filter((t) => t.cadenceMs === 500)).toHaveLength(2); // default hotPerCategory=2
    expect(crypto.filter((t) => t.cadenceMs === 2000)).toHaveLength(6);
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
      { ticker: 'KXBTC-100K', cadenceMs: 500 },
      { ticker: 'KXETH-5K', cadenceMs: 2000 },
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
    writeTickerFile([{ ticker: 'KXBTC-T', cadenceMs: 500 }], nested);
    expect(fs.existsSync(nested)).toBe(true);
  });

  it('output is valid JSON', () => {
    const filePath = path.join(dir, 'out.json');
    writeTickerFile([{ ticker: 'KXBTC-X', cadenceMs: 500 }], filePath);
    const raw = fs.readFileSync(filePath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
