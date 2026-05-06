# Roadmap: CLI First → Local Extension → SaaS

## Phase 0 — CLI proof ✅

Validated:

- ✅ API auth (PSS signing, full-path message)
- ✅ orderbook parsing (`_fp` suffix, deci-cent ticks below 10¢)
- ✅ full-depth cumulative pricing
- ✅ order payload shape (FixedPointDollars strings, IoC + GTC)
- ✅ dry-run execution logs
- ✅ tiny live-size test (Phase 1: 5,000 P1 shares exited cleanly; smoke + resume tests since)

## Phase 1 — Local engine bridge ✅

- ✅ local HTTP server on `127.0.0.1:7777`
- ✅ `/health` `/preview` `/start` `/stop` `/status` `/preflight` `/resume`
- ✅ Chrome extension messaging to local server

## Phase 2 — Extension polish (in progress)

Remaining work — promoted to discrete stories under the Surface parity
sequence in `BACKLOG.md` (SP1.1–SP1.6):

- auto-detect market ticker more robustly
- optionally read position size from page if available
- add confirmation modal for live mode
- better progress bar
- execution summary report
- persistent saved presets

## Phase 3 — Engine hardening ✅

All shipped:

- ✅ true fill reconciliation before decrementing remaining size
- ✅ cancel/retry handling (`reconcileMaxPolls`, `cancelOnStale`)
- ✅ partial fill support
- ✅ position refresh from Kalshi account endpoint (`preflight`)
- ✅ structured logs to disk (append-only JSONL journal)
- ✅ crash-safe resume (live-validated — see `RESUME_LIVE_TEST_PLAN.md`)
- ✅ test adapter with mock orderbooks (`MockKalshiClient`)
- ✅ runtime safety cap (`safetySubmittedMultiple`) + forbidden-tickers guard
- ✅ auto-adaptive chunking (heuristic-based, no flag needed)

## Phase 4 — Winning exit

Folded into Phase 7 (Strategy library) — see story
`Winning exit (passive-first)` in `BACKLOG.md`.

## Phase 5 — Product/SaaS

Keep execution local. Monetize:

- license key
- premium presets
- reports
- alerts
- analytics
- extension polish

Avoid cloud custody/execution in early versions.

## Algorithmic enhancement sequence (Phases 6–9)

Restructured 2026-05-02 after multi-agent review (Codex C + Sonnet A + Sonnet B).
The prior W2 / EW2 split has been collapsed: 5 mirror-pairs merged into
single side-parameterized strategies; 3 strategies cleaned of agent-side
decision logic; 4 new strategies added. The unified library is **S1–S16**.
Each wave's stories are detailed in `BACKLOG.md`. Order is dependency-driven.

**Mental model.** Agent (LLM via MCP) picks a *security* + *side* +
*discrete strategy* + *size*, hits execute. No mid-flow configuration. The
agent owns *whether* and *how much* (edge, sizing, news interpretation,
portfolio decisions); the engine owns *how* (execution mode).

### Phase 6 — Foundation primitives

Prerequisites for everything else. Build first.

1. **Safety persistence + MCP/TUI write surfaces** — `safety.json` + audit
   log. Plan: `engine-ts/docs/superpowers/plans/2026-05-02-safety-config.md`.
2. **Post-trade TCA** — arrival-mid capture + per-fill slippage logging +
   `kea report`. Required to tune any later strategy empirically.
3. **Pre-trade risk checks** — `maxLossPerTicker`, `dailyLossCircuitBreaker`,
   `maxPositionConcentrationPct`. Extends safety.json.
4. 🚨 **Journal pre-call ordering bug fix (W1.4)** — `exitRunner.ts:350-363`
   journals `order_placed` *after* the network call, defeating crash-safe
   resume. Real-money correctness gap. Must ship before any new strategy.
5. **Buy primitive (W1.5)** — `buyRunner` mirror of `exitRunner`. Pulled
   forward (per Codex C review) to run in parallel with W1.2 / W1.3 once
   W1.1 lands. Unblocks 12 of 16 S library strategies.

### Phase 7 — Strategy library (S1–S16)

A unified, side-parameterized catalog. Where the same execution mode applies
to entry and exit (S1, S2, S3, S4, S5, S8), `side` is a runtime parameter,
not a separate strategy.

6. **S1 Passive** — post-and-walk (was W2.1 winning + EW2.2 patient)
7. **S2 Aggressive** — cross-the-spread max speed (was W2.2 panic + EW2.1)
8. **S3 TWAP** — time-sliced (was W2.5 + EW2.4)
9. **S4 Stealth** — anti-signaling randomized chunks (was W2.10 + EW2.5)
10. **S5 Pair / multi-leg** — atomic across linked tickers (was W2.6 + EW2.6)
11. **S6 Pre-resolution arbitrage** — cleaned of agent-side condition logic
12. **S7 Scale-out ladder** — cleaned of embedded return-multiple defaults
13. **S8 Limit ladder** — passive multi-rung GTC, side-parameterized
14. **S9 Stop-and-reverse** — composes S2 + S2 sign-flipped
15. **S10 Cash-raise sequencer** — cleaned; agent supplies ranking
16. **S11 Roll** — composes S1 (exit) + S2 (entry) on different ticker
17. **S12 Liquidity-providing** — two-sided market making
18. **S13 Iceberg** ★ NEW — single visible quote, hide remaining
19. **S14 Cross-resolution basis arb** ★ NEW — buy YES + NO on same market
20. **S15 GTC-prepend then sweep** ★ NEW (promoted from Other deferred)
21. **S16 Time-to-expiry emergency** ★ NEW — clock-driven escalation

(Existing **Losing exit** is the Phase 0 baseline; survives as the default
for sells when no strategy is named.)

### Phase 8 — Cross-cutting execution refinements

Apply across multiple S strategies. Build after the library so each
refinement has multiple consumers.

22. **Participation rate / POV pacing** — throttle by recent volume.
23. **Anti-gaming randomization (W3.2)** — jitter chunk size + delay.
    Required by S4 stealth.
24. **Pegged orders (W3.3)** — peg-to-mid for S1 / S7 / S11 / S12.

### Phase 9 — Decision + optimization layer

Layered on top of an established S library.

25. **Trigger layer (W4.1)** — stop-loss, trailing stop, time-decay,
    probability-based auto-arm. Selects *when* an S strategy runs and
    fires it with agent-supplied inputs. Triggered entry / triggered
    exit are both this story — no separate "entry trigger" needed.
26. **Implementation Shortfall optimizer (W4.2)** — Almgren-Chriss schedule
    against binary terminal value. Replaces heuristic chunk sizing inside
    any loop-based S strategy. Sign-symmetric for buy and sell.
27. **Portfolio liquidation sequencer (W4.3)** — ranks losers by
    `EV(hold) − mark`, drives multi-position exits. Generalizes S10
    cash-raise.
28. **Smart Order Router (W4.4)** — multi-venue. Final layer; only valuable
    after single-venue maturity is locked.
29. **Harvest planner (W4.5)** — decision-support "what-if" panel: EV
    crossover (`p* = avg_harvest_price / payout`), patient-vs-hold EV
    table under market p and operator's private p, and risk-reduction
    sizing table (incl. no-loss-floor row). Output framed in TradFi
    vocabulary (Delta / Theta / Gamma proxy / Sleeve sizing) since Kalshi
    binaries are digital options and patient-harvest = gamma scalping into
    expiry + pre-event de-risking sleeve. Sits between the S library and
    the trigger layer — agent calls this before invoking S1 (passive) or
    S7 (scale-out). See `BACKLOG.md` W4.5.

## Retired phases

- **Phase 4 (Winning exit)** — folded into S1 passive (side-parameterized).
- **Phase 10 (Entry foundation EW1)** — folded into W1.5 buy primitive.
- **Phase 11 (Entry strategy library EW2)** — merged into S1–S5 + S8 + S12.

## Phase 12 — Surface parity (extension / TUI / MCP)

The engine has three frontends: **browser extension** (panel injected on
Kalshi pages), **TUI** (ink terminal app), and **MCP** (tools the agent
calls). Each engine capability needs to land on each surface — or be
explicitly out-of-scope for that surface. Today coverage is uneven:

| Capability | Extension | TUI | MCP |
|---|---|---|---|
| Losing exit (existing) | ✅ via `/start` | ✅ | read-only preview |
| Account / profile switching | ❌ (SP1.7) | ✅ (shipped 2026-05-02) | ✅ `kea_whoami` (shipped 2026-05-02) |
| Safety + forbidden tickers | ❌ | 🟡 (W1.1) | 🟡 (W1.1) |
| Named strategies (S library) | ❌ | ❌ | ❌ |
| Triggers (W4.1) | ❌ | ❌ | ❌ |
| TCA / reports (W1.2) | ❌ | ❌ | ❌ |
| Portfolio view (W4.3) | ❌ | ❌ | ❌ |

The Surface parity sequence in `BACKLOG.md` (SP1–SP4) cascades each engine
capability into one backlog story per surface. Engine work is the
prerequisite; surface stories follow on each capability landing. Order
*within* a capability is usually MCP first (simplest, agent-facing),
then TUI, then extension (richest UI).

29. **SP1 — Existing engine, surface gaps.** Six Phase 2 extension items
    plus account/safety panels. Doesn't depend on new engine work; can
    start any time.
30. **SP2 — Strategy launchers.** MCP / TUI / Extension launchers for the
    S library.
31. **SP3 — Trigger configuration.** MCP / TUI / Extension surfaces for
    W4.1 triggers.
32. **SP4 — Reports + portfolio.** MCP / TUI / Extension surfaces for W1.2
    TCA reports and W4.3 portfolio sequencer.

## Phase 13 — Tooling ecosystem (SH stories)

**Reframing (2026-05-05).** Auto-exit started as exit-strategy execution.
With the SH stories below it becomes an **algorithmic-trading tooling
ecosystem**: the tool now offers six dimensions of leverage to operators,
not one.

| Dimension | What it outsources | Story |
|---|---|---|
| **Execution** (existing) | Placing orders well — chunking, sweeping, tail handling | S library, exitRunner, buyRunner |
| **Order types** | Stop-loss / trailing / take-profit / OCO / bracket — not native to Kalshi | **SH-WATCH** |
| **Surveillance** | Watching markets/positions for conditions without committing to a decision | **SH-ALERTS** |
| **Empirical validation** | Testing strategies against historical data; parameter walk-forward | **SH-BACKTEST** |
| **Edge measurement** | Per-strategy / per-trigger / per-market PnL attribution — operator-specific | **SH-EDGE** |
| **Decision support** | EV / Kelly sizing / strategy recommendation as MCP tools — LLM-in-the-loop co-trader | **SH-RECOMMENDER** |
| **Composition** | Multi-stage workflow state machines + operator default policies | **SH-COMPOSE** |

This phase is multi-stage. SH-WATCH is the foundation; the rest layer on top.

### Sequencing

33. **SH-WATCH — Synthetic order types via per-position watcher.**
    Plan-ready (PR #17). 8–9 days with full subagent parallelism. Six v1
    synthetic kinds (stop-loss / stop-limit / trailing-stop / multi-rung
    take-profit / OCO / bracket). Float price math for deci-cent ticks
    below 10¢. First-class user feature in TUI / extension / MCP — not
    just internal trigger plumbing. Validated against Kalshi OpenAPI:
    `type` enum is `limit | market` only; no native stops.

34. **SH-ALERTS — Notify-only synthetics (alerts layer).** 3–4 days.
    Cheap extension of SH-WATCH; same evaluator engine, different action.
    Webhook (Slack/Discord-compatible) + desktop channels in v1.

35. **SH-RECOMMENDER — EV/Kelly + strategy recommender.** 4–5 days. Can
    ship before SH-WATCH (extends `harvestPlanner.ts`); most useful once
    SH-WATCH exists; richest output once SH-EDGE has data. Three layered
    MCP tools (`kea_ev`, `kea_size`, `kea_recommend`) complete the
    LLM-in-the-loop story.

36. **SH-COMPOSE — Workflow state machines + default policies.** 5–7
    days. Multi-stage workflows + per-position auto-policy. Closed-set
    declarative JSON; explicit anti-runaway caps; 8 prebuilt templates
    in v1. Sits on top of SH-WATCH.

37. **SH-EDGE — Operator-specific PnL attribution.** 5–7 days. Pure
    analytics over existing journal — measures per-strategy /
    per-trigger / per-market edge **for this operator on these markets**.
    Useful at SH-WATCH + 30 days (data accumulation period). Feeds
    SH-RECOMMENDER as a calibration prior.

38. **SH-BACKTEST — Record-and-replay harness.** 7–10 days. Continuous
    journal during normal operation; replay against any strategy in the
    library. Unblocks empirical strategy tuning and parameter walk-
    forward. First meaningful backtest at SH-WATCH + 30 days.

### Why this is the right framing

Each dimension corresponds to labor an algorithmic trader currently does
in their head, in spreadsheets, or via custom scripts. Concentrating them
in one tool with a coherent surface (CLI + MCP + TUI + extension) means
the operator's *time*, not the *available infrastructure*, becomes the
binding constraint on how many strategies they can run profitably. The
LLM-in-the-loop integration via MCP turns this from a CLI for one
operator into a co-trading platform — an LLM model can query state, run
EV math, register synthetics, evaluate edge, and propose actions, all
through the same MCP surface a human operator uses.

**Sequencing principle:** SH-WATCH first because every other SH story
either consumes its journal events (alerts, compose), records its data
(backtest), measures its fires (edge), or hands recommendations into its
synthetic registration API (recommender). Without SH-WATCH the rest are
either generic textbook math (recommender) or speculative infrastructure
(the others). SH-WATCH ships an immediate user-visible feature —
*trailing stops on Kalshi, which Kalshi itself doesn't offer* — and
unlocks every later story.

### Beyond SH

The stories above represent the next ~6 months of focused work. Open
questions for further-out roadmap planning (not committed):

- **Multi-venue routing** (W4.4 SOR) — same questions on Polymarket /
  PredictIt / Manifold. Revisit after SH-EDGE proves single-venue edge.
- **Continuous market analysis engine** — long-term north star in
  `engine-ts/docs/superpowers/specs/2026-05-05-strategy-trigger-pairings.md`
  (regime classifier, multi-ticker analysis modules). Revisit only if
  empirical fire data from SH-WATCH + SH-EDGE shows specific analysis
  modules carry their own weight.
- **Buy-side synthetics v2** — entry-leg orchestration, S-buy-stop /
  S-buy-dip / scaled-entry. Revisit after exit-side SH-WATCH ships.
- **Tax / lot-tracking / compliance tooling** — niche but high-value for
  serious operators with real-money sizing. Defer until external pressure
  forces it.
