import type { RetryOptions } from './types.js';

/** Sentinel error class that signals a non-retryable HTTP failure (4xx != 429). */
export class NonRetryableError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

/** Error class for HTTP failures that carry status code. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly retryAfterMs?: number,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`);
    this.name = 'HttpError';
  }
}

/**
 * Parse the Retry-After header value into milliseconds.
 * Supports both integer seconds and HTTP-date formats.
 */
export function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const secs = Number(value.trim());
  if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
  // Try HTTP-date
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const ms = d.getTime() - Date.now();
    return Math.max(0, ms);
  }
  return undefined;
}

/**
 * Compute backoff delay in ms for a given attempt (0-indexed).
 * Formula: min(maxMs, baseMs * 2^attempt) + jitter(0..baseMs) when enabled.
 */
export function computeBackoffMs(
  attempt: number,
  baseMs: number,
  maxMs: number,
  jitter: boolean,
): number {
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  const jitterMs = jitter ? Math.random() * baseMs : 0;
  return Math.min(maxMs, exponential + jitterMs);
}

/** Sleep helper — isolated so tests can spy on it. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEFAULT_OPTS: Required<RetryOptions> = {
  maxAttempts: 4,
  baseMs: 200,
  maxMs: 4000,
  retryOn: ['network', '5xx', '429'],
  nonIdempotent: false,
  jitter: true,
};

/**
 * Determine whether a thrown error is retryable given the retry policy.
 *
 * Returns { retry: true, delayMs } or { retry: false }.
 * `attempt` is the 0-based index of the attempt that just failed.
 */
function shouldRetry(
  err: unknown,
  attempt: number,
  opts: Required<RetryOptions>,
): { retry: true; delayMs: number } | { retry: false } {
  const no = { retry: false as const };

  if (err instanceof NonRetryableError) return no;

  if (err instanceof HttpError) {
    const { status, retryAfterMs } = err;
    if (status === 429 && opts.retryOn.includes('429')) {
      const computedMs = computeBackoffMs(attempt, opts.baseMs, opts.maxMs, opts.jitter);
      const delayMs = retryAfterMs !== undefined ? retryAfterMs : computedMs;
      return { retry: true, delayMs };
    }
    if (status >= 400 && status < 500) return no; // 4xx other than 429
    if (status >= 500 && opts.retryOn.includes('5xx')) {
      return { retry: true, delayMs: computeBackoffMs(attempt, opts.baseMs, opts.maxMs, opts.jitter) };
    }
    return no;
  }

  // Network error (fetch threw, e.g. ECONNREFUSED, TypeError)
  if (opts.retryOn.includes('network')) {
    if (opts.nonIdempotent) {
      // Non-idempotent: caller must handle deduplication; we still retry here
      // but the caller (createOrder wrapper) does the cloid-check before calling us.
      return { retry: true, delayMs: computeBackoffMs(attempt, opts.baseMs, opts.maxMs, opts.jitter) };
    }
    return { retry: true, delayMs: computeBackoffMs(attempt, opts.baseMs, opts.maxMs, opts.jitter) };
  }

  return no;
}

/**
 * withRetry(fn, opts?)
 *
 * Calls fn() and retries according to opts on transient failures.
 * fn() should throw HttpError or NonRetryableError for HTTP failures,
 * or a plain Error / TypeError for network failures.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: Partial<RetryOptions>,
): Promise<T> {
  const resolved: Required<RetryOptions> = { ...DEFAULT_OPTS, ...opts };
  let lastErr: unknown;

  for (let attempt = 0; attempt < resolved.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const decision = shouldRetry(err, attempt, resolved);
      if (!decision.retry || attempt === resolved.maxAttempts - 1) {
        throw err;
      }
      await sleep(decision.delayMs);
    }
  }

  throw lastErr;
}
