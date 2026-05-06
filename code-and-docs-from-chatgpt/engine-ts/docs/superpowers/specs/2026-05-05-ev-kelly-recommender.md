# EV/Kelly Calculator + Strategy Recommender (Spec)

**Status:** Draft, 2026-05-05
**Author:** Brady (with Claude Code)
**Story ID (proposed):** SH-RECOMMENDER
**Related:**
- `code-and-docs-from-chatgpt/engine-ts/src/harvestPlanner.ts` — pure EV/risk-reduction math this feature generalizes (lines 21–62 risk table, lines 64–81 gamma proxy, lines 83–144 main entry)
- `code-and-docs-from-chatgpt/engine-ts/docs/superpowers/specs/2026-05-05-synthetic-order-types-watcher.md` — SH-WATCH; recommender's "armed strategy" output composes onto watcher
- `code-and-docs-from-chatgpt/engine-ts/docs/superpowers/specs/2026-05-05-pnl-attribution-edge.md` — SH-EDGE (sibling spec); supplies operator's per-strategy empirical edge to calibrate recommendations
- `code-and-docs-from-chatgpt/engine-ts/src/safety.ts` — pre-trade caps + forbidden-ticker; sizer's hard ceiling
- `code-and-docs-from-chatgpt/docs/STRATEGIES.md` — S1–S16 strategy library the recommender selects from

---

## 1. Goal

Expose the auto-exit decision math — **EV calculation, Kelly position sizing, and strategy selection** — as **stateless, queryable functions** that can be called from CLI, MCP, or TUI. Generalize `harvestPlanner.computeHarvestPlan` (currently scoped to *managing an existing position*) into a decision engine that answers any of:

- "Should I enter this market at the current ask, given my private p?"
- "I hold N contracts at cost basis C; should I hold, harvest, or scale-out?"
- "What's the Kelly-optimal size for this trade given my bankroll and existing exposure?"
- "Given the current state of this position, which S-strategy should I run, with what params?"

Output is **never an order** — it's a structured recommendation an operator (human or LLM) reads, judges, and optionally arms.

## 2. Why this matters — close the LLM-in-the-loop loop

Today, an LLM operator (Claude or GPT) connected over MCP can:

- read positions (`kea_positions`)
- read books (`kea_orderbook`)
- read journal (`kea_journal_*`)
- preview safety (`kea_preview`)
- *but* must derive sizing, EV, and strategy choice **inside its own reasoning** — using whatever textbook math it remembers, with no grounding in this operator's actual edge.

This produces predictable failure modes:

1. **Innumeracy under pressure.** LLMs do Kelly arithmetic poorly when the prompt context is large. Wrong `f*` by 2× is common.
2. **No portfolio awareness.** The model doesn't know what else is on, can't price correlation, can't see total exposure relative to bankroll without re-deriving from journal each turn.
3. **Generic strategy advice.** "Try S7 scale-out" is surface-pattern matching, not an EV-justified pick. The model has no memory of which strategies *actually work* for this operator.
4. **No calibration to operator edge.** Textbook Kelly assumes the stated `p` is the *true* `p`. If the operator's track record shows their private-`p` estimates are 7% over-confident on coin-flip markets, naive Kelly over-bets every trade.

This spec moves all four problems off the LLM and into deterministic code:

- **EV calculator** — exact math, returns numbers the LLM can quote, not derive.
- **Sizer** — portfolio-aware Kelly with operator-configured fraction and `safety.ts` ceilings.
- **Recommender** — top-3 ranked S-strategies with params, *cited against the operator's own edge data* when available.

The labor outsourced is **decision-math labor**: the part the LLM is bad at and humans don't want to redo every trade. The LLM keeps the labor it's good at: thesis articulation, news interpretation, prompt-driven workflow, narrative.

Also useful via plain CLI for non-LLM operators who want a "calculator before I act" without having to open a spreadsheet.

## 3. Architecture — three layered modules, each independently useful

```
                  ┌──────────────────────────────────────┐
                  │  Recommender (composer)              │
                  │  position + market + p_priv → top-3  │
                  │  ranked strategies w/ params + why   │
                  └──────────────┬───────────────────────┘
                                 │ uses
                ┌────────────────┴───────────────┐
                │                                │
                ▼                                ▼
   ┌─────────────────────────┐    ┌────────────────────────────┐
   │  EV calculator          │    │  Position sizer            │
   │  ctx → {EV(hold),       │    │  candidate + bankroll +    │
   │   EV(exit), EV(scale),  │    │   exposure → max-size,     │
   │   E[drawdown], f_kelly} │    │   capped by safety.ts      │
   └────────────┬────────────┘    └──────────────┬─────────────┘
                │                                │
                └─────────┬──────────────────────┘
                          ▼
              ┌────────────────────────┐
              │  harvestPlanner.ts     │
              │  (existing pure math)  │
              │  EV + risk + gamma     │
              └────────────────────────┘
                          ▲
                          │ optional
              ┌────────────────────────┐
              │  SH-EDGE attribution   │
              │  per-strategy empirical│
              │  edge by ticker class  │
              └────────────────────────┘
```

**Properties:**

- **All three layers are pure functions.** No I/O, no side effects, no global state. Same shape as `harvestPlanner.ts`. Testable with hand-built fixtures.
- **Each layer is independently useful.** The EV calc has value on its own (operator types numbers in, gets EV out). The sizer has value on its own (Kelly + safety caps). Recommender is the joinery, but you can use the parts.
- **Recommender composes the other two**, never duplicates their math.
- **Edge data is optional.** When SH-EDGE has shipped and there's history, recommender uses it. When not, it falls back to generic textbook math and emits a `calibration: "generic"` flag in the output.
- **No persistence.** Inputs come in, outputs go out. The caller is responsible for snapshotting bankroll / positions / book / private-p before calling.

**Definitions used throughout this spec (precise):**

- **`marketP`** — Kalshi market-implied probability. Specifically: `topYesBidCents / 100`. The price you'd get *selling* YES right now. Used for EV(exit-now). For entries, use `topYesAskCents / 100` (the price you'd *pay* to enter).
- **`privateP`** — operator's subjective probability. Comes in as a numeric input from the caller. The recommender does NOT derive this from anything; it's an exogenous belief.
- **Edge** = `privateP − marketP` (or vice versa for the short side). Positive edge = operator believes the market is underpricing; negative edge = market is overpricing.

## 4. v1 capabilities, per layer

### 4.1 EV calculator — `computeDecisionEV(ctx)`

Generalizes `harvestPlanner.computeHarvestPlan` (currently `harvestPlanner.ts:83–144`) from "manage existing position" to **any decision moment**.

**Decision modes (input enum):**

- `enter` — no position yet; evaluating buy at top ask.
- `hold` — position exists; question is whether to hold the whole thing.
- `exit` — position exists; question is full exit at top bid.
- `scale-out` — position exists; question is harvesting fraction `f` (delegates to existing risk-reduction table at `harvestPlanner.ts:21–62`).
- `no-action` — diagnostic mode; returns EV of every option side-by-side without a recommendation.

**Inputs (`DecisionContext`):**

```
{
  mode: 'enter' | 'hold' | 'exit' | 'scale-out' | 'no-action'
  ticker: string
  privateP: number               // operator's subjective probability, 0..1
  payoutCents?: number           // default 100
  position?: number              // contracts held (required for hold/exit/scale-out)
  costBasisCents?: number        // total cents paid (required for hold/exit/scale-out)
  candidateSize?: number         // contracts being considered (required for `enter`)
  catalystExpectedDate?: string  // ISO; same shape as harvestPlanner today
  orderbook: Orderbook           // top-of-book + depth, same shape
}
```

**Outputs (`DecisionEVResult`):**

```
{
  mode: <echo>
  marketP: number                // derived from book per definition above
  edge: number                   // privateP - marketP
  pStar: number                  // EV-crossover price; same as harvestPlanner.pStar
  ev: {
    hold: number                 // dollars; valid when position > 0
    exitNow: number
    scaleOut: number             // 50/50 patient blend (harvestPlanner.ts:96)
    enterNow?: number            // valid in `enter` mode; size × (privateP - askP) × payout
  }
  expectedDrawdown: {            // cents-of-MTM at risk, simple variance proxy
    oneSigma: number
    twoSigma: number
  }
  kellyFraction: number          // f* = edge / (1 - marketP) for binary; clipped to [0, 1]
  greeks: { delta, thetaPerDay?, gammaProxy }   // same as harvestPlanner today
  riskReductionTable?: RiskReductionRow[]       // populated for scale-out / hold modes
  recommendedAction: 'enter' | 'hold' | 'exit' | 'scale-out' | 'no-action'
  rationale: string              // 1–2 sentences citing the dominant reason
}
```

**Build directly on:**

- `harvestPlanner.ts:21–62` — `buildRiskReductionTable` reused unchanged for scale-out modes.
- `harvestPlanner.ts:64–81` — `computeGammaProxy` reused unchanged.
- `harvestPlanner.ts:90–96` — EV(hold) / EV(harvest) / EV(scale-out) formulas reused, generalized to take `position` from input rather than assuming "current holding".
- `harvestPlanner.ts:108–114` — theta-per-day formula reused.

The new arithmetic is `enterNow` EV (uses ask, not bid) and the Kelly fraction.

**Kelly for binaries (closed form):**

For a binary at market price `m` (cost), payout `1` on YES, with operator's true belief `p`:

```
b      = (1 - m) / m         // win/loss ratio: gain b on win, lose 1 on loss
f_full = (p * b - (1 - p)) / b
       = p - (1 - p) / b
       = (p - m) / (1 - m)   // simplified — note this is just edge / room-to-100
```

Clip to `[0, 1]`. Negative `f_full` → "don't bet"; recommender will surface as `no-action` for entries or `exit` for held positions.

### 4.2 Position sizer — `computePositionSize(ctx)`

**Inputs:**

```
{
  candidate: { ticker, marketP, privateP, payoutCents? }
  bankrollCents: number
  currentExposure: Array<{
    ticker: string
    contracts: number
    marketP: number
    payoutCents: number
    sector?: string             // operator-tagged; used for v1 correlation
  }>
  kellyMultiplier?: number      // default 0.5 (half-Kelly); operator-configurable
  maxConcentrationPct?: number  // default 25%; per-ticker bankroll cap
  maxSectorPct?: number         // default 40%; per-sector bankroll cap
  safetyCaps?: SafetySnapshot   // from safety.ts; absolute hard ceiling
}
```

**Outputs:**

```
{
  recommendedContracts: number
  capStack: Array<{
    name: 'kelly' | 'concentration' | 'sector' | 'safety' | 'bankroll'
    contractsAllowed: number
    binding: boolean             // true = this cap is the active bind
  }>
  kellyFractionUsed: number      // post-multiplier
  totalNotionalCents: number
  notes: string[]                // human-readable advisories
}
```

**Cap stack semantics:** the sizer evaluates every applicable ceiling, returns the *minimum* as the recommendation, and reports the full stack so the caller (or LLM) sees *which* constraint is binding. Five caps in v1:

1. **Kelly** — `f_full * kellyMultiplier * bankrollCents / costPerContract`, where `kellyMultiplier` defaults to `0.5` (half-Kelly, the standard "robust to mis-estimated p" choice).
2. **Concentration** — `maxConcentrationPct * bankrollCents / costPerContract`. Default 25%.
3. **Sector** — same as concentration but summed across the candidate's sector. Default 40%. Sectors come from operator tags on existing positions; v1 uses naive string-equality match.
4. **Safety** — pulled live from `safety.ts` snapshot (per-ticker max, daily-loss-cap remaining, forbidden-list check). Hard ceiling — never exceeded.
5. **Bankroll** — final sanity check: total notional ≤ bankrollCents.

**Correlation (v1, simple):** sector-based. If candidate's sector matches an existing position's sector, treat them as 100% correlated for the sector-cap test; uncorrelated otherwise. v2 graduates to a small covariance estimate from journal-derived returns (deferred).

### 4.3 Strategy recommender — `recommendStrategy(ctx)`

The composer. Calls the EV calc and the sizer, joins their output to operator edge data (when available), and selects from the S-library.

**Inputs:**

```
{
  ticker: string
  marketState: {
    orderbook: Orderbook
    timeToExpiryDays?: number
    realizedRangeCents?: number  // optional, for trail/ATR-style picks
  }
  privateP: number
  positionState?: {              // optional — undefined = entry decision
    contracts: number
    costBasisCents: number
  }
  bankrollCents: number
  currentExposure: Array<...>    // same shape as sizer
  edgeHistory?: EdgeHistory      // from SH-EDGE; optional
  kellyMultiplier?: number
}

// EdgeHistory (from SH-EDGE):
{
  byStrategy: Record<StrategyId, {
    n: number
    avgRealizedEdgeCents: number
    sharpe?: number
    winRate?: number
  }>
  byTickerClass: Record<TickerClass, {
    avgPrivatePCalibrationError: number  // signed: positive = operator over-confident
  }>
}
```

**Outputs:**

```
{
  candidates: Array<{
    rank: 1 | 2 | 3
    strategyId: 'S1' | 'S2' | ... | 'S16' | 'S-trail' | 'no-action'
    paramsSuggested: Record<string, unknown>
    expectedEvCents: number
    expectedDrawdownCents: number
    sizeContracts: number          // from sizer
    rationale: string              // 2–3 sentences
    edgeCitation?: {               // populated when edgeHistory provided
      n: number
      historicalAvgEdgeCents: number
      note: string                 // e.g. "operator over-confident by ~7¢ on coin-flip markets; privateP discounted"
    }
  }>
  calibration: 'edge-history' | 'generic'  // flag for caller
  noRecommendation?: {                     // mutually exclusive with `candidates`
    reason: 'no-edge' | 'safety-blocked' | 'forbidden-ticker' | 'insufficient-info' | 'kelly-zero'
    detail: string
  }
}
```

**Selection logic (v1, deterministic, transparent):**

1. Run EV calc in the appropriate mode (`enter` if no position, `hold` if position).
2. Run sizer to get max-size and binding cap.
3. Filter strategy library by **applicability gates**:
   - `S1` passive limit — applicable when edge > 0 and `marketP < 0.85`.
   - `S7` scale-out — applicable when position exists and `marketP ≥ 0.80`.
   - `S-trail` (SH-WATCH) — applicable when position exists, edge > 0, and `realizedRangeCents` known.
   - `S-losing` — applicable when edge < 0 and position exists.
   - … remaining S-library entries gated similarly per their docs.
4. For each applicable strategy, compute **score**:

```
score = expectedEvCents
        × kellyAlignment       // 1.0 if strategy_size matches sizer_size, decays otherwise
        × calibrationWeight    // from edgeHistory.byTickerClass; 1.0 in generic mode
        × historicalEdgeBoost  // log(1 + n) * sign(avgRealizedEdgeCents) when edgeHistory present
```

5. Sort by score, take top 3.
6. **No-recommendation triggers** (return `noRecommendation` instead of candidates):
   - All applicable strategies score ≤ 0.
   - Sizer returns 0 (Kelly-zero, safety-blocked, or forbidden-ticker).
   - Insufficient inputs (e.g. no orderbook depth, missing bankroll).
   - Edge magnitude below `minEdgeCents` threshold (default 2¢; operator-configurable).

**Calibration handling (the SH-EDGE join):**

- When `edgeHistory.byTickerClass[class].avgPrivatePCalibrationError > 0`, the recommender silently shrinks `privateP` toward `marketP` by that amount before computing EV. This is the operator-specific de-biasing.
- Output `rationale` cites the shrinkage explicitly: e.g. *"Your privateP of 0.62 was discounted to 0.58 (you're 4¢ over-confident on macro-event markets historically; n=27)."*
- When edge data missing → `calibration: 'generic'`, no shrinkage, rationale notes *"No operator edge history; using textbook math. Treat sizing as upper bound."*

## 5. File-touch boundary

**New files:**
- `src/decisionEv.ts` — `computeDecisionEV()`; reuses `harvestPlanner` internals.
- `src/sizer.ts` — `computePositionSize()`; cap-stack logic, Kelly closed-form, correlation v1.
- `src/recommender.ts` — `recommendStrategy()`; composes the above + edge-history join.
- `src/strategyApplicability.ts` — applicability-gate predicates per S-strategy (one function per strategy, transparent).
- `test/decisionEv.test.ts` — fixtures for each decision mode, including degenerate edges.
- `test/sizer.test.ts` — cap-stack ordering, binding-cap reporting, safety pass-through.
- `test/recommender.test.ts` — top-3 ordering, no-recommendation triggers, edge-history shrinkage, generic-fallback flag.

**Modified files:**
- `src/types.ts` — add `DecisionContext`, `DecisionEVResult`, `PositionSizerInput`, `PositionSizerOutput`, `RecommenderInput`, `RecommenderOutput`, `EdgeHistory`, `StrategyId` types.
- `src/cli.ts` — add `kea ev`, `kea size`, `kea recommend` subcommands.
- `src/index.ts` (MCP) — add tools `kea_ev`, `kea_size`, `kea_recommend`.
- `src/safety.ts` — expose a `getSafetySnapshot()` accessor if not already public, so sizer can read caps without touching internals.

**No changes to:**
- `harvestPlanner.ts` — reused unchanged.
- `exitRunner.ts`, `buyRunner.ts` — recommender outputs structured advice; arming is the operator's job (or a future `kea recommend --arm` flag, see §11).
- `watcher.ts` (SH-WATCH) — independent.

## 6. Surface

### 6.1 CLI

```
kea ev --ticker KXMETGALA-26-LAD --private-p 0.62 \
       --position 50 --cost-basis-cents 2400 --mode hold

kea size --ticker KXNFLMVP-26-MAH --private-p 0.41 \
         --bankroll-cents 250000 --kelly half

kea recommend --ticker KXSCOTUS-26-AFFIRM --private-p 0.55 \
              --bankroll-cents 250000 [--use-edge-history]
```

All three print human-readable tables AND emit `--json` for piping.

### 6.2 MCP tools

- **`kea_ev`** — wraps `computeDecisionEV`. The LLM passes `{ticker, privateP, mode, position?, costBasisCents?}`; receives the full `DecisionEVResult`.
- **`kea_size`** — wraps `computePositionSize`. The LLM passes candidate + bankroll; receives recommended contracts + cap stack.
- **`kea_recommend`** — wraps `recommendStrategy`. The headline tool. The LLM passes the full recommender input; receives top-3 strategies with rationale, or `noRecommendation`.

All three tools are read-only (no write surface, no order placement). They compose with existing write tools (`kea_synthetic_register`, etc.) — recommender tells the model *what* to arm, the model decides whether to call the arming tool.

### 6.3 TUI Recommender panel

New panel selectable from main TUI menu. Layout:

```
┌── Recommender ──────────────────────────────────────────┐
│ Ticker:    [_______________]                              │
│ Private p: [____]   Mode: [enter / hold / exit / scale]   │
│ Bankroll:  [auto-from-balance]                            │
│                                                            │
│ ── EV ─────────────────────────────────────────────────── │
│ marketP 0.51   edge +0.11   pStar 0.62                    │
│ EV(hold)  $XX.XX   EV(exit)  $XX.XX   EV(scale)  $XX.XX  │
│ Kelly f*  0.22   half-Kelly $XXX (XX contracts)           │
│                                                            │
│ ── Top strategies ─────────────────────────────────────── │
│ 1. S7 scale-out — rungs [60¢, 75¢, 90¢]   EV +$YY        │
│    Your S7 history: n=12, avg +3.2¢                       │
│ 2. S-trail (SH-WATCH) — trail 8¢  EV +$YY                 │
│ 3. S1 passive at 53¢                       EV +$YY        │
│                                                            │
│ [arm 1]  [arm 2]  [arm 3]   [explain]   [refresh]         │
└────────────────────────────────────────────────────────────┘
```

`[arm N]` calls into the existing strategy runners with the recommender's params pre-filled — same path the LLM uses via MCP. `[explain]` shows the full rationale + cap stack + edge citations.

## 7. Resolved design decisions

1. **Kelly multiplier default — half-Kelly (0.5).** Standard robustness choice; protects against `privateP` mis-estimation. Operator can override per-call (`--kelly full|half|quarter`) or via config. Full-Kelly is documented but never the default.
2. **Correlation model — sector-based v1.** Simple equality-on-tag; cheap; transparent. Full covariance estimate from journal returns is v2 once SH-EDGE has accumulated enough trade history. v1 is honest about its simplicity in the output (`notes` field surfaces "sector match assumed 100% correlated").
3. **No-recommendation triggers — five conditions, listed in §4.3.** All return structured `noRecommendation` with a `reason` enum, never silently fall back. The LLM gets a parseable signal it can act on (e.g. "ask the operator for a different ticker").
4. **Missing operator edge data — graceful degrade.** If `edgeHistory` undefined or empty for the relevant strategy/class, recommender uses generic textbook math and sets `calibration: 'generic'`. Output is still valid; caller knows to treat it as a starting point, not a calibrated answer.
5. **Output is never an order.** Even in MCP, `kea_recommend` returns advice, not a side effect. Arming requires a separate, explicitly-authorized tool call. This keeps the LLM's accidental-order surface zero from this feature.
6. **Stateless functions only.** No caching of recommendations, no "last suggested" memory. Each call is fully reproducible from inputs. Eases testing, journaling, and replay.
7. **Edge data join is read-only and optional.** Recommender never writes to the SH-EDGE store. SH-EDGE can ship before, after, or in parallel; recommender just uses whatever's there.
8. **Strategy applicability is one predicate per strategy in `strategyApplicability.ts`.** Transparent, easy to audit, easy to add new strategies. No giant switch.

## 8. Open questions

1. **Confidence exposure.** Should the recommender output a confidence score per candidate (e.g. "85% of similar past setups yielded positive EV")? Pro: gives the LLM a temperature signal. Con: confidence is hard to compute honestly without more data than v1 has. Lean: defer to v2; ship v1 with rank-only.
2. **Multi-leg recommendations.** Should v1 support compound suggestions like "S-bracketed-exit on existing position + S1 passive entry on the related ticker"? Lean: no, single-leg only in v1. Multi-leg adds combinatorial cost-stack complexity and calibration is harder. Revisit when single-leg recommender has been used in anger.
3. **`privateP` source.** Today the operator types it in. Should we accept derived `privateP` (e.g. from a poll-of-models input) and tag it differently? Probably yes long-term; out of v1 scope.
4. **TUI vs CLI vs MCP feature parity.** All three should expose the same outputs, but the TUI's "arm" buttons are an extra capability. Document in surface contract that CLI and MCP are read-only; TUI alone has the arm shortcut.
5. **How does recommender behave for forbidden tickers?** Today: `noRecommendation { reason: 'forbidden-ticker' }`. Open question: should it still compute and return EV for transparency, just with no actionable strategy? Lean: yes — operator might want the math even when the ticker is forbidden (e.g. to decide whether to lift the forbid).

## 9. Roadmap position

**Ships before SH-WATCH is feasible** — recommender is pure functions, no runtime daemon, no persistence. Could land standalone tomorrow.

**Most useful once SH-WATCH ships** — once synthetics exist, the recommender's "S-trail with trail=8¢" output becomes one-click armable via the watcher's register surface.

**Richest once SH-EDGE ships** — without operator edge history, recommender is a textbook calculator. With edge history, it becomes the operator-specific co-pilot the LLM-in-the-loop story needs.

Recommended ordering: **SH-RECOMMENDER → SH-WATCH → SH-EDGE**, but each is independently shippable and the recommender absorbs each subsequent capability without refactor (edge data is an optional input; arming hooks are a TUI/CLI surface concern).

## 10. Future extensions (post-v1)

1. **Bayesian update of `privateP` from market moves.** Given a starting `privateP` and a market path, infer "what does the latest move imply about my edge?" Could ship as an MCP tool `kea_update_belief` that returns a posterior `p`.
2. **Ensemble probability models.** Accept `privateP` as a list `{model: name, p: x}[]` and return EV / sizing under each; recommender picks the dominant. Useful when the LLM operator wants to ensemble its own thesis with a quantitative model.
3. **Auto-arm with one approval.** TUI button `[arm-with-approval]` that calls the existing strategy runner *and* returns a one-shot confirmation token. Reduces operator latency on time-sensitive recommendations without removing the safety check.
4. **Multi-leg recommendations.** §8.2 — defer to v2.
5. **Confidence intervals on EV.** Bootstrap from edge history; show "EV +$32, 90% CI [$8, $54]" instead of a point estimate. Post-SH-EDGE.
6. **Live recommendation refresh.** A trivial loop wrapping `kea_recommend` on a poll → emits to TUI. Borderline overlap with SH-WATCH; would build on the same daemon if shipped.
7. **Recommender → backtester reverse direction.** Given a historical setup, replay the recommender deterministically and grade its picks. Closes the loop for SH-EDGE: the same operator-specific edge data it consumes is improved by recording its own past recommendations vs realized outcomes.

---

**Spec status:** ready for review. No tasks here — see the eventual plan doc once the spec is approved.
