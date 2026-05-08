# First Live Backtest — Strategy Comparison Run

**Date:** 2026-05-08
**Scope:** Validation session, not a feature.

## Goal

Validate the SH-BACKTEST harness end-to-end with real recorded data by running `s-passive`, `s-aggressive`, and `s-twap` against one Fly-collected recording and comparing the 5 summary metrics side-by-side.

## Why

Slice 1's "Phase B: First live backtest run — manual eyes-on validation" was deferred during the engine-followups work and never executed. SH-BACKTEST-RUNTICK Phase 2 (PR #124) wired three runOneTick-driven adapters — they pass unit tests against synthetic fixtures, but no one has run them against a real Kalshi recording. This session closes that gap.

## Steps

1. **Sync recordings** — `node dist/cli.js record sync` pulls `/data/recordings/` from `auto-exit-scanner.fly.dev` to local `${KEA_HOME}/recordings/` via the tar-pipe-over-ssh path landed in PR #111.
2. **Survey + auto-pick** — `node dist/cli.js record list` lists local recordings sorted by recency. Inspect metadata (row count, time span, top-of-book volatility). Pick highest-volume recording with non-trivial mid movement. Document the choice and exact path.
3. **Run 3 backtests** using `node dist/cli.js backtest run --recording <path> --strategy <id> --params <json>` — same recording, same ticker (the recording's primary), same side/size for fair comparison.
   - `s-passive`: `{side: "sell", size: 10, minPriceCents: 20, chunkSize: 5, walkStepCents: 1}`
   - `s-aggressive`: `{side: "yes", action: "sell", size: 10}`  (`confirmedAggressive=true` forced by the adapter)
   - `s-twap`: `{side: "sell", size: 10, intervalMinutes: 1, numIntervals: 3}`
4. **Compare metrics** — extract from each `CounterfactualReport`: `pnl_cents`, `fill_rate`, `fill_count`, `avg_slippage_cents`, `time_to_full_exit_s`. Tabulate.
5. **Eyeball** — does the harness return without throwing? Are numbers plausible? Specific anomalies to watch for:
   - `fill_count = 0` for all three → fill model misconfiguration on this recording.
   - `fill_count = 0` for `s-passive` only → expected (documented `passiveTimeboxMs=0` limitation; SH-BACKTEST-PHASE-D will address).
   - `s-aggressive` reporting `done` but `filled = 0` → IoC sweep logic vs replay-client interaction issue.
   - `s-twap` running zero intervals → schedule / state init bug.
6. **File findings** — committable session note in `docs/superpowers/specs/2026-05-08-first-live-backtest-results.md`. Any harness bug → BACKLOG entry. Anything suspicious → flag in the session.

## Success criteria

- Harness runs without throwing for all 3 strategies.
- Each report contains plausible values (or a clearly-explained zero).
- Comparison table written to the results doc, committed.

## Out of scope

- Sweep / parameter tuning (premature).
- Multiple-recording cross-validation (premature).
- Cross-strategy ranking — the goal is "does it work", not "which is best".
- Productionizing into a `kea backtest compare` CLI subcommand — premature until we know what comparison shape matters.
