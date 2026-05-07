/**
 * profile-selector.test.tsx
 * Tests for popup/ProfileSelector.tsx: logic helpers and fetch functions.
 *
 * NOTE: No react-dom / jsdom — logic-only pattern per extension test convention.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  fetchWhoAmI,
  switchProfile,
  resolveBadgeStyle,
  resolveBadgeLabel,
  type WhoAmIResponse,
} from '../../../extension/popup/ProfileSelector';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

// ── resolveBadgeLabel ────────────────────────────────────────────────────────

describe('resolveBadgeLabel', () => {
  it('returns demo for default profile', () => {
    expect(resolveBadgeLabel('default')).toBe('demo');
  });

  it('returns prod when name includes prod', () => {
    expect(resolveBadgeLabel('prod')).toBe('prod');
  });

  it('returns prod for prod-live', () => {
    expect(resolveBadgeLabel('prod-live')).toBe('prod');
  });

  it('returns demo for staging', () => {
    expect(resolveBadgeLabel('staging')).toBe('demo');
  });

  it('case-insensitive: PROD maps to prod', () => {
    expect(resolveBadgeLabel('PROD')).toBe('prod');
  });
});

// ── resolveBadgeStyle ─────────────────────────────────────────────────────────

describe('resolveBadgeStyle', () => {
  it('demo profile → green background', () => {
    const style = resolveBadgeStyle('default');
    expect(style.background).toBe('#16a34a');
  });

  it('prod profile → red background', () => {
    const style = resolveBadgeStyle('prod');
    expect(style.background).toBe('#dc2626');
  });

  it('prod-live profile → red background', () => {
    const style = resolveBadgeStyle('prod-live');
    expect(style.background).toBe('#dc2626');
  });

  it('returns object with padding', () => {
    const style = resolveBadgeStyle('default');
    expect(style.padding).toBeTruthy();
  });
});

// ── fetchWhoAmI ───────────────────────────────────────────────────────────────

describe('fetchWhoAmI', () => {
  it('returns data on 200', async () => {
    const resp: WhoAmIResponse = { active: 'default', available: ['default'] };
    const { data, error } = await fetchWhoAmI(makeFetch(resp) as unknown as typeof fetch);
    expect(error).toBeNull();
    expect(data?.active).toBe('default');
    expect(data?.available).toEqual(['default']);
  });

  it('returns error on 404', async () => {
    const { data, error } = await fetchWhoAmI(makeFetch({}, 404) as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toMatch(/404/);
  });

  it('returns error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const { data, error } = await fetchWhoAmI(mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toBe('Network error');
  });

  it('passes serverUrl correctly', async () => {
    const mockFetch = makeFetch({ active: 'x', available: ['x'] });
    await fetchWhoAmI(mockFetch as unknown as typeof fetch, 'http://custom:9999');
    expect(mockFetch).toHaveBeenCalledWith('http://custom:9999/whoami');
  });
});

// ── switchProfile ─────────────────────────────────────────────────────────────

describe('switchProfile', () => {
  it('returns updated data on 200', async () => {
    const resp: WhoAmIResponse = { active: 'prod', available: ['default', 'prod'] };
    const { data, error, notImplemented } = await switchProfile('prod', makeFetch(resp) as unknown as typeof fetch);
    expect(error).toBeNull();
    expect(notImplemented).toBeFalsy();
    expect(data?.active).toBe('prod');
  });

  it('returns notImplemented=true on 501', async () => {
    const { data, error, notImplemented } = await switchProfile('prod', makeFetch({}, 501) as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toBeNull();
    expect(notImplemented).toBe(true);
  });

  it('returns error on 400', async () => {
    const { data, error } = await switchProfile('bad', makeFetch({ error: 'not found' }, 400) as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toMatch(/400/);
  });

  it('returns error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('timeout'));
    const { data, error } = await switchProfile('prod', mockFetch as unknown as typeof fetch);
    expect(data).toBeNull();
    expect(error).toBe('timeout');
  });

  it('sends correct POST body', async () => {
    const mockFetch = makeFetch({ active: 'prod', available: ['default', 'prod'] });
    await switchProfile('prod', mockFetch as unknown as typeof fetch);
    const call = mockFetch.mock.calls[0];
    expect(call[1]?.method).toBe('POST');
    const body = JSON.parse(call[1]?.body as string);
    expect(body.profile).toBe('prod');
  });
});
