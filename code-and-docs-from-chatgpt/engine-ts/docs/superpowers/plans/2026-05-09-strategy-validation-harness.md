# Strategy Validation Harness — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the auto-exit project into a true strategy validation engine. Close out the friction items distorting backtest results, add the live-trade safety net the MOVVA incident exposed, and ship the small-size live execution loop that ties strategies → SH-EDGE measurement → tunable parameters.

**Architecture:** Three sub-stories, sequenced for compounding value:

1. **SH-VALIDATION-BUGBASH** — five small bugs that distort backtest sweeps. Cleanup pass; everything else builds on the assumption these are fixed.
2. **SH-DEPTH-WALK-STALE-SNAPSHOT** — pre-trade liveness re-check before any sized IoC. Drops the MOVVA-style 38% projection-miss risk.
3. **SH-MICRO-EXECUTION-LOOP** — new harness: small-size live execution of a strategy on a chosen ticker, journaled as a Fire that feeds SH-EDGE. Loop runs N trials, aggregates per-strategy × market edge.

**Tech stack:** TypeScript (engine), vitest (tests), no new runtime deps. Builds on SH-WATCH (synthetics), SH-EDGE (attribution), SH-SCANNER-WS (data density), SP3 (trigger surfaces).

**Cost estimate:** ~4 days total — ~1 day sub-story 1, ~1 day sub-story 2, ~2 days sub-story 3.

**Sequencing rationale:** sub-story 1 unblocks reliable strategy comparison; sub-story 2 is a prerequisite for ANY live-trade harness (otherwise we re-run the MOVVA failure mode at smaller scale); sub-story 3 is the user-visible payoff that completes the validation infrastructure.

---

# Sub-story 1 — SH-VALIDATION-BUGBASH (~1 day)

Five small fixes. Each is independently shippable; recommended PR strategy is one PR with all five (small diffs, related theme) but they can split if any blocks.

## Task 1.1 — SH-AGGRESSIVE-CLI-FLAG-PARSING (~1.5h)

**Files:**
- Modify: `src/cli.ts` (`parseFlags` plus all `=== 'true'` sites)
- Test: `test/cli/flagParsing.test.ts` (new)

**Symptom:** `--one-tick-in true` may resolve to `false`. The 2026-05-09 MOVVA aggressive call submitted at top YES bid (no 1¢ headroom) despite passing the flag. Not a problem operationally that day (deeply-crossing IoC), but a foot-gun for strategies where the 1¢ matters.

- [ ] **Step 1: Diagnose `parseFlags`** — read `src/cli.ts` around the parser; document whether `--flag value` (space-separated) is treated as boolean-with-value or two tokens. Commit ONLY the test (red) at this stage.

- [ ] **Step 2: Write tests** covering five forms — `--flag`, `--flag=true`, `--flag true`, `--flag false`, `--flag` absent. Each should produce a deterministic, documented value.

```ts
import { parseFlags } from '../../src/cli.js';
describe('parseFlags — boolean forms', () => {
  it.each([
    [['--one-tick-in'],          { 'one-tick-in': 'true' }],
    [['--one-tick-in=true'],     { 'one-tick-in': 'true' }],
    [['--one-tick-in', 'true'],  { 'one-tick-in': 'true' }],
    [['--one-tick-in=false'],    { 'one-tick-in': 'false' }],
    [['--one-tick-in', 'false'], { 'one-tick-in': 'false' }],
    [[],                         {}],
  ])('parses %j as %j', (argv, expected) => {
    expect(parseFlags(argv)).toMatchObject(expected);
  });
});
```

- [ ] **Step 3: Pick a contract.** Two viable choices — (A) accept `--flag value` and treat it as `'value'`; (B) require `--flag=value` and reject `--flag value`. Path A is the lower-friction choice for users who are used to space-separated CLIs; A is recommended.

- [ ] **Step 4: Implement** the chosen parsing in `parseFlags`. Update every `flags['x'] === 'true'` callsite to use a small helper `boolFlag(flags, 'x', defaultValue)` that handles both forms.

```bash
grep -n "=== 'true'\|=== \"true\"" src/cli.ts
```

- [ ] **Step 5: Run tests + tsc + commit**

```bash
git add src/cli.ts test/cli/flagParsing.test.ts
git commit -m "fix(cli/SH-AGGRESSIVE-CLI-FLAG-PARSING): correct boolean flag parsing for --flag value form"
```

## Task 1.2 — SH-AGGRESSIVE-PARTIAL-SIZE (~1h)

**Files:**
- Modify: `src/backtest/adapters/aggressiveAdapter.ts:75` area
- Test: `test/backtest/adapters/aggressiveAdapter.test.ts` (extend)

**Symptom:** backtest adapter overrides `params.size` with `remainingQty` (the full position), making partial-harvest sweeps impossible to model. Live `AggressiveRunner` respects `config.size` correctly; only the adapter has the quirk.

- [ ] **Step 1: Add a failing regression test** — backtest with `initialPosition.qty=10000` and `params.size=3000`; assert filled count is 3000, not 10000.

- [ ] **Step 2: Patch adapter.** Change the size resolution to `params.size ?? remainingQty`:

```ts
// before:
const config = buildAggressiveConfig(params, remainingQty);
// after:
const requestedSize = (params.size as number | undefined) ?? remainingQty;
const config = buildAggressiveConfig({ ...params, size: requestedSize }, remainingQty);
```

(Adjust to whatever shape `buildAggressiveConfig` actually accepts — the principle is `params.size` wins when supplied.)

- [ ] **Step 3: Verify** by re-running the existing scripts/backtest-movva.mjs equivalent inputs through the adapter; result should match the custom depth-walk simulator.

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(backtest/SH-AGGRESSIVE-PARTIAL-SIZE): respect params.size in aggressive adapter"
```

## Task 1.3 — SH-PASSIVE-SPREAD-LOGIC (~3h)

**Files:**
- Modify: `src/passive.ts` (`runOneTickBacktest` spread check)
- Test: `test/passive-runtick-backtest.test.ts` (extend)

**Symptom:** passive's `bestBidCents = 100 - noAsks[0].priceCents` collapses against `bestAskCents` on one-sided / thin no-side books, firing `spread_too_tight` on tick 1. The strategy never posts a single order on otherwise-fillable yes-side liquidity. Aggressive fills on the same recordings, so the issue is squarely in passive's spread check.

- [ ] **Step 1: Pick the fix path.** Three options were filed:

| Path | Pros | Cons |
|---|---|---|
| (a) when no-side empty/thin, derive bid from highest yes level | works on any non-degenerate book | invents a synthetic spread — could over-post |
| (b) `minSpreadCents = 0` config knob with `walkStepCents = 0` | explicit operator override | requires manual tuning per market |
| (c) skip spread check on the FIRST tick (before any order posted) | minimal change; preserves stop-loop semantics | doesn't fix later ticks if book stays one-sided |

**Recommendation: (a) + (c) together.** Path (a) is correct on dense one-sided books (KXINXU); path (c) is correct for "let me at least try once" markets. Both are small.

- [ ] **Step 2: Write tests.** Use a fixture orderbook from the KXINXU recording (yes side = `[14, 34, 35, 37, 47, 48, 50, 51, 52, 55]`, no side empty). Assert passive posts at least one order on tick 1 instead of break-looping.

- [ ] **Step 3: Implement** path (a): when `noAsks.length === 0` or `noAsks[0].size < minLevelSize`, set `bestBidCents = highestYesLevel`. Implement path (c): on tick 1 (no `pendingOrderId` yet), skip the spread check entirely; log the decision.

- [ ] **Step 4: Re-run sweep** against KXINXU-5566 recording; confirm fill_count > 0.

- [ ] **Step 5: Commit**

```bash
git commit -m "fix(passive/SH-PASSIVE-SPREAD-LOGIC): derive bid from yes side when no side empty; skip spread check on tick 1"
```

## Task 1.4 — SH-TWAP-CADENCE-original (~2h)

**Files:**
- Modify: `src/backtest/adapters/twapAdapter.ts` (`passiveInvoke`)
- Test: `test/backtest/twapAdapter.test.ts` (new or extend)

**Symptom:** s-twap returns 0 fills in backtest because its `passiveInvoke` calls `passive.runOneTick(... dryRun: true)`. Dry-run mode simulates fills internally without calling `client.createOrder`, so the replay client's `fillLog` never sees them.

> **Note:** The BACKLOG marks SH-TWAP-CADENCE as already shipped on 2026-05-08. Verify before starting that this isn't a duplicate ticket. If shipped, this task is a no-op.

- [ ] **Step 1: Reproduce** — run `npx vitest run -t s-twap` (or the strategy comparison sweep) and confirm fill_count = 0 for s-twap on a known-fillable recording.

- [ ] **Step 2: If still broken,** drop `dryRun: true` from `passiveInvoke`. The twap adapter's per-interval invocation already carries the ONE-GTC-per-tick semantics from PR #129.

- [ ] **Step 3: Add regression test** asserting non-zero fills on a known-fillable recording.

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(backtest/SH-TWAP-CADENCE-original): drop dryRun from twap passiveInvoke (verify already shipped first)"
```

## Task 1.5 — SH-PASSIVE-SELL-LIMIT (~30min)

**Files:**
- Modify: `src/passive.ts` (rename only; functional bug already resolved)

**Symptom:** legacy variable name `bestAskCents` is misleading — actually carries a derived bid value in the modified semantics. Functional bug was fixed by SH-FILL-SIM-DIRECTIONAL; this is rename-only.

- [ ] **Step 1: Rename** `bestAskCents` → a name that reflects current semantics (likely `effectiveBidCents` or `decisionBidCents`). Keep behavior identical.

- [ ] **Step 2: Run full vitest suite** to confirm no behavior change.

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(passive/SH-PASSIVE-SELL-LIMIT): rename bestAskCents to reflect semantics"
```

## Sub-story 1 wrap-up

- [ ] **Run full test suite + tsc** — all green.
- [ ] **Open PR** "fix(strategies): SH-VALIDATION-BUGBASH — flag parsing, partial size, spread logic, twap, naming"
- [ ] **Promote five tickets to ✅** in BACKLOG.md.

---

# Sub-story 2 — SH-DEPTH-WALK-STALE-SNAPSHOT (~1 day)

Pre-trade liveness check before any sized IoC. Drops the 2026-05-09 MOVVA failure mode.

## Task 2.1 — Liveness-check primitive (~3h)

**Files:**
- Create: `src/preTradeLiveness.ts`
- Test: `test/preTradeLiveness.test.ts`

The contract: given a projection's assumptions (top-of-book bid + size), a fresh orderbook snapshot, and a tolerance config, return either `{ ok: true }` or `{ ok: false, reason, drift }`.

- [ ] **Step 1: Define the contract.**

```ts
export interface ProjectionAssumptions {
  /** Side we're SELLING into (the side whose top bid we depend on). */
  sellingSide: 'yes' | 'no';
  /** Top bid we projected against, in cents. */
  topBidCents: number;
  /** Size we expected at that level (or below). */
  expectedSize: number;
}

export interface LivenessConfig {
  /** Reject if top bid moved by more than this (default 1¢). */
  maxBidShiftCents?: number;
  /** Reject if available size at projected level shrank by more than this fraction (default 0.50). */
  maxSizeShrinkPct?: number;
}

export interface LivenessResult {
  ok: boolean;
  reason?: 'bid_shifted' | 'size_collapsed';
  observed?: { topBidCents: number; sizeAtProjectedLevel: number };
  drift?: { bidCents: number; sizeShrinkPct: number };
}

export function checkLiveness(
  assumptions: ProjectionAssumptions,
  freshBook: Orderbook,
  config?: LivenessConfig,
): LivenessResult;
```

- [ ] **Step 2: Tests** — fixtures covering: (a) book unchanged → ok; (b) bid shifted ≥1¢ → bid_shifted; (c) size at projected level dropped >50% → size_collapsed; (d) bid shifted within tolerance + size healthy → ok.

- [ ] **Step 3: Implement** — pure function over Orderbook. Should be ~30 lines.

- [ ] **Step 4: Run tests + commit**

```bash
git commit -m "feat(safety/SH-DEPTH-WALK-2.1): pre-trade liveness primitive"
```

## Task 2.2 — Wire into AggressiveRunner (~2h)

**Files:**
- Modify: `src/aggressive.ts` (`run` method — add liveness check before `createOrder`)
- Test: `test/aggressive.test.ts` (extend with stale-book scenario)

- [ ] **Step 1: Add config knob** to `AggressiveConfig`:

```ts
livenessCheck?: {
  enabled: boolean;        // default true for size > N contracts
  maxBidShiftCents?: number;
  maxSizeShrinkPct?: number;
};
```

- [ ] **Step 2: Add the call site.** Immediately before `createOrder`, fetch a fresh orderbook (NOT the one used for projection), call `checkLiveness`, and reject loudly if the result is non-ok. Log the rejection reason + observed drift.

```ts
if (this.config.livenessCheck?.enabled !== false && this.config.size >= LIVENESS_GATE_SIZE) {
  const fresh = await this.client.getOrderbook(this.config.ticker, depth);
  const result = checkLiveness(/* derived from initial book */, fresh, this.config.livenessCheck);
  if (!result.ok) {
    this.journal?.append('aggressive_liveness_rejected', { reason: result.reason, drift: result.drift });
    throw new Error(`Pre-trade liveness check failed: ${result.reason} (${JSON.stringify(result.drift)})`);
  }
}
```

`LIVENESS_GATE_SIZE` default 100 contracts (a knob — small trades skip the check, large trades opt in by default).

- [ ] **Step 3: Tests** — replay the MOVVA scenario in fixture form: project against a 12,000-contract bid at 93¢; supply a fresh book where that level vanished; assert the runner throws with reason `size_collapsed` and the journal records the rejection.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(aggressive/SH-DEPTH-WALK-2.2): pre-trade liveness check before sized IoCs"
```

## Task 2.3 — Harvest-planner risk note (~2h)

**Files:**
- Modify: `src/harvestPlanner.ts` (add risk-note output)
- Test: `test/harvestPlanner.test.ts` (extend)

**Spec §4 of the SH-DEPTH-WALK ticket:** if a projection depends on a single fat top-of-book bid (>5× the avg level size in the depth window), surface that as a risk note in the operator-facing output.

- [ ] **Step 1: Detection** — after building the depth-walk projection, compare the top level's size to the mean size of the next N levels. If `topSize / meanRest > 5.0`, flag.

- [ ] **Step 2: Output** — add a `riskNotes: string[]` field to the planner result. Populate with concrete language: `"Projection assumes ${size}-contract bid at ${cents}¢ persists to execution; this depth may be pulled with no warning (see SH-DEPTH-WALK-STALE-SNAPSHOT)."`

- [ ] **Step 3: Tests** — fixture with a fat top + thin rest → riskNotes non-empty; fixture with even depth → riskNotes empty.

- [ ] **Step 4: Surface in CLI** — `kea harvest-plan` (or whatever the entry point is) prints the notes.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(planner/SH-DEPTH-WALK-2.3): risk-note output for fat-top-of-book projections"
```

## Sub-story 2 wrap-up

- [ ] **Open PR** "feat(safety): SH-DEPTH-WALK-STALE-SNAPSHOT — pre-trade liveness check + planner risk notes"
- [ ] **Promote SH-DEPTH-WALK-STALE-SNAPSHOT to ✅** with the shipped block.
- [ ] **Note in the runbook** (`engine-ts/docs/runbooks/2026-05-09-staleness-investigation.md`) — append a "fix shipped 2026-XX-XX" section with PR link.

---

# Sub-story 3 — SH-MICRO-EXECUTION-LOOP (~2 days)

The user-visible payoff. Small-size live execution of a strategy on a chosen ticker, journaled as a Fire that feeds SH-EDGE.

## Pre-flight design questions (RESOLVE BEFORE TASK 3.1)

These shape the API. Surface to the user; default below.

1. **Trial granularity.** Each "trial" = one full strategy run on one ticker (entry + exit, journaled), or = one entry decision and let the existing exit-runner / synthetic-watcher exit it later? **Default: full strategy run.** Cleaner attribution, simpler harness. Operator can always run the existing exitRunner separately if they want a half-trial.

2. **Size cap.** The harness must enforce a per-trial USD cap AND a daily aggregate cap. **Operator decision (2026-05-09): per-trial cap range $0.10–$1.00, daily aggregate cap $2.50.** Default config ships with `perTrialCapDollars: 1.00, dailyAggregateCapDollars: 2.50` — operator can lower further per-run via `--max-notional`. Gate via the existing safety.json mechanism.

3. **Confirmation gating.** Every trial confirms before submission, OR after the first 3 trials on a strategy×market combo the harness auto-confirms? **Operator decision: ALWAYS prompt for live testing — real spend, no auto-confirm flag, ever.** No `--confirm-yes` escape hatch. Sweeps step through one trial at a time with operator-in-the-loop.

4. **What strategies are eligible?** All shipped strategies (s-passive, s-aggressive, s-trail, s-twap, s-auto), or a curated subset for v1? **Default: all shipped, but s-aggressive defaults to `confirmedAggressive: true` only after the operator passes a per-trial confirmation flag.**

If the user disagrees with any of these, re-scope before starting.

## Task 3.1 — Trial config + safety gating (~3h)

**Files:**
- Create: `src/microHarness/trial.ts` (config + types)
- Modify: `src/safety.ts` (add per-trial-cap + daily-aggregate-cap fields)
- Test: `test/microHarness/trial.test.ts`

- [ ] **Step 1: Types**

```ts
export interface MicroTrialConfig {
  ticker: string;
  side: 'yes' | 'no';
  strategy: 's-passive' | 's-aggressive' | 's-trail' | 's-twap' | 's-auto';
  /** Cap on the trial's notional ($); enforced pre-trade. */
  maxNotionalDollars: number;
  /** Strategy-specific params (forwarded to the runner). */
  params: Record<string, unknown>;
  /** Operator's intent message — included in journal for SH-EDGE attribution. */
  intent: string;
  /** Trial id; stable across the lifecycle. */
  trialId: string;
}

export interface MicroTrialResult {
  trialId: string;
  ticker: string;
  strategy: string;
  startedAt: string;
  finishedAt?: string;
  status: 'pending' | 'running' | 'complete' | 'rejected' | 'failed';
  rejectReason?: string;
  // Embedded Fire (post-execution) for downstream attribution
  fireId?: string;
}
```

- [ ] **Step 2: Safety integration.** Extend `safety.json` schema:

```jsonc
{
  "microHarness": {
    "perTrialCapDollars": 1.00,
    "dailyAggregateCapDollars": 2.50,
    "tickerAllowlist": ["KXBTC*", "KXETH*", "KXNFL*"]   // glob patterns
  }
}
```

The harness reads these on startup; rejects trials that violate.

- [ ] **Step 3: Tests** — config validation; cap enforcement (per-trial + daily aggregate); ticker-allowlist glob matching.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(harness/SH-MICRO-3.1): trial config + safety gating"
```

## Task 3.2 — Trial runner (~4h)

**Files:**
- Create: `src/microHarness/runner.ts`
- Test: `test/microHarness/runner.test.ts`

- [ ] **Step 1: Implement `runTrial(config, deps): Promise<MicroTrialResult>`** — orchestrates the lifecycle:

```ts
async function runTrial(config: MicroTrialConfig, deps: TrialDeps): Promise<MicroTrialResult> {
  // 1. Pre-flight: safety check (caps, allowlist, daily aggregate)
  // 2. Pre-flight: liveness check (uses Sub-story 2's primitive)
  // 3. Confirm with operator (TTY prompt or non-interactive flag)
  // 4. Open journal with trialId; append 'micro_trial_started' entry
  // 5. Dispatch to the strategy runner (re-uses existing s-* code paths)
  // 6. Wait for completion / timeout
  // 7. Append 'micro_trial_finished' with outcome
  // 8. Return result
}
```

- [ ] **Step 2: Confirmation flow.** TTY prompt is MANDATORY for every trial — no skip flag, no auto-confirm. The harness rejects if `process.stdin.isTTY === false` (non-interactive runs are not allowed for live trials). This is a hard rule, not a default.

- [ ] **Step 3: Tests** — mock the strategy runner; assert: rejected when over per-trial cap; rejected when daily aggregate exceeded; happy path produces a Fire-shaped journal that SH-EDGE's `joinFires` can consume.

- [ ] **Step 4: Live smoke** — run ONE micro-trial against a real ticker, **$0.10 notional** (the lowest end of the operator-approved range), interactive TTY confirmation. Verify journal entry appears in `${KEA_HOME}/jobs/`.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(harness/SH-MICRO-3.2): single-trial runner"
```

## Task 3.3 — Sweep harness (~3h)

**Files:**
- Create: `src/microHarness/sweep.ts`
- Test: `test/microHarness/sweep.test.ts`

- [ ] **Step 1: Implement `runSweep(plan, deps): Promise<MicroTrialResult[]>`** — runs N trials sequentially per (strategy × ticker × params) cell. Each trial respects all safety gates. Pauses between trials (configurable, default 30s) to let the watcher journal flush + the market re-equilibrate.

- [ ] **Step 2: Plan format**

```ts
export interface SweepPlan {
  cells: Array<{
    strategy: string;
    ticker: string;
    params: Record<string, unknown>;
    trialsPerCell: number;       // e.g. 5
  }>;
  perTrialDelayMs: number;       // default 30_000
  maxNotionalDollars: number;    // per-trial cap, must be ≤ safety.perTrialCap
}
```

- [ ] **Step 3: Tests** — mocked runner; assert N trials per cell; assert delay between trials; assert sweep aborts cleanly if any trial fails the safety gate.

- [ ] **Step 4: Aggregator** — at end of sweep, call `generateSnapshot` (from SH-EDGE pipeline) over the new journal entries; print the per-cell edge breakdown to stdout. Reuses everything that shipped today; no new attribution code needed.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(harness/SH-MICRO-3.3): sweep harness over (strategy × ticker × params) cells"
```

## Task 3.4 — CLI surface (~2h)

**Files:**
- Modify: `src/cli.ts` (new `kea micro` subcommand)
- Test: `test/cli/micro.test.ts`

- [ ] **Step 1: `kea micro trial`** — single-trial form. Args: `--ticker`, `--side`, `--strategy`, `--max-notional`, `--params <jsonOrFile>`, `--intent <message>`. Runs `runTrial` end-to-end, prints the Fire summary.

- [ ] **Step 2: `kea micro sweep`** — sweep form. Args: `--plan <jsonFile>`. Runs `runSweep` end-to-end, prints the per-cell edge breakdown at the end.

- [ ] **Step 3: `kea micro status`** — read-only summary of recent trials (last 24h) joined with their attribution from SH-EDGE.

- [ ] **Step 4: Tests** — argv parsing + dispatch (mock the runner).

- [ ] **Step 5: Live smoke** — `kea micro trial --ticker KXBTC-... --side yes --strategy s-passive --max-notional 1 --intent "validation smoke"` against a real ticker. Inspect journal + run `kea edge --since today` to verify the new Fire shows up.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(cli/SH-MICRO-3.4): kea micro {trial|sweep|status} subcommands"
```

## Task 3.5 — Documentation + integration (~2h)

- [ ] **Step 1: Runbook** — `engine-ts/docs/runbooks/2026-XX-XX-micro-execution-loop.md`:
  - When to use the harness (and when NOT — never on a position you actively hold)
  - Recommended per-trial cap and how to set it
  - Reading sweep results: how to interpret the SH-EDGE breakdown for tuning trigger params
  - Rollback / kill-switch (delete `safety.json:microHarness` to disable globally)

- [ ] **Step 2: Worked example** — pick one strategy × ticker pair, plan a 5-trial sweep ($5/trial = $25 total exposure), run it, write up the result in the runbook (results table + interpretation).

- [ ] **Step 3: Update README** — short note pointing at the runbook + `kea micro --help`.

- [ ] **Step 4: Commit + open PR**

## Sub-story 3 wrap-up

- [ ] **Open PR** "feat(harness): SH-MICRO-EXECUTION-LOOP — small-size live execution + sweep + SH-EDGE integration"
- [ ] **File SH-MICRO-EXECUTION-LOOP in BACKLOG.md** as ✅ shipped with PR ref.
- [ ] **Smoke-validate end-to-end** by running a real 3-trial sweep and confirming `kea edge --strategy s-passive --since today` shows the new fires.

---

## Out of scope (defer to a v2 plan)

- **Auto-tuning recommendation** — once the harness produces enough trials, a tuner could suggest "raise trailCents from 5 to 7 based on 12 trials, +$8 edge." Belongs in SH-EDGE v2.
- **Multi-strategy concurrent sweeps** — v1 is sequential. Concurrency adds market-impact risk that's out of scope.
- **Auto-suspension of strategies** — if a strategy's edge stays negative for N trials, auto-disable. v2.
- **Per-operator private-p calibration** — uses sweep results to calibrate operator's market p. v2.
- **Web dashboard for sweep results** — v1 is CLI-only.

## Self-review

- ✅ Sub-story sequencing matches the value chain (cleanup → safety → new infrastructure).
- ✅ Each task names files, code patterns, tests, smoke validation.
- ✅ Tasks decomposed to ≤4h each; cluster total ~32h ≈ 4 days at sustained focus.
- ✅ Out of scope is opinionated and leaves obvious v2 hooks.
- ✅ Pre-flight design-question section gates Sub-story 3 on operator alignment.
- ⚠️ Task 3.2's live smoke is the highest-risk step — first time real money runs through `runTrial`. Mitigation: $0.10–$1 cap (operator-approved range), MANDATORY TTY confirmation per trial (no skip flag), $2.50 daily aggregate ceiling, signal-handlers for clean abort.
- ⚠️ Task 1.4 (s-twap) may already be shipped (SH-TWAP-CADENCE in §7); verify on Step 1 before re-writing it. If shipped, mark task complete and move on.
