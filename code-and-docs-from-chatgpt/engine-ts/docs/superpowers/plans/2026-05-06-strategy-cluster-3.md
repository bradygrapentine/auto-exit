# Strategy Cluster 3 — S library finish + unified launcher

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the S library cleanly. Ship S5 multi-leg primitive (the structural piece), S14 basis-arb (composes S5), and SP2.1 unified `kea_strategy_run` MCP launcher (the surface bookend across all 12 shipped strategies). Drains §S from 3 → 1 (only S12 market-making remains, deferred to its own planning round on scope-risk grounds).

**Architecture:**
- **S5** introduces a new shape: parallel multi-leg orchestration. New module `src/multiLeg.ts` (job runner) + `src/strategies/sPair.ts` (preset). Legs run as parallel sub-runners sharing one journal; atomicity-of-progress enforced via `legSkewPct` throttle (any leg ahead by more than X% of total size pauses); halt-all on any leg becoming unfillable.
- **S14** is a thin specialization of S5: hardcoded to YES + NO of one ticker, both buy-side, with an "arb still open" precondition checked at every loop iteration (`yesAsk + noAsk < 100` minus per-pair fees). Reuses S5's parallel runner and skew throttle.
- **SP2.1** is a single MCP tool whose `strategy` enum dispatches to all 12 existing runners. Replaces (does not delete) the per-strategy `kea_strategy_*` tools — those keep working; SP2.1 is sugar for the agent to pick from one schema.
- All file-touch boundaries strictly disjoint per phase.

**Tech stack:** TypeScript + Vitest + Zod. Patterns:
- `src/strategies/sCashRaise.ts` for sequential N-position orchestration (S5 is the *parallel* analog)
- `src/strategies/sRoll.ts` for two-phase orchestrator + multiple injected callbacks
- `src/aggressive.ts` + `src/passive.ts` for per-leg execution (S5 dispatches to whichever the leg specifies)
- `src/journal.ts` — single shared journal across all legs
- `src/mcp.ts` — `kea_strategy_*` tools (each is a thin Zod-schema + builder.run() pair) — SP2.1 fans out across them via discriminated union schema

**Phase ordering:**
- **Phase A** (single PR): S5 multi-leg primitive + sPair preset.
- **Phase B** (single PR, depends on Phase A): S14 basis-arb (composes S5).
- **Phase C** (single PR): SP2.1 unified launcher + surface wiring (S5 + S14 into CLI/MCP/HTTP). One batch — same shape as cluster 2 Phase C.
- **Phase D** (small chore PR): backlog sync — promote S5, S14, SP2.1 to §7. Counts: §S 3→1, §SP1–4 12→11, shipped 36→39.

No parallel agents this cluster — Phase A → B is sequential by data dependency, and Phase C touches the same files (cli.ts/mcp.ts/server.ts) that S5/S14 wiring requires, so bundling avoids merge conflicts. One Sonnet dispatch per phase.

**Subagent conventions** (reused from clusters 1 & 2):
- Worktree per agent at `worktrees/<slug>/`.
- node_modules symlinked from main repo (recursive-symlink check before dispatch).
- Heartbeat to `.claude/agent-status/<slug>.log`.
- File-touch boundaries listed per task; no agent edits another agent's owned files.
- CI gate before `gh pr ready`; auto-merge `--auto --squash` armed by orchestrator after PR opens.

---

## Phase A — S5 multi-leg primitive + sPair preset

### Task A.1: Multi-leg job runner + sPair preset

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/multiLeg.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategies/sPair.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/multiLeg.test.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategies/sPair.test.ts`

**Background:** Multi-leg execution is the architectural piece — opening or closing a spread / hedge / range bet atomically. Closing one leg ahead of others re-introduces directional risk; opening one leg ahead exposes execution risk. The engine's job is to keep all legs progressing in lockstep within `legSkewPct` and halt all if any becomes unfillable.

**Spec:**
- `MultiLegJobConfig`: `{ legs: Array<{ ticker, side, size, executionMode: 'aggressive' | 'passive' }>, legSkewPct?: number, journal: Journal, client: KalshiClientLike }`. Default `legSkewPct = 0.10` (10%).
- Runner spawns one sub-runner per leg via existing `AggressiveRunner` (mode='aggressive') or `passive.run()` (mode='passive'). All legs share the supplied `journal`.
- Skew throttle: every poll cycle (default 1000ms), compute `progressPct[i] = filled[i] / size[i]` per leg. Find max and min. If `max − min > legSkewPct`, *pause* the most-progressed legs (call their `stop()`-equivalent **without halting them permanently** — i.e. stop placing new orders but keep collecting fills) until laggards catch up. When `max − min ≤ legSkewPct/2` (hysteresis), resume.
- Atomicity-of-progress: if any leg's `fetchOrderbook` returns an empty side OR throws, immediately call `halt()` on every leg and surface a `multileg_halted` journal entry with the failing leg + reason. The job result reports per-leg filled counts.
- Single shared journal. Per-leg journal entries get a `legIndex` field; high-level `multileg_started` / `multileg_skew_pause` / `multileg_skew_resume` / `multileg_halted` / `multileg_finished` entries log the orchestration.
- `sPair.ts` is a thin builder + runner: `buildSPairArgs({ legs, legSkewPct? })` validates and constructs `MultiLegJobConfig`; `SPairRunner.run()` calls into `multiLeg.ts`'s runner.
- Validation: `legs.length ≥ 2`; every leg has `size > 0`; `legSkewPct ∈ [0, 1]`; no duplicate (ticker, side) pairs.

**Pattern reference (study before writing):**
- `src/strategies/sCashRaise.ts` — sequential N-position orchestrator (S5 is the parallel analog).
- `src/strategies/sRoll.ts` — multi-callback injection (`passiveInvoke`, `aggressiveInvoke`).
- `src/aggressive.ts` — `AggressiveRunner` lifecycle (`run()` returns a result; supports cancellation).
- `src/passive.ts` — chunked GTC loop with `stop()` semantics.
- `src/journal.ts` — single Journal shared across legs is the existing pattern.

**Required behaviors:**
- Inject `aggressiveInvoke`, `passiveInvoke`, `fetchOrderbook` (returns `Orderbook | null`), `now: () => number`, `sleepMs` for testability.
- `pollIntervalMs` config with default 1000.
- All-or-nothing halt: `halt()` is idempotent.
- Final result shape: `{ legs: Array<{ filled: number, leg: LegConfig }>, halted: boolean, haltReason?: string, durationMs }`.

**Journal kinds (cast via `jk()`, do NOT touch types.ts):** `multileg_started`, `multileg_leg_started`, `multileg_skew_pause`, `multileg_skew_resume`, `multileg_halted`, `multileg_leg_completed`, `multileg_finished`, `pair_started`, `pair_finished` (sPair preset wraps multileg_*).

**Tests for `multiLeg.ts` (≥12):**
1. `MultiLegJobRunner` construction succeeds with valid config.
2. Two legs in lockstep complete without skew pauses.
3. Skew detected when leg 0 reaches 60% and leg 1 at 30% (skew = 30% > 10% threshold) → `multileg_skew_pause` journaled for leg 0.
4. Skew resume after laggard catches up (hysteresis at half threshold).
5. Empty book on one leg triggers `multileg_halted` with that leg's index + reason.
6. Halt is idempotent — calling `halt()` twice does not journal twice.
7. Per-leg journal entries carry `legIndex`.
8. Mixed execution modes (one passive leg + one aggressive leg) both run; result aggregates filled.
9. Final result has correct halted flag + per-leg fills.
10. now() and sleepMs called on every poll cycle.
11. `pollIntervalMs=0` runs poll loop without yielding (test-only fast path).
12. Orderbook fetch throw propagates to halt-all.

**Tests for `sPair.ts` (≥6):**
1. `buildSPairArgs` validation: rejects legs.length < 2, leg with size ≤ 0, legSkewPct out of [0,1], duplicate (ticker,side).
2. Valid config builds without throw.
3. Happy path: two legs complete via injected invokers.
4. `pair_started` and `pair_finished` journal entries fire.
5. Halt propagates to result.
6. Default legSkewPct = 0.10 when omitted.

**Verify:**
```bash
cd code-and-docs-from-chatgpt/engine-ts
npx vitest run test/multiLeg.test.ts test/strategies/sPair.test.ts
npx tsc --noEmit
npx vitest run  # full suite green, ≥18 new tests
```

**Commit:**
```
feat(engine): S5 multi-leg primitive + S-pair preset

- src/multiLeg.ts: MultiLegJobRunner with parallel leg orchestration,
  legSkewPct throttle, atomicity-of-progress halt-all on any leg
  unfillable.
- src/strategies/sPair.ts: SPairRunner + buildSPairArgs preset.
- 18+ unit tests covering skew detection/resume, halt propagation,
  mixed execution modes, validation.

Co-Authored-By: Claude <noreply@anthropic.com>
```

**PR title:** `feat(engine): S5 multi-leg primitive + S-pair preset`. Don't auto-merge — orchestrator does.

---

## Phase B — S14 basis-arb

### Task B.1: SBasisArbRunner

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategies/sBasisArb.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategies/sBasisArb.test.ts`

**Spec:** Buy YES + NO of the same ticker simultaneously when their combined ask price < $1, locking a $1 terminal payoff. Single journal; reuses S5 multiLeg runner with two hardcoded legs.

**Inputs:** `{ ticker, totalDollarBudget, perPairSlippageCents?: number }`. `perPairSlippageCents` defaults to 0 (strict arb); raising it allows trading at slightly worse prices when the operator accepts pre-fee margin compression. The engine computes per-leg sizes from `totalDollarBudget / (yesAsk + noAsk)`, rounded down to whole pairs.

**Pattern reference:**
- `src/strategies/sPair.ts` (just shipped in Phase A) — basis-arb is sPair with hardcoded `[YES, NO]` legs.
- `src/multiLeg.ts` — reused as-is, no edits.

**Validation:** `totalDollarBudget > 0`; `perPairSlippageCents ∈ [0, 99]` if provided; ticker non-empty.

**Required behaviors:**
- Pre-flight orderbook fetch: read `yesAsk` and `noAsk`; if `yesAsk + noAsk ≥ 100 + perPairSlippageCents`, throw with descriptive `"arb closed: yesAsk + noAsk = X¢ ≥ Y¢"` (don't proceed).
- Compute `pairsToBuy = floor(totalDollarBudget × 100 / (yesAsk + noAsk))`.
- Build two legs: `{ ticker, side: 'yes', size: pairsToBuy, executionMode: 'aggressive' }` and same for 'no'. Pass to `SPairRunner` (or directly to `MultiLegJobRunner`).
- Mid-flight check: every poll cycle, re-fetch the book; if `yesAsk + noAsk` exceeds budget, journal `basis_arb_closed_midflight` and halt-all.
- Inject `pairRunInvoke` + `fetchOrderbookInvoke` for testability.
- Journal kinds: `basis_arb_started` (with `pairsToBuy` + per-leg sizes), `basis_arb_closed_midflight`, `basis_arb_finished`.

**Tests (≥10):**
1. Validation: budget ≤ 0, slippage out of range, empty ticker.
2. Pre-flight: yesAsk=60 + noAsk=38 = 98 → 2¢ arb → proceed; sizes computed correctly for $50 budget.
3. Pre-flight: yesAsk=60 + noAsk=42 = 102 → throws "arb closed".
4. perPairSlippageCents=2: yesAsk+noAsk=102 with slippage=2 → proceeds.
5. Mid-flight close: book becomes 100 mid-execution → halt + journal `basis_arb_closed_midflight`.
6. pairsToBuy math: $50 × 100 / 98 = floor(51.02) = 51.
7. Both legs share journal.
8. Empty book on either side throws.
9. Successful completion: both legs filled, journal ordering correct.
10. Default perPairSlippageCents = 0.

**Verify:** same shape as Phase A.

**Commit:**
```
feat(strategies): S14 cross-resolution basis arbitrage

- src/strategies/sBasisArb.ts: SBasisArbRunner — buy YES + NO atomically
  via MultiLegJobRunner when yesAsk + noAsk < 100. Pre-flight + mid-flight
  arb-still-open checks; halt on close.
- 10+ tests covering pre-flight rejection, mid-flight close, sizing math,
  slippage tolerance, validation.

Co-Authored-By: Claude <noreply@anthropic.com>
```

**PR title:** `feat(strategies): S14 cross-resolution basis arbitrage`. Don't auto-merge.

---

## Phase C — Surface wiring + SP2.1 unified launcher

### Task C.1: Wire S5 + S14 + add SP2.1

**Files:**
- Modify: `src/cli.ts` — add `kea strategy s-pair`, `kea strategy s-basis-arb`, and `kea strategy run --strategy <enum>` (the unified entry).
- Modify: `src/mcp.ts` — add `kea_strategy_s_pair`, `kea_strategy_s_basis_arb`, and `kea_strategy_run` (SP2.1 unified — discriminated union of all 12 strategies).
- Modify: `src/server.ts` — add `POST /strategies/s-pair`, `/s-basis-arb`, `/strategies/run` (the unified) routes.
- Modify: `test/mcp.test.ts` — update tool surface assertion (+3 names: `kea_strategy_s_pair`, `kea_strategy_s_basis_arb`, `kea_strategy_run`).
- Add tests for the unified launcher round-tripping at least one strategy of each shape (single-leg aggressive, multi-leg pair, basis-arb).

**Pattern reference:**
- PR #50 + PR #59 (the prior cluster wiring batches) — same Zod schema + builder.run() shape.
- For SP2.1's discriminated union: the Zod schema is `z.discriminatedUnion('strategy', [...])` where each branch matches the per-strategy schema. Server-side dispatch uses a switch on `args.strategy` to call the right `buildXArgs(...)` + `XRunner.run()`.

**SP2.1 strategy enum (must include all 12 shipped strategies):**
- `'s-passive'` (S1) — already wired as `kea_strategy_s_passive`? Verify; if not, add to per-tool list too. (S1 may have shipped only via passive primitive, not wrapped in a `kea_strategy_*` tool — confirm + add if missing.)
- `'s-aggressive'` (S2)
- `'s-twap'` (S3)
- `'s-stealth'` (S4)
- `'s-pair'` (S5, this cluster)
- `'s-pre-resolution-arb'` (S6)
- `'s-scale-out'` (S7) — verify naming
- `'s-limit-ladder'` (S8)
- `'s-stop-and-reverse'` (S9)
- `'s-cash-raise'` (S10)
- `'s-roll'` (S11)
- `'s-iceberg'` (S13)
- `'s-basis-arb'` (S14, this cluster)
- `'s-prepend-then-sweep'` (S15)
- `'s-time-emergency'` (S16)
- Plus the 4 SH-WATCH presets: `'s-trail'`, `'s-step-trail'`, `'s-bracketed-exit'`, `'s-conditional-roll'`.

(Total ~17 strategies; the agent should grep `src/strategies/` to enumerate the full list before writing the enum.)

**Verify:** `npx tsc --noEmit && npx vitest run && npm run lint` all green.

**Commit:**
```
feat(surfaces): wire S5 + S14 into CLI/MCP/HTTP + SP2.1 unified launcher

- 3 new per-strategy tools wired (kea_strategy_s_pair, _s_basis_arb).
- New SP2.1 unified MCP tool kea_strategy_run with discriminated-union
  schema covering all shipped strategies; CLI `kea strategy run`;
  HTTP POST /strategies/run.
- Tool surface assertion updated.

Co-Authored-By: Claude <noreply@anthropic.com>
```

**PR title:** `feat(surfaces): wire S5 + S14 + SP2.1 unified strategy launcher`. Don't auto-merge.

---

## Phase D — Backlog sync

Promote 3 stories to §7:
- S5 multi-leg primitive — link Phase A PR
- S14 basis-arb — link Phase B PR
- SP2.1 unified `kea_strategy_run` MCP launcher — link Phase C PR

Update §0: §S 3→1, §SP1–SP4 12→11, shipped 36→39.

Replace removed §S/§SP sections with `_<id> shipped — see §7._` stub pointers.

PR: `chore(backlog): sync — strategy cluster 3 shipped`. Auto-merge.

---

## Cost & ordering

| Phase | Tasks | Parallelism | Wall-clock |
|---|---|---|---|
| A — S5 multi-leg | A.1 | single Sonnet | ~2 days |
| B — S14 basis-arb | B.1 | single Sonnet (after A merges) | ~1 day |
| C — wiring + SP2.1 | C.1 | single Sonnet (after B merges) | ~1 day |
| D — backlog sync | direct | — | ~10 min |

**Total: ~4 days serial** (this cluster has no parallelism by design — S14 depends on S5; wiring depends on both).

## Verification matrix

| Concern | Verification | Phase |
|---|---|---|
| S5 skew throttle pauses leading leg | unit test: leg0 at 60% / leg1 at 30% with 10% threshold | A |
| S5 skew resume hysteresis (at half threshold) | unit test | A |
| S5 halt-all on empty book | unit test (one leg returns empty side) | A |
| S5 mixed execution modes (passive + aggressive) | unit test | A |
| S14 pre-flight rejects closed arb | unit test: yesAsk+noAsk=102 → throws | B |
| S14 mid-flight close halts | unit test (book moves while running) | B |
| S14 sizing math | unit test ($50 / 98¢ = 51 pairs) | B |
| SP2.1 dispatches each strategy shape | integration test (single-leg, pair, basis-arb) | C |
| Tool surface assertion +3 names | test/mcp.test.ts | C |

## Open questions / explicit non-goals

1. **S12 market-making** — explicitly deferred. Backlog flags this as scope-risk-flagged ("complex state machine that may grow"). Plan separately with a tighter scope-control conversation; do not bundle here.
2. **TUI strategy picker (SP2.2)** — out of scope. SP2.2 is a TUI tab; this cluster is engine + MCP only.
3. **Extension strategy picker (SP2.3)** — out of scope. Frontend cascade; separate cluster.
4. **Per-strategy adoption of W3.1 POV pacing** — out of scope. Helper landed in cluster 2; per-strategy threading is its own follow-up cluster (touches `passive.ts`, `stealth.ts`, etc. → high merge-conflict risk if bundled with new strategies).
5. **BasisArb buy-side only by spec** — both legs are buys. Selling the synthetic pair is a different operation (not in S14's scope).
