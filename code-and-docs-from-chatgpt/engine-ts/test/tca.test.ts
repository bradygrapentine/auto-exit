/**
 * tca.test.ts — SH-1 Post-trade TCA tests.
 *
 * Verifies that exitRunner and buyRunner write `tca` journal entries with correct
 * arrivalMidCents, limitPriceCents, slippageCents, and side fields.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { BuyRunner } from '../src/buyRunner.js';
import { Journal } from '../src/journal.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { BuyConfig, ExitConfig, Orderbook, TcaEntry } from '../src/types.js';

// ── Safety mock ────────────────────────────────────────────────────────────────
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
    mergeIntoExitConfig: (config: ExitConfig) => config,
  };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-tca-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// YES bids at 70¢, NO bids at 30¢ → YES ask = 100 - 30 = 70¢, arrivalMid = (70+70)/2 = 70¢
const testBook: Orderbook = {
  yes: [{ priceCents: 70, size: 10000 }],
  no: [{ priceCents: 30, size: 10000 }],
};

const baseExitCfg: ExitConfig = {
  baseUrl: 'https://example.test',
  localServerPort: 0,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 400,
  chunkSize: 200,
  floorPriceCents: 1,
  orderbookDepth: 20,
  minLevelSize: 1,
  tailSweepThreshold: 0,
  mildAdaptive: false,
  minAdaptiveChunk: 50,
  maxOrders: 20,
  loopDelayMs: 0,
  dryRun: false,
  killSwitchPath: './STOP_DOES_NOT_EXIST',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  reconcilePollMs: 0,
  reconcileMaxPolls: 3,
  cancelOnStale: true,
};

// ── Exit-side TCA tests ────────────────────────────────────────────────────────

describe('ExitRunner TCA', () => {
  it('writes 2 tca entries for a 2-chunk exit', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [testBook, testBook, testBook],
      behaviors: [{ fillCount: 200 }, { fillCount: 200 }],
    });
    const runner = new ExitRunner(baseExitCfg, mock, { keaHome: tmpDir });
    await runner.run();

    const journal = new Journal(runner.jobId, tmpDir);
    const tca = journal.readAll().filter((e) => e.kind === 'tca');
    expect(tca).toHaveLength(2);
  });

  it('each tca entry has arrivalMidCents, limitPriceCents, slippageCents', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [testBook, testBook, testBook],
      behaviors: [{ fillCount: 200 }, { fillCount: 200 }],
    });
    const runner = new ExitRunner(baseExitCfg, mock, { keaHome: tmpDir });
    await runner.run();

    const journal = new Journal(runner.jobId, tmpDir);
    const tca = journal.readAll().filter((e) => e.kind === 'tca');
    for (const entry of tca) {
      const d = entry.data as Omit<TcaEntry, 'kind' | 'ts'>;
      expect(typeof d.arrivalMidCents).toBe('number');
      expect(typeof d.limitPriceCents).toBe('number');
      expect(typeof d.slippageCents).toBe('number');
      expect(d.slippageCents).toBe(d.limitPriceCents - d.arrivalMidCents);
    }
  });

  it('slippageCents is negative when fill is below arrival mid (good for seller)', async () => {
    // YES bids at 60¢, NO bids at 30¢ → ask = 70¢, mid = (60+70)/2 = 65¢
    // Sell executes at top YES bid = 60¢ → slippage = 60 - 65 = -5¢ (good: sold at bid < mid)
    const lowBook: Orderbook = {
      yes: [{ priceCents: 60, size: 10000 }],
      no: [{ priceCents: 30, size: 10000 }],
    };
    const mock = new MockKalshiClient({
      orderbookSnapshots: [lowBook, lowBook],
      behaviors: [{ fillCount: 400 }],
    });
    const runner = new ExitRunner(baseExitCfg, mock, { keaHome: tmpDir });
    await runner.run();

    const journal = new Journal(runner.jobId, tmpDir);
    const tca = journal.readAll().filter((e) => e.kind === 'tca');
    expect(tca.length).toBeGreaterThanOrEqual(1);
    const d = tca[0]!.data as Omit<TcaEntry, 'kind' | 'ts'>;
    expect(d.slippageCents).toBeLessThan(0);
  });

  it('depthTier is at least 1', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [testBook, testBook],
      behaviors: [{ fillCount: 400 }],
    });
    const runner = new ExitRunner(baseExitCfg, mock, { keaHome: tmpDir });
    await runner.run();

    const journal = new Journal(runner.jobId, tmpDir);
    const tca = journal.readAll().filter((e) => e.kind === 'tca');
    for (const entry of tca) {
      const d = entry.data as Omit<TcaEntry, 'kind' | 'ts'>;
      expect(d.depthTier).toBeGreaterThanOrEqual(1);
    }
  });
});

// ── Buy-side TCA tests ─────────────────────────────────────────────────────────

describe('BuyRunner TCA', () => {
  const baseBuyCfg: BuyConfig = {
    ticker: 'KXTEST',
    side: 'buy',
    size: 200,
    chunkSize: 200,
    maxPriceCents: 99,
    loopDelayMs: 0,
    dryRun: false,
    maxOrders: 20,
    orderbookDepth: 20,
  };

  it('writes tca entry with side=buy and non-zero slippage (both book sides present)', async () => {
    // YES bid at 40¢ (top of yes book), NO bid at 30¢ → YES ask = 100 - 30 = 70¢
    // arrivalMid = (40 + 70) / 2 = 55¢
    // limitPrice = topAsk = 70¢ (the ask we pay as buyer)
    // slippage = 70 - 55 = +15¢ (aggressive — paying above mid)
    const buyBook: Orderbook = {
      yes: [{ priceCents: 40, size: 10000 }],
      no: [{ priceCents: 30, size: 10000 }],
    };
    const mock = new MockKalshiClient({
      orderbookSnapshots: [buyBook, buyBook],
      behaviors: [{ fillCount: 200 }],
    });
    const runner = new BuyRunner(mock, baseBuyCfg, { keaHome: tmpDir });
    await runner.run();

    const journal = new Journal(runner.jobId, tmpDir);
    const tca = journal.readAll().filter((e) => e.kind === 'tca');
    expect(tca.length).toBeGreaterThanOrEqual(1);
    const d = tca[0]!.data as Omit<TcaEntry, 'kind' | 'ts'>;
    expect(d.side).toBe('buy');
    expect(typeof d.arrivalMidCents).toBe('number');
    expect(typeof d.limitPriceCents).toBe('number');
    expect(typeof d.slippageCents).toBe('number');
    // With asymmetric book (bid=40, ask=70), mid=55 and slippage should not be 0
    expect(d.slippageCents).not.toBe(0);
    // Exact values: limitPrice=70, arrivalMid=55, slippage=+15
    expect(d.limitPriceCents).toBe(70);
    expect(d.arrivalMidCents).toBe(55);
    expect(d.slippageCents).toBe(15);
  });

  it('dry-run exit: zero TCA entries', async () => {
    const dryRunCfg: ExitConfig = { ...baseExitCfg, dryRun: true };
    const mock = new MockKalshiClient({
      orderbookSnapshots: [testBook, testBook, testBook],
      behaviors: [],
    });
    const runner = new ExitRunner(dryRunCfg, mock, { keaHome: tmpDir });
    await runner.run();

    const journal = new Journal(runner.jobId, tmpDir);
    const entries = journal.readAll();
    const tca = entries.filter((e) => e.kind === 'tca');
    expect(tca).toHaveLength(0);

    // The loop_started entry should carry dryRun: true
    const loopStart = entries.find((e) => e.kind === 'loop_started');
    expect(loopStart).toBeDefined();
    const data = loopStart!.data as Record<string, unknown>;
    expect(data.dryRun).toBe(true);
  });
});
