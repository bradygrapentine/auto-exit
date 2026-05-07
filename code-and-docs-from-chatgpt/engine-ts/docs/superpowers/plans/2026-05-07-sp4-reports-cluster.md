# SP4 Reports + Portfolio Surfaces Cluster

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Cascade already-shipped TCA + portfolio backends to TUI and extension surfaces.

**Architecture:** SP4.1 MCP/CLI/HTTP layer is already shipped (`kea_tca_summary` + `kea_portfolio_plan` tools, `kea portfolio plan` + `kea reports tca` CLI subcommands, `/portfolio/plan` HTTP route). This cluster wires those backends to the two remaining surfaces in parallel — TUI (SP4.2) and extension (SP4.3). Both tracks own disjoint files and can ship in parallel.

**Tech Stack:** TypeScript, Vitest, Ink (TUI), React + Chrome extension popup.

**Current state:**
- TCA data lives in journal entries with `kind: 'tca'` (`{jobId, ticker, side, executedPriceCents, arrivalMidCents, slippageCents}` per chunk). CLI computes summary at `src/cli.ts:407–440`.
- Portfolio plan: `buildPortfolioPlan()` in `src/portfolio.ts:154` returns `PortfolioPlan` with ranked liquidation entries. MCP tool at `src/mcp.ts:1464`. HTTP at `src/server.ts:622` (`POST /portfolio/plan`).

---

## Track A — SP4.2 TUI Reports tab

**Owned files:**
- Create: `src/tui/ReportsTab.tsx`
- Modify: `src/tui/App.tsx` (add 'reports' to Tab union, wire TabBar entry, render branch, key binding)
- Modify: `src/tui/api.ts` (add `fetchPortfolioPlan` + `fetchTcaSummary` HTTP helpers if missing)
- Test: `test/tui/reportsTab.test.tsx`

**Approach:** New tab with two sub-views toggled by 't' (TCA) / 'p' (portfolio):
- **TCA view:** Lists recent journal jobIds (filter to those with `tca` entries). Selecting a jobId renders per-chunk slippage table + avg slippage + ticker/side header. Reuses existing journal-list reader pattern from `JournalView`.
- **Portfolio view:** Calls `POST /portfolio/plan` against the extension's known positions/bids/mids (or accepts inline JSON via prompt for v1). Renders the ranked entries table: `rank | ticker | side | size | rationale | expectedSlippageCents`.

**Test plan:** Snapshot tests for both sub-views with mocked api responses. Test 't'/'p' toggle. Test empty-state when no `tca` entries exist.

**Branch:** `feat/sp/sp4.2-tui-reports`

## Track B — SP4.3 Extension Reports panel

**Owned files:**
- Create: `extension/popup/ReportsView.tsx`
- Modify: `extension/popup/App.tsx` (add 'reports' to Tab union, TabBar entry, render branch)
- Test: `engine-ts/test/extension/reportsView.test.tsx`

**Approach:** New "Reports" tab in the extension popup. Two cards:
- **Last-job TCA card:** Reads most recent completed jobId from `GET /journal/list?limit=10` + `GET /journal/read?jobId=...`, computes summary client-side (mirror CLI logic at `src/cli.ts:407`), renders chunks + avg slippage. Shows "no completed jobs" when journal has no `tca` entries.
- **Portfolio plan card:** Calls `POST /portfolio/plan` with current positions (already cached from SP1.x flows). Renders ranked liquidation list with rationale + expected slippage. Cash-target slider deferred to v2.

**Test plan:** Component tests with mocked fetch. Test: TCA card empty state, TCA card with multiple chunks, portfolio card with 3-entry plan, tab switching preserves state.

**Branch:** `feat/sp/sp4.3-ext-reports`

---

## Dispatch order

Both tracks ship in parallel — no shared files. Dispatch as 2 parallel Sonnet subagents in worktrees.

## Phase D — backlog sync

After both PRs merge:
- Promote SP4.1 (already shipped retroactively), SP4.2, SP4.3 to §7
- §0 board: SP1–SP4 6→3, shipped 51→54
- Replace §SP4.1/4.2/4.3 sections with stub pointers
