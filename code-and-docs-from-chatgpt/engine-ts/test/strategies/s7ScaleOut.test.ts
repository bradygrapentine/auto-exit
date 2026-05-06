/**
 * s7ScaleOut.test.ts — TDD suite for S7 scale-out runner.
 *
 * S1 invocation is mocked via config.s1Invoke so we never spin up the real
 * passive strategy. Journal is mocked with vi.fn() spies.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S7ScaleOutRunner } from '../../src/strategies/s7ScaleOut.js';
import type { S7Config, S7Rung, S1InvokeFn } from '../../src/strategies/s7ScaleOut.js';
import type { KalshiClientLike, Orderbook } from '../../src/types.js';
import { Journal } from '../../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOrderbook(topBidCents: number): Orderbook {
  return {
    yes: topBidCents > 0 ? [{ priceCents: topBidCents, size: 100 }] : [],
    no: [],
  };
}

function makeMockClient(topBidCents: number | (() => number)): KalshiClientLike {
  return {
    getOrderbook: vi.fn((_ticker: string, _depth: number) => {
      const bid = typeof topBidCents === 'function' ? topBidCents() : topBidCents;
      return Promise.resolve(makeOrderbook(bid));
    }),
    createOrder: vi.fn(),
    getOrder: vi.fn(),
    cancelOrder: vi.fn(),
    getPosition: vi.fn(),
    getRestingOrderCount: vi.fn(),
    findOrderByClientOrderId: vi.fn(),
  } as unknown as KalshiClientLike;
}

function makeS1Invoke(filledPerRung = 10): S1InvokeFn {
  return vi.fn().mockResolvedValue({ filled: filledPerRung });
}

function makeJournalSpy(keaHome = '/tmp/s7-test-home'): Journal {
  const j = new Journal('test-job-id', keaHome);
  vi.spyOn(j, 'append');
  return j;
}

const BASE_CONFIG = {
  ticker: 'TEST-TICKER',
  side: 'sell' as const,
  totalSize: 100,
  pollIntervalMs: 0,    // no sleep in tests
  maxIterations: 10,
  s1Template: { dryRun: true },
};

// ── 1. Validation tests ───────────────────────────────────────────────────────

describe('S7ScaleOutRunner — validation', () => {
  it('rejects empty rungs array', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      { ...BASE_CONFIG, rungs: [] },
    )).toThrow(/rungs/);
  });

  it('rejects non-positive priceCents', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      { ...BASE_CONFIG, rungs: [{ priceCents: 0, sizePct: 100 }] },
    )).toThrow(/priceCents/);
  });

  it('rejects negative priceCents', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      { ...BASE_CONFIG, rungs: [{ priceCents: -5, sizePct: 100 }] },
    )).toThrow(/priceCents/);
  });

  it('rejects non-positive sizePct', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      { ...BASE_CONFIG, rungs: [{ priceCents: 70, sizePct: 0 }] },
    )).toThrow(/sizePct/);
  });

  it('rejects sum(sizePct) > 100', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      {
        ...BASE_CONFIG,
        rungs: [
          { priceCents: 50, sizePct: 60 },
          { priceCents: 70, sizePct: 50 },
        ],
      },
    )).toThrow(/sum\(sizePct\)/);
  });

  it('rejects non-sell side', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      { ...BASE_CONFIG, side: 'buy' as 'sell', rungs: [{ priceCents: 70, sizePct: 100 }] },
    )).toThrow(/sell/);
  });

  it('rejects non-positive totalSize', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      { ...BASE_CONFIG, totalSize: 0, rungs: [{ priceCents: 70, sizePct: 100 }] },
    )).toThrow(/totalSize/);
  });

  it('rejects negative totalSize', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      { ...BASE_CONFIG, totalSize: -1, rungs: [{ priceCents: 70, sizePct: 100 }] },
    )).toThrow(/totalSize/);
  });

  it('accepts sum(sizePct) == 100', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      {
        ...BASE_CONFIG,
        rungs: [
          { priceCents: 50, sizePct: 50 },
          { priceCents: 70, sizePct: 50 },
        ],
      },
    )).not.toThrow();
  });

  it('accepts sum(sizePct) < 100 (partial ladder)', () => {
    expect(() => new S7ScaleOutRunner(
      makeMockClient(70),
      { ...BASE_CONFIG, rungs: [{ priceCents: 70, sizePct: 50 }] },
    )).not.toThrow();
  });
});

// ── 2. Single rung at price 70, bid=80 → fires immediately ───────────────────

describe('S7ScaleOutRunner — single rung fires', () => {
  it('bid=80 >= rung priceCents=70 → fires, returns all_rungs_fired', async () => {
    const s1 = makeS1Invoke(25);
    const runner = new S7ScaleOutRunner(
      makeMockClient(80),
      {
        ...BASE_CONFIG,
        rungs: [{ priceCents: 70, sizePct: 100 }],
        s1Invoke: s1,
      },
    );
    const result = await runner.run();

    expect(result.reason).toBe('all_rungs_fired');
    expect(result.firedRungs).toEqual([0]);
    expect(result.totalFilled).toBe(25);
    expect(result.iterations).toBe(1);
  });

  it('calls S1 with correct size (floor(totalSize * sizePct / 100))', async () => {
    const s1 = makeS1Invoke(10);
    const runner = new S7ScaleOutRunner(
      makeMockClient(80),
      {
        ...BASE_CONFIG,
        totalSize: 100,
        rungs: [{ priceCents: 70, sizePct: 30 }],   // 30% of 100 = 30
        s1Invoke: s1,
      },
    );
    await runner.run();

    expect(s1).toHaveBeenCalledOnce();
    const cfg = (s1 as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(cfg.size).toBe(30);
    expect(cfg.ticker).toBe('TEST-TICKER');
    expect(cfg.side).toBe('sell');
  });
});

// ── 3. Three rungs, bid walks up across multiple iterations ──────────────────

describe('S7ScaleOutRunner — three rungs, bid walks up', () => {
  it('fires rungs in sequence as bid crosses each threshold', async () => {
    const bids = [40, 55, 65, 75];
    let callCount = 0;
    const client = makeMockClient(() => bids[Math.min(callCount++, bids.length - 1)]);

    const s1 = makeS1Invoke(10);
    const rungs: S7Rung[] = [
      { priceCents: 50, sizePct: 25 },
      { priceCents: 60, sizePct: 25 },
      { priceCents: 70, sizePct: 50 },
    ];

    const runner = new S7ScaleOutRunner(client, {
      ...BASE_CONFIG,
      totalSize: 100,
      rungs,
      maxIterations: 20,
      s1Invoke: s1,
    });
    const result = await runner.run();

    expect(result.reason).toBe('all_rungs_fired');
    expect(result.firedRungs).toEqual([0, 1, 2]);
    expect(result.totalFilled).toBe(30);   // 3 rungs × 10 filled each
    // bid[0]=40: no rung; bid[1]=55: rung0; bid[2]=65: rung1; bid[3]=75: rung2
    expect(result.iterations).toBe(4);
    expect(s1).toHaveBeenCalledTimes(3);
  });

  it('does not re-fire an already-fired rung', async () => {
    // Bid stays at 80 (above all thresholds) — all 3 fire in a single iteration
    const s1 = makeS1Invoke(5);
    const runner = new S7ScaleOutRunner(
      makeMockClient(80),
      {
        ...BASE_CONFIG,
        rungs: [
          { priceCents: 50, sizePct: 25 },
          { priceCents: 60, sizePct: 25 },
          { priceCents: 70, sizePct: 50 },
        ],
        s1Invoke: s1,
      },
    );
    const result = await runner.run();
    expect(result.reason).toBe('all_rungs_fired');
    expect(s1).toHaveBeenCalledTimes(3);
  });
});

// ── 4. Bid never reaches first rung → max_iterations ─────────────────────────

describe('S7ScaleOutRunner — max_iterations hit', () => {
  it('returns max_iterations when bid never reaches first rung', async () => {
    const s1 = makeS1Invoke(10);
    const runner = new S7ScaleOutRunner(
      makeMockClient(40),   // always below rung at 70
      {
        ...BASE_CONFIG,
        rungs: [{ priceCents: 70, sizePct: 100 }],
        maxIterations: 5,
        s1Invoke: s1,
      },
    );
    const result = await runner.run();

    expect(result.reason).toBe('max_iterations');
    expect(result.firedRungs).toEqual([]);
    expect(result.totalFilled).toBe(0);
    expect(result.iterations).toBe(5);
    expect(s1).not.toHaveBeenCalled();
  });
});

// ── 5. stop() mid-run → caller_stopped ───────────────────────────────────────

describe('S7ScaleOutRunner — stop() graceful shutdown', () => {
  it('resolves with caller_stopped when stop() called before run()', async () => {
    const s1 = makeS1Invoke(10);
    const runner = new S7ScaleOutRunner(
      makeMockClient(40),   // bid below rung; would loop indefinitely
      {
        ...BASE_CONFIG,
        rungs: [{ priceCents: 70, sizePct: 100 }],
        maxIterations: 10_000,
        s1Invoke: s1,
      },
    );
    runner.stop();
    const result = await runner.run();

    expect(result.reason).toBe('caller_stopped');
    expect(result.firedRungs).toEqual([]);
  });
});

// ── 6. Journal entries written ────────────────────────────────────────────────

describe('S7ScaleOutRunner — journal entries', () => {
  it('writes s7_rung_fired per rung and s7_run_complete at end', async () => {
    const journal = makeJournalSpy('/tmp/s7-journal-test');
    const s1 = makeS1Invoke(15);

    const runner = new S7ScaleOutRunner(
      makeMockClient(80),
      {
        ...BASE_CONFIG,
        rungs: [
          { priceCents: 50, sizePct: 50 },
          { priceCents: 70, sizePct: 50 },
        ],
        s1Invoke: s1,
      },
      journal,
    );
    await runner.run();

    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const calls = appendSpy.mock.calls;
    const kinds = calls.map((c) => c[0] as string);

    // Should have s7_rung_fired for each rung
    const firedCalls = kinds.filter((k) => k === 's7_rung_fired');
    expect(firedCalls).toHaveLength(2);

    // Should have exactly one s7_run_complete
    const completeCalls = kinds.filter((k) => k === 's7_run_complete');
    expect(completeCalls).toHaveLength(1);

    // Verify rung_fired data
    const rungFiredEntries = calls.filter((c) => c[0] === 's7_rung_fired');
    expect(rungFiredEntries[0][1]).toMatchObject({
      rungIndex: 0,
      priceCents: 50,
      sizePct: 50,
      fillCount: 15,
    });
    expect(rungFiredEntries[1][1]).toMatchObject({
      rungIndex: 1,
      priceCents: 70,
      sizePct: 50,
      fillCount: 15,
    });

    // Verify run_complete data
    const completeEntry = calls.find((c) => c[0] === 's7_run_complete');
    expect(completeEntry?.[1]).toMatchObject({
      reason: 'all_rungs_fired',
      totalFilled: 30,
    });
  });

  it('writes s7_run_complete with max_iterations reason', async () => {
    const journal = makeJournalSpy('/tmp/s7-journal-maxiter');
    const runner = new S7ScaleOutRunner(
      makeMockClient(30),
      {
        ...BASE_CONFIG,
        rungs: [{ priceCents: 70, sizePct: 100 }],
        maxIterations: 3,
        s1Invoke: makeS1Invoke(),
      },
      journal,
    );
    await runner.run();

    const appendSpy = journal.append as ReturnType<typeof vi.spyOn>;
    const completeCall = appendSpy.mock.calls.find((c) => c[0] === 's7_run_complete');
    expect(completeCall?.[1]).toMatchObject({ reason: 'max_iterations' });
  });
});

// ── 7. S1 invocation sizing and totalFilled aggregation ──────────────────────

describe('S7ScaleOutRunner — S1 sizing and totalFilled', () => {
  it('passes correct size per rung and aggregates totalFilled', async () => {
    // totalSize=200; rung0=25%=50, rung1=50%=100, rung2=25%=50
    const fills = [7, 12, 3];
    let callIdx = 0;
    const s1: S1InvokeFn = vi.fn().mockImplementation(() =>
      Promise.resolve({ filled: fills[callIdx++] ?? 0 }),
    );

    const runner = new S7ScaleOutRunner(
      makeMockClient(80),
      {
        ...BASE_CONFIG,
        totalSize: 200,
        rungs: [
          { priceCents: 50, sizePct: 25 },
          { priceCents: 60, sizePct: 50 },
          { priceCents: 70, sizePct: 25 },
        ],
        s1Invoke: s1,
      },
    );
    const result = await runner.run();

    expect(result.totalFilled).toBe(7 + 12 + 3);

    const mockFn = s1 as ReturnType<typeof vi.fn>;
    const sizes = mockFn.mock.calls.map((c) => (c[1] as { size: number }).size);
    expect(sizes).toEqual([50, 100, 50]);
  });

  it('floors fractional rung sizes (Math.floor)', async () => {
    // totalSize=7, sizePct=30 → floor(7*30/100) = floor(2.1) = 2
    const s1 = makeS1Invoke(2);
    const runner = new S7ScaleOutRunner(
      makeMockClient(80),
      {
        ...BASE_CONFIG,
        totalSize: 7,
        rungs: [{ priceCents: 70, sizePct: 30 }],
        s1Invoke: s1,
      },
    );
    await runner.run();

    const cfg = (s1 as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(cfg.size).toBe(2);
  });

  it('propagates s1Template fields to each S1 invocation', async () => {
    const s1 = makeS1Invoke(5);
    const runner = new S7ScaleOutRunner(
      makeMockClient(80),
      {
        ...BASE_CONFIG,
        rungs: [{ priceCents: 70, sizePct: 100 }],
        s1Template: { dryRun: true, chunkSize: 25 },
        s1Invoke: s1,
      },
    );
    await runner.run();

    const cfg = (s1 as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(cfg.dryRun).toBe(true);
    expect(cfg.chunkSize).toBe(25);
    // Per-rung overrides win over template
    expect(cfg.side).toBe('sell');
    expect(cfg.ticker).toBe('TEST-TICKER');
  });
});
