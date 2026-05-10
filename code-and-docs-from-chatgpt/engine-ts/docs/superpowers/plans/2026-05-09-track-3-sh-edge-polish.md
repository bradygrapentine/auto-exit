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

## Decisions locked (verified during plan review 2026-05-09)

1. **No-mode default is its OWN path,** not a fallthrough to `--strategy`. `cli.ts:1751–1771` renders an "Edge Summary" table grouped by strategy via `groupByStrategy(allFires)`, with a 9-column header (`Strategy / Fires / TotalPnL / Avg/Fire / Sharpe / EntryEdge / ExitEdge / Drift / Slip`). The `--strategy` mode at lines ~1720–1748 is a separate per-strategy drill-in. Task 3.5 targets the default at line 1751, NOT the `--strategy` block.

2. **JSON shape — versioned envelope.** Lock in `version: 1` now so the next consumer to depend on the shape can't be silently broken by a v2 reshape:

   ```ts
   interface EdgeJsonEnvelope {
     version: 1;
     mode: 'summary' | 'strategy' | 'trigger' | 'param' | 'market';
     since: string;          // ISO
     filters: {
       strategy?: string;
       trigger?: string;
       market?: string;
       param?: string;
       ticker?: string;
       minNotional: number;
       includeMock: boolean;
     };
     totals: { fireCount: number; totalEdgeDollars: number };
     rows: unknown[];        // mode-specific row shape; document each in code comments
   }
   ```

   Convention (locked): no mode flag ⇒ `mode: 'summary'`. Tests in 3.2 must pin this.

3. **`--ticker` filter scope.** Applies to ALL modes. Filtering in `cmdEdge` BEFORE mode dispatch is one line and avoids per-mode duplication. Test 3.2 must include a `--ticker × --strategy` intersection case (not just `--ticker` alone).

4. **`cmdEdge` is currently un-exported.** `cli.ts:1627` is `function cmdEdge` (no `export`). The test scaffold needs it exported — Task 3.2 makes that an explicit step, not a parenthetical.

---

## Task 3.1 — Verify aggregator return shapes (~10 min, read-only)

**Files:** none — read-only. (Plan-review already mapped existing branches and confirmed the no-mode default at `cli.ts:1751`.)

- [ ] **Step 1: Verify aggregator return shapes are JSON-serializable.**
  ```sh
  grep -nA 5 "interface.*Row\|interface.*Histogram\|export function groupByStrategy\|export function triggerHistogram\|export function paramSensitivity\|export function groupByMarket" code-and-docs-from-chatgpt/engine-ts/src/edge/aggregate.ts code-and-docs-from-chatgpt/engine-ts/src/edge/snapshot.ts
  ```
  If any contain `Date` objects, `BigInt`, or non-plain class instances, plan to coerce at serialization time (ISO string for dates). Document any coercions inline in the relevant emit-helper.

- [ ] **Step 2: Confirm `Fire.ticker` is a plain string** so `--ticker` equality filtering works as written. (`src/edge/lifecycle.ts` — should be obvious; one grep suffices.)

## Task 3.2 — Test scaffold (~75 min — realistic with fixture wiring)

**Files:**
- Modify: `src/cli.ts` — add `export` to `function cmdEdge` (one keyword).
- Create: `test/cli/edge.test.ts`

- [ ] **Step 1: Export `cmdEdge`.** In `cli.ts:1627`, change `function cmdEdge` → `export function cmdEdge`. tsc clean. No callsite refactor needed since the existing dispatch in `runCli` doesn't need an import.

- [ ] **Step 2: Build a journal fixture helper.**

  **DO NOT GUESS the entry shape.** `joinFires` (`src/edge/lifecycle.ts:86`) requires specific field names + structure for the resulting `Fire[]` to be non-empty AND have non-zero edge dollars. Existing test fixtures that successfully construct Fires live in `test/edge/lifecycle.test.ts` and `test/edge/aggregate.test.ts` — read one of them once before writing your own helper, and reuse the same entry shape (or its helper, if exported). Specifically:
  - `test/edge/lifecycle.test.ts` has the canonical minimum entry set for a Fire with entry fills.
  - `test/edge/attribution.test.ts` shows the additional entries needed for non-zero edge dollars (TCA + resolution).

  If neither file exports a helper, copy the inline fixture pattern verbatim into `test/cli/edge.test.ts` rather than rewriting from scratch.

  Sketch (adapt entry shape from `test/edge/lifecycle.test.ts`):

  ```ts
  import { describe, it, expect, afterEach, beforeEach } from 'vitest';
  import * as fs from 'node:fs';
  import * as os from 'node:os';
  import * as path from 'node:path';
  import { cmdEdge } from '../../src/cli.js';

  // Fixture: write a minimal journal under a temp KEA_HOME so cmdEdge ->
  // loadAllJournalEntries(since) returns deterministic Fires.
  function seedJournal(home: string, jobId: string, ticker: string, strategy: string): void {
    const dir = path.join(home, 'jobs', jobId);
    fs.mkdirSync(dir, { recursive: true });
    const ts = new Date().toISOString();
    const lines = [
      { ts, kind: 'loop_started', data: { jobId, ticker, strategy, side: 'yes' } },
      { ts, kind: 'order_intent',  data: { jobId, ticker, payload: { ticker, side: 'yes' }, arrivalMidCents: 50 } },
      { ts, kind: 'order_placed',  data: { jobId, ticker, orderId: `${jobId}-1` } },
      { ts, kind: 'order_reconciled', data: { jobId, ticker, orderId: `${jobId}-1`, filledCount: 10, priceCents: 50 } },
    ];
    fs.writeFileSync(path.join(dir, 'journal.ndjson'), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  }

  let home = '';
  let stdout = '';
  const origWrite = process.stdout.write.bind(process.stdout);

  beforeEach(() => {
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-test-'));
    process.env['KEA_HOME'] = home;
    stdout = '';
    (process.stdout as { write: unknown }).write = (chunk: string) => { stdout += chunk; return true; };
  });
  afterEach(() => {
    fs.rmSync(home, { recursive: true, force: true });
    delete process.env['KEA_HOME'];
    (process.stdout as { write: unknown }).write = origWrite;
  });
  ```

  **Risk:** the exact journal-entry shape that `joinFires` accepts is not documented here. Read `src/edge/lifecycle.ts:joinFires` once before pasting fixtures so the test seeds entries that actually produce a Fire (not an empty array). If joinFires needs more fields or a TCA entry to compute edge dollars, add them.

- [ ] **Step 3: Write failing tests**

  ```ts
  describe('kea edge — JSON envelope (SH-EDGE-POLISH)', () => {
    it('emits a versioned envelope with mode=summary when no mode flag is set', () => {
      seedJournal(home, 'j1', 'KXA-26', 's-passive');
      cmdEdge({ json: '', since: '2026-04-01', 'min-notional': '0', 'include-mock': '' });
      const env = JSON.parse(stdout);
      expect(env.version).toBe(1);
      expect(env.mode).toBe('summary');
      expect(typeof env.since).toBe('string');
      expect(env.totals.fireCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(env.rows)).toBe(true);
    });

    it('emits mode=strategy when --strategy is set', () => {
      seedJournal(home, 'j1', 'KXA-26', 's-passive');
      cmdEdge({ json: '', strategy: 's-passive', since: '2026-04-01', 'min-notional': '0', 'include-mock': '' });
      const env = JSON.parse(stdout);
      expect(env.mode).toBe('strategy');
      expect(env.filters.strategy).toBe('s-passive');
    });
  });

  describe('kea edge — --ticker filter (SH-EDGE-POLISH)', () => {
    it('filters fires across modes', () => {
      seedJournal(home, 'j1', 'KXA-26', 's-passive');
      seedJournal(home, 'j2', 'KXB-26', 's-passive');
      cmdEdge({ json: '', ticker: 'KXA-26', since: '2026-04-01', 'min-notional': '0', 'include-mock': '' });
      const env = JSON.parse(stdout);
      expect(env.totals.fireCount).toBe(1);
      expect(env.filters.ticker).toBe('KXA-26');
    });

    it('--ticker × --strategy is an intersection, not a union', () => {
      seedJournal(home, 'j1', 'KXA-26', 's-passive');
      seedJournal(home, 'j2', 'KXA-26', 's-aggressive');
      seedJournal(home, 'j3', 'KXB-26', 's-passive');
      cmdEdge({ json: '', ticker: 'KXA-26', strategy: 's-passive', since: '2026-04-01', 'min-notional': '0', 'include-mock': '' });
      const env = JSON.parse(stdout);
      // Only j1 satisfies both ticker=KXA-26 AND strategy=s-passive.
      expect(env.totals.fireCount).toBe(1);
    });
  });

  describe('kea edge — default summary header (SH-EDGE-POLISH)', () => {
    it('prints a one-line header above the strategy table with filter context + totals', () => {
      seedJournal(home, 'j1', 'KXA-26', 's-passive');
      cmdEdge({ since: '2026-04-01', 'min-notional': '0', 'include-mock': '' });
      // Header should mention since-date AND fire count BEFORE the strategy table.
      expect(stdout).toMatch(/Edge Summary/);
      expect(stdout).toMatch(/1 fire|fires/);
    });
  });
  ```

- [ ] **Step 4: Run — expect failures.** Some tests may pass accidentally (the existing default already prints "Edge Summary"); that's fine — they pin existing behavior. The `--ticker`, `--json`, and `mode=summary` envelope assertions must fail.

## Task 3.3 — Add `--ticker` filter (~20 min)

**Files:**
- Modify: `src/cli.ts:cmdEdge`

- [ ] **Step 1:** Verify `allFires` is declared `let` (not `const`) — confirmed at `cli.ts:1636` (`let allFires = joinFires(entries).filter(...)`). The reassignment-style filter below will compile.

- [ ] **Step 2:** After the existing filtering at lines ~1640–1645 (mock-journal filter), add:

  ```ts
  const tickerFilter = flags['ticker'];
  if (tickerFilter) {
    allFires = allFires.filter((f) => f.ticker === tickerFilter);
  }
  ```

- [ ] **Step 2:** Update `cmdHelp` to document the new flag.

- [ ] **Step 3:** Re-run `test/cli/edge.test.ts`. The `--ticker` tests pass (including the `--ticker × --strategy intersection` regression pin); `--json` tests still fail (expected).

## Task 3.4 — Add `--json` mode (~45 min)

**Files:**
- Modify: `src/cli.ts:cmdEdge`

- [ ] **Step 1: Define the envelope type INLINE in cli.ts** (no need to export it from a shared module — the JSON contract lives at the CLI surface):

  ```ts
  interface EdgeJsonEnvelope {
    version: 1;
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

## Task 3.5 — Improve default summary header (~25 min)

**Files:**
- Modify: `src/cli.ts:cmdEdge` — the no-mode default branch at lines 1751–1771.

- [ ] **Step 1: Locate the existing header.** `cli.ts:1759–1764` already prints:

  ```ts
  out(`\nEdge Summary — since ${sinceStr}\n`);
  // ...header row + separator...
  ```

  The change extends this header with totals and filter context. Replace the single `out` line at 1759 with:

  ```ts
  const totalEdge = groups.reduce((s, g) => s + g.totalRealizedPnLDollars, 0);
  const filterBits: string[] = [];
  if (flags['ticker']) filterBits.push(`ticker=${flags['ticker']}`);
  if (flags['strategy']) filterBits.push(`strategy=${flags['strategy']}`);
  if (flags['market']) filterBits.push(`market=${flags['market']}`);
  const filterStr = filterBits.length > 0 ? ` (filtered: ${filterBits.join(', ')})` : '';
  out(`\nEdge Summary — since ${sinceStr}${filterStr}\n`);
  out(`${allFires.length} fires across ${groups.length} strategies; total edge ${fmtSign(totalEdge)}\n`);
  ```

  Place BEFORE the existing `header = ...` line.

- [ ] **Step 2: Update `cmdHelp`** (`cli.ts:cmdHelp`, search for the existing `edge` block around line 668–671) to mention `--ticker`, `--json`, and `--include-mock` (the third was already shipped but undocumented; while we're here, document it).

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
- **`kea edge --diff <since1> <since2>`** comparison mode. The v1 envelope is now stable enough to consume from a diff implementation; build when actually needed.

## Self-review

- ✅ Each task lists files, expected diffs, tests.
- ✅ Tests written before implementation (Task 3.2 before 3.3 / 3.4 / 3.5).
- ✅ Refactor is conservative — new conditional per mode, not a unification rewrite.
- ✅ JSON envelope shape is decided up front (Task pre-amble), not designed mid-implementation.
- ⚠️ Total estimated cost (revised after plan review): ~3.5–4h. Test scaffold (Task 3.2) is 60–75 min once journal-fixture wiring is real; the JSON refactor across 5 mode paths is another 60+ min; the rest is incremental. Plan-review's original 2.5h estimate was light.
- ⚠️ The journal-fixture helper in Task 3.2 has to produce entries that `joinFires` actually accepts. Read `src/edge/lifecycle.ts:joinFires` once before pasting fixtures so the test seeds entries that produce a Fire (not an empty array). If `joinFires` requires more fields than the four entries listed (e.g. a `tca` entry to compute realized PnL), add them — don't guess.
- ⚠️ The envelope's `version: 1` field is a one-way commit. Any future shape break has to bump to 2 and document the migration. That's the right tradeoff but worth noting up front.
