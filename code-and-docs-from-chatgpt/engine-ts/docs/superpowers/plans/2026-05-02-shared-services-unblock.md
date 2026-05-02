# Shared Services Unblock Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Purpose:** Land the minimum shared-track work so 4-terminal parallel sessions can fan out without contention. Until these ship, all four tracks are blocked (engine has no safe runner, TUI/MCP have no write surface, extension has no safety endpoint).

**Worktree path:** `worktrees/track-shared/`
**Branch naming:** `feat/shared/<slug>`
**PR labels:** `track:shared`, `area:shared`

---

## Subagent dispatch policy

Default routing: **Sonnet implements, Opus session advises.**

1. Implementer subagents are dispatched as `general-purpose` with `model: "sonnet"`. Per superpowers:subagent-driven-development.
2. The Opus session running this terminal is the orchestrator: it dispatches Sonnet, reviews output between tasks, makes judgment calls.
3. Full Opus subagent takeover only when a blocker proves sticky: 2+ Sonnet attempts failed, hit an architectural wall, or wrong decision needs unwinding.
4. Codex adversarial review (`codex:codex-rescue`) is a mandatory gate before merge regardless of who implemented.

Heartbeat: any subagent running >30min appends timestamps every ~5min to `.claude/agent-status/<id>.log` per superpowers:subagent-heartbeat.

---

## Unblock items

### Item 1: W1.4 — Journal pre-call ordering bug fix

**Status in backlog:** 🟡 in flight as `chore/dispatch-journal-bug-fix`

**Existing plan path:** none (implementation in flight; this plan is the coordination anchor)

**Goal:** Write `order_intent` journal entry *before* `createOrder`, add `reconcileByClientOrderId` resume path. Defeats the crash window where an order exists on Kalshi but has no journal trace.

**Interface contract** (downstream consumers must import):

```typescript
// src/types.ts — new JournalKind values
type JournalKind = ... | 'order_intent' | 'order_placed' // order_placed already exists

// order_intent entry shape (written PRE network call)
interface OrderIntentEntry {
  kind: 'order_intent';
  clientOrderId: string;   // uuid generated before call
  ticker: string;
  side: 'buy' | 'sell';
  priceCents: number;
  count: number;
  ts: string;              // ISO8601
}
```

Resume path: `journal.reconcileByClientOrderId(coid: string): Promise<string | null>` — returns resolved `orderId` from Kalshi or null if not found.

**File-touch boundary:**
- `src/types.ts` — add `order_intent` to `JournalKind`
- `src/exitRunner.ts` — pre-call hook at lines 350-363
- `src/journal.ts` — `reconcileByClientOrderId` method
- `test/exitRunner.test.ts` — crash-window fixture test

**Internal parallelism:** none — single focused fix, 4 hours.

**Tasks:**
- [ ] Add `order_intent` to `JournalKind` in `src/types.ts`
- [ ] Generate `clientOrderId` (uuid) before `createOrder` call in `exitRunner.ts`
- [ ] Write `order_intent` entry before network call
- [ ] Write `order_placed` after response (existing behavior, now paired with intent)
- [ ] Add `reconcileByClientOrderId` to `src/journal.ts`
- [ ] Add resume path that reads orphaned `order_intent` entries and queries Kalshi
- [ ] Write crash-window test (kill between intent and place)
- [ ] Run `npm test && npm run typecheck`

---

### Item 2: W1.1 — Safety persistence + MCP/TUI write surfaces

**Status in backlog:** 🟡 plan ready

**Existing plan path:** `code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-safety-config.md` (READY — full TDD task list)

**Goal:** `$KEA_HOME/safety.json` (atomic write, `0o600`), five MCP write tools, TUI Safety tab, exitRunner merge-at-start.

**Interface contract** (all downstream tracks import from `src/safety.ts`):

```typescript
// src/safety.ts — exported API

export interface SafetyConfig {
  safetySubmittedMultiple?: number;
  floorPriceCents?: number;
  tailSweepThreshold?: number;
  forbiddenTickers?: ForbiddenEntry[];
  maxParticipationRate?: number;
  jitter?: { chunkSizePct: number; loopDelayPct: number };
}

export interface ForbiddenEntry {
  ticker: string;
  reason: string;
  addedAt: string;
}

export function loadSafety(): Promise<SafetyConfig>;
export function getSafety(): Promise<SafetyConfig>;
export function setSafety(patch: Partial<SafetyConfig>): Promise<void>;
export function listForbidden(): Promise<ForbiddenEntry[]>;
export function addForbiddenTicker(ticker: string, reason: string): Promise<void>;
export function removeForbiddenTicker(ticker: string): Promise<void>;
export function mergeIntoExitConfig(cfg: ExitConfig, safety: SafetyConfig): ExitConfig;
```

`safety.json` field shape (written to `$KEA_HOME/safety.json`):
```json
{
  "safetySubmittedMultiple": 1.5,
  "floorPriceCents": 10,
  "tailSweepThreshold": 50,
  "forbiddenTickers": [
    { "ticker": "NASDAQ-100", "reason": "manual block", "addedAt": "2026-05-02T00:00:00Z" }
  ]
}
```

MCP tools added to `src/mcp.ts`:
- `kea_safety_get` — returns current `SafetyConfig` JSON
- `kea_safety_set` — patches one or more fields (only-tighten validation server-side)
- `kea_forbidden_list` — returns `ForbiddenEntry[]`
- `kea_forbidden_add` — adds entry (requires `ticker` + `reason`)
- `kea_forbidden_remove` — removes by ticker

**File-touch boundary:**
- `src/safety.ts` (new)
- `src/types.ts` — `SafetyConfig`, `ForbiddenEntry`, `'safety_config_changed'` journal kind
- `src/exitRunner.ts` — call `mergeIntoExitConfig` at start of `run()`
- `src/mcp.ts` — register five write tools
- `src/cli.ts` — `kea safety get/set`, `kea forbidden add/remove/list`
- `src/tui/SafetyTab.tsx` (new)
- `src/tui/App.tsx` — register Safety tab
- `test/safety.test.ts` (new)
- `test/mcp.test.ts` — cover new tools
- `test/tui-app.test.tsx` — cover Safety tab states

**Internal parallelism:** two parallel Sonnet dispatches after `src/safety.ts` + types land:
- Dispatch A: MCP tools + CLI
- Dispatch B: TUI SafetyTab + App.tsx wiring
(exitRunner integration waits for both, then merges)

**Tasks:**
- [ ] Follow `2026-05-02-safety-config.md` task list verbatim (11 tasks, TDD)
- [ ] `npm test && npm run typecheck` green
- [ ] Codex adversarial gate before merge

---

### Item 3: W1.5 — Buy primitive (`buyRunner`)

**Status in backlog:** 🧊 foundation, highest-leverage prereq after W1.4

**Existing plan path:** none — implement per backlog spec

**Goal:** new `src/buyRunner.ts` mirroring `exitRunner` shape. Same journal (with W1.4 pre-call ordering), same resume semantics, same safety merge. Crosses to the ask side. Extracts shared helpers from `exitRunner` into `src/runnerUtils.ts`.

**Interface contract:**

```typescript
// src/buyRunner.ts — exported API

export interface BuyConfig {
  ticker: string;
  side: 'buy';
  size: number;              // contracts to buy
  maxPriceCents?: number;    // ceiling; safety.json floor still applies
  chunkSize?: number;
  loopDelayMs?: number;
  dryRun?: boolean;
  jobId?: string;            // for resume
}

export interface BuyResult {
  jobId: string;
  filled: number;
  avgPriceCents: number;
  feesIncurredDollars: number;
  remaining: number;
  status: 'complete' | 'partial' | 'error';
}

export function run(cfg: BuyConfig): Promise<BuyResult>;
```

Shared helper module extracted:
```typescript
// src/runnerUtils.ts — extracted from exitRunner.ts
export function chooseChunkSize(...): number;
export function computeAdaptiveChunk(...): number;
export function tailSweep(...): Promise<void>;
```

**File-touch boundary:**
- `src/buyRunner.ts` (new)
- `src/runnerUtils.ts` (new — extract from exitRunner)
- `src/exitRunner.ts` — import from runnerUtils (refactor, no behavior change)
- `src/types.ts` — `BuyConfig`, `BuyResult`
- `test/buyRunner.test.ts` (new)
- `test/runnerUtils.test.ts` (new)

**Internal parallelism:** single Sonnet dispatch — sequential, ~2 days.

**Dependency on shared:** requires W1.4 (pre-call ordering) to be merged first so `buyRunner` inherits the correct journal pattern.

**Tasks:**
- [ ] Extract shared helpers from `exitRunner.ts` to `src/runnerUtils.ts`
- [ ] Update `exitRunner.ts` to import from `runnerUtils`
- [ ] Test: `exitRunner` tests still pass
- [ ] Implement `src/buyRunner.ts` mirroring `exitRunner` shape but crossing ask side
- [ ] Journal: `order_intent` → `order_placed` → `order_reconciled` (W1.4 pattern)
- [ ] Safety merge: call `mergeIntoExitConfig` (W1.1 pattern, adapted for buy side)
- [ ] Resume semantics: re-reads journal on restart, decrements from `size`
- [ ] `test/buyRunner.test.ts`: unit + crash-window fixture tests
- [ ] `npm test && npm run typecheck` green

---

### Item 4: W4.5 — Harvest planner internals

**Status in backlog:** 🧊 decision + optimization layer, shared tag (MCP + TUI + ext)

**Existing plan path:** none — implement per backlog spec + memory notes

**Goal:** pure computation module `src/harvestPlanner.ts` — EV crossover math, risk-reduction sizing table, no-loss-floor row. MCP tool `kea_harvest_planner`. CLI `kea plan`. TUI "what-if" panel deferred to tui-mcp track.

**Interface contract:**

```typescript
// src/harvestPlanner.ts — exported API

export interface HarvestPlannerInput {
  ticker: string;
  side: 'sell';
  position: number;           // contracts held
  costBasisCents: number;     // total cost basis in cents
  marketP: number;            // market-implied probability (0-1)
  privateP: number;           // operator's private probability (0-1)
  catalystType: 'soft' | 'hard';
  catalystExpectedDate?: string; // ISO8601
  payoutCents?: number;          // default 100 (binary = $1)
}

export interface HarvestPlannerOutput {
  pStar: number;              // EV crossover: avg_harvest_price / payout
  evHold: number;             // EV(hold) in dollars
  evHarvestNow: number;       // EV(sweep now)
  evPatientScaleOut: number;  // EV(patient S1)
  harvestIsEvPositive: boolean;
  riskReductionTable: RiskReductionRow[];  // 10/25/50/75% + no-loss-floor
  greeks: {
    delta: number;            // current bid as % (= market p_implied)
    thetaPerDay?: number;     // EV decay per day (requires catalystExpectedDate)
    gammaProxy: number;       // bid-ask × visible book depth
  };
  suggestedStrategies: string[];  // e.g. ["S1 passive", "S7 scale-out"]
}

export interface RiskReductionRow {
  fraction: '10%' | '25%' | '50%' | '75%' | 'no-loss-floor';
  harvestQty: number;
  cashLocked: number;
  evGiveUp: number;
  sigmaReduction: number;
}

export function computeHarvestPlan(
  input: HarvestPlannerInput,
  orderbook: Orderbook
): HarvestPlannerOutput;
```

MCP tool `kea_harvest_planner` input/output:
- Input: `HarvestPlannerInput` shape (all fields)
- Output: `HarvestPlannerOutput` JSON, formatted in TradFi vocabulary sections (Delta / Theta / Gamma proxy / Sleeve sizing / No-loss-floor)

**File-touch boundary:**
- `src/harvestPlanner.ts` (new)
- `src/mcp.ts` — register `kea_harvest_planner` tool
- `src/cli.ts` — add `kea plan` subcommand
- `src/types.ts` — `HarvestPlannerInput`, `HarvestPlannerOutput`, `RiskReductionRow`
- `test/harvestPlanner.test.ts` (new)
- `test/mcp.test.ts` — cover `kea_harvest_planner`

**Internal parallelism:** after `src/harvestPlanner.ts` + types land, two parallel dispatches:
- Dispatch A: MCP tool registration
- Dispatch B: CLI `kea plan` subcommand

**Tasks:**
- [ ] Add types to `src/types.ts`
- [ ] Implement `computeHarvestPlan` in `src/harvestPlanner.ts`
  - [ ] `pStar = avgHarvestPrice / payoutCents`
  - [ ] EV table (hold, sweep, patient scale-out) under `marketP` and `privateP`
  - [ ] Risk-reduction table for 10/25/50/75% + no-loss-floor row
  - [ ] Greeks: delta (current bid%), thetaPerDay (if catalystDate), gammaProxy
- [ ] Unit tests against worked example from `docs/strategies/2026-05-02-winning-exit-mvvr-p4.md`
- [ ] Register `kea_harvest_planner` in `src/mcp.ts`
- [ ] Add `kea plan` CLI subcommand in `src/cli.ts`
- [ ] `npm test && npm run typecheck` green

---

## Internal parallelism within unblock

```
W1.4 (bug fix, ~4h) ──────────────────────────────────────────┐
                                                               ↓
W1.1 (safety, ~1.5d) ─────────────────────────────────────────┤
                                                               ↓
W1.5 (buyRunner, ~2d) ← gates on W1.4 merged ─────────────────┤
                                                               ↓
W4.5 (harvest planner, ~2d) ← no hard gate on W1.x ───────────┘
```

- W1.4 and W1.1 can start **in parallel** immediately.
- W4.5 has **no hard gate** on W1.x (pure computation, reads existing primitives) — start in parallel with W1.1.
- W1.5 **gates on W1.4 merged** (must inherit correct journal pattern). Start W1.5 as soon as W1.4 PR is merged.

**Recommended 2-session split:**
- Session A: W1.4 → W1.5 (serial, bug fix then runner)
- Session B: W1.1 ‖ W4.5 (parallel dispatches within session)

---

## Sync point — "done enough to fan out"

All four tracks can start their first story when:
- [ ] W1.4 merged to main (journal pre-call fix — correctness gate)
- [ ] W1.1 merged to main (`safety.ts` + MCP write tools + `SafetyConfig` type exported)
- [ ] W1.5 merged to main (`buyRunner.ts` + `runnerUtils.ts` exported)

W4.5 harvest planner can merge in parallel without blocking fan-out. TUI what-if panel (owned by tui-mcp track) follows after W4.5 core lands.

Operator verification: run `npm test` from `code-and-docs-from-chatgpt/engine-ts/` — all green on main before dispatching 4 track sessions.
