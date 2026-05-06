/**
 * synthetics-view.test.tsx
 * Tests for popup/SyntheticsView.tsx: fetch helpers, cancel, daemon-down logic.
 *
 * NOTE: No react-dom / jsdom available — tests cover exported logic functions only,
 * matching the pattern used in other extension tests (position-detector, ticker-detector).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchSynthetics,
  cancelSynthetic,
  paramsSummary,
  truncateId,
  type SyntheticRow,
} from '../../../extension/popup/SyntheticsView';

// ── Test data ─────────────────────────────────────────────────────────────────

const SAMPLE_ROWS: SyntheticRow[] = [
  { id: 'syn-aabbccdd', kind: 'stop_loss',     ticker: 'KX-A', side: 'yes', status: 'armed',    positionSize: 10, params: { triggerPriceCents: 30 } },
  { id: 'syn-eeff0011', kind: 'take_profit',   ticker: 'KX-B', side: 'no',  status: 'fired',    positionSize: 5,  params: { triggerPriceCents: 80 } },
  { id: 'syn-22334455', kind: 'trailing_stop', ticker: 'KX-C', side: 'yes', status: 'canceled', positionSize: 20, params: { trailAmountCents: 5 } },
];

function makeFetch(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json:   () => Promise.resolve(body),
  });
}

// ── paramsSummary ─────────────────────────────────────────────────────────────

describe('paramsSummary', () => {
  it('serialises params to "key: value" pairs', () => {
    expect(paramsSummary({ triggerPriceCents: 30, foo: 'bar' })).toBe('triggerPriceCents: 30, foo: bar');
  });

  it('empty object → empty string', () => {
    expect(paramsSummary({})).toBe('');
  });

  it('single entry', () => {
    expect(paramsSummary({ x: 1 })).toBe('x: 1');
  });
});

// ── truncateId ────────────────────────────────────────────────────────────────

describe('truncateId', () => {
  it('id ≤12 chars passes through', () => {
    expect(truncateId('syn-abc')).toBe('syn-abc');
  });

  it('long id truncated to 8 chars + ellipsis', () => {
    expect(truncateId('syn-aabbccdd1122')).toBe('syn-aabb…');
  });

  it('exactly 12 chars passes through', () => {
    const id = '123456789012';
    expect(truncateId(id)).toBe(id);
  });
});

// ── fetchSynthetics ───────────────────────────────────────────────────────────

describe('fetchSynthetics', () => {
  it('returns rows from array response', async () => {
    const mockFetch = makeFetch(SAMPLE_ROWS);
    const { data, error } = await fetchSynthetics(mockFetch as unknown as typeof fetch);
    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data?.[0].id).toBe('syn-aabbccdd');
    expect(data?.[1].kind).toBe('take_profit');
  });

  it('returns rows from { synthetics: [...] } envelope', async () => {
    const mockFetch = makeFetch({ synthetics: SAMPLE_ROWS });
    const { data, error } = await fetchSynthetics(mockFetch as unknown as typeof fetch);
    expect(error).toBeNull();
    expect(data).toHaveLength(3);
  });

  it('empty array → data is [], error null', async () => {
    const mockFetch = makeFetch([]);
    const { data, error } = await fetchSynthetics(mockFetch as unknown as typeof fetch);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('HTTP error → data null, error set', async () => {
    const mockFetch = makeFetch({}, false);
    const { data, error } = await fetchSynthetics(mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toMatch(/HTTP 500/);
  });

  it('network throws → data null, error set', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const { data, error } = await fetchSynthetics(mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toBe('ECONNREFUSED');
  });

  it('calls correct URL', async () => {
    const mockFetch = makeFetch([]);
    await fetchSynthetics(mockFetch as unknown as typeof fetch);
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7777/synthetics/list');
  });
});

// ── cancelSynthetic ───────────────────────────────────────────────────────────

describe('cancelSynthetic', () => {
  it('sends DELETE to /synthetics/:id and returns true on ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    const result = await cancelSynthetic('syn-aabbccdd', mockFetch as unknown as typeof fetch);
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7777/synthetics/syn-aabbccdd',
      { method: 'DELETE' },
    );
  });

  it('non-ok response → returns false', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false });
    expect(await cancelSynthetic('syn-x', mockFetch as unknown as typeof fetch)).toBe(false);
  });

  it('network throws → returns false', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('net fail'));
    expect(await cancelSynthetic('syn-x', mockFetch as unknown as typeof fetch)).toBe(false);
  });

  it('uses correct ID in URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    await cancelSynthetic('syn-myspecialid', mockFetch as unknown as typeof fetch);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7777/synthetics/syn-myspecialid',
      expect.anything(),
    );
  });
});
