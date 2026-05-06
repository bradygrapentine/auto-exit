# Strategy Cluster 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the next 6 backlog stories as a coherent cluster — S3 TWAP, S6 Pre-resolution arb, S10 Cash-raise sequencer, S13 Iceberg, S16 Time-to-expiry emergency unwind, and W3.1 POV (participation-rate) pacing. Drains §S from 8 → 3 (leaves only the architecturally large S5 multi-leg / S12 market-making / S14 basis-arb).

**Architecture:**
- All 5 strategies are thin runner classes following the established pattern from `src/strategies/sRoll.ts`, `sStopAndReverse.ts`, `sStealth.ts` (just shipped):
  - `buildXArgs(opts)` builder with validation
  - Runner class with injectable callbacks for testability
  - Journal entries via `jk()` cast (no edits to `types.ts`)
  - File-touch boundary: each strategy owns exactly its own `src/strategies/<name>.ts` + `test/strategies/<name>.test.ts`
- W3.1 is a pure helper module (`src/participationRate.ts`) consumed by loop-based strategies (S1 passive, S3 TWAP, S4 stealth) on an opt-in basis; we wire the helper but defer per-strategy adoption to follow-up PRs to keep this cluster's diffs small.
- Surface wiring (CLI / MCP / HTTP) lands as a single batch PR after all strategies merge — same pattern as Phase D of the prior cluster (PR #50).

**Tech stack:** TypeScript + Vitest. Existing patterns:
- `src/strategies/sRoll.ts` — two-phase orchestrator with injected callbacks (reference for S6, S10, S16)
- `src/strategies/s7ScaleOut.ts` — poll-loop with rung firing + `s1Invoke` (reference for S13 reposting)
- `src/strategies/sStealth.ts` — loop-based with jitter (reference for S3 interval scheduling)
- `src/aggressive.ts` — IoC sweep (composed by S6, S16)
- `src/passive.ts` — chunked GTC (composed by S3, S13's repost loop, S16's T-60 phase)

**Phase ordering:**
- **Phase A** (helper, single PR): W3.1 POV pacing helper.
- **Phase B** (independent strategies, 5-way parallel): S3, S6, S10, S13, S16. All file-disjoint, all dependencies satisfied (S1/S2/S7 shipped).
- **Phase C** (single batch PR): wire 5 new strategies + W3.1 safety field into CLI / MCP / HTTP. Update `test/mcp.test.ts` tool surface assertion.
- **Phase D**: backlog-sync — promote 6 stories (S3, S6, S10, S13, S16, W3.1) to §7. Counts: §S 8→3, §W3 1→0, shipped 29→35.

**Subagent dispatch convention** (reuse from prior cluster):
- One worktree per agent at `worktrees/<slug>/` (inside the project root, never as sibling).
- Symlink `node_modules` from main repo (recursive-symlink check before dispatch — fix at source if needed).
- Heartbeat to `.claude/agent-status/<slug>.log` per `subagent-heartbeat` skill.
- Exclusive file-touch boundaries (listed per task).
- CI gate before `gh pr ready`; auto-merge `--auto --squash`.

---

## Phase A — W3.1 POV pacing helper

### Task A.1: participationRate.ts

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/participationRate.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/participationRate.test.ts`

**Background:** Loop-based strategies fire chunks as fast as their loop runs. On thin/quiet markets the engine can become a meaningful fraction of recent volume and signal its own intent. W3.1 adds a safety field `maxParticipationRate` (e.g. `0.25`) and a helper that throttles `loopDelayMs` so cumulative submitted shares per minute ≤ `maxParticipationRate × recent-minute-volume`. The helper is consumed on an opt-in basis by each loop strategy; this plan only ships the helper + tests, not the per-strategy integration (deferred to follow-up PRs to keep diffs scoped).

- [ ] **Step 1: Write the failing test**

```typescript
// test/participationRate.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeAllowedSharesPerMinute,
  computePaceDelayMs,
  type PovConfig,
} from '../src/participationRate.js';

describe('computeAllowedSharesPerMinute', () => {
  it('returns floor(rate × recentVolumePerMinute)', () => {
    expect(computeAllowedSharesPerMinute(0.25, 400)).toBe(100);
    expect(computeAllowedSharesPerMinute(0.10, 999)).toBe(99);
  });
  it('returns 0 when recent volume is 0', () => {
    expect(computeAllowedSharesPerMinute(0.25, 0)).toBe(0);
  });
  it('returns Infinity when rate is 0 (disabled)', () => {
    expect(computeAllowedSharesPerMinute(0, 400)).toBe(Infinity);
  });
});

describe('computePaceDelayMs', () => {
  const cfg: PovConfig = {
    maxParticipationRate: 0.25,
    recentMinuteVolume: 400, // → 100 allowed shares/min
  };
  it('returns the configured base delay when pace target not exceeded', () => {
    // 50 shares submitted last minute, 100 allowed → no extra delay
    expect(computePaceDelayMs(50, cfg, 1_000)).toBe(1_000);
  });
  it('extends delay proportionally when overshooting allowed pace', () => {
    // 200 shares submitted, 100 allowed → 2× over → delay doubles
    expect(computePaceDelayMs(200, cfg, 1_000)).toBe(2_000);
  });
  it('returns the base delay when participation rate is 0 (disabled)', () => {
    expect(computePaceDelayMs(10_000, { ...cfg, maxParticipationRate: 0 }, 1_000)).toBe(1_000);
  });
  it('caps at a sane upper bound (10 × base) to prevent permanent stalls', () => {
    expect(computePaceDelayMs(1_000_000, cfg, 1_000)).toBeLessThanOrEqual(10_000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd code-and-docs-from-chatgpt/engine-ts && npx vitest run test/participationRate.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement participationRate.ts**

```typescript
// src/participationRate.ts
/**
 * W3.1 POV (participation-of-volume) pacing helper.
 *
 * Loop-based strategies opt in by passing the most recent minute's submitted-share
 * count + recent market volume to `computePaceDelayMs`; the helper returns either
 * the configured base delay or an inflated delay if the loop is exceeding its
 * fair share of recent volume.
 *
 * Disabled when `maxParticipationRate === 0`. Capped at 10× the base delay to
 * prevent permanent stalls when volume drops to zero.
 */

export interface PovConfig {
  maxParticipationRate: number;     // e.g. 0.25 → at most 25% of recent flow
  recentMinuteVolume: number;       // shares traded across all participants in last 60s
}

const MAX_DELAY_MULTIPLIER = 10;

export function computeAllowedSharesPerMinute(rate: number, recentVolumePerMinute: number): number {
  if (rate === 0) return Infinity;
  return Math.floor(rate * recentVolumePerMinute);
}

export function computePaceDelayMs(
  sharesSubmittedLastMinute: number,
  cfg: PovConfig,
  baseDelayMs: number,
): number {
  if (cfg.maxParticipationRate === 0) return baseDelayMs;
  const allowed = computeAllowedSharesPerMinute(cfg.maxParticipationRate, cfg.recentMinuteVolume);
  if (allowed === Infinity || sharesSubmittedLastMinute <= allowed) return baseDelayMs;
  // Overshoot ratio drives proportional delay extension, capped to 10× base.
  const overshoot = sharesSubmittedLastMinute / Math.max(allowed, 1);
  return Math.min(Math.round(baseDelayMs * overshoot), baseDelayMs * MAX_DELAY_MULTIPLIER);
}
```

- [ ] **Step 4: Run tests and typecheck**

```bash
npx vitest run test/participationRate.test.ts && npx tsc --noEmit
```
Expected: PASS, clean tsc.

- [ ] **Step 5: Commit + PR**

```bash
git add code-and-docs-from-chatgpt/engine-ts/src/participationRate.ts \
         code-and-docs-from-chatgpt/engine-ts/test/participationRate.test.ts
git commit -m "feat(engine): W3.1 POV pacing helper (participation-rate throttle)

Adds src/participationRate.ts with computeAllowedSharesPerMinute and
computePaceDelayMs. Loop strategies opt in by passing submitted-share
count + recent volume; helper inflates loopDelayMs when overshooting the
configured maxParticipationRate. Capped at 10× base to prevent stalls.

Per-strategy integration deferred to follow-up PRs.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Open PR `feat(engine): W3.1 POV pacing helper`. Auto-merge.

---

## Phase B — Strategy implementations (5-way parallel)

Each task creates one strategy file + one test file. **No two tasks share a file.** Dispatch all 5 in parallel via `superpowers:subagent-driven-development`. After Phase A merges, base each subagent off latest origin/main.

### Task B.1: S3 TWAP runner

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategies/sTwap.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategies/sTwap.test.ts`

**Spec:** Time-sliced S1 passive across N intervals.

**Inputs:** `{ ticker, side, size, intervalMinutes, numIntervals, sessionWindow?: { startUtc: 'HH:MM', endUtc: 'HH:MM' } }`. Per-interval target = `floor(size / numIntervals)`; remainder rolls into the last interval. Each interval: invoke S1 passive for that slice, wait `intervalMinutes` (real-time clock, not setTimeout chain — measure elapsed against scheduled boundary so drift doesn't accumulate). Optional session window pauses scheduling outside `startUtc..endUtc` and resumes at next session start.

**Pattern reference:** `src/strategies/sRoll.ts` for the orchestrator + injected `passiveInvoke` callback shape. `src/strategies/sStealth.ts` for loop-based scheduling. `src/strategies/s7ScaleOut.ts` for `pollIntervalMs` scheduling discipline.

**Validation (in `buildSTwapArgs`):** size > 0; intervalMinutes > 0; numIntervals ≥ 2 (TWAP of 1 = single S1 invocation, prefer S1 directly); side ∈ {'buy','sell'}; if sessionWindow given, validate HH:MM format.

**Required behaviors:**
- Inject `passiveInvoke: PassiveInvokeFn`, `sleepMs: (ms) => Promise<void>`, `now: () => Date` for testability.
- Journal entries: `twap_started`, `twap_interval_fired` (per slice with `intervalIndex`, `sliceSize`, `result`), `twap_session_paused`, `twap_session_resumed`, `twap_finished`.
- Halt cleanly if `stop()` is called between intervals (mirror sStealth).
- Last interval absorbs `size mod numIntervals` (no shares dropped).

**Tests (≥10):**
1. `buildSTwapArgs` validation: rejects size ≤ 0, numIntervals < 2, malformed sessionWindow.
2. Happy path: 100 size / 4 intervals → 4 invocations of size 25.
3. Remainder: 103 size / 4 intervals → [25, 25, 25, 28].
4. Session window pause: now=23:00 UTC, window=09:00..17:00 → first invocation deferred to 09:00 next day; journal records pause + resume.
5. Stop between intervals: stop() invoked after slice 2 of 4 → no further invocations; `twap_finished` records `intervalsFired=2`.
6. Drift handling: simulated 200ms delay in `passiveInvoke` over a 1000ms interval should not accumulate over 10 intervals.
7. Journal ordering: started → (interval_fired × N) → finished.
8. Side parameterization: buy and sell paths both exercised.
9. Phase-1 fail: `passiveInvoke` returns 0 filled on first interval → continues to next interval (TWAP doesn't halt on partial fills).
10. Total filled equals sum of per-interval results.

**Verify + commit + PR:**
```bash
npx vitest run test/strategies/sTwap.test.ts && npx tsc --noEmit && npx vitest run
```
Title: `feat(strategies): S3 TWAP (time-sliced passive)`. Don't auto-merge — orchestrator does.

---

### Task B.2: S6 Pre-resolution arbitrage exit

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategies/sPreResolutionArb.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategies/sPreResolutionArb.test.ts`

**Spec:** Two-phase aggressive escalation for thin pre-resolution books.

**Inputs:** `{ ticker, side, size, arbTimeboxMs, floorPriceCents }`. Phase 1: post one IoC at `bid + 1¢` (sell) / `ask − 1¢` (buy) for full size, give up one tick to fill. If unfilled within `arbTimeboxMs`, phase 2 escalates and sweeps remainder via S2 aggressive at the bid (sell) / ask (buy), respecting `floorPriceCents`.

**Pattern reference:** `src/strategies/sStopAndReverse.ts` for two-phase orchestrator. `src/aggressive.ts` for the IoC mechanic; phase 1 is essentially a single-shot aggressive at a 1-tick-better price.

**Validation:** size > 0; arbTimeboxMs > 0; floorPriceCents in [1, 99]; side valid.

**Required behaviors:**
- Inject `phase1Invoke` (single IoC at ±1¢) and `aggressiveInvoke` (S2 sweep) callbacks.
- Phase 1 unfilled ≠ failure — proceed to phase 2 with remaining size.
- Phase 1 fully filled → skip phase 2, journal `arb_filled_phase1`.
- Empty-book on phase 1 → descriptive throw (match S2 behavior).
- Journal entries: `arb_started`, `arb_phase1_posted`, `arb_phase1_result` (filled qty), `arb_phase2_sweep_started`, `arb_finished`.

**Tests (≥10):**
1. Validation: size ≤ 0, bad timebox, bad floor, bad side.
2. Phase 1 full fill → no phase 2 invocation.
3. Phase 1 partial fill → phase 2 sized to remainder.
4. Phase 1 zero fill → phase 2 sized to full size.
5. Empty book on phase 1 throws descriptively.
6. Floor respected in phase 2 (passed through to S2).
7. Side parameterization: both buy and sell.
8. Journal entries in correct order.
9. arbTimeboxMs zero throws validation error.
10. cumulativeFilled matches phase1.filled + phase2.filled.

**PR:** `feat(strategies): S6 pre-resolution arbitrage exit (timeboxed escalation)`.

---

### Task B.3: S10 Cash-raise sequencer

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategies/sCashRaise.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategies/sCashRaise.test.ts`

**Spec:** Sequential execution of pre-ranked positions until target cash hit or deadline.

**Inputs:** `{ positions: Array<{ ticker, side: 'sell', size, strategyName: 'aggressive' | 'passive' }>, targetCashDollars, deadlineEpochMs }`. Engine runs positions in order; after each completes, checks `cumulativeRaisedDollars` and `now()`. Halts when target met or deadline passed. The agent is responsible for ordering — engine only sequences. Side is constrained to `'sell'` (cash-raise only sells).

**Pattern reference:** `src/strategies/sRoll.ts` for two-phase orchestrator (this is N-phase but the structure is identical). The strategy dispatcher is a small switch — no need to abstract a registry.

**Validation:** positions non-empty; every position has size > 0 and side='sell'; targetCashDollars > 0; deadlineEpochMs > now() at start; strategyName ∈ {'aggressive','passive'}.

**Required behaviors:**
- Inject `aggressiveInvoke`, `passiveInvoke`, `now: () => number`, `getCurrentBidCents: (ticker) => Promise<number>`.
- After each position runs, compute `raisedDollars = filledShares × bidCentsAtFill / 100` from the runner's result. (Approximate; real cash arrives at clearing — engine doesn't reconcile bank ledger.)
- Halt early on target met OR deadline → journal `cashraise_target_met` or `cashraise_deadline_hit`.
- Halt on per-position failure → journal `cashraise_position_failed` with which one + why; continue to next position (don't abort the whole sequence; agent decides via downstream review).
- Journal entries: `cashraise_started`, `cashraise_position_started`, `cashraise_position_completed`, `cashraise_target_met` | `cashraise_deadline_hit` | `cashraise_finished`.

**Tests (≥10):**
1. Validation cases.
2. Happy path: 3 positions, target met after 2nd → 3rd never invoked.
3. Deadline hit mid-position-2 → no position 3.
4. Position-2 fails → position 3 still runs.
5. All positions complete, target not met → finishes with `cashraise_finished` flag.
6. Cash accounting: 100 shares × 60¢ = $60 raised.
7. Strategy dispatch: 'aggressive' → aggressiveInvoke, 'passive' → passiveInvoke.
8. Journal ordering.
9. Empty position list throws.
10. side != 'sell' rejected.

**PR:** `feat(strategies): S10 cash-raise sequencer`.

---

### Task B.4: S13 Iceberg

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategies/sIceberg.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategies/sIceberg.test.ts`

**Spec:** Hides total remaining size behind a single visible quote that auto-reposts on fill.

**Inputs:** `{ ticker, side, size, visibleSize, priceCents }`. Post a `visibleSize` GTC at `priceCents`. Poll for fills via injected `getOrderStatus`. On any fill, immediately post a fresh `visibleSize` (or `remaining` if smaller) at `priceCents`. Continues until cumulative filled ≥ `size` OR `stop()` called.

**Pattern reference:** `src/strategies/s7ScaleOut.ts` for poll-loop + per-rung firing. `src/passive.ts` for GTC posting mechanics — but iceberg posts `visibleSize` not full chunks.

**Validation:** size > 0; visibleSize ≥ 1 and ≤ size; priceCents in [1, 99]; side valid.

**Required behaviors:**
- Inject `postOrderInvoke: (qty, side, priceCents) => Promise<orderId>`, `getOrderStatusInvoke: (orderId) => Promise<{filled: number, remaining: number}>`, `cancelOrderInvoke`, `sleepMs`, `pollIntervalMs` config (default 1000).
- After each post, poll status until filled or stopped.
- On fill, journal `iceberg_slice_filled` with `cumulativeFilled` and `slicesPosted`.
- Final slice posts `min(visibleSize, sizeRemaining)`.
- Stop in the middle of a posted slice → cancel it, journal `iceberg_stopped`, return `cumulativeFilled`.
- Journal entries: `iceberg_started`, `iceberg_slice_posted`, `iceberg_slice_filled`, `iceberg_finished` | `iceberg_stopped`.

**Tests (≥10):**
1. Validation: visibleSize > size rejected, priceCents out of range, etc.
2. Happy path: 1000 size, 50 visible → 20 slices posted sequentially.
3. Final slice: 100 size, 30 visible → slices [30, 30, 30, 10].
4. Stop mid-slice: cancel pending, return cumulative.
5. Total cumulative equals size on natural completion.
6. Side parameterization.
7. Journal: each slice has `iceberg_slice_posted` followed by `iceberg_slice_filled`.
8. visibleSize === size: single post, completes after one fill.
9. Repost happens immediately after fill detection.
10. cancelOrderInvoke called exactly once on stop.

**PR:** `feat(strategies): S13 iceberg (hidden total via single visible quote)`.

---

### Task B.5: S16 Time-to-expiry emergency unwind

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategies/sTimeEmergency.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategies/sTimeEmergency.test.ts`

**Spec:** Clock-driven escalation across four phases, where the "phase" is a function of remaining time-to-expiry rather than fill state.

**Inputs:** `{ ticker, side: 'sell', size, contractCloseEpochMs }`. Schedule keyed off `now() vs contractCloseEpochMs`:
- T-60min..T-30min → run S1 passive on remaining size
- T-30min..T-10min → run S7 scale-out on remaining size (via injected callback)
- T-10min..T-2min → run S2 aggressive
- T-2min..T-0 → cross any available bid (single IoC at `bid` regardless of `floorPriceCents`)

Engine transitions when the clock crosses a boundary AND the previous phase has returned (don't preempt mid-phase). If `now() > contractCloseEpochMs` at start, runs the T-0 sweep immediately.

**Pattern reference:** `src/strategies/sRoll.ts` for the orchestrator. `src/strategies/sStopAndReverse.ts` for sequential phase composition.

**Validation:** size > 0; side === 'sell' (S16 is sell-only); contractCloseEpochMs > 0.

**Required behaviors:**
- Inject `passiveInvoke`, `s7Invoke`, `aggressiveInvoke`, `crossAnyBidInvoke` (single IoC at top bid, no floor), `now: () => number`.
- Each phase runs to completion before checking the next clock boundary.
- After each phase, recompute `remainingSize`; if 0, halt with `time_emergency_finished`.
- If a phase ends and `now()` has already crossed the next two boundaries, skip directly to the appropriate phase (don't replay intermediate phases on already-elapsed time).
- Journal entries: `time_emergency_started`, `time_emergency_phase_entered` (with phase name + minutesToClose), `time_emergency_phase_completed` (with filled qty), `time_emergency_finished`.

**Tests (≥10):**
1. Validation: size ≤ 0, side !== 'sell', missing contractCloseEpochMs.
2. Happy path: now at T-65 → runs all 4 phases sequentially.
3. Late start: now at T-15 → starts at S2 phase (skips S1 + S7).
4. Already-expired: now > contractCloseEpochMs → single crossAnyBid only.
5. Position closed mid-S1 (filled = size) → halts before S7.
6. Phase transitions: when S1 returns and clock has reached T-12 → next is S2 (skips S7 if already past).
7. Each phase respects remainingSize from prior phase.
8. Journal ordering across all phases.
9. crossAnyBid called only when minutesToClose ≤ 2.
10. now() called at every boundary check.

**PR:** `feat(strategies): S16 time-to-expiry emergency unwind`.

---

## Phase C — Surface wiring batch (single PR)

After Phase B's 5 PRs all merge, do a single Sonnet dispatch to wire all 5 new strategies + the W3.1 safety field into the user-facing surfaces.

**Files:**
- Modify: `src/cli.ts` — add `kea strategy s-twap`, `s-pre-resolution-arb`, `s-cash-raise`, `s-iceberg`, `s-time-emergency` subcommands.
- Modify: `src/mcp.ts` — add `kea_strategy_s_twap`, `kea_strategy_s_pre_resolution_arb`, `kea_strategy_s_cash_raise`, `kea_strategy_s_iceberg`, `kea_strategy_s_time_emergency` MCP tools.
- Modify: `src/server.ts` — add `POST /strategies/s-twap`, `/s-pre-resolution-arb`, `/s-cash-raise`, `/s-iceberg`, `/s-time-emergency` routes.
- Modify: `src/safety.ts` — add optional `maxParticipationRate?: number` field with `0..1` validation.
- Modify: `test/mcp.test.ts` — update tool surface assertion (+5 names, alphabetically).
- Add tests for each new surface route mirroring `test/cli.test.ts`, `test/server.test.ts` patterns.

**Pattern reference:** PR #50 (the prior cluster's wiring batch) — same shape, same Zod schema mirroring the builder opts, same default-callback wiring approach (real `KalshiClient` as default; injectable callbacks omitted).

**Verify:** `npx tsc --noEmit && npx vitest run && npm run lint` all green.

**PR title:** `feat(surfaces): wire 5 strategies (S3/S6/S10/S13/S16) into CLI + MCP + HTTP + W3.1 safety field`.

---

## Phase D — Backlog sync

Promote the 6 stories to §7 Shipped:
- S3 TWAP — link PR
- S6 Pre-resolution arb — link PR
- S10 Cash-raise sequencer — link PR
- S13 Iceberg — link PR
- S16 Time-emergency — link PR
- W3.1 POV pacing — link PR (helper-only ship; per-strategy adoption is follow-up)

Update §0 counts: §S 8→3, §W3 1→0, shipped 29→35. Replace each removed §S/§W3 section with `_<id> shipped — see §7._` stub pointer.

PR: `chore(backlog): sync — strategy cluster 2 shipped`. Auto-merge.

---

## Cost & ordering

| Phase | Tasks | Parallelism | Wall-clock |
|---|---|---|---|
| A — W3.1 helper | A.1 | direct, single PR | ~2 hours |
| B — strategies | B.1, B.2, B.3, B.4, B.5 | 5-way parallel Sonnet | ~1 day (real) / ~3 hours (parallel) |
| C — surface wiring | one batch PR | direct or single Sonnet | ~3 hours |
| D — backlog sync | small chore PR | direct | ~15 min |

**Total: ~1 day with parallelism.**

## Verification matrix

| Concern | Verification | Phase |
|---|---|---|
| W3.1 disabled when rate=0 | unit test in participationRate.test.ts | A |
| W3.1 cap at 10× base | unit test | A |
| S3 remainder math | unit test (103/4 = [25,25,25,28]) | B |
| S3 session window pause | unit test (23:00 UTC, 09:00-17:00 window) | B |
| S6 phase 1 unfilled → phase 2 with remainder | unit test | B |
| S10 deadline halt | unit test (clock crosses deadline mid-position) | B |
| S10 strategy dispatch (passive/aggressive) | unit test per branch | B |
| S13 visibleSize cap on final slice | unit test | B |
| S13 stop cancels pending order | unit test (cancelOrderInvoke called once) | B |
| S16 late-start phase skip | unit test (start at T-15 → no S1 phase) | B |
| S16 cross-any-bid only at T-2 | unit test | B |
| Surface wiring: each strategy round-trips through CLI/MCP/HTTP | integration tests | C |
| Tool surface assertion +5 names | test/mcp.test.ts | C |
| Total test count | full suite +60 tests minimum | D |

## Open questions / explicit non-goals

1. **W3.1 per-strategy adoption** — not in this plan. Each existing loop strategy (S1, S3, S4) gets its own follow-up PR threading `recentMinuteVolume` through, since wiring requires touching the live KalshiClient `getMarket()` poll path. Helper ships first; consumers follow.
2. **S5 multi-leg / S12 market-making / S14 basis-arb** — out of scope. Bigger architectural pieces; tackle separately after this cluster.
3. **TUI surfacing for new strategies** — defer. Same rationale as prior cluster: these are one-shot runners, CLI+MCP+HTTP suffices for v1.
4. **`safety.ts` integration of `maxParticipationRate`** — only the field declaration + validation lands in Phase C. Per-runner consumption is per-strategy-PR follow-up.
5. **S16 buy-side** — explicit non-goal. S16 is sell-only by spec ("emergency unwind").
