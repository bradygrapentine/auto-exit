#!/usr/bin/env node
/**
 * Test phantom-liquidity hypothesis: do the 93+¢ NO bids in the orderbook
 * actually match against orders, or do they vanish on aggressive arrival?
 *
 * Approach: walk the 18h+ recording, track 93+¢ NO bid behavior tick-by-tick.
 *   - Persistent: same bid stays at same size for many ticks → never filled
 *   - Eaten: size decreases monotonically (someone filled some) → matchable
 *   - Pulled: size goes from N to 0 in one tick (no fill, just cancel) → phantom-pulled
 *   - Refilled: size goes 0→N or smaller→larger → market maker quoting
 *
 * Around the trade time (2026-05-09T15:10:13Z), what did the 93+¢ levels do?
 */
import * as fs from 'node:fs';
import * as readline from 'node:readline';

const TRADE_TS_MS = new Date('2026-05-09T15:10:13.000Z').getTime();
const RECORDING = '/tmp/movva-fresh.ndjson';
const PRICES_OF_INTEREST = [93.3, 93.4, 93.5, 93.6, 93.7, 93.8, 93.9];

async function loadSnapshots(path) {
  const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });
  const snaps = [];
  for await (const line of rl) {
    const t = line.trim(); if (!t) continue;
    let e; try { e = JSON.parse(t); } catch { continue; }
    if (e.kind === 'snapshot') snaps.push(e);
  }
  return snaps;
}

function noBidAt(ob, price) {
  const lvl = (ob?.no ?? []).find(l => Math.abs(l[0] - price) < 0.001);
  return lvl ? lvl[1] : 0;
}

(async () => {
  const snaps = await loadSnapshots(RECORDING);
  console.log(`# Phantom-liquidity analysis — MOVVAREDISTRICT 93+¢ NO bids\n`);
  console.log(`Recording: ${snaps.length} snapshots, ${snaps[0].ts} → ${snaps.at(-1).ts}\n`);

  // Find the snapshot index closest to trade time
  let tradeIdx = 0;
  for (let i = 0; i < snaps.length; i++) {
    if (new Date(snaps[i].ts).getTime() <= TRADE_TS_MS) tradeIdx = i;
    else break;
  }
  console.log(`Trade time: ${new Date(TRADE_TS_MS).toISOString()}`);
  console.log(`Closest snapshot before trade: idx=${tradeIdx} ts=${snaps[tradeIdx].ts}`);
  console.log(`Closest snapshot after trade:  idx=${tradeIdx+1} ts=${snaps[tradeIdx+1]?.ts}\n`);

  // 1. Show 93+¢ NO bid sizes for ±10 snapshots around the trade
  console.log('## ±10 snapshots around the trade (93+¢ NO bid sizes)\n');
  console.log('| idx | ts | Δsec | 93.9 | 93.8 | 93.7 | 93.6 | 93.5 | 93.4 | 93.3 | sum 93+ |');
  console.log('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (let i = Math.max(0, tradeIdx-10); i <= Math.min(snaps.length-1, tradeIdx+10); i++) {
    const s = snaps[i];
    const ts = s.ts.replace('2026-05-09T','').replace('Z','').slice(0, 12);
    const dsec = ((new Date(s.ts).getTime() - TRADE_TS_MS) / 1000).toFixed(1);
    const sizes = PRICES_OF_INTEREST.slice().reverse().map(p => noBidAt(s.orderbook, p));
    const total = sizes.reduce((a,b) => a+b, 0);
    const marker = i === tradeIdx ? ' ← last-before-trade' : i === tradeIdx+1 ? ' ← first-after-trade' : '';
    console.log(`| ${i} | ${ts}${marker} | ${dsec} | ${sizes.map(x => x.toFixed(0)).join(' | ')} | ${total.toFixed(0)} |`);
  }

  // 2. Stability analysis: how often does each price-level's size change?
  console.log('\n## Stability: how often does each 93+¢ NO level change?\n');
  console.log('| Price¢ | Snapshots present | Total change events | Max size seen | Avg size | Vanish events (size→0 within 5 snaps) |');
  console.log('|---:|---:|---:|---:|---:|---:|');
  for (const price of PRICES_OF_INTEREST) {
    let prev = null;
    let presentSnaps = 0;
    let changes = 0;
    let maxSize = 0;
    let totalSize = 0;
    let vanishes = 0; // size → 0 within next 5 snaps
    for (let i = 0; i < snaps.length; i++) {
      const sz = noBidAt(snaps[i].orderbook, price);
      if (sz > 0) {
        presentSnaps++;
        maxSize = Math.max(maxSize, sz);
        totalSize += sz;
      }
      if (prev !== null && Math.abs(prev - sz) > 0.01) {
        changes++;
        // detect vanish: large size drops to 0 within next 5 snaps
        if (prev > 100 && sz === 0) {
          // also check if it stays 0 for next 5
          let stayed0 = true;
          for (let j = i+1; j < Math.min(snaps.length, i+5); j++) {
            if (noBidAt(snaps[j].orderbook, price) > 0) { stayed0 = false; break; }
          }
          if (stayed0) vanishes++;
        }
      }
      prev = sz;
    }
    const avg = presentSnaps > 0 ? totalSize / presentSnaps : 0;
    console.log(`| ${price} | ${presentSnaps} | ${changes} | ${maxSize.toFixed(0)} | ${avg.toFixed(0)} | ${vanishes} |`);
  }

  // 3. Look for "monotone decrease" patterns (= someone filled them)
  console.log('\n## Did any 93+¢ level get progressively eaten down (monotone decrease over ≥5 ticks)?\n');
  for (const price of PRICES_OF_INTEREST) {
    const events = [];
    let runStart = -1;
    let runStartSize = 0;
    let prevSize = -1;
    for (let i = 0; i < snaps.length; i++) {
      const sz = noBidAt(snaps[i].orderbook, price);
      if (prevSize > 0 && sz > 0 && sz < prevSize) {
        // decreasing
        if (runStart < 0) { runStart = i-1; runStartSize = prevSize; }
      } else if (prevSize > 0 && sz === 0) {
        if (runStart >= 0) {
          const runLen = i - runStart;
          if (runLen >= 3) events.push({ from: runStart, to: i, runLen, startSize: runStartSize });
          runStart = -1;
        }
      } else if (sz >= prevSize) {
        if (runStart >= 0 && i - runStart >= 5) {
          events.push({ from: runStart, to: i-1, runLen: i-runStart, startSize: runStartSize });
        }
        runStart = -1;
      }
      prevSize = sz;
    }
    if (events.length > 0) {
      console.log(`- **${price}¢**: ${events.length} monotone-decrease runs (≥3 ticks). Examples:`);
      for (const e of events.slice(0, 3)) {
        console.log(`    [${snaps[e.from].ts}, ${snaps[e.to].ts}] size ${e.startSize.toFixed(0)} → ${noBidAt(snaps[e.to].orderbook, price).toFixed(0)} over ${e.runLen} snapshots`);
      }
    } else {
      console.log(`- ${price}¢: no monotone-decrease runs detected`);
    }
  }

  // 4. Specifically: did 93.8¢ pile (12,336 size we saw) ever shrink?
  console.log('\n## Trajectory of 93.8¢ NO bid size over time (sampled)\n');
  console.log('| Hour offset | sample ts | 93.8¢ size |');
  console.log('|---:|---|---:|');
  const start = new Date(snaps[0].ts).getTime();
  for (let h = 0; h < 30; h++) {
    const targetMs = start + h * 3600 * 1000;
    let bestI = 0;
    for (let i = 0; i < snaps.length; i++) {
      if (new Date(snaps[i].ts).getTime() <= targetMs) bestI = i; else break;
    }
    if (bestI >= snaps.length - 1 && h > 0) break;
    const sz = noBidAt(snaps[bestI].orderbook, 93.8);
    console.log(`| +${h}h | ${snaps[bestI].ts} | ${sz.toFixed(0)} |`);
  }

  // 5. 93.8¢ size variance: how often does it differ from "constant"?
  console.log('\n## 93.8¢ NO bid behavioral classification\n');
  let total = 0, present = 0, sizesObserved = new Set();
  for (const s of snaps) {
    const sz = noBidAt(s.orderbook, 93.8);
    if (sz > 0) { present++; sizesObserved.add(sz.toFixed(2)); }
    total++;
  }
  console.log(`- Present in ${present}/${total} snapshots (${(100*present/total).toFixed(1)}%)`);
  console.log(`- Distinct sizes observed: ${sizesObserved.size}`);
  if (sizesObserved.size <= 10) {
    console.log(`- Sizes: ${[...sizesObserved].sort((a,b)=>+a-+b).join(', ')}`);
  } else {
    const arr = [...sizesObserved].sort((a,b)=>+a-+b);
    console.log(`- Range: ${arr[0]} ... ${arr.at(-1)} (showing first 5 + last 5)`);
    console.log(`  ${arr.slice(0,5).join(', ')} ... ${arr.slice(-5).join(', ')}`);
  }
})();
