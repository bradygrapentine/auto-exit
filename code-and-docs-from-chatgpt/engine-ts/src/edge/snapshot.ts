/**
 * snapshot.ts — persist and read EdgeSnapshot JSON files.
 *
 * Snapshots are written to ${KEA_HOME}/edge-snapshots/<YYYY-MM-DD>.json.
 * Same journal + same lookback = same snapshot (deterministic per spec §8).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { EdgeSnapshot, Fire } from '../types.js';
import { attribute } from './attribution.js';
import { groupByStrategy, groupByMarket, triggerHistogram } from './aggregate.js';

const DEFAULT_KEA_HOME = path.join(
  process.env['HOME'] ?? '/tmp',
  '.kalshi-exit-assistant',
);

function kealHome(): string {
  return process.env['KEA_HOME'] ?? DEFAULT_KEA_HOME;
}

/** Build an EdgeSnapshot from a set of fires within a time window. */
export function buildSnapshot(opts: {
  since: string;
  until: string;
  fires: Fire[];
}): EdgeSnapshot {
  const { since, until, fires } = opts;

  const strategyGroups = groupByStrategy(fires);
  const marketGroups = groupByMarket(fires);
  const histogram = triggerHistogram(fires);

  const perStrategy = strategyGroups.map((g) => ({
    strategy: g.strategy,
    fires: g.fires.length,
    totalRealizedPnLDollars: g.totalRealizedPnLDollars,
    avgEdgePerFireDollars: g.avgEdgePerFireDollars,
    sharpeIsh: g.sharpeIsh,
    attribution: g.attribution,
  }));

  const perMarket = marketGroups.map((g) => ({
    category: g.category,
    fires: g.fires.length,
    totalRealizedPnLDollars: g.totalRealizedPnLDollars,
  }));

  const allAttributions = fires.map((f) => attribute(f));
  const totals = allAttributions.reduce(
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
      slippageDollars: 0, triggerQualityDollars: 0,
      residualDollars: 0, realizedPnLDollars: 0,
    },
  );

  return {
    generatedAt: new Date().toISOString(),
    since,
    until,
    totalFires: fires.length,
    unresolvedFires: fires.filter((f) => f.unresolved).length,
    totals,
    perStrategy,
    perMarket,
    triggerHistogram: histogram,
  };
}

/** Write a snapshot to ${KEA_HOME}/edge-snapshots/<YYYY-MM-DD>.json. */
export function writeSnapshot(snapshot: EdgeSnapshot, filePath?: string): string {
  const dir = filePath
    ? path.dirname(filePath)
    : path.join(kealHome(), 'edge-snapshots');

  fs.mkdirSync(dir, { recursive: true });

  const outPath = filePath ?? path.join(
    dir,
    `${snapshot.until.slice(0, 10)}.json`,
  );

  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf8');
  return outPath;
}

/** Read a snapshot from disk. Throws if file not found or invalid JSON. */
export function readSnapshot(filePath: string): EdgeSnapshot {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as EdgeSnapshot;
}
