#!/usr/bin/env node
/**
 * Strategy comparison sweep v3 — Cartesian-expanded parameter grids.
 *
 * For each strategy, run the full grid × every recording, capture the summary,
 * emit a markdown runbook with per-strategy ranked tables and cross-recording
 * winners.
 *
 * Usage: node scripts/strategy-sweep-v3.mjs > /tmp/sweep-v3.md 2>&1
 */
import { runBacktest } from '../dist/backtest/harness.js';
import path from 'node:path';
import os from 'node:os';

const REC_DIR = path.join(os.homedir(), '.kea/recordings');

const RECORDINGS = [
  { name: 'KXINXU',        ticker: 'KXINXU-26MAY08H1600-T7324.9999', file: 'KXINXU-26MAY08H1600-T7324.9999-20260508.ndjson' },
  { name: 'KXBTCD',        ticker: 'KXBTCD-26MAY0817-T80999.99',     file: 'KXBTCD-26MAY0817-T80999.99-20260507.ndjson' },
  { name: 'KXFEDDECISION', ticker: 'KXFEDDECISION-27JUN-C25',         file: 'KXFEDDECISION-27JUN-C25-20260508.ndjson' },
  { name: 'KXBTC15M',      ticker: 'KXBTC15M-26MAY071730-30',         file: 'KXBTC15M-26MAY071730-30-20260508.ndjson' },
  { name: 'KXHIGHLAX',     ticker: 'KXHIGHLAX-26MAY07-T75',           file: 'KXHIGHLAX-26MAY07-T75-20260508.ndjson' },
];

const STRATEGY_GRIDS = [
  { id: 's-aggressive',  paramGrid: {} },
  { id: 's-passive',     paramGrid: { chunkSize: [25, 50, 100], walkStepCents: [1, 2, 5] } },
  { id: 's-twap',        paramGrid: { numIntervals: [2, 5, 10], intervalMinutes: [1, 5] } },
  { id: 's-trail',       paramGrid: { trailCents: [1, 3, 5, 10] } },
  { id: 'trailing_stop', paramGrid: { trailCents: [1, 3, 5, 10] } },
  { id: 'stop_loss',     paramGrid: { stopPriceCents: [10, 30, 50] } },
  { id: 'take_profit',   paramGrid: { targetPriceCents: [40, 50, 60] } },
  { id: 'bracket',       paramGrid: { targetPriceCents: [50, 60], stopPriceCents: [20, 30] } },
];

const INIT_POS_QTY = 100;
const SLIPPAGE_FLOOR = -50;

function cartesian(grid) {
  const keys = Object.keys(grid);
  if (keys.length === 0) return [{}];
  const values = keys.map(k => grid[k]);
  const out = [];
  function rec(idx, acc) {
    if (idx === keys.length) { out.push({ ...acc }); return; }
    for (const v of values[idx]) { acc[keys[idx]] = v; rec(idx + 1, acc); }
  }
  rec(0, {});
  return out;
}

function paramLabel(p) {
  const entries = Object.entries(p);
  if (entries.length === 0) return '(defaults)';
  return entries.map(([k, v]) => `${k}=${v}`).join(', ');
}

async function runOne(rec, strategyId, params) {
  const fullParams = { ...params, ticker: rec.ticker };
  if (strategyId === 'stop_loss') {
    fullParams.side = 'yes';
    fullParams.size = INIT_POS_QTY;
  }
  try {
    const report = await runBacktest({
      recordingPath: path.join(REC_DIR, rec.file),
      strategyId,
      params: fullParams,
      fillModel: 'naive',
      initialPosition: { ticker: rec.ticker, side: 'yes', quantity: INIT_POS_QTY },
    });
    return { ok: true, summary: report.summary };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function fmtRow(r) {
  if (!r.ok) return { pnl: '—', fills: '—', rate: '—', slip: '—', err: r.error };
  const s = r.summary;
  return {
    pnl: s.pnl_cents,
    fills: s.fill_count,
    rate: (s.fill_rate * 100).toFixed(0) + '%',
    slip: s.avg_slippage_cents.toFixed(0),
    err: '',
  };
}

(async () => {
  const allRows = [];
  let cellCount = 0;

  for (const strat of STRATEGY_GRIDS) {
    const paramCombos = cartesian(strat.paramGrid);
    for (const combo of paramCombos) {
      for (const rec of RECORDINGS) {
        cellCount++;
        process.stderr.write(`[v3 ${cellCount}] ${strat.id} ${paramLabel(combo)} × ${rec.name} ... `);
        const r = await runOne(rec, strat.id, combo);
        const row = { strategy: strat.id, params: combo, paramsLabel: paramLabel(combo), recording: rec.name, ...fmtRow(r) };
        allRows.push(row);
        process.stderr.write(r.ok ? `pnl=${r.summary.pnl_cents} fills=${r.summary.fill_count}\n` : `ERROR: ${r.error}\n`);
      }
    }
  }

  process.stderr.write(`\n[v3] Ran ${cellCount} cells across ${STRATEGY_GRIDS.length} strategies × ${RECORDINGS.length} recordings.\n\n`);

  // ── Full table ──────────────────────────────────────────────────────────────
  console.log('# Strategy Sweep v3 — Raw Results\n');
  console.log(`Total cells: ${cellCount}\n`);
  console.log('## All cells\n');
  console.log('| Strategy | Params | Recording | pnl¢ | fills | rate | slip¢ | error |');
  console.log('|---|---|---|---:|---:|---:|---:|---|');
  for (const r of allRows) {
    console.log(`| ${r.strategy} | ${r.paramsLabel} | ${r.recording} | ${r.pnl} | ${r.fills} | ${r.rate} | ${r.slip} | ${r.err} |`);
  }

  // ── Per-strategy best by recording ──────────────────────────────────────────
  console.log('\n## Best param config per recording (within each strategy)\n');
  for (const strat of STRATEGY_GRIDS) {
    const stratRows = allRows.filter(r => r.strategy === strat.id);
    console.log(`\n### ${strat.id}\n`);
    console.log('| Recording | Best params | pnl¢ | fills | slip¢ |');
    console.log('|---|---|---:|---:|---:|');
    for (const rec of RECORDINGS) {
      const cells = stratRows.filter(r => r.recording === rec.name && r.pnl !== '—');
      if (cells.length === 0) {
        console.log(`| ${rec.name} | — | — | — | — |`);
        continue;
      }
      // Filter by slippage floor; if all rows fail it, fall back to all rows
      const filtered = cells.filter(r => Number(r.slip) > SLIPPAGE_FLOOR);
      const pool = filtered.length > 0 ? filtered : cells;
      pool.sort((a, b) => Number(b.pnl) - Number(a.pnl));
      const best = pool[0];
      console.log(`| ${rec.name} | ${best.paramsLabel} | ${best.pnl} | ${best.fills} | ${best.slip} |`);
    }
  }

  // ── Cross-recording winners ─────────────────────────────────────────────────
  console.log('\n## Cross-recording winners (best avg pnl across recordings, slippage > -50)\n');
  console.log('| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |');
  console.log('|---|---|---:|---:|---:|');
  for (const strat of STRATEGY_GRIDS) {
    const stratRows = allRows.filter(r => r.strategy === strat.id && r.pnl !== '—');
    const paramCombos = cartesian(strat.paramGrid);
    const aggregated = paramCombos.map(combo => {
      const label = paramLabel(combo);
      const rows = stratRows.filter(r => r.paramsLabel === label && Number(r.slip) > SLIPPAGE_FLOOR);
      if (rows.length === 0) return null;
      const avgPnl = rows.reduce((s, r) => s + Number(r.pnl), 0) / rows.length;
      const avgSlip = rows.reduce((s, r) => s + Number(r.slip), 0) / rows.length;
      return { label, avgPnl, recordingsFilled: rows.length, avgSlip };
    }).filter(Boolean);
    if (aggregated.length === 0) {
      console.log(`| ${strat.id} | — | — | 0 | — |`);
      continue;
    }
    aggregated.sort((a, b) => b.avgPnl - a.avgPnl);
    const best = aggregated[0];
    console.log(`| ${strat.id} | ${best.label} | ${best.avgPnl.toFixed(0)} | ${best.recordingsFilled}/${RECORDINGS.length} | ${best.avgSlip.toFixed(0)} |`);
  }
})();
