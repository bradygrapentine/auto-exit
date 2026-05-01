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

  /** Read all entries from the JSONL file. Returns [] if file does not exist. */
  readAll(): JournalEntry[] {
    if (!fs.existsSync(this.filePath)) return [];
    const raw = fs.readFileSync(this.filePath, 'utf8');
    return raw
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as JournalEntry);
  }

  /** True if the journal ends with a `loop_finished` entry. */
  isFinished(): boolean {
    const entries = this.readAll();
    return entries.some((e) => e.kind === 'loop_finished');
  }

  /**
   * Return every `order_placed` orderId that is NOT followed by an
   * `order_reconciled` entry for the same orderId.
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
    const pending: OrderPlacedData[] = [];
    for (const e of entries) {
      if (e.kind === 'order_placed') {
        const d = e.data as OrderPlacedData;
        if (d?.orderId && !reconciledIds.has(d.orderId)) {
          pending.push(d);
        }
      }
    }
    return pending;
  }

  /**
   * Compute filledTotal from journal entries so resume can set an accurate
   * `remaining` without trusting in-memory state.
   */
  computeFilledTotal(): number {
    const entries = this.readAll();
    let filled = 0;
    for (const e of entries) {
      if (e.kind === 'order_reconciled' || e.kind === 'resume_reconciled') {
        const d = e.data as { filled?: number };
        filled += d?.filled ?? 0;
      }
    }
    return filled;
  }

  /** Absolute path to the JSONL file (useful for tests / inspection). */
  get path(): string {
    return this.filePath;
  }
}

/** Generate a simple unique job ID: timestamp + 4-hex random suffix. */
export function generateJobId(): string {
  const rand = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${Date.now()}-${rand}`;
}
