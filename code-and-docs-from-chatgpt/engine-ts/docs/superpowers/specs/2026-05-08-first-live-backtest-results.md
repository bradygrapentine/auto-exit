# First Live Backtest — Results

**Date:** 2026-05-08
**Spec:** `2026-05-08-first-live-backtest-design.md`

## Recording

- **File:** `~/.kea/recordings/KXINXU-26MAY08H1600-T7324.9999-20260508.ndjson`
- **Ticker:** `KXINXU-26MAY08H1600-T7324.9999` (S&P 500 hourly, 4pm settlement, 7324.99 strike)
- **Span:** 2026-05-08 00:00 → 03:37 UTC (~3.5h)
- **Snapshots:** 5566 rows; 5000+ with non-empty book
- **Mid movement:** 28 unique mid values across [56.0, 75.5]¢ — 19.5¢ range. Most movement of any synced recording.

Auto-pick rationale (Step 2): top-of-list by unique mid count among recordings with ≥200 book-bearing snapshots.

## Comparison

| Strategy | `pnl_cents` | `fill_rate` | `fill_count` | `avg_slippage_cents` | `time_to_full_exit_s` |
|---|---:|---:|---:|---:|---:|
| s-passive    |   0 | 0.0 | 0 |   0 | -1 |
| s-aggressive | 131 | 1.0 | 1 | -41 |  0 |
| s-twap       |   0 | 0.0 | 0 |   0 | -1 |

Initial position: 10 yes contracts, costBasis 50¢. Identical for all 3 strategies.

## Findings

**✅ Harness path works.** All 3 strategies resolved via `harness.ts:resolveAdapter`, ran without throwing, and produced valid `CounterfactualReport` JSON. PR #124's adapter wiring is structurally sound.

**⚠️ Passive + TWAP report 0 fills — known limitation.** Both adapters use `passiveTimeboxMs=0` (TWAP's `makeBacktestPassiveInvoke` delegates to the same passive runOneTick path). Inner walk loop cancels each GTC order before the replay client's next `advance()` can fill it. The pricing logic IS exercised tick-by-tick — adapters correctly traced through the full recording — but no fills accumulate. **Tracked by SH-BACKTEST-PHASE-D** (item 3: passive fill realism).

**⚠️ Aggressive's -41¢ slippage reveals a real book-shape signal.** Single-shot IoC swept yes book, filled 10 contracts at 14¢ each (vs `midCents=55` in the trace). Why: KXINXU's book at 00:00 is heavily skewed — top yes bid 12¢, top no bid 2¢. Mid `(12 + 98) / 2 = 55¢` is misleading; the *operator-reachable* yes bid is only 12¢. Aggressive selling into a thin yes side surfaced this immediately. **Strategic implication:** aggressive sweeps on heavily-skewed Kalshi books destroy value; passive/TWAP would have been better had they actually filled.

**⚠️ Trace `midCents` formula doesn't reflect operator economics.** `(top_yes_bid + (100 − top_no_bid)) / 2` is a theoretical-fair-value mid, not a "what could I sell for right now" reference. Slippage measured against this mid is misleading on skewed books. Not a bug in this PR — pre-existing in `src/backtest/harness.ts:computeMid` — but worth a follow-up: a `bestYesBidCents` field next to `midCents` in trace rows would let consumers see the real exit price available.

**ℹ️ PnL accounting note.** `pnl_cents=131` for s-aggressive = `10 × 14 − 9 fees = 131`. Cost basis ($5/contract from `initial-position`) is NOT subtracted — `computePnl` returns gross sell proceeds. For a true P&L vs cost basis, the operator would compare proceeds (`+$1.31`) vs cost (`$5.00`) for a `−$3.69` realized loss. This is a documented harness simplification (no-cost-basis assumption); not a bug.

## Bugs filed

1. **`kea record sync` CLI silently exits without transferring** — connects to Fly via `fly ssh console`, prints "Connecting to fdaa:...", then exits silently. Manual `fly ssh console -C "tar czf - -C /data recordings" | tar xzvf -` works fine and pulled all 89 files (105MB). Likely a stdin/stdout pipe handling bug in `src/backtest/sync.ts`. Filed as **SH-SCANNER-SYNC-FIX-2** in BACKLOG (follow-up to PR #111 which was supposed to fix this).

## Bottom line

✅ **Harness validates end-to-end.** Spec success criteria met:
- All 3 strategies ran without throwing.
- Each report has plausible values (or a documented zero).
- Comparison table committed.

🟡 **One silent-exit bug** in the sync CLI (workaround: manual tar pipe).
🟡 **Two known limitations** (passive fill realism, mid formula on skewed books) — both tracked.

Ready for the next phase: SH-BACKTEST-PHASE-D (Watcher-based adapters + passive fill realism).
