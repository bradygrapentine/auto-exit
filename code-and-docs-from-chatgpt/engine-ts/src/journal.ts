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
import type { JournalEntry, JournalKind, OrderIntentData, OrderPlacedData } from './types.js';

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
   * Return every `order_intent` entry whose clientOrderId has no matching
   * `order_placed` entry. These represent orders that may have been placed on
   * the exchange but were not durably journaled (process killed in the window
   * between createOrder returning and order_placed being appended).
   *
   * On resume, callers should call `findOrderByClientOrderId` for each returned
   * intent to determine whether the order actually landed on the exchange.
   */
  pendingIntents(): OrderIntentData[] {
    const entries = this.readAll();
    const placedClientOrderIds = new Set<string>();
    for (const e of entries) {
      if (e.kind === 'order_placed') {
        const d = e.data as { payload?: { client_order_id?: string } };
        if (d?.payload?.client_order_id) placedClientOrderIds.add(d.payload.client_order_id);
      }
    }
    // Dedupe by clientOrderId — last entry wins
    const intentMap = new Map<string, OrderIntentData>();
    for (const e of entries) {
      if (e.kind === 'order_intent') {
        const d = e.data as OrderIntentData;
        if (d?.clientOrderId) intentMap.set(d.clientOrderId, d);
      }
    }
    const pending: OrderIntentData[] = [];
    for (const [clientOrderId, d] of intentMap) {
      if (!placedClientOrderIds.has(clientOrderId)) pending.push(d);
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

/** Generate a unique job ID: timestamp + 8-hex random suffix.
 *  4-hex (16-bit) suffix had ~26% collision rate for 100 ids generated in the
 *  same millisecond (birthday paradox); 8-hex (32-bit) drops that to ~1e-6. */
export function generateJobId(): string {
  const rand = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${Date.now()}-${rand}`;
}
