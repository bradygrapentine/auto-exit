/**
 * synthetics-register.test.ts — SP3.3
 *
 * Covers extension popup helpers added in SP3.3:
 *  - registerSynthetic POST contract
 *  - getActiveTabTicker chrome.tabs path
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerSynthetic } from '../../../extension/popup/SyntheticsView';
import { getActiveTabTicker } from '../../../extension/popup/getActiveTabTicker';

function makeFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('registerSynthetic', () => {
  it('posts to /synthetics/register with the payload and returns id on success', async () => {
    const fetchFn = makeFetch({ id: 'syn-deadbeef' });
    const out = await registerSynthetic(
      {
        kind: 'stop_loss',
        ticker: 'KXBTC-26MAY09H1700-B85000',
        side: 'yes',
        positionSize: 10,
        params: { triggerPriceCents: 30 },
      },
      fetchFn,
    );
    expect(out).toEqual({ id: 'syn-deadbeef', error: null });
    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toMatch(/\/synthetics\/register$/);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.kind).toBe('stop_loss');
    expect(body.params.triggerPriceCents).toBe(30);
  });

  it('returns error when server responds non-2xx', async () => {
    const fetchFn = makeFetch({ error: 'Watcher not initialized' }, false, 503);
    const out = await registerSynthetic(
      { kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 1, params: {} },
      fetchFn,
    );
    expect(out.id).toBeNull();
    expect(out.error).toBe('Watcher not initialized');
  });

  it('returns error on fetch throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('econn refused'));
    const out = await registerSynthetic(
      { kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 1, params: {} },
      fetchFn,
    );
    expect(out.id).toBeNull();
    expect(out.error).toBe('econn refused');
  });
});

describe('getActiveTabTicker', () => {
  let originalChrome: unknown;

  beforeEach(() => {
    originalChrome = (globalThis as { chrome?: unknown }).chrome;
  });

  afterEach(() => {
    (globalThis as { chrome?: unknown }).chrome = originalChrome;
  });

  function mockChromeTabs(url: string | undefined): void {
    (globalThis as { chrome?: unknown }).chrome = {
      tabs: {
        query: (
          _info: unknown,
          cb: (tabs: { url?: string }[]) => void,
        ) => cb(url === undefined ? [] : [{ url }]),
      },
    };
  }

  it('returns null when chrome global is unavailable', async () => {
    delete (globalThis as { chrome?: unknown }).chrome;
    expect(await getActiveTabTicker()).toBeNull();
  });

  it('returns ticker from a Kalshi market URL', async () => {
    mockChromeTabs('https://kalshi.com/markets/KXBTC-26MAY09H1700-B85000/something');
    expect(await getActiveTabTicker()).toBe('KXBTC-26MAY09H1700-B85000');
  });

  it('returns null for non-Kalshi tabs', async () => {
    mockChromeTabs('https://example.com/markets/KX-X');
    expect(await getActiveTabTicker()).toBeNull();
  });

  it('returns null when no Kalshi ticker is in the path', async () => {
    mockChromeTabs('https://kalshi.com/portfolio');
    expect(await getActiveTabTicker()).toBeNull();
  });

  it('returns null when no active tab', async () => {
    mockChromeTabs(undefined);
    expect(await getActiveTabTicker()).toBeNull();
  });
});
