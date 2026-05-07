import { describe, it, expect, vi } from 'vitest';
import { dispatchWebhook, dispatchDesktop, type NotifyPayload } from '../../src/alerts/channels.js';

const samplePayload: NotifyPayload = {
  syntheticId: 'syn-123',
  syntheticKind: 'stop_loss',
  ticker: 'KXTEST',
  message: 'Price dropped below 5¢',
  triggeredAt: '2026-05-06T12:00:00.000Z',
  context: { bidCents: 4 },
};

describe('dispatchWebhook', () => {
  it('returns ok=true for 200 response', async () => {
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 }));
    const result = await dispatchWebhook('https://hook.example.com/alert', samplePayload, fetchFn);
    expect(result.ok).toBe(true);
  });

  it('returns ok=false with reason for 500 response', async () => {
    const fetchFn = vi.fn(async () => ({ ok: false, status: 500 }));
    const result = await dispatchWebhook('https://hook.example.com/alert', samplePayload, fetchFn);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/500/);
  });

  it('returns ok=false with reason on abort/network error', async () => {
    // Simulate fetch throwing an abort-like error immediately
    const fetchFn = vi.fn(async () => {
      const err = new Error('The operation was aborted.');
      (err as any).name = 'AbortError';
      throw err;
    });
    const result = await dispatchWebhook('https://hook.example.com/alert', samplePayload, fetchFn as any);
    expect(result.ok).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('enforces 5s timeout via AbortController (signal is passed to fetch)', async () => {
    let capturedSignal: AbortSignal | null = null;
    const fetchFn = vi.fn(async (_url: string, init: { signal: AbortSignal }) => {
      capturedSignal = init.signal;
      // Immediately abort so the test doesn't hang
      return { ok: true, status: 200 };
    });
    await dispatchWebhook('https://hook.example.com/alert', samplePayload, fetchFn as any);
    expect(capturedSignal).not.toBeNull();
    expect(capturedSignal?.aborted).toBe(false); // not aborted since fetch returned immediately
  });

  it('sends payload with correct shape and Content-Type', async () => {
    let capturedBody: string | null = null;
    let capturedHeaders: Record<string, string> | null = null;
    const fetchFn = vi.fn(async (_url: string, init: { headers: Record<string, string>; body: string }) => {
      capturedBody = init.body;
      capturedHeaders = init.headers;
      return { ok: true, status: 200 };
    });
    await dispatchWebhook('https://hook.example.com/alert', samplePayload, fetchFn as any);
    expect(capturedHeaders?.['Content-Type']).toBe('application/json');
    const parsed = JSON.parse(capturedBody!);
    expect(parsed.syntheticId).toBe('syn-123');
    expect(parsed.ticker).toBe('KXTEST');
    expect(parsed.triggeredAt).toBe('2026-05-06T12:00:00.000Z');
  });

  it('returns ok=false for empty URL', async () => {
    const result = await dispatchWebhook('', samplePayload);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/empty/i);
  });

  it('never throws even on unexpected error', async () => {
    const fetchFn = vi.fn(async () => { throw new Error('network failure'); });
    await expect(
      dispatchWebhook('https://hook.example.com/alert', samplePayload, fetchFn as any),
    ).resolves.toMatchObject({ ok: false });
  });
});

describe('dispatchDesktop', () => {
  it('returns ok=true with injected notifier', async () => {
    const notifierFn = vi.fn(async () => {});
    const result = await dispatchDesktop(samplePayload, notifierFn);
    expect(result.ok).toBe(true);
    expect(notifierFn).toHaveBeenCalledWith(expect.objectContaining({
      message: samplePayload.message,
    }));
  });

  it('returns ok=false when injected notifier throws', async () => {
    const notifierFn = vi.fn(async () => { throw new Error('notifier failed'); });
    const result = await dispatchDesktop(samplePayload, notifierFn);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/notifier failed/);
  });

  it('returns ok=true with console-log fallback (no injected notifier)', async () => {
    // Should not throw and should return ok=true
    const result = await dispatchDesktop(samplePayload);
    expect(result.ok).toBe(true);
  });
});
