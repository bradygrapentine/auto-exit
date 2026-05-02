/**
 * E2E: run the engine against recorded book scenarios → capture the journal →
 * replay it through src/replay.ts → assert decisions reproduce exactly.
 *
 * The "recorded" scenarios are programmatic fixtures shaped after real prod runs,
 * including a thin-top + cliff book modeled after the KCSEA market we exited
 * (KXMLBTOTAL-26MAY012145KCSEA-13: top YES bids in the 40s¢ range, single fill).
 *
 * What this catches:
 *   1. Pricing regression — decideLosingExitOrder produces a different price/size
 *      for the same recorded book.
 *   2. Journal-shape regression — order_placed entries lose orderbook/decision
 *      and become non-replayable.
 *   3. Projection drift — fee math diverges from what the engine recorded.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import { loadJournalReplay, replayAll, replayDecision } from '../src/replay.js';
import type { ExitConfig, Orderbook } from '../src/types.js';

let keaHome: string;

beforeEach(() => {
  keaHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-replay-e2e-'));
});

afterEach(() => {
  fs.rmSync(keaHome, { recursive: true, force: true });
});

function baseConfig(overrides: Partial<ExitConfig> = {}): ExitConfig {
  return {
    baseUrl: 'http://test',
    localServerPort: 0,
    marketTicker: 'KXTEST',
    heldSide: 'yes',
    positionSize: 5,
    chunkSize: 5,
    floorPriceCents: 1,
    orderbookDepth: 20,
    minLevelSize: 1,
    tailSweepThreshold: 0,
    minAdaptiveChunk: 1,
    maxOrders: 5,
    loopDelayMs: 0,
    dryRun: false,
    killSwitchPath: '/dev/null/never',
    apiKeyEnv: 'NOPE',
    privateKeyPathEnv: 'NOPE',
    ...overrides,
  };
}

/** Run the engine against a sequence of orderbooks → return the journal file path. */
async function recordScenario(name: string, books: Orderbook[], cfg: ExitConfig, fillCounts: number[]): Promise<string> {
  const client = new MockKalshiClient({
    orderbookSnapshots: books,
    behaviors: fillCounts.map((c) => ({ fillCount: c })),
  });
  const runner = new ExitRunner(cfg, client, { keaHome });
  await runner.run();
  // Journal file is at <keaHome>/jobs/<jobId>.jsonl
  const dir = path.join(keaHome, 'jobs');
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(runner.jobId));
  expect(files).toHaveLength(1);
  return path.join(dir, files[0]);
}

describe('E2E journal replay — KCSEA-shaped thin-top + cliff', () => {
  it('records orderbook+decision into journal and replay reproduces decision', async () => {
    // Modeled on KXMLBTOTAL KCSEA at exit time: thin top in the 40s, then drop.
    const book: Orderbook = {
      yes: [
        { priceCents: 45, size: 2 },
        { priceCents: 42, size: 3 },
        { priceCents: 40, size: 50 },
        { priceCents: 39, size: 200 },
      ],
      no: [{ priceCents: 50, size: 100 }],
    };
    // Engine's auto-adaptive chunker shrinks to the top-of-book size when it sees
    // thin top + cliff — exactly the KCSEA shape — so the 5-share position drains
    // across multiple small chunks rather than a single sweep. mildAdaptive omitted
    // so the engine's own auto-decide path is exercised end-to-end.
    const cfg = baseConfig({ marketTicker: 'KXMLBTOTAL-KCSEA-FIXTURE', heldSide: 'yes', positionSize: 5, chunkSize: 5 });
    // Mock fills each chunk fully. Provide enough behaviors to cover any chunking choice.
    const jp = await recordScenario('kcsea', Array(5).fill(book), cfg, [5, 5, 5, 5, 5]);
    const replay = loadJournalReplay(jp);

    expect(replay.ticker).toBe('KXMLBTOTAL-KCSEA-FIXTURE');
    expect(replay.side).toBe('yes');
    expect(replay.initialPosition).toBe(5);
    expect(replay.skipped).toBe(0);
    expect(replay.entries.length).toBeGreaterThanOrEqual(1);

    // First entry's orderbook is the recorded snapshot.
    const first = replay.entries[0];
    expect(first.orderbook).toEqual(book);
    expect(first.recordedDecision.chunkSize).toBeGreaterThan(0);

    // Replay every entry — every decision must reproduce exactly.
    const results = replayAll(replay, cfg);
    for (const r of results) {
      expect(r.decisionMatches).toBe(true);
      expect(r.decisionDiff).toEqual([]);
      expect(r.projection.totalGrossDollars).toBeGreaterThan(0);
      expect(r.projection.totalFeesDollars).toBeGreaterThan(0);
      expect(r.projection.netDollars).toBeLessThan(r.projection.totalGrossDollars);
    }

    // Total realized fills equal the initial position.
    const totalFilled = replay.entries.reduce((s, e) => s + (e.realized?.filled ?? 0), 0);
    expect(totalFilled).toBe(5);
  });
});

describe('E2E journal replay — fat-top multi-chunk', () => {
  it('records every chunk with its own orderbook+decision and replay matches each', async () => {
    // Fat top: 100 shares at 30¢ — large position chunked across multiple orders.
    const book: Orderbook = {
      yes: [
        { priceCents: 30, size: 100 },
        { priceCents: 29, size: 200 },
      ],
      no: [{ priceCents: 65, size: 50 }],
    };
    const cfg = baseConfig({
      marketTicker: 'KXFAT',
      heldSide: 'yes',
      positionSize: 60,
      chunkSize: 20,
      maxOrders: 5,
    });
    // Engine reads the orderbook fresh each loop; mock returns same book each call.
    const jp = await recordScenario('fat', [book, book, book, book], cfg, [20, 20, 20]);
    const replay = loadJournalReplay(jp);

    expect(replay.entries.length).toBeGreaterThanOrEqual(3);
    const results = replayAll(replay, cfg);
    for (const r of results) {
      expect(r.decisionMatches).toBe(true);
      expect(r.decisionDiff).toEqual([]);
    }
    // Total realized fills sum to the full position.
    const totalFilled = replay.entries.reduce((s, e) => s + (e.realized?.filled ?? 0), 0);
    expect(totalFilled).toBe(60);
  });
});

describe('replay — error and edge paths', () => {
  it('throws on a journal with no loop_started', () => {
    const fp = path.join(keaHome, 'orphan.jsonl');
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, JSON.stringify({ ts: 't', kind: 'order_placed', data: {} }) + '\n');
    expect(() => loadJournalReplay(fp)).toThrow(/no loop_started/);
  });

  it('counts pre-patch entries as skipped (no orderbook field)', () => {
    const fp = path.join(keaHome, 'old.jsonl');
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, [
      JSON.stringify({ ts: 't0', kind: 'loop_started', data: { ticker: 'X', side: 'yes', remaining: 5 } }),
      // legacy order_placed: no orderbook, no decision
      JSON.stringify({ ts: 't1', kind: 'order_placed', data: { orderId: 'o1', payload: {}, decisionRequested: 5 } }),
      JSON.stringify({ ts: 't2', kind: 'order_reconciled', data: { orderId: 'o1', filled: 5, status: 'filled', requested: 5, remainingPosition: 0 } }),
      JSON.stringify({ ts: 't3', kind: 'loop_finished', data: {} }),
      // malformed line — should be silently dropped by JSON parse guard.
      'not json',
    ].join('\n') + '\n');

    const replay = loadJournalReplay(fp);
    expect(replay.skipped).toBe(1);
    expect(replay.entries).toHaveLength(0);
  });

  it('surfaces a decision diff when engine config disagrees with the recording', async () => {
    const book: Orderbook = {
      yes: [{ priceCents: 50, size: 10 }, { priceCents: 49, size: 50 }],
      no: [{ priceCents: 50, size: 10 }],
    };
    const recordCfg = baseConfig({ marketTicker: 'KXDIFF', positionSize: 5, chunkSize: 5, floorPriceCents: 1 });
    const jp = await recordScenario('diff', [book], recordCfg, [5]);
    const replay = loadJournalReplay(jp);

    // Replay with an aggressive floor that overrides the engine's decision —
    // engine now must price at >= 60¢, which the book can't satisfy → reason changes.
    const tighterCfg = { ...recordCfg, floorPriceCents: 60 };
    const [result] = replay.entries.map((e) => replayDecision(e, tighterCfg));
    expect(result.decisionMatches).toBe(false);
    expect(result.decisionDiff.length).toBeGreaterThan(0);
  });

  it('handles NO-side recordings (covers no-side projection branch)', async () => {
    const book: Orderbook = {
      yes: [{ priceCents: 60, size: 50 }],
      no: [{ priceCents: 35, size: 100 }, { priceCents: 30, size: 200 }],
    };
    const cfg = baseConfig({ marketTicker: 'KXNO', heldSide: 'no', positionSize: 5, chunkSize: 5 });
    const jp = await recordScenario('no', [book], cfg, [5]);
    const replay = loadJournalReplay(jp);
    expect(replay.side).toBe('no');
    const results = replayAll(replay, cfg);
    expect(results[0].decisionMatches).toBe(true);
    expect(results[0].projection.totalSharesFilled).toBeGreaterThan(0);
  });

  it('skips order_reconciled entries that are missing orderId', () => {
    const fp = path.join(keaHome, 'noid.jsonl');
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const ob: Orderbook = { yes: [{ priceCents: 30, size: 100 }], no: [] };
    const dec = { chunkSize: 5, priceCents: 30, priceCentsExact: 30, priceDollars: '0.3000', cumulativeSizeAtPrice: 100, reason: 'top_bid' };
    fs.writeFileSync(fp, [
      JSON.stringify({ ts: 't0', kind: 'loop_started', data: { ticker: 'X', side: 'yes', remaining: 5 } }),
      // reconcile without orderId — should be silently ignored
      JSON.stringify({ ts: 't1', kind: 'order_reconciled', data: { filled: 0, status: 'canceled' } }),
      JSON.stringify({ ts: 't2', kind: 'order_placed', data: { orderId: 'o1', payload: {}, decisionRequested: 5, orderbook: ob, decision: dec } }),
    ].join('\n') + '\n');
    const replay = loadJournalReplay(fp);
    expect(replay.entries[0].realized).toBeUndefined();
  });

  it('replayDecision diff lists chunkSize / reason when they differ', () => {
    // Hand-built entry with a recordedDecision that intentionally disagrees with
    // what the engine will produce — exercises each diff branch.
    const book: Orderbook = { yes: [{ priceCents: 30, size: 100 }], no: [] };
    const entry = {
      ts: 't', orderId: 'o', ticker: 'X', side: 'yes' as const, remaining: 5,
      orderbook: book,
      recordedDecision: { chunkSize: 999, priceCents: 99, priceCentsExact: 99, priceDollars: '0.9900', cumulativeSizeAtPrice: 0, reason: 'made_up_reason' },
    };
    const cfg = baseConfig({ marketTicker: 'X', heldSide: 'yes', positionSize: 5, chunkSize: 5 });
    const result = replayDecision(entry, cfg);
    expect(result.decisionMatches).toBe(false);
    expect(result.decisionDiff.some((d) => d.startsWith('chunkSize'))).toBe(true);
    expect(result.decisionDiff.some((d) => d.startsWith('priceCents'))).toBe(true);
    expect(result.decisionDiff.some((d) => d.startsWith('priceDollars'))).toBe(true);
    expect(result.decisionDiff.some((d) => d.startsWith('reason'))).toBe(true);
  });

  it('falls back to decision.chunkSize for remaining when reconcile is missing', () => {
    // Build a journal with order_placed but no order_reconciled — the entry
    // should still be replayable, and the running-remaining math should advance
    // by the recorded decisionRequested.
    const fp = path.join(keaHome, 'partial.jsonl');
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const ob: Orderbook = { yes: [{ priceCents: 30, size: 100 }], no: [] };
    const dec = { chunkSize: 5, priceCents: 30, priceCentsExact: 30, priceDollars: '0.3000', cumulativeSizeAtPrice: 100, reason: 'top_bid' };
    fs.writeFileSync(fp, [
      JSON.stringify({ ts: 't0', kind: 'loop_started', data: { ticker: 'X', side: 'yes', remaining: 10 } }),
      JSON.stringify({ ts: 't1', kind: 'order_placed', data: { orderId: 'o1', payload: {}, decisionRequested: 5, orderbook: ob, decision: dec } }),
      // No reconcile for o1.
      JSON.stringify({ ts: 't2', kind: 'order_placed', data: { orderId: 'o2', payload: {}, decisionRequested: 5, orderbook: ob, decision: dec } }),
    ].join('\n') + '\n');

    const replay = loadJournalReplay(fp);
    expect(replay.entries).toHaveLength(2);
    // First entry: remaining=10. Second: 10 − 5 (assumed-filled chunkSize) = 5.
    expect(replay.entries[0].remaining).toBe(10);
    expect(replay.entries[1].remaining).toBe(5);
    expect(replay.entries[0].realized).toBeUndefined();
  });
});
