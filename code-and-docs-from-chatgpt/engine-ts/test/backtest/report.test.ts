/**
 * SH-BACKTEST Phase B2 — report formatter tests.
 *
 * Tests: JSON round-trip; markdown contains expected fields; writeReport writes
 * JSON to disk and can be read back.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { formatReport, writeReport } from '../../src/backtest/report.js';
import type { CounterfactualReport } from '../../src/backtest/types.js';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

function makeReport(overrides: Partial<CounterfactualReport> = {}): CounterfactualReport {
  return {
    strategyId: 'stub',
    recordingPath: '/tmp/test.ndjson',
    params: { ticker: 'KXTEST', size: 10 },
    summary: {
      pnl_cents: 250,
      fill_count: 3,
      fill_rate: 0.6,
      avg_slippage_cents: -2,
      time_to_full_exit_s: 42,
      max_adverse_excursion_cents: -50,
      max_favorable_excursion_cents: 300,
    },
    pnl_cents: 250,
    fill_count: 3,
    fill_rate: 0.6,
    avg_slippage_cents: -2,
    trace: [
      { ts: '2026-05-07T10:00:00.000Z', midCents: 50, fillsSoFar: 0, remaining: 10, pnl_cents: 0 },
      { ts: '2026-05-07T10:01:00.000Z', midCents: 52, fillsSoFar: 1, remaining: 7, pnl_cents: 150 },
    ],
    mark_curve: [
      { ts: '2026-05-07T10:00:00.000Z', midCents: 50 },
      { ts: '2026-05-07T10:01:00.000Z', midCents: 52 },
    ],
    fills: [
      {
        ts: '2026-05-07T10:01:00.000Z',
        ticker: 'KXTEST',
        orderId: 'replay-order-1',
        side: 'yes',
        requestedSize: 3,
        filled: 3,
        fillPriceCents: 52,
        isTaker: true,
        feesCents: 6,
      },
    ],
    assumptions_warning: [
      'caveat-1: sub-cadence events invisible',
      'caveat-2: no market-impact modeling',
    ],
    generated_at: '2026-05-07T12:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('formatReport (json)', () => {
  it('round-trips through JSON.parse', () => {
    const report = makeReport();
    const json = formatReport(report, 'json');
    const parsed = JSON.parse(json) as CounterfactualReport;

    expect(parsed.strategyId).toBe('stub');
    expect(parsed.pnl_cents).toBe(250);
    expect(parsed.summary.fill_count).toBe(3);
    expect(parsed.fills).toHaveLength(1);
    expect(parsed.assumptions_warning).toHaveLength(2);
  });

  it('JSON output is pretty-printed (contains newlines)', () => {
    const json = formatReport(makeReport(), 'json');
    expect(json).toContain('\n');
    expect(json).toContain('  ');
  });
});

describe('formatReport (markdown)', () => {
  it('contains the strategy id in the header', () => {
    const md = formatReport(makeReport(), 'markdown');
    expect(md).toContain('stub');
  });

  it('contains P&L value', () => {
    const md = formatReport(makeReport(), 'markdown');
    expect(md).toContain('250');
  });

  it('contains fill rate as percentage', () => {
    const md = formatReport(makeReport(), 'markdown');
    expect(md).toContain('60.0%');
  });

  it('contains at least one trace row', () => {
    const md = formatReport(makeReport(), 'markdown');
    expect(md).toContain('2026-05-07T10:00:00.000Z');
  });

  it('contains assumptions section', () => {
    const md = formatReport(makeReport(), 'markdown');
    expect(md).toContain('Fidelity Assumptions');
    expect(md).toContain('caveat-1');
  });

  it('shows "never" for time_to_full_exit_s = -1', () => {
    const report = makeReport();
    report.summary.time_to_full_exit_s = -1;
    const md = formatReport(report, 'markdown');
    expect(md).toContain('never');
  });

  it('shows seconds for positive time_to_full_exit_s', () => {
    const md = formatReport(makeReport(), 'markdown');
    expect(md).toContain('42s');
  });
});

describe('writeReport', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-report-test-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes JSON to disk and can be read back', () => {
    const report = makeReport();
    const outPath = path.join(dir, 'report.json');
    writeReport(report, outPath);

    expect(fs.existsSync(outPath)).toBe(true);
    const contents = fs.readFileSync(outPath, 'utf-8');
    const parsed = JSON.parse(contents) as CounterfactualReport;
    expect(parsed.strategyId).toBe('stub');
    expect(parsed.pnl_cents).toBe(250);
  });

  it('creates parent directories if needed', () => {
    const report = makeReport();
    const outPath = path.join(dir, 'nested', 'deep', 'report.json');
    writeReport(report, outPath);
    expect(fs.existsSync(outPath)).toBe(true);
  });
});
