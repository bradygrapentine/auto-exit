#!/usr/bin/env node
/**
 * SH-RECORDING-VIABILITY: scan ~/.kea/recordings/, classify each by
 * tradability and price-action shape. Output: markdown catalog.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as readline from 'node:readline';

const REC_DIR = path.join(os.homedir(), '.kea/recordings');

function computeMid(yes, no) {
  // Mirror harness.ts:computeMid
  const bestYesBid = yes[0]?.[0] ?? 0;
  const bestNoBid = no[0]?.[0] ?? 0;
  if (bestYesBid > 0 && bestNoBid > 0) return (bestYesBid + (100 - bestNoBid)) / 2;
  return bestYesBid || (100 - bestNoBid) || 50;
}

async function scanRecording(filename) {
  const full = path.join(REC_DIR, filename);
  const fs2 = await fs.promises.stat(full);

  let snapshotCount = 0;
  let yesEverNonEmpty = false;
  let noEverNonEmpty = false;
  let firstMid = null;
  let lastMid = null;
  let minMid = Infinity;
  let maxMid = -Infinity;

  const rl = readline.createInterface({
    input: fs.createReadStream(full),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let entry;
    try { entry = JSON.parse(trimmed); } catch { continue; }
    if (entry.kind !== 'snapshot') continue;
    snapshotCount++;
    const yes = entry.orderbook?.yes ?? [];
    const no = entry.orderbook?.no ?? [];
    if (yes.length > 0) yesEverNonEmpty = true;
    if (no.length > 0) noEverNonEmpty = true;
    if (yes.length > 0 || no.length > 0) {
      const mid = computeMid(yes, no);
      if (firstMid === null) firstMid = mid;
      lastMid = mid;
      if (mid < minMid) minMid = mid;
      if (mid > maxMid) maxMid = mid;
    }
  }

  if (firstMid === null) {
    return { filename, snapshotCount, yesEverNonEmpty, noEverNonEmpty, firstMid: 0, lastMid: 0, minMid: 0, maxMid: 0, range: 0, delta: 0, direction: 'dead', tradable: false, sizeBytes: fs2.size };
  }

  const range = maxMid - minMid;
  const delta = lastMid - firstMid;
  let direction;
  if (range <= 1) direction = 'dead';
  else if (delta > 5) direction = 'rising';
  else if (delta < -5) direction = 'falling';
  else direction = 'sideways';

  const tradable = yesEverNonEmpty && noEverNonEmpty && range > 1;

  return { filename, snapshotCount, yesEverNonEmpty, noEverNonEmpty, firstMid, lastMid, minMid, maxMid, range, delta, direction, tradable, sizeBytes: fs2.size };
}

(async () => {
  const files = (await fs.promises.readdir(REC_DIR)).filter(f => f.endsWith('.ndjson')).sort();
  process.stderr.write(`[catalog] Scanning ${files.length} recordings...\n`);

  const rows = [];
  for (const f of files) {
    process.stderr.write(`  ${f}\n`);
    rows.push(await scanRecording(f));
  }

  const counts = { rising: 0, falling: 0, sideways: 0, dead: 0 };
  let tradableCount = 0;
  for (const r of rows) {
    counts[r.direction]++;
    if (r.tradable) tradableCount++;
  }

  console.log('# Recording catalog\n');
  console.log(`**Generated:** ${new Date().toISOString()}`);
  console.log(`**Total:** ${rows.length} recordings, ${tradableCount} tradable for yes-sell.\n`);
  console.log('## Direction summary\n');
  console.log(`- 📈 Rising (last−first > +5¢): **${counts.rising}**`);
  console.log(`- 📉 Falling (last−first < −5¢): **${counts.falling}**`);
  console.log(`- ↔ Sideways (|delta| ≤ 5, range > 5): **${counts.sideways}**`);
  console.log(`- 💀 Dead (range ≤ 1): **${counts.dead}**\n`);

  console.log('## All recordings (sorted by direction, then |delta| desc)\n');
  console.log('| Recording | snaps | yes? | no? | first | last | range | Δ | dir | tradable |');
  console.log('|---|---:|:--:|:--:|---:|---:|---:|---:|:--:|:--:|');
  rows.sort((a, b) => {
    const order = { rising: 0, sideways: 1, falling: 2, dead: 3 };
    if (order[a.direction] !== order[b.direction]) return order[a.direction] - order[b.direction];
    return Math.abs(b.delta) - Math.abs(a.delta);
  });
  for (const r of rows) {
    console.log(`| ${r.filename.replace('.ndjson', '')} | ${r.snapshotCount} | ${r.yesEverNonEmpty ? '✓' : '✗'} | ${r.noEverNonEmpty ? '✓' : '✗'} | ${r.firstMid.toFixed(0)} | ${r.lastMid.toFixed(0)} | ${r.range.toFixed(0)} | ${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(0)} | ${r.direction} | ${r.tradable ? '✓' : '✗'} |`);
  }
})();
