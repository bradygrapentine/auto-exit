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

const askBook: Orderbook = {
  yes: [{ priceCents: 10, size: 10000 }],
  no: [{ priceCents: 10, size: 10000 }],
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

describe('BuyRunner C1 — no double buy_loop_started on resume', () => {
  it('writes buy_loop_started exactly once across crash + resume', async () => {
    const jobId = generateJobId();

    // Step 1: simulate a partial first run by pre-seeding a journal with
    //         buy_loop_started + 200 filled/reconciled — as if crash happened mid-run.
    const j = new Journal(jobId, tmpDir);
    j.append('safety_loaded', { forbiddenCount: 0 });
    j.append('buy_loop_started', { ticker: 'KXTEST', size: 500, remaining: 500 });
    j.append('order_intent', {
      clientOrderId: 'cloid-c1-1',
      payload: { ticker: 'KXTEST', action: 'buy', side: 'yes', count: 200, type: 'limit', reduce_only: false, client_order_id: 'cloid-c1-1' },
    });
    j.append('order_placed', {
      orderId: 'ord-c1-1',
      payload: { ticker: 'KXTEST', action: 'buy', side: 'yes', count: 200, type: 'limit', reduce_only: false, client_order_id: 'cloid-c1-1' },
      decisionRequested: 200,
    });
    j.append('order_reconciled', { orderId: 'ord-c1-1', status: 'filled', filled: 200, requested: 200, remainingPosition: 300 });

    // Step 2: resume — should fill remaining 300 without writing a second buy_loop_started
    const books = Array.from({ length: 5 }, () => askBook);
    const behaviors = [{ fillCount: 300 }];
    const mock = new MockKalshiClient({ orderbookSnapshots: books, behaviors });

    const runner = new BuyRunner(
      mock,
      makeConfig({ size: 500, chunkSize: 300 }),
      { keaHome: tmpDir, resumeFromJobId: jobId },
    );
    const result = await runner.run();

    expect(result.status).toBe('complete');
    expect(result.filled).toBeGreaterThanOrEqual(300);

    const j2 = new Journal(jobId, tmpDir);
    const entries = j2.readAll();
    const loopStartedCount = entries.filter((e) => e.kind === 'buy_loop_started').length;
    expect(loopStartedCount).toBe(1);
  });
});

describe('BuyRunner C2 — safetySubmittedMultiple cap', () => {
  it('stops after submitting size × multiple contracts', async () => {
    // With safetySubmittedMultiple=1.0, cap = size (100).
    // chunkSize=70: first order submits 70 (submittedTotal=70), fills 60, remaining=40.
    // Second attempt chunk = min(70, 40) = 40. Cap check: 70+40=110 > 100 → break.
    const books = Array.from({ length: 5 }, () => askBook);
    const behaviors = [{ fillCount: 60 }, { fillCount: 40 }];
    const mock = new MockKalshiClient({ orderbookSnapshots: books, behaviors });

    const jobId = generateJobId();
    const runner = new BuyRunner(
      mock,
      makeConfig({ size: 100, chunkSize: 70, safetySubmittedMultiple: 1.0 }),
      { keaHome: tmpDir, resumeFromJobId: jobId },
    );
    const result = await runner.run();

    // Cap was hit — only 1 createOrder call made (70 submitted, 60 filled, 40 remaining)
    expect(mock.events.filter((e) => e === 'createOrder').length).toBe(1);
    expect(result.submittedTotal).toBe(70);
    expect(result.remaining).toBe(40);
    expect(result.status).toBe('partial');
  });
});

describe('BuyRunner I3 — crash-window resume via findOrderByClientOrderId', () => {
  it('resumes via findOrderByClientOrderId when order_intent exists without order_placed', async () => {
    const jobId = generateJobId();
    const clientOrderId = 'cloid-buy-crash-window';

    // 1. Create journal with order_intent for 200 contracts (no matching order_placed)
    const j = new Journal(jobId, tmpDir);
    j.append('safety_loaded', { forbiddenCount: 0 });
    j.append('buy_loop_started', { ticker: 'KXTEST', size: 500, remaining: 500 });
    j.append('order_intent', {
      clientOrderId,
      payload: {
        ticker: 'KXTEST',
        action: 'buy',
        side: 'yes',
        count: 200,
        type: 'limit',
        reduce_only: false,
        client_order_id: clientOrderId,
      },
    });

    // 2. Configure MockKalshiClient.findOrderByClientOrderId to return a filled order
    const books = Array.from({ length: 5 }, () => askBook);
    const behaviors = [{ fillCount: 300 }];
    const mock = new MockKalshiClient({ orderbookSnapshots: books, behaviors });
    mock['orders'].push({
      orderId: 'ord-buy-exchange-456',
      payload: {
        ticker: 'KXTEST',
        action: 'buy',
        side: 'yes',
        count: 200,
        type: 'limit',
        reduce_only: false,
        client_order_id: clientOrderId,
      },
      filled: 200,
      requested: 200,
      status: 'filled',
    } as any);

    // 3. Run BuyRunner with size=500 — expect it starts with remaining=300 (500-200)
    const runner = new BuyRunner(
      mock,
      makeConfig({ size: 500, chunkSize: 300 }),
      { keaHome: tmpDir, resumeFromJobId: jobId },
    );
    const result = await runner.run();

    expect(result.status).toBe('complete');
    expect(result.remaining).toBe(0);
    expect(mock.events).toContain('findOrderByClientOrderId');

    // 4. Verify synthetic order_placed entry written for the recovered order
    const j2 = new Journal(jobId, tmpDir);
    const entries = j2.readAll();
    const syntheticPlaced = entries.find(
      (e) => e.kind === 'order_placed' && (e.data as any).orderId === 'ord-buy-exchange-456',
    );
    expect(syntheticPlaced).toBeDefined();
  });
});
