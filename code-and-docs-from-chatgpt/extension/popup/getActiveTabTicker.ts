/**
 * getActiveTabTicker.ts — popup helper
 *
 * Reads the active browser tab's URL via chrome.tabs and extracts a Kalshi
 * ticker from the path (e.g. /markets/KXBTC-26MAY09H1700-B85000 → KXBTC-...).
 * Returns null when the active tab isn't a Kalshi page or chrome.tabs is
 * unavailable (e.g. unit tests without the chrome global).
 */

import { detectTickerFromPath } from '../content/ticker-detector.js';

interface ChromeTab {
  url?: string;
}

interface ChromeTabsApi {
  query(
    info: { active: boolean; currentWindow: boolean },
    cb: (tabs: ChromeTab[]) => void,
  ): void;
}

interface ChromeGlobal {
  tabs?: ChromeTabsApi;
}

declare const chrome: ChromeGlobal | undefined;

/** Extract ticker from the URL of the active tab. Returns null on miss. */
export async function getActiveTabTicker(): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.tabs) return null;
  return new Promise<string | null>((resolve) => {
    chrome.tabs!.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs?.[0]?.url;
      if (!url) return resolve(null);
      try {
        const u = new URL(url);
        if (!/(^|\.)kalshi\.com$/.test(u.hostname)) return resolve(null);
        resolve(detectTickerFromPath(u.pathname));
      } catch {
        resolve(null);
      }
    });
  });
}
