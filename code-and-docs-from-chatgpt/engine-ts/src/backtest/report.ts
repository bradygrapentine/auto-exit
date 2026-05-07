/**
 * SH-BACKTEST Phase B2 — report formatter.
 *
 * `formatReport(report, mode)` — JSON or markdown output.
 * `writeReport(report, path)` — write JSON to disk.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { CounterfactualReport } from './types.js';

// ---------------------------------------------------------------------------
// formatReport
// ---------------------------------------------------------------------------

/**
 * Format a CounterfactualReport as JSON or markdown.
 *
 * JSON mode: pretty-printed JSON string.
 * Markdown mode: human-readable summary (header, stats table, top-5 trace rows,
 * assumptions list).
 */
export function formatReport(
  report: CounterfactualReport,
  mode: 'json' | 'markdown',
): string {
  if (mode === 'json') {
    return JSON.stringify(report, null, 2);
  }
  return formatMarkdown(report);
}

function formatMarkdown(report: CounterfactualReport): string {
  const s = report.summary;
  const lines: string[] = [];

  // Header
  lines.push(
    `# Backtest Report — \`${report.strategyId}\``,
    '',
    `**Recording:** \`${report.recordingPath}\`  `,
    `**Generated:** ${report.generated_at}  `,
    `**Params:** \`${JSON.stringify(report.params)}\``,
    '',
  );

  // Summary table
  lines.push('## Summary', '');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| P&L | ${s.pnl_cents}¢ |`);
  lines.push(`| Fill count | ${s.fill_count} |`);
  lines.push(`| Fill rate | ${(s.fill_rate * 100).toFixed(1)}% |`);
  lines.push(`| Avg slippage vs mid | ${s.avg_slippage_cents}¢ |`);
  lines.push(`| Time to full exit | ${s.time_to_full_exit_s < 0 ? 'never' : `${s.time_to_full_exit_s}s`} |`);
  lines.push(`| Max adverse excursion | ${s.max_adverse_excursion_cents}¢ |`);
  lines.push(`| Max favorable excursion | ${s.max_favorable_excursion_cents}¢ |`);
  lines.push('');

  // Top-5 trace rows
  if (report.trace.length > 0) {
    lines.push('## Trace (first 5 ticks)', '');
    lines.push('| ts | mid¢ | fills | remaining | pnl¢ |');
    lines.push('|----|------|-------|-----------|------|');
    const top5 = report.trace.slice(0, 5);
    for (const row of top5) {
      lines.push(
        `| ${row.ts} | ${row.midCents} | ${row.fillsSoFar} | ${row.remaining} | ${row.pnl_cents} |`,
      );
    }
    lines.push('');
  }

  // Assumptions
  lines.push('## Fidelity Assumptions', '');
  for (const w of report.assumptions_warning) {
    lines.push(`- ${w}`);
  }
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// writeReport
// ---------------------------------------------------------------------------

/**
 * Write a CounterfactualReport as JSON to the given file path.
 * Creates parent directories if needed.
 */
export function writeReport(report: CounterfactualReport, filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
}
