/**
 * lifecycle.ts — join journal entries into Fire objects.
 *
 * Pure function: reads entries, emits typed Fire records.
 * No I/O, no side effects.
 */

import type { JournalEntry, TcaEntry } from '../types.js';
import type { Fire } from '../types.js';
import { categorizeTicker } from './marketCategory.js';

// ── Internal helpers ──────────────────────────────────────────────────────────

interface FillRecord {
  priceCents: number;
  size: number;
  ts: string;
}

interface PartialFire {
  fireId: string;
  jobId: string;
  strategy: string;
  ticker: string;
  side: 'yes' | 'no';
  decisionMidCents?: number;
  arrivalMidCents?: number;
  triggerArmedAt?: string;
  triggerKind?: string;
  peakBidCents?: number;
  entryFills: FillRecord[];
  exitFills: FillRecord[];
  tcaSlippageCentsByChunk: number[];
  resolutionPriceCents?: number;
  // decisionMid at exit time for market_drift
  exitDecisionMidCents?: number;
}

function extractJobId(entry: JournalEntry): string | undefined {
  const d = entry.data as Record<string, unknown> | null;
  if (!d) return undefined;
  if (typeof d['jobId'] === 'string') return d['jobId'];
  if (typeof d['payload'] === 'object' && d['payload'] !== null) {
    const p = d['payload'] as Record<string, unknown>;
    if (typeof p['jobId'] === 'string') return p['jobId'];
  }
  return undefined;
}

function extractTicker(entry: JournalEntry): string | undefined {
  const d = entry.data as Record<string, unknown> | null;
  if (!d) return undefined;
  if (typeof d['ticker'] === 'string') return d['ticker'];
  if (typeof d['payload'] === 'object' && d['payload'] !== null) {
    const p = d['payload'] as Record<string, unknown>;
    if (typeof p['ticker'] === 'string') return p['ticker'];
  }
  return undefined;
}

function extractStrategy(entry: JournalEntry): string {
  const d = entry.data as Record<string, unknown> | null;
  if (!d) return 'unknown';
  if (typeof d['strategy'] === 'string') return d['strategy'];
  if (typeof d['strategyName'] === 'string') return d['strategyName'];
  return 'unknown';
}

function extractSide(entry: JournalEntry): 'yes' | 'no' {
  const d = entry.data as Record<string, unknown> | null;
  if (!d) return 'yes';
  const raw = (d['side'] as string | undefined) ??
    ((d['payload'] as Record<string, unknown> | undefined)?.['side'] as string | undefined);
  return raw === 'no' ? 'no' : 'yes';
}

/**
 * Walk a flat array of JournalEntries and join them into Fire objects.
 *
 * Grouping key: `jobId` (extracted from entry.data).
 * A fire lifecycle: order_intent → order_placed → order_reconciled (entry fills).
 * If the same jobId later produces order_reconciled entries tagged as 'sell'
 * they become exit fills.  `synthetic_fired` augments the arming metadata.
 *
 * TODO(SH-EDGE Phase B): augment when watcher emits richer synthetic_fired
 * entries with peakBidCents, optimalHindsightMidCents in the data payload.
 */
export function joinFires(entries: JournalEntry[]): Fire[] {
  const byJobId = new Map<string, PartialFire>();

  for (const entry of entries) {
    if (entry.kind === 'loop_started' || entry.kind === 'buy_loop_started') {
      const jobId = extractJobId(entry);
      if (!jobId) continue;
      const ticker = extractTicker(entry) ?? 'UNKNOWN';
      const strategy = extractStrategy(entry);
      const side = extractSide(entry);
      if (!byJobId.has(jobId)) {
        byJobId.set(jobId, {
          fireId: `fire-${jobId}`,
          jobId,
          strategy,
          ticker,
          side,
          entryFills: [],
          exitFills: [],
          tcaSlippageCentsByChunk: [],
        });
      }
      continue;
    }

    if (entry.kind === 'order_intent') {
      const jobId = extractJobId(entry);
      if (!jobId) continue;
      const d = entry.data as Record<string, unknown>;
      const payload = d['payload'] as Record<string, unknown> | undefined;
      // Capture arrivalMidCents if embedded
      if (typeof d['arrivalMidCents'] === 'number') {
        const pf = byJobId.get(jobId);
        if (pf) pf.arrivalMidCents = d['arrivalMidCents'] as number;
      }
      // Ensure fire record exists (some entries don't have loop_started)
      if (!byJobId.has(jobId)) {
        const ticker = (payload?.['ticker'] as string | undefined) ?? 'UNKNOWN';
        const side = ((payload?.['side'] as string | undefined) === 'no' ? 'no' : 'yes') as 'yes' | 'no';
        byJobId.set(jobId, {
          fireId: `fire-${jobId}`,
          jobId,
          strategy: 'unknown',
          ticker,
          side,
          entryFills: [],
          exitFills: [],
          tcaSlippageCentsByChunk: [],
        });
      }
      continue;
    }

    if (entry.kind === 'order_placed') {
      const jobId = extractJobId(entry);
      if (!jobId) continue;
      const d = entry.data as Record<string, unknown>;
      const pf = byJobId.get(jobId);
      if (!pf) continue;
      // Extract decisionMid from orderbook snapshot if present
      const orderbook = d['orderbook'] as Record<string, unknown> | undefined;
      if (orderbook) {
        const yes = orderbook['yes'] as Array<{ priceCents: number; size: number }> | undefined;
        const no = orderbook['no'] as Array<{ priceCents: number; size: number }> | undefined;
        if (yes && no && yes.length > 0 && no.length > 0) {
          const topBid = yes[0]!.priceCents;
          const topAsk = no[0]!.priceCents;
          const mid = (topBid + topAsk) / 2;
          if (pf.entryFills.length === 0 && pf.decisionMidCents === undefined) {
            pf.decisionMidCents = mid;
          } else {
            // Later order_placed entries are exit fills — capture exit mid
            pf.exitDecisionMidCents = mid;
          }
        }
      }
      continue;
    }

    if (entry.kind === 'order_reconciled') {
      const jobId = extractJobId(entry);
      if (!jobId) continue;
      const d = entry.data as Record<string, unknown>;
      const pf = byJobId.get(jobId);
      if (!pf) continue;
      const priceCents = (d['executedPriceCents'] as number | undefined) ??
        (d['priceCents'] as number | undefined) ?? 0;
      const size = (d['filledCount'] as number | undefined) ??
        (d['count'] as number | undefined) ?? 0;
      const action = (d['action'] as string | undefined) ??
        ((d['payload'] as Record<string, unknown> | undefined)?.['action'] as string | undefined);
      if (action === 'buy') {
        pf.entryFills.push({ priceCents, size, ts: entry.ts });
      } else {
        // 'sell' or default → exit fill
        pf.exitFills.push({ priceCents, size, ts: entry.ts });
      }
      continue;
    }

    if (entry.kind === 'tca') {
      const tcaData = entry.data as TcaEntry;
      const jobId = tcaData?.jobId;
      if (!jobId) continue;
      const pf = byJobId.get(jobId);
      if (!pf) continue;
      pf.tcaSlippageCentsByChunk.push(tcaData.slippageCents * tcaData.chunkSize);
      continue;
    }

    if (entry.kind === 'synthetic_fired') {
      // TODO(SH-EDGE Phase B): augment when watcher emits peakBidCents, triggerKind in data.
      const d = entry.data as Record<string, unknown> | null;
      if (!d) continue;
      const jobId = d['jobId'] as string | undefined;
      if (!jobId) continue;
      const pf = byJobId.get(jobId);
      if (!pf) continue;
      pf.triggerArmedAt = entry.ts;
      if (typeof d['kind'] === 'string') pf.triggerKind = d['kind'];
      if (typeof d['peakBidCents'] === 'number') pf.peakBidCents = d['peakBidCents'];
      continue;
    }
  }

  // Convert partial fires → Fire
  const fires: Fire[] = [];
  for (const pf of byJobId.values()) {
    const totalEntrySize = pf.entryFills.reduce((s, f) => s + f.size, 0);
    const totalExitSize = pf.exitFills.reduce((s, f) => s + f.size, 0);
    const hasActivity = totalEntrySize > 0 || totalExitSize > 0;
    if (!hasActivity) continue;

    const fire: Fire = {
      fireId: pf.fireId,
      jobId: pf.jobId,
      strategy: pf.strategy,
      ticker: pf.ticker,
      marketCategory: categorizeTicker(pf.ticker),
      side: pf.side,
      entryFills: pf.entryFills,
      exitFills: pf.exitFills,
      decisionMidCents: pf.decisionMidCents,
      arrivalMidCents: pf.arrivalMidCents,
      triggerArmedAt: pf.triggerArmedAt,
      triggerKind: pf.triggerKind,
      peakBidCents: pf.peakBidCents,
      resolutionPriceCents: pf.resolutionPriceCents,
      unresolved: pf.resolutionPriceCents === undefined,
      exitDecisionMidCents: pf.exitDecisionMidCents,
    };
    fires.push(fire);
  }
  return fires;
}
