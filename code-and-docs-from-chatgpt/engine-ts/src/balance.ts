/**
 * Portfolio NAV cache for the SH-2 pre-trade risk gate.
 *
 * Both ExitRunner and BuyRunner call this once per run before invoking
 * checkPreTradeRisk. A 10s TTL prevents hammering /portfolio/balance on
 * tight loops while keeping the value fresh enough that mid-job position
 * size changes don't drift the concentration check materially.
 *
 * On fetch failure or invalid value: return 0 (and log) rather than throw —
 * the risk gate's concentration check then short-circuits (safety.ts:222
 * gates on `portfolioNAVDollars > 0`), matching the prior placeholder
 * behavior. Pre-trade risk failures should not block startup on transient
 * Kalshi outages, but they MUST be loud — silent NaN/Infinity propagation
 * into the concentration check would bypass the cap without operator
 * notice.
 */

interface BalanceFetcher {
  fetchBalanceDollars?(): Promise<number>;
}

const TTL_MS = 10_000;

let cachedDollars: number | null = null;
let cachedAt = 0;

export async function getPortfolioNAVDollars(client: BalanceFetcher): Promise<number> {
  const now = Date.now();
  if (cachedDollars !== null && now - cachedAt < TTL_MS) {
    return cachedDollars;
  }
  try {
    if (typeof client.fetchBalanceDollars !== 'function') {
      return 0;
    }
    const v = await client.fetchBalanceDollars();
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
      console.error(`[balance] fetchBalanceDollars returned invalid value: ${String(v)} (typeof=${typeof v}); falling back to 0 — concentration check will be skipped`);
      return 0;
    }
    cachedDollars = v;
    cachedAt = now;
    return v;
  } catch (err) {
    console.error('[balance] fetchBalanceDollars failed:', err instanceof Error ? err.message : err);
    return 0;
  }
}

/** Test-only: invalidate cache between tests. */
export function _resetBalanceCache(): void {
  cachedDollars = null;
  cachedAt = 0;
}
