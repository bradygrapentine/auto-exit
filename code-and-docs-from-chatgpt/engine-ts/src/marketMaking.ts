/**
 * marketMaking.ts — S12 Market-Making Runner: injectable invokes + config types.
 *
 * Exports the shared invoke types and config interface used by sMarketMake.ts.
 * Kept separate so callers can import just the types without pulling in the
 * full runner class.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts or journal.ts.
 * Journal kinds cast via jk() to avoid touching types.ts.
 */

import type { Side } from './types.js';

export type { Side };

// ── Injectable invoke types ───────────────────────────────────────────────────

/** Post a resting GTC limit order; returns the exchange order ID. */
export type PostOrderInvoke = (
  qty: number,
  side: Side,
  priceCents: number,
) => Promise<string>;

/** Cancel an existing order by ID. Resolves idempotently (no error if already gone). */
export type CancelOrderInvoke = (orderId: string) => Promise<void>;

/** Poll current fill state of an order. */
export type GetOrderStatusInvoke = (
  orderId: string,
) => Promise<{ filled: number; remaining: number }>;

/** Fetch the current top-of-book bid and ask prices in cents. */
export type GetTopOfBookInvoke = (
  ticker: string,
) => Promise<{ bidCents: number | null; askCents: number | null }>;

/**
 * Aggressively flatten inventory to reach targetInventory.
 * Caller provides the delta (positive = sell, negative = buy).
 */
export type AggressiveFlattenInvoke = (
  ticker: string,
  side: Side,
  qty: number,
) => Promise<{ filled: number }>;

// ── Config ────────────────────────────────────────────────────────────────────

export interface S12Config {
  ticker: string;
  /** Desired resting inventory. Must be ≥ 0. */
  targetInventory: number;
  /** Hard cap. Must be > targetInventory. */
  maxInventory: number;
  /** How far inside the spread to post each quote (in cents). ≥ 0. */
  quoteOffsetCents: number;

  // ── Required invokes ──────────────────────────────────────────────────────
  postOrderInvoke: PostOrderInvoke;
  cancelOrderInvoke: CancelOrderInvoke;
  getOrderStatusInvoke: GetOrderStatusInvoke;
  getTopOfBookInvoke: GetTopOfBookInvoke;
  aggressiveFlattenInvoke: AggressiveFlattenInvoke;

  // ── Optional ──────────────────────────────────────────────────────────────
  /** Poll interval in milliseconds. Default 1000. */
  pollIntervalMs?: number;
  /** Injectable sleep (deterministic tests). Defaults to real setTimeout. */
  sleepMs?: (ms: number) => Promise<void>;
  /** Injectable wall-clock (deterministic tests). Defaults to Date.now. */
  now?: () => number;
  /** Override KEA_HOME for journal placement. */
  keaHome?: string;
  /** Unique job ID. Auto-generated when omitted. */
  jobId?: string;
}

export interface S12Result {
  reason: 'caller_stopped' | 'empty_book';
  finalInventory: number;
}
