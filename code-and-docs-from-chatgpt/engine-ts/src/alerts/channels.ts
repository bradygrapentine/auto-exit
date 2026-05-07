/**
 * Alert channel dispatch — webhook (HTTP POST) and desktop notification.
 *
 * Both functions are non-throwing: failures return { ok: false, reason }.
 * This ensures a broken delivery channel never crashes the watcher.
 *
 * node-notifier is NOT in package.json — desktop channel falls back to
 * console.log("DESKTOP ALERT: ...") in v1. Flag surfaced in PR summary.
 */
import type { SyntheticKind } from '../types.js';

export interface NotifyPayload {
  syntheticId: string;
  syntheticKind: SyntheticKind;
  ticker: string;
  message: string;
  triggeredAt: string;   // ISO8601
  context: Record<string, unknown>;
}

export interface DispatchResult {
  ok: boolean;
  reason?: string;
}

/** Injectable fetch type for testing. */
export type FetchFn = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal },
) => Promise<{ ok: boolean; status: number }>;

/**
 * POST JSON payload to a webhook URL.
 * 5-second timeout enforced via AbortController.
 * Never throws — returns { ok: false, reason } on any failure.
 */
export async function dispatchWebhook(
  url: string,
  payload: NotifyPayload,
  fetchInjectable?: FetchFn,
): Promise<DispatchResult> {
  if (!url || url.trim() === '') {
    return { ok: false, reason: 'webhookUrl is empty' };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  const fetchFn: FetchFn = fetchInjectable ?? (async (u, init) => {
    const res = await fetch(u, init);
    return { ok: res.ok, status: res.status };
  });

  try {
    const result = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!result.ok) {
      return { ok: false, reason: `HTTP ${result.status}` };
    }
    return { ok: true };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: msg.includes('abort') ? 'timeout' : msg };
  }
}

/** Injectable notifier type for testing. */
export type NotifierFn = (opts: {
  title: string;
  message: string;
}) => Promise<void>;

/**
 * Dispatch a desktop notification.
 *
 * node-notifier is NOT installed — v1 falls back to console.log.
 * This is flagged in the PR summary; operator can add node-notifier as a dep to enable real toasts.
 */
export async function dispatchDesktop(
  payload: NotifyPayload,
  notifierInjectable?: NotifierFn,
): Promise<DispatchResult> {
  const title = `Kalshi alert — ${payload.ticker}`;
  const message = payload.message;

  if (notifierInjectable) {
    try {
      await notifierInjectable({ title, message });
      return { ok: true };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return { ok: false, reason };
    }
  }

  // Fallback: console-log when node-notifier is absent
  console.log(`DESKTOP ALERT: [${title}] ${message}`);
  return { ok: true };
}
