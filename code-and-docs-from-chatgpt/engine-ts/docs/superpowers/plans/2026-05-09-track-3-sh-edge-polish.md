# Track 3 — SH-EDGE polish implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (or `subagent-driven-development` if dispatched). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make `kea edge` actually useful as a daily operator tool. The pipeline + math have been shipped (PR series ending in #157); what's missing is the operator-facing affordances: a JSON output mode (so agents and scripts can consume), a `--ticker` filter (currently you can only drill by strategy / trigger / market category / param), and a sane default summary that's readable in one screen rather than the current spread of multi-mode tables. **Keep scope tight** — this is polish, not a re-architecture.

**Architecture:** All changes are in `cmdEdge` (`src/cli.ts:~1627`) and the existing `src/edge/` aggregation modules. No journal-format changes, no new analytics. The JSON contract is "the existing summary structures, serialized" — same data, different surface.

**Tech stack:** TypeScript engine + vitest. No new dependencies.

**Why this is non-trivial despite small surface:** the current `cmdEdge` is mode-multiplexed (`--trigger` / `--param` / `--market` / `--strategy` paths each render their own table). Adding a `--ticker` filter and a `--json` mode without a refactor risks a tangle of `if (flags['json'])` branches inside each mode. The plan extracts a single `renderEdgeOutput(mode, data, format)` seam so each mode stays linear.

---

## Prior art / context

- `src/cli.ts:1627` — `cmdEdge(flags)`: ~150 lines, currently 4 mode branches.
- `src/edge/aggregate.ts` — `aggregateByStrategy`, `triggerHistogram`, `paramSensitivity`, `groupByMarket` (all return plain objects today; just need a serializer).
- `src/edge/lifecycle.ts` — `joinFires`, `Fire` type. Stable.
- `src/edge/pipeline.ts:37` — `loadAllJournalEntries(since, home?)`.

`kea edge` flags currently shipped:
```
edge [--strategy <name>] [--trigger <kind>] [--market <category>]
     [--param <paramName>] [--since <YYYY-MM-DD>] [--min-notional <dollars>]
     [--include-mock]
```

Adding: `--ticker <symbol>`, `--json`, and a default-summary improvement.

---

## File structure

- Modify: `src/cli.ts` — extract a `renderEdgeOutput` helper; add `--ticker` filter; add `--json` mode; tweak default summary.
- Modify: `src/cli.ts:cmdHelp` — document the new flags.
- Add: `test/cli/edge.test.ts` — argv parsing + filter + JSON-shape pin (calls `cmdEdge` with stubbed journal entries via `KEA_HOME` temp dir).

Nothing in `src/edge/` changes. The aggregation modules already return plain serializable objects.

---

## Decisions to lock now

1. **JSON shape.** One envelope, mode-tagged:

   ```ts
   interface EdgeJsonOutput {
     mode: 'summary' | 'strategy' | 'trigger' | 'param' | 'market';
     since: string;          // ISO
     filters: { strategy?, trigger?, market?, param?, ticker?, minNotional, includeMock };
     totals: { fireCount: number, totalEdgeDollars: number };
     rows: unknown[];        // mode-specific row shape
   }
   ```

   This keeps each mode independent (rows are mode-specific) but gives every consumer a stable `mode + filters + totals` envelope they can branch on.

2. **`--ticker` filter scope.** Applies to ALL modes (summary, strategy, trigger, param, market). Filtering in `cmdEdge` BEFORE mode dispatch is one line and avoids per-mode duplication.

3. **Default summary.** Currently the no-mode-flag path falls into the `--strategy` summary (per `cli.ts` reading). Confirm by reading `cmdEdge` — if true, the default is fine, just needs a header line with the totals + filter context. If false, decide what no-mode prints.

   **Action item before Task 3.1:** read `cmdEdge` for the no-mode default path. The plan as written assumes it's the per-strategy summary; if it's something else, adjust Task 3.5 accordingly.

---

## Task 3.1 — Read & confirm (~15 min, read-only)

**Files:** none — read-only.

- [ ] **Step 1: Map every existing branch in `cmdEdge`.**
  ```sh
  grep -n "flags\['" code-and-docs-from-chatgpt/engine-ts/src/cli.ts | sed -n '/cmdEdge/,/^}/p' | head -40
  ```
  Note which flag triggers which path. Confirm or correct the assumption that `--ticker` doesn't already exist.

- [ ] **Step 2: Verify aggregator return shapes are JSON-serializable.**
  ```sh
  grep -nA 5 "interface.*Row\|interface.*Histogram" code-and-docs-from-chatgpt/engine-ts/src/edge/aggregate.ts code-and-docs-from-chatgpt/engine-ts/src/edge/snapshot.ts
  ```
  If any contain `Date` objects or `BigInt`, plan to coerce at serialization time (ISO string for dates).

- [ ] **Step 3: Identify the no-mode default branch in `cmdEdge`.** Update Task 3.5 below if its assumption is wrong.

## Task 3.2 — Test scaffold (~30 min)

**Files:**
- Create: `test/cli/edge.test.ts`

- [ ] **Step 1: Write failing tests for the four new behaviors**

  ```ts
  import { describe, it, expect, afterEach, vi } from 'vitest';
  import * as fs from 'node:fs';
  import * as os from 'node:os';
  import * as path from 'node:path';
  // Import cmdEdge transitively via runCli — it's not exported. Either:
  //   (a) export cmdEdge from cli.ts (small surface change, OK), or
  //   (b) drive the test via spawning the built CLI (heavier).
  // Prefer (a): add `export` to the function.
  import { runCli } from '../../src/cli.js';

  describe('kea edge — JSON output (SH-EDGE-POLISH)', () => {
    let stdout = '';
    const origWrite = process.stdout.write.bind(process.stdout);
    afterEach(() => { stdout = ''; (process.stdout as { write: unknown }).write = origWrite; });

    function captureStdout(): void {
      stdout = '';
      (process.stdout as { write: unknown }).write = (chunk: string) => { stdout += chunk; return true; };
    }

    it('emits a stable JSON envelope when --json is set', async () => {
      // Set KEA_HOME to a fixture journal with N known fires; run cmdEdge('--json')
      // Assert: JSON.parse(stdout) has { mode, since, filters, totals, rows }.
      // ... (full fixture wiring)
    });

    it('--ticker filters fires across all modes', async () => {
      // Two fires, distinct tickers. cmdEdge('--ticker KX-A --json') returns 1 fire.
    });

    it('summary mode prints a one-line header with totals and filter context', async () => {
      captureStdout();
      // Assert stdout contains "X fires across Y strategies; total edge $Z.ZZ"
    });

    it('--ticker + --strategy compose (intersection, not union)', async () => {
      // ...
    });
  });
  ```

- [ ] **Step 2: Run — confirm 4 failing tests.**

## Task 3.3 — Add `--ticker` filter (~20 min)

**Files:**
- Modify: `src/cli.ts:cmdEdge`

- [ ] **Step 1:** After the existing filtering at lines ~1640–1645 (mock-journal filter), add:

  ```ts
  const tickerFilter = flags['ticker'];
  if (tickerFilter) {
    allFires = allFires.filter((f) => f.ticker === tickerFilter);
  }
  ```

- [ ] **Step 2:** Update `cmdHelp` to document the new flag.

- [ ] **Step 3:** Re-run `test/cli/edge.test.ts`. The `--ticker` tests pass; `--json` tests still fail (expected).

## Task 3.4 — Add `--json` mode (~45 min)

**Files:**
- Modify: `src/cli.ts:cmdEdge`

- [ ] **Step 1: Define the envelope type INLINE in cli.ts** (no need to export it from a shared module — the JSON contract lives at the CLI surface):

  ```ts
  interface EdgeJsonEnvelope {
    mode: 'summary' | 'strategy' | 'trigger' | 'param' | 'market';
    since: string;
    filters: Record<string, unknown>;
    totals: { fireCount: number; totalEdgeDollars: number };
    rows: unknown[];
  }
  ```

- [ ] **Step 2: At the top of `cmdEdge`**, parse `--json`:

  ```ts
  const jsonMode = flags['json'] !== undefined;
  ```

- [ ] **Step 3: Refactor each mode path to compute `rows` first, then branch on `jsonMode`:**

  Current (paraphrased):
  ```ts
  if (flags['trigger'] !== undefined) {
    const hist = triggerHistogram(filtered);
    out('...table...');
    return;
  }
  ```

  After:
  ```ts
  if (flags['trigger'] !== undefined) {
    const hist = triggerHistogram(filtered);
    if (jsonMode) {
      emitJson('trigger', filters, hist);
      return;
    }
    out('...table...');
    return;
  }
  ```

  Where `emitJson` is one helper that packages `{mode, since: sinceDate.toISOString(), filters, totals, rows}` and writes `JSON.stringify(envelope, null, 2)`.

- [ ] **Step 4:** Same refactor for `param`, `market`, `strategy`, and the no-mode default path. **Each path is one new branch — do NOT collapse them.** A premature unification here would re-introduce the per-mode tangle this plan is trying to avoid.

## Task 3.5 — Improve default summary (~20 min)

**Files:**
- Modify: `src/cli.ts:cmdEdge`

(Adjust this task per Task 3.1's findings if the no-mode default isn't what's assumed.)

- [ ] **Step 1: Add a header line** at the top of the no-mode (default) text path:

  ```ts
  out(`\nEdge summary — ${filterContextSentence(filters)}\n`);
  out(`${allFires.length} fires; total edge ${fmtSign(totalEdge)}\n\n`);
  ```

  Where `filterContextSentence` returns `"all fires since 2026-04-09"` or `"KXBTC fires only, since today"`, etc.

- [ ] **Step 2: Update `cmdHelp`** to mention the new ticker / JSON flags.

## Task 3.6 — Run full suite + tsc (~15 min)

- [ ] **Step 1:**
  ```sh
  npx vitest run
  npx tsc --noEmit
  ```
  Both clean.

- [ ] **Step 2: Spot-check JSON output manually**
  ```sh
  node dist/cli.js edge --json --since 2026-04-01 | jq '. | {mode, totals, row_count: (.rows | length)}'
  ```
  Expected: a sane envelope with `mode: "summary"`, integer `fireCount`, and `rows` populated (or empty if no fires in window).

## Task 3.7 — Commit + PR (~10 min)

- [ ] **Step 1: Commit**
  ```sh
  git commit -m "feat(cli/SH-EDGE-POLISH): --ticker filter, --json output, summary header

  - --ticker <symbol> filters fires across every mode (composes with
    --strategy / --trigger / --market / --param via intersection).
  - --json emits a stable {mode, since, filters, totals, rows} envelope
    per existing mode; aggregation modules already return serializable
    plain objects so no shape changes downstream.
  - Default summary now prints a one-line header with the filter
    context and totals before the per-strategy breakdown.

  No journal-format changes. No analytics changes."
  ```

- [ ] **Step 2: PR + auto-merge.**

## Sub-story wrap-up

- [ ] **Step 1:** Promote SH-EDGE-POLISH (or whatever the BACKLOG row ends up named) post-merge via the backlog-sync skill.
- [ ] **Step 2:** Note in the wrap-up: future polish ideas that came up but were deferred — surfaced as v2 in §"Out of scope" below.

---

## Out of scope (deferred to a separate plan)

- **Per-trial / per-fire detail view** (`kea edge --fire <id>`). Useful but bigger scope — needs a row-level renderer that doesn't exist yet.
- **CSV output.** JSON covers the agent / script case; CSV is for spreadsheets specifically — file when an operator actually asks.
- **Streaming / live mode.** `kea edge --watch` would be a new architecture.
- **Sparkline rendering or color in default text mode.** Color is environment-sensitive (CI logs, etc.); skip until requested.
- **`kea edge --diff <since1> <since2>`** comparison mode. Worth doing once the JSON envelope is stable.

## Self-review

- ✅ Each task lists files, expected diffs, tests.
- ✅ Tests written before implementation (Task 3.2 before 3.3 / 3.4 / 3.5).
- ✅ Refactor is conservative — new conditional per mode, not a unification rewrite.
- ✅ JSON envelope shape is decided up front (Task pre-amble), not designed mid-implementation.
- ⚠️ Task 3.1 (read-only) gates the rest. If the no-mode default path turns out to be different from what's assumed, Task 3.5 needs a rewrite — surface that AT 3.1, don't power through.
- ⚠️ Total estimated cost: ~2.5h. If `cmdEdge` turns out to be more tangled than expected and a real refactor is needed, file a follow-up rather than expanding the scope of this plan.
