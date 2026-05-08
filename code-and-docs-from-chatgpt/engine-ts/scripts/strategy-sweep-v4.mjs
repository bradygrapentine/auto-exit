#!/usr/bin/env node
/**
 * Strategy comparison sweep v4 — shape-diverse recordings + cost-basis
 * normalization. Cost basis is set per-recording to first-tick mid so pnl
 * numbers reflect "cents gained from entry mid" rather than from a synthetic
 * 50¢ baseline. Strategy grids same as v3 with chunkSize=200 added for
 * s-passive drill.
 */
import { runBacktest } from '../dist/backtest/harness.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as readline from 'node:readline';

const REC_DIR = path.join(os.homedir(), '.kea/recordings');

// Picked from 2026-05-08-recording-catalog.md for shape diversity.
const RECORDINGS = [
  { name: 'KXINXU (rising +9)',         ticker: 'KXINXU-26MAY08H1600-T7324.9999', file: 'KXINXU-26MAY08H1600-T7324.9999-20260508.ndjson', shape: 'rising' },
  { name: 'KXBTCD (rising +17)',        ticker: 'KXBTCD-26MAY0817-T80999.99',     file: 'KXBTCD-26MAY0817-T80999.99-20260507.ndjson',      shape: 'rising' },
  { name: 'KXHIGHNY (rising +16)',      ticker: 'KXHIGHNY-26MAY08-B64.5',         file: 'KXHIGHNY-26MAY08-B64.5-20260507.ndjson',          shape: 'rising' },
  { name: 'KXSPOTIFYD (falling -43)',   ticker: 'KXSPOTIFYD-26MAY08-DRO',         file: 'KXSPOTIFYD-26MAY08-DRO-20260507.ndjson',          shape: 'falling' },
  { name: 'KXHIGHCHI (falling -39)',    ticker: 'KXHIGHCHI-26MAY07-B60.5',        file: 'KXHIGHCHI-26MAY07-B60.5-20260507.ndjson',         shape: 'falling' },
  { name: 'KXSPACEXCOUNT (sideways)',   ticker: 'KXSPACEXCOUNT-26MAY-12',         file: 'KXSPACEXCOUNT-26MAY-12-20260508.ndjson',          shape: 'sideways' },
];

const STRATEGY_GRIDS = [
  { id: 's-aggressive',  paramGrid: {} },
  { id: 's-passive',     paramGrid: { chunkSize: [25, 50, 100, 200], walkStepCents: [1, 2, 5] } },
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
function paramLabel(p) { const e = Object.entries(p); return e.length === 0 ? '(defaults)' : e.map(([k, v]) => `${k}=${v}`).join(', '); }

async function readFirstSnapshotMid(file) {
  const rl = readline.createInterface({ input: fs.createReadStream(path.join(REC_DIR, file)), crlfDelay: Infinity });
  for await (const line of rl) {
    const t = line.trim();
    if (!t) continue;
    let entry;
    try { entry = JSON.parse(t); } catch { continue; }
    if (entry.kind !== 'snapshot') continue;
    const yes = entry.orderbook?.yes ?? [];
    const no = entry.orderbook?.no ?? [];
    const bestYesBid = yes[0]?.[0] ?? 0;
    const bestNoBid = no[0]?.[0] ?? 0;
    rl.close();
    if (bestYesBid > 0 && bestNoBid > 0) return Math.round((bestYesBid + (100 - bestNoBid)) / 2);
    return Math.round(bestYesBid || (100 - bestNoBid) || 50);
  }
  return 50;
}

async function runOne(rec, strategyId, params, costBasisCents) {
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
      initialPosition: { ticker: rec.ticker, side: 'yes', quantity: INIT_POS_QTY, costBasisCents },
    });
    return { ok: true, summary: report.summary };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function fmtRow(r) {
  if (!r.ok) return { pnl: '—', fills: '—', rate: '—', slip: '—', err: r.error };
  const s = r.summary;
  return { pnl: s.pnl_cents, fills: s.fill_count, rate: (s.fill_rate * 100).toFixed(0) + '%', slip: s.avg_slippage_cents.toFixed(0), err: '' };
}

(async () => {
  // Compute cost basis (first-tick mid) per recording.
  const costBases = {};
  for (const rec of RECORDINGS) {
    costBases[rec.name] = await readFirstSnapshotMid(rec.file);
    process.stderr.write(`[v4 cost-basis] ${rec.name}: ${costBases[rec.name]}¢\n`);
  }

  const allRows = [];
  let cellCount = 0;

  for (const strat of STRATEGY_GRIDS) {
    const combos = cartesian(strat.paramGrid);
    for (const combo of combos) {
      for (const rec of RECORDINGS) {
        cellCount++;
        process.stderr.write(`[v4 ${cellCount}] ${strat.id} ${paramLabel(combo)} × ${rec.name} ... `);
        const r = await runOne(rec, strat.id, combo, costBases[rec.name]);
        const row = { strategy: strat.id, params: combo, paramsLabel: paramLabel(combo), recording: rec.name, shape: rec.shape, ...fmtRow(r) };
        allRows.push(row);
        process.stderr.write(r.ok ? `pnl=${r.summary.pnl_cents} fills=${r.summary.fill_count}\n` : `ERROR: ${r.error}\n`);
      }
    }
  }

  console.log('# Strategy Sweep v4 — Raw Results\n');
  console.log(`Total cells: ${cellCount}\n`);
  console.log('## Cost basis per recording (first-tick mid)\n');
  console.log('| Recording | costBasisCents |');
  console.log('|---|---:|');
  for (const rec of RECORDINGS) console.log(`| ${rec.name} | ${costBases[rec.name]} |`);

  console.log('\n## All cells\n');
  console.log('| Strategy | Params | Recording | Shape | pnl¢ | fills | rate | slip¢ | error |');
  console.log('|---|---|---|---|---:|---:|---:|---:|---|');
  for (const r of allRows) console.log(`| ${r.strategy} | ${r.paramsLabel} | ${r.recording} | ${r.shape} | ${r.pnl} | ${r.fills} | ${r.rate} | ${r.slip} | ${r.err} |`);

  console.log('\n## Best params per (strategy, recording)\n');
  for (const strat of STRATEGY_GRIDS) {
    const stratRows = allRows.filter(r => r.strategy === strat.id);
    console.log(`\n### ${strat.id}\n`);
    console.log('| Recording | Shape | Best params | pnl¢ | fills | slip¢ |');
    console.log('|---|---|---|---:|---:|---:|');
    for (const rec of RECORDINGS) {
      const cells = stratRows.filter(r => r.recording === rec.name && r.pnl !== '—');
      if (cells.length === 0) { console.log(`| ${rec.name} | ${rec.shape} | — | — | — | — |`); continue; }
      const filtered = cells.filter(r => Number(r.slip) > SLIPPAGE_FLOOR);
      const pool = filtered.length > 0 ? filtered : cells;
      pool.sort((a, b) => Number(b.pnl) - Number(a.pnl));
      const best = pool[0];
      console.log(`| ${rec.name} | ${rec.shape} | ${best.paramsLabel} | ${best.pnl} | ${best.fills} | ${best.slip} |`);
    }
  }

  console.log('\n## Cross-recording winners (avg pnl, slippage > -50)\n');
  console.log('| Strategy | Best params | avg pnl¢ | filled | avg slip¢ |');
  console.log('|---|---|---:|---:|---:|');
  for (const strat of STRATEGY_GRIDS) {
    const stratRows = allRows.filter(r => r.strategy === strat.id && r.pnl !== '—');
    const combos = cartesian(strat.paramGrid);
    const agg = combos.map(c => {
      const label = paramLabel(c);
      const rows = stratRows.filter(r => r.paramsLabel === label && Number(r.slip) > SLIPPAGE_FLOOR);
      if (rows.length === 0) return null;
      const avgPnl = rows.reduce((s, r) => s + Number(r.pnl), 0) / rows.length;
      const avgSlip = rows.reduce((s, r) => s + Number(r.slip), 0) / rows.length;
      return { label, avgPnl, n: rows.length, avgSlip };
    }).filter(Boolean);
    if (agg.length === 0) { console.log(`| ${strat.id} | — | — | 0 | — |`); continue; }
    agg.sort((a, b) => b.avgPnl - a.avgPnl);
    const best = agg[0];
    console.log(`| ${strat.id} | ${best.label} | ${best.avgPnl.toFixed(0)} | ${best.n}/${RECORDINGS.length} | ${best.avgSlip.toFixed(0)} |`);
  }

  console.log('\n## By shape — top strategy on each\n');
  const shapes = ['rising', 'falling', 'sideways'];
  console.log('| Shape | Top strategy + params | avg pnl¢ on this shape |');
  console.log('|---|---|---:|');
  for (const shape of shapes) {
    const recsInShape = RECORDINGS.filter(r => r.shape === shape).map(r => r.name);
    let best = null;
    for (const strat of STRATEGY_GRIDS) {
      const combos = cartesian(strat.paramGrid);
      for (const c of combos) {
        const label = paramLabel(c);
        const cells = allRows.filter(r => r.strategy === strat.id && r.paramsLabel === label && recsInShape.includes(r.recording) && r.pnl !== '—' && Number(r.slip) > SLIPPAGE_FLOOR);
        if (cells.length === 0) continue;
        const avg = cells.reduce((s, r) => s + Number(r.pnl), 0) / cells.length;
        if (!best || avg > best.avg) best = { strat: strat.id, label, avg, n: cells.length };
      }
    }
    if (best) console.log(`| ${shape} | ${best.strat} ${best.label} | ${best.avg.toFixed(0)} (${best.n} cells) |`);
    else console.log(`| ${shape} | — | — |`);
  }
})();
