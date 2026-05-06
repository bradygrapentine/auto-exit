/**
 * sTwap.test.ts — tests for S3 TWAP runner.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  STwapRunner,
  buildSTwapArgs,
  computeSliceSizes,
  type STwapConfig,
  type PassiveInvokeFn,
  type SessionWindow,
} from '../../src/strategies/sTwap.js';
import { Journal } from '../../src/journal.js';
import type { PassiveResult } from '../../src/passive.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePassiveResult(filled: number): PassiveResult {
  return {
    jobId: 'test-job',
    filled,
    avgPriceCents: 50,
    feesIncurredDollars: 0,
    remaining: 0,
    status: 'complete',
  };
}

function makeJournalSpy(): Journal {
  const j = new Journal('test', '/tmp');
  vi.spyOn(j, 'append');
  return j;
}

function makeNoopSleep(): (ms: number) => Promise<void> {
  return vi.fn().mockResolvedValue(undefined);
}

// Fixed "now" clock
function makeNowFn(date: Date): () => Date {
  return () => date;
}

// Advancing clock: returns successive timestamps (startMs + calls * stepMs)
function makeAdvancingClock(startMs: number, stepMs: number): () => Date {
  let calls = 0;
  return () => new Date(startMs + calls++ * stepMs);
}

const BASE_CONFIG: STwapConfig = {
  ticker: 'TEST-MKT',
  side: 'sell',
  size: 100,
  intervalMinutes: 1,
  numIntervals: 4,
  sleepMs: makeNoopSleep(),
  now: makeNowFn(new Date('2025-01-15T12:00:00Z')),
};

// ── 1. computeSliceSizes ──────────────────────────────────────────────────────

describe('computeSliceSizes', () => {
  it('equal division: 100/4 = [25,25,25,25]', () => {
    expect(computeSliceSizes(100, 4)).toEqual([25, 25, 25, 25]);
  });

  it('remainder rolls into last: 103/4 = [25,25,25,28]', () => {
    expect(computeSliceSizes(103, 4)).toEqual([25, 25, 25, 28]);
  });

  it('single large remainder: 11/2 = [5,6]', () => {
    expect(computeSliceSizes(11, 2)).toEqual([5, 6]);
  });

  it('no remainder: 10/5 = [2,2,2,2,2]', () => {
    expect(computeSliceSizes(10, 5)).toEqual([2, 2, 2, 2, 2]);
  });
});

// ── 2. buildSTwapArgs validation ─────────────────────────────────────────────

describe('buildSTwapArgs — validation', () => {
  it('rejects size <= 0', () => {
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, size: 0 })).toThrow('size must be > 0');
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, size: -1 })).toThrow('size must be > 0');
  });

  it('rejects numIntervals < 2', () => {
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, numIntervals: 1 })).toThrow('numIntervals must be an integer >= 2');
  });

  it('rejects non-integer numIntervals', () => {
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, numIntervals: 2.5 })).toThrow('numIntervals must be an integer >= 2');
  });

  it('rejects intervalMinutes <= 0', () => {
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, intervalMinutes: 0 })).toThrow('intervalMinutes must be > 0');
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, intervalMinutes: -5 })).toThrow('intervalMinutes must be > 0');
  });

  it('rejects invalid side', () => {
    // @ts-expect-error testing invalid input
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, side: 'sideways' })).toThrow('side must be "buy" or "sell"');
  });

  it('rejects empty ticker', () => {
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, ticker: '' })).toThrow('ticker must be non-empty');
  });

  it('rejects malformed sessionWindow.startUtc', () => {
    const win: SessionWindow = { startUtc: '9:00', endUtc: '17:00' };
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, sessionWindow: win })).toThrow('startUtc must be HH:MM');
  });

  it('rejects malformed sessionWindow.endUtc', () => {
    const win: SessionWindow = { startUtc: '09:00', endUtc: '5pm' };
    expect(() => buildSTwapArgs({ ...BASE_CONFIG, sessionWindow: win })).toThrow('endUtc must be HH:MM');
  });

  it('accepts valid config without sessionWindow', () => {
    expect(() => buildSTwapArgs(BASE_CONFIG)).not.toThrow();
  });

  it('accepts valid config with sessionWindow', () => {
    expect(() => buildSTwapArgs({
      ...BASE_CONFIG,
      sessionWindow: { startUtc: '09:00', endUtc: '17:00' },
    })).not.toThrow();
  });
});

// ── 3. Happy path: 100/4 = [25,25,25,25] ─────────────────────────────────────

describe('STwapRunner — happy path 100/4 = [25,25,25,25]', () => {
  it('fires 4 invocations, each with sliceSize=25, totalFilled=100', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const runner = new STwapRunner({ ...BASE_CONFIG, passiveInvoke });
    const result = await runner.run();

    expect(result.intervalsFired).toBe(4);
    expect(result.totalFilled).toBe(100);
    expect(result.reason).toBe('complete');

    const calls = (passiveInvoke as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(4);
    for (const [cfg] of calls) {
      expect(cfg.size).toBe(25);
    }
  });
});

// ── 4. Remainder: 103/4 = [25,25,25,28] ──────────────────────────────────────

describe('STwapRunner — remainder 103/4 = [25,25,25,28]', () => {
  it('first 3 intervals get 25, last gets 28', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn()
      .mockResolvedValueOnce(makePassiveResult(25))
      .mockResolvedValueOnce(makePassiveResult(25))
      .mockResolvedValueOnce(makePassiveResult(25))
      .mockResolvedValueOnce(makePassiveResult(28));

    const runner = new STwapRunner({ ...BASE_CONFIG, size: 103, passiveInvoke });
    const result = await runner.run();

    expect(result.totalFilled).toBe(103);
    expect(result.intervalsFired).toBe(4);

    const calls = (passiveInvoke as ReturnType<typeof vi.fn>).mock.calls;
    const sizes = calls.map(([cfg]: [{ size: number }]) => cfg.size);
    expect(sizes).toEqual([25, 25, 25, 28]);
  });
});

// ── 5. Session window pause ───────────────────────────────────────────────────

describe('STwapRunner — session window pause', () => {
  it('pauses when now=23:00 UTC and window=09:00..17:00, resumes at window start', async () => {
    // Time 23:00 UTC, window 09:00-17:00 → pause until 10h later (next 09:00)
    const frozenTime = new Date('2025-01-15T23:00:00Z');
    const afterSleepTime = new Date('2025-01-16T09:00:00Z');
    let callCount = 0;

    const nowFn = (): Date => {
      // First call: before session window check
      // After sleeping: return session start time
      callCount++;
      return callCount <= 2 ? frozenTime : afterSleepTime;
    };

    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const sleepMock = vi.fn().mockResolvedValue(undefined);
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;

    const runner = new STwapRunner(
      {
        ...BASE_CONFIG,
        size: 50,
        numIntervals: 2,
        passiveInvoke,
        sleepMs: sleepMock,
        now: nowFn,
        sessionWindow: { startUtc: '09:00', endUtc: '17:00' },
      },
      journal,
    );

    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0] as string);
    expect(kinds).toContain('twap_session_paused');
    expect(kinds).toContain('twap_session_resumed');
    // sleepMock should have been called at least once for session wait
    expect(sleepMock).toHaveBeenCalled();
  });
});

// ── 6. Stop between intervals ─────────────────────────────────────────────────

describe('STwapRunner — stop mid-flow', () => {
  it('stop() after interval 2 → no further invocations; reason=caller_stopped', async () => {
    let callCount = 0;
    const runner = new STwapRunner({
      ...BASE_CONFIG,
      size: 100,
      numIntervals: 4,
      passiveInvoke: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 2) {
          // Signal stop after second invocation completes
          runner.stop();
        }
        return makePassiveResult(25);
      }),
    });

    const result = await runner.run();

    expect(result.intervalsFired).toBe(2);
    expect(result.totalFilled).toBe(50);
    expect(result.reason).toBe('caller_stopped');
  });
});

// ── 7. Drift handling ─────────────────────────────────────────────────────────

describe('STwapRunner — drift handling', () => {
  it('sleep times do not accumulate drift over many intervals', async () => {
    const INTERVAL_MS = 1000;
    const startMs = 0;
    let tick = 0;

    // Simulate 200ms overhead per interval (passiveInvoke takes 200ms simulated time)
    const advancingNow = (): Date => new Date(startMs + tick++ * 200);

    const sleepMock = vi.fn().mockImplementation(async () => {
      // Each sleep advances the simulated clock
      tick += 4; // simulate sleeping ~800ms (total = 1000ms per interval)
    });

    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(10));

    const runner = new STwapRunner({
      ticker: 'DRIFT-TEST',
      side: 'sell',
      size: 100,
      intervalMinutes: INTERVAL_MS / 60_000,
      numIntervals: 10,
      passiveInvoke,
      sleepMs: sleepMock,
      now: advancingNow,
    });

    await runner.run();

    // All 10 intervals should have fired without stopping
    expect(passiveInvoke).toHaveBeenCalledTimes(10);

    // Sleep durations should be based on absolute boundaries, not additive.
    // Each sleep call should be <= intervalMs (not compounding)
    const sleepCalls = sleepMock.mock.calls as [number][];
    for (const [ms] of sleepCalls) {
      expect(ms).toBeLessThanOrEqual(INTERVAL_MS);
    }
  });
});

// ── 8. Journal ordering ───────────────────────────────────────────────────────

describe('STwapRunner — journal ordering', () => {
  it('started → (interval_fired × N) → finished', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;

    const runner = new STwapRunner({ ...BASE_CONFIG, passiveInvoke }, journal);
    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0] as string);
    expect(kinds[0]).toBe('twap_started');
    expect(kinds[kinds.length - 1]).toBe('twap_finished');
    const intervalKinds = kinds.filter((k) => k === 'twap_interval_fired');
    expect(intervalKinds).toHaveLength(4);
  });
});

// ── 9. Side parameterization ──────────────────────────────────────────────────

describe('STwapRunner — side parameterization', () => {
  it('sell side: passiveInvoke receives side=sell', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const runner = new STwapRunner({ ...BASE_CONFIG, side: 'sell', passiveInvoke });
    await runner.run();
    const calls = (passiveInvoke as ReturnType<typeof vi.fn>).mock.calls;
    for (const [cfg] of calls) {
      expect(cfg.side).toBe('sell');
    }
  });

  it('buy side: passiveInvoke receives side=buy', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const runner = new STwapRunner({ ...BASE_CONFIG, side: 'buy', passiveInvoke });
    await runner.run();
    const calls = (passiveInvoke as ReturnType<typeof vi.fn>).mock.calls;
    for (const [cfg] of calls) {
      expect(cfg.side).toBe('buy');
    }
  });
});

// ── 10. Partial fill continuation ────────────────────────────────────────────

describe('STwapRunner — partial fill continuation', () => {
  it('passiveInvoke returns 0 filled on first interval → continues to remaining intervals', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn()
      .mockResolvedValueOnce(makePassiveResult(0))   // interval 0: no fill
      .mockResolvedValue(makePassiveResult(25));      // intervals 1–3: normal fill

    const runner = new STwapRunner({ ...BASE_CONFIG, passiveInvoke });
    const result = await runner.run();

    // All 4 intervals fired regardless of 0 fill on first
    expect(result.intervalsFired).toBe(4);
    expect(passiveInvoke).toHaveBeenCalledTimes(4);
    expect(result.reason).toBe('complete');
  });
});

// ── 11. Total filled accounting ───────────────────────────────────────────────

describe('STwapRunner — total filled accounting', () => {
  it('totalFilled equals sum of per-interval results', async () => {
    const fills = [20, 15, 25, 10];
    let callIdx = 0;
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockImplementation(async () =>
      makePassiveResult(fills[callIdx++] ?? 0),
    );

    const runner = new STwapRunner({ ...BASE_CONFIG, passiveInvoke });
    const result = await runner.run();

    const expectedTotal = fills.reduce((s, v) => s + v, 0);
    expect(result.totalFilled).toBe(expectedTotal);
  });
});

// ── 12. twap_interval_fired journal metadata ──────────────────────────────────

describe('STwapRunner — journal metadata', () => {
  it('each twap_interval_fired entry has correct intervalIndex and sliceSize', async () => {
    const passiveInvoke: PassiveInvokeFn = vi.fn().mockResolvedValue(makePassiveResult(25));
    const journal = makeJournalSpy();
    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;

    const runner = new STwapRunner({ ...BASE_CONFIG, passiveInvoke }, journal);
    await runner.run();

    const intervalCalls = appendSpy.mock.calls.filter(
      (c) => (c[0] as string) === 'twap_interval_fired',
    );

    expect(intervalCalls).toHaveLength(4);
    intervalCalls.forEach((call, i) => {
      const payload = call[1] as { intervalIndex: number; sliceSize: number };
      expect(payload.intervalIndex).toBe(i);
      expect(payload.sliceSize).toBe(25);
    });
  });
});

// ── 13. STwapRunner constructor validation ────────────────────────────────────

describe('STwapRunner — constructor validation', () => {
  it('throws on numIntervals < 2', () => {
    expect(() => new STwapRunner({ ...BASE_CONFIG, numIntervals: 1 })).toThrow('numIntervals must be an integer >= 2');
  });

  it('throws on size = 0', () => {
    expect(() => new STwapRunner({ ...BASE_CONFIG, size: 0 })).toThrow('size must be > 0');
  });
});
