/**
 * reportsView.test.tsx — SP4.3 ReportsView logic tests.
 *
 * NOTE: No react-dom / jsdom — logic-only pattern per extension test convention.
 * Tests cover the exported fetch helpers and buildTcaSummary math.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  fetchJournalList,
  fetchJournalRead,
  fetchPortfolioPlan,
  buildTcaSummary,
  formatSlippage,
  ReportsView,
  type TcaChunk,
} from '../../../extension/popup/ReportsView';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFetch(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

// ── ReportsView export ────────────────────────────────────────────────────────

describe('ReportsView', () => {
  it('is a named export and a function', () => {
    expect(typeof ReportsView).toBe('function');
  });
});

// ── formatSlippage ────────────────────────────────────────────────────────────

describe('formatSlippage', () => {
  it('formats positive cents with + sign', () => {
    expect(formatSlippage(3)).toBe('+$0.03');
  });

  it('formats zero as +$0.00', () => {
    expect(formatSlippage(0)).toBe('+$0.00');
  });

  it('formats negative cents with - sign', () => {
    expect(formatSlippage(-5)).toBe('-$0.05');
  });

  it('formats whole dollar amounts correctly', () => {
    expect(formatSlippage(100)).toBe('+$1.00');
    expect(formatSlippage(-200)).toBe('-$2.00');
  });
});

// ── buildTcaSummary ───────────────────────────────────────────────────────────

const SAMPLE_CHUNK: TcaChunk = {
  chunkIndex: 0,
  ticker: 'KXABC-24',
  side: 'yes',
  arrivalMidCents: 55,
  executedPriceCents: 53,
  slippageCents: -2,
  chunkSize: 10,
};

describe('buildTcaSummary', () => {
  it('returns null when no tca entries', () => {
    const result = buildTcaSummary('job-1', [
      { kind: 'loop_started', ts: '2026-01-01T00:00:00Z', data: {} },
    ]);
    expect(result).toBeNull();
  });

  it('extracts ticker and side from first chunk', () => {
    const result = buildTcaSummary('job-1', [
      { kind: 'tca', ts: '2026-01-01T00:00:00Z', data: SAMPLE_CHUNK },
    ]);
    expect(result).not.toBeNull();
    expect(result!.ticker).toBe('KXABC-24');
    expect(result!.side).toBe('yes');
    expect(result!.jobId).toBe('job-1');
  });

  it('computes avgSlippageCents as mean of slippageCents', () => {
    const chunk2: TcaChunk = { ...SAMPLE_CHUNK, chunkIndex: 1, slippageCents: -4 };
    const result = buildTcaSummary('job-1', [
      { kind: 'tca', ts: '2026-01-01T00:00:00Z', data: SAMPLE_CHUNK },
      { kind: 'tca', ts: '2026-01-01T00:00:01Z', data: chunk2 },
    ]);
    expect(result!.avgSlippageCents).toBe(-3); // (-2 + -4) / 2
  });

  it('includes all chunks', () => {
    const chunk2: TcaChunk = { ...SAMPLE_CHUNK, chunkIndex: 1, slippageCents: 0 };
    const result = buildTcaSummary('job-1', [
      { kind: 'tca', ts: '2026-01-01T00:00:00Z', data: SAMPLE_CHUNK },
      { kind: 'tca', ts: '2026-01-01T00:00:01Z', data: chunk2 },
    ]);
    expect(result!.chunks).toHaveLength(2);
  });

  it('skips non-tca entries', () => {
    const result = buildTcaSummary('job-2', [
      { kind: 'loop_started', ts: '2026-01-01T00:00:00Z', data: {} },
      { kind: 'tca', ts: '2026-01-01T00:00:01Z', data: SAMPLE_CHUNK },
      { kind: 'loop_finished', ts: '2026-01-01T00:00:02Z', data: {} },
    ]);
    expect(result!.chunks).toHaveLength(1);
  });
});

// ── fetchJournalList ──────────────────────────────────────────────────────────

describe('fetchJournalList', () => {
  it('returns jobs array on 200', async () => {
    const jobs = [{ jobId: 'job-1', entries: 5, finished: true }];
    const mockFetch = makeFetch({ ok: true, jobs });
    const { data, error } = await fetchJournalList(mockFetch as unknown as typeof fetch);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].jobId).toBe('job-1');
  });

  it('returns error on HTTP 500', async () => {
    const mockFetch = makeFetch({}, 500);
    const { data, error } = await fetchJournalList(mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toMatch(/500/);
  });

  it('returns error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const { data, error } = await fetchJournalList(mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toBe('ECONNREFUSED');
  });

  it('returns empty array when jobs field missing', async () => {
    const mockFetch = makeFetch({ ok: true });
    const { data, error } = await fetchJournalList(mockFetch as unknown as typeof fetch);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('uses custom serverUrl', async () => {
    const mockFetch = makeFetch({ ok: true, jobs: [] });
    await fetchJournalList(mockFetch as unknown as typeof fetch, 'http://custom:9090');
    expect(mockFetch).toHaveBeenCalledWith('http://custom:9090/journal/list');
  });
});

// ── fetchJournalRead ──────────────────────────────────────────────────────────

describe('fetchJournalRead', () => {
  it('returns entries on 200', async () => {
    const entries = [{ kind: 'tca', ts: '2026-01-01T00:00:00Z', data: SAMPLE_CHUNK }];
    const mockFetch = makeFetch({ ok: true, entries });
    const { data, error } = await fetchJournalRead('job-1', mockFetch as unknown as typeof fetch);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('returns error on HTTP 404', async () => {
    const mockFetch = makeFetch({ ok: false, error: 'not found' }, 404);
    const { data, error } = await fetchJournalRead('job-x', mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toMatch(/404/);
  });

  it('encodes jobId in URL', async () => {
    const mockFetch = makeFetch({ ok: true, entries: [] });
    await fetchJournalRead('job/special', mockFetch as unknown as typeof fetch);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('job%2Fspecial');
  });

  it('returns error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('timeout'));
    const { data, error } = await fetchJournalRead('job-1', mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toBe('timeout');
  });
});

// ── fetchPortfolioPlan ────────────────────────────────────────────────────────

describe('fetchPortfolioPlan', () => {
  it('returns null data and no error when positions is empty (no-op)', async () => {
    const mockFetch = vi.fn();
    const { data, error } = await fetchPortfolioPlan([], mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns plan on 200', async () => {
    const plan = {
      ranked: [{ rank: 1, ticker: 'KXABC-24', side: 'yes', size: 5, markToBidDollars: 2.5, evHoldDollars: 2.5, overvaluedDollars: 0, recommendedStrategy: 'passive' }],
      totalRaiseableDollars: 2.5,
    };
    const mockFetch = makeFetch({ ok: true, plan });
    const { data, error } = await fetchPortfolioPlan(
      [{ ticker: 'KXABC-24', side: 'yes', size: 5 }],
      mockFetch as unknown as typeof fetch,
    );
    expect(error).toBeNull();
    expect(data!.ranked).toHaveLength(1);
    expect(data!.ranked[0].ticker).toBe('KXABC-24');
  });

  it('returns error on HTTP 400', async () => {
    const mockFetch = makeFetch({ ok: false, error: 'Missing required field: positions' }, 400);
    const { data, error } = await fetchPortfolioPlan(
      [{ ticker: 'X', side: 'yes', size: 1 }],
      mockFetch as unknown as typeof fetch,
    );
    expect(data).toBeNull();
    expect(error).toMatch(/positions/);
  });

  it('sends POST with JSON body', async () => {
    const plan = { ranked: [], totalRaiseableDollars: 0 };
    const mockFetch = makeFetch({ ok: true, plan });
    await fetchPortfolioPlan(
      [{ ticker: 'KXABC', side: 'yes', size: 3 }],
      mockFetch as unknown as typeof fetch,
    );
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts?.method).toBe('POST');
    const body = JSON.parse(opts?.body as string);
    expect(body.positions).toHaveLength(1);
    expect(body.positions[0].ticker).toBe('KXABC');
    expect(body.bidByTicker['KXABC']).toBe(50);
    expect(body.midProbabilities['KXABC']).toBe(0.5);
  });

  it('returns error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('net error'));
    const { data, error } = await fetchPortfolioPlan(
      [{ ticker: 'X', side: 'yes', size: 1 }],
      mockFetch as unknown as typeof fetch,
    );
    expect(data).toBeNull();
    expect(error).toBe('net error');
  });
});
