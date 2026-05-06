import { describe, it, expect } from 'vitest';
import { evalStopLimit } from '../../src/synthetics/stopLimit.js';
import type { Synthetic, Orderbook } from '../../src/types.js';

function makeSynthetic(overrides: Partial<Synthetic> = {}): Synthetic {
  return {
    id: 'syn-test',
    kind: 'stop_limit',
    ticker: 'TEST-YES',
    side: 'yes',
    positionSize: 10,
    params: {
      triggerPriceCents: 50,
      limitPriceCents: 48,
      size: 5,
    },
    state: {},
    status: 'armed',
    createdAt: new Date().toISOString(),
    selfTradePrevention: 'taker_at_cross',
    autoCancelOnZeroPosition: false,
    ...overrides,
  };
}

function makeBook(yesBid?: number, noBid?: number): Orderbook {
  return {
    yes: yesBid !== undefined ? [{ priceCents: yesBid, size: 10 }] : [],
    no: noBid !== undefined ? [{ priceCents: noBid, size: 10 }] : [],
  };
}

describe('evalStopLimit', () => {
  it('bid above trigger → no fire, distance positive', () => {
    const s = makeSynthetic();
    const book = makeBook(60); // topBid=60 > triggerPrice=50
    const result = evalStopLimit(s, book);
    expect(result.fire).toBe(false);
    expect(result.distanceCentsToTrigger).toBeGreaterThan(0);
    expect(result.distanceCentsToTrigger).toBe(10);
  });

  it('bid at trigger → fires, distance 0, reason includes correct limit + size', () => {
    const s = makeSynthetic();
    const book = makeBook(50); // topBid=50 === triggerPrice=50
    const result = evalStopLimit(s, book);
    expect(result.fire).toBe(true);
    expect(result.distanceCentsToTrigger).toBe(0);
    expect(result.reason).toBe('stop_limit_triggered:limit=48,size=5');
  });

  it('bid below trigger → fires, distance negative', () => {
    const s = makeSynthetic();
    const book = makeBook(40); // topBid=40 < triggerPrice=50
    const result = evalStopLimit(s, book);
    expect(result.fire).toBe(true);
    expect(result.distanceCentsToTrigger).toBeLessThan(0);
    expect(result.distanceCentsToTrigger).toBe(-10);
    expect(result.reason).toBe('stop_limit_triggered:limit=48,size=5');
  });

  it('empty book → fires (topBid=0), distance reflects 0 - trigger', () => {
    const s = makeSynthetic(); // triggerPrice=50
    const book = makeBook(); // empty yes side
    const result = evalStopLimit(s, book);
    expect(result.fire).toBe(true);
    expect(result.distanceCentsToTrigger).toBe(-50);
    expect(result.reason).toBe('stop_limit_triggered:limit=48,size=5');
  });

  it("side='no' takes book.no[0]", () => {
    const s = makeSynthetic({
      side: 'no',
      params: {
        triggerPriceCents: 50,
        limitPriceCents: 48,
        size: 7,
      },
    });
    const book = makeBook(99, 55); // yes bid 99, no bid 55 — above trigger
    const result = evalStopLimit(s, book);
    expect(result.fire).toBe(false);
    expect(result.distanceCentsToTrigger).toBe(5);

    // now with no bid at trigger
    const book2 = makeBook(99, 50);
    const result2 = evalStopLimit(s, book2);
    expect(result2.fire).toBe(true);
    expect(result2.reason).toBe('stop_limit_triggered:limit=48,size=7');
  });
});
