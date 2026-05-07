/**
 * lifecycle.test.ts — joinFires correctly partitions journal entries into fires.
 */

import { describe, it, expect } from 'vitest';
import { joinFires } from '../../src/edge/lifecycle.js';
import type { JournalEntry } from '../../src/types.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEntry(
  kind: JournalEntry['kind'],
  data: Record<string, unknown>,
  ts = '2026-01-01T00:00:00Z',
): JournalEntry {
  return { ts, kind, data };
}

function miniJournal(jobId: string, ticker = 'KXNFL-WC'): JournalEntry[] {
  return [
    makeEntry('loop_started', { jobId, ticker, strategy: 'S1-passive', side: 'yes' }),
    makeEntry('order_intent', {
      jobId,
      arrivalMidCents: 60,
      payload: { ticker, side: 'yes', action: 'buy', count: 10 },
    }),
    makeEntry('order_placed', {
      jobId,
      orderId: 'ord-1',
      payload: { ticker, side: 'yes', action: 'buy', count: 10 },
      orderbook: {
        yes: [{ priceCents: 59, size: 100 }],
        no:  [{ priceCents: 61, size: 100 }],
      },
    }),
    makeEntry('order_reconciled', {
      jobId,
      executedPriceCents: 58,
      filledCount: 10,
      action: 'buy',
    }),
    // Exit chunk
    makeEntry('order_reconciled', {
      jobId,
      executedPriceCents: 65,
      filledCount: 10,
      action: 'sell',
    }),
  ];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('joinFires — basic lifecycle', () => {
  it('produces one Fire for a single jobId', () => {
    const fires = joinFires(miniJournal('job-1'));
    expect(fires).toHaveLength(1);
    const f = fires[0]!;
    expect(f.jobId).toBe('job-1');
    expect(f.ticker).toBe('KXNFL-WC');
    expect(f.strategy).toBe('S1-passive');
    expect(f.side).toBe('yes');
  });

  it('captures entry fills correctly', () => {
    const fires = joinFires(miniJournal('job-2'));
    const f = fires[0]!;
    expect(f.entryFills).toHaveLength(1);
    expect(f.entryFills[0]!.priceCents).toBe(58);
    expect(f.entryFills[0]!.size).toBe(10);
  });

  it('captures exit fills correctly', () => {
    const fires = joinFires(miniJournal('job-3'));
    const f = fires[0]!;
    expect(f.exitFills).toHaveLength(1);
    expect(f.exitFills[0]!.priceCents).toBe(65);
    expect(f.exitFills[0]!.size).toBe(10);
  });

  it('derives marketCategory from ticker prefix', () => {
    const fires = joinFires(miniJournal('job-4', 'KXPRES-2024'));
    expect(fires[0]!.marketCategory).toBe('political');
  });

  it('captures arrivalMidCents from order_intent', () => {
    const fires = joinFires(miniJournal('job-5'));
    expect(fires[0]!.arrivalMidCents).toBe(60);
  });

  it('captures decisionMidCents from first order_placed orderbook', () => {
    const fires = joinFires(miniJournal('job-6'));
    // (59 + 61) / 2 = 60
    expect(fires[0]!.decisionMidCents).toBe(60);
  });

  it('produces separate fires for separate jobIds', () => {
    const entries = [...miniJournal('job-A'), ...miniJournal('job-B')];
    const fires = joinFires(entries);
    expect(fires).toHaveLength(2);
    const ids = fires.map((f) => f.jobId).sort();
    expect(ids).toEqual(['job-A', 'job-B']);
  });

  it('augments triggerArmedAt from synthetic_fired', () => {
    const entries: JournalEntry[] = [
      ...miniJournal('job-trig'),
      makeEntry('synthetic_fired', {
        jobId: 'job-trig',
        kind: 'trailing_stop',
        peakBidCents: 70,
      }, '2026-01-01T00:01:00Z'),
    ];
    const fires = joinFires(entries);
    const f = fires[0]!;
    expect(f.triggerArmedAt).toBe('2026-01-01T00:01:00Z');
    expect(f.triggerKind).toBe('trailing_stop');
    expect(f.peakBidCents).toBe(70);
  });

  it('skips fires with no fills', () => {
    const entries: JournalEntry[] = [
      makeEntry('loop_started', { jobId: 'empty-job', ticker: 'KXNFL-X', strategy: 'S1', side: 'yes' }),
    ];
    const fires = joinFires(entries);
    expect(fires).toHaveLength(0);
  });

  it('backward-compat: synthetic_fired without peakBidCents still produces valid Fire', () => {
    // Older journal entries omit peakBidCents — must not blow up
    const entries: JournalEntry[] = [
      ...miniJournal('job-compat'),
      makeEntry('synthetic_fired', {
        jobId: 'job-compat',
        kind: 'stop_loss',
        // no peakBidCents field
      }, '2026-01-01T00:02:00Z'),
    ];
    const fires = joinFires(entries);
    const f = fires[0]!;
    expect(f.triggerKind).toBe('stop_loss');
    expect(f.peakBidCents).toBeUndefined();
    expect(f.triggerArmedAt).toBe('2026-01-01T00:02:00Z');
  });

  it('lifecycle reads peakBidCents from step_trail synthetic_fired entry', () => {
    const entries: JournalEntry[] = [
      ...miniJournal('job-step'),
      makeEntry('synthetic_fired', {
        jobId: 'job-step',
        kind: 'step_trail',
        peakBidCents: 85,
      }, '2026-01-01T00:03:00Z'),
    ];
    const fires = joinFires(entries);
    const f = fires[0]!;
    expect(f.triggerKind).toBe('step_trail');
    expect(f.peakBidCents).toBe(85);
  });
});
