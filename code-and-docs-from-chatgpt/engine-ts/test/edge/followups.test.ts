/**
 * followups.test.ts — SH-EDGE-LOOP-STRATEGY-FIELD + SH-EDGE-FILTER-MOCK-JOURNALS
 *
 *  1. exit-runner / buy-runner journals carry strategy field → joinFires
 *     buckets by name, no 'unknown' rows when both runners are involved.
 *  2. findDryRunJobIds picks out dryRun jobs from a mixed entry stream.
 *  3. generateSnapshot default-skips KXTEST tickers and dryRun jobs.
 *  4. generateSnapshot with includeMock:true keeps them.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { joinFires } from '../../src/edge/lifecycle.js';
import { generateSnapshot, findDryRunJobIds } from '../../src/edge/pipeline.js';
import type { JournalEntry } from '../../src/types.js';

function makeEntry(kind: string, data: Record<string, unknown>, ts = '2026-05-09T10:00:00Z'): JournalEntry {
  return { ts, kind: kind as JournalEntry['kind'], data };
}

function jobJournal(jobId: string, ticker: string, strategy: string, dryRun = false): JournalEntry[] {
  return [
    makeEntry('loop_started', { jobId, ticker, side: 'yes', strategy, dryRun }),
    makeEntry('order_intent', { jobId, payload: { ticker, side: 'yes', action: 'sell', count: 10 } }),
    makeEntry('order_placed', {
      jobId,
      orderId: 'o-1',
      payload: { ticker, side: 'yes', action: 'sell', count: 10 },
      orderbook: { yes: [{ priceCents: 50, size: 100 }], no: [{ priceCents: 52, size: 100 }] },
    }),
    makeEntry('order_reconciled', { jobId, executedPriceCents: 50, filled: 10, action: 'sell' }),
  ];
}

describe('SH-EDGE-LOOP-STRATEGY-FIELD', () => {
  it('exit-runner / buy-runner / passive journals all bucket without unknown', () => {
    const entries: JournalEntry[] = [
      ...jobJournal('job-exit', 'KXNFL-A', 'exit-runner'),
      ...jobJournal('job-buy', 'KXMLB-B', 'buy-runner'),
      ...jobJournal('job-passive', 'KXMET-C', 'passive'),
    ];
    const fires = joinFires(entries);
    const strategies = new Set(fires.map((f) => f.strategy));
    expect(strategies.has('unknown')).toBe(false);
    expect(strategies).toEqual(new Set(['exit-runner', 'buy-runner', 'passive']));
  });
});

describe('SH-EDGE-FILTER-MOCK-JOURNALS — findDryRunJobIds', () => {
  it('picks out dryRun jobIds from loop_started + buy_loop_started entries', () => {
    const entries: JournalEntry[] = [
      makeEntry('loop_started', { jobId: 'real-1', ticker: 'KXNFL', side: 'yes', dryRun: false }),
      makeEntry('loop_started', { jobId: 'dry-1', ticker: 'KXNFL', side: 'yes', dryRun: true }),
      makeEntry('buy_loop_started', { jobId: 'dry-2', ticker: 'KXMET', side: 'yes', dryRun: true }),
      makeEntry('buy_loop_started', { jobId: 'real-2', ticker: 'KXMET', side: 'yes', dryRun: false }),
    ];
    const dryJobs = findDryRunJobIds(entries);
    expect(dryJobs).toEqual(new Set(['dry-1', 'dry-2']));
  });
});

let kea: string;

beforeEach(() => {
  kea = mkdtempSync(join(tmpdir(), 'edge-followups-'));
  process.env['KEA_HOME'] = kea;
  mkdirSync(join(kea, 'jobs'), { recursive: true });
});

afterEach(() => {
  rmSync(kea, { recursive: true, force: true });
  delete process.env['KEA_HOME'];
});

function writeJournal(jobId: string, entries: JournalEntry[]): void {
  writeFileSync(
    join(kea, 'jobs', `${jobId}.jsonl`),
    entries.map((e) => JSON.stringify(e)).join('\n') + '\n',
  );
}

describe('SH-EDGE-FILTER-MOCK-JOURNALS — generateSnapshot', () => {
  it('default-skips KXTEST tickers and dryRun jobs', async () => {
    writeJournal('job-real', jobJournal('job-real', 'KXNFL-REAL', 'exit-runner'));
    writeJournal('job-test', jobJournal('job-test', 'KXTEST', 'exit-runner'));
    writeJournal('job-dry', jobJournal('job-dry', 'KXNFL-DRY', 'exit-runner', true));

    const snap = await generateSnapshot({
      since: new Date('2026-05-09T00:00:00Z'),
      until: new Date('2026-05-09T23:59:59Z'),
    });

    // Only job-real survives the filter
    const tickers = snap.perMarket.flatMap(() => []); // (perMarket aggregates by category, not ticker)
    expect(snap.totalFires).toBe(1);
    void tickers;
  });

  it('includeMock:true keeps KXTEST and dryRun fires', async () => {
    writeJournal('job-real', jobJournal('job-real', 'KXNFL-REAL', 'exit-runner'));
    writeJournal('job-test', jobJournal('job-test', 'KXTEST', 'exit-runner'));
    writeJournal('job-dry', jobJournal('job-dry', 'KXNFL-DRY', 'exit-runner', true));

    const snap = await generateSnapshot({
      since: new Date('2026-05-09T00:00:00Z'),
      until: new Date('2026-05-09T23:59:59Z'),
      includeMock: true,
    });
    expect(snap.totalFires).toBe(3);
  });
});
