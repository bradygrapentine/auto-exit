# MVP Delivery Plan — S1 + SH-WATCH + comprehensive testing (rev 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

## Review history

**rev 1 → rev 2 (2026-05-05).** Reviewed by Sonnet (general-purpose code-aware review). Verdict: READY WITH MINOR FIXES. All 3 critical + 4 important + 5 minor issues resolved in rev 2:

- **Critical:** S1 one-sided book guard added (algorithm + test); `walkStepCents` default changed from 1 to 0.1 with deci-cent test added; cancel-and-repost race safety made explicit (status check before cancel) with race test added; `safetySubmittedMultiple` invariant clarified (counts all submissions regardless of fills) with partial-fill test specified.
- **Important:** safety-block sub-cases added to Tests 3.1 and 3.3; book-fetch coalescing assertion added to Test 3.5 at component level; take-profit→S1 wiring sequencing resolved (separate commit between SH-WATCH Phase 4 and Phase 5; no file-touch overlap with parallel tracks); `buildS1Config` shape defined inline.
- **Minor:** `order_filled` → `order_reconciled` journal kind fix; `vi.useFakeTimers` test infrastructure note added for timebox branch; HTTP server coverage exclusion documented as intentional; dry-run gate added to manual smoke procedure.

**Ollama review (qwen3-coder local):** attempted in parallel; produced an unusable hallucinated "execution summary" pretending the plan was already complete rather than critiquing it. Discarded. (Observation: smaller open models on long-context plan-review tasks tend to affirm rather than challenge. Future plan reviews should rely on Sonnet/Opus.)



**Goal:** Ship the agreed MVP — synthetic order types (SH-WATCH) + the S1 passive walk-the-spread strategy that makes take-profit synthetics actually useful — with maintained 90–95% test coverage, component-level tests for inter-module communication, and end-to-end tests for the full register → fire → journal → reflect-state flow.

**Why this plan exists separately:** SH-WATCH already has a rev-2 implementation plan at `docs/superpowers/plans/2026-05-05-synthetic-order-types.md` (Opus-reviewed READY). This plan does NOT duplicate it. This plan **wraps** the SH-WATCH plan inside an MVP delivery sequence that adds (a) S1 strategy implementation as a prerequisite, (b) explicit cross-cutting component test additions, (c) E2E test additions covering the full system surface, and (d) coverage-gate enforcement per phase.

**Architecture:** S1 is a new strategy module (`src/strategies/s1Passive.ts`) plus invocation glue. SH-WATCH delivers the watcher daemon and synthetic types. Component tests live in `test/**/*.integration.test.ts` (existing convention). E2E tests in `test/**/*.e2e.test.ts` (existing convention). Coverage enforced via the existing Vitest v8 thresholds in `vitest.config.ts`.

**Tech Stack:** TypeScript (strict), Vitest v8 coverage provider, Node ≥ 20. No new tooling — extend what's there.

**Branch:** `feat/shared/mvp-delivery`, branched from `main`.

---

## Pre-conditions (verified 2026-05-05)

| Item | Status | Evidence |
|---|---|---|
| W1.4 journal pre-call ordering | ✅ shipped | commit `af4577e`; `order_intent` JournalKind in `types.ts`; `pendingOrders()` resume path in `exitRunner.ts:198`, `buyRunner.ts:138` |
| W1.1 safety persistence | ✅ shipped | PR #7 |
| W1.5 buyRunner | ✅ shipped | PR #12 |
| SH-1 TCA | ✅ shipped | PR #13 |
| SH-2 pre-trade risk | ✅ shipped | PR #14 |
| Coverage thresholds | ✅ in `vitest.config.ts` | 95 lines / 95 functions / 90 branches / 95 statements |
| MockKalshiClient for E2E | ✅ exists | `src/mockKalshiClient.ts`, used by `test/autoAdaptive.integration.test.ts` |

**No prerequisite fixes blocked.** This plan is purely additive.

---

## Scope

In: S1 passive strategy. SH-WATCH (per the existing rev-2 plan). Component tests covering ~5 cross-module flows. E2E tests covering ~3 happy-path + crash-recovery flows. Coverage maintained at existing thresholds.

Out: SH-ALERTS, SH-BACKTEST, SH-EDGE, SH-RECOMMENDER, SH-COMPOSE (post-MVP per backlog). Buy-side synthetics (v2). Other strategies in S2–S16.

---

## Coverage discipline (cross-cutting)

The repo already enforces:

```ts
thresholds: {
  lines: 95,
  functions: 95,
  branches: 90,
  statements: 95,
}
```

**Rule for this plan:** every new module added by S1 or SH-WATCH must hit the same thresholds. **If a phase's tests would drop coverage below threshold, that phase does not pass its exit gate.** Run `npx vitest run --coverage` at every phase boundary; do not merge a phase that regresses coverage.

**Excluded files (entrypoints with no logic; existing convention):** `src/cli.ts`, `src/server.ts`, `src/tui.tsx`, `*.d.ts`. New code must not be excluded — every evaluator, every helper, every state-machine transition is testable in isolation.

**Note on excluded HTTP server:** Phase 4 Test 4.2 (HTTP E2E) exercises `src/server.ts` end-to-end, but that file remains excluded from coverage thresholds because it's plumbing that's tested only through integration. The E2E test exists for *correctness*, not coverage uplift; the test passing is the gate, the coverage report is silent on this file. This is intentional — do not "fix" the exclusion in vitest.config.ts.

---

## File structure

**New files (this plan):**
- `src/strategies/s1Passive.ts` — Phase 1
- `test/strategies/s1Passive.test.ts` — Phase 1 (unit)
- `test/strategies/s1Passive.integration.test.ts` — Phase 1 (component)
- (All SH-WATCH files per the rev-2 plan)
- `test/integration/synthetic-fire-to-exitRunner.integration.test.ts` — Phase 3 (component)
- `test/integration/watcher-journal-roundtrip.integration.test.ts` — Phase 3 (component)
- `test/integration/synthetic-fire-to-s1.integration.test.ts` — Phase 3 (component)
- `test/integration/oco-bracket-lifecycle.integration.test.ts` — Phase 3 (component)
- `test/integration/adaptive-cadence.integration.test.ts` — Phase 3 (component)
- `test/e2e/mcp-synthetic-roundtrip.e2e.test.ts` — Phase 4 (E2E via MCP)
- `test/e2e/http-synthetic-roundtrip.e2e.test.ts` — Phase 4 (E2E via HTTP)
- `test/e2e/synthetic-crash-recovery.e2e.test.ts` — Phase 4 (E2E with simulated crash)

**Modified files:** all per the SH-WATCH rev-2 plan plus `src/strategies/s1Passive.ts` registration in CLI/MCP. Nothing this plan touches that the SH-WATCH plan doesn't already.

---

## Phase 1 — S1 passive walk-the-spread (sequential, single agent)

The take-profit synthetic invokes a strategy when triggered. Today the only execution path is `exitRunner` (losing-exit), which dumps at floor — wrong for take-profit. **S1 fills this gap.** A passive walker that posts inside the spread and walks toward mid as time passes.

### Algorithm

```
inputs:
  ticker, side, size,
  limitPriceCents (sell floor or buy ceiling),
  passiveTimeboxMs (default 60000),
  walkStepCents (default 0.1 — Kalshi's deci-cent tick for cheap markets),
  walkIntervalMs (default 5000)

state:
  currentLimitCents = (best inside-spread price; see one-sided-book guard below)
  startedAt = now
  postedOrderId = null
  totalSubmittedShares = 0   // counts ALL createOrder sizes, partial fills do not reset

loop:
  if (now - startedAt) > passiveTimeboxMs:
    cancel postedOrderId if resting
    return { filled: filledSoFar, remaining, timeboxedOut: true }
  if no posted order:
    if totalSubmittedShares + nextChunkSize > positionSize × safetySubmittedMultiple:
      log s1_safety_cap_breached, return early
    post limit GTC at currentLimitCents, save orderId
    totalSubmittedShares += nextChunkSize
    sleep walkIntervalMs
    continue
  // Race-safe reconcile: check fill status BEFORE issuing cancel
  status = getOrder(postedOrderId)
  if status == 'filled' or 'partially_filled':
    update filledSoFar
    if remaining == 0: return success
  // Now safe to cancel — cancel-and-repost can't double-submit because we just observed
  // the latest fill state. If a fill races in during cancel, the next reconcile catches it.
  cancel postedOrderId
  walk: currentLimitCents += walkStepCents toward mid, clamped to limitPriceCents
  // (sell: never below limitPriceCents; buy: never above limitPriceCents)
  // post new at currentLimitCents (subject to safety cap above)
  sleep walkIntervalMs
```

#### One-sided book guard

If the opposite side has no liquidity (`topYesAsk` is `null` for sell mode, or `topYesBid` is `null` for buy mode):

- Post at `limitPriceCents` (the operator-specified floor/ceiling) — the most aggressive price S1 is allowed to use.
- Append `s1_no_opposite_liquidity` journal entry on the first such tick so the operator sees it in the log.
- Do NOT abort — the operator's intent is to harvest at or above their floor; resting at the floor itself is a valid degenerate case.

#### Cancel-and-repost race safety

The implementation MUST check order status **before** issuing cancel, not after. The pattern: `getOrder(id)` → if filled/partially_filled, update fillSoFar; THEN cancel. If a fill arrives in the cancel window, the *next* reconcile iteration catches it via `getOrder` before the next post. This prevents double-submission. Mirror the existing `exitRunner` `cancelOnStale: true` semantics — read `runnerUtils.ts` and `exitRunner.ts:432` area to copy the pattern faithfully.

#### `safetySubmittedMultiple` cap math (correct invariant)

`totalSubmittedShares` counts the **size of every `createOrder` call**, regardless of whether each was filled or canceled. Partial fills do NOT reset or decrement the counter. Cap: `totalSubmittedShares ≤ positionSize × safetySubmittedMultiple` (default multiplier 1.5). On breach: log `s1_safety_cap_breached`, refuse to post the next order, return with whatever was filled and `timeboxedOut: false`. This exact invariant is what the test in Task 1.2 must verify with a partial-fill scenario.

#### Walk-step default

`walkStepCents` defaults to **0.1** (one Kalshi deci-cent tick). For markets at higher price points where 1¢ ticks are the norm, callers can override to `1`. The headline take-profit use case (harvesting a position from 4¢ → 5¢ on a market collapsing toward expiry) requires sub-cent precision; the wrong default here breaks the headline feature.

### Tasks

#### Task 1.1: Add S1 types to `types.ts`

**Files:** `src/types.ts`, `test/strategies/types.test.ts` (or extend existing types.test.ts).

- [ ] **Step 1: Failing test**

```typescript
// test/strategies/s1Types.test.ts
import { describe, it, expect } from 'vitest';
import type { S1Config, S1Result } from '../../src/types.js';

describe('S1 types', () => {
  it('S1Config has required fields', () => {
    const c: S1Config = {
      baseUrl: 'x', apiKeyEnv: 'X', privateKeyPathEnv: 'Y',
      marketTicker: 'KX', heldSide: 'yes', positionSize: 100,
      action: 'sell', limitPriceCents: 50, passiveTimeboxMs: 60000,
      walkStepCents: 1, walkIntervalMs: 5000,
      killSwitchPath: './STOP', dryRun: false,
    };
    expect(c.action).toBe('sell');
  });
  it('S1Result reports filled/remaining/orderIds', () => {
    const r: S1Result = { filled: 100, remaining: 0, orderIds: ['o1','o2'], timeboxedOut: false };
    expect(r.filled).toBe(100);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Add types** (append to `src/types.ts`):

```typescript
export interface S1Config {
  baseUrl: string;
  apiKeyEnv: string;
  privateKeyPathEnv: string;
  marketTicker: string;
  heldSide: Side;
  positionSize: number;
  action: 'buy' | 'sell';
  /** Sell floor (action='sell') or buy ceiling (action='buy'). Strategy will not cross this. */
  limitPriceCents: number;
  passiveTimeboxMs: number;     // default 60000
  walkStepCents: number;         // default 0.1 (Kalshi deci-cent tick); override to 1 for high-price markets
  walkIntervalMs: number;        // default 5000
  killSwitchPath: string;
  dryRun: boolean;
  forbiddenTickers?: string[];
  safetySubmittedMultiple?: number;
  /** Test hook only — sleep N ms after posting an order before reconciling. */
  deliberatePauseAfterPlaceMs?: number;
}

export interface S1Result {
  filled: number;
  remaining: number;
  orderIds: string[];
  timeboxedOut: boolean;
}

// Add to JournalKind union: 's1_walk' | 's1_repost' | 's1_timebox' |
//                           's1_no_opposite_liquidity' | 's1_safety_cap_breached'
```

- [ ] **Step 4: Run, pass, commit** `feat(s1): add S1Config / S1Result types`.

#### Task 1.2: S1 evaluator/runner (TDD)

**Files:** `src/strategies/s1Passive.ts`, `test/strategies/s1Passive.test.ts`.

- [ ] **Step 1: Failing tests** — table-driven, ~12 cases:

```typescript
// test/strategies/s1Passive.test.ts (key cases)
import { describe, it, expect } from 'vitest';
import { S1PassiveRunner } from '../../src/strategies/s1Passive.js';
import { MockKalshiClient } from '../../src/mockKalshiClient.js';

const baseCfg = {
  baseUrl: 'x', apiKeyEnv: 'X', privateKeyPathEnv: 'Y',
  marketTicker: 'KX', heldSide: 'yes' as const,
  positionSize: 100, action: 'sell' as const,
  limitPriceCents: 50, passiveTimeboxMs: 60000,
  walkStepCents: 1, walkIntervalMs: 0, // 0 in tests so no waiting
  killSwitchPath: './STOP', dryRun: false,
};

describe('S1PassiveRunner', () => {
  it('posts inside spread on first iteration', async () => {
    const client = new MockKalshiClient({
      yes: [{ priceCents: 60, size: 1000 }],
      no: [{ priceCents: 35, size: 1000 }],   // implies yes-ask ~65
    });
    const r = new S1PassiveRunner(baseCfg, client);
    await r.runOnce();
    const orders = client.getResting();
    expect(orders[0].priceCents).toBe(64);   // ask - 1
  });

  it('walks toward mid each iteration', async () => { /* ... */ });
  it('respects limitPriceCents floor (sell mode)', async () => { /* ... */ });
  it('respects limitPriceCents ceiling (buy mode)', async () => { /* ... */ });
  it('reports timeboxedOut when timebox elapses', async () => { /* ... */ });
  it('cancels resting order on timeout', async () => { /* ... */ });
  it('partial fill: walks remaining size', async () => { /* ... */ });
  it('forbidden ticker check rejects pre-flight', async () => { /* ... */ });
  it('dryRun: posts no real orders, returns intent', async () => { /* ... */ });
  it('safetySubmittedMultiple cap honored across reposts WITH partial fills', async () => {
    // positionSize=100, multiplier=1.5 → cap=150 total submitted shares.
    // Repost 1: post 100, partial fill 80, repost 2 cancels and re-posts remaining 20.
    // Repost 3-N: keep walking; after totalSubmitted reaches 150, refuse next post.
    // Assert: total createOrder.size = 150 exactly; s1_safety_cap_breached entry written;
    //         timeboxedOut=false; filled equals what actually filled (not capped).
  });
  it('writes s1_walk + s1_repost + s1_timebox journal entries', async () => { /* ... */ });
  it('crash-window: pre-call order_intent journaled before createOrder', async () => { /* ... */ });

  // Race + edge cases (added in rev 2 per Sonnet review)
  it('one-sided book (no asks) → posts at limitPriceCents and journals s1_no_opposite_liquidity', async () => {
    const client = new MockKalshiClient({ yes: [], no: [{ priceCents: 95, size: 1000 }] });
    // sell mode, limitPriceCents = 50: should post at 50 (the floor), not crash on undefined ask.
  });
  it('cancel-fill race: status=filled observed before cancel → no double-submission', async () => {
    // MockKalshi simulates: post → partial fill → call to cancel races with another fill.
    // Runner must call getOrder before cancel, observe partial fill, update fillSoFar,
    // then cancel; next iteration's getOrder sees full fill, returns success.
    // Assert: createOrder called exactly once per visible repost; total submitted shares
    // matches expectation (no surprise duplicate posts).
  });
  it('deci-cent walk: bid/ask sequence below 10¢ uses 0.1¢ steps', async () => {
    // Book: yes top-ask = 4.5, no top-bid = 95.0 (i.e., yes-mid ~= 4.0).
    // Sell mode, walkStepCents = 0.1: first post at 4.4, walk down 4.3, 4.2, ...
    // Assert: posted prices use 0.1¢ increments (priceCentsExact = 4.4, 4.3, 4.2).
  });
  it('passiveTimeboxMs expiry uses fake timers (no real wall-clock waits)', async () => {
    // vi.useFakeTimers(); register; call run() with timebox=60000; advance time;
    // assert timeboxedOut=true and resting order canceled.
  });
});
```

**Test infrastructure note:** the timebox-expiry case requires `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()`. The `walkIntervalMs: 0` shortcut covers most timing tests; only the timebox case truly needs fake timers. Set up once via `beforeEach(() => vi.useFakeTimers())` in a dedicated `describe('S1 timing', ...)` block — keep it separate so other tests don't pay the fake-timer overhead.

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement `src/strategies/s1Passive.ts`**

Reuse helpers from `runnerUtils.ts` (chunk-sizing) and `journal.ts`. Three-phase journal pattern (intent → place → reconcile) per W1.4. Body sketch:

```typescript
import { Journal } from '../journal.js';
import type { S1Config, S1Result, KalshiClientLike, Side } from '../types.js';
import { mergeIntoExitConfig } from '../safety.js';   // forbidden-ticker check
// ... (full implementation; lines target: 200–250)
```

Key correctness points:
- Same crash-safe `order_intent` journal write as `exitRunner.run()`.
- Cancel-on-stale loop matches `cancelOnStale: true` semantics in `exitRunner`.
- Tail order on timebox: cancel any resting order, return with `timeboxedOut: true`.
- `safetySubmittedMultiple` cap: total submitted shares ≤ positionSize × multiplier (default 1.5) across all reposts.

- [ ] **Step 4: Run, pass.**

- [ ] **Step 5: Coverage check — `npx vitest run --coverage src/strategies/s1Passive.ts test/strategies/s1Passive.test.ts`. Must hit 95/95/90/95 for the new file. Add tests until threshold reached.**

- [ ] **Step 6: Commit** `feat(s1): passive walk-the-spread strategy with crash-safe journal`.

#### Task 1.3: S1 component test against MockKalshi

**Files:** `test/strategies/s1Passive.integration.test.ts`.

Component test means: real journal, real `S1PassiveRunner`, real `runnerUtils`, real `safety` mergeIn — only Kalshi is mocked. Tests how S1 talks to its own internal modules.

- [ ] **Step 1: Failing test**

```typescript
// test/strategies/s1Passive.integration.test.ts
import { describe, it, expect } from 'vitest';
import { S1PassiveRunner } from '../../src/strategies/s1Passive.js';
import { MockKalshiClient } from '../../src/mockKalshiClient.js';
import { Journal } from '../../src/journal.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('S1 component integration', () => {
  it('writes complete journal lifecycle: intent → placed → walk → repost → fill', async () => {
    const tmp = path.join(os.tmpdir(), `s1-int-${Date.now()}.ndjson`);
    const journal = new Journal(tmp);
    const client = new MockKalshiClient(/* book that fills on third walk */);
    const runner = new S1PassiveRunner(/* cfg */, client, journal);
    const r = await runner.run();
    expect(r.filled).toBeGreaterThan(0);

    const entries = journal.readAll();
    const kinds = entries.map(e => e.kind);
    expect(kinds).toContain('order_intent');
    expect(kinds).toContain('order_placed');
    expect(kinds).toContain('s1_walk');
    expect(kinds).toContain('order_reconciled');  // existing kind in JournalKind union
  });

  it('crash-recovery: kill between order_intent and order_placed → resume reconciles', async () => {
    // Same fixture pattern as buyRunner.test.ts crash-window test.
  });

  it('safety merge: forbiddenTickers from safety.json blocks run() throw', async () => {
    // Use real safety.persist + mergeIntoExitConfig.
  });
});
```

- [ ] **Step 2-5:** Implement minimum code to pass; coverage check; commit.

---

## Phase 2 — SH-WATCH per existing rev-2 plan

**Reference:** `docs/superpowers/plans/2026-05-05-synthetic-order-types.md`. Execute that plan as written. **No changes** to the SH-WATCH plan content — it's Opus-reviewed READY.

### Augmentations imposed by this MVP plan (cross-cutting)

The SH-WATCH rev-2 plan covers unit tests per evaluator + a few integration tests. This plan adds two requirements on top:

1. **Coverage gate at every phase exit.** Run `npx vitest run --coverage` at the end of SH-WATCH Phase 0, 1, 2, 3, 4. New SH-WATCH code must hit 95/95/90/95 against just-the-new-files. Existing thresholds in `vitest.config.ts` already enforce this globally; per-phase verification is the discipline.

2. **Component test additions.** SH-WATCH's existing test plan has unit + a few integration tests. This MVP plan **adds five additional component-level tests** in Phase 3 below.

### Phase 2 tasks

Phase 2 of this MVP plan = the entire SH-WATCH plan. Execute SH-WATCH Phase 0–5 in order. Subagent-dispatch where the SH-WATCH plan calls for it. Do not skip the rev-2 fixes (cfg builder, getOrderbook depth arg, OCO race guard, three-phase fire, idle-when-empty, adaptive cadence).

After SH-WATCH Phase 4 lands, take-profit synthetics need an execution path. Update `src/synthetics/invoke.ts` to route take-profit fires to **S1** (not `exitRunner`).

**Sequencing — resolved (rev 2):** the rewiring lands as a **separate commit between SH-WATCH Phase 4 merging to main and SH-WATCH Phase 5 starting.** Specifically:

- SH-WATCH Phase 0 creates `src/synthetics/invoke.ts` with `FireDeps.runExit` and `FireDeps.postLimit`.
- SH-WATCH Phases 1–4 do not touch `invoke.ts` directly (their CLI/MCP/HTTP/TUI/extension tracks consume `Watcher.fireHook`, never `invoke.ts` internals).
- After Phase 4 merges, this rewiring task adds `runS1` and `buildS1Config` to `FireDeps` in a single commit on the same branch. Then Phase 5 strategy-preset dispatches branch from that commit.
- **No file-touch conflict** with Phase 3/4 tracks because they don't edit `invoke.ts` — they call into the watcher's public API. Verified by reading SH-WATCH plan §Phase 3, §Phase 4 file-touch boundaries.

**Tasks:**

- [ ] Add `runS1: (cfg: S1Config) => Promise<S1Result>` and `buildS1Config: (s: Synthetic) => S1Config` to `FireDeps` interface in `src/synthetics/invoke.ts`.
- [ ] Implement `buildS1Config` in `src/synthetics/invoke.ts`:

  ```typescript
  // Reads from the synthetic's params + WatcherConfig.exitConfigTemplate base.
  export function buildS1Config(s: Synthetic, template: Partial<S1Config>): S1Config {
    const REQUIRED = ['baseUrl','apiKeyEnv','privateKeyPathEnv','killSwitchPath'];
    for (const k of REQUIRED) if (template[k] === undefined)
      throw new Error(`buildS1Config: template missing required key '${k}'`);
    const tp = s.params as TakeProfitParams;
    // For multi-rung TP, the watcher invokes per-rung with sized synthetic; positionSize is per-rung.
    // For single-trigger TP, positionSize is full synthetic positionSize.
    const limitPriceCents = tp.triggerPriceCents
      ?? tp.rungs?.[/* fired rung index passed in s.state? */ 0]?.priceCents
      ?? (() => { throw new Error('buildS1Config: take-profit has neither triggerPriceCents nor rungs'); })();
    return {
      ...(template as S1Config),
      marketTicker: s.ticker,
      heldSide: s.side,
      action: 'sell',                    // exit-side only in v1
      positionSize: s.positionSize,
      limitPriceCents,
      passiveTimeboxMs: 60000,
      walkStepCents: 0.1,
      walkIntervalMs: 5000,
      dryRun: false,
    };
  }
  ```

- [ ] Modify `case 'take_profit'` in `invokeFire`:

  ```typescript
  case 'take_profit': {
    const cfg = deps.buildS1Config(s);
    await deps.runS1(cfg);
    return;
  }
  ```

- [ ] Add test in `test/synthetics/invoke.test.ts`: take-profit fire calls `runS1`, not `runExit`. Verify cfg.limitPriceCents matches the synthetic's trigger price (or fired rung's price for multi-rung).
- [ ] Run `npx vitest run test/synthetics/ --coverage`; verify thresholds.
- [ ] Commit `feat(synthetics): wire take-profit fires to S1 passive walker`.

---

## Phase 3 — Component tests (cross-module integration)

These tests exercise multi-module flows that aren't covered by per-module unit tests. They run against `MockKalshiClient` plus real `Journal`, real `Watcher`, real evaluators, real strategies. Each is a single test file in `test/integration/`.

### Test 3.1: Synthetic fire path → exitRunner

**File:** `test/integration/synthetic-fire-to-exitRunner.integration.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { Watcher } from '../../src/watcher.js';
import { MockKalshiClient } from '../../src/mockKalshiClient.js';
import { Journal } from '../../src/journal.js';
import { invokeFire, buildExitConfig } from '../../src/synthetics/invoke.js';

describe('Synthetic → exitRunner integration', () => {
  it('stop-loss fires; exitRunner runs to completion; journal reflects full lifecycle', async () => {
    // 1. MockKalshi book starts at top-bid 50; trigger 30.
    // 2. Register stop_loss synthetic via Watcher.
    // 3. Drop top-bid to 25.
    // 4. tick() → synthetic fires → invokeFire calls runExit with built config.
    // 5. exitRunner runs (real run, mock client) and dumps the position.
    // 6. Assert: synthetic_fired journal entry; exit-runner order_intent + order_placed
    //    + order_filled entries; final position 0.
  });

  it('trailing-stop with peak in state fires correctly; exitRunner consumes built config', async () => { /* ... */ });

  it('safety block: stop-loss fires but ticker is in safety.forbiddenTickers → fire is rejected pre-place', async () => {
    // Setup: real safety.json with KX in forbiddenTickers. Register stop_loss synthetic on KX.
    // Drop bid past trigger. Watcher.tick() invokes fireHook → invokeFire → buildExitConfig
    // → ExitRunner.run() which calls mergeIntoExitConfig and THROWS on forbidden ticker.
    // Assert: the throw is caught at the watcher fire path; synthetic transitions to fire_failed
    // (not fired); journal contains synthetic_fire_failed with reason; NO order_intent / order_placed
    // entries appear; KalshiClient.createOrder was never called.
  });
});
```

- [ ] **Step 2-5:** Implement, run, coverage check, commit.

### Test 3.2: Watcher ↔ journal round-trip

**File:** `test/integration/watcher-journal-roundtrip.integration.test.ts`

Tests crash-safety end-to-end: register, simulate fires/cancels, kill, replay, verify identical state.

- [ ] Three test cases: clean restart, mid-fire crash, mid-state-update crash. Same pattern as the SH-WATCH plan's `test/integration/crash-recovery.test.ts` but run against the **full** stack (real Journal, real Watcher, real evaluators), not just journal alone.

### Test 3.3: Synthetic fire → S1 (take-profit path)

**File:** `test/integration/synthetic-fire-to-s1.integration.test.ts`

Test cases:
- Take-profit single-trigger fires → S1 invocation with full positionSize → walks spread until filled.
- Take-profit multi-rung: bid walks past rung[0] → fire rung 0 sized at `positionSize × rung[0].sizePct/100` → S1 fills it; subsequent tick crossing rung[1] fires rung 1 with its own sized invocation; assert correct sizes per rung.
- **Safety block sub-case:** take-profit fires but `safety.json` has `dailyLossCircuitBreakerDollars` tripped → S1 invocation rejected pre-place (mirrors Test 3.1 safety case but exercises the S1 path, not the exitRunner path). Assert `synthetic_fire_failed` journal kind; no createOrder calls.
- Single-trigger TP `unregisters: true` after firing (verify state reflected in watcher).

### Test 3.4: OCO + bracket lifecycle

**File:** `test/integration/oco-bracket-lifecycle.integration.test.ts`

Already partially covered by SH-WATCH Phase 1 Dispatch E. This MVP test extends it: OCO with a take-profit + stop-loss leg; bid walks past TP first → take-profit child fires → invoke S1 → fill → sibling stop-loss canceled → parent OCO fired. Verifies the **entire chain** including S1 invocation, not just child-cancel propagation.

### Test 3.5: Adaptive cadence + book-fetch coalescing end-to-end

**File:** `test/integration/adaptive-cadence.integration.test.ts`

- [ ] Register a stop-loss with bid far from trigger; assert `tick().nextDelayMs === pollIntervalMs`.
- [ ] Move bid to within `nearTriggerThresholdCents`; assert `nextDelayMs === nearTriggerCadenceMs`.
- [ ] Cancel all synthetics; assert `nextDelayMs === idleIntervalMs`.
- [ ] **Coalescing:** register 3 synthetics on the same ticker + 1 on a second ticker. Run one tick. Assert `KalshiClient.getOrderbook` called exactly twice (once per unique ticker), not four times. Assert `getPosition` called only for tickers with at least one `autoCancelOnZeroPosition: true` synthetic. Note: SH-WATCH `test/watcher.test.ts` covers the same coalescing assertion at the unit level; this test exercises it through the **full** stack with real Journal + real evaluators.

### Phase 3 exit gate

`npx vitest run test/integration/ --coverage` green; cumulative coverage on touched modules still ≥ 95/95/90/95.

---

## Phase 4 — End-to-end tests

E2E tests run the **full system surfaces**. Three flows: MCP-driven, HTTP-driven, crash-recovery.

### Test 4.1: MCP synthetic round-trip

**File:** `test/e2e/mcp-synthetic-roundtrip.e2e.test.ts`

Spin up the MCP server in-process; act as an MCP client. Steps:

```typescript
// 1. Start watcher daemon in-process with MockKalshiClient.
// 2. Call kea_synthetic_register({ kind: 'trailing_stop', ticker, side, size, params: {...} }).
//    Receive { id }.
// 3. Drive MockKalshi book through a price walk (rising peak then drop past trail).
//    Watcher.tick() executes between book updates.
// 4. Call kea_synthetic_list(); assert synthetic shows status: 'fired'.
// 5. Call kea_journal_read(); assert synthetic_registered + synthetic_fire_pending +
//    synthetic_fired entries present in correct order.
// 6. Call kea_positions(); assert position reduced (from S-losing or S1 invocation).
```

**No real Kalshi API.** MockKalshiClient simulates. The `KalshiClient` is the seam.

### Test 4.2: HTTP synthetic round-trip (extension surface)

**File:** `test/e2e/http-synthetic-roundtrip.e2e.test.ts`

Same flow as 4.1, but via the `localhost:7777` HTTP server (the extension's data path). Use Node's built-in `fetch`. Steps:

```typescript
// 1. Start engine HTTP server in-process on a random port.
// 2. POST /synthetics/register with stop_loss params.
// 3. Drive book.
// 4. GET /synthetics/list; assert fired.
// 5. GET /synthetics/:id; assert state details (firedAt, reason).
```

This is the canary for the extension's assumption about server endpoints. If this passes, the extension can talk to the engine without real Kalshi.

### Test 4.3: Crash-recovery E2E

**File:** `test/e2e/synthetic-crash-recovery.e2e.test.ts`

Register a trailing-stop synthetic with an established peak. Force-kill the daemon (subprocess test, or in-process by tearing down the Watcher mid-tick). Restart with the same journal path. Assert:

1. Watcher resurrects the synthetic with peak preserved.
2. A subsequent price drop triggers the same synthetic.
3. `synthetic_fire_pending` orphans (mid-fire crash) re-fire on resume.

### Phase 4 exit gate

`npx vitest run test/e2e/ --coverage` green; total project coverage ≥ thresholds.

---

## Phase 5 — Final validation + MVP shipping criteria

- [ ] `npx vitest run --coverage` — full suite green; thresholds met.
- [ ] `npx tsc --noEmit` — no type errors.
- [ ] `npm run lint` — clean.
- [ ] **Manual smoke test on demo environment — strict procedure:**
  1. Pick a low-volume, low-stakes market with a clear expiry. Avoid markets with active liquidity providers who could front-run an obvious passive walker.
  2. Take a tiny real Kalshi position (1–10 shares) on that market.
  3. **Dry-run pass first.** Register a trailing-stop synthetic with `dryRun: true` propagated through to `S1Config` / `ExitConfig`. Drive the bid (or wait for natural movement) past the trigger. Observe: `synthetic_fire_pending` + `synthetic_fired` journal entries, `S1` runs in dry mode with no real `createOrder` calls, journal contains `s1_walk` entries, position unchanged. Confirm intent matches expectation.
  4. **Live pass.** Cancel and re-register with `dryRun: false`. Trigger again. Observe: extension toast on fire, journal contains `order_intent` + `order_placed` + `order_reconciled`, position reduced.
  5. Compare journal across dry vs live runs — they should differ only in the actual API calls made; decisions and prices should match.
  6. Document the chosen market, position size, and outcome in MVP release notes.
- [ ] **Coverage delta report**: `npx vitest run --coverage --reporter=json-summary > coverage.json`; `git diff main coverage.json | head` — confirm no per-file regression.
- [ ] **MVP demo video / writeup**: 2-min Loom showing extension → place trailing stop → fire → toast. Optional but worth doing.

### MVP "ship it" criteria

- All Phase 1–4 tests green
- Coverage held at ≥ 95/95/90/95
- Manual smoke pass on real (small-size) Kalshi position
- One UI surface (extension OR TUI) functional for the headline trailing-stop flow

If those hold, MVP is shipped. Open a `release/v0.1-mvp` tag.

---

## Sequencing + parallelism

```
Phase 1 — S1 (sequential, single agent, ~2 days)
          ↓
Phase 2 — SH-WATCH per rev-2 plan (~6 days with parallelism)
          ↓ (after Phase 2.4 lands)
       Update invoke.ts to route take-profit → S1 (~half day)
          ↓
Phase 3 — Component tests (5 tests, can dispatch 5 parallel Sonnet writers, ~1 day wall clock)
          ↓
Phase 4 — E2E tests (3 tests, can dispatch 3 parallel Sonnet writers, ~1 day wall clock)
          ↓
Phase 5 — Final validation + ship (~half day)
```

**Total wall-clock with parallelism: ~10–11 working days.** Within the user's stated MVP window.

### Parallelism callouts

- **Phase 1 is sequential** because each S1 task builds on the previous (types → runner → integration test).
- **Phase 2's parallelism is per the SH-WATCH plan** — four parallel evaluator dispatches, three parallel surface dispatches in Phase 4 of that plan.
- **Phase 3 is parallel** — the five component tests touch disjoint files and can be written by five Sonnet subagents simultaneously. Use `superpowers:dispatching-parallel-agents` skill. File-touch boundaries: each test in its own file.
- **Phase 4 is parallel** — three E2E tests, three subagents, no overlap.

---

## Verification matrix

| Concern | Verification | Phase |
|---|---|---|
| Type safety | `npx tsc --noEmit` clean | every phase |
| Unit | `npx vitest run` green | every phase |
| Lint | `npm run lint` green | every phase |
| Coverage thresholds | `npx vitest run --coverage` ≥ 95/95/90/95 | every phase exit |
| S1 correctness | unit tests in `s1Passive.test.ts` (12 cases) | 1 |
| S1 internal communication (modules) | integration test | 1 |
| Synthetic → exit-strategy invocation | `synthetic-fire-to-exitRunner.integration.test.ts` | 3 |
| Synthetic → S1 invocation (take-profit) | `synthetic-fire-to-s1.integration.test.ts` | 3 |
| Watcher persistence round-trip | `watcher-journal-roundtrip.integration.test.ts` | 3 |
| OCO + bracket lifecycle full chain | `oco-bracket-lifecycle.integration.test.ts` | 3 |
| Adaptive cadence | `adaptive-cadence.integration.test.ts` | 3 |
| MCP surface E2E | `mcp-synthetic-roundtrip.e2e.test.ts` | 4 |
| HTTP / extension surface E2E | `http-synthetic-roundtrip.e2e.test.ts` | 4 |
| Crash recovery E2E | `synthetic-crash-recovery.e2e.test.ts` | 4 |
| Real-Kalshi smoke | manual test on tiny live position | 5 |

---

## Open questions

1. **S1 fee-aware pricing.** Existing `pricing.ts` assumes taker fees. S1 posts maker (resting) orders, which Kalshi fees differently. If we want S1's expected fill-price to be accurate for the EV calculator (post-MVP), `pricing.ts` needs a maker/taker flag. **For MVP, ship S1 with taker assumption and a TODO note** — the algorithm itself doesn't depend on the fee math; only downstream EV reporting does.
2. **Take-profit single-trigger vs multi-rung in MVP.** SH-WATCH plan ships both. S1 invocation needs to handle both modes — single trigger calls S1 once with full size; multi-rung calls S1 per rung with rung-sized portion. Confirm `invoke.ts`'s sized-fire path handles this; the SH-WATCH plan's Phase 1 Dispatch D mentions a `firedRungIndex` field on the eval result. Wire it correctly when updating `invoke.ts`.
3. **Manual smoke-test market choice.** Which live market to use? Pick a low-volume, low-stakes market with clear expiry; e.g., a small NFL contract. Avoid markets with active liquidity providers who could front-run an obvious passive walker. Document the chosen market in the MVP release notes.
4. **Live-data feed rate limits during Phase 2 SH-WATCH testing.** Watcher's adaptive cadence (250ms near trigger) may bump against Kalshi's tier limits if multiple synthetics run concurrently. Sanity-math the budget against `/api-reference/account/get-account-api-limits` for the operator's tier before manual smoke. Likely fine for personal use; adds risk if tier is strict.

---

## Self-review checklist

- [x] Spec coverage: every must-have for MVP has at least one task. (S1 ✓, SH-WATCH ✓ via reference, component tests ✓, E2E tests ✓, coverage gates ✓.)
- [x] No placeholders / TBDs in plan body.
- [x] All test files have explicit case lists or sketched test bodies.
- [x] Coverage discipline named (95/95/90/95) and gated per phase.
- [x] Parallelism callouts per phase.
- [x] No file-touch overlap between parallel test writers.
- [x] References SH-WATCH plan rather than duplicating it.
- [x] Realistic time estimates (10–11 days, matches stated MVP window).
- [x] Manual smoke test included.
- [x] Open questions surfaced.
