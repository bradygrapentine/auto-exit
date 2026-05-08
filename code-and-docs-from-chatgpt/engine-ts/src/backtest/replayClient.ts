/**
 * SH-BACKTEST Phase B1 — replay client.
 *
 * ReplayKalshiClient implements the same KalshiClientLike interface as the
 * live KalshiClient, backed by a loaded recording instead of the network.
 * Strategy code (ExitRunner / BuyRunner / synthetics) can run unmodified
 * against this client — it cannot distinguish replay from live.
 *
 * Spec §3 architecture: the synthetic-client trick is the load-bearing design
 * choice; zero strategy-code changes required.
 *
 * Per spec §7.7: Date.now() patching is out of scope here — caller retrieves
 * currentTimestamp() and passes it if strategy code needs it.
 */

import type {
  Orderbook,
  OrderPayload,
  OrderResult,
  Position,
} from '../types.js';
import type {
  RecordingEntry,
  SnapshotEntry,
  FillModel,
  SimulatedFillRecord,
} from './types.js';
import {
  simulateFill,
  type SnapshotOrderbook,
  type SimOrder,
} from './fillSimulator.js';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface RestingOrder {
  orderId: string;
  payload: OrderPayload;
  remainingSize: number;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ReplayClientOptions {
  /** Loaded + sorted recording entries (from loadRecording). */
  entries: RecordingEntry[];
  /** Fill model to use. Default 'naive'. */
  fillModel?: FillModel;
  /** Initial simulated position. If omitted, defaults to qty=0. */
  initialPosition?: {
    ticker: string;
    side: 'yes' | 'no';
    quantity: number;
  };
}

// ---------------------------------------------------------------------------
// KalshiClientLike-compatible interface (subset needed for replay)
// Full interface from src/types.ts:
//   getOrderbook, createOrder, getOrder, cancelOrder, getPosition,
//   getRestingOrderCount, findOrderByClientOrderId
// ---------------------------------------------------------------------------

export interface ReplayKalshiClient {
  // ── Core KalshiClientLike methods ────────────────────────────────────────
  getOrderbook(ticker: string, depth: number): Promise<Orderbook>;
  createOrder(payload: OrderPayload): Promise<OrderResult>;
  getOrder(orderId: string): Promise<OrderResult>;
  cancelOrder(orderId: string): Promise<OrderResult>;
  getPosition(ticker: string): Promise<Position>;
  getRestingOrderCount(ticker: string): Promise<number>;
  findOrderByClientOrderId(clientOrderId: string): Promise<OrderResult | null>;

  // ── Replay-specific controls ──────────────────────────────────────────────
  /**
   * Advance cursor to the next snapshot entry.
   * Returns true if advanced, false when end of recording reached.
   */
  advance(): boolean;
  /** ISO timestamp of the current snapshot cursor. Empty string before first snapshot. */
  currentTimestamp(): string;
  /** Expose fill log for the harness / report layer. */
  getFillLog(): SimulatedFillRecord[];
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let _orderIdSeq = 0;
function nextOrderId(): string {
  return `replay-order-${++_orderIdSeq}`;
}

/**
 * Create a ReplayKalshiClient from loaded recording entries.
 *
 * The client starts with the cursor before the first snapshot entry.
 * Call `advance()` to move to the first snapshot before invoking any
 * orderbook or order methods.
 */
export function createReplayClient(opts: ReplayClientOptions): ReplayKalshiClient {
  const { entries, fillModel = 'naive' } = opts;

  // Extract snapshot entries only (ordered by ts — already sorted by loader)
  const snapshots = entries.filter(
    (e): e is SnapshotEntry => e.kind === 'snapshot',
  );

  // Cursor index into `snapshots[]`
  let cursorIndex = -1;

  // Position state
  let position: { ticker: string; side: 'yes' | 'no'; quantity: number } =
    opts.initialPosition
      ? { ...opts.initialPosition }
      : { ticker: '', side: 'yes', quantity: 0 };

  // Resting orders (GTC orders that weren't immediately filled)
  const restingOrders = new Map<string, RestingOrder>();

  // Fill log
  const fillLog: SimulatedFillRecord[] = [];

  // Order results map — so getOrder() can return previously placed orders
  const orderResults = new Map<string, OrderResult>();
  const clientOrderIdIndex = new Map<string, string>(); // clientOrderId → orderId

  // ── Helpers ──────────────────────────────────────────────────────────────

  function currentSnapshot(): SnapshotEntry | null {
    if (cursorIndex < 0 || cursorIndex >= snapshots.length) return null;
    return snapshots[cursorIndex]!;
  }

  /**
   * Convert a recorded snapshot to the Orderbook shape expected by
   * KalshiClientLike (PriceLevel[] with { priceCents, size }).
   */
  function snapshotToOrderbook(snap: SnapshotEntry, depth: number): Orderbook {
    const toLevel = ([priceCents, size]: [number, number]) => ({
      priceCents,
      size,
    });
    return {
      yes: snap.orderbook.yes.slice(0, depth).map(toLevel),
      no: snap.orderbook.no.slice(0, depth).map(toLevel),
    };
  }

  /**
   * Convert a recorded snapshot to the SnapshotOrderbook shape used by the
   * fill simulator (BookLevel tuples, no depth truncation — simulator sees all).
   */
  function snapshotToSimBook(snap: SnapshotEntry): SnapshotOrderbook {
    return {
      yes: snap.orderbook.yes as Array<[number, number]>,
      no: snap.orderbook.no as Array<[number, number]>,
    };
  }

  /**
   * Resolve a limit price from an OrderPayload (handles both integer cents
   * fields and dollar-string fields).
   */
  function resolveLimitPriceCents(payload: OrderPayload): number | undefined {
    const side = payload.side;
    if (side === 'yes') {
      if (payload.yes_price !== undefined) return payload.yes_price;
      if (payload.yes_price_dollars !== undefined)
        return Math.round(parseFloat(payload.yes_price_dollars) * 100);
    } else {
      if (payload.no_price !== undefined) return payload.no_price;
      if (payload.no_price_dollars !== undefined)
        return Math.round(parseFloat(payload.no_price_dollars) * 100);
    }
    return undefined;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    // ── Cursor controls ────────────────────────────────────────────────────

    advance(): boolean {
      const next = cursorIndex + 1;
      if (next >= snapshots.length) return false;
      cursorIndex = next;

      // On cursor advance, try to fill any resting GTC orders against the new book
      const snap = snapshots[cursorIndex]!;
      const simBook = snapshotToSimBook(snap);

      for (const [orderId, resting] of restingOrders) {
        const limitCents = resolveLimitPriceCents(resting.payload);
        const simOrder: SimOrder = {
          side: resting.payload.side,
          action: resting.payload.action,
          type: 'limit',
          size: resting.remainingSize,
          limitPriceCents: limitCents,
          timeInForce: 'good_till_canceled',
        };
        const result = simulateFill(simOrder, simBook, fillModel);
        if (result.filled > 0) {
          // Update resting order
          resting.remainingSize -= result.filled;

          // Update position
          if (resting.payload.action === 'buy') {
            if (position.ticker === '' || position.ticker === snap.ticker) {
              position.ticker = snap.ticker;
              position.side = resting.payload.side;
              position.quantity += result.filled;
            }
          } else {
            position.quantity = Math.max(0, position.quantity - result.filled);
          }

          // Record in fill log
          fillLog.push({
            ts: snap.ts,
            ticker: snap.ticker,
            orderId,
            side: resting.payload.side,
            requestedSize: resting.remainingSize + result.filled,
            filled: result.filled,
            fillPriceCents: result.fillPriceCents,
            isTaker: result.isTaker,
            feesCents: result.feesCents,
          });

          // Update order result
          const existing = orderResults.get(orderId);
          const totalFilled = (existing?.filledCount ?? 0) + result.filled;
          const totalRemaining = resting.remainingSize;
          orderResults.set(orderId, {
            orderId,
            status: totalRemaining === 0 ? 'filled' : 'partially_filled',
            filledCount: totalFilled,
            remainingCount: totalRemaining,
          });

          if (resting.remainingSize <= 0) {
            restingOrders.delete(orderId);
          }
        }
      }

      return true;
    },

    currentTimestamp(): string {
      const snap = currentSnapshot();
      return snap?.ts ?? '';
    },

    // ── KalshiClientLike methods ───────────────────────────────────────────

    async getOrderbook(ticker: string, depth: number): Promise<Orderbook> {
      const snap = currentSnapshot();
      if (!snap) {
        throw new Error(
          'ReplayKalshiClient: cursor is before first snapshot — call advance() first',
        );
      }
      // Filter by ticker if specified (multi-ticker recordings)
      if (ticker && snap.ticker !== ticker) {
        // Return empty book for unmatched ticker
        return { yes: [], no: [] };
      }
      return snapshotToOrderbook(snap, depth);
    },

    async createOrder(payload: OrderPayload): Promise<OrderResult> {
      const snap = currentSnapshot();
      if (!snap) {
        throw new Error(
          'ReplayKalshiClient: cursor is before first snapshot — call advance() first',
        );
      }

      const orderId = nextOrderId();
      const limitCents = resolveLimitPriceCents(payload);

      const tif =
        (payload.time_in_force as SimOrder['timeInForce']) ??
        'immediate_or_cancel';

      const simOrder: SimOrder = {
        side: payload.side,
        action: payload.action,
        type: payload.type as 'limit' | 'market',
        size: payload.count,
        limitPriceCents: limitCents,
        timeInForce: tif,
      };

      const simBook = snapshotToSimBook(snap);
      const fillResult = simulateFill(simOrder, simBook, fillModel);

      // Update simulated position
      if (fillResult.filled > 0) {
        if (payload.action === 'buy') {
          if (position.ticker === '' || position.ticker === snap.ticker) {
            position.ticker = snap.ticker;
            position.side = payload.side;
            position.quantity += fillResult.filled;
          }
        } else {
          // sell
          position.quantity = Math.max(0, position.quantity - fillResult.filled);
        }
      }

      // Record fill
      if (fillResult.filled > 0) {
        fillLog.push({
          ts: snap.ts,
          ticker: snap.ticker,
          orderId,
          side: payload.side,
          requestedSize: payload.count,
          filled: fillResult.filled,
          fillPriceCents: fillResult.fillPriceCents,
          isTaker: fillResult.isTaker,
          feesCents: fillResult.feesCents,
        });
      }

      // Determine status
      const remaining = fillResult.remaining;
      let status: OrderResult['status'];
      if (fillResult.filled === 0) {
        status = tif === 'good_till_canceled' ? 'resting' : 'canceled';
      } else if (remaining === 0) {
        status = 'filled';
      } else {
        status = tif === 'good_till_canceled' ? 'partially_filled' : 'partially_filled';
      }

      const result: OrderResult = {
        orderId,
        status,
        filledCount: fillResult.filled,
        remainingCount: remaining,
      };
      orderResults.set(orderId, result);

      if (payload.client_order_id) {
        clientOrderIdIndex.set(payload.client_order_id, orderId);
      }

      // Queue resting GTC orders
      if (tif === 'good_till_canceled' && remaining > 0) {
        restingOrders.set(orderId, {
          orderId,
          payload,
          remainingSize: remaining,
        });
      }

      return result;
    },

    async getOrder(orderId: string): Promise<OrderResult> {
      const result = orderResults.get(orderId);
      if (result) return result;
      return {
        orderId,
        status: 'unknown',
        filledCount: 0,
        remainingCount: 0,
      };
    },

    async cancelOrder(orderId: string): Promise<OrderResult> {
      const resting = restingOrders.get(orderId);
      restingOrders.delete(orderId);

      const existing = orderResults.get(orderId);
      const updated: OrderResult = {
        orderId,
        status: 'canceled',
        filledCount: existing?.filledCount ?? 0,
        remainingCount: 0,
      };
      orderResults.set(orderId, updated);

      // If there was a resting order, return its state at cancel time
      if (resting) {
        return updated;
      }
      return updated;
    },

    async getPosition(ticker: string): Promise<Position> {
      // Return the current simulated position for the ticker
      if (position.ticker === '' || position.ticker === ticker) {
        return {
          ticker,
          side: position.side,
          quantity: position.quantity,
        };
      }
      // Untracked ticker
      return { ticker, side: 'yes', quantity: 0 };
    },

    async getRestingOrderCount(ticker: string): Promise<number> {
      let count = 0;
      for (const [, resting] of restingOrders) {
        const snap = currentSnapshot();
        if (!snap || snap.ticker === ticker) count++;
      }
      return count;
    },

    async findOrderByClientOrderId(
      clientOrderId: string,
    ): Promise<OrderResult | null> {
      const orderId = clientOrderIdIndex.get(clientOrderId);
      if (!orderId) return null;
      return orderResults.get(orderId) ?? null;
    },

    // ── Replay extras ─────────────────────────────────────────────────────

    getFillLog(): SimulatedFillRecord[] {
      return [...fillLog];
    },
  };
}
