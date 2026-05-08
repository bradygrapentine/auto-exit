#!/usr/bin/env node
/**
 * Strategy comparison sweep v9 — final auto rolling re-classify verdict.
 *
 * Combines:
 *   - 1 real V-shape recording (KXNASDAQ100U) — found via SH-REAL-MULTIREGIME-RECORDING
 *   - 4 synthesized multi-regime recordings from v8 (artificial seams)
 *
 * Auto's sideways→s-passive mapping now uses chunkSize=2 (SH-SLOW-EXECUTION-STRATEGY,
 * PR #151), so a 100-share fill spans hundreds of ticks and rolling re-classify
 * has room to fire mid-execution.
 *
 * Decision criterion: ≥5% lift of any rci > 0 over rci=0 on at least one cell
 * → keep rolling re-classify machinery as documented opt-in; else deprecate.
 */
import { runBacktest } from '../dist/backtest/harness.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as readline from 'node:readline';

const REC_BASE = path.join(os.homedir(), '.kea/recordings');
const SYNTH_DIR = path.join(REC_BASE, 'synth');

const RECORDINGS = [
  // Real V-shape recording: dead→falling→sideways→rising→dead per Task 2 discovery.
  { name: 'KXNASDAQ100U (real V)',   ticker: 'KXNASDAQ100U-26MAY08H1600-T28199.99-20260508', file: 'KXNASDAQ100U-26MAY08H1600-T28199.99-20260508.ndjson', dir: REC_BASE },
  { name: 'rising→falling',          ticker: 'KXSYNTH-RISFALL',  file: 'KXSYNTH-rising-falling.ndjson',           dir: SYNTH_DIR },
  { name: 'falling→rising',          ticker: 'KXSYNTH-FALLRIS',  file: 'KXSYNTH-falling-rising.ndjson',           dir: SYNTH_DIR },
  { name: 'rising→sideways→falling', ticker: 'KXSYNTH-RSF',      file: 'KXSYNTH-rising-sideways-falling.ndjson',  dir: SYNTH_DIR },
  { name: 'sideways→rising→sideways',ticker: 'KXSYNTH-SRS',      file: 'KXSYNTH-sideways-rising-sideways.ndjson', dir: SYNTH_DIR },
];

const STRATEGY_GRIDS = [
  { id: 'trailing_stop', paramGrid: { trailCents: [10] } },
  {
    id: 'auto',
    paramGrid: {
      warmupTicks: [200],
      thresholdMode: ['fixed'],
      reclassifyInterval: [0, 100, 300, 500],
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

async function readFirstSnapshotMid(rec) {
  const rl = readline.createInterface({ input: fs.createReadStream(path.join(rec.dir, rec.file)), crlfDelay: Infinity });
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
      recordingPath: path.join(rec.dir, rec.file),
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
    costBases[rec.name] = await readFirstSnapshotMid(rec);
    process.stderr.write(`[v9 cost-basis] ${rec.name}: ${costBases[rec.name]}¢\n`);
  }

  const allRows = [];
  let cellCount = 0;

  for (const strat of STRATEGY_GRIDS) {
    const combos = cartesian(strat.paramGrid);
    for (const combo of combos) {
      for (const rec of RECORDINGS) {
        cellCount++;
        process.stderr.write(`[v9 ${cellCount}] ${strat.id} ${paramLabel(combo)} × ${rec.name} ... `);
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

  const RCIS = [0, 100, 300, 500];

  console.log('# Strategy Sweep v9 — Final Auto Rolling Re-classify Verdict\n');
  console.log(`Total cells: ${cellCount}\n`);
  console.log('## Cost basis per recording\n');
  console.log('| Recording | costBasisCents |');
  console.log('|---|---:|');
  for (const rec of RECORDINGS) console.log(`| ${rec.name} | ${costBases[rec.name]} |`);

  console.log('\n## Per-recording: trailing_stop vs auto (rci variants)\n');
  console.log('| Recording | trailing_stop | auto rci=0 | auto rci=100 | auto rci=300 | auto rci=500 | rci>0 lift over rci=0 |');
  console.log('|---|---:|---:|---:|---:|---:|---:|');
  for (const rec of RECORDINGS) {
    const ts = allRows.find(r => r.strategy === 'trailing_stop' && r.recording === rec.name);
    const autoByRci = {};
    for (const rci of RCIS) {
      autoByRci[rci] = allRows.find(r => r.strategy === 'auto' && r.recording === rec.name && r.params.reclassifyInterval === rci);
    }
    const a0Pnl = Number(autoByRci[0]?.pnl ?? 0);
    const bestNonZero = Math.max(Number(autoByRci[100]?.pnl ?? 0), Number(autoByRci[300]?.pnl ?? 0), Number(autoByRci[500]?.pnl ?? 0));
    const liftStr = a0Pnl !== 0 ? (((bestNonZero - a0Pnl) / Math.abs(a0Pnl)) * 100).toFixed(1) + '%' : '—';
    console.log(`| ${rec.name} | ${ts?.pnl ?? '—'} | ${autoByRci[0]?.pnl ?? '—'} | ${autoByRci[100]?.pnl ?? '—'} | ${autoByRci[300]?.pnl ?? '—'} | ${autoByRci[500]?.pnl ?? '—'} | ${liftStr} |`);
  }

  console.log('\n## Cross-recording averages\n');
  const tsRows = allRows.filter(r => r.strategy === 'trailing_stop' && r.pnl !== '—');
  const tsAvg = tsRows.length > 0 ? tsRows.reduce((s, r) => s + Number(r.pnl), 0) / tsRows.length : 0;
  console.log(`- trailing_stop trailCents=10: **${tsAvg.toFixed(0)}**`);
  for (const rci of RCIS) {
    const a = allRows.filter(r => r.strategy === 'auto' && r.params.reclassifyInterval === rci && r.pnl !== '—');
    const avg = a.length > 0 ? a.reduce((s, r) => s + Number(r.pnl), 0) / a.length : 0;
    console.log(`- auto reclassifyInterval=${rci}: **${avg.toFixed(0)}** (lift vs trailing: ${tsAvg > 0 ? ((avg - tsAvg) / tsAvg * 100).toFixed(1) : '—'}%)`);
  }

  console.log('\n## Decision criterion\n');
  console.log('≥5% lift of any rci > 0 over rci=0 on at least one recording → keep rolling re-classify.\n');
  let keep = false;
  const liftDetails = [];
  for (const rec of RECORDINGS) {
    const a0 = allRows.find(r => r.strategy === 'auto' && r.recording === rec.name && r.params.reclassifyInterval === 0);
    const a0Pnl = Number(a0?.pnl ?? 0);
    if (a0Pnl === 0) continue;
    for (const rci of [100, 300, 500]) {
      const ar = allRows.find(r => r.strategy === 'auto' && r.recording === rec.name && r.params.reclassifyInterval === rci);
      const arPnl = Number(ar?.pnl ?? 0);
      const liftPct = ((arPnl - a0Pnl) / Math.abs(a0Pnl)) * 100;
      if (liftPct >= 5) {
        keep = true;
        liftDetails.push(`${rec.name} rci=${rci}: ${liftPct.toFixed(1)}% lift over rci=0`);
      }
    }
  }
  console.log(keep ? `**Verdict: 🟢 KEEP rolling re-classify.**\n` : `**Verdict: 🔴 DEPRECATE rolling re-classify.** No cell crossed +5%.\n`);
  if (liftDetails.length) {
    console.log('Cells crossing the +5% bar:');
    for (const d of liftDetails) console.log(`- ${d}`);
  }
})();
