# Slice 2 — Engine Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close 3 deferred follow-ups so the next live backtest run exercises real risk gating, full strategy coverage, and clean edge-attribution: SH-EDGE-PHASE-B, ENGINE-NAV-WIRE, and SH-BACKTEST-RUNTICK.

**Architecture:** Three serial tasks. Task 1 is a small cleanup of stale TODO markers in `src/edge/` after PR #112 already shipped the underlying data. Task 2 adds a single `src/balance.ts` helper that wraps a new `KalshiClient.fetchBalanceDollars()` with a 10s TTL cache, called from both runners' pre-trade risk paths. Task 3 extracts a `runOneTick(ctx)` method from `ExitRunner.run()`'s while-loop so backtest adapters can drive the live pricing logic directly (instead of cloning it as `s-passive` does today), then rewrites adapters for `s-passive`, `s-trail`, `s-aggressive`, and `s-twap`. Tasks must merge in order: 1 → 2 → 3 (Tasks 2 + 3 both touch `exitRunner.ts:375` / `buyRunner.ts:220`).

**Tech Stack:** TypeScript, Vitest, existing `KalshiClient` / `ExitRunner` / `BuyRunner` modules.

---

## Pre-flight (orchestrator runs once)

- [ ] **Verify clean main**

```bash
cd /Users/bradygrapentine/projects/auto-exit
git fetch origin
git switch main && git pull --ff-only
git rev-parse origin/main  # all task branches base from this SHA
```

- [ ] **Run full test suite — confirm green baseline**

```bash
cd code-and-docs-from-chatgpt/engine-ts
npx vitest run
```

Expected: all pass (1869 tests as of PR #115).

- [ ] **Verify expected TODO markers exist** (sanity, won't last)

```bash
grep -n "TODO(SH-EDGE Phase B)" src/edge/benchmarks.ts src/edge/aggregate.ts
grep -n "TODO: pass real NAV" src/buyRunner.ts src/exitRunner.ts
grep -n "TODO(SH-BACKTEST Phase C)" src/backtest/harness.ts
```

Expected lines: `benchmarks.ts:48`, `aggregate.ts:133`, `buyRunner.ts:220`, `exitRunner.ts:375`, `harness.ts:54-55,131-135`.

---

## Task 1: SH-EDGE-PHASE-B cleanup

**Branch:** `feat/edge/sh-edge-phase-b-cleanup` (from `origin/main`)

**Why:** PR #112 (2026-05-07) added `peakBidCents` + `triggerKind` to `synthetic_fired` journal entries, and `optimalHindsightBenchmark` already reads them at `src/edge/benchmarks.ts:52`. The two `TODO(SH-EDGE Phase B)` comments are now stale and must be removed. We also lack an end-to-end test that proves real `peakBidCents` data flows from journal → `Fire[]` → `triggerHistogram`.

**Files:**
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/edge/benchmarks.ts:41-49` (remove stale TODO block)
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/edge/aggregate.ts:127-134` (remove stale TODO line)
- Test (new): `code-and-docs-from-chatgpt/engine-ts/test/edge/peakBidCents-flow.test.ts`

- [ ] **Step 1: Write the end-to-end test (failing)**

Create `code-and-docs-from-chatgpt/engine-ts/test/edge/peakBidCents-flow.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { firesFromJournalEntries } from '../../src/edge/lifecycle.js';
import { optimalHindsightBenchmark } from '../../src/edge/benchmarks.js';
import { triggerHistogram } from '../../src/edge/aggregate.js';

describe('peakBidCents flows end-to-end through edge pipeline', () => {
  // A take-profit fire with peakBidCents=72 (recorded high-water) and exitFills
  // averaging 65¢. Optimal-hindsight benchmark should be exactly peakBidCents,
  // not the heuristic max(exitFills).
  const journal = [
    { kind: 'job_started', ts: '2026-05-08T00:00:00Z', jobId: 'j1', ticker: 'KXTEST-A', side: 'yes', size: 10 },
    { kind: 'order_placed', ts: '2026-05-08T00:00:01Z', jobId: 'j1', side: 'buy', count: 10, priceCents: 50 },
    { kind: 'order_reconciled', ts: '2026-05-08T00:00:02Z', jobId: 'j1', side: 'buy', filled: 10, priceCents: 50 },
    { kind: 'synthetic_armed', ts: '2026-05-08T00:00:03Z', jobId: 'j1', triggerKind: 'take_profit' },
    { kind: 'synthetic_fired', ts: '2026-05-08T00:00:10Z', jobId: 'j1', triggerKind: 'take_profit', peakBidCents: 72 },
    { kind: 'order_placed', ts: '2026-05-08T00:00:11Z', jobId: 'j1', side: 'sell', count: 10, priceCents: 65 },
    { kind: 'order_reconciled', ts: '2026-05-08T00:00:12Z', jobId: 'j1', side: 'sell', filled: 10, priceCents: 65 },
    { kind: 'job_finished', ts: '2026-05-08T00:00:13Z', jobId: 'j1' },
  ];

  it('optimalHindsightBenchmark uses peakBidCents over exitFills heuristic', () => {
    const fires = firesFromJournalEntries(journal as any);
    expect(fires).toHaveLength(1);
    const benchmark = optimalHindsightBenchmark(fires[0]);
    expect(benchmark).toBe(72);  // peakBidCents — NOT max(exitFills)=65
  });

  it('triggerHistogram bins fire by triggerQuality using peakBidCents-derived benchmark', () => {
    const fires = firesFromJournalEntries(journal as any);
    const hist = triggerHistogram(fires);
    expect(hist).toHaveLength(1);
    expect(hist[0].triggerKind).toBe('take_profit');
    // Sold at 65 vs optimal 72 → tooEarly (sold below peak by 7¢ > 1¢ tolerance)
    expect(hist[0].tooEarly).toBe(1);
    expect(hist[0].onTime).toBe(0);
    expect(hist[0].tooLate).toBe(0);
  });
});
```

- [ ] **Step 2: Run test, verify it passes already** (it should — the data path already works)

```bash
cd code-and-docs-from-chatgpt/engine-ts
npx vitest run test/edge/peakBidCents-flow.test.ts
```

Expected: 2 pass. If either fails, that's a real bug — investigate before continuing. Stop and report. Do not delete the TODO comments until tests are green: the comments are the only remaining record that this path was incomplete.

- [ ] **Step 3: Remove stale TODO from benchmarks.ts**

In `src/edge/benchmarks.ts`, replace lines 41-49:

```typescript
/**
 * Optimal-hindsight benchmark: best possible exit mid within the trigger window.
 *
 * For take-profit style fires (sell at peak): use peakBidCents.
 * For stop-loss style fires (sell at trough): use the lowest exit fill as proxy.
 * Falls back to the realized exit WAVG if neither is available.
 *
 * TODO(SH-EDGE Phase B): when SH-WATCH emits richer peakBidCents / troughBidCents
 * in 'synthetic_fired' data, use those directly.
 */
```

with:

```typescript
/**
 * Optimal-hindsight benchmark: best possible exit mid within the trigger window.
 *
 * For take-profit / trailing fires: use peakBidCents (recorded high-water mark
 * at trigger fire time, populated by SH-WATCH watchers as of PR #112).
 * For stop-loss / trailing-stop fires: use lowest exit fill as proxy.
 * Falls back to decisionMidCents otherwise.
 */
```

- [ ] **Step 4: Remove stale TODO from aggregate.ts**

In `src/edge/aggregate.ts`, delete line 133:

```
 * TODO(SH-EDGE Phase B): use actual optimalHindsightMidCents from SH-WATCH when available.
```

(leave the rest of the docblock intact)

- [ ] **Step 5: Re-run full suite + typecheck**

```bash
cd code-and-docs-from-chatgpt/engine-ts
npx vitest run
npx tsc --noEmit
```

Expected: 1871 tests pass (1869 prior + 2 new), tsc clean.

- [ ] **Step 6: Commit**

```bash
git add code-and-docs-from-chatgpt/engine-ts/src/edge/benchmarks.ts \
        code-and-docs-from-chatgpt/engine-ts/src/edge/aggregate.ts \
        code-and-docs-from-chatgpt/engine-ts/test/edge/peakBidCents-flow.test.ts
git commit -m "feat(edge): SH-EDGE Phase B cleanup — close stale TODOs, add end-to-end peakBidCents test"
```

- [ ] **Step 7: Push + open PR + arm auto-merge**

```bash
git push -u origin feat/edge/sh-edge-phase-b-cleanup
gh pr create --title "feat(edge): SH-EDGE Phase B cleanup — close stale TODOs after PR #112" \
  --body "PR #112 already added peakBidCents + triggerKind to synthetic_fired entries; optimalHindsightBenchmark reads them at benchmarks.ts:52. This PR removes the now-stale TODO markers and adds an end-to-end test (journal → Fire[] → triggerHistogram) proving the data path."
gh pr merge --auto --squash
```

---

## Task 2: ENGINE-NAV-WIRE

**Branch:** `feat/shared/engine-nav-wire` (from `origin/main` after Task 1 merges)

**Why:** Both runners pass `portfolioNAVDollars: 0` to `checkPreTradeRisk`, which neuters the concentration-cap check. We need a real value sourced from Kalshi's `/portfolio/balance` endpoint, with a short TTL cache so back-to-back tick checks don't hammer the API.

**Files:**
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/kalshiClient.ts` (add `fetchBalanceDollars()` method after `cancelOrder`, ~line 188)
- Create: `code-and-docs-from-chatgpt/engine-ts/src/balance.ts` (TTL cache helper)
- Create: `code-and-docs-from-chatgpt/engine-ts/test/balance.test.ts`
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/exitRunner.ts:375` (replace `0` with helper call)
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/buyRunner.ts:220` (same)

- [ ] **Step 1: Add `fetchBalanceDollars` to KalshiClient**

In `src/kalshiClient.ts`, after the `cancelOrder` method (around line 188), insert:

```typescript
  /**
   * Fetch the operator's portfolio balance in dollars.
   * Kalshi returns `balance` in cents; we convert to whole dollars.
   * Used by the SH-2 pre-trade risk gate (concentration check).
   */
  async fetchBalanceDollars(): Promise<number> {
    return withRetry(async () => {
      const path = '/portfolio/balance';
      const res = await fetchChecked(
        this.fetchFn,
        this.config.baseUrl + path,
        { headers: this.authHeaders('GET', path) },
      );
      const json = (await res.json()) as { balance?: number };
      const cents = json.balance ?? 0;
      return cents / 100;
    });
  }
```

- [ ] **Step 2: Write the balance helper test (failing)**

Create `code-and-docs-from-chatgpt/engine-ts/test/balance.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPortfolioNAVDollars, _resetBalanceCache } from '../src/balance.js';

describe('getPortfolioNAVDollars', () => {
  beforeEach(() => { _resetBalanceCache(); vi.useFakeTimers(); });

  it('calls fetchBalanceDollars on first call and caches result for 10s', async () => {
    const fetcher = { fetchBalanceDollars: vi.fn().mockResolvedValue(123.45) };
    const a = await getPortfolioNAVDollars(fetcher as any);
    const b = await getPortfolioNAVDollars(fetcher as any);
    expect(a).toBe(123.45);
    expect(b).toBe(123.45);
    expect(fetcher.fetchBalanceDollars).toHaveBeenCalledTimes(1);
  });

  it('refetches after TTL expires', async () => {
    const fetcher = { fetchBalanceDollars: vi.fn()
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(200) };
    expect(await getPortfolioNAVDollars(fetcher as any)).toBe(100);
    vi.advanceTimersByTime(10_001);
    expect(await getPortfolioNAVDollars(fetcher as any)).toBe(200);
    expect(fetcher.fetchBalanceDollars).toHaveBeenCalledTimes(2);
  });

  it('returns 0 and logs on fetch failure (does not throw)', async () => {
    const fetcher = { fetchBalanceDollars: vi.fn().mockRejectedValue(new Error('network')) };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getPortfolioNAVDollars(fetcher as any);
    expect(result).toBe(0);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
```

- [ ] **Step 3: Run test, verify failure**

```bash
cd code-and-docs-from-chatgpt/engine-ts
npx vitest run test/balance.test.ts
```

Expected: import fails — `Cannot find module '../src/balance.js'`.

- [ ] **Step 4: Implement balance helper**

Create `code-and-docs-from-chatgpt/engine-ts/src/balance.ts`:

```typescript
/**
 * Portfolio NAV cache for the SH-2 pre-trade risk gate.
 *
 * Both ExitRunner and BuyRunner call this once per tick before invoking
 * checkPreTradeRisk. A 10s TTL prevents hammering /portfolio/balance on
 * tight loops while keeping the value fresh enough that mid-job position
 * size changes don't drift the concentration check materially.
 *
 * On fetch failure we return 0 (and log) rather than throw — the risk gate's
 * concentration check then short-circuits, matching the prior placeholder
 * behavior. Pre-trade risk failures should not block startup on transient
 * Kalshi outages.
 */

interface BalanceFetcher {
  fetchBalanceDollars(): Promise<number>;
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
    const v = await client.fetchBalanceDollars();
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
```

- [ ] **Step 5: Run test, verify pass**

```bash
npx vitest run test/balance.test.ts
```

Expected: 3 pass.

- [ ] **Step 6: Wire helper into ExitRunner**

In `src/exitRunner.ts`, add import near top (after the existing import block, around line 7):

```typescript
import { getPortfolioNAVDollars } from './balance.js';
```

Replace lines 372-377 (the `checkPreTradeRisk` call):

```typescript
      await checkPreTradeRisk({
        ticker: this.config.marketTicker,
        sizeDollars,
        portfolioNAVDollars: 0, // TODO: pass real NAV when fetchBalance is available
        safety: safetySnapshot,
      });
```

with:

```typescript
      const navDollars = await getPortfolioNAVDollars(this.client as any);
      await checkPreTradeRisk({
        ticker: this.config.marketTicker,
        sizeDollars,
        portfolioNAVDollars: navDollars,
        safety: safetySnapshot,
      });
```

(`as any` cast: `KalshiClientLike` doesn't yet declare `fetchBalanceDollars`. Tests that pass a hand-rolled mock client must add the method or stub it.)

- [ ] **Step 7: Wire helper into BuyRunner**

In `src/buyRunner.ts`, add the same import. Replace lines 217-222:

```typescript
      await checkPreTradeRisk({
        ticker: this.config.marketTicker,
        sizeDollars,
        portfolioNAVDollars: 0, // TODO: pass real NAV when fetchBalance is available
        safety: safetySnapshot,
      });
```

with:

```typescript
      const navDollars = await getPortfolioNAVDollars(this.client as any);
      await checkPreTradeRisk({
        ticker: this.config.marketTicker,
        sizeDollars,
        portfolioNAVDollars: navDollars,
        safety: safetySnapshot,
      });
```

- [ ] **Step 8: Update KalshiClientLike type**

In `src/types.ts`, find the `KalshiClientLike` interface and add:

```typescript
  fetchBalanceDollars?(): Promise<number>;
```

(Optional `?` so existing test mocks don't break. The `getPortfolioNAVDollars` helper accepts `BalanceFetcher` directly, but the cast in the runners needs the type to admit it.)

If after this change the cast in Steps 6-7 is no longer needed, remove `as any`.

- [ ] **Step 9: Run full suite — fix any test mocks that broke**

```bash
npx vitest run
```

If existing runner tests fail because their mock client lacks `fetchBalanceDollars`, add a stub: `fetchBalanceDollars: async () => 1000`. Look for these in:

```bash
grep -rn "client.*createOrder.*async" test/ | head -20
```

- [ ] **Step 10: Typecheck + commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat(shared): ENGINE-NAV-WIRE — real portfolioNAVDollars in pre-trade risk gate"
```

- [ ] **Step 11: Push + PR + auto-merge**

```bash
git push -u origin feat/shared/engine-nav-wire
gh pr create --title "feat(shared): ENGINE-NAV-WIRE — wire real NAV into SH-2 risk gate" \
  --body "Adds KalshiClient.fetchBalanceDollars + src/balance.ts (10s TTL cache) and replaces portfolioNAVDollars=0 placeholders in both runners. Closes the SH-2 concentration-check no-op."
gh pr merge --auto --squash
```

---

## Task 3: SH-BACKTEST-RUNTICK — extract `runOneTick` seam in ExitRunner

**Branch:** `feat/backtest/exitrunner-runonetick` (from `origin/main` after Tasks 1+2 merge)

**Why:** Backtest adapters currently clone strategy pricing logic (see `s-passive` adapter at `src/backtest/adapters/exitRunnerAdapter.ts`). Cloning is correctness debt: live and backtest pricing will drift. The fix is to extract the per-iteration body of `ExitRunner.run()`'s while-loop (`exitRunner.ts:383-524`) into a pure-ish `runOneTick()` method. Adapters then call `runOneTick` directly, replaying recorded snapshots, with no `sleep()`-based clock.

The refactor is intentionally narrow: pull the *body* out, leave loop-control flow (break / continue / sleep) at the caller.

**Files:**
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/exitRunner.ts` (extract `runOneTick`, restructure `run`)
- Create: `code-and-docs-from-chatgpt/engine-ts/test/exitRunner-runOneTick.test.ts`

### Refactor target

The current loop body has 3 control outcomes:
1. Continue (default — finished placing/reconciling one chunk).
2. Break (kill switch, max-orders, safety cap, GTC resting).
3. Throw (unexpected error — caller's existing try/catch handles).

Encode as discriminated return:

```typescript
export type TickOutcome =
  | { kind: 'continue' }
  | { kind: 'break_loop'; reason: 'kill_switch' | 'max_orders' | 'safety_cap' | 'gtc_resting' | 'stop_requested' };
```

`runOneTick()` becomes:

```typescript
  /**
   * Execute one iteration of the exit loop. Returns a discriminated outcome
   * describing whether the caller should continue, break, or has finished.
   *
   * Public for the SH-BACKTEST harness adapter — tests must drive single
   * ticks without invoking the blocking sleep() loop in run().
   */
  async runOneTick(): Promise<TickOutcome> {
    if (this.stopRequested) return { kind: 'break_loop', reason: 'stop_requested' };
    if (this.killSwitchExists()) {
      this.log('warn', 'kill_switch_found', { path: this.config.killSwitchPath });
      return { kind: 'break_loop', reason: 'kill_switch' };
    }
    if (this.status.ordersAttempted >= this.config.maxOrders) {
      this.log('error', 'max_orders_reached', { maxOrders: this.config.maxOrders });
      return { kind: 'break_loop', reason: 'max_orders' };
    }

    // ... lines 394-521 from current run() body, with each `break` replaced
    //     by `return { kind: 'break_loop', reason: <case> }` ...

    return { kind: 'continue' };
  }
```

### Steps

- [ ] **Step 1: Add the new test file (failing — `runOneTick` doesn't exist yet)**

Create `code-and-docs-from-chatgpt/engine-ts/test/exitRunner-runOneTick.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import type { ExitConfig, KalshiClientLike, OrderbookSnapshot, OrderResult } from '../src/types.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function mkConfig(overrides: Partial<ExitConfig> = {}): ExitConfig {
  return {
    marketTicker: 'KXTEST-A',
    heldSide: 'yes',
    positionSize: 10,
    floorPriceCents: 50,
    orderbookDepth: 5,
    loopDelayMs: 0,
    maxOrders: 5,
    dryRun: true,
    chunkSizeRule: { kind: 'fixed', value: 5 },
    pricingRule: { kind: 'best_bid_minus', value: 0 },
    safetySubmittedMultiple: 1.5,
    tailSweepThreshold: 0,
    forbiddenTickers: [],
    ...overrides,
  } as ExitConfig;
}

function mkBook(yesBidCents: number, yesBidSize: number): OrderbookSnapshot {
  return {
    yes: [{ priceCents: yesBidCents, size: yesBidSize }],
    no:  [{ priceCents: 100 - yesBidCents - 2, size: 100 }],
  } as OrderbookSnapshot;
}

class StubClient implements Partial<KalshiClientLike> {
  books: OrderbookSnapshot[] = [];
  bookIdx = 0;
  orders: any[] = [];

  async getOrderbook(): Promise<OrderbookSnapshot> {
    const b = this.books[Math.min(this.bookIdx, this.books.length - 1)];
    this.bookIdx++;
    return b;
  }
  async createOrder(p: any): Promise<OrderResult> {
    this.orders.push(p);
    return { orderId: `ord-${this.orders.length}`, status: 'filled', filledCount: p.count } as OrderResult;
  }
  async getOrder(orderId: string): Promise<OrderResult> {
    const idx = Number(orderId.split('-')[1]) - 1;
    const p = this.orders[idx];
    return { orderId, status: 'filled', filledCount: p.count, takerFeesDollars: 0 } as OrderResult;
  }
  async fetchBalanceDollars(): Promise<number> { return 1000; }
}

describe('ExitRunner.runOneTick', () => {
  let keaHome: string;
  beforeEach(() => { keaHome = mkdtempSync(path.join(tmpdir(), 'kea-test-')); });

  it('returns continue after a successful chunk fill', async () => {
    const client = new StubClient();
    client.books = [mkBook(60, 100), mkBook(60, 100)];
    const r = new ExitRunner(mkConfig({ dryRun: false }), client as any, { keaHome });
    // Bypass run()'s preamble: directly bootstrap state for tick test.
    (r as any).status.running = true;
    const outcome = await r.runOneTick();
    expect(outcome).toEqual({ kind: 'continue' });
    expect(r.getStatus().filledTotal).toBe(5);
    rmSync(keaHome, { recursive: true });
  });

  it('returns break_loop:max_orders when ordersAttempted >= maxOrders', async () => {
    const client = new StubClient();
    client.books = [mkBook(60, 100)];
    const r = new ExitRunner(mkConfig({ maxOrders: 1 }), client as any, { keaHome });
    (r as any).status.running = true;
    (r as any).status.ordersAttempted = 1;
    const outcome = await r.runOneTick();
    expect(outcome).toEqual({ kind: 'break_loop', reason: 'max_orders' });
    rmSync(keaHome, { recursive: true });
  });

  it('returns break_loop:gtc_resting when GTC order is resting', async () => {
    const client = new StubClient();
    client.books = [mkBook(60, 100)];
    client.createOrder = async (p) => {
      client.orders.push(p);
      return { orderId: 'ord-1', status: 'resting', filledCount: 0 } as OrderResult;
    };
    const r = new ExitRunner(
      mkConfig({ dryRun: false, orderTimeInForce: 'good_till_canceled' }),
      client as any,
      { keaHome },
    );
    (r as any).status.running = true;
    const outcome = await r.runOneTick();
    expect(outcome).toEqual({ kind: 'break_loop', reason: 'gtc_resting' });
    rmSync(keaHome, { recursive: true });
  });

  it('run() still works end-to-end after refactor (regression)', async () => {
    const client = new StubClient();
    client.books = Array(20).fill(0).map(() => mkBook(60, 100));
    const r = new ExitRunner(mkConfig({ dryRun: true }), client as any, { keaHome });
    const status = await r.run();
    expect(status.remaining).toBe(0);
    expect(status.filledTotal).toBe(10);
    rmSync(keaHome, { recursive: true });
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
npx vitest run test/exitRunner-runOneTick.test.ts
```

Expected: `r.runOneTick is not a function` (3 fails) + the regression test passes.

- [ ] **Step 3: Add `TickOutcome` type to `src/types.ts`**

Append to `src/types.ts`:

```typescript
export type TickOutcome =
  | { kind: 'continue' }
  | { kind: 'break_loop'; reason: 'kill_switch' | 'max_orders' | 'safety_cap' | 'gtc_resting' | 'stop_requested' };
```

- [ ] **Step 4: Extract `runOneTick` from `ExitRunner.run()`**

In `src/exitRunner.ts`:

1. Import the new type at top:

```typescript
import type { ExitConfig, JobStatus, KalshiClientLike, LoopEvent, OrderPayload, OrderResult, Position, TcaEntry, TickOutcome } from './types.js';
```

2. Add `runOneTick` as a public method (place it just before `async run(): Promise<JobStatus>` at line 324). The body is the *contents of the current while-loop* (lines 384-524) with these transformations:

   - Each `break` becomes `return { kind: 'break_loop', reason: '<case>' };` matching:
     - `if (this.stopRequested) break` → `return { kind: 'break_loop', reason: 'stop_requested' };`
     - `if (this.killSwitchExists()) { ... break; }` → `return { kind: 'break_loop', reason: 'kill_switch' };`
     - `if (this.status.ordersAttempted >= this.config.maxOrders) { ... break; }` → `return { kind: 'break_loop', reason: 'max_orders' };`
     - The submitted-cap break → `return { kind: 'break_loop', reason: 'safety_cap' };`
     - The GTC resting break → `return { kind: 'break_loop', reason: 'gtc_resting' };`
   - The `if (this.config.loopDelayMs > 0) await sleep(this.config.loopDelayMs);` line is **removed** (it belongs in `run()`, not the tick).
   - Final implicit fall-through becomes `return { kind: 'continue' };`.

3. Rewrite `run()`'s while-loop (lines 383-524) as:

```typescript
      while (this.status.remaining > 0) {
        const outcome = await this.runOneTick();
        if (outcome.kind === 'break_loop') break;
        if (this.config.loopDelayMs > 0) await sleep(this.config.loopDelayMs);
      }
```

Keep everything before line 383 (preamble) and after line 524 (tail-GTC + finally) exactly as-is.

The full method declaration:

```typescript
  /**
   * Execute one iteration of the exit loop.
   *
   * SH-BACKTEST adapters call this directly with replayed snapshots to drive
   * the live pricing logic without invoking the blocking sleep() loop in run().
   * The discriminated TickOutcome encodes the same break-conditions that the
   * original while-loop responded to.
   *
   * Caller responsibility: this method assumes the runner has already gone
   * through run()'s preamble (safety load, forbidden check, resume, pre-trade
   * risk). For a fresh tick driver, set `this.status.running = true` first.
   */
  async runOneTick(): Promise<TickOutcome> {
    // body as described above
  }
```

- [ ] **Step 5: Run new test + regression test**

```bash
npx vitest run test/exitRunner-runOneTick.test.ts
```

Expected: 4 pass.

- [ ] **Step 6: Run full ExitRunner suite — confirm no regressions**

```bash
npx vitest run test/exitRunner
```

Expected: all green. If any prior test fails, the refactor leaked behavior — diagnose before continuing.

- [ ] **Step 7: Update the `s-passive` adapter to delegate to `runOneTick`**

Replace `src/backtest/adapters/exitRunnerAdapter.ts` (current passive-clone) with a thin wrapper:

```typescript
/**
 * SH-BACKTEST ExitRunner adapter — drives a real ExitRunner via runOneTick.
 *
 * Replaces the prior passive-clone approach. Each harness tick we update the
 * runner's snapshot view (via the replay client passed in) and call
 * runOneTick(); break_loop outcomes terminate the adapter.
 */
import { ExitRunner } from '../../exitRunner.js';
import type { ExitConfig, KalshiClientLike } from '../../types.js';
import type { ReplayKalshiClient } from '../replayClient.js';
import type { StrategyAdapter } from '../harness.js';

function paramsToConfig(params: Record<string, unknown>): ExitConfig {
  // Minimal mapping for harness use — only the fields that runOneTick reads.
  // dryRun=false so the runner exercises real ordering paths against the replay client.
  return {
    marketTicker: (params['ticker'] as string) ?? '',
    heldSide: (params['side'] as 'yes' | 'no') ?? 'yes',
    positionSize: (params['size'] as number) ?? 0,
    floorPriceCents: (params['floorPriceCents'] as number) ?? 1,
    orderbookDepth: 5,
    loopDelayMs: 0,
    maxOrders: 50,
    dryRun: false,
    chunkSizeRule: (params['chunkSizeRule'] as any) ?? { kind: 'fixed', value: 1 },
    pricingRule: (params['pricingRule'] as any) ?? { kind: 'best_bid_minus', value: 0 },
    safetySubmittedMultiple: 5,
    tailSweepThreshold: 0,
    forbiddenTickers: [],
  } as ExitConfig;
}

export function makePassiveAdapter(params: Record<string, unknown>): StrategyAdapter {
  let runner: ExitRunner | null = null;
  let stopped = false;

  return {
    async tick(client, remainingQty) {
      if (stopped || remainingQty <= 0) return '';
      if (!runner) {
        runner = new ExitRunner(paramsToConfig(params), client as unknown as KalshiClientLike);
        (runner as any).status.running = true;
      }
      const outcome = await runner.runOneTick();
      if (outcome.kind === 'break_loop') {
        stopped = true;
        return `passive: break_loop reason=${outcome.reason}`;
      }
      return 'passive: tick';
    },
  };
}
```

- [ ] **Step 8: Run backtest adapter tests**

```bash
npx vitest run test/backtest
```

Expected: all green. If `exitRunnerAdapter.test.ts` (11 tests from PR #115) fails because the passive-clone-specific assertions no longer apply, update those assertions to match `runOneTick`-driven behavior. Do **not** delete tests — modify their expected values where they were testing the clone's specific shape (e.g. exact log strings).

- [ ] **Step 9: Wire `s-trail` / `s-aggressive` / `s-twap` adapters via the same pattern**

Each strategy has a config builder (e.g. `buildSTrailExitConfig`, `buildSAggressiveExitConfig`). Add a generic factory at the bottom of `src/backtest/adapters/exitRunnerAdapter.ts`:

```typescript
import { buildSTrailExitConfig } from '../../strategies/sTrail.js';
import { buildSAggressiveExitConfig } from '../../strategies/sAggressive.js';
import { buildSTwapExitConfig } from '../../strategies/sTwap.js';

function makeExitRunnerAdapter(
  cfg: ExitConfig,
  label: string,
): StrategyAdapter {
  let runner: ExitRunner | null = null;
  let stopped = false;
  return {
    async tick(client, remainingQty) {
      if (stopped || remainingQty <= 0) return '';
      if (!runner) {
        runner = new ExitRunner(cfg, client as unknown as KalshiClientLike);
        (runner as any).status.running = true;
      }
      const outcome = await runner.runOneTick();
      if (outcome.kind === 'break_loop') {
        stopped = true;
        return `${label}: break_loop reason=${outcome.reason}`;
      }
      return `${label}: tick`;
    },
  };
}

export function makeTrailAdapter(params: Record<string, unknown>): StrategyAdapter {
  return makeExitRunnerAdapter(buildSTrailExitConfig(params as any), 's-trail');
}
export function makeAggressiveAdapter(params: Record<string, unknown>): StrategyAdapter {
  return makeExitRunnerAdapter(buildSAggressiveExitConfig(params as any), 's-aggressive');
}
export function makeTwapAdapter(params: Record<string, unknown>): StrategyAdapter {
  return makeExitRunnerAdapter(buildSTwapExitConfig(params as any), 's-twap');
}
```

If any of `buildSTrailExitConfig` / `buildSAggressiveExitConfig` / `buildSTwapExitConfig` doesn't exist with that exact name, grep for the strategy entry point and adapt:

```bash
grep -rn "export function build" src/strategies/sTrail.ts src/strategies/sAggressive.ts src/strategies/sTwap.ts
```

Use the discovered exported config-builder. If the strategy file uses a class instead of a builder, instantiate the runner with the params dict directly — the goal is *one* exported `make<Name>Adapter` per strategy, each returning a `StrategyAdapter` that delegates to `runner.runOneTick()`.

- [ ] **Step 10: Wire new adapters into `harness.ts:resolveAdapter`**

In `src/backtest/harness.ts`, replace lines 134-149 (the `s-passive` case + 4 TODO markers + default) with:

```typescript
    case 's-passive':
      return makePassiveAdapter(params);
    case 's-trail':
      return makeTrailAdapter(params);
    case 's-aggressive':
      return makeAggressiveAdapter(params);
    case 's-twap':
      return makeTwapAdapter(params);
    // TODO(SH-BACKTEST Phase D): wire 'trailing_stop', 'take_profit', 'oco', 'bracket'
    //   via synthetics evaluator DI seam — out of scope for SH-BACKTEST-RUNTICK
    //   (synthetics use a different evaluator architecture, not ExitRunner).
    default:
      throw new Error(
        `runBacktest: unknown strategyId '${strategyId}'. ` +
          `Wired: stop_loss, stub, s-passive, s-trail, s-aggressive, s-twap. ` +
          `Synthetics adapters (trailing_stop, take_profit, oco, bracket) pending Phase D.`,
      );
```

Add the imports at the top:

```typescript
import { makePassiveAdapter, makeTrailAdapter, makeAggressiveAdapter, makeTwapAdapter } from './adapters/exitRunnerAdapter.js';
```

- [ ] **Step 11: Add adapter resolution tests**

Append to `test/backtest/harness.test.ts` (find the existing describe block by `grep -n "describe" test/backtest/harness.test.ts`):

```typescript
  it('resolves s-trail / s-aggressive / s-twap to ExitRunner-backed adapters', async () => {
    for (const strategyId of ['s-trail', 's-aggressive', 's-twap']) {
      const config = {
        recordingPath: TINY_RECORDING_PATH,
        strategyId,
        params: { ticker: 'KXTEST-A', side: 'yes', size: 1 },
        initialPosition: { ticker: 'KXTEST-A', side: 'yes', quantity: 1 },
      };
      const report = await runBacktest(config);
      expect(report.strategyId).toBe(strategyId);
      expect(report.fill_count).toBeGreaterThanOrEqual(0);
    }
  });
```

(`TINY_RECORDING_PATH` should already be a fixture in that file. If not, look at what the existing tests use as a recording fixture and reuse.)

- [ ] **Step 12: Run full suite**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: all green (ballpark 1885 tests).

- [ ] **Step 13: Commit**

```bash
git add code-and-docs-from-chatgpt/engine-ts/src/types.ts \
        code-and-docs-from-chatgpt/engine-ts/src/exitRunner.ts \
        code-and-docs-from-chatgpt/engine-ts/src/backtest/harness.ts \
        code-and-docs-from-chatgpt/engine-ts/src/backtest/adapters/exitRunnerAdapter.ts \
        code-and-docs-from-chatgpt/engine-ts/test/exitRunner-runOneTick.test.ts \
        code-and-docs-from-chatgpt/engine-ts/test/backtest/
git commit -m "feat(backtest): SH-BACKTEST-RUNTICK — extract runOneTick seam in ExitRunner; wire s-passive/s-trail/s-aggressive/s-twap"
```

- [ ] **Step 14: Push + PR + auto-merge**

```bash
git push -u origin feat/backtest/exitrunner-runonetick
gh pr create --title "feat(backtest): SH-BACKTEST-RUNTICK — runOneTick seam + 4 ExitRunner adapters" \
  --body "Extracts ExitRunner.runOneTick() from run()'s while-loop, replaces the s-passive adapter clone with a thin runOneTick() driver, and wires real adapters for s-trail, s-aggressive, s-twap. Synthetics (trailing_stop, take_profit, oco, bracket) deferred to Phase D — they use a different evaluator architecture."
gh pr merge --auto --squash
```

---

## Self-review

**Spec coverage (vs the 3 backlog stories):**
- SH-EDGE-PHASE-B (delete stale TODOs in `benchmarks.ts:48` + `aggregate.ts:133`, add e2e test) → Task 1, all steps.
- ENGINE-NAV-WIRE (`getPortfolioNAVDollars` helper + 2 wire-ups + `fetchBalanceDollars` API) → Task 2, all steps.
- SH-BACKTEST-RUNTICK (`runOneTick` seam in ExitRunner; collapse 4 adapter TODOs in `harness.ts:131-135`) → Task 3, all steps. **BuyRunner runOneTick is explicitly out of scope** (no current backtest adapter calls it; defer until first real consumer).

**Out of scope (called out so reviewers don't expect it):**
- Synthetics adapter wiring (`trailing_stop`, `take_profit`, `oco`, `bracket`) — different evaluator architecture, separate Phase D story.
- BuyRunner `runOneTick` — symmetric refactor, no consumer demand yet.
- `troughBidCents` for stop-loss benchmark — current heuristic (min exit fill) is adequate; would only help if SH-WATCH starts emitting it, which is its own story.

**Type consistency:**
- `TickOutcome` declared once in `types.ts`, imported in `exitRunner.ts` and (transitively via `ExitRunner.runOneTick` return type) used in adapters. Single source.
- `BalanceFetcher` is a local interface in `balance.ts` — does not need to be re-exported; the runners pass the full `KalshiClient` (which structurally satisfies it once `fetchBalanceDollars` is added).
- Adapter factory names: `makePassiveAdapter`, `makeTrailAdapter`, `makeAggressiveAdapter`, `makeTwapAdapter` — consistent. The pre-existing `makePassiveAdapter` keeps its name (avoids churning #115's wired path).

**Placeholder scan:** No "TODO", "TBD", or "fill in" appears in any task step. Two TODO comments are *deleted* in Task 1 and *added* in Task 3 (`Phase D: synthetics`) — both are intentional (the new one is a precise scope marker, not a placeholder).

---

## Execution handoff

**Plan saved to** `code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-08-engine-followups-slice2.md`.

Two execution options:
1. **Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between, fast iteration.
2. **Inline Execution** — execute tasks here in this session with checkpoints between.

Which approach?
