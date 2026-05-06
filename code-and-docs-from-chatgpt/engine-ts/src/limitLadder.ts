/**
 * limitLadder.ts — Core LimitLadderRunner for S8: passive multi-rung GTC placement.
 *
 * Posts each rung as a GTC limit order at startup, then exits immediately.
 * No poll loop, no iteration after placement. Relies on resume/journal to
 * reconcile fills on the next session.
 *
 * File-touch boundary: this file only. Does NOT edit types.ts or passive.ts.
 * Journal kinds (limit_ladder_started, gtc_resting, limit_ladder_finished) are
 * cast via jk() to avoid touching types.ts, following the same pattern as s7ScaleOut.ts.
 */

import { Journal, generateJobId } from './journal.js';
import type {
  JournalKind,
  KalshiClientLike,
  OrderPayload,
  Side,
} from './types.js';

// Cast unknown string → JournalKind without modifying types.ts.
function jk(s: string): JournalKind {
  return s as JournalKind;
}

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface S8Rung {
  /** Limit price in integer cents (1–99). */
  priceCents: number;
  /** Percentage of totalSize to post at this rung (0–100, exclusive of 0). */
  sizePct: number;
}

export interface S8Config {
  ticker: string;
  side: Side;
  action: 'buy' | 'sell';
  /** Total contracts to distribute across rungs. */
  totalSize: number;
  rungs: S8Rung[];
  /** Unique job ID for journaling. Auto-generated when omitted. */
  jobId?: string;
  /** Override KEA_HOME path (for tests). */
  keaHome?: string;
}

export interface S8Result {
  /** Exchange order IDs in rung order (only for rungs that were submitted). */
  orderIds: string[];
  /** Rungs that were actually submitted (rungSize > 0). */
  rungs: S8Rung[];
  /** Sum of per-rung floor(totalSize * sizePct / 100) sizes submitted. */
  submittedShares: number;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateConfig(config: S8Config): void {
  if (!config.ticker || config.ticker.trim() === '') {
    throw new Error('S8: ticker must be a non-empty string');
  }
  if (config.totalSize <= 0) {
    throw new Error(`S8: totalSize must be > 0 (got ${config.totalSize})`);
  }
  if (config.action !== 'buy' && config.action !== 'sell') {
    throw new Error(`S8: action must be 'buy' or 'sell' (got '${config.action}')`);
  }
  if (!config.rungs || config.rungs.length === 0) {
    throw new Error('S8: rungs must be a non-empty array');
  }
  let sumPct = 0;
  for (let i = 0; i < config.rungs.length; i++) {
    const r = config.rungs[i];
    if (r.priceCents <= 0) {
      throw new Error(`S8: rung[${i}].priceCents must be > 0 (got ${r.priceCents})`);
    }
    if (r.sizePct <= 0) {
      throw new Error(`S8: rung[${i}].sizePct must be > 0 (got ${r.sizePct})`);
    }
    sumPct += r.sizePct;
  }
  if (sumPct > 100) {
    throw new Error(`S8: sum(sizePct) must be <= 100 (got ${sumPct})`);
  }
}

// ── Runner class ──────────────────────────────────────────────────────────────

export class LimitLadderRunner {
  private readonly config: S8Config;
  private readonly client: KalshiClientLike;
  private readonly journal: Journal;
  private readonly jobId: string;

  constructor(
    client: KalshiClientLike,
    config: S8Config,
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

  async run(): Promise<S8Result> {
    const { ticker, side, action, totalSize, rungs } = this.config;

    this.journal.append(jk('limit_ladder_started'), {
      ticker,
      side,
      action,
      totalSize,
      rungCount: rungs.length,
    });

    const orderIds: string[] = [];
    const submittedRungs: S8Rung[] = [];
    let submittedShares = 0;

    for (let i = 0; i < rungs.length; i++) {
      const rung = rungs[i];
      const rungSize = Math.floor(totalSize * rung.sizePct / 100);

      // Skip rungs that compute to 0 contracts.
      if (rungSize === 0) {
        continue;
      }

      const clientOrderId = `kea-ladder-${Date.now()}-${crypto.randomUUID()}`;
      const payload: OrderPayload = {
        ticker,
        action,
        side,
        count: rungSize,
        type: 'limit',
        time_in_force: 'good_till_canceled',
        reduce_only: false,
        client_order_id: clientOrderId,
        ...(side === 'yes'
          ? { yes_price: rung.priceCents }
          : { no_price: rung.priceCents }),
      };

      const result = await this.client.createOrder(payload);

      this.journal.append(jk('gtc_resting'), {
        rungIndex: i,
        priceCents: rung.priceCents,
        sizePct: rung.sizePct,
        rungSize,
        orderId: result.orderId,
      });

      orderIds.push(result.orderId);
      submittedRungs.push(rung);
      submittedShares += rungSize;
    }

    this.journal.append(jk('limit_ladder_finished'), {
      ticker,
      submittedRungCount: submittedRungs.length,
      submittedShares,
      orderIds,
    });

    return {
      orderIds,
      rungs: submittedRungs,
      submittedShares,
    };
  }
}
