import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  HttpError,
  NonRetryableError,
  parseRetryAfterMs,
  computeBackoffMs,
} from '../src/retry.js';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Build a fn() that throws on the first N calls, then resolves with value. */
function throwNTimes<T>(errs: unknown[], value: T): () => Promise<T> {
  let call = 0;
  return async () => {
    if (call < errs.length) {
      const e = errs[call++];
      throw e;
    }
    return value;
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// parseRetryAfterMs
// ──────────────────────────────────────────────────────────────────────────────

describe('parseRetryAfterMs', () => {
  it('parses integer seconds', () => {
    expect(parseRetryAfterMs('5')).toBe(5000);
  });

  it('parses float seconds', () => {
    expect(parseRetryAfterMs('1.5')).toBe(1500);
  });

  it('parses zero', () => {
    expect(parseRetryAfterMs('0')).toBe(0);
  });

  it('parses HTTP date in the future', () => {
    const future = new Date(Date.now() + 10_000).toUTCString();
    const ms = parseRetryAfterMs(future);
    expect(ms).toBeGreaterThan(0);
    expect(ms!).toBeLessThanOrEqual(10_100); // small tolerance
  });

  it('clamps HTTP date in the past to 0', () => {
    const past = new Date(Date.now() - 5000).toUTCString();
    expect(parseRetryAfterMs(past)).toBe(0);
  });

  it('returns undefined for null', () => {
    expect(parseRetryAfterMs(null)).toBeUndefined();
  });

  it('returns undefined for garbage string', () => {
    expect(parseRetryAfterMs('not-a-date-or-number')).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// computeBackoffMs
// ──────────────────────────────────────────────────────────────────────────────

describe('computeBackoffMs', () => {
  it('returns baseMs on attempt 0 without jitter', () => {
    expect(computeBackoffMs(0, 200, 4000, false)).toBe(200);
  });

  it('doubles each attempt', () => {
    expect(computeBackoffMs(1, 200, 4000, false)).toBe(400);
    expect(computeBackoffMs(2, 200, 4000, false)).toBe(800);
  });

  it('caps at maxMs', () => {
    expect(computeBackoffMs(10, 200, 4000, false)).toBe(4000);
  });

  it('jitter never exceeds baseMs window above exponential', () => {
    const base = 200;
    const max = 4000;
    for (let attempt = 0; attempt < 5; attempt++) {
      const exponential = Math.min(max, base * Math.pow(2, attempt));
      const result = computeBackoffMs(attempt, base, max, true);
      expect(result).toBeGreaterThanOrEqual(exponential);
      // jitter adds at most baseMs, total capped at maxMs
      expect(result).toBeLessThanOrEqual(max);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// withRetry — use fake timers to skip actual sleep delays
// ──────────────────────────────────────────────────────────────────────────────

describe('withRetry', () => {
  beforeEach(() => {
    // Replace setTimeout so sleep() resolves immediately
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler) => {
      if (typeof fn === 'function') (fn as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns immediately when fn succeeds on first try', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 5xx and succeeds on second try', async () => {
    const fn = throwNTimes([new HttpError(503, undefined, 'unavailable')], 'success');
    const result = await withRetry(fn, { maxAttempts: 4, jitter: false });
    expect(result).toBe('success');
  });

  it('fails fast on 4xx (non-429) without retrying', async () => {
    const fn = vi.fn().mockRejectedValue(new NonRetryableError(400, 'Bad request'));
    await expect(withRetry(fn, { maxAttempts: 4 })).rejects.toThrow('Bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fails fast on 404', async () => {
    const fn = vi.fn().mockRejectedValue(new NonRetryableError(404, 'Not found'));
    await expect(withRetry(fn)).rejects.toBeInstanceOf(NonRetryableError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('honors Retry-After header on 429 (passed via HttpError.retryAfterMs)', async () => {
    const setTimeoutCalls: number[] = [];
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler, ms?: number) => {
      setTimeoutCalls.push(ms ?? 0);
      if (typeof fn === 'function') (fn as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    const retryAfterMs = 3000;
    const fn = throwNTimes([new HttpError(429, retryAfterMs, '429')], 'done');
    await withRetry(fn, { maxAttempts: 4, jitter: false });
    expect(setTimeoutCalls[0]).toBe(retryAfterMs);
  });

  it('uses computed backoff for 429 without Retry-After', async () => {
    const setTimeoutCalls: number[] = [];
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler, ms?: number) => {
      setTimeoutCalls.push(ms ?? 0);
      if (typeof fn === 'function') (fn as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    const fn = throwNTimes([new HttpError(429, undefined, '429')], 'done');
    await withRetry(fn, { maxAttempts: 4, baseMs: 200, maxMs: 4000, jitter: false });
    // attempt 0 → backoff = min(4000, 200 * 2^0) = 200
    expect(setTimeoutCalls[0]).toBe(200);
  });

  it('exhausts maxAttempts and throws last error', async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError(503, undefined, 'server down'));
    await expect(withRetry(fn, { maxAttempts: 3, jitter: false })).rejects.toThrow('server down');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retries on network error (plain Error)', async () => {
    const fn = throwNTimes([new Error('ECONNREFUSED')], 'ok');
    const result = await withRetry(fn, { maxAttempts: 4, jitter: false });
    expect(result).toBe('ok');
  });

  it('does not retry NonRetryableError', async () => {
    const fn = vi.fn().mockRejectedValue(new NonRetryableError(422, 'unprocessable'));
    await expect(withRetry(fn, { maxAttempts: 4 })).rejects.toBeInstanceOf(NonRetryableError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects maxAttempts=1 (no retries)', async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError(503));
    await expect(withRetry(fn, { maxAttempts: 1 })).rejects.toBeInstanceOf(HttpError);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
