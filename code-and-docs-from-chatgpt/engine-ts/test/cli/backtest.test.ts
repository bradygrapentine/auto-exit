/**
 * test/cli/backtest.test.ts
 *
 * Tests for `kea backtest run/sweep/report` subcommands.
 * Uses the same in-process CLI harness pattern as test/cli/edge.test.ts.
 * Mocks runBacktest and runSweep to avoid real recording I/O.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { CounterfactualReport, SweepResult } from '../../src/backtest/types.js';

// ── module-level mocks (hoisted) ──────────────────────────────────────────────

// Shared holders that tests mutate before each call.
let mockRunBacktestResult: CounterfactualReport | null = null;
let mockRunSweepResult: SweepResult | null = null;

vi.mock('../../src/backtest/harness.js', () => ({
  runBacktest: vi.fn(async () => {
    if (!mockRunBacktestResult) throw new Error('mockRunBacktestResult not set');
    return mockRunBacktestResult;
  }),
}));

vi.mock('../../src/backtest/sweep.js', () => ({
  runSweep: vi.fn(async () => {
    if (!mockRunSweepResult) throw new Error('mockRunSweepResult not set');
    return mockRunSweepResult;
  }),
}));

// Import CLI after mocks are registered.
const { runCli } = await import('../../src/cli.js');

// ── harness helpers ───────────────────────────────────────────────────────────

async function captureOut(fn: () => Promise<void>): Promise<{ stdout: string; stderr: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const spyOut = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((s: any) => { out.push(String(s)); return true; });
  const spyErr = vi
    .spyOn(process.stderr, 'write')
    .mockImplementation((s: any) => { err.push(String(s)); return true; });
  try {
    await fn();
  } finally {
    spyOut.mockRestore();
    spyErr.mockRestore();
  }
  return { stdout: out.join(''), stderr: err.join('') };
}

async function expectDie(fn: () => Promise<void>): Promise<string> {
  const errLines: string[] = [];
  const spyErr = vi
    .spyOn(process.stderr, 'write')
    .mockImplementation((s: any) => { errLines.push(String(s)); return true; });
  const spyExit = vi
    .spyOn(process, 'exit')
    .mockImplementation((_code?: any): never => { throw new Error('process.exit'); });
  try {
    await fn();
  } catch {
    // expected
  } finally {
    spyErr.mockRestore();
    spyExit.mockRestore();
  }
  return errLines.join('');
}

// ── synthetic fixtures ────────────────────────────────────────────────────────

function makeReport(overrides: Partial<CounterfactualReport> = {}): CounterfactualReport {
  return {
    strategyId: 'stub',
    recordingPath: '/tmp/test.ndjson',
    params: {},
    summary: {
      pnl_cents: 42,
      fill_count: 3,
      fill_rate: 0.75,
      avg_slippage_cents: -1,
      time_to_full_exit_s: 120,
      max_adverse_excursion_cents: -5,
      max_favorable_excursion_cents: 50,
    },
    pnl_cents: 42,
    fill_count: 3,
    fill_rate: 0.75,
    avg_slippage_cents: -1,
    trace: [
      { ts: '2024-01-01T00:00:00.000Z', midCents: 50, fillsSoFar: 0, remaining: 10, pnl_cents: 0 },
      { ts: '2024-01-01T00:00:01.000Z', midCents: 52, fillsSoFar: 1, remaining: 7, pnl_cents: 15 },
    ],
    mark_curve: [{ ts: '2024-01-01T00:00:00.000Z', midCents: 50 }],
    fills: [],
    assumptions_warning: ['caveat-1: test caveat'],
    generated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ── setup / teardown ──────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-backtest-test-'));
  mockRunBacktestResult = null;
  mockRunSweepResult = null;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

// ── backtest run tests ────────────────────────────────────────────────────────

describe('kea backtest run', () => {
  it('prints markdown report to stdout on success', async () => {
    mockRunBacktestResult = makeReport();

    const recPath = path.join(tmpDir, 'test.ndjson');
    fs.writeFileSync(recPath, '', 'utf-8');

    const { stdout } = await captureOut(() =>
      runCli(['backtest', 'run', '--recording', recPath, '--strategy', 'stub']),
    );

    expect(stdout).toContain('# Backtest Report');
    expect(stdout).toContain('stub');
    expect(stdout).toContain('Summary');
    expect(stdout).toContain('P&L');
    expect(stdout).toContain('Fidelity Assumptions');
  });

  it('prints JSON report when --mode json', async () => {
    mockRunBacktestResult = makeReport();

    const recPath = path.join(tmpDir, 'test.ndjson');
    fs.writeFileSync(recPath, '', 'utf-8');

    const { stdout } = await captureOut(() =>
      runCli(['backtest', 'run', '--recording', recPath, '--strategy', 'stub', '--mode', 'json']),
    );

    const parsed = JSON.parse(stdout.trim());
    expect(parsed.strategyId).toBe('stub');
    expect(parsed.summary.pnl_cents).toBe(42);
  });

  it('writes report to disk when --report-path provided', async () => {
    mockRunBacktestResult = makeReport();

    const recPath = path.join(tmpDir, 'test.ndjson');
    fs.writeFileSync(recPath, '', 'utf-8');
    const reportPath = path.join(tmpDir, 'out', 'report.json');

    await captureOut(() =>
      runCli([
        'backtest', 'run',
        '--recording', recPath,
        '--strategy', 'stub',
        '--report-path', reportPath,
      ]),
    );

    expect(fs.existsSync(reportPath)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(reportPath, 'utf-8')) as CounterfactualReport;
    expect(saved.strategyId).toBe('stub');
    expect(saved.summary.pnl_cents).toBe(42);
  });

  it('dies with helpful message when --recording is missing', async () => {
    const msg = await expectDie(() =>
      runCli(['backtest', 'run', '--strategy', 'stub']),
    );
    expect(msg).toContain('--recording');
  });

  it('dies with helpful message when --strategy is missing', async () => {
    const recPath = path.join(tmpDir, 'test.ndjson');
    fs.writeFileSync(recPath, '', 'utf-8');
    const msg = await expectDie(() =>
      runCli(['backtest', 'run', '--recording', recPath]),
    );
    expect(msg).toContain('--strategy');
  });
});

// ── backtest sweep tests ──────────────────────────────────────────────────────

describe('kea backtest sweep', () => {
  it('prints comparison table with 4 rows for 2x2 grid', async () => {
    const rows = [
      { params: { trailCents: 3, chunkSize: 10 }, summary: { pnl_cents: 100, fill_count: 2, fill_rate: 1, avg_slippage_cents: 0, time_to_full_exit_s: 60, max_adverse_excursion_cents: -5, max_favorable_excursion_cents: 120 } },
      { params: { trailCents: 3, chunkSize: 25 }, summary: { pnl_cents: 90, fill_count: 2, fill_rate: 1, avg_slippage_cents: 0, time_to_full_exit_s: 60, max_adverse_excursion_cents: -5, max_favorable_excursion_cents: 110 } },
      { params: { trailCents: 5, chunkSize: 10 }, summary: { pnl_cents: 80, fill_count: 2, fill_rate: 1, avg_slippage_cents: 0, time_to_full_exit_s: 60, max_adverse_excursion_cents: -5, max_favorable_excursion_cents: 100 } },
      { params: { trailCents: 5, chunkSize: 25 }, summary: { pnl_cents: 70, fill_count: 2, fill_rate: 1, avg_slippage_cents: 0, time_to_full_exit_s: 60, max_adverse_excursion_cents: -5, max_favorable_excursion_cents: 90 } },
    ];
    mockRunSweepResult = {
      rows,
      table: [
        '_Ranked by `pnl_cents` (descending)_',
        '',
        '| trailCents | chunkSize | pnl_cents |',
        '| --- | --- | --- |',
        '| 3 | 10 | 100 |',
        '| 3 | 25 | 90 |',
        '| 5 | 10 | 80 |',
        '| 5 | 25 | 70 |',
      ].join('\n'),
      ndjson: rows.map((r) => JSON.stringify(r)).join('\n') + '\n',
    };

    const recPath = path.join(tmpDir, 'test.ndjson');
    fs.writeFileSync(recPath, '', 'utf-8');

    const { stdout } = await captureOut(() =>
      runCli([
        'backtest', 'sweep',
        '--recording', recPath,
        '--strategy', 'stub',
        '--grid', JSON.stringify({ trailCents: [3, 5], chunkSize: [10, 25] }),
      ]),
    );

    // 4 data rows present
    const dataRows = stdout.split('\n').filter((l) => l.startsWith('| ') && /\d+/.test(l) && !l.includes('---'));
    expect(dataRows.length).toBeGreaterThanOrEqual(4);
  });

  it('writes sweep files to --out-dir when provided', async () => {
    mockRunSweepResult = {
      rows: [
        { params: { trailCents: 3 }, summary: { pnl_cents: 50, fill_count: 1, fill_rate: 1, avg_slippage_cents: 0, time_to_full_exit_s: 30, max_adverse_excursion_cents: 0, max_favorable_excursion_cents: 50 } },
      ],
      table: '| trailCents | pnl_cents |\n| --- | --- |\n| 3 | 50 |',
      ndjson: '{"params":{"trailCents":3}}\n',
    };

    const recPath = path.join(tmpDir, 'test.ndjson');
    fs.writeFileSync(recPath, '', 'utf-8');
    const outDir = path.join(tmpDir, 'sweep-out');

    await captureOut(() =>
      runCli([
        'backtest', 'sweep',
        '--recording', recPath,
        '--strategy', 'stub',
        '--grid', JSON.stringify({ trailCents: [3] }),
        '--out-dir', outDir,
      ]),
    );

    expect(fs.existsSync(path.join(outDir, 'sweep.ndjson'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'sweep.md'))).toBe(true);
  });

  it('dies when --recording is missing', async () => {
    const msg = await expectDie(() =>
      runCli(['backtest', 'sweep', '--strategy', 'stub', '--grid', '{}']),
    );
    expect(msg).toContain('--recording');
  });

  it('dies when --grid is missing', async () => {
    const recPath = path.join(tmpDir, 'test.ndjson');
    fs.writeFileSync(recPath, '', 'utf-8');
    const msg = await expectDie(() =>
      runCli(['backtest', 'sweep', '--recording', recPath, '--strategy', 'stub']),
    );
    expect(msg).toContain('--grid');
  });
});

// ── backtest report tests ─────────────────────────────────────────────────────

describe('kea backtest report', () => {
  it('round-trips JSON → markdown', async () => {
    const report = makeReport({ strategyId: 'stop_loss' });
    const reportPath = path.join(tmpDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    const { stdout } = await captureOut(() =>
      runCli(['backtest', 'report', '--report-path', reportPath]),
    );

    expect(stdout).toContain('# Backtest Report');
    expect(stdout).toContain('stop_loss');
    expect(stdout).toContain('P&L');
    expect(stdout).toContain('42');
  });

  it('round-trips JSON → JSON via --mode json', async () => {
    const report = makeReport({ strategyId: 'stub', pnl_cents: 99 });
    const reportPath = path.join(tmpDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    const { stdout } = await captureOut(() =>
      runCli(['backtest', 'report', '--report-path', reportPath, '--mode', 'json']),
    );

    const parsed = JSON.parse(stdout.trim()) as CounterfactualReport;
    expect(parsed.strategyId).toBe('stub');
    expect(parsed.pnl_cents).toBe(99);
  });

  it('dies when --report-path is missing', async () => {
    const msg = await expectDie(() =>
      runCli(['backtest', 'report']),
    );
    expect(msg).toContain('--report-path');
  });

  it('dies when report file does not exist', async () => {
    const msg = await expectDie(() =>
      runCli(['backtest', 'report', '--report-path', path.join(tmpDir, 'nonexistent.json')]),
    );
    expect(msg).toBeTruthy();
  });
});

// ── unknown subcommand ────────────────────────────────────────────────────────

describe('kea backtest — unknown subcommand', () => {
  it('dies with helpful message', async () => {
    const msg = await expectDie(() =>
      runCli(['backtest', 'bogus']),
    );
    expect(msg).toContain('unknown backtest subcommand');
    expect(msg).toContain('run, sweep, report');
  });
});
