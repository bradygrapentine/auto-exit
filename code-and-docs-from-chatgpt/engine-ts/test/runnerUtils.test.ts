/**
 * runnerUtils.test.ts — unit tests for shared chunk-sizing helpers.
 */

import { describe, expect, it } from 'vitest';
import { chooseChunkSize, computeAdaptiveChunk } from '../src/runnerUtils.js';
import type { Orderbook } from '../src/types.js';

const fatBook: Orderbook = {
  yes: [{ priceCents: 10, size: 5000 }],
  no: [{ priceCents: 10, size: 5000 }],
};

const thinBook: Orderbook = {
  yes: [{ priceCents: 10, size: 20 }],
  no: [{ priceCents: 10, size: 20 }],
};

const emptyBook: Orderbook = {
  yes: [],
  no: [],
};

describe('chooseChunkSize', () => {
  it('returns chunkSize when remaining > chunkSize', () => {
    expect(chooseChunkSize(fatBook, 1000, { chunkSize: 100 })).toBe(100);
  });

  it('caps at remaining when remaining < chunkSize', () => {
    expect(chooseChunkSize(fatBook, 50, { chunkSize: 100 })).toBe(50);
  });

  it('returns remaining when they are equal', () => {
    expect(chooseChunkSize(fatBook, 100, { chunkSize: 100 })).toBe(100);
  });

  it('works with zero remaining', () => {
    expect(chooseChunkSize(fatBook, 0, { chunkSize: 100 })).toBe(0);
  });
});

describe('computeAdaptiveChunk', () => {
  it('returns 80% of top ask size (rounded down), bounded to chunkSize', () => {
    // top ask size = 20, 80% = 16
    const result = computeAdaptiveChunk(thinBook, 1000, { chunkSize: 100, minAdaptiveChunk: 1 });
    expect(result).toBe(16);
  });

  it('caps at chunkSize when book is fat', () => {
    // top ask size = 5000, 80% = 4000, bounded to chunkSize=100
    const result = computeAdaptiveChunk(fatBook, 1000, { chunkSize: 100, minAdaptiveChunk: 1 });
    expect(result).toBe(100);
  });

  it('respects minAdaptiveChunk floor', () => {
    // top ask size = 1, 80% = 0 (floor(0.8)), so bounded to minAdaptiveChunk=5
    const bookWithTinySize: Orderbook = {
      yes: [{ priceCents: 10, size: 1 }],
      no: [],
    };
    const result = computeAdaptiveChunk(bookWithTinySize, 1000, { chunkSize: 100, minAdaptiveChunk: 5 });
    expect(result).toBe(5);
  });

  it('caps at remaining', () => {
    // remaining=5, adaptive would be 16, but cap at 5
    const result = computeAdaptiveChunk(thinBook, 5, { chunkSize: 100, minAdaptiveChunk: 1 });
    expect(result).toBe(5);
  });

  it('falls back to chunkSize when book is empty', () => {
    const result = computeAdaptiveChunk(emptyBook, 1000, { chunkSize: 100, minAdaptiveChunk: 1 });
    expect(result).toBe(100);
  });

  it('uses no side when specified', () => {
    // no book has size 20, yes has 5000 — with side='no', result should be 16
    const mixedBook: Orderbook = {
      yes: [{ priceCents: 10, size: 5000 }],
      no: [{ priceCents: 10, size: 20 }],
    };
    const result = computeAdaptiveChunk(mixedBook, 1000, { chunkSize: 100, minAdaptiveChunk: 1 }, 'no');
    expect(result).toBe(16);
  });
});
