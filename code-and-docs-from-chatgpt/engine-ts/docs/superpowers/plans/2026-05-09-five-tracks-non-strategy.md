# Five-track post-SH-EDGE-POLISH plan set (non-strategy work)

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` per track. Each track is independently executable. Steps use checkbox (`- [ ]`) syntax.

**Context.** Operator's standing constraint: avoid live testing of strategies and triggers until SH-MICRO-LIVE-SMOKE is decided. These five tracks all sit outside that constraint — observability polish, documentation, and architectural prep that don't require any live execution.

**Sequencing.** All five are file-disjoint and can be parallelized, but the recommended order is **A → D → B → C → E** (smallest/fastest first, biggest/most-open-ended last):

| | Track | Type | Est. cost |
|---|---|---|---|
| A | `kea report` polish | code (CLI) | ~3h |
| D | `kea micro status --json` | code (CLI) | ~1h |
| B | Operator end-to-end runbook | docs | ~3h |
| C | W4.4 SOR scaffold (no Polymarket impl) | refactor | ~half day |
| E | MCP coverage audit | docs (mapping) | ~half day |

If executing in parallel, the file-touch boundaries are:
- A: `src/cli.ts` (`cmdReport`), `test/cli/report.test.ts`
- B: new file `engine-ts/docs/runbooks/operator-end-to-end.md`
- C: `src/kalshiClient.ts` rename + new `src/venue/` module + interface; touches `cli.ts` and `mcp.ts` only at construction sites
- D: `src/cli.ts` (`cmdMicro` status case)
- E: new file `engine-ts/docs/mcp-coverage-audit.md`

C and A both touch `cli.ts` — light coordination needed if parallel (different cmd handlers, but same file).

---

# Track A — `kea report` polish (TCA observability)

**Goal.** Apply the SH-EDGE-POLISH treatment to the TCA report: `--json` versioned envelope, optional filters, summary header. Same pattern, different command.

**Architecture.** All changes are inside `cmdReport` (`src/cli.ts:440`). No changes to `tcaSummary` aggregator or journal format. JSON envelope shape mirrors the SH-EDGE-POLISH envelope (`version: 1`, `mode`, `since`, `filters`, `totals`, `rows`) so consumers can reuse parsing logic.

**Decisions locked.**
1. **Filters.** `cmdReport` already accepts a positional `<jobId>`. Add `--ticker` (filters TCA entries by ticker even if multiple tickers were touched in one job, useful when journals get bigger), `--since` (defaults to "all entries in the job"), `--json`. Keep the positional `jobId` as today.
2. **Envelope shape.** Same as SH-EDGE-POLISH. `mode: 'tca'` (the only mode for now; future expansion possible).
3. **Header.** When not in JSON mode, prefix the existing table with one line: `TCA — <jobId> · N entries · avg slippage X.XX¢` so the operator sees scope before the rows.

## Task A.1 — Read & confirm (~10 min, read-only)

- [ ] **Step 1:** Re-read `src/cli.ts:440-490` (`cmdReport`) and note the existing flag-set (`positional: string[]` is the current signature — flag-parsing happens at the dispatcher). Decide whether to keep the positional `jobId` arg or move it to `--job`. **Default: keep positional** to avoid breaking existing operator muscle memory.
- [ ] **Step 2:** Verify `TcaEntry` (`src/types.ts:276`) has the fields needed for the JSON envelope rows (no Date objects, no class instances). Plain serializable.

## Task A.2 — Failing tests (~30 min)

**Files:** `test/cli/report.test.ts` (new — confirm absence first with `ls test/cli/report.test.ts`).

- [ ] **Step 1:** Reuse the fixture pattern from `test/cli/edge.test.ts`: temp `KEA_HOME`, `runCli` + `captureOut`. Seed a journal with 2-3 `tca` entries.
- [ ] **Step 2:** Write 4 failing tests:
  ```ts
  describe('kea report --json (TCA envelope)', () => {
    it('emits a versioned envelope with mode=tca', async () => {
      // ... expect env.version=1, env.mode='tca', env.totals.entryCount >= 1
    });
    it('rows are plain TcaEntry objects', async () => {
      // ... expect Array.isArray(env.rows), each row has expected keys
    });
  });
  describe('kea report --ticker', () => {
    it('filters TCA entries by ticker', async () => {
      // Two tca entries, distinct tickers; expect 1 row in env.
    });
  });
  describe('kea report header', () => {
    it('prints a one-line summary header before the rows', async () => {
      // expect stdout to match /TCA — .* · \d+ entries · avg slippage/
    });
  });
  ```
- [ ] **Step 3:** Run; confirm all 4 fail.

## Task A.3 — Implement (~60 min)

**Files:** `src/cli.ts` (`cmdReport`).

- [ ] **Step 1: Change signature.** `cmdReport(positional: string[])` → `cmdReport(positional: string[], flags: Record<string, string>)`. Update the dispatcher at the case `'report'` to pass flags (look at how `cmdMicro` is dispatched at `cli.ts:~1925` for the pattern).
- [ ] **Step 2: Add filtering inside cmdReport** after `tcaEntries` is built:
  ```ts
  const tickerFilter = flags['ticker'];
  let entries = tickerFilter ? tcaEntries.filter((e) => e.ticker === tickerFilter) : tcaEntries;
  ```
- [ ] **Step 3: Add JSON branch** mirroring SH-EDGE-POLISH `emitJson` shape:
  ```ts
  const jsonMode = flags['json'] !== undefined;
  if (jsonMode) {
    const envelope = {
      version: 1 as const,
      mode: 'tca' as const,
      jobId,
      filters: { ...(tickerFilter ? { ticker: tickerFilter } : {}) },
      totals: {
        entryCount: entries.length,
        avgSlippageCents: entries.length > 0
          ? entries.reduce((s, e) => s + e.slippageCents, 0) / entries.length
          : 0,
      },
      rows: entries,
    };
    process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
    return;
  }
  ```
- [ ] **Step 4: Add header before the table:**
  ```ts
  const avgSlippage = entries.length > 0 ? entries.reduce((s, e) => s + e.slippageCents, 0) / entries.length : 0;
  process.stdout.write(`\nTCA — ${jobId} · ${entries.length} entries · avg slippage ${avgSlippage.toFixed(2)}¢\n\n`);
  ```
- [ ] **Step 5:** Update `cmdHelp` to mention `--ticker` and `--json` on the `report` line.

## Task A.4 — Verify + commit (~20 min)

- [ ] **Step 1:** All 4 new tests pass; `npx tsc --noEmit` clean; full `npx vitest run` green.
- [ ] **Step 2:** Commit `feat(cli/SH-REPORT-POLISH): --ticker filter + --json envelope + summary header`. PR + auto-merge.

---

# Track B — Operator end-to-end runbook

**Goal.** A single document that walks a new operator from cold-start to "I just ran a fully-attributed live trial." Replaces the current scattered docs (per-feature runbooks).

**Architecture.** Pure docs. New file `engine-ts/docs/runbooks/operator-end-to-end.md`. Cross-links to existing per-feature runbooks rather than duplicating content.

**Audience.** Someone who just cloned the repo and wants to run their first trade through the engine in <30 minutes.

## Task B.1 — Outline (~30 min)

**Files:** none — outline first.

The runbook covers 8 sections, in order:

1. **Setup** (~5 min). `npm install`; `kea login`; `kea use <profile>`; `kea whoami` confirms.
2. **Daily workflow** (~3 min). `kea balance` / `kea positions` / `kea resting` for state; `kea book --ticker` for orderbook.
3. **Decision support** (~5 min). `kea plan --ticker T --side S --private-p X`; reading the EV table + risk notes; when to harvest vs hold.
4. **Strategy execution** (~5 min). Pick a strategy (s-passive / s-aggressive / s-twap / s-trail); construct `--params`; reading the journal output.
5. **Synthetics (triggers)** (~3 min). `kea watch register` for stop-loss/trailing-stop/etc; how the watcher daemon picks them up.
6. **Validation harness** (~5 min). `kea micro trial` for first-time strategy validation; cross-link to `2026-05-09-micro-execution-loop.md`.
7. **Observability** (~3 min). `kea report <jobId>` for TCA; `kea edge` for per-strategy attribution; what `kea micro status` shows.
8. **Safety / kill-switch** (~2 min). `kea safety set/get`; forbidden-tickers; the `STOP` killswitch file.

For each section: **what command, what it does, what the output means, common pitfalls**.

## Task B.2 — Write (~90 min)

**Files:** `engine-ts/docs/runbooks/operator-end-to-end.md`.

- [ ] **Step 1:** Header with goal, audience, and "you'll be able to do X by the end."
- [ ] **Step 2:** Each of the 8 sections at ~15-30 lines: command + 2-3 lines of expected output + 1-2 lines of "what to watch for."
- [ ] **Step 3:** Cross-links section: pointer table from each capability → its dedicated runbook (`2026-05-09-micro-execution-loop.md`, `2026-05-09-staleness-investigation.md`, etc.).
- [ ] **Step 4:** Quick-reference cheatsheet at the top — one-line commands the operator will repeat daily.

## Task B.3 — Verify + commit (~30 min)

- [ ] **Step 1:** Read through assuming you're a new operator. Anything ambiguous? Any command shown that doesn't actually exist? Run `kea help` to confirm every command referenced is real.
- [ ] **Step 2:** Spot-check by running 2-3 of the documented commands locally and confirming output matches what's described.
- [ ] **Step 3:** Commit `docs: operator end-to-end runbook`. PR + auto-merge.

---

# Track C — W4.4 SOR scaffold (no Polymarket impl)

**Goal.** Land the multi-venue abstraction (`VenueClient` interface + Kalshi adapter rename) WITHOUT the Polymarket adapter. Sets up future SOR work without committing to a network spike.

**Architecture.** Three small pieces:

1. New `src/venue/types.ts` — `VenueClient` interface (rename of `KalshiClientLike` with venue-agnostic field names where possible).
2. `src/kalshiClient.ts` keeps its current implementation; add a one-line `export const KalshiVenue: VenueClient = ...` wrapper or confirm `KalshiClient implements VenueClient` directly.
3. New `src/venue/router.ts` — stub `Router` class with one method, `pickVenue(ticker): VenueClient` that returns `KalshiVenue` unconditionally for now. Tests pin the contract.

No call-site changes anywhere — every existing consumer keeps using `KalshiClient` directly until the Polymarket adapter is wired.

**Why this is "scaffold" not "impl".** Polymarket has a separate auth model (CLOB API), separate fee curve, separate ticker schema. Modeling those without an actual spike risks an abstraction that doesn't fit. This track lays the seam; the impl track files behind a future spike.

## Task C.1 — Decisions to lock (~15 min, read-only)

- [ ] **Step 1: Audit `KalshiClientLike`.** `grep -n "KalshiClientLike" src/types.ts` and read the interface. Note any Kalshi-specific field names (e.g. `yes_price`, `no_price`).
- [ ] **Step 2: Decision.** Keep `KalshiClientLike` as-is (don't rename); add a NEW `VenueClient` interface that's a strict superset (the parts every venue must implement: `getOrderbook`, `createOrder`, `cancelOrder`, `getPosition`). Lock this in the plan rather than mid-implementation.

## Task C.2 — Add VenueClient interface + tests (~60 min)

**Files:**
- Create: `src/venue/types.ts`
- Create: `src/venue/router.ts`
- Create: `test/venue/router.test.ts`

- [ ] **Step 1:** `src/venue/types.ts`:
  ```ts
  /** Venue-agnostic client interface. Currently a subset of KalshiClientLike;
   *  Polymarket / PredictIt adapters will implement the same surface. */
  export interface VenueClient {
    venueName: 'kalshi' | 'polymarket' | 'predictit';
    getOrderbook(ticker: string, depth: number): Promise<Orderbook>;
    createOrder(payload: OrderPayload): Promise<OrderResult>;
    cancelOrder(orderId: string): Promise<OrderResult>;
    getPosition(ticker: string): Promise<Position>;
  }
  ```
- [ ] **Step 2:** `src/venue/router.ts`:
  ```ts
  export class Router {
    private clients: Map<VenueClient['venueName'], VenueClient> = new Map();
    register(client: VenueClient): void { this.clients.set(client.venueName, client); }
    /** v1: returns the only registered venue. SOR pricing comes later. */
    pickVenue(_ticker: string): VenueClient {
      const list = [...this.clients.values()];
      if (list.length === 0) throw new Error('Router: no venues registered');
      return list[0]!;
    }
  }
  ```
- [ ] **Step 3:** Test pins:
  - Empty router throws on `pickVenue`.
  - Single registered venue is returned.
  - Two registered venues — confirm v1 behavior (returns first; document that SOR pricing is deferred).

## Task C.3 — Adopt VenueClient on KalshiClient (~30 min)

**Files:** `src/kalshiClient.ts`.

- [ ] **Step 1:** Add `venueName: 'kalshi' as const = 'kalshi';` field on `KalshiClient`.
- [ ] **Step 2:** Confirm `KalshiClient` already implements every `VenueClient` method. Add `implements VenueClient` to the class declaration. tsc tells you about any gaps.
- [ ] **Step 3:** No callsite changes. `KalshiClient` keeps working everywhere it's used.

## Task C.4 — Verify + commit (~20 min)

- [ ] **Step 1:** Full `npx vitest run`; `npx tsc --noEmit`. Both clean.
- [ ] **Step 2:** Commit `feat(venue/W4.4): VenueClient interface + Router stub (no Polymarket adapter yet)`. PR + auto-merge.
- [ ] **Step 3:** Update BACKLOG.md row for W4.4 to note the scaffold landed; defer Polymarket adapter to a separate ticket pending auth/API spike.

---

# Track D — `kea micro status --json`

**Goal.** Make the `kea micro status` table agent-consumable. Same envelope convention as SH-EDGE-POLISH and Track A.

**Architecture.** One branch in `cmdMicro`'s `'status'` case. Envelope shape `{ version: 1, mode: 'micro_status', date, totals: { trialsToday, spentDollars }, rows: [...] }`.

## Task D.1 — Failing test (~15 min)

**Files:** new section in `test/cli/edge.test.ts` OR new `test/cli/micro.test.ts` (if doesn't exist). Check first with `ls test/cli/micro.test.ts`.

- [ ] **Step 1:** Seed a journal with 2 `micro_trial_started` + 1 `micro_trial_finished` entries dated today.
- [ ] **Step 2:** Run `kea micro status --json` via `runCli + captureOut`. Assert envelope shape + `totals.trialsToday === 2` + `rows` has 2 entries.

## Task D.2 — Implement (~30 min)

**Files:** `src/cli.ts` — the `case 'status':` block at line ~1582.

- [ ] **Step 1:** Add `const jsonMode = flags['json'] !== undefined;` at the top of the case.
- [ ] **Step 2:** After computing `started` + `finishedByTrial`, branch:
  ```ts
  if (jsonMode) {
    const rows = started.map((e) => {
      const d = e.data as Record<string, unknown>;
      const tid = String(d['trialId'] ?? '');
      const fin = finishedByTrial.get(tid);
      return {
        trialId: tid,
        ticker: d['ticker'],
        strategy: d['strategy'],
        maxNotionalDollars: d['maxNotionalDollars'],
        status: fin ? fin['status'] ?? 'finished' : 'running',
        startedAt: d['startedAt'],
        finishedAt: fin ? fin['finishedAt'] : null,
      };
    });
    const envelope = {
      version: 1 as const,
      mode: 'micro_status' as const,
      date: today,
      totals: {
        trialsToday: started.length,
        spentDollars: sumDailySpent(entries),
      },
      rows,
    };
    process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
    return;
  }
  ```

## Task D.3 — Verify + commit (~15 min)

- [ ] **Step 1:** Test passes; tsc clean; full suite green.
- [ ] **Step 2:** Commit `feat(cli/SH-MICRO-STATUS-JSON): --json envelope on kea micro status`. PR + auto-merge.

---

# Track E — MCP coverage audit

**Goal.** Survey what the engine exposes via MCP vs CLI; map gaps; file follow-ups for any meaningful gap. NOT to implement closures — that's per-gap follow-up work. The output is a single audit document + 0–N filed tickets.

**Architecture.** Pure analysis + docs. New file `engine-ts/docs/mcp-coverage-audit.md`.

**Why this is worthwhile.** 55 MCP tools registered (`grep -cE "^    '[a-z_]+'," src/mcp.ts` = 55 as of 2026-05-09). The agent-via-MCP surface is large but possibly inconsistent with what `kea` CLI offers. An audit answers: which CLI commands have no MCP equivalent? Which MCP tools are agent-only (no CLI)?

## Task E.1 — Enumerate both surfaces (~30 min)

**Files:** none — read-only.

- [ ] **Step 1: List CLI commands.** From `src/cli.ts:cmdHelp`, extract the full command list. Save to a markdown table.
- [ ] **Step 2: List MCP tools.** From `grep -nE "^    '[a-z_]+'," src/mcp.ts`, extract all 55 tool names. Save to a markdown table.

## Task E.2 — Cross-map (~60 min)

- [ ] **Step 1:** For each CLI command, find the MCP equivalent (if any). Use a 3-column table: `CLI command | MCP tool | notes`. Cells like:
  ```
  | kea positions          | kea_positions          | exact match |
  | kea book --ticker T    | kea_orderbook          | exact match |
  | kea micro trial        | (none)                 | GAP — file SH-MICRO-MCP if scope is meaningful |
  | kea edge               | (none)                 | GAP — but agents can read journals + run their own analysis; lower priority |
  ```
- [ ] **Step 2:** For each MCP tool with no CLI equivalent, note it as "agent-only — by design?" and short rationale (some tools like `kea_synthetic_history` are inherently agent-facing).

## Task E.3 — Triage gaps (~30 min)

For each documented gap:
- [ ] **Step 1:** Mark severity: `must-fix` (CLI-only feature an agent obviously needs), `should-fix` (parity nicety), `by-design` (not a real gap).
- [ ] **Step 2:** For each `must-fix`, draft a one-line backlog row idea. Don't add to BACKLOG.md yet — that's the follow-up.

## Task E.4 — Write audit doc + commit (~30 min)

**Files:** `engine-ts/docs/mcp-coverage-audit.md`.

- [ ] **Step 1:** Two tables (CLI-side, MCP-side) + one cross-map table + a "gaps" section with severities + recommended follow-up tickets.
- [ ] **Step 2:** Commit `docs: MCP coverage audit (2026-05-09)`. PR + auto-merge.
- [ ] **Step 3 (optional):** File the must-fix tickets as new BACKLOG rows in a follow-up PR. Out of scope for this track.

---

# Cross-track sequencing notes

**If executed in parallel** (different agents / sessions):
- **A vs C** both touch `src/cli.ts`. Coordinate by branch order: ship A first (small, contained edit to `cmdReport`), then C (which only adds `implements` + new `src/venue/` files; doesn't edit existing handlers).
- **D vs A** both touch `src/cli.ts`. Same coordination — A first, then D.
- **B and E** are docs-only, no conflicts.

**If executed serially:** A → D → C → B → E. A + D as warmup, C as the real architectural piece while still in code-mode, B + E as the doc-mode close.

## Out of scope for this plan-set

- W4.4 Polymarket adapter implementation — needs a 30-min auth spike first.
- `kea report --since` flag (TCA filtered by date range) — current cmdReport scope is per-jobId; date filtering is a bigger change.
- MCP tool implementation closures — Track E identifies gaps; closing them is per-gap follow-up.
- Strategy / trigger work of any kind.

## Self-review

- ✅ Each track has goal + architecture + decisions-locked + tasks + tests + commit/PR step.
- ✅ File-touch boundaries surfaced for parallel execution.
- ✅ Each track is independently shippable; no cross-track dependencies on shared code.
- ✅ Cost estimates conservative; total ~12h sequential.
- ⚠️ Track C's "no callsite changes" claim depends on every consumer of `KalshiClient` already going through methods that match `VenueClient`. Verify by listing consumers (`grep -rn "new KalshiClient" src/`) before committing — if any consumer reaches into Kalshi-specific internals, that's a hidden coupling and the scope balloons.
- ⚠️ Track E's cost is bounded only because it stops at "audit doc." Closing each gap is a separate follow-up, not in scope.
- ⚠️ Track A's signature change to `cmdReport` (add `flags` param) is the kind of thing that breaks a callsite if someone added a new caller in the meantime — `grep -n "cmdReport(" src/cli.ts` should show exactly one dispatcher call. If there's more, expand scope to include them.
