// src/regime.ts
export type RegimeLabel = 'rising' | 'falling' | 'sideways' | 'dead';

export interface SnapshotSlice {
  orderbook: {
    yes: Array<{ priceCents: number; size: number }>;
    no:  Array<{ priceCents: number; size: number }>;
  };
}

export interface RegimeThresholds {
  /** Below this range, classify as 'dead'. */
  deadRangeCents: number;
  /** Absolute delta above this magnitude triggers directional. */
  directionalDeltaCents: number;
}

const DEFAULT_THRESHOLDS: RegimeThresholds = {
  deadRangeCents: 1,
  directionalDeltaCents: 5,
};

/**
 * Threshold helper that scales with window length:
 * - 10-tick window: deadRange=1, directionalDelta=2
 * - 50-tick window: deadRange=5, directionalDelta=10
 * - 500-tick window: deadRange=50, directionalDelta=100
 *
 * Preserves "roughly 10% of the window's expected drift" semantics across
 * lengths so short windows don't all classify as 'dead'.
 */
export function proportionalThresholds(windowLength: number): RegimeThresholds {
  return {
    deadRangeCents: Math.max(1, windowLength * 0.1),
    directionalDeltaCents: Math.max(2, windowLength * 0.2),
  };
}

function midOf(snap: SnapshotSlice): number {
  const bestYesBid = snap.orderbook.yes[0]?.priceCents ?? 0;
  const bestNoBid  = snap.orderbook.no[0]?.priceCents ?? 0;
  if (bestYesBid > 0 && bestNoBid > 0) return (bestYesBid + (100 - bestNoBid)) / 2;
  return bestYesBid || (100 - bestNoBid) || 50;
}

/**
 * Classify the price-action regime of a snapshot window.
 * Default thresholds match scripts/recording-catalog.mjs so a primitive call
 * on a full recording produces the same label as the catalog. Pass a custom
 * `thresholds` (e.g. proportionalThresholds(window.length)) to scale with
 * window length for short-window classification.
 */
export function detectRegime(
  window: SnapshotSlice[],
  thresholds: RegimeThresholds = DEFAULT_THRESHOLDS,
): RegimeLabel {
  if (window.length < 2) return 'dead';
  const mids = window.map(midOf).filter((m) => m > 0);
  if (mids.length < 2) return 'dead';
  const first = mids[0]!;
  const last = mids[mids.length - 1]!;
  const range = Math.max(...mids) - Math.min(...mids);
  const delta = last - first;
  if (range <= thresholds.deadRangeCents) return 'dead';
  if (delta > thresholds.directionalDeltaCents) return 'rising';
  if (delta < -thresholds.directionalDeltaCents) return 'falling';
  return 'sideways';
}
