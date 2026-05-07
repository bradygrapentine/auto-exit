/**
 * SH-BACKTEST Phase A — append-only NDJSON recorder with daily UTC rotation.
 *
 * File path: <dir>/<ticker>-<YYYYMMDD>.ndjson
 * Rotates at UTC midnight by closing the current handle and opening a new one.
 * Depth truncated to top `depthLevels` per side (default 10, env KEA_RECORDING_DEPTH_LEVELS).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Recorder, OrderbookInput, SnapshotEntry, PositionEntry, FillEntry } from './types.js';

const DEFAULT_DEPTH = 10;
const ENV_DEPTH_KEY = 'KEA_RECORDING_DEPTH_LEVELS';

function resolveDepth(override?: number): number {
  const env = process.env[ENV_DEPTH_KEY];
  const raw = override ?? (env !== undefined ? Number(env) : DEFAULT_DEPTH);
  return Math.min(50, Math.max(1, Math.floor(raw)));
}

function utcDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function filePath(dir: string, ticker: string, date: string): string {
  return path.join(dir, `${ticker}-${date}.ndjson`);
}

function toTuples(levels: OrderbookInput['yes'], depth: number): Array<[number, number]> {
  return levels.slice(0, depth).map(l => [l.priceCents, l.size]);
}

export interface RecorderOptions {
  dir: string;
  ticker: string;
  depthLevels?: number;
  /** Injected for testing — defaults to () => new Date() */
  _nowFn?: () => Date;
}

export function createRecorder(opts: RecorderOptions): Recorder {
  const { dir, ticker } = opts;
  const depthLevels = resolveDepth(opts.depthLevels);
  const nowFn = opts._nowFn ?? (() => new Date());

  fs.mkdirSync(dir, { recursive: true });

  let currentDate = utcDateString(nowFn());
  let fd = fs.openSync(filePath(dir, ticker, currentDate), 'a');

  function rotate(): void {
    const today = utcDateString(nowFn());
    if (today !== currentDate) {
      fs.closeSync(fd);
      currentDate = today;
      fd = fs.openSync(filePath(dir, ticker, currentDate), 'a');
    }
  }

  function writeLine(entry: SnapshotEntry | PositionEntry | FillEntry): void {
    rotate();
    fs.writeSync(fd, JSON.stringify(entry) + '\n');
  }

  return {
    appendSnapshot(orderbook, _position, latencyMs) {
      const ts = nowFn().toISOString();
      const entry: SnapshotEntry = {
        kind: 'snapshot',
        ts,
        ticker,
        orderbook: {
          yes: toTuples(orderbook.yes, depthLevels),
          no: toTuples(orderbook.no, depthLevels),
        },
        depth_levels: depthLevels,
        ...(latencyMs !== undefined ? { poll_latency_ms: latencyMs } : {}),
      };
      writeLine(entry);
    },

    appendPosition(partial) {
      const ts = nowFn().toISOString();
      const entry: PositionEntry = { kind: 'position', ts, ...partial };
      writeLine(entry);
    },

    appendFill(partial) {
      const ts = nowFn().toISOString();
      const entry: FillEntry = { kind: 'fill', ts, ...partial };
      writeLine(entry);
    },

    close() {
      fs.closeSync(fd);
    },
  };
}
