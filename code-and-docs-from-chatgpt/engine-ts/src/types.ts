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
  action: 'sell' | 'buy';
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
  /** List markets matching a status filter. Used by SH-BACKTEST scanner ticker discovery.
   *  Returns at most `limit` markets per page; cursor pagination via the returned `cursor`. */
  listMarkets(opts: { status?: 'open' | 'closed' | 'settled'; limit?: number; cursor?: string }): Promise<{ markets: Array<{ ticker: string; volume?: number; dollar_volume?: number; status?: string }>; cursor?: string }>;
  /** List series, optionally filtered by category and ranked by volume. */
  listSeries(opts?: { category?: string; include_volume?: boolean; cursor?: string; limit?: number }): Promise<{ series: Array<{ ticker: string; title?: string; category?: string; volume_fp?: number }>; cursor?: string }>;
  /** List events, optionally filtered by series_ticker, status, close time window, etc.
   *  Pass with_nested_markets=true to include child markets on each event. */
  listEvents(opts?: { series_ticker?: string; status?: 'open' | 'closed' | 'settled'; with_nested_markets?: boolean; min_close_ts?: number; max_close_ts?: number; cursor?: string; limit?: number }): Promise<{ events: Array<{ event_ticker: string; series_ticker?: string; title?: string; markets?: Array<{ ticker: string; volume_24h_fp?: number; last_price_dollars?: number; close_time?: string; status?: string }> }>; cursor?: string }>;
  /** Fetch portfolio balance in dollars. Optional — existing test mocks that omit it
   *  cause getPortfolioNAVDollars to return 0 via the typeof guard (safe fallback). */
  fetchBalanceDollars?(): Promise<number>;
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
  /** Max projected net loss for any single ticker (dollars). If positionSize × price > this, refuse to start. */
  maxLossPerTickerDollars?: number;
  /** Max total realized losses for the UTC day (dollars). Reads safety.audit.jsonl realized_loss entries. */
  dailyLossCircuitBreakerDollars?: number;
  /** Max % of portfolio NAV in one position (0–100). Skipped when portfolioNAV=0. */
  maxPositionConcentrationPct?: number;
  /** W3.1: Max fraction of recent-minute volume to submit per minute (0–1). 0 = disabled. */
  maxParticipationRate?: number;
  /** SH-MICRO-EXECUTION-LOOP: caps + allowlist for the validation harness. */
  microHarness?: MicroHarnessSafety;
}

export interface MicroHarnessSafety {
  /** Cap on a single trial's notional ($). Operator-approved range: $0.10–$1.00. */
  perTrialCapDollars: number;
  /** Cap on total trial notional spent in a UTC day ($). Operator-approved: $2.50. */
  dailyAggregateCapDollars: number;
  /** Glob patterns for tickers eligible for live trials. Empty = none allowed. */
  tickerAllowlist: string[];
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
  | 'safety_loaded'
  | 'buy_loop_started'
  | 'buy_loop_finished'
  | 'buy_loop_error'
  | 'tca'
  | 'passive_spread_too_tight'
  | 'passive_floor_hit'
  | 'passive_ceiling_hit'
  | 'passive_walk_tick'
  | 'passive_no_opposite_liquidity'
  | 'passive_safety_cap_breached'
  | 'synthetic_registered'
  | 'synthetic_fire_pending'
  | 'synthetic_fired'
  | 'synthetic_fire_failed'
  | 'synthetic_canceled'
  | 'synthetic_state_update'
  | 'micro_trial_started'
  | 'micro_trial_finished';

export interface TcaEntry {
  kind: 'tca';
  ts: string;
  jobId: string;
  ticker: string;
  side: 'buy' | 'sell';
  chunkIndex: number;
  arrivalMidCents: number;      // (topBid + topAsk) / 2 at decision time
  executedPriceCents: number;   // actual fill price
  slippageCents: number;        // executedPrice - arrivalMid (positive = paid more than mid)
  chunkSize: number;
  depthTier: number;            // how many levels deep the fill reached
}

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

// ── Buy runner types ───────────────────────────────────────────────────────────

export interface BuyConfig {
  ticker: string;
  side: 'buy';
  size: number;              // contracts to buy
  maxPriceCents?: number;    // ceiling — don't pay more than this per contract
  chunkSize?: number;
  loopDelayMs?: number;
  dryRun?: boolean;
  jobId?: string;            // for resume
  // mirrored from ExitConfig pattern:
  baseUrl?: string;
  orderbookDepth?: number;
  minAdaptiveChunk?: number;
  maxOrders?: number;
  killSwitchPath?: string;
  apiKeyEnv?: string;
  privateKeyPathEnv?: string;
  preflight?: boolean;
}

export interface BuyResult {
  jobId: string;
  filled: number;
  avgPriceCents: number;
  feesIncurredDollars: number;
  remaining: number;
  status: 'complete' | 'partial' | 'error';
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
    thetaPerDay?: number;     // EV decay per day = (privateP - marketP) / daysToExpiry
    gammaProxy: number;       // bid-ask spread × visible book depth (proxy for convexity)
  };
  suggestedStrategies: string[];  // e.g. ["S1 passive", "S7 scale-out"]
  /**
   * SH-DEPTH-WALK-STALE-SNAPSHOT (§4): operator-facing warnings about
   * fragile assumptions in the projection — e.g. a fat top-of-book bid
   * that may be pulled before execution. Empty when none apply.
   */
  riskNotes: string[];
}

// ============================================================
// Synthetic order types — see docs/superpowers/specs/2026-05-05-synthetic-order-types-watcher.md
// ============================================================

export type SyntheticKind =
  | 'stop_loss' | 'stop_limit' | 'trailing_stop'
  | 'take_profit' | 'oco' | 'bracket'
  | 'time_stop' | 'step_trail';

export type SyntheticStatus = 'armed' | 'fired' | 'canceled' | 'fire_failed';

export type SelfTradePrevention = 'taker_at_cross' | 'maker';

/**
 * Trigger price expressed as cents — `number` (float) so deci-cent ticks below 10¢ work correctly.
 * UI may collect integer cents; internally always normalized to float.
 */
export interface StopLossParams {
  triggerPriceCents: number;
  executionStrategy?: 'losing_exit' | 'aggressive' | 'limit_at_floor';
  executionParams?: Record<string, unknown>;
}

export interface StopLimitParams {
  triggerPriceCents: number;
  limitPriceCents: number;
  size: number;
}

export interface TrailingStopParams {
  trailCents: number;                 // float OK (e.g. 0.5 for 0.5¢ trail on cheap markets)
  executionStrategy?: 'losing_exit' | 'aggressive';
  floorPriceCents?: number;           // default 1
}

export interface TakeProfitRung { priceCents: number; sizePct: number; }

export interface TakeProfitParams {
  /** Single-trigger mode: just triggerPriceCents. Multi-rung mode: rungs[]. Use one. */
  triggerPriceCents?: number;
  rungs?: TakeProfitRung[];
  executionStrategy?: 'scale_out' | 'passive' | 'aggressive';
}

export interface SyntheticDescriptor {
  kind: SyntheticKind;
  params: SyntheticParams;
}

export interface OcoParams {
  legs: [SyntheticDescriptor, SyntheticDescriptor];
}

export interface BracketParams {
  takeProfitCents: number;
  stopLossCents: number;
}

/**
 * Time-stop fires when wall-clock time passes a deadline AND (optional) the top
 * bid is below an exit threshold. With no exitIfBelowCents, fires purely on time.
 */
export interface TimeStopParams {
  deadlineTimestamp: string;        // ISO 8601
  exitIfBelowCents?: number;
  executionStrategy?: 'losing_exit' | 'aggressive';
}

/**
 * Step-trail variant of trailing-stop: peak only updates when currentBid exceeds
 * peak by at least `stepCents`. Smoother than continuous-peak trailing on noisy books.
 */
export interface StepTrailParams {
  trailCents: number;
  stepCents: number;
  floorPriceCents?: number;
}

export interface StepTrailState { peakBidCentsExact: number; }

export type SyntheticParams =
  | StopLossParams | StopLimitParams | TrailingStopParams
  | TakeProfitParams | OcoParams | BracketParams
  | TimeStopParams | StepTrailParams;

// State shapes — empty {} for stateless evaluators.
export interface TrailingStopState { peakBidCentsExact: number; }
export interface TakeProfitState { firedRungIndices: number[]; armed?: boolean; }
export interface OcoState { childIds: [string, string] | string[]; firedChildId?: string; }
export interface BracketState { childIds: [string, string]; firedChildId?: string; }

export type SyntheticState =
  | Record<string, never>
  | TrailingStopState | TakeProfitState | OcoState | BracketState
  | StepTrailState;

export type SyntheticAction = 'fire' | 'notify';

export interface NotifyChannelConfig {
  kind: 'webhook' | 'desktop';
  webhookUrl?: string;                 // required when kind='webhook'
  desktopTitle?: string;               // optional override; default "Kalshi alert"
}

export interface Synthetic {
  id: string;                          // 'syn-<uuid>'
  kind: SyntheticKind;
  ticker: string;
  side: Side;
  positionSize: number;
  params: SyntheticParams;
  state: SyntheticState;
  status: SyntheticStatus;
  createdAt: string;
  firedAt?: string;
  canceledAt?: string;
  fireFailedAt?: string;
  fireFailedReason?: string;
  selfTradePrevention: SelfTradePrevention;
  autoCancelOnZeroPosition: boolean;
  parentId?: string;                   // set on OCO/bracket children
  action?: SyntheticAction;            // defaults to 'fire' when undefined
  notifyChannels?: NotifyChannelConfig[];  // required when action='notify'
}

export interface WatcherConfig {
  baseUrl: string;
  apiKeyEnv: string;
  privateKeyPathEnv: string;
  pollIntervalMs?: number;             // default 2000
  nearTriggerCadenceMs?: number;       // default 250
  nearTriggerThresholdCents?: number;  // default 3
  idleIntervalMs?: number;             // default 10000 (when zero registered)
  orderbookDepth?: number;             // default 20
  killSwitchPath?: string;
  watcherJournalPath?: string;         // default ~/.kalshi-exit-assistant/watchers.ndjson
  /** Base ExitConfig to merge per-fire (provides ports, env vars, fees, etc.). */
  exitConfigTemplate?: Partial<ExitConfig>;
}

// ── Edge analytics types (SH-EDGE Phase A) ────────────────────────────────────

export type MarketCategory = 'nfl' | 'entertainment' | 'political' | 'weather' | 'other';

/** A single entry or exit fill within a fire. */
export interface FillRecord {
  priceCents: number;
  size: number;
  ts: string;
}

/**
 * A "fire" is the lifecycle unit for P&L attribution:
 * one job's entry fills + exit fills + resolution outcome.
 */
export interface Fire {
  fireId: string;
  jobId: string;
  strategy: string;
  ticker: string;
  marketCategory: MarketCategory;
  side: 'yes' | 'no';
  entryFills: FillRecord[];
  exitFills: FillRecord[];
  /** Mid-price at decision time (entry orderbook snapshot). */
  decisionMidCents?: number;
  /** Mid-price at arrival (used as fair-value for entry-edge computation). */
  arrivalMidCents?: number;
  /** Mid-price at exit decision time (for market_drift computation). */
  exitDecisionMidCents?: number;
  /** ISO 8601 timestamp when synthetic trigger was armed (if applicable). */
  triggerArmedAt?: string;
  /** SyntheticKind string when a trigger fired this job. */
  triggerKind?: string;
  /** Numeric trigger params (e.g. { trailCents: 5 }) for parameter-sensitivity analysis. */
  triggerParams?: Record<string, unknown>;
  /** Peak bid recorded by the watcher before trigger fire (trailing-stop / take-profit). */
  peakBidCents?: number;
  /** Optimal hindsight exit mid in cents (best possible exit within trigger window). */
  optimalHindsightMidCents?: number;
  /** Resolution price in cents (100 = YES resolved, 0 = NO resolved). */
  resolutionPriceCents?: number;
  /** Pre-computed TCA slippage total: sum(slippageCents × chunkSize) across all chunks. */
  slippageCents?: number;
  /** True if market has not yet resolved (mark-to-mid used instead of resolution price). */
  unresolved: boolean;
}

/** Additive P&L decomposition for one fire (all in dollars). */
export interface EdgeComponents {
  /** (arrivalMid − entryFill) × entrySize / 100 */
  entryEdgeDollars: number;
  /** (exitFill − benchmarkExit) × exitSize / 100 */
  exitEdgeDollars: number;
  /** (exitDecisionMid − entryDecisionMid) × exitSize / 100 */
  marketDriftDollars: number;
  /** sum(TCA slippageCents × chunkSize) / 100 */
  slippageDollars: number;
  /** (realizedExitMid − optimalHindsightMid) × exitSize / 100 */
  triggerQualityDollars: number;
  /** realizedPnL − sum(above components); non-zero = rounding / attribution gap */
  residualDollars: number;
  /** Realized P&L: exitProceeds − entryOutlay + resolution − fees */
  realizedPnLDollars: number;
}

export interface EdgeSnapshotStrategyRow {
  strategy: string;
  fires: number;
  totalRealizedPnLDollars: number;
  avgEdgePerFireDollars: number;
  sharpeIsh: number;
  attribution: EdgeComponents;
}

export interface EdgeSnapshotMarketRow {
  category: MarketCategory;
  fires: number;
  totalRealizedPnLDollars: number;
}

export interface EdgeSnapshotTriggerHistogram {
  triggerKind: string;
  tooEarly: number;
  onTime: number;
  tooLate: number;
  totalFires: number;
}

/** Persisted snapshot: ${KEA_HOME}/edge-snapshots/<YYYY-MM-DD>.json. */
export interface EdgeSnapshot {
  generatedAt: string;
  since: string;
  until: string;
  totalFires: number;
  unresolvedFires: number;
  totals: EdgeComponents;
  perStrategy: EdgeSnapshotStrategyRow[];
  perMarket: EdgeSnapshotMarketRow[];
  triggerHistogram: EdgeSnapshotTriggerHistogram[];
}

export interface SyntheticEvalResult {
  fire: boolean;
  reason?: string;
  newState?: SyntheticState;
  unregister?: boolean;
  cancelSiblings?: string[];           // for child fires that should cancel parent siblings
  /** Float distance from current top-of-side price to trigger; used for adaptive cadence. */
  distanceCentsToTrigger?: number;
  /**
   * Peak bid (float cents) recorded by trailing-style evaluators at the moment of fire.
   * Populated by trailing_stop and step_trail; undefined for non-trailing evaluators.
   * Written into the `synthetic_fired` journal entry for SH-EDGE trigger-quality attribution.
   */
  peakBidCents?: number;
  /**
   * The SyntheticKind string of the evaluator that produced this result.
   * Written into the `synthetic_fired` journal entry so SH-EDGE can bucket fires by type.
   */
  triggerKind?: string;
}
