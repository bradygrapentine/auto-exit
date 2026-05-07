# SH-BACKTEST Cluster — Record + Replay Harness

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Replay recorded orderbook + position + fill history against any strategy in the library, report counterfactual P&L / fill rate / slippage / decision trace. Per-ticker, single-run v1 (no portfolio aggregation, no walk-forward, no synthetic data).

**Spec:** `engine-ts/docs/superpowers/specs/2026-05-05-backtest-harness.md`. Sections §3 (architecture), §4 (capabilities), §5 (file-touch boundary), §6 (storage shape), §7 (resolved decisions), §8 (fidelity caveats — must surface in `assumptions_warning`) are normative.

**Architecture:** `src/backtest/` module with 7 files split across 3 phases. Each phase ships independently behind clean interfaces.

**Phasing:**
- **Phase A** (this dispatch): Recorder + types + retention helpers. Watcher integration optional via `recorder?: Recorder` param (single-line fall-through). Single-track Sonnet agent.
- **Phase B** (next cluster): ReplayKalshiClient + fillSimulator + harness + sweep + report. Parallel-friendly across 3 tracks (replay client / harness / sweep+report).
- **Phase C** (follow-up): CLI + MCP surfaces (`kea record start/stop/list`, `kea backtest run/sweep/report`, MCP tools).
- **Phase D**: backlog sync.

This plan covers Phase A only.

---

## Track A — Recorder + types + retention

**Owned files:**
- Create: `src/backtest/types.ts` — `RecordingEntry` (snapshot|position|fill discriminated union), `Recorder` interface, `BacktestConfig`, `CounterfactualReport` placeholder.
- Create: `src/backtest/recorder.ts` — `createRecorder({dir, ticker, depthLevels?}): Recorder`. Append-only NDJSON writer with daily rotation (UTC midnight). Methods: `appendSnapshot(orderbook, position?, latencyMs?)`, `appendPosition(...)`, `appendFill(...)`, `close()`.
- Create: `src/backtest/retention.ts` — `gzipOldRecordings(dir, ageDays=7)`, `archiveOldRecordings(dir, ageDays=90)`, `pruneRecordings(dir, retentionDays?)`. Pure functions returning paths affected.
- Create: `src/backtest/list.ts` — `listRecordings(dir): RecordingFile[]` (returns `{path, ticker, date, sizeBytes, gzipped}` for each).
- Modify: `src/watcher.ts` — accept optional `recorder?: Recorder` constructor arg; on each successful poll snapshot, call `recorder.appendSnapshot(...)`. Single-line fall-through when undefined. **Do not** add any other behavior changes.
- Test: `test/backtest/recorder.test.ts`, `test/backtest/retention.test.ts`, `test/backtest/list.test.ts`, `test/backtest/watcher-integration.test.ts`.

**Hard non-goals for Phase A:**
- No CLI, no MCP, no TUI.
- No replay client, no fill simulator, no harness.
- No SH-WATCH spec changes — recorder must integrate via the existing `recorder?:` injection seam.
- No automatic deletion (operator must explicitly call `pruneRecordings`).
- No standalone `kea record start <ticker>` mode (deferred to Phase C).

**Storage spec (§6):**
- Path: `${KEA_HOME}/recordings/<ticker>-<YYYYMMDD>.ndjson` (one file per ticker per day; rotates UTC midnight).
- Three line kinds per §6.1: `snapshot`, `position`, `fill`. JSON shapes match spec lines 178–218 exactly.
- Depth: top 10 levels per side default. Configurable via `KEA_RECORDING_DEPTH_LEVELS` env var (parse + clamp to [1, 50]).
- Retention: gzip files >7 days; archive subdir for >90 days. Loader (deferred to Phase B) reads both `.ndjson` and `.ndjson.gz`.
- Position-delta source: poll `getPositions()` alongside orderbook poll, diff against last seen — but in Phase A, only emit when caller passes a position. The diff/poll logic is Phase B harness territory.

**Test plan:**
- `recorder.test.ts`: append-then-read round-trip; daily rotation creates new file at UTC midnight crossing; concurrent appends preserve ordering; close flushes writes.
- `retention.test.ts`: gzip threshold honored; archive moves files; prune removes files older than retention; no-op on empty dirs.
- `list.test.ts`: returns expected metadata; handles missing dir; sorts by date desc.
- `watcher-integration.test.ts`: watcher with `recorder` injected calls `appendSnapshot` on each poll; without recorder, no recording side-effects.

**Verify:** from `code-and-docs-from-chatgpt/engine-ts/`, `npx vitest run` (full suite) passes; `npx tsc --noEmit` clean.

**Branch:** `feat/backtest/sh-backtest-phase-a`

**Commit + PR:** `feat(engine): SH-BACKTEST Phase A — recorder + retention`. PR `--base main`.
