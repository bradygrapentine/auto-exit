/**
 * pipeline.ts — SH-EDGE Task 8
 *
 * End-to-end orchestrator: walks $KEA_HOME/jobs/*.jsonl, joins entries into
 * Fires, optionally enriches with resolution outcomes, and produces an
 * EdgeSnapshot via buildSnapshot.
 *
 * Used by:
 *   - `kea edge` CLI (replaces the inline lifecycle wiring in cli.ts)
 *   - `kea_edge_summary` / `kea_edge_per_strategy` MCP tools
 *   - TUI Edge tab
 *   - Daily snapshot persistence cron (future)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Journal } from '../journal.js';
import type { Fire, JournalEntry, EdgeSnapshot } from '../types.js';
import { joinFires } from './lifecycle.js';
import { buildSnapshot } from './snapshot.js';
import {
  fetchResolution,
  type MarketResolutionFetcher,
} from './resolution.js';

const DEFAULT_KEA_HOME = path.join(os.homedir(), '.kalshi-exit-assistant');

function keaHome(override?: string): string {
  return override ?? process.env['KEA_HOME'] ?? DEFAULT_KEA_HOME;
}

/**
 * Walk $KEA_HOME/jobs/*.jsonl and return all journal entries with ts >= since.
 * Public so cli.ts and other consumers can share one implementation.
 */
export function loadAllJournalEntries(since: Date, home?: string): JournalEntry[] {
  const root = keaHome(home);
  const jobsDir = path.join(root, 'jobs');
  if (!fs.existsSync(jobsDir)) return [];
  const files = fs.readdirSync(jobsDir).filter((f) => f.endsWith('.jsonl'));
  const all: JournalEntry[] = [];
  for (const file of files) {
    const jobId = file.replace(/\.jsonl$/, '');
    const j = new Journal(jobId, root);
    for (const e of j.readAll()) {
      if (new Date(e.ts) < since) continue;
      // Inject jobId into entry data when missing — joinFires groups on data.jobId
      // but engine-written entries identify the job via filename, not payload.
      const d = e.data as Record<string, unknown> | null;
      if (d && typeof d === 'object' && typeof d['jobId'] !== 'string') {
        all.push({ ...e, data: { ...d, jobId } });
      } else {
        all.push(e);
      }
    }
  }
  return all;
}

/**
 * For each unresolved fire, look up the resolution via fetcher (cache-backed).
 * Returns new Fire objects; does not mutate input. Already-resolved fires
 * pass through unchanged.
 */
export async function enrichWithResolutions(
  fires: Fire[],
  fetcher: MarketResolutionFetcher,
  cacheDir: string,
): Promise<Fire[]> {
  const out: Fire[] = [];
  for (const f of fires) {
    if (f.resolutionPriceCents !== undefined) {
      out.push(f);
      continue;
    }
    const resolved = await fetchResolution(f.ticker, fetcher, cacheDir);
    if (resolved === null) {
      out.push(f);
    } else {
      out.push({ ...f, resolutionPriceCents: resolved, unresolved: false });
    }
  }
  return out;
}

export interface GenerateSnapshotOpts {
  since: Date;
  until: Date;
  /** Optional override for $KEA_HOME (defaults to env or ~/.kalshi-exit-assistant). */
  keaHomeOverride?: string;
  /** Optional Kalshi resolution fetcher; if omitted, fires stay unresolved (mark-to-mid). */
  resolutionFetcher?: MarketResolutionFetcher;
  /** Optional minimum notional ($) below which fires are filtered out. */
  minNotionalDollars?: number;
  /**
   * If true, include mock/dryRun fires (ticker prefix `KXTEST` or any
   * loop_started with `dryRun=true`). Default false: real fires only.
   */
  includeMock?: boolean;
}

/** Tickers prefixed with this are treated as local mock-test journals. */
const MOCK_TICKER_PREFIX = 'KXTEST';

/**
 * Detect dryRun jobs by scanning loop_started entries; returns the set of
 * jobIds that should be excluded.
 */
export function findDryRunJobIds(entries: JournalEntry[]): Set<string> {
  const out = new Set<string>();
  for (const e of entries) {
    if (e.kind !== 'loop_started' && e.kind !== 'buy_loop_started') continue;
    const d = e.data as Record<string, unknown> | null;
    if (!d || d['dryRun'] !== true) continue;
    const jobId = typeof d['jobId'] === 'string' ? d['jobId'] : undefined;
    if (jobId) out.add(jobId);
  }
  return out;
}

/**
 * Generate a complete EdgeSnapshot for the given window.
 *
 * Pipeline: load entries → joinFires → (optional) enrich resolutions → buildSnapshot.
 */
export async function generateSnapshot(opts: GenerateSnapshotOpts): Promise<EdgeSnapshot> {
  const home = keaHome(opts.keaHomeOverride);
  const entries = loadAllJournalEntries(opts.since, home);

  let fires = joinFires(entries);

  if (!opts.includeMock) {
    const dryRunJobs = findDryRunJobIds(entries);
    fires = fires.filter(
      (f) => !f.ticker.startsWith(MOCK_TICKER_PREFIX) && !dryRunJobs.has(f.jobId),
    );
  }

  if (opts.minNotionalDollars !== undefined) {
    const min = opts.minNotionalDollars;
    fires = fires.filter((f) => {
      const totalSize = f.entryFills.reduce((s, x) => s + x.size, 0);
      const firstPrice = f.entryFills[0]?.priceCents ?? 0;
      return (totalSize * firstPrice) / 100 >= min;
    });
  }

  if (opts.resolutionFetcher) {
    const cacheDir = path.join(home, 'edge-snapshots');
    fires = await enrichWithResolutions(fires, opts.resolutionFetcher, cacheDir);
  }

  return buildSnapshot({
    since: opts.since.toISOString(),
    until: opts.until.toISOString(),
    fires,
  });
}
