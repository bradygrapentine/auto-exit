# Engine backlog

Last `/backlog-sync`: 2026-05-09 evening (SH-PASSIVE-SELL-LIMIT shipped (#178), SH-PASSIVE-SPREAD-LOGIC shipped (#179, live path), SH-MCP-GAP-CLOSURES shipped (#177), SH-WATCH v2 spec slice landed (#180), Min-chunk-value-guard ✅ promotion (was already shipped via #168 / SH-MIN-CHUNK but the deferred row was stale). §7 bullet recount: 76.

| Status | Count |
|--------|-------|
| 🧊 Foundation (W1) | 0 |
| 🧊 Strategy library (S) | 0 |
| 🧊 Cross-cutting (W3) | 0 |
| 🧊 Decision + optimization (W4) | 2 |
| 🟡 / 🟢 Tooling ecosystem (SH) — actionable | 2 (🟡 SH-WATCH v2, 🟢 SH-MICRO-LIVE-SMOKE) |
| 🧊 Surface parity (SP3.2 / SP3.3) | 2 |
| 🧊 Other deferred (off-sequence) | 4 |
| ✅ Shipped (this log) | 76 |

**SH-WATCH MVP shipped 2026-05-06.** Synthetic order types (stop_loss,
stop_limit, trailing_stop, take_profit, oco, bracket, time_stop,
step_trail) + watcher daemon + crash-safe journal + CLI/MCP/HTTP/TUI/
extension surfaces + 4 strategy presets (S-trail, S-step-trail,
S-bracketed-exit, S-conditional-roll). Effectively delivers the W4.1
trigger-layer functionality. Plan: `engine-ts/docs/superpowers/plans/
2026-05-05-synthetic-order-types.md`. PRs #19–#39.

This file is split into three sequences plus two ledgers. The
**Algorithmic enhancement sequence** runs W1 (foundation) → S (unified
strategy library) → W3 (cross-cutting refinements) → W4 (decision +
optimization). The prior W2 / EW2 split has been retired (2026-05-02);
exit and entry strategies that were mirror pairs are now single
side-parameterized stories in the S library, and three strategies have
been cleaned of agent-side decision logic that previously leaked into
them. The **Surface parity sequence** (SP1–SP4) cascades each engine
capability onto the browser extension, TUI, and MCP. **Other deferred**
is the parking lot for off-sequence micro-tactics.

The product surface is *discrete strategies*: agent picks a security +
a named strategy + side + size + per-strategy inputs, engine executes.
No mid-flow configuration. The agent (LLM via MCP) owns *whether* and
*how much* (edge, sizing, news interpretation, portfolio decisions);
the engine owns *how*.

---

# Algorithmic enhancement sequence

## W1 — Foundation primitives

Prerequisites for every strategy. Build first.

_All W1 stories shipped — see §7. W1 dependencies in S/W3/W4 are
satisfied unless otherwise flagged._

---

## S — Strategy library (unified, side-parameterized)

**Major restructure (2026-05-02 — Sonnet B + Codex C reviews):** the
prior W2 (10 exit) + EW2 (7 entry) catalog had 5 mirror-pairs that were
the same execution mode with sides flipped (winning↔patient, panic↔aggressive,
twap↔twap, stealth↔stealth, pair↔pair). They've been merged into single
*side-parameterized* strategies. Three strategies (former W2.3, W2.4, W2.8)
had agent-side decision logic embedded; that logic has been lifted out
(into the agent or W4 layer) and the strategies are now pure execution
modes. Four new strategies were added to fill genuine gaps.

Each story below is a *named strategy* the agent picks from a TUI
dropdown / CLI subcommand / MCP enum. Agent supplies `{ ticker, side,
size, strategyName, ...strategy-specific inputs }`. No mid-flow
configuration. Where `side` is meaningful, the same engine module handles
both directions.

_S2 aggressive shipped 2026-05-06 — see §7._

_S3 TWAP shipped 2026-05-06 — see §7._

_S4 stealth shipped 2026-05-06 — see §7._

_S5 multi-leg primitive shipped 2026-05-06 — see §7._

_S6 pre-resolution arbitrage shipped 2026-05-06 — see §7._

_S7 scale-out shipped 2026-05-06 — see §7._

_S8 limit ladder shipped 2026-05-06 — see §7._

_S9 stop-and-reverse shipped 2026-05-06 — see §7._

_S10 cash-raise sequencer shipped 2026-05-06 — see §7._

_S11 roll shipped 2026-05-06 — see §7._

_S12 market-making shipped 2026-05-07 — see §7._

_S13 iceberg shipped 2026-05-06 — see §7._

_S14 basis arbitrage shipped 2026-05-06 — see §7._

_S15 GTC-prepend-then-sweep shipped 2026-05-06 — see §7._

_S16 time-to-expiry emergency unwind shipped 2026-05-06 — see §7._

---

## W3 — Cross-cutting execution refinements

Apply across multiple S strategies. Worth building after the strategy
library so each refinement has multiple consumers from day one.

_W3.1 POV pacing helper shipped 2026-05-06 — see §7._

_Per-strategy adoption (threading recent-minute-volume through each loop
strategy) is follow-up work — helper landed; consumers TBD._

_W3.2 anti-gaming jitter shipped 2026-05-06 — see §7._

_W3.3 peg-to-mid shipped 2026-05-06 — see §7._

---

## W4 — Decision + optimization layer

Layered on top of an established strategy library. These don't add
strategies; they choose, optimize, and orchestrate the existing ones.

### 🧊 W4.1 — Trigger layer (auto-arm strategies)
**Tags:** engine [shared, tui-mcp]

**Trigger:** the engine executes exits the user has already decided on. It
has no opinion about *when* to start. P1 was triggered by hand —
"this is dead, get out." A real execution stack auto-arms when conditions
are met.

**Proposed:** new `src/triggers.ts` + `kea watch` daemon. Polls positions;
for each configured trigger, evaluates the rule and either auto-starts the
named strategy (if `autoExecute: true`) or pings the user (CLI/TUI/MCP).
Trigger types:

- **Stop-loss** — mark-to-bid drops X% from cost basis or trailing peak.
- **Time-decay** — at T-N days to expiry and probability ≤ P, auto-arm
  losing-exit.
- **Probability-based** — implied YES probability crosses threshold.
- **Profit-target** — auto-arm scale-out at configured rungs.

Each trigger emits a `trigger_armed` journal event and names the strategy
to invoke.

**Cost:** ~3 days. Module + daemon + trigger config schema + unit tests
with synthetic price walks.

**Dependency:** S library (triggers select named strategies; need
strategies first), W1.2 TCA (calibrate thresholds).

**2026-05-05 update:** **first slice superseded by SH-WATCH** (per-position
watcher with synthetic order types — stop-loss / trailing / take-profit /
OCO / bracket). SH-WATCH lands the polling loop, evaluator registry, and
journal; W4.1's broader continuous-engine + analysis layer vision is
preserved as the long-term north star (see
`engine-ts/docs/superpowers/specs/2026-05-05-strategy-trigger-pairings.md`)
to revisit once SH-WATCH has produced empirical fire data justifying
which analysis modules are worth building.

_W4.2 Almgren-Chriss optimal execution schedule shipped 2026-05-07 — see §7._

_W4.3 portfolio liquidation sequencer shipped 2026-05-06 — see §7._

### 🧊 W4.4 — Smart Order Router (multi-venue)
**Tags:** engine [shared]

**Trigger:** prediction markets exist on Kalshi, Polymarket, PredictIt (some
markets), Manifold. Same-question pricing diverges. Best execution requires
routing.

**Proposed:** abstract `KalshiClient` to `VenueClient` interface. New
adapters for Polymarket (CLOB API). Router computes effective price after
fees per venue, routes IoC chunks to the best one, falls back on the next
when depth is consumed. Strategy code stays venue-agnostic.

**Cost:** ~1 week. New adapter, fee schedule per venue, signing per venue,
contract-equivalence mapping (matching tickers across venues).

**Why last:** the entire algo sequence lands on Kalshi-only first. Multi-
venue is a multiplier, not a foundation.

_W4.5 harvest planner shipped — see §7._

<!-- ARCHIVED W4.5 spec (kept for cross-references)
**Tags:** shared [engine, tui-mcp, ext]

**TradFi analog:** options-MM Greeks dashboard for digital options. The
operator framing — "delta-hedged exit of a deep ITM binary held against a
soft catalyst" — is what this tool surfaces. Combines the decision math
that an experienced options market-maker does in their head before sizing
a pre-event de-risking sleeve.

**Trigger:** an agent or operator holds an appreciated position (cost
basis << current bid) and wants to choose between three actions: pure
hold, EV-maximizing harvest, or risk-reduction harvest. Today there is no
tool — the math has to be done by hand in markdown (see worked example
`docs/strategies/2026-05-02-winning-exit-mvvr-p4.md`). That doc surfaced
two distinct features that should compose into one tool:

1. **EV-weighted harvest-vs-hold calculator** — given `{ ticker, side,
   position, cost basis, market_p, private_p }`, returns the EV crossover
   `p* = avg_harvest_price / payout` and EV under each branch (patient
   scale-out, pure hold, sweep-now). Tells the operator whether harvest is
   EV-positive or EV-negative at their private p.

2. **Risk-reduction harvest sizer** — when private_p > p*, ANY harvest is
   EV-negative. Quantifies the variance-reduction trade: for harvest
   fractions {10%, 25%, 50%, 75%}, returns `{cash_locked,
   ev_give_up, sigma_reduction}` plus a special "no-loss-floor" row that
   harvests exactly `(cost_basis + fees) / S` (locks in cost-basis-plus-
   fees regardless of resolution).

**Proposed:** new MCP tool `kea_harvest_planner` + CLI `kea plan
--ticker T --side S --private-p X` + TUI "what-if" panel surfaced before
any S1 (passive) or S7 (scale-out) execution. Output sections
named in TradFi vocabulary so derivatives-experienced operators recognize
the format immediately:

- **Delta** — current bid in % terms (= market p_implied)
- **Theta** — EV-decay-per-day until catalyst (requires event-date input)
- **Gamma proxy** — bid-ask × visible book depth (rough vol-of-vol signal)
- **Sleeve sizing** — EV table + risk-reduction sizing table side-by-side
- **No-loss-floor** — exact harvest qty that converts unrealized to
  realized profit with zero downside

**Catalyst-type input.** Accept `{ catalystType: 'soft' | 'hard',
catalystExpectedDate?: Date }`. Drives the stale-book threshold the
harvest strategies should use (soft = 10–15min, hard = 2–3min) and the
theta calculation. Soft catalysts (legal proceedings, fuzzy-date events)
have books that legitimately sit static for 10–30min; hard (FOMC,
scheduled earnings) reprice minute-by-minute.

**Why this is decision-support, not execution.** The S library covers
*how* to execute. This tool answers *whether* and *how much* — sits in W4
alongside other decision-layer tools. Output feeds into existing
strategies (S1 passive for harvest, S7 scale-out for laddered partial
exits) but doesn't execute them.

**Cost:** ~2 days. Pure read-only computation on existing
`fetchPositions` + `fetchOrderbook` primitives, no new API calls. The
worked example in `docs/strategies/2026-05-02-winning-exit-mvvr-p4.md`
defines the math shape.

**Dependency:** W1.2 TCA (calibrate fee assumption: maker vs taker on
this contract type — currently `pricing.ts:35` is taker-only). Soft
dependency on S library so the planner can cross-reference suggested
strategies by name.

**Why mid-W4:** the operator-facing decision layer is what makes the
strategy library actually usable. Without this tool, an agent or operator
has to compute the EV/risk math by hand for every position. Ship before
W4.1 trigger layer (auto-arm); the trigger layer should call this tool
internally to size what it auto-arms.

**TradFi vocabulary roll-out.** Once this tool ships, update W2 strategy
descriptions to include a one-line `**TradFi name:**` field at the top of
each (`W2.1` → "patient exit / gamma-scalping mode"; `W2.4` → "scale-out
ladder / sleeve unwind"; `W2.10` → "iceberg / dark execution"). Reading
those names should immediately convey the strategy's character to anyone
with derivatives-MM background. See memory
`concept_tradfi_mapping.md` for the full mapping table.
-->

---

# Entry strategy sequence — RETIRED (2026-05-02)

The prior entry/exit split has been collapsed into the single,
side-parameterized **S — Strategy library** above. EW1.1 (buy primitive)
has been relocated to **W1.5**. EW2.1–EW2.7 have been merged into
S1–S5 (mirror pairs) or kept as distinct strategies (S8 limit ladder,
S12 market-making) inside the unified library. See the major-restructure
note in the S section header.

---

# Tooling ecosystem (SH) — multi-dimensional product surfaces

The auto-exit tool started as exit-strategy execution. With the SH stories
below it becomes an **algorithmic-trading tooling ecosystem**: exit/entry
strategies + synthetic order types + alerts + analysis + decision support +
workflow composition. Each story extends the system along an axis algo
traders currently outsource to spreadsheets, custom scripts, or manual
attention.

These stories are shared across surfaces (`shared` tag) — they touch the
engine, MCP, TUI, and extension together. They sequence after W1
foundation work but interleave with W3 / W4 / S as they unblock specific
strategies. SH-WATCH is the first foundation story; the rest layer on top.

## ID legend

- **SH-WATCH** — synthetic order types (per-position watcher daemon)
- **SH-ALERTS** — notify-only synthetics (alerts layer)
- **SH-BACKTEST** — record + replay harness for empirical strategy validation
- **SH-EDGE** — operator-specific PnL attribution + edge measurement
- **SH-RECOMMENDER** — EV / Kelly calculator + strategy recommender
- **SH-COMPOSE** — multi-stage workflow state machines + default policies

## Stories

### 🟡 SH-WATCH — Synthetic order types via per-position watcher
**Tags:** shared [engine, ext, tui-mcp]

**Trigger:** Kalshi's API natively supports only `limit` and `market`
orders with three TIFs (validated against OpenAPI 2026-05-05). No
stop-loss, trailing-stop, take-profit, OCO, or bracket. Operators have to
watch positions manually — today's KXMETGALA-26-LAD exit demonstrated the
gap (algorithm's edge lost once bid pinned to floor; needed a trigger
fired *before* the floor pin). Headline missing primitive: **trailing
stop** with deci-cent-aware float math for cheap markets.

**Proposed:** new `kea watch` daemon. Per-position watcher polls one
ticker at adaptive cadence (250ms near trigger, 2s default, 10s
idle-when-empty). Six v1 synthetic kinds (stop-loss, stop-limit,
trailing-stop, multi-rung take-profit, OCO, bracket). Composite synthetics
(OCO, bracket) expand to children at register time; sibling-cancel on
child fire. Crash-safe via three-phase fire (`fire_pending` → invoke →
`fired` / `fire_failed`) journaled to `~/.kalshi-exit-assistant/watchers.ndjson`.
First-class user feature in TUI / extension / MCP — not just internal
trigger plumbing. Float price math (`priceCentsExact: number`) end-to-end
for deci-cent ticks below 10¢.

**Spec:** `engine-ts/docs/superpowers/specs/2026-05-05-synthetic-order-types-watcher.md`.

**Plan:** `engine-ts/docs/superpowers/plans/2026-05-05-synthetic-order-types.md`
(rev 2 — Opus reviewed READY; PR #17).

**v1 scope: exit-side only.** Buy-side synthetics (S-buy-stop, S-buy-dip,
scaled-entry, bracket entry-leg) deferred to v2.

**Cost:** ~8–9 days with full subagent parallelism. 5 phases (foundation
→ 5 evaluators → persistence → CLI/MCP/HTTP → user surfaces → strategy
presets).

**Dependency:** W1.5 buyRunner (already shipped, PR #12). Non-blocking on
W4.1 trigger layer — supersedes its first slice.

_SH-ALERTS notify-only synthetics shipped 2026-05-06 — see §7._

### ~~SH-BACKTEST — Record-and-replay harness for empirical strategy validation~~

_SH-BACKTEST Phase A/B1/B2 shipped 2026-05-07 — see §7. Phase C (CLI/MCP surfaces beyond `kea record`) deferred; ExitRunner/BuyRunner DI-seam wiring carries `// TODO(SH-BACKTEST Phase C)` markers in `src/backtest/harness.ts`. Skip to following section._

### ~~SH-EDGE — Operator-specific PnL attribution + per-strategy edge measurement~~

_SH-EDGE shipped 2026-05-07 — see §7. Skip to following section._

<!-- ARCHIVED — original spec body retained for cross-references
### 🧊 SH-EDGE — Operator-specific PnL attribution + per-strategy edge measurement
**Tags:** shared [engine, tui-mcp]

**Trigger:** SH-1 TCA already measures *execution quality* (slippage vs
arrival mid). SH-EDGE measures *strategy quality* — and crucially does so
**operator-specifically**. Different operators trade different markets,
have different private p's, different size budgets. A strategy that's
great for one is net-negative for another. Today there's no answer to
"for *me*, given the markets *I* trade, which strategies have edge?"

**Proposed:** join existing journal entries (`'tca'`, `'synthetic_fired'`,
`'order_filled'`, etc.) into per-fire P&L decomposition: entry edge / exit
edge / market drift / execution slippage / trigger fire-quality. v1
reports: per-strategy edge vs counterfactual benchmarks; per-trigger
fire-timing histogram (fired Nc too early/late vs hindsight optimal);
per-market segmentation; parameter-sensitivity analysis. CLI `kea edge` +
MCP `kea_edge_summary` + TUI Edge tab.

**Spec:** `engine-ts/docs/superpowers/specs/2026-05-05-pnl-attribution.md`.

**Cost:** ~5–7 days. Pure analytics over existing journal; no new
journal entry kinds required (consumes what's already written).

**Dependency:** SH-WATCH live for ≥30 days (need fire data to attribute).
Soft dep on SH-BACKTEST (validates attribution model against
counterfactuals). Feeds SH-RECOMMENDER as operator-specific calibration
prior.

-->

_SH-RECOMMENDER EV/Kelly/strategy recommender shipped 2026-05-06 — see §7._

_SH-SCANNER-RATELIMIT shipped 2026-05-07 — see §7._

_SH-BACKTEST-RUNTICK shipped 2026-05-08 — see §7._

_ENGINE-NAV-WIRE shipped 2026-05-08 — see §7._

### ✅ SH-SCANNER-SYNC-FIX-2 — shipped 2026-05-08 (PR #154)

`record sync` now captures fly's stderr via PassThrough and rejects loudly
when fly exits 0 with 0 bytes transferred. 14/14 sync tests + 2 live e2e
runs verified.

(Original ticket below for history.)

### 🧊 SH-SCANNER-SYNC-FIX-2 — `kea record sync` silently exits without transferring
**Tags:** engine [ops]

**Trigger:** discovered during the 2026-05-08 first live backtest run.
`node dist/cli.js record sync --fly-app auto-exit-scanner` connects to
the Fly machine, prints `Connecting to fdaa:...`, then exits silently
with no files transferred. Workaround: run the underlying tar pipe
manually — `fly ssh console -a auto-exit-scanner -C "tar czf - -C /data
recordings" | tar xzvf -` — which works correctly (pulled all 89 files,
105MB).

**Suspected cause:** stdin/stdout pipe handling in `src/backtest/sync.ts`.
PR #111 replaced the broken rsync wrapper with a tar-pipe-over-fly-ssh,
and it worked at the time. Either Fly CLI behavior changed, or the
spawn'd `fly ssh` process exits without forwarding stdout (the
`{ stdio: ['ignore', 'pipe', 'inherit'] }` option may swallow errors).

**Proposed:** add stderr capture from the fly ssh subprocess + log it
on non-zero exit; assert at least one byte was piped to tar before
considering the sync successful; fail loudly if either condition is
violated. Cost: ~1-2h.

**Dependency:** none.

_SH-BACKTEST-PHASE-D shipped 2026-05-08 — see §7._

### ✅ SH-DEPTH-WALK-STALE-SNAPSHOT — shipped 2026-05-09 (PR #164)
**Tags:** engine [pricing-model] [critical]

Three components on `feat/sh-depth-walk-liveness`:
1. **Pure `checkLiveness` primitive** (`src/preTradeLiveness.ts`) — projection vs fresh book; rejects with `bid_shifted` / `size_collapsed` / `side_empty`. Defaults: max 1¢ shift, max 50% size shrink. No I/O.
2. **AggressiveRunner gate** — for trades >= `livenessGateSize` (default 100 contracts) the runner re-fetches the orderbook between projection and `createOrder`, journals `aggressive_liveness_rejected`, and breaks with `reason: 'liveness_rejected:<reason>'`. Operators can pre-supply `livenessAssumptions` or opt out via `livenessCheckEnabled: false`.
3. **Harvest-planner risk notes** — `HarvestPlannerOutput.riskNotes` flags fat top-of-book (>5× `topSize / meanRest`, or single-level book). Surfaced in the harvest-plan CLI under "Risk notes".

MOVVA-replay test confirms the runner aborts before `createOrder` when the projected level vanishes. Runbook updated with a fix-shipped section.

(Original ticket below for history.)

### 🧊 SH-DEPTH-WALK-STALE-SNAPSHOT — top-of-book can fully evaporate between projection and execution
**Tags:** engine [pricing-model] [critical]
**Severity:** high — projections used a snapshot whose top-of-book vanished 5 min before execution; produced a $3,201 cash miss on a real-money trade 2026-05-09.

**Trigger:** 2026-05-09 partial harvest of 8,891 NO contracts on
KXMOVVAREDISTRICT-26APR21-YES-P4. Projection from a static-snapshot
depth-walk + the live `kea_orderbook` query showed 12,336 contracts at
93.8¢ NO bid + 1,142 at 93.9¢, projecting avg fill 93.81¢ NO. Actual
fill: avg 58.67¢ NO, walking from 91.1¢ down to 35¢. Zero fills at
93+¢.

**Investigation (post-hoc analysis of 31,185-snapshot recording
covering the trade):** the 93+¢ depth was REAL and persistent for
14+ hours straight, then ALL of it disappeared at exactly
15:04:55.661 UTC — **5 minutes 18 seconds before our trade**. Top of
book collapsed from 93.9¢ → 91.1¢ in one snapshot, never recovered
during the next 6 hours of recording. This was independent of our
order (we hadn't even authorized yet at that moment, and the API
doesn't broadcast read activity).

**Conclusion:** the bid was NOT phantom HFT liquidity. It was a
genuine market-maker quote that got pulled (risk threshold,
quote-refresh, signal we're not privy to) shortly before our IoC
arrived. The projection's flaw is structural, not detection-of-fakes:
**a single live-book snapshot is stale within minutes for thin/
concentrated top-of-book depth.**

The same pattern is happening continuously: as of 21:30 UTC the same
day, current book has a fat 9,737-contract bid at 88¢ — same MM
behavior, different price. Any projection targeting that bid faces
identical staleness risk.

**Empirical reconciliation (2026-05-09 trade):**
| | |
|---|---:|
| Projected avg fill | 93.81¢ NO |
| Actual avg fill | 58.67¢ NO |
| Projected sale proceeds | $8,340.77 |
| Actual sale proceeds | $5,216.24 |
| Projected net cash | $8,294.06 |
| Actual net cash | $5,093.01 |
| Cash miss | $3,201.05 (38% short) |
| Top-of-book bid that vanished | 12,336 @ 93.8¢, pulled at 15:04:55 |
| Time from pull to our order | 5m 18s |

**Proposed:**
1. **Pre-trade liveness check:** immediately before submitting an
   order whose projection depends on top-of-book depth, query the
   orderbook one more time and compare to the projection's
   assumptions. If top-of-book has shifted by more than X (e.g. 1¢
   or N% size), reject and re-project.
2. **Take-or-fail with sub-projections:** for large orders, split
   into smaller IoCs sized to "hit the top of book" only (e.g.
   1,000 contracts at a time). Monitor each fill; if VWAP falls
   below threshold, halt the rest. Trade off: more fees, less
   slippage risk per chunk.
3. **Use recording-based "patient" estimates as the floor.** The 18h
   MOVVA recording's "patient passive @ 94¢" result (96.33%, 26,956
   fills) is what really happened; the static-snapshot "skim @
   93.81¢" was an outlier. For the operator-facing projection, the
   recording-based number should be the conservative anchor and the
   snapshot-based number the upper bound.
4. **Document the pattern in the operator-facing harvest-planner
   output.** If a projection depends on a single fat top-of-book
   bid (e.g. >5x the avg level size), surface that as a risk note:
   "Projection assumes 12,336-contract bid at 93.8¢ persists to
   execution; this depth may be pulled with no warning."
5. **Wire empirical fill-rate** from the per-strategy edge ledger
   (SH-EDGE) once that ships — N recent live IoCs of size K against
   markets with similar depth structure tells us the true expected
   slippage.

**Cost:** ~3-6h for (1) and (4); rest depends on broader infrastructure
(SH-EDGE, recording analysis automation). No immediate fix that
fully solves the problem — the underlying issue (book volatility) is
intrinsic.

**Dependency:** none for the staleness-check + risk-note in (1)+(4).
SH-EDGE for (5).

### 🟢 SH-MICRO-LIVE-SMOKE — first live trial through the SH-MICRO-EXECUTION-LOOP harness
**Tags:** engine [validation] [operator-driven]
**Severity:** medium — gates the harness's path from "all unit tests pass" to "trusted with real money"; until completed, the harness is implementation-validated only.

**Trigger:** PR #165 (SH-MICRO-EXECUTION-LOOP) shipped the trial / sweep / status framework + safety gates + runbook, but every test path has run with mocked Kalshi clients. The first end-to-end live trial validates that:

1. `safety.json:microHarness` reads correctly under real conditions and the gate accepts.
2. `defaultConfirm` reads from a real TTY and the operator can approve via the type-the-ticker-back flow.
3. The strategy runner's existing journal entries land under the trial id (jobId match) so SH-EDGE attribution works.
4. `kea edge --since today` picks up the new fire automatically.

Anything that breaks at $0.10 here is something we'd otherwise discover at $50+ later.

**Procedure:** see runbook `engine-ts/docs/runbooks/2026-05-09-micro-execution-loop-smoke-procedure.md`. Step-by-step: edit safety.json → run a single $0.10 `kea micro trial` against a liquid ticker → verify journal + `kea edge` show the new fire → fill in the worked-example block in the general runbook (`2026-05-09-micro-execution-loop.md`).

**Done when:**
- One trial runs end-to-end and produces a journal entry that `kea edge --since today` attributes to the trial.
- `kea micro status` shows the trial with correct notional.
- General runbook §"Worked example" is filled in with the actual fill / slippage / fire id.

**Stretch (separate ticket if scope grows):** small parameter sweep ($1.00 total exposure, two cells, 5 trials each) to validate `runSweep`'s prompt-per-trial flow + `summarizeByCell` output + downstream SH-EDGE breakdown.

**Dependency:** SH-MICRO-EXECUTION-LOOP (✅ PR #165). No other blockers.

### ✅ SH-AGGRESSIVE-CLI-FLAG-PARSING — shipped 2026-05-09 (PR #163)
**Tags:** engine [cli]

Shipped via the SH-VALIDATION-BUGBASH cluster. `parseFlags` (`src/cli.ts`) now correctly handles all three boolean forms — `--flag`, `--flag=value`, `--flag value` — and a new `boolFlag(flags, key, default)` helper accepts `true|false|1|0|yes|no` (case-insensitive). Five callsites migrated. 18-test pin in `test/cli/flagParsing.test.ts`.

(Original ticket below for history.)

### 🧊 SH-AGGRESSIVE-CLI-FLAG-PARSING — `--one-tick-in true` may not be parsed correctly
**Tags:** engine [cli]

**Trigger:** during the 2026-05-09 live aggressive call with
`--one-tick-in true`, the engine submitted `no_price=6.000000000000001`
(top YES bid, NOT top YES bid − 1). Suggests `oneTickIn` resolved
to `false` despite the CLI flag being present.

**Suspected cause:** `cli.ts:808`:
```ts
oneTickIn: flags['one-tick-in'] === 'true',
```
If `parseFlags` treats `--one-tick-in true` as a boolean flag (key
present with no value), `flags['one-tick-in']` may be `''` or `true`
(boolean, not string), making the strict `=== 'true'` (string)
comparison fail. Other CLI sites have the same pattern (e.g.
`stealth`, `s-twap`).

**Note:** in the 2026-05-09 trade this didn't matter operationally —
the IoC at limit=6¢ deeply crossed all reasonable NO bids and filled
at top-of-book anyway. But the silent flag-drop is a foot-gun for
strategies where the 1¢ headroom matters.

**Proposed:** audit `parseFlags`; for boolean flags either accept
`--flag` (presence-only, value `true`) consistently OR require
`--flag=true|false` and reject `--flag true`. Update all `=== 'true'`
sites to match. Add tests covering `--flag`, `--flag=true`,
`--flag true`, `--flag false`, absent.

**Cost:** ~1-2h.
**Dependency:** none.

### ✅ SH-AGGRESSIVE-FLOAT-CENTS — shipped 2026-05-09 (PR #155)

`Math.round` applied to limit price before assignment to yes_price/no_price
in src/aggressive.ts. 3 regression tests added covering sell/buy/no-side
float rounding paths.

(Original ticket below for history.)

### 🧊 SH-AGGRESSIVE-FLOAT-CENTS — live `kea strategy aggressive` rejected by Kalshi for non-integer cents
**Tags:** engine [live-execution]

**Trigger:** discovered 2026-05-09 attempting a live partial harvest on
KXMOVVAREDISTRICT-26APR21-YES-P4. The aggressive runner pulled
`topBid = 6` from the YES book; due to IEEE-754 the value carried as
`6.000000000000001`, was assigned directly to `OrderPayload.no_price`,
and Kalshi's API rejected with `cannot unmarshal number
6.000000000000001 into Go struct field CreateOrderRequest.no_price of
type int`.

**Root cause:** `src/aggressive.ts:107-108` assigns `limitPriceCents`
(a float read from `book.yes[i].priceCents`) directly to the integer
`yes_price` / `no_price` fields without rounding.

**Proposed (immediate):** wrap the assignment with `Math.round(...)`.
Handles the tiny-imprecision case (e.g. 6.000...001 → 6) which is the
common scenario in integer-cent-tick markets.

**Proposed (broader):** for SELL, prefer `Math.floor(limitPriceCents)`;
for BUY, prefer `Math.ceil(limitPriceCents)`. This way, on true 0.1¢-tick
markets, we round toward the more-permissive direction so the IoC still
crosses. Pair with a Kalshi-side check on what `no_price` actually accepts
for sub-cent-tick markets (may need a different field or scaled int).

**Workaround used:** patched `Math.round` inline + retried; trade landed
at expected VWAP. Patch belongs in a proper fix PR with tests.

**Cost:** ~30min for the round-fix + 1 regression test. ~2-3h for the
broader sub-cent-tick handling + research on Kalshi schema.

**Dependency:** none for the immediate fix; broader fix may depend on
clarifying Kalshi's price-unit conventions.

### ✅ SH-AGGRESSIVE-PARTIAL-SIZE — shipped 2026-05-09 (PR #163)
**Tags:** engine [backtest]

Shipped via the SH-VALIDATION-BUGBASH cluster. `aggressiveAdapter` now respects `params.size` when present, capping at `remainingQty`: `effectiveSize = Math.min(requested, remainingQty)`. Three regression tests in `test/backtest/aggressiveAdapter.test.ts`.

(Original ticket below for history.)

### 🧊 SH-AGGRESSIVE-PARTIAL-SIZE — `s-aggressive` backtest adapter ignores `params.size`
**Tags:** engine [backtest]

**Trigger:** discovered 2026-05-09 while backtesting a partial-harvest of an
8,891-contract slice from a 47,493-contract MOVVA position. Two variants
(`oneTickIn=false` vs `true`) returned identical results matching a full
"dump all 47,493" run — fill_count=1, pnl_cents=1160502 — because the
adapter overrides the requested size with the initial-position quantity.

**Root cause:** `src/backtest/adapters/aggressiveAdapter.ts:75`:
```ts
const config = buildAggressiveConfig(params, remainingQty);
```
`buildAggressiveConfig` then sets `size: remainingQty` (the full position),
silently dropping any user-supplied `params.size`. The live `AggressiveRunner`
respects `config.size` directly — only the backtest adapter has this quirk.

**Workaround used:** custom depth-walk simulator
(`scripts/backtest-movva.mjs`) that bypasses the strategy adapter entirely.
Confirmed the projected $8,294.06 / 93.81¢ VWAP outcome to within $0.13.

**Proposed:** in the backtest adapter, prefer `params.size` when supplied
and fall back to `remainingQty` only when absent. Add a regression test:
backtest with `initialPosition.qty=10000` + `params.size=3000` should
fill 3000 (not 10000). Cost: ~1h.

**Dependency:** none.

### ✅ SH-EDGE-LOOP-STRATEGY-FIELD — shipped 2026-05-09 (PR #157)

ExitRunner emits `strategy: 'exit-runner'`, BuyRunner emits `'buy-runner'`
in their loop_started entries. `joinFires` now buckets these correctly;
smoke confirmed 19 fires attribute to exit-runner.

(Original ticket below for history.)

### 🧊 SH-EDGE-LOOP-STRATEGY-FIELD — `loop_started` journal entries omit `strategy`
**Tags:** engine [edge]

**Trigger:** smoke validation of `kea edge` on 2026-05-09 against ~5k fires
showed every fire bucketed as `strategy: 'unknown'`. Inspection of recent
journals confirms `loop_started.data` doesn't carry a `strategy` field —
exitRunner / aggressive / etc. start their loops without identifying
themselves to the journal. SH-EDGE-2 (lifecycle) reads `data.strategy` and
falls back to `'unknown'` when absent; that fallback dominates real usage.

**Proposed:** runners (passive, aggressive, twap, watcher) emit their
strategy name in `loop_started.data.strategy` (e.g. `'s-passive'`,
`'s-aggressive'`, `'s-trail'`, `'s-twap'`). One-line addition per runner.
Plus a regression test that loads a journal slice and asserts no
`strategy: 'unknown'` rows. Cost: ~1h.

**Dependency:** none. Lights up SH-EDGE per-strategy aggregation.

### ✅ SH-EDGE-FILTER-MOCK-JOURNALS — shipped 2026-05-09 (PR #157)

`generateSnapshot` and `cmdEdge` default-skip `KXTEST*` tickers and any
fire whose loop_started had `dryRun=true`. New `--include-mock` flag
opts back in. Smoke confirmed default fire count dropped 5,233 → 6
(real fires only).

(Original ticket below for history.)

### 🧊 SH-EDGE-FILTER-MOCK-JOURNALS — `kea edge` flooded by `KXTEST` / dryRun journals
**Tags:** engine [edge]

**Trigger:** same smoke pass — 5,233 fires found, almost all `KXTEST`
mock-test journals from local development (avg fill 5¢ vs mid 50¢ →
nonsense -$53k ExitEdge). Real fires are buried.

**Proposed:** `kea edge` and the underlying pipeline default-skip fires
where ticker matches `^KXTEST` or where any `loop_started.data.dryRun`
along the lifecycle is `true`. Add `--include-mock` flag for explicit
inclusion. ~30min.

**Dependency:** none.

### ✅ SH-FILL-SIM-DIRECTIONAL — shipped 2026-05-08 in PR #132
**Tags:** engine [backtest]

`SimOrder` now carries `action`; `getLiquidityLevels` reverse-sorts for sells; `sweepBook` treats `limitPriceCents` as a floor on sell. `replayClient` propagates `payload.action` through both order paths. Aggressive-sweep callsites in `harness.ts` (stop_loss inline) and `watcherAdapter.ts` (fireHook) flipped from `yes/no_price=99` → `1` to match new floor semantics. All 47 backtest unit tests pass.

(Original ticket below for history.)

**Trigger:** discovered during the 2026-05-08 Phase D validation re-run.
`fillSimulator.ts:222` calls `sweepBook(levels, size, maxPrice)` where
`levels = getLiquidityLevels(book, side).sort(asc)`. For BUY this is
correct (lowest ask first → operator gets best buy price). For SELL it
is wrong: an operator selling N contracts hits the HIGHEST bid first
(best price for seller), then walks down. The current behavior gives
sellers the WORST available price, and combined with the `p <= maxPrice`
filter, sells with limit prices at or near the operator-reachable bid
(e.g. passive's `bestBid - walkStepCents`) silently fail to match —
the limit is below all yes-side levels even though there's deep
crossing liquidity.

**Concrete observation:** s-aggressive on KXINXU with limit=99¢ filled
10 contracts at 14¢/contract — the LOWEST yes-side level — yielding
+131c PnL. Real-world execution at the highest yes bid (39¢) would
yield +390c. Strategies-with-limit-99 work but are unrealistically
pessimistic; strategies-with-limit-near-bid don't work at all.

**Proposed:** in `getLiquidityLevels`, sort DESC when `order.action ===
'sell'`; flip `priceCents > maxPrice` early-out to `priceCents < maxPrice`
on the sell branch. Add a regression test covering: yes-side book
[12, 13, 18, 39], sell limit=11 → fills at 39 (the highest available
≥11); sell limit=99 → fills at 39 (still the highest available ≤99).

**Cost:** ~3-4h (sort flip + filter flip + 4-6 tests + verify aggressive
PnL improves on KXINXU fixture).

**Dependency:** none.

### ✅ SH-PASSIVE-SELL-LIMIT — shipped 2026-05-09 (PR #178)

Renamed locals in `passive.runOneTick` (live) and `exitRunnerAdapter`
(backtest): `bestAskCents`/`bestBidCents` → `decisionAskCents`/
`decisionBidCents`. Brings them into alignment with
`passive.runOneTickBacktest`'s existing convention. Expanded docblock
to explain cross-quoted vs yes-depth-fallback derivation and why a
SELL limit deliberately sits below all visible yes levels on
bid-quoted books. Journal field names preserved for backward compat.

### ✅ SH-TWAP-CADENCE — shipped 2026-05-08
**Tags:** engine [backtest]

Two fixes in the same PR: (1) drop `dryRun: true` from twap's passiveInvoke so passive's createOrder hits the replay client, (2) swap the import from `passive.runOneTick` to `passive.runOneTickBacktest` so twap uses the bid-quoted-aware spread logic from PR #141. End-to-end: s-twap fills on all 3 sweep recordings (+5282¢ / +1314¢ / +700¢).

(Original ticket below for history.)

### 🧊 SH-TWAP-CADENCE-original — `s-twap` returns 0 fills in backtest because it uses dryRun mode
**Tags:** engine [backtest]

**Trigger:** strategy comparison sweep v1 + v2 + v3 all showed `s-twap` with 0 fills across all recordings, even after passive fills correctly post-SH-PASSIVE-STILL-NO-FILLS.

**Root cause (diagnosed 2026-05-08):** `src/backtest/adapters/twapAdapter.ts:45+` builds a `passiveInvoke` that calls `passive.runOneTick(... dryRun: true)` per interval. In dry-run mode, passive simulates fills internally (incrementing `state.filled`) **without** calling `client.createOrder`. The replay client's `fillLog` therefore never sees the fills, the harness's `remainingQty` never decrements, and `report.summary.fill_count` is 0.

**Concrete observation:** journal-trace a backtest run with `--strategy s-twap` and you'll see passive logs `order_placed { dryRun: true }` events but `getFillLog()` returns `[]` at run end. Twap's outer schedule advances correctly (interval 0 → 1 → break_loop:schedule_complete) but every interval is invisible to the simulator.

**Proposed:** drop `dryRun: true` from the twap adapter's passiveInvoke so passive's createOrder calls hit the replay client. The twap adapter's per-interval invocation already accounts for the ONE GTC per tick semantics that PR #129 baked in. ~1-2h fix + new test asserting twap produces non-zero fills on a known-fillable recording.

**Cost:** ~1-2h.

**Dependency:** SH-PASSIVE-STILL-NO-FILLS (shipped — same PR as this ticket's filing).

### ✅ SH-PASSIVE-SPREAD-LOGIC — shipped 2026-05-09 (PRs #141 backtest, #179 live)

Backtest path landed first in PR #141 (cross-spread-validity check +
yes-depth fallback + first-tick skip in `runOneTickBacktest`). Live
path closed in PR #179 (cross-spread-validity check + yes-depth
fallback in `runOneTick`, mirroring the backtest path's three-state
derivation). Inverted cross-spreads (e.g. yes=[14,55], no=[5]) now
fall back to yes-depth instead of break_loop'ing with
`spread_too_tight`. Truly degenerate books and tight cross-quoted
books still bail as before — no first-tick skip on live to preserve
existing tight-spread semantics.

### ✅ SH-SCANNER-WS — shipped 2026-05-09 (PRs #159 #160 #161 #162)

Spike (#159) verified Kalshi WS auth + delta shape; impl (#160) added
`wsClient.ts` + `wsBookTracker.ts` + `wsRecorder.ts` behind a
`--transport ws` flag (REST default); deploy plumbing (#161) wired
`KEA_SCANNER_TRANSPORT=ws` into the Fly entrypoint; #162 fixed a
pre-existing fly.toml volume-mount drift that was blocking ALL deploys.
Cutover on 2026-05-09 23:34 UTC; first 60s post-cutover showed 239 snaps
on hot tickers / 59 on standard, ZERO HTTP 429s (REST mode had been
emitting them constantly).

Rollback: `flyctl secrets unset KEA_SCANNER_TRANSPORT -a auto-exit-scanner`.
See `engine-ts/docs/runbooks/2026-05-09-ws-deployment.md`.

(Original ticket below for history.)

### 🧊 SH-SCANNER-WS — WebSocket transport for the multi-ticker scanner
**Tags:** shared [engine, ops]

**Trigger:** REST polling at 500ms hot / 2s standard cadence captures
most order-book moves but not sub-cadence ones. Kalshi exposes a WS
endpoint (`wss://api.elections.kalshi.com/trade-api/ws/v2`) with an
`orderbook_delta` channel that pushes every book change. Switching the
scanner to WS would deliver tick-level data density at lower API load.

**⚠️ Viability investigation required before scoping.** Need a 30-min
spike to verify:
- Does the research-account keypair authenticate against the WS endpoint,
  or does WS require a paid tier / different permission?
- What's the actual auth handshake (HMAC-on-connect vs per-message)?
- Multi-ticker subscription mechanics — one socket all tickers, or one
  socket per ticker? What's the message-rate ceiling?
- Reconnection semantics — replay missed updates on disconnect, or fresh
  snapshot only?
- What does an `orderbook_delta` payload actually look like? Enough info
  to reconstruct full book state locally?

**Proposed (pending viability):** drop-in transport swap for
`multiTickerRecorder.ts`. Keep the recorder's NDJSON output shape
identical (snapshot rows) so SH-BACKTEST `replayClient.ts` and
`fillSimulator.ts` don't need changes. New `wsBookTracker.ts` maintains
in-memory book state per ticker from delta stream; emits synthesized
`snapshot` rows every N ms (250ms default; configurable) for the
recorder. Reconnect logic: on disconnect, fetch a fresh REST snapshot
to seed the book then resume WS subscription.

**Why deferred from initial deploy:** REST scanner is empirically
sufficient for v1 (most strategies in S library don't have sub-second
fire timing). Decision to upgrade should be data-driven — pull
recordings via `kea record sync` after a day of REST data; if visible
gaps in book evolution suggest important moves are being missed
(especially on KXBTC15M and other intraday markets), prioritize WS.

**Cost:** ~1 day if Kalshi's WS auth + delta shape match assumptions.
~2-3 days if reconstruction logic gets gnarly or auth has unexpected
gates.

**Dependency:** SH-BACKTEST infrastructure (shipped). Does NOT depend on
finishing SH-BACKTEST Phase C surfaces.

**Sequencing recommendation:** revisit after ~24h of REST data has been
synced and reviewed. If REST cadence is fine, reclassify as v1.5
optimization rather than v1 must-have.

_SH-COMPOSE workflow composition shipped 2026-05-07 — see §7._

---

# Surface parity sequence (extension / TUI / MCP)

Cascade engine capabilities onto each frontend. Order within a capability
is generally **MCP first** (simplest, agent-facing) → **TUI** → **Extension**
(richest UI, longest tail). Engine work is the prereq; each surface story
follows on its engine capability landing.

## SP1 — Existing engine, surface gaps

Independent of new engine work. Can start any time.

_SP1.1, SP1.2, SP1.3, SP1.4 shipped — see §7._

_SP1.5 extension execution summary card shipped 2026-05-07 — see §7._

_SP1.6 saved presets shipped — see §7._

_SP1.7 extension account/profile switcher shipped 2026-05-07 — see §7._

_SP1.8 extension safety panel + forbidden tickers UI shipped 2026-05-07 — see §7._

---

## SP2 — Strategy launchers (S library)

Once the strategy library exists, every surface needs a way to launch any
named strategy with the right inputs.

_SP2.1 unified `kea_strategy_run` MCP launcher shipped 2026-05-06 — see §7._

_SP2.2 TUI strategy picker tab shipped 2026-05-06 — see §7._

_SP2.3 Extension strategy picker shipped 2026-05-06 — see §7._

---

## SP3 — Trigger configuration (W4.1)

Once the trigger layer exists, every surface needs CRUD over trigger
rules.

### ✅ SP3.1 — MCP: trigger CRUD tools — collapsed to existing synthetic CRUD (2026-05-09)
**Tags:** tui-mcp [shared]

**Decision (2026-05-09):** SH-WATCH (shipped 2026-05-06) already provides
the full trigger CRUD surface via the synthetic-watcher MCP tools.
Building a parallel `kea_trigger_*` layer would double the design
surface for unclear v1 value. SP3 v1 reuses the existing surface; SP3.2
and SP3.3 are views over `kea_synthetic_*`.

| BACKLOG name (v1 design) | Existing equivalent |
|---|---|
| `kea_trigger_list` | `kea_synthetic_list` |
| `kea_trigger_get` | `kea_synthetic_get` |
| `kea_trigger_add` | `kea_synthetic_register` |
| `kea_trigger_update` | cancel + register (acceptable for v1) |
| `kea_trigger_remove` | `kea_synthetic_cancel` |
| (bonus) preview | `kea_synthetic_preview` |
| (bonus) history | `kea_synthetic_history` |

If a true long-lived "policy" layer (e.g. "whenever any market in
category X drops below Y, fire strategy Z") is needed later, file as a
new ticket — design on top of synthetic CRUD via a generator concept,
not a parallel persistence layer.

### ✅ SP3.2 — shipped 2026-05-09 (PR #158, path-b)

Existing SyntheticsTab covers list/cancel/wizard-create. Added `t` as the
primary tab key (was `6`, kept as alias) and relabeled the nav item to
"triggers" so the SP3 surface is findable by name.

(Original ticket below for history.)

### 🧊 SP3.2 — TUI: triggers tab
**Tags:** tui-mcp

**Trigger:** triggers are long-lived rules; the TUI is the natural place
to keep an eye on them at a glance.

**Proposed:** new "Triggers" tab. Lists active triggers with last-fire
timestamp. Add/edit/disable inline. Stream `trigger_armed` events into
the tab as they happen.

**Cost:** ~1 day.

**Dependency:** consumes the existing `kea_synthetic_*` MCP tools (SH-WATCH).

### ✅ SP3.3 — shipped 2026-05-09 (PR #158)

Extension popup `SyntheticsView` gains an inline "+ New trigger" form
(stop_loss / take_profit / trailing_stop). New `getActiveTabTicker`
helper auto-prefills the ticker from the current Kalshi tab via
chrome.tabs + the existing ticker-detector. New `registerSynthetic`
API helper. 8 new tests.

(Original ticket below for history.)

### 🧊 SP3.3 — Extension: triggers panel
**Tags:** ext [tui-mcp]

**Trigger:** extension users on Kalshi pages should be able to set up a
"if YES on this market drops below X, fire patient entry" trigger
without leaving the page they're already on.

**Proposed:** "Triggers" tab in the panel. Page-context-aware: prefills
the current market ticker. Lists triggers with active/paused state.

**Cost:** ~1.5 days.

**Dependency:** consumes the existing `kea_synthetic_*` MCP tools (SH-WATCH).

---

## SP4 — Reports + portfolio (W1.2 / W4.3)

_SP4.1 MCP TCA + portfolio tools shipped — see §7._

_SP4.2 TUI reports tab shipped 2026-05-07 — see §7._

_SP4.3 Extension reports panel shipped 2026-05-07 — see §7._

---

# Other deferred (off-sequence)

Micro-tactics not part of the algo sequence above. Each has a specific
trigger condition that hasn't materialized yet.

## 🧊 Refill-rate harvest mode
**Tags:** engine

**Trigger:** market where another participant (MM or bot) keeps refreshing the
top bid level after we take it. Current engine harvests these refills via the
normal iteration loop, but doesn't *recognize* the refill pattern or adapt
pacing to it.

**Proposed behavior:**
- Track top-level (priceCents, size) across consecutive iterations.
- If the same priceCents reappears with comparable size after a fill, classify
  as "refilling level" and:
  - Drop `loopDelayMs` to 0 (race other snipers).
  - Set chunkSize to match the refilled level depth (don't ask for more than
    refills, don't leave shares for the next sniper).
  - Log `refill_detected` with rate (refills/sec) for observability.
- Exit refill mode when (a) level disappears for N iterations or (b)
  `maxOrders` reached.

**Open questions:**
- How aggressive is too aggressive — at some point the engine becomes the
  thing other people are racing against.
- Cancel-replace at the same price to jump the queue: separate feature, much
  more complex (real GTC management loop, not one-shot resting).
- What signals false positives (e.g. a single MM cycling, vs. genuinely deep
  hidden liquidity)?

**Cost to build:** ~1 day. Touches `pricing.ts` (chunk sizing), `exitRunner.ts`
(loop pacing + state across iterations), new test fixtures simulating refill.

**Why deferred:** P1 book doesn't refill — it just sits. Build when a real
market presents the refill pattern; spec'ing against a hypothetical book is
how you get the wrong abstraction.

## ✅ Min-chunk-value guard — shipped 2026-05-09 (PR #168, SH-MIN-CHUNK)

`pricing.ts:decideLosingExitOrder` refuses chunks where
`chunkSize × priceCentsExact / 100 < minChunkValueDollars`
(default $0.15). Returns stable `{ chunkSize: 0, reason:
CHUNK_TOO_SMALL_REASON }`. `exitRunner.ts` short-circuits before
`buildSellPayload`/`createOrder` and returns `break_loop` cleanly.
Defends against Kalshi's $0.01-per-fill minimum-fee tax. 6 pricing
tests + 1 integration test. See §7 entry for full details.

## 🧊 Single-shot capture-and-execute scanner
**Tags:** engine [shared]

**Trigger:** the multi-market test (2026-05-01, see `MULTIMARKET_TEST_REPORT.md`)
revealed that interesting book shapes — especially thin-top + cliff — evaporate
between scan and execute. Two-poll workflows (scan, then human reviews, then
buy/sell) are too slow.

**Proposed:** `kea autotest --shape thin-cliff --budget 2 --depth-floor 100`
that does in one pass:
1. Stream-scan the open markets endpoint
2. As soon as a market matching `--shape` is found AND its book still meets
   the criteria on a re-fetch, immediately:
3. Buy a small position via crossable IoC (sized to `--budget`)
4. Run the engine sell against it (same script, no human gate)
5. Capture pre/post and exit

**What this validates that nothing else can:** auto-adaptive thin+cliff
behavior live, since manually-paced workflows can't catch these books.

**Cost to build:** ~3-4 hours. New CLI subcommand, hardcoded shape detectors,
automated buy primitive (could be a reusable `kea buy` subcommand). Tests
mostly trivial since most of it is plumbing existing primitives.

**Why deferred:** opportunistic by definition — only matters when a
candidate book actually appears. Build before the next attempt at
multi-market validation, not as urgent infrastructure.

## 🧊 Multi-market validation sweep — DEFERRED INDEFINITELY
**Tags:** engine

**Original plan:** test the engine across 4 market characteristic buckets
(cheap-tail, mid-priced, high-priced, thin-cliff) for projection accuracy
and fee-curve validation. See `MULTIMARKET_TEST_REPORT.md` for the 2026-05-01
attempt.

**Why deferred indefinitely:** structural Kalshi reality. A 10,000-market
scan returned only 2 markets with two-sided liquidity. The cheap-tail
(1-3¢) and high-priced (80-95¢) market types don't exist on demand —
they require specific event calendars (major political events, etc).

**Re-trigger this when:** a major event with deep-tail markets is active
(election, supreme court ruling, etc.) — at that point a fresh scan
might find 4+ usable candidates simultaneously.

**Cost to re-run:** ~2 hours of execution + report writing. Code already
exists; just needs market conditions.

## 🧊 Cancel-replace GTC drip mode
**Tags:** engine

**Trigger:** posting GTC at top-of-book and re-quoting when undercut. Different
from current GTC (one-shot, exit loop after placement).

**Cost:** ~1 day. New loop variant that polls book + own order, cancels and
re-posts on adverse moves.

**Why deferred:** No concrete use case yet. Current GTC is a "leave it and
come back" tool, which fits the user's pattern. S1 passive + W3.3
peg-to-mid will likely subsume the use cases this targets.

---

# ✅ Shipped

- **2026-05-09 — SH-PASSIVE-SPREAD-LOGIC — cross-spread-validity check on live runOneTick (PR #179).** Backtest path's three-state derivation (cross-quoted / yes-depth-fallback) ported to the live path. Inverted cross-spreads (e.g. yes=[14,55], no=[5] producing ask=14, bid=95, spread=−81) no longer break_loop with `spread_too_tight`; they fall back to yes-depth (ask=highest yes, bid=lowest yes) and post normally. Truly degenerate books and tight cross-quoted books still bail as before. 3 new tests in `test/backtest/passiveSpreadFallback.test.ts` pin the live path against the same fixtures as the backtest path.

- **2026-05-09 — SH-PASSIVE-SELL-LIMIT — naming cleanup (PR #178).** Renamed `bestAskCents`/`bestBidCents` → `decisionAskCents`/`decisionBidCents` in `passive.runOneTick` and `exitRunnerAdapter`. Brings them in line with the backtest path's existing convention. Expanded docblock explains cross-quoted vs yes-depth-fallback derivation and why a SELL limit may sit below all visible yes levels on bid-quoted books. Journal field names preserved for backward compat with on-disk data. No behavior change.

- **2026-05-09 — SH-MCP-GAP-CLOSURES — 5 follow-ups from MCP coverage audit (PR #177).** New tools: `kea_cancel_resting`, `kea_micro_status`, `kea_alert_list`, `kea_alert_cancel`, `kea_resume`. Plus `ticker` filter added to `kea_edge_summary` and `kea_edge_per_strategy` for parity with PR #169's `--ticker` CLI flag. 5 new MCP test cases (not-initialized, empty envelope, missing-config error paths). Closes the must-fix + 4 should-fix gaps surfaced in `engine-ts/docs/mcp-coverage-audit.md`.

- **2026-05-09 — SH-WATCH v2 spec slice (PR #180).** Documentation only — scopes the v2 surface (`buy_stop` / `buy_dip` / `scaled_entry` / `bracket_entry`) against the v1 watcher; confirms v1 surface reuses cleanly with kind-agnostic daemon/journal/registry/transports. ~2 days estimate, 7 slices. Implementation deferred — spec at `engine-ts/docs/superpowers/specs/2026-05-09-sh-watch-v2-buy-side-synthetics-design.md`.

- **2026-05-09 — SH-EDGE-POLISH — `kea edge` --ticker filter + --json envelope + summary header (PR #169).**
  Adds `--ticker <symbol>` (intersection across every mode), `--json` versioned envelope `{ version: 1, mode, since, filters, totals, rows }`, and a default-summary header line that surfaces filter context + totals before the per-strategy table. `cmdEdge` exported so the test harness can drive it via `runCli + captureOut`. 6 new tests in `test/cli/edge.test.ts`. Plan: `engine-ts/docs/superpowers/plans/2026-05-09-track-3-sh-edge-polish.md`.

- **2026-05-09 — SH-MIN-CHUNK — `minChunkValueDollars` guard + runner skip (PR #168).**
  pricing.ts: refuse chunks where `chunkSize × priceCentsExact / 100 < minChunkValueDollars` (default $0.15). Defends against Kalshi's $0.01-per-fill minimum-fee tax. Returns stable `{ chunkSize: 0, reason: CHUNK_TOO_SMALL_REASON }`; `chunkSize > 0` precondition prevents misattributing `chooseChunkSize`-returns-0 cases. exitRunner.ts: short-circuits before `buildSellPayload`/`createOrder` and returns `break_loop` cleanly. Without this a zero-chunk decision became a count: 0 createOrder Kalshi rejects. 6 pricing tests + 1 integration test + 2 fixture opt-outs in autoAdaptive/tailGtc suites.

- **2026-05-09 — SH-MICRO-EXECUTION-LOOP — small-size live execution + sweep + SH-EDGE integration (PR #165).**
  `kea micro {trial|sweep|status}`. Pure config + `gateTrial` primitive (caps + ticker-allowlist glob), `runTrial` runner with MANDATORY TTY confirmation per trial (no skip flag), `runSweep` (hard abort on safety-gate rejection, soft continue on operator-decline / strategy-failure), per-cell summary table. Operator-approved caps: per-trial $0.10–$1.00 (default cap $1.00 in `safety.json:microHarness`), daily aggregate $2.50. Trial id == jobId so SH-EDGE attributes the resulting fire automatically. v1 wires s-passive + s-aggressive; s-trail/s-twap/s-auto deferred to v1.1. Plus runbook + smoke-procedure runbook + SH-MICRO-LIVE-SMOKE follow-up story (PR #166).

- **2026-05-09 — SH-DEPTH-WALK-STALE-SNAPSHOT — pre-trade liveness check + planner risk notes (PR #164).**
  Pure `checkLiveness` primitive (`src/preTradeLiveness.ts`) — projection vs fresh book; rejects with `bid_shifted`/`size_collapsed`/`side_empty`. AggressiveRunner gate that re-fetches book between projection and submission for trades >= 100 contracts and aborts with `liveness_rejected:<reason>`. Harvest-planner `riskNotes` for fat top-of-book (>5× topSize/meanRest, or single-level book); CLI prints them under "Risk notes". MOVVA-replay test (12_000@93¢ → 100@93¢) confirms the runner aborts before `createOrder`. Replays the 2026-05-09 MOVVA $3,201 staleness incident.

- **2026-05-09 — SH-AGGRESSIVE-CLI-FLAG-PARSING — boolean flag forms unified (PR #163).**
  `parseFlags` now correctly handles `--flag`, `--flag=value`, `--flag value`. New `boolFlag(flags, key, default)` helper accepts `true|false|1|0|yes|no` (case-insensitive). Five callsites migrated. 18-test pin in `test/cli/flagParsing.test.ts`.

- **2026-05-09 — SH-AGGRESSIVE-PARTIAL-SIZE — backtest adapter respects params.size (PR #163).**
  `aggressiveAdapter` now reads `params.size` and caps at `remainingQty`: `effectiveSize = Math.min(requested, remainingQty)`. Three regression tests in `test/backtest/aggressiveAdapter.test.ts`.

- **2026-05-08 — SH-BACKTEST-PHASE-D — Watcher adapters + passive fill-realism mechanical fix (3 PRs).**
  PRs #128, #129, #130. Adds the generic `makeWatcherAdapter(buildArgs, params)`
  factory that drives a real `Watcher` instance via `Watcher.tick()` per
  harness tick (#128); a `passive.runOneTickBacktest()` sibling to the
  production `runOneTick` that posts ONE GTC per tick and tracks the
  resting order across ticks via new optional state fields (#129); five
  thin factory wrappers (`makeSTrailWatcherAdapter`, `makeTrailingStopAdapter`,
  `makeTakeProfitAdapter`, `makeOcoAdapter`, `makeBracketAdapter`) that
  wire `s-trail` + 4 synthetics through `harness.ts:resolveAdapter` (#130).
  All four `// TODO(SH-BACKTEST Phase D)` markers in harness.ts removed.
  Validation re-run on KXINXU recording (`docs/superpowers/specs/2026-05-08-phase-d-validation-results.md`)
  confirmed: all 5 new strategy IDs resolve and run; trailing_stop fires
  + sells via Watcher; passive's mechanical 0-fill issue is fixed but
  end-to-end fill realism still blocked by 2 deeper pre-existing bugs
  filed as SH-FILL-SIM-DIRECTIONAL + SH-PASSIVE-SELL-LIMIT. Total ~50 new
  tests; full suite at 2001 passing.

- **2026-05-08 — SH-BACKTEST-RUNTICK wide refactor + Phase 2 adapters (6 PRs).**
  PRs #120, #121, #122, #123, #124, #125. Phase 1 extracted `runOneTick()`
  seams from all four runners (4 parallel Sonnet subagents on file-disjoint
  worktrees): `ExitRunner.runOneTick` (#120, 5 break_loop reasons),
  `AggressiveRunner.runOneTick` (#121, single-shot done|break_loop),
  `passive.runOneTick` (#122, function-based with PassiveRunState +
  PassiveRunDeps), `STwapRunner.runOneTick` (#123, takes STwapTickState
  for interval-by-interval scheduling). Phase 2 (#124) wired
  runOneTick-driven adapters in `src/backtest/adapters/`:
  `passiveAdapter.ts` replaces the PR #115 clone, plus new
  `aggressiveAdapter.ts` and `twapAdapter.ts`. `harness.ts:resolveAdapter`
  now wires s-passive, s-aggressive, s-twap (s-trail + synthetics deferred
  to SH-BACKTEST-PHASE-D — Watcher-based evaluator architecture). Audit
  follow-up (#125) closed a silent `catch {}` in twap's passiveInvoke,
  fixed an `aggressive done = true` ordering bug, removed dead code, and
  fixed a misleading comment. Total: +2070 LOC, ~50 new tests, full suite
  green at 1976.

- **2026-05-08 — ENGINE-NAV-WIRE — real portfolioNAVDollars in SH-2 risk gate.**
  PRs #118, #119. Added `KalshiClient.fetchBalanceDollars()` and
  `src/balance.ts` (10s TTL cache via `getPortfolioNAVDollars(client)`),
  replaced `portfolioNAVDollars: 0` placeholders in both runners.
  Audit (#119) added strict validation — NaN/Infinity/string/null/negative
  responses now log + return 0 deterministically rather than silently
  bypassing the SH-2 concentration cap (`safety.ts:222` gates on
  `portfolioNAVDollars > 0`, and `NaN > 0` is false → check would skip).
  10 new tests cover the validation paths.

- **2026-05-07 — Pre-live-backtest cluster (4 PRs).** PRs #112, #113, #114, #115.
  #112 SH-EDGE: `synthetic_fired` journal entries now include `peakBidCents`
  + `triggerKind` (closes SH-EDGE Phase B optimal-mid TODO in lifecycle.ts;
  Phase B TODOs in benchmarks.ts/aggregate.ts deferred to optimal-hindsight
  consumer wiring). #113 W3.1: POV pacing (`maxParticipationRate` +
  `computePaceDelayMs`) adopted in S3 TWAP + S4 stealth — was already
  shipped as a helper, now wired. #114 SH-BACKTEST Phase C: `kea backtest
  run / sweep / report` CLI surface (14 tests). #115 SH-BACKTEST Phase C:
  ExitRunner adapter for `s-passive` (passive-clone approach until
  `runOneTick()` seam lands — see SH-BACKTEST-RUNTICK story). 50 new tests.

- **2026-05-07 — Scanner cluster operational fixes (3 PRs).** PRs #109, #110, #111.
  #109 SH-SCANNER-BOOTSTRAP: Dockerfile auto-discovers `tickers.json` on
  first run if missing. #110 SH-SCANNER-RATELIMIT: token bucket (30 req/s
  default), cadence reduction (1s hot / 5s standard), 429 `Retry-After`
  backoff. #111 SH-SCANNER-SYNC-FIX: replaced broken rsync wrapper with
  tar-pipe over `fly ssh console` (Fly machines authenticate via Fly's
  cert system, not OpenSSH keys).

- **2026-05-07 — Multi-ticker scanner + Fly.io deploy scaffolding.** PRs #100 (ops), #101 (engine).
  `kea record start/discover/sync` CLI + `multiTickerRecorder` (N concurrent
  recorders, tiered cadence: 500ms hot / 2s standard) + auto-discover sampling
  diverse tickers across 6 categories (sports/political/weather/entertainment/
  economics/crypto). Fly.io ops: Dockerfile (Node 20-alpine), `fly.toml` (256MB
  shared-cpu-1x, iad, 5GB volume @ /data), `.dockerignore`, `deploy/README.md`
  runbook. ~$2-4/mo. WS investigation TODO documented for follow-up. 16 new tests.
  Plan: `engine-ts/docs/superpowers/plans/2026-05-07-scanner-deploy-cluster.md`.

- **2026-05-07 — SH-BACKTEST Phase B2 — harness + sweep + report.** PR #99.
  `runBacktest` orchestrates ReplayKalshiClient + StrategyAdapter seam
  tick-by-tick; emits CounterfactualReport (P&L, fill rate, slippage, MAE/MFE,
  trace, mark_curve, all 5 §8 fidelity caveats). `formatReport` (json+markdown),
  `writeReport` to disk. `runSweep` cartesian grid → ranked SweepResult. Strategies
  wired v1: `stop_loss`, `stub`. ExitRunner/BuyRunner DI seams via
  `TODO(SH-BACKTEST Phase C)` markers in harness.ts. +1 test (1829 total).

- **2026-05-07 — SH-BACKTEST Phase B1 — replay client + fill simulator.** PR #98.
  `loadRecording` (NDJSON + .ndjson.gz, ts-window filter), `simulateFill`
  (naive limit/market/IOC/FOK/partial + queue_aware stub, Kalshi fee math),
  `createReplayClient` (KalshiClientLike interface, cursor advance, GTC
  resting-order queue fills on next tick, fill log via `getFillLog()`).
  49 new tests.

- **2026-05-07 — SH-BACKTEST Phase A — recorder + retention.** PR #97.
  `src/backtest/`: `types.ts` (RecordingEntry discriminated union per spec §6.1),
  `recorder.ts` (append-only NDJSON, daily UTC-midnight rotation, depth clamp
  [1,50] via `KEA_RECORDING_DEPTH_LEVELS` env, `appendSnapshot/Position/Fill`),
  `retention.ts` (`gzipOldRecordings` >7d, `archiveOldRecordings` >90d,
  `pruneRecordings` operator-explicit), `list.ts` (reads .ndjson + .ndjson.gz,
  date-desc sorted). Watcher integration: optional `recorder?: Recorder`
  ctor param + single-line `appendSnapshot` call after successful poll.
  Plan: `engine-ts/docs/superpowers/plans/2026-05-07-sh-backtest-cluster.md`.
  Spec: `engine-ts/docs/superpowers/specs/2026-05-05-backtest-harness.md`.

- **2026-05-07 — SH-EDGE Phase B surfaces (CLI + MCP/HTTP + TUI).** PRs #93, #94, #95.
  CLI: `kea edge` subcommand with 6 modes (summary, `--strategy`, `--trigger`,
  `--market`, `--param`, `--since`/`--min-notional`). MCP: `kea_edge_summary` +
  `kea_edge_per_strategy` tools + `GET /edge/summary` + `GET /edge/per-strategy`
  HTTP routes. TUI: Edge tab sorted by edge-per-fire with drill-down to
  per-fire decomposition + market-category filter. 25 new tests across surfaces.

- **2026-05-07 — SH-EDGE Phase A pnl attribution analytics module.** PR #92.
  New `src/edge/` module: `marketCategory.ts` (ticker→category prefix table),
  `lifecycle.ts` (joins journal entries → Fire[] by jobId), `benchmarks.ts`
  (passive-hold / immediate-exit / optimal-hindsight), `attribution.ts`
  (linear-additive 5-component decomposition: entryEdge + exitEdge +
  marketDrift + slippage + triggerQuality + residual), `aggregate.ts`
  (group-by + histograms + parameter sensitivity), `snapshot.ts` (persist
  to `${KEA_HOME}/edge-snapshots/<date>.json`). Read-only consumer — no
  new JournalKinds. 39 tests. Plan: `engine-ts/docs/superpowers/plans/2026-05-07-sh-edge-cluster.md`.
  Spec: `engine-ts/docs/superpowers/specs/2026-05-05-pnl-attribution.md`.

- **2026-05-07 — SP4.3 extension reports panel (TCA card + portfolio plan card).** PR #89.
  New `extension/popup/ReportsView.tsx` with two cards: Last-Job TCA (fetches
  `/journal/list` + `/journal/read`, renders chunks table + avg slippage,
  empty state) and Portfolio Exit Plan (POST `/portfolio/plan`, renders ranked
  table). 24 logic-only tests. Cash-target slider deferred.

- **2026-05-07 — SP4.2 TUI reports tab (TCA summary + portfolio plan views).** PR #90.
  New `src/tui/ReportsTab.tsx` with `t`/`p` toggle between TcaView and
  PortfolioView. Reuses journal-list selector for jobId picking. Added api
  helpers `listTcaJobs`/`readTcaEntries`/`fetchPortfolioPlan`. 21 tests.

- **Pre-2026-05-07 — SP4.1 MCP TCA + portfolio tools (shipped retroactively).**
  `kea_tca_summary { jobId }` (mcp.ts:393) returns per-chunk slippage breakdown;
  `kea_portfolio_plan { positions, bids, mids, strategy? }` (mcp.ts:1464) returns
  ranked liquidation sequence. CLI: `kea reports tca` + `kea portfolio plan`.
  HTTP: `POST /portfolio/plan`. Promoted from §SP4 during 2026-05-07 backlog
  sync after audit confirmed all surfaces present.

- **2026-05-07 — Engine internals surface wiring (S12 + strategy registry).** PR #87.
  Added `s-market-make` to `STRATEGY_REGISTRY` (14 entries; dangerLevel='medium'),
  `kea_strategy_s_market_make` MCP tool + extended `kea_strategy_run` discriminated
  union, CLI subcommand, HTTP route. Updated 5 test files for 14-entry counts.

- **2026-05-07 — S12 market-making runner (two-sided GTC + inventory-capped flatten).** PR #86.
  `src/marketMaking.ts` + `src/strategies/sMarketMake.ts`. Maintains bid + ask GTCs
  inside spread; reposts on book moves; tracks inventory; flips to aggressive
  flatten when inventory hits `maxInventory`. Hard non-goals enforced (no skew,
  no Avellaneda-Stoikov, no PnL tracking). 27 tests.

- **2026-05-07 — W4.2 Almgren-Chriss optimal execution schedule.** PR #85.
  `src/optimalSchedule.ts`. Pure-math closed-form schedule for binaries'
  known-terminal-value setting. `riskAversion=0` → uniform (TWAP-equivalent);
  high → front-loaded. Dimensionless interval-index time avoids `sinh` overflow.
  28 tests. Plan: `engine-ts/docs/superpowers/plans/2026-05-07-engine-internals-cluster.md`.

- **2026-05-07 — SH-COMPOSE workflow state machines + default policy engine.**
  PRs #80 (Phase A types/validator/predicate), #81 (B.2 default policy engine),
  #82 (B.1 workflow engine + journal), #83 (Phase C 8 templates + surfaces).
  New `src/workflows/` module: declarative JSON workflow definitions with
  closed-set EventMatcher / Action / SimplePredicate (no Turing-completeness),
  load-time validator (rejects unknown kinds, transitions to nonexistent
  states, zero-event cycles, maxTransitions > 500), `WorkflowEngine` class
  with first-match-wins transitions + maxTransitions runaway cap + TERMINAL
  + idle-when-empty + replay-from-journal, `DefaultPolicyEngine` class with
  applyOncePerPosition guard + atomic-write `policies.json` persistence,
  8 prebuilt templates (continuous-trailing, take-profit-then-trail,
  stop-then-rotate, bracket-and-roll, scale-out-then-rearm, time-decay-stop-
  loss, drawdown-then-flatten, profit-target-then-iceberg), 9 new MCP tools
  (`kea_workflow_*` + `kea_template_*` + `kea_policy_*`), `kea workflow` /
  `kea policy` CLI subcommands, `/workflows/*` + `/policies/*` HTTP routes.
  108+ new tests. Plan: `engine-ts/docs/superpowers/plans/2026-05-07-sh-compose-cluster.md`.
  Spec: `engine-ts/docs/superpowers/specs/2026-05-05-strategy-composition.md`.

- **2026-05-07 — SP1.7 extension account/profile switcher + SP1.8 safety panel + forbidden tickers UI.** PR #78.
  New `extension/popup/ProfileSelector.tsx` reads `GET /whoami` and renders
  a dropdown with demo/prod badge in the panel header. New `SafetyView.tsx`
  in the Safety tab lists read-only safety values and forbidden tickers
  with add (ticker + reason) / remove (with `ConfirmModal` gate). Server-
  side: 5 new HTTP routes (`GET/POST /whoami`, `GET /safety`,
  `POST /safety/forbidden/add`, `DELETE /safety/forbidden/:ticker`). Profile
  system is currently a stub (single 'default' profile + 501 on POST) until
  account-connect lands. 48 tests.

- **2026-05-07 — SP1.5 extension execution summary card.** PR #77.
  New `extension/popup/SummaryCard.tsx` rendered post-completion of any
  strategy run. Shows strategy displayName, jobId, filled/initial/orders,
  human-friendly duration; copy-to-clipboard markdown helper; local
  dismiss. Wired via `StrategyView.onComplete` → App-level summary state →
  `<SummarySlot />`. Includes Phase A's App.tsx 3-zone refactor
  (ProfileSlot / Strategies+Safety tabs / SummarySlot) and
  `StatusView.onTerminal` callback (firedRef-guarded single-fire). 30 tests.
  Plan: `engine-ts/docs/superpowers/plans/2026-05-07-extension-polish-cluster.md`.

- **2026-05-06 — SP2.2 TUI strategy picker tab.** PR #74.
  New "Strategies" tab in the Ink TUI: lists 13 strategies from the shared
  registry with displayName + dangerLevel badges; up/down keyboard nav;
  per-strategy form rendered from `fields[]` descriptors; danger-level
  confirm prompt for high-danger strategies; dry-run preview button →
  POST /preview; run button → POST /strategies/run; live status streaming.
  32 tests. Plan: `engine-ts/docs/superpowers/plans/2026-05-06-strategy-launchers-cluster.md`.

- **2026-05-06 — SP2.3 Extension strategy picker.** PR #73.
  New `extension/popup/StrategyDropdown.tsx` + `StrategyView.tsx` — replaces
  the implicit losing-exit dispatch with a full 13-strategy launcher.
  Consumes the same shared registry as SP2.2; ticker/size auto-prefill
  from existing TickerField/SizeField; ConfirmModal gates dangerLevel='high';
  StatusView streaming reused. 36 tests.

- **2026-05-06 — Strategy registry — shared metadata for TUI + extension launchers.** PR #72.
  `src/strategies/registry.ts` — 13 strategy entries (displayName,
  shortDescription, fields[] descriptors, dangerLevel). Single source of
  truth consumed by both SP2.2 (TUI) and SP2.3 (extension) so they stay
  in sync as the S library grows. SH-WATCH presets intentionally absent
  (those are watcher arms, not one-shot launchers). 15 tests.

- **2026-05-06 — Decision-layer surface wiring (CLI + MCP + HTTP).** PR #70.
  5 new MCP tools wired: `kea_portfolio_plan`, `kea_alert_register`,
  `kea_recommend`, `kea_ev`, `kea_size`. CLI subcommands for portfolio,
  alerts, ev, size, recommend. HTTP routes under `/portfolio/`, `/alerts/`,
  `/recommend`, `/ev`, `/size`. 51 new tests (1253 total). Plan:
  `engine-ts/docs/superpowers/plans/2026-05-06-decision-layer-cluster.md`.

- **2026-05-06 — SH-RECOMMENDER (EV calculator + Kelly sizer + strategy recommender).** PR #67.
  Three stateless math modules: `src/decisionEv.ts` (`computeDecisionEV`
  for enter/hold/exit/scale-out/no-action), `src/kellySizer.ts`
  (`computeKellySize` half-Kelly default with safety caps), `src/strategyRecommender.ts`
  (composes EV+sizer to rank top-3 strategies; degrades gracefully when
  SH-EDGE data absent). 53 tests across the 3 modules.

- **2026-05-06 — SH-ALERTS notify-only synthetics.** PRs #68 + #69.
  Backward-compatible `Synthetic.action: 'fire' | 'notify'` discriminator
  + `notifyChannels` (PR #65). New `src/alerts/{index,channels,dedupe}.ts`:
  webhook (5s timeout, non-throwing) + desktop (console.log fallback;
  node-notifier injectable). Per-syntheticId cooldown dedupe (default
  5min) with state persistence. Surgical edit to `src/synthetics/invoke.ts`
  branches notify path before order placement. 31 tests. (PR #68 was
  initially merged into wrong base; #69 re-targeted to main.)

- **2026-05-06 — W4.3 portfolio liquidation sequencer.** PR #66.
  `src/portfolio.ts` — `buildPortfolioPlan` ranks positions by
  `markToBidDollars − evHoldDollars` (most-overvalued-first); auto-picks
  'aggressive' strategy when overvalued > 50% of mark, else 'passive'.
  `executePortfolioPlan` wraps the plan into an SCashRaiseConfig for
  sequential execution. 21 tests.

- **2026-05-06 — Synthetic.action discriminator + NotifyChannelConfig type.** PR #65.
  Foundation for SH-ALERTS: backward-compatible additive change to
  `Synthetic` interface (action defaults to 'fire' when undefined).

- **2026-05-06 — SP2.1 unified `kea_strategy_run` MCP launcher + S5/S14 surface wiring.** PR #63.
  New `kea_strategy_run` MCP tool with `z.discriminatedUnion('strategy', ...)`
  schema covering 13 strategies (S2/S3/S4/S5/S6/S8/S9/S10/S11/S13/S14/S15/S16);
  CLI `kea strategy run` + HTTP `POST /strategies/run`. Plus per-strategy
  wiring for S5 (`kea_strategy_s_pair`) and S14 (`kea_strategy_s_basis_arb`).
  Plan: `engine-ts/docs/superpowers/plans/2026-05-06-strategy-cluster-3.md`.
  Gaps flagged: S1 (passive) and SH-WATCH presets (s-trail/s-step-trail/
  s-bracketed-exit/s-conditional-roll) not yet in unified enum.

- **2026-05-06 — S14 cross-resolution basis arbitrage.** PR #62.
  `src/strategies/sBasisArb.ts` — composes S5 multiLeg with hardcoded YES+NO
  legs of the same ticker. Pre-flight rejects when `yesAsk+noAsk ≥ 100 +
  perPairSlippageCents`; mid-flight close (book moves) halts both legs and
  journals `basis_arb_closed_midflight`. 20 tests.

- **2026-05-06 — S5 multi-leg primitive + S-pair preset.** PR #61.
  `src/multiLeg.ts` — `MultiLegJobRunner` parallel leg orchestrator with
  `legSkewPct` throttle (pause leading legs when progress skew exceeds
  threshold; hysteresis resume at half threshold) and atomicity-of-progress
  halt-all on any leg unfillable. `src/strategies/sPair.ts` — preset wrapper.
  22 tests covering skew detection, halt propagation, mixed execution modes,
  validation.

- **2026-05-06 — Strategy cluster 2 surface wiring (CLI + MCP + HTTP) + W3.1 safety field.** PR #59.
  Wired all 5 cluster-2 strategies (S3/S6/S10/S13/S16) into `kea strategy <name>`
  CLI subcommands, `kea_strategy_*` MCP tools, and `POST /strategies/<name>`
  HTTP routes. Added optional `maxParticipationRate` (0..1 validated) field to
  `safety.json` + `kea_safety_set` MCP. Plan: `engine-ts/docs/superpowers/plans/
  2026-05-06-strategy-cluster-2.md`.

- **2026-05-06 — S16 time-to-expiry emergency unwind.** PR #58.
  `src/strategies/sTimeEmergency.ts` — clock-driven escalation across 4 phases
  keyed off `now()` vs `contractCloseEpochMs`: T-60..T-30 → S1 passive, T-30..T-10 →
  S7 scale-out, T-10..T-2 → S2 aggressive, T-2..T-0 → cross any bid regardless of
  floor. Late-start skips elapsed phases; sell-only by spec. 23 tests.

- **2026-05-06 — S3 TWAP (time-sliced passive).** PR #57. `src/strategies/sTwap.ts` —
  per-interval target = `floor(size/numIntervals)` with remainder rolled into
  last interval; drift-free scheduling against absolute boundaries; optional
  UTC session-window pause/resume; injectable passiveInvoke. 27 tests.

- **2026-05-06 — S10 cash-raise sequencer.** PR #56. `src/strategies/sCashRaise.ts` —
  sequential execution of pre-ranked sell positions; halts on target met or
  deadline; per-position failure continues to next; cash math = `filled × bidCents/100`.
  Strategy dispatch ('aggressive' | 'passive') via small switch. 18 tests.

- **2026-05-06 — S13 iceberg.** PR #55. `src/strategies/sIceberg.ts` — single
  visible quote at `priceCents`; on each fill, reposts `min(visibleSize, remaining)`;
  loops until full size or `stop()`. Stop cancels any pending slice. 19 tests.

- **2026-05-06 — S6 pre-resolution arbitrage exit.** PR #54.
  `src/strategies/sPreResolutionArb.ts` — two-phase: phase 1 IoC at `bid+1¢`/`ask−1¢`
  (one-tick concession), phase 2 S2 sweep on remainder respecting `floorPriceCents`
  if phase 1 unfilled within `arbTimeboxMs`. 20 tests.

- **2026-05-06 — W3.1 POV pacing helper.** PR #53. `src/participationRate.ts` —
  `computeAllowedSharesPerMinute` + `computePaceDelayMs`. Loop strategies opt
  in by passing submitted-share count + recent volume; helper inflates
  `loopDelayMs` proportionally when overshooting `maxParticipationRate`.
  Disabled at rate=0; capped at 10× base. Per-strategy adoption is follow-up.

- **2026-05-06 — Strategy cluster surface wiring (CLI + MCP + HTTP).** PR #50.
  Wired all 6 new strategies (S2/S4/S8/S9/S11/S15) into `kea strategy <name>`
  CLI subcommands, `kea_strategy_*` MCP tools, and `POST /strategies/<name>`
  HTTP routes. Plan: `engine-ts/docs/superpowers/plans/2026-05-06-strategy-cluster.md`.

- **2026-05-06 — S15 GTC-prepend-then-sweep runner.** PR #49.
  `src/strategies/sPrependThenSweep.ts` — three-phase: post single GTC at
  `ask−1¢` (sell) / `bid+1¢` (buy) for full size, wait `prependWindowMs`,
  cancel + confirm + sweep remainder via S2 aggressive. Injectable callbacks
  for `postGtcInvoke`/`cancelGtcInvoke`/`fetchFilledQty`/`sleepMs`. 28 tests.

- **2026-05-06 — S11 roll runner.** PR #48. `src/strategies/sRoll.ts` —
  two-phase: S1 passive close current → S2 aggressive open target.
  Cash-neutral phase-2 sizing capped to actually-closed amount;
  phase-1 unfilled halt; injectable `passiveInvoke`/`aggressiveInvoke`.

- **2026-05-06 — S9 stop-and-reverse runner.** PR #47.
  `src/strategies/sStopAndReverse.ts` — two-phase: S2 aggressive close →
  S2 aggressive open opposite side. Confirm gate; phase-1 fail halt.

- **2026-05-06 — S4 stealth strategy.** PR #46. `src/stealth.ts` +
  `src/strategies/sStealth.ts` — jittered IoC chunks (50–200 shares),
  randomized 5–60s delays, no resting orders. Composes W3.2 jitter.

- **2026-05-06 — S8 limit ladder strategy.** PR #45.
  `src/limitLadder.ts` + `src/strategies/sLimitLadder.ts` — passive
  multi-rung GTC placement; rungs validated (>0, sum sizePct ≤ 100);
  no iteration loop after placement.

- **2026-05-06 — S2 aggressive strategy.** PR #44. `src/aggressive.ts` +
  `src/strategies/sAggressive.ts` — one-shot IoC sweep across the spread
  for full size; `confirmedAggressive` gate; empty-book descriptive throw.

- **2026-05-06 — Phase A helpers: jitter + peg-to-mid + S1 peg integration.** PR #43.
  `src/jitter.ts` (chunk-size + loop-delay jitter, bounded ±pct) for W3.2;
  `src/pegToMid.ts` (sell: `floor(mid − offset)` clamped to floor; buy:
  `ceil(mid + offset)`; one-sided book → null) for W3.3; opt-in `useMidpointPeg`
  on S1 passive.

- **2026-05-06 — S7 scale-out ladder (rung-driven partial exits).** PR #41.
  `src/strategies/s7ScaleOut.ts` — `S7ScaleOutRunner` polls the orderbook
  every `pollIntervalMs`; for each rung whose `priceCents` is reached by
  `topBid`, dispatches one S1 (passive) sell sized at
  `floor(totalSize × sizePct / 100)`. State per-rung in `firedRungs[]`.
  Journal entries `s7_rung_fired` per rung + `s7_run_complete`.
  `s1Invoke` callback is injectable for testing. Validates rungs (>0,
  sum sizePct ≤ 100), totalSize > 0, side='sell'. 21 tests covering
  validation, walk-up rung firing, max-iterations safety, graceful stop,
  journal entries, and per-rung sizing.

- **2026-05-06 — SH-WATCH synthetic order types (MVP).** PRs #19–#39.
  Six engine-side synthetic kinds (stop_loss, stop_limit, trailing_stop,
  take_profit, oco, bracket) + two added in Phase 5 (time_stop,
  step_trail). Watcher daemon with adaptive cadence + idle-when-empty +
  per-ticker book/position-fetch coalescing + crash-safe NDJSON journal
  with three-phase fire (pending → fired/fire_failed). Surfaces:
  `kea watch` CLI (start/register/list/get/cancel/status), 8 MCP tools
  (`kea_synthetic_*`, `kea_bracket_arm`, `kea_trailing_status`,
  `kea_synthetic_history`), 5 HTTP routes, TUI synthetics tab,
  Chrome-extension menu/popup/toast. Four strategy presets in
  `src/strategies/` (S-trail, S-step-trail, S-bracketed-exit,
  S-conditional-roll). 740+ tests, full suite green. Effectively
  delivers W4.1 trigger-layer intent. See plan
  `engine-ts/docs/superpowers/plans/2026-05-05-synthetic-order-types.md`.

- **2026-05-06 — S1 passive (post-and-walk, side-parameterized).** PR #15.
  `src/passive.ts` — chunked GTC posting at `ask−1¢`/`bid+1¢`, walk-toward-
  spread on cancel, side-parameterized. Extension PR #18 in review adds
  deci-cent walk steps (`walkStepCents`), `safetySubmittedMultiple` cap,
  and one-sided-book guard.

- **2026-05-04 — W4.5 harvest planner.** PR #11. `kea_harvest_planner` MCP
  tool + CLI: EV crossover (p* = avg_harvest/payout), risk-reduction
  sizing table, no-loss-floor row, Greeks (delta/theta/gamma proxy).
  Read-only computation; feeds S1/S7 sizing decisions.

- **2026-05-04 — W1.5 buy primitive (`buyRunner`).** PR #12. Mirror of
  `exitRunner` for the open side with shared helpers extracted into
  `runnerUtils`. Same journal/resume/safety semantics; unblocks S2, S5,
  S9, S11–S14.

- **2026-05-04 — SH-1 post-trade TCA (W1.2).** PR #13. Arrival-price
  slippage logging — `tca` journal kind, `kea_tca_summary` MCP tool,
  per-fill slippage breakdown vs. `arrivalMid = (topBid+topAsk)/2`.

- **2026-05-05 — SH-2 pre-trade risk checks (W1.3).** PR #14.
  `maxLossPerTickerDollars`, `dailyCircuitBreakerDollars`,
  `maxPositionConcentrationPct` enforced at runner entry; refuse-to-start
  when envelope breached.

- **2026-05-03 — W1.1 safety persistence + MCP/TUI write surfaces.** PR #7.
  `$KEA_HOME/safety.json` (atomic, 0o600) + 5 MCP tools
  (`kea_safety_get/set`, `kea_forbidden_list/add/remove`) + TUI Safety tab
  + `safety.audit.jsonl`. Caps can only tighten when merged into
  `ExitConfig`.

- **2026-05-02 — W1.4 journal pre-call ordering bug fix.** Commit af4577e.
  `order_intent` journal entry written before `createOrder`; resume path
  `reconcileByClientOrderId` recovers orphaned orders if process killed
  in the call window. Closes real-money correctness gap in crash-safe
  resume.

- **2026-05-03 — EX-1 + EX-2 ticker + position DOM detectors (SP1.1, SP1.2).**
  PR #6. Content script reads ticker from `window.location.pathname` and
  position size from market page DOM; "use this" prefill, never silently
  overwrites user input.

- **2026-05-03 — EX-3 live-mode confirmation modal (SP1.3).** PR #8. Modal
  on dryRun→live toggle: ticker/side/size/projection + typed-ticker
  confirm field; cancel returns to dry-run.

- **2026-05-03 — EX-4 progress bar (SP1.4).** PR #9. Visual progress =
  `(size − remaining) / size`; sub-display chunks/fees/elapsed from
  `/status` endpoint.

- **2026-05-03 — EX-6 persistent saved presets (SP1.6).** PR #10. Named
  presets in `chrome.storage.local`; save/load/delete; non-secret config
  only.

- **2026-05-02 — Account connect (CLI / TUI / MCP).** Named credential profiles
  persisted in `$KEA_HOME/credentials.json` (atomic write, `0o600`). CLI: `kea
  login`, `kea use`, `kea logout`, `kea whoami`. TUI: Account tab with `s`-key
  profile switch. MCP: `kea_whoami` read-only tool. All surfaces fall back to
  env vars when no profile is active. See `feat/account-connect`.

- **2026-05-02 — Read-only MCP server.** Claude tool interface (`kea_balance`,
  `kea_positions`, `kea_orderbook`, `kea_preview`, `kea_journal_list`,
  `kea_journal_read`, `kea_replay`, `kea_resting_orders`). 95% test coverage
  with real end-to-end pipeline tests. See `feat(mcp)`.

- **2026-05-02 — Ink TUI (read-only dashboard).** Multi-tab terminal app:
  positions, orderbook, preview, and journal views. Live smoke test suite
  renders each tab against prod read-only endpoint. See `feat(tui)`.

- **2026-05-02 — Journal replay + live-capture.** `replayJob` reconstructs job
  state from JSONL journal; live-capture script records real execution traces
  for fixture use. End-to-end replay tests validate resume semantics. See
  `feat(replay)`.

- **2026-05-01 — Auto-adaptive chunking.** `mildAdaptive` is now optional. When
  omitted, `chooseChunkSize` auto-decides: fat top (≥ 5× chunkSize) → fixed;
  thin top + cliff (next level ≥ 0.2¢ below) → adaptive; else fixed. Explicit
  `true`/`false` still work as overrides. See `pricing.ts::shouldAutoAdapt`,
  `safetyCap.test.ts`, `autoAdaptive.integration.test.ts`. Live smoke on P1
  confirmed non-regression.

- **2026-05-01 — Tail-GTC on finish.** `tailGtcOnFinish: true` posts a single
  resting GTC sell for any leftover shares when the IoC main loop ends with
  remaining > 0. Default price is one tick under our ask (derived from top
  opposite-side bid); `tailGtcPriceDollars` overrides. Includes a
  resting-orders guard (skips if `restingOrdersCount > 0`) to prevent
  double-posting across re-runs. Live-validated draining 1,386 P1 shares.
  See `exitRunner.ts::postTailGtcOrder`, `tailGtc.test.ts`.

- **2026-05-01 — Fee-aware preview + status.** `projectFullExit` walks the
  book level-by-level and returns gross/fees/net/feeRatio/chunks/unfillable
  with per-segment breakdown. Surfaced via `/preview`. `JobStatus.feesIncurredDollars`
  accumulates actuals from each order's `taker_fees_dollars`. Validated
  against current P1 book (7.56% feeRatio, matches structural rate). See
  `pricing.ts::projectFullExit`, `feeAware.test.ts`. (Optional `maxFeeRatio`
  refuse-to-start gate not built — would be separate item.)
