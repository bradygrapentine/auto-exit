// src/regime.ts
export type RegimeLabel = 'rising' | 'falling' | 'sideways' | 'dead';

export interface SnapshotSlice {
  orderbook: {
    yes: Array<{ priceCents: number; size: number }>;
    no:  Array<{ priceCents: number; size: number }>;
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
 * Thresholds match scripts/recording-catalog.mjs so a primitive call on a
 * full recording produces the same label as the catalog.
 */
export function detectRegime(window: SnapshotSlice[]): RegimeLabel {
  if (window.length < 2) return 'dead';
  const mids = window.map(midOf).filter((m) => m > 0);
  if (mids.length < 2) return 'dead';
  const first = mids[0]!;
  const last = mids[mids.length - 1]!;
  const range = Math.max(...mids) - Math.min(...mids);
  const delta = last - first;
  if (range <= 1) return 'dead';
  if (delta > 5) return 'rising';
  if (delta < -5) return 'falling';
  return 'sideways';
}
