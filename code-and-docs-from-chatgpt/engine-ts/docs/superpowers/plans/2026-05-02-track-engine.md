# Track: Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Terminal/session name:** `kea-engine`
**Worktree path:** `worktrees/track-engine/`
**Branch naming:** `feat/engine/<slug>`
**PR labels:** `track:engine`, `area:engine`

This track owns strategy modules under `src/` — new files only (`src/passive.ts`, `src/aggressive.ts`, `src/twap.ts`, etc.) and cross-cutting refinement modules (`src/pov.ts`, `src/jitter.ts`, `src/peg.ts`). It does NOT modify `src/exitRunner.ts`, `src/buyRunner.ts`, `src/safety.ts`, `src/types.ts`, or `src/journal.ts` directly — those are shared track. When a strategy needs a new type, open a shared-track coordination PR.

**Fan-out gate:** W1.4 + W1.1 + W1.5 must be merged (see `2026-05-02-shared-services-unblock.md`).

---

## Subagent dispatch policy

Default routing: **Sonnet implements, Opus session advises.**

1. Implementer subagents are dispatched as `general-purpose` with `model: "sonnet"`. Per superpowers:subagent-driven-development.
2. The Opus session running this terminal is the orchestrator: it dispatches Sonnet, reviews output between tasks, makes judgment calls.
3. Full Opus subagent takeover only when a blocker proves sticky: 2+ Sonnet attempts failed, hit an architectural wall, or wrong decision needs unwinding.
4. Codex adversarial review (`codex:codex-rescue`) is a mandatory gate before merge regardless of who implemented.

Heartbeat: any subagent running >30min appends timestamps every ~5min to `.claude/agent-status/<id>.log` per superpowers:subagent-heartbeat.

---

## Story list (dependency order)

### Story EN-1: S1 — Passive (post-and-walk, side-parameterized)

**Goal:** new `src/passive.ts` mode `passive`. Inputs: `{ ticker, side, size, maxPriceCents|minPriceCents }`. Post-and-walk loop with passive timebox, cancel-replace, floor/ceiling via `safety.json`.

**File-touch boundary:**
- `src/passive.ts` (new)
- `test/passive.test.ts` (new)

**Shared interfaces consumed:**
- `SafetyConfig` from `src/safety.ts` (W1.1)
- `BuyConfig`/`BuyResult`, `runnerUtils` from `src/buyRunner.ts` / `src/runnerUtils.ts` (W1.5)

**Internal parallelism:** no — single Sonnet dispatch, ~1.5 days.

**Tasks:**
- [ ] Implement `src/passive.ts`: `run(cfg: PassiveConfig): Promise<PassiveResult>`
- [ ] Post chunk GTC at `ask − 1¢` (sell) / `bid + 1¢` (buy)
- [ ] Timebox `passiveTimeboxMs` (default 60s), cancel unfilled, shift one tick per iter
- [ ] Respect floor/ceiling from `SafetyConfig`; if spread < 1¢ fall through to S2
- [ ] Journal: same entry kinds as `exitRunner`
- [ ] Test: dry-run, fill-on-first-iter, multi-iter-walk, spread<1¢ fallthrough
- [ ] `npm test && npm run typecheck` green

---

### Story EN-2: S2 — Aggressive (cross-the-spread, max speed)

**Goal:** new `src/aggressive.ts` mode `aggressive`. Single IoC for full `size` at `bid`/`ask`. No chunking. CLI `--confirm aggressive`, TUI 2-keystroke confirm gate.

**File-touch boundary:**
- `src/aggressive.ts` (new)
- `test/aggressive.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `runnerUtils` (W1.5)

**Internal parallelism:** no — single Sonnet dispatch, ~4 hours.

**Dependencies:** W1.5 buy primitive merged.

**Tasks:**
- [ ] Implement `src/aggressive.ts`: single IoC order, `safetySubmittedMultiple` guard
- [ ] CLI `--confirm aggressive` flag check (refuse without it)
- [ ] Test: dry-run, live-mode, safetyMultiple guard fires
- [ ] `npm test && npm run typecheck` green

---

### Story EN-3: S6 — Pre-resolution arbitrage exit

**Goal:** mode `pre-resolution-arb`. Aggressive IoC at `bid + 1¢`; if no fill within `arbTimeboxMs`, escalate to `bid` sweep. Small chunks, high floor.

**File-touch boundary:**
- `src/preResolutionArb.ts` (new)
- `test/preResolutionArb.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `exitRunner` primitives

**Dependencies:** S1 + S2 logic patterns (no import dependency, but implement after to reuse patterns).

**Tasks:**
- [ ] Implement `src/preResolutionArb.ts`
- [ ] IoC at bid+1¢ → timebox → escalate to bid sweep
- [ ] Tests: fill-on-first, timebox-escalation, floor-guard
- [ ] `npm test && npm run typecheck` green

---

### Story EN-4: S7 — Scale-out ladder (rung-driven partial exits)

**Goal:** mode `scale-out`. Inputs: `{ ticker, side: 'sell', size, rungs: [{priceCents, sizePct}] }`. In-process polling loop; each rung fires S1 passive when price hits.

**File-touch boundary:**
- `src/scaleOut.ts` (new)
- `test/scaleOut.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `passive.ts` (EN-1)

**Internal parallelism:** no — single Sonnet dispatch, ~1.5 days.

**Dependencies:** S1 passive (EN-1) merged.

**Tasks:**
- [ ] Implement `src/scaleOut.ts`: rung table, polling loop, per-rung S1 dispatch
- [ ] No default rungs — agent supplies table
- [ ] Tests: single-rung fill, multi-rung sequential, deadline-hit
- [ ] `npm test && npm run typecheck` green

---

### Story EN-5: S3 — TWAP (time-sliced, side-parameterized)

**Goal:** mode `twap`. Per-interval target = size / numIntervals; runs one S1 passive chunk per interval; daemon-mode scaffolding.

**File-touch boundary:**
- `src/twap.ts` (new)
- `test/twap.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `passive.ts` (EN-1), `buyRunner` (W1.5)

**Dependencies:** S1 passive (EN-1) merged.

**Internal parallelism:** single Sonnet dispatch, ~1 day.

**Tasks:**
- [ ] Implement `src/twap.ts`: interval scheduler, per-interval S1 dispatch
- [ ] Session window (overnight pause) configurable
- [ ] Tests: 2-interval dry-run, deadline-hit, overnight-pause skip
- [ ] `npm test && npm run typecheck` green

---

### Story EN-6: S8 — Limit ladder (passive multi-rung GTC, side-parameterized)

**Goal:** mode `limit-ladder`. Post each rung as GTC at start; monitor fills; journal each; resume reconciles fills.

**File-touch boundary:**
- `src/limitLadder.ts` (new)
- `test/limitLadder.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `buyRunner` (W1.5)

**Internal parallelism:** single Sonnet dispatch, ~1 day.

**Tasks:**
- [ ] Implement `src/limitLadder.ts`: upfront multi-GTC post, fill monitor
- [ ] Resume: reconcile fills from journal on restart
- [ ] Tests: all-rungs-fill, partial-fill-resume, no-fill-cancel
- [ ] `npm test && npm run typecheck` green

---

### Story EN-7: S9 — Stop-and-reverse

**Goal:** mode `stop-and-reverse`. Phase 1: S2 aggressive exit; Phase 2: S2 aggressive open of opposite side. Single journal. W1.3 pre-trade risk on open leg.

**File-touch boundary:**
- `src/stopAndReverse.ts` (new)
- `test/stopAndReverse.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `aggressive.ts` (EN-2), pre-trade risk (W1.3)

**Internal parallelism:** single Sonnet dispatch, ~1 day.

**Tasks:**
- [ ] Implement `src/stopAndReverse.ts`: phase-1 exit → phase-2 open sequence
- [ ] Pre-trade risk check on phase-2 open via `checkPreTradeRisk`
- [ ] Tests: full sequence dry-run, phase-1-fail aborts, pre-trade risk gate
- [ ] `npm test && npm run typecheck` green

---

### Story EN-8: S10 — Cash-raise sequencer

**Goal:** mode `cash-raise`. Inputs: ordered list of `{ticker, size, strategyName}` + `targetCashDollars` + `deadline`. Execute sequentially, halt on target-met or deadline.

**File-touch boundary:**
- `src/cashRaise.ts` (new)
- `test/cashRaise.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), at least S1/S2 (EN-1, EN-2)

**Internal parallelism:** single Sonnet dispatch, ~1 day.

**Tasks:**
- [ ] Implement `src/cashRaise.ts`: sequential dispatch, target-met halt, deadline halt
- [ ] Tests: target-met early-halt, deadline-hit, all-positions-needed
- [ ] `npm test && npm run typecheck` green

---

### Story EN-9: S11 — Roll (exit current + open next cycle)

**Goal:** mode `roll`. Phase 1: S1 passive exit of current; Phase 2: S2 aggressive open of target. W1.3 concentration cap on phase 2.

**File-touch boundary:**
- `src/roll.ts` (new)
- `test/roll.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `passive.ts` (EN-1), `aggressive.ts` (EN-2), `buyRunner` (W1.5), pre-trade risk (W1.3)

**Internal parallelism:** single Sonnet dispatch, ~1 day.

**Tasks:**
- [ ] Implement `src/roll.ts`
- [ ] Tests: full-roll sequence, phase-1-partial-then-phase-2, concentration-cap-fires
- [ ] `npm test && npm run typecheck` green

---

### Story EN-10: S4 — Stealth (anti-signaling, side-parameterized)

**Goal:** mode `stealth`. Small randomized chunks (50–200 contracts), random inter-chunk delay (5–60s), no resting orders. Composes W3.2 jitter.

**File-touch boundary:**
- `src/stealth.ts` (new)
- `test/stealth.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `jitter.ts` (EN-14/W3.2), `buyRunner` (W1.5)

**Internal parallelism:** single Sonnet dispatch, ~1 day.

**Dependencies:** W3.2 jitter primitive (EN-14) merged first.

**Tasks:**
- [ ] Implement `src/stealth.ts`
- [ ] Tests: chunk-size distribution, delay distribution, no-resting-GTC check
- [ ] `npm test && npm run typecheck` green

---

### Story EN-11: S5 — Pair / multi-leg (atomic, side-parameterized)

**Goal:** mode `pair`. Inputs: list of `{ticker, side, size}` legs. Parallel execution; shared journal; atomicity-of-progress enforcement (leg-skew cap).

**File-touch boundary:**
- `src/pair.ts` (new)
- `test/pair.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `passive.ts` (EN-1), `buyRunner` (W1.5)

**Internal parallelism:** single Sonnet dispatch, ~2 days.

**Tasks:**
- [ ] Implement `src/pair.ts`: parallel leg execution, skew-throttle, halt-all on failure
- [ ] Tests: 2-leg fill, leg-failure-halts-all, skew-throttle fires
- [ ] `npm test && npm run typecheck` green

---

### Story EN-12: S12 — Liquidity-providing (two-sided market making)

**Goal:** mode `market-make`. Maintain two resting GTCs inside spread; cancel-repost on book moves; inventory management toward `targetInventory`.

**File-touch boundary:**
- `src/marketMake.ts` (new)
- `test/marketMake.test.ts` (new)

**Shared interfaces consumed:** `SafetyConfig` (W1.1), `peg.ts` (EN-15/W3.3), `buyRunner` (W1.5)

**Dependencies:** W3.3 peg-to-mid (EN-15) preferred. Flag scope-risk per backlog note.

**Internal parallelism:** single Sonnet dispatch, ~3 days.

**Tasks:**
- [ ] Implement `src/marketMake.ts`: two-sided GTC management, inventory accounting
- [ ] Inventory flatting: when `maxInventory` hit, aggressive repost opposite side
- [ ] Tests: fill-and-repost, inventory-cap-flatting, peg-repost-on-book-move
- [ ] `npm test && npm run typecheck` green

---

### Story EN-13: S13, S14, S15, S16 — Remaining strategies

**Batch:** S13 (Iceberg), S14 (Cross-resolution basis arb), S15 (GTC-prepend then sweep), S16 (Time-to-expiry emergency unwind) — each simple enough to batch into one PR per story or parallel dispatch.

**File-touch boundary:**
- `src/iceberg.ts` (new), `test/iceberg.test.ts` (new) — S13
- `src/basisArb.ts` (new), `test/basisArb.test.ts` (new) — S14
- `src/prependSweep.ts` (new), `test/prependSweep.test.ts` (new) — S15
- `src/timeEmergency.ts` (new), `test/timeEmergency.test.ts` (new) — S16

**Shared interfaces consumed:**
- S13: `buyRunner` (W1.5)
- S14: `buyRunner` (W1.5), `pair.ts` (EN-11)
- S15: `passive.ts` (EN-1), `aggressive.ts` (EN-2), `buyRunner` (W1.5)
- S16: `passive.ts` (EN-1), `aggressive.ts` (EN-2), `scaleOut.ts` (EN-4)

**Internal parallelism:** four parallel Sonnet dispatches (one per strategy).

**Tasks per strategy:**
- [ ] Implement strategy module
- [ ] Tests: happy path, error path, safety guard fires
- [ ] `npm test && npm run typecheck` green

---

### Story EN-14: W3.2 — Anti-gaming randomization (chunk + timing jitter)

**Goal:** new `src/jitter.ts` with bounded `effectiveChunk` and `effectiveDelay` helpers. Extend `SafetyConfig.jitter`. Required by S4 stealth.

**File-touch boundary:**
- `src/jitter.ts` (new)
- `test/jitter.test.ts` (new)
- Coordinate with shared track to add `jitter` field to `SafetyConfig` in `src/types.ts`

**Internal parallelism:** single Sonnet dispatch, ~3 hours.

**Tasks:**
- [ ] Implement `jitter.ts`: `clampedJitter(value, pct)` helper
- [ ] Tests: distribution stays in bounds, never exceeds `safetySubmittedMultiple`
- [ ] Coordinate `SafetyConfig.jitter` type addition with shared track

---

### Story EN-15: W3.1 — Participation-rate / POV pacing

**Goal:** new `src/pov.ts` with rolling volume tracker. `maxParticipationRate` in `SafetyConfig`. Throttle `loopDelayMs` so cumulative submitted ≤ rate × recent-volume.

**File-touch boundary:**
- `src/pov.ts` (new)
- `test/pov.test.ts` (new)
- Coordinate with shared track: `maxParticipationRate` field in `SafetyConfig`

**Internal parallelism:** single Sonnet dispatch, ~1 day.

**Tasks:**
- [ ] Implement `src/pov.ts`: rolling volume window, throttle computation
- [ ] Integrate into `exitRunner` + `buyRunner` loop delay (coordination PR with shared)
- [ ] Tests: throttle fires, no-throttle when volume > threshold

---

### Story EN-16: W3.3 — Pegged orders (peg-to-mid)

**Goal:** new `src/peg.ts` order helper. Recomputes limit as `floor(midpointCents) ± offset` each loop, re-posts only on price change.

**File-touch boundary:**
- `src/peg.ts` (new)
- `test/peg.test.ts` (new)

**Shared interfaces consumed:** `passive.ts` (EN-1) as primary consumer

**Internal parallelism:** single Sonnet dispatch, ~1 day.

**Dependencies:** S1 passive (EN-1) merged (primary consumer).

**Tasks:**
- [ ] Implement `src/peg.ts`: `computePegPrice(book, side, offset)` + repost-on-change logic
- [ ] Tests: price-unchanged-no-repost, price-moved-repost, floor-binds
- [ ] `npm test && npm run typecheck` green

---

## PR cadence

- 1 PR per story for EN-1 through EN-12.
- EN-1 and EN-2 can start in parallel (no overlap).
- EN-13 (S13/S14/S15/S16) as 4 separate PRs dispatched in parallel.
- EN-14 (W3.2) before EN-10 (S4 stealth).
- EN-15 (W3.1) and EN-16 (W3.3) in parallel with strategy work.
- Batch tiny cross-cutting PRs (EN-14/EN-15/EN-16) into one if <1 day total.

---

## CI surface

- **Required:** `npm test` (unit + integration), `npm run typecheck`
- **Smoke:** `npm run smoke` — live read-only endpoint validation after each strategy
- **Harness:** `npm run harness` — informational, not gate
