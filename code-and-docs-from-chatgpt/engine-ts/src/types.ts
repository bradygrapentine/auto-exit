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
  /**
   * Adaptive chunk sizing. Leave undefined to let the engine auto-decide based on book shape:
   * thin top + cliff → adaptive (avoid sweeping into worse prices); fat top → fixed (no benefit).
   * Set true to force adaptive, false to force fixed (legacy explicit override).
   */
  mildAdaptive?: boolean;
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
  /**
   * Hard cap on total submitted-share volume across the run as a multiple of positionSize.
   * Defends against the failure mode where the engine misreads fills (e.g. parser bug) and
   * keeps re-submitting executed orders. Example: positionSize=20, multiplier=1.5 caps total
   * submitted shares at 30 — so even if maxOrders=100, only 30 shares can ever go to the
   * exchange. Default 1.5. Set higher only if you genuinely need many partial-retry chunks.
   */
  safetySubmittedMultiple?: number;
  /**
   * Tickers the engine refuses to operate against. If marketTicker matches any entry,
   * mergeConfig throws and ExitRunner.run() throws — defense in depth. Use this for
   * positions you must never touch via this tool (other holdings on the same exchange).
   */
  forbiddenTickers?: string[];
  /**
   * Order time-in-force. 'immediate_or_cancel' (default) is the safe losing-exit mode —
   * fills what crosses immediately, cancels the rest, never leaves a resting bid out.
   * 'good_till_canceled' lets the order rest on the book at your limit, useful for
   * drip-exits at prices above the current bid. With GTC the engine still cancels
   * stale orders on each iteration if the price hasn't been hit (so the next iteration
   * can re-decide pricing). 'fill_or_kill' is supported but rarely useful.
   */
  orderTimeInForce?: 'immediate_or_cancel' | 'good_till_canceled' | 'fill_or_kill';
  /**
   * Optional ABSOLUTE price floor in dollar string for GTC drip-exits — engine will
   * never sell below this price. e.g. "0.0300" pegs sells at >= 3¢ per share.
   * If set, decideLosingExitOrder uses max(top_bid, gtcMinPriceDollars).
   */
  gtcMinPriceDollars?: string;
  /**
   * Test-only knob: sleep N ms between writing the `order_placed` journal entry and
   * starting reconciliation. Used to deterministically reproduce the crash-mid-flight
   * scenario for the resume test (RESUME_LIVE_TEST_PLAN.md). Default 0. NEVER set in
   * production configs — it stalls every order placement.
   */
  deliberatePauseAfterPlaceMs?: number;
  /**
   * After the main IoC loop finishes (book emptied, max_orders hit, fractional
   * remainder, etc.) with remaining > 0, automatically post a single GTC sell
   * for the remaining shares so the tail drains passively. Order rests on the
   * book until filled, canceled, or the market expires. Default false.
   */
  tailGtcOnFinish?: boolean;
  /**
   * Explicit price (FixedPointDollars string, e.g. "0.0100") for the tail GTC
   * order. If unset and `tailGtcOnFinish` is true, the engine undercuts the top
   * opposite-side bid (= our ask) by one tick. Floor: floorPriceCents.
   */
  tailGtcPriceDollars?: string;
}

export type ExitConfigPatch = Partial<ExitConfig> & Pick<ExitConfig, 'marketTicker' | 'heldSide' | 'positionSize'>;

export interface PriceDecision {
  chunkSize: number;
  /** Integer-cents for logging/display. Math.floor(priceDollarsExact * 100). */
  priceCents: number;
  /** Float cents preserving sub-cent precision; Kalshi quotes 0.001 ticks below 10¢. */
  priceCentsExact: number;
  /** Dollar-string with up to 4 decimals for the order payload's yes_price_dollars / no_price_dollars. */
  priceDollars: string;
  reason: string;
  cumulativeSizeAtPrice: number;
}

export interface OrderPayload {
  ticker: string;
  action: 'sell';
  side: Side;
  count: number;
  type: 'limit';
  /** Integer cents 1..99. Use *_dollars for sub-cent precision (deci-cent ticks below 10¢). */
  yes_price?: number;
  no_price?: number;
  /** FixedPointDollars: dollar-string with up to 6 decimals, e.g. "0.0090". Required for sub-cent prices. */
  yes_price_dollars?: string;
  no_price_dollars?: string;
  reduce_only: boolean;
  /** Kalshi enum: 'immediate_or_cancel' | 'fill_or_kill' | 'good_till_canceled'. reduce_only=true requires immediate_or_cancel per server-side check. */
  time_in_force?: 'immediate_or_cancel' | 'fill_or_kill' | 'good_till_canceled';
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
  /** Cumulative shares the engine has submitted to the exchange (regardless of fill outcome). */
  submittedTotal: number;
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
  /** Number of resting orders we currently have on this market. Used to prevent
   *  re-posting tail-GTC duplicates across re-runs. Optional — older parsers may not surface it. */
  restingOrdersCount?: number;
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
  | 'resume_reconciled'
  | 'gtc_resting'
  | 'tail_gtc_posted';

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
