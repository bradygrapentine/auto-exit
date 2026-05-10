# Track 1 — Backlog hygiene reconciliation

> **For agentic workers:** This is a documentation-only reconciliation. No code changes. Use the `backlog-sync` skill if available; otherwise follow the steps below.

**Goal:** Bring `code-and-docs-from-chatgpt/docs/BACKLOG.md` back in sync with what's actually merged on `main`. The §0 status board's counts are wrong; three story rows are 🧊 (open) but the work has shipped.

**Architecture:** Pure file edits to `BACKLOG.md`. Each affected story keeps its 🧊 body intact for cross-references but flips the heading to ✅ with a one-line shipped summary. The §0 status board is recounted from the resulting state.

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

After this reconciliation:

```
| 🧊 Tooling ecosystem (SH) | 1 |   (drops by 3)
| ✅ Shipped (this log)     | 78 |  (rises by 3)
```

(The remaining open SH row is `SH-MICRO-LIVE-SMOKE`, which is 🟢 ready, not 🧊 deferred — verify what categorization the §0 board actually uses for ready vs deferred. If 🟢 doesn't roll into the SH count, the new count is 0; if it does, 1.)

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

## Task 1.5 — Recount the §0 status board (~5 min)

**Files:**
- Modify: `code-and-docs-from-chatgpt/docs/BACKLOG.md` (lines 4–14 region).

- [ ] **Step 1: Recount.** Grep for current state on the *post-edits* file:
  ```sh
  grep -cE "^### 🧊 SH-" code-and-docs-from-chatgpt/docs/BACKLOG.md   # remaining open SH stories (count duplicates of "_-original" tickets)
  grep -cE "^### ✅ " code-and-docs-from-chatgpt/docs/BACKLOG.md       # shipped headings
  ```

- [ ] **Step 2: Update the table.** Replace the "🧊 Tooling ecosystem (SH)" and "✅ Shipped" counts with the actual numbers from Step 1. Replace the "Last `/backlog-sync`:" line with today's date and a one-line summary:

  ```markdown
  Last `/backlog-sync`: 2026-05-09 (SH-DEPTH-WALK liveness gate shipped + SH-MICRO-EXECUTION-LOOP shipped + SH-AGGRESSIVE-CLI-FLAG-PARSING / SH-AGGRESSIVE-PARTIAL-SIZE promoted to ✅)
  ```

## Task 1.6 — Commit + PR (~5 min)

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
  SH-AGGRESSIVE-PARTIAL-SIZE (#163) to ✅.

  Recount §0 status board: SH 4→1, Shipped 75→78."
  ```

- [ ] **Step 3: PR + auto-merge** following the standard project flow. No CI risk — docs-only.

---

## Self-review

- ✅ Each promotion preserves the original 🧊 body for cross-references (matches the established pattern at line ~535 / ~605 / ~631 / ~722).
- ✅ The §0 board update derives from a recount of the post-edit file, not from speculation.
- ✅ Date in the "Last sync" line is current.
- ⚠️ Line numbers shift after Task 1.2 — every later task re-greps to find its target. Don't hardcode line numbers.
- ⚠️ Track 1's PR must NOT touch any other file. If a CI check fails on a docs-only diff, something is wrong with the PR pipeline — escalate, don't paper over.
