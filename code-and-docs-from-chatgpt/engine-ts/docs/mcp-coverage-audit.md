# MCP coverage audit — 2026-05-09

**Goal.** Survey what the engine exposes via MCP vs CLI; map gaps; suggest follow-up tickets for anything material.

**Method.** Enumerate both surfaces directly from source: CLI top-level commands from the `runCli` switch in `src/cli.ts`, MCP tools from the registration list in `src/mcp.ts`. Then cross-map and triage.

**Sources of truth (verifiable):**
- CLI: `awk '/async function runCli/,/^}/' src/cli.ts | grep -E "^    case '"` → 28 distinct user commands (excluding `help`/`--help`/`-h`).
- MCP: `grep -nE "^    '[a-z_]+'," src/mcp.ts` → 55 registered tools.

---

## CLI surface (28 commands)

| Command | Purpose |
|---|---|
| `login` / `logout` / `use` / `whoami` | Profile management |
| `balance` (via `whoami` profile) | (no top-level command — gap) |
| `positions` | List held positions |
| `resting` | List resting orders |
| `cancel-resting` | Cancel one resting order |
| `book` | Display orderbook |
| `preview` | Dry-run preview a config |
| `start` | Start an exit run from a config file |
| `resume` | Resume a crashed job |
| `journal` | Read journal entries |
| `report` | TCA report for a job |
| `plan` | EV-weighted harvest planner |
| `recommend` | Strategy recommender |
| `ev` | Expected-value math |
| `size` | Kelly sizer |
| `strategy <sub>` | Launch any strategy by name (subcommands: aggressive / passive / stealth / limit-ladder / stop-and-reverse / roll / prepend-then-sweep / s-twap / s-basis-arb / s-cash-raise / s-iceberg / s-market-make / s-pair / s-pre-resolution-arb / s-time-emergency) |
| `safety <get\|set>` | Safety config CRUD |
| `forbidden <list\|add\|remove>` | Forbidden-tickers CRUD |
| `watch <register\|list\|cancel\|start>` | Synthetic order types (triggers) |
| `portfolio <plan>` | Multi-position planner |
| `alerts <register\|list\|cancel>` | Notify-only synthetics |
| `policy <add\|list\|remove>` | Workflow policies |
| `workflow <register\|list\|get\|cancel\|template-list\|template-register>` | Workflow orchestration |
| `edge` | Per-strategy edge attribution |
| `micro <trial\|sweep\|status>` | Validation harness (SH-MICRO) |
| `record <start\|sync\|discover>` | Multi-ticker recorder |
| `backtest <run\|sweep\|report>` | Backtest harness |

## MCP surface (55 tools)

Grouped by purpose:

| Category | Tools |
|---|---|
| Profile / state | `kea_whoami`, `kea_balance`, `kea_positions`, `kea_resting_orders`, `kea_orderbook` |
| Decision | `kea_preview`, `kea_recommend`, `kea_ev`, `kea_size`, `kea_harvest_planner`, `kea_portfolio_plan` |
| Execution (strategy) | `kea_strategy_run` (unified), plus per-strategy: `kea_strategy_aggressive`, `kea_strategy_stealth`, `kea_strategy_limit_ladder`, `kea_strategy_stop_and_reverse`, `kea_strategy_roll`, `kea_strategy_prepend_then_sweep`, `kea_strategy_s_twap`, `kea_strategy_s_basis_arb`, `kea_strategy_s_cash_raise`, `kea_strategy_s_iceberg`, `kea_strategy_s_market_make`, `kea_strategy_s_pair`, `kea_strategy_s_pre_resolution_arb`, `kea_strategy_s_time_emergency` |
| Safety | `kea_safety_get`, `kea_safety_set`, `kea_forbidden_list`, `kea_forbidden_add`, `kea_forbidden_remove` |
| Synthetics (triggers) | `kea_synthetic_register`, `kea_synthetic_list`, `kea_synthetic_get`, `kea_synthetic_cancel`, `kea_synthetic_history`, `kea_synthetic_preview`, `kea_alert_register`, `kea_bracket_arm`, `kea_trailing_status` |
| Observability | `kea_journal_list`, `kea_journal_read`, `kea_replay`, `kea_tca_summary`, `kea_edge_summary`, `kea_edge_per_strategy` |
| Policy / workflow | `kea_policy_add`, `kea_policy_list`, `kea_policy_remove`, `kea_workflow_register`, `kea_workflow_list`, `kea_workflow_get`, `kea_workflow_cancel`, `kea_template_list`, `kea_template_register` |

---

## Cross-map (CLI → MCP)

| CLI command | MCP tool | Status |
|---|---|---|
| `login` / `logout` / `use` | (none) | **by-design** — auth is operator-side, not agent-facing |
| `whoami` | `kea_whoami` | ✅ exact match |
| `positions` | `kea_positions` | ✅ exact match |
| `resting` | `kea_resting_orders` | ✅ exact match |
| `cancel-resting` | (none) | **gap** — must-fix for agent-driven order cancellation |
| `book` | `kea_orderbook` | ✅ exact match |
| `preview` | `kea_preview` | ✅ exact match |
| `start` | (none) | **by-design** — `start` is config-file-driven; agents use `kea_strategy_run` |
| `resume` | (none) | **gap** — should-fix; an agent that started a job should be able to resume it after crash |
| `journal` | `kea_journal_read`, `kea_journal_list` | ✅ richer on MCP side |
| `report` | `kea_tca_summary` | ✅ match (but see notes below) |
| `plan` | `kea_harvest_planner` | ✅ exact match |
| `recommend` | `kea_recommend` | ✅ exact match |
| `ev` | `kea_ev` | ✅ exact match |
| `size` | `kea_size` | ✅ exact match |
| `strategy <sub>` | `kea_strategy_<sub>` (15 tools) | ✅ comprehensive |
| `safety get/set` | `kea_safety_get/set` | ✅ exact match |
| `forbidden list/add/remove` | `kea_forbidden_list/add/remove` | ✅ exact match |
| `watch register/list/cancel` | `kea_synthetic_register/list/cancel/get` | ✅ exact match (per SP3.1 design decision: triggers reuse synthetic CRUD) |
| `watch start` | (none) | **by-design** — daemon process management is operator-side |
| `portfolio plan` | `kea_portfolio_plan` | ✅ exact match |
| `alerts register/list/cancel` | `kea_alert_register` | **gap** — should-fix; only register exposed, no list/cancel |
| `policy add/list/remove` | `kea_policy_add/list/remove` | ✅ exact match |
| `workflow register/list/get/cancel/template-list/template-register` | full set | ✅ comprehensive |
| `edge` (no flags) | `kea_edge_summary` | ✅ match |
| `edge --strategy` | `kea_edge_per_strategy` | ✅ match |
| `edge --trigger` / `--market` / `--param` / `--ticker` / `--json` | (none) | **gap** — should-fix; SH-EDGE-POLISH (PR #169) added these CLI flags but MCP equivalents not yet exposed |
| `micro trial` | (none) | **gap** — must-fix-IFF agent should drive validation; deliberate decision-point per SH-MICRO design (operator-only via TTY-mandatory confirm) |
| `micro sweep` | (none) | **by-design** — same TTY-mandatory rationale |
| `micro status` | (none) | **gap** — should-fix; read-only status, no execution side, safe for agents |
| `record start/sync/discover` | (none) | **by-design** — recorder is infra-side, runs on a Fly machine |
| `backtest run/sweep/report` | (none) | **by-design** — backtest is offline; agents would use a separate harness |

## MCP-only tools (no CLI equivalent)

| MCP tool | Why CLI absent |
|---|---|
| `kea_synthetic_history` | Agent-facing reflection over past trigger fires; no operator workflow demands it |
| `kea_synthetic_preview` | Agent-facing what-if; CLI uses inline preview during register |
| `kea_synthetic_get` | One-shot lookup; CLI's `watch list` covers the same need |
| `kea_bracket_arm` | Agent-side bracket helper; CLI uses `watch register --kind bracket` |
| `kea_trailing_status` | Agent-side trailing-stop status; CLI uses `watch list` |
| `kea_replay` | Agent-side replay of a journal in a different config; CLI uses `start --resume` |

These are deliberately agent-facing and aren't gaps.

---

## Gaps — triage

| Gap | Severity | Recommended ticket |
|---|---|---|
| `kea_cancel_resting` (cancel a single resting order) | **must-fix** | `SH-MCP-CANCEL-RESTING` — straightforward MCP shim over the existing CLI handler. ~1h. |
| `kea_micro_status` (read-only harness state) | **should-fix** | `SH-MCP-MICRO-STATUS` — agent-consumable; no execution risk; reuses the JSON envelope shipped in PR #173. ~1h. |
| `kea_edge_*` flags (--trigger / --market / --param / --ticker / --json envelope) | **should-fix** | `SH-MCP-EDGE-FILTERS` — extend `kea_edge_summary` schema with optional filter params; emit JSON envelope shape from PR #169. ~2h. |
| `kea_alerts_list` / `kea_alerts_cancel` | **should-fix** | `SH-MCP-ALERTS-CRUD` — alerts already have register; mirror list/cancel from synthetic CRUD. ~1h. |
| `kea_resume` | **should-fix (low priority)** | `SH-MCP-RESUME` — agents that started jobs should be able to recover from crash. Not urgent because agent runs typically don't outlive their session. ~2h. |

**Not gaps (by design):**
- Profile management (`login`, `logout`, `use`) — operator-side concerns; agents use the active profile.
- Daemon management (`watch start`, `record start`) — infra-side processes.
- Backtest harness — offline tooling; agents use their own harness.
- `kea_micro_trial` / `kea_micro_sweep` — operator-only by design; SH-MICRO-EXECUTION-LOOP requires mandatory TTY confirmation per trial, so an MCP equivalent would have to refuse non-interactive callers, which is operationally noisy.

## Surface health

- **CLI:** 28 commands, mostly grouped under 7 verbs (`strategy`, `safety`, `forbidden`, `watch`, `portfolio`, `alerts`, `workflow`). Naming is consistent (`<verb> <subverb>`).
- **MCP:** 55 tools, naming consistent (`kea_<topic>_<action>`). One layout quirk: per-strategy tools are individually registered (`kea_strategy_aggressive`, `kea_strategy_stealth`, etc.) AND there's a unified `kea_strategy_run` — agents have two paths. Document which is preferred or deprecate one.

## Out of scope for this audit

- Closing the gaps — that's per-gap follow-up tickets (drafted above).
- MCP schema improvements (zod validation, error format consistency).
- Auth / scoping changes for any tool.
- Deprecation of redundant tools (e.g. consolidating per-strategy MCP tools into `kea_strategy_run`-only) — needs a separate decision.

## Recommended follow-ups

In priority order:
1. **SH-MCP-CANCEL-RESTING** (must-fix). Trivial gap; agents need to cancel resting orders.
2. **SH-MCP-MICRO-STATUS** (should-fix). Cheap; reuses Track D's JSON envelope.
3. **SH-MCP-EDGE-FILTERS** (should-fix). Reuses Track 3's JSON envelope; small schema work.
4. **SH-MCP-ALERTS-CRUD** (should-fix). Symmetry with synthetic CRUD; trivial.
5. **SH-MCP-RESUME** (low priority). File for future, not urgent.

Each is a ~1–2h ticket. None require live testing.
