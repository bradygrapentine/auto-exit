#!/usr/bin/env node
/**
 * One-off comparison sweep: run each strategy × each recording, capture
 * counterfactual report summary, emit a markdown table.
 *
 * Output: stdout markdown. Pipe to docs/runbooks/...
 */
import { runBacktest } from '../dist/backtest/harness.js';
import path from 'node:path';
import os from 'node:os';

const REC_DIR = path.join(os.homedir(), '.kea/recordings');

const RECORDINGS = [
  { name: 'KXINXU (S&P hourly)',     ticker: 'KXINXU-26MAY08H1600-T7324.9999', file: 'KXINXU-26MAY08H1600-T7324.9999-20260508.ndjson' },
  { name: 'KXBTCD (BTC daily)',      ticker: 'KXBTCD-26MAY0817-T80999.99',      file: 'KXBTCD-26MAY0817-T80999.99-20260507.ndjson' },
  { name: 'KXFEDDECISION (27JUN-C25)', ticker: 'KXFEDDECISION-27JUN-C25',        file: 'KXFEDDECISION-27JUN-C25-20260508.ndjson' },
];

const STRATEGIES = [
  { label: 's-aggressive',              id: 's-aggressive',  params: {} },
  { label: 's-passive',                 id: 's-passive',     params: {} },
  { label: 's-twap (2 intervals)',      id: 's-twap',        params: { numIntervals: 2, intervalMinutes: 1 } },
  { label: 's-trail (trail=5)',         id: 's-trail',       params: { trailCents: 5 } },
  { label: 'trailing_stop (trail=5)',   id: 'trailing_stop', params: { trailCents: 5 } },
  { label: 'take_profit (target=75)',   id: 'take_profit',   params: { targetPriceCents: 75 } },
  { label: 'stop_loss (stop=30)',       id: 'stop_loss',     params: { stopPriceCents: 30 } },
  { label: 'bracket (75/30)',           id: 'bracket',       params: { targetPriceCents: 75, stopPriceCents: 30 } },
];

const INIT_POS_QTY = 100;

async function runOne(rec, strat) {
  const params = { ...strat.params, ticker: rec.ticker };
  if (strat.id === 'stop_loss') {
    params.side = 'yes';
    params.size = INIT_POS_QTY;
  }
  try {
    const report = await runBacktest({
      recordingPath: path.join(REC_DIR, rec.file),
      strategyId: strat.id,
      params,
      fillModel: 'naive',
      initialPosition: { ticker: rec.ticker, side: 'yes', quantity: INIT_POS_QTY },
    });
    return { ok: true, summary: report.summary };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function fmt(s) {
  return {
    pnl: s.pnl_cents,
    fills: s.fill_count,
    rate: (s.fill_rate * 100).toFixed(0) + '%',
    slip: s.avg_slippage_cents.toFixed(0),
    exitS: s.time_to_full_exit_s ?? '—',
    mae: s.max_adverse_excursion_cents,
    mfe: s.max_favorable_excursion_cents,
  };
}

(async () => {
  const rows = [];
  for (const rec of RECORDINGS) {
    for (const strat of STRATEGIES) {
      process.stderr.write(`[sweep] ${rec.name} × ${strat.label} ... `);
      const r = await runOne(rec, strat);
      if (r.ok) {
        const f = fmt(r.summary);
        rows.push({ rec: rec.name, strat: strat.label, ...f, error: '' });
        process.stderr.write(`pnl=${f.pnl} fills=${f.fills}\n`);
      } else {
        rows.push({ rec: rec.name, strat: strat.label, pnl: '—', fills: '—', rate: '—', slip: '—', exitS: '—', mae: '—', mfe: '—', error: r.error });
        process.stderr.write(`ERROR: ${r.error}\n`);
      }
    }
  }

  console.log('| Recording | Strategy | pnl¢ | fills | rate | avg slip¢ | exit s | MAE¢ | MFE¢ | error |');
  console.log('|---|---|---:|---:|---:|---:|---:|---:|---:|---|');
  for (const r of rows) {
    console.log(`| ${r.rec} | ${r.strat} | ${r.pnl} | ${r.fills} | ${r.rate} | ${r.slip} | ${r.exitS} | ${r.mae} | ${r.mfe} | ${r.error} |`);
  }
})();
