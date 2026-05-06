/**
 * sStealth.ts — S4 Stealth strategy: anti-signaling jittered IoC chunks.
 *
 * Submits small randomized immediate_or_cancel chunks until the target size is
 * filled, the safety-submitted cap is hit, or stop() is called. No resting
 * orders are ever placed. Chunk sizes and inter-chunk delays are randomized via
 * jitterChunkSize / jitterDelay to avoid detectable patterns.
 *
 * File-touch boundary: this file + src/stealth.ts + their test counterparts.
 * Journal kinds cast via jk() to avoid touching types.ts.
 *
 * Pricing: caller must provide priceCents (crossable mid-or-better). We do NOT
 * read the orderbook here. Typical usage:
 *   sell YES → pass top yes-bid cents
 *   buy  YES → pass (100 − top no-bid) cents
 *   sell NO  → pass top no-bid cents
 *   buy  NO  → pass (100 − top yes-bid) cents
 */

import { Journal, generateJobId } from '../journal.js';
import { jitterChunkSize, jitterDelay, buildS4OrderPayload } from '../stealth.js';
import type { JournalKind, KalshiClientLike, Side } from '../types.js';

// Cast unknown string → JournalKind without touching types.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

const DEFAULT_BASE_CHUNK_SIZE = 150;
const DEFAULT_BASE_DELAY_MS = 30_000;
const DEFAULT_JITTER_CHUNK_SIZE_PCT = 0.5;
const DEFAULT_JITTER_DELAY_PCT = 0.92;
const DEFAULT_SAFETY_SUBMITTED_MULTIPLE = 1.5;

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface S4Config {
  ticker: string;
  side: Side;
  action: 'buy' | 'sell';
  size: number;
  /** Price in cents (1..99) to use for every chunk. Must be crossable. */
  priceCents: number;
  baseChunkSize?: number;           // default 150
  baseDelayMs?: number;             // default 30_000
  jitterChunkSizePct?: number;      // default 0.5 — ±50% of baseChunkSize
  jitterDelayPct?: number;          // default 0.92 — ±92% of baseDelayMs (~5–60s)
  safetySubmittedMultiple?: number; // default 1.5
  /** Injectable RNG for deterministic tests. Defaults to Math.random. */
  rng?: () => number;
  /** Injectable sleep for deterministic tests. Defaults to real setTimeout. */
  sleepMs?: (ms: number) => Promise<void>;
  /** Override KEA_HOME (for tests). */
  keaHome?: string;
  /** Unique job ID for journaling. Auto-generated when omitted. */
  jobId?: string;
}

export interface S4Result {
  totalFilled: number;
  iterations: number;
  reason: 'complete' | 'partial' | 'safety_cap_hit' | 'caller_stopped';
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateConfig(cfg: S4Config): void {
  if (!cfg.ticker || cfg.ticker.trim() === '') {
    throw new Error('S4Config: ticker must be non-empty');
  }
  if (cfg.size <= 0) {
    throw new Error('S4Config: size must be > 0');
  }
  if (cfg.priceCents === undefined || cfg.priceCents <= 0 || cfg.priceCents >= 100) {
    throw new Error('S4Config: priceCents must be in (0, 100)');
  }
  const baseChunkSize = cfg.baseChunkSize ?? DEFAULT_BASE_CHUNK_SIZE;
  if (baseChunkSize <= 0) {
    throw new Error('S4Config: baseChunkSize must be > 0');
  }
  const baseDelayMs = cfg.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  if (baseDelayMs < 0) {
    throw new Error('S4Config: baseDelayMs must be >= 0');
  }
  const jitterChunkSizePct = cfg.jitterChunkSizePct ?? DEFAULT_JITTER_CHUNK_SIZE_PCT;
  if (jitterChunkSizePct <= 0 || jitterChunkSizePct > 1) {
    throw new Error('S4Config: jitterChunkSizePct must be in (0, 1]');
  }
  const jitterDelayPct = cfg.jitterDelayPct ?? DEFAULT_JITTER_DELAY_PCT;
  if (jitterDelayPct <= 0 || jitterDelayPct > 1) {
    throw new Error('S4Config: jitterDelayPct must be in (0, 1]');
  }
}

// ── Runner class ──────────────────────────────────────────────────────────────

export class StealthRunner {
  private readonly config: S4Config;
  private readonly client: KalshiClientLike;
  private readonly journal: Journal;
  private readonly jobId: string;
  private stopped = false;

  constructor(
    client: KalshiClientLike,
    config: S4Config,
    journal?: Journal | unknown,
  ) {
    validateConfig(config);
    this.client = client;
    this.config = config;
    this.jobId = config.jobId ?? generateJobId();
    this.journal = (journal instanceof Journal)
      ? journal
      : new Journal(this.jobId, config.keaHome);
  }

  /** Signal the runner to stop after the current chunk completes. */
  stop(): void {
    this.stopped = true;
  }

  async run(): Promise<S4Result> {
    const {
      ticker,
      side,
      action,
      size,
      priceCents,
      rng = Math.random,
      sleepMs = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    } = this.config;

    const baseChunkSize = this.config.baseChunkSize ?? DEFAULT_BASE_CHUNK_SIZE;
    const baseDelayMs = this.config.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    const jitterChunkSizePct = this.config.jitterChunkSizePct ?? DEFAULT_JITTER_CHUNK_SIZE_PCT;
    const jitterDelayPct = this.config.jitterDelayPct ?? DEFAULT_JITTER_DELAY_PCT;
    const safetyMultiple = this.config.safetySubmittedMultiple ?? DEFAULT_SAFETY_SUBMITTED_MULTIPLE;
    const safetyCap = size * safetyMultiple;

    let remaining = size;
    let totalFilled = 0;
    let submittedTotal = 0;
    let iterations = 0;

    this.journal.append(jk('stealth_started'), {
      ticker,
      side,
      action,
      size,
      priceCents,
      baseChunkSize,
      baseDelayMs,
      jitterChunkSizePct,
      jitterDelayPct,
      safetyMultiple,
      safetyCap,
      jobId: this.jobId,
    });

    while (remaining > 0 && !this.stopped) {
      // Safety cap check before submitting
      if (submittedTotal >= safetyCap) {
        this.journal.append(jk('stealth_finished'), {
          reason: 'safety_cap_hit',
          totalFilled,
          iterations,
          submittedTotal,
          safetyCap,
        });
        return { totalFilled, iterations, reason: 'safety_cap_hit' };
      }

      // Compute jittered chunk size, capped at remaining
      const rawChunk = jitterChunkSize(
        baseChunkSize,
        { chunkSizePct: jitterChunkSizePct, loopDelayPct: 0 },
        rng,
      );
      const chunkSize = Math.min(rawChunk, remaining);

      // Also cap to not exceed the safety cap
      const allowedByCapacity = safetyCap - submittedTotal;
      const finalChunkSize = Math.min(chunkSize, Math.floor(allowedByCapacity));

      if (finalChunkSize <= 0) {
        this.journal.append(jk('stealth_finished'), {
          reason: 'safety_cap_hit',
          totalFilled,
          iterations,
          submittedTotal,
          safetyCap,
        });
        return { totalFilled, iterations, reason: 'safety_cap_hit' };
      }

      const clientOrderId = `kea-stealth-${this.jobId}-${iterations}-${Date.now()}`;

      const payload = buildS4OrderPayload({
        ticker,
        action,
        side,
        count: finalChunkSize,
        priceCents,
        clientOrderId,
      });

      // Journal intent before createOrder (crash-safe)
      this.journal.append(jk('stealth_chunk_placed'), {
        iteration: iterations,
        chunkSize: finalChunkSize,
        priceCents,
        clientOrderId,
        payload,
      });

      submittedTotal += finalChunkSize;

      const result = await this.client.createOrder(payload);
      const filled = result.filledCount ?? 0;
      totalFilled += filled;
      remaining -= filled;
      iterations += 1;

      // Journal reconciliation
      this.journal.append(jk('stealth_chunk_reconciled'), {
        iteration: iterations - 1,
        orderId: result.orderId,
        filledCount: filled,
        status: result.status,
        remainingAfter: remaining,
        totalFilled,
      });

      // If remaining is 0 we're done — no need to sleep
      if (remaining <= 0) break;

      // Check stop again before sleeping
      if (this.stopped) break;

      // Compute jittered delay
      const delay = jitterDelay(
        baseDelayMs,
        { chunkSizePct: 0, loopDelayPct: jitterDelayPct },
        rng,
      );
      await sleepMs(delay);
    }

    let reason: S4Result['reason'];
    if (this.stopped && remaining > 0) {
      reason = 'caller_stopped';
    } else if (remaining <= 0) {
      reason = 'complete';
    } else {
      reason = 'partial';
    }

    this.journal.append(jk('stealth_finished'), {
      reason,
      totalFilled,
      iterations,
      submittedTotal,
      remaining,
    });

    return { totalFilled, iterations, reason };
  }
}

// ── Preset builder ────────────────────────────────────────────────────────────

export interface BuildS4StealthArgs {
  ticker: string;
  side: Side;
  action: 'buy' | 'sell';
  size: number;
  priceCents: number;
  baseChunkSize?: number;
  baseDelayMs?: number;
  jitterChunkSizePct?: number;
  jitterDelayPct?: number;
  safetySubmittedMultiple?: number;
  keaHome?: string;
  jobId?: string;
}

/**
 * Build a validated S4Config from flat args — throws on invalid input,
 * matching the StealthRunner constructor's validation exactly.
 */
export function buildSStealthArgs(opts: BuildS4StealthArgs): S4Config {
  // Run through validateConfig to throw on bad input
  validateConfig(opts as S4Config);
  return { ...opts };
}
