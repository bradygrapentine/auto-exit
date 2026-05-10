/**
 * runner.test.ts — SH-MICRO-EXECUTION-LOOP §3.2
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runTrial, sumDailySpent } from '../../src/microHarness/runner.js';
import type { TrialDeps } from '../../src/microHarness/runner.js';
import type { MicroTrialConfig } from '../../src/microHarness/trial.js';
import type { SafetyConfig } from '../../src/types.js';
import { Journal } from '../../src/journal.js';

function trial(overrides: Partial<MicroTrialConfig> = {}): MicroTrialConfig {
  return {
    trialId: `test-trial-${Math.random().toString(36).slice(2, 8)}`,
    ticker: 'KXBTC-26MAY09',
    side: 'yes',
    strategy: 's-passive',
    maxNotionalDollars: 0.50,
    params: { walkStepCents: 1 },
    intent: 'unit test',
    ...overrides,
  };
}

const SAFETY: SafetyConfig = {
  version: 1,
  safetySubmittedMultiple: 1.1,
  floorPriceCents: 0,
  tailSweepThreshold: 0,
  forbiddenTickers: [],
  microHarness: {
    perTrialCapDollars: 1.00,
    dailyAggregateCapDollars: 2.50,
    tickerAllowlist: ['KXBTC*'],
  },
};

function makeDeps(overrides: Partial<TrialDeps> = {}): TrialDeps {
  return {
    executeStrategy: vi.fn().mockResolvedValue({ filled: 1, status: 'complete' }),
    confirm: vi.fn().mockResolvedValue(true),
    dailySpentDollars: vi.fn().mockResolvedValue(0),
    readSafety: () => SAFETY,
    ...overrides,
  };
}

let createdHomes: string[] = [];
function tempKeaHome(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'micro-trial-test-'));
  createdHomes.push(dir);
  process.env['KEA_HOME'] = dir;
  return dir;
}
afterEach(() => {
  for (const dir of createdHomes) fs.rmSync(dir, { recursive: true, force: true });
  createdHomes = [];
  delete process.env['KEA_HOME'];
});

describe('runTrial — gates', () => {
  it('rejects when per-trial cap exceeded', async () => {
    tempKeaHome();
    const deps = makeDeps();
    const result = await runTrial(trial({ maxNotionalDollars: 5.00 }), deps);
    expect(result.status).toBe('rejected');
    expect(result.rejectReason).toMatch(/per_trial_cap_exceeded/);
    expect(deps.executeStrategy).not.toHaveBeenCalled();
    expect(deps.confirm).not.toHaveBeenCalled();
  });

  it('rejects when daily aggregate cap exceeded', async () => {
    tempKeaHome();
    const deps = makeDeps({ dailySpentDollars: vi.fn().mockResolvedValue(2.40) });
    const result = await runTrial(trial({ maxNotionalDollars: 0.50 }), deps);
    expect(result.status).toBe('rejected');
    expect(result.rejectReason).toMatch(/daily_aggregate_cap_exceeded/);
    expect(deps.executeStrategy).not.toHaveBeenCalled();
  });

  it('rejects when ticker not allowlisted', async () => {
    tempKeaHome();
    const deps = makeDeps();
    const result = await runTrial(trial({ ticker: 'KXMOVVA-26' }), deps);
    expect(result.status).toBe('rejected');
    expect(result.rejectReason).toMatch(/ticker_not_allowlisted/);
  });

  it('rejects when microHarness section is missing', async () => {
    tempKeaHome();
    const safetyNoMicro = { ...SAFETY };
    delete safetyNoMicro.microHarness;
    const deps = makeDeps({ readSafety: () => safetyNoMicro });
    const result = await runTrial(trial(), deps);
    expect(result.status).toBe('rejected');
    expect(result.rejectReason).toMatch(/no_micro_safety_config/);
  });
});

describe('runTrial — confirmation', () => {
  it('rejects without running strategy when operator declines', async () => {
    tempKeaHome();
    const deps = makeDeps({ confirm: vi.fn().mockResolvedValue(false) });
    const result = await runTrial(trial(), deps);
    expect(result.status).toBe('rejected');
    expect(result.rejectReason).toMatch(/operator_declined/);
    expect(deps.executeStrategy).not.toHaveBeenCalled();
  });

  it('runs strategy when operator confirms', async () => {
    tempKeaHome();
    const deps = makeDeps();
    const result = await runTrial(trial(), deps);
    expect(result.status).toBe('complete');
    expect(deps.executeStrategy).toHaveBeenCalledOnce();
  });
});

describe('runTrial — strategy failure', () => {
  it('marks trial failed and journals when strategy throws', async () => {
    tempKeaHome();
    const deps = makeDeps({
      executeStrategy: vi.fn().mockRejectedValue(new Error('mock kalshi 503')),
    });
    const result = await runTrial(trial({ trialId: 'failure-trial' }), deps);
    expect(result.status).toBe('failed');
    expect(result.rejectReason).toMatch(/mock kalshi 503/);

    const journal = new Journal('failure-trial');
    const entries = journal.readAll();
    const finished = entries.find((e) => e.kind === 'micro_trial_finished');
    expect(finished).toBeDefined();
    expect((finished!.data as Record<string, unknown>)['status']).toBe('failed');
  });
});

describe('runTrial — happy path journal entries', () => {
  it('writes micro_trial_started + finished under trialId-as-jobId for SH-EDGE consumption', async () => {
    tempKeaHome();
    const trialId = 'happy-trial-1';
    const config = trial({ trialId });
    const deps = makeDeps({
      executeStrategy: vi.fn().mockImplementation(async (_cfg, j: Journal) => {
        // Strategy would normally write loop_started + order_* entries here;
        // simulate with an order_intent so we can confirm fire shape works.
        j.append('order_intent' as never, { jobId: trialId, ticker: config.ticker });
        return { filled: 3, status: 'complete' as const };
      }),
    });

    const result = await runTrial(config, deps);
    expect(result.status).toBe('complete');
    expect(result.fireId).toBe(`fire-${trialId}`);

    const journal = new Journal(trialId);
    const entries = journal.readAll();
    const kinds = entries.map((e) => e.kind);
    expect(kinds).toContain('micro_trial_started');
    expect(kinds).toContain('order_intent');
    expect(kinds).toContain('micro_trial_finished');
  });
});

describe('sumDailySpent', () => {
  it('sums today, ignores other days, ignores other kinds', () => {
    const todayIso = '2026-05-09T18:00:00.000Z';
    const yesterdayIso = '2026-05-08T18:00:00.000Z';
    const entries = [
      { kind: 'micro_trial_started', data: { startedAt: todayIso, maxNotionalDollars: 0.50 } },
      { kind: 'micro_trial_started', data: { startedAt: todayIso, maxNotionalDollars: 1.00 } },
      { kind: 'micro_trial_started', data: { startedAt: yesterdayIso, maxNotionalDollars: 1.00 } },
      { kind: 'order_intent', data: { startedAt: todayIso, maxNotionalDollars: 99.00 } },
      { kind: 'micro_trial_started', data: {} }, // missing fields
    ];
    expect(sumDailySpent(entries, new Date('2026-05-09T20:00:00Z'))).toBeCloseTo(1.50, 6);
  });

  it('returns 0 when no relevant entries', () => {
    expect(sumDailySpent([], new Date('2026-05-09T20:00:00Z'))).toBe(0);
  });
});
