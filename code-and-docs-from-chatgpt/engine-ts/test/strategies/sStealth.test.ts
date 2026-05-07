/**
 * sStealth.test.ts — TDD suite for S4 StealthRunner.
 *
 * Uses injected rng + sleepMs so tests are synchronous and deterministic.
 * createOrder fill counts are controlled per-call via mockImplementation.
 *
 * Test plan (7 cases per spec):
 * 1. Validation errors (constructor throws)
 * 2. Chunk size in [base*(1-pct), base*(1+pct)] and capped at remaining
 * 3. Inter-chunk delay in [base*(1-pct), base*(1+pct)]; deterministic rng
 * 4. Every createOrder uses time_in_force='immediate_or_cancel'
 * 5. Stops when remaining ≤ 0 → reason='complete'
 * 6. Stops when safetySubmittedMultiple cap hit → reason='safety_cap_hit'
 * 7. stop() mid-run → reason='caller_stopped'
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StealthRunner, buildSStealthArgs } from '../../src/strategies/sStealth.js';
import type { S4Config } from '../../src/strategies/sStealth.js';
import type { KalshiClientLike, OrderResult } from '../../src/types.js';
import { Journal } from '../../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const NO_SLEEP: (ms: number) => Promise<void> = () => Promise.resolve();
const FIXED_RNG = () => 0.5; // signed = 0 → no jitter; factor = 1.0

function makeOrderResult(filledCount: number): OrderResult {
  return {
    orderId: `order-${Math.random()}`,
    status: filledCount > 0 ? 'filled' : 'canceled',
    filledCount,
    remainingCount: 0,
  };
}

function makeMockClient(fillsPerCall: number | number[]): KalshiClientLike {
  let callIdx = 0;
  const fills = Array.isArray(fillsPerCall) ? fillsPerCall : null;
  return {
    getOrderbook: vi.fn(),
    createOrder: vi.fn().mockImplementation(() => {
      const fill = fills !== null
        ? (fills[callIdx++] ?? 0)
        : (fillsPerCall as number);
      return Promise.resolve(makeOrderResult(fill));
    }),
    getOrder: vi.fn(),
    cancelOrder: vi.fn(),
    getPosition: vi.fn(),
    getRestingOrderCount: vi.fn(),
    findOrderByClientOrderId: vi.fn(),
  } as unknown as KalshiClientLike;
}

function makeJournalSpy(keaHome = '/tmp/s4-test-home'): Journal {
  const j = new Journal('test-job-id', keaHome);
  // Replace append with a vi.fn() that also calls through to the real implementation
  const realAppend = j.append.bind(j);
  j.append = vi.fn().mockImplementation(realAppend) as typeof j.append;
  return j;
}

const BASE_CONFIG: S4Config = {
  ticker: 'TEST-TICKER',
  side: 'yes',
  action: 'sell',
  size: 300,
  priceCents: 65,
  baseChunkSize: 150,
  baseDelayMs: 0,
  jitterChunkSizePct: 0.5,
  jitterDelayPct: 0.5,
  rng: FIXED_RNG,
  sleepMs: NO_SLEEP,
  keaHome: '/tmp/s4-test-home',
};

// ── 1. Validation tests ───────────────────────────────────────────────────────

describe('StealthRunner — validation', () => {
  it('rejects empty ticker', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, ticker: '' },
    )).toThrow(/ticker/);
  });

  it('rejects size ≤ 0', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, size: 0 },
    )).toThrow(/size/);
  });

  it('rejects negative size', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, size: -1 },
    )).toThrow(/size/);
  });

  it('rejects jitterChunkSizePct = 0', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, jitterChunkSizePct: 0 },
    )).toThrow(/jitterChunkSizePct/);
  });

  it('rejects jitterChunkSizePct > 1', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, jitterChunkSizePct: 1.1 },
    )).toThrow(/jitterChunkSizePct/);
  });

  it('rejects jitterDelayPct = 0', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, jitterDelayPct: 0 },
    )).toThrow(/jitterDelayPct/);
  });

  it('rejects jitterDelayPct > 1', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, jitterDelayPct: 1.5 },
    )).toThrow(/jitterDelayPct/);
  });

  it('rejects baseChunkSize ≤ 0', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, baseChunkSize: 0 },
    )).toThrow(/baseChunkSize/);
  });

  it('rejects baseDelayMs < 0', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, baseDelayMs: -1 },
    )).toThrow(/baseDelayMs/);
  });

  it('accepts baseDelayMs = 0', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, baseDelayMs: 0 },
    )).not.toThrow();
  });

  it('accepts jitterChunkSizePct = 1 (boundary)', () => {
    expect(() => new StealthRunner(
      makeMockClient(10),
      { ...BASE_CONFIG, jitterChunkSizePct: 1 },
    )).not.toThrow();
  });
});

// ── 2. Chunk size is jittered and capped at remaining ─────────────────────────

describe('StealthRunner — chunk size bounds', () => {
  it('chunk size stays within [base*(1-pct), base*(1+pct)]', async () => {
    const base = 100;
    const pct = 0.3;
    const capturedCounts: number[] = [];
    // size large enough that last-chunk cap won't apply to intermediate chunks
    const totalSize = 1000;

    const client: KalshiClientLike = {
      getOrderbook: vi.fn(),
      createOrder: vi.fn().mockImplementation((payload) => {
        capturedCounts.push(payload.count);
        // Return 0 fill so remaining never decreases — we'll let safety cap end the loop
        return Promise.resolve(makeOrderResult(0));
      }),
      getOrder: vi.fn(),
      cancelOrder: vi.fn(),
      getPosition: vi.fn(),
      getRestingOrderCount: vi.fn(),
      findOrderByClientOrderId: vi.fn(),
    } as unknown as KalshiClientLike;

    // Use random rng but bounded pct=0.3 → [70, 130] for base=100
    let callN = 0;
    const deterministicRng = () => {
      // Alternate between 0.0 and 1.0 to get both extremes
      return callN++ % 2 === 0 ? 0.0 : 1.0;
    };

    const runner = new StealthRunner(client, {
      ...BASE_CONFIG,
      baseChunkSize: base,
      jitterChunkSizePct: pct,
      size: totalSize,
      safetySubmittedMultiple: 1.5, // safetyCap=1500, will hit after ~12 chunks
      rng: deterministicRng,
    });
    await runner.run();

    const lo = Math.max(1, Math.round(base * (1 - pct)));
    const hi = Math.round(base * (1 + pct));
    // All chunks except the very last (which may be safety-cap-capped) must be in range
    const nonLastChunks = capturedCounts.slice(0, -1);
    expect(nonLastChunks.length).toBeGreaterThan(0);
    for (const c of nonLastChunks) {
      expect(c).toBeGreaterThanOrEqual(lo);
      expect(c).toBeLessThanOrEqual(hi);
    }
  });

  it('last chunk is capped at remaining (never over-submits)', async () => {
    const capturedCounts: number[] = [];
    const client: KalshiClientLike = {
      getOrderbook: vi.fn(),
      createOrder: vi.fn().mockImplementation((payload) => {
        capturedCounts.push(payload.count);
        return Promise.resolve(makeOrderResult(payload.count));
      }),
      getOrder: vi.fn(),
      cancelOrder: vi.fn(),
      getPosition: vi.fn(),
      getRestingOrderCount: vi.fn(),
      findOrderByClientOrderId: vi.fn(),
    } as unknown as KalshiClientLike;

    // size=50, baseChunkSize=150 → first chunk should be capped to 50
    const runner = new StealthRunner(client, {
      ...BASE_CONFIG,
      size: 50,
      baseChunkSize: 150,
      rng: FIXED_RNG, // factor=1.0 → chunk=150, capped to 50
    });
    await runner.run();

    expect(capturedCounts).toHaveLength(1);
    expect(capturedCounts[0]).toBe(50);
  });
});

// ── 3. Inter-chunk delay is jittered ─────────────────────────────────────────

describe('StealthRunner — delay jitter', () => {
  it('delay stays within [base*(1-pct), base*(1+pct)] with deterministic rng', async () => {
    const baseDelay = 1000;
    const pct = 0.4;
    const capturedDelays: number[] = [];

    let rngCallN = 0;
    // For chunk size jitter: chunkSizePct is passed → odd calls; for delay: loopDelayPct
    // But we pass separate rng calls, so track which call we're on.
    // We'll alternate 0 and 1 to produce both extremes.
    const rng = () => {
      const vals = [0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0];
      return vals[rngCallN++ % vals.length] ?? 0.5;
    };

    const runner = new StealthRunner(
      makeMockClient(50), // fill 50 per chunk
      {
        ...BASE_CONFIG,
        size: 200,       // 4 chunks of 50 each
        baseChunkSize: 50,
        jitterChunkSizePct: 0.01, // minimal size jitter
        baseDelayMs: baseDelay,
        jitterDelayPct: pct,
        rng,
        sleepMs: (ms) => {
          capturedDelays.push(ms);
          return Promise.resolve();
        },
      },
    );
    await runner.run();

    const lo = Math.max(0, Math.round(baseDelay * (1 - pct)));
    const hi = Math.round(baseDelay * (1 + pct));
    for (const d of capturedDelays) {
      expect(d).toBeGreaterThanOrEqual(lo);
      expect(d).toBeLessThanOrEqual(hi);
    }
  });

  it('does not sleep after last chunk', async () => {
    let sleepCount = 0;
    // size=100, baseChunkSize=100, fill=100 → single chunk → no sleep
    const runner = new StealthRunner(
      makeMockClient(100),
      {
        ...BASE_CONFIG,
        size: 100,
        baseChunkSize: 100,
        rng: FIXED_RNG,
        sleepMs: () => {
          sleepCount++;
          return Promise.resolve();
        },
      },
    );
    await runner.run();
    expect(sleepCount).toBe(0);
  });
});

// ── 4. Every createOrder uses time_in_force='immediate_or_cancel' ─────────────

describe('StealthRunner — IoC enforcement', () => {
  it('every createOrder payload has time_in_force=immediate_or_cancel', async () => {
    const payloads: unknown[] = [];
    const client: KalshiClientLike = {
      getOrderbook: vi.fn(),
      createOrder: vi.fn().mockImplementation((payload) => {
        payloads.push(payload);
        return Promise.resolve(makeOrderResult(50));
      }),
      getOrder: vi.fn(),
      cancelOrder: vi.fn(),
      getPosition: vi.fn(),
      getRestingOrderCount: vi.fn(),
      findOrderByClientOrderId: vi.fn(),
    } as unknown as KalshiClientLike;

    const runner = new StealthRunner(client, {
      ...BASE_CONFIG,
      size: 200,
      baseChunkSize: 50,
    });
    await runner.run();

    expect(payloads.length).toBeGreaterThan(0);
    for (const p of payloads as Array<{ time_in_force?: string }>) {
      expect(p.time_in_force).toBe('immediate_or_cancel');
    }
  });

  it('no createOrder payload has time_in_force=good_till_canceled', async () => {
    const payloads: unknown[] = [];
    const client: KalshiClientLike = {
      getOrderbook: vi.fn(),
      createOrder: vi.fn().mockImplementation((payload) => {
        payloads.push(payload);
        return Promise.resolve(makeOrderResult(30));
      }),
      getOrder: vi.fn(),
      cancelOrder: vi.fn(),
      getPosition: vi.fn(),
      getRestingOrderCount: vi.fn(),
      findOrderByClientOrderId: vi.fn(),
    } as unknown as KalshiClientLike;

    const runner = new StealthRunner(client, {
      ...BASE_CONFIG,
      size: 90,
      baseChunkSize: 30,
    });
    await runner.run();

    for (const p of payloads as Array<{ time_in_force?: string }>) {
      expect(p.time_in_force).not.toBe('good_till_canceled');
    }
  });
});

// ── 5. Stops when remaining ≤ 0 → reason='complete' ─────────────────────────

describe('StealthRunner — complete when filled', () => {
  it('returns reason=complete when all size is filled', async () => {
    const runner = new StealthRunner(
      makeMockClient(150),
      {
        ...BASE_CONFIG,
        size: 150,
        baseChunkSize: 150,
        rng: FIXED_RNG,
      },
    );
    const result = await runner.run();
    expect(result.reason).toBe('complete');
    expect(result.totalFilled).toBe(150);
  });

  it('accumulates fills across multiple chunks until complete', async () => {
    // Each fill=50, size=200 → 4 chunks
    const runner = new StealthRunner(
      makeMockClient(50),
      {
        ...BASE_CONFIG,
        size: 200,
        baseChunkSize: 50,
        rng: FIXED_RNG,
      },
    );
    const result = await runner.run();
    expect(result.reason).toBe('complete');
    expect(result.totalFilled).toBe(200);
    expect(result.iterations).toBe(4);
  });

  it('handles partial fills per chunk (fill < chunkSize)', async () => {
    // fill=30 per chunk, chunk=50, size=150 → eventually filled
    const runner = new StealthRunner(
      makeMockClient(30),
      {
        ...BASE_CONFIG,
        size: 90, // 3 fills of 30 each
        baseChunkSize: 50,
        rng: FIXED_RNG,
      },
    );
    const result = await runner.run();
    expect(result.reason).toBe('complete');
    expect(result.totalFilled).toBe(90);
  });
});

// ── 6. Safety cap stops the run ───────────────────────────────────────────────

describe('StealthRunner — safety cap', () => {
  it('stops with reason=safety_cap_hit when submittedTotal >= size * multiple', async () => {
    // size=100, safetySubmittedMultiple=1.5 → safetyCap=150
    // fill=0 per chunk → submitted grows but filled stays 0 → hits cap
    const runner = new StealthRunner(
      makeMockClient(0), // 0 fill per chunk — keeps submitting without progress
      {
        ...BASE_CONFIG,
        size: 100,
        baseChunkSize: 100,
        safetySubmittedMultiple: 1.5,
        rng: FIXED_RNG,
      },
    );
    const result = await runner.run();
    expect(result.reason).toBe('safety_cap_hit');
    // totalFilled stays 0 since fill=0
    expect(result.totalFilled).toBe(0);
  });

  it('respects custom safetySubmittedMultiple', async () => {
    // size=200, safetySubmittedMultiple=1.0 → safetyCap=200
    // fill=0 → single chunk of 200 submitted hits cap
    const runner = new StealthRunner(
      makeMockClient(0),
      {
        ...BASE_CONFIG,
        size: 200,
        baseChunkSize: 200,
        safetySubmittedMultiple: 1.0,
        rng: FIXED_RNG,
      },
    );
    const result = await runner.run();
    expect(result.reason).toBe('safety_cap_hit');
  });
});

// ── 7. stop() mid-run → reason='caller_stopped' ──────────────────────────────

describe('StealthRunner — caller stop', () => {
  it('stop() before run → reason=caller_stopped (no fills)', async () => {
    const runner = new StealthRunner(
      makeMockClient(50),
      {
        ...BASE_CONFIG,
        size: 300,
        baseChunkSize: 50,
        rng: FIXED_RNG,
        sleepMs: NO_SLEEP,
      },
    );
    runner.stop();
    const result = await runner.run();
    expect(result.reason).toBe('caller_stopped');
    expect(result.totalFilled).toBe(0);
  });

  it('stop() during sleep → stops after current chunk completes', async () => {
    let runner: StealthRunner;
    let callCount = 0;

    const sleepMs = (_ms: number): Promise<void> => {
      // Stop the runner on first sleep (after first chunk)
      if (callCount === 0) {
        runner.stop();
        callCount++;
      }
      return Promise.resolve();
    };

    runner = new StealthRunner(
      makeMockClient(50), // fill 50 per chunk
      {
        ...BASE_CONFIG,
        size: 300,
        baseChunkSize: 50,
        rng: FIXED_RNG,
        sleepMs,
      },
    );

    const result = await runner.run();
    // Should have completed 1 chunk (50 filled) then stopped
    expect(result.reason).toBe('caller_stopped');
    expect(result.totalFilled).toBe(50);
    expect(result.iterations).toBe(1);
  });
});

// ── Journal entries ───────────────────────────────────────────────────────────

describe('StealthRunner — journal entries', () => {
  it('appends stealth_started and stealth_finished', async () => {
    const journal = makeJournalSpy();
    const runner = new StealthRunner(
      makeMockClient(100),
      { ...BASE_CONFIG, size: 100, baseChunkSize: 100 },
      journal,
    );
    await runner.run();

    // Spy was set in makeJournalSpy before run() — read recorded calls
    const appendMock = journal.append as ReturnType<typeof vi.fn>;
    const kinds = appendMock.mock.calls.map((c) => c[0] as string);
    expect(kinds).toContain('stealth_started');
    expect(kinds).toContain('stealth_finished');
    expect(kinds).toContain('stealth_chunk_placed');
    expect(kinds).toContain('stealth_chunk_reconciled');
  });
});

// ── buildSStealthArgs preset ──────────────────────────────────────────────────

describe('buildSStealthArgs', () => {
  it('returns valid S4Config from valid args', () => {
    const cfg = buildSStealthArgs({
      ticker: 'FOO',
      side: 'yes',
      action: 'sell',
      size: 500,
      priceCents: 70,
    });
    expect(cfg.ticker).toBe('FOO');
    expect(cfg.size).toBe(500);
  });

  it('throws on empty ticker', () => {
    expect(() => buildSStealthArgs({
      ticker: '',
      side: 'yes',
      action: 'sell',
      size: 100,
      priceCents: 50,
    })).toThrow(/ticker/);
  });

  it('throws on size=0', () => {
    expect(() => buildSStealthArgs({
      ticker: 'T',
      side: 'yes',
      action: 'sell',
      size: 0,
      priceCents: 50,
    })).toThrow(/size/);
  });

  it('throws on jitterChunkSizePct out of range', () => {
    expect(() => buildSStealthArgs({
      ticker: 'T',
      side: 'yes',
      action: 'sell',
      size: 100,
      priceCents: 50,
      jitterChunkSizePct: 1.5,
    })).toThrow(/jitterChunkSizePct/);
  });
});

// ── W3.1 POV pacing ───────────────────────────────────────────────────────────

describe('StealthRunner — W3.1 POV pacing', () => {
  it('maxParticipationRate undefined: behavior matches baseline (no inflation)', async () => {
    // No maxParticipationRate → delay = base jittered delay unchanged
    const capturedDelays: number[] = [];
    const runner = new StealthRunner(
      makeMockClient(50),
      {
        ...BASE_CONFIG,
        size: 200,
        baseChunkSize: 50,
        baseDelayMs: 1000,
        jitterChunkSizePct: 0.01,
        jitterDelayPct: 0.01,
        rng: FIXED_RNG,
        sleepMs: (ms) => { capturedDelays.push(ms); return Promise.resolve(); },
        // maxParticipationRate not set
      },
    );
    await runner.run();
    // All delays should be near baseDelayMs (jitter is 1% with fixed rng → exact 1000)
    expect(capturedDelays.length).toBeGreaterThan(0);
    for (const d of capturedDelays) {
      expect(d).toBe(1000); // FIXED_RNG=0.5 → signed=0 → factor=1 → exact base
    }
  });

  it('maxParticipationRate=0.1: fills exceeding allowed inflate the delay', async () => {
    // baseChunkSize=100, maxParticipationRate=0.1 → allowed=floor(0.1*100)=10
    // fill=100 per chunk → after first chunk, recentMinuteFills()=100 > 10
    // overshoot=100/10=10 → delay = min(1000*10, 10*1000) = 10_000
    const capturedDelays: number[] = [];
    const runner = new StealthRunner(
      makeMockClient(100), // fill 100 per chunk
      {
        ...BASE_CONFIG,
        size: 200,
        baseChunkSize: 100,
        baseDelayMs: 1000,
        jitterChunkSizePct: 0.01,
        jitterDelayPct: 0.01,
        rng: FIXED_RNG,
        maxParticipationRate: 0.1,
        sleepMs: (ms) => { capturedDelays.push(ms); return Promise.resolve(); },
      },
    );
    await runner.run();

    // At least one delay should be inflated above base 1000ms
    expect(capturedDelays.length).toBeGreaterThan(0);
    // After first fill of 100 with allowed=10, delay should inflate significantly
    for (const d of capturedDelays) {
      expect(d).toBeGreaterThan(1000);
    }
  });

  it('maxParticipationRate=0.1 with zero fills: delay equals base (no inflation)', async () => {
    // fill=0 per chunk → no entries in fillWindow → recentMinuteFills()=0 ≤ allowed → base delay
    const capturedDelays: number[] = [];
    const runner = new StealthRunner(
      makeMockClient(0), // fill=0 → safety cap hits eventually
      {
        ...BASE_CONFIG,
        size: 100,
        baseChunkSize: 100,
        baseDelayMs: 1000,
        jitterChunkSizePct: 0.01,
        jitterDelayPct: 0.01,
        rng: FIXED_RNG,
        maxParticipationRate: 0.1,
        safetySubmittedMultiple: 1.5, // safetyCap=150; after 1 chunk of 100, no second chunk
        sleepMs: (ms) => { capturedDelays.push(ms); return Promise.resolve(); },
      },
    );
    await runner.run();

    // fills=0 → no POV inflation; but safety cap hits before sleep is needed
    // (size=100, safetySubmittedMultiple=1.5 → safetyCap=150; submittedTotal=100 after 1 chunk < 150,
    //  but remaining still 100 since fill=0, so second chunk would submit 50 more → hits cap)
    // Delay may or may not be called depending on whether safety cap hits before sleep.
    // Either way: any captured delays should equal base 1000 (no inflation since fill=0)
    for (const d of capturedDelays) {
      expect(d).toBe(1000);
    }
  });
});
