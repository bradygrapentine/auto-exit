# PnL Attribution / Per-Strategy Edge Analysis (Spec)

**Status:** Draft, 2026-05-05
**Author:** Brady (with Claude Code)
**Story ID (proposed):** SH-EDGE
**Related:**
- `2026-05-05-synthetic-order-types-watcher.md` (SH-WATCH — produces the trigger fires that this report attributes).
- SH-1 TCA (shipped, PR #13) — `src/types.ts:222–256` (`JournalKind = 'tca'`, `TcaEntry`); `src/mcp.ts:339–355` (`kea_tca_summary` reader).
- Sibling spec: backtest harness (historical replay infrastructure) — empirical validator for edge claims.
- Sibling spec: EV/Kelly + recommender — consumes per-strategy edge measurements as priors.
- `code-and-docs-from-chatgpt/docs/STRATEGIES.md` — S1–S16 + harvest variants.

---

## 1. Goal

Produce a **per-operator, per-strategy edge dashboard** that answers: *"For me, on the markets I trade, with the private p's I assign, which strategies actually generate edge? Which trigger thresholds need tuning?"*

Decompose every strategy fire's realized P&L into five attributable components:

1. **Entry edge** — was the entry price favorable vs fair value at decision time?
2. **Exit edge** — did the exit beat a passive benchmark (hold-to-resolution; immediate-exit-at-decision-mid)?
3. **Market drift** — uncontrollable price movement between decision and fill.
4. **Execution slippage** — already measured by SH-1 TCA; surfaces as a labelled component here.
5. **Trigger fire-quality** — was the trigger that armed the strategy correct in retrospect? Histogram fire-timing error vs hindsight optimum.

Output is operator-specific. The same strategy can show edge for one operator (NFL spreads, calibrated p) and negative edge for another (celebrity-prediction markets, miscalibrated p). The report tells *this* operator what's working for *them*.

**Non-goal for v1:** auto-tuning trigger params, auto-suspending underperforming strategies, generic "is S-trail good?" answers, cross-operator benchmarking.

## 2. Why this matters — operator-specific edge

Generic strategy descriptions ("S-trail locks gains; great in trending markets") are textbook. They don't tell an operator whether the strategy works *for them*:

- Operator A trades NFL game-winner markets; mid-range strategies (S-trail) plausibly print because price walks have momentum. Operator B trades celebrity-prediction binaries that gap on news; trailing stops whip out, S-step-trail wins instead.
- Operator A's private p is sharp on sports (calibrated against closing line); B's private p on entertainment is wide. Same strategy, different EV.
- Size budgets differ. A strategy that nets +2¢/contract sounds great until you discover the operator's average size makes it $0.40/fire after fees — below noise.

Manual labor outsourced:

- "Spreadsheet of every fire over the last 90 days, decompose P&L by component, group by strategy × market type, and tell me what's working" — that's hours of pivot tables, replaced by `kea edge`.
- "Was that S11 roll fire actually correct, or did the trigger fire 3¢ too early?" — needs counterfactual evaluation, not just realized P&L.
- "S-trail is winning on KXNFL but losing on KXMETGALA — should I disable it for entertainment markets?" — needs market-segmented attribution, not aggregate.

This feature exists because **edge is operator-specific** and the existing TCA report (`kea_tca_summary`) only measures execution quality, not strategy edge. A trade can have zero TCA slippage and still be a bad strategy fire.

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  kea edge (CLI / MCP / TUI)                                   │
│                                                                │
│  Inputs (read-only):                                           │
│    ${KEA_HOME}/jobs/<jobId>.jsonl       ← per-job journal      │
│    ${KEA_HOME}/watchers.ndjson          ← SH-WATCH fires       │
│    Kalshi positions + resolution history (via kalshiClient)    │
│                                                                │
│  Pipeline:                                                     │
│    1. ingest()    → load journal entries by lookback window   │
│    2. lifecycle() → join entries into "fires":                 │
│         (trigger_armed → entry fills → exit fills              │
│          → resolution outcome OR still-open mark)              │
│    3. attribute() → decompose P&L per fire into 5 components   │
│    4. aggregate() → group by strategy × market × trigger      │
│    5. snapshot()  → persist to edge-snapshots/<date>.json     │
│                                                                │
│  Output:                                                       │
│    Per-strategy edge table, per-trigger histogram, per-market │
│    segmentation, parameter-sensitivity curves.                │
└──────────────────────────────────────────────────────────────┘
```

**Inputs (concrete journal kinds consumed):**

- `'order_intent'` (`src/types.ts:224`) — captures decision-time payload + arrival mid.
- `'order_placed'` (`src/types.ts:225`) — captures decision-time orderbook snapshot (already attached, see `src/types.ts:267–273`).
- `'order_reconciled'` (`src/types.ts:226`) — actual fill price + size.
- `'tca'` (`src/types.ts:238`, `TcaEntry` at `:244–256`) — slippage vs arrival mid (component 4 input).
- `'gtc_resting'`, `'tail_gtc_posted'` — passive-fill provenance.
- `'passive_floor_hit'`, `'passive_ceiling_hit'`, `'passive_walk_tick'` (`src/types.ts:240–242`) — passive runner attribution.
- `'synthetic_fired'` (introduced by SH-WATCH spec §3 / §6) — trigger arming + fire timestamp + synthetic state at fire (e.g. `peakBidCents` for trailing stops; the in-hindsight optimum is computed against this same bid history).
- `'loop_started'` / `'loop_finished'` / `'buy_loop_*'` — strategy-fire boundaries.

**Resolution outcomes:** pulled from Kalshi REST (`/markets/{ticker}` `result` field) for closed markets. Still-open positions use mark-to-bid at snapshot time and are flagged `unresolved: true` so the report can show "tentative edge" separately from "realized edge."

**Storage:** aggregated snapshots at `${KEA_HOME}/edge-snapshots/<YYYY-MM-DD>.json`. Each snapshot is a denormalized roll-up; raw attribution is recomputed from the journal whenever the lookback window changes (cheap — journals are local NDJSON).

**Composition:**

- **TCA**: component 4 reads existing `'tca'` entries directly; SH-EDGE does not duplicate slippage math.
- **SH-WATCH**: every `'synthetic_fired'` entry becomes a fire row; the watcher's recorded state (e.g. peak bid for a trailing stop) is the input to fire-quality attribution.
- **Backtest harness** (sibling): the same `attribute()` pipeline runs against the harness's synthetic journals, validating edge claims before live capital is risked.
- **Recommender** (sibling): consumes the per-strategy edge table as a prior. Generic Kelly/EV becomes operator-tuned Kelly/EV.

## 4. P&L decomposition model

For each fire `f` with entry fills `E`, exit fills `X`, and resolution `R` (or mark `M`):

```
realizedPnL(f) = sum(X) − sum(E) + R·size − fees
              ≡ entry_edge(f)
              + exit_edge(f)
              + market_drift(f)
              + slippage(f)            ← from TCA
              + trigger_quality(f)
              + residual                ← rounding / unattributed
```

Definitions (v1 — see §9 for open questions on fair-value model):

- **entry_edge(f)** = `(arrivalMidCents − entryFillCents) · size`
  Positive if filled below mid (took the offer's other side; got the spread).
- **exit_edge(f)** = `(exitFillCents − benchmarkExitCents) · size`
  `benchmarkExitCents` chosen per fire: `passive_hold_to_resolution` (resolution price) for resolved markets; `decision_time_mid` as a stable tie-breaker.
- **market_drift(f)** = `(decisionMidAtExitTime − decisionMidAtEntryTime) · size`
  Counterfactual: what the position would have been worth at exit time if the operator had done nothing. Drift is uncontrollable; isolating it prevents punishing strategies for unlucky markets and rewarding for lucky ones.
- **slippage(f)** = sum of `TcaEntry.slippageCents · chunkSize` across the fire's chunks. Already in journal.
- **trigger_quality(f)** = `(realizedExitMidCents − optimalHindsightMidCents) · size`
  Optimal hindsight = the best mid in the bid-window between trigger arming and resolution (for take-profit) or the worst mid (for stop-loss). Watcher's recorded `peakBidCents` (SH-WATCH §4.3) is the input; for non-trailing synthetics, derived from the orderbook snapshots embedded in `OrderPlacedData` (`src/types.ts:267`+).

Components are computed in cents-per-contract space, then multiplied by size, summed to dollars. Rounding/unattributed P&L lands in `residual` and is reported per fire so a large residual flags an attribution bug.

## 5. v1 reports

### 5.1 Per-strategy edge

Table, one row per strategy in the operator's S-library that fired ≥ N times in the lookback (default N=5):

| Strategy | Fires | Realized $ | vs Passive Hold | vs Immediate Exit | Avg edge per fire | Sharpe-ish |

Counterfactual benchmarks computed on the same fire's entry/exit boundaries. "Sharpe-ish" = mean edge / stdev edge; not annualized — designed for cross-strategy comparison within this operator's history.

### 5.2 Per-trigger fire-quality

For each trigger that armed strategies in the window, a histogram of fire-timing error in cents:

```
S-trail trigger fires (n=42)
  too early (sold below later peak): 18 fires, median −7¢, p90 −22¢
  on time (within ±1¢ of optimum):    9 fires
  too late  (sold below stop drift): 15 fires, median +4¢, p90 +12¢
```

A bimodal distribution centred away from zero is the strongest "tune this" signal the report produces.

### 5.3 Per-market segmentation

Same strategy, broken out by market category (NFL / political / entertainment / weather / other — derived from ticker prefix). Surfaces "S-trail works on KXNFL but loses on KXMETGALA"-class findings without manual pivot tables.

### 5.4 Parameter-sensitivity

For each numeric trigger param (e.g. `trailCents`, `triggerPriceCents`), realized edge as a function of the value the operator used. Shape:

```
S-trail by trailCents
  3¢:  n=4,  edge −$12
  5¢:  n=18, edge +$41
  8¢:  n=15, edge +$67
  12¢: n=5,  edge +$8
```

Suggests tuning direction; does *not* prescribe (small n, operator judgement still required).

## 6. File-touch boundary

**New files:**

- `src/edge/attribution.ts` — `attribute(fire) → Components` pure function.
- `src/edge/lifecycle.ts` — joins journal entries into fire-shaped objects.
- `src/edge/benchmarks.ts` — passive-hold, immediate-exit, optimal-hindsight benchmarks.
- `src/edge/aggregate.ts` — group-by strategy × market × trigger; histogram + parameter-sensitivity.
- `src/edge/snapshot.ts` — persist/read `edge-snapshots/<date>.json`.
- `src/edge/marketCategory.ts` — ticker-prefix → category mapping (NFL / political / etc.).
- `test/edge/attribution.test.ts` — synthetic fire fixtures with known-decomposition.
- `test/edge/integration.test.ts` — end-to-end against a recorded journal fixture.

**Modified files:**

- `src/types.ts` — add `Fire`, `EdgeComponents`, `EdgeSnapshot`, `MarketCategory` types. No new `JournalKind` (read-only consumer).
- `src/cli.ts` — add `kea edge`, `kea edge --strategy <S>`, `kea edge --trigger <name>`, `kea edge --market <category>`, `kea edge --since <date>`.
- `src/mcp.ts` — register `kea_edge_summary` and `kea_edge_per_strategy` (mirroring the SH-1 `kea_tca_summary` shape at `:339–355`).
- `src/tui/App.tsx` — add `Edge` tab.

**No changes to:**

- `journal.ts`, `exitRunner.ts`, `buyRunner.ts`, `harvestPlanner.ts`, `passive.ts` — read-only consumer.
- `src/synthetics/*` (introduced by SH-WATCH) — SH-EDGE consumes their output.
- TCA writer paths — `'tca'` entries already exist.

## 7. Surface

- **CLI:** `kea edge` (overall summary), `kea edge --strategy S-trail`, `kea edge --trigger trailing_stop`, `kea edge --market nfl`, `kea edge --since 2026-04-01`, `kea edge --param trailCents` (sensitivity).
- **MCP:**
  - `kea_edge_summary { since?, until? }` → top-line per-strategy table.
  - `kea_edge_per_strategy { strategy, since? }` → drill-down: fires, components, market segmentation, parameter sensitivity for one strategy.
- **TUI:** new `Edge` tab in `src/tui/App.tsx` listing strategies sorted by edge-per-fire, drill-down on Enter to per-fire decomposition, filter by market category.

## 8. Resolved design decisions

1. **Lookback window default: 30 days.** Configurable via `--since`. Sub-30-day windows produce noise warnings ("n=3 fires; edge estimate unreliable"). Justification: S-library has ~16 strategies; with a few fires/day per strategy, 30 days is the minimum for n≥5 per strategy on the 4–6 most-used.
2. **Attribution model: linear additive (component sum = realized P&L − residual).** Not multiplicative. Tradeoff: simple to read, easy to debug, residual surfaces bugs. Multiplicative (compounding) attribution defers to v2 if residuals turn out structurally large.
3. **Still-open positions: marked separately.** Open fires use mark-to-bid at snapshot time, flagged `unresolved: true`, and reported in a parallel "tentative edge" column. Excluded from the "realized edge" totals to avoid double-counting once they resolve.
4. **Noise floor: ignore fires below $1 realized notional (default).** Configurable via `--min-notional`. Below that, fees + cents-rounding dominate; including them adds noise without signal.
5. **Multi-strategy positions: credit by entry fill provenance.** If a position was entered by S2 and exited by S-trail (because S-trail was registered as a synthetic on top of the S2-entered position), entry-edge credits S2 and exit-edge + trigger-quality credits S-trail. Fire rows tag both strategies; per-strategy aggregates count each fire once for the strategy that owned that decision.
6. **Resolution data fetch: lazy + cached.** First `kea edge` run after resolution fetches the resolution price; cached in `edge-snapshots/<date>.json`. No daemon, no background poller — the report ships when the user runs it.
7. **TCA double-count guard: slippage component is the *only* path that consumes `'tca'` entries.** Other components compute against arrival mid / decision mid directly. Prevents accidentally subtracting slippage twice.
8. **Snapshot determinism: journal-driven.** Same journal + same lookback window = same snapshot. No time-of-day randomness; resolution-cache misses fail loud rather than producing different numbers on retry.

## 9. Open questions

1. **"Fair value at decision time" without a probability model.**
   v1 uses *arrival mid* as the proxy. This conflates "the market's fair value" with "the consensus mid the operator could have transacted at." For operators whose private p systematically diverges from market mid (the whole point of the recommender's existence), this misattributes alpha-from-edge as entry-edge. Resolution: in v2, when the EV/Kelly recommender ships, swap arrival mid for *operator's private p × $1* as the fair-value reference for fires the operator originated; keep arrival mid for fires triggered by SH-WATCH synthetics where no operator-p was attached.
2. **Benchmark selection for exit edge.**
   "Hold to resolution" is unambiguous for resolved markets but undefined for unresolved. "Decision-time mid" is stable but ignores drift. v1 reports both; v2 picks the dominant one based on operator preference.
3. **Multi-strategy position credit allocation.**
   §8.5 picks "tag each fire with the strategy that owned the decision," but a bracket (SH-WATCH §4.6) is one synthetic owning entry + take-profit + stop-loss. v1 tags the bracket as the credited strategy; legs are sub-rows. Whether the take-profit leg should get separate per-trigger fire-quality treatment remains open.
4. **Market category taxonomy.**
   Ticker-prefix mapping (`KXNFL → nfl`, `KXMETGALA → entertainment`) is heuristic. Hand-curated table in `marketCategory.ts`; out-of-table tickers fall to `other`. A misclassified prefix produces a misleading segmentation row. Mitigation: log unmapped prefixes; nudge the operator to extend the table.
5. **Counterfactual realism — was the benchmark actually achievable?**
   "Hold to resolution" benchmark assumes the operator could hold the full size to resolution; on illiquid markets that's untrue (concentration limits, margin). v1 ignores this; v2 may apply a liquidity haircut.
6. **Cross-fire attribution (regret vs realized).**
   If S-trail fires 10 times with edge +$X, but the operator could have run S-bracketed-exit on the same 10 positions for edge +$Y, S-trail is leaving regret on the table. Surfacing regret requires running the alternative strategy in counterfactual; that is the **backtest harness**'s job, not SH-EDGE's. SH-EDGE reports realized edge; the harness reports regret. Combined view is a v3 composition story.

## 10. Roadmap position

**Dependencies:**
- ~30 days of journal data (`${KEA_HOME}/jobs/*.jsonl`) — practical floor for non-degenerate per-strategy n.
- SH-WATCH live (per `2026-05-05-synthetic-order-types-watcher.md` §3) — without `'synthetic_fired'` entries, the trigger-quality component degrades to "no triggers seen."
- SH-1 TCA (shipped) — slippage component depends on it; will produce `slippage = 0` if entries missing rather than failing.

**Standalone value:** even before the backtest harness ships, SH-EDGE produces per-strategy realized-edge tables and parameter-sensitivity curves directly from live journals. That alone justifies the story.

**With backtest harness:** harness produces synthetic journals → SH-EDGE attributes them → backtest results are directly comparable to live-edge metrics on the same axes. Validates harness fidelity.

**Feeds recommender:** once shipped, the EV/Kelly recommender reads `edge-snapshots/<latest>.json` and uses per-strategy realized edge as its prior, not generic textbook expectations.

**Sequencing recommendation:** ship SH-EDGE *after* SH-WATCH has been live ≥30 days, *before* the recommender. Backtest harness can land in parallel — SH-EDGE doesn't block on it.

## 11. Future extensions

1. **Auto-tuning recommendations.** Parameter-sensitivity curves (§5.4) imply tuning directions. v2 emits explicit suggestions: "S-trail has +$67 edge at trailCents=8 vs −$12 at 3; consider raising your default." Surfaces in `kea edge --suggest`.
2. **Strategy auto-suspension.** When a strategy's edge crosses below a configurable threshold (default: 95% CI upper bound below zero across last 30 days), SH-EDGE writes a `'strategy_suspended'` note. SH-WATCH consults it before arming new synthetics of that kind. Operator override available.
3. **Operator-private-p calibration report.** Cross-reference operator's pre-fire p's against realized resolution outcomes. Brier score per market category. Tells the operator "you're well-calibrated on NFL but overconfident on entertainment markets" — feeds back into recommender weights.
4. **Drift attribution refinement.** Decompose `market_drift` into "before-news" vs "after-news" segments using external event timestamps; only fully addressable once a news ingestion path lands.
5. **Cross-operator anonymized benchmarking.** Opt-in only. "Other operators on similar markets averaged $X edge on S-trail" — answers "is my underperformance a me-problem or a strategy-problem?" Privacy-preserving aggregation TBD.
6. **Live edge drift alerts.** Today's snapshot vs 30-day average per strategy; alert when a strategy's edge collapses inside a week. Pairs with auto-suspension.

## 12. Recommended next steps

1. Confirm the v1 attribution model (§4) — specifically the linear additive form and the choice of arrival mid as fair-value proxy in v1.
2. Confirm the v1 report set (§5) — strategy table, trigger histogram, market segmentation, parameter sensitivity. Defer regret / cross-strategy counterfactuals to the backtest harness.
3. Land SH-EDGE after SH-WATCH has accumulated ≥30 days of `'synthetic_fired'` data; ship SH-1-TCA-already in place; prerequisite floor met by then.
4. Wire the resulting `edge-snapshots/<date>.json` shape into the recommender spec as a prior input before the recommender is implemented.
