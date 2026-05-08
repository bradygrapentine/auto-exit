# Auto Follow-ups Cluster — Implementation Plan

**Goal:** Resolve the three v8 follow-ups (SH-AUTO-USE-CASES, SH-SLOW-EXECUTION-STRATEGY, SH-REAL-MULTIREGIME-RECORDING) with one experimental endpoint: prove or disprove that rolling re-classify earns its keep when given (a) a genuinely slow strategy and (b) recordings with real mid-recording regime transitions.

**Predecessors:** v8 runbook (`2026-05-08-multiregime-v8.md`).

**Architecture:** Three tasks. Task 1 ships docs. Tasks 2 + 3 are independent prep work. Task 4 is a v9 sweep that combines them and produces the final auto verdict.

**Decision criterion (carried forward from v8):** if rolling re-classify (rci > 0) produces ≥5% lift over single-shot (rci=0) on at least one cell of the v9 sweep — keep auto's rolling machinery as a documented opt-in. If still 0% lift across all cells, mark the rolling code as deprecated/experimental and remove it from default param suggestions.

---

# Task 1 — SH-AUTO-USE-CASES (~30min)

**Files:**
- Modify: `code-and-docs-from-chatgpt/README.md` — extend the "Recommended baseline exit strategy" section with a sub-section on when to opt into `auto`.

**Approach:** Document the v8-validated narrow scenarios where opting into `auto` makes sense. Pure docs change.

- [ ] **Step 1: Read the current README "Recommended baseline" section** to understand its phrasing.

- [ ] **Step 2: Append a sub-section** after the existing recommendation. Content:

```markdown
### When to opt into `auto`

The `auto` strategy (regime-aware, with optional rolling re-classification) was evaluated against the same recording set + synthesized multi-regime variants. Findings:

- **Average lift over `trailing_stop trailCents=10`: +0.6%** — within noise. Not worth choosing as a default.
- **+6.7% lift on rising→falling and rising→sideways→falling** synthetic recordings, where auto's first-tick classification picks `s-passive` (sideways) and captures slow upward drift before the reversal.
- **Rolling re-classification (`reclassifyInterval > 0`) currently adds zero** — the chosen inner strategies fill before mid-recording switching can take effect. Rolling machinery is preserved for future scenarios with slow-execution strategies (see SH-SLOW-EXECUTION-STRATEGY).

**Use `auto` when:** you expect the position's first ~200 ticks to be a slow upward drift that will reverse later. The agent's choice; not the default.

**Use `trailing_stop trailCents=10` otherwise.** This is the engine's recommended baseline.
```

- [ ] **Step 3: Verify markdown rendering locally** (open the README in any markdown viewer). No tests needed — pure docs.

- [ ] **Step 4: Commit alongside Tasks 2-4 in the same cluster PR.** No separate ship.

---

# Task 2 — SH-REAL-MULTIREGIME-RECORDING (~1-1.5h)

**Files:**
- Modify: `scripts/recording-catalog.mjs` — extend the existing scanner to detect mid-recording regime flips.
- Output (regenerable): `docs/runbooks/2026-05-08-multiregime-discovery.md` — list of recordings (if any) with real mid-recording regime transitions.

**Approach:** Scan all 89 recordings looking for V-shapes, ∧-shapes, or any "rolling-window direction flip" pattern. For each recording, slide a 200-tick rolling window through the snapshots; at each window position, classify the regime. If two non-adjacent positions have opposing direction labels (e.g. rising at 25%-mark, falling at 75%-mark), the recording has a real regime flip.

Output the top candidates as a runbook table for v9's recording set.

- [ ] **Step 1: Extend recording-catalog.mjs**

Read the existing script. For each recording, after the existing summary, run a "rolling regime" pass:

```js
async function detectRegimeFlips(file, windowSize = 200, stride = 100) {
  const snapshots = []; // accumulate as we read
  const rl = readline.createInterface({ input: fs.createReadStream(...), crlfDelay: Infinity });
  for await (const line of rl) {
    // ... parse snapshot, push to snapshots[]
  }
  if (snapshots.length < windowSize * 2) return { hasFlip: false, regimes: [] };
  const regimes = [];
  for (let i = 0; i + windowSize <= snapshots.length; i += stride) {
    const slice = snapshots.slice(i, i + windowSize);
    regimes.push({ atSnapshot: i, regime: detectRegime(slice) });
  }
  // Scan for flips: any rising→falling or falling→rising adjacent transition counts.
  const directional = regimes.filter(r => r.regime === 'rising' || r.regime === 'falling');
  let hasFlip = false;
  for (let i = 1; i < directional.length; i++) {
    if (directional[i].regime !== directional[i-1].regime) { hasFlip = true; break; }
  }
  return { hasFlip, regimes };
}
```

Add the result to each recording's catalog row: `flipDetected: bool`, `regimeSequence: 'rising→falling→rising'`-style summary.

- [ ] **Step 2: Re-run the catalog**

```bash
node scripts/recording-catalog.mjs > docs/runbooks/2026-05-08-recording-catalog-v2.md
```

- [ ] **Step 3: Inspect**

Filter for `flipDetected: true`. If ≥1 found → use them in v9 (Task 4). If 0 found → document the negative result in the discovery runbook and proceed with v8's synthetic seams.

- [ ] **Step 4: Write a small discovery note**

If recordings with flips were found: list them, note their regime sequence, and which ones to use in v9.
If none found: explicitly state "no real multi-regime recordings exist in the current scrape; v9 will use synthetic seams (with the v8 caveat)" and propose:
- Capturing during a known event window (FOMC, earnings) when markets typically reverse.
- Extending recording duration via the scanner.

These options are infrastructure work; defer.

---

# Task 3 — SH-SLOW-EXECUTION-STRATEGY (~1.5h)

**Files:**
- Modify: `src/backtest/adapters/autoAdapter.ts` — change the sideways→s-passive mapping to use much smaller chunks + slower walk so it genuinely takes 1000+ ticks to fill a 100-share position.
- Optionally create: `test/backtest/autoAdapter.slowExecution.test.ts` — assert auto in sideways regime invokes s-passive with the slow params.

**Approach:** No new strategy needed; just reconfigure auto's per-regime mapping. Currently:

```ts
case 'sideways':
  inner = makePassiveAdapter({ ...params, chunkSize: 100, walkStepCents: 1 });
```

Change to:

```ts
case 'sideways':
  inner = makePassiveAdapter({ ...params, chunkSize: 2, walkStepCents: 1 });
```

`chunkSize: 2` means the GTC posts 2 contracts at a time instead of the full 100. Filling 100 contracts takes 50 GTC posts. Each post lives for some ticks before walking. So total execution should span hundreds-to-thousands of ticks. Plenty of room for rolling re-classify to fire.

Same change applied at instantiation time at line ~55 of autoAdapter.ts and again in the rolling-reclass `makeInnerForRegime` helper.

- [ ] **Step 1: Inspect autoAdapter.ts**

```bash
grep -n "chunkSize\|makePassiveAdapter" src/backtest/adapters/autoAdapter.ts
```

There should be two callsites for s-passive (initial classification + rolling re-classify path via `makeInnerForRegime`). Both need the chunk update.

- [ ] **Step 2: Apply the change**

In the `makeInnerForRegime` helper (added in v7's rolling re-classify), change:

```ts
case 'sideways':
  return { inner: makePassiveAdapter({ ...params, chunkSize: 100, walkStepCents: 1 }), label: 's-passive' };
```

to:

```ts
case 'sideways':
  // SH-SLOW-EXECUTION-STRATEGY: tiny chunks force the GTC walk to span
  // hundreds of ticks, giving rolling re-classify room to fire.
  return { inner: makePassiveAdapter({ ...params, chunkSize: 2, walkStepCents: 1 }), label: 's-passive-slow' };
```

Update the `chosenStrategy` label to `'s-passive-slow'` so the runbook can distinguish.

- [ ] **Step 3: Verify existing autoAdapter tests still pass**

The existing tests use small fixtures (3-7 ticks). With chunkSize=2 the strategy will likely not fill the full 100 in those tests. Tests should still pass since they assert `chosenStrategy`, not fill counts. Run:

```bash
npx vitest run test/backtest/autoAdapter.test.ts
```

If anything fails, the test was asserting fill state — adjust to use chunkSize=100 explicitly or switch to a behavior assertion.

- [ ] **Step 4: Add a test verifying the slow chunkSize**

```ts
it('SH-SLOW-EXECUTION-STRATEGY: sideways regime uses chunkSize=2 (slow walk)', async () => {
  // Run a sideways window and confirm the inner adapter received chunkSize=2.
  // (Easiest: spy on makePassiveAdapter via partial mock, or check the s-passive
  // adapter's resulting behavior — but the simplest is to just assert
  // chosenStrategy === 's-passive-slow' which is the explicit label change.)
});
```

- [ ] **Step 5: Run the full suite + tsc**

```bash
npx vitest run
npx tsc --noEmit
```

- [ ] **Step 6: Commit alongside Tasks 1, 2, 4 in the cluster PR.**

---

# Task 4 — v9 sweep (final auto verdict) (~30-45min)

**Files:**
- Create: `scripts/strategy-sweep-v9.mjs` — copy v8 + select the recording set based on Task 2's result.
- Create: `docs/runbooks/2026-05-08-strategy-comparison-v9.md` — final verdict.

**Approach:** Run auto with rci ∈ {0, 100, 300, 500} on whichever recording set Task 2 produced. With Task 3's slow execution, rolling re-classify finally has room to fire mid-execution. If it produces ≥5% lift, ship the rolling machinery. Else, deprecate it.

- [ ] **Step 1: Decide the recording set based on Task 2**

If Task 2 found real multi-regime recordings: use them (best — replaces synthetic seams).
If Task 2 found none: re-use v8's 4 synthesized recordings, with a clear caveat in the runbook.

- [ ] **Step 2: Build v9 sweep script**

```bash
cp scripts/strategy-sweep-v8.mjs scripts/strategy-sweep-v9.mjs
```

In v9:
- Update RECORDINGS to Task 2's set (or v8's synthetic set with caveat).
- Strategy grid: just trailing_stop trailCents=10 (baseline) + auto with `reclassifyInterval ∈ {0, 100, 300, 500}, hysteresisTicks: 3`.
- Cell budget: 5 strategies × N recordings = 5×4 = 20 if using v8's 4. Trivial.

- [ ] **Step 3: Build + run**

```bash
npm run build
node scripts/strategy-sweep-v9.mjs > /tmp/sweep-v9.md 2> /tmp/sweep-v9.err
```

- [ ] **Step 4: Apply the decision criterion**

For each recording:
- best non-zero rci pnl − rci=0 pnl, divided by rci=0 pnl
- if any recording shows ≥5% lift → rolling re-classify earns its keep

- [ ] **Step 5: Write v9 runbook**

`docs/runbooks/2026-05-08-strategy-comparison-v9.md`. Sections:
- **Setup**: recording set + why; Task 3's slow strategy.
- **Per-recording table**: trailing_stop pnl, auto rci=0/100/300/500 pnls, lift%.
- **Verdict** (per criterion):
  - 🟢 Rolling earns keep — document the trigger conditions, keep machinery.
  - 🔴 Rolling deprecated — mark `reclassifyInterval` as `@deprecated` in JSDoc, remove from auto's recommended params, simplify autoAdapter to single-shot only in a follow-up.
- **Filed follow-ups** (if any).

- [ ] **Step 6: Commit + PR for the whole cluster**

One PR contains all four tasks. Suggest squash-merge.

---

## Out of scope

- New strategies (other than tuning s-passive's chunk size).
- Live capture of new recordings — infrastructure work; defer.
- ADR / architectural docs — runbook + README are sufficient.
- Tuning Task 3's chunk size beyond 2 — pick one value, measure, decide.
- Calibrating proportional thresholds (still filed as SH-PROPORTIONAL-THRESHOLD-RECAL).

---

## Self-review

- ✅ Task 1 ships immediate value (docs); Tasks 2 + 3 prep for Task 4's verdict.
- ✅ Decision criterion is explicit (≥5% lift) and consistent with v8.
- ✅ Tasks 2 + 3 are independent (different files); could parallelize.
- ✅ If Task 2 finds nothing real, plan still ships v9 with the caveat — doesn't block on infrastructure.
- ✅ Total scope ~3-4h.
- ✅ Task 3 is a 1-line config change; minimal blast radius.
- ✅ Out-of-scope is opinionated; no temptation to drift into more regime tuning.
