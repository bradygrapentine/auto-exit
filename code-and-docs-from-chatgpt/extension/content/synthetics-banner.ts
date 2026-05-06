/**
 * synthetics-banner.ts — content script
 * Listens for KEA_SYNTHETIC_FIRED messages from the background worker
 * and shows a temporary in-page toast banner.
 */

export interface FiredEntry {
  id: string;
  kind: string;
  ticker: string;
  side: 'yes' | 'no';
  status: string;
}

export function showFiredBanner(entry: FiredEntry, doc: Document = document): void {
  const banner = doc.createElement('div');
  banner.id = `kea-banner-${entry.id}`;
  banner.setAttribute('data-kea-banner', '1');
  banner.textContent = `Synthetic fired: ${entry.kind} on ${entry.ticker} (${entry.side})`;
  Object.assign(banner.style, {
    position:     'fixed',
    top:          '16px',
    right:        '16px',
    background:   '#16a34a',
    color:        '#fff',
    padding:      '10px 16px',
    borderRadius: '6px',
    fontFamily:   'system-ui, sans-serif',
    fontSize:     '13px',
    boxShadow:    '0 4px 16px rgba(0,0,0,0.2)',
    zIndex:       '2147483647',
    transition:   'opacity 0.4s',
  });

  doc.body.appendChild(banner);

  // Auto-dismiss after 4s
  setTimeout(() => {
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 400);
  }, 4_000);
}

/* c8 ignore next 8 */
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'KEA_SYNTHETIC_FIRED' && message.entry) {
      showFiredBanner(message.entry as FiredEntry, document);
    }
  });
}
