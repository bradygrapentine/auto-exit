/**
 * safety-view.test.tsx
 * Tests for popup/SafetyView.tsx: logic helpers, fetch functions.
 *
 * NOTE: No react-dom / jsdom — logic-only pattern per extension test convention.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  fetchSafety,
  addForbidden,
  removeForbidden,
  formatCents,
  formatOptionalDollars,
  type SafetyConfig,
} from '../../../extension/popup/SafetyView';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

const SAMPLE_SAFETY: SafetyConfig = {
  version: 1,
  safetySubmittedMultiple: 1.1,
  floorPriceCents: 5,
  tailSweepThreshold: 0,
  forbiddenTickers: [
    { ticker: 'KXABC', reason: 'test', addedAt: '2026-01-01T00:00:00Z', addedBy: 'extension' },
  ],
};

// ── formatCents ───────────────────────────────────────────────────────────────

describe('formatCents', () => {
  it('formats 0 as $0.00', () => {
    expect(formatCents(0)).toBe('$0.00');
  });

  it('formats 100 as $1.00', () => {
    expect(formatCents(100)).toBe('$1.00');
  });

  it('formats 550 as $5.50', () => {
    expect(formatCents(550)).toBe('$5.50');
  });
});

// ── formatOptionalDollars ─────────────────────────────────────────────────────

describe('formatOptionalDollars', () => {
  it('returns — for undefined', () => {
    expect(formatOptionalDollars(undefined)).toBe('—');
  });

  it('formats 100.5 as $100.50', () => {
    expect(formatOptionalDollars(100.5)).toBe('$100.50');
  });

  it('formats 0 as $0.00', () => {
    expect(formatOptionalDollars(0)).toBe('$0.00');
  });
});

// ── fetchSafety ───────────────────────────────────────────────────────────────

describe('fetchSafety', () => {
  it('returns safety config on 200', async () => {
    const mockFetch = makeFetch({ ok: true, safety: SAMPLE_SAFETY });
    const { data, error } = await fetchSafety(mockFetch as unknown as typeof fetch);
    expect(error).toBeNull();
    expect(data?.version).toBe(1);
    expect(data?.forbiddenTickers).toHaveLength(1);
  });

  it('returns error on 500', async () => {
    const { data, error } = await fetchSafety(makeFetch({}, 500) as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toMatch(/500/);
  });

  it('returns error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const { data, error } = await fetchSafety(mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toBe('ECONNREFUSED');
  });

  it('passes serverUrl correctly', async () => {
    const mockFetch = makeFetch({ ok: true, safety: SAMPLE_SAFETY });
    await fetchSafety(mockFetch as unknown as typeof fetch, 'http://custom:8888');
    expect(mockFetch).toHaveBeenCalledWith('http://custom:8888/safety');
  });
});

// ── addForbidden ──────────────────────────────────────────────────────────────

describe('addForbidden', () => {
  it('returns ok=true on 200', async () => {
    const mockFetch = makeFetch({ ok: true, entry: { ticker: 'XYZ', reason: 'bad' } });
    const { ok, error } = await addForbidden('XYZ', 'bad', mockFetch as unknown as typeof fetch);
    expect(ok).toBe(true);
    expect(error).toBeNull();
  });

  it('returns ok=false on 400 with error message', async () => {
    const mockFetch = makeFetch({ error: 'ticker already on forbidden list' }, 400);
    const { ok, error } = await addForbidden('XYZ', 'dup', mockFetch as unknown as typeof fetch);
    expect(ok).toBe(false);
    expect(error).toMatch(/already/);
  });

  it('sends correct POST body', async () => {
    const mockFetch = makeFetch({ ok: true, entry: {} });
    await addForbidden('KXABC', 'too risky', mockFetch as unknown as typeof fetch);
    const call = mockFetch.mock.calls[0];
    expect(call[1]?.method).toBe('POST');
    const body = JSON.parse(call[1]?.body as string);
    expect(body.ticker).toBe('KXABC');
    expect(body.reason).toBe('too risky');
  });

  it('returns error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('timeout'));
    const { ok, error } = await addForbidden('X', 'y', mockFetch as unknown as typeof fetch);
    expect(ok).toBe(false);
    expect(error).toBe('timeout');
  });
});

// ── removeForbidden ───────────────────────────────────────────────────────────

describe('removeForbidden', () => {
  it('returns ok=true on 200', async () => {
    const mockFetch = makeFetch({ ok: true, removed: true });
    const { ok, error } = await removeForbidden('KXABC', mockFetch as unknown as typeof fetch);
    expect(ok).toBe(true);
    expect(error).toBeNull();
  });

  it('returns ok=false on 404 with error message', async () => {
    const mockFetch = makeFetch({ error: 'not on list' }, 404);
    const { ok, error } = await removeForbidden('KXABC', mockFetch as unknown as typeof fetch);
    expect(ok).toBe(false);
    expect(error).toMatch(/not on list/);
  });

  it('encodes ticker in URL', async () => {
    const mockFetch = makeFetch({ ok: true, removed: true });
    await removeForbidden('KX/ABC', mockFetch as unknown as typeof fetch);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('KX%2FABC');
  });

  it('sends DELETE method', async () => {
    const mockFetch = makeFetch({ ok: true, removed: true });
    await removeForbidden('KXABC', mockFetch as unknown as typeof fetch);
    expect(mockFetch.mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('returns error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('net error'));
    const { ok, error } = await removeForbidden('X', mockFetch as unknown as typeof fetch);
    expect(ok).toBe(false);
    expect(error).toBe('net error');
  });
});
