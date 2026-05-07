import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createRecorder } from '../../src/backtest/recorder.js';
import type { SnapshotEntry, PositionEntry, FillEntry } from '../../src/backtest/types.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-rec-test-'));
}

function readLines(fp: string): string[] {
  return fs.readFileSync(fp, 'utf8').split('\n').filter(l => l.trim() !== '');
}

// Input uses PriceLevel {priceCents, size} shape (watcher's Orderbook type).
const BOOK = {
  yes: [{ priceCents: 42, size: 1200 }, { priceCents: 41, size: 800 }],
  no: [{ priceCents: 58, size: 1400 }, { priceCents: 59, size: 700 }],
};

describe('recorder', () => {
  let dir: string;

  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('append-then-read round-trip for snapshot', () => {
    const rec = createRecorder({ dir, ticker: 'KXTEST-01' });
    rec.appendSnapshot(BOOK, undefined, 55);
    rec.close();

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ndjson'));
    expect(files).toHaveLength(1);
    const lines = readLines(path.join(dir, files[0]!));
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]!) as SnapshotEntry;
    expect(entry.kind).toBe('snapshot');
    expect(entry.ticker).toBe('KXTEST-01');
    expect(entry.poll_latency_ms).toBe(55);
    expect(entry.orderbook.yes[0]).toEqual([42, 1200]); // serialized as tuple
    expect(entry.depth_levels).toBe(10);
  });

  it('appendPosition round-trip', () => {
    const rec = createRecorder({ dir, ticker: 'KXTEST-01' });
    rec.appendPosition({
      ticker: 'KXTEST-01',
      side: 'yes',
      quantity: 80,
      avg_cost_cents: 38,
      delta: { filled: 20, side: 'yes', price_cents: 42 },
    });
    rec.close();

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ndjson'));
    const lines = readLines(path.join(dir, files[0]!));
    const entry = JSON.parse(lines[0]!) as PositionEntry;
    expect(entry.kind).toBe('position');
    expect(entry.quantity).toBe(80);
    expect(entry.delta.price_cents).toBe(42);
  });

  it('appendFill round-trip', () => {
    const rec = createRecorder({ dir, ticker: 'KXTEST-01' });
    rec.appendFill({
      ticker: 'KXTEST-01',
      order_id: 'ord-abc',
      side: 'yes',
      size: 20,
      price_cents: 42,
      is_taker: true,
      fees_cents: 14,
    });
    rec.close();

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ndjson'));
    const lines = readLines(path.join(dir, files[0]!));
    const entry = JSON.parse(lines[0]!) as FillEntry;
    expect(entry.kind).toBe('fill');
    expect(entry.order_id).toBe('ord-abc');
    expect(entry.fees_cents).toBe(14);
  });

  it('daily rotation creates new file at UTC midnight crossing', () => {
    let callCount = 0;
    const dates = [
      new Date('2026-05-05T23:59:59.000Z'),
      new Date('2026-05-05T23:59:59.500Z'),
      new Date('2026-05-06T00:00:00.100Z'), // crosses midnight
    ];
    const nowFn = () => dates[callCount++ % dates.length]!;

    const rec = createRecorder({ dir, ticker: 'KXTEST-01', _nowFn: nowFn });
    rec.appendSnapshot(BOOK); // day 1
    rec.appendSnapshot(BOOK); // day 1
    rec.appendSnapshot(BOOK); // day 2
    rec.close();

    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.ndjson'))
      .sort();
    expect(files).toHaveLength(2);
    expect(files[0]).toContain('20260505');
    expect(files[1]).toContain('20260506');

    const day1Lines = readLines(path.join(dir, files[0]!));
    const day2Lines = readLines(path.join(dir, files[1]!));
    expect(day1Lines).toHaveLength(2);
    expect(day2Lines).toHaveLength(1);
  });

  it('multiple appends preserve ordering', () => {
    const rec = createRecorder({ dir, ticker: 'KXTEST-01' });
    for (let i = 0; i < 5; i++) {
      rec.appendSnapshot({ yes: [{ priceCents: i, size: 100 }], no: [] });
    }
    rec.close();

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ndjson'));
    const lines = readLines(path.join(dir, files[0]!));
    expect(lines).toHaveLength(5);
    for (let i = 0; i < 5; i++) {
      const e = JSON.parse(lines[i]!) as SnapshotEntry;
      expect(e.orderbook.yes[0]![0]).toBe(i); // tuple [priceCents, size]
    }
  });

  it('close flushes — file readable immediately after close', () => {
    const rec = createRecorder({ dir, ticker: 'KXTEST-01' });
    rec.appendSnapshot(BOOK);
    rec.close();
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ndjson'));
    const stat = fs.statSync(path.join(dir, files[0]!));
    expect(stat.size).toBeGreaterThan(0);
  });

  it('depth clamping — clamps to [1,50]', () => {
    const recOver = createRecorder({ dir, ticker: 'KXTEST-OVER', depthLevels: 200 });
    recOver.appendSnapshot({
      yes: Array.from({ length: 60 }, (_, i) => ({ priceCents: i, size: 100 })),
      no: [],
    });
    recOver.close();

    const filesOver = fs.readdirSync(dir).filter(f => f.includes('KXTEST-OVER'));
    const lines = readLines(path.join(dir, filesOver[0]!));
    const e = JSON.parse(lines[0]!) as SnapshotEntry;
    expect(e.depth_levels).toBe(50);
    expect(e.orderbook.yes).toHaveLength(50);
  });

  it('depth clamping — clamps minimum to 1', () => {
    const recUnder = createRecorder({ dir, ticker: 'KXTEST-UNDER', depthLevels: 0 });
    recUnder.appendSnapshot({ yes: [{ priceCents: 42, size: 100 }, { priceCents: 41, size: 200 }], no: [] });
    recUnder.close();

    const filesUnder = fs.readdirSync(dir).filter(f => f.includes('KXTEST-UNDER'));
    const lines = readLines(path.join(dir, filesUnder[0]!));
    const e = JSON.parse(lines[0]!) as SnapshotEntry;
    expect(e.depth_levels).toBe(1);
    expect(e.orderbook.yes).toHaveLength(1);
  });

  it('env var KEA_RECORDING_DEPTH_LEVELS overrides default', () => {
    const orig = process.env['KEA_RECORDING_DEPTH_LEVELS'];
    process.env['KEA_RECORDING_DEPTH_LEVELS'] = '3';
    try {
      const rec = createRecorder({ dir, ticker: 'KXTEST-ENV' });
      rec.appendSnapshot({
        yes: Array.from({ length: 10 }, (_, i) => ({ priceCents: i, size: 100 })),
        no: [],
      });
      rec.close();
      const files = fs.readdirSync(dir).filter(f => f.includes('KXTEST-ENV'));
      const lines = readLines(path.join(dir, files[0]!));
      const e = JSON.parse(lines[0]!) as SnapshotEntry;
      expect(e.depth_levels).toBe(3);
      expect(e.orderbook.yes).toHaveLength(3);
    } finally {
      if (orig === undefined) delete process.env['KEA_RECORDING_DEPTH_LEVELS'];
      else process.env['KEA_RECORDING_DEPTH_LEVELS'] = orig;
    }
  });
});
