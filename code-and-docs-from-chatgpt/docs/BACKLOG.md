# Engine backlog

Last `/backlog-sync`: 2026-05-06 (S7 shipped)

| Status | Count |
|--------|-------|
| 🧊 Foundation (W1) | 0 |
| 🧊 Strategy library (S) | 13 |
| 🧊 Cross-cutting (W3) | 3 |
| 🧊 Decision + optimization (W4) | 4 |
| 🧊 Tooling ecosystem (SH) | 5 |
| 🧊 Surface parity (SP1–SP4) | 12 |
| 🧊 Other deferred (off-sequence) | 5 |
| ✅ Shipped (this log) | 21 |

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

### 🧊 S2 — Aggressive (cross-the-spread, max speed)
**Tags:** engine

**Trigger:** agent must execute *now* — news-driven exit, fresh
conviction entry, or any case where speed > price. Was W2.2 panic +
EW2.1 aggressive; same mode either side.

**Proposed:** mode `aggressive`. One IoC order for the entire `size` at
`bid` (sell) / `ask` (buy), or one tick into the book for slightly
better fill behavior. No chunking, no adaptive sizing, no inter-iter
delay. `safetySubmittedMultiple` still applies as runaway guard. CLI
requires `--confirm aggressive`; TUI requires 2-keystroke confirm;
extension requires modal. Mirror of how panic confirms today.

**Cost:** ~4 hours after W1.5.

**Dependency:** W1.5 buy primitive (for buy side).

### 🧊 S3 — TWAP (time-sliced, side-parameterized)
**Tags:** engine

**Trigger:** large position, no urgency, want predictable execution over
hours/days regardless of price. Was W2.5 + EW2.4.

**Proposed:** mode `twap`. Inputs: `{ ticker, side, size,
intervalMinutes, numIntervals }`. Engine computes per-interval target =
size / numIntervals, runs one S1 (passive) chunk per interval, uses
`safety.json` floor / ceiling. Pauses overnight (configurable session
window). Sets up daemon-mode scaffolding W4.1 trigger layer reuses.

**Cost:** ~1 day after S1.

**Dependency:** S1 passive, W1.5 buy primitive.

### 🧊 S4 — Stealth (anti-signaling, side-parameterized)
**Tags:** engine

**Trigger:** agent suspects informed flow or wants to accumulate /
liquidate without showing intent. Standard chunking prints a recognizable
pattern. Was W2.10 + EW2.5.

**Proposed:** mode `stealth`. Small randomized chunks (50–200 shares
regardless of `chunkSize`), random inter-chunk delay (5–60s), no
resting orders (would expose remaining). Slower; minimal footprint.
Composes W3.2 jitter primitive.

**Cost:** ~1 day after W3.2 + W1.5.

**Dependency:** W3.2 jitter primitive (gating per Codex C 2026-05-02).
W1.5 buy primitive for buy side.

### 🧊 S5 — Pair / multi-leg (atomic, side-parameterized)
**Tags:** engine

**Trigger:** agent wants to open or close a multi-leg position
(spread, hedge, range bet) atomically. Closing one leg without the other
re-introduces directional risk; opening one leg ahead of the other
exposes execution risk. Was W2.6 + EW2.6.

**Proposed:** mode `pair`. Inputs: list of `{ ticker, side, size }`
legs. Engine runs all legs in parallel under one job-id, shares one
journal, enforces atomicity-of-progress: if any leg's book becomes
unfillable, halt *all legs* and surface to agent. No leg outpaces others
by more than `legSkewPct` (default 10%).

**Cost:** ~2 days. Multi-leg job runner, parallel orderbook streams,
skew-throttle logic, replay covering partial-leg-failure cases.

**Dependency:** W1.5 buy primitive, W1.2 TCA for skew impact.

### 🧊 S6 — Pre-resolution arbitrage exit
**Tags:** engine

**Trigger:** market is hours from resolution; mid has converged near $1
or $0; a few cents of spread remain in a thin book. Patient passive
gets nothing (no buyers crossing); standard losing exit overpays
slippage. Cleaned of the entry-condition logic that previously lived
here (was W2.3) — that's now a W4.1 trigger.

**Proposed:** mode `pre-resolution-arb`. Aggressive IoC at `bid + 1¢`
(giving up one tick of slippage to fill); if no fill within
`arbTimeboxMs`, escalate to `bid` and sweep. Small chunks (preserve
price discovery), high floor (won't sweep into deep tail).

**Engine-vs-agent line note (Sonnet B 2026-05-02):** the *condition*
that this strategy is the right move (`timeToCloseHours < 24`,
`midToTerminal < 5¢`) is an agent decision, not an engine guard. The
engine receives a request to run S6 and executes; if the agent's
condition is wrong, that's an agent-side bug. A W4.1 trigger named
`pre-resolution-window` can encode the standard condition for agents
that want it.

**Cost:** ~1 day.

_S7 scale-out shipped 2026-05-06 — see §7._

### 🧊 S8 — Limit ladder (passive multi-rung GTC, side-parameterized)
**Tags:** engine

**Trigger:** agent wants pre-placed orders at multiple price points and
to walk away. Useful when expecting mean-reversion or willing to average
in / out. Was EW2.3. Distinct from S7 scale-out: S7 is *active*
(price-triggered rung firing using passive semantics); S8 is *passive*
(upfront multi-GTC placement, no iteration). Different state machines —
keep separate per Sonnet B.

**Proposed:** mode `limit-ladder`. Inputs: list of `{ priceCents,
sizePct }` rungs + side. Engine posts each as a GTC at start, monitors
fills, journals each. No iteration loop after placement; relies on
resume to reconcile fills on next session.

**Cost:** ~1 day after W1.5.

**Dependency:** W1.5 buy primitive (for buy side).

### 🧊 S9 — Stop-and-reverse
**Tags:** engine

**Trigger:** thesis flipped. Agent wants to exit current position *and*
open opposite in one atomic sequence. Was W2.7.

**Proposed:** mode `stop-and-reverse`. Inputs: existing position +
target side + target size. Phase 1: S2 aggressive exit of existing.
Phase 2: S2 aggressive open of opposite side. Single journal. W1.3
pre-trade risk applies to the open leg.

**Cost:** ~1 day after S2.

**Dependency:** S2 aggressive, W1.3 pre-trade risk, W1.5 buy primitive.

### 🧊 S10 — Cash-raise sequencer
**Tags:** engine

**Trigger:** agent needs $X in cash by deadline. Cleaned of portfolio-
ranking logic that previously lived here (was W2.8) — `costToFreeOneDollar`
sorting is portfolio optimization, an agent decision (or W4.3 territory).

**Proposed:** mode `cash-raise`. Inputs: ordered list of `{ ticker,
size, strategyName }` from agent + `targetCashDollars` + `deadline`.
Engine executes them sequentially, halting when target is met or
deadline hits. The *ordering* arrives pre-computed; engine only
sequences and respects the target.

**Engine-vs-agent line note (Sonnet B 2026-05-02):** the agent (or W4.3)
ranks positions; engine executes the sequence. Removes ranking math
from the engine.

**Cost:** ~1 day.

**Dependency:** at least one of S1 / S2 to run individual positions.

### 🧊 S11 — Roll (exit current + open next cycle)
**Tags:** engine

**Trigger:** position thesis still holds but contract is expiring. Roll
into the next cycle's equivalent without going flat. Was W2.9.

**Proposed:** mode `roll`. Inputs: current position + target ticker +
target size. Phase 1: S1 passive exit of current (preferred — minimize
self-impact). Phase 2: S2 aggressive open of target. W1.3 concentration
cap applies to phase 2.

**Cost:** ~1 day after S1 + S2.

**Dependency:** S1, S2, W1.3, W1.5.

### 🧊 S12 — Liquidity-providing (two-sided market making)
**Tags:** engine

**Trigger:** agent wants to make markets on a stable, wide-spread market —
post both sides inside the spread, harvest fills, manage inventory toward
a target. Was EW2.7.

**Proposed:** mode `market-make`. Inputs: ticker, `targetInventory`,
`maxInventory`, `quoteOffsetCents`. Engine maintains two resting GTCs,
cancels and reposts on book moves (uses W3.3 peg-to-mid when
available). Cuts off when inventory hits `maxInventory` on either side;
reposts the *opposite* side aggressively to flatten back toward
`targetInventory`.

**Cost:** ~3 days. Significant new state machine; needs careful
inventory accounting and fill-reconciliation.

**Dependency:** W1.5 buy primitive, W3.3 peg-to-mid (preferred).

**Why scope-risk-flagged:** Codex C pre-mortem candidate — complex state
machine that may grow if real users want richer inventory rules. Watch
for scope creep during implementation.

### 🧊 S13 — Iceberg (single visible quote)
**Tags:** engine

**Trigger (NEW per Sonnet B 2026-05-02):** agent wants to accumulate or
liquidate a large position without revealing total size. Distinct from
S4 stealth — stealth varies chunk size and timing; iceberg hides total
remaining behind a single visible quote.

**Proposed:** mode `iceberg`. Inputs: `{ ticker, side, size, visibleSize,
priceCents }`. Engine posts a `visibleSize` GTC at `priceCents`. On
fill, immediately reposts another `visibleSize` at the same price.
Continues until full `size` is filled or agent cancels. Total remaining
is never visible to the book.

**Cost:** ~1 day after W1.5.

**Dependency:** W1.5 buy primitive.

### 🧊 S14 — Cross-resolution basis arbitrage
**Tags:** engine

**Trigger (NEW per Sonnet B 2026-05-02):** when YES and NO on the *same*
market both trade below $1 (e.g. YES at 60¢ + NO at 38¢ = 98¢), buying
both sides simultaneously locks a $1 terminal payoff for 98¢, a 2¢
risk-free arbitrage. Engine has no mode that buys two correlated legs
of the *same* market expecting collapse to terminal value.

**Proposed:** mode `basis-arb`. Inputs: ticker, total dollar budget.
Engine simultaneously buys YES at best ask + NO at best ask in
proportional sizes, halts if total cost ≥ $1 per pair (no longer
arbitrage). Single journal; both legs share atomicity-of-progress like
S5 pair.

**Engine-vs-agent line note:** the *decision* that an arbitrage exists
right now is the agent's call (read both sides, do math). The engine's
job is to execute both buys atomically once told to. Hard fail if the
arb closes mid-execution.

**Cost:** ~1.5 days after W1.5 + S5.

**Dependency:** W1.5, S5 multi-leg primitive.

### 🧊 S15 — GTC-prepend then sweep (hybrid passive→aggressive)
**Tags:** engine

**Trigger:** promoted from "Other deferred" per Sonnet B 2026-05-02 —
this is a distinct hybrid mode (passive window → aggressive sweep for
remainder), not a configuration variant of S1 or S2. On markets with
moderate natural flow, the passive window captures top-of-book pricing
while the sweep guarantees completion.

**Proposed:** mode `prepend-then-sweep`. Inputs: `{ ticker, side, size,
prependWindowMs }`. Phase 1: post one GTC at `ask − 1¢` (sell) /
`bid + 1¢` (buy) for full size. Wait `prependWindowMs`. Phase 2: cancel
unfilled portion; decrement remaining by what filled. Phase 3: run S2
aggressive on remainder. Race conditions managed: cancel must complete
before sweep starts (else a resting GTC could fill mid-cancel and
double-execute).

**Cost:** ~1 day after S1 + S2.

**Dependency:** S1, S2, W1.5.

### 🧊 S16 — Time-to-expiry emergency unwind
**Tags:** engine

**Trigger (NEW per Sonnet B 2026-05-02):** position approaches contract
close where the book may freeze. Distinct from S2 aggressive — S2
ignores price; S16 tracks remaining time and *escalates urgency as time
compresses*, eventually crossing any available bid regardless of floor.
Clock-driven rather than operator-triggered.

**Proposed:** mode `time-emergency`. Inputs: `{ ticker, side: 'sell',
size, contractCloseTimestamp }`. Engine schedules increasing-urgency
chunks: T-60min uses S1, T-30min uses S7-style ladder, T-10min uses S2,
T-2min crosses any bid regardless of floor. `safetySubmittedMultiple`
still binds.

**Engine-vs-agent line note:** clock-driven escalation is an execution
pattern, not a decision — once the agent says "use S16 by T", the
escalation schedule is mechanical. Distinct from W4.1 stop-loss
triggers which are price-driven.

**Cost:** ~1.5 days after S1 + S2 + S7.

**Dependency:** S1, S2, S7.

---

## W3 — Cross-cutting execution refinements

Apply across multiple S strategies. Worth building after the strategy
library so each refinement has multiple consumers from day one.

### 🧊 W3.1 — Participation-rate / POV pacing
**Tags:** engine [shared]

**Trigger:** chunks fire as fast as the loop runs. On thin/quiet markets the
engine can become a meaningful fraction of recent volume and signal its own
exit. Self-impact > book-impact in low-flow regimes.

**Proposed:** new safety field `maxParticipationRate: number` (e.g. 0.25).
Engine tracks rolling N-minute volume per ticker (Kalshi `getMarket().volume_24h`
plus a finer-grained polling option). Throttles `loopDelayMs` so cumulative
submitted shares per minute ≤ `maxParticipationRate × recent-minute-volume`.
Active across losing/winning/TWAP/scale-out modes.

**Cost:** ~1 day. New volume tracker, loop-delay computation, integration
tests against synthetic flow.

### 🧊 W3.2 — Anti-gaming randomization (chunk + timing jitter)
**Tags:** engine [shared]

**Trigger:** fixed `chunkSize` and fixed `loopDelayMs` create a predictable
footprint. Adversarial flow can detect the pattern and front-run.

**Proposed:** new safety field `jitter: { chunkSizePct: 0.15, loopDelayPct: 0.30 }`.
At each iteration, `effectiveChunk = chunkSize × (1 ± rand×0.15)` and
`effectiveDelay = loopDelayMs × (1 ± rand×0.30)`. Bounded so we never
exceed `safetySubmittedMultiple`. Active across every loop-based strategy;
required by S4 stealth.

**Cost:** ~3 hours. Bounded-clamp helper + 2 tests.

### 🧊 W3.3 — Pegged orders (peg-to-mid)
**Tags:** engine [shared]

**Trigger:** winning-exit / scale-out / roll all post static "ask − 1¢"
quotes that go stale as the book moves. Pegged-to-mid tracks market motion
without per-iteration cancel-replace overhead.

**Proposed:** new order helper that recomputes limit each loop as
`floor(midpointCents) ± offset` and re-posts only when the desired price
*changes*. Reduces API churn vs naive cancel-replace.

**Cost:** ~1 day on top of S1 passive.

**Dependency:** S1 passive (primary consumer).

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

### 🧊 W4.2 — Implementation Shortfall optimizer (Almgren-Chriss)
**Tags:** engine

**Trigger:** binaries have a *known terminal date and known terminal value*
($0 or $1). That collapses the optimal-execution problem to a closed-form
schedule that minimizes `E[slippage] + λ × Var[remaining-value-at-expiry]`.
Tractable in a way equity execution isn't. Real edge.

**Proposed:** new `src/optimalSchedule.ts`. Inputs: position size, time to
expiry, current probability, book-impact estimate (from TCA history).
Output: chunk schedule (size + interval) for any loop-based strategy to
follow. Integrates as an alternative to `chooseChunkSize` when
`useOptimalSchedule: true` on a strategy.

**Cost:** ~3-4 days. Math + simulation harness + unit tests against known
analytic solutions.

**Dependency:** W1.2 TCA (impact estimates), W4.1 (probability snapshots
from triggers).

### 🧊 W4.3 — Portfolio liquidation sequencer
**Tags:** engine [tui-mcp]

**Trigger:** when multiple losers exist — or under cash-raise pressure —
the question is *which to exit first*. S10 solved one specific case
(cash-raise); this generalizes.

**Proposed:** new `kea portfolio plan` subcommand. Reads positions, computes
`unrealizedLoss = costBasis − markToBid` and `EV(hold) = positionSize ×
midProbability` per ticker, ranks by `markToBid − EV(hold)` (most-overvalued-
to-hold first), emits a recommended sequence with named strategies per
position. Optional `--auto-execute` runs them sequentially.

**Cost:** ~2 days. Reads existing position/orderbook primitives + S
library selection logic.

**Dependency:** S library complete (sequencer routes each position to a
strategy).

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

### 🧊 SH-ALERTS — Notify-only synthetics (alerts layer)
**Tags:** shared [engine, ext, tui-mcp]

**Trigger:** triggers + synthetics commit operators to an auto-decision in
advance. Many operators want the system to *watch* without firing —
notify when KXMETGALA top YES bid drops below 5¢, ping when basis-arb
opens, alert when mark-to-bid drawdown exceeds 10%. Decision stays with
the operator; only the watching is outsourced.

**Proposed:** alerts ride the SH-WATCH watcher infrastructure. Same
evaluator engine; different action. New `action: 'fire' | 'notify'`
discriminator on synthetics (alerts are synthetics that notify). Six v1
alert kinds mirroring the synthetic set plus mark-to-bid drawdown and
basis-arb-opens. v1 channels: webhook (Slack/Discord-compatible) +
desktop. Email + extension toast deferred to v2. New `src/alerts/` dir;
extends `watcher.ts`, `watcherJournal.ts`, `cli.ts`, MCP server.

**Spec:** `engine-ts/docs/superpowers/specs/2026-05-05-alerts-layer.md`.

**Cost:** ~3–4 days. Cheap because most plumbing reuses SH-WATCH; the
work is mostly delivery channels + dedup/cooldown logic.

**Dependency:** SH-WATCH (foundation). No data dependencies — useful
day-one after SH-WATCH ships.

### 🧊 SH-BACKTEST — Record-and-replay harness for empirical strategy validation
**Tags:** shared [engine, tui-mcp]

**Trigger:** today every claim about a strategy's edge is a guess.
Operators can't tune trail distances, rung sizes, trigger thresholds
empirically — no historical data, no replay infra. The strategy library
remains faith-based. Without this, SH-EDGE has nothing to validate
against and SH-RECOMMENDER's calibration is generic textbook math.

**Proposed:** record layer atop SH-WATCH polling — flag enables
continuous orderbook + position + fill journal to NDJSON. Replay-mode
`KalshiClient` synthetic serves snapshots from disk; runs `ExitRunner` /
`BuyRunner` / synthetics in shadow mode. Counterfactual reports: per-
strategy P&L, slippage, fill rate, decision log. Parameter-sweep mode
runs grid of param values, outputs comparison table. Honest fidelity
caveats called out (sub-cadence blind spots, no market-impact modeling,
relative-not-absolute signal framing).

**Spec:** `engine-ts/docs/superpowers/specs/2026-05-05-backtest-harness.md`.

**Cost:** ~7–10 days. Recorder + replay client + harness orchestrator +
report generator + scenario library scaffolding.

**Dependency:** SH-WATCH (record layer attaches to the watcher poll). First
meaningful backtest ~T+30 days from SH-WATCH ship — needs accumulated
data. Soft synergy with SH-EDGE (parallel pipelines validating each
other).

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

### 🧊 SH-RECOMMENDER — EV/Kelly calculator + strategy recommender
**Tags:** shared [engine, tui-mcp, ext]

**Trigger:** today the LLM-in-the-loop (Claude/GPT via MCP) reads
positions and orderbooks but derives strategy/sizing math itself, often
poorly. `harvestPlanner` already does the math for harvest decisions; the
broader version covers entries, sizing, risk-of-ruin, strategy selection.
Once exposed as MCP, the model becomes a real co-trader instead of a CLI
wrapper.

**Proposed:** three layered modules, each independently useful, all
stateless functions extending `harvestPlanner.ts`:
1. **EV calculator** — generic `computeDecisionEV(ctx)` covering enter /
   hold / exit / scale-out / no-action. MCP tool `kea_ev`.
2. **Position sizer** — Kelly fraction (half-Kelly default) with portfolio
   correlation adjustment; respects `safety.ts` caps. MCP tool `kea_size`.
3. **Strategy recommender** — composes EV + sizer + (optional)
   operator-specific edge data from SH-EDGE → top-3 ranked strategies
   with EV/Kelly-justified params. Honest "no-recommendation" output when
   conditions fit no strategy. MCP tool `kea_recommend`.

**Spec:** `engine-ts/docs/superpowers/specs/2026-05-05-ev-kelly-recommender.md`.

**Cost:** ~4–5 days. Three modules, ~stateless, mostly math + light MCP
wiring + minimal TUI panel.

**Dependency:** none hard — extends `harvestPlanner.ts` which already
ships. Most useful once SH-WATCH manages positions (recommendations land
into actionable strategies). Richest output when SH-EDGE data is
available; degrades gracefully to generic textbook math otherwise.

### 🧊 SH-COMPOSE — Multi-stage workflow state machines + operator default policies
**Tags:** shared [engine, tui-mcp]

**Trigger:** synthetics + triggers solve "what to do when X happens" one
event at a time. Real trading workflows are multi-stage state machines:
"trail fires → rearm a fresh trailing stop on residual," "TP rung 3 fills
→ swap remaining synthetics from TP to trailing," "stop-loss on KXNFL →
register S-buy-dip on KXNBA." Today operators carry that state in their
head and re-arm manually after each fire.

**Proposed:** two complementary capabilities:
1. **Workflow engine** — small declarative JSON workflow definitions (no
   Turing-complete DSL). Long-running watcher subscribes to journal
   events (`synthetic_fired`, `synthetic_canceled`, `fill_received`,
   `time_elapsed`); advances active workflows; executes actions on
   transitions. Anti-runaway: explicit `maxTransitions` cap (default 50,
   hard 500), zero-event cycle rejection at load. 8 prebuilt templates
   ship in v1.
2. **Default policy engine** — separate watcher subscribing to
   position-detection events; auto-applies operator-configured policies
   ("every YES position above 50¢ auto-gets a 5¢ trailing stop and a TP
   at 95¢"). Condition→action shape, no chaining at v1.

Storage: `workflows.ndjson` mirroring `watchers.ndjson`. Both engines
respect `safety.ts` caps; serial per-instance reentrancy.

**Spec:** `engine-ts/docs/superpowers/specs/2026-05-05-strategy-composition.md`.

**Cost:** ~5–7 days. Workflow definition schema + engine + policy
engine + 8 templates + CLI/MCP/TUI surfaces.

**Dependency:** SH-WATCH live (workflows subscribe to its journal events).

---

# Surface parity sequence (extension / TUI / MCP)

Cascade engine capabilities onto each frontend. Order within a capability
is generally **MCP first** (simplest, agent-facing) → **TUI** → **Extension**
(richest UI, longest tail). Engine work is the prereq; each surface story
follows on its engine capability landing.

## SP1 — Existing engine, surface gaps

Independent of new engine work. Can start any time.

_SP1.1, SP1.2, SP1.3, SP1.4 shipped — see §7._

### 🧊 SP1.5 — Extension: execution summary report
**Tags:** ext

**Trigger:** when an exit finishes the panel just shows "done." For
post-trade review, users want a summary: actual gross/fees/net, vs.
projection, slippage, time-to-finish.

**Proposed:** on job completion, panel renders a summary card. Reads
`/status` (final) + journal-summary endpoint. After W1.2 lands, includes
TCA fields (arrival-mid slippage). Copy-to-clipboard for quick paste into
notes.

**Cost:** ~6 hours. Some overlap with SP4.3 (extension TCA viewer).

_SP1.6 saved presets shipped — see §7._

### 🧊 SP1.7 — Extension: account/profile switcher
**Tags:** ext

**Trigger:** the in-flight account-connect work adds named profiles to
CLI/TUI/MCP. Extension is the only surface still tied to whatever is in
env vars at server start.

**Proposed:** extension reads `GET /whoami` (new server endpoint that
mirrors `kea_whoami`). Dropdown to switch active profile via `POST
/whoami { profile }`. Visible "demo" / "prod" badge in the panel header
at all times.

**Cost:** ~4 hours after account-connect lands.

**Dependency:** account-connect plan (in flight).

### 🧊 SP1.8 — Extension: safety panel + forbidden tickers UI
**Tags:** ext [shared]

**Trigger:** W1.1 adds safety persistence with MCP/TUI editors. Extension
has no equivalent. Adding a forbidden ticker should be possible from the
same UI you'd use to launch an exit.

**Proposed:** extension panel "Safety" tab. Lists current safety values
(read-only — typed input is risky in a browser context). Lists forbidden
tickers with add/remove (add requires reason). Posts to a new
`/safety/*` server endpoint (server-side calls into `safety.ts`).

**Cost:** ~1 day after W1.1 lands.

**Dependency:** W1.1 safety persistence.

---

## SP2 — Strategy launchers (S library)

Once the strategy library exists, every surface needs a way to launch any
named strategy with the right inputs.

### 🧊 SP2.1 — MCP: `kea_strategy_run` unified launcher
**Tags:** tui-mcp [shared]

**Trigger:** today the only writer-style MCP tool is whatever W1.1 ships.
Once strategies exist, the agent should be able to launch any of them
through one well-shaped tool.

**Proposed:** new MCP tool `kea_strategy_run` with schema `{ strategy:
enum, ticker, side, size, options? }`. Server-side validation routes to
the right runner module (exitRunner / buyRunner / pairRunner / etc.).
Returns `{ jobId }`. Existing `kea_journal_*` tools handle progress
reads.

**Cost:** ~1 day per 3 strategies once at least one of each shape
(single-leg / multi-leg / market-making) exists.

**Dependency:** at least S1 + S2 landed.

### 🧊 SP2.2 — TUI: strategy picker tab
**Tags:** tui-mcp

**Trigger:** the TUI today is mostly an account/safety/journal viewer.
Once strategies exist, the most natural place to launch one is from a
keyboard-first tab next to the existing ones.

**Proposed:** new "Run" tab. List of named strategies; select one,
ink form prompts for the strategy's required inputs, dry-run preview
panel renders inline, confirm to start. Streams `/status` updates from
the running job.

**Cost:** ~1.5 days. Shares the form-component pattern with the planned
Account / Safety tabs.

**Dependency:** at least S1 landed.

### 🧊 SP2.3 — Extension: strategy picker
**Tags:** ext [tui-mcp]

**Trigger:** the extension today only knows about losing-exit. Same
launcher pattern as SP2.2 but adapted for the panel's narrower vertical
and Kalshi-page context.

**Proposed:** dropdown in panel header replaces today's implicit
losing-exit. Strategy selection drives which form fields render.
Live-mode confirm modal (SP1.3) gates the run. Auto-detected ticker
(SP1.1) and size (SP1.2) prefill where applicable.

**Cost:** ~2 days. Most expensive UI work in SP2.

**Dependency:** SP1.1, SP1.2, SP1.3, SP2.1 (uses the same server endpoint).

---

## SP3 — Trigger configuration (W4.1)

Once the trigger layer exists, every surface needs CRUD over trigger
rules.

### 🧊 SP3.1 — MCP: trigger CRUD tools
**Tags:** tui-mcp [shared]

**Trigger:** the W4.1 trigger layer is policy. Policy lives best where
the agent can read and edit it. Without MCP coverage, the agent can't
participate in the same trigger machinery a human edits via TUI.

**Proposed:** five tools: `kea_trigger_list`, `kea_trigger_get`,
`kea_trigger_add`, `kea_trigger_update`, `kea_trigger_remove`. Triggers
persist alongside `safety.json` (`triggers.json`, same atomic-write
pattern). Each mutation appends to the audit log.

**Cost:** ~1 day after W4.1 lands.

**Dependency:** W4.1 trigger layer.

### 🧊 SP3.2 — TUI: triggers tab
**Tags:** tui-mcp

**Trigger:** triggers are long-lived rules; the TUI is the natural place
to keep an eye on them at a glance.

**Proposed:** new "Triggers" tab. Lists active triggers with last-fire
timestamp. Add/edit/disable inline. Stream `trigger_armed` events into
the tab as they happen.

**Cost:** ~1 day.

**Dependency:** SP3.1, W4.1.

### 🧊 SP3.3 — Extension: triggers panel
**Tags:** ext [tui-mcp]

**Trigger:** extension users on Kalshi pages should be able to set up a
"if YES on this market drops below X, fire patient entry" trigger
without leaving the page they're already on.

**Proposed:** "Triggers" tab in the panel. Page-context-aware: prefills
the current market ticker. Lists triggers with active/paused state.

**Cost:** ~1.5 days.

**Dependency:** SP3.1, W4.1.

---

## SP4 — Reports + portfolio (W1.2 / W4.3)

### 🧊 SP4.1 — MCP: TCA + portfolio tools
**Tags:** tui-mcp [shared]

**Trigger:** TCA (W1.2) and portfolio plan (W4.3) emit data the agent
benefits from reading. Without MCP coverage, the agent can't reason
about post-trade quality or portfolio risk.

**Proposed:** `kea_tca_summary { jobId }` returns the per-fill slippage
breakdown. `kea_portfolio_plan { targetCash? }` returns the recommended
liquidation sequence. Both read-only.

**Cost:** ~6 hours each.

**Dependency:** W1.2 for TCA, W4.3 for portfolio.

### 🧊 SP4.2 — TUI: reports tab
**Tags:** tui-mcp

**Trigger:** post-job review and portfolio overview are natural keyboard-
first workflows.

**Proposed:** "Reports" tab with sub-views: per-job TCA summary
(arrival-mid slippage, fees, projection vs. actual) and portfolio plan.
Reuses the journal-list selector for picking jobs.

**Cost:** ~1 day.

**Dependency:** SP4.1, W1.2.

### 🧊 SP4.3 — Extension: reports panel
**Tags:** ext [tui-mcp]

**Trigger:** the SP1.5 execution summary is the simplest version of
this. After W1.2 lands, the summary becomes a richer TCA card. The
portfolio plan also belongs in the extension for at-a-glance context.

**Proposed:** "Reports" tab in the panel. Per-job TCA card on completion.
Portfolio plan card showing liquidation sequence + cash-target slider.

**Cost:** ~1.5 days.

**Dependency:** SP1.5 (subsumed by this story when W1.2 lands), SP4.1.

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

## 🧊 Min-chunk-value guard (avoid the $0.01-per-fill minimum tax)
**Tags:** engine [shared]

**Problem:** Kalshi rounds taker fees UP to $0.01 per fill. For a chunk worth
less than ~$0.15, the formula fee is below $0.01, so the minimum binds and
the effective fee rate balloons. Worst case: 1 share × 1¢ = $0.01 trade pays
$0.01 fee = 100% fee rate.

**Proposal:** new config `minChunkValueDollars: number` (default 0.15).
`decideLosingExitOrder` refuses to emit a chunk where
`chunk × decision.priceCentsExact / 100 < minChunkValueDollars`. Engine
logs `chunk_too_small_for_fee_threshold` and falls through to next iter (or
stops if remaining is the same shape).

**Where this matters:** tail-sweep + cancel-stale loops on cheap markets,
fractional remainders, and any exit where chunkSize × bid_price falls under
the threshold.

**Where it doesn't:** our P1 chunks were 2000 shares × 0.1-0.8¢ = $2-16 per
chunk, well above $0.15. Already fine.

**Cost:** ~2 hours. One pricing.ts change + 3 test cases.

**Why deferred:** P1 didn't trigger the failure mode. Build when a future
exit hits a cheap-market dust scenario where the per-fill minimum is the
dominant cost.

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
