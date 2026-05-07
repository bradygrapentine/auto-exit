# Strategy Launchers Cluster — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Surface the now-complete strategy library on operator-facing UIs. Ship SP2.2 (TUI strategy picker tab) + SP2.3 (Extension strategy picker). Operators today can only launch strategies via CLI/MCP/HTTP; this cluster gives them keyboard-first (TUI) and Kalshi-page (extension) launchers using the unified `kea_strategy_run` shape from cluster 3.

**Architecture:**
- **SP2.2** — new TUI tab `StrategiesTab.tsx` alongside existing `AccountTab.tsx`/`SafetyTab.tsx`/`SyntheticsTab.tsx`. Lists named strategies (drives off the same enum as `kea_strategy_run`); selecting one prompts an Ink form for the strategy's required inputs; dry-run preview renders inline; confirm → POST to `/strategies/run`. Streams `/status` updates from the running job.
- **SP2.3** — new view `StrategyView.tsx` in `extension/popup/`; replaces today's implicit losing-exit flow. Strategy dropdown drives which form fields render. Live-mode confirm modal (existing `ConfirmModal.tsx`) gates the run. Auto-detected ticker (`TickerField.tsx`, already shipped) and size (`SizeField.tsx`) prefill where applicable.
- File-touch boundaries: SP2.2 owns `engine-ts/src/tui/StrategiesTab.tsx` + a small edit to `engine-ts/src/tui/App.tsx` (tab registration). SP2.3 owns `extension/popup/StrategyView.tsx` + a small edit to `extension/popup/App.tsx` (replace the existing default view dispatch). Disjoint codebases (engine-ts/ vs extension/) — fully parallel-safe.

**Tech stack:** TypeScript + Ink (TUI) + React (extension popup) + Vitest. Patterns:
- TUI tabs: `engine-ts/src/tui/SafetyTab.tsx` (form pattern, `useInput` keyboard nav); `SyntheticsTab.tsx` (multi-mode form, register flow).
- Extension views: `extension/popup/SyntheticsView.tsx` (form + submit + status streaming); `extension/popup/PresetSelector.tsx` (dropdown UX); `extension/popup/ConfirmModal.tsx` (live-mode confirmation).
- Strategy enum source: `kea_strategy_run`'s discriminated union in `engine-ts/src/mcp.ts` — both surfaces import the same enum to stay in sync.

**Phase ordering:**
- **Phase A** (single PR, optional): export the strategy enum + per-strategy schema descriptors as a small library module (`engine-ts/src/strategies/registry.ts`) that both TUI and extension consume. Removes hardcode-duplication risk. ~2 hours.
- **Phase B** (2-way parallel after A merges): SP2.2 + SP2.3 simultaneously.
- **Phase C** (backlog sync): promote SP2.2 + SP2.3 to §7. §SP 11→9, shipped 42→44.

No Phase C wiring batch this cluster — both surface stories ship the wiring inside their own PRs. They consume existing `/strategies/run` endpoint (already shipped in PR #63).

**Subagent dispatch conventions:** same as prior clusters. Worktrees inside project root. node_modules symlinked. Heartbeat per `subagent-heartbeat`.

---

## Phase A — Shared strategy registry

### Task A.1: src/strategies/registry.ts

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/strategies/registry.ts`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/strategies/registry.test.ts`

**Background:** SP2.2 (TUI) and SP2.3 (extension) both need the list of strategies + per-strategy field descriptors (which inputs the form should render). Without a shared registry, each surface hardcodes the list, diverging the moment a new strategy ships. Phase A extracts the strategy metadata into one module both surfaces import.

**Spec:** Pure data + thin types. Each strategy entry:
```typescript
export type StrategyId =
  | 's-aggressive' | 's-twap' | 's-stealth' | 's-pair'
  | 's-pre-resolution-arb' | 's-limit-ladder' | 's-stop-and-reverse'
  | 's-cash-raise' | 's-roll' | 's-iceberg' | 's-basis-arb'
  | 's-prepend-then-sweep' | 's-time-emergency';

export interface StrategyFieldDescriptor {
  name: string;                   // 'ticker', 'size', 'arbTimeboxMs', etc.
  label: string;                  // human-readable
  kind: 'string' | 'number' | 'enum' | 'boolean' | 'array';
  required: boolean;
  enumValues?: readonly string[]; // for kind='enum'
  defaultValue?: unknown;
  helpText?: string;
}

export interface StrategyMetadata {
  id: StrategyId;
  displayName: string;            // 'Aggressive (one-shot IoC)'
  shortDescription: string;       // 1-line summary for picker
  fields: StrategyFieldDescriptor[];
  dangerLevel: 'low' | 'medium' | 'high';  // 'high' = requires confirm
}

export const STRATEGY_REGISTRY: Readonly<Record<StrategyId, StrategyMetadata>>;
export function getStrategyMeta(id: StrategyId): StrategyMetadata;
export function listStrategyIds(): StrategyId[];
```

The 13 strategy entries match the `kea_strategy_run` enum from PR #63. Field descriptors mirror each strategy's `buildXArgs` validation. `dangerLevel: 'high'` for aggressive/pre-resolution-arb/time-emergency (anything that crosses the spread); 'medium' for multi-leg orchestrators (pair, basis-arb, stop-and-reverse, roll); 'low' for passive/stealth/iceberg/limit-ladder/twap/cash-raise/prepend-then-sweep.

**Validation in tests (≥10):**
1. `STRATEGY_REGISTRY` has exactly 13 entries.
2. Every entry's `id` matches its key.
3. Every entry has at least 1 required field (`ticker` for most; `legs` for pair).
4. `getStrategyMeta('s-aggressive')` returns the aggressive entry.
5. `getStrategyMeta('not-a-strategy' as StrategyId)` throws.
6. `listStrategyIds()` returns 13 ids in deterministic order.
7. Field descriptor types are well-formed (kind matches enumValues presence).
8. Danger levels are exactly 'low' | 'medium' | 'high'.
9. Spot-check: `s-pair`'s fields include `legs` (kind='array') and `legSkewPct`.
10. Spot-check: `s-basis-arb`'s fields include `totalDollarBudget` and `perPairSlippageCents`.

**Verify + commit + PR.** Title: `feat(engine): strategy registry — shared metadata for TUI + extension launchers`.

---

## Phase B — TUI + extension strategy pickers (2-way parallel)

### Task B.1: SP2.2 TUI strategy picker tab

**Files:**
- Create: `code-and-docs-from-chatgpt/engine-ts/src/tui/StrategiesTab.tsx`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/tui/StrategiesTab.test.tsx`
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/tui/App.tsx` (small edit — register the new tab)

**Spec:**
- New tab "Strategies" (or "Run") at the keyboard shortcut adjacent to existing tabs. Layout:
  - Top: list of `STRATEGY_REGISTRY` ids with `displayName` + `dangerLevel` badge. Up/down arrow navigation.
  - Mid: when an id is selected, render a form per its `fields[]` descriptor (each field uses Ink-friendly text input). Inline validation per `kind`.
  - Bottom: dry-run preview button → POSTs to `/preview` (existing endpoint) and renders the result. "Run" button → POSTs to `/strategies/run` after a confirm prompt for `dangerLevel === 'high'`.
- Stream live `/status` updates while a run is in progress; show progress + can cancel.
- All keyboard-first — no mouse / no clicks.

**Pattern reference:**
- `src/tui/SyntheticsTab.tsx` — multi-form tab with submit
- `src/tui/SafetyTab.tsx` — list with up/down + 'd' delete
- `src/tui/AccountTab.tsx` — read-only profile dropdown

**App.tsx edit:** register the new `<StrategiesTab />` component in the existing tab map. Aim for a 5–10 line addition; do not refactor.

**Validation/tests (≥12):** see plan structure used in cluster 2 strategy tests. Cover: tab render, navigation, form-per-strategy rendering, validation per kind, danger-level confirm, dry-run preview, run dispatch, status streaming, cancel, App.tsx tab registration round-trip, accessibility (focus-only-while-tab-active), no-strategy-selected empty state.

**Verify + commit + PR.** Title: `feat(tui): SP2.2 strategy picker tab`. Don't auto-merge.

### Task B.2: SP2.3 Extension strategy picker

**Files:**
- Create: `code-and-docs-from-chatgpt/extension/popup/StrategyView.tsx`
- Create: `code-and-docs-from-chatgpt/extension/popup/StrategyDropdown.tsx`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/extension/strategy-view.test.tsx`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/extension/strategy-dropdown.test.tsx`
- Modify: `code-and-docs-from-chatgpt/extension/popup/App.tsx` (small edit — replace today's implicit losing-exit dispatch with strategy-driven view selection)

**Spec:**
- New header dropdown (`StrategyDropdown.tsx`) — replaces the implicit "exit current position" mode that exists today. Selection drives which subset of fields render in `StrategyView.tsx`.
- `StrategyView.tsx` consumes `STRATEGY_REGISTRY` (same source as TUI) — renders the form per `fields[]`. Auto-prefill from existing `TickerField.tsx` + `SizeField.tsx` where applicable.
- Live-mode confirm modal (existing `ConfirmModal.tsx`) gates submission for `dangerLevel === 'high'`. Submit → POST to `/strategies/run`.
- Status streaming reuses existing `StatusView.tsx` once a run is dispatched.
- Visual: vertical layout (panel is narrow). Dropdown collapses long strategy list. `dangerLevel === 'high'` strategies render with a warning chip.

**Pattern reference:**
- `extension/popup/SyntheticsView.tsx` — form + submit pattern
- `extension/popup/PresetSelector.tsx` — dropdown UX
- `extension/popup/ConfirmModal.tsx` — live-mode confirm
- `extension/popup/TickerField.tsx`, `SizeField.tsx` — prefill components
- `extension/popup/StatusView.tsx` — status streaming

**App.tsx edit:** replace the implicit losing-exit dispatch with `<StrategyView selectedStrategy={...} />`. Aim for ≤20 line change; do not refactor unrelated code.

**Validation/tests (≥12):** strategy dropdown renders 13 entries with danger badges, selection drives field render, ticker/size prefill, danger-level confirm flow, run dispatch, status stream, App.tsx integration, accessibility (keyboard navigation), narrow-vertical layout doesn't overflow, fallback when no ticker auto-detected.

**Verify + commit + PR.** Title: `feat(extension): SP2.3 strategy picker — replace implicit losing-exit with full launcher`. Don't auto-merge.

---

## Phase C — Backlog sync

Promote 2 stories to §7:
- SP2.2 TUI strategy picker tab — link Phase B.1 PR
- SP2.3 Extension strategy picker — link Phase B.2 PR

Plus Phase A registry as a §7 entry (foundation work, not a backlog story).

Update §0: §SP1–SP4 11→9, shipped 42→44.

Replace removed §SP2.2 / §SP2.3 sections with `_<id> shipped — see §7._` stub pointers.

PR: `chore(backlog): sync — strategy launchers cluster shipped`. Auto-merge.

---

## Cost & ordering

| Phase | Tasks | Parallelism | Wall-clock |
|---|---|---|---|
| A — registry | A.1 | direct or single Sonnet | ~2 hours |
| B — surface pickers | B.1 + B.2 | 2-way parallel | ~1.5 days real / ~3-4 hours parallel |
| C — backlog sync | direct | — | ~10 min |

**Total: ~2 days with parallelism.**

## Verification matrix

| Concern | Verification | Phase |
|---|---|---|
| Strategy registry has 13 entries | unit test | A |
| Field descriptors well-formed | unit test (kind matches enumValues) | A |
| TUI tab registers in App.tsx | integration test | B.1 |
| TUI form renders per-strategy fields | unit test | B.1 |
| TUI dry-run preview round-trips | integration test (mock fetch) | B.1 |
| TUI danger-level confirm flow | unit test | B.1 |
| Extension dropdown renders 13 entries | unit test | B.2 |
| Extension form prefills from TickerField/SizeField | unit test | B.2 |
| Extension danger-level confirm via ConfirmModal | integration test | B.2 |
| App.tsx integration (both surfaces) | integration tests in their respective test dirs | B |

## Open questions / explicit non-goals

1. **SP1.5/SP1.7/SP1.8 extension polish** — explicitly deferred. All four extension SP1.x stories edit `popup/App.tsx`, which would force serial integration if bundled. Plan a follow-up "extension polish cluster" after SP2.3 lands.
2. **TUI auto-execute streaming** — SP2.2 streams status, but full live-update polish (sparklines, multi-strategy parallel runs in a single tab) is deferred.
3. **Strategy registry as MCP-discoverable** — out of scope. Today the registry is consumed only by TUI + extension. Exposing as `kea_strategies_list` MCP tool is a follow-up if the agent (LLM) wants the same metadata.
4. **SH-WATCH presets in launcher** — `s-trail`, `s-step-trail`, `s-bracketed-exit`, `s-conditional-roll` are NOT in the registry's 13 entries. These are synthetic-watcher presets, not one-shot launchers; they belong in the existing `SyntheticsTab.tsx` flow, not the new strategy launcher. Document in registry comments.
5. **Live-trading vs dry-run gating** — both surfaces respect existing global dry-run/live mode. No new gating in this cluster.
