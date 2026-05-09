#!/usr/bin/env node
import * as fs from 'node:fs';
import * as readline from 'node:readline';

const RECORDING = '/tmp/movva-fresh.ndjson';
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
function noBidAt(ob, price) { const lvl = (ob?.no ?? []).find(l => Math.abs(l[0] - price) < 0.001); return lvl ? lvl[1] : 0; }

const snaps = await loadSnapshots(RECORDING);

// 1. Find every transition for 93.8¢: index ranges where it goes from >0 to 0, and 0 back to >0
console.log('## 93.8¢ NO bid: every transition during the recording\n');
console.log('| ts | size | event |');
console.log('|---|---:|---|');
let prev = 0;
for (let i = 0; i < snaps.length; i++) {
  const sz = noBidAt(snaps[i].orderbook, 93.8);
  if (sz === 0 && prev > 0) {
    console.log(`| ${snaps[i].ts} | 0 | DISAPPEARED (was ${prev.toFixed(0)}) |`);
  } else if (sz > 0 && prev === 0) {
    console.log(`| ${snaps[i].ts} | ${sz.toFixed(0)} | RE-APPEARED |`);
  } else if (sz > 0 && prev > 0 && Math.abs(sz - prev) > 100) {
    console.log(`| ${snaps[i].ts} | ${sz.toFixed(0)} | size delta ${(sz - prev).toFixed(0)} |`);
  }
  prev = sz;
}

// 2. At trade time, what NO bids DID exist?
const TRADE_TS = new Date('2026-05-09T15:10:13.000Z').getTime();
let tradeIdx = 0;
for (let i = 0; i < snaps.length; i++) { if (new Date(snaps[i].ts).getTime() <= TRADE_TS) tradeIdx = i; else break; }
console.log(`\n## Full NO bid ladder at last snapshot before trade (idx=${tradeIdx}, ts=${snaps[tradeIdx].ts})\n`);
console.log('| Price¢ | Size |');
console.log('|---:|---:|');
const noBids = (snaps[tradeIdx].orderbook?.no ?? []).slice().sort((a,b) => b[0]-a[0]);
for (const lvl of noBids.slice(0, 20)) {
  console.log(`| ${lvl[0].toFixed(2)} | ${lvl[1].toFixed(2)} |`);
}

// 3. What was the highest NO bid throughout the recording?
console.log('\n## Highest NO bid by hour (was the top of book ever above 92¢ near trade time?)\n');
console.log('| hour | sample ts | best NO bid¢ | size at best |');
console.log('|---:|---|---:|---:|');
const start = new Date(snaps[0].ts).getTime();
for (let h = 12; h < 22; h++) {
  const targetMs = start + h * 3600 * 1000;
  let bestI = 0;
  for (let i = 0; i < snaps.length; i++) { if (new Date(snaps[i].ts).getTime() <= targetMs) bestI = i; else break; }
  if (bestI >= snaps.length - 1 && h > 12) break;
  const ladder = (snaps[bestI].orderbook?.no ?? []).slice().sort((a,b) => b[0]-a[0]);
  const top = ladder[0] ?? [0, 0];
  console.log(`| +${h}h | ${snaps[bestI].ts} | ${top[0].toFixed(2)} | ${top[1].toFixed(2)} |`);
}

// 4. The PRECISE moment of disappearance — minute-by-minute for the hour leading up to the trade
console.log('\n## 93.8¢ size minute-by-minute from 14:00 to 15:15 UTC\n');
const startTrack = new Date('2026-05-09T14:00:00Z').getTime();
const endTrack = new Date('2026-05-09T15:15:00Z').getTime();
console.log('| ts (HH:MM:SS) | 93.8 size | top NO bid¢ | top size |');
console.log('|---|---:|---:|---:|');
let lastMinute = -1;
for (let i = 0; i < snaps.length; i++) {
  const t = new Date(snaps[i].ts).getTime();
  if (t < startTrack || t > endTrack) continue;
  const minute = Math.floor(t / 60000);
  if (minute === lastMinute) continue;
  lastMinute = minute;
  const sz938 = noBidAt(snaps[i].orderbook, 93.8);
  const ladder = (snaps[i].orderbook?.no ?? []).slice().sort((a,b) => b[0]-a[0]);
  const top = ladder[0] ?? [0, 0];
  console.log(`| ${snaps[i].ts.slice(11,19)} | ${sz938.toFixed(0)} | ${top[0].toFixed(2)} | ${top[1].toFixed(2)} |`);
}
