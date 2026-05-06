import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WatcherJournal } from '../src/watcherJournal.js';
import type { Synthetic } from '../src/types.js';

let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'watcher-journal-'));
  file = join(dir, 'watchers.ndjson');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const stub = (id: string, kind: Synthetic['kind'] = 'stop_loss'): Synthetic => ({
  id, kind, ticker: 'KX', side: 'yes', positionSize: 10,
  params: { triggerPriceCents: 30 } as any, state: {}, status: 'armed',
  createdAt: '2026-05-05T00:00:00Z',
  selfTradePrevention: 'taker_at_cross',
  autoCancelOnZeroPosition: true,
});
const trailing = (id: string): Synthetic => ({ ...stub(id, 'trailing_stop'), params: { trailCents: 0.5 } as any });

describe('WatcherJournal', () => {
  it('append + replay round-trips a registered synthetic as armed', () => {
    const j = new WatcherJournal(file);
    j.appendRegistered(stub('s1'));
    const replay = j.replay();
    expect(replay).toHaveLength(1);
    expect(replay[0].id).toBe('s1');
    expect(replay[0].status).toBe('armed');
  });

  it('replay applies state updates in order', () => {
    const j = new WatcherJournal(file);
    j.appendRegistered(trailing('s1'));
    j.appendStateUpdate('s1', { peakBidCentsExact: 5.0 } as any);
    j.appendStateUpdate('s1', { peakBidCentsExact: 5.5 } as any);
    const replay = j.replay();
    expect((replay[0].state as any).peakBidCentsExact).toBeCloseTo(5.5);
  });

  it('replay treats fire_failed as terminal (does not re-arm)', () => {
    const j = new WatcherJournal(file);
    j.appendRegistered(stub('s1'));
    j.appendFirePending('s1', 'evaluator_fired');
    j.appendFireFailed('s1', 'kalshi 500');
    const replay = j.replay();
    expect(replay[0].status).toBe('fire_failed');
    expect(replay[0].fireFailedReason).toBe('kalshi 500');
  });

  it('replay treats fired as terminal', () => {
    const j = new WatcherJournal(file);
    j.appendRegistered(stub('s1'));
    j.appendFirePending('s1', 'evaluator_fired');
    j.appendFired('s1', 'evaluator_fired');
    const replay = j.replay();
    expect(replay[0].status).toBe('fired');
    expect(replay[0].firedAt).toBeDefined();
  });

  it('replay recovers fire_pending without follow-up as armed (re-fire on resume)', () => {
    const j = new WatcherJournal(file);
    j.appendRegistered(stub('s1'));
    j.appendFirePending('s1', 'evaluator_fired');
    // crash here — no fired/fire_failed/canceled written
    const replay = j.replay();
    expect(replay[0].status).toBe('armed');
  });

  it('replay treats canceled as terminal', () => {
    const j = new WatcherJournal(file);
    j.appendRegistered(stub('s1'));
    j.appendCanceled('s1');
    const replay = j.replay();
    expect(replay[0].status).toBe('canceled');
  });

  it('skips malformed lines silently', () => {
    writeFileSync(file, '{not json\n{"kind":"synthetic_registered","synthetic":' +
      JSON.stringify(stub('ok')) + '}\n!!!\n');
    const j = new WatcherJournal(file);
    const replay = j.replay();
    expect(replay).toHaveLength(1);
    expect(replay[0].id).toBe('ok');
  });

  it('replay returns empty list when file does not exist', () => {
    const j = new WatcherJournal(join(dir, 'missing.ndjson'));
    expect(j.replay()).toEqual([]);
  });

  it('multi-synthetic replay preserves registration order', () => {
    const j = new WatcherJournal(file);
    j.appendRegistered(stub('s1'));
    j.appendRegistered(stub('s2'));
    j.appendRegistered(stub('s3'));
    const replay = j.replay();
    expect(replay.map(s => s.id)).toEqual(['s1', 's2', 's3']);
  });
});
