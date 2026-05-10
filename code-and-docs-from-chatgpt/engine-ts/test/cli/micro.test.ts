/**
 * test/cli/micro.test.ts — SH-MICRO-STATUS-JSON (Track D)
 *
 * Pin --json envelope on `kea micro status`. Both empty-state and
 * populated-state must emit a valid envelope.
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

function microJournal(jobId: string, entries: Array<{
  kind: 'micro_trial_started' | 'micro_trial_finished';
  data: Record<string, unknown>;
}>): string {
  const ts = new Date().toISOString();
  return entries.map((e) => JSON.stringify({ ts, kind: e.kind, data: { jobId, ...e.data } })).join('\n') + '\n';
}

let tmpHome: string;
let origKeaHome: string | undefined;

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-micro-test-'));
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

const today = new Date().toISOString().slice(0, 10);

describe('kea micro status --json (SH-MICRO-STATUS-JSON)', () => {
  it('emits versioned envelope with rows for started trials', async () => {
    const startedAt = `${today}T12:00:00.000Z`;
    writeJob('trial-1', microJournal('trial-1', [
      { kind: 'micro_trial_started', data: {
        trialId: 'trial-1', ticker: 'KXA-26', side: 'yes', strategy: 's-passive',
        maxNotionalDollars: 0.5, intent: 'smoke', startedAt,
      } },
      { kind: 'micro_trial_finished', data: {
        trialId: 'trial-1', status: 'complete', filled: 1, fireId: 'fire-trial-1',
        finishedAt: `${today}T12:00:30.000Z`,
      } },
    ]));
    writeJob('trial-2', microJournal('trial-2', [
      { kind: 'micro_trial_started', data: {
        trialId: 'trial-2', ticker: 'KXB-26', side: 'no', strategy: 's-aggressive',
        maxNotionalDollars: 0.75, intent: 'smoke 2', startedAt,
      } },
    ]));

    const out = await captureOut(() => runCli(['micro', 'status', '--json']));
    const env = JSON.parse(out);
    expect(env.version).toBe(1);
    expect(env.mode).toBe('micro_status');
    expect(env.date).toBe(today);
    expect(env.totals.trialsToday).toBe(2);
    expect(env.totals.spentDollars).toBeCloseTo(1.25, 5);
    expect(env.rows).toHaveLength(2);

    const completed = env.rows.find((r: { trialId: string }) => r.trialId === 'trial-1');
    expect(completed.status).toBe('complete');
    expect(completed.fireId).toBe('fire-trial-1');
    const running = env.rows.find((r: { trialId: string }) => r.trialId === 'trial-2');
    expect(running.status).toBe('running');
    expect(running.fireId).toBeNull();
  });

  it('emits empty envelope (rows: []) when no trials today', async () => {
    const out = await captureOut(() => runCli(['micro', 'status', '--json']));
    const env = JSON.parse(out);
    expect(env.version).toBe(1);
    expect(env.mode).toBe('micro_status');
    expect(env.totals.trialsToday).toBe(0);
    expect(env.totals.spentDollars).toBe(0);
    expect(env.rows).toEqual([]);
  });

  it('text mode unchanged when --json absent', async () => {
    const startedAt = `${today}T12:00:00.000Z`;
    writeJob('trial-3', microJournal('trial-3', [
      { kind: 'micro_trial_started', data: {
        trialId: 'trial-3', ticker: 'KXA-26', side: 'yes', strategy: 's-passive',
        maxNotionalDollars: 0.5, intent: 'smoke', startedAt,
      } },
    ]));
    const out = await captureOut(() => runCli(['micro', 'status']));
    expect(out).toMatch(/Micro trials/);
    expect(out).toMatch(/trial-3/);
  });
});
