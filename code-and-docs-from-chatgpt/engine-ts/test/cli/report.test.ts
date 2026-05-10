/**
 * test/cli/report.test.ts — SH-REPORT-POLISH (Track A)
 *
 * Pin --json envelope, --ticker filter, and the entries-count + avg-slippage
 * line in the existing TCA Report header.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runCli } from '../../src/cli.js';

async function captureOut(fn: () => Promise<void>): Promise<string> {
  const out: string[] = [];
  const spy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((s: any) => { out.push(String(s)); return true; });
  try {
    await fn();
  } finally {
    spy.mockRestore();
  }
  return out.join('');
}

/** Build a journal with N tca entries. Matches TcaEntry shape from
 *  src/types.ts:276 — what buyRunner / exitRunner actually emit. */
function tcaJournal(jobId: string, entries: Array<{
  ticker: string;
  side: 'buy' | 'sell';
  chunkIndex: number;
  arrivalMidCents: number;
  executedPriceCents: number;
  chunkSize: number;
  depthTier?: number;
}>): string {
  const ts = new Date().toISOString();
  return entries.map((e) => JSON.stringify({
    ts,
    kind: 'tca',
    data: {
      jobId,
      ticker: e.ticker,
      side: e.side,
      chunkIndex: e.chunkIndex,
      arrivalMidCents: e.arrivalMidCents,
      executedPriceCents: e.executedPriceCents,
      slippageCents: e.executedPriceCents - e.arrivalMidCents,
      chunkSize: e.chunkSize,
      depthTier: e.depthTier ?? 1,
    },
  })).join('\n') + '\n';
}

let tmpHome: string;
let origKeaHome: string | undefined;

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-report-test-'));
  origKeaHome = process.env['KEA_HOME'];
  process.env['KEA_HOME'] = tmpHome;
});

afterEach(() => {
  if (origKeaHome !== undefined) {
    process.env['KEA_HOME'] = origKeaHome;
  } else {
    delete process.env['KEA_HOME'];
  }
  fs.rmSync(tmpHome, { recursive: true, force: true });
  vi.clearAllMocks();
});

function writeJob(jobId: string, content: string): void {
  const dir = path.join(tmpHome, 'jobs');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${jobId}.jsonl`), content, 'utf8');
}

// ── SH-REPORT-POLISH ─────────────────────────────────────────────────────────

describe('kea report --json (TCA envelope)', () => {
  it('emits a versioned envelope with mode=tca', async () => {
    writeJob('job-A', tcaJournal('job-A', [
      { ticker: 'KXA-26', side: 'sell', chunkIndex: 0, arrivalMidCents: 50, executedPriceCents: 49, chunkSize: 100 },
      { ticker: 'KXA-26', side: 'sell', chunkIndex: 1, arrivalMidCents: 50, executedPriceCents: 48, chunkSize: 100 },
    ]));
    const out = await captureOut(() => runCli(['report', 'job-A', '--json']));
    const env = JSON.parse(out);
    expect(env.version).toBe(1);
    expect(env.mode).toBe('tca');
    expect(env.jobId).toBe('job-A');
    expect(env.totals.entryCount).toBe(2);
    expect(env.totals.avgSlippageCents).toBeCloseTo(-1.5, 5);
    expect(Array.isArray(env.rows)).toBe(true);
    expect(env.rows.length).toBe(2);
  });

  it('rows preserve TcaEntry data fields', async () => {
    writeJob('job-B', tcaJournal('job-B', [
      { ticker: 'KXB-26', side: 'buy', chunkIndex: 0, arrivalMidCents: 30, executedPriceCents: 31, chunkSize: 50, depthTier: 2 },
    ]));
    const out = await captureOut(() => runCli(['report', 'job-B', '--json']));
    const env = JSON.parse(out);
    const r = env.rows[0];
    expect(r.ticker).toBe('KXB-26');
    expect(r.chunkIndex).toBe(0);
    expect(r.executedPriceCents).toBe(31);
    expect(r.slippageCents).toBe(1);
    expect(r.depthTier).toBe(2);
  });

  it('emits empty envelope when no tca entries', async () => {
    writeJob('job-C', '{"ts":"2026-05-09T12:00:00Z","kind":"loop_started","data":{"jobId":"job-C","ticker":"KXC-26"}}\n');
    const out = await captureOut(() => runCli(['report', 'job-C', '--json']));
    const env = JSON.parse(out);
    expect(env.totals.entryCount).toBe(0);
    expect(env.rows).toEqual([]);
  });
});

describe('kea report --ticker filter', () => {
  it('filters TCA entries by ticker', async () => {
    writeJob('job-D', tcaJournal('job-D', [
      { ticker: 'KXA-26', side: 'sell', chunkIndex: 0, arrivalMidCents: 50, executedPriceCents: 49, chunkSize: 100 },
      { ticker: 'KXB-26', side: 'sell', chunkIndex: 0, arrivalMidCents: 50, executedPriceCents: 48, chunkSize: 100 },
    ]));
    const out = await captureOut(() => runCli(['report', 'job-D', '--ticker', 'KXA-26', '--json']));
    const env = JSON.parse(out);
    expect(env.totals.entryCount).toBe(1);
    expect(env.filters.ticker).toBe('KXA-26');
    expect(env.rows[0].ticker).toBe('KXA-26');
  });
});

describe('kea report header (text mode)', () => {
  it('prints entries-count + avg-slippage line in the header', async () => {
    writeJob('job-E', tcaJournal('job-E', [
      { ticker: 'KXE-26', side: 'sell', chunkIndex: 0, arrivalMidCents: 50, executedPriceCents: 49, chunkSize: 100 },
      { ticker: 'KXE-26', side: 'sell', chunkIndex: 1, arrivalMidCents: 50, executedPriceCents: 48, chunkSize: 100 },
    ]));
    const out = await captureOut(() => runCli(['report', 'job-E']));
    expect(out).toMatch(/2 entries/);
    expect(out).toMatch(/avg slippage/);
  });
});
