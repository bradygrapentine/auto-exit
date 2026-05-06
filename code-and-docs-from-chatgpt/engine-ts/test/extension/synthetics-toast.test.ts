/**
 * synthetics-toast.test.ts
 * Tests for background/synthetics-toast.ts: armed→fired transition detection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pollOnce, knownStatuses, type SyntheticEntry } from '../../../extension/background/synthetics-toast';

function makeEntry(overrides: Partial<SyntheticEntry> = {}): SyntheticEntry {
  return {
    id:          'syn-abc',
    kind:        'stop_loss',
    ticker:      'KX-T',
    side:        'yes',
    status:      'armed',
    params:      { triggerPriceCents: 30 },
    ...overrides,
  };
}

function makeFetch(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  knownStatuses.clear();
});

// ── Normal polling ────────────────────────────────────────────────────────────

describe('pollOnce', () => {
  it('tracks armed entries into knownStatuses', async () => {
    const fetchFn  = makeFetch([makeEntry({ status: 'armed' })]);
    const notifyFn = vi.fn();
    const broadcastFn = vi.fn();
    await pollOnce(fetchFn as unknown as typeof fetch, notifyFn, broadcastFn);
    expect(knownStatuses.get('syn-abc')).toBe('armed');
    expect(notifyFn).not.toHaveBeenCalled();
  });

  it('armed→fired transition fires notify and broadcast', async () => {
    // First poll: armed
    const fetchFn1 = makeFetch([makeEntry({ status: 'armed' })]);
    const notify  = vi.fn();
    const broadcast = vi.fn();
    await pollOnce(fetchFn1 as unknown as typeof fetch, notify, broadcast);
    expect(knownStatuses.get('syn-abc')).toBe('armed');

    // Second poll: fired
    const fetchFn2 = makeFetch([makeEntry({ status: 'fired' })]);
    await pollOnce(fetchFn2 as unknown as typeof fetch, notify, broadcast);

    expect(notify).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith(
      'syn-abc',
      'Synthetic fired',
      'stop_loss on KX-T (yes) fired',
    );
    expect(broadcast).toHaveBeenCalledOnce();
    expect(broadcast.mock.calls[0][0]).toMatchObject({ id: 'syn-abc', status: 'fired' });
  });

  it('fired without prior armed does not fire notify', async () => {
    const fetchFn = makeFetch([makeEntry({ status: 'fired' })]);
    const notify  = vi.fn();
    await pollOnce(fetchFn as unknown as typeof fetch, notify, vi.fn());
    expect(notify).not.toHaveBeenCalled();
  });

  it('canceled status removes entry from tracking', async () => {
    knownStatuses.set('syn-abc', 'armed');
    const fetchFn = makeFetch([makeEntry({ status: 'canceled' })]);
    await pollOnce(fetchFn as unknown as typeof fetch, vi.fn(), vi.fn());
    expect(knownStatuses.has('syn-abc')).toBe(false);
  });

  it('entry removed from list clears knownStatuses', async () => {
    knownStatuses.set('syn-abc', 'armed');
    const fetchFn = makeFetch([]); // empty list
    await pollOnce(fetchFn as unknown as typeof fetch, vi.fn(), vi.fn());
    expect(knownStatuses.has('syn-abc')).toBe(false);
  });

  it('handles { synthetics: [...] } envelope', async () => {
    const fetchFn = makeFetch({ synthetics: [makeEntry({ status: 'armed' })] });
    await pollOnce(fetchFn as unknown as typeof fetch, vi.fn(), vi.fn());
    expect(knownStatuses.get('syn-abc')).toBe('armed');
  });

  it('multiple armed entries tracked independently', async () => {
    const entries: SyntheticEntry[] = [
      makeEntry({ id: 'syn-1', status: 'armed' }),
      makeEntry({ id: 'syn-2', status: 'armed' }),
    ];
    const fetchFn = makeFetch(entries);
    await pollOnce(fetchFn as unknown as typeof fetch, vi.fn(), vi.fn());
    expect(knownStatuses.get('syn-1')).toBe('armed');
    expect(knownStatuses.get('syn-2')).toBe('armed');
  });

  it('two separate armed→fired transitions both fire notifications', async () => {
    // Seed two armed entries
    knownStatuses.set('syn-1', 'armed');
    knownStatuses.set('syn-2', 'armed');
    const fired = [
      makeEntry({ id: 'syn-1', status: 'fired' }),
      makeEntry({ id: 'syn-2', status: 'fired' }),
    ];
    const fetchFn = makeFetch(fired);
    const notify  = vi.fn();
    await pollOnce(fetchFn as unknown as typeof fetch, notify, vi.fn());
    expect(notify).toHaveBeenCalledTimes(2);
  });
});

// ── Daemon down ───────────────────────────────────────────────────────────────

describe('pollOnce daemon-down', () => {
  it('network error → silent, no notify', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const notify  = vi.fn();
    await pollOnce(fetchFn as unknown as typeof fetch, notify, vi.fn());
    expect(notify).not.toHaveBeenCalled();
  });

  it('non-ok response → silent, no notify', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    const notify  = vi.fn();
    await pollOnce(fetchFn as unknown as typeof fetch, notify, vi.fn());
    expect(notify).not.toHaveBeenCalled();
  });
});
