# Strategy ↔ Trigger Pairings (Design Doc)

**Status:** Draft, 2026-05-05
**Author:** Brady (with Claude Code)
**Scope:** Design input for SH-3 (trigger daemon) and the live-data feed layer that must precede it.
**Not yet incorporated into:** SH-3 plan in `2026-05-02-track-shared.md`. Pending review.

---

## Problem statement

The auto-exit engine ships a growing library of exit/entry strategies (S1–S16, plus harvest variants S-harvest, S-losing, S-derisk). Each strategy is correct for a specific market regime, but today they must be armed manually — the operator inspects the orderbook, decides which strategy fits, and runs `kea start --config <strategy.json>`.

This wastes the engine's edge. The whole point of an algorithm is that *the right one fires at the right time*, automatically. SH-3 (trigger daemon) is the planned layer that does this — but it lacks two things:

1. **A canonical map** of which trigger conditions arm which strategies. Without it, the daemon implementation will drift into ad-hoc pairings.
2. **A live market-data feed**. Triggers evaluate market state (bid/ask, depth, slope, time-to-expiry, implied probability). The engine currently has no continuous price poll — it pulls the orderbook on demand inside `exitRunner`. Triggers cannot exist on top of that.

This doc fixes (1) and surfaces (2) as a prerequisite that must land before SH-3 is buildable.

---

## Part 1 — Strategy/trigger pairings

### Execution-tempo strategies (passive ↔ aggressive spectrum)

| Strategy | Goal | Trigger(s) |
|---|---|---|
| **S1 Passive** | Walk the spread, take the rebate | `spread ≥ N¢` AND `urgency = low` AND `T-to-close > 24h` |
| **S15 GTC-prepend → sweep** | Hybrid passive→aggressive | `urgency = medium` AND `top-bid depth ∈ [L_lo, L_hi]` — default fallback when S1 too patient and S2 too eager |
| **S2 Aggressive** | Cross the spread immediately | Thesis-invalidation (manual or news-feed) OR severe stop-loss (`mark-to-bid ≤ cost × 0.5`) OR floor-collapse imminent (`top bid ≤ 5¢` AND `slope < −2¢/min`) |
| **S4 Stealth** | Anti-signaling | `position-size / top-N-levels-depth > 0.3` (would move book) OR predatory-flow detector flags repeated front-running |
| **S13 Iceberg** | Size-hiding via single visible quote | `position-size > visibleSize × K` AND tight spread (passive viable but full size would scare the book) |

### Time-driven strategies

| Strategy | Goal | Trigger(s) |
|---|---|---|
| **S3 TWAP** | Hide footprint over hours/days | `position-size / ADV > X` AND `T-to-close > intervalMinutes × numIntervals × 2` |
| **S6 Pre-resolution arb** | Thin-book end-of-life exit | `T-to-close < 24h` AND `mid-to-terminal < 5¢` |
| **S11 Roll** | Roll into next cycle | `T-to-expiry < N hours` AND `thesis-still-valid` AND `next-cycle-ticker-exists` |
| **S16 Expiry emergency unwind** | T-to-close escalator | `T-to-close ≤ 60min` AND `position > 0` AND no other strategy active. **Priority-0 trigger — preempts all others.** |
| **S-derisk (pre-event)** | Trim the 90%+ sleeve before catalyst | `T-to-event ≤ N hours` AND `|p − 0.5| > 0.4` (optionally + vol-of-vol spike) |

### Price/probability-driven strategies

| Strategy | Goal | Trigger(s) |
|---|---|---|
| **S7 Scale-out ladder** | Take profits at rungs | Per-rung profit-target: `marketP ≥ rung[i].priceCents`. Each rung fires independently. |
| **S8 Limit-ladder GTC** | Set-and-forget mean reversion | Range-bound regime: `realized-vol < V_lo` AND `range-test count ≥ K` over rolling window |
| **S9 Stop-and-reverse** | Thesis flipped | Manual flip OR `marketP` crosses operator's flip threshold for ≥ M consecutive polls (anti-flicker) |
| **S-harvest (patient)** | EV-weighted partial exits | `privateP − marketP ≥ harvestEdge` AND profit-target rung from `harvestPlanner` output. Risk-reduction sub-trigger: when `privateP > EV-crossover`, fire the no-loss-floor row to lock cost+fees. |
| **S-losing (panic exit)** | Full-depth, certainty over recovery | **Floor-collapse:** `top YES bid ∈ [3¢, 5¢]` AND `slope < 0` over ≥ 3 polls; OR `Σ depth above floor × price < cost-basis × recoveryThreshold`. Plus stop-loss: `mark-to-bid ≤ cost × (1 − dropPct)` OR `≤ trailing-peak × (1 − retracePct)` |

### Multi-position / portfolio strategies

| Strategy | Goal | Trigger(s) |
|---|---|---|
| **S5 Multi-leg pair** | Atomic basket | `leg-skew > legSkewPct` OR pair-thesis flip |
| **S10 Cash-raise sequencer** | $X by deadline | `cash-balance < target` AND `deadline − now < window`; iterates pre-ranked positions |
| **S12 Liquidity providing** | Two-sided MM | `spread > S_min` AND `realized-vol < V_max` AND `OFI < O_max`. Inventory rebalance sub-trigger: `|inv| > maxInventory × 0.8` |

### Arbitrage strategies

| Strategy | Goal | Trigger(s) |
|---|---|---|
| **S14 Basis arb** | Lock free money | Continuous scan: `bestAsk(YES) + bestAsk(NO) < 100 − frictionBps` |

### Two structural observations

- **S16 is a meta-strategy.** Its trigger preempts every other arming when its condition fires. Spec it as priority-0, not as one of many parallel triggers.
- **S15 is the default tempo strategy.** When no more-specific tempo trigger matches (S1, S2, S4, S13), fall back to S15 GTC-prepend→sweep so positions don't drift naked toward expiry.

---

## Part 2 — Reusable trigger primitives

The pairings above resolve to ten reusable primitives. Each is a stateful evaluator over the live data feed:

1. **Floor-collapse** — `bid ≤ N¢` AND falling slope AND/OR thin recoverable depth.
2. **Stop-loss** — drawdown vs cost or trailing peak.
3. **Profit-target** — price hits rung (multi-rung supported).
4. **Time-decay** — T-to-event/expiry crossings.
5. **Probability-cross** — implied p crosses threshold (anti-flicker via N consecutive polls).
6. **Regime gate** — spread / depth / realized-vol / OFI bands; selects S1 vs S15 vs S2 and arms S8/S12.
7. **Cash/deadline** — portfolio-level cash target.
8. **Thesis-flip** — manual flag or news-feed signal.
9. **Basis-arb scanner** — continuous YES+NO < 100 − friction.
10. **Predatory-flow detector** — repeated-front-run pattern.

Build the primitives once; compose them per strategy. The strategy/trigger map above is the composition table.

---

## Part 3 — The missing engine (blocks SH-3, also a product surface)

### Reframe: this isn't just trigger plumbing

Auto-exit today is a **reactive execution tool**. The operator decides, the engine executes. There is no continuous market-data feed, no continuous analysis, no system opinion. Strategies are armed by hand. `harvestPlanner` is run on demand. The orderbook is fetched per session.

To make triggers possible, we need to add the missing middle: an **analysis engine** that ingests live data, runs analysis continuously, and exposes both signals (for triggers) and insights (for users). This isn't a hidden trigger-daemon prerequisite — it's a product capability in its own right. Once the engine exists, the TUI/MCP/extension all gain live charts, regime classification, "this position has X minutes of theta left" badges, alerts, and so on.

The architecture is three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: triggerDaemon (SH-3)                               │
│  Evaluates rules over engine output. Arms strategies.        │
│  Triggers are the engine's rule language.                    │
└──────────────────────────────────────────────────────────────┘
                          ▲
                          │ subscribes to signals
                          │
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: analysisEngine (NEW — proposed SH-2.7)             │
│  Runs analysis modules continuously over the feed window.    │
│  Emits typed signals: regime, EV-edge, slope, vol, OFI,      │
│  T-to-event, recoverable-depth, basis-arb, predatory-flow.   │
│  Existing on-demand modules (harvestPlanner, TCA, pre-trade  │
│  risk) become continuous consumers of the feed.              │
│  ALSO user-facing: TUI/MCP/extension query signals directly. │
└──────────────────────────────────────────────────────────────┘
                          ▲
                          │ subscribes to ticks
                          │
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: marketFeed (NEW — proposed SH-2.5)                 │
│  Continuous poll loop. Rolling window. Crash-safe journal.   │
│  Emits raw snapshots + immediate derived metrics (top bid,   │
│  spread, depth, mid). Single source of truth for all market  │
│  state. ALSO user-facing: TUI live book, MCP live tools.     │
└──────────────────────────────────────────────────────────────┘
```

### What auto-exit has today (Layer 1 gap)

- **`kea_orderbook` MCP tool**: pulled on demand.
- **`exitRunner` poll loop**: runs only inside an active exit job.
- **No persistent market-state store**: each session re-fetches; no history.

Every trigger primitive needs data the engine does not currently keep:
- **Floor-collapse, stop-loss, probability-cross**: need slope = price history over a window (≥ 3–5 polls).
- **Time-decay, S16 escalator**: need T-to-event/expiry — requires market metadata ingestion, not just orderbook.
- **Regime gate, S12 MM**: need realized-vol and OFI — windowed statistics over fills + book updates.
- **Predatory-flow detector**: needs an order-event audit trail across sessions.
- **Basis-arb scanner**: needs continuous polling across YES + NO of every watched market.

### What auto-exit lacks (Layer 2 gap)

There is no module that *forms an opinion* continuously. `harvestPlanner` computes EV but only when called. There is no equivalent of "the engine thinks this market is in a high-vol thin-book regime right now." Triggers cannot be a thin shell over raw ticks — they need pre-digested signals, or every trigger reimplements the same windowed math.

### Layer 1 — `marketFeed` (proposed SH-2.5)

1. **Continuous poll loop** — long-running process polling watched tickers at adaptive cadence (250ms–2s; faster near events).
2. **In-memory rolling window** — last N samples per ticker (orderbook snapshots, last-trade prices, bid/ask, depth-by-level). N ≥ 60 samples → ≥ 5 min at default cadence.
3. **Immediate derived metrics** — per-tick scalars: top bid/ask, spread, mid, total depth, depth-above-floor.
4. **Crash-safe persistence** — append-only NDJSON snapshot journal so a restart doesn't blind upstream layers for 5 minutes.
5. **Pub/sub API** — subscribers register per-ticker callbacks; the feed pushes ticks instead of being polled.
6. **Backpressure / rate limits** — coalesce subscribers, respect Kalshi rate limits, token-budget aware.
7. **User-facing reads** — TUI live book widget, MCP `kea_feed_subscribe` / `kea_feed_snapshot`, extension live-price badge.

### Layer 2 — `analysisEngine` (proposed SH-2.7)

A registry of **analysis modules**, each one a function `(window, position?) → Signal`. The engine subscribes to the feed, recomputes signals on each tick (or on schedule), and pushes them to subscribers.

Initial module set:
- **Regime classifier** — labels current market as `passive_friendly | thin_book | high_vol | floor_pinned | range_bound | mm_viable | pre_event`.
- **Slope tracker** — linear regression of top-bid over last K samples; emits `slope_cents_per_min`.
- **Realized-vol & OFI** — windowed statistics; feeds regime classifier.
- **Time-to-event** — ingests market metadata (close time, event time, settlement type); emits `T-to-close`, `T-to-event`.
- **Recoverable-depth tracker** — `Σ depth-above-floor × price` vs `cost-basis × recoveryThreshold`; emits boolean + dollars.
- **EV-edge (continuous harvestPlanner)** — runs `computeHarvestPlan` on every tick for every position with a stored `privateP`; emits `ev_edge_dollars`, `crossover_flag`, `gamma_proxy`.
- **Mark-to-bid P&L** — `position × top-bid − cost-basis − fees`; emits drawdown vs cost and vs trailing peak (drives stop-loss trigger).
- **Basis-arb scanner** — checks `bestAsk(YES) + bestAsk(NO)` continuously across watched markets.
- **Predatory-flow detector** — pattern recognition over the order journal (out-of-scope for v1, but reserve hook).

Existing on-demand modules become continuous consumers of the feed instead of one-shot callees:
- `harvestPlanner` → registered as the EV-edge analysis module.
- `tcaSummary` (SH-1) → live execution-quality dashboard, not just post-hoc.
- `preTradeRisk` (SH-2) → live circuit-breaker state visible in TUI.

**User-facing reads:**
- TUI: regime label, EV-edge per position, time-to-event countdowns, mark-to-bid sparkline.
- MCP: `kea_signals(ticker)`, `kea_regime(ticker)`, `kea_ev_edge(ticker)`. LLM operator (you, Claude in the loop) can query these for analysis.
- Extension: per-position colored badges (green = harvest-zone, yellow = de-risk, red = panic).

This is also where **alerting** lives — a signal crossing a threshold can ping the operator without arming a strategy, for cases where the operator wants the system's opinion but reserves the decision.

### Layer 3 — `triggerDaemon` (SH-3, scope-shrunk)

With Layers 1 + 2 in place, SH-3 simplifies dramatically. A trigger is just a **predicate over signals** plus a target strategy. No windowed math, no polling, no metric computation — all of that is upstream. SH-3 owns:

1. Trigger config schema (`{ when: predicate, arm: strategyName, params: ... }`).
2. Predicate evaluator over the analysis-engine signal stream.
3. Anti-flicker / debounce (require N consecutive ticks).
4. Strategy launcher (calls `kea start` / `kea buy` / etc.).
5. Audit log (`'trigger_armed'` JournalKind).

### Suggested track ordering

Two new shared-track stories before SH-3, in this order:

> **SH-2.5: `marketFeed` — live data layer.** Continuous poll, rolling window, derived metrics, crash-safe journal, pub/sub API. User-facing reads exposed through TUI/MCP/extension. Blocks SH-2.7 and SH-3.

> **SH-2.7: `analysisEngine` — continuous signals.** Registry of analysis modules consuming the feed. Initial module set: regime classifier, slope, vol+OFI, time-to-event, recoverable-depth, EV-edge (continuous harvestPlanner), mark-to-bid, basis-arb scanner. User-facing reads (signals, regime labels, EV-edge per position). Blocks SH-3.

> **SH-3 (revised): `triggerDaemon` — predicate-over-signal evaluator.** Strategy auto-arming layer. Now scope-shrunk: no windowed math, no polling — just predicate eval, debounce, launch, audit. Consumes Layer 2.

Each layer is independently useful before the next lands:
- After SH-2.5, users get live charts and live MCP tools — already a meaningful product upgrade.
- After SH-2.7, users get live regime labels and EV-edge readouts; the LLM operator can query "what's the engine's opinion on this position right now?"
- After SH-3, full auto-arm closes the loop.

This three-layer split also makes everything testable — synthetic windows test the engine, synthetic signals test the daemon, no live API needed in unit tests.

### Open questions for review

1. **Cadence**: 250ms aggressive enough for floor-collapse detection? Too aggressive for cost / rate limits? Default proposal: 1s, with adaptive override (e.g., S6, S16 demand 250ms when armed).
2. **Watchlist scope**: every open position, or operator-curated? Probably both — auto-watch every position you hold, plus manual additions.
3. **Off-platform data**: news feed for thesis-flip / S2 activation. Out of scope for v1, but the hook-shape should leave room.
4. **Backtest harness**: marketFeed should record-and-replay so we can unit-test triggers against historical books. Worth scoping into SH-2.5 or punting.

---

## Recommended next steps

1. **Review this doc** — agree on the three-layer architecture, the pairings table, and the primitive set.
2. **Add SH-2.5 (`marketFeed`) and SH-2.7 (`analysisEngine`) to the shared-track plan** ahead of SH-3.
3. **Update SH-3** to consume Layer 2 signals; drop windowed-math scope from the trigger daemon.
4. **For each S-library strategy that lands**, the implementation PR must include its trigger config referencing the primitives above (per project convention `project_strategy_trigger_pairing.md`).
5. **Surface Layers 1 + 2 to users** — TUI live widgets, MCP `kea_feed_*` and `kea_signals_*` tools, extension live badges. Don't let them remain trigger-only plumbing.
