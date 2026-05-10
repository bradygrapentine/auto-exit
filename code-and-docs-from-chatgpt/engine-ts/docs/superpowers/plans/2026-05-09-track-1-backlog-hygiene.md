# Track 1 — Backlog hygiene reconciliation

> **For agentic workers:** This is a documentation-only reconciliation. No code changes. Use the `backlog-sync` skill if available; otherwise follow the steps below.

**Goal:** Bring `code-and-docs-from-chatgpt/docs/BACKLOG.md` back in sync with what's actually merged on `main`. The §0 status board's counts are wrong; three story rows are 🧊 (open) but the work has shipped.

**Architecture:** Pure file edits to `BACKLOG.md`. Each affected story:
1. Gets a new inline `### ✅` shipped block above its existing 🧊 body (mirrors the established pattern at `BACKLOG.md` line ~535 / ~605 / ~631 / ~722).
2. Gets a corresponding `- **YYYY-MM-DD — STORY-ID — one-line summary.**` bullet in §7 (the chronological shipped log starting at `BACKLOG.md:1134`).
3. The §0 status-board "Shipped (this log)" count maps to §7 bullets, NOT to inline ✅ headings — verified during plan review by counting (10 inline ✅ headings vs 65 §7 bullets vs §0 board says 75; the 75 derives from §7 bullet count + un-bulletted prior promotions). The recount in Task 1.5 derives from the actual post-edit §7 bullet count.

**Tech stack:** Markdown only.

---

## Stale rows (verified against `git log origin/main`)

| Story | Status in BACKLOG | Reality on main |
|---|---|---|
| `SH-DEPTH-WALK-STALE-SNAPSHOT` (line ~423) | 🧊 | Shipped via PR #164 (`feat/sh-depth-walk-liveness`) — pure liveness primitive + AggressiveRunner gate + harvest-planner risk notes + runbook. |
| `SH-AGGRESSIVE-CLI-FLAG-PARSING` (line ~525) | 🧊 | Already fixed by PR #163's `boolFlag` helper (`cli.ts`), with 18 tests in `test/cli/flagParsing.test.ts`. |
| `SH-AGGRESSIVE-PARTIAL-SIZE` (line ~600) | 🧊 | Already fixed by PR #163's `effectiveSize = Math.min(requested, remainingQty)` in `aggressiveAdapter.ts`. |

The §0 status board currently reads:

```
| 🧊 Tooling ecosystem (SH) | 4 |
| ✅ Shipped (this log)     | 75 |
```

**Counting convention (locked during plan review):**
- "🧊 Tooling ecosystem (SH)" counts SH-tagged rows in §1–§6 whose heading starts with `### 🧊` AND that don't have a corresponding `### ✅` heading immediately above them. 🟢 rows like `SH-MICRO-LIVE-SMOKE` (added in `chore/sh-micro-followup`) are NOT counted in 🧊 — they roll into a separate "Ready" line if the board has one, or are visible-but-untallied otherwise. (Inspect §0 to confirm before relying on this; if the board has no Ready line, leave SH-MICRO-LIVE-SMOKE out of the 🧊 count and add a one-time note in the "Last sync" comment.)
- "✅ Shipped (this log)" counts §7 bullets (the chronological shipped log).

**Numbering drift acknowledged:** the current §0 board reports `Shipped (this log) | 75`, but a raw count of §7 bullets returns 65 (verified `awk` on file at SHA 523dc47). The 10-bullet gap is pre-existing drift — the §0 number is *not* a reliable baseline. **Do NOT do delta math** on top of 75; **always do a clean recount on the post-edit file** and put whatever the awk returns into the table. The PR description should call out the drift so the operator sees the fix.

Expected post-edit counts (subject to the actual recount):
- 🧊 Tooling ecosystem (SH): drops by 3 (DEPTH-WALK + AGGRESSIVE-CLI + AGGRESSIVE-PARTIAL all promoted to ✅).
- ✅ Shipped (this log): rises by 3 (the three new §7 bullets added in Task 1.5). Whether the absolute number lands at 68 (= 65 + 3, the awk-correct count) or 78 (= 75 + 3, the prior-board-correct count) depends on whether the operator wants the §0 board to track the awk count or preserve its prior offset. **Default: track the awk count** — single source of truth.

The remaining open 🧊 SH row is the `SH-PASSIVE-SPREAD-LOGIC` engine-side passive bug (line ~744), which is the only SH 🧊 row not already shipped. (Spot-check by re-grepping §1–§6 for `^### 🧊 SH` headings and excluding any that have `^### ✅ ` immediately above.)

---

## Task 1.1 — Verify the three rows are actually shipped (~10 min)

**Files:** none — read-only.

- [ ] **Step 1: Confirm PR #164 merged.**
  ```sh
  gh pr view 164 --json state,mergedAt --jq '.state, .mergedAt'
  ```
  Expected: `MERGED` with a recent timestamp.

- [ ] **Step 2: Confirm `boolFlag` exists.**
  ```sh
  grep -n "export function boolFlag" code-and-docs-from-chatgpt/engine-ts/src/cli.ts
  ```
  Expected: a single line export.

- [ ] **Step 3: Confirm `aggressiveAdapter` honors `params.size`.**
  ```sh
  grep -n "effectiveSize\|params\['size'\]" code-and-docs-from-chatgpt/engine-ts/src/backtest/adapters/aggressiveAdapter.ts
  ```
  Expected: a `Math.min(requested, remainingQty)` line.

If any of these *don't* match expectations, STOP — the reconciliation is wrong, escalate.

## Task 1.2 — Promote SH-DEPTH-WALK-STALE-SNAPSHOT (~5 min)

**Files:**
- Modify: `code-and-docs-from-chatgpt/docs/BACKLOG.md` (line ~423 region).

- [ ] **Step 1: Locate the heading**
  ```sh
  grep -n "^### 🧊 SH-DEPTH-WALK-STALE-SNAPSHOT" code-and-docs-from-chatgpt/docs/BACKLOG.md
  ```

- [ ] **Step 2: Insert a shipped block above the existing 🧊 row** (do NOT delete the original — this matches the established pattern in BACKLOG.md, e.g. `SH-AGGRESSIVE-FLOAT-CENTS` at line ~535):

  ````markdown
  ### ✅ SH-DEPTH-WALK-STALE-SNAPSHOT — shipped 2026-05-09 (PR #164)
  **Tags:** engine [pricing-model] [critical]

  Shipped on `feat/sh-depth-walk-liveness`. Three components:
  1. **Pure `checkLiveness` primitive** (`src/preTradeLiveness.ts`) — projection vs fresh book; rejects with `bid_shifted` / `size_collapsed` / `side_empty` and the specific drift. Defaults: max 1¢ bid shift, max 50% size shrink. No I/O.
  2. **AggressiveRunner gate** — for trades >= `livenessGateSize` (default 100 contracts), the runner re-fetches the orderbook between projection and `createOrder`, journals `aggressive_liveness_rejected`, and breaks the loop with `reason: 'liveness_rejected:<reason>'`. Operators can pre-supply `livenessAssumptions` or opt out via `livenessCheckEnabled: false`.
  3. **Harvest-planner risk notes** — `HarvestPlannerOutput.riskNotes` flags fat top-of-book (`topSize / meanRest > 5×` over the next 4 levels, or single-level book). Surfaced in the harvest-plan CLI under "Risk notes".

  MOVVA-replay test in `test/aggressive.test.ts` confirms the runner aborts before `createOrder` when the projected level vanishes. Runbook updated with a fix-shipped section.

  (Original ticket below for history.)
  ````

- [ ] **Step 3: Verify line numbers don't shift the next sed pass.** No commit yet — keep edits batched until Task 1.5.

## Task 1.3 — Promote SH-AGGRESSIVE-CLI-FLAG-PARSING (~5 min)

**Files:**
- Modify: `code-and-docs-from-chatgpt/docs/BACKLOG.md` (line ~525 region — the line shifts after Task 1.2's insertion; re-grep to find).

- [ ] **Step 1: Locate**
  ```sh
  grep -n "^### 🧊 SH-AGGRESSIVE-CLI-FLAG-PARSING" code-and-docs-from-chatgpt/docs/BACKLOG.md
  ```

- [ ] **Step 2: Insert above the 🧊 row**:

  ```markdown
  ### ✅ SH-AGGRESSIVE-CLI-FLAG-PARSING — shipped 2026-05-09 (PR #163)
  **Tags:** engine [cli]

  Shipped via the SH-VALIDATION-BUGBASH cluster. `parseFlags` (`src/cli.ts`) now correctly handles all three boolean forms — `--flag`, `--flag=value`, `--flag value` — and a new `boolFlag(flags, key, default)` helper accepts `true|false|1|0|yes|no` (case-insensitive). Five callsites migrated. 18-test pin in `test/cli/flagParsing.test.ts`.

  (Original ticket below for history.)
  ```

## Task 1.4 — Promote SH-AGGRESSIVE-PARTIAL-SIZE (~5 min)

**Files:**
- Modify: `code-and-docs-from-chatgpt/docs/BACKLOG.md` (line ~600 region — re-grep).

- [ ] **Step 1: Locate**
  ```sh
  grep -n "^### 🧊 SH-AGGRESSIVE-PARTIAL-SIZE" code-and-docs-from-chatgpt/docs/BACKLOG.md
  ```

- [ ] **Step 2: Insert above the 🧊 row**:

  ```markdown
  ### ✅ SH-AGGRESSIVE-PARTIAL-SIZE — shipped 2026-05-09 (PR #163)
  **Tags:** engine [backtest]

  Shipped via the SH-VALIDATION-BUGBASH cluster. `aggressiveAdapter` now respects `params.size` when present, capping at `remainingQty`: `effectiveSize = Math.min(requested, remainingQty)`. Three regression tests in `test/backtest/aggressiveAdapter.test.ts`.

  (Original ticket below for history.)
  ```

## Task 1.5 — Add §7 shipped-log bullets (~10 min)

**Files:**
- Modify: `code-and-docs-from-chatgpt/docs/BACKLOG.md` (insertion point: top of §7, after the `# ✅ Shipped` heading at line ~1134, before the existing `2026-05-08 — SH-BACKTEST-PHASE-D` bullet).

§7 is chronological (newest first). Insert three new bullets at the top — these are what the §0 "Shipped (this log)" count actually counts.

- [ ] **Step 1: Insert the bullets.** Match the existing format (date — story-id — one-line summary, optionally with PR links):

  ```markdown
  - **2026-05-09 — SH-DEPTH-WALK-STALE-SNAPSHOT — pre-trade liveness check + planner risk notes (PR #164).**
    Pure `checkLiveness` primitive (`src/preTradeLiveness.ts`); AggressiveRunner gate that re-fetches book between projection and submission for trades >= 100 contracts and aborts with `liveness_rejected:<reason>`; harvest-planner `riskNotes` for fat top-of-book (>5× topSize/meanRest). MOVVA-replay test confirms the runner aborts before `createOrder` when the projected level vanishes.

  - **2026-05-09 — SH-AGGRESSIVE-CLI-FLAG-PARSING — boolean flag forms unified (PR #163).**
    `parseFlags` now correctly handles `--flag`, `--flag=value`, `--flag value`. New `boolFlag(flags, key, default)` helper accepts `true|false|1|0|yes|no` (case-insensitive). Five callsites migrated. 18-test pin in `test/cli/flagParsing.test.ts`.

  - **2026-05-09 — SH-AGGRESSIVE-PARTIAL-SIZE — backtest adapter respects params.size (PR #163).**
    `aggressiveAdapter` now reads `params.size` and caps at `remainingQty`: `effectiveSize = Math.min(requested, remainingQty)`. Three regression tests in `test/backtest/aggressiveAdapter.test.ts`.
  ```

## Task 1.6 — Recount the §0 status board (~5 min)

**Files:**
- Modify: `code-and-docs-from-chatgpt/docs/BACKLOG.md` (lines 4–14 region).

- [ ] **Step 1: Recount on the post-edits file.**
  ```sh
  # SH 🧊 rows in §1-§6 (exclude the §7 shipped bullet "(SH-X)" mentions if any).
  awk '/^# ✅ Shipped/{exit} /^### 🧊 SH/{print}' code-and-docs-from-chatgpt/docs/BACKLOG.md | wc -l

  # §7 bullets (anything starting with "- **YYYY-MM-DD" after the §7 heading).
  awk '/^# ✅ Shipped/{flag=1; next} flag && /^- \*\*[0-9]{4}-/{n++} END{print n}' code-and-docs-from-chatgpt/docs/BACKLOG.md
  ```

  The first awk gives the new "🧊 Tooling ecosystem (SH)" count. The second gives the new "Shipped (this log)" count.

  Whatever the awk returns IS the new number. The pre-existing drift between board (75) and bullets (65) is a known issue — see the §3 numbering note. The PR description must call it out: "Recount finds N §7 bullets vs prior §0 claim of 75; pre-existing drift, fixing as part of this reconciliation." Operator can decide post-merge whether to investigate the drift.

- [ ] **Step 2: Update the §0 table** with the awk-derived numbers.

- [ ] **Step 3: Replace the "Last `/backlog-sync`:" line at `BACKLOG.md:3`** entirely (replace, not append — the line is a single-source-of-truth pointer to the most recent reconciliation, not a log). The new line:

  ```markdown
  Last `/backlog-sync`: 2026-05-09 (SH-MICRO-EXECUTION-LOOP shipped (#165); SH-DEPTH-WALK-STALE-SNAPSHOT (#164), SH-AGGRESSIVE-CLI-FLAG-PARSING + SH-AGGRESSIVE-PARTIAL-SIZE (#163) promoted to ✅; SH-MICRO-LIVE-SMOKE filed as 🟢 ready)
  ```

  Prior promotions referenced in the previous "Last sync" line are NOT lost — their ✅ headings + §7 bullets remain in the file. The Last-sync line just records what happened in the most recent reconciliation pass.

## Task 1.7 — Commit + PR (~5 min)

- [ ] **Step 1: Verify diff is docs-only**
  ```sh
  git diff --stat origin/main..HEAD
  ```
  Should show only `BACKLOG.md`.

- [ ] **Step 2: Commit**
  ```sh
  git commit -m "docs(backlog): reconcile shipped SH stories — 2026-05-09

  Promote SH-DEPTH-WALK-STALE-SNAPSHOT (#164),
  SH-AGGRESSIVE-CLI-FLAG-PARSING (#163), and
  SH-AGGRESSIVE-PARTIAL-SIZE (#163) to ✅. Adds
  matching §7 shipped-log bullets and recounts §0
  status board (SH 4→1, Shipped 75→78)."
  ```

- [ ] **Step 3: PR + auto-merge** following the standard project flow. No CI risk — docs-only.

## Sequencing note

**This Track 1 PR must merge AFTER Tracks 2 and 3** if those are also being shipped today. Tracks 2 and 3 each ship their own story which will need its own promotion + §7 bullet — Track 1's recount would be stale within the hour otherwise. Order: Track 2 → Track 3 → Track 1.

If Tracks 2 and 3 are deferred, Track 1 is safe to ship standalone today.

---

## Self-review

- ✅ Each promotion preserves the original 🧊 body for cross-references (matches the established pattern at line ~535 / ~605 / ~631 / ~722).
- ✅ Each promotion adds a matching §7 bullet — the actual source of the §0 "Shipped" count.
- ✅ The §0 board update derives from awk recount of the post-edit file, not speculation.
- ✅ Replace-vs-append for the "Last sync" line is locked: replace.
- ✅ Drift-detection: Task 1.6 Step 1 explicitly checks whether the §0 count was already wrong before this PR, surfaces it rather than silently fixing.
- ⚠️ Line numbers shift after Task 1.2 — every later task re-greps to find its target. Don't hardcode line numbers.
- ⚠️ Track 1's PR must NOT touch any other file. If a CI check fails on a docs-only diff, something is wrong with the PR pipeline — escalate, don't paper over.
- ⚠️ Sequencing: ship AFTER Tracks 2 and 3 if those land same-day, else this PR's recount is stale within an hour.
