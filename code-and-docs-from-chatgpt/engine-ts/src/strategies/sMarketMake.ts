/**
 * sMarketMake.ts — S12 Market-Making: two-sided GTC quote maintenance.
 *
 * Maintains a resting bid and ask inside the spread. On each poll cycle:
 *   1. Fetch top-of-book.
 *   2. Compute desired bid = topBid + quoteOffsetCents,
 *                ask = topAsk − quoteOffsetCents.
 *   3. If either quote is stale (price drifted), cancel + repost.
 *   4. Check fills via getOrderStatusInvoke; update currentInventory + journal mm_fill.
 *   5. If inventory ≥ maxInventory (long) or ≤ −maxInventory (short), flatten to
 *      targetInventory, then return to two-sided.
 *   6. If book is empty on either side: halt + journal mm_empty_book.
 *
 * Hard non-goals (do NOT add):
 *   - No multi-venue routing
 *   - No tick-skewing based on inventory direction
 *   - No dynamic quoteOffsetCents
 *   - No PnL tracking (use kea_tca_summary post-run)
 *   - No reservation prices / Avellaneda-Stoikov
 *   - No order-book imbalance signals
 *
 * File-touch boundary: this file only. Does NOT edit types.ts or journal.ts.
 * Journal kinds cast via jk() to avoid touching types.ts.
 */

import { Journal, generateJobId } from '../journal.js';
import type { JournalKind } from '../types.js';
import type {
  S12Config,
  S12Result,
} from '../marketMaking.js';

export type { S12Config, S12Result };

// Cast unknown string → JournalKind without touching types.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

const DEFAULT_POLL_INTERVAL_MS = 1_000;

// ── Validation ────────────────────────────────────────────────────────────────

function validateConfig(cfg: S12Config): void {
  if (!cfg.ticker || cfg.ticker.trim().length === 0) {
    throw new Error('S12Config: ticker must be non-empty');
  }
  if (cfg.targetInventory < 0) {
    throw new Error('S12Config: targetInventory must be ≥ 0');
  }
  if (cfg.maxInventory <= cfg.targetInventory) {
    throw new Error('S12Config: maxInventory must be > targetInventory');
  }
  if (cfg.quoteOffsetCents < 0) {
    throw new Error('S12Config: quoteOffsetCents must be ≥ 0');
  }
  if (typeof cfg.postOrderInvoke !== 'function') {
    throw new Error('S12Config: postOrderInvoke must be a function');
  }
  if (typeof cfg.cancelOrderInvoke !== 'function') {
    throw new Error('S12Config: cancelOrderInvoke must be a function');
  }
  if (typeof cfg.getOrderStatusInvoke !== 'function') {
    throw new Error('S12Config: getOrderStatusInvoke must be a function');
  }
  if (typeof cfg.getTopOfBookInvoke !== 'function') {
    throw new Error('S12Config: getTopOfBookInvoke must be a function');
  }
  if (typeof cfg.aggressiveFlattenInvoke !== 'function') {
    throw new Error('S12Config: aggressiveFlattenInvoke must be a function');
  }
}

// ── Internal quote state ──────────────────────────────────────────────────────

interface QuoteState {
  orderId: string;
  priceCents: number;
  /** Qty posted — used to compute fill delta. */
  postedQty: number;
  /** Last known filled amount. */
  knownFilled: number;
}

// ── Runner ────────────────────────────────────────────────────────────────────

export class MarketMakingRunner {
  private readonly config: S12Config;
  private readonly journal: Journal;
  private readonly jobId: string;
  private stopped = false;

  constructor(config: S12Config, journal?: Journal | unknown) {
    validateConfig(config);
    this.config = config;
    this.jobId = config.jobId ?? generateJobId();
    this.journal = (journal instanceof Journal)
      ? journal
      : new Journal(this.jobId, config.keaHome);
  }

  /** Signal the runner to stop gracefully after the current poll cycle. */
  stop(): void {
    this.stopped = true;
  }

  async run(): Promise<S12Result> {
    const {
      ticker,
      targetInventory,
      maxInventory,
      quoteOffsetCents,
      postOrderInvoke,
      cancelOrderInvoke,
      getOrderStatusInvoke,
      getTopOfBookInvoke,
      aggressiveFlattenInvoke,
      sleepMs = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    } = this.config;

    const pollIntervalMs = this.config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

    let currentInventory = targetInventory;
    let bidQuote: QuoteState | null = null;
    let askQuote: QuoteState | null = null;

    this.journal.append(jk('mm_started'), {
      ticker,
      targetInventory,
      maxInventory,
      quoteOffsetCents,
      pollIntervalMs,
      jobId: this.jobId,
    });

    // ── Main loop ─────────────────────────────────────────────────────────────
    while (!this.stopped) {
      // 1. Fetch top of book.
      const book = await getTopOfBookInvoke(ticker);

      // 2. Guard: empty book on either side → halt.
      if (book.bidCents === null || book.askCents === null) {
        // Cancel any open quotes idempotently before halting.
        await this._cancelQuote(bidQuote, cancelOrderInvoke);
        await this._cancelQuote(askQuote, cancelOrderInvoke);
        bidQuote = null;
        askQuote = null;

        this.journal.append(jk('mm_empty_book'), {
          ticker,
          bidCents: book.bidCents,
          askCents: book.askCents,
          currentInventory,
        });
        return { reason: 'empty_book', finalInventory: currentInventory };
      }

      // 3. Compute desired quote prices.
      const desiredBidCents = book.bidCents + quoteOffsetCents;
      const desiredAskCents = book.askCents - quoteOffsetCents;

      // 4. Check fills on existing quotes.
      if (bidQuote !== null) {
        const status = await getOrderStatusInvoke(bidQuote.orderId);
        const newFilled = status.filled - bidQuote.knownFilled;
        if (newFilled > 0) {
          currentInventory += newFilled;
          bidQuote.knownFilled = status.filled;
          this.journal.append(jk('mm_fill'), {
            side: 'bid',
            orderId: bidQuote.orderId,
            qty: newFilled,
            currentInventory,
          });
        }
      }

      if (askQuote !== null) {
        const status = await getOrderStatusInvoke(askQuote.orderId);
        const newFilled = status.filled - askQuote.knownFilled;
        if (newFilled > 0) {
          currentInventory -= newFilled;
          askQuote.knownFilled = status.filled;
          this.journal.append(jk('mm_fill'), {
            side: 'ask',
            orderId: askQuote.orderId,
            qty: newFilled,
            currentInventory,
          });
        }
      }

      // 5. Inventory cap check — long side.
      if (currentInventory >= maxInventory) {
        this.journal.append(jk('mm_inventory_capped'), {
          side: 'long',
          currentInventory,
          maxInventory,
          targetInventory,
        });

        // Cancel bid to stop buying more.
        await this._cancelQuote(bidQuote, cancelOrderInvoke);
        bidQuote = null;

        // Flatten to targetInventory.
        const flattenQty = currentInventory - targetInventory;
        if (flattenQty > 0) {
          this.journal.append(jk('mm_flatten_started'), {
            side: 'long',
            flattenQty,
            currentInventory,
            targetInventory,
          });

          const result = await aggressiveFlattenInvoke(ticker, 'yes', flattenQty);
          currentInventory -= result.filled;

          this.journal.append(jk('mm_flatten_complete'), {
            side: 'long',
            filled: result.filled,
            currentInventory,
          });
        }

        // Continue the loop to re-evaluate and re-post two-sided.
        continue;
      }

      // 5b. Inventory cap check — short side.
      if (currentInventory <= -maxInventory) {
        this.journal.append(jk('mm_inventory_capped'), {
          side: 'short',
          currentInventory,
          maxInventory,
          targetInventory,
        });

        // Cancel ask to stop selling more.
        await this._cancelQuote(askQuote, cancelOrderInvoke);
        askQuote = null;

        // Flatten short: buy to reach targetInventory.
        const flattenQty = targetInventory - currentInventory; // positive
        if (flattenQty > 0) {
          this.journal.append(jk('mm_flatten_started'), {
            side: 'short',
            flattenQty,
            currentInventory,
            targetInventory,
          });

          const result = await aggressiveFlattenInvoke(ticker, 'no', flattenQty);
          currentInventory += result.filled;

          this.journal.append(jk('mm_flatten_complete'), {
            side: 'short',
            filled: result.filled,
            currentInventory,
          });
        }

        continue;
      }

      // 6. Repost bid if stale or missing.
      if (bidQuote === null || bidQuote.priceCents !== desiredBidCents) {
        if (bidQuote !== null) {
          await this._cancelQuote(bidQuote, cancelOrderInvoke);
          bidQuote = null;
        }
        const orderId = await postOrderInvoke(1, 'yes', desiredBidCents);
        bidQuote = { orderId, priceCents: desiredBidCents, postedQty: 1, knownFilled: 0 };
        this.journal.append(jk('mm_quote_posted'), {
          side: 'bid',
          orderId,
          priceCents: desiredBidCents,
        });
      }

      // 7. Repost ask if stale or missing.
      if (askQuote === null || askQuote.priceCents !== desiredAskCents) {
        if (askQuote !== null) {
          await this._cancelQuote(askQuote, cancelOrderInvoke);
          askQuote = null;
        }
        const orderId = await postOrderInvoke(1, 'no', desiredAskCents);
        askQuote = { orderId, priceCents: desiredAskCents, postedQty: 1, knownFilled: 0 };
        this.journal.append(jk('mm_quote_posted'), {
          side: 'ask',
          orderId,
          priceCents: desiredAskCents,
        });
      }

      // 8. Check stop before sleeping.
      if (this.stopped) break;

      await sleepMs(pollIntervalMs);
    }

    // ── Graceful stop: cancel both quotes idempotently ────────────────────────
    await this._cancelQuote(bidQuote, cancelOrderInvoke);
    await this._cancelQuote(askQuote, cancelOrderInvoke);

    this.journal.append(jk('mm_finished'), {
      reason: 'caller_stopped',
      finalInventory: currentInventory,
    });

    return { reason: 'caller_stopped', finalInventory: currentInventory };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async _cancelQuote(
    quote: QuoteState | null,
    cancelOrderInvoke: S12Config['cancelOrderInvoke'],
  ): Promise<void> {
    if (quote === null) return;
    await cancelOrderInvoke(quote.orderId);
    this.journal.append(jk('mm_quote_canceled'), { orderId: quote.orderId });
  }
}
