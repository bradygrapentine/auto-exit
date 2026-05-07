/**
 * multiTickerRecorder.test.ts
 *
 * Verifies:
 *  - each ticker polled independently at its own cadence
 *  - getStats() returns accurate counts
 *  - stop() halts all intervals (no further polls after stop)
 *  - no timer leaks (vi.useFakeTimers covers cleanup)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createMultiTickerRecorder } from '../../src/backtest/multiTickerRecorder.js';
import type { TickerEntry } from '../../src/backtest/multiTickerRecorder.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kea-mtr-test-'));
}

function makeMockClient(latencyMs = 0) {
  const calls: Record<string, number> = {};
  return {
    calls,
    async getOrderbook(ticker: string, _depth: number) {
      calls[ticker] = (calls[ticker] ?? 0) + 1;
      if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs));
      return {
        yes: [{ priceCents: 50, size: 100 }],
        no: [{ priceCents: 49, size: 100 }],
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createMultiTickerRecorder', () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('polls each ticker at its own cadence', async () => {
    const tickers: TickerEntry[] = [
      { ticker: 'KXAAA', cadenceMs: 100 },
      { ticker: 'KXBBB', cadenceMs: 200 },
      { ticker: 'KXCCC', cadenceMs: 500 },
    ];
    const client = makeMockClient();
    const recorder = createMultiTickerRecorder({ tickers, dir, client });
    recorder.start();

    // Let initial fire complete (fake timers don't auto-advance promises)
    await Promise.resolve(); // flush initial poll microtasks

    // Advance 600 ms — KXAAA fires ~6x, KXBBB ~3x, KXCCC ~1x (after initial)
    await vi.advanceTimersByTimeAsync(600);

    recorder.stop();

    const stats = recorder.getStats();
    const aaa = stats.find((s) => s.ticker === 'KXAAA')!;
    const bbb = stats.find((s) => s.ticker === 'KXBBB')!;
    const ccc = stats.find((s) => s.ticker === 'KXCCC')!;

    expect(aaa.snapshotsWritten).toBeGreaterThan(bbb.snapshotsWritten);
    expect(bbb.snapshotsWritten).toBeGreaterThan(ccc.snapshotsWritten);
    expect(aaa.snapshotsWritten).toBeGreaterThanOrEqual(5);
    expect(ccc.snapshotsWritten).toBeGreaterThanOrEqual(1);
  });

  it('getStats returns all tickers with reasonable fields', async () => {
    const tickers: TickerEntry[] = [
      { ticker: 'KXFOO', cadenceMs: 100 },
      { ticker: 'KXBAR', cadenceMs: 100 },
    ];
    const client = makeMockClient();
    const recorder = createMultiTickerRecorder({ tickers, dir, client });
    recorder.start();
    await Promise.resolve(); // flush initial poll microtasks
    await vi.advanceTimersByTimeAsync(150);
    recorder.stop();

    const stats = recorder.getStats();
    expect(stats).toHaveLength(2);
    for (const s of stats) {
      expect(s.ticker).toBeTruthy();
      expect(s.snapshotsWritten).toBeGreaterThanOrEqual(1);
      expect(s.lastPollAt).not.toBeNull();
      expect(s.lastError).toBeNull();
    }
  });

  it('stop() halts intervals — no further polls after stop', async () => {
    const tickers: TickerEntry[] = [{ ticker: 'KXSTOP', cadenceMs: 100 }];
    const client = makeMockClient();
    const recorder = createMultiTickerRecorder({ tickers, dir, client });
    recorder.start();
    await Promise.resolve(); // flush initial poll microtasks
    await vi.advanceTimersByTimeAsync(150);

    recorder.stop();
    const countAfterStop = recorder.getStats()[0]!.snapshotsWritten;

    // Advance 500 ms more — should add 0 new polls
    await vi.advanceTimersByTimeAsync(500);
    const countLater = recorder.getStats()[0]!.snapshotsWritten;
    expect(countLater).toBe(countAfterStop);
  });

  it('records errors in lastError without crashing', async () => {
    const tickers: TickerEntry[] = [{ ticker: 'KXERR', cadenceMs: 100 }];
    const failClient = {
      async getOrderbook(_ticker: string, _depth: number) {
        throw new Error('network failure');
      },
    };
    const recorder = createMultiTickerRecorder({ tickers, dir, client: failClient });
    recorder.start();
    await Promise.resolve(); // flush initial poll microtasks
    await vi.advanceTimersByTimeAsync(150);
    recorder.stop();

    const stats = recorder.getStats();
    expect(stats[0]!.lastError).toMatch(/network failure/);
    expect(stats[0]!.snapshotsWritten).toBe(0);
  });

  it('writes NDJSON files to disk for each ticker', async () => {
    const tickers: TickerEntry[] = [
      { ticker: 'KXDISK1', cadenceMs: 100 },
      { ticker: 'KXDISK2', cadenceMs: 100 },
    ];
    const client = makeMockClient();
    const recorder = createMultiTickerRecorder({ tickers, dir, client });
    recorder.start();
    await Promise.resolve(); // flush initial poll microtasks
    await vi.advanceTimersByTimeAsync(150);
    recorder.stop();

    const files = fs.readdirSync(dir);
    const disk1Files = files.filter((f) => f.startsWith('KXDISK1'));
    const disk2Files = files.filter((f) => f.startsWith('KXDISK2'));
    expect(disk1Files.length).toBeGreaterThan(0);
    expect(disk2Files.length).toBeGreaterThan(0);
  });
});
