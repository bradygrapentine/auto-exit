# Engine backlog

Last `/backlog-sync`: 2026-05-02

| Status | Count |
|--------|-------|
| 🟡 Plan ready | 1 |
| 🧊 Exit sequence (W1–W4) | 20 |
| 🧊 Entry sequence (EW1–EW2) | 8 |
| 🧊 Surface parity (SP1–SP4) | 14 |
| 🧊 Other deferred (off-sequence) | 6 |
| ✅ Shipped (this log) | 3 |

This file is split into four sequences plus two ledgers. The **Exit
sequence** (W1–W4) is the planned arc from current state to a full
exit-strategy library. The **Entry strategy sequence** (EW1–EW2) is the
parallel arc on the open side; it shares W3 cross-cutting and W4
decision/optimization with the exit side. The **Surface parity sequence**
(SP1–SP4) cascades each engine capability onto the browser extension,
TUI, and MCP. **Other deferred** is the parking lot for off-sequence
micro-tactics.

The product surface is *discrete strategies*: agent picks a security + a
named strategy + size, engine executes. No mid-flow configuration. The
agent (LLM via MCP) owns *whether* and *how much*; the engine owns *how*.

---

# Algorithmic enhancement sequence

## W1 — Foundation primitives

Prerequisites for every strategy. Build first.

### 🟡 W1.1 — Safety persistence + MCP/TUI write surfaces

**Trigger:** safety guards (`safetySubmittedMultiple`, `floorPriceCents`,
`tailSweepThreshold`, `forbiddenTickers`) live only in hand-edited per-job
JSON files today. MCP is read-only. TUI has no settings surface. A typo in a
config file is the highest-likelihood path to a real-money mistake, and
`forbiddenTickers` (the "do not touch" primitive) deserves an audited workflow.

**Proposed:** `$KEA_HOME/safety.json` (atomic tmp+rename, `0o600`, mirrors
`credentials.ts`). Five new MCP tools (`kea_safety_get/set`,
`kea_forbidden_list/add/remove`). TUI Safety tab. At
`exitRunner.run()` entry, merge safety into the passed `ExitConfig` such that
caps can only tighten (`min` for multipliers, `max` for floors, `union` for
forbidden tickers). Append-only `safety.audit.jsonl` for every mutation;
`safety_loaded` journal entry at job start.

**Plan:** `engine-ts/docs/superpowers/plans/2026-05-02-safety-config.md` (READY).

**Cost:** ~1.5 days. 11 tasks, TDD per task.

**Why first:** unblocks W1.3 (pre-trade risk uses the same persistence) and
every W2 strategy that needs an audited risk envelope.

### 🧊 W1.2 — Post-trade TCA (arrival-price slippage logging)

**Trigger:** can't tune `chunkSize` / `mildAdaptive` / `minLevelSize` —
let alone any new strategy — without measuring realized slippage. Today we
know fees, not impact.

**Proposed:** at decision-time, log `arrivalMid = (topBid + topAsk)/2`. After
each fill, compute `slippageCents = arrivalMid − fillPriceCents` (signed for
sells). New `tca` journal kind. New `kea report <jobId>` subcommand emits a
markdown summary per job: realized slippage by chunk, by depth-tier, vs. the
theoretical full-depth projection. New MCP tool `kea_tca_summary`.

**Cost:** ~1 day. Mid-capture + journal kind + report builder + tests.

**Why second:** every W2/W3 strategy needs slippage data to tune. Without
TCA, optimizer work in W4 (Almgren-Chriss) has nothing to calibrate against.

### 🧊 W1.3 — Pre-trade risk checks (max-loss + circuit breaker + concentration)

**Trigger:** today the only pre-trade check is `forbiddenTickers`. A buggy
config or an over-eager trigger could blow through risk limits the user
*thinks* exist mentally.

**Proposed:** extend `safety.json` (after W1.1) with three caps:

- `maxLossPerTickerDollars` — refuse-to-start if projected net loss on this
  exit exceeds limit.
- `dailyLossCircuitBreakerDollars` — track realized losses across all jobs in
  a UTC day (in `safety.audit.jsonl`); refuse-to-start when the day's running
  loss meets the limit.
- `maxPositionConcentrationPct` — refuse-to-start any *open* (W2 stop-and-reverse,
  W2 roll) that would push one ticker > X% of portfolio NAV.

CLI/MCP/TUI surfaces inherit from W1.1 patterns.

**Cost:** ~1.5 days. Builds directly on W1.1.

**Why third:** every strategy in W2 should refuse to start when a risk
envelope is breached. Cleaner to add the check once, before each strategy.

---

## W2 — Strategy library (the catalog)

Each story below is a *named strategy* the user can pick from a TUI
dropdown / CLI subcommand / MCP enum. No configuration questions at run
time — the strategy embeds its own defaults, with `safety.json` as the
guard rail.

### 🧊 W2.1 — Winning exit (passive-first)

**Trigger:** designed in `docs/WINNING_EXIT_ALGORITHM.md`, never built. Today
the only mode is the losing-exit IoC sweep, which collapses price on
positions you actually want to harvest patiently.

**Proposed:** new mode `winning`. Steps:

1. Read bid/ask. If spread < 1¢, fall through to losing exit.
2. Post one chunk GTC at `ask − 1¢` (or pegged-to-mid once W3.3 lands).
3. Timebox `winningTimeboxMs` (default 60s).
4. Cancel unfilled remainder; on next iter post one tick lower.
5. Floor at `floorPriceCents` from safety.json.

**Cost:** ~1.5 days. New `winningExit.ts` module sharing primitives with
`exitRunner`, fixtures with wide-spread books, integration tests for
post/timeout/cancel/replace cycle.

**Why first in W2:** half the natural exit space is currently uncovered.
Largest single value-unlock in the strategy library.

### 🧊 W2.2 — Panic exit (cross-the-spread, max speed)

**Trigger:** news drops, position must be flat *now*, price doesn't matter.
Today the closest analogue is "set tight `floorPriceCents`, IoC sweep" — but
the loop still respects chunking, adaptive, and inter-iter delay. A panic
mode skips all of that.

**Proposed:** new mode `panic`. One IoC order for the entire `positionSize`
at `floorPriceCents = 0` (or 1¢ above worst-bid for slightly better fill
behavior under venue rules). No chunking, no adaptive sizing, no inter-iter
delay. `safetySubmittedMultiple` still applies as a runaway guard. Required
explicit `--confirm panic` to start (or 2-keystroke confirm in TUI).

**Cost:** ~4 hours. Trivial mode added to `exitRunner` with a hard early-out
for chunking/adaptive/delay logic.

**Why early in W2:** smallest implementation, largest psychological value.
Real users will reach for this once during a market event and will not forget.

### 🧊 W2.3 — Pre-resolution arbitrage exit

**Trigger:** market is hours from resolution, mid has converged near $1 or
$0, but a few cents of spread remain because the book is thin. A patient
winning-exit gets nothing (no buyers crossing); a losing-exit overpays in
slippage. There's a narrow window where the right move is "cross 1-2 ticks
to capture residual edge before settlement."

**Proposed:** new mode `pre-resolution-arb`. Inputs: `timeToCloseHours`
threshold (default 24). Behavior: aggressive IoC at `bid + 1¢` (giving up
one tick of slippage to fill); if no fill within `arbTimeboxMs`, escalate
to `bid` and sweep. Different from losing-exit because the chunks are
*small* (preserve price discovery) and the floor is *high* (won't sweep
into deep tail). Stops at `floorPriceCents = bestBid - 2`.

**Cost:** ~1 day. New mode + book-shape guard (only allow start if
`midToTerminal < 5¢`, else fall through to whichever of winning/losing
fits).

### 🧊 W2.4 — Scale-out ladder (profit-taking)

**Trigger:** position is up — but not all-the-way up. User wants to take
some off and let the rest run. Common in directional trading. Today this
requires running winning-exit with a partial `positionSize`, then again
later — manual.

**Proposed:** new mode `scale-out`. Strategy embeds a default ladder:
exit 25% at `entry × 1.5`, 25% at `entry × 2`, 25% at `entry × 3`, hold
remaining 25% to expiry. Each rung uses winning-exit semantics (passive
near ask). User-overridable rung table per strategy invocation.

**Cost:** ~1.5 days. New module orchestrating multiple winning-exit
sub-runs against price triggers; depends on W4.1 trigger layer (or a
simple polling loop until W4.1 lands — viable interim).

**Dependency:** softly depends on W2.1 (winning exit).

### 🧊 W2.5 — TWAP / scheduled bleed

**Trigger:** large position, no urgency, want to bleed it out predictably
over hours/days regardless of price. Common institutional pattern. Today's
phased plan (P1 phases) is a manual approximation.

**Proposed:** new mode `twap`. Inputs: `positionSize`, `intervalMinutes`,
`numIntervals`. Engine computes per-interval target = positionSize/numIntervals,
runs a single losing-exit chunk per interval, uses `safety.json` floor
discipline. Pauses overnight (configurable session window).

**Cost:** ~1 day. Daemon-mode runner (similar to what W4.1 needs anyway),
interval scheduler, journal kind `twap_interval`.

**Dependency:** sets up daemon scaffolding W4.1 reuses.

### 🧊 W2.6 — Pair / multi-leg unwind

**Trigger:** position is one leg of a hedge or spread (e.g. P1 YES + P4 NO
as a "0–6%" range bet). Closing one leg without the other re-introduces
directional risk the user explicitly hedged out.

**Proposed:** new mode `pair-unwind`. Inputs: list of `{ ticker, heldSide,
positionSize }` legs. Engine runs all legs in parallel under one job-id,
shares one journal, enforces atomicity-of-progress: if leg A is 50% done
and leg B's book disappears, *halt all legs*, surface to user. No leg is
allowed to outpace the others by more than `legSkewPct` (default 10%).

**Cost:** ~2 days. Multi-leg job runner, parallel orderbook streams,
skew-throttle logic, replay covering partial-leg-failure cases.

**Dependency:** wants W1.2 TCA to detect skew impact.

### 🧊 W2.7 — Stop-and-reverse

**Trigger:** thesis flipped. User wants to exit YES *and* open NO in one
atomic sequence. Currently two manual jobs with risk between them.

**Proposed:** new mode `stop-and-reverse`. Inputs: existing position +
`reverseSize` (NO position to open). Phase 1: panic-style exit of existing.
Phase 2: aggressive-IoC buy on opposite side. Single journal. W1.3 risk
checks apply to the open leg.

**Cost:** ~1.5 days. Composes panic-exit (W2.2) + a new buy primitive.

**Dependency:** W2.2 panic exit, W1.3 pre-trade risk.

### 🧊 W2.8 — Cash-raise (portfolio-sequenced to hit $ target)

**Trigger:** user needs $X in cash by deadline (margin call, withdrawal,
external trade opportunity). Wants minimum total loss to free that cash.
Today this is a manual ranking exercise.

**Proposed:** new mode `cash-raise`. Inputs: `targetCashDollars`,
`deadline`. Engine reads all positions, computes `costToFreeOneDollar` per
ticker (mark-to-bid impact / dollar freed), sorts ascending, runs
losing-exit (or winning if conditions match) on cheapest-to-exit positions
first until target met. Stops if target is reached mid-job.

**Cost:** ~2 days. Subset of W4.3 portfolio sequencer math, useful as a
specific named strategy before the general optimizer ships.

**Dependency:** W1.2 TCA for impact estimates.

### 🧊 W2.9 — Roll (exit current + re-enter next cycle)

**Trigger:** position thesis still holds but contract is expiring. Want to
roll into the next cycle's equivalent (e.g. monthly inflation print, next
election round, etc.) without going flat.

**Proposed:** new mode `roll`. Inputs: current position + target ticker.
Phase 1: exit current via winning-exit (preferred — minimize self-impact).
Phase 2: aggressive-IoC buy of target. W1.3 concentration cap applies to
phase 2.

**Cost:** ~1 day. Composes winning-exit + buy primitive.

**Dependency:** W2.1 winning exit, W2.7 buy primitive (shared).

### 🧊 W2.10 — Stealth / adverse-selection

**Trigger:** user suspects informed flow on the other side ("someone knows
the result"). Wants out without showing intent. Standard losing-exit prints
a recognizable pattern (uniform chunk, regular cadence).

**Proposed:** new mode `stealth`. Behavior: small randomized chunks
(50–200 shares regardless of `chunkSize`), random inter-chunk delay
(5–60s), no GTC tail (it would expose remaining size). Slower; fewer
fills per minute; minimal footprint.

**Cost:** ~1 day. Composition of W3.2 randomization primitive +
forced-small chunking. Cheap once W3.2 exists; can ship as a
standalone strategy first using its own RNG.

**Dependency:** mostly independent; sharing W3.2 jitter primitive is
cleaner if W3.2 ships first.

---

## W3 — Cross-cutting execution refinements

Apply across multiple W2 strategies. Worth building after the strategy
library so each refinement has multiple consumers from day one.

### 🧊 W3.1 — Participation-rate / POV pacing

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

**Trigger:** fixed `chunkSize` and fixed `loopDelayMs` create a predictable
footprint. Adversarial flow can detect the pattern and front-run.

**Proposed:** new safety field `jitter: { chunkSizePct: 0.15, loopDelayPct: 0.30 }`.
At each iteration, `effectiveChunk = chunkSize × (1 ± rand×0.15)` and
`effectiveDelay = loopDelayMs × (1 ± rand×0.30)`. Bounded so we never
exceed `safetySubmittedMultiple`. Active across every loop-based strategy;
required by W2.10 stealth.

**Cost:** ~3 hours. Bounded-clamp helper + 2 tests.

### 🧊 W3.3 — Pegged orders (peg-to-mid)

**Trigger:** winning-exit / scale-out / roll all post static "ask − 1¢"
quotes that go stale as the book moves. Pegged-to-mid tracks market motion
without per-iteration cancel-replace overhead.

**Proposed:** new order helper that recomputes limit each loop as
`floor(midpointCents) ± offset` and re-posts only when the desired price
*changes*. Reduces API churn vs naive cancel-replace.

**Cost:** ~1 day on top of W2.1 winning exit.

**Dependency:** W2.1 winning exit (primary consumer).

---

## W4 — Decision + optimization layer

Layered on top of an established strategy library. These don't add
strategies; they choose, optimize, and orchestrate the existing ones.

### 🧊 W4.1 — Trigger layer (auto-arm strategies)

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

**Dependency:** W2 catalog (triggers select named strategies; need
strategies first), W1.2 TCA (calibrate thresholds).

### 🧊 W4.2 — Implementation Shortfall optimizer (Almgren-Chriss)

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

**Trigger:** when multiple losers exist — or under cash-raise pressure —
the question is *which to exit first*. W2.8 solved one specific case
(cash-raise); this generalizes.

**Proposed:** new `kea portfolio plan` subcommand. Reads positions, computes
`unrealizedLoss = costBasis − markToBid` and `EV(hold) = positionSize ×
midProbability` per ticker, ranks by `markToBid − EV(hold)` (most-overvalued-
to-hold first), emits a recommended sequence with named strategies per
position. Optional `--auto-execute` runs them sequentially.

**Cost:** ~2 days. Reads existing position/orderbook primitives + W2 strategy
selection logic.

**Dependency:** W2 catalog complete (sequencer routes each position to a
strategy).

### 🧊 W4.4 — Smart Order Router (multi-venue)

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

---

# Entry strategy sequence

Parallel to the exit waves. The agent (your model, via MCP) decides
*whether* and *how much*; the engine offers a menu of *how to execute*.
Edge / Kelly / probability live in the agent — not here. EW3 and EW4 reuse
W3 and W4 (jitter, POV, peg-to-mid, triggers, IS optimizer all
sign-symmetric).

## EW1 — Foundation

### 🧊 EW1.1 — Buy primitive (`buyRunner`)

**Trigger:** the engine has no buy loop today. `KalshiClient.placeOrder`
exists but no equivalent of `exitRunner` for the open side: no chunked
IoC buy loop, no partial-fill reconciliation, no journal+resume. Required
by every entry strategy below *and* by exit stories W2.7 stop-and-reverse,
W2.8 cash-raise, W2.9 roll. Highest-leverage prereq in the entire roadmap.

**Proposed:** new `src/buyRunner.ts` mirroring `exitRunner` shape. Same
journal, same resume semantics, same safety merge. Crosses to the ask side
instead of the bid side. Reuses cumulative-depth pricing, adaptive
chunking, tail sweep, `safetySubmittedMultiple` cap.

**Cost:** ~2 days. Most logic factored from `exitRunner`; primary work is
extracting shared helpers cleanly.

**Why first:** unblocks 7 entry strategies *and* 3 exit strategies. No
parallel path through the rest of EW2 without it.

## EW2 — Entry strategy library

Each story is a *named strategy* the agent selects. No mid-flow questions —
agent supplies inputs, engine executes.

### 🧊 EW2.1 — Aggressive entry

**Trigger:** agent has decided to enter *now* — fresh edge, news-driven, or
manual conviction. Speed > price. Today no buy loop exists at all.

**Proposed:** mode `aggressive`. One-shot IoC at the ask for full
`positionSize`. No chunking, no delay, no patience. `safetySubmittedMultiple`
applies. Mirror of exit `panic`.

**Cost:** ~3 hours on top of EW1.1.

### 🧊 EW2.2 — Patient entry (post-and-walk)

**Trigger:** agent has high conviction but no urgency. Wants to minimize
cost basis by harvesting passive flow rather than crossing the spread.

**Proposed:** mode `patient`. Steps:
1. Read bid/ask. If spread < 1¢, fall through to aggressive.
2. Post one chunk GTC at `bid + 1¢` (or pegged-to-mid once W3.3 lands).
3. Timebox `patientTimeboxMs` (default 60s).
4. Cancel unfilled remainder; on next iter post one tick higher.
5. Cap at `maxPriceCents` from agent input.

Mirror of exit `winning`. Shares ~80% of code with W2.1.

**Cost:** ~1 day after EW1.1 + W2.1.

### 🧊 EW2.3 — Limit ladder

**Trigger:** agent wants pre-placed bids at multiple price points and to
walk away. Useful when expecting mean-reversion or willing to average down.

**Proposed:** mode `limit-ladder`. Inputs: list of `{ priceCents, sizePct }`
rungs. Engine posts each as a GTC at start, monitors fills, journals
each. No iteration loop after placement; relies on resume to reconcile
fills on next session. Mirror of exit `scale-out`.

**Cost:** ~1 day. New module; reuses `placeOrder` + journal primitives.

### 🧊 EW2.4 — TWAP entry

**Trigger:** large position, no urgency, want predictable accumulation
over hours/days regardless of price.

**Proposed:** mode `twap`. Inputs: `positionSize`, `intervalMinutes`,
`numIntervals`. Engine computes per-interval target = positionSize/numIntervals,
runs a single aggressive-buy chunk per interval, respects safety floors.
Pauses overnight (configurable session window). Mirror of exit W2.5.

**Cost:** ~1 day. Reuses daemon scaffolding from exit W2.5 if landed first.

### 🧊 EW2.5 — Stealth entry

**Trigger:** large position, agent wants to accumulate without showing
intent. Standard chunked-buy prints a recognizable pattern.

**Proposed:** mode `stealth`. Small randomized chunks (50–200 shares
regardless of `chunkSize`), random inter-chunk delay (5–60s), no GTC
ladder (would expose remaining size). Slower; minimal footprint. Mirror of
exit W2.10.

**Cost:** ~1 day. Composition of W3.2 jitter + forced-small chunking.

### 🧊 EW2.6 — Pair / multi-leg entry

**Trigger:** agent wants to open a spread or range bet atomically (e.g.
YES on P1 + NO on P4 to bet "0–6%"). Opening one leg without the other
re-introduces directional risk the agent explicitly hedged.

**Proposed:** mode `pair-entry`. Inputs: list of `{ ticker, side, size }`
legs. Engine opens all legs in parallel under one job-id, shares one
journal, enforces leg-skew throttle (no leg outpaces others by more than
`legSkewPct`, default 10%). On unrecoverable book disappearance for any
leg, halt all. Mirror of exit W2.6.

**Cost:** ~2 days. Multi-leg job runner shared with exit W2.6 if both
under the same author.

### 🧊 EW2.7 — Liquidity-providing (two-sided quoting)

**Trigger:** agent wants to make markets on a stable, wide-spread market —
post both YES bid and NO bid (or YES bid + YES ask) inside the spread,
harvest fills, manage inventory toward a target.

**Proposed:** mode `market-make`. Inputs: ticker, `targetInventory`,
`maxInventory`, `quoteOffsetCents` (how far inside the spread to post).
Engine maintains two resting GTCs, cancels and reposts on book moves
(uses W3.3 peg-to-mid when available). Cuts off when inventory hits
`maxInventory` on either side; reposts the *opposite* side aggressively
to flatten back toward `targetInventory`.

**Cost:** ~3 days. Significant new state machine; needs careful inventory
accounting and fill-reconciliation.

**Why last in EW2:** highest complexity, narrowest use case. No agent has
asked for it yet.

---

# Surface parity sequence (extension / TUI / MCP)

Cascade engine capabilities onto each frontend. Order within a capability
is generally **MCP first** (simplest, agent-facing) → **TUI** → **Extension**
(richest UI, longest tail). Engine work is the prereq; each surface story
follows on its engine capability landing.

## SP1 — Existing engine, surface gaps

Independent of new engine work. Can start any time.

### 🧊 SP1.1 — Extension: auto-detect market ticker

**Trigger:** today the user types/pastes the ticker into the extension
panel. The panel runs on a Kalshi market page — the ticker is right there
in the URL/DOM. Manual entry is a typo waiting to happen.

**Proposed:** content script reads `window.location.pathname` + the
event/market header DOM. Falls back to manual input if parse fails.
Surface the detected ticker prominently with a "use this" button.

**Cost:** ~3 hours.

### 🧊 SP1.2 — Extension: read position size from page

**Trigger:** Kalshi market pages show the user's current position when
logged in. Re-typing the size into the panel is friction *and* a vector
for fat-finger errors (off-by-one-zero on a 100k-share position).

**Proposed:** content script reads the position-size DOM node. Surface as
"detected position: N — use this" prefill. Refuse to autofill if the DOM
is ambiguous; never silently overwrite a user-entered value.

**Cost:** ~4 hours including DOM-stability tests.

### 🧊 SP1.3 — Extension: live-mode confirmation modal

**Trigger:** flipping `dryRun: false` through the panel today is a single
toggle. The asymmetric blast radius (irreversible orders) deserves a
deliberate confirmation step.

**Proposed:** when toggling to live mode, modal shows: ticker, side,
positionSize, projected gross/fee/net (from `/preview`), and a typed-string
confirm field (user types the ticker to confirm). Cancel returns to
dry-run. Mirror the `--confirm` discipline already used in CLI panic mode.

**Cost:** ~4 hours.

### 🧊 SP1.4 — Extension: progress bar

**Trigger:** today the panel shows a status string. For a long exit
(phased P1, large TWAP) a visual progress indicator makes monitoring
easier — and surfaces stalls at a glance.

**Proposed:** progress bar = `(positionSize - remainingSize) / positionSize`.
Sub-display: chunks placed, fees incurred, time elapsed. Pulls from
existing `/status` endpoint; no engine change.

**Cost:** ~3 hours.

### 🧊 SP1.5 — Extension: execution summary report

**Trigger:** when an exit finishes the panel just shows "done." For
post-trade review, users want a summary: actual gross/fees/net, vs.
projection, slippage, time-to-finish.

**Proposed:** on job completion, panel renders a summary card. Reads
`/status` (final) + journal-summary endpoint. After W1.2 lands, includes
TCA fields (arrival-mid slippage). Copy-to-clipboard for quick paste into
notes.

**Cost:** ~6 hours. Some overlap with SP4.3 (extension TCA viewer).

### 🧊 SP1.6 — Extension: persistent saved presets

**Trigger:** the same exit shape (e.g. "phased P1 phase 2 settings")
gets re-typed every time. Presets reduce both friction and typo risk.

**Proposed:** named presets in `chrome.storage.local`. Form has "save as
preset" / "load preset" / "delete preset" controls. Each preset captures
non-secret config only — no API keys, no per-job state.

**Cost:** ~6 hours.

### 🧊 SP1.7 — Extension: account/profile switcher

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

## SP2 — Strategy launchers (W2 / EW2 catalog)

Once the strategy library exists, every surface needs a way to launch any
named strategy with the right inputs.

### 🧊 SP2.1 — MCP: `kea_strategy_run` unified launcher

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

**Dependency:** at least W2.1 + EW2.1 landed.

### 🧊 SP2.2 — TUI: strategy picker tab

**Trigger:** the TUI today is mostly an account/safety/journal viewer.
Once strategies exist, the most natural place to launch one is from a
keyboard-first tab next to the existing ones.

**Proposed:** new "Run" tab. List of named strategies; select one,
ink form prompts for the strategy's required inputs, dry-run preview
panel renders inline, confirm to start. Streams `/status` updates from
the running job.

**Cost:** ~1.5 days. Shares the form-component pattern with the planned
Account / Safety tabs.

**Dependency:** at least W2.1 landed.

### 🧊 SP2.3 — Extension: strategy picker

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

**Trigger:** triggers are long-lived rules; the TUI is the natural place
to keep an eye on them at a glance.

**Proposed:** new "Triggers" tab. Lists active triggers with last-fire
timestamp. Add/edit/disable inline. Stream `trigger_armed` events into
the tab as they happen.

**Cost:** ~1 day.

**Dependency:** SP3.1, W4.1.

### 🧊 SP3.3 — Extension: triggers panel

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

**Trigger:** TCA (W1.2) and portfolio plan (W4.3) emit data the agent
benefits from reading. Without MCP coverage, the agent can't reason
about post-trade quality or portfolio risk.

**Proposed:** `kea_tca_summary { jobId }` returns the per-fill slippage
breakdown. `kea_portfolio_plan { targetCash? }` returns the recommended
liquidation sequence. Both read-only.

**Cost:** ~6 hours each.

**Dependency:** W1.2 for TCA, W4.3 for portfolio.

### 🧊 SP4.2 — TUI: reports tab

**Trigger:** post-job review and portfolio overview are natural keyboard-
first workflows.

**Proposed:** "Reports" tab with sub-views: per-job TCA summary
(arrival-mid slippage, fees, projection vs. actual) and portfolio plan.
Reuses the journal-list selector for picking jobs.

**Cost:** ~1 day.

**Dependency:** SP4.1, W1.2.

### 🧊 SP4.3 — Extension: reports panel

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

## 🧊 GTC-prepend before IoC sweep ("post-then-sweep")

**Idea:** before the IoC main loop runs, post a single GTC at our side's ask
(or one tick under) for the full position. Wait `prependGtcWindowMs`. Cancel
unfilled portion. Decrement remaining by what filled. Then run the existing
IoC loop for the rest.

**Upside:** capture top-of-ask pricing for any shares that fill during the
window. On a market with active buyer flow, this can be meaningful — e.g.
P1 had ~30k shares of 24h volume and a 0.4¢ spread; even partial capture at
ask price would have added $30-100 to a 95k-share exit.

**When it's worth it:** large position + decent natural volume + patience
(minutes to hours). When isn't: dust, urgent exits, dead markets.

**Risks:**
- Time cost; market can move adversely during the wait
- Another seller can undercut your resting offer, taking flow
- Race conditions: cancel must complete before IoC starts, else the sweep
  could double-execute against a resting GTC that fills mid-cancel

**Cost to build:** ~1 day. New config knobs, pre-loop posting + cancel logic
in `exitRunner.run()`, integration tests for fill-during-window and
cancel-failed-during-window cases.

**Why deferred:** existing IoC + tail-GTC covers the high-value cases (fast
exit + passive remainder). Prepend-GTC is a strategy lever, not a missing
feature; build it when you have a specific exit where the math says yes.
W2.1 winning-exit may subsume this.

## 🧊 Min-chunk-value guard (avoid the $0.01-per-fill minimum tax)

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

**Trigger:** posting GTC at top-of-book and re-quoting when undercut. Different
from current GTC (one-shot, exit loop after placement).

**Cost:** ~1 day. New loop variant that polls book + own order, cancels and
re-posts on adverse moves.

**Why deferred:** No concrete use case yet. Current GTC is a "leave it and
come back" tool, which fits the user's pattern. W2.1 winning-exit + W3.3
peg-to-mid will likely subsume the use cases this targets.

---

# ✅ Shipped

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
