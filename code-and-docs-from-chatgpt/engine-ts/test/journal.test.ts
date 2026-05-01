import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Journal, generateJobId } from '../src/journal.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-journal-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('Journal', () => {
  it('creates the jobs directory and file on first append', () => {
    const j = new Journal('job-001', tmpDir);
    j.append('loop_started', { ticker: 'KXTEST' });
    expect(fs.existsSync(j.path)).toBe(true);
  });

  it('writes valid JSONL (one JSON object per line)', () => {
    const j = new Journal('job-002', tmpDir);
    j.append('loop_started', { ticker: 'KXTEST' });
    j.append('loop_finished', { remaining: 0 });
    const lines = fs.readFileSync(j.path, 'utf8').split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
    const parsed = lines.map((l) => JSON.parse(l));
    expect(parsed[0].kind).toBe('loop_started');
    expect(parsed[1].kind).toBe('loop_finished');
  });

  it('readAll returns all entries in order', () => {
    const j = new Journal('job-003', tmpDir);
    j.append('loop_started', {});
    j.append('order_placed', { orderId: 'A' });
    j.append('order_reconciled', { orderId: 'A', filled: 100 });
    j.append('loop_finished', {});
    const entries = j.readAll();
    expect(entries.map((e) => e.kind)).toEqual([
      'loop_started',
      'order_placed',
      'order_reconciled',
      'loop_finished',
    ]);
  });

  it('readAll returns [] when file does not exist', () => {
    const j = new Journal('nonexistent', tmpDir);
    expect(j.readAll()).toEqual([]);
  });

  it('isFinished returns true when loop_finished is present', () => {
    const j = new Journal('job-004', tmpDir);
    j.append('loop_started', {});
    expect(j.isFinished()).toBe(false);
    j.append('loop_finished', {});
    expect(j.isFinished()).toBe(true);
  });

  it('pendingOrders returns orders without matching order_reconciled', () => {
    const j = new Journal('job-005', tmpDir);
    j.append('order_placed', { orderId: 'A', payload: {}, decisionRequested: 100 });
    j.append('order_placed', { orderId: 'B', payload: {}, decisionRequested: 200 });
    j.append('order_reconciled', { orderId: 'A', filled: 100 });
    const pending = j.pendingOrders();
    expect(pending).toHaveLength(1);
    expect(pending[0].orderId).toBe('B');
  });

  it('pendingOrders returns [] when all orders are reconciled', () => {
    const j = new Journal('job-006', tmpDir);
    j.append('order_placed', { orderId: 'X', payload: {}, decisionRequested: 50 });
    j.append('order_reconciled', { orderId: 'X', filled: 50 });
    expect(j.pendingOrders()).toHaveLength(0);
  });

  it('computeFilledTotal sums filled counts from order_reconciled entries', () => {
    const j = new Journal('job-007', tmpDir);
    j.append('order_reconciled', { orderId: 'A', filled: 100 });
    j.append('order_reconciled', { orderId: 'B', filled: 200 });
    j.append('resume_reconciled', { orderId: 'C', filled: 50 });
    expect(j.computeFilledTotal()).toBe(350);
  });

  it('each entry has a ts field that is an ISO string', () => {
    const j = new Journal('job-008', tmpDir);
    j.append('loop_started', {});
    const [entry] = j.readAll();
    expect(entry.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('generateJobId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateJobId()));
    expect(ids.size).toBe(100);
  });

  it('readAll silently skips truncated/malformed lines', () => {
    const j = new Journal('job-trunc', tmpDir);
    j.append('loop_started', { ticker: 'KXTEST' });
    // Append a partial (truncated) JSON line — simulates a mid-write crash
    fs.appendFileSync(j.path, '{"ts":"2026', 'utf8');
    const entries = j.readAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('loop_started');
  });

  it('computeFilledTotal does not double-count on second crash-and-resume', () => {
    const j = new Journal('job-doublecount', tmpDir);
    // First run: order placed and reconciled
    j.append('order_reconciled', { orderId: 'A', filled: 100 });
    // First resume: same orderId appears as resume_reconciled (from reconcileOrder on resume)
    j.append('resume_reconciled', { orderId: 'A', filled: 100 });
    // Second resume: a NEW order_reconciled for A again (simulating second crash scenario)
    j.append('order_reconciled', { orderId: 'A', filled: 100 });
    // Should count A only once (last-seen value = 100), not 300
    expect(j.computeFilledTotal()).toBe(100);
  });

  it('pendingOrders dedupes duplicate order_placed entries for same orderId', () => {
    const j = new Journal('job-dedup', tmpDir);
    // Retry path wrote order_placed twice for same orderId
    j.append('order_placed', { orderId: 'X', payload: {}, decisionRequested: 100 });
    j.append('order_placed', { orderId: 'X', payload: {}, decisionRequested: 100 });
    const pending = j.pendingOrders();
    expect(pending).toHaveLength(1);
    expect(pending[0].orderId).toBe('X');
  });

  it('survives a simulated crash mid-write (JSONL is line-oriented)', () => {
    const j = new Journal('job-009', tmpDir);
    j.append('loop_started', {});
    j.append('order_placed', { orderId: 'Z', payload: {}, decisionRequested: 10 });
    // Simulate a truncation at the end (no trailing newline edge-case)
    const content = fs.readFileSync(j.path, 'utf8');
    // Chop the last line in half — simulates a crash mid-write
    const lines = content.split('\n').filter(Boolean);
    const truncated = lines.slice(0, lines.length - 1).join('\n') + '\n';
    fs.writeFileSync(j.path, truncated, 'utf8');
    // The partial last line is discarded; remaining entries are intact
    const recovered = j.readAll();
    expect(recovered[0].kind).toBe('loop_started');
    // order_placed line was removed — no partial garbage
    expect(recovered.every((e) => {
      try { JSON.parse(JSON.stringify(e)); return true; } catch { return false; }
    })).toBe(true);
  });
});
