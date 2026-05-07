# Engine Internals Cluster — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Drain the last engine-only stories. Ship W4.2 Almgren-Chriss optimal-execution scheduler (closed-form math for binaries' known terminal value) + S12 market-making (two-sided liquidity provision with inventory management). After this cluster: §S = 0, §W4 = 2 (W4.1 superseded + W4.4 multi-venue out of scope).

**Architecture:**
- **W4.2** is a pure math module. Single function `computeOptimalSchedule(opts)` returns `Array<{tStartMs, sliceSize, intervalMs}>`. Loop-based strategies opt in via a new `useOptimalSchedule?: boolean` flag (or pass the schedule explicitly). No state, no I/O.
- **S12** is a runner class that maintains two resting GTCs (bid + ask) and reposts on book moves; tracks inventory toward `targetInventory`; flips to aggressive flatten when inventory hits `maxInventory` on either side. Composes existing `KalshiClient.createOrder` / `cancelOrder` + `safety.ts` caps.
- **File-touch boundaries** strictly disjoint:
  - W4.2: `src/optimalSchedule.ts` + `test/optimalSchedule.test.ts`
  - S12: `src/marketMaking.ts` + `src/strategies/sMarketMake.ts` + `test/marketMaking.test.ts` + `test/strategies/sMarketMake.test.ts`
  - Phase C wiring touches `src/cli.ts` / `src/mcp.ts` / `src/server.ts` (sequenced after Phase B to avoid conflicts).

**Tech stack:** TypeScript + Vitest. Patterns:
- W4.2 follows `src/harvestPlanner.ts` — pure math + JSON shape contract.
- S12 follows `src/strategies/sRoll.ts` (multi-callback injection) + `src/strategies/sIceberg.ts` (poll-loop with repost on fill).
- Inventory accounting: simple `currentInventory: number` field updated from injected `getOrderStatus` callback (filled deltas).
- Anti-creep on S12: hard non-goals listed below; close any feature creep in PR review.

**Phase ordering:**
- **Phase A** (2-way parallel): W4.2 optimizer + S12 runner. File-disjoint.
- **Phase B** (single PR): wire `useOptimalSchedule` into one or two existing loop strategies (passive + scale-out as the primary consumers) + add `kea strategy s-market-make` + `kea_strategy_s_market_make` MCP tool + HTTP route. Same shape as prior wiring batches.
- **Phase C**: backlog sync. §S 1→0, §W4 3→2, shipped 48→50.

**Subagent dispatch conventions:** worktrees inside project root, node_modules symlink, heartbeat per `subagent-heartbeat`, explicit `--base main` on `gh pr create`.

---

## Phase A — Parallel implementations

### Task A.1: W4.2 Almgren-Chriss optimal schedule

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/optimalSchedule.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/optimalSchedule.test.ts`

**Background:** Almgren-Chriss minimizes `E[slippage] + λ × Var[remaining-value-at-expiry]`. For binary-options, the terminal value is known ($0 or $1), so the closed-form schedule is tractable. Output is a sequence of slices that gradually exit (or enter) over the time-to-expiry, sized to balance impact-cost vs holding-risk.

**Function signature:**

```typescript
export interface OptimalScheduleOpts {
  totalSize: number;                // contracts to execute
  totalDurationMs: number;          // time-to-expiry in ms
  numIntervals: number;             // schedule granularity (e.g. 12 for hourly over half-day)
  riskAversion: number;             // λ — higher = exit faster (front-loaded)
  bookImpactPerContract: number;    // expected slippage per contract (in cents); from TCA
  remainingValueVariance?: number;  // optional Var[terminal value]; defaults to p(1-p) when omitted
  side?: 'sell' | 'buy';            // default 'sell'
}

export interface ScheduleSlice {
  intervalIndex: number;            // 0-based
  tStartMs: number;                 // ms offset from schedule start
  intervalMs: number;
  sliceSize: number;                // integer contracts
}

export function computeOptimalSchedule(opts: OptimalScheduleOpts): {
  slices: ScheduleSlice[];
  rationale: string;                // human-readable explanation of the schedule shape
};
```

**Math (closed-form, simplified for binaries):**
- Trade rate `n_k` over interval k follows: `n_k ∝ sinh(κ × (T - t_k))` where `κ² = λ × σ² / η`, η = book impact, σ² = terminal variance.
- Discrete approximation: at each interval, slice = `totalSize × n_k / Σ n_k`, rounded to integers; remainder rolls into last slice.
- High `riskAversion` → front-loaded (most size in early intervals).
- `riskAversion = 0` → uniform schedule (TWAP-equivalent).

**Validation:** `totalSize > 0`; `numIntervals ≥ 2`; `totalDurationMs > 0`; `riskAversion ≥ 0`; `bookImpactPerContract > 0`.

**Tests (≥12):**
1. Validation: rejects `totalSize ≤ 0`, `numIntervals < 2`, etc.
2. `riskAversion = 0` produces uniform schedule (every slice equal, last absorbs remainder).
3. High `riskAversion` produces front-loaded schedule (slice 0 > slice N-1).
4. Integer slice sizes; sum equals `totalSize`.
5. Non-overlapping intervals: `slice[i+1].tStartMs === slice[i].tStartMs + slice[i].intervalMs`.
6. Total schedule duration matches `totalDurationMs` exactly (last interval absorbs remainder).
7. `remainingValueVariance` override changes shape (higher variance → flatter).
8. Side parameterization passes through (slices are size-only; side is for downstream consumer).
9. Single-slice case (numIntervals = 2 + tiny totalSize → degenerate but valid).
10. Output `rationale` is non-empty.
11. Pure function — repeated calls produce identical output for identical input.
12. No mutation of input opts.

**Verify + commit + PR.** Title: `feat(engine): W4.2 Almgren-Chriss optimal execution schedule`. Don't auto-merge.

### Task A.2: S12 market-making runner

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/marketMaking.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategies/sMarketMake.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/marketMaking.test.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategies/sMarketMake.test.ts`

**Background:** Two-sided market-making — post both bid + ask GTCs inside the spread, harvest fills, manage inventory toward target. When inventory hits `maxInventory` on either side, repost the *opposite* side aggressively to flatten back toward `targetInventory`.

**Inputs:** `{ ticker, targetInventory: number, maxInventory: number, quoteOffsetCents: number, pollIntervalMs?: number }`. `quoteOffsetCents` is how far inside the spread to post (e.g., 1 = post at top-bid+1 / top-ask-1).

**Behavior:**
- Maintain two resting GTCs: bid-side and ask-side.
- On each poll cycle (default 1000ms), fetch top-of-book; if either quote price is stale (book moved), cancel + repost at fresh prices.
- On each fill (detected via `getOrderStatus` injected callback), update `currentInventory` and journal `mm_fill` with side + qty.
- If `currentInventory ≥ maxInventory` (long): cancel bid-side; aggressively flatten until inventory ≤ targetInventory + tolerance. Conversely for short side.
- Once flattened, return to two-sided mode.
- `stop()` cancels both quotes cleanly.

**Hard non-goals (anti-scope-creep — DO NOT extend in v1):**
- No multi-venue routing.
- No tick-skewing based on inventory direction (advanced MM tactic — out).
- No dynamic `quoteOffsetCents` — operator sets it once.
- No PnL tracking inside the runner (use `kea_tca_summary` post-run).
- No "reservation prices" or Avellaneda-Stoikov adjustments.
- No order-book imbalance signals.

**Inject:** `postOrderInvoke`, `cancelOrderInvoke`, `getOrderStatusInvoke`, `getTopOfBookInvoke`, `aggressiveFlattenInvoke`, `sleepMs`, `now`. All testable via stubs.

**Validation:** `targetInventory ≥ 0`; `maxInventory > targetInventory`; `quoteOffsetCents ≥ 0`; ticker non-empty.

**Journal kinds (jk() cast):** `mm_started`, `mm_quote_posted`, `mm_quote_canceled`, `mm_fill`, `mm_inventory_capped`, `mm_flatten_started`, `mm_flatten_complete`, `mm_finished`.

**Pattern reference:**
- `src/strategies/sIceberg.ts` (poll-loop + post-and-monitor pattern)
- `src/strategies/sRoll.ts` (multi-callback injection)
- `src/aggressive.ts` (flatten phase composes this)

**Tests (≥15 across both test files):**
1. `buildSMarketMakeArgs` validation: rejects `maxInventory ≤ targetInventory`, negative `quoteOffsetCents`, etc.
2. Initial state posts both bid + ask quotes.
3. Book move triggers cancel + repost on stale side.
4. Fill detected → inventory updated + journaled.
5. `mm_fill` entries record side and qty.
6. Inventory hits maxInventory long → bid canceled + aggressive flatten triggers.
7. Inventory hits maxInventory short → ask canceled + aggressive flatten.
8. Flatten respects `targetInventory` (stops when reached, doesn't overshoot).
9. After flatten, returns to two-sided.
10. `stop()` cancels both quotes idempotently.
11. Stop mid-flatten cleanly halts.
12. Validation: ticker empty, etc.
13. `quoteOffsetCents = 0` posts at top of book (worst case).
14. Default `pollIntervalMs = 1000`.
15. Empty book on either side journals + halts (atomicity: don't post one-sided if book is one-sided).

**Verify + commit + PR.** Title: `feat(strategies): S12 market-making runner (two-sided GTC + inventory-capped flatten)`. Don't auto-merge.

---

## Phase B — Surface wiring (single PR after Phase A merges)

**Files:**
- Modify: `src/cli.ts` — add `kea strategy s-market-make` subcommand. (W4.2 does not need its own subcommand — it's a helper consumed by other strategies.)
- Modify: `src/mcp.ts` — add `kea_strategy_s_market_make` MCP tool + extend `kea_strategy_run` discriminated union.
- Modify: `src/server.ts` — add `POST /strategies/s-market-make` HTTP route.
- Modify: `src/strategies/registry.ts` — add `'s-market-make'` to the `StrategyId` enum + STRATEGY_REGISTRY entry with field descriptors (`targetInventory`, `maxInventory`, `quoteOffsetCents`). dangerLevel='medium' (multi-leg orchestration with inventory risk).
- Modify: `test/mcp.test.ts` — tool surface assertion (+1 name).
- Optionally: thread `useOptimalSchedule?: boolean` into one or two existing loop strategies (e.g., `sStealth.ts`'s loop pacing). Defer if it expands the diff too far — opt-in adoption can be a follow-up cluster.

**Pattern reference:** PRs #50, #59, #63, #70, #83 (prior wiring batches).

**Verify:** `npx tsc --noEmit && npx vitest run` all green.

**PR title:** `feat(surfaces): wire S12 market-making + add to strategy registry`.

---

## Phase C — Backlog sync

Promote 2 stories to §7:
- W4.2 Almgren-Chriss optimal execution schedule
- S12 market-making

Update §0: §S 1→0, §W4 3→2, shipped 48→50.

Replace removed §W4.2 / §S12 sections with `_<id> shipped — see §7._` stub pointers.

PR: `chore(backlog): sync — engine internals cluster shipped`. Auto-merge.

---

## Cost & ordering

| Phase | Tasks | Parallelism | Wall-clock |
|---|---|---|---|
| A — math + MM runner | A.1 + A.2 | 2-way parallel | ~3-4 days real / ~6 hours parallel |
| B — surface wiring | one PR | 1 Sonnet | ~6 hours |
| C — backlog sync | direct | — | ~10 min |

**Total: ~3-4 days with parallelism (faster if Phase A runs cleanly).**

## Verification matrix

| Concern | Verification | Phase |
|---|---|---|
| W4.2 riskAversion=0 produces uniform schedule | unit test | A.1 |
| W4.2 high riskAversion front-loads | unit test | A.1 |
| W4.2 sum(slices) === totalSize | unit test | A.1 |
| W4.2 pure function (no mutation) | unit test | A.1 |
| S12 inventory-cap triggers aggressive flatten | unit test | A.2 |
| S12 stop cancels both quotes idempotently | unit test | A.2 |
| S12 book-move triggers cancel+repost | unit test | A.2 |
| S12 empty-book halts gracefully | unit test | A.2 |
| S12 NOT extended with non-goal features | code review | A.2 |
| Strategy registry has +1 entry (s-market-make) | unit test | B |
| Tool surface assertion +1 name | test/mcp.test.ts | B |

## Open questions / explicit non-goals

1. **W4.2 integration into existing loop strategies** — defer to follow-up. Threading `useOptimalSchedule` through `sStealth.ts` etc. is opt-in adoption; this cluster ships the helper + S12, not the per-strategy uptake. Same pattern as W3.1 POV pacing helper.
2. **S12 advanced MM tactics** — explicitly OUT. See "Hard non-goals" in Task A.2. Reservation prices, dynamic skew, AS-style adjustments are v2.
3. **W4.4 multi-venue Smart Order Router** — out of scope. Week-long story, separate cluster.
4. **TUI strategy picker entry for S12** — Phase B touches the strategy registry, which the TUI consumes automatically. No new TUI code needed (registry-driven render).
5. **Extension picker entry for S12** — same registry-driven render via SP2.3.
6. **Almgren-Chriss UI surface** — defer. W4.2 is a math helper consumed by strategies; surfacing as `kea_optimal_schedule` MCP tool can be a follow-up if the agent wants to inspect schedules without running them.
