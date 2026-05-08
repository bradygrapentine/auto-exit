# Auto-strategy calibration sweep v6+v7

**Date:** 2026-05-08
**Predecessor:** v5 runbook (γ verdict — auto misclassifies on 10-tick warmup)
**Plan:** `docs/superpowers/plans/2026-05-08-auto-calibration-cluster.md`
**Script:** `scripts/strategy-sweep-v6.mjs`

## Setup

Calibration sweep over `warmupTicks ∈ {10, 50, 100, 200, 500}` × `thresholdMode ∈ {fixed, proportional}` = 10 calibration cells × 6 recordings = 60 auto cells. Plus s-aggressive + trailing_stop(trailCents=10) + stop_loss(stop=50) for context = 78 total cells.

`detectRegime` now accepts an optional `thresholds` arg (PR ships in this cluster). `proportionalThresholds(n)` returns `deadRange = max(1, n×0.1)`, `directionalDelta = max(2, n×0.2)`.

`autoAdapter` accepts a new `thresholdMode: 'fixed' | 'proportional'` param.

## Classification accuracy matrix

| warmup | fixed | proportional |
|---:|---:|---:|
| 10 | 0/6 | 0/6 |
| 50 | 0/6 | 0/6 |
| 100 | 0/6 | 0/6 |
| 200 | 0/6 | 0/6 |
| 500 | **2/6** | 0/6 |

**Proportional thresholds make accuracy WORSE, not better.** The helper's scaling (`n × 0.2` for directional delta) requires far more movement than these recordings have at any window length. At warmup=500 proportional, directional delta = 100¢ — but the largest full-recording move is only 44¢. So proportional always classifies as `dead`.

Fixed mode at warmup=500 hits 2/6 (KXBTCD correctly rising; KXSPACEXCOUNT correctly sideways) but the other 4 still misclassify.

## Per-recording predictions at warmup=500

| Recording | Catalog | fixed | proportional |
|---|---|---|---|
| KXINXU (rising +9) | rising | sideways ✗ | dead ✗ |
| KXBTCD (rising +17) | rising | rising ✓ | dead ✗ |
| KXHIGHNY (rising +16) | rising | sideways ✗ | dead ✗ |
| KXSPOTIFYD (falling -43) | falling | dead ✗ | dead ✗ |
| KXHIGHCHI (falling -39) | falling | sideways ✗ | dead ✗ |
| KXSPACEXCOUNT (sideways) | sideways | sideways ✓ | dead ✗ |

## Pnl matrix (cross-recording avg, slippage > -50)

| warmup | fixed | proportional |
|---:|---:|---:|
| 10 | 5250 | 5250 |
| 50 | 5133 | 5133 |
| 100 | 5334 | 5334 |
| 200 | 5415 | 5360 |
| 500 | 5232 | **5482** |

**Best cell: warmup=500 proportional at 5482¢.** But classification accuracy is 0/6 — pnl is winning via fallback strategies, not regime-aware selection.

For comparison:
- trailing_stop trailCents=10 (best static): **5533**
- stop_loss stopPriceCents=50: **5389**
- s-aggressive (defaults): **5318**
- Per-shape oracle (full-knowledge): **5587**

**Auto never beats trailing_stop.** Best gap to oracle: 5482 vs 5587 = 105¢ (≈ 2%) under it; gap to best static: 5482 vs 5533 = 51¢ (≈ 1%) under it.

## Why classification ceiling is so low

The catalog labels are computed from **full-recording** mid deltas (e.g. KXBTCD's full +17 over 2878 snapshots). The detector sees only the first N snapshots — by definition the early window of a directional recording is more stable than the recording as a whole.

In other words, **catalog-label accuracy requires future knowledge.** Even an oracle detector can't predict full-recording direction from the past 500 ticks if the move happens later.

The metric that actually matters is pnl, not classification accuracy. And on pnl, auto's best (5482) is within 1% of trailing_stop's 5533 — close, but no decisive lift.

## v6 verdict → trigger Task 3 (SH-AUTO-ROLLING-RECLASSIFY)

Per the decision matrix in the cluster plan:

> Both <50% at all settings → **trigger Task 3 (rolling re-classify)**.

Single-shot classification can't catch directional moves that happen *after* the warmup window. Rolling re-classification can: re-evaluate every N ticks, switch strategies when regime changes mid-recording.

## v7 — rolling re-classification result

`autoAdapter` extended with `reclassifyInterval` and `hysteresisTicks` params. v7 sweep holds the v6 best-cell calibration (warmup=200 fixed) and varies `reclassifyInterval ∈ {0, 50, 100, 200}` × `hysteresisTicks ∈ {3, 5}` = 8 rolling configs × 6 recordings = 48 cells.

**Result: rolling re-classify produces identical pnl to single-shot** (5415 across all 8 configs). Reason: when auto picks a fast-completing strategy (aggressive, stop_loss, or s-trail that fills in 1 tick), there's nothing left to re-classify against. Rolling only helps when the chosen strategy is patient (e.g. s-passive walking a GTC over many ticks) AND the regime changes mid-execution. Neither condition holds on this recording set:
- 4 of 6 recordings end up with auto picking a fast-fill strategy (warmup=200 fixed mostly classifies as sideways → s-passive, but s-passive's chunkSize=100 fills in 1 tick on these books).
- The 2 longer-execution cells don't see regime changes.

## Final cluster verdict

| Comparator | avg pnl¢ |
|---|---:|
| Per-shape oracle | 5587 |
| trailing_stop trailCents=10 (best static) | 5533 |
| **Auto (warmup=200 fixed, any rolling config)** | **5415** |
| stop_loss stopPriceCents=50 | 5389 |
| s-aggressive (defaults) | 5318 |

Auto **never beats trailing_stop** under any calibration in this cluster. Best gap: 5415 vs 5533 = 118¢ (≈2%).

**Don't ship `auto` to live mode** based on this evidence alone — trailing_stop trailCents=10 is a simpler, better-performing baseline. The regime-aware machinery is sound; it just doesn't earn its keep on this recording set.

## Path forward

The cluster ships these primitives:
- `detectRegime` with optional `thresholds` arg (PR ships).
- `proportionalThresholds(n)` helper (ships, with caveat that current formula is too aggressive for short windows — file 🧊 SH-PROPORTIONAL-THRESHOLD-RECAL).
- `autoAdapter` with `warmupTicks` / `thresholdMode` / `reclassifyInterval` / `hysteresisTicks` knobs (ships).

These are useful as building blocks for *future* regime-aware approaches (external signal, ensemble strategies, longer recordings with multi-regime spans). For now, the engine's best behavior is **stick with trailing_stop trailCents=10 as the default exit strategy** — keep `auto` available for experimentation but don't make it the default.

The decisive missing ingredient isn't in the calibration knobs — it's that our recordings are short and mostly mono-regime. v8 should focus on multi-regime recordings (price-action sequences with rising-then-falling phases) where rolling re-classify could actually shine.

## Surprises

**1. Proportional thresholds are strictly worse than fixed.** The `n × 0.2` directional formula was calibrated against the intuition "10% drift expected over the window length", but real recordings show much smaller fractional drift. Calibration-of-the-calibration is its own follow-up — file 🧊 SH-PROPORTIONAL-THRESHOLD-RECAL if we ever revive proportional mode. For now, default behavior (fixed) is the only useful mode.

**2. Pnl is non-monotonic in warmup.** warmup=100 (5334) > warmup=200 (5415) > warmup=500 (5232 fixed) — but warmup=500 proportional (5482) is the highest. The shape of the curve depends heavily on which recordings happen to misclassify in helpful vs harmful ways. Means single-knob tuning isn't a clean optimization.

**3. KXBTCD at warmup=500 fixed: correctly classified rising → s-trail trailCents=10 → 0 fills.** The trailing-stop never fires because the recording trends consistently up without a 10¢ pullback. **Correct classification doesn't guarantee good execution** — the per-regime mapping has to match the strategy's internal triggers to the recording's characteristics. Could be addressed by tuning the per-regime mapping (e.g., rising-with-no-pullback → s-passive instead of s-trail).

## Next

Tasks 1+2 cluster shipping:
- ✅ SH-DETECT-REGIME-ADAPTIVE-THRESHOLD: shipped (detectRegime now takes optional thresholds, proportionalThresholds helper).
- ✅ SH-AUTO-WARMUP-WINDOW: shipped (autoAdapter accepts thresholdMode + warmupTicks; v6 sweep documents the curve).
- 🟡 **SH-AUTO-ROLLING-RECLASSIFY: triggered.** Needs implementation. ~2-3h to add reclassifyInterval + hysteresis to autoAdapter, then a v7 sweep to measure incremental lift.

After v7: if rolling re-classify gets auto above trailing_stop (5533) and accuracy above 50% on rolling labels (matching the regime *as of each evaluation*, not the full-recording catalog), green-light auto for live-mode wiring.

## Filed follow-ups

- 🧊 **SH-PROPORTIONAL-THRESHOLD-RECAL** — proportional helper's `n × 0.2` formula is too aggressive for real recordings. Recalibrate based on observed delta distributions across the catalog. ~30min experiment + helper update.
- 🧊 **SH-PER-REGIME-MAPPING-REVISIT** — KXBTCD case shows correct classification can still produce 0 fills if the strategy doesn't match. Maybe rising → s-passive (instead of s-trail) when the rise is monotonic, or add a "rising-without-pullback" sub-class. Defer until v7 data shows whether rolling fixes most of these cases.
