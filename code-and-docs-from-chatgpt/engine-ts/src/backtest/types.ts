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
