# Parallel Session Coordination

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

This document governs 4-terminal parallel development across the `shared`, `engine`, `ext`, and `tui-mcp` tracks. Read before starting any track session.

---

## Interface contracts

Every shared surface has a version and freezing rule. Updates route only through the shared track.

### `src/safety.ts` — `SafetyConfig` v1

```typescript
export interface SafetyConfig {
  safetySubmittedMultiple?: number;
  floorPriceCents?: number;
  tailSweepThreshold?: number;
  forbiddenTickers?: ForbiddenEntry[];
  maxParticipationRate?: number;       // added by W3.1 (engine track, coordinated)
  jitter?: { chunkSizePct: number; loopDelayPct: number };  // added by W3.2
  maxLossPerTickerDollars?: number;    // added by W1.3 (shared track SH-2)
  dailyLossCircuitBreakerDollars?: number;
  maxPositionConcentrationPct?: number;
}
```

**Freezing rule:** any new field requires a shared-track PR that updates `src/types.ts` + `src/safety.ts` + `test/safety.test.ts`. Engine and tui-mcp tracks import `SafetyConfig` read-only; they do not extend it directly.

**Owned by:** shared track only.

---

### `src/buyRunner.ts` — `BuyConfig` / `BuyResult` v1

```typescript
export interface BuyConfig {
  ticker: string;
  side: 'buy';
  size: number;
  maxPriceCents?: number;
  chunkSize?: number;
  loopDelayMs?: number;
  dryRun?: boolean;
  jobId?: string;
}

export interface BuyResult {
  jobId: string;
  filled: number;
  avgPriceCents: number;
  feesIncurredDollars: number;
  remaining: number;
  status: 'complete' | 'partial' | 'error';
}
```

**Freezing rule:** engine strategies import `BuyConfig`/`BuyResult` to instantiate buy-side runs. Any signature change routes through shared track. Engine track creates new strategy modules that call `buyRunner.run(cfg)`; they do not modify `buyRunner.ts`.

---

### `src/runnerUtils.ts` — shared runner primitives v1

```typescript
export function chooseChunkSize(book: Orderbook, config: RunnerUtils.ChunkConfig): number;
export function computeAdaptiveChunk(book: Orderbook, remaining: number): number;
export function tailSweep(client: KalshiClient, cfg: TailSweepConfig): Promise<void>;
```

**Freezing rule:** both `exitRunner` and `buyRunner` import these. Any change routes through shared track. Engine strategies call them via the runner modules, not directly.

---

### `src/harvestPlanner.ts` — `HarvestPlannerInput` / `HarvestPlannerOutput` v1

See `2026-05-02-shared-services-unblock.md` for full type shapes.

**Freezing rule:** tui-mcp and ext tracks call `kea_harvest_planner` MCP tool or `harvestPlan()` api.ts call; they do not import `harvestPlanner.ts` directly. Any computation change routes through shared track.

---

### `src/types.ts` — `JournalKind` union

Current kinds (post-unblock): `order_intent | order_placed | order_reconciled | tca | safety_config_changed | safety_loaded | trigger_armed | ...`

**Freezing rule:** any new `JournalKind` value requires a shared-track PR. Engine strategies journal via the runner `emit()` helper, not by writing to the journal directly.

---

## File-touch matrix

| Directory / File | shared | engine | ext | tui-mcp |
|---|---|---|---|---|
| `src/safety.ts` | **owns** | reads | — | reads |
| `src/buyRunner.ts` | **owns** | reads | — | — |
| `src/runnerUtils.ts` | **owns** | reads | — | — |
| `src/exitRunner.ts` | **owns** | reads | — | — |
| `src/journal.ts` | **owns** | reads | — | reads |
| `src/types.ts` | **owns** | reads (add via coord PR) | — | reads |
| `src/harvestPlanner.ts` | **owns** | — | — | reads |
| `src/portfolioSequencer.ts` | **owns** | — | — | reads |
| `src/triggers.ts` | **owns** | — | — | reads |
| `src/optimalSchedule.ts` | **owns** | reads | — | — |
| `src/server.ts` | **owns** | — | coord PR | coord PR |
| `src/mcp.ts` | — | — | — | **owns** |
| `src/tui/` | — | — | — | **owns** |
| `src/tui/SafetyTab.tsx` | **owns** (W1.1) | — | — | reads |
| `src/cli.ts` | **owns** | — | — | — |
| `src/*.ts` new strategy modules | — | **owns** | — | — |
| `extension/` | — | — | **owns** | — |
| `test/extension/` | — | — | **owns** | — |

**Cross-track edits:** if any track needs to touch a file owned by another track, open a coordination PR targeting the owning track's branch. Never commit cross-track file edits in a single-track PR.

---

## Merge order rule

When two PRs conflict on a shared file:
1. **Lower PR number wins** (opened first, merged first) when the matrix is followed.
2. **Shared-track PRs merge before other tracks** when any conflict involves a shared-owned file.
3. Tracks rebase on `main` after each shared-track merge — do not let tracks diverge more than 2 shared PRs behind.

Explicit ordering within unblock (see `2026-05-02-shared-services-unblock.md`):
```
W1.4 → W1.1 → W1.5 (fan-out gate)
W4.5 (merge in parallel, no conflict)
```

After fan-out:
- Shared track owns `src/` merge timing.
- Engine, ext, tui-mcp rebase after each shared PR.
- Engine PRs do not conflict with each other (each is a new file).

---

## Sync points

Four sessions compare notes at defined moments. Use `.claude/track-status/<track>.md` (see Status Visibility below) as the async channel; verbal sync is optional.

| Sync point | Trigger condition | Action |
|---|---|---|
| **Fan-out gate** | W1.4 + W1.1 + W1.5 merged to main | All 4 tracks start or resume story work |
| **S1 + S2 landed** | engine PRs EN-1 + EN-2 merged | tui-mcp starts TM-1 (strategy launcher); ext preps EX-9 |
| **W4.1 trigger layer merged** | shared track SH-3 merged | tui-mcp starts TM-3 (trigger CRUD); ext preps EX-10 |
| **W4.5 + W1.2 merged** | shared track W4.5 + SH-1 merged | tui-mcp starts TM-5 + TM-7 |
| **S-library substantially complete** | EN-1 through EN-12 merged | shared track starts SH-5 (portfolio sequencer) |

---

## Conflict resolution

1. **Check the file-touch matrix first.** If you own the file, proceed. If you don't, open a coordination PR.
2. **Earlier PR number wins** when both PRs correctly follow the matrix but touch the same shared file (coordination oversight) — the later PR rebases.
3. **Shared track arbitrates** any disputed file ownership question. Post in `.claude/track-status/shared.md` with the question; other tracks check before opening a cross-file PR.
4. **Never commit to main directly.** All changes through PRs with `gh pr create`. Shared-track PRs squash-merge; track PRs squash-merge.

---

## Status visibility

Each session writes its current status to `.claude/track-status/<track>.md`. Format:

```markdown
# Track: <name>

**Last updated:** 2026-05-02T14:30:00Z
**Current PR:** #42 — feat/engine/s1-passive
**PR status:** CI green, awaiting review
**Next story:** EN-2 (S2 aggressive)
**Blockers:** none
```

Other sessions read this file before opening a coordination PR or starting a story that depends on another track.

Status files live in the repo (committed). Each track updates its file at:
- Story start
- PR opened
- PR merged
- Any blocker discovered

---

## Categorization edge cases

Stories considered for 2 primary tags during tagging pass:

| Story | Considered | Resolution |
|---|---|---|
| W3.2 Anti-gaming jitter | `engine` vs `shared` (config field in SafetyConfig) | Primary `engine [shared]` — logic is engine-only; shared only for the config field extension |
| W3.1 POV pacing | `engine` vs `shared` (volume tracker touches runner loop) | Primary `engine [shared]` — same reasoning; runner-loop integration requires shared coord PR |
| W3.3 Pegged orders | `engine` vs `shared` (touches exitRunner pattern) | Primary `engine [shared]` — new helper module, integration coord |
| W4.1 Trigger layer | `engine` vs `shared` (daemon + new src file) | Primary `engine [shared, tui-mcp]` — triggers.ts is new src file; MCP/TUI surfaces follow |
| W4.3 Portfolio sequencer | `engine` vs `shared` (reads S library) | Primary `engine [tui-mcp]` — sequencer is pure logic in new file; tui-mcp surfaces it; no tighter shared dep than W1.2 |
| W4.5 Harvest planner | `shared` vs `engine` (computation only) | Primary `shared` because it's surfaced across all 3 frontends (MCP, TUI, ext) and is decision-layer not execution |
| SP2.1 MCP strategy launcher | `tui-mcp` vs `shared` (new MCP tool) | Primary `tui-mcp [shared]` — MCP tool registration is tui-mcp; server route is shared coord |
| SP3.1 MCP trigger CRUD | `tui-mcp` vs `shared` | Same reasoning as SP2.1 |
| SP1.8 Safety panel | `ext` vs `shared` (posts to safety endpoints) | Primary `ext [shared]` — ext owns the UI; shared owns the endpoints |

---

## Shipped log reference

The following are already shipped and should not be re-implemented:
- Account-connect (CLI/TUI/MCP) — `feat/account-connect`
- Read-only MCP server (`kea_balance`, `kea_positions`, `kea_orderbook`, `kea_preview`, `kea_journal_list`, `kea_journal_read`, `kea_replay`, `kea_resting_orders`)
- Ink TUI read-only dashboard (positions, orderbook, preview, journal views)
- Journal replay + live-capture
- Auto-adaptive chunking
- Tail-GTC on finish
- Fee-aware preview + status

See `BACKLOG.md` ✅ Shipped section for full list.
