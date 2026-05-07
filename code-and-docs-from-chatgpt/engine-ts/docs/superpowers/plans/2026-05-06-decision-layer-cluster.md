# Decision Layer Cluster — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Now that the strategy library is effectively complete (12+ named strategies wired through MCP), give the agent the math + tooling to *decide which strategy to pick when*. Ship 3 stories: W4.3 portfolio liquidation sequencer, SH-ALERTS notify-only synthetics, SH-RECOMMENDER (3-module EV/Kelly/recommender stack). Drains §W4 from 4→3, §SH from 5→4.

**Architecture:**
- **W4.3** is a thin orchestrator over the existing S library — reads positions, computes per-position `markToBid − EV(hold)`, ranks, emits sequenced plan; optional `--auto-execute` chains via S10 cash-raise pattern. Mostly read-side; the execution path reuses sCashRaise's runner.
- **SH-ALERTS** rides SH-WATCH's evaluator infra. New `action: 'fire' | 'notify'` discriminator on synthetics; alerts fire `notify` actions which dispatch to delivery channels (webhook + desktop in v1; email/extension deferred).
- **SH-RECOMMENDER** is three stateless math modules extending `harvestPlanner.ts`:
  1. **EV calculator** — generic `computeDecisionEV(ctx)` for enter/hold/exit/scale-out/no-action.
  2. **Kelly sizer** — half-Kelly default with safety-cap respect.
  3. **Strategy recommender** — composes EV+sizer+(optional) SH-EDGE prior → top-3 ranked strategies with explicit params.
- File-touch boundaries strictly disjoint per task. Phase B agents run in parallel.

**Tech stack:** TypeScript + Vitest + Zod. Existing patterns:
- `src/strategies/sCashRaise.ts` — sequential N-position orchestrator (W4.3 reuses)
- `src/harvestPlanner.ts` — math + MCP-tool wrap shape (SH-RECOMMENDER extends)
- `src/watcher.ts` + `src/watcherJournal.ts` + `src/synthetics/index.ts` — evaluator infra (SH-ALERTS extends)
- `src/types.ts` — small additions to extend Synthetic with `action` discriminator (SH-ALERTS only)

**Phase ordering:**
- **Phase A** (helper / shared types, single small PR): extend `Synthetic` type with `action: 'fire' | 'notify'` discriminator + add `notifyChannels` field. Land first so SH-ALERTS branches off it cleanly.
- **Phase B** (3-way parallel): W4.3 + SH-ALERTS + SH-RECOMMENDER. File-disjoint.
- **Phase C** (single batch PR): surface wiring — `kea portfolio` subcommand, `kea alerts` CLI/MCP, `kea_recommend`/`kea_ev`/`kea_size` MCP tools.
- **Phase D** (chore PR): backlog sync.

**Subagent dispatch conventions:** same as clusters 1–3.

---

## Phase A — Synthetic action discriminator + notifyChannels type

### Task A.1: Extend Synthetic type with action discriminator

**Files:**
- Modify: `src/types.ts` — add `action?: 'fire' | 'notify'` (defaults to `'fire'` if omitted) + `notifyChannels?: NotifyChannelConfig[]` to the `Synthetic` interface. Define `NotifyChannelConfig = { kind: 'webhook' | 'desktop'; webhookUrl?: string; ... }`.
- Modify: `test/synthetics/*.test.ts` if compile-checks need updating (likely zero-diff — defaults make new fields backward-compatible).

**Background:** SH-ALERTS reuses SH-WATCH's evaluator but dispatches a different terminal action. Cleanest separation is at the Synthetic record level — `action: 'fire'` (existing behavior, places real orders) or `action: 'notify'` (delivers to channels, no order placed). Defaulting to `'fire'` preserves backward compatibility for every shipped synthetic.

- [ ] **Step 1: Add types to `src/types.ts`**

```typescript
export type SyntheticAction = 'fire' | 'notify';

export interface NotifyChannelConfig {
  kind: 'webhook' | 'desktop';
  webhookUrl?: string;        // required when kind='webhook'
  desktopTitle?: string;      // optional override; default "Kalshi alert"
}

// Extend existing Synthetic interface (additive, optional fields):
//   action?: SyntheticAction;       // defaults to 'fire' when undefined
//   notifyChannels?: NotifyChannelConfig[];  // required when action='notify'
```

- [ ] **Step 2: Run typecheck + full suite**

```bash
cd code-and-docs-from-chatgpt/engine-ts && npx tsc --noEmit && npx vitest run
```
Expected: clean tsc, full suite still green (pure additive changes).

- [ ] **Step 3: Commit + PR**

```
feat(types): add Synthetic.action + notifyChannels for SH-ALERTS

Backward-compatible additive change: action defaults to 'fire' when
undefined; notifyChannels required only when action='notify'.

Co-Authored-By: Claude <noreply@anthropic.com>
```

PR title: `feat(types): Synthetic.action discriminator + notifyChannels`. Auto-merge.

---

## Phase B — 3-way parallel implementation

After Phase A merges, dispatch all three agents in one message via `superpowers:subagent-driven-development`. Each owns disjoint files.

### Task B.1: W4.3 portfolio liquidation sequencer

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/portfolio.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/portfolio.test.ts`

**Spec:** Read positions, compute per-position `markToBid − EV(hold)`, rank descending (most-overvalued-to-hold first), emit sequenced exit plan. Each plan entry pairs a position with a recommended strategy name and inputs. Optional auto-execute hands off to `SCashRaiseRunner` (already shipped).

**Inputs to `buildPortfolioPlan(opts)`:**
```
{
  positions: PositionSnapshot[],         // from existing fetchPositions
  midProbabilities: Record<ticker, number>,  // agent-supplied; engine doesn't compute
  bidByTicker: Record<ticker, number>,   // current top bid (cents)
  feesByTicker?: Record<ticker, number>, // optional per-ticker fee est for net calc
  defaultStrategy?: 'aggressive' | 'passive',  // default 'passive'
}
```

**Output:**
```
PortfolioPlan = {
  ranked: Array<{
    ticker, side, size,
    markToBidDollars,
    evHoldDollars,
    overvaluedDollars,         // markToBid − evHold (positive = exit first)
    recommendedStrategy: 'aggressive' | 'passive',
    rank: number,              // 1-indexed
  }>,
  totalRaiseableDollars: number,  // sum of markToBid across all
}
```

**Validation:** `positions.length ≥ 1`; every ticker has entries in `midProbabilities` and `bidByTicker`; probabilities in `[0, 1]`; bids in `[1, 99]`.

**Strategy selection rule (engine-side):** if `overvaluedDollars > 0.5 × markToBidDollars` (i.e. the agent estimates ≥50% gap from EV), recommend `'aggressive'` (urgency); else `'passive'`. The agent can override the default at the call site.

**Auto-execute path:** if caller invokes `executePortfolioPlan(plan, runners, opts)`, build an SCashRaiseConfig from `ranked` and run via `SCashRaiseRunner`. Pass-through `targetCashDollars` and `deadlineEpochMs` from caller.

**Pattern reference:**
- `src/strategies/sCashRaise.ts` — N-position orchestrator (W4.3 builds the *plan* that sCashRaise *executes*).
- `src/harvestPlanner.ts` — math + read-only computation pattern.

**Tests (≥10):**
1. Validation: empty positions, missing midProbability, bid out of [1,99].
2. Ranking by overvalued (most overvalued first): 3 positions sorted descending.
3. EV(hold) math: `size × midProb × 100` cents.
4. Recommended strategy: `overvalued > 0.5 × markToBid` → 'aggressive'; else 'passive'.
5. defaultStrategy override applied when set.
6. totalRaiseableDollars = sum of markToBid.
7. Tie-breaking: equal overvalued → stable order (input order preserved).
8. Single-position plan returns that one position with rank 1.
9. Negative overvalued (held position is *under*-valued at current mark) — still ranked, just lowest priority.
10. `executePortfolioPlan` wraps into SCashRaiseConfig correctly (test by inspecting passed config; don't actually run sCashRaise).

**Verify + commit + PR.** Title: `feat(engine): W4.3 portfolio liquidation sequencer`.

### Task B.2: SH-ALERTS notify-only synthetics

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/alerts/index.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/src/alerts/channels.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/src/alerts/dedupe.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/alerts/channels.test.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/alerts/dedupe.test.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/alerts/integration.test.ts`
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/synthetics/invoke.ts` — branch on `synthetic.action`: if `'notify'`, dispatch via `alerts/index.ts` instead of placing an order. (Surgical edit; ≤15 lines.)

**Spec:** When the watcher fires a synthetic whose `action === 'notify'`, the synthetic does NOT place an order. Instead it dispatches to each `notifyChannels[]` entry: webhook (POST JSON) and/or desktop notification (`node-notifier` or platform-specific). Dedup/cooldown ensures the same alert doesn't fire 100 times if the trigger condition oscillates.

**Notify payload schema (webhook + desktop body):**
```
{
  syntheticId: string,
  syntheticKind: SyntheticKind,
  ticker: string,
  message: string,        // e.g. "KXMETGALA top YES bid dropped below 5¢"
  triggeredAt: ISO8601,
  context: { ... }        // arbitrary kind-specific snapshot
}
```

**Dedupe rules (in `dedupe.ts`):**
- Per `syntheticId`: max 1 fire per `cooldownMs` window (default 5 min).
- Tracked in-memory `Map<syntheticId, lastFiredEpochMs>`. Persisted to `~/.kalshi-exit-assistant/alert-state.json` on shutdown for crash-resume.
- `shouldDedupe(syntheticId, nowMs, cooldownMs): boolean` — pure function for tests.

**Channel dispatch (in `channels.ts`):**
- `dispatchWebhook(url: string, payload: NotifyPayload): Promise<DispatchResult>` — POST JSON; 5s timeout; on non-2xx response or timeout, return `{ ok: false, reason }` (don't throw — alerts must not crash the watcher).
- `dispatchDesktop(payload: NotifyPayload): Promise<DispatchResult>` — uses `node-notifier` (already a dep? if not, **flag in your return summary** — orchestrator decides whether to add).
- Each dispatch is journaled via Journal: `alert_dispatched` (with channel + result) or `alert_dispatch_failed`.

**Integration into `synthetics/invoke.ts`:**
```typescript
// Before placing order:
if (synthetic.action === 'notify') {
  await alerts.dispatch(synthetic, context, journal);
  return { kind: 'notified', ... };  // existing return type extended
}
// Otherwise existing fire-an-order path
```

**Pattern reference:**
- `src/synthetics/index.ts` for synthetic dispatch shape
- `src/synthetics/invoke.ts` for the fire path (the file you're editing)
- `src/watcherJournal.ts` for journal kind conventions

**Tests (≥15 across the 3 test files):**
1. `dedupeFn`: first call returns false (no dedupe), second within window returns true, third after window returns false.
2. `dedupeFn`: per-syntheticId isolation — different IDs don't dedupe each other.
3. `dispatchWebhook`: 200 → ok=true; 500 → ok=false; timeout → ok=false (use a fake `fetch` injectable).
4. `dispatchWebhook`: 5s timeout enforced.
5. `dispatchWebhook`: payload shape matches schema.
6. `dispatchDesktop`: stub channel returns ok=true (real desktop dispatch is integration-only).
7. Integration: synthetic with `action='notify'` and webhook channel → fetch called once with payload, no order placed, `alert_dispatched` journaled.
8. Integration: synthetic with both webhook + desktop → both dispatched.
9. Integration: webhook fails (500) → `alert_dispatch_failed` journaled, watcher continues.
10. Integration: dedupe in second-fire scenario → 1st fires, 2nd within cooldown is suppressed (journal `alert_deduped`).
11. Integration: synthetic with `action='fire'` (or omitted) → existing order-placing path runs (regression test).
12. Integration: cooldown clears after window passes.
13. Integration: notifyChannels=[] with action='notify' → validation error or graceful no-op + journal `alert_no_channels`.
14. State persistence: dedupe state survives process restart (test by writing then reading the JSON file).
15. Webhook URL validation: empty URL → reject at config build.

**Verify + commit + PR.** Title: `feat(engine): SH-ALERTS notify-only synthetics with webhook + desktop channels`.

### Task B.3: SH-RECOMMENDER (EV + Kelly + recommender)

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/decisionEv.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/src/kellySizer.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategyRecommender.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/decisionEv.test.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/kellySizer.test.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategyRecommender.test.ts`

**Spec:** Three stateless math modules. All exports are pure functions (or thin classes wrapping pure functions). No I/O; the agent supplies all market state via inputs.

**Module 1 — `decisionEv.ts`:**
```
export type DecisionContext = {
  position?: { side: 'yes'|'no', size: number, costBasisCents: number };
  ticker: string;
  bidCents: number;
  askCents: number;
  midProbability: number;     // agent's belief (0..1)
  feesEstimateCents?: number;
  timeToCloseHours?: number;
};

export type DecisionAction =
  | 'enter-yes' | 'enter-no'
  | 'hold'
  | 'exit-aggressive' | 'exit-passive'
  | 'scale-out-50' | 'scale-out-25'
  | 'no-action';

export function computeDecisionEV(
  ctx: DecisionContext,
  action: DecisionAction,
): { evDollars: number; rationale: string };
```

For each action, compute expected dollar payoff under `midProbability`. e.g. `'hold' → size × midProbability × $1 − costBasis`; `'exit-aggressive' → size × bidCents/100 − fees`; etc. Document the formula per branch in code comments.

**Module 2 — `kellySizer.ts`:**
```
export type KellyContext = {
  edgeProbability: number;  // agent's p (their belief)
  marketProbability: number;  // implied from price
  bankrollDollars: number;
  fractionalKelly?: number;  // default 0.5 (half-Kelly)
  maxPositionDollars?: number;  // hard cap from safety.json
};

export function computeKellySize(ctx: KellyContext): {
  fullKellyFractionOfBankroll: number;
  recommendedFraction: number;        // = full × fractionalKelly
  recommendedDollars: number;          // capped by maxPositionDollars
  notes: string[];                     // e.g. "capped by maxPosition", "edge ≤ market → recommend 0"
};
```

Standard Kelly formula: `f* = (p × b − q) / b` where `b = (1−market)/market` (odds), `p = edgeProbability`, `q = 1 − p`. If `f* ≤ 0`, recommended = 0 with note "negative edge". Half-Kelly default per industry convention.

**Module 3 — `strategyRecommender.ts`:**
```
export type RecommendContext = DecisionContext & KellyContext & {
  availableStrategies: string[];   // names from current S library, e.g. ['s-passive','s-aggressive', ...]
  edgeData?: EdgeDataSummary;      // optional from SH-EDGE; degrades gracefully when absent
};

export type Recommendation = {
  rank: number;
  strategy: string;
  sizeDollars: number;
  evDollars: number;
  rationale: string;
};

export function recommendStrategies(ctx: RecommendContext): {
  recommendations: Recommendation[];   // top 3, or empty if no positive-EV options
  noRecommendation?: string;            // human reason: "negative edge, all actions EV-negative"
};
```

Composition: for each candidate strategy, compute `(evDollars, sizeDollars)` via decisionEv + kellySizer. Rank top 3 by `evDollars × sqrt(sizeDollars)` (Kelly-justified ranking). Honest empty output when no strategy is positive-EV.

**Pattern reference:**
- `src/harvestPlanner.ts` — math + JSON-shape contract pattern (these three modules sit alongside it)

**Tests per module (≥10 each, ≥30 total):**

decisionEv:
1. enter-yes EV calc against worked example.
2. exit-aggressive EV calc with fees.
3. scale-out-50 = half of exit-aggressive's recommendation.
4. hold EV = expected terminal payoff − cost basis.
5. no-action EV = 0.
6. Validation: probability out of [0,1] throws.
7. Position required for exit/scale-out actions; throws otherwise.
8. timeToCloseHours not provided → uses a default theta=0 model, EV is undiscounted.
9. Negative EV branches return correctly negative numbers (don't clamp to 0).
10. Each return includes a non-empty rationale string.

kellySizer:
1. Standard f* = (pb−q)/b with worked example: p=0.6, market=0.5 → b=1, f*=0.2.
2. Half-Kelly halves the result.
3. Negative edge returns 0 + "negative edge" note.
4. Bankroll * fraction = recommendedDollars (uncapped).
5. maxPositionDollars cap applied.
6. p ≤ market returns 0.
7. p = 0 or 1 (degenerate) returns 0 with note.
8. Half-Kelly + cap stack correctly.
9. fractionalKelly=1.0 (full Kelly) works.
10. fractionalKelly=0 returns 0.

strategyRecommender:
1. With both edge + market favorable: returns 1+ recommendations.
2. Negative edge: returns no recommendations + reason.
3. Top 3 ranking by EV × sqrt(size).
4. Empty availableStrategies → empty recommendations, reason set.
5. edgeData absent → degrades to generic textbook (recommendations still emitted).
6. Each recommendation has positive EV (ranker filters out negatives).
7. rationale non-empty.
8. sizeDollars respects the kellySizer cap.
9. Available strategy not in `s-*` enum is silently dropped (with optional warning in noRecommendation).
10. Single-strategy availability: returns at most 1 recommendation, ranked 1.

**Verify + commit + PR.** Title: `feat(engine): SH-RECOMMENDER — EV calculator + Kelly sizer + strategy recommender`.

---

## Phase C — Surface wiring batch

After Phase B's 3 PRs all merge, single Sonnet dispatch wires the new tools.

**Files:**
- Modify: `src/cli.ts` — add `kea portfolio plan` subcommand (W4.3); add `kea alerts {register,list,cancel}` (SH-ALERTS); add `kea recommend` / `kea ev` / `kea size` (SH-RECOMMENDER).
- Modify: `src/mcp.ts` — add `kea_portfolio_plan` MCP tool; `kea_alert_register` (mirrors `kea_synthetic_register` shape but with action='notify' default); `kea_recommend`, `kea_ev`, `kea_size`.
- Modify: `src/server.ts` — `POST /portfolio/plan`, `/alerts/*` (mirror `/synthetics/*`), `/recommend`, `/ev`, `/size`.
- Modify: `test/mcp.test.ts` — tool surface assertion (+5–6 names).
- Modify: `src/safety.ts` — optional new fields if recommender exposes safety overrides; default no-op (skip if not needed).

**Pattern reference:** PRs #50, #59, #63 (prior cluster wiring batches).

**Verify:** `npx tsc --noEmit && npx vitest run` all green.

**PR title:** `feat(surfaces): wire decision-layer tools — portfolio + alerts + recommender`.

---

## Phase D — Backlog sync

Promote 3 stories to §7:
- W4.3 portfolio liquidation sequencer
- SH-ALERTS notify-only synthetics
- SH-RECOMMENDER (EV + Kelly + recommender)

Update §0: §W4 4→3, §SH 5→4, shipped 39→42.

Replace removed §W4.3 / §SH-ALERTS / §SH-RECOMMENDER sections with `_<id> shipped — see §7._` stub pointers.

PR: `chore(backlog): sync — decision-layer cluster shipped`. Auto-merge.

---

## Cost & ordering

| Phase | Tasks | Parallelism | Wall-clock |
|---|---|---|---|
| A — Synthetic action discriminator | A.1 | direct or 1 Sonnet | ~1 hour |
| B — 3-way parallel | B.1 + B.2 + B.3 | 3 Sonnet agents in parallel | ~5–6 hours real / ~1 day if serial |
| C — surface wiring | one batch PR | 1 Sonnet | ~1 day |
| D — backlog sync | direct | — | ~10 min |

**Total: ~2–3 days with parallelism.**

## Verification matrix

| Concern | Verification | Phase |
|---|---|---|
| Synthetic.action defaults to 'fire' | unit test + regression of all SH-WATCH synthetic tests | A |
| W4.3 ranking by overvalued | unit test (3-position sort) | B |
| W4.3 strategy auto-pick rule (>50% gap → aggressive) | unit test | B |
| W4.3 executePortfolioPlan composes SCashRaiseConfig | unit test | B |
| SH-ALERTS dedupe per-syntheticId | unit test | B |
| SH-ALERTS webhook timeout doesn't crash watcher | unit test | B |
| SH-ALERTS notify path skips order placement | integration test | B |
| SH-ALERTS state persistence across restart | unit test (file round-trip) | B |
| SH-RECOMMENDER EV math vs worked example | unit test | B |
| SH-RECOMMENDER half-Kelly default | unit test | B |
| SH-RECOMMENDER negative edge → no recommendation | unit test | B |
| SH-RECOMMENDER top-3 ranking by EV × √size | unit test | B |
| Surface wiring round-trips | mcp.test.ts integration | C |
| Total test count | full suite +75 minimum | D |

## Open questions / explicit non-goals

1. **node-notifier dependency for desktop alerts** — confirm it's already a dep before depending; if not, the SH-ALERTS agent should flag it in their return summary so the orchestrator can decide whether to add. Fallback: console-log "DESKTOP ALERT: ..." and treat that as the v1 "desktop" channel.
2. **SH-EDGE integration** — not in scope. SH-RECOMMENDER's `edgeData?` parameter is optional; degrades gracefully when absent. Real SH-EDGE ships separately when SH-WATCH has 30+ days of fire data.
3. **Email / extension toast channels** — explicitly deferred (per backlog spec).
4. **SH-RECOMMENDER TUI panel** — defer to a follow-up SP cluster. Engine + MCP only in this cluster.
5. **W4.3 auto-execute path** — exposed but tests stop at config-construction; full auto-execute integration test is a follow-up because it requires the full sCashRaise mock harness.
6. **W4.4 multi-venue Smart Order Router** — out of scope (week-long story).
7. **SH-COMPOSE workflow state machines** — out of scope. Different theme; needs SH-ALERTS + SH-RECOMMENDER as foundation.
