/**
 * buyRunner.test.ts — W1.5 buy primitive tests.
 *
 * Mirror patterns from exitRunner.test.ts and orderIntent.test.ts.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BuyRunner, run } from '../src/buyRunner.js';
import { Journal, generateJobId } from '../src/journal.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { BuyConfig, OrderIntentData, Orderbook } from '../src/types.js';

// ── Safety mock ───────────────────────────────────────────────────────────────
vi.mock('../src/safety.js', async () => {
  const actual = await vi.importActual<typeof import('../src/safety.js')>('../src/safety.js');
  return {
    ...actual,
    getSafety: vi.fn(() => ({
      version: 1 as const,
      safetySubmittedMultiple: 2.0,
      floorPriceCents: 0,
      tailSweepThreshold: 0,
      forbiddenTickers: [],
    })),
  };
});

// ── Temp dir for journals ─────────────────────────────────────────────────────
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-buy-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

// YES bid at 10¢, NO bid at 70¢ → YES ask = 100 - 70 = 30¢, mid = (10+30)/2 = 20¢
// topAskCents (30) is below maxPriceCents (50), so orders will be placed.
const askBook: Orderbook = {
  yes: [{ priceCents: 10, size: 10000 }],
  no: [{ priceCents: 70, size: 10000 }],
};

function makeConfig(overrides: Partial<BuyConfig> = {}): BuyConfig {
  return {
    ticker: 'KXTEST',
    side: 'buy',
    size: 100,
    chunkSize: 100,
    maxPriceCents: 50,
    loopDelayMs: 0,
    dryRun: false,
    maxOrders: 20,
    orderbookDepth: 20,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BuyRunner basic fill', () => {
  it('single chunk fills completely — status complete', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [askBook],
      behaviors: [{ fillCount: 100 }],
    });
    const jobId = generateJobId();
    const runner = new BuyRunner(mock, makeConfig({ size: 100, chunkSize: 100 }), { keaHome: tmpDir, resumeFromJobId: jobId });
    const result = await runner.run();

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.avgPriceCents).toBeGreaterThan(0);
    expect(mock.events.filter((e) => e === 'createOrder').length).toBe(1);
  });

  it('assigns the jobId from options', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [askBook],
      behaviors: [{ fillCount: 100 }],
    });
    const jobId = generateJobId();
    const runner = new BuyRunner(mock, makeConfig(), { keaHome: tmpDir, resumeFromJobId: jobId });
    expect(runner.jobId).toBe(jobId);
    await runner.run();
    expect(runner.jobId).toBe(jobId);
  });
});

describe('BuyRunner multi-chunk', () => {
  it('size=500 chunkSize=200 — takes 3 iterations', async () => {
    const books = Array.from({ length: 5 }, () => askBook);
    const behaviors = [
      { fillCount: 200 },
      { fillCount: 200 },
      { fillCount: 100 },
    ];
    const mock = new MockKalshiClient({ orderbookSnapshots: books, behaviors });
    const jobId = generateJobId();
    const runner = new BuyRunner(mock, makeConfig({ size: 500, chunkSize: 200 }), { keaHome: tmpDir, resumeFromJobId: jobId });
    const result = await runner.run();

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(500);
    expect(result.remaining).toBe(0);
    expect(mock.events.filter((e) => e === 'createOrder').length).toBe(3);
  });
});

describe('BuyRunner dryRun', () => {
  it('fills without calling createOrder', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [askBook],
    });
    const jobId = generateJobId();
    const runner = new BuyRunner(mock, makeConfig({ dryRun: true }), { keaHome: tmpDir, resumeFromJobId: jobId });
    const result = await runner.run();

    expect(result.status).toBe('complete');
    expect(result.filled).toBe(100);
    expect(mock.events).not.toContain('createOrder');
  });
});

describe('BuyRunner forbidden ticker', () => {
  it('throws when ticker is in forbiddenTickers', async () => {
    // Override safety mock to include the forbidden ticker
    const { getSafety } = await import('../src/safety.js');
    vi.mocked(getSafety).mockReturnValueOnce({
      version: 1,
      safetySubmittedMultiple: 2.0,
      floorPriceCents: 0,
      tailSweepThreshold: 0,
      forbiddenTickers: [
        { ticker: 'KXTEST', reason: 'test forbidden', addedAt: new Date().toISOString(), addedBy: 'test' },
      ],
    });

    const mock = new MockKalshiClient({ orderbookSnapshots: [askBook] });
    const runner = new BuyRunner(mock, makeConfig(), { keaHome: tmpDir });

    await expect(runner.run()).rejects.toThrow(/forbidden/i);
    expect(mock.events).not.toContain('createOrder');
  });
});

describe('BuyRunner order_intent before order_placed', () => {
  it('writes order_intent before order_placed in journal', async () => {
    const books = [askBook, askBook];
    const mock = new MockKalshiClient({
      orderbookSnapshots: books,
      behaviors: [{ fillCount: 50 }, { fillCount: 50 }],
    });
    const jobId = generateJobId();
    const runner = new BuyRunner(mock, makeConfig({ size: 100, chunkSize: 50 }), { keaHome: tmpDir, resumeFromJobId: jobId });
    await runner.run();

    const j = new Journal(jobId, tmpDir);
    const entries = j.readAll();

    for (const e of entries) {
      if (e.kind !== 'order_placed') continue;
      const placed = e.data as { payload?: { client_order_id?: string } };
      const clientOrderId = placed.payload?.client_order_id;
      expect(clientOrderId).toBeTruthy();

      const intentIdx = entries.findIndex(
        (x) => x.kind === 'order_intent' && (x.data as OrderIntentData).clientOrderId === clientOrderId,
      );
      const placedIdx = entries.indexOf(e);
      expect(intentIdx).toBeGreaterThanOrEqual(0);
      expect(intentIdx).toBeLessThan(placedIdx);
    }
  });
});

describe('BuyRunner resume', () => {
  it('resumes from journal — skips already-filled quantity', async () => {
    const jobId = generateJobId();

    // Pre-seed journal: 200 already filled and reconciled
    const j = new Journal(jobId, tmpDir);
    j.append('buy_loop_started', { ticker: 'KXTEST', size: 500, remaining: 500 });
    j.append('order_intent', {
      clientOrderId: 'cloid-pre-1',
      payload: { ticker: 'KXTEST', action: 'buy', side: 'yes', count: 200, type: 'limit', reduce_only: false, client_order_id: 'cloid-pre-1' },
    });
    j.append('order_placed', {
      orderId: 'ord-pre-1',
      payload: { ticker: 'KXTEST', action: 'buy', side: 'yes', count: 200, type: 'limit', reduce_only: false, client_order_id: 'cloid-pre-1' },
      decisionRequested: 200,
    });
    j.append('order_reconciled', { orderId: 'ord-pre-1', status: 'filled', filled: 200, requested: 200, remainingPosition: 300 });

    // Mock: 300 remaining needs to be filled (2 chunks of 150 or 1+1, etc.)
    const books = Array.from({ length: 5 }, () => askBook);
    const behaviors = [{ fillCount: 150 }, { fillCount: 150 }];
    const mock = new MockKalshiClient({ orderbookSnapshots: books, behaviors });

    const runner = new BuyRunner(
      mock,
      makeConfig({ size: 500, chunkSize: 150 }),
      { keaHome: tmpDir, resumeFromJobId: jobId },
    );
    const result = await runner.run();

    expect(result.filled).toBeGreaterThanOrEqual(300);
    expect(result.remaining).toBe(0);
    expect(result.status).toBe('complete');
  });
});

describe('BuyRunner safety_loaded journal entry', () => {
  it('first non-resume journal entry is safety_loaded', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [askBook],
      behaviors: [{ fillCount: 100 }],
    });
    const jobId = generateJobId();
    const runner = new BuyRunner(mock, makeConfig(), { keaHome: tmpDir, resumeFromJobId: jobId });
    await runner.run();

    const j = new Journal(jobId, tmpDir);
    const entries = j.readAll();
    const safetyEntry = entries.find((e) => e.kind === 'safety_loaded');
    expect(safetyEntry).toBeDefined();
    // safety_loaded must appear before any buy_loop_started
    const safetyIdx = entries.indexOf(safetyEntry!);
    const loopStartIdx = entries.findIndex((e) => e.kind === 'buy_loop_started');
    expect(safetyIdx).toBeLessThan(loopStartIdx);
  });
});

describe('BuyRunner maxOrders limit', () => {
  it('stops after maxOrders iterations', async () => {
    const books = Array.from({ length: 10 }, () => askBook);
    const behaviors = Array.from({ length: 10 }, () => ({ fillCount: 0 }));
    const mock = new MockKalshiClient({ orderbookSnapshots: books, behaviors });

    const jobId = generateJobId();
    const runner = new BuyRunner(
      mock,
      makeConfig({ size: 500, chunkSize: 100, maxOrders: 3 }),
      { keaHome: tmpDir, resumeFromJobId: jobId },
    );
    const result = await runner.run();

    expect(mock.events.filter((e) => e === 'createOrder').length).toBeLessThanOrEqual(3);
    expect(result.status).toBe('partial');
    expect(result.remaining).toBeGreaterThan(0);
  });
});

describe('BuyRunner partial fill', () => {
  it('remaining decremented only by filled amount on partial fill', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [askBook, askBook],
      behaviors: [{ fillCount: 30 }, { fillCount: 70 }],
    });
    const jobId = generateJobId();
    const runner = new BuyRunner(
      mock,
      makeConfig({ size: 100, chunkSize: 100 }),
      { keaHome: tmpDir, resumeFromJobId: jobId },
    );
    const result = await runner.run();

    expect(result.filled).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.status).toBe('complete');
    // Two createOrder calls because first was partial
    expect(mock.events.filter((e) => e === 'createOrder').length).toBe(2);
  });
});

describe('run() convenience export', () => {
  it('runs via top-level run() function', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [askBook],
      behaviors: [{ fillCount: 100 }],
    });
    const result = await run(mock, makeConfig(), { keaHome: tmpDir });
    expect(result.status).toBe('complete');
    expect(result.filled).toBe(100);
  });
});
