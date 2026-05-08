/**
 * SH-BACKTEST Phase B2 — backtest harness.
 *
 * `runBacktest(config)` orchestrates:
 *   1. Load recording entries (loadRecording).
 *   2. Create ReplayKalshiClient.
 *   3. Resolve strategy adapter (StrategyAdapter interface).
 *   4. Drive cursor tick-by-tick, invoking strategy each tick.
 *   5. Capture per-tick trace, compute summary metrics, emit CounterfactualReport.
 *
 * Strategy wiring uses the StrategyAdapter interface — a thin seam that any
 * strategy can implement. Two adapters are wired in v1:
 *   - 'stop_loss': synthetic stop-loss evaluator (direct wiring).
 *   - 'stub':      no-op adapter for testing harness mechanics.
 *
 * All other strategy IDs (ExitRunner/BuyRunner) are documented as
 * TODO(SH-BACKTEST Phase C): wire via DI seam. The framework is complete;
 * strategy adoption is a follow-up.
 *
 * Spec §8 fidelity caveats are appended to every report's assumptions_warning.
 */

import { loadRecording } from './loader.js';
import { createReplayClient } from './replayClient.js';
import type { ReplayKalshiClient } from './replayClient.js';
import type {
  BacktestConfig,
  BacktestTraceRow,
  CounterfactualReport,
  SimulatedFillRecord,
} from './types.js';
import { makePassiveAdapter } from './adapters/passiveAdapter.js';
import { makeAggressiveAdapter } from './adapters/aggressiveAdapter.js';
import { makeTwapAdapter } from './adapters/twapAdapter.js';

// ---------------------------------------------------------------------------
// §8 fidelity caveats — appended to every report
// ---------------------------------------------------------------------------

const FIDELITY_CAVEATS: string[] = [
  'caveat-1: Sub-cadence events invisible — intra-poll fills and price moves are not captured; fill rates may be over-estimated in fast markets.',
  'caveat-2: No market-impact modeling — fills are served at the recorded book price regardless of order size.',
  'caveat-3: Book contamination risk — if the recording was made during a live algo run, your own orders are reflected in the book.',
  'caveat-4: News-driven gaps — when a large price move occurs between two snapshots, the strategy sees it in a single tick.',
  'caveat-5: Single-ticker only — multi-leg / spread strategies are not supported; only the primary ticker is tracked.',
];

// ---------------------------------------------------------------------------
// StrategyAdapter — thin seam strategies implement for harness compatibility
// ---------------------------------------------------------------------------

/**
 * Minimal interface the harness calls each tick.
 * Real strategy runners (ExitRunner, BuyRunner) plug in via thin adapter wrappers.
 * Phase 2 wired: s-passive (passiveAdapter.ts), s-aggressive (aggressiveAdapter.ts),
 * s-twap (twapAdapter.ts).
 * TODO(SH-BACKTEST Phase D): wire s-trail (Watcher-based) and synthetics.
 */
export interface StrategyAdapter {
  /**
   * Called once per tick (after cursor advances to a new snapshot).
   * The adapter may call client.createOrder() to place simulated orders.
   * Returns a human-readable description of the decision taken (or '' for no-op).
   */
  tick(client: ReplayKalshiClient, remainingQty: number): Promise<string>;
}

// ---------------------------------------------------------------------------
// Built-in strategy adapters
// ---------------------------------------------------------------------------

/**
 * Stop-loss synthetic adapter.
 * Evaluates: if best yes bid < stopPriceCents → market-sell all remaining.
 * params: { ticker: string, side: 'yes'|'no', stopPriceCents: number, size: number }
 */
function makeStopLossAdapter(params: Record<string, unknown>): StrategyAdapter {
  const ticker = (params['ticker'] as string | undefined) ?? '';
  const side = (params['side'] as 'yes' | 'no' | undefined) ?? 'yes';
  const stopCents = (params['stopPriceCents'] as number | undefined) ?? 0;
  const size = (params['size'] as number | undefined) ?? 0;
  let triggered = false;

  return {
    async tick(client, remainingQty) {
      if (triggered || remainingQty <= 0) return '';
      const book = await client.getOrderbook(ticker, 5);
      // Best bid on the yes side = highest yes price offered
      const bestBid = book.yes[0]?.priceCents ?? 0;
      if (bestBid <= stopCents) {
        triggered = true;
        // Aggressive sell — set limit price at 99¢ to sweep any resting bid.
        // The fill simulator uses limitPriceCents as maxPrice (fills levels ≤ limit).
        // Setting limit=99 on a yes sell sweeps all yes levels up to 99¢.
        await client.createOrder({
          ticker,
          side,
          action: 'sell',
          type: 'limit',
          count: remainingQty,
          yes_price: side === 'yes' ? 99 : undefined,
          no_price: side === 'no' ? 99 : undefined,
          time_in_force: 'immediate_or_cancel',
          reduce_only: true,
          client_order_id: `stop-loss-${Date.now()}`,
        });
        return `stop_loss triggered: bid ${bestBid}c ≤ stop ${stopCents}c, sell ${remainingQty}`;
      }
      return '';
    },
  };
}

/**
 * Stub adapter — no-op. Useful for testing harness mechanics.
 */
const STUB_ADAPTER: StrategyAdapter = {
  async tick() {
    return '';
  },
};

// ---------------------------------------------------------------------------
// Strategy resolver
// ---------------------------------------------------------------------------

function resolveAdapter(
  strategyId: string,
  params: Record<string, unknown>,
): StrategyAdapter {
  switch (strategyId) {
    case 'stop_loss':
      return makeStopLossAdapter(params);
    case 'stub':
      return STUB_ADAPTER;
    case 's-passive':
      // Phase 2: real passive.runOneTick() driver. Adapter uses dryRun=false
      // so createOrder calls flow into the replay client's fill log.
      return makePassiveAdapter(params);
    case 's-aggressive':
      // Phase 2: AggressiveRunner.runOneTick() — single-shot IoC sweep.
      return makeAggressiveAdapter(params);
    case 's-twap':
      // Phase 2: STwapRunner.runOneTick() — one interval per harness tick.
      return makeTwapAdapter(params);
    // TODO(SH-BACKTEST Phase D): wire 's-trail' (Watcher-based, separate refactor)
    //   and synthetics ('trailing_stop', 'take_profit', 'oco', 'bracket')
    default:
      throw new Error(
        `runBacktest: unknown strategyId '${strategyId}'. ` +
          `Wired: stop_loss, stub, s-passive, s-aggressive, s-twap. ` +
          `Synthetics + s-trail pending Phase D.`,
      );
  }
}

// ---------------------------------------------------------------------------
// Mid-price helper
// ---------------------------------------------------------------------------

function computeMid(
  yesSide: Array<{ priceCents: number; size: number }>,
  noSide: Array<{ priceCents: number; size: number }>,
): number {
  const bestYesBid = yesSide[0]?.priceCents ?? 0;
  const bestNoBid = noSide[0]?.priceCents ?? 0;
  if (bestYesBid > 0 && bestNoBid > 0) {
    // mid = 50 + (yesBid - noBid) / 2  (in cents, on 0-100 scale)
    return Math.round((bestYesBid + (100 - bestNoBid)) / 2);
  }
  return bestYesBid || 100 - bestNoBid || 50;
}

// ---------------------------------------------------------------------------
// P&L accounting
// ---------------------------------------------------------------------------

/**
 * Compute cumulative P&L from fill log.
 * For sell fills: revenue = filled * fillPriceCents - feesCents.
 * For buy fills: cost = filled * fillPriceCents + feesCents.
 * P&L = sum of sell revenues - sum of buy costs (all in cents).
 */
function computePnl(fills: SimulatedFillRecord[]): number {
  let pnl = 0;
  for (const f of fills) {
    const gross = f.filled * f.fillPriceCents;
    // We only track exit (sell) fills as positive P&L contributions;
    // the initial cost basis is not tracked here (no-cost-basis assumption).
    // This is a simplification: harness reports gross proceeds.
    pnl += gross - f.feesCents;
  }
  return pnl;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Run a backtest: load recording, drive replay client tick-by-tick against
 * the resolved strategy adapter, and emit a CounterfactualReport.
 */
export async function runBacktest(config: BacktestConfig): Promise<CounterfactualReport> {
  const params = config.params ?? {};
  const initialQty =
    config.initialPosition?.quantity ??
    (params['size'] as number | undefined) ??
    0;

  // 1. Load recording
  const entries = await loadRecording(config.recordingPath, {
    tsFrom: config.tsFrom,
    tsTo: config.tsTo,
  });

  // 2. Create replay client
  const client = createReplayClient({
    entries,
    fillModel: config.fillModel ?? 'naive',
    initialPosition: config.initialPosition,
  });

  // 3. Resolve strategy
  const adapter = resolveAdapter(config.strategyId, params);

  // 4. Drive tick loop
  const trace: BacktestTraceRow[] = [];
  const markCurve: Array<{ ts: string; midCents: number }> = [];

  let firstTs: string | null = null;
  let lastTs: string | null = null;
  let fullExitTs: string | null = null;

  let remainingQty = initialQty;

  while (client.advance()) {
    const ts = client.currentTimestamp();
    if (!firstTs) firstTs = ts;
    lastTs = ts;

    // Get book for mid computation
    const ticker =
      config.initialPosition?.ticker ??
      (params['ticker'] as string | undefined) ??
      '';
    const book = await client.getOrderbook(ticker, 5);
    const midCents = computeMid(book.yes, book.no);

    markCurve.push({ ts, midCents });

    // Invoke strategy
    await adapter.tick(client, remainingQty);

    // Update remaining from fill log
    const fills = client.getFillLog();
    const totalFilled = fills.reduce((acc, f) => acc + f.filled, 0);
    remainingQty = Math.max(0, initialQty - totalFilled);

    // Track full exit
    if (remainingQty === 0 && !fullExitTs) {
      fullExitTs = ts;
    }

    const pnl = computePnl(fills);

    trace.push({
      ts,
      midCents,
      fillsSoFar: fills.length,
      remaining: remainingQty,
      pnl_cents: pnl,
    });
  }

  // 5. Compute summary metrics
  const fills = client.getFillLog();
  const totalFilled = fills.reduce((acc, f) => acc + f.filled, 0);
  const fillRate = initialQty > 0 ? totalFilled / initialQty : 0;
  const finalPnl = computePnl(fills);

  // Slippage vs mid at fill tick
  let totalSlippage = 0;
  for (const fill of fills) {
    const tickRow = trace.find((r) => r.ts === fill.ts);
    const mid = tickRow?.midCents ?? fill.fillPriceCents;
    totalSlippage += fill.fillPriceCents - mid;
  }
  const avgSlippage = fills.length > 0 ? Math.round(totalSlippage / fills.length) : 0;

  // Time to full exit
  let timeToFullExit = -1;
  if (fullExitTs && firstTs) {
    timeToFullExit = Math.round(
      (new Date(fullExitTs).getTime() - new Date(firstTs).getTime()) / 1000,
    );
  }

  // MAE / MFE from trace
  const pnlValues = trace.map((r) => r.pnl_cents);
  const mae = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;
  const mfe = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;

  const summary = {
    pnl_cents: finalPnl,
    fill_count: fills.length,
    fill_rate: fillRate,
    avg_slippage_cents: avgSlippage,
    time_to_full_exit_s: timeToFullExit,
    max_adverse_excursion_cents: mae,
    max_favorable_excursion_cents: mfe,
  };

  return {
    strategyId: config.strategyId,
    recordingPath: config.recordingPath,
    params,
    summary,
    // top-level aliases
    pnl_cents: finalPnl,
    fill_count: fills.length,
    fill_rate: fillRate,
    avg_slippage_cents: avgSlippage,
    trace,
    mark_curve: markCurve,
    fills,
    assumptions_warning: [...FIDELITY_CAVEATS],
    generated_at: new Date().toISOString(),
  };
}
