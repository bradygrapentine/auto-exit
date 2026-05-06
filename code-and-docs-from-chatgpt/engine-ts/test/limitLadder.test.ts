/**
 * limitLadder.test.ts — TDD suite for LimitLadderRunner (S8).
 *
 * createOrder is mocked via the KalshiClientLike interface.
 * Journal is injected and spied on; no filesystem I/O.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LimitLadderRunner } from '../src/limitLadder.js';
import type { S8Config, S8Rung } from '../src/limitLadder.js';
import type { KalshiClientLike, OrderResult } from '../src/types.js';
import { Journal } from '../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

let orderCounter = 0;

function makeMockClient(orderIdPrefix = 'order'): KalshiClientLike {
  orderCounter = 0;
  return {
    getOrderbook: vi.fn(),
    createOrder: vi.fn((_payload) => {
      const id = `${orderIdPrefix}-${++orderCounter}`;
      return Promise.resolve({
        orderId: id,
        status: 'resting',
        filledCount: 0,
        remainingCount: _payload.count,
      } as OrderResult);
    }),
    getOrder: vi.fn(),
    cancelOrder: vi.fn(),
    getPosition: vi.fn(),
    getRestingOrderCount: vi.fn(),
    findOrderByClientOrderId: vi.fn(),
  } as unknown as KalshiClientLike;
}

function makeJournalSpy(keaHome = '/tmp/s8-test-home'): Journal {
  const j = new Journal('test-job-id', keaHome);
  vi.spyOn(j, 'append');
  return j;
}

const BASE_CONFIG: S8Config = {
  ticker: 'TEST-TICKER',
  side: 'yes',
  action: 'sell',
  totalSize: 100,
  rungs: [
    { priceCents: 60, sizePct: 50 },
    { priceCents: 70, sizePct: 50 },
  ],
  keaHome: '/tmp/s8-test-home',
};

// ── 1. Validation ─────────────────────────────────────────────────────────────

describe('LimitLadderRunner — validation', () => {
  it('rejects empty ticker', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, ticker: '' },
    )).toThrow(/ticker/);
  });

  it('rejects whitespace-only ticker', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, ticker: '   ' },
    )).toThrow(/ticker/);
  });

  it('rejects totalSize <= 0', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, totalSize: 0 },
    )).toThrow(/totalSize/);
  });

  it('rejects negative totalSize', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, totalSize: -5 },
    )).toThrow(/totalSize/);
  });

  it('rejects invalid action', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, action: 'hold' as 'buy' },
    )).toThrow(/action/);
  });

  it('rejects empty rungs array', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, rungs: [] },
    )).toThrow(/rungs/);
  });

  it('rejects non-positive priceCents', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, rungs: [{ priceCents: 0, sizePct: 100 }] },
    )).toThrow(/priceCents/);
  });

  it('rejects negative priceCents', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, rungs: [{ priceCents: -10, sizePct: 100 }] },
    )).toThrow(/priceCents/);
  });

  it('rejects non-positive sizePct', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, rungs: [{ priceCents: 60, sizePct: 0 }] },
    )).toThrow(/sizePct/);
  });

  it('rejects sum(sizePct) > 100', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      {
        ...BASE_CONFIG,
        rungs: [
          { priceCents: 50, sizePct: 60 },
          { priceCents: 70, sizePct: 50 },
        ],
      },
    )).toThrow(/sum\(sizePct\)/);
  });

  it('accepts sum(sizePct) == 100', () => {
    expect(() => new LimitLadderRunner(
      makeMockClient(),
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
    expect(() => new LimitLadderRunner(
      makeMockClient(),
      { ...BASE_CONFIG, rungs: [{ priceCents: 60, sizePct: 40 }] },
    )).not.toThrow();
  });
});

// ── 2. Posts N GTCs, returns orderIds in rung order ───────────────────────────

describe('LimitLadderRunner — posts GTCs in order', () => {
  it('returns orderIds in rung order for 2-rung ladder', async () => {
    const client = makeMockClient('ord');
    const journal = makeJournalSpy();
    const runner = new LimitLadderRunner(client, BASE_CONFIG, journal);

    const result = await runner.run();

    expect(result.orderIds).toEqual(['ord-1', 'ord-2']);
    expect(result.rungs).toHaveLength(2);
    expect(result.rungs[0]).toEqual({ priceCents: 60, sizePct: 50 });
    expect(result.rungs[1]).toEqual({ priceCents: 70, sizePct: 50 });
  });

  it('calls createOrder exactly once per rung', async () => {
    const client = makeMockClient();
    const runner = new LimitLadderRunner(client, {
      ...BASE_CONFIG,
      rungs: [
        { priceCents: 50, sizePct: 25 },
        { priceCents: 60, sizePct: 25 },
        { priceCents: 70, sizePct: 50 },
      ],
    });

    await runner.run();

    expect(client.createOrder).toHaveBeenCalledTimes(3);
  });
});

// ── 3. Payload: time_in_force + count ─────────────────────────────────────────

describe('LimitLadderRunner — payload correctness', () => {
  it('each createOrder payload has time_in_force=good_till_canceled', async () => {
    const client = makeMockClient();
    const runner = new LimitLadderRunner(client, BASE_CONFIG);

    await runner.run();

    const calls = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls;
    for (const [payload] of calls) {
      expect(payload.time_in_force).toBe('good_till_canceled');
    }
  });

  it('each createOrder payload has type=limit', async () => {
    const client = makeMockClient();
    const runner = new LimitLadderRunner(client, BASE_CONFIG);

    await runner.run();

    const calls = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls;
    for (const [payload] of calls) {
      expect(payload.type).toBe('limit');
    }
  });

  it('count = floor(totalSize * sizePct / 100)', async () => {
    const client = makeMockClient();
    const runner = new LimitLadderRunner(client, {
      ...BASE_CONFIG,
      totalSize: 100,
      rungs: [
        { priceCents: 60, sizePct: 33 },   // floor(100 * 33/100) = 33
        { priceCents: 70, sizePct: 50 },   // floor(100 * 50/100) = 50
      ],
    });

    await runner.run();

    const calls = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0].count).toBe(33);
    expect(calls[1][0].count).toBe(50);
  });

  it('sets no_price for no-side orders', async () => {
    const client = makeMockClient();
    const runner = new LimitLadderRunner(client, {
      ...BASE_CONFIG,
      side: 'no',
      rungs: [{ priceCents: 40, sizePct: 100 }],
    });

    await runner.run();

    const [payload] = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.no_price).toBe(40);
    expect(payload.yes_price).toBeUndefined();
  });

  it('sets yes_price for yes-side orders', async () => {
    const client = makeMockClient();
    const runner = new LimitLadderRunner(client, {
      ...BASE_CONFIG,
      side: 'yes',
      rungs: [{ priceCents: 70, sizePct: 100 }],
    });

    await runner.run();

    const [payload] = (client.createOrder as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.yes_price).toBe(70);
    expect(payload.no_price).toBeUndefined();
  });
});

// ── 4. Skips rungs with computed rungSize = 0 ────────────────────────────────

describe('LimitLadderRunner — skip zero-size rungs', () => {
  it('skips rung when floor(totalSize * sizePct / 100) = 0', async () => {
    const client = makeMockClient();
    // totalSize=10, sizePct=0.5 (but sizePct must be > 0 — use sizePct=1 with totalSize=50 to get floor=0 is not possible)
    // Use totalSize=10, sizePct=5 → floor(10*5/100) = floor(0.5) = 0
    const runner = new LimitLadderRunner(client, {
      ...BASE_CONFIG,
      totalSize: 10,
      rungs: [
        { priceCents: 50, sizePct: 5 },    // floor(10*5/100) = 0 → skip
        { priceCents: 70, sizePct: 50 },   // floor(10*50/100) = 5 → submit
      ],
    });

    const result = await runner.run();

    expect(client.createOrder).toHaveBeenCalledTimes(1);
    expect(result.orderIds).toHaveLength(1);
    expect(result.rungs).toHaveLength(1);
    expect(result.rungs[0].priceCents).toBe(70);
  });

  it('returns empty results when all rungs compute to 0', async () => {
    const client = makeMockClient();
    const runner = new LimitLadderRunner(client, {
      ...BASE_CONFIG,
      totalSize: 1,
      rungs: [
        { priceCents: 50, sizePct: 5 },    // floor(1*5/100) = 0
        { priceCents: 70, sizePct: 9 },    // floor(1*9/100) = 0
      ],
    });

    const result = await runner.run();

    expect(client.createOrder).not.toHaveBeenCalled();
    expect(result.orderIds).toHaveLength(0);
    expect(result.submittedShares).toBe(0);
  });
});

// ── 5. submittedShares = sum of per-rung sizes ────────────────────────────────

describe('LimitLadderRunner — submittedShares', () => {
  it('equals sum of floor(totalSize * sizePct / 100) for each rung', async () => {
    const client = makeMockClient();
    const runner = new LimitLadderRunner(client, {
      ...BASE_CONFIG,
      totalSize: 100,
      rungs: [
        { priceCents: 50, sizePct: 30 },   // 30
        { priceCents: 60, sizePct: 30 },   // 30
        { priceCents: 70, sizePct: 30 },   // 30
      ],
    });

    const result = await runner.run();

    expect(result.submittedShares).toBe(90);
  });

  it('excludes skipped (zero-size) rungs from submittedShares', async () => {
    const client = makeMockClient();
    const runner = new LimitLadderRunner(client, {
      ...BASE_CONFIG,
      totalSize: 10,
      rungs: [
        { priceCents: 50, sizePct: 5 },    // 0 → skip
        { priceCents: 70, sizePct: 50 },   // 5
      ],
    });

    const result = await runner.run();

    expect(result.submittedShares).toBe(5);
  });
});

// ── 6. Journal calls ──────────────────────────────────────────────────────────

describe('LimitLadderRunner — journal entries', () => {
  it('appends limit_ladder_started at start', async () => {
    const client = makeMockClient();
    const journal = makeJournalSpy();
    const runner = new LimitLadderRunner(client, BASE_CONFIG, journal);

    await runner.run();

    expect(journal.append).toHaveBeenCalledWith(
      'limit_ladder_started',
      expect.objectContaining({ ticker: 'TEST-TICKER' }),
    );
  });

  it('appends gtc_resting per submitted rung', async () => {
    const client = makeMockClient();
    const journal = makeJournalSpy();
    const runner = new LimitLadderRunner(client, BASE_CONFIG, journal);

    await runner.run();

    const calls = (journal.append as ReturnType<typeof vi.fn>).mock.calls;
    const gtcCalls = calls.filter(([kind]) => kind === 'gtc_resting');
    expect(gtcCalls).toHaveLength(2);
  });

  it('appends limit_ladder_finished at end', async () => {
    const client = makeMockClient();
    const journal = makeJournalSpy();
    const runner = new LimitLadderRunner(client, BASE_CONFIG, journal);

    await runner.run();

    expect(journal.append).toHaveBeenCalledWith(
      'limit_ladder_finished',
      expect.objectContaining({ submittedShares: 100 }),
    );
  });
});
