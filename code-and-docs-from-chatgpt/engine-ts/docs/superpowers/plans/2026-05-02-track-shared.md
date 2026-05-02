# Track: Shared

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Terminal/session name:** `kea-shared`
**Worktree path:** `worktrees/track-shared/`
**Branch naming:** `feat/shared/<slug>`
**PR labels:** `track:shared`, `area:shared`

This track owns `src/safety.ts`, `src/buyRunner.ts`, `src/runnerUtils.ts`, `src/harvestPlanner.ts`, `src/types.ts`, `src/journal.ts`, `src/exitRunner.ts`, and `src/server.ts`. It also owns the `/safety/*` HTTP endpoints in `server.ts` that the extension calls. Any other track needing a `src/` file change coordinates through a shared-track PR.

**Fan-out gate:** See `2026-05-02-shared-services-unblock.md`. Tracks fan out after W1.4 + W1.1 + W1.5 merge. This plan covers **ongoing shared work after fan-out** — W1.2, W1.3, W4.1, W4.2, W4.3, W4.4.

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

### Story SH-1: W1.2 — Post-trade TCA (arrival-price slippage logging)

**Goal:** at decision-time log `arrivalMid`; after each fill compute and journal slippage; add `kea report <jobId>`; add `kea_tca_summary` MCP tool.

**File-touch boundary:**
- `src/types.ts` — add `'tca'` to `JournalKind`; add `TcaEntry` type
- `src/exitRunner.ts` — capture `arrivalMid` at start of each chunk; write `tca` journal entry after fill
- `src/buyRunner.ts` — same TCA instrumentation on buy side
- `src/cli.ts` — `kea report <jobId>` subcommand
- `src/mcp.ts` — `kea_tca_summary` tool
- `test/tca.test.ts` (new)
- `test/mcp.test.ts` — cover `kea_tca_summary`

**Internal parallelism:** after `TcaEntry` type lands, two parallel dispatches:
- Dispatch A: exitRunner + buyRunner instrumentation
- Dispatch B: CLI `kea report` + MCP `kea_tca_summary`

**Dependencies:**
- Shared interface consumed: `SafetyConfig` (W1.1), `BuyConfig`/`BuyResult` (W1.5)
- No other-track dependency; all in `src/`

**Tasks:**
- [ ] Add `TcaEntry` type and `'tca'` JournalKind to `src/types.ts`
- [ ] Capture `arrivalMid = (topBid + topAsk)/2` at decision-time in `exitRunner.ts`
- [ ] Write `tca` entry after each fill with `slippageCents`, `chunkSize`, `depthTier`
- [ ] Mirror in `buyRunner.ts`
- [ ] Build `kea report <jobId>` markdown summary in `src/cli.ts`
- [ ] Register `kea_tca_summary` in `src/mcp.ts`
- [ ] Tests green

---

### Story SH-2: W1.3 — Pre-trade risk checks

**Goal:** extend `safety.json` with `maxLossPerTickerDollars`, `dailyLossCircuitBreakerDollars`, `maxPositionConcentrationPct`. Refuse-to-start when any is breached.

**File-touch boundary:**
- `src/safety.ts` — extend `SafetyConfig`; add `checkPreTradeRisk(cfg, safety)` function
- `src/types.ts` — update `SafetyConfig` with three new fields
- `src/exitRunner.ts` — call `checkPreTradeRisk` at start of `run()`
- `src/buyRunner.ts` — same gate on open side
- `src/cli.ts` — `kea safety set` already handles new fields via W1.1 patterns
- `test/preTradeRisk.test.ts` (new)

**Internal parallelism:** single Sonnet dispatch, ~1.5 days.

**Dependencies:**
- Shared interface consumed: `SafetyConfig` (W1.1), `BuyConfig` (W1.5)
- Other tracks: engine strategies (S-library) need this before any open-position strategy ships; coordinate timing.

**Tasks:**
- [ ] Add three new fields to `SafetyConfig` in `src/types.ts`
- [ ] Implement `checkPreTradeRisk` in `src/safety.ts`
  - [ ] `maxLossPerTickerDollars`: projected net loss > limit → throw `PreTradeRiskError`
  - [ ] `dailyLossCircuitBreakerDollars`: sum realized losses from `safety.audit.jsonl` for UTC day
  - [ ] `maxPositionConcentrationPct`: check portfolio NAV before any open trade
- [ ] Hook in `exitRunner.ts` + `buyRunner.ts`
- [ ] Tests: one test per check, plus combined scenario
- [ ] `npm test && npm run typecheck` green

---

### Story SH-3: W4.1 — Trigger layer (auto-arm strategies)

**Goal:** new `src/triggers.ts` + `kea watch` daemon. Poll positions; evaluate trigger rules; auto-start named strategy or ping user. Four trigger types: stop-loss, time-decay, probability-based, profit-target.

**File-touch boundary:**
- `src/triggers.ts` (new) — `TriggerConfig`, `TriggerRule`, `evaluateTriggers`, `kea watch` daemon loop
- `src/types.ts` — `TriggerConfig`, `TriggerRule`, `'trigger_armed'` JournalKind
- `src/cli.ts` — `kea watch` subcommand
- `test/triggers.test.ts` (new) — synthetic price walks

**Internal parallelism:** after types land, two parallel Sonnet dispatches:
- Dispatch A: core `evaluateTriggers` + stop-loss + time-decay triggers
- Dispatch B: probability-based + profit-target triggers + daemon loop

**Dependencies:**
- Shared interface consumed: `SafetyConfig` (W1.1), `BuyConfig`/`BuyResult` (W1.5)
- Engine: S library must have at least S1 + S2 merged (tui-mcp track) for triggers to invoke strategies

**Tasks:**
- [ ] Add `TriggerConfig`, `TriggerRule`, `'trigger_armed'` to `src/types.ts`
- [ ] Implement `src/triggers.ts`: `evaluateTriggers(positions, rules)` → `TriggerFired[]`
- [ ] Stop-loss trigger: mark-to-bid drops X% from cost basis or trailing peak
- [ ] Time-decay trigger: T-N days to expiry and p ≤ P → auto-arm losing-exit
- [ ] Probability-based trigger: implied YES crosses threshold
- [ ] Profit-target trigger: auto-arm S7 scale-out at configured rungs
- [ ] `kea watch` daemon loop in `src/cli.ts`
- [ ] Tests with synthetic price walks (3+ scenarios per trigger type)
- [ ] `npm test && npm run typecheck` green

---

### Story SH-4: W4.2 — Implementation Shortfall optimizer (Almgren-Chriss)

**Goal:** `src/optimalSchedule.ts` — closed-form schedule minimizing `E[slippage] + λ × Var[remaining-value-at-expiry]`. Integrates as `useOptimalSchedule: true` on any loop-based strategy.

**File-touch boundary:**
- `src/optimalSchedule.ts` (new)
- `src/types.ts` — `OptimalScheduleInput`, `OptimalScheduleOutput`
- `src/runnerUtils.ts` — `chooseChunkSize` accepts `OptimalScheduleOutput` as override
- `test/optimalSchedule.test.ts` (new)

**Internal parallelism:** single Sonnet dispatch — math-heavy, ~3-4 days.

**Dependencies:**
- Shared interface consumed: W1.2 TCA (impact estimates), W4.1 (probability snapshots from triggers)
- Sequence: SH-1 (TCA) must be merged before SH-4 ships — calibration data needed

**Tasks:**
- [ ] Add `OptimalScheduleInput/Output` types to `src/types.ts`
- [ ] Implement Almgren-Chriss schedule in `src/optimalSchedule.ts`
  - [ ] Inputs: position size, time to expiry, current probability, impact estimate
  - [ ] Output: chunk schedule (size + interval)
- [ ] Unit tests against known analytic solutions (3+ cases)
- [ ] Wire into `runnerUtils.chooseChunkSize` as optional override
- [ ] `npm test && npm run typecheck` green

---

### Story SH-5: W4.3 — Portfolio liquidation sequencer

**Goal:** `kea portfolio plan` subcommand + optional `--auto-execute`. Reads positions, ranks by `markToBid − EV(hold)`, emits recommended strategy sequence.

**File-touch boundary:**
- `src/portfolioSequencer.ts` (new)
- `src/types.ts` — `PortfolioSequence`, `SequenceItem`
- `src/cli.ts` — `kea portfolio plan` subcommand
- `src/mcp.ts` — `kea_portfolio_plan` tool (moved from tui-mcp track per file-touch matrix)
- `test/portfolioSequencer.test.ts` (new)

**Internal parallelism:** single Sonnet dispatch, ~2 days.

**Dependencies:**
- S library must be substantially complete (sequencer routes each position to a named strategy)
- W4.5 harvest planner (W1.2 TCA merged)

**Tasks:**
- [ ] Add types to `src/types.ts`
- [ ] Implement `rankPositions(positions, orderbooks)` in `src/portfolioSequencer.ts`
- [ ] `kea portfolio plan` in `src/cli.ts`
- [ ] `kea_portfolio_plan` MCP tool in `src/mcp.ts`
- [ ] Tests: 3+ portfolio scenarios
- [ ] `npm test && npm run typecheck` green

---

### Story SH-6: W4.4 — Smart Order Router (multi-venue)

**Goal:** abstract `KalshiClient` to `VenueClient` interface; Polymarket adapter; router picks best venue by effective price after fees.

**File-touch boundary:**
- `src/venueClient.ts` (new — `VenueClient` interface)
- `src/kalshiVenueAdapter.ts` (new — wraps existing `KalshiClient`)
- `src/polymarketVenueAdapter.ts` (new)
- `src/sor.ts` (new — Smart Order Router)
- `src/kalshiClient.ts` — no change (wrapped, not modified)
- `src/types.ts` — `VenueConfig`, `RouteDecision`
- `test/sor.test.ts` (new)

**Internal parallelism:** three parallel Sonnet dispatches after interface defined:
- Dispatch A: `VenueClient` interface + Kalshi adapter
- Dispatch B: Polymarket adapter + fee schedule
- Dispatch C: Router logic + route-decision tests

**Dependencies:** entire algo sequence on Kalshi must be stable before multi-venue multiplies it. Sequence: SH-6 is last.

**Tasks:**
- [ ] Define `VenueClient` interface in `src/venueClient.ts`
- [ ] Kalshi adapter in `src/kalshiVenueAdapter.ts`
- [ ] Polymarket CLOB adapter in `src/polymarketVenueAdapter.ts`
- [ ] Fee schedule per venue
- [ ] Contract-equivalence mapping (matching tickers across venues)
- [ ] Router: `routeOrder(order, venues)` → `RouteDecision`
- [ ] Tests: routing scenarios (one venue has better price, fallback on depth)
- [ ] `npm test && npm run typecheck` green

---

## PR cadence

- 1 PR per story (SH-1 through SH-6).
- SH-1 and SH-2 can run in parallel (no overlap in file-touch).
- SH-3 follows after SH-2 (pre-trade checks used by triggers).
- SH-4 follows after SH-1 (needs TCA impact data).
- SH-5 follows after S-library is largely complete.
- SH-6 is last.

---

## CI surface

- **Required:** `npm test` (unit + integration), `npm run typecheck`
- **Smoke:** `npm run smoke` — live read-only endpoint validation
- **Harness:** `npm run harness` — informational, not gate
