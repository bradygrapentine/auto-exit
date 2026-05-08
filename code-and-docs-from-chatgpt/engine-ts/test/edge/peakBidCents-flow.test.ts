import { describe, it, expect } from 'vitest';
import { joinFires } from '../../src/edge/lifecycle.js';
import { optimalHindsightBenchmark } from '../../src/edge/benchmarks.js';
import { triggerHistogram } from '../../src/edge/aggregate.js';
import type { JournalEntry } from '../../src/types.js';

// Build a JournalEntry in the shape lifecycle.ts expects
function entry(kind: JournalEntry['kind'], data: Record<string, unknown>, ts = '2026-05-08T00:00:00Z'): JournalEntry {
  return { ts, kind, data };
}

describe('peakBidCents flows end-to-end through edge pipeline', () => {
  // Journal that mirrors a take_profit trigger firing at peakBidCents=72 with
  // realized exit at 65¢.  Uses JournalEntry { ts, kind, data } shape.
  const journal: JournalEntry[] = [
    entry('loop_started',       { jobId: 'j1', ticker: 'KXTEST-A', side: 'yes', strategy: 'test' }, '2026-05-08T00:00:00Z'),
    entry('order_reconciled',   { jobId: 'j1', executedPriceCents: 50, filledCount: 10, action: 'buy' },  '2026-05-08T00:00:02Z'),
    entry('synthetic_fired',    { jobId: 'j1', kind: 'take_profit', peakBidCents: 72 },                  '2026-05-08T00:00:10Z'),
    entry('order_reconciled',   { jobId: 'j1', executedPriceCents: 65, filledCount: 10, action: 'sell' }, '2026-05-08T00:00:12Z'),
  ];

  it('optimalHindsightBenchmark uses peakBidCents over exitFills heuristic', () => {
    const fires = joinFires(journal);
    expect(fires).toHaveLength(1);
    const benchmark = optimalHindsightBenchmark(fires[0]!);
    expect(benchmark).toBe(72);
  });

  it('triggerHistogram bins fire by triggerQuality using peakBidCents-derived benchmark', () => {
    const fires = joinFires(journal);
    const hist = triggerHistogram(fires);
    expect(hist).toHaveLength(1);
    expect(hist[0]!.triggerKind).toBe('take_profit');
    // exit (65¢) < peakBidCents (72¢) by > 1¢ → tooEarly
    expect(hist[0]!.tooEarly).toBe(1);
    expect(hist[0]!.onTime).toBe(0);
    expect(hist[0]!.tooLate).toBe(0);
  });
});
