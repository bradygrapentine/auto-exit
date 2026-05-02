/**
 * orderIntent.test.ts
 *
 * Tests for W1.4 crash-safe resume via pre-call order_intent journal entry.
 *
 * Bug: order_placed was written AFTER createOrder returned. If the process was
 * killed in the window between createOrder returning and order_placed being
 * appended, the order existed on Kalshi with no journal trace. On resume,
 * pendingOrders() would not see it, the engine would not reconcile, `remaining`
 * would never be decremented, and an orphaned live order would persist.
 *
 * Fix: write order_intent BEFORE calling createOrder. On resume, pendingIntents()
 * finds intent-but-no-placed entries and calls findOrderByClientOrderId to
 * discover whether the order actually landed. If found, a synthetic order_placed
 * is appended and normal reconciliation proceeds.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { Journal, generateJobId } from '../src/journal.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { ExitConfig, OrderIntentData, OrderPayload, Orderbook } from '../src/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-intent-test-'));
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

// ── Helper: build a minimal OrderPayload for journal seeding ────────────────
function makePayload(clientOrderId: string, count = 500): OrderPayload {
  return {
    ticker: 'KXTEST',
    action: 'sell',
    side: 'yes',
    count,
    type: 'limit',
    yes_price: 5,
    reduce_only: true,
    time_in_force: 'immediate_or_cancel',
    client_order_id: clientOrderId,
  };
}

// ── Helper: write a crash-state journal with only order_intent (no order_placed) ─
function writeCrashJournalIntentOnly(
  jobId: string,
  clientOrderId: string,
  count = 500,
): Journal {
  const j = new Journal(jobId, tmpDir);
  j.append('loop_started', { ticker: 'KXTEST', side: 'yes', remaining: 1000 });
  j.append('order_intent', {
    clientOrderId,
    payload: makePayload(clientOrderId, count),
  } satisfies OrderIntentData);
  return j;
}

// ──────────────────────────────────────────────────────────────────────────────
// Group 1: Normal flow — order_intent precedes order_placed
// ──────────────────────────────────────────────────────────────────────────────

describe('normal flow: order_intent written before order_placed', () => {
  it('writes order_intent before order_placed for each order', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook],
      behaviors: [{ fillCount: 500 }, { fillCount: 500 }],
    });
    const jobId = generateJobId();
    const runner = new ExitRunner(baseCfg, mock, { keaHome: tmpDir, resumeFromJobId: jobId });
    await runner.run();

    const j = new Journal(jobId, tmpDir);
    const entries = j.readAll();

    // Verify every order_placed is preceded by an order_intent for the same clientOrderId
    for (const e of entries) {
      if (e.kind !== 'order_placed') continue;
      const placed = e.data as { payload?: { client_order_id?: string } };
      const clientOrderId = placed.payload?.client_order_id;
      expect(clientOrderId).toBeTruthy();

      // Find the matching intent — must appear BEFORE order_placed in the log
      const intentIdx = entries.findIndex(
        (x) => x.kind === 'order_intent' && (x.data as OrderIntentData).clientOrderId === clientOrderId,
      );
      const placedIdx = entries.indexOf(e);
      expect(intentIdx).toBeGreaterThanOrEqual(0);
      expect(intentIdx).toBeLessThan(placedIdx);
    }
  });

  it('order_intent count matches order_placed count for a clean run', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook],
      behaviors: [{ fillCount: 500 }, { fillCount: 500 }],
    });
    const jobId = generateJobId();
    const runner = new ExitRunner(baseCfg, mock, { keaHome: tmpDir, resumeFromJobId: jobId });
    await runner.run();

    const j = new Journal(jobId, tmpDir);
    const entries = j.readAll();
    const intentCount = entries.filter((e) => e.kind === 'order_intent').length;
    const placedCount = entries.filter((e) => e.kind === 'order_placed').length;
    expect(intentCount).toBe(placedCount);
    expect(intentCount).toBe(2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Group 2: Journal helper — pendingIntents() correctness
// ──────────────────────────────────────────────────────────────────────────────

describe('Journal.pendingIntents()', () => {
  it('returns intent when order_placed is absent', () => {
    const jobId = generateJobId();
    const clientOrderId = 'cloid-crash-abc';
    const j = writeCrashJournalIntentOnly(jobId, clientOrderId);

    const pending = j.pendingIntents();
    expect(pending).toHaveLength(1);
    expect(pending[0]!.clientOrderId).toBe(clientOrderId);
  });

  it('returns empty when order_placed is present for same clientOrderId', () => {
    const jobId = generateJobId();
    const clientOrderId = 'cloid-normal-xyz';
    const j = new Journal(jobId, tmpDir);
    j.append('loop_started', { ticker: 'KXTEST', side: 'yes', remaining: 1000 });
    j.append('order_intent', { clientOrderId, payload: makePayload(clientOrderId) });
    j.append('order_placed', {
      orderId: 'ord-1',
      payload: makePayload(clientOrderId),
      decisionRequested: 500,
    });

    const pending = j.pendingIntents();
    expect(pending).toHaveLength(0);
  });

  it('dedupes duplicate order_intent entries — only latest survives', () => {
    const jobId = generateJobId();
    const clientOrderId = 'cloid-dup';
    const j = new Journal(jobId, tmpDir);
    j.append('order_intent', { clientOrderId, payload: makePayload(clientOrderId, 200) });
    j.append('order_intent', { clientOrderId, payload: makePayload(clientOrderId, 300) });
    // No matching order_placed

    const pending = j.pendingIntents();
    expect(pending).toHaveLength(1);
    expect(pending[0]!.payload.count).toBe(300); // last-wins
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Group 3: Resume — reconcileByClientOrderId path
// ──────────────────────────────────────────────────────────────────────────────

describe('resume: reconcile by clientOrderId when only order_intent exists', () => {
  it('discovers the order and decrements remaining when found on exchange', async () => {
    const jobId = generateJobId();
    const clientOrderId = 'cloid-survived-crash';
    writeCrashJournalIntentOnly(jobId, clientOrderId, 500);

    // Mock has the order already placed (simulate it survived on Kalshi)
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook],
      behaviors: [{ fillCount: 500 }, { fillCount: 500 }],
    });
    // Manually register the order in mock so findOrderByClientOrderId returns it
    mock['orders'].push({
      orderId: 'ord-exchange-123',
      payload: makePayload(clientOrderId, 500),
      filled: 500,
      requested: 500,
      status: 'filled',
    } as any);

    const runner = new ExitRunner(baseCfg, mock, {
      keaHome: tmpDir,
      resumeFromJobId: jobId,
    });
    const status = await runner.run();

    // The resumed order filled 500; loop then fills the remaining 500
    expect(status.remaining).toBe(0);
    expect(mock.events).toContain('findOrderByClientOrderId');

    // A synthetic order_placed should have been written for the recovered order
    const j = new Journal(jobId, tmpDir);
    const entries = j.readAll();
    const syntheticPlaced = entries.find(
      (e) => e.kind === 'order_placed' && (e.data as any).orderId === 'ord-exchange-123',
    );
    expect(syntheticPlaced).toBeDefined();
  });

  it('treats order as never-placed and does NOT decrement remaining when not found on exchange', async () => {
    const jobId = generateJobId();
    const clientOrderId = 'cloid-never-landed';
    writeCrashJournalIntentOnly(jobId, clientOrderId, 500);

    // Mock returns null for findOrderByClientOrderId (order never landed)
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook],
      behaviors: [{ fillCount: 500 }, { fillCount: 500 }],
    });
    // No order registered in mock — findOrderByClientOrderId returns null

    const runner = new ExitRunner(baseCfg, mock, {
      keaHome: tmpDir,
      resumeFromJobId: jobId,
    });
    const status = await runner.run();

    // Resume found nothing, so remaining stays at 1000 going into the loop.
    // Loop then places 2 orders of 500 each to clear the position.
    expect(status.remaining).toBe(0);
    expect(mock.events).toContain('findOrderByClientOrderId');
    // Both loop orders must have fired since resume didn't reduce remaining
    expect(mock.events.filter((e) => e === 'createOrder').length).toBe(2);
  });

  it('does not call findOrderByClientOrderId when journal has no pending intents', async () => {
    // Normal crash: only order_placed is orphaned (no order_intent at all)
    const jobId = generateJobId();
    const j = new Journal(jobId, tmpDir);
    j.append('loop_started', { ticker: 'KXTEST', side: 'yes', remaining: 1000 });
    j.append('order_placed', {
      orderId: 'ord-plain',
      payload: makePayload('cloid-plain'),
      decisionRequested: 500,
    });

    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook],
      behaviors: [{ fillCount: 500 }, { fillCount: 500 }],
    });
    mock['orders'].push({
      orderId: 'ord-plain',
      payload: makePayload('cloid-plain'),
      filled: 500,
      requested: 500,
      status: 'filled',
    } as any);

    const runner = new ExitRunner(baseCfg, mock, {
      keaHome: tmpDir,
      resumeFromJobId: jobId,
    });
    await runner.run();

    expect(mock.events).not.toContain('findOrderByClientOrderId');
  });
});
