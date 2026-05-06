import { describe, it, expect } from 'vitest';
import { evalStopLoss } from '../../src/synthetics/stopLoss.js';
import type { Synthetic, Orderbook } from '../../src/types.js';

// Minimal Synthetic factory for stop_loss tests
function makeSynth(side: 'yes' | 'no', triggerPriceCents: number): Synthetic {
  return {
    id: 'syn-test',
    kind: 'stop_loss',
    ticker: 'TEST-MARKET',
    side,
    positionSize: 10,
    params: { triggerPriceCents },
    state: {},
    status: 'armed',
    createdAt: new Date().toISOString(),
    selfTradePrevention: 'taker_at_cross',
    autoCancelOnZeroPosition: false,
  } as Synthetic;
}

function makeBook(yesBid?: number, noBid?: number): Orderbook {
  return {
    yes: yesBid !== undefined ? [{ priceCents: yesBid, size: 5 }] : [],
    no: noBid !== undefined ? [{ priceCents: noBid, size: 5 }] : [],
  };
}

describe('evalStopLoss', () => {
  it('bid above trigger → no fire, distance positive', () => {
    const s = makeSynth('yes', 40);
    const book = makeBook(50);
    const result = evalStopLoss(s, book);
    expect(result.fire).toBe(false);
    expect(result.distanceCentsToTrigger).toBe(10); // 50 - 40
    expect(result.reason).toBeUndefined();
  });

  it('bid at trigger → fires, distance 0', () => {
    const s = makeSynth('yes', 40);
    const book = makeBook(40);
    const result = evalStopLoss(s, book);
    expect(result.fire).toBe(true);
    expect(result.distanceCentsToTrigger).toBe(0); // 40 - 40
    expect(result.reason).toBe('stop_loss_breached');
  });

  it('bid below trigger → fires, distance negative', () => {
    const s = makeSynth('yes', 40);
    const book = makeBook(30);
    const result = evalStopLoss(s, book);
    expect(result.fire).toBe(true);
    expect(result.distanceCentsToTrigger).toBe(-10); // 30 - 40
    expect(result.reason).toBe('stop_loss_breached');
  });

  it('empty book (side=yes, yes empty) → fires, topBid=0, distance = 0 - trigger', () => {
    const s = makeSynth('yes', 40);
    const book: Orderbook = { yes: [], no: [] };
    const result = evalStopLoss(s, book);
    expect(result.fire).toBe(true);
    expect(result.distanceCentsToTrigger).toBe(-40); // 0 - 40
    expect(result.reason).toBe('stop_loss_breached');
  });

  it('side=no takes book.no[0]', () => {
    const s = makeSynth('no', 35);
    // yes has a high bid but we should be reading no side
    const book = makeBook(90, 20);
    const result = evalStopLoss(s, book);
    expect(result.fire).toBe(true);
    expect(result.distanceCentsToTrigger).toBe(-15); // 20 - 35
    expect(result.reason).toBe('stop_loss_breached');
  });

  it('side=no, bid above trigger → no fire', () => {
    const s = makeSynth('no', 35);
    const book = makeBook(10, 50);
    const result = evalStopLoss(s, book);
    expect(result.fire).toBe(false);
    expect(result.distanceCentsToTrigger).toBe(15); // 50 - 35
  });
});
