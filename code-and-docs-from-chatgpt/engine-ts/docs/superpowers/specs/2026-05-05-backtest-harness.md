# Backtest Harness (Spec)

**Status:** Draft, 2026-05-05
**Author:** Brady (with Claude Code)
**Story ID (proposed):** SH-BACKTEST
**Related:**
- `2026-05-05-synthetic-order-types-watcher.md` — SH-WATCH per-position watcher daemon. This spec builds atop it: the watcher poll loop becomes the recording layer (see SH-WATCH lines 36–64 for the daemon shape; line 64 audit hook is the journal seam this spec extends).
- `code-and-docs-from-chatgpt/docs/STRATEGIES.md` — S1–S16 plus harvest variants (S-harvest, S-losing, S-derisk). All replay targets.
- `src/replay.ts` — existing single-decision replay; this spec supersedes its scope (full slice replay, not single-entry diff) but reuses its `decideLosingExitOrder` re-execution pattern (lines 117–131).
- `src/exitRunner.ts`, `src/buyRunner.ts`, `src/harvestPlanner.ts` — strategy entry points the harness re-executes in shadow mode.

---

## 1. Goal

Build a **backtest harness** that replays recorded orderbook + position + fill history against any strategy in the library and reports counterfactual P&L, fill rate, slippage, and a per-tick decision log.

Concretely: answer questions like *"what if I had run S-trail with a 5¢ trail on KXNFL-26 throughout last week?"* with a number, not a guess. Sweep parameter grids. A/B compare strategy variants. Sanity-check a synthetic config before arming it live.

**Non-goals for v1:**
- Multi-ticker portfolio backtest (single-ticker per run; portfolio aggregation is composition, deferred).
- True market-impact modeling (replay is against a *recorded* book — see §8 fidelity caveats).
- Walk-forward optimization scaffolding (manual sweep only in v1; cross-validation deferred).
- Synthetic / generated market data (only replays *recorded* data).

## 2. Why this matters / what labor it outsources

Today every claim about a strategy's edge is faith-based. We picked S7 rung tables, S-trail trail distances, S-losing chunk sizes by intuition. The 2026-05-05 KXMETGALA-LAD episode burned that intuition: the algo's edge evaporated against a live floor pin and we had no way to retroactively measure how a different trail / chunk / cadence would have behaved.

**What it outsources:**
- **Strategy-tuning labor.** Operator stops eyeballing rung tables and starts sweeping them.
- **Pre-deployment sanity checks.** Before arming a synthetic on a live position, replay last week's analogous tickers; if the strategy lost money on similar regimes, don't ship it.
- **Postmortem analytics.** After a real loss, replay the actual book against alternative configs and learn what *would* have worked.
- **Empirical priors for trigger thresholds.** SH-WATCH's adaptive cadence, S-trail's `trailCents`, S7's rung spacing — all become data-driven.

The strategy library and trigger thresholds become falsifiable claims instead of opinions.

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Record mode (lives inside SH-WATCH watcher daemon)              │
│                                                                   │
│  watcher.poll(ticker) → orderbook                                 │
│     │                                                              │
│     ├──> evaluate(synthetic, orderbook)  [existing]               │
│     └──> recorder.append({ ts, ticker, orderbook,                 │
│                            position, fills }) → NDJSON            │
│                                                                   │
│  Output: ~/.kalshi-exit-assistant/recordings/<ticker>.ndjson      │
└─────────────────────────────────────────────────────────────────┘

                              │
                              ▼  (asynchronous, offline)

┌─────────────────────────────────────────────────────────────────┐
│  Replay mode (CLI / MCP)                                         │
│                                                                   │
│  loadRecording(file, [ts_from, ts_to])                            │
│     │                                                              │
│     ▼                                                              │
│  ReplayKalshiClient (synthetic; serves snapshots from disk;       │
│    intercepts placeOrder / cancelOrder; simulates fills against   │
│    the recorded book per §8 fill rules)                           │
│     │                                                              │
│     ▼                                                              │
│  StrategyHarness                                                  │
│    - tick: advance recording cursor → push snapshot to client     │
│    - on each tick, invoke strategy entry point                    │
│      (ExitRunner.run / BuyRunner.run / synthetic.evaluate)        │
│    - capture every decision + simulated fill into a trace         │
│     │                                                              │
│     ▼                                                              │
│  CounterfactualReport                                             │
│    P&L, fill rate, avg slippage vs midpoint, time-to-exit,        │
│    decision log, per-tick mark-to-bid curve                       │
└─────────────────────────────────────────────────────────────────┘
```

**Three layers:**

1. **Recorder** — append-only NDJSON writer attached to the SH-WATCH poll loop (see SH-WATCH spec §3, lines 36–64). When the watcher polls a ticker, the recorder writes the resulting snapshot. Idle-when-empty inherits from the watcher: zero registered watchers = no recording. Optional: a `kea record start <ticker>` standalone mode that polls a ticker without arming any synthetic, purely for data collection.
2. **ReplayKalshiClient** — implements the same interface as the live `KalshiClient` but reads from a recording file. `getOrderbook(ticker)` returns the snapshot at the current cursor. `placeOrder(...)` and `cancelOrder(...)` route to the fill simulator instead of the network. Strategy code is unmodified — it can't tell it's running against a recording.
3. **StrategyHarness** — orchestrates: instantiates a `ReplayKalshiClient`, invokes the strategy entry point (`exitRunner.run` etc.) with the recorded config, drives the cursor forward in simulated time, captures the decision/fill trace, emits a report.

The synthetic-client trick is the load-bearing design choice: it means **zero strategy-code changes** to support backtesting. The same `decideLosingExitOrder` that runs live runs in replay.

## 4. v1 capabilities

### 4.1 Record mode

- Toggle via `kea watch start --record` or per-watcher `record: true` flag.
- Standalone mode: `kea record start <ticker> [--cadence-ms 2000]` arms a recording-only watcher (no synthetic, no fire path).
- Output path: `~/.kalshi-exit-assistant/recordings/<ticker>-<YYYYMMDD>.ndjson` (one file per ticker per day; auto-rotates at UTC midnight).
- Schema: see §7.
- Position + fill events: when the operator's position on a recorded ticker changes (manual fill, runner fill, external), record a position-delta line. Source: poll `getPositions()` alongside orderbook poll, diff against last seen.

### 4.2 Replay mode

- `kea backtest run --recording <file> --strategy <S-id> --params <json> [--ts-from <iso>] [--ts-to <iso>] [--initial-position <n>]`
- MCP tool: `kea_backtest_run` with the same args.
- Selectable strategies (v1):
  - All S-strategies that flow through `ExitRunner.run` (S1, S2, S7, S-losing, S-harvest, S-derisk, S-trail, S-bracketed-exit, S-time-stop).
  - `BuyRunner.run` based entries (S-buy-stop, S-buy-dip, S-scaled-entry).
  - SH-WATCH synthetics directly (`stop_loss`, `trailing_stop`, `take_profit`, `oco`, `bracket`).
- Initial conditions: operator passes `--initial-position` (size + side + cost basis) OR the harness reads the position state at `ts-from` from the recorded position-delta stream.

### 4.3 Counterfactual report

Per-run JSON + human-readable summary:

```
{
  "config": { strategy, params, ticker, ts_from, ts_to, initial_position },
  "summary": {
    "pnl_cents": -312,
    "pnl_pct": -3.1,
    "fills": 14,
    "fill_rate": 0.78,
    "avg_slippage_cents_vs_mid": 0.6,
    "time_to_full_exit_s": 4280,
    "max_adverse_excursion_cents": 18,
    "max_favorable_excursion_cents": 7
  },
  "trace": [
    { "ts": ..., "decision": {...}, "simulated_fill": {...}, "remaining": ... },
    ...
  ],
  "mark_curve": [ { "ts": ..., "bid": 42, "ask": 45, "remaining": 80 }, ... ]
}
```

Console output: one-line summary + path to the full JSON. TUI surface deferred to a follow-up story.

### 4.4 Parameter sweep

- `kea backtest sweep --recording <file> --strategy <S-id> --grid <json>`
- `--grid` is a parameter dictionary where any value can be a list:
  ```json
  { "trailCents": [3, 5, 7, 10], "chunkSize": [10, 25, 50] }
  ```
- Harness runs the cartesian product, emits a comparison table sorted by the metric in `--rank-by` (default: `pnl_cents`).
- Output: NDJSON one row per param combination + a markdown table to stdout.
- Parallelism: each combination is independent; harness can fan out across N workers (Node `worker_threads`). v1: serial OK; parallel marked as v1.5.

## 5. File-touch boundary

**New files:**
- `src/backtest/recorder.ts` — NDJSON append-only writer; daily rotation; integration hook for SH-WATCH watcher poll loop.
- `src/backtest/replayClient.ts` — `ReplayKalshiClient` implementing the live `KalshiClient` interface from disk-backed snapshots.
- `src/backtest/fillSimulator.ts` — fill rules per §8.
- `src/backtest/harness.ts` — `runBacktest(config)` orchestration; produces `CounterfactualReport`.
- `src/backtest/sweep.ts` — grid expansion + per-combination dispatch + comparison table writer.
- `src/backtest/report.ts` — counterfactual-report formatting (JSON + markdown summary).
- `src/backtest/types.ts` — `RecordingEntry`, `BacktestConfig`, `BacktestTrace`, `CounterfactualReport`, `SweepGrid`.
- `test/backtest/recorder.test.ts` — record mode roundtrip.
- `test/backtest/replayClient.test.ts` — interface conformance + cursor mechanics.
- `test/backtest/fillSimulator.test.ts` — fill-rule edge cases (full cross, partial fill, no liquidity, IOC/FOK).
- `test/backtest/harness.test.ts` — end-to-end against a small canned recording.

**Modified files:**
- `src/watcher.ts` (from SH-WATCH) — accept `recorder?: Recorder` param; on each successful poll, call `recorder.append(snapshot)`. Single line of integration; falls through to no-op when undefined.
- `src/cli.ts` — add `kea record {start, stop, list}`, `kea backtest {run, sweep, report}`.
- `src/index.ts` (MCP server) — add tools `kea_recording_list`, `kea_backtest_run`, `kea_backtest_sweep`, `kea_backtest_report_get`.
- `src/types.ts` — extend `KalshiClient` with an interface alias if not already present, so `ReplayKalshiClient` can satisfy structurally.

**Reused untouched:**
- `src/exitRunner.ts`, `src/buyRunner.ts`, `src/harvestPlanner.ts`, `src/pricing.ts`, `src/synthetics/*` — strategy code is unaware of replay. This is the design's load-bearing property.
- `src/replay.ts` — kept as-is; serves the narrower "did the engine's pricing decision change since this entry was journaled" purpose. SH-BACKTEST is the strategy-level cousin.

## 6. Storage shape

### 6.1 NDJSON snapshot format

One JSON object per line, append-only. Three line kinds:

**`snapshot`** — orderbook poll result:
```json
{
  "kind": "snapshot",
  "ts": "2026-05-05T19:42:18.124Z",
  "ticker": "KXNFL-26-DAL",
  "orderbook": {
    "yes": [[42, 1200], [41, 800], [40, 500], ...],
    "no":  [[58, 1400], [59, 700], [60, 300], ...]
  },
  "depth_levels": 10,
  "poll_latency_ms": 87
}
```

**`position`** — position-delta event:
```json
{
  "kind": "position",
  "ts": "...",
  "ticker": "KXNFL-26-DAL",
  "side": "yes",
  "quantity": 80,
  "avg_cost_cents": 38,
  "delta": { "filled": 20, "side": "yes", "price_cents": 42 }
}
```

**`fill`** — explicit fill event from the live engine (when recording during a real run):
```json
{
  "kind": "fill",
  "ts": "...",
  "ticker": "...",
  "order_id": "...",
  "side": "yes",
  "size": 20,
  "price_cents": 42,
  "is_taker": true,
  "fees_cents": 14
}
```

### 6.2 Retention + compression

- Files rotate daily per ticker. Files older than 7 days gzipped (`<file>.ndjson.gz`).
- Files older than 90 days archived to `~/.kalshi-exit-assistant/recordings/archive/` and excluded from default `kea recording list` output.
- Retention is operator-tunable via `KEA_RECORDING_RETENTION_DAYS` env var; no automatic deletion in v1 (operator must run `kea recording prune`).
- Loader transparently reads `.ndjson` and `.ndjson.gz`.

### 6.3 Depth captured

Top 10 levels per side by default. Configurable via `KEA_RECORDING_DEPTH_LEVELS`. For Kalshi liquidity (typically thin past top 3–5), 10 levels is overkill but cheap and forward-compatible.

### 6.4 Cadence

Inherits the SH-WATCH adaptive cadence (default 2s; 250ms when near trigger; 5–10s when far / dormant). Recording-only standalone mode defaults to 2s flat. **Caveat:** sub-second events between snapshots are invisible to replay. See §8.

## 7. Resolved design decisions

1. **Snapshot cadence — match SH-WATCH adaptive.** No reason to record at a different cadence than the watcher polls. When the watcher accelerates near a trigger, the recording densifies for free. Replay fidelity is highest exactly where the strategy is most active — by construction.

2. **Depth captured — top 10 levels.** Kalshi books are thin; 10 is plenty. Cost is negligible (NDJSON compresses well; a year of one ticker at 2s cadence is ~150 MB pre-gz, ~15 MB gzipped).

3. **Fill simulation rules — naive cross-the-spread by default; queue-aware optional.** Two modes:
   - **`naive`** (default): a `limit` order at price ≥ best ask (yes-side) fills instantly up to displayed size at the displayed price. Resting `limit` orders below the spread fill if a future snapshot shows the touch reaching that price. `market` orders walk the book sweeping displayed liquidity at recorded prices.
   - **`queue_aware`** (opt-in flag `--fill-model queue_aware`): resting orders sit in the queue; a fill credits only if a recorded fill on the *opposite* side at that price tag indicates someone got filled there. More conservative, less optimistic. Marked v1 but flagged as "experimental — calibrate before trusting numbers."
   - **IOC/FOK semantics**: IOC fills marketable portion at recorded price, cancels rest. FOK fills entire size atomically iff displayed depth covers it; else cancels.

4. **Partial fills — modeled.** A taker order for size N against displayed depth M < N fills M, leaves N−M outstanding (becomes a resting order if `gtc`, cancels if `ioc`). The cursor advances; subsequent ticks may fill the remainder against new snapshots.

5. **Fees — modeled per Kalshi schedule.** Use the existing `pricing.ts` fee math (the same logic that powers `projectFullExit`). Replay reports both gross and net P&L. No estimation drift from live.

6. **Self-trade prevention — N/A in replay.** The recording captures only the operator's perspective of the public book; their own resting orders are indistinguishable from anyone else's. Replay assumes the operator is *not* one of the resting counterparties. See fidelity caveat in §8.

7. **Time advancement — discrete, snapshot-driven.** The harness's clock is the snapshot timeline. Strategy code that calls `Date.now()` is patched to return the current snapshot's `ts`. Strategy code that calls `setTimeout` advances to the snapshot whose `ts ≥ now + delay`. This makes replays deterministic and re-runnable.

8. **Initial position — explicit.** Operator must pass `--initial-position {size, side, costBasis}` OR rely on the recorded position-delta stream having an entry at or before `ts-from`. No silent defaults.

## 8. Replay fidelity caveats — read this before trusting any number

**This section exists because backtest results are seductive and easy to over-trust. Document the caveats loudly.**

1. **Recorded books reflect *only the public state, sampled at cadence.*** Sub-cadence events (ms-level cancellations, fills, posts) are invisible. A 250ms snapshot misses the 50ms window where the floor pinned and unpinned. Replay-fill rates over-estimate vs live for fast markets.

2. **Replay assumes the operator's actions don't move the book.** A live `S-losing` chunk that takes 50 contracts at the bid would deplete that level and possibly cascade through the next two. Replay against the recorded book serves all 50 at the recorded price as if no impact occurred. **For thin markets near expiry (the exact regime auto-exit targets), this over-estimates fill quality by a meaningful margin.** A queue-aware fill model (§7.3) is more conservative but still inferior to true counterfactual matching-engine simulation.

3. **The operator's *real* live orders during the recorded window are baked into the recorded book.** If the operator was running S7 at the time and consumed liquidity, the recorded book reflects *post-S7-fills* state. Replaying S-trail against that recording is replaying S-trail against *a book S7 already touched*. For records made while no live algo was active, this is fine. For records made during live runs, the result is "what would S-trail have done on a book S7 was already disturbing" — useful for A/B tuning but not a clean counterfactual.

4. **News-driven discontinuities.** When a recorded book gaps (e.g. major news), the replay sees the gap as a single tick. Strategies whose decisions depend on continuous price evolution (most trailing strategies) will respond exactly once at the post-gap snapshot — they cannot react inside the gap. Live behavior would have at least had a chance to fire mid-gap if the watcher's adaptive cadence ramped.

5. **Single-ticker only.** Multi-leg strategies (`S-portfolio-stop`, OCO across tickers) cannot be backtested in v1.

**Mitigation:** the harness's report includes an `assumptions_warning` field that lists which of the above caveats apply to the run (e.g. "recording was made during a live S7 run; book state is contaminated"). Operators should treat backtest P&L as a *relative* signal (does config A beat config B?) more than an *absolute* signal (will this strategy make money?). Comparing two strategies on the same recording is far more reliable than predicting absolute P&L.

## 9. Open questions

1. **Walk-forward scaffolding.** Should v1 ship a `kea backtest walkforward --train <window> --test <window>` mode, or wait for sweep evidence that hand-tuned grids overfit before automating cross-validation? Lean: defer; build only when a tuning pass empirically overfits.

2. **Slippage model fidelity.** Is naive cross-the-spread good enough? Queue-aware is conservative. A latency-aware model (apply a configurable 100–500ms delay between decision and book lookup) is closer to live. v1 ships naive + queue_aware; latency-aware is on the table.

3. **Multi-ticker scenarios.** When does the harness extend to portfolio-level backtests? Probably not until `S-portfolio-stop` ships and a portfolio-level synthetic exists to backtest. Naturally pairs with that future story.

4. **Live-vs-replay drift detector.** Should the harness run continuously in shadow mode against the live engine — replaying the same window of events through alternate strategy configs — and alert if a hypothesized config's projected P&L diverges materially from the live config's realized P&L? Useful as a "is reality still matching our model" canary; deferred until we trust the harness's baseline accuracy.

5. **Determinism guarantees across Node versions.** Strategy code uses `Math.random()` in a few places (jitter, tie-breaking). Does the harness seed PRNG per run for reproducible reports? Lean: yes, with `--seed <n>` flag, default `0`.

6. **Recording size for active accounts.** A trader with 30 active tickers polled at 2s averages ~2 GB of NDJSON per month pre-gz. Is that acceptable? Probably yes (cheap disk; gz cuts to ~200 MB). Revisit if anyone complains.

## 10. Roadmap position

**Lands AFTER SH-WATCH ships.** Hard dependency: the watcher poll loop is the recording layer. There is no other clean seam.

**First meaningful backtest is ~30 days after recording starts.** A single day of one ticker tells you nothing; a week of 5 tickers tells you a little; a month with diverse market regimes is when sweeps start producing actionable parameter recommendations. Plan accordingly:

- **T+0** (SH-WATCH ships): record-mode flag enabled by default for any watcher. Recording silently accumulates.
- **T+0 to T+30**: ship the harness, replay client, fill simulator, single-run CLI. Smoke-test against canned recordings + the first few real days of data. Don't trust any numbers yet — calibration window.
- **T+30**: first real sweep on a real ticker with a month of data. Start tuning S-trail / S7 / S-harvest defaults.
- **T+60**: walk-forward evidence. Decide whether to automate cross-validation.
- **T+90+**: backtest results feed into strategy library defaults; the library itself becomes versioned ("S-trail v2 — trail tuned to 7¢ from backtest sweep across 30d KXNFL").

**Sequencing in the shared-track plan:** SH-WATCH → SH-BACKTEST recorder + replay client + harness (single-run) → SH-BACKTEST sweep + report → SH-BACKTEST TUI/MCP rich surfaces.

## 11. Future extensions

1. **Scenario library — replay specific historical events.** Curate a set of "interesting moments" (the 2026-05-05 KXMETGALA-LAD floor pin, election-night flash moves, NFL final-2-min decay events). Backtest any new strategy against the library before shipping. Each scenario is a named recording slice + expected behavior assertions ("S-trail should not lose more than X¢ on the Met Gala scenario").

2. **Monte Carlo over recorded market regimes.** Cluster recorded windows by market characteristics (volatility, depth, near-expiry, news-driven) and resample with replacement to estimate strategy P&L distribution under each regime. Reports stop being "S-trail made $X on May 1–7" and start being "S-trail's 5th–95th percentile P&L on near-expiry-thin regimes is [−$X, +$Y]".

3. **Synthetic data injection.** Generate plausible book trajectories (e.g. via a stochastic price-drift model fit to recorded data) for stress-testing edge cases the recordings haven't seen yet. Lower priority; recorded data is cheaper and more honest.

4. **Adversarial scenario generation.** Auto-construct book trajectories specifically designed to break a strategy (the worst-case path within plausibility bounds). Useful as a robustness gate before shipping a new S-strategy.

5. **Live shadow-mode harness.** Run the harness continuously alongside the live engine: every live decision is mirrored against N alternate-config replays, and a dashboard surfaces real-time "config A would have outperformed config B by Z¢ on today's actual book." This is the natural endpoint — strategy tuning becomes a continuous closed-loop process driven by live data instead of weekly batch sweeps.

6. **Cross-ticker correlation analysis.** Once multi-ticker backtests exist, study which tickers' books correlate enough that strategy decisions on one should inform another (e.g. divisional NFL games on the same Sunday). Feeds the long-term portfolio-level engine.

7. **Auto-tuning loop.** Wrap sweep + walk-forward + scenario library into a single `kea strategy tune <S-id>` command that produces a recommended-defaults JSON the strategy library can adopt with one PR.

---

*This spec is a design document, not a plan. Implementation tasks, internal parallelism, and code review checklists are deliberately omitted. Once SH-WATCH lands and recording begins, a follow-up plan doc will sequence the harness implementation.*
