#!/usr/bin/env node
/**
 * Strategy comparison sweep v8 — multi-regime recording validation.
 *
 * Runs auto (with rolling re-classify) and trailing_stop (baseline) against
 * 4 synthesized multi-regime recordings (concatenated rising/falling/sideways
 * segments). Decision criterion: if rolling-auto beats trailing_stop by ≥5%
 * on at least one synthetic, keep auto opt-in; else retire from default menu.
 *
 * Caveat: synthesized recordings have an artificial seam at segment joins.
 * Findings = directional signal, not production guarantees.
 */
import { runBacktest } from '../dist/backtest/harness.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as readline from 'node:readline';

const REC_DIR = path.join(os.homedir(), '.kea/recordings/synth');

const RECORDINGS = [
  { name: 'rising→falling',          ticker: 'KXSYNTH-RISFALL',  file: 'KXSYNTH-rising-falling.ndjson' },
  { name: 'falling→rising',          ticker: 'KXSYNTH-FALLRIS',  file: 'KXSYNTH-falling-rising.ndjson' },
  { name: 'rising→sideways→falling', ticker: 'KXSYNTH-RSF',      file: 'KXSYNTH-rising-sideways-falling.ndjson' },
  { name: 'sideways→rising→sideways',ticker: 'KXSYNTH-SRS',      file: 'KXSYNTH-sideways-rising-sideways.ndjson' },
];

const STRATEGY_GRIDS = [
  { id: 'trailing_stop', paramGrid: { trailCents: [10] } },
  {
    id: 'auto',
    paramGrid: {
      warmupTicks: [200],
      thresholdMode: ['fixed'],
      reclassifyInterval: [0, 100, 300],
      hysteresisTicks: [3],
    },
  },
];

const INIT_POS_QTY = 100;

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
    const t = line.trim(); if (!t) continue;
    let entry; try { entry = JSON.parse(t); } catch { continue; }
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

(async () => {
  const costBases = {};
  for (const rec of RECORDINGS) {
    costBases[rec.name] = await readFirstSnapshotMid(rec.file);
    process.stderr.write(`[v8 cost-basis] ${rec.name}: ${costBases[rec.name]}¢\n`);
  }

  const allRows = [];
  let cellCount = 0;

  for (const strat of STRATEGY_GRIDS) {
    const combos = cartesian(strat.paramGrid);
    for (const combo of combos) {
      for (const rec of RECORDINGS) {
        cellCount++;
        process.stderr.write(`[v8 ${cellCount}] ${strat.id} ${paramLabel(combo)} × ${rec.name} ... `);
        const r = await runOne(rec, strat.id, combo, costBases[rec.name]);
        const row = {
          strategy: strat.id, params: combo, paramsLabel: paramLabel(combo),
          recording: rec.name,
          pnl: r.ok ? r.summary.pnl_cents : '—',
          fills: r.ok ? r.summary.fill_count : '—',
          slip: r.ok ? r.summary.avg_slippage_cents.toFixed(0) : '—',
          err: r.ok ? '' : r.error,
        };
        allRows.push(row);
        process.stderr.write(r.ok ? `pnl=${r.summary.pnl_cents} fills=${r.summary.fill_count}\n` : `ERROR: ${r.error}\n`);
      }
    }
  }

  console.log('# Strategy Sweep v8 — Multi-Regime Validation\n');
  console.log(`Total cells: ${cellCount}\n`);
  console.log('## Cost basis per recording\n');
  console.log('| Recording | costBasisCents |');
  console.log('|---|---:|');
  for (const rec of RECORDINGS) console.log(`| ${rec.name} | ${costBases[rec.name]} |`);

  console.log('\n## Per-recording: trailing_stop vs auto (rolling configs)\n');
  console.log('| Recording | trailing_stop pnl | auto rci=0 | auto rci=100 | auto rci=300 | best auto lift |');
  console.log('|---|---:|---:|---:|---:|---:|');
  for (const rec of RECORDINGS) {
    const ts = allRows.find(r => r.strategy === 'trailing_stop' && r.recording === rec.name);
    const a0 = allRows.find(r => r.strategy === 'auto' && r.recording === rec.name && r.params.reclassifyInterval === 0);
    const a100 = allRows.find(r => r.strategy === 'auto' && r.recording === rec.name && r.params.reclassifyInterval === 100);
    const a300 = allRows.find(r => r.strategy === 'auto' && r.recording === rec.name && r.params.reclassifyInterval === 300);
    const tsPnl = Number(ts?.pnl ?? 0);
    const autoMax = Math.max(Number(a0?.pnl ?? 0), Number(a100?.pnl ?? 0), Number(a300?.pnl ?? 0));
    const lift = tsPnl > 0 ? ((autoMax - tsPnl) / tsPnl * 100).toFixed(1) + '%' : '—';
    console.log(`| ${rec.name} | ${ts?.pnl ?? '—'} | ${a0?.pnl ?? '—'} | ${a100?.pnl ?? '—'} | ${a300?.pnl ?? '—'} | ${lift} |`);
  }

  console.log('\n## Cross-recording averages\n');
  const ts = allRows.filter(r => r.strategy === 'trailing_stop' && r.pnl !== '—');
  const tsAvg = ts.length > 0 ? ts.reduce((s, r) => s + Number(r.pnl), 0) / ts.length : 0;
  console.log(`- trailing_stop trailCents=10: **${tsAvg.toFixed(0)}**`);
  for (const rci of [0, 100, 300]) {
    const a = allRows.filter(r => r.strategy === 'auto' && r.params.reclassifyInterval === rci && r.pnl !== '—');
    const avg = a.length > 0 ? a.reduce((s, r) => s + Number(r.pnl), 0) / a.length : 0;
    console.log(`- auto reclassifyInterval=${rci}: **${avg.toFixed(0)}** (lift vs trailing: ${tsAvg > 0 ? ((avg - tsAvg) / tsAvg * 100).toFixed(1) : '—'}%)`);
  }
})();
