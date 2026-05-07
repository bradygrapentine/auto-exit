/**
 * WatcherJournal — append-only NDJSON log of synthetic-order lifecycle events.
 *
 * Each line is one JSON object with a `kind` discriminator. The journal is
 * the durable source of truth for the watcher's in-memory map: on restart
 * `replay()` reconstructs each synthetic's terminal state.
 *
 * Crash-recovery rule: a `synthetic_fire_pending` entry without a matching
 * `synthetic_fired` / `synthetic_fire_failed` / `synthetic_canceled` is
 * treated as `armed` on replay — the watcher will re-fire on resume. Fired,
 * fire_failed, and canceled are terminal.
 *
 * Malformed lines are skipped silently so a corrupt suffix from a kill-9
 * mid-write doesn't break the whole replay.
 */
import { appendFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Synthetic, SyntheticState } from './types.js';

type Entry =
  | { kind: 'synthetic_registered'; ts: string; synthetic: Synthetic }
  | { kind: 'synthetic_fire_pending'; ts: string; id: string; reason: string }
  | { kind: 'synthetic_fired'; ts: string; id: string; reason: string; peakBidCents?: number; triggerKind?: string }
  | { kind: 'synthetic_fire_failed'; ts: string; id: string; reason: string }
  | { kind: 'synthetic_canceled'; ts: string; id: string }
  | { kind: 'synthetic_state_update'; ts: string; id: string; state: SyntheticState };

export class WatcherJournal {
  constructor(private readonly path: string) {
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  private write(entry: Entry): void {
    appendFileSync(this.path, JSON.stringify(entry) + '\n', { mode: 0o600 });
  }

  appendRegistered(synthetic: Synthetic): void {
    this.write({ kind: 'synthetic_registered', ts: new Date().toISOString(), synthetic });
  }
  appendFirePending(id: string, reason: string): void {
    this.write({ kind: 'synthetic_fire_pending', ts: new Date().toISOString(), id, reason });
  }
  appendFired(id: string, reason: string, meta?: { peakBidCents?: number; triggerKind?: string }): void {
    this.write({
      kind: 'synthetic_fired',
      ts: new Date().toISOString(),
      id,
      reason,
      ...(meta?.peakBidCents !== undefined ? { peakBidCents: meta.peakBidCents } : {}),
      ...(meta?.triggerKind !== undefined ? { triggerKind: meta.triggerKind } : {}),
    });
  }
  appendFireFailed(id: string, reason: string): void {
    this.write({ kind: 'synthetic_fire_failed', ts: new Date().toISOString(), id, reason });
  }
  appendCanceled(id: string): void {
    this.write({ kind: 'synthetic_canceled', ts: new Date().toISOString(), id });
  }
  appendStateUpdate(id: string, state: SyntheticState): void {
    this.write({ kind: 'synthetic_state_update', ts: new Date().toISOString(), id, state });
  }

  replay(): Synthetic[] {
    if (!existsSync(this.path)) return [];

    const entries: Entry[] = [];
    for (const line of readFileSync(this.path, 'utf-8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line) as Entry;
        if (e && typeof e === 'object' && 'kind' in e) entries.push(e);
      } catch {
        // malformed — skip silently
      }
    }

    const map = new Map<string, Synthetic>();
    const order: string[] = [];

    for (const e of entries) {
      switch (e.kind) {
        case 'synthetic_registered': {
          if (!map.has(e.synthetic.id)) order.push(e.synthetic.id);
          map.set(e.synthetic.id, { ...e.synthetic, status: 'armed' });
          break;
        }
        case 'synthetic_state_update': {
          const s = map.get(e.id);
          if (s) s.state = e.state;
          break;
        }
        case 'synthetic_fire_pending': {
          const s = map.get(e.id);
          if (s) s.status = 'armed'; // pending without follow-up = re-arm on replay
          break;
        }
        case 'synthetic_fired': {
          const s = map.get(e.id);
          if (s) {
            s.status = 'fired';
            s.firedAt = e.ts;
          }
          break;
        }
        case 'synthetic_fire_failed': {
          const s = map.get(e.id);
          if (s) {
            s.status = 'fire_failed';
            s.fireFailedAt = e.ts;
            s.fireFailedReason = e.reason;
          }
          break;
        }
        case 'synthetic_canceled': {
          const s = map.get(e.id);
          if (s) {
            s.status = 'canceled';
            s.canceledAt = e.ts;
          }
          break;
        }
      }
    }

    return order.map(id => map.get(id)!).filter(Boolean);
  }
}
