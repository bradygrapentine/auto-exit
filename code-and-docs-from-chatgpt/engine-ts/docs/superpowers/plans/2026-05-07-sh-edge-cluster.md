# SH-EDGE Cluster — Per-Strategy Edge Attribution

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Pure-analytics module that decomposes every strategy fire's realized P&L into 5 components (entry edge, exit edge, market drift, slippage, trigger quality), grouped by strategy × market × trigger. Read-only consumer of the existing journal — no new `JournalKind`s.

**Spec:** `engine-ts/docs/superpowers/specs/2026-05-05-pnl-attribution.md` (sections §3, §4, §5, §6, §8 are normative for v1).

**Architecture:** `src/edge/` module with 6 files (lifecycle → benchmarks → attribution → aggregate → snapshot → marketCategory). All pure functions over journal entries; persistence is just NDJSON read + JSON snapshot write. No daemons, no new MCP tools yet.

**Phasing:**
- **Phase A** (this cluster): engine analytics module + tests + types (~5 files, ~200-300 LOC). Single-track Sonnet agent.
- **Phase B** (follow-up cluster): CLI `kea edge`, MCP `kea_edge_summary`/`kea_edge_per_strategy`, TUI Edge tab. 3 parallel surface tracks.
- **Phase D** (after Phase B): backlog sync.

This plan covers Phase A only.

---

## Track A — Engine analytics module

**Owned files:**
- Create: `src/edge/marketCategory.ts` — ticker-prefix → category (`'nfl' | 'political' | 'entertainment' | 'weather' | 'other'`). Hand-curated table.
- Create: `src/edge/lifecycle.ts` — `joinFires(entries: JournalEntry[]): Fire[]`. Walks `'order_intent' → 'order_placed' → 'order_reconciled'` + `'synthetic_fired'` boundaries. Each Fire = `{fireId, strategy, ticker, marketCategory, entryFills, exitFills, decisionMidCents, arrivalMidCents, triggerArmedAt?, triggerKind?, triggerOptimalMidCents?, peakBidCents?, resolutionPrice?, unresolved}`.
- Create: `src/edge/benchmarks.ts` — `passiveHoldBenchmark(fire)`, `immediateExitBenchmark(fire)`, `optimalHindsightBenchmark(fire)`. Pure functions returning cents.
- Create: `src/edge/attribution.ts` — `attribute(fire): EdgeComponents`. Implements §4 linear-additive decomposition. Returns `{entryEdge, exitEdge, marketDrift, slippage, triggerQuality, residual}` in dollars.
- Create: `src/edge/aggregate.ts` — `groupByStrategy(fires)`, `groupByMarket(fires)`, `triggerHistogram(fires)`, `paramSensitivity(fires, paramName)`.
- Create: `src/edge/snapshot.ts` — `buildSnapshot({since, until, fires})`, `writeSnapshot(snapshot, path)`, `readSnapshot(path)`. Persists to `${KEA_HOME}/edge-snapshots/<YYYY-MM-DD>.json`.
- Modify: `src/types.ts` — add `Fire`, `EdgeComponents`, `EdgeSnapshot`, `MarketCategory` types. **No new `JournalKind`.**
- Test: `test/edge/marketCategory.test.ts`, `test/edge/lifecycle.test.ts`, `test/edge/attribution.test.ts`, `test/edge/aggregate.test.ts`, `test/edge/snapshot.test.ts`.

**Hard non-goals for Phase A:**
- No CLI, no MCP, no TUI changes. Surfaces deferred to Phase B.
- No journal writes from edge module. Read-only.
- No Kalshi REST calls. Resolution data stubbed via fire input shape — fetcher comes in Phase B.
- No daemons, no schedulers.
- No auto-tuning suggestions, no auto-suspension.

**Test approach:**
- Synthetic fixtures for each test file. Each fire scenario has known-decomposition: assert `entryEdge + exitEdge + marketDrift + slippage + triggerQuality + residual === realizedPnL` to within 1¢ rounding.
- `lifecycle.test.ts`: feed a 5-entry mini-journal, assert one `Fire` emitted with correct boundaries.
- `attribution.test.ts`: 4–6 representative fire scenarios (clean win, clean loss, drift-dominated, trigger-fired-too-early, slippage-dominated, multi-chunk).
- `aggregate.test.ts`: 10-fire fixture, assert per-strategy + per-market grouping correct, histogram bins correct, parameter sensitivity table correct.
- `snapshot.test.ts`: write → read round-trip; same input → same snapshot (determinism).

**Verify:** `npx vitest run` passes; `npx tsc --noEmit` clean.

**Branch:** `feat/edge/sh-edge-phase-a`

**Commit + PR:** `feat(engine): SH-EDGE Phase A — pnl attribution analytics module`. PR `--base main`.
