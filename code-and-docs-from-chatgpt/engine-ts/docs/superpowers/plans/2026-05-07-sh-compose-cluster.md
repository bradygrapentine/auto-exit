# SH-COMPOSE Workflow Composition Cluster — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Ship SH-COMPOSE — multi-stage workflow state machines + operator-configured default policies. Adds the meta-layer above synthetics/strategies that turns auto-exit from a fire-once primitive into a continuous bookkeeping engine for entry → bracket → trail → roll → re-arm lifecycles.

**Spec:** `engine-ts/docs/superpowers/specs/2026-05-05-strategy-composition.md` (233 lines, comprehensive). This plan maps the spec to concrete implementation tasks; do NOT re-derive architecture — read the spec first.

**Architecture (from spec §3, condensed):**
- **Workflow engine** — long-running watcher subscribed to `watchers.ndjson` + job journal. In-memory map `{instanceId → {definitionId, currentState, vars, history}}`. On each incoming event, evaluates transitions out of current state in declared order; first match wins; executes declared actions; persists state. Idle-when-empty (no events → no cost). Respects `safety.ts` caps on every `register_synthetic` / `run_strategy` action.
- **Default policy engine** — sibling watcher subscribed to position-detection events. Rule set of `if→then` (condition → action). Applied once per detected new position; no chaining at v1. Same safety hooks.
- **Storage** — `~/.kalshi-exit-assistant/workflows.ndjson` (mirrors `watchers.ndjson`). Per-instance state with append-only journal lines for replay/resume.
- **Workflow definition format** — declarative JSON, restricted (no expressions, no scripting). `{id, version, initialState, states}` where each state has `onEntry?: Action[]` + `transitions: Transition[]`. Closed sets for `EventMatcher` (5 kinds), `Action` (5 types), `SimplePredicate` (3 forms + all/any combinators). See spec §3.1.
- **Anti-runaway:** explicit `maxTransitions` cap (default 50, hard 500); zero-event cycle rejection at load time.

**File structure (planned):**
- `src/workflows/types.ts` — Workflow / Transition / EventMatcher / Action / Predicate / WorkflowInstance types.
- `src/workflows/validate.ts` — load-time schema validator + zero-cycle detection + closed-set enforcement.
- `src/workflows/predicate.ts` — pure SimplePredicate evaluator (`evaluate(predicate, ctx) → boolean`).
- `src/workflows/engine.ts` — `WorkflowEngine` class: subscribe to journal, advance state, execute actions, persist.
- `src/workflows/journal.ts` — append-only `workflows.ndjson` (mirrors `watcherJournal.ts`).
- `src/workflows/policies.ts` — `DefaultPolicyEngine` class: position-detection subscription + rule set.
- `src/workflows/templates.ts` — 8 prebuilt workflow templates exported as JSON literals (per spec §5).
- `src/workflows/index.ts` — barrel export + module-level singletons (mirrors `watcherSingleton.ts`).
- Tests in `test/workflows/*.test.ts`.

**Phase ordering:**
- **Phase A** (single PR): types + schema validator + predicate evaluator (foundation, pure functions). ~1 day.
- **Phase B** (2-way parallel after A merges): workflow engine + default policy engine. File-disjoint (`engine.ts` + `journal.ts` vs `policies.ts`). ~2 days each.
- **Phase C** (single PR): 8 prebuilt templates + CLI/MCP/HTTP surfaces (`kea workflow {register,list,cancel,template-list}` + matching MCP tools + HTTP routes). ~1.5 days.
- **Phase D** (chore PR): backlog sync — promote SH-COMPOSE to §7. §SH 4→3, shipped 47→48.

**Subagent dispatch conventions:** worktrees inside project root, node_modules symlink, heartbeat per `subagent-heartbeat`, explicit `--base main` on `gh pr create`.

---

## Phase A — Types + validator + predicate evaluator

### Task A.1: Foundation modules

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/workflows/types.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/src/workflows/validate.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/src/workflows/predicate.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/workflows/validate.test.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/workflows/predicate.test.ts`

**Background:** The state-machine schema is intentionally restricted (no Turing-completeness) so the validator must reject everything that isn't in the closed sets. The predicate evaluator is a pure function over `(SimplePredicate, EvaluationContext) → boolean` consumed by both the workflow engine and the policy engine.

**Spec reference:** §3.1 (workflow definition format), §3.5 (variable scratchpad / EvaluationContext shape — note the `event.*` and `var.*` field paths). Zero-event cycles must be rejected at load: a cycle exists when there's a path from state X back to X containing only transitions whose EventMatcher kind is `time_elapsed` with `durationMs: 0` (or no event at all — and the spec disallows zero-event transitions entirely; see §3.4).

**Type sketch (types.ts):**

```typescript
export type SyntheticKind = string; // imported from ../types if needed

export type EventMatcher =
  | { kind: 'synthetic_fired'; syntheticId?: string; syntheticKind?: SyntheticKind; ticker?: string }
  | { kind: 'synthetic_canceled'; syntheticId?: string }
  | { kind: 'fill_received'; ticker?: string; side?: 'yes' | 'no' }
  | { kind: 'time_elapsed'; durationMs: number }
  | { kind: 'time_at'; timestamp: number };

export type Action =
  | { type: 'register_synthetic'; synthetic: unknown /* SyntheticConfig */ }
  | { type: 'cancel_synthetic'; syntheticId: string | { ref: 'last_registered' } }
  | { type: 'run_strategy'; strategy: string; params: Record<string, unknown> }
  | { type: 'alert'; channel: 'log' | 'tui' | 'mcp'; message: string }
  | { type: 'set_var'; key: string; value: unknown | { ref: string } };

export type SimplePredicate =
  | { field: string; op: 'eq' | 'neq' | 'in'; value: unknown | unknown[] }
  | { field: string; op: 'gte' | 'lte' | 'gt' | 'lt'; value: number }
  | { all: SimplePredicate[] }
  | { any: SimplePredicate[] };

export interface Transition {
  on: EventMatcher;
  guard?: SimplePredicate;
  actions: Action[];
  next: string | 'TERMINAL';
}

export interface WorkflowState {
  name: string;
  onEntry?: Action[];
  transitions: Transition[];
}

export interface WorkflowDefinition {
  id: string;
  version: number;
  maxTransitions?: number;     // default 50, hard 500
  initialState: string;
  states: WorkflowState[];
}

export interface WorkflowInstance {
  instanceId: string;          // uuid
  definitionId: string;
  currentState: string;
  vars: Record<string, unknown>;
  history: Array<{ from: string; to: string; on: EventMatcher; firedAt: string }>;
  startedAt: string;
  status: 'active' | 'terminal' | 'halted';
  haltReason?: string;
  transitionCount: number;
}

export interface EvaluationContext {
  event?: Record<string, unknown>;   // the inbound EventMatcher payload
  vars: Record<string, unknown>;
}
```

**validate.ts spec:**

```typescript
export function validateWorkflow(def: unknown): { ok: true; def: WorkflowDefinition } | { ok: false; errors: string[] };
```

Checks:
1. Top-level shape (id non-empty, version number, initialState non-empty, states non-empty array).
2. Every transition's `next` matches an existing state name OR is `'TERMINAL'`.
3. `initialState` exists in states.
4. Every EventMatcher has a kind from the closed set.
5. Every Action has a type from the closed set.
6. Every SimplePredicate has `field+op+value` from the closed set OR `all`/`any` recursive.
7. `maxTransitions ≤ 500` if provided.
8. **Zero-event cycle rejection:** flag any state that has a transition with no EventMatcher (transitions MUST have an `on:` field — schema requires it; if absent, validator rejects).
9. **Self-cycle without event-progression:** flag states with a transition `next: <self>` whose EventMatcher is `time_elapsed` with `durationMs: 0`.

**predicate.ts spec:**

```typescript
export function evaluatePredicate(p: SimplePredicate, ctx: EvaluationContext): boolean;
```

- Resolves `field: 'event.X'` against `ctx.event[X]`; `field: 'var.Y'` against `ctx.vars[Y]`.
- `op: 'in'` requires `value` to be an array; checks membership.
- `op: 'gte'|'lte'|'gt'|'lt'` requires both sides numeric; non-numeric → returns false (don't throw).
- `all: []` → true (vacuous); `any: []` → false (vacuous). Document both cases.
- No mutation, no side effects; pure function.

**Tests for validate.ts (≥15):**
1. Minimal valid workflow passes.
2. Empty id rejected.
3. Empty states rejected.
4. initialState pointing to nonexistent state rejected.
5. Transition next pointing to nonexistent state rejected.
6. EventMatcher with unknown kind rejected.
7. Action with unknown type rejected.
8. Predicate with unknown op rejected.
9. maxTransitions > 500 rejected.
10. maxTransitions ≤ 500 accepted, default 50 applied when absent.
11. Self-cycle on time_elapsed:0 rejected.
12. Self-cycle on time_elapsed:1000 accepted (legitimate timeout loop).
13. Predicate `all: []` valid (vacuous true).
14. Predicate `any: []` valid (vacuous false).
15. Nested all/any predicate validates recursively.

**Tests for predicate.ts (≥12):**
1. `{field:'event.ticker', op:'eq', value:'KX-1'}` matches `ctx.event.ticker === 'KX-1'`.
2. `op:'neq'` inverts.
3. `op:'in'` with array matches membership.
4. `op:'gte'/'lte'/'gt'/'lt'` numeric comparison.
5. Non-numeric for numeric op → returns false (no throw).
6. Missing field path → returns false for eq, true for neq.
7. `var.X` resolution.
8. `all: []` → true (vacuous).
9. `any: []` → false (vacuous).
10. Nested `all` of `any` of leaf predicates evaluates correctly.
11. Pure function (calling twice with same input same output).
12. No mutation of ctx.

**Verify + commit + PR.** Title: `feat(workflows): SH-COMPOSE Phase A — types + schema validator + predicate evaluator`.

---

## Phase B — Workflow engine + default policy engine (2-way parallel)

### Task B.1: Workflow engine + journal

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/workflows/engine.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/src/workflows/journal.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/workflows/engine.test.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/workflows/journal.test.ts`

**Spec reference:** §3.2 (workflow engine responsibilities), §4 (storage / replay / resume).

**Spec for `engine.ts`:**
- `WorkflowEngine` class. Constructor: `{ journal: WorkflowJournal, predicateEval, registerSyntheticFn, cancelSyntheticFn, runStrategyFn, alertFn, now: () => number, sleepMs }`.
- `register(definition: WorkflowDefinition): { instanceId }` — validates (via Phase A), persists `workflow_started` journal entry, seeds `WorkflowInstance` in memory.
- `handleEvent(event)` — for every active instance, evaluate transitions in declared order; first matching transition wins; execute its actions; advance state; persist transition. If transitionCount exceeds max, halt instance + journal `workflow_halted_runaway`.
- Action execution dispatches to injected callbacks (`registerSyntheticFn`, etc.). For `register_synthetic` and `run_strategy`, respects safety caps via injection — same hooks the runners already use.
- `cancel(instanceId)` — marks halted, journals `workflow_canceled`.
- `list()` / `get(instanceId)` — read-only accessors.
- Idle-when-empty: if active set is zero, returns immediately on `handleEvent`.

**Spec for `journal.ts`:**
- Append-only NDJSON at `~/.kalshi-exit-assistant/workflows.ndjson` (path overridable via env).
- Journal entry kinds (cast via `jk()` — DO NOT modify shared types.ts):
  - `workflow_started` — instance + initial state
  - `workflow_state_entered` — onEntry actions about to run
  - `workflow_transition` — from, to, on event, transition index
  - `workflow_action_dispatched` — type + outcome
  - `workflow_action_failed` — type + reason
  - `workflow_halted_runaway` — exceeded maxTransitions
  - `workflow_canceled` — operator-initiated
  - `workflow_terminal` — reached TERMINAL state
- `replayFromJournal(path) → Map<instanceId, WorkflowInstance>` — reconstructs in-memory state for resume.

**Pattern reference:**
- `src/watcher.ts` (long-running watcher pattern, idle-when-empty)
- `src/watcherJournal.ts` (append-only NDJSON + replay)
- `src/synthetics/index.ts` (action dispatcher with injectable callbacks)

**Tests (≥18):**
1. `register` validates def via Phase A — invalid throws.
2. `register` persists `workflow_started` and seeds in-memory instance.
3. `handleEvent` matching transition advances state.
4. `handleEvent` non-matching event ignored.
5. First-match-wins ordering when multiple transitions match.
6. onEntry actions run after transition.
7. `register_synthetic` action calls injected fn with synth config.
8. `cancel_synthetic` action with `{ref:'last_registered'}` resolves to most-recent register's id.
9. `run_strategy` action calls injected fn.
10. `alert` action calls injected alertFn with channel + message.
11. `set_var` action mutates instance.vars.
12. Predicate guard blocks transition when false.
13. Predicate guard allows when true.
14. transitionCount enforced — exceeds max → halt + `workflow_halted_runaway`.
15. TERMINAL state stops further transitions; instance.status='terminal'.
16. cancel() marks halted + journals `workflow_canceled`.
17. Idle-when-empty: handleEvent with no instances is fast no-op.
18. replayFromJournal reconstructs active instances + their currentState + vars.

**Tests for `journal.ts` (≥6):** append/read round-trip per kind, file path override, replay matches sequence.

**Verify + commit + PR.** Title: `feat(workflows): SH-COMPOSE Phase B.1 — workflow engine + journal`. Don't auto-merge.

### Task B.2: Default policy engine

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/workflows/policies.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/workflows/policies.test.ts`

**Spec reference:** §3.3 (default policy engine).

**Spec:**
- `DefaultPolicyEngine` class. Constructor: `{ predicateEval, registerSyntheticFn, runStrategyFn, alertFn, now: () => number }`.
- A policy = `{ id, condition: SimplePredicate, action: Action[], applyOncePerPosition: true }`.
- `addPolicy(p)` / `removePolicy(id)` / `listPolicies()`.
- `handlePositionDetected(position)` — evaluate every policy's condition against `{ event: position, vars: {} }`; for matches, execute action[]. Track `applied` set keyed by `{ticker, side}` so a policy doesn't double-apply when the same position re-detects.
- Persists policy set to `~/.kalshi-exit-assistant/policies.json` (atomic write, mirrors `safety.json`).

**Pattern reference:**
- `src/safety.ts` (atomic-write JSON persistence)
- Phase A's `predicate.ts` (re-used here)

**Tests (≥10):**
1. addPolicy + listPolicies round-trip.
2. removePolicy by id.
3. handlePositionDetected runs matching action.
4. Non-matching position ignored.
5. applyOncePerPosition: re-detection of same {ticker,side} doesn't re-fire.
6. Different position (different ticker) re-fires.
7. Persist + reload from file.
8. Atomic write (file integrity under crash — synthetic test simulating partial write).
9. Action dispatch goes through injected callbacks (no direct side effects in tests).
10. Empty policy list is no-op on handlePositionDetected.

**Verify + commit + PR.** Title: `feat(workflows): SH-COMPOSE Phase B.2 — default policy engine`. Don't auto-merge.

---

## Phase C — Templates + surfaces (single PR)

After both Phase B PRs merge, single Sonnet dispatch wires templates + CLI/MCP/HTTP.

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/workflows/templates.ts` — 8 prebuilt workflow templates as exported JSON literals (per spec §5: continuous-trailing, take-profit-then-trail, stop-then-rotate, bracket-and-roll, scale-out-then-rearm, time-decay-stop-loss, drawdown-then-flatten, profit-target-then-iceberg). Validate each at module load.
- Create: `code-and-docs-from-chatgpt/engine-ts/src/workflows/index.ts` — barrel + module-level singletons (`getWorkflowEngine`, `initWorkflowEngine`, `setWorkflowEngineForTests`) mirroring `watcherSingleton.ts`.
- Modify: `src/cli.ts` — add `kea workflow {register, list, get, cancel, template-list, template-register}` subcommands.
- Modify: `src/mcp.ts` — `kea_workflow_register`, `kea_workflow_list`, `kea_workflow_get`, `kea_workflow_cancel`, `kea_workflow_template_list`, `kea_workflow_template_register`, `kea_policy_list`, `kea_policy_add`, `kea_policy_remove`. ~9 tools.
- Modify: `src/server.ts` — `POST /workflows/register`, `GET /workflows/list`, `GET /workflows/:id`, `DELETE /workflows/:id`, `GET /workflows/templates`, `POST /workflows/templates/:name`, `GET/POST/DELETE /policies/...`.
- Modify: `test/mcp.test.ts` — tool surface assertion (+9 names alphabetically).
- Add tests for templates (each template loads + validates) + surface integration tests.

**Pattern reference:**
- PRs #50, #59, #63, #70 (prior wiring batches).
- `src/synthetics/index.ts` + `src/watcherSingleton.ts` (singleton + dispatch shape).

**Verify:** `npx tsc --noEmit && npx vitest run` all green.

**PR title:** `feat(workflows): SH-COMPOSE Phase C — 8 templates + CLI/MCP/HTTP surfaces`.

---

## Phase D — Backlog sync

Promote SH-COMPOSE to §7. Update §0: §SH 4→3, shipped 47→48.

Replace removed `### 🧊 SH-COMPOSE` section with `_SH-COMPOSE workflow composition shipped — see §7._` stub.

PR: `chore(backlog): sync — SH-COMPOSE shipped`. Auto-merge.

---

## Cost & ordering

| Phase | Tasks | Parallelism | Wall-clock |
|---|---|---|---|
| A — types + validator + predicate | A.1 | 1 Sonnet | ~6 hours |
| B — engines | B.1 + B.2 | 2-way parallel | ~1.5 days real / ~6 hours parallel |
| C — templates + surfaces | C.1 | 1 Sonnet | ~1 day |
| D — backlog sync | direct | — | ~10 min |

**Total: ~3 days with parallelism (faster if Phase B runs cleanly).**

## Verification matrix

| Concern | Verification | Phase |
|---|---|---|
| Validator rejects unknown EventMatcher kind | unit test | A |
| Validator rejects zero-duration self-cycle | unit test | A |
| Predicate `all: []` vacuous true | unit test | A |
| Predicate non-numeric for numeric op returns false (no throw) | unit test | A |
| Engine first-match-wins transition order | unit test | B.1 |
| Engine maxTransitions cap halts runaway | unit test | B.1 |
| Engine TERMINAL stops further transitions | unit test | B.1 |
| Engine replayFromJournal reconstructs state | unit test | B.1 |
| Engine `cancel_synthetic` with `last_registered` ref resolves correctly | unit test | B.1 |
| Policy applyOncePerPosition guards re-fire | unit test | B.2 |
| Policy persist + reload | unit test | B.2 |
| 8 templates load + validate | unit tests in templates.test.ts | C |
| MCP tool surface +9 names | test/mcp.test.ts | C |
| Total test count | full suite +60 minimum | D |

## Open questions / explicit non-goals

1. **Custom workflow authoring UX** — out of scope per spec §1. v1 ships prebuilt templates + JSON file format only.
2. **AI-suggested workflows** — out of scope.
3. **Visual graph editor** — out of scope.
4. **Multi-account portfolios** — out of scope.
5. **TUI workflow tab** — defer. CLI + MCP suffice for v1; TUI adds in a follow-up SP cluster.
6. **Extension workflow panel** — defer. Same rationale.
7. **Cross-workflow communication** (one workflow's TERMINAL triggers another's start) — explicitly disallowed in v1; if needed, factor into `run_strategy` action that registers a fresh workflow.
8. **Time-based scheduling beyond `time_elapsed` / `time_at`** — out of scope. Cron-style is a v2 ask.
9. **Workflow versioning / migration** — `WorkflowDefinition.version` field is captured but no automated migration in v1; if a definition's schema changes, retire and re-register.
