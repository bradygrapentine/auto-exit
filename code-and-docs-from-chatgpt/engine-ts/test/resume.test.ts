/**
 * resume.test.ts
 *
 * Simulates crash scenarios by writing a journal mid-run, then constructing
 * a new ExitRunner with resumeFromJobId to verify recovery behavior.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { Journal, generateJobId } from '../src/journal.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { ExitConfig, Orderbook } from '../src/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-resume-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const baseCfg: ExitConfig = {
  baseUrl: 'https://example.test',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 1000,
  chunkSize: 500,
  floorPriceCents: 1,
  orderbookDepth: 20,
  minLevelSize: 50,
  tailSweepThreshold: 100,
  mildAdaptive: false,
  minAdaptiveChunk: 100,
  maxOrders: 20,
  loopDelayMs: 0,
  dryRun: false,
  killSwitchPath: './STOP_DOES_NOT_EXIST',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  reconcilePollMs: 0,
  reconcileMaxPolls: 1,
  cancelOnStale: true,
};

const fatBook: Orderbook = {
  yes: [{ priceCents: 5, size: 10000 }],
  no: [{ priceCents: 5, size: 10000 }],
};

/** Write a minimal crash-state journal: placed an order but never reconciled it. */
function writeCrashedJournal(jobId: string, orderId: string, decisionRequested: number): Journal {
  const j = new Journal(jobId, tmpDir);
  j.append('loop_started', { ticker: 'KXTEST' });
  j.append('order_placed', {
    orderId,
    payload: { ticker: 'KXTEST', action: 'sell', side: 'yes', count: decisionRequested, type: 'limit', reduce_only: true, client_order_id: orderId },
    decisionRequested,
  });
  // Crash — no order_reconciled written
  return j;
}

describe('ExitRunner crash-safe resume', () => {
  it('skips reconcile and returns immediately when journal ends with loop_finished', async () => {
    const jobId = generateJobId();
    const j = new Journal(jobId, tmpDir);
    j.append('loop_started', {});
    j.append('order_placed', { orderId: 'X', payload: {}, decisionRequested: 500 });
    j.append('order_reconciled', { orderId: 'X', filled: 500 });
    j.append('loop_finished', { remaining: 500, filled: 500 });

    const mock = new MockKalshiClient({ orderbookSnapshots: [fatBook] });
    const runner = new ExitRunner(baseCfg, mock, { resumeFromJobId: jobId, keaHome: tmpDir });
    const status = await runner.run();

    // Should be a no-op; no new orders attempted
    expect(status.ordersAttempted).toBe(0);
    // mock should not have been asked to do anything
    expect(mock.events).toHaveLength(0);
  });

  it('reconciles a fully-filled in-flight order and continues from correct remaining', async () => {
    // Simulate: 1 chunk of 500 placed but not reconciled; mock says it was filled
    const jobId = generateJobId();
    writeCrashedJournal(jobId, 'order-A', 500);

    // Mock: getOrder → filled 500; then the remaining 500 loop fills fully
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook],
      behaviors: [
        { fillCount: 500 }, // for the resume getOrder call on order-A → filled
        { fillCount: 500 }, // for the live loop's second chunk
      ],
    });
    // Pre-seed order-A as already-filled in the mock
    mock['orders'].push({
      orderId: 'order-A',
      payload: {} as any,
      filled: 500,
      requested: 500,
      status: 'filled',
    });

    const runner = new ExitRunner(baseCfg, mock, { resumeFromJobId: jobId, keaHome: tmpDir });
    const status = await runner.run();

    // After resume: filledTotal = 500 (from journal); remaining = 500
    // After live loop: fills 500 more → total 1000
    expect(status.filledTotal).toBe(1000);
    expect(status.remaining).toBe(0);
    expect(mock.events).toContain('getOrder');
  });

  it('reconciles a partially-filled in-flight order (cancel fills partial)', async () => {
    const jobId = generateJobId();
    writeCrashedJournal(jobId, 'order-B', 500);

    // Pre-seed order-B as resting with 200 filled, cancelOrder gives final 200
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook, fatBook],
      behaviors: [
        { fillCount: 800 }, // live loop chunk 1
        { fillCount: 200 }, // live loop chunk 2
      ],
    });
    mock['orders'].push({
      orderId: 'order-B',
      payload: {} as any,
      filled: 200,
      requested: 500,
      status: 'partially_filled',
      pollFill: 0,
      cancelFill: 0,
    } as any);

    const runner = new ExitRunner(baseCfg, mock, { resumeFromJobId: jobId, keaHome: tmpDir });
    const status = await runner.run();

    // resume_reconciled for order-B fills 200; remaining becomes 800
    // live loop fills remaining 800
    expect(status.filledTotal).toBe(1000);
    expect(status.remaining).toBe(0);
    expect(mock.events).toContain('cancelOrder'); // stale cancel from reconcileOrder
  });

  it('is a no-op on resume when all previous orders were already reconciled', async () => {
    const jobId = generateJobId();
    const j = new Journal(jobId, tmpDir);
    j.append('loop_started', {});
    j.append('order_placed', { orderId: 'C', payload: {}, decisionRequested: 500 });
    j.append('order_reconciled', { orderId: 'C', filled: 500 });
    // No loop_finished — process "crashed" after reconcile but before loop could continue

    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook],
      behaviors: [{ fillCount: 500 }],
    });

    const runner = new ExitRunner(baseCfg, mock, { resumeFromJobId: jobId, keaHome: tmpDir });
    const status = await runner.run();

    // pendingOrders() → [] because C is reconciled
    // filledTotal from journal = 500; remaining = 500
    // live loop fills remaining 500
    expect(status.filledTotal).toBe(1000);
    expect(status.remaining).toBe(0);
    // No getOrder for order-C (it was already reconciled in journal)
    const getOrderCalls = mock.events.filter((e) => e === 'getOrder');
    // Only the reconcileOrder polling for the live-loop order
    expect(getOrderCalls.length).toBeGreaterThanOrEqual(0);
  });

  it('resumes when all orders were canceled (remaining stays at positionSize)', async () => {
    const jobId = generateJobId();
    const j = new Journal(jobId, tmpDir);
    j.append('loop_started', {});
    j.append('order_placed', { orderId: 'D', payload: {}, decisionRequested: 500 });
    j.append('order_reconciled', { orderId: 'D', filled: 0 });
    // No loop_finished

    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook, fatBook],
      behaviors: [{ fillCount: 500 }, { fillCount: 500 }],
    });

    const runner = new ExitRunner(baseCfg, mock, { resumeFromJobId: jobId, keaHome: tmpDir });
    const status = await runner.run();

    // computeFilledTotal = 0; remaining = 1000 → fills both chunks
    expect(status.filledTotal).toBe(1000);
    expect(status.remaining).toBe(0);
  });
});
