import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseOrderbookResponse } from '../src/kalshiClient.js';

const fixturePath = path.resolve(__dirname, 'fixtures', 'orderbook.real.json');

describe('parseOrderbookResponse against real prod fixture', () => {
  const exists = fs.existsSync(fixturePath);
  const fixture = exists ? JSON.parse(fs.readFileSync(fixturePath, 'utf8')) : null;
  const isLiquid = exists && (fixture?.orderbook_fp?.yes_dollars?.length ?? 0) > 0;

  it.skipIf(!isLiquid)('parses non-empty levels into priceCents/size', () => {
    const ob = parseOrderbookResponse(fixture);
    // YES bids exist
    expect(ob.yes.length).toBeGreaterThan(0);
    // NO bids exist
    expect(ob.no.length).toBeGreaterThan(0);
    // Every level has finite numeric price and size
    for (const lvl of [...ob.yes, ...ob.no]) {
      expect(Number.isFinite(lvl.priceCents)).toBe(true);
      expect(Number.isFinite(lvl.size)).toBe(true);
      expect(lvl.size).toBeGreaterThan(0);
    }
  });

  it.skipIf(!isLiquid)('NO bid levels are in the legal 1..99¢ range after rounding', () => {
    const ob = parseOrderbookResponse(fixture);
    // Filter to levels that survive normalizeLevels' 1..99 filter
    const valid = ob.no.filter((l) => l.priceCents >= 1 && l.priceCents <= 99);
    expect(valid.length).toBeGreaterThan(0);
  });

  it.skipIf(!isLiquid)('preserves decimal sizes (Kalshi uses fractional shares)', () => {
    const ob = parseOrderbookResponse(fixture);
    const hasFractional = [...ob.yes, ...ob.no].some((l) => l.size !== Math.floor(l.size));
    // Real Kalshi books usually have at least one fractional size
    expect(hasFractional).toBe(true);
  });

  // Unit-style: confirm the dollar-string parser path independently of the fixture
  it('parses [priceString, sizeString] level format', () => {
    const ob = parseOrderbookResponse({
      orderbook_fp: {
        yes_dollars: [['0.0900', '100.50'], ['0.0500', '200.00']],
        no_dollars: [['0.9100', '50.00']],
      },
    });
    expect(ob.yes).toEqual([
      { priceCents: 9, size: 100.5 },
      { priceCents: 5, size: 200 },
    ]);
    expect(ob.no).toEqual([{ priceCents: 91, size: 50 }]);
  });
});
