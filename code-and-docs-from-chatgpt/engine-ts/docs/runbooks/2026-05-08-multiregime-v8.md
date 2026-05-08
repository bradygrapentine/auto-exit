# Multi-regime auto validation — sweep v8

**Date:** 2026-05-08
**Predecessor:** v6+v7 calibration cluster
**Plan:** `docs/superpowers/plans/2026-05-08-trailing-default-and-multiregime.md`
**Scripts:** `scripts/synthesize-multiregime.mjs`, `scripts/strategy-sweep-v8.mjs`

## Setup

Synthesized 4 multi-regime recordings by concatenating real recordings end-to-end with timestamps rebased monotonically and tickers overridden:

| Recording | Source segments | Total snapshots |
|---|---|---:|
| rising→falling | KXBTCD (rising +17) + KXSPOTIFYD (falling -43) | 4651 |
| falling→rising | KXSPOTIFYD + KXBTCD | 4651 |
| rising→sideways→falling | KXBTCD + KXSPACEXCOUNT + KXSPOTIFYD | 8127 |
| sideways→rising→sideways | KXSPACEXCOUNT + KXBTCD + KXSPACEXCOUNT | 9830 |

**Caveat — read this first:** the seam between segments is artificial. Real multi-regime markets have continuity; here the price jumps when one segment ends and the next begins. Findings below are *directional signal*, not production guarantees. The synthetics test whether `auto`'s machinery responds *at all* to multi-regime input, not whether real multi-regime markets behave this way.

16 cells total: trailing_stop trailCents=10 (baseline) × 4 + auto warmup=200 fixed × reclassifyInterval ∈ {0, 100, 300} × 4.

## Per-recording results

| Recording | trailing_stop pnl¢ | auto rci=0 | auto rci=100 | auto rci=300 | best auto lift |
|---|---:|---:|---:|---:|---:|
| rising→falling | 1410 | 1505 | 1505 | 1505 | **+6.7%** |
| falling→rising | 8726 | 8620 | 8620 | 8620 | -1.2% |
| rising→sideways→falling | 1410 | 1505 | 1505 | 1505 | **+6.7%** |
| sideways→rising→sideways | 3438 | 3438 | 3438 | 3438 | 0.0% |

## Cross-recording averages

| Strategy | avg pnl¢ | lift vs trailing |
|---|---:|---:|
| trailing_stop trailCents=10 | 3746 | — |
| auto reclassifyInterval=0 | 3767 | +0.6% |
| auto reclassifyInterval=100 | 3767 | +0.6% |
| auto reclassifyInterval=300 | 3767 | +0.6% |

## Decision criterion (from plan)

> ≥5% lift on at least one synthesized recording → keep auto opt-in; else retire.

**Result: 2 of 4 recordings clear the 5% bar.** Per criterion: **keep `auto` opt-in.**

## Two important caveats

**1. Rolling re-classify is still a no-op.** rci=0, rci=100, and rci=300 produce *identical* pnl on every recording — same as v7's verdict. The lift on rising→falling and rising→sideways→falling comes from auto's first-tick classification picking a different strategy than trailing_stop (auto classifies as sideways given the slow-rising start, picks s-passive; s-passive captures slightly more pnl than trailing_stop on these books). Rolling adds zero incremental value because the chosen inner strategy fills early and there's nothing left to switch.

**2. The 6.7% lift is small in absolute terms.** rising→falling: 95¢ delta on a 100-contract position (1505 - 1410 = 95). Within noise margin for many practical purposes.

## Final verdict on `auto`

`auto` **keeps opt-in status** in the engine, but with documented caveats:

- ✅ **Useful for**: scenarios where the agent has reason to believe the regime at start-of-execution differs from what a static strategy assumes (e.g. expecting an initial rise before fall — auto's sideways-classification → s-passive captures the patient walk).
- ❌ **Not useful for**: anywhere rolling re-classify would matter. Until the engine has slow-execution strategies that span 1000+ ticks AND recordings show real mid-recording regime changes (not artificial seams), rolling adds nothing.
- 🟡 **Default recommendation stays trailing_stop trailCents=10** — auto's average lift is +0.6%, well within noise.

## Filed follow-ups

- 🧊 **SH-AUTO-USE-CASES** — README update describing the specific narrow scenarios where opting into `auto` makes sense (currently undocumented). ~30min.
- 🧊 **SH-SLOW-EXECUTION-STRATEGY** — to make rolling re-classify earn its keep, build a strategy that genuinely takes hundreds of ticks to complete (e.g. patient TWAP with small chunks over many minutes). v9 work.
- 🧊 **SH-REAL-MULTIREGIME-RECORDING** — find or capture a recording where mid genuinely transitions through regimes mid-recording (e.g. an event-driven market through its decision moment). Replace synthetic seams with continuity.

## Conclusion

The regime-aware investigation closes:

1. **Default exit recommendation: `trailing_stop trailCents=10`** (Task 1; documented in README).
2. **`auto` keeps opt-in status** — minimum bar cleared on 2 of 4 synthetic recordings, but lift is small and rolling re-classify still adds zero. Useful as a building block for future scenarios (long execution, real multi-regime data); not the default.
3. **Don't pursue further regime-aware tuning on the current recording set.** Calibration knobs are exhausted; the limitation is in the data, not the code.
