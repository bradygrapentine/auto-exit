/**
 * attribution.ts — P&L decomposition per fire (spec §4).
 *
 * Pure math module. No I/O, no side effects.
 * All internal computation in cents-per-contract; output in dollars.
 *
 * Invariant (within 1¢ tolerance):
 *   entryEdge + exitEdge + marketDrift + slippage + triggerQuality + residual
 *   === realizedPnL
 */

import type { Fire, EdgeComponents } from '../types.js';
import {
  passiveHoldBenchmark,
  optimalHindsightBenchmark,
} from './benchmarks.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Weighted-average fill price in cents. Returns 0 for empty fills. */
function wavg(fills: Array<{ priceCents: number; size: number }>): number {
  const totalSize = fills.reduce((s, f) => s + f.size, 0);
  if (totalSize === 0) return 0;
  return fills.reduce((s, f) => s + f.priceCents * f.size, 0) / totalSize;
}

/** Total size across fills. */
function totalSize(fills: Array<{ priceCents: number; size: number }>): number {
  return fills.reduce((s, f) => s + f.size, 0);
}

/** Convert cents to dollars (safe for sub-cent inputs). */
function centsToDollars(cents: number): number {
  return cents / 100;
}

// ── Core attribution ──────────────────────────────────────────────────────────

/**
 * Decompose a fire's realized P&L into 5 additive edge components.
 *
 * Components (all in dollars, summing to realizedPnL − residual):
 *
 *   entryEdge      = (arrivalMid − entryFill) × entrySize
 *   exitEdge       = (exitFill − benchmarkExit) × exitSize
 *   marketDrift    = (exitDecisionMid − entryDecisionMid) × exitSize
 *   slippage       = sum(TCA slippageCents × chunkSize) [already in fire.slippageCents]
 *   triggerQuality = (realizedExitMid − optimalHindsightMid) × exitSize
 *   residual       = realizedPnL − (entryEdge + exitEdge + marketDrift + slippage + triggerQuality)
 *
 * For fires without trigger arming (no triggerArmedAt), triggerQuality = 0.
 */
export function attribute(fire: Fire): EdgeComponents {
  const entrySize = totalSize(fire.entryFills);
  const exitSize = totalSize(fire.exitFills);

  const entryFillCents = wavg(fire.entryFills);
  const exitFillCents = wavg(fire.exitFills);

  // arrivalMidCents: mid at decision time (used as fair-value for entry edge).
  const arrivalMid = fire.arrivalMidCents ?? fire.decisionMidCents ?? entryFillCents;

  // benchmarkExit: passive-hold-to-resolution for resolved; decision-time mid for unresolved.
  const benchmarkExitCents = passiveHoldBenchmark(fire);

  // decisionMid at entry vs exit time for market_drift.
  const entryDecisionMid = fire.decisionMidCents ?? entryFillCents;
  const exitDecisionMid = fire.exitDecisionMidCents ?? exitFillCents;

  // optimalHindsight for trigger quality.
  const optimalHindsightMid = optimalHindsightBenchmark(fire);

  // ── Component computation in cents × contracts ──────────────────────────────

  // entry_edge = (arrivalMid − entryFill) × entrySize   [cents·contracts]
  const entryEdgeCents = (arrivalMid - entryFillCents) * entrySize;

  // exit_edge = (exitFill − benchmarkExit) × exitSize
  const exitEdgeCents = (exitFillCents - benchmarkExitCents) * exitSize;

  // market_drift = (exitDecisionMid − entryDecisionMid) × exitSize
  const marketDriftCents = (exitDecisionMid - entryDecisionMid) * exitSize;

  // slippage = pre-computed from TCA entries stored on fire (cents·contracts already summed)
  // The fire carries slippageCents as a raw total (sum of slippageCents × chunkSize).
  const totalSlippageCents = fire.slippageCents ?? 0;

  // trigger_quality = (realizedExitMid − optimalHindsightMid) × exitSize
  // Only meaningful when trigger was armed.
  const realizedExitMid = exitFillCents;
  const triggerQualityCents = fire.triggerArmedAt !== undefined
    ? (realizedExitMid - optimalHindsightMid) * exitSize
    : 0;

  // ── realizedPnL = exitProceeds − entryOutlay + resolution − fees ────────────
  // In cents×contracts space:
  //   exitProceeds = exitFill × exitSize
  //   entryOutlay  = entryFill × entrySize
  //   resolution   = resolutionPrice × (entrySize − exitSize)  [remaining position at resolution]
  //   fees         = 0 (excluded in v1; included as residual driver)
  const remainingSize = Math.max(0, entrySize - exitSize);
  const resolutionCents = fire.resolutionPriceCents !== undefined
    ? fire.resolutionPriceCents * remainingSize
    : (fire.arrivalMidCents ?? entryFillCents) * remainingSize; // mark-to-mid for unresolved
  const realizedPnLCents =
    exitFillCents * exitSize - entryFillCents * entrySize + resolutionCents;

  // ── Sum components, compute residual ────────────────────────────────────────
  const sumComponentsCents =
    entryEdgeCents + exitEdgeCents + marketDriftCents +
    totalSlippageCents + triggerQualityCents;

  const residualCents = realizedPnLCents - sumComponentsCents;

  return {
    entryEdgeDollars:      centsToDollars(entryEdgeCents),
    exitEdgeDollars:       centsToDollars(exitEdgeCents),
    marketDriftDollars:    centsToDollars(marketDriftCents),
    slippageDollars:       centsToDollars(totalSlippageCents),
    triggerQualityDollars: centsToDollars(triggerQualityCents),
    residualDollars:       centsToDollars(residualCents),
    realizedPnLDollars:    centsToDollars(realizedPnLCents),
  };
}
