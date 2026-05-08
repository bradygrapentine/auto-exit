#!/usr/bin/env node
/**
 * SH-RECORDING-VIABILITY: scan ~/.kea/recordings/, classify each by
 * tradability and price-action shape. Output: markdown catalog.
 *
 * SH-REAL-MULTIREGIME-RECORDING: also detect mid-recording regime flips
 * by sliding a 200-tick window (stride=100) through each recording and
 * checking whether opposing directional labels appear across non-adjacent
 * positions.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Lazy-import detectRegime and proportionalThresholds from dist/regime.js.
// We use a dynamic import so the script still runs even if dist is stale;
// the catch gives a meaningful error.
let detectRegime;
let proportionalThresholds;
try {
  const regimeMod = await import(path.join(DIST_DIR, 'regime.js'));
  detectRegime = regimeMod.detectRegime;
  proportionalThresholds = regimeMod.proportionalThresholds;
} catch (err) {
  process.stderr.write(`[catalog] ERROR: could not import dist/regime.js — run 'npm run build' first.\n  ${err.message}\n`);
  process.exit(1);
}

const REC_DIR = path.join(os.homedir(), '.kea/recordings');

// --- mid computation (mirrors harness.ts:computeMid) ---
function computeMid(yes, no) {
  // Mirror harness.ts:computeMid
  const bestYesBid = yes[0]?.[0] ?? 0;
  const bestNoBid = no[0]?.[0] ?? 0;
  if (bestYesBid > 0 && bestNoBid > 0) return (bestYesBid + (100 - bestNoBid)) / 2;
  return bestYesBid || (100 - bestNoBid) || 50;
}

/**
 * Convert a raw recording entry's orderbook (tuple arrays) into the
 * SnapshotSlice format expected by regime.ts's detectRegime.
 *
 * Recording format: orderbook.yes = [[priceCents, size], ...]
 * SnapshotSlice format: orderbook.yes = [{ priceCents, size }, ...]
 */
function toSnapshotSlice(entry) {
  return {
    orderbook: {
      yes: (entry.orderbook?.yes ?? []).map(([priceCents, size]) => ({ priceCents, size })),
      no:  (entry.orderbook?.no  ?? []).map(([priceCents, size]) => ({ priceCents, size })),
    },
  };
}

/**
 * Slide a window through all non-empty snapshots in a recording, classify
 * each window with detectRegime, and report whether opposing directional
 * labels appear at two positions.
 *
 * Window params (per SH-REAL-MULTIREGIME-RECORDING plan):
 *   windowSize = 200 snapshots — large enough to capture a meaningful
 *     price move within a 200-tick sub-window.
 *   stride = 100 snapshots — 50% overlap gives smooth coverage without
 *     over-counting transitions.
 *
 * Thresholds: proportionalThresholds(windowSize) so short windows don't
 * all collapse to 'dead'.
 *
 * Returns { hasFlip, regimes, regimeSequence, flipCount }
 */
async function detectRegimeFlips(full, windowSize = 200, stride = 100) {
  const snapshots = [];
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
    const yes = entry.orderbook?.yes ?? [];
    const no  = entry.orderbook?.no  ?? [];
    if (yes.length > 0 || no.length > 0) {
      snapshots.push(toSnapshotSlice(entry));
    }
  }

  if (snapshots.length < windowSize * 2) {
    // Not enough data to run two non-overlapping windows — skip.
    return { hasFlip: false, regimes: [], regimeSequence: 'n/a (too short)', flipCount: 0 };
  }

  const thresholds = proportionalThresholds(windowSize);
  const regimes = [];
  for (let i = 0; i + windowSize <= snapshots.length; i += stride) {
    const slice = snapshots.slice(i, i + windowSize);
    const label = detectRegime(slice, thresholds);
    regimes.push({ atSnapshot: i, regime: label });
  }

  // Detect flips: scan the directional-only labels (rising/falling).
  // Any rising→falling or falling→rising transition in the directional
  // sequence counts as a flip.
  const directional = regimes.filter(r => r.regime === 'rising' || r.regime === 'falling');
  let hasFlip = false;
  let flipCount = 0;
  for (let i = 1; i < directional.length; i++) {
    if (directional[i].regime !== directional[i - 1].regime) {
      hasFlip = true;
      flipCount++;
    }
  }

  // Build a compact regime sequence string, collapsing consecutive dupes.
  const labels = regimes.map(r => r.regime);
  const collapsed = [];
  for (const label of labels) {
    if (collapsed.length === 0 || collapsed[collapsed.length - 1] !== label) {
      collapsed.push(label);
    }
  }
  const regimeSequence = collapsed.join('→');

  return { hasFlip, regimes, regimeSequence, flipCount };
}

// ---------------------------------------------------------------------------

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
    return {
      filename, snapshotCount, yesEverNonEmpty, noEverNonEmpty,
      firstMid: 0, lastMid: 0, minMid: 0, maxMid: 0, range: 0, delta: 0,
      direction: 'dead', tradable: false, sizeBytes: fs2.size,
      flipDetected: false, regimeSequence: 'n/a', flipCount: 0,
    };
  }

  const range = maxMid - minMid;
  const delta = lastMid - firstMid;
  let direction;
  if (range <= 1) direction = 'dead';
  else if (delta > 5) direction = 'rising';
  else if (delta < -5) direction = 'falling';
  else direction = 'sideways';

  const tradable = yesEverNonEmpty && noEverNonEmpty && range > 1;

  // Run flip detection (second pass through the file).
  const { hasFlip, regimeSequence, flipCount } = await detectRegimeFlips(full, 200, 100);

  return {
    filename, snapshotCount, yesEverNonEmpty, noEverNonEmpty,
    firstMid, lastMid, minMid, maxMid, range, delta,
    direction, tradable, sizeBytes: fs2.size,
    flipDetected: hasFlip, regimeSequence, flipCount,
  };
}

(async () => {
  const files = (await fs.promises.readdir(REC_DIR)).filter(f => f.endsWith('.ndjson')).sort();
  process.stderr.write(`[catalog] Scanning ${files.length} recordings (windowSize=200, stride=100)...\n`);

  const rows = [];
  for (const f of files) {
    process.stderr.write(`  ${f}\n`);
    rows.push(await scanRecording(f));
  }

  const counts = { rising: 0, falling: 0, sideways: 0, dead: 0 };
  let tradableCount = 0;
  let totalFlips = 0;
  for (const r of rows) {
    counts[r.direction]++;
    if (r.tradable) tradableCount++;
    if (r.flipDetected) totalFlips++;
  }

  console.log('# Recording catalog\n');
  console.log(`**Generated:** ${new Date().toISOString()}`);
  console.log(`**Total:** ${rows.length} recordings, ${tradableCount} tradable for yes-sell.\n`);
  console.log('## Direction summary\n');
  console.log(`- 📈 Rising (last−first > +5¢): **${counts.rising}**`);
  console.log(`- 📉 Falling (last−first < −5¢): **${counts.falling}**`);
  console.log(`- ↔ Sideways (|delta| ≤ 5, range > 5): **${counts.sideways}**`);
  console.log(`- 💀 Dead (range ≤ 1): **${counts.dead}**\n`);
  console.log('## Multi-regime flip summary\n');
  console.log(`- 🔀 Recordings with mid-recording regime flip detected: **${totalFlips}** / ${rows.length}`);
  console.log(`  *(windowSize=200, stride=100, proportionalThresholds)*\n`);

  console.log('## All recordings (sorted by flipDetected desc, then direction, then |delta| desc)\n');
  console.log('| Recording | snaps | first | last | range | Δ | dir | tradable | flipDetected | flips | regimeSequence |');
  console.log('|---|---:|---:|---:|---:|---:|:--:|:--:|:--:|---:|:---|');
  rows.sort((a, b) => {
    // Put flip candidates first.
    if (a.flipDetected !== b.flipDetected) return (b.flipDetected ? 1 : 0) - (a.flipDetected ? 1 : 0);
    // Among non-flip rows, sort by direction then |delta| desc.
    const order = { rising: 0, sideways: 1, falling: 2, dead: 3 };
    if (order[a.direction] !== order[b.direction]) return order[a.direction] - order[b.direction];
    return Math.abs(b.delta) - Math.abs(a.delta);
  });
  for (const r of rows) {
    const flip = r.flipDetected ? '✓' : '✗';
    console.log(`| ${r.filename.replace('.ndjson', '')} | ${r.snapshotCount} | ${r.firstMid.toFixed(0)} | ${r.lastMid.toFixed(0)} | ${r.range.toFixed(0)} | ${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(0)} | ${r.direction} | ${r.tradable ? '✓' : '✗'} | ${flip} | ${r.flipCount} | ${r.regimeSequence} |`);
  }
})();
