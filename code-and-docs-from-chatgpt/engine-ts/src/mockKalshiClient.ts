import type {
  KalshiClientLike,
  OrderPayload,
  OrderResult,
  OrderStatus,
  Orderbook,
  Position,
  Side,
} from './types.js';

interface MockOrderState {
  orderId: string;
  payload: OrderPayload;
  filled: number;
  requested: number;
  status: OrderStatus;
}

export interface MockBehavior {
  fillCount?: number;
  fillOnPoll?: number;
  fillOnCancel?: number;
}

export class MockKalshiClient implements KalshiClientLike {
  public readonly orders: MockOrderState[] = [];
  public readonly events: string[] = [];
  private nextId = 1;
  private orderbookSnapshots: Orderbook[];
  private snapshotIdx = 0;
  private behaviors: MockBehavior[];
  private behaviorIdx = 0;
  private positionStore: Map<string, { side: Side; quantity: number }> = new Map();

  constructor(opts: {
    orderbookSnapshots?: Orderbook[];
    behaviors?: MockBehavior[];
  } = {}) {
    this.orderbookSnapshots = opts.orderbookSnapshots ?? [
      { yes: [{ priceCents: 5, size: 10000 }], no: [{ priceCents: 5, size: 10000 }] },
    ];
    this.behaviors = opts.behaviors ?? [];
  }

  private restingOrderCounts = new Map<string, number>();

  /** Set a synthetic position for use in preflight tests. */
  setPosition(ticker: string, side: Side, quantity: number): void {
    this.positionStore.set(ticker, { side, quantity });
  }

  /** Set a synthetic resting-order count for use in tail-GTC guard tests. */
  setRestingOrderCount(ticker: string, count: number): void {
    this.restingOrderCounts.set(ticker, count);
  }

  async getRestingOrderCount(ticker: string): Promise<number> {
    this.events.push('getRestingOrderCount');
    return this.restingOrderCounts.get(ticker) ?? 0;
  }

  async getPosition(ticker: string): Promise<Position> {
    this.events.push('getPosition');
    const entry = this.positionStore.get(ticker);
    if (!entry || entry.quantity === 0) {
      throw new Error(`No position held for ticker ${ticker}`);
    }
    return { ticker, side: entry.side, quantity: entry.quantity };
  }

  private nextSnapshot(): Orderbook {
    const idx = Math.min(this.snapshotIdx, this.orderbookSnapshots.length - 1);
    this.snapshotIdx += 1;
    return this.orderbookSnapshots[idx];
  }

  private nextBehavior(): MockBehavior {
    const b = this.behaviors[this.behaviorIdx] ?? {};
    this.behaviorIdx += 1;
    return b;
  }

  async getOrderbook(_ticker: string, _depth: number): Promise<Orderbook> {
    this.events.push('getOrderbook');
    return this.nextSnapshot();
  }

  async createOrder(payload: OrderPayload): Promise<OrderResult> {
    this.events.push('createOrder');
    const orderId = `mock-${this.nextId++}`;
    const behavior = this.nextBehavior();
    const fillImmediate = Math.min(behavior.fillCount ?? payload.count, payload.count);
    const status: OrderStatus =
      fillImmediate >= payload.count ? 'filled' : fillImmediate > 0 ? 'partially_filled' : 'resting';
    const state: MockOrderState = {
      orderId,
      payload,
      filled: fillImmediate,
      requested: payload.count,
      status,
    };
    state.status = status;
    (state as any).pollFill = behavior.fillOnPoll ?? 0;
    (state as any).cancelFill = behavior.fillOnCancel ?? 0;
    this.orders.push(state);
    return this.toResult(state);
  }

  async getOrder(orderId: string): Promise<OrderResult> {
    this.events.push('getOrder');
    const state = this.orders.find((o) => o.orderId === orderId);
    if (!state) throw new Error(`mock: unknown order ${orderId}`);
    if (state.status === 'resting' || state.status === 'partially_filled') {
      const extra = (state as any).pollFill ?? 0;
      if (extra > 0) {
        state.filled = Math.min(state.requested, state.filled + extra);
        (state as any).pollFill = 0;
        state.status = state.filled >= state.requested ? 'filled' : 'partially_filled';
      }
    }
    return this.toResult(state);
  }

  async cancelOrder(orderId: string): Promise<OrderResult> {
    this.events.push('cancelOrder');
    const state = this.orders.find((o) => o.orderId === orderId);
    if (!state) throw new Error(`mock: unknown order ${orderId}`);
    const extra = (state as any).cancelFill ?? 0;
    if (extra > 0) state.filled = Math.min(state.requested, state.filled + extra);
    state.status = 'canceled';
    return this.toResult(state);
  }

  async findOrderByClientOrderId(clientOrderId: string): Promise<OrderResult | null> {
    this.events.push('findOrderByClientOrderId');
    const state = this.orders.find((o) => o.payload.client_order_id === clientOrderId);
    if (!state) return null;
    return this.toResult(state);
  }

  private toResult(state: MockOrderState): OrderResult {
    return {
      orderId: state.orderId,
      status: state.status,
      filledCount: state.filled,
      remainingCount: Math.max(0, state.requested - state.filled),
    };
  }

  async listMarkets(_opts: { status?: 'open' | 'closed' | 'settled'; limit?: number; cursor?: string } = {}): Promise<{ markets: Array<{ ticker: string; volume?: number; dollar_volume?: number; status?: string }>; cursor?: string }> {
    return { markets: [] };
  }
}
