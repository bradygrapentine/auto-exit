/**
 * SH-BACKTEST Phase B1 — loader tests.
 *
 * Tests: round-trip with recorder.ts, .ndjson.gz support, ts window filtering,
 * empty file → [], missing file → [], multi-file merge.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import * as os from 'node:os';
import * as path from 'node:path';
import { createRecorder } from '../../src/backtest/recorder.js';
import { loadRecording, loadRecordings } from '../../src/backtest/loader.js';
import type { SnapshotEntry, PositionEntry, FillEntry } from '../../src/backtest/types.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-loader-test-'));
}

function readNdjsonPath(dir: string): string {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ndjson'));
  if (files.length === 0) throw new Error('no .ndjson file found in ' + dir);
  return path.join(dir, files[0]!);
}

describe('loadRecording', () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('round-trip: 5 snapshot entries written by recorder are loaded correctly', async () => {
    const rec = createRecorder({ dir, ticker: 'KXTEST-LOAD' });
    for (let i = 0; i < 5; i++) {
      rec.appendSnapshot({
        yes: [{ priceCents: 40 + i, size: 100 }],
        no: [{ priceCents: 60 - i, size: 100 }],
      });
    }
    rec.close();

    const filePath = readNdjsonPath(dir);
    const entries = await loadRecording(filePath);

    expect(entries).toHaveLength(5);
    for (const e of entries) {
      expect(e.kind).toBe('snapshot');
      expect((e as SnapshotEntry).ticker).toBe('KXTEST-LOAD');
    }
    // sorted ascending by ts
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i]!.ts >= entries[i - 1]!.ts).toBe(true);
    }
  });

  it('round-trip: mixed kinds (snapshot + position + fill)', async () => {
    const rec = createRecorder({ dir, ticker: 'KXTEST-MIX' });
    rec.appendSnapshot({ yes: [{ priceCents: 42, size: 100 }], no: [] });
    rec.appendPosition({
      ticker: 'KXTEST-MIX',
      side: 'yes',
      quantity: 50,
      avg_cost_cents: 42,
      delta: { filled: 50, side: 'yes', price_cents: 42 },
    });
    rec.appendFill({
      ticker: 'KXTEST-MIX',
      order_id: 'ord-xyz',
      side: 'yes',
      size: 10,
      price_cents: 43,
      is_taker: true,
      fees_cents: 3,
    });
    rec.close();

    const filePath = readNdjsonPath(dir);
    const entries = await loadRecording(filePath);

    expect(entries).toHaveLength(3);
    expect(entries[0]!.kind).toBe('snapshot');
    expect(entries[1]!.kind).toBe('position');
    expect(entries[2]!.kind).toBe('fill');
    expect((entries[2] as FillEntry).order_id).toBe('ord-xyz');
  });

  it('empty file returns []', async () => {
    const emptyFile = path.join(dir, 'empty.ndjson');
    fs.writeFileSync(emptyFile, '');
    const entries = await loadRecording(emptyFile);
    expect(entries).toHaveLength(0);
  });

  it('missing file returns []', async () => {
    const entries = await loadRecording(path.join(dir, 'nonexistent.ndjson'));
    expect(entries).toHaveLength(0);
  });

  it('ts window filtering — tsFrom excludes earlier entries', async () => {
    // Write NDJSON directly to avoid recorder's internal nowFn call-count complexity
    const timestamps = [
      '2026-05-07T10:00:00.000Z',
      '2026-05-07T10:01:00.000Z',
      '2026-05-07T10:02:00.000Z',
      '2026-05-07T10:03:00.000Z',
    ];
    const filePath = path.join(dir, 'KXTEST-WIN-20260507.ndjson');
    fs.writeFileSync(
      filePath,
      timestamps
        .map((ts) =>
          JSON.stringify({
            kind: 'snapshot',
            ts,
            ticker: 'KXTEST-WIN',
            orderbook: { yes: [[42, 100]], no: [] },
            depth_levels: 1,
          }),
        )
        .join('\n') + '\n',
    );

    const entries = await loadRecording(filePath, {
      tsFrom: '2026-05-07T10:01:00.000Z',
    });
    // Should include entries at 10:01, 10:02, 10:03
    expect(entries).toHaveLength(3);
    expect(entries[0]!.ts).toBe('2026-05-07T10:01:00.000Z');
  });

  it('ts window filtering — tsTo excludes later entries', async () => {
    const timestamps = [
      '2026-05-07T10:00:00.000Z',
      '2026-05-07T10:01:00.000Z',
      '2026-05-07T10:02:00.000Z',
      '2026-05-07T10:03:00.000Z',
    ];
    const filePath = path.join(dir, 'KXTEST-WIN2-20260507.ndjson');
    fs.writeFileSync(
      filePath,
      timestamps
        .map((ts) =>
          JSON.stringify({
            kind: 'snapshot',
            ts,
            ticker: 'KXTEST-WIN2',
            orderbook: { yes: [[42, 100]], no: [] },
            depth_levels: 1,
          }),
        )
        .join('\n') + '\n',
    );

    const entries = await loadRecording(filePath, {
      tsTo: '2026-05-07T10:01:00.000Z',
    });
    // Should include entries at 10:00 and 10:01
    expect(entries).toHaveLength(2);
    expect(entries[entries.length - 1]!.ts).toBe('2026-05-07T10:01:00.000Z');
  });

  it('ts window filtering — both tsFrom and tsTo', async () => {
    const timestamps = [
      '2026-05-07T10:00:00.000Z',
      '2026-05-07T10:01:00.000Z',
      '2026-05-07T10:02:00.000Z',
      '2026-05-07T10:03:00.000Z',
      '2026-05-07T10:04:00.000Z',
    ];
    const filePath = path.join(dir, 'KXTEST-WIN3-20260507.ndjson');
    fs.writeFileSync(
      filePath,
      timestamps
        .map((ts) =>
          JSON.stringify({
            kind: 'snapshot',
            ts,
            ticker: 'KXTEST-WIN3',
            orderbook: { yes: [[42, 100]], no: [] },
            depth_levels: 1,
          }),
        )
        .join('\n') + '\n',
    );

    const entries = await loadRecording(filePath, {
      tsFrom: '2026-05-07T10:01:00.000Z',
      tsTo: '2026-05-07T10:03:00.000Z',
    });
    expect(entries).toHaveLength(3);
    expect(entries[0]!.ts).toBe('2026-05-07T10:01:00.000Z');
    expect(entries[2]!.ts).toBe('2026-05-07T10:03:00.000Z');
  });

  it('.ndjson.gz support — gzipped file loads identical to plain', async () => {
    const rec = createRecorder({ dir, ticker: 'KXTEST-GZ' });
    for (let i = 0; i < 3; i++) {
      rec.appendSnapshot({ yes: [{ priceCents: 50 + i, size: 200 }], no: [] });
    }
    rec.close();

    const plainPath = readNdjsonPath(dir);
    const plainContent = fs.readFileSync(plainPath);
    const gzPath = plainPath + '.gz';
    fs.writeFileSync(gzPath, zlib.gzipSync(plainContent));

    const plainEntries = await loadRecording(plainPath);
    const gzEntries = await loadRecording(gzPath);

    expect(gzEntries).toHaveLength(3);
    expect(gzEntries).toEqual(plainEntries);
  });

  it('corrupt / partial lines are silently skipped', async () => {
    const filePath = path.join(dir, 'corrupt.ndjson');
    const goodLine = JSON.stringify({
      kind: 'snapshot',
      ts: '2026-05-07T10:00:00.000Z',
      ticker: 'KXTEST',
      orderbook: { yes: [[42, 100]], no: [] },
      depth_levels: 1,
    });
    fs.writeFileSync(filePath, [goodLine, '{invalid json', goodLine].join('\n'));

    const entries = await loadRecording(filePath);
    expect(entries).toHaveLength(2);
  });
});

describe('loadRecordings (multi-file merge)', () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('merges two files and sorts by ts', async () => {
    // Write two separate files (simulating UTC midnight rotation)
    const file1 = path.join(dir, 'ticker-20260506.ndjson');
    const file2 = path.join(dir, 'ticker-20260507.ndjson');

    const entry1 = {
      kind: 'snapshot',
      ts: '2026-05-06T23:59:00.000Z',
      ticker: 'KXTICKER',
      orderbook: { yes: [[42, 100]], no: [] },
      depth_levels: 1,
    };
    const entry2 = {
      kind: 'snapshot',
      ts: '2026-05-07T00:01:00.000Z',
      ticker: 'KXTICKER',
      orderbook: { yes: [[43, 100]], no: [] },
      depth_levels: 1,
    };

    fs.writeFileSync(file1, JSON.stringify(entry1) + '\n');
    fs.writeFileSync(file2, JSON.stringify(entry2) + '\n');

    const merged = await loadRecordings([file2, file1]); // pass in reverse order
    expect(merged).toHaveLength(2);
    expect(merged[0]!.ts).toBe('2026-05-06T23:59:00.000Z');
    expect(merged[1]!.ts).toBe('2026-05-07T00:01:00.000Z');
  });
});
