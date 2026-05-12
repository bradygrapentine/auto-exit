/**
 * mergeTickers.ts — union multiple ticker files into a single tickers.json.
 *
 * Used by the Fly cron to combine the broad `discover` output with the
 * targeted `discover-from-forecasters` output. Later inputs override earlier
 * on key collision (so forecaster entries win over broad-discover entries
 * for the same ticker — the forecaster cadence is intentional).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TickerEntry } from './multiTickerRecorder.js';

interface AnyTickerFile {
  tickers?: TickerEntry[];
}

/**
 * Read each input file (JSON, must contain a `tickers` array of TickerEntry)
 * and union them. Later inputs override earlier on ticker-symbol collision.
 */
export function mergeTickerFiles(inputPaths: ReadonlyArray<string>): TickerEntry[] {
  const merged = new Map<string, TickerEntry>();
  for (const inPath of inputPaths) {
    const raw = fs.readFileSync(inPath, 'utf8');
    const parsed = JSON.parse(raw) as AnyTickerFile;
    const tickers = parsed.tickers ?? [];
    if (!Array.isArray(tickers)) {
      throw new Error(`${inPath}: expected .tickers to be an array`);
    }
    for (const entry of tickers) {
      if (!entry || typeof entry.ticker !== 'string' || typeof entry.cadenceMs !== 'number') {
        throw new Error(`${inPath}: invalid ticker entry: ${JSON.stringify(entry)}`);
      }
      merged.set(entry.ticker, { ticker: entry.ticker, cadenceMs: entry.cadenceMs });
    }
  }
  return Array.from(merged.values());
}

export interface MergedTickerFile {
  tickers: TickerEntry[];
  discoveredAt: string;
  source: 'merged';
  inputs?: string[];
}

export function writeMergedTickers(
  tickers: ReadonlyArray<TickerEntry>,
  outPath: string,
  inputs?: ReadonlyArray<string>,
): void {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const file: MergedTickerFile = {
    tickers: [...tickers],
    discoveredAt: new Date().toISOString(),
    source: 'merged',
    ...(inputs ? { inputs: [...inputs] } : {}),
  };
  fs.writeFileSync(outPath, JSON.stringify(file, null, 2) + '\n', 'utf8');
}
