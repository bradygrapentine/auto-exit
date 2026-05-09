/**
 * wsBookTracker.test.ts — SH-SCANNER-WS Task 3
 *
 * 1. snapshot establishes initial state
 * 2. delta increments existing level
 * 3. delta drives level to zero → removed
 * 4. delta on new price level adds it
 * 5. delta before snapshot → ignored
 * 6. yes side sorted descending; no side descending (matches REST shape)
 * 7. seq gap counted
 * 8. msSinceLastUpdate / forget
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WsBookTracker } from '../src/wsBookTracker.js';
import type { WsMessage } from '../src/wsClient.js';

const TICKER = 'KXETH-26MAY1017-B2400';

function snapshot(yesPairs: Array<[string, string]>, noPairs: Array<[string, string]>, seq = 1): WsMessage {
  return {
    type: 'orderbook_snapshot',
    sid: 1,
    seq,
    msg: { market_ticker: TICKER, yes_dollars_fp: yesPairs, no_dollars_fp: noPairs },
  };
}

function delta(side: 'yes' | 'no', priceDollars: string, deltaFp: string, seq = 2): WsMessage {
  return {
    type: 'orderbook_delta',
    sid: 1,
    seq,
    msg: { market_ticker: TICKER, side, price_dollars: priceDollars, delta_fp: deltaFp },
  };
}

let tracker: WsBookTracker;

beforeEach(() => { tracker = new WsBookTracker(); });

describe('WsBookTracker — snapshot', () => {
  it('establishes initial state from snapshot', () => {
    tracker.apply(snapshot([['0.0400', '5001.00']], [['0.9300', '161.00']]));
    const book = tracker.getSnapshot(TICKER)!;
    expect(book.yes).toEqual([{ priceCents: 4, size: 5001 }]);
    expect(book.no).toEqual([{ priceCents: 93, size: 161 }]);
  });
});

describe('WsBookTracker — deltas', () => {
  beforeEach(() => {
    tracker.apply(snapshot([['0.0400', '100.00'], ['0.0500', '50.00']], [['0.9000', '200.00']]));
  });

  it('increments existing level', () => {
    tracker.apply(delta('yes', '0.0400', '+25.00'));
    const yes = tracker.getSnapshot(TICKER)!.yes;
    expect(yes.find((l) => l.priceCents === 4)!.size).toBe(125);
  });

  it('removes level driven to zero', () => {
    tracker.apply(delta('yes', '0.0500', '-50.00'));
    const yes = tracker.getSnapshot(TICKER)!.yes;
    expect(yes.find((l) => l.priceCents === 5)).toBeUndefined();
  });

  it('adds a new price level on delta', () => {
    tracker.apply(delta('yes', '0.0600', '+200.00'));
    const yes = tracker.getSnapshot(TICKER)!.yes;
    expect(yes.find((l) => l.priceCents === 6)!.size).toBe(200);
  });

  it('handles negative delta exactly to zero (floating point safe)', () => {
    tracker.apply(delta('no', '0.9000', '-200.00'));
    const no = tracker.getSnapshot(TICKER)!.no;
    expect(no.find((l) => l.priceCents === 90)).toBeUndefined();
  });

  it('drops delta when no snapshot has been received', () => {
    const fresh = new WsBookTracker();
    fresh.apply(delta('yes', '0.0400', '+25.00'));
    expect(fresh.getSnapshot(TICKER)).toBeNull();
  });
});

describe('WsBookTracker — sort order', () => {
  it('yes side returns descending (best bid first)', () => {
    tracker.apply(snapshot(
      [['0.0100', '1.00'], ['0.0500', '5.00'], ['0.0300', '3.00']],
      [],
    ));
    const yes = tracker.getSnapshot(TICKER)!.yes;
    expect(yes.map((l) => l.priceCents)).toEqual([5, 3, 1]);
  });

  it('no side returns descending (highest no-bid first)', () => {
    tracker.apply(snapshot(
      [],
      [['0.7000', '1.00'], ['0.9300', '161.00'], ['0.8500', '50.00']],
    ));
    const no = tracker.getSnapshot(TICKER)!.no;
    expect(no.map((l) => l.priceCents)).toEqual([93, 85, 70]);
  });

  it('respects depth cap', () => {
    const yes: Array<[string, string]> = [];
    for (let p = 1; p <= 25; p++) yes.push([(p / 100).toFixed(4), '1.00']);
    tracker.apply(snapshot(yes, []));
    expect(tracker.getSnapshot(TICKER, 5)!.yes.length).toBe(5);
    expect(tracker.getSnapshot(TICKER, 5)!.yes[0]!.priceCents).toBe(25);
  });
});

describe('WsBookTracker — seq gap detection', () => {
  it('counts a gap when seq jumps', () => {
    tracker.apply(snapshot([['0.0400', '100.00']], [], 1));
    tracker.apply(delta('yes', '0.0400', '+1.00', 2));
    tracker.apply(delta('yes', '0.0400', '+1.00', 5)); // gap
    expect(tracker.getGapCount()).toBe(1);
  });

  it('no gap on contiguous seq', () => {
    tracker.apply(snapshot([['0.0400', '100.00']], [], 1));
    tracker.apply(delta('yes', '0.0400', '+1.00', 2));
    tracker.apply(delta('yes', '0.0400', '+1.00', 3));
    expect(tracker.getGapCount()).toBe(0);
  });
});

describe('WsBookTracker — staleness + forget', () => {
  it('reports msSinceLastUpdate', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-09T00:00:00Z'));
    tracker.apply(snapshot([['0.0400', '1.00']], []));
    vi.setSystemTime(new Date('2026-05-09T00:00:05Z'));
    expect(tracker.msSinceLastUpdate(TICKER)).toBe(5000);
    vi.useRealTimers();
  });

  it('forget() drops state', () => {
    tracker.apply(snapshot([['0.0400', '1.00']], []));
    expect(tracker.hasBook(TICKER)).toBe(true);
    tracker.forget(TICKER);
    expect(tracker.hasBook(TICKER)).toBe(false);
  });
});
