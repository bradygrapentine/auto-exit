import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { listRecordings } from '../../src/backtest/list.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-list-test-'));
}

function touch(dir: string, name: string, content = '{}'): void {
  fs.writeFileSync(path.join(dir, name), content);
}

describe('listRecordings', () => {
  let dir: string;
  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('returns expected metadata for .ndjson file', () => {
    touch(dir, 'KXTEST-01-20260505.ndjson', '{"kind":"snapshot"}\n');
    const results = listRecordings(dir);
    expect(results).toHaveLength(1);
    expect(results[0]!.ticker).toBe('KXTEST-01');
    expect(results[0]!.date).toBe('20260505');
    expect(results[0]!.gzipped).toBe(false);
    expect(results[0]!.sizeBytes).toBeGreaterThan(0);
  });

  it('returns expected metadata for .ndjson.gz file', () => {
    touch(dir, 'KXFOO-BAR-20260401.ndjson.gz', 'gz-bytes');
    const results = listRecordings(dir);
    expect(results).toHaveLength(1);
    expect(results[0]!.ticker).toBe('KXFOO-BAR');
    expect(results[0]!.gzipped).toBe(true);
  });

  it('handles missing dir — returns []', () => {
    const results = listRecordings(path.join(dir, 'nonexistent'));
    expect(results).toEqual([]);
  });

  it('sorts by date descending', () => {
    touch(dir, 'KXTEST-01-20260501.ndjson');
    touch(dir, 'KXTEST-01-20260503.ndjson');
    touch(dir, 'KXTEST-01-20260502.ndjson');
    const results = listRecordings(dir);
    expect(results.map(r => r.date)).toEqual(['20260503', '20260502', '20260501']);
  });

  it('reads both .ndjson and .ndjson.gz', () => {
    touch(dir, 'KXTEST-01-20260501.ndjson');
    touch(dir, 'KXTEST-01-20260401.ndjson.gz');
    const results = listRecordings(dir);
    expect(results).toHaveLength(2);
    const exts = results.map(r => r.gzipped);
    expect(exts).toContain(true);
    expect(exts).toContain(false);
  });

  it('does not include files in archive/ subdir', () => {
    touch(dir, 'KXTEST-01-20260505.ndjson');
    const archiveDir = path.join(dir, 'archive');
    fs.mkdirSync(archiveDir);
    touch(archiveDir, 'KXTEST-01-20260101.ndjson');
    const results = listRecordings(dir);
    // archive/ is a directory entry, not a file — should be excluded
    expect(results).toHaveLength(1);
    expect(results[0]!.date).toBe('20260505');
  });

  it('ignores non-recording files', () => {
    touch(dir, 'README.md');
    touch(dir, 'config.json');
    touch(dir, 'KXTEST-01-20260505.ndjson');
    const results = listRecordings(dir);
    expect(results).toHaveLength(1);
  });

  it('tiebreaks same date by ticker ascending', () => {
    touch(dir, 'KXZZZ-01-20260505.ndjson');
    touch(dir, 'KXAAA-01-20260505.ndjson');
    const results = listRecordings(dir);
    expect(results[0]!.ticker).toBe('KXAAA-01');
    expect(results[1]!.ticker).toBe('KXZZZ-01');
  });
});
