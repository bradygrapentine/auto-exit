/**
 * pauseSentinel.test.ts
 *
 * Verifies the cached pause-sentinel check used by wsRecorder:
 *   - Initial state without file → not paused
 *   - File present → paused
 *   - File removed → eventually not paused (after cache TTL elapses)
 *   - Cache TTL prevents hammering the filesystem within the window
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { makePauseChecker } from '../../src/backtest/wsRecorder.js';

function tmpFile(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-pause-test-'));
  return path.join(dir, 'PAUSE');
}

describe('makePauseChecker', () => {
  it('returns false when sentinel does not exist', () => {
    const sentinel = tmpFile();
    const check = makePauseChecker(sentinel);
    expect(check()).toBe(false);
  });

  it('returns true when sentinel exists', () => {
    const sentinel = tmpFile();
    fs.writeFileSync(sentinel, '');
    const check = makePauseChecker(sentinel);
    expect(check()).toBe(true);
  });

  it('caches the result within the TTL window', () => {
    const sentinel = tmpFile();
    const check = makePauseChecker(sentinel);
    expect(check()).toBe(false); // initial check, no file

    // Create the sentinel — cache still says false until TTL expires.
    fs.writeFileSync(sentinel, '');
    expect(check()).toBe(false);
  });

  it('picks up state changes after the cache TTL', async () => {
    const sentinel = tmpFile();
    const check = makePauseChecker(sentinel);
    expect(check()).toBe(false);

    fs.writeFileSync(sentinel, '');
    // Wait past the 2s TTL.
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(check()).toBe(true);

    fs.unlinkSync(sentinel);
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(check()).toBe(false);
  }, 10_000);
});
