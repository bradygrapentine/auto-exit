/**
 * mergeTickers.test.ts
 *
 * Verifies the union/override semantics required by the Fly cron:
 *  - No overlap → all unique entries kept
 *  - Overlap → later input wins (forecaster overrides broad discover)
 *  - Empty file is tolerated (zero-row input contributes nothing)
 *  - Malformed input throws
 *  - writeMergedTickers round-trips correctly
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { mergeTickerFiles, writeMergedTickers } from '../../src/backtest/mergeTickers.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-merge-test-'));
}

function writeFile(dir: string, name: string, body: unknown): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, JSON.stringify(body), 'utf8');
  return p;
}

describe('mergeTickerFiles', () => {
  it('unions disjoint files', () => {
    const dir = tmpDir();
    const a = writeFile(dir, 'a.json', {
      tickers: [{ ticker: 'KXA-1', cadenceMs: 1000 }],
    });
    const b = writeFile(dir, 'b.json', {
      tickers: [{ ticker: 'KXB-1', cadenceMs: 2000 }],
    });

    const merged = mergeTickerFiles([a, b]);
    expect(merged).toEqual([
      { ticker: 'KXA-1', cadenceMs: 1000 },
      { ticker: 'KXB-1', cadenceMs: 2000 },
    ]);
  });

  it('later input overrides earlier on ticker collision', () => {
    const dir = tmpDir();
    const broad = writeFile(dir, 'broad.json', {
      tickers: [
        { ticker: 'KXWTI-X', cadenceMs: 5000 },
        { ticker: 'KXOTHER-1', cadenceMs: 5000 },
      ],
    });
    const forecaster = writeFile(dir, 'forecaster.json', {
      tickers: [{ ticker: 'KXWTI-X', cadenceMs: 500 }],
    });

    const merged = mergeTickerFiles([broad, forecaster]);
    const byTicker = new Map(merged.map((t) => [t.ticker, t.cadenceMs]));
    expect(byTicker.get('KXWTI-X')).toBe(500); // forecaster cadence wins
    expect(byTicker.get('KXOTHER-1')).toBe(5000); // untouched
  });

  it('tolerates a file with an empty tickers array', () => {
    const dir = tmpDir();
    const empty = writeFile(dir, 'empty.json', { tickers: [] });
    const full = writeFile(dir, 'full.json', {
      tickers: [{ ticker: 'KX-1', cadenceMs: 1000 }],
    });
    expect(mergeTickerFiles([empty, full])).toEqual([
      { ticker: 'KX-1', cadenceMs: 1000 },
    ]);
  });

  it('throws on malformed tickers field', () => {
    const dir = tmpDir();
    const bad = writeFile(dir, 'bad.json', { tickers: 'not-an-array' });
    expect(() => mergeTickerFiles([bad])).toThrow(/expected \.tickers to be an array/);
  });

  it('throws on malformed entry', () => {
    const dir = tmpDir();
    const bad = writeFile(dir, 'bad.json', {
      tickers: [{ ticker: 'KX-1' }], // missing cadenceMs
    });
    expect(() => mergeTickerFiles([bad])).toThrow(/invalid ticker entry/);
  });
});

describe('writeMergedTickers', () => {
  it('writes the merged set with source=merged and a discoveredAt timestamp', () => {
    const dir = tmpDir();
    const outPath = path.join(dir, 'tickers.json');
    writeMergedTickers([{ ticker: 'KX-1', cadenceMs: 500 }], outPath, ['a.json', 'b.json']);

    const file = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    expect(file.tickers).toEqual([{ ticker: 'KX-1', cadenceMs: 500 }]);
    expect(file.source).toBe('merged');
    expect(file.inputs).toEqual(['a.json', 'b.json']);
    expect(typeof file.discoveredAt).toBe('string');
  });
});
