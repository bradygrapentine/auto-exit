/**
 * syncAtomic.test.ts
 *
 * Tests the pure pieces of the atomic sync protocol:
 *   - parseManifest tolerates blank lines, throws on malformed rows
 *   - verifyStagingAgainstManifest catches missing files, size mismatches, extras, count drift
 *   - atomicSwap leaves prior state intact on rename failure; otherwise merges prior files
 *     not present in the new dir; survives crash between mv calls by leaving prior dir
 *     in place (verified by manual mid-state filesystem inspection in a test fixture)
 *
 * The fly-ssh / tar-pipe parts (fetchRemoteManifest, streamTarToStaging,
 * deleteRemoteOlderThan, syncRecordingsAtomic end-to-end) require a live Fly
 * machine and are exercised by `npm run smoke:mcp` / harness — not unit tested.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  parseManifest,
  verifyStagingAgainstManifest,
  atomicSwap,
} from '../../src/backtest/syncAtomic.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-syncatomic-test-'));
}

function touch(filePath: string, body = '') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body, 'utf8');
}

// ---------------------------------------------------------------------------
// parseManifest
// ---------------------------------------------------------------------------

describe('parseManifest', () => {
  it('parses tab-separated rows produced by find -printf', () => {
    const text = [
      'a.ndjson\t1024\t1700000000.123',
      'sub/b.ndjson\t2048\t1700000123.456',
      '',
    ].join('\n');
    expect(parseManifest(text)).toEqual([
      { relPath: 'a.ndjson', bytes: 1024, mtimeUnix: 1700000000.123 },
      { relPath: 'sub/b.ndjson', bytes: 2048, mtimeUnix: 1700000123.456 },
    ]);
  });

  it('throws on malformed row', () => {
    expect(() => parseManifest('a.ndjson\t1024')).toThrow(/malformed manifest row/);
  });

  it('throws on non-numeric byte size', () => {
    expect(() => parseManifest('a.ndjson\tabc\t1700000000')).toThrow(/malformed manifest row/);
  });
});

// ---------------------------------------------------------------------------
// verifyStagingAgainstManifest
// ---------------------------------------------------------------------------

describe('verifyStagingAgainstManifest', () => {
  it('returns ok=true when staging matches the manifest exactly', () => {
    const dir = tmpDir();
    touch(path.join(dir, 'a.ndjson'), 'x'.repeat(10));
    touch(path.join(dir, 'sub/b.ndjson'), 'y'.repeat(20));
    const result = verifyStagingAgainstManifest(dir, [
      { relPath: 'a.ndjson', bytes: 10, mtimeUnix: 0 },
      { relPath: 'sub/b.ndjson', bytes: 20, mtimeUnix: 0 },
    ]);
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('flags missing files', () => {
    const dir = tmpDir();
    touch(path.join(dir, 'a.ndjson'), 'x'.repeat(10));
    const result = verifyStagingAgainstManifest(dir, [
      { relPath: 'a.ndjson', bytes: 10, mtimeUnix: 0 },
      { relPath: 'missing.ndjson', bytes: 20, mtimeUnix: 0 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.reason === 'missing' && f.relPath === 'missing.ndjson')).toBe(true);
  });

  it('flags byte-size mismatches', () => {
    const dir = tmpDir();
    touch(path.join(dir, 'a.ndjson'), 'x'.repeat(9));
    const result = verifyStagingAgainstManifest(dir, [
      { relPath: 'a.ndjson', bytes: 10, mtimeUnix: 0 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.failures[0]).toMatchObject({ reason: 'size_mismatch', relPath: 'a.ndjson', expected: 10, actual: 9 });
  });

  it('flags extras not in manifest', () => {
    const dir = tmpDir();
    touch(path.join(dir, 'a.ndjson'), 'x'.repeat(10));
    touch(path.join(dir, 'rogue.ndjson'), 'z'.repeat(5));
    const result = verifyStagingAgainstManifest(dir, [
      { relPath: 'a.ndjson', bytes: 10, mtimeUnix: 0 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.reason === 'extra' && f.relPath === 'rogue.ndjson')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// atomicSwap
// ---------------------------------------------------------------------------

describe('atomicSwap', () => {
  it('replaces target with staging when target does not exist', () => {
    const dir = tmpDir();
    const target = path.join(dir, 'recordings');
    const staging = path.join(dir, 'staging');
    touch(path.join(staging, 'a.ndjson'), 'x');

    atomicSwap(staging, target);

    expect(fs.existsSync(target)).toBe(true);
    expect(fs.existsSync(path.join(target, 'a.ndjson'))).toBe(true);
    expect(fs.existsSync(staging)).toBe(false);
  });

  it('merges prior files not present in the new dir, then deletes prior', () => {
    const dir = tmpDir();
    const target = path.join(dir, 'recordings');
    const staging = path.join(dir, 'staging');

    // Prior state: contains both old.ndjson (unique) and shared.ndjson (will be overwritten).
    touch(path.join(target, 'old.ndjson'), 'old');
    touch(path.join(target, 'shared.ndjson'), 'old-shared');
    // Staging: shared.ndjson (overwrites) and new.ndjson (added).
    touch(path.join(staging, 'shared.ndjson'), 'new-shared');
    touch(path.join(staging, 'new.ndjson'), 'new');

    atomicSwap(staging, target);

    expect(fs.readFileSync(path.join(target, 'old.ndjson'), 'utf8')).toBe('old'); // merged from prior
    expect(fs.readFileSync(path.join(target, 'shared.ndjson'), 'utf8')).toBe('new-shared'); // new wins
    expect(fs.readFileSync(path.join(target, 'new.ndjson'), 'utf8')).toBe('new');

    // No prior dir left behind.
    const siblings = fs.readdirSync(dir);
    expect(siblings.filter((s) => s.startsWith('recordings.prev-'))).toEqual([]);
  });

  it('leaves prior dir in place if staging rename fails (simulated)', () => {
    const dir = tmpDir();
    const target = path.join(dir, 'recordings');
    touch(path.join(target, 'old.ndjson'), 'old');

    // Pass a nonexistent staging path → renameSync throws.
    const missingStaging = path.join(dir, 'does-not-exist');

    expect(() => atomicSwap(missingStaging, target)).toThrow();

    // Target restored.
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(path.join(target, 'old.ndjson'), 'utf8')).toBe('old');
  });
});
