#!/usr/bin/env node
/**
 * Position-harvest backtest for KXMOVVAREDISTRICT-26APR21-YES-P4.
 *
 * Position: long-NO equivalent of 47,493 contracts (= short 47,493 YES).
 * Settled real-world (NO wins per operator); Kalshi formal payout up to 1y.
 * Goal: extract ≥95% of $47,493 face payout.
 *
 * Strategies:
 *   A. Dump-all: at t=0, sell all 47,493 NO into best-bids depth, walk down.
 *   B. Skim-10k:  sell 10,000 at t=0 (top of book), hold 37,493 to settle.
 *   C. Skim-25k:  sell 25,000 at t=0, hold 22,493 to settle.
 *   D. Patient 95: post NO ask at 95¢ continuously. Whenever any NO bid in the
 *      book is ≥ 95¢, fill against it at 95¢ (capped at posted size). Held qty
 *      remaining at end of recording → settle at $1.
 *   E. Patient 96: same but 96¢.
 *   F. Patient 97: same but 97¢.
 *   G. Hold-all: do nothing; full 47,493 × $1 at settle.
 *   H. Hybrid: sell 5k at t=0, then post remaining 42,493 patient at 96¢.
 *
 * Fill model: sell-into-bid simulator. For each snapshot we look at the NO-bid
 * ladder (which the engine convention stores as orderbook.no = NO bids). To
 * avoid double-counting the same resting bids across consecutive ticks, we
 * track an "already-consumed" qty per (price, ticker) — when new size appears
 * at a price we already partially consumed, only the delta beyond the previous
 * tick's size counts as new liquidity.
 *
 * Fee: 0.56% effective rate per kea_preview (cents on the dollar).
 */
import * as fs from 'node:fs';
import * as readline from 'node:readline';

const RECORDING = process.argv[2] ?? '/tmp/movva-backtest/movva-4h.ndjson';
const POSITION = 47493;
const FACE_PAYOUT_CENTS = 100;
const FEE_RATE = 0.0056;

function feeAdjust(grossCents) { return grossCents * (1 - FEE_RATE); }
function pctOfPayout(netCents) { return (netCents / (POSITION * FACE_PAYOUT_CENTS)) * 100; }

/** Snapshot's NO bids sorted desc by price, with cumulative size. */
function noBidsDesc(orderbook) {
  const no = (orderbook?.no ?? []).slice().sort((a, b) => b[0] - a[0]);
  return no;
}

/** Walks NO-bid depth selling `qty` contracts. Returns {filled, grossCents, vwap}. */
function depthWalkSell(noBids, qty) {
  let remaining = qty;
  let grossCents = 0;
  let filled = 0;
  for (const lvl of noBids) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, lvl[1]);
    grossCents += take * lvl[0];
    filled += take;
    remaining -= take;
  }
  return { filled, grossCents, vwap: filled > 0 ? grossCents / filled : 0 };
}

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

/** Strategy A: dump everything at t=0 against the first snapshot's depth. */
function strategyDumpAll(snaps) {
  const first = snaps[0];
  const noBids = noBidsDesc(first.orderbook);
  const r = depthWalkSell(noBids, POSITION);
  const heldQty = POSITION - r.filled;
  const cashCents = feeAdjust(r.grossCents);
  const holdCents = heldQty * FACE_PAYOUT_CENTS;
  return {
    label: `A: Dump all 47,493 at t=0`,
    filled: r.filled,
    held: heldQty,
    vwapCents: r.vwap,
    cashCents,
    holdCents,
    totalCents: cashCents + holdCents,
  };
}

/** Strategy B/C: skim N at t=0 then hold rest. */
function strategySkimAndHold(snaps, n, label) {
  const first = snaps[0];
  const noBids = noBidsDesc(first.orderbook);
  const r = depthWalkSell(noBids, n);
  const heldQty = POSITION - r.filled;
  const cashCents = feeAdjust(r.grossCents);
  const holdCents = heldQty * FACE_PAYOUT_CENTS;
  return {
    label,
    filled: r.filled,
    held: heldQty,
    vwapCents: r.vwap,
    cashCents,
    holdCents,
    totalCents: cashCents + holdCents,
  };
}

/**
 * Patient passive sell at `targetCents`. We post enough size to absorb the
 * full remaining position. At each snapshot: any NO bid ≥ targetCents counts
 * as new liquidity that fills our posted ask, but only to the extent it
 * exceeds the size we've already counted at that price. To avoid persistent
 * double-counting we track per-price max-size-seen-so-far.
 */
function strategyPatientPassive(snaps, targetCents, label) {
  let remaining = POSITION;
  let cashCents = 0;
  // Track max size seen at each price ≥ target so we only count NEW liquidity.
  const maxSeenAtPrice = new Map();
  const fills = [];

  for (const snap of snaps) {
    if (remaining <= 0) break;
    const noBids = (snap.orderbook?.no ?? []).filter(lvl => lvl[0] >= targetCents);
    for (const lvl of noBids) {
      if (remaining <= 0) break;
      const prevMax = maxSeenAtPrice.get(lvl[0]) ?? 0;
      const newSize = Math.max(0, lvl[1] - prevMax);
      if (newSize > 0) {
        const take = Math.min(remaining, newSize);
        cashCents += take * lvl[0];
        remaining -= take;
        fills.push({ ts: snap.ts, priceCents: lvl[0], qty: take });
      }
      maxSeenAtPrice.set(lvl[0], Math.max(prevMax, lvl[1]));
    }
  }

  const filled = POSITION - remaining;
  const cashCentsNet = feeAdjust(cashCents);
  const holdCents = remaining * FACE_PAYOUT_CENTS;
  return {
    label,
    filled,
    held: remaining,
    vwapCents: filled > 0 ? cashCents / filled : 0,
    cashCents: cashCentsNet,
    holdCents,
    totalCents: cashCentsNet + holdCents,
    fillTicks: fills.length,
  };
}

/** Hybrid: skim N at t=0, then post remaining at targetCents passively. */
function strategyHybrid(snaps, skimN, targetCents, label) {
  const first = snaps[0];
  const noBids = noBidsDesc(first.orderbook);
  const skim = depthWalkSell(noBids, skimN);
  let remaining = POSITION - skim.filled;
  let cashCents = skim.grossCents;

  // For the patient leg, we need a "first-tick book minus what skim consumed"
  // virtual starting point. We model by initializing maxSeenAtPrice to first
  // tick's depth (so only NEW size counts going forward). Skim consumed depth
  // from highest prices down; for simplicity treat all post-skim depth as
  // starting consumed (i.e., maxSeenAtPrice = current snap size).
  const maxSeenAtPrice = new Map();
  for (const lvl of (first.orderbook?.no ?? [])) {
    if (lvl[0] >= targetCents) maxSeenAtPrice.set(lvl[0], lvl[1]);
  }

  for (let i = 1; i < snaps.length; i++) {
    if (remaining <= 0) break;
    const snap = snaps[i];
    const ladder = (snap.orderbook?.no ?? []).filter(lvl => lvl[0] >= targetCents);
    for (const lvl of ladder) {
      if (remaining <= 0) break;
      const prevMax = maxSeenAtPrice.get(lvl[0]) ?? 0;
      const newSize = Math.max(0, lvl[1] - prevMax);
      if (newSize > 0) {
        const take = Math.min(remaining, newSize);
        cashCents += take * lvl[0];
        remaining -= take;
      }
      maxSeenAtPrice.set(lvl[0], Math.max(prevMax, lvl[1]));
    }
  }

  const filled = POSITION - remaining;
  const cashCentsNet = feeAdjust(cashCents);
  const holdCents = remaining * FACE_PAYOUT_CENTS;
  return {
    label,
    filled,
    held: remaining,
    vwapCents: filled > 0 ? cashCents / filled : 0,
    cashCents: cashCentsNet,
    holdCents,
    totalCents: cashCentsNet + holdCents,
  };
}

(async () => {
  process.stderr.write(`[movva] loading ${RECORDING}\n`);
  const snaps = await loadSnapshots(RECORDING);
  process.stderr.write(`[movva] ${snaps.length} snapshots; span ${snaps[0]?.ts} → ${snaps.at(-1)?.ts}\n`);

  // Strategy variant that skims at the LAST snapshot (=current state) instead
  // of t=0. Useful when the recording shows top-of-book improving over time.
  function strategySkimAtEnd(n, label) {
    const last = snaps[snaps.length - 1];
    const noBids = noBidsDesc(last.orderbook);
    const r = depthWalkSell(noBids, n);
    const heldQty = POSITION - r.filled;
    const cashCents = feeAdjust(r.grossCents);
    const holdCents = heldQty * FACE_PAYOUT_CENTS;
    return {
      label, filled: r.filled, held: heldQty, vwapCents: r.vwap,
      cashCents, holdCents, totalCents: cashCents + holdCents,
    };
  }

  // Best-window skim: scan snapshots, find the one where skim-N produces the
  // highest gross. Reports the optimal hindsight choice + when it occurred.
  function strategyBestWindowSkim(n, label) {
    let bestSnap = snaps[0]; let bestVwap = 0; let bestGross = 0; let bestFilled = 0;
    for (const snap of snaps) {
      const noBids = noBidsDesc(snap.orderbook);
      const r = depthWalkSell(noBids, n);
      if (r.filled === n && r.grossCents > bestGross) {
        bestGross = r.grossCents; bestVwap = r.vwap; bestFilled = r.filled; bestSnap = snap;
      }
    }
    const cashCents = feeAdjust(bestGross);
    const holdCents = (POSITION - bestFilled) * FACE_PAYOUT_CENTS;
    return {
      label: `${label} [@${bestSnap.ts}]`,
      filled: bestFilled, held: POSITION - bestFilled, vwapCents: bestVwap,
      cashCents, holdCents, totalCents: cashCents + holdCents,
    };
  }

  const results = [
    strategyDumpAll(snaps),
    strategySkimAndHold(snaps, 10000, 'B: Skim 10k @ t=0 + hold 37,493'),
    strategySkimAndHold(snaps, 25000, 'C: Skim 25k @ t=0 + hold 22,493'),
    strategyPatientPassive(snaps, 95, 'D: Patient passive @ 95¢'),
    strategyPatientPassive(snaps, 94, 'D2: Patient passive @ 94¢'),
    strategyPatientPassive(snaps, 93, 'D3: Patient passive @ 93¢'),
    strategyPatientPassive(snaps, 92, 'D4: Patient passive @ 92¢'),
    strategyPatientPassive(snaps, 96, 'E: Patient passive @ 96¢'),
    strategyPatientPassive(snaps, 97, 'F: Patient passive @ 97¢'),
    {
      label: 'G: Hold all (do nothing)',
      filled: 0,
      held: POSITION,
      vwapCents: 0,
      cashCents: 0,
      holdCents: POSITION * FACE_PAYOUT_CENTS,
      totalCents: POSITION * FACE_PAYOUT_CENTS,
    },
    strategyHybrid(snaps, 5000, 96, 'H: Skim 5k + patient 96¢ on remainder'),
    strategyHybrid(snaps, 10000, 95, 'I: Skim 10k + patient 95¢ on remainder'),
    strategySkimAtEnd(10000, 'J: Skim 10k @ END (current book)'),
    strategySkimAtEnd(5000, 'J2: Skim 5k @ END'),
    strategySkimAtEnd(8891, 'J3: Skim 8,891 @ END (=$8,294 net target)'),
    strategyBestWindowSkim(10000, 'K: Skim 10k @ best window (hindsight)'),
    strategyBestWindowSkim(5000, 'K2: Skim 5k @ best window (hindsight)'),
    strategyBestWindowSkim(8891, 'K3: Skim 8,891 @ best window (hindsight)'),
  ];

  console.log('# MOVVAREDISTRICT Harvest Strategy Backtest\n');
  console.log(`Recording: ${RECORDING}`);
  console.log(`Snapshots: ${snaps.length}, span: ${snaps[0]?.ts} → ${snaps.at(-1)?.ts}\n`);
  console.log('## Results (NO wins assumed; held qty settles at $1.00)\n');
  console.log('| Strategy | Filled | Held | VWAP¢ | Cash $ | Held $ | Total $ | % of payout |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of results) {
    const cashD = (r.cashCents / 100).toFixed(2);
    const holdD = (r.holdCents / 100).toFixed(2);
    const totalD = (r.totalCents / 100).toFixed(2);
    const pct = pctOfPayout(r.totalCents).toFixed(2);
    const vwap = r.vwapCents > 0 ? r.vwapCents.toFixed(2) : '—';
    console.log(`| ${r.label} | ${r.filled.toFixed(0)} | ${r.held.toFixed(0)} | ${vwap} | $${cashD} | $${holdD} | $${totalD} | ${pct}% |`);
  }

  const meets95 = results.filter(r => pctOfPayout(r.totalCents) >= 95);
  console.log(`\n## Strategies clearing 95% bar: ${meets95.length} of ${results.length}`);
  for (const r of meets95) {
    console.log(`- **${r.label}** — ${pctOfPayout(r.totalCents).toFixed(2)}%`);
  }
})();
