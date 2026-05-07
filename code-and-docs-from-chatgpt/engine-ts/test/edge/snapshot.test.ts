/**
 * snapshot.test.ts — write/read round-trip and determinism.
 */

import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { buildSnapshot, writeSnapshot, readSnapshot } from '../../src/edge/snapshot.js';
import type { Fire } from '../../src/types.js';

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeFire(id: string): Fire {
  return {
    fireId: id,
    jobId: id,
    strategy: 'S1',
    ticker: 'KXNFL-WC',
    marketCategory: 'nfl',
    side: 'yes',
    entryFills: [{ priceCents: 40, size: 5, ts: 't1' }],
    exitFills: [{ priceCents: 70, size: 5, ts: 't2' }],
    arrivalMidCents: 42,
    decisionMidCents: 42,
    exitDecisionMidCents: 68,
    resolutionPriceCents: 100,
    unresolved: false,
  };
}

const FIRES = [makeFire('f1'), makeFire('f2'), makeFire('f3')];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildSnapshot', () => {
  it('totalFires matches input count', () => {
    const snap = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    expect(snap.totalFires).toBe(3);
  });

  it('unresolvedFires is 0 when all resolved', () => {
    const snap = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    expect(snap.unresolvedFires).toBe(0);
  });

  it('sets since/until correctly', () => {
    const snap = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    expect(snap.since).toBe('2026-01-01');
    expect(snap.until).toBe('2026-01-31');
  });

  it('totals.realizedPnLDollars is sum of all fires', () => {
    const snap = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    // Each fire: (70×5 − 40×5) / 100 = $1.50; 3 fires = $4.50
    expect(snap.totals.realizedPnLDollars).toBeCloseTo(4.50, 2);
  });

  it('perStrategy has one entry for S1', () => {
    const snap = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    expect(snap.perStrategy).toHaveLength(1);
    expect(snap.perStrategy[0]!.strategy).toBe('S1');
    expect(snap.perStrategy[0]!.fires).toBe(3);
  });

  it('triggerHistogram is empty when no triggers', () => {
    const snap = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    expect(snap.triggerHistogram).toHaveLength(0);
  });
});

describe('writeSnapshot / readSnapshot round-trip', () => {
  it('writes JSON and reads it back identically', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-edge-test-'));
    const filePath = path.join(tmpDir, '2026-01-31.json');

    const snap = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    // Override generatedAt for determinism
    const deterministicSnap = { ...snap, generatedAt: '2026-01-31T00:00:00Z' };

    writeSnapshot(deterministicSnap, filePath);
    const readBack = readSnapshot(filePath);

    expect(readBack.totalFires).toBe(deterministicSnap.totalFires);
    expect(readBack.since).toBe(deterministicSnap.since);
    expect(readBack.until).toBe(deterministicSnap.until);
    expect(readBack.totals.realizedPnLDollars).toBeCloseTo(
      deterministicSnap.totals.realizedPnLDollars,
      5,
    );

    // Clean up
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('round-trip preserves perStrategy', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-edge-test-'));
    const filePath = path.join(tmpDir, 'snap.json');

    const snap = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    writeSnapshot(snap, filePath);
    const readBack = readSnapshot(filePath);

    expect(readBack.perStrategy).toHaveLength(1);
    expect(readBack.perStrategy[0]!.strategy).toBe('S1');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('same inputs produce same numbers (determinism)', () => {
    const snap1 = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    const snap2 = buildSnapshot({ since: '2026-01-01', until: '2026-01-31', fires: FIRES });
    expect(snap1.totals.realizedPnLDollars).toBe(snap2.totals.realizedPnLDollars);
    expect(snap1.totalFires).toBe(snap2.totalFires);
    expect(snap1.perStrategy[0]!.fires).toBe(snap2.perStrategy[0]!.fires);
  });
});
