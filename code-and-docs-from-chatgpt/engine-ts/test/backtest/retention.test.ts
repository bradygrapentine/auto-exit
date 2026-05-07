import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  gzipOldRecordings,
  archiveOldRecordings,
  pruneRecordings,
} from '../../src/backtest/retention.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-ret-test-'));
}

/** Write a file and backdate its mtime by `daysAgo`. */
function writeAged(dir: string, name: string, content: string, daysAgo: number): string {
  const fp = path.join(dir, name);
  fs.writeFileSync(fp, content);
  const past = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  fs.utimesSync(fp, past, past);
  return fp;
}

describe('gzipOldRecordings', () => {
  let dir: string;
  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('gzips files older than threshold', () => {
    writeAged(dir, 'KXTEST-01-20260401.ndjson', '{}', 10);
    const r = gzipOldRecordings(dir, 7);
    expect(r.processed).toHaveLength(1);
    expect(fs.existsSync(path.join(dir, 'KXTEST-01-20260401.ndjson.gz'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'KXTEST-01-20260401.ndjson'))).toBe(false);
  });

  it('skips files newer than threshold', () => {
    writeAged(dir, 'KXTEST-01-20260501.ndjson', '{}', 3);
    const r = gzipOldRecordings(dir, 7);
    expect(r.processed).toHaveLength(0);
    expect(r.skipped).toHaveLength(1);
    expect(fs.existsSync(path.join(dir, 'KXTEST-01-20260501.ndjson'))).toBe(true);
  });

  it('no-op on empty dir', () => {
    const r = gzipOldRecordings(dir, 7);
    expect(r.processed).toHaveLength(0);
    expect(r.skipped).toHaveLength(0);
  });

  it('no-op on missing dir', () => {
    const r = gzipOldRecordings(path.join(dir, 'nonexistent'), 7);
    expect(r.processed).toHaveLength(0);
  });
});

describe('archiveOldRecordings', () => {
  let dir: string;
  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('moves old files to archive subdir', () => {
    writeAged(dir, 'KXTEST-01-20260101.ndjson', '{}', 100);
    const r = archiveOldRecordings(dir, 90);
    expect(r.processed).toHaveLength(1);
    const archivePath = path.join(dir, 'archive', 'KXTEST-01-20260101.ndjson');
    expect(fs.existsSync(archivePath)).toBe(true);
    expect(fs.existsSync(path.join(dir, 'KXTEST-01-20260101.ndjson'))).toBe(false);
  });

  it('moves .ndjson.gz files too', () => {
    writeAged(dir, 'KXTEST-01-20260101.ndjson.gz', 'gz-data', 100);
    const r = archiveOldRecordings(dir, 90);
    expect(r.processed).toHaveLength(1);
    expect(fs.existsSync(path.join(dir, 'archive', 'KXTEST-01-20260101.ndjson.gz'))).toBe(true);
  });

  it('skips recent files', () => {
    writeAged(dir, 'KXTEST-01-20260501.ndjson', '{}', 5);
    const r = archiveOldRecordings(dir, 90);
    expect(r.processed).toHaveLength(0);
    expect(r.skipped).toHaveLength(1);
  });

  it('no-op on empty dir', () => {
    const r = archiveOldRecordings(dir, 90);
    expect(r.processed).toHaveLength(0);
  });
});

describe('pruneRecordings', () => {
  let dir: string;
  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('removes files older than retentionDays', () => {
    const fp = writeAged(dir, 'KXTEST-01-20250101.ndjson', '{}', 400);
    const r = pruneRecordings(dir, 365);
    expect(r.processed).toHaveLength(1);
    expect(fs.existsSync(fp)).toBe(false);
  });

  it('removes archived files too', () => {
    const archiveDir = path.join(dir, 'archive');
    fs.mkdirSync(archiveDir);
    const fp = writeAged(archiveDir, 'KXTEST-01-20240101.ndjson.gz', 'gz', 800);
    const r = pruneRecordings(dir, 365);
    expect(r.processed).toHaveLength(1);
    expect(fs.existsSync(fp)).toBe(false);
  });

  it('keeps recent files', () => {
    writeAged(dir, 'KXTEST-01-20260501.ndjson', '{}', 10);
    const r = pruneRecordings(dir, 365);
    expect(r.processed).toHaveLength(0);
    expect(r.skipped).toHaveLength(1);
  });

  it('no-op on empty dir', () => {
    const r = pruneRecordings(dir, 365);
    expect(r.processed).toHaveLength(0);
  });

  it('uses KEA_RECORDING_RETENTION_DAYS env var', () => {
    writeAged(dir, 'KXTEST-01-20260401.ndjson', '{}', 40);
    process.env['KEA_RECORDING_RETENTION_DAYS'] = '30';
    try {
      const r = pruneRecordings(dir);
      expect(r.processed).toHaveLength(1);
    } finally {
      delete process.env['KEA_RECORDING_RETENTION_DAYS'];
    }
  });
});
