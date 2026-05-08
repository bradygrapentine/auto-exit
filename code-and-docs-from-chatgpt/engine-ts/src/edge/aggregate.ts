/**
 * aggregate.ts — group fires by strategy, market, trigger; histogram; param sensitivity.
 *
 * Pure computation. No I/O, no side effects.
 */

import type { Fire, EdgeComponents } from '../types.js';
import type { MarketCategory } from '../types.js';
import { attribute } from './attribution.js';

// ── Output shapes ─────────────────────────────────────────────────────────────

export interface StrategyGroup {
  strategy: string;
  fires: Fire[];
  totalRealizedPnLDollars: number;
  avgEdgePerFireDollars: number;
  /** mean edge / stdev edge; NaN when n < 2 */
  sharpeIsh: number;
  attribution: EdgeComponents;  // summed across all fires in group
}

export interface MarketGroup {
  category: MarketCategory;
  fires: Fire[];
  totalRealizedPnLDollars: number;
}

export interface TriggerHistogram {
  /** triggerKind or 'unspecified' */
  triggerKind: string;
  tooEarly: number;    // realizedExitMid < optimalHindsightMid − 1¢
  onTime: number;      // |realizedExitMid − optimalHindsightMid| ≤ 1¢
  tooLate: number;     // realizedExitMid > optimalHindsightMid + 1¢
  totalFires: number;
}

export interface ParamSensitivityRow {
  paramValue: number;
  fires: number;
  totalEdgeDollars: number;
}

export interface ParamSensitivity {
  paramName: string;
  rows: ParamSensitivityRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sumComponents(attributions: EdgeComponents[]): EdgeComponents {
  return attributions.reduce(
    (acc, c) => ({
      entryEdgeDollars:      acc.entryEdgeDollars      + c.entryEdgeDollars,
      exitEdgeDollars:       acc.exitEdgeDollars        + c.exitEdgeDollars,
      marketDriftDollars:    acc.marketDriftDollars     + c.marketDriftDollars,
      slippageDollars:       acc.slippageDollars        + c.slippageDollars,
      triggerQualityDollars: acc.triggerQualityDollars  + c.triggerQualityDollars,
      residualDollars:       acc.residualDollars        + c.residualDollars,
      realizedPnLDollars:    acc.realizedPnLDollars     + c.realizedPnLDollars,
    }),
    {
      entryEdgeDollars: 0, exitEdgeDollars: 0, marketDriftDollars: 0,
      slippageDollars: 0, triggerQualityDollars: 0, residualDollars: 0,
      realizedPnLDollars: 0,
    },
  );
}

function stdev(values: number[]): number {
  if (values.length < 2) return NaN;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// ── Exports ───────────────────────────────────────────────────────────────────

/** Group fires by strategy name. */
export function groupByStrategy(fires: Fire[]): StrategyGroup[] {
  const map = new Map<string, Fire[]>();
  for (const f of fires) {
    const bucket = map.get(f.strategy) ?? [];
    bucket.push(f);
    map.set(f.strategy, bucket);
  }

  const groups: StrategyGroup[] = [];
  for (const [strategy, group] of map.entries()) {
    const attributions = group.map((f) => attribute(f));
    const pnls = attributions.map((a) => a.realizedPnLDollars);
    const totalPnL = pnls.reduce((s, v) => s + v, 0);
    const avg = pnls.length > 0 ? totalPnL / pnls.length : 0;
    const sd = stdev(pnls);
    groups.push({
      strategy,
      fires: group,
      totalRealizedPnLDollars: totalPnL,
      avgEdgePerFireDollars: avg,
      sharpeIsh: sd > 0 ? avg / sd : NaN,
      attribution: sumComponents(attributions),
    });
  }
  return groups.sort((a, b) => a.strategy.localeCompare(b.strategy));
}

/** Group fires by market category. */
export function groupByMarket(fires: Fire[]): MarketGroup[] {
  const map = new Map<MarketCategory, Fire[]>();
  for (const f of fires) {
    const cat = f.marketCategory;
    const bucket = map.get(cat) ?? [];
    bucket.push(f);
    map.set(cat, bucket);
  }

  const groups: MarketGroup[] = [];
  for (const [category, group] of map.entries()) {
    const total = group
      .map((f) => attribute(f).realizedPnLDollars)
      .reduce((s, v) => s + v, 0);
    groups.push({ category, fires: group, totalRealizedPnLDollars: total });
  }
  return groups.sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Per-trigger fire-quality histogram (spec §5.2).
 *
 * Bins: tooEarly (exit < optimalHindsight − 1¢), onTime (±1¢), tooLate (> +1¢).
 * Only fires with triggerArmedAt set are included.
 */
export function triggerHistogram(fires: Fire[]): TriggerHistogram[] {
  const map = new Map<string, TriggerHistogram>();

  for (const f of fires) {
    if (!f.triggerArmedAt) continue;
    const kind = f.triggerKind ?? 'unspecified';
    const existing = map.get(kind) ?? {
      triggerKind: kind,
      tooEarly: 0,
      onTime: 0,
      tooLate: 0,
      totalFires: 0,
    };

    const comp = attribute(f);
    // triggerQualityDollars > 0 → sold above optimal → shouldn't happen for take-profit
    // triggerQualityDollars < −0.01 → too early  (sold below optimal by >1¢/contract proxy)
    // We use triggerQualityDollars as the signal; 1¢ tolerance per spec.
    const tqCents = comp.triggerQualityDollars * 100;
    if (tqCents < -1) {
      existing.tooEarly++;
    } else if (tqCents > 1) {
      existing.tooLate++;
    } else {
      existing.onTime++;
    }
    existing.totalFires++;
    map.set(kind, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.triggerKind.localeCompare(b.triggerKind));
}

/**
 * Parameter-sensitivity: realized edge grouped by a numeric param value on the fire.
 *
 * `paramName` is looked up in fire's triggerParams (if present) or top-level fire fields.
 * Fires that don't have the param are skipped.
 */
export function paramSensitivity(fires: Fire[], paramName: string): ParamSensitivity {
  const map = new Map<number, { fires: number; totalEdge: number }>();

  for (const f of fires) {
    const params = f.triggerParams as Record<string, unknown> | undefined;
    const val = params?.[paramName];
    if (typeof val !== 'number') continue;
    const bucket = map.get(val) ?? { fires: 0, totalEdge: 0 };
    const comp = attribute(f);
    bucket.fires++;
    bucket.totalEdge += comp.realizedPnLDollars;
    map.set(val, bucket);
  }

  const rows: ParamSensitivityRow[] = Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([paramValue, { fires: n, totalEdge }]) => ({
      paramValue,
      fires: n,
      totalEdgeDollars: totalEdge,
    }));

  return { paramName, rows };
}
