# Strategy Composition / State Machines (Spec)

**Status:** Draft, 2026-05-05
**Author:** Brady (with Claude Code)
**Story ID (proposed):** SH-COMPOSE
**Related:**
- `code-and-docs-from-chatgpt/engine-ts/docs/superpowers/specs/2026-05-05-synthetic-order-types-watcher.md` (SH-WATCH — per-position synthetic watchers; this story sits directly on top, see lines 36–63 for the watcher architecture and lines 65–103 for the v1 synthetic types it produces fire events from).
- `code-and-docs-from-chatgpt/docs/STRATEGIES.md` (S1–S16 strategy library — composition nodes invoke these).
- SH-WATCH journal kinds `'synthetic_fired'` / `'synthetic_canceled'` (SH-WATCH spec line 63, line 143).

---

## 1. Goal

Add a **meta-layer above synthetics, strategies, and triggers** that lets operators compose multi-stage trading workflows. Two complementary capabilities:

1. **State-machine workflows.** A workflow is a small directed graph of states. Edges fire on observable journal events (`synthetic_fired`, `synthetic_canceled`, `fill_received`, `time_elapsed`). On each transition the engine executes one or more declarative actions (register a synthetic, cancel a synthetic, run a strategy, emit an alert).
2. **Operator-configured default policies.** Condition→action rules that the system applies automatically the moment a new position is detected (via Kalshi position polling or the extension hook).

Together these turn auto-exit from a fire-once primitive into a continuous bookkeeping engine for multi-stage lifecycles: entry → bracket → trail → roll → re-arm.

**Non-goal for this story:** custom workflow authoring UX, AI-suggested workflows, visual graph editor, multi-account portfolios. v1 ships prebuilt templates + a JSON workflow file format only.

## 2. Why this matters — what labor it outsources

Today, after every synthetic fire the operator must manually decide and execute the *next* armed state:
- S-trail fires → operator must remember to re-arm a fresh trailing stop on residual size.
- Take-profit rung 3 fills → operator must swap remaining synthetics from TP-mode to trail-mode.
- Stop-loss fires on KXNFL-26 → operator must manually evaluate whether to deploy capital into KXNBA-26 dip.
- Position opens → operator must remember to arm a stop-loss before walking away.

Each of these is a bookkeeping task that an operator does in their head and screws up under fatigue. Synthetics + triggers solve the "what to do when X" problem one event at a time. Workflows solve the "and then what" problem — they turn the operator's mental state machine into a durable, replayable artifact.

**Empirical motivator:** today's KXMETGALA-26-LAD position. After the algo's first scale-out fired, the operator never re-armed the trail on the residual; price pinned the floor before manual intervention. A single `continuous-trailing` workflow template would have re-armed automatically.

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Existing layer (SH-WATCH)                                        │
│    watchers.ndjson  ←  per-position synthetic watchers            │
│         │                                                          │
│         ▼ emits 'synthetic_fired' / 'synthetic_canceled'           │
│  ─────────────────────────────────────────────────────────────    │
│  New layer (SH-COMPOSE)                                            │
│                                                                    │
│  ┌──────────────────────────┐    ┌──────────────────────────┐    │
│  │  Workflow engine          │    │  Default policy engine    │    │
│  │  (subscribes to journal)  │    │  (subscribes to position- │    │
│  │                           │    │   detection events)       │    │
│  │  - active workflow set    │    │                           │    │
│  │  - advances state on      │    │  - rule set [if→then]     │    │
│  │    matching transitions   │    │  - applied once per       │    │
│  │  - executes actions       │    │    detected new position  │    │
│  └──────────┬───────────────┘    └──────────┬───────────────┘    │
│             │                                │                      │
│             ▼                                ▼                      │
│       workflows.ndjson                 (writes back into            │
│       (per-instance state)              the synthetic registry      │
│                                          via watcher API)           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 Workflow definition format

Declarative JSON. **Restricted on purpose** — no expressions, no scripting, no Turing-completeness. A workflow is `{ id, version, initialState, states }`. Each state is `{ name, onEntry?: Action[], transitions: Transition[] }`. Each transition is `{ on: EventMatcher, guard?: SimplePredicate, actions: Action[], next: StateName | 'TERMINAL' }`.

Allowed `EventMatcher` types (closed set):
- `{ kind: 'synthetic_fired', syntheticId?: string, syntheticKind?: SyntheticKind, ticker?: string }`
- `{ kind: 'synthetic_canceled', syntheticId?: string }`
- `{ kind: 'fill_received', ticker?: string, side?: 'yes'|'no' }`
- `{ kind: 'time_elapsed', durationMs: number }` (relative to state entry)
- `{ kind: 'time_at', timestamp: number }` (absolute wall clock)

Allowed `Action` types (closed set):
- `{ type: 'register_synthetic', synthetic: SyntheticConfig }`
- `{ type: 'cancel_synthetic', syntheticId: string | { ref: 'last_registered' } }`
- `{ type: 'run_strategy', strategy: SId, params: object }`
- `{ type: 'alert', channel: 'log'|'tui'|'mcp', message: string }`
- `{ type: 'set_var', key: string, value: literal | { ref: 'event.<field>' } }` — bounded scratchpad (see §3.5)

Allowed `SimplePredicate` (closed set, no general expressions):
- `{ field: 'event.ticker', op: 'eq'|'neq'|'in', value: string|string[] }`
- `{ field: 'event.priceCents', op: 'gte'|'lte'|'gt'|'lt', value: number }`
- `{ field: 'var.<key>', op: 'eq'|'neq'|'gte'|'lte', value: literal }`
- `{ all: SimplePredicate[] }` / `{ any: SimplePredicate[] }`

Anything more expressive than this is rejected at load time. Operators don't get to write JS. If a workflow needs custom logic, it goes in the strategy library as a new `S-*` and gets invoked via `run_strategy`.

### 3.2 Workflow engine

Long-running watcher (sibling to `src/watcher.ts`). Responsibilities:
- Subscribe to the existing journal via tail/poll on `watchers.ndjson` and on the existing job journal.
- Maintain an in-memory map of `{ instanceId → { definitionId, currentState, vars, history } }`.
- On each incoming event, for each active instance: evaluate every transition out of the current state in declared order; first match wins; execute its actions; advance state; persist.
- Idle-when-empty (no active instances → no journal subscription cost beyond a tail handle).
- Respects `safety.ts` caps on every `register_synthetic` / `run_strategy` action — same hooks the runners already pass through.

### 3.3 Default policy engine

Separate watcher subscribed to **position-detection events** (Kalshi `/positions` poll diff + the extension's `position_detected` hook). Distinct from the workflow engine because:
- It fires once per new position, not per journal event.
- Its rule shape is flat condition→action, not a state machine.
- Deactivating workflows shouldn't deactivate baseline-safety policies (e.g. "never naked overnight").

Rule shape (also closed-set, declarative):
```jsonc
{
  "id": "auto-stop-overnight",
  "when": {
    "all": [
      { "field": "position.quantity", "op": "gt", "value": 0 },
      { "field": "position.hasArmedSynthetic", "op": "eq", "value": false },
      { "field": "clock.localHour", "op": "gte", "value": 20 }
    ]
  },
  "then": [
    { "type": "register_synthetic", "synthetic": { "kind": "stop_loss", "triggerPriceCents": "{{position.avgCostCents - 10}}" } }
  ]
}
```

Template substitution (`{{...}}`) is allowed **only** inside numeric/string fields of `then` actions, with a small whitelist of accessors (`position.*`, `clock.*`, `market.*.volatilityCentsLastHour`). Same anti-Turing-complete constraint as workflows.

### 3.4 Storage

Per-workflow-instance state in `~/.kalshi-exit-assistant/workflows.ndjson`, mirroring `watchers.ndjson` (SH-WATCH spec lines 60, 198). Append-only journal, one record per state change. On daemon restart, replay → resurrect each instance at its last persisted state, re-subscribe to journal events from that point forward.

Default policies live in a separate `policies.json` (single document, edited atomically) — they're configuration, not instance state.

### 3.5 Bounded scratchpad / vars

Each workflow instance has a tiny key/value scratchpad (`vars`). `set_var` is the only mutation; `var.*` is the only read path in predicates. Bounded to ~16 keys, ~1KB per instance, enforced at load time. Prevents workflows from accumulating unbounded state and turning into rogue daemons.

## 4. v1 capabilities

### 4.1 Workflow definition language

JSON, schema-validated at load time. No YAML in v1 (one parser surface). The schema is small enough that it should fit in a single `src/workflows/schema.ts`.

**Loops / cycles:**
- A state may transition back to itself or to an ancestor — explicitly allowed for the continuous-trailing case.
- **Anti-runaway protection:** every workflow declares `maxTransitions: number` (default 50, hard cap 500) and `maxLifetimeMs: number` (default 24h, hard cap 7d). When either is exceeded the instance is force-terminated and an `alert` action is fired. No way to disable the caps.
- A transition that would re-enter the same state more than `maxTransitions` times is rejected.
- Cycles that don't consume external events (e.g. `time_elapsed: 0` self-loops) are statically rejected at load.

### 4.2 Prebuilt workflow templates (ship in v1)

Operators get immediate utility without writing JSON. Each ships as a definition file under `src/workflows/templates/<name>.json` and is parameterized via a small CLI/MCP arg surface.

1. **`continuous-trailing`** — register a trailing stop; on `synthetic_fired`, register a fresh trailing stop on the residual position with the same trail params. Self-loop until position quantity hits zero (terminal).
2. **`ladder-then-trail`** — register an N-rung take-profit ladder; on each fill, advance state; after rung K (configurable, default `K = N-1`), cancel remaining TP rungs and arm a trailing stop on the residual.
3. **`scale-out-then-stop`** — like `ladder-then-trail` but the post-final-rung action is a hard stop-loss at cost basis instead of a trail. "Free trade" / "house money" pattern.
4. **`overnight-auto-stop`** — single-state guard: if local clock crosses configured hour and no synthetic is armed, register a stop-loss at `avgCost - configurableCushion`. Terminal on first arm.
5. **`bracket-then-trail`** — wait for entry fill via a configured entry strategy, arm a bracket (TP + SL), then on first +Xc favorable move cancel the SL and replace with a trail. Multi-stage entry→exit lifecycle.
6. **`cross-market-rebalance`** — on `synthetic_fired` for ticker A (loss exit), evaluate ticker B; if B is below configured dip threshold, fire `S-buy-dip` on B with size = realized A loss × configured factor. Single transition, terminal.
7. **`time-stop-then-trail`** — register a `time-stop` synthetic; if it fires, exit. If price crosses target before deadline, cancel time-stop and arm a trailing stop.
8. **`pre-event-derisk`** — at `T-N hours` before a configured event timestamp, scale out X% via `S7`; at `T-M hours` (M < N), if remaining position exists, fire `S-losing` on residual. Branching workflow keyed on absolute time.

These eight cover the bulk of the operator's mental state machines today. Custom workflow authoring (operators writing their own JSON) is allowed but not advertised in v1 — power-user surface only.

### 4.3 Default policy rules (v1 sample set)

Ship with three example policies in `policies.json` (commented out / opt-in):
- `auto-stop-overnight` (above).
- `auto-trail-large-yes` — every new YES position with `quantity ≥ 100` and `avgCostCents ≥ 50` auto-arms a 5¢ trailing stop and a TP at 95¢.
- `widen-trail-high-vol` — for positions in markets where `market.volatilityCentsLastHour ≥ 8`, override default trail from 5¢ to 10¢.

## 5. File-touch boundary

**New files:**
- `src/workflows/engine.ts` — workflow watcher daemon, instance map, transition evaluator.
- `src/workflows/schema.ts` — JSON schema + load-time validator.
- `src/workflows/journal.ts` — `workflows.ndjson` persistence, replay-on-start.
- `src/workflows/templates/<name>.json` × 8 — prebuilt templates above.
- `src/workflows/templates/index.ts` — template registry / param surface.
- `src/policies/engine.ts` — default-policy watcher subscribed to position-detection events.
- `src/policies/schema.ts` — policy rule schema + validator.
- `src/policies/store.ts` — `policies.json` read/write.
- `test/workflows/*.test.ts` — per-template scenario tests (event walks → assert state path).
- `test/workflows/anti-runaway.test.ts` — caps enforcement.
- `test/policies/*.test.ts` — rule evaluation against synthesized position events.

**Modified files:**
- `src/types.ts` — `WorkflowDef`, `WorkflowInstanceState`, `WorkflowEvent`, `Action`, `EventMatcher`, `Predicate`, `PolicyRule`; new JournalKinds `'workflow_started'`, `'workflow_transitioned'`, `'workflow_terminated'`, `'policy_applied'`.
- `src/cli.ts` — `kea workflow {start, list, cancel, status, history}`, `kea policy {list, set, remove}`.
- `src/index.ts` (MCP server) — tools `kea_workflow_register`, `kea_workflow_list`, `kea_workflow_cancel`, `kea_workflow_history`, `kea_policy_set`, `kea_policy_list`.

**No changes to:**
- `src/watcher.ts` and `src/synthetics/*` — workflows consume their journal events and call `register/cancel` through their existing public API. SH-WATCH is treated as a stable substrate.
- `exitRunner.ts`, `buyRunner.ts`, `harvestPlanner.ts`, `safety.ts`.

## 6. Surface

- **CLI:** `kea workflow start <template> [--params k=v ...]`, `kea workflow list`, `kea workflow cancel <instanceId>`, `kea workflow status <instanceId>`, `kea workflow history <instanceId>`. `kea policy set <ruleFile>`, `kea policy list`, `kea policy remove <id>`.
- **MCP tools:** `kea_workflow_register` (start instance from template or inline def), `kea_workflow_list`, `kea_workflow_cancel`, `kea_workflow_history` (replay an instance's transition log), `kea_policy_set`, `kea_policy_list`.
- **TUI:** Workflows tab listing active instances with `templateId`, `currentState`, `transitionsSoFar / maxTransitions`, `vars`, manual cancel. Policies tab listing configured rules and last-applied timestamps.
- **Extension:** v2. v1 omits the in-page surface intentionally; workflow management lives in CLI/MCP/TUI until the JSON format settles.

## 7. Resolved design decisions

1. **Workflow versioning when definitions change mid-flight** — instances pin to the **definition snapshot at start time** (full def is copied into the instance journal record). Editing a template never affects in-flight instances. Operators must explicitly cancel + re-register to adopt a new def. Avoids a class of "I edited the template and my running stop disappeared" bugs.
2. **Workflows composing other workflows** — **disallowed in v1.** Actions cannot include `start_workflow`. Composition happens inside a workflow via direct `register_synthetic` / `run_strategy` actions, not by spawning child workflows. Reconsider in v2 once the action surface is proven.
3. **Safety caps** — every `register_synthetic` and `run_strategy` action passes through the same `safety.ts` checks the runners use (size caps, daily-loss caps, naked-position caps). Workflow cannot bypass safety. A safety rejection is treated as a no-op transition with an `alert` action and journaled as `'workflow_action_rejected'`.
4. **Reentrancy** — when a workflow's action fires another journal event (e.g. `register_synthetic` → eventually `synthetic_fired`), the workflow engine processes events strictly **serially per instance**: the action's downstream events are queued until the current transition finishes. Cross-instance, events fan out concurrently. No transition can observe its own action's output within the same tick.
5. **Idempotency** — every action carries an `actionId` (deterministic from `instanceId + transitionIndex + actionIndex`). On replay/restart, actions whose `actionId` already appears in the watchers/jobs journal are skipped. Prevents double-arming on crash recovery.
6. **Instance identity** — `instanceId` is `<templateId>-<startTimestamp>-<random4>`. Used as the correlation key on every emitted journal record.
7. **Default policy precedence** — policies evaluate in declared order. First matching rule applies; subsequent rules see the now-armed-position and typically skip. Operators can opt into "all matching rules apply" with a global flag, but default is first-match for predictability.

## 8. Open questions

1. **Graphical workflow builder vs JSON-only.** v1 is JSON-only. A GUI builder (extension or TUI) is a v2/v3 question — depends on whether operators actually author custom workflows or just parameterize templates. Defer until usage data answers.
2. **Debugging / replay.** `kea workflow history <id>` replays the transition log; do we also need a "what would this workflow do if event X fired now" preview tool? Likely yes for operator confidence, but cuts into v1 scope.
3. **Timer-based transitions.** v1 includes `time_elapsed` and `time_at`. Open: do we also want recurring timers (`every_minutes: N`) for poll-style workflows, or do those belong in synthetics? Leaning "synthetics" — workflows shouldn't be the place to encode "poll every 30s for X."
4. **Policy authoring UX.** JSON file is fine for the operator, but the eventual TUI should probably have a guided builder (template gallery + parameter form). Out of scope for v1.
5. **Cross-account / multi-broker.** Workflows currently assume a single Kalshi account. Multi-account is a portfolio-level concern; flagged for the long-term roadmap (parallels SH-WATCH's `S-portfolio-stop` deferral, SH-WATCH spec line 124).
6. **Event ordering across journals.** Workflow engine reads from both `watchers.ndjson` and the existing job journal. Open: do we need a unified event bus, or is timestamp-merge of two tail handles sufficient? v1 plan: timestamp-merge with a tolerance window; revisit if races appear.

## 9. Roadmap position

- **Depends on:** SH-WATCH being live and emitting `synthetic_fired` / `synthetic_canceled` reliably (SH-WATCH spec §3, §10). Cannot ship before.
- **v1 (this story):** workflow engine + 8 prebuilt templates + default-policy engine + 3 sample policies + CLI/MCP. Operator gets immediate value from templates without writing JSON.
- **v2:** custom workflow authoring as advertised feature, TUI workflow builder, debugging/preview tools, recurring timers if proven needed.
- **v3:** workflows-composing-workflows, multi-account portfolio workflows, AI-suggested workflows from observed operator patterns.

## 10. Future extensions

- **Visual workflow builder** in the Chrome extension and TUI (drag-and-drop states/transitions; emits the same JSON the engine consumes).
- **Community workflow library** — operators share `.json` template files; auto-exit ships a curated set and a "bring your own" import path.
- **AI-suggested workflows** — observe operator's manual re-arm patterns over N positions; suggest a workflow that automates the recurring sequence. Conservative confirmation gate (operator must approve before any new workflow auto-registers).
- **Strategy-library deep integration** — every `S-*` strategy declares a "natural follow-on" annotation; workflow engine offers one-click "wrap this strategy in its standard follow-on workflow" at registration time.
- **Cross-instance coordination primitives** — currently each instance is independent. A future construct (workflow groups / barriers) could let e.g. a portfolio-wide "freeze new entries" flag affect all running instances. Carefully scoped; easy to footgun.
- **Replay-against-history** — given a saved journal, run a candidate workflow def against historical events to estimate how it would have behaved. Pairs with a future strategy-backtester.
