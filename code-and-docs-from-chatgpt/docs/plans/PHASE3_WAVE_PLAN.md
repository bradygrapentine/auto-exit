# Phase 3 Hardening — Parallel Wave Plan

Goal: take the engine from "dry-run-only MVP" to "you could plausibly flip
`dryRun: false` on a small position and trust it." Roadmap items addressed:
position refresh, structured logs, crash-safe resume, cancel/retry, plus the
Phase 3 preflight (live-fixture verification).

## Agent roles

- **Orchestrator (Opus, this session).** Owns base SHA, dispatch contract,
  integration of merged tracks, code review of subagent PRs, and adjudication
  when a subagent escalates.
- **Implementers (Sonnet 4.6).** One per track A/B/D. TDD cycle in their own
  worktree, push branch, request review.
- **Codex agent (track C only).** Retry/backoff plumbing is mechanical and
  pattern-heavy — Codex is good at this and frees an Opus/Sonnet seat.
- **Reviewer (Sonnet 4.6 with code-reviewer subagent type).** One review pass
  per track before merge. Escalates to Opus on disagreement or unclear intent.

## Cycle per track

```
implementer: read PRD section → write failing tests → implement → tests green → push branch
reviewer:    diff review against the section's contract + global CLAUDE.md → comment
implementer: address comments OR escalate to orchestrator
orchestrator: adjudicate, merge into integration branch, run integration suite
```

Heartbeat: each implementer appends a timestamp every ~5min to
`.claude/agent-status/<track>.log`. Orchestrator polls every 10min; >30min
silence = stalled, capture last status, kill, redispatch.

## Tracks

All branches are cut from the same base SHA (printed at dispatch time). File
ownership is mandatory: an edit outside the listed paths is a contract
violation and the reviewer must reject it.

### Track A — Position-truth via Kalshi account endpoints (Sonnet)

**Why.** Today the runner trusts the user-supplied `positionSize`. If the user
already partially exited or the position is wrong, the loop will keep selling
into nothing or oversell. We need to fetch the real held quantity at start and
optionally on a periodic refresh.

**Scope.**
- New `KalshiAccountClient` (or extend `KalshiClient`) with `getPosition(ticker)`
  returning `{ side, quantity }`.
- `ExitRunner` gains a `preflight()` step: fetch position, compare to config,
  log any mismatch, optionally clamp `positionSize` to observed.
- New `/preflight` server route that returns observed vs requested.
- Mock client gains `setPosition(ticker, side, qty)`.
- Tests: preflight clamps oversized, preflight aborts when held side mismatches,
  preflight passes through when sizes match.

**Files owned.**
- `engine-ts/src/accountClient.ts` (new)
- `engine-ts/src/exitRunner.ts` (preflight method + run() prelude only)
- `engine-ts/src/server.ts` (one new route)
- `engine-ts/src/mockKalshiClient.ts` (add position state)
- `engine-ts/src/types.ts` (Position type only)
- `engine-ts/test/preflight.test.ts` (new)

**Done = .** All tests green; new route returns sane shape; reviewer signs off.

### Track B — Structured logs to disk + crash-safe resume (Sonnet)

**Why.** Right now the run state lives in memory. If the process crashes
mid-loop with an in-flight order, we have no record of what was placed and no
way to reconcile on restart.

**Scope.**
- New `Journal` class: append-only JSONL writer keyed by `jobId`, located at
  `${KEA_HOME ?? ~/.kalshi-exit-assistant}/jobs/<jobId>.jsonl`.
- `ExitRunner` writes one record per state transition: `loop_started`,
  `order_placed`, `order_reconciled`, `loop_finished`, plus terminal error.
- On `ExitRunner` construction, optionally accept `resumeFromJobId`. If set,
  read the journal, find any `order_placed` without a matching
  `order_reconciled`, and reconcile it (call `getOrder` / `cancelOrder`)
  before continuing.
- Tests: journal round-trips, resume reconciles a hung order, resume is a
  no-op when journal is clean, resume after a fully-finished job declines.

**Files owned.**
- `engine-ts/src/journal.ts` (new)
- `engine-ts/src/exitRunner.ts` (journal hooks + resume entry point only)
- `engine-ts/src/server.ts` (resume route + jobId in /start response)
- `engine-ts/test/journal.test.ts` (new)
- `engine-ts/test/resume.test.ts` (new)

**Done = .** Crash-and-resume integration test passes; reviewer signs off.

### Track C — Retry / backoff / idempotency (Codex)

**Why.** Real APIs return transient 429 / 5xx. Right now any one of those
aborts the loop. We also have no protection against double-creating an order
if a 5xx happens after the order landed.

**Scope.**
- New `withRetry(fn, opts)` helper: exponential backoff, jitter, max attempts,
  per-status policy (retry on 5xx + 429, fail on 4xx other than 429).
- Wrap `getOrderbook` and `getOrder` in retry. `createOrder` retries only when
  we are confident the request did not land (network error or 5xx with no
  response body). On retry of `createOrder`, search recent orders by
  `client_order_id` first to avoid duplication.
- `cancelOrder` retries are safe and idempotent.
- Tests: 5xx then success, 429 with Retry-After honored, 4xx fails fast,
  network-error createOrder retry deduplicates by `client_order_id`.

**Files owned.**
- `engine-ts/src/retry.ts` (new)
- `engine-ts/src/kalshiClient.ts` (wrap calls; do NOT touch parsing)
- `engine-ts/src/types.ts` (RetryOptions only)
- `engine-ts/test/retry.test.ts` (new)
- `engine-ts/test/clientRetry.test.ts` (new)

**Done = .** Tests green, no other file touched, Opus reviews the retry policy.

### Track D — Extension UX: progress, summary, confirmation modal (Sonnet)

**Why.** Phase 2 leftover. Once the engine is trustworthy, the UI gets in the
way.

**Scope.**
- Confirmation modal blocking `Start` when `dryRun=false`.
- Progress bar driven by `filledTotal / initialPosition`.
- Final exec summary block (orders attempted, filled total, canceled total,
  duration, last error if any).
- Read `filledTotal` and `canceledTotal` from `/status` (added in main work).

**Files owned.**
- `extension/dist/content.js`
- `extension/dist/content.css`
- `extension/dist/popup.html`
- `extension/dist/background.js`

**Done = .** Loaded in Chrome, all three flows manually walked, screenshots
attached. (No automated extension tests exist; explicit manual-only.)

## Dispatch order and integration

A, B, C dispatched in parallel — file ownership is fully disjoint between them.

D depends on B's `filledTotal`/`canceledTotal` already being in `/status`
(they are, from the May 2026 reconciliation work) but does NOT depend on
A/B/C completing. D can run in parallel with A/B/C.

Merge order: C → A → B → D (C is the smallest, A widens the runner contract,
B layers persistence on the wider contract, D consumes B's status fields).

## Preconditions before dispatch

1. **Working tree must be committed.** Subagents branch from a known SHA.
   The recent reconciliation work (`src/exitRunner.ts`, `src/types.ts`,
   `src/kalshiClient.ts`, `src/mockKalshiClient.ts`, `test/exitRunner.test.ts`,
   `package.json`, `package-lock.json`, `docs/PHASE3_PREFLIGHT.md`, this
   plan) is currently uncommitted — orchestrator must commit on user's
   approval before dispatch.

2. **`origin` remote must exist.** If not, add one before dispatch (the
   subagent worktrees still work without origin, but `gh pr` will not).

3. **`git fetch origin && git rev-parse origin/main`** must equal local
   main SHA. Print the base SHA each subagent will branch from.

4. **Worktrees** placed under `code-and-docs-from-chatgpt/worktrees/<track>`.
   Never as siblings of the project.

5. **Heartbeat directory** exists: `.claude/agent-status/`.

## Adversarial gate

Before merging any track to main, run the codex-adversarial-gate skill on the
diff. Block merge on any "must-fix" finding. The reconciliation work itself
should also be re-reviewed once integrated, since A/B both touch
`exitRunner.ts`.
