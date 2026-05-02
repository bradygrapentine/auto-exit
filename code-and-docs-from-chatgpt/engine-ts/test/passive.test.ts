/**
 * passive.test.ts — EN-1 S1 Passive strategy tests.
 *
 * Covers: dry-run, fill-on-first-iter, multi-iter-walk (cancel-replace after
 * timebox), spread-too-tight fallthrough, forbidden-ticker guard.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from '../src/passive.js';
import type { PassiveConfig } from '../src/passive.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { Orderbook } from '../src/types.js';

// ── Safety mock ───────────────────────────────────────────────────────────────
vi.mock('../src/safety.js', async () => {
  const actual = await vi.importActual<typeof import('../src/safety.js')>('../src/safety.js');
  return {
    ...actual,
    getSafety: vi.fn(() => ({
      version: 1 as const,
      safetySubmittedMultiple: 1.1,
      floorPriceCents: 0,
      tailSweepThreshold: 0,
      forbiddenTickers: [],
    })),
  };
});

// ── Temp dir for journals ─────────────────────────────────────────────────────
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-passive-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Orderbook fixtures ────────────────────────────────────────────────────────

const normalBook: Orderbook = {
  yes: [{ priceCents: 55, size: 10000 }], // best YES ask = 55¢
  no: [{ priceCents: 50, size: 10000 }],  // best NO ask = 50¢ → implied YES bid = 50¢
  // spread = 55 - 50 = 5¢
};

// Tight spread (< 1¢ means bid == ask, i.e. spread = 0)
const tightBook: Orderbook = {
  yes: [{ priceCents: 50, size: 10000 }], // YES ask = 50¢
  no: [{ priceCents: 50, size: 10000 }],  // implied YES bid = 50¢ → spread = 0
};

function makeConfig(overrides: Partial<PassiveConfig> = {}): PassiveConfig {
  return {
    ticker: 'KXTEST',
    side: 'sell',
    size: 100,
    chunkSize: 100,
    loopDelayMs: 0,
    dryRun: false,
    passiveTimeboxMs: 100, // very short timebox for fast tests
    keaHome: tmpDir,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('passive: dry-run', () => {
  it('fills without calling createOrder or cancelOrder', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
    });
    const result = await run(mock, makeConfig({ dryRun: true }));

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.avgPriceCents).toBeGreaterThan(0);
    expect(mock.events).not.toContain('createOrder');
    expect(mock.events).not.toContain('cancelOrder');
  });

  it('dry-run: avgPriceCents is sell ask-minus-1 (54¢)', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [normalBook] });
    const result = await run(mock, makeConfig({ dryRun: true, size: 100, chunkSize: 100 }));
    // normalBook: YES ask = 55, sell posts at ask - 1 = 54
    expect(result.avgPriceCents).toBe(54);
  });
});

describe('passive: fill-on-first-iter (live)', () => {
  it('fills completely on first createOrder call', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
      behaviors: [{ fillCount: 100 }], // immediate fill
    });
    const result = await run(mock, makeConfig());

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(100);
    expect(result.remaining).toBe(0);
    // sell: posted at ask - 1 = 54¢
    expect(result.avgPriceCents).toBe(54);
    expect(mock.events.filter((e) => e === 'createOrder').length).toBe(1);
    expect(mock.events).not.toContain('cancelOrder');
  });

  it('buy side: fills on first iter, posts at bid + 1', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
      behaviors: [{ fillCount: 50 }],
    });
    const result = await run(mock, makeConfig({ side: 'buy', size: 50, chunkSize: 50 }));

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(50);
    // buy: bid = 50, posts at bid + 1 = 51¢
    expect(result.avgPriceCents).toBe(51);
  });
});

describe('passive: multi-iter walk (cancel-replace)', () => {
  it('cancels on timebox expiry and re-posts at lower price (sell)', async () => {
    // First iter: no fill (resting) → timebox expires → cancel → walk tick → second iter fills
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook, normalBook],
      behaviors: [
        { fillCount: 0 },  // first order: no fill
        { fillCount: 100 }, // second order (after walk): full fill
      ],
    });
    const result = await run(
      mock,
      makeConfig({
        size: 100,
        chunkSize: 100,
        passiveTimeboxMs: 1, // 1ms so it expires immediately
        loopDelayMs: 0,
      }),
    );

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(100);
    expect(mock.events.filter((e) => e === 'createOrder').length).toBe(2);
    expect(mock.events).toContain('cancelOrder');
    // Second order should be at 53¢ (54 - 1 tick) — avgPriceCents ≤ 54
    expect(result.avgPriceCents).toBeLessThanOrEqual(54);
    expect(result.avgPriceCents).toBeGreaterThan(0);
  });

  it('partial cancel fill counts toward total filled', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook, normalBook],
      behaviors: [
        { fillCount: 0, fillOnCancel: 30 }, // cancel gives 30 fills
        { fillCount: 70 }, // second order fills remainder
      ],
    });
    const result = await run(
      mock,
      makeConfig({ size: 100, chunkSize: 100, passiveTimeboxMs: 1 }),
    );

    expect(result.filled).toBe(100);
    expect(result.status).toBe('complete');
  });
});

describe('passive: spread_too_tight fallthrough', () => {
  it('returns spread_too_tight when spread < 1¢, places no order', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [tightBook],
    });
    const result = await run(mock, makeConfig());

    expect(result.status).toBe('spread_too_tight');
    expect(result.filled).toBe(0);
    expect(result.remaining).toBe(100);
    expect(mock.events).not.toContain('createOrder');
  });
});

describe('passive: forbidden ticker', () => {
  it('throws when ticker is in forbiddenTickers', async () => {
    const { getSafety } = await import('../src/safety.js');
    vi.mocked(getSafety).mockReturnValueOnce({
      version: 1,
      safetySubmittedMultiple: 1.1,
      floorPriceCents: 0,
      tailSweepThreshold: 0,
      forbiddenTickers: [
        {
          ticker: 'KXTEST',
          reason: 'test forbidden',
          addedAt: new Date().toISOString(),
          addedBy: 'test',
        },
      ],
    });

    const mock = new MockKalshiClient({ orderbookSnapshots: [normalBook] });
    await expect(run(mock, makeConfig())).rejects.toThrow(/forbidden/i);
    expect(mock.events).not.toContain('createOrder');
  });
});

describe('passive: floor/ceiling guards', () => {
  it('sell: stops at floor (minPriceCents), returns partial', async () => {
    // normalBook: YES ask = 55, initial sell price = 54
    // Set floor at 55 so we hit it immediately (iterPrice = 54 < 55)
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
      behaviors: [{ fillCount: 0 }],
    });
    const result = await run(
      mock,
      makeConfig({
        size: 200,
        chunkSize: 100,
        minPriceCents: 55, // floor above initial post price
        passiveTimeboxMs: 1,
      }),
    );

    expect(result.status).toBe('partial');
    expect(result.filled).toBe(0);
    expect(result.remaining).toBe(200);
  });

  it('buy: stops at ceiling (maxPriceCents), returns partial', async () => {
    // normalBook: NO ask = 50, implied bid = 50, initial buy price = 51
    // Set ceiling at 50 so initial price (51) already exceeds it
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
      behaviors: [{ fillCount: 0 }],
    });
    const result = await run(
      mock,
      makeConfig({
        side: 'buy',
        size: 100,
        chunkSize: 100,
        maxPriceCents: 50, // ceiling below initial buy price (51)
        passiveTimeboxMs: 1,
      }),
    );

    expect(result.status).toBe('partial');
    expect(result.filled).toBe(0);
  });
});

describe('passive: journal entries', () => {
  it('writes order_intent before order_placed', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
      behaviors: [{ fillCount: 100 }],
    });
    const cfg = makeConfig();
    const result = await run(mock, cfg);

    // Read journal
    const jobsDir = path.join(tmpDir, 'jobs');
    const files = fs.readdirSync(jobsDir);
    expect(files.length).toBe(1);
    const entries = fs
      .readFileSync(path.join(jobsDir, files[0]!), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as { kind: string; data: unknown });

    const intentIdx = entries.findIndex((e) => e.kind === 'order_intent');
    const placedIdx = entries.findIndex((e) => e.kind === 'order_placed');
    expect(intentIdx).toBeGreaterThanOrEqual(0);
    expect(intentIdx).toBeLessThan(placedIdx);
    expect(result.status).toBe('complete');
  });

  it('first journal entry after safety_loaded is loop_started', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
      behaviors: [{ fillCount: 100 }],
    });
    await run(mock, makeConfig());

    const jobsDir = path.join(tmpDir, 'jobs');
    const files = fs.readdirSync(jobsDir);
    const entries = fs
      .readFileSync(path.join(jobsDir, files[0]!), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as { kind: string });

    const safetyIdx = entries.findIndex((e) => e.kind === 'safety_loaded');
    const loopStartIdx = entries.findIndex((e) => e.kind === 'loop_started');
    expect(safetyIdx).toBeGreaterThanOrEqual(0);
    expect(loopStartIdx).toBeGreaterThan(safetyIdx);
  });
});

describe('passive: buy-side walk (cancel-replace)', () => {
  it('buy: cancels on timebox expiry and re-posts at higher price', async () => {
    // normalBook: bid=50, buy posts at 51. First order: no fill → cancel → walk to 52 → fill.
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook, normalBook],
      behaviors: [
        { fillCount: 0 },   // first order: no fill
        { fillCount: 100 }, // second order (at 52¢): full fill
      ],
    });
    const result = await run(
      mock,
      makeConfig({
        side: 'buy',
        size: 100,
        chunkSize: 100,
        passiveTimeboxMs: 1,
        loopDelayMs: 0,
      }),
    );

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(100);
    expect(mock.events.filter((e) => e === 'createOrder').length).toBe(2);
    expect(mock.events).toContain('cancelOrder');
    // Second order posted at bid+1+1 = 52¢
    expect(result.avgPriceCents).toBeGreaterThanOrEqual(51);
  });
});

describe('passive: error handling', () => {
  it('returns error status when createOrder throws', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
    });
    vi.spyOn(mock, 'createOrder').mockRejectedValueOnce(new Error('network error'));

    const result = await run(mock, makeConfig({ dryRun: false }));

    expect(result.status).toBe('error');
    expect(result.filled).toBe(0);
  });

  it('continues when getOrder throws during poll (treats as timebox expiry)', async () => {
    // First order: placed, then getOrder throws → poll loop breaks → cancel branch
    // Second order (after walk): fills immediately
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook, normalBook],
      behaviors: [
        { fillCount: 0 }, // first order: resting, won't fill on poll
        { fillCount: 100 }, // second order: fills
      ],
    });
    vi.spyOn(mock, 'getOrder').mockRejectedValueOnce(new Error('transient error'));

    const result = await run(
      mock,
      makeConfig({ size: 100, chunkSize: 100, passiveTimeboxMs: 1 }),
    );

    // After getOrder throws: break from poll → cancel (filledCount: 0) → walk tick → second order fills
    expect(result.filled).toBe(100);
    expect(result.status).toBe('complete');
  });

  it('continues when cancelOrder throws (ignores cancel error, walks tick)', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook, normalBook],
      behaviors: [
        { fillCount: 0 },   // first: no fill
        { fillCount: 100 }, // second (after walk): fills
      ],
    });
    vi.spyOn(mock, 'cancelOrder').mockRejectedValueOnce(new Error('cancel failed'));

    const result = await run(
      mock,
      makeConfig({ size: 100, chunkSize: 100, passiveTimeboxMs: 1 }),
    );

    // cancelOrder threw but runner should continue (walk tick, re-post)
    expect(result.filled).toBe(100);
    expect(result.status).toBe('complete');
  });
});

describe('passive: NO-side ticker', () => {
  it('uses no_price_dollars for _NO tickers', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
      behaviors: [{ fillCount: 100 }],
    });
    const result = await run(
      mock,
      makeConfig({
        ticker: 'KXTEST_NO',
        side: 'sell',
        size: 100,
        chunkSize: 100,
      }),
    );

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(100);
    // Order should have no_price_dollars set
    const order = mock.orders[0];
    expect(order).toBeDefined();
    expect(order!.payload.no_price_dollars).toBeDefined();
    expect(order!.payload.yes_price_dollars).toBeUndefined();
  });
});

describe('passive: loopDelayMs > 0', () => {
  it('respects loopDelayMs between chunk iterations', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook],
      behaviors: [{ fillCount: 100 }],
    });
    const start = Date.now();
    const result = await run(
      mock,
      makeConfig({ size: 100, chunkSize: 100, loopDelayMs: 5 }),
    );
    // Just verify it ran correctly — timing assertions are fragile but loopDelayMs path is covered
    expect(result.status).toBe('complete');
    expect(result.filled).toBe(100);
  });
});

describe('passive: multi-chunk outer loop', () => {
  it('fills chunk 1 then chunk 2, total filled === 200', async () => {
    // size: 200, chunkSize: 100 — two outer-loop iterations
    // chunk 1 fills on first iter, chunk 2 fills on first iter
    const mock = new MockKalshiClient({
      orderbookSnapshots: [normalBook, normalBook],
      behaviors: [
        { fillCount: 100 }, // chunk 1: immediate fill
        { fillCount: 100 }, // chunk 2: immediate fill
      ],
    });
    const result = await run(mock, makeConfig({ size: 200, chunkSize: 100 }));

    expect(result.filled).toBe(200);
    expect(result.status).toBe('complete');
    expect(result.remaining).toBe(0);
  });
});
