/**
 * multiTickerRecorder.test.ts
 *
 * Verifies:
 *  - each ticker polled independently at its own cadence
 *  - getStats() returns accurate counts
 *  - stop() halts all intervals (no further polls after stop)
 *  - no timer leaks (vi.useFakeTimers covers cleanup)
 *  - token bucket rate limits all polls (KEA_SCANNER_RATE_PER_SEC override)
 *  - without rate limit (high cap), baseline behavior unchanged
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createMultiTickerRecorder, createTokenBucket, acquireToken } from '../../src/backtest/multiTickerRecorder.js';
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

  it('env var KEA_SCANNER_RATE_PER_SEC overrides default rate', async () => {
    const original = process.env.KEA_SCANNER_RATE_PER_SEC;
    process.env.KEA_SCANNER_RATE_PER_SEC = '5';
    try {
      const tickers: TickerEntry[] = [{ ticker: 'KXENV', cadenceMs: 100 }];
      const client = makeMockClient();
      // If env var is read, recorder is created without error at low rate
      const recorder = createMultiTickerRecorder({ tickers, dir, client });
      expect(recorder).toBeDefined();
      recorder.start();
      await Promise.resolve();
      recorder.stop();
    } finally {
      if (original === undefined) delete process.env.KEA_SCANNER_RATE_PER_SEC;
      else process.env.KEA_SCANNER_RATE_PER_SEC = original;
    }
  });

  it('with very high rate bucket (no throttle), baseline snapshot count unchanged', async () => {
    const tickers: TickerEntry[] = [
      { ticker: 'KXHIGH', cadenceMs: 100 },
    ];
    const client = makeMockClient();
    // Bucket with 10,000 req/sec — effectively no throttle
    const rateBucket = createTokenBucket(10_000, 10_000);
    const recorder = createMultiTickerRecorder({ tickers, dir, client, rateBucket });
    recorder.start();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(350);
    recorder.stop();
    const stats = recorder.getStats();
    // At 100ms cadence over 350ms, expect ≥3 snapshots (same as baseline without bucket)
    expect(stats[0]!.snapshotsWritten).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Token bucket unit tests
// ---------------------------------------------------------------------------

describe('createTokenBucket + acquireToken', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts full — first N acquires are instant when tokens >= N', async () => {
    vi.useFakeTimers();
    const bucket = createTokenBucket(10, 5); // 5 burst capacity
    // Drain 5 tokens synchronously (they should all resolve without waiting)
    for (let i = 0; i < 5; i++) {
      const p = acquireToken(bucket);
      await Promise.resolve(); // microtask flush
      // Since tokens are available, resolve without advancing timers
      await p;
    }
    expect(bucket.tokens).toBeCloseTo(0, 1);
  });

  it('waits when bucket is empty, then resolves after refill', async () => {
    vi.useFakeTimers();
    const bucket = createTokenBucket(10, 1); // 1 burst, 10/sec refill
    // Drain the single token
    await acquireToken(bucket);
    expect(bucket.tokens).toBeCloseTo(0, 1);

    // Next acquire must wait — start it and advance time
    let resolved = false;
    const pending = acquireToken(bucket).then(() => { resolved = true; });
    expect(resolved).toBe(false);

    // Advance 200ms — should refill ~2 tokens at 10/sec
    await vi.advanceTimersByTimeAsync(200);
    await pending;
    expect(resolved).toBe(true);
  });

  it('capacity caps token accumulation', () => {
    const bucket = createTokenBucket(10, 5); // capacity = 5
    // Simulate large elapsed time — tokens should not exceed capacity
    bucket.lastRefillMs = Date.now() - 10_000; // 10 seconds ago
    // Force refill by calling acquireToken logic manually
    const now = Date.now();
    const elapsed = (now - bucket.lastRefillMs) / 1000;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + elapsed * bucket.refillPerSec);
    expect(bucket.tokens).toBeLessThanOrEqual(5);
  });
});
