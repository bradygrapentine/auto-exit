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
  /** Cumulative taker fees in dollars, summed from each reconciled order's takerFeesDollars. */
  feesIncurredDollars: number;
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
  /** Taker fees paid for this order, in dollars. Parsed from Kalshi's `taker_fees_dollars` field. */
  takerFeesDollars?: number;
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
  /** Count of our resting orders on this ticker. Authoritative — queries /portfolio/orders.
   *  The `position.restingOrdersCount` field from /portfolio/positions is NOT reliable
   *  (observed returning 0 even when a GTC was actively resting on the book). */
  getRestingOrderCount(ticker: string): Promise<number>;
  /** Look up an order by client_order_id. Returns null if not found or on network error.
   *  Used during crash-safe resume to reconcile orders that were placed but not journaled. */
  findOrderByClientOrderId(clientOrderId: string): Promise<OrderResult | null>;
}

// ── Journal types ──────────────────────────────────────────────────────────────

// ── Safety config types ────────────────────────────────────────────────────────

export interface ForbiddenEntry {
  ticker: string;
  reason: string;
  addedAt: string;   // ISO 8601
  addedBy: string;   // 'cli' | 'mcp' | 'tui'
}

export interface SafetyConfig {
  safetySubmittedMultiple: number;   // default 1.1; hard bounds [1.0, 1.2]
  floorPriceCents: number;           // default 0; hard bounds [0, 99]
  tailSweepThreshold: number;        // default 0; hard bounds [0, 1_000_000]
  forbiddenTickers: ForbiddenEntry[];
  version: 1;
}

export type JournalKind =
  | 'loop_started'
  | 'order_intent'
  | 'order_placed'
  | 'order_reconciled'
  | 'loop_finished'
  | 'loop_error'
  | 'resume_started'
  | 'resume_reconciled'
  | 'gtc_resting'
  | 'tail_gtc_posted'
  | 'safety_config_changed'
  | 'safety_loaded';

export interface JournalEntry {
  ts: string;
  kind: JournalKind;
  data: unknown;
}

/** Stored with every `order_intent` entry — written BEFORE createOrder is called.
 *  Enables crash-safe resume via clientOrderId lookup when only the intent was written
 *  (process killed between createOrder returning and order_placed being appended). */
export interface OrderIntentData {
  clientOrderId: string;
  payload: OrderPayload;
}

/** Stored with every `order_placed` entry — enough to call getOrder on resume.
 *  `orderbook` and `decision` are optional for backward compatibility with
 *  journals written before replay support; new runs always include them. */
export interface OrderPlacedData {
  orderId: string;
  payload: OrderPayload;
  decisionRequested: number;
  /** Orderbook snapshot at decision time. Enables E2E replay/cross-validation. */
  orderbook?: Orderbook;
  /** Full decision tuple (price/size/reason). Replay asserts re-running the engine
   *  against `orderbook` produces this same decision. */
  decision?: {
    chunkSize: number;
    priceCents: number;
    priceCentsExact: number;
    priceDollars: string;
    cumulativeSizeAtPrice: number;
    reason: string;
  };
}

// ── Harvest planner types ──────────────────────────────────────────────────────

export interface HarvestPlannerInput {
  ticker: string;
  side: 'sell';
  position: number;           // contracts held
  costBasisCents: number;     // total cost basis (sum paid) in cents
  marketP: number;            // market-implied probability 0–1 (current bid / 100)
  privateP: number;           // operator's private probability estimate 0–1
  catalystType: 'soft' | 'hard';
  catalystExpectedDate?: string; // ISO8601 — used to compute theta
  payoutCents?: number;          // default 100 (binary = $1.00)
}

export interface RiskReductionRow {
  fraction: '10%' | '25%' | '50%' | '75%' | 'no-loss-floor';
  harvestQty: number;
  cashLocked: number;         // dollars locked in by harvesting this fraction
  evGiveUp: number;           // expected value forfeited (dollars), based on privateP
  sigmaReduction: number;     // portfolio variance reduction (0–1 fraction)
}

export interface HarvestPlannerOutput {
  pStar: number;              // EV crossover: privateP
  evHold: number;             // EV(hold all) in dollars: position × privateP × payoutCents/100
  evHarvestNow: number;       // EV(sweep now) in dollars: position × marketP × payoutCents/100
  evPatientScaleOut: number;  // EV(patient S1): 0.5×(marketP + privateP) × position × payoutCents/100
  harvestIsEvPositive: boolean; // true if marketP >= pStar
  riskReductionTable: RiskReductionRow[];  // 5 rows: 10/25/50/75% + no-loss-floor
  greeks: {
    delta: number;            // = marketP (bid as probability)
    thetaPerDay?: number;     // EV decay per day **per contract** = (privateP - marketP) × payout/100 / daysToExpiry
    gammaProxy: number;       // bid-ask spread × visible book depth (proxy for convexity)
  };
  suggestedStrategies: string[];  // e.g. ["S1 passive", "S7 scale-out"]
}
