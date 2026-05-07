/**
 * benchmarks.ts — counterfactual exit benchmarks for a Fire.
 *
 * Pure math, no I/O, no side effects. All values in cents.
 */

import type { Fire } from '../types.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Weighted-average fill price across fills, in cents. Returns 0 if no fills. */
function wavg(fills: Array<{ priceCents: number; size: number }>): number {
  const totalSize = fills.reduce((s, f) => s + f.size, 0);
  if (totalSize === 0) return 0;
  return fills.reduce((s, f) => s + f.priceCents * f.size, 0) / totalSize;
}

// ── Benchmarks ────────────────────────────────────────────────────────────────

/**
 * Passive-hold benchmark: hold until resolution.
 *
 * Returns resolutionPriceCents if resolved, or decisionMidCents
 * (at entry time) as stable fallback for unresolved fires.
 */
export function passiveHoldBenchmark(fire: Fire): number {
  if (fire.resolutionPriceCents !== undefined) return fire.resolutionPriceCents;
  return fire.decisionMidCents ?? wavg(fire.entryFills);
}

/**
 * Immediate-exit benchmark: exit at decision-time mid.
 *
 * Represents the counterfactual of immediately crossing the spread at
 * decision time. Uses arrivalMidCents if available, else decisionMidCents.
 */
export function immediateExitBenchmark(fire: Fire): number {
  return fire.arrivalMidCents ?? fire.decisionMidCents ?? wavg(fire.entryFills);
}

/**
 * Optimal-hindsight benchmark: best possible exit mid within the trigger window.
 *
 * For take-profit style fires (sell at peak): use peakBidCents.
 * For stop-loss style fires (sell at trough): use the lowest exit fill as proxy.
 * Falls back to the realized exit WAVG if neither is available.
 *
 * TODO(SH-EDGE Phase B): when SH-WATCH emits richer peakBidCents / troughBidCents
 * in 'synthetic_fired' data, use those directly.
 */
export function optimalHindsightBenchmark(fire: Fire): number {
  if (fire.peakBidCents !== undefined) return fire.peakBidCents;
  // Heuristic: for stop-loss triggers, use minimum exit fill (worst you could do = stop level).
  const exitMids = fire.exitFills.map((f) => f.priceCents);
  if (exitMids.length > 0) {
    const kind = fire.triggerKind ?? '';
    if (kind === 'stop_loss' || kind === 'trailing_stop' || kind === 'step_trail') {
      return Math.min(...exitMids);
    }
    return Math.max(...exitMids);
  }
  return fire.decisionMidCents ?? 0;
}
