#!/usr/bin/env node
/**
 * Strategy comparison sweep v3.1 — same Cartesian grids as v3, but
 * dynamically loads the tradable non-dead recording set from the latest
 * `docs/runbooks/<date>-recording-catalog.md`. Same output shape as v3.
 *
 * Usage:
 *   node scripts/strategy-sweep-v3.1.mjs > /tmp/sweep-v3.1.md 2>&1
 *
 * Filters recordings: tradable=✓, dir != dead, snaps >= 100.
 * Also breaks "cross-recording winners" out by direction so the result is
 * interpretable when the recording set spans many shapes.
 */
import { runBacktest } from '../dist/backtest/harness.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REC_DIR = path.join(os.homedir(), '.kea/recordings');
const RUNBOOKS_DIR = path.join(__dirname, '..', 'docs', 'runbooks');

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
const MIN_SNAPS = 100;

function findLatestCatalog() {
  const files = fs.readdirSync(RUNBOOKS_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}-recording-catalog\.md$/.test(f))
    .sort();
  if (files.length === 0) throw new Error('no recording-catalog.md found in ' + RUNBOOKS_DIR);
  return path.join(RUNBOOKS_DIR, files[files.length - 1]);
}

function loadRecordings(catalogPath) {
  const text = fs.readFileSync(catalogPath, 'utf8');
  const recs = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('|')) continue;
    if (line.startsWith('| Recording') || line.startsWith('|---')) continue;
    const cols = line.split('|').slice(1, -1).map(s => s.trim());
    if (cols.length < 8) continue;
    const recording = cols[0];
    const snaps = Number(cols[1]);
    const dir = cols[6];
    const tradable = cols[7];
    if (!Number.isFinite(snaps) || snaps < MIN_SNAPS) continue;
    if (tradable !== '✓' || dir === 'dead') continue;
    const file = recording + '.ndjson';
    const ticker = recording.replace(/-(\d{8})$/, '');
    recs.push({ name: recording, ticker, file, dir, snaps });
  }
  return recs;
}

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
  const catalogPath = findLatestCatalog();
  const RECORDINGS = loadRecordings(catalogPath);
  process.stderr.write(`[v3.1] catalog=${path.basename(catalogPath)}, ${RECORDINGS.length} tradable recordings\n`);

  const byDir = {};
  for (const r of RECORDINGS) byDir[r.dir] = (byDir[r.dir] || 0) + 1;
  process.stderr.write(`[v3.1] by direction: ${JSON.stringify(byDir)}\n\n`);

  const allRows = [];
  let cellCount = 0;
  const t0 = Date.now();

  for (const strat of STRATEGY_GRIDS) {
    const paramCombos = cartesian(strat.paramGrid);
    for (const combo of paramCombos) {
      for (const rec of RECORDINGS) {
        cellCount++;
        const r = await runOne(rec, strat.id, combo);
        const row = { strategy: strat.id, params: combo, paramsLabel: paramLabel(combo), recording: rec.name, dir: rec.dir, ...fmtRow(r) };
        allRows.push(row);
        if (cellCount % 200 === 0) {
          const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
          process.stderr.write(`[v3.1] ${cellCount} cells / ${elapsed}s elapsed\n`);
        }
      }
    }
  }

  const totalSecs = ((Date.now() - t0) / 1000).toFixed(0);
  process.stderr.write(`\n[v3.1] Ran ${cellCount} cells in ${totalSecs}s.\n\n`);

  // ── Header ─────────────────────────────────────────────────────────────────
  console.log('# Strategy Sweep v3.1 — Expanded Recording Set\n');
  console.log(`**Generated:** ${new Date().toISOString()}`);
  console.log(`**Catalog:** ${path.basename(catalogPath)}`);
  console.log(`**Recordings:** ${RECORDINGS.length} tradable non-dead (snaps ≥ ${MIN_SNAPS})`);
  console.log(`  - rising: ${byDir.rising ?? 0}`);
  console.log(`  - falling: ${byDir.falling ?? 0}`);
  console.log(`  - sideways: ${byDir.sideways ?? 0}`);
  console.log(`**Total cells:** ${cellCount}  (runtime ${totalSecs}s)\n`);

  // ── Cross-recording winners overall ─────────────────────────────────────────
  console.log('## Cross-recording winners — overall (avg pnl¢, slippage > -50)\n');
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

  // ── Cross-recording winners by direction ────────────────────────────────────
  for (const dir of ['rising', 'falling', 'sideways']) {
    const dirRecs = RECORDINGS.filter(r => r.dir === dir);
    if (dirRecs.length === 0) continue;
    console.log(`\n## Cross-recording winners — ${dir} (${dirRecs.length} recordings)\n`);
    console.log('| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |');
    console.log('|---|---|---:|---:|---:|');
    for (const strat of STRATEGY_GRIDS) {
      const stratRows = allRows.filter(r => r.strategy === strat.id && r.pnl !== '—' && r.dir === dir);
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
      console.log(`| ${strat.id} | ${best.label} | ${best.avgPnl.toFixed(0)} | ${best.recordingsFilled}/${dirRecs.length} | ${best.avgSlip.toFixed(0)} |`);
    }
  }

  // ── Per-strategy distribution headline ──────────────────────────────────────
  console.log('\n## Per-strategy distribution — best param, top/median/bottom pnl across recordings\n');
  console.log('| Strategy | Best param | top pnl¢ | median pnl¢ | bottom pnl¢ | recordings |');
  console.log('|---|---|---:|---:|---:|---:|');
  for (const strat of STRATEGY_GRIDS) {
    const stratRows = allRows.filter(r => r.strategy === strat.id && r.pnl !== '—');
    const paramCombos = cartesian(strat.paramGrid);
    let bestLabel = null, bestAvg = -Infinity, bestRows = [];
    for (const combo of paramCombos) {
      const label = paramLabel(combo);
      const rows = stratRows.filter(r => r.paramsLabel === label && Number(r.slip) > SLIPPAGE_FLOOR);
      if (rows.length === 0) continue;
      const avg = rows.reduce((s, r) => s + Number(r.pnl), 0) / rows.length;
      if (avg > bestAvg) { bestAvg = avg; bestLabel = label; bestRows = rows; }
    }
    if (!bestLabel) { console.log(`| ${strat.id} | — | — | — | — | 0 |`); continue; }
    const pnls = bestRows.map(r => Number(r.pnl)).sort((a, b) => a - b);
    const top = pnls[pnls.length - 1];
    const median = pnls[Math.floor(pnls.length / 2)];
    const bottom = pnls[0];
    console.log(`| ${strat.id} | ${bestLabel} | ${top} | ${median} | ${bottom} | ${bestRows.length} |`);
  }

  // ── Full table ──────────────────────────────────────────────────────────────
  console.log('\n## All cells (raw)\n');
  console.log('| Strategy | Params | Recording | dir | pnl¢ | fills | rate | slip¢ | error |');
  console.log('|---|---|---|---|---:|---:|---:|---:|---|');
  for (const r of allRows) {
    console.log(`| ${r.strategy} | ${r.paramsLabel} | ${r.recording} | ${r.dir} | ${r.pnl} | ${r.fills} | ${r.rate} | ${r.slip} | ${r.err} |`);
  }
})();
