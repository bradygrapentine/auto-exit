/**
 * wsBookTracker.ts — SH-SCANNER-WS Task 3
 *
 * In-memory book state per ticker, fed by the Kalshi WS `orderbook_delta`
 * channel. Receives:
 *   - One `orderbook_snapshot` per ticker on subscribe (full state)
 *   - `orderbook_delta` events thereafter (incremental size adjustments)
 *
 * Emits a synthesized `Orderbook` (same shape as REST) for downstream use,
 * sorted yes-bids descending and no-bids ascending — matching what
 * `parseOrderbookResponse` produces for the REST path.
 */

import type { Orderbook, PriceLevel } from './types.js';
import type { WsMessage } from './wsClient.js';

/** Per-side level map: priceCents → sizeFp. */
type SideMap = Map<number, number>;

interface TickerBook {
  yes: SideMap;
  no: SideMap;
  /** Last applied seq, for gap detection. */
  lastSeq: number;
  /** Wall-clock ms of the most recent message — used for stale-book detection. */
  lastUpdateMs: number;
}

/** Convert "0.0400" → 4 (priceCents, integer). */
function priceDollarsToCents(s: string): number {
  return Math.round(parseFloat(s) * 100);
}

export class WsBookTracker {
  private books = new Map<string, TickerBook>();
  private gapCount = 0;

  /** Apply one parsed Kalshi WS message. */
  apply(msg: WsMessage): void {
    const ticker = msg.msg?.['market_ticker'] as string | undefined;
    if (!ticker) return;

    if (msg.type === 'orderbook_snapshot') {
      const yesArr = (msg.msg?.['yes_dollars_fp'] as Array<[string, string]> | undefined) ?? [];
      const noArr  = (msg.msg?.['no_dollars_fp']  as Array<[string, string]> | undefined) ?? [];
      const yes: SideMap = new Map();
      const no:  SideMap = new Map();
      for (const [price, size] of yesArr) yes.set(priceDollarsToCents(price), parseFloat(size));
      for (const [price, size] of noArr)  no.set(priceDollarsToCents(price),  parseFloat(size));
      this.books.set(ticker, {
        yes, no,
        lastSeq: typeof msg.seq === 'number' ? msg.seq : 0,
        lastUpdateMs: Date.now(),
      });
      return;
    }

    if (msg.type === 'orderbook_delta') {
      const book = this.books.get(ticker);
      if (!book) {
        // Delta arrived before snapshot — drop. Caller should have subscribed
        // and waited for the initial snapshot.
        return;
      }
      const seq = typeof msg.seq === 'number' ? msg.seq : 0;
      if (seq > 0 && book.lastSeq > 0 && seq !== book.lastSeq + 1) {
        this.gapCount++;
      }
      book.lastSeq = seq;
      book.lastUpdateMs = Date.now();

      const side = msg.msg?.['side'] as 'yes' | 'no' | undefined;
      const priceStr = msg.msg?.['price_dollars'] as string | undefined;
      const deltaStr = msg.msg?.['delta_fp'] as string | undefined;
      if (!side || !priceStr || deltaStr === undefined) return;
      const price = priceDollarsToCents(priceStr);
      const delta = parseFloat(deltaStr);
      const sideMap = book[side];
      const cur = sideMap.get(price) ?? 0;
      const next = cur + delta;
      if (Math.abs(next) < 1e-6) sideMap.delete(price);
      else sideMap.set(price, next);
    }
  }

  /**
   * Return the current top-N book for a ticker as an `Orderbook` matching
   * the REST shape. Yes side sorted descending (best bid first), no side
   * sorted ascending (best NO bid first by price).
   */
  getSnapshot(ticker: string, depth = 20): Orderbook | null {
    const book = this.books.get(ticker);
    if (!book) return null;
    const yes: PriceLevel[] = [...book.yes.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, depth)
      .map(([priceCents, size]) => ({ priceCents, size }));
    const no: PriceLevel[] = [...book.no.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, depth)
      .map(([priceCents, size]) => ({ priceCents, size }));
    return { yes, no };
  }

  /** True if a snapshot has arrived for this ticker. */
  hasBook(ticker: string): boolean {
    return this.books.has(ticker);
  }

  /** ms since last update for the ticker, or null if never. */
  msSinceLastUpdate(ticker: string): number | null {
    const book = this.books.get(ticker);
    if (!book) return null;
    return Date.now() - book.lastUpdateMs;
  }

  /** Number of out-of-order / dropped seq events observed. */
  getGapCount(): number { return this.gapCount; }

  /** Drop a ticker's state — used on resubscribe to a stale ticker. */
  forget(ticker: string): void { this.books.delete(ticker); }

  /** All tickers currently tracked. */
  tickers(): string[] { return [...this.books.keys()]; }
}
