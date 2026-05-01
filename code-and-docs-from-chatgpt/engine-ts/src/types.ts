export type Side = 'yes' | 'no';

export interface RetryOptions {
  /** Max total attempts including the first try. Default 4. */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff. Default 200. */
  baseMs?: number;
  /** Max delay cap in ms. Default 4000. */
  maxMs?: number;
  /** Which error classes trigger a retry. Default: ['network', '5xx', '429']. */
  retryOn?: Array<'network' | '5xx' | '429'>;
  /** When true, network errors may have caused a side-effect (e.g. createOrder). Default false. */
  nonIdempotent?: boolean;
  /** Add random jitter (0..baseMs) to backoff. Default true. */
  jitter?: boolean;
}

export interface PriceLevel { priceCents: number; size: number; }
export interface Orderbook { yes: PriceLevel[]; no: PriceLevel[]; }

export interface ExitConfig {
  baseUrl: string;
  localServerPort: number;
  marketTicker: string;
  heldSide: Side;
  positionSize: number;
  chunkSize: number;
  floorPriceCents: number;
  orderbookDepth: number;
  minLevelSize: number;
  tailSweepThreshold: number;
  mildAdaptive: boolean;
  minAdaptiveChunk: number;
  maxOrders: number;
  loopDelayMs: number;
  dryRun: boolean;
  killSwitchPath: string;
  apiKeyEnv: string;
  privateKeyPathEnv: string;
  reconcilePollMs?: number;
  reconcileMaxPolls?: number;
  cancelOnStale?: boolean;
  /** When true, run() calls preflight() to validate the real position before the loop. Default false for backward compat. */
  preflight?: boolean;
}

export type ExitConfigPatch = Partial<ExitConfig> & Pick<ExitConfig, 'marketTicker' | 'heldSide' | 'positionSize'>;

export interface PriceDecision {
  chunkSize: number;
  priceCents: number;
  reason: string;
  cumulativeSizeAtPrice: number;
}

export interface OrderPayload {
  ticker: string;
  action: 'sell';
  side: Side;
  count: number;
  type: 'limit';
  yes_price?: number;
  no_price?: number;
  reduce_only: boolean;
  client_order_id: string;
}

export interface LoopEvent {
  ts: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

export interface JobStatus {
  running: boolean;
  stopped: boolean;
  dryRun: boolean;
  startedAt?: string;
  finishedAt?: string;
  remaining: number;
  initialPosition: number;
  ordersAttempted: number;
  filledTotal: number;
  canceledTotal: number;
  lastDecision?: PriceDecision;
  lastPayload?: OrderPayload;
  lastError?: string;
  events: LoopEvent[];
}

export type OrderStatus = 'resting' | 'filled' | 'canceled' | 'partially_filled' | 'unknown';

export interface OrderResult {
  orderId: string;
  status: OrderStatus;
  filledCount: number;
  remainingCount: number;
  raw?: unknown;
}

export interface Position {
  ticker: string;
  side: Side;
  quantity: number;
}

export interface KalshiClientLike {
  getOrderbook(ticker: string, depth: number): Promise<Orderbook>;
  createOrder(payload: OrderPayload): Promise<OrderResult>;
  getOrder(orderId: string): Promise<OrderResult>;
  cancelOrder(orderId: string): Promise<OrderResult>;
  getPosition(ticker: string): Promise<Position>;
}

// ── Journal types ──────────────────────────────────────────────────────────────

export type JournalKind =
  | 'loop_started'
  | 'order_placed'
  | 'order_reconciled'
  | 'loop_finished'
  | 'loop_error'
  | 'resume_started'
  | 'resume_reconciled';

export interface JournalEntry {
  ts: string;
  kind: JournalKind;
  data: unknown;
}

/** Stored with every `order_placed` entry — enough to call getOrder on resume. */
export interface OrderPlacedData {
  orderId: string;
  payload: OrderPayload;
  decisionRequested: number;
}
