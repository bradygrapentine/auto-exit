/**
 * Append-only JSONL journal for crash-safe resume.
 *
 * One file per jobId at:
 *   ${KEA_HOME ?? ~/.kalshi-exit-assistant}/jobs/<jobId>.jsonl
 *
 * All writes are synchronous (appendFileSync) so crashes leave a coherent log.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { JournalEntry, JournalKind, OrderPlacedData } from './types.js';

export { JournalEntry };

function keaHome(): string {
  return process.env['KEA_HOME'] ?? path.join(os.homedir(), '.kalshi-exit-assistant');
}

function jobPath(home: string, jobId: string): string {
  return path.join(home, 'jobs', `${jobId}.jsonl`);
}

export class Journal {
  private readonly filePath: string;

  constructor(public readonly jobId: string, home?: string) {
    const base = home ?? keaHome();
    this.filePath = jobPath(base, jobId);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }

  /** Append one JSONL entry. Sync write ensures durability across crashes. */
  append(kind: JournalKind, data: unknown): void {
    const entry: JournalEntry = { ts: new Date().toISOString(), kind, data };
    fs.appendFileSync(this.filePath, JSON.stringify(entry) + '\n', 'utf8');
  }

  /** Read all entries from the JSONL file. Returns [] if file does not exist.
   *  Silently skips malformed/truncated lines (e.g. from a mid-write crash). */
  readAll(): JournalEntry[] {
    if (!fs.existsSync(this.filePath)) return [];
    const raw = fs.readFileSync(this.filePath, 'utf8');
    return raw
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .flatMap((line) => {
        try { return [JSON.parse(line) as JournalEntry]; }
        catch { return []; }
      });
  }

  /** True if the last entry in the journal is `loop_finished`. */
  isFinished(): boolean {
    const entries = this.readAll();
    return entries.at(-1)?.kind === 'loop_finished';
  }

  /**
   * Return every `order_placed` orderId that is NOT followed by an
   * `order_reconciled` entry for the same orderId.
   * Dedupes order_placed by orderId (last-wins) to prevent double getOrder calls
   * on a retry path that produced duplicate order_placed entries.
   */
  pendingOrders(): OrderPlacedData[] {
    const entries = this.readAll();
    const reconciledIds = new Set<string>();
    for (const e of entries) {
      if (e.kind === 'order_reconciled') {
        const d = e.data as { orderId?: string };
        if (d?.orderId) reconciledIds.add(d.orderId);
      }
    }
    // Dedupe by orderId — last entry wins
    const placedMap = new Map<string, OrderPlacedData>();
    for (const e of entries) {
      if (e.kind === 'order_placed') {
        const d = e.data as OrderPlacedData;
        if (d?.orderId) placedMap.set(d.orderId, d);
      }
    }
    const pending: OrderPlacedData[] = [];
    for (const [orderId, d] of placedMap) {
      if (!reconciledIds.has(orderId)) pending.push(d);
    }
    return pending;
  }

  /**
   * Compute filledTotal from journal entries so resume can set an accurate
   * `remaining` without trusting in-memory state.
   *
   * Dedupes by orderId — for each unique orderId, takes the LAST fill value
   * seen across both order_reconciled and resume_reconciled entries.
   * This prevents double-counting after a second crash-and-resume where a new
   * order_reconciled is written for an orderId already counted via resume_reconciled.
   */
  computeFilledTotal(): number {
    const entries = this.readAll();
    const fillByOrder = new Map<string, number>();
    for (const e of entries) {
      if (e.kind === 'order_reconciled' || e.kind === 'resume_reconciled') {
        const d = e.data as { orderId?: string; filled?: number };
        if (d?.orderId !== undefined) {
          fillByOrder.set(d.orderId, d.filled ?? 0);
        }
      }
    }
    let filled = 0;
    for (const v of fillByOrder.values()) filled += v;
    return filled;
  }

  /** Absolute path to the JSONL file (useful for tests / inspection). */
  get path(): string {
    return this.filePath;
  }
}

/** Generate a simple unique job ID: timestamp + 4-hex random suffix. */
export function generateJobId(): string {
  const rand = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${Date.now()}-${rand}`;
}
