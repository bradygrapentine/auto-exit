/**
 * sweep.test.ts — SH-MICRO-EXECUTION-LOOP §3.3
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runSweep, summarizeByCell } from '../../src/microHarness/sweep.js';
import type { SweepDeps, SweepPlan } from '../../src/microHarness/sweep.js';
import type { SafetyConfig } from '../../src/types.js';

const SAFETY: SafetyConfig = {
  version: 1,
  safetySubmittedMultiple: 1.1,
  floorPriceCents: 0,
  tailSweepThreshold: 0,
  forbiddenTickers: [],
  microHarness: {
    perTrialCapDollars: 1.00,
    dailyAggregateCapDollars: 2.50,
    tickerAllowlist: ['KXBTC*', 'KXETH*'],
  },
};

function makeDeps(overrides: Partial<SweepDeps> = {}): SweepDeps {
  return {
    executeStrategy: vi.fn().mockResolvedValue({ filled: 1, status: 'complete' }),
    confirm: vi.fn().mockResolvedValue(true),
    dailySpentDollars: vi.fn().mockResolvedValue(0),
    readSafety: () => SAFETY,
    sleep: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const PLAN: SweepPlan = {
  cells: [
    { strategy: 's-passive', ticker: 'KXBTC-26MAY', side: 'yes', params: {}, trialsPerCell: 3 },
    { strategy: 's-aggressive', ticker: 'KXETH-26MAY', side: 'no', params: {}, trialsPerCell: 2 },
  ],
  perTrialDelayMs: 1_000,
  maxNotionalDollars: 0.20,
  intent: 'sweep test',
};

let createdHomes: string[] = [];
function tempKeaHome(): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'micro-sweep-test-'));
  createdHomes.push(dir);
  process.env['KEA_HOME'] = dir;
}
afterEach(() => {
  for (const dir of createdHomes) fs.rmSync(dir, { recursive: true, force: true });
  createdHomes = [];
  delete process.env['KEA_HOME'];
});

describe('runSweep — happy path', () => {
  it('runs trialsPerCell × cells trials in order', async () => {
    tempKeaHome();
    const deps = makeDeps();
    const results = await runSweep(PLAN, deps);
    expect(results).toHaveLength(5); // 3 + 2
    expect(deps.executeStrategy).toHaveBeenCalledTimes(5);
    expect(results.every((r) => r.status === 'complete')).toBe(true);
  });

  it('sleeps between trials (4 gaps for 5 trials)', async () => {
    tempKeaHome();
    const sleep = vi.fn().mockResolvedValue(undefined);
    const deps = makeDeps({ sleep });
    await runSweep(PLAN, deps);
    expect(sleep).toHaveBeenCalledTimes(4);
    expect(sleep).toHaveBeenCalledWith(1_000);
  });
});

describe('runSweep — abort conditions', () => {
  it('aborts on first gate rejection (e.g. ticker not allowlisted)', async () => {
    tempKeaHome();
    const planWithBadTicker: SweepPlan = {
      ...PLAN,
      cells: [
        { strategy: 's-passive', ticker: 'KXBTC-26MAY', side: 'yes', params: {}, trialsPerCell: 1 },
        { strategy: 's-passive', ticker: 'KXMOVVA-26', side: 'yes', params: {}, trialsPerCell: 3 },
      ],
    };
    const deps = makeDeps();
    const results = await runSweep(planWithBadTicker, deps);
    expect(results).toHaveLength(2); // 1 from cell 1 + 1 rejection from cell 2
    expect(results[1]!.status).toBe('rejected');
    expect(results[1]!.rejectReason).toMatch(/ticker_not_allowlisted/);
    // executeStrategy ran for the first trial only.
    expect(deps.executeStrategy).toHaveBeenCalledTimes(1);
  });

  it('aborts when daily-aggregate cap is exceeded mid-sweep', async () => {
    tempKeaHome();
    // Each trial's $1.00 notional + climbing daily-spent eventually trips $2.50.
    let spent = 0;
    const deps = makeDeps({
      dailySpentDollars: vi.fn().mockImplementation(async () => spent),
      executeStrategy: vi.fn().mockImplementation(async () => {
        spent += 1.00;
        return { filled: 1, status: 'complete' as const };
      }),
    });
    const planMaxNotional: SweepPlan = {
      ...PLAN,
      cells: [{ strategy: 's-passive', ticker: 'KXBTC-26MAY', side: 'yes', params: {}, trialsPerCell: 5 }],
      maxNotionalDollars: 1.00,
    };
    const results = await runSweep(planMaxNotional, deps);
    // Trials 1, 2 complete ($1 + $1 = $2 spent). Trial 3: spent=2.00, gate sees
    // 2.00 + 1.00 = 3.00 > 2.50 → rejected → abort.
    expect(results.length).toBeLessThan(5);
    const last = results[results.length - 1]!;
    expect(last.status).toBe('rejected');
    expect(last.rejectReason).toMatch(/daily_aggregate_cap_exceeded/);
  });

  it('does NOT abort on operator decline — sweep continues', async () => {
    tempKeaHome();
    let count = 0;
    const deps = makeDeps({
      // Decline the second trial; confirm the rest.
      confirm: vi.fn().mockImplementation(async () => {
        count++;
        return count !== 2;
      }),
    });
    const planSingleCell: SweepPlan = {
      ...PLAN,
      cells: [{ strategy: 's-passive', ticker: 'KXBTC-26MAY', side: 'yes', params: {}, trialsPerCell: 4 }],
    };
    const results = await runSweep(planSingleCell, deps);
    expect(results).toHaveLength(4);
    expect(results[0]!.status).toBe('complete');
    expect(results[1]!.status).toBe('rejected');
    expect(results[1]!.rejectReason).toMatch(/operator_declined/);
    expect(results[2]!.status).toBe('complete');
    expect(results[3]!.status).toBe('complete');
  });

  it('does NOT abort on strategy failure — sweep continues', async () => {
    tempKeaHome();
    let count = 0;
    const deps = makeDeps({
      executeStrategy: vi.fn().mockImplementation(async () => {
        count++;
        if (count === 1) throw new Error('mock 503');
        return { filled: 1, status: 'complete' as const };
      }),
    });
    const planSingleCell: SweepPlan = {
      ...PLAN,
      cells: [{ strategy: 's-passive', ticker: 'KXBTC-26MAY', side: 'yes', params: {}, trialsPerCell: 3 }],
    };
    const results = await runSweep(planSingleCell, deps);
    expect(results).toHaveLength(3);
    expect(results[0]!.status).toBe('failed');
    expect(results[1]!.status).toBe('complete');
    expect(results[2]!.status).toBe('complete');
  });
});

describe('summarizeByCell', () => {
  it('groups results by (strategy, ticker) and tallies statuses', () => {
    const results = [
      { trialId: 't1', ticker: 'KXBTC', strategy: 's-passive', startedAt: 'x', status: 'complete' as const },
      { trialId: 't2', ticker: 'KXBTC', strategy: 's-passive', startedAt: 'x', status: 'complete' as const },
      { trialId: 't3', ticker: 'KXBTC', strategy: 's-passive', startedAt: 'x', status: 'rejected' as const, rejectReason: 'operator_declined' },
      { trialId: 't4', ticker: 'KXETH', strategy: 's-aggressive', startedAt: 'x', status: 'failed' as const },
    ];
    const summary = summarizeByCell(results);
    expect(summary).toHaveLength(2);
    const passive = summary.find((s) => s.strategy === 's-passive')!;
    expect(passive.trialsRun).toBe(3);
    expect(passive.completed).toBe(2);
    expect(passive.rejected).toBe(1);
    const aggr = summary.find((s) => s.strategy === 's-aggressive')!;
    expect(aggr.failed).toBe(1);
  });
});
