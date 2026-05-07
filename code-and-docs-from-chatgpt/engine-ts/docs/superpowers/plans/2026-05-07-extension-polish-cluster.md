# Extension Polish Cluster — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Drain the SP1.x extension polish stories: SP1.5 execution summary card, SP1.7 account/profile switcher, SP1.8 safety panel UI. All three are popup UI work; backlog flagged that they'd collide on `popup/App.tsx` if naively parallelized. Phase A refactors App.tsx into a tabbed layout with explicit slots (header / tabs / footer); Phase B fills in the 3 component files in parallel without touching shared files.

**Architecture:**
- **Phase A** — refactor `extension/popup/App.tsx` from its current single-`<StrategyView />` shell into a 3-zone layout:
  1. **Header zone** (top, `<ProfileSlot />`) — placeholder for SP1.7 dropdown.
  2. **Tab zone** (middle) — tabs `['Strategies', 'Safety']`. Strategies tab renders existing `<StrategyView />`; Safety tab renders `<SafetySlot />` placeholder for SP1.8.
  3. **Summary zone** (bottom, `<SummarySlot />`) — placeholder; SP1.5 will populate it from `StrategyView`'s `onComplete(summaryPayload)` callback.
  Phase A also adds an `onComplete?: (payload) => void` prop to `StrategyView.tsx` so SP1.5 can subscribe without further App.tsx edits.
- **Phase B** (3-way parallel) — each agent owns exactly one component file:
  - **SP1.5** — `SummaryCard.tsx` + small App.tsx wiring (read-only — wire the existing `<SummarySlot />` to render `<SummaryCard payload={...} />` when `StrategyView` calls `onComplete`).
  - **SP1.7** — `ProfileSelector.tsx` filling the existing `<ProfileSlot />` placeholder.
  - **SP1.8** — `SafetyView.tsx` filling the existing `<SafetySlot />` placeholder.

**Why scaffold first:** SP1.5 needs a `StrategyView.onComplete` hook (otherwise it can't know when to show). SP1.7 needs a header. SP1.8 needs tab routing. Three independent edits to App.tsx + StrategyView would force serial integration.

**Tech stack:** React + Vitest. Patterns:
- `extension/popup/PresetSelector.tsx` — dropdown UX (SP1.7 mirrors)
- `extension/popup/SyntheticsView.tsx` — list + add/remove (SP1.8 mirrors for forbidden tickers)
- `extension/popup/StatusView.tsx` — post-completion render pattern (SP1.5 mirrors)
- Server-side endpoints already exist: `/whoami` (SP1.7), `/safety/*` (SP1.8 — verify), `/status` (SP1.5).

**Phase ordering:**
- **Phase A** (single PR): App.tsx 3-zone refactor + `StrategyView.onComplete` hook.
- **Phase B** (3-way parallel after A merges): SP1.5 + SP1.7 + SP1.8.
- **Phase C** (chore PR): backlog sync — promote 3 stories to §7. §SP 9→6, shipped 44→47.

**Subagent dispatch conventions:** worktrees inside project root, node_modules symlink, heartbeat, explicit `--base main` on `gh pr create`.

---

## Phase A — App.tsx 3-zone refactor + StrategyView.onComplete hook

### Task A.1: Refactor App.tsx + add onComplete to StrategyView

**Files:**
- Modify: `code-and-docs-from-chatgpt/extension/popup/App.tsx` — replace the 12-line shell with the 3-zone layout described above. Each zone exports a `<*Slot />` placeholder component (defined inline in App.tsx) that returns `null` for now; Phase B agents replace each slot's `null` body with their component. Tabs use a simple `useState<'strategies' | 'safety'>` toggle.
- Modify: `code-and-docs-from-chatgpt/extension/popup/StrategyView.tsx` — add `onComplete?: (payload: ExecutionSummary) => void` prop. Define `ExecutionSummary` type inline (or in a small new types file): `{ strategyId, jobId, gross, fees, net, slippage?, durationMs }`. Call `onComplete(payload)` when `StatusView` reaches the terminal "done" state. Default prop value is no-op.
- Create: `code-and-docs-from-chatgpt/engine-ts/test/extension/app-shell.test.tsx` — tests for the 3-zone layout, tab toggling, and StrategyView.onComplete dispatch.

**Spec for App.tsx (after refactor):**

```typescript
import { useState } from 'react';
import { StrategyView, type ExecutionSummary } from './StrategyView';

export function App() {
  const [tab, setTab] = useState<'strategies' | 'safety'>('strategies');
  const [summary, setSummary] = useState<ExecutionSummary | null>(null);

  return (
    <div className="popup-app">
      <ProfileSlot />
      <TabBar tab={tab} onTabChange={setTab} />
      <main>
        {tab === 'strategies' && <StrategyView onComplete={setSummary} />}
        {tab === 'safety' && <SafetySlot />}
      </main>
      <SummarySlot summary={summary} />
    </div>
  );
}

// Slot placeholders — Phase B fills these in.
function ProfileSlot() { return null; }
function SafetySlot() { return null; }
function SummarySlot({ summary }: { summary: ExecutionSummary | null }) {
  return summary ? null /* SP1.5 renders SummaryCard here */ : null;
}

function TabBar({ tab, onTabChange }: { tab: 'strategies' | 'safety'; onTabChange: (t: 'strategies' | 'safety') => void }) {
  return (
    <nav>
      <button onClick={() => onTabChange('strategies')} aria-pressed={tab === 'strategies'}>Strategies</button>
      <button onClick={() => onTabChange('safety')} aria-pressed={tab === 'safety'}>Safety</button>
    </nav>
  );
}
```

**Spec for StrategyView changes:**

```typescript
// New exported type:
export interface ExecutionSummary {
  strategyId: string;
  jobId: string;
  grossDollars: number;
  feesDollars: number;
  netDollars: number;
  slippageDollars?: number;     // populated when /status returns TCA fields
  durationMs: number;
}

// New optional prop on StrategyView component:
//   onComplete?: (summary: ExecutionSummary) => void;
//
// When the post-submit status stream reaches a terminal "done" state,
// call onComplete(summary) once, idempotent (don't double-fire on re-render).
```

**Tests for app-shell (≥10):**
1. App renders ProfileSlot, TabBar, main, SummarySlot.
2. Default tab is 'strategies' on first mount.
3. Click 'Safety' tab → tab state updates; main renders SafetySlot, not StrategyView.
4. Click back to 'Strategies' → StrategyView re-renders.
5. SummarySlot is null when no summary state (no completion yet).
6. SummarySlot renders when summary state is set.
7. StrategyView's onComplete callback updates summary state.
8. Tab buttons have correct aria-pressed.
9. Slot placeholders return null (regression — Phase B will replace).
10. App component default-exports nothing accidentally (ensures no double-export).

**Tests for StrategyView.onComplete (≥5):**
1. onComplete is optional (no error when omitted).
2. onComplete called once when StatusView terminal "done" reached.
3. onComplete payload contains strategyId, jobId, grossDollars, feesDollars, netDollars, durationMs.
4. onComplete NOT called on intermediate status updates.
5. onComplete idempotent — multiple terminal events don't re-fire.

**Verify:**
```bash
cd code-and-docs-from-chatgpt/engine-ts
npx vitest run test/extension/app-shell.test.tsx test/extension/strategy-view.test.tsx
npx tsc --noEmit
npx vitest run  # full suite green
```

**Commit:**
```
feat(extension): App.tsx 3-zone layout + StrategyView.onComplete hook

Refactor popup shell from single-StrategyView dispatch into a 3-zone
layout (ProfileSlot header / tabs Strategies+Safety / SummarySlot footer).
Each zone uses a placeholder slot component (returns null) that Phase B
agents replace with concrete components.

Add ExecutionSummary type + optional onComplete prop to StrategyView so
SP1.5 SummaryCard can subscribe to terminal "done" without further
App.tsx edits.

Co-Authored-By: Claude <noreply@anthropic.com>
```

PR title: `feat(extension): App.tsx 3-zone shell + StrategyView.onComplete hook`. Auto-merge.

---

## Phase B — 3-way parallel implementation

After Phase A merges, dispatch all three agents from one message. Each owns disjoint files; no two touch App.tsx beyond the slot wiring.

### Task B.1: SP1.5 Execution summary card

**Files:**
- Create: `code-and-docs-from-chatgpt/extension/popup/SummaryCard.tsx`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/extension/summary-card.test.tsx`
- Modify: `code-and-docs-from-chatgpt/extension/popup/App.tsx` — only inside `<SummarySlot />` body: replace `null` with `<SummaryCard summary={summary} />`. ≤3-line edit.

**Spec:**
- On job completion, render summary card with: strategy name, ticker, side, size, gross / fees / net (USD), slippage (if present), time-to-finish.
- "Copy to clipboard" button: copies a markdown-formatted summary for paste into notes.
- Compact vertical layout (panel is narrow). Optional subtle "Dismiss" button hides the card.

**Pattern reference:**
- `extension/popup/StatusView.tsx` (terminal-state rendering)
- `extension/popup/ProgressBar.tsx` (compact stat layout)

**Tests (≥10):**
1. Renders strategy name + ticker + side from summary payload.
2. Renders gross / fees / net with $ formatting (2 decimals).
3. Renders slippage when present.
4. Hides slippage row when `slippageDollars` is undefined.
5. Renders durationMs as human-friendly (e.g., "1m 23s").
6. Copy-to-clipboard button writes markdown to navigator.clipboard (mock).
7. Dismiss button hides the card (state local; consumed via callback).
8. Empty/null payload → renders nothing.
9. Negative net (loss) renders with appropriate styling.
10. Long ticker name doesn't overflow (CSS truncation tested via DOM).

**Verify + commit + PR.** Title: `feat(extension): SP1.5 execution summary card`.

### Task B.2: SP1.7 Account/profile switcher

**Files:**
- Create: `code-and-docs-from-chatgpt/extension/popup/ProfileSelector.tsx`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/extension/profile-selector.test.tsx`
- Modify: `code-and-docs-from-chatgpt/extension/popup/App.tsx` — only inside `<ProfileSlot />` body: replace `null` with `<ProfileSelector />`. ≤3-line edit.

**Spec:**
- Reads `GET /whoami` from the engine server (existing endpoint per backlog) on mount; if not present, falls back to "default" profile + a flag indicating no profile system.
- Dropdown lists all available profiles (response shape TBD — assume `{ active: string, available: string[] }`); selecting a different profile POSTs `{ profile }` to `/whoami` and refreshes.
- Visible "demo" / "prod" badge always rendered in the panel header. Badge color: green for demo, red for prod.
- If `/whoami` endpoint returns 404 (account-connect not yet integrated), renders "no profile" inert state — no error.

**Pattern reference:**
- `extension/popup/PresetSelector.tsx` (dropdown UX)

**Tests (≥10):**
1. Mounts → fetches `/whoami` (mock fetch).
2. Renders active profile name in header.
3. Renders demo/prod badge (color via class or test-id).
4. Click dropdown → shows available profiles.
5. Select different profile → POSTs to `/whoami`, refreshes state.
6. 404 response → renders inert "no profile" state without error.
7. Empty `available` array → dropdown disabled or hidden.
8. Network error → fallback inert state, no exception bubbles.
9. Profile name with special chars renders correctly (XSS-safe).
10. Demo badge: prod class present in DOM when `active.includes('prod')`.

**Verify + commit + PR.** Title: `feat(extension): SP1.7 account/profile switcher`.

### Task B.3: SP1.8 Safety panel + forbidden tickers UI

**Files:**
- Create: `code-and-docs-from-chatgpt/extension/popup/SafetyView.tsx`
- Create: `code-and-docs-from-chatgpt/engine-ts/test/extension/safety-view.test.tsx`
- Modify: `code-and-docs-from-chatgpt/extension/popup/App.tsx` — only inside `<SafetySlot />` body: replace `null` with `<SafetyView />`. ≤3-line edit.

**Spec:**
- Reads safety state via `GET /safety` (verify endpoint name; if it's `/safety/get` or similar, use that). Renders read-only fields (typed input is risky in a browser context per backlog).
- Lists forbidden tickers with add/remove. Add requires a "reason" text field. Submits via `POST /safety/forbidden/add { ticker, reason }`; remove via `DELETE /safety/forbidden/<ticker>` (verify endpoint shapes from `src/server.ts`).
- Empty state: "No forbidden tickers."
- Confirm modal on remove (uses existing `ConfirmModal.tsx`).

**Pattern reference:**
- `extension/popup/SyntheticsView.tsx` (list with add/remove + form)
- `extension/popup/ConfirmModal.tsx` (confirm before destructive action)
- `engine-ts/src/tui/SafetyTab.tsx` (TUI version — same data shape)

**Tests (≥10):**
1. Mounts → fetches safety state (mock fetch).
2. Renders read-only safety fields.
3. Renders forbidden tickers list.
4. Empty list → empty-state message.
5. Add ticker form requires both ticker + reason; rejects empty.
6. Submit add → POST with payload, refreshes list.
7. Remove button → triggers ConfirmModal.
8. Confirm remove → DELETE, refreshes list.
9. Cancel remove → no-op.
10. Network error on add/remove → inline error message, list state unchanged.

**Verify + commit + PR.** Title: `feat(extension): SP1.8 safety panel + forbidden tickers UI`.

---

## Phase C — Backlog sync

Promote 3 stories to §7:
- SP1.5 execution summary card
- SP1.7 account/profile switcher
- SP1.8 safety panel + forbidden tickers UI

Update §0: §SP1–SP4 9→6, shipped 44→47.

Replace removed §SP1.5/§SP1.7/§SP1.8 sections with `_<id> shipped — see §7._` stub pointers.

PR: `chore(backlog): sync — extension polish cluster shipped`. Auto-merge.

---

## Cost & ordering

| Phase | Tasks | Parallelism | Wall-clock |
|---|---|---|---|
| A — App.tsx shell + onComplete | A.1 | 1 Sonnet | ~1-2 hours |
| B — 3-way parallel | B.1 + B.2 + B.3 | 3 Sonnet agents in parallel | ~3-4 hours real / ~1 day if serial |
| C — backlog sync | direct | — | ~10 min |

**Total: ~1 day with parallelism.**

## Verification matrix

| Concern | Verification | Phase |
|---|---|---|
| App.tsx 3-zone layout renders all slots | unit test | A |
| Tab toggle switches Strategies ↔ Safety | unit test | A |
| StrategyView.onComplete fires once on terminal | unit test | A |
| StrategyView.onComplete optional (backward-compat) | unit test | A |
| SummaryCard renders fields, copy-to-clipboard works | unit tests | B.1 |
| ProfileSelector reads /whoami, posts on switch, demo/prod badge | unit tests | B.2 |
| ProfileSelector handles missing endpoint gracefully | unit test | B.2 |
| SafetyView reads safety, list add/remove with confirm | unit tests | B.3 |
| Total test count | full suite +35 minimum | C |

## Open questions / explicit non-goals

1. **Server-side `/whoami` endpoint shape** — verify in src/server.ts before SP1.7 dispatch. If endpoint doesn't exist, SP1.7 may need a server-side stub (out of scope; flag instead).
2. **Server-side `/safety/*` endpoints** — likewise verify shape. If only `/safety` GET exists (no add/remove HTTP routes), SP1.8 may need server-side additions (out of scope; flag instead).
3. **Toast notifications on completion** — out of scope. SummaryCard renders inline; toast/notification deferred to a v2 polish.
4. **Edit safety values from extension** — explicitly read-only per backlog (typed input in browser context is risky). Edit flow stays on TUI/MCP.
5. **Multi-tab navigation beyond Strategies + Safety** — kept to 2 tabs in this cluster. Adding more tabs (e.g., Account info beyond the header dropdown) is a follow-up.
