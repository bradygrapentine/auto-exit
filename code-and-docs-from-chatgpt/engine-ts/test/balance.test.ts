import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPortfolioNAVDollars, _resetBalanceCache } from '../src/balance.js';

describe('getPortfolioNAVDollars', () => {
  beforeEach(() => { _resetBalanceCache(); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('calls fetchBalanceDollars on first call and caches result for 10s', async () => {
    const fetcher = { fetchBalanceDollars: vi.fn().mockResolvedValue(123.45) };
    const a = await getPortfolioNAVDollars(fetcher as any);
    const b = await getPortfolioNAVDollars(fetcher as any);
    expect(a).toBe(123.45);
    expect(b).toBe(123.45);
    expect(fetcher.fetchBalanceDollars).toHaveBeenCalledTimes(1);
  });

  it('refetches after TTL expires', async () => {
    const fetcher = { fetchBalanceDollars: vi.fn()
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(200) };
    expect(await getPortfolioNAVDollars(fetcher as any)).toBe(100);
    vi.advanceTimersByTime(10_001);
    expect(await getPortfolioNAVDollars(fetcher as any)).toBe(200);
    expect(fetcher.fetchBalanceDollars).toHaveBeenCalledTimes(2);
  });

  it('returns 0 and logs on fetch failure (does not throw)', async () => {
    const fetcher = { fetchBalanceDollars: vi.fn().mockRejectedValue(new Error('network')) };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getPortfolioNAVDollars(fetcher as any);
    expect(result).toBe(0);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
