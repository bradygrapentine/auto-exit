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
  computeFeeCents,
} from './fillSimulator.js';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/**
 * In-flight GTC order awaiting fill on a future snapshot.
 *
 * For `fillModel === 'queue_aware'`, the queue tracker also carries:
 *   - `queueAhead`: depth at the limit-price level *ahead of us in the FIFO
 *     queue* at post time. Decrements as the level's depth drops on later
 *     snapshots (the assumption: any depth decrease at our level was consumed
 *     by an aggressive cross in front of us, even though it could also be a
 *     cancel — see v1 limitations below).
 *   - `lastSeenDepth`: monotonic non-increasing baseline of same-level depth.
 *     Clamped to `min(lastSeenDepth, current_depth)` every tick so that depth
 *     *increases* (new resting orders joining the queue behind us) do not
 *     later get credited to our queue position when they cancel.
 *
 * v1 LIMITATIONS (documented; not bugs):
 *   (a) Snapshot decreases due to cancels are credited as fills. We cannot
 *       distinguish consumption from cancellation; treating both as
 *       consumption slightly over-credits our queue position. Acceptable
 *       approximation; vastly more realistic than naive.
 *   (b) Multiple resting orders at the same `(side, priceCents)` would each
 *       track their own `queueAhead` and double-count the consumption that
 *       drained the level. The current backtest harness assumes at most one
 *       resting order per `(side, priceCents)`; sweep workloads chunk one
 *       order at a time per strategy. If real workloads exercise the
 *       duplicate-level case, file a v2 reconciliation follow-up.
 *   (c) Recording snapshots are captured by the venue and do NOT include
 *       this client's resting orders. So `depthAtLevel` returns the queue
 *       ahead of us without ever double-counting our own size.
 */
interface RestingOrder {
  orderId: string;
  payload: OrderPayload;
  remainingSize: number;
  /** Set when fillModel === 'queue_aware'; undefined for 'naive'. */
  queueAhead?: number;
  /** Set when fillModel === 'queue_aware'; undefined for 'naive'. */
  lastSeenDepth?: number;
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
   * Look up the visible depth at one specific price level on one side of the
   * book in a recorded snapshot. Returns 0 if the level isn't present.
   *
   * Kalshi snapshots emit at most one entry per `(side, priceCents)` — this
   * is a lookup, not a reducer.
   */
  function depthAtLevel(
    snap: SnapshotEntry,
    side: 'yes' | 'no',
    priceCents: number,
  ): number {
    const levels = side === 'yes' ? snap.orderbook.yes : snap.orderbook.no;
    for (const [p, qty] of levels) {
      if (p === priceCents) return qty;
    }
    return 0;
  }

  /**
   * For a resting limit order on `side` at `priceCents` with `action`, return
   * the queue depth visible AHEAD of us (other resting orders at the same
   * matching level).
   *
   * Kalshi book convention: `snap.yes` holds yes-side BIDS (buyers of yes),
   * `snap.no` holds no-side BIDS (buyers of no = sellers of yes at the
   * complementary price). So:
   *   - A BUY on side S at price P joins the bid queue on side S at price P.
   *     Queue ahead = depthAtLevel(snap, S, P).
   *   - A SELL on side S at price P is equivalent to a BID on the OPPOSITE
   *     side at price (100 - P). Queue ahead = depthAtLevel(snap, opposite, 100 - P).
   *
   * The returned depth does NOT include this client's resting orders — the
   * snapshot is the venue's view captured before our order existed.
   */
  function queueLevelDepth(
    snap: SnapshotEntry,
    side: 'yes' | 'no',
    action: 'buy' | 'sell',
    priceCents: number,
  ): number {
    if (action === 'buy') {
      return depthAtLevel(snap, side, priceCents);
    }
    const opposite: 'yes' | 'no' = side === 'yes' ? 'no' : 'yes';
    return depthAtLevel(snap, opposite, 100 - priceCents);
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

        if (fillModel === 'queue_aware') {
          // ── queue-aware GTC path ──────────────────────────────────────
          // Track queue position by watching same-level depth drop. Any
          // decrease is credited to our queue position (over-credits us
          // slightly when the decrease was actually a cancel — see v1
          // limitations on RestingOrder).
          if (
            limitCents === undefined ||
            resting.queueAhead === undefined ||
            resting.lastSeenDepth === undefined
          ) {
            // queue_aware state not initialized (e.g. unresolvable price).
            // Skip — no fill credited.
            continue;
          }
          const action = resting.payload.action ?? 'buy';
          const currentDepth = queueLevelDepth(snap, resting.payload.side, action, limitCents);
          const delta = Math.max(0, resting.lastSeenDepth - currentDepth);
          resting.queueAhead = Math.max(0, resting.queueAhead - delta);
          // Monotonic non-increasing clamp: depth increases mean new orders
          // joined the queue BEHIND us; they must not later be credited to
          // our position when they cancel.
          resting.lastSeenDepth = Math.min(resting.lastSeenDepth, currentDepth);

          if (resting.queueAhead === 0 && currentDepth >= resting.remainingSize) {
            // We're at the front of the queue and a cross is arriving that
            // can fill our remaining size. Construct a maker-side fill
            // record matching the shape of the naive branch's emit.
            const filled = resting.remainingSize;
            const feesCents = computeFeeCents(filled, limitCents);
            const requestedSize = resting.remainingSize;

            // Update position
            if (resting.payload.action === 'buy') {
              if (position.ticker === '' || position.ticker === snap.ticker) {
                position.ticker = snap.ticker;
                position.side = resting.payload.side;
                position.quantity += filled;
              }
            } else {
              position.quantity = Math.max(0, position.quantity - filled);
            }

            resting.remainingSize -= filled;

            fillLog.push({
              ts: snap.ts,
              ticker: snap.ticker,
              orderId,
              side: resting.payload.side,
              requestedSize,
              filled,
              fillPriceCents: limitCents,
              isTaker: false,
              feesCents,
            });

            const existing = orderResults.get(orderId);
            const totalFilled = (existing?.filledCount ?? 0) + filled;
            orderResults.set(orderId, {
              orderId,
              status: resting.remainingSize === 0 ? 'filled' : 'partially_filled',
              filledCount: totalFilled,
              remainingCount: resting.remainingSize,
            });

            if (resting.remainingSize <= 0) {
              restingOrders.delete(orderId);
            }
          }
          continue;
        }

        // ── naive path (existing behavior, unchanged) ───────────────────
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

      // For queue_aware + GTC, query the marketable portion via an IOC-shaped
      // sim order — simulateFill throws on GTC+queue_aware by design (the
      // queue tracker owns ongoing GTC fills; only the initial-cross slice is
      // handled here). For all other modes, use the order's actual TIF.
      const simTif: SimOrder['timeInForce'] =
        fillModel === 'queue_aware' && tif === 'good_till_canceled'
          ? 'immediate_or_cancel'
          : tif;

      const simOrder: SimOrder = {
        side: payload.side,
        action: payload.action,
        type: payload.type as 'limit' | 'market',
        size: payload.count,
        limitPriceCents: limitCents,
        timeInForce: simTif,
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

      // Queue resting GTC orders. Under queue_aware, snapshot the same-side
      // depth at the limit price at post time — that's our queue-ahead count.
      if (tif === 'good_till_canceled' && remaining > 0) {
        const rest: RestingOrder = {
          orderId,
          payload,
          remainingSize: remaining,
        };
        if (fillModel === 'queue_aware' && limitCents !== undefined) {
          const action = payload.action ?? 'buy';
          const initialDepth = queueLevelDepth(snap, payload.side, action, limitCents);
          rest.queueAhead = initialDepth;
          rest.lastSeenDepth = initialDepth;
        }
        restingOrders.set(orderId, rest);
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
