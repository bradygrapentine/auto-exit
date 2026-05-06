/**
 * synthetics-toast.ts — background service worker module
 * Polls /synthetics/list and fires chrome notifications + posts in-page banners
 * on armed→fired transitions.
 */

const ENGINE_BASE = 'http://localhost:7777';
const POLL_INTERVAL_MS = 5_000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface SyntheticEntry {
  id: string;
  kind: string;
  ticker: string;
  side: 'yes' | 'no';
  status: string;
  params: Record<string, unknown>;
}

// ── State ─────────────────────────────────────────────────────────────────────

/** Map of id → last-known status (only armed entries tracked) */
const knownStatuses = new Map<string, string>();

// ── Polling ──────────────────────────────────────────────────────────────────

export async function pollOnce(
  fetchFn: typeof fetch = fetch,
  notifyFn: (id: string, title: string, message: string) => void = defaultNotify,
  broadcastFn: (entry: SyntheticEntry) => void = defaultBroadcast,
): Promise<void> {
  let entries: SyntheticEntry[];

  try {
    const res = await fetchFn(`${ENGINE_BASE}/synthetics/list`);
    if (!res.ok) return;
    const json = await res.json() as { synthetics?: SyntheticEntry[] } | SyntheticEntry[];
    entries = Array.isArray(json) ? json : (json as { synthetics?: SyntheticEntry[] }).synthetics ?? [];
  } catch {
    return; // daemon offline — silent
  }

  for (const entry of entries) {
    const prev = knownStatuses.get(entry.id);

    if (entry.status === 'armed') {
      // Track armed entries
      knownStatuses.set(entry.id, 'armed');
    } else if (prev === 'armed' && entry.status === 'fired') {
      // Transition: armed → fired
      const title = 'Synthetic fired';
      const message = `${entry.kind} on ${entry.ticker} (${entry.side}) fired`;
      notifyFn(entry.id, title, message);
      broadcastFn(entry);
      knownStatuses.set(entry.id, 'fired');
    } else if (entry.status !== 'armed') {
      // Terminal state — stop tracking
      knownStatuses.delete(entry.id);
    }
  }

  // Remove stale entries (no longer in list)
  const currentIds = new Set(entries.map((e) => e.id));
  for (const id of knownStatuses.keys()) {
    if (!currentIds.has(id)) knownStatuses.delete(id);
  }
}

// ── Notification helpers ──────────────────────────────────────────────────────

function defaultNotify(id: string, title: string, message: string): void {
  /* c8 ignore next 10 */
  if (typeof chrome !== 'undefined' && chrome.notifications) {
    chrome.notifications.create(`kea-fired-${id}`, {
      type:    'basic',
      iconUrl: 'icons/icon48.png',
      title,
      message,
    });
  }
}

function defaultBroadcast(entry: SyntheticEntry): void {
  /* c8 ignore next 10 */
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ url: ['https://kalshi.com/*', 'https://*.kalshi.com/*'] }, (tabs) => {
      for (const tab of tabs) {
        if (tab.id != null) {
          chrome.tabs.sendMessage(tab.id, {
            type:  'KEA_SYNTHETIC_FIRED',
            entry,
          });
        }
      }
    });
  }
}

// ── Background message handler for fired banner ───────────────────────────────
/* c8 ignore next 20 */
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'KEA_SYNTHETICS_LIST') {
      fetch(`${ENGINE_BASE}/synthetics/list`)
        .then((r) => r.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true;
    }
  });
}

// ── Start polling loop ────────────────────────────────────────────────────────
/* c8 ignore next 5 */
if (typeof chrome !== 'undefined') {
  setInterval(() => { pollOnce(); }, POLL_INTERVAL_MS);
}

// Exports for tests
export { knownStatuses, POLL_INTERVAL_MS };
