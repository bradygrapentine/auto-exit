/** SH-BACKTEST Phase A — shared types for recorder + retention + list. */

// ---------------------------------------------------------------------------
// Orderbook input type — mirrors src/types.ts PriceLevel-based Orderbook.
// Recorder accepts this shape and serializes as [[priceCents, qty], ...] tuples.
// ---------------------------------------------------------------------------

export interface PriceLevelInput {
  priceCents: number;
  size: number;
}

export interface OrderbookInput {
  yes: PriceLevelInput[];
  no: PriceLevelInput[];
}

// ---------------------------------------------------------------------------
// RecordingEntry — discriminated union, spec §6.1
// ---------------------------------------------------------------------------

export interface SnapshotEntry {
  kind: 'snapshot';
  ts: string;
  ticker: string;
  orderbook: {
    yes: Array<[number, number]>; // [priceCents, qty]
    no: Array<[number, number]>;
  };
  depth_levels: number;
  poll_latency_ms?: number;
}

export interface PositionEntry {
  kind: 'position';
  ts: string;
  ticker: string;
  side: 'yes' | 'no';
  quantity: number;
  avg_cost_cents: number;
  delta: {
    filled: number;
    side: 'yes' | 'no';
    price_cents: number;
  };
}

export interface FillEntry {
  kind: 'fill';
  ts: string;
  ticker: string;
  order_id: string;
  side: 'yes' | 'no';
  size: number;
  price_cents: number;
  is_taker: boolean;
  fees_cents: number;
}

export type RecordingEntry = SnapshotEntry | PositionEntry | FillEntry;

// ---------------------------------------------------------------------------
// Recorder interface
// ---------------------------------------------------------------------------

export interface Recorder {
  appendSnapshot(
    orderbook: OrderbookInput,
    position?: Omit<PositionEntry, 'kind' | 'ts' | 'ticker'>,
    latencyMs?: number,
  ): void;
  appendPosition(entry: Omit<PositionEntry, 'kind' | 'ts'>): void;
  appendFill(entry: Omit<FillEntry, 'kind' | 'ts'>): void;
  close(): void;
}

// ---------------------------------------------------------------------------
// RecordingFile — metadata returned by listRecordings()
// ---------------------------------------------------------------------------

export interface RecordingFile {
  path: string;
  ticker: string;
  date: string; // YYYYMMDD
  sizeBytes: number;
  gzipped: boolean;
}

// ---------------------------------------------------------------------------
// BacktestConfig — placeholder for Phase B
// ---------------------------------------------------------------------------

export interface BacktestConfig {
  recordingPath: string;
  strategyId: string;
  /** ISO timestamp range filter (optional). */
  tsFrom?: string;
  tsTo?: string;
  /** Arbitrary per-strategy parameter overrides. */
  params?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// CounterfactualReport — placeholder for Phase B.
// assumptions_warning required per spec §8.
// ---------------------------------------------------------------------------

export interface CounterfactualReport {
  strategyId: string;
  recordingPath: string;
  params: Record<string, unknown>;
  pnl_cents: number;
  fill_count: number;
  fill_rate: number;
  avg_slippage_cents: number;
  /**
   * Human-readable warnings describing which §8 fidelity caveats apply to
   * this run.  Operators must read these before trusting any P&L figure.
   *
   * Populated caveats (spec §8):
   *   1. Sub-cadence events invisible — fill rates over-estimated in fast markets.
   *   2. No market-impact modeling — fills served at recorded price regardless of size.
   *   3. Book may be contaminated if recorded during a live algo run.
   *   4. News-driven gaps: strategies see one tick at post-gap price.
   *   5. Single-ticker only — multi-leg strategies not supported.
   */
  assumptions_warning: string[];
  /** ISO timestamp of when the report was generated. */
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Phase B types — FillResult, FillModel, ReplayCursor, SimulatedPosition
// ---------------------------------------------------------------------------

/** Result of a single simulated fill. Cents-as-integers throughout. */
export interface FillResult {
  /** Contracts actually filled (≤ requested size). */
  filled: number;
  /** Contracts not filled (e.g. book depth < order size, or FOK rejected). */
  remaining: number;
  /** Weighted-average fill price in integer cents. 0 when filled=0. */
  fillPriceCents: number;
  /** True when the order was the aggressor (crossed the spread). */
  isTaker: boolean;
  /**
   * Taker fees in integer cents (rounded up, $0.01 minimum per Kalshi fee schedule).
   * Uses fee formula: rawFee = 0.07 * shares * (priceCents/100) * (1 - priceCents/100).
   * feesCents = max(ceil(rawFee * 100), 1) per fill segment, summed.
   */
  feesCents: number;
  /**
   * Warnings appended when the model has reduced fidelity for this order.
   * E.g. queue_aware stub returns fill=0 and flags the caveat here.
   */
  assumptionsAdded: string[];
}

/** Fill simulation model. 'naive' is the default; 'queue_aware' is experimental. */
export type FillModel = 'naive' | 'queue_aware';

/** Internal cursor state for the ReplayKalshiClient. */
export interface ReplayCursor {
  /** Index into the entries array of the current snapshot entry. */
  snapshotIndex: number;
  /** ISO timestamp of the entry at snapshotIndex. */
  ts: string;
}

/** Simulated position held by the replay client. */
export interface SimulatedPosition {
  ticker: string;
  side: 'yes' | 'no';
  quantity: number;
}

/** A single simulated fill record kept in the replay client's fill log. */
export interface SimulatedFillRecord {
  ts: string;
  ticker: string;
  orderId: string;
  side: 'yes' | 'no';
  requestedSize: number;
  filled: number;
  fillPriceCents: number;
  isTaker: boolean;
  feesCents: number;
}
