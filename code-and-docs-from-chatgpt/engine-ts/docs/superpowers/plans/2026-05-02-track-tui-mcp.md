# Track: TUI + MCP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Terminal/session name:** `kea-tui-mcp`
**Worktree path:** `worktrees/track-tui-mcp/`
**Branch naming:** `feat/tui-mcp/<slug>`
**PR labels:** `track:tui-mcp`, `area:tui`, `area:mcp`

This track owns `src/tui/` (all `.tsx` components, `App.tsx`, `api.ts`) and `src/mcp.ts` (tool registrations). It does NOT modify `src/safety.ts`, `src/types.ts`, `src/journal.ts`, `src/exitRunner.ts`, or `src/buyRunner.ts` directly — coordinate new types and shared modules through the shared track. New MCP write-tools that route to existing `src/` functions are owned here; new `src/` functions they call are shared-track.

**Fan-out gate:** W1.1 must be merged (MCP safety tools, `/safety/*` server endpoints) before this track's write-surface stories ship. `src/tui/SafetyTab.tsx` is built by this track (TM-8) using the shared W1.1 contract — it is tui-mcp-owned. SP2.1 strategy launcher gates on at least S1 + S2 merged (engine track).

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

### Story TM-1: SP2.1 — MCP: `kea_strategy_run` unified launcher

**Goal:** new MCP tool `kea_strategy_run` with schema `{ strategy: enum, ticker, side, size, options? }`. Routes to the right runner module. Returns `{ jobId }`.

**File-touch boundary:**
- `src/mcp.ts` — register `kea_strategy_run` tool
- `src/server.ts` — `POST /strategy/run` HTTP endpoint (shared track coordination for new route)
- `test/mcp.test.ts` — cover `kea_strategy_run`

**Internal parallelism:** no. ~1 day.

**Dependencies:**
- Engine: at least S1 + S2 merged (engine track) before strategy enum has meaningful entries
- Shared: `BuyConfig`/`BuyResult` types (W1.5)

**Tasks:**
- [ ] Add `kea_strategy_run` to `src/mcp.ts` with strategy enum + input routing
- [ ] Server-side validation routes to correct runner module
- [ ] Return `{ jobId }` from running job
- [ ] Cover in `test/mcp.test.ts`: S1 dispatch, S2 dispatch, unknown-strategy error
- [ ] `npm test && npm run typecheck` green

---

### Story TM-2: SP2.2 — TUI: strategy picker tab

**Goal:** new "Run" tab in TUI. List named strategies; select one; ink form for required inputs; dry-run preview inline; confirm to start; stream `/status` updates.

**File-touch boundary:**
- `src/tui/RunTab.tsx` (new)
- `src/tui/StrategyForm.tsx` (new — per-strategy form, shared with TM-1 patterns)
- `src/tui/App.tsx` (register Run tab)
- `src/tui/api.ts` (add `runStrategy` + `streamStatus` calls)
- `test/tui-run-tab.test.tsx` (new)

**Internal parallelism:** no. ~1.5 days.

**Dependencies:** TM-1 (`kea_strategy_run`) merged; at least S1 landed (engine track).

**Tasks:**
- [ ] `RunTab.tsx`: strategy list, selection state, form render, dry-run preview
- [ ] `StrategyForm.tsx`: conditional fields per strategy; shares enum with MCP
- [ ] `api.ts`: `runStrategy(cfg)` → `{ jobId }`, `streamStatus(jobId)`
- [ ] `App.tsx`: register Run tab next to existing tabs
- [ ] Test: S1 form renders, dry-run preview shows, confirm starts job, status streams
- [ ] `npm test && npm run typecheck` green

---

### Story TM-3: SP3.1 — MCP: trigger CRUD tools

**Goal:** five tools: `kea_trigger_list`, `kea_trigger_get`, `kea_trigger_add`, `kea_trigger_update`, `kea_trigger_remove`. Persists alongside `safety.json`.

**File-touch boundary:**
- `src/mcp.ts` — register five trigger tools
- `test/mcp.test.ts` — cover trigger CRUD

**Internal parallelism:** no. ~1 day.

**Dependencies:** W4.1 trigger layer (shared track) merged — `TriggerConfig`, `TriggerRule` types must exist in `src/types.ts`.

**Tasks:**
- [ ] Register `kea_trigger_list` in `src/mcp.ts`
- [ ] Register `kea_trigger_get` (by trigger id)
- [ ] Register `kea_trigger_add` (full `TriggerRule` payload)
- [ ] Register `kea_trigger_update` (patch by id)
- [ ] Register `kea_trigger_remove` (by id)
- [ ] Audit log append on each mutation (delegates to `src/triggers.ts`)
- [ ] Test: list-empty, add-and-get, update, remove, audit-log-entry
- [ ] `npm test && npm run typecheck` green

---

### Story TM-4: SP3.2 — TUI: triggers tab

**Goal:** new "Triggers" tab. Lists active triggers with last-fire timestamp. Add/edit/disable inline. Stream `trigger_armed` events into tab.

**File-touch boundary:**
- `src/tui/TriggersTab.tsx` (new)
- `src/tui/App.tsx` (register Triggers tab)
- `src/tui/api.ts` (add trigger CRUD + stream `trigger_armed`)
- `test/tui-triggers-tab.test.tsx` (new)

**Internal parallelism:** no. ~1 day.

**Dependencies:** TM-3 (trigger CRUD tools) merged; W4.1 trigger layer (shared track).

**Tasks:**
- [ ] `TriggersTab.tsx`: list with last-fire timestamp, add/edit/disable controls
- [ ] Stream `trigger_armed` journal events into the tab (SSE or polling)
- [ ] `api.ts`: trigger CRUD calls
- [ ] Test: empty state, add trigger, fire event streams in, disable
- [ ] `npm test && npm run typecheck` green

---

### Story TM-5: SP4.1 — MCP: TCA + portfolio tools

**Goal:** `kea_tca_summary { jobId }` returns per-fill slippage breakdown. `kea_portfolio_plan { targetCash? }` returns recommended liquidation sequence.

**File-touch boundary:**
- `src/mcp.ts` — register `kea_tca_summary` and `kea_portfolio_plan`
- `test/mcp.test.ts` — cover both tools

**Internal parallelism:** two parallel Sonnet dispatches (one per tool).

**Dependencies:** W1.2 TCA (shared track SH-1) for `kea_tca_summary`; W4.3 portfolio sequencer (shared track SH-5) for `kea_portfolio_plan`.

**Tasks:**
- [ ] Register `kea_tca_summary { jobId }` in `src/mcp.ts`; routes to `src/journal.ts` TCA reader
- [ ] Register `kea_portfolio_plan { targetCash? }` in `src/mcp.ts`; routes to `src/portfolioSequencer.ts`
- [ ] Test: TCA summary for known job, portfolio plan with 3-position fixture
- [ ] `npm test && npm run typecheck` green

---

### Story TM-6: SP4.2 — TUI: reports tab

**Goal:** new "Reports" tab. Sub-views: per-job TCA summary (arrival-mid slippage, fees, projection vs actual) and portfolio plan. Reuses journal-list selector for picking jobs.

**File-touch boundary:**
- `src/tui/ReportsTab.tsx` (new)
- `src/tui/TcaView.tsx` (new)
- `src/tui/PortfolioPlanView.tsx` (new)
- `src/tui/App.tsx` (register Reports tab)
- `src/tui/api.ts` (add TCA + portfolio plan calls)
- `test/tui-reports-tab.test.tsx` (new)

**Internal parallelism:** two parallel Sonnet dispatches:
- Dispatch A: `TcaView.tsx` + `api.ts` TCA call
- Dispatch B: `PortfolioPlanView.tsx` + `api.ts` portfolio call

**Dependencies:** TM-5 (MCP TCA + portfolio tools) merged.

**Tasks:**
- [ ] `TcaView.tsx`: slippage by chunk, by depth-tier, projection vs actual
- [ ] `PortfolioPlanView.tsx`: position list ranked by EV, action column
- [ ] `ReportsTab.tsx`: combines sub-views, journal-list selector for job picker
- [ ] Test: TCA view with fixture data, portfolio plan with 3 positions
- [ ] `npm test && npm run typecheck` green

---

### Story TM-7: W4.5 TUI — Harvest planner "what-if" panel

**Goal:** TUI "what-if" panel surfaced before any S1/S7 execution. Calls `computeHarvestPlan` (W4.5 from shared track); displays Delta/Theta/Gamma proxy/Sleeve sizing/No-loss-floor sections.

**File-touch boundary:**
- `src/tui/HarvestPlannerPanel.tsx` (new)
- `src/tui/App.tsx` or `src/tui/RunTab.tsx` (surface panel before S1/S7 confirm)
- `src/tui/api.ts` (add `harvestPlan` call)
- `test/tui-harvest-planner.test.tsx` (new)

**Internal parallelism:** no. ~1 day.

**Dependencies:** W4.5 harvest planner core (shared track W4.5) merged; TM-2 (Run tab) for integration point.

**Tasks:**
- [ ] `HarvestPlannerPanel.tsx`: form inputs (position, costBasis, marketP, privateP, catalystType)
- [ ] Display output in TradFi vocabulary sections
- [ ] Inline before S1/S7 confirmation in `RunTab.tsx`
- [ ] `api.ts`: `harvestPlan(input)` call
- [ ] Test: EV-positive harvest, EV-negative (risk-reduction), no-loss-floor row
- [ ] `npm test && npm run typecheck` green

---

### Story TM-8: W1.1 TUI consumer — SafetyTab.tsx

**Goal:** `src/tui/SafetyTab.tsx` — TUI consumer of the W1.1 safety contract. Displays current `SafetyConfig` values (read-only fields). Lists forbidden tickers with add/remove controls that call the `/safety/*` server endpoints owned by the shared track.

**File-touch boundary:**
- `src/tui/SafetyTab.tsx` (new)
- `src/tui/App.tsx` (register Safety tab)
- `src/tui/api.ts` (add safety read + forbidden-ticker CRUD calls)
- `test/tui-safety-tab.test.tsx` (new)

**Internal parallelism:** no. ~1 day.

**Dependencies:** W1.1 safety persistence (shared track / unblock plan) must be merged and `/safety/*` endpoints in `src/server.ts` must be frozen before this story starts.

**Tasks:**
- [ ] `SafetyTab.tsx`: read-only display of `SafetyConfig` fields
- [ ] Forbidden tickers list: add (text input + reason field) → `POST /safety/forbidden`
- [ ] Forbidden tickers list: remove → `DELETE /safety/forbidden/:ticker` with confirm
- [ ] `api.ts`: `getSafetyConfig()`, `addForbiddenTicker({ ticker, reason })`, `removeForbiddenTicker(ticker)`
- [ ] `App.tsx`: register Safety tab
- [ ] Test: display config, add-with-reason, remove-with-confirm
- [ ] `npm test && npm run typecheck` green

---

## PR cadence

- 1 PR per story.
- TM-1 (MCP strategy launcher) first — unblocks ext track EX-9.
- TM-2 (TUI run tab) follows TM-1.
- TM-3 (trigger CRUD) follows W4.1 shared track.
- TM-4 (TUI triggers tab) follows TM-3.
- TM-5 (MCP TCA + portfolio) follows SH-1 + SH-5 from shared track.
- TM-6 (TUI reports tab) follows TM-5.
- TM-7 (harvest planner panel) follows W4.5 shared track.
- Batch TM-3 + TM-4 if both complete same day.
- TM-8 (SafetyTab.tsx) follows W1.1 contract freeze (shared track / unblock plan).

---

## CI surface

- **Required:** `npm test` (unit + integration), `npm run typecheck`
- **Smoke:** `npm run smoke` — live read-only endpoint validation
- **Harness:** `npm run harness` — informational, not gate
