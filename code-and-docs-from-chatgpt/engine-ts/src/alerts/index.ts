/**
 * Alert dispatch orchestrator — deduplication + per-channel dispatch + journal.
 *
 * Journal kinds are cast via jk() to avoid touching types.ts, following the
 * same pattern as multiLeg.ts / limitLadder.ts / aggressive.ts.
 *
 * Journal kinds emitted:
 *   alert_dispatched       — at least one channel succeeded
 *   alert_dispatch_failed  — channel dispatch returned ok=false
 *   alert_deduped          — suppressed within cooldown window
 *   alert_no_channels      — action='notify' but notifyChannels[] is empty
 */
import type { Synthetic } from '../types.js';
import type { Journal } from '../journal.js';
import type { JournalKind } from '../types.js';
import {
  dispatchWebhook,
  dispatchDesktop,
  type NotifyPayload,
  type FetchFn,
  type NotifierFn,
} from './channels.js';
import { checkAndRecord, DEFAULT_COOLDOWN_MS } from './dedupe.js';

/** Cast an arbitrary string to JournalKind without touching types.ts. */
function jk(s: string): JournalKind {
  return s as JournalKind;
}

export interface AlertContext {
  message: string;
  context?: Record<string, unknown>;
  nowMs?: number;
  cooldownMs?: number;
  /** Dependency injection for webhook fetch (tests). */
  fetchFn?: FetchFn;
  /** Dependency injection for desktop notifier (tests). */
  notifierFn?: NotifierFn;
}

export interface AlertDispatchResult {
  kind: 'notified' | 'deduped' | 'no_channels';
  syntheticId: string;
}

/**
 * Top-level entry point: called from synthetics/invoke.ts when action='notify'.
 *
 * 1. Dedupe check — suppress if within cooldown window.
 * 2. Validate notifyChannels[] is non-empty.
 * 3. Dispatch to each channel; journal per-channel success/failure.
 */
export async function dispatch(
  synthetic: Synthetic,
  ctx: AlertContext,
  journal: Journal,
): Promise<AlertDispatchResult> {
  const nowMs = ctx.nowMs ?? Date.now();
  const cooldownMs = ctx.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const syntheticId = synthetic.id;

  // 1. Dedupe check
  if (checkAndRecord(syntheticId, nowMs, cooldownMs)) {
    journal.append(jk('alert_deduped'), { syntheticId, ticker: synthetic.ticker });
    return { kind: 'deduped', syntheticId };
  }

  // 2. Channel validation
  const channels = synthetic.notifyChannels ?? [];
  if (channels.length === 0) {
    journal.append(jk('alert_no_channels'), { syntheticId, ticker: synthetic.ticker });
    return { kind: 'no_channels', syntheticId };
  }

  const payload: NotifyPayload = {
    syntheticId,
    syntheticKind: synthetic.kind,
    ticker: synthetic.ticker,
    message: ctx.message,
    triggeredAt: new Date(nowMs).toISOString(),
    context: ctx.context ?? {},
  };

  // 3. Dispatch per channel
  for (const channel of channels) {
    let result: { ok: boolean; reason?: string };

    if (channel.kind === 'webhook') {
      if (!channel.webhookUrl || channel.webhookUrl.trim() === '') {
        result = { ok: false, reason: 'webhook channel missing webhookUrl' };
      } else {
        result = await dispatchWebhook(channel.webhookUrl, payload, ctx.fetchFn);
      }
    } else {
      // desktop
      result = await dispatchDesktop(payload, ctx.notifierFn);
    }

    if (result.ok) {
      journal.append(jk('alert_dispatched'), {
        syntheticId,
        ticker: synthetic.ticker,
        channel: channel.kind,
        webhookUrl: channel.kind === 'webhook' ? channel.webhookUrl : undefined,
      });
    } else {
      journal.append(jk('alert_dispatch_failed'), {
        syntheticId,
        ticker: synthetic.ticker,
        channel: channel.kind,
        reason: result.reason,
      });
    }
  }

  return { kind: 'notified', syntheticId };
}
