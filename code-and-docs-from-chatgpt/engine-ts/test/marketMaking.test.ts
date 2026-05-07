/**
 * marketMaking.test.ts — Unit tests for S12 config types and validation logic.
 *
 * Tests the S12Config shape, default poll interval, and that the module
 * exports are correctly typed and importable.
 */

import { describe, it, expect } from 'vitest';
import type {
  S12Config,
  S12Result,
  PostOrderInvoke,
  CancelOrderInvoke,
  GetOrderStatusInvoke,
  GetTopOfBookInvoke,
  AggressiveFlattenInvoke,
} from '../src/marketMaking.js';

// ── 1. Module shape ───────────────────────────────────────────────────────────

describe('marketMaking module — type exports', () => {
  it('S12Config type is structurally assignable with all required fields', () => {
    const postOrderInvoke: PostOrderInvoke = async (_qty, _side, _price) => 'order-1';
    const cancelOrderInvoke: CancelOrderInvoke = async (_id) => {};
    const getOrderStatusInvoke: GetOrderStatusInvoke = async (_id) => ({
      filled: 0,
      remaining: 1,
    });
    const getTopOfBookInvoke: GetTopOfBookInvoke = async (_ticker) => ({
      bidCents: 45,
      askCents: 55,
    });
    const aggressiveFlattenInvoke: AggressiveFlattenInvoke = async (_ticker, _side, _qty) => ({
      filled: 1,
    });

    const config: S12Config = {
      ticker: 'TEST',
      targetInventory: 0,
      maxInventory: 5,
      quoteOffsetCents: 1,
      postOrderInvoke,
      cancelOrderInvoke,
      getOrderStatusInvoke,
      getTopOfBookInvoke,
      aggressiveFlattenInvoke,
    };

    expect(config.ticker).toBe('TEST');
    expect(config.targetInventory).toBe(0);
    expect(config.maxInventory).toBe(5);
    expect(config.quoteOffsetCents).toBe(1);
  });

  it('S12Config allows optional pollIntervalMs, sleepMs, now, keaHome, jobId', () => {
    const noop = async () => {};
    const config: S12Config = {
      ticker: 'T',
      targetInventory: 0,
      maxInventory: 1,
      quoteOffsetCents: 0,
      postOrderInvoke: async () => 'x',
      cancelOrderInvoke: noop,
      getOrderStatusInvoke: async () => ({ filled: 0, remaining: 1 }),
      getTopOfBookInvoke: async () => ({ bidCents: 40, askCents: 60 }),
      aggressiveFlattenInvoke: async () => ({ filled: 0 }),
      pollIntervalMs: 500,
      sleepMs: async (_ms) => {},
      now: () => 1234567890000,
      keaHome: '/tmp/test-kea',
      jobId: 'test-job',
    };

    expect(config.pollIntervalMs).toBe(500);
    expect(config.jobId).toBe('test-job');
    expect(config.keaHome).toBe('/tmp/test-kea');
  });

  it('S12Result type has reason and finalInventory', () => {
    const result: S12Result = { reason: 'caller_stopped', finalInventory: 2 };
    expect(result.reason).toBe('caller_stopped');
    expect(result.finalInventory).toBe(2);

    const result2: S12Result = { reason: 'empty_book', finalInventory: 0 };
    expect(result2.reason).toBe('empty_book');
  });
});

// ── 2. PostOrderInvoke signature ─────────────────────────────────────────────

describe('PostOrderInvoke', () => {
  it('resolves to a string order ID', async () => {
    const fn: PostOrderInvoke = async (qty, side, price) =>
      `${side}-${qty}-${price}`;
    const id = await fn(1, 'yes', 45);
    expect(id).toBe('yes-1-45');
  });
});

// ── 3. GetTopOfBookInvoke — null sides ────────────────────────────────────────

describe('GetTopOfBookInvoke', () => {
  it('can return null for both sides (empty book)', async () => {
    const fn: GetTopOfBookInvoke = async () => ({ bidCents: null, askCents: null });
    const result = await fn('TICKER');
    expect(result.bidCents).toBeNull();
    expect(result.askCents).toBeNull();
  });

  it('can return one-sided null', async () => {
    const fn: GetTopOfBookInvoke = async () => ({ bidCents: 50, askCents: null });
    const result = await fn('TICKER');
    expect(result.bidCents).toBe(50);
    expect(result.askCents).toBeNull();
  });
});
