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

The remaining algorithmic work is sequenced into four waves. Each wave's
stories are detailed in `BACKLOG.md`. Order is dependency-driven, not
priority-driven — early waves unblock later ones.

**Mental model.** Users pick a *security* + a *discrete strategy*, hit
execute. No mid-flow configuration questions. The strategy library (Phase 7)
is the catalog of named strategies. Foundation (Phase 6) gives every strategy
the same safety / measurement / risk primitives. Cross-cutting (Phase 8) and
Decision (Phase 9) layer on top.

### Phase 6 — Foundation primitives

Prerequisites for everything else. Build first.

1. **Safety persistence + MCP/TUI write surfaces** — `safety.json` + audit
   log. Plan: `engine-ts/docs/superpowers/plans/2026-05-02-safety-config.md`.
2. **Post-trade TCA** — arrival-mid capture + per-fill slippage logging +
   `kea report`. Required to tune any later strategy empirically.
3. **Pre-trade risk checks** — `maxLossPerTicker`, `dailyLossCircuitBreaker`,
   `maxPositionConcentrationPct`. Extends safety.json.

### Phase 7 — Strategy library

A catalog of *discrete*, no-config strategies. User selects one, engine
executes. Each is a separate mode in `exitRunner` (or a sibling module for
multi-leg/portfolio strategies).

4. **Winning exit** (passive-first; designed, not built)
5. **Panic exit** (cross-the-spread, max speed)
6. **Pre-resolution arbitrage exit** (capture last-cents convergence near expiry)
7. **Scale-out ladder** (partial exits at price targets)
8. **TWAP / scheduled bleed** (time-sliced over N intervals)
9. **Pair / multi-leg unwind** (atomic close across linked tickers)
10. **Stop-and-reverse** (exit + open opposite leg)
11. **Cash-raise** (portfolio-sequenced to hit $ target)
12. **Roll** (exit current + re-enter next cycle)
13. **Stealth / adverse-selection** (small randomized chunks, hide size)

(Existing **Losing exit** is the Phase 0 baseline.)

### Phase 8 — Cross-cutting execution refinements

Apply across multiple strategies. Build after the strategy library so each
refinement has multiple consumers.

14. **Participation rate / POV pacing** — throttle by recent volume.
15. **Anti-gaming randomization** — jitter chunk size + delay.
16. **Pegged orders** — peg-to-mid for winning / scale-out / roll modes.

### Phase 9 — Decision + optimization layer

Layered on top of an established strategy library.

17. **Trigger layer** — stop-loss, trailing stop, time-decay trigger,
    probability-based auto-arm. Selects *when* a strategy runs.
18. **Implementation Shortfall optimizer** — Almgren-Chriss schedule against
    binary terminal value. Replaces heuristic chunk sizing inside strategies.
19. **Portfolio liquidation sequencer** — ranks losers by `EV(hold) − mark`,
    drives multi-position exits in priority order.
20. **Smart Order Router** — multi-venue (Kalshi + Polymarket + …). Final
    layer; only valuable after single-venue maturity is locked.

## Entry strategies (Phases 10–11)

The agent (LLM via MCP) owns *whether* and *how much*. The engine owns
*how to execute*. Edge estimation, Kelly sizing, news interpretation all
live in the agent — not the engine. Entry strategies are pure execution
patterns, parallel to the exit catalog.

W3 (cross-cutting) and W4 (decision/optimization) absorb entries for free —
participation rate, jitter, peg-to-mid, triggers, and the IS optimizer are
all sign-symmetric. Only EW1 and EW2 are net-new work.

### Phase 10 — Entry foundation (EW1)

21. **Buy primitive (`buyRunner`)** — mirror of `exitRunner`: cross-spread
    IoC, partial-fill reconciliation, journal+resume. Required by every
    entry strategy *and* by exit stories W2.7 / W2.8 / W2.9.

### Phase 11 — Entry strategy library (EW2)

22. **Aggressive entry** — IoC sweep at ask
23. **Patient entry** — post-and-walk passive
24. **Limit ladder** — pre-placed GTC at price points
25. **TWAP entry** — time-sliced over N intervals
26. **Stealth entry** — small randomized chunks
27. **Pair / multi-leg entry** — atomic open across linked tickers
28. **Liquidity-providing** — two-sided quoting, inventory-capped

Triggered-entry behavior (auto-fire on signal) reuses the W4.1 trigger
layer — no new strategy needed. The agent supplies the trigger; the layer
fires whichever of 22–28 the agent selected.

## Phase 12 — Surface parity (extension / TUI / MCP)

The engine has three frontends: **browser extension** (panel injected on
Kalshi pages), **TUI** (ink terminal app), and **MCP** (tools the agent
calls). Each engine capability needs to land on each surface — or be
explicitly out-of-scope for that surface. Today coverage is uneven:

| Capability | Extension | TUI | MCP |
|---|---|---|---|
| Losing exit (existing) | ✅ via `/start` | ✅ | read-only preview |
| Account / profile switching | ❌ | 🟡 (account-connect) | 🟡 (`kea_whoami`) |
| Safety + forbidden tickers | ❌ | 🟡 (W1.1) | 🟡 (W1.1) |
| Named strategies (W2 / EW2) | ❌ | ❌ | ❌ |
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
    W2 + EW2 catalog.
31. **SP3 — Trigger configuration.** MCP / TUI / Extension surfaces for
    W4.1 triggers.
32. **SP4 — Reports + portfolio.** MCP / TUI / Extension surfaces for W1.2
    TCA reports and W4.3 portfolio sequencer.
