/**
 * Journal replay — cross-validate the engine's pricing against recorded prod runs.
 *
 * Every `order_placed` journal entry written since the replay-support patch carries
 * an `orderbook` snapshot and the full `decision` the engine made at that moment.
 * This module re-runs `decideLosingExitOrder` + `projectFullExit` against the
 * snapshot and reports whether the engine's behavior is reproducible.
 *
 * Two failure modes this catches:
 *   1. Pricing regression — a code change makes the engine choose a different
 *      price/size for the same book. Replay diffs decision fields per entry.
 *   2. Projection drift — fee math changes. Replay's projection should match what
 *      the order_reconciled entry actually realized (within rounding).
 */

import fs from 'node:fs';
import { Journal } from './journal.js';
import { decideLosingExitOrder, projectFullExit } from './pricing.js';
import type { ExitConfig, JournalEntry, Orderbook, OrderPlacedData, Side } from './types.js';

export interface ReplayableEntry {
  ts: string;
  orderId: string;
  ticker: string;
  side: Side;
  remaining: number;
  orderbook: Orderbook;
  recordedDecision: NonNullable<OrderPlacedData['decision']>;
  /** Realized fill from the matching order_reconciled, if found. */
  realized?: { filled: number; status: string };
}

export interface ReplayResult {
  entry: ReplayableEntry;
  /** Decision the engine produces today against the recorded book. */
  recomputed: ReturnType<typeof decideLosingExitOrder>;
  /** Projected gross/fees/net from the recorded book at recorded position size. */
  projection: ReturnType<typeof projectFullExit>;
  /** True iff every observable decision field is identical. */
  decisionMatches: boolean;
  /** Field-level diffs when decisionMatches is false. */
  decisionDiff: string[];
}

export interface JournalReplay {
  jobId: string;
  ticker: string;
  side: Side;
  initialPosition: number;
  entries: ReplayableEntry[];
  /** Entries skipped because they pre-date the orderbook-in-journal patch. */
  skipped: number;
}

/** Load a journal and extract every order_placed entry that has an orderbook snapshot.
 *  `loop_started` provides ticker/side/initial position; `order_reconciled` rows are
 *  joined back in by orderId so each replayable entry knows its realized fill. */
export function loadJournalReplay(filePath: string): JournalReplay {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const entries: JournalEntry[] = lines.flatMap((l) => {
    try { return [JSON.parse(l) as JournalEntry]; }
    catch { return []; }
  });

  const started = entries.find((e) => e.kind === 'loop_started');
  if (!started) throw new Error('replay: journal has no loop_started entry');
  const startData = started.data as { ticker: string; side: Side; remaining: number };

  const reconciledByOrder = new Map<string, { filled: number; status: string }>();
  for (const e of entries) {
    if (e.kind === 'order_reconciled') {
      const d = e.data as { orderId?: string; filled?: number; status?: string };
      if (d.orderId) reconciledByOrder.set(d.orderId, { filled: d.filled ?? 0, status: String(d.status ?? '') });
    }
  }

  let runningRemaining = startData.remaining;
  const replayable: ReplayableEntry[] = [];
  let skipped = 0;
  for (const e of entries) {
    if (e.kind !== 'order_placed') continue;
    const d = e.data as OrderPlacedData;
    if (!d.orderbook || !d.decision) {
      skipped += 1;
      continue;
    }
    replayable.push({
      ts: e.ts,
      orderId: d.orderId,
      ticker: startData.ticker,
      side: startData.side,
      remaining: runningRemaining,
      orderbook: d.orderbook,
      recordedDecision: d.decision,
      realized: reconciledByOrder.get(d.orderId),
    });
    // Use the realized fill (if known) to advance remaining; else assume the
    // recorded decision's chunkSize all filled (best estimate from order_placed alone).
    const filled = reconciledByOrder.get(d.orderId)?.filled ?? d.decision.chunkSize;
    runningRemaining = Math.max(0, runningRemaining - filled);
  }

  return {
    jobId: filePath.replace(/^.*\//, '').replace(/\.jsonl$/, ''),
    ticker: startData.ticker,
    side: startData.side,
    initialPosition: startData.remaining,
    entries: replayable,
    skipped,
  };
}

/** Run an entry back through `decideLosingExitOrder` with a config matching the
 *  recorded run's heldSide and the supplied `engineConfig` for pricing knobs.
 *  Returns the engine's current decision and a list of fields that differ. */
export function replayDecision(entry: ReplayableEntry, engineConfig: ExitConfig): ReplayResult {
  const cfg: ExitConfig = { ...engineConfig, marketTicker: entry.ticker, heldSide: entry.side };
  const recomputed = decideLosingExitOrder(entry.orderbook, entry.remaining, cfg);
  const sideLevels = entry.side === 'yes' ? entry.orderbook.yes : entry.orderbook.no;
  const projection = projectFullExit(sideLevels, entry.remaining, cfg);

  const diff: string[] = [];
  const r = entry.recordedDecision;
  if (recomputed.chunkSize !== r.chunkSize) diff.push(`chunkSize: rec=${r.chunkSize} now=${recomputed.chunkSize}`);
  if (recomputed.priceCents !== r.priceCents) diff.push(`priceCents: rec=${r.priceCents} now=${recomputed.priceCents}`);
  if (recomputed.priceDollars !== r.priceDollars) diff.push(`priceDollars: rec=${r.priceDollars} now=${recomputed.priceDollars}`);
  if (recomputed.reason !== r.reason) diff.push(`reason: rec=${r.reason} now=${recomputed.reason}`);

  return { entry, recomputed, projection, decisionMatches: diff.length === 0, decisionDiff: diff };
}

/** Convenience: replay every entry in a journal at once. */
export function replayAll(replay: JournalReplay, engineConfig: ExitConfig): ReplayResult[] {
  return replay.entries.map((e) => replayDecision(e, engineConfig));
}

/** Re-export Journal so consumers don't need to import from two paths. */
export { Journal };
