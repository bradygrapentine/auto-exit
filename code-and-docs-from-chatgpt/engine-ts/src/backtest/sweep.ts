/**
 * SH-BACKTEST Phase B2 — parameter sweep.
 *
 * `runSweep(config)` — expands a cartesian product of grid values,
 * runs `runBacktest` for each combination (serial in v1; parallel deferred
 * per spec §4.4 as v1.5), and returns a ranked SweepResult.
 *
 * Grid example:
 *   { trailCents: [3, 5, 7], stopPriceCents: [40, 45] }
 *   → 6 combinations, each merged with baseParams.
 *
 * Output: { rows, table (markdown), ndjson } — table sorted by rankBy.
 */

import { runBacktest } from './harness.js';
import type { BacktestConfig, SweepConfig, SweepResult, SweepRow } from './types.js';

// ---------------------------------------------------------------------------
// Cartesian product helper
// ---------------------------------------------------------------------------

/**
 * Expand a SweepGrid into an array of flat param objects.
 * Each key's values are crossed against all others.
 * If grid is empty, returns [{}] (one run with baseParams only).
 */
export function cartesianProduct(
  grid: Record<string, unknown[]>,
): Array<Record<string, unknown>> {
  const keys = Object.keys(grid);
  if (keys.length === 0) return [{}];

  let result: Array<Record<string, unknown>> = [{}];
  for (const key of keys) {
    const values = grid[key]!;
    const next: Array<Record<string, unknown>> = [];
    for (const existing of result) {
      for (const val of values) {
        next.push({ ...existing, [key]: val });
      }
    }
    result = next;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Markdown table builder
// ---------------------------------------------------------------------------

function buildMarkdownTable(
  rows: SweepRow[],
  rankBy: keyof SweepRow['summary'],
): string {
  if (rows.length === 0) return '_No results._\n';

  // Collect all param keys across rows
  const paramKeys = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r.params))),
  ).sort();

  const summaryKeys: Array<keyof SweepRow['summary']> = [
    'pnl_cents',
    'fill_count',
    'fill_rate',
    'avg_slippage_cents',
    'time_to_full_exit_s',
    'max_adverse_excursion_cents',
    'max_favorable_excursion_cents',
  ];

  const headerCols = [...paramKeys, ...summaryKeys];
  const lines: string[] = [];

  // Rank label
  lines.push(`_Ranked by \`${rankBy}\` (descending)_`, '');

  lines.push(`| ${headerCols.join(' | ')} |`);
  lines.push(`| ${headerCols.map(() => '---').join(' | ')} |`);

  for (const row of rows) {
    const cells = [
      ...paramKeys.map((k) => String(row.params[k] ?? '')),
      ...summaryKeys.map((k) => {
        const v = row.summary[k];
        if (k === 'fill_rate') return (Number(v) * 100).toFixed(1) + '%';
        return String(v);
      }),
    ];
    lines.push(`| ${cells.join(' | ')} |`);
  }

  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// runSweep
// ---------------------------------------------------------------------------

/**
 * Run a parameter sweep: cartesian-expand grid, run backtest per combination,
 * rank by the specified summary field (default pnl_cents).
 *
 * v1: serial execution. Parallel dispatch deferred to v1.5 per spec §4.4.
 */
export async function runSweep(config: SweepConfig): Promise<SweepResult> {
  const rankBy: keyof SweepRow['summary'] = config.rankBy ?? 'pnl_cents';
  const combinations = cartesianProduct(config.grid);

  const rows: SweepRow[] = [];

  for (const combo of combinations) {
    const mergedParams: Record<string, unknown> = {
      ...(config.baseParams ?? {}),
      ...combo,
    };

    const btConfig: BacktestConfig = {
      recordingPath: config.recordingPath,
      strategyId: config.strategyId,
      params: mergedParams,
      fillModel: config.fillModel,
      initialPosition: config.initialPosition,
      tsFrom: config.tsFrom,
      tsTo: config.tsTo,
    };

    const report = await runBacktest(btConfig);

    rows.push({ params: mergedParams, summary: report.summary });
  }

  // Sort descending by rankBy
  rows.sort((a, b) => {
    const av = Number(a.summary[rankBy]);
    const bv = Number(b.summary[rankBy]);
    return bv - av;
  });

  const table = buildMarkdownTable(rows, rankBy);
  const ndjson = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';

  return { rows, table, ndjson };
}
