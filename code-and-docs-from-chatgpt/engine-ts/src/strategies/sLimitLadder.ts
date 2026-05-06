/**
 * sLimitLadder.ts — S8 preset builder: buildSLimitLadderArgs.
 *
 * Validates and constructs an S8Config for the LimitLadderRunner.
 * Mirrors the pattern of other s-strategy preset files: pure config
 * construction with no I/O, no client usage.
 *
 * File-touch boundary: this file only.
 */

import type { S8Config, S8Rung } from '../limitLadder.js';
import type { Side } from '../types.js';

export interface SLimitLadderOpts {
  ticker: string;
  side: Side;
  action: 'buy' | 'sell';
  totalSize: number;
  rungs: S8Rung[];
  jobId?: string;
  keaHome?: string;
}

/**
 * Build a validated S8Config for LimitLadderRunner.
 * Throws if any of the same invariants as the constructor would fail.
 */
export function buildSLimitLadderArgs(opts: SLimitLadderOpts): S8Config {
  if (!opts.ticker || opts.ticker.trim() === '') {
    throw new Error('S8 preset: ticker must be a non-empty string');
  }
  if (opts.totalSize <= 0) {
    throw new Error(`S8 preset: totalSize must be > 0 (got ${opts.totalSize})`);
  }
  if (opts.action !== 'buy' && opts.action !== 'sell') {
    throw new Error(`S8 preset: action must be 'buy' or 'sell' (got '${opts.action}')`);
  }
  if (!opts.rungs || opts.rungs.length === 0) {
    throw new Error('S8 preset: rungs must be a non-empty array');
  }
  let sumPct = 0;
  for (let i = 0; i < opts.rungs.length; i++) {
    const r = opts.rungs[i];
    if (r.priceCents <= 0) {
      throw new Error(`S8 preset: rung[${i}].priceCents must be > 0 (got ${r.priceCents})`);
    }
    if (r.sizePct <= 0) {
      throw new Error(`S8 preset: rung[${i}].sizePct must be > 0 (got ${r.sizePct})`);
    }
    sumPct += r.sizePct;
  }
  if (sumPct > 100) {
    throw new Error(`S8 preset: sum(sizePct) must be <= 100 (got ${sumPct})`);
  }

  return {
    ticker: opts.ticker,
    side: opts.side,
    action: opts.action,
    totalSize: opts.totalSize,
    rungs: opts.rungs,
    jobId: opts.jobId,
    keaHome: opts.keaHome,
  };
}
