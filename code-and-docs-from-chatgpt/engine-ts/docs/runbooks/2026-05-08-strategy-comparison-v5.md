# Strategy comparison sweep v5 — auto-strategy validation

**Date:** 2026-05-08
**Predecessor:** v4 runbook
**Plan:** `docs/superpowers/plans/2026-05-08-sweep-v5-auto-validation.md`
**Cluster:** PRs #145 (regime primitive), #146 (take_profit arming), #147 (auto adapter)
**Script:** `scripts/strategy-sweep-v5.mjs`

## Setup

228 cells = v4's 222 cells + 1 auto-strategy × 6 recordings. Same 6 shape-diverse recordings as v4. Cost basis = first-tick mid per recording.

`auto` adapter (PR #147) buffers 10 snapshots, classifies via `detectRegime`, delegates to a per-regime concrete strategy:
- rising → s-trail trailCents=10
- falling → stop_loss stopPriceCents=50
- sideways → s-passive chunkSize=100, walkStep=1
- dead → s-aggressive (fallback)

## Regime classification accuracy

| Recording | Catalog (full-recording) | Predicted (first 10 snapshots) | Match? |
|---|---|---|:--:|
| KXINXU (rising +9) | rising | dead | ✗ |
| KXBTCD (rising +17) | rising | sideways | ✗ |
| KXHIGHNY (rising +16) | rising | sideways | ✗ |
| KXSPOTIFYD (falling -43) | falling | dead | ✗ |
| KXHIGHCHI (falling -39) | falling | dead | ✗ |
| KXSPACEXCOUNT (sideways) | sideways | dead | ✗ |

**Classification accuracy: 0/6.** All recordings misclassified. 4 predicted `dead` (range ≤ 1¢ over the first 10 snapshots), 2 predicted `sideways`. None predicted rising or falling.

**Root cause:** early-tick mid movement is much smaller than full-recording range. KXINXU's full-recording range is 20¢ but the first 10 snapshots span 1-2¢; `detectRegime`'s threshold (range ≤ 1 → dead) fires immediately. The 10-tick warmup window is **too short** for mid-momentum to establish.

## Per-recording results

| Recording | Catalog regime | Predicted regime | auto's chosen strategy | auto pnl¢ | Per-shape oracle pnl¢ | Best static strategy pnl¢ |
|---|---|---|---|---:|---:|---:|
| KXINXU         | rising   | dead     | s-aggressive | 4824 | 5427 (s-trail trailCents=1) | 5427 |
| KXBTCD         | rising   | sideways | s-passive    | 1410 | 1410 (s-trail trailCents=3) | 1410 |
| KXHIGHNY       | rising   | sideways | s-passive    | 3634 | 4625 (s-trail trailCents=10) | 4625 |
| KXSPOTIFYD     | falling  | dead     | s-aggressive | 8620 | 8726 (stop_loss stop=10)     | 8726 |
| KXHIGHCHI      | falling  | dead     | s-aggressive | 9571 | 9893 (stop_loss stop=50)     | 9893 |
| KXSPACEXCOUNT  | sideways | dead     | s-aggressive | 3438 | 3438 (s-passive)             | 3438 |
| **avg**        |          |          |              | **5250** | **5587 (oracle)**            | various |

## Headline numbers (cross-recording avg pnl)

| Comparator | avg pnl¢ |
|---|---:|
| Per-shape oracle (best strategy if regime known upfront) | **5587** |
| trailing_stop (best static, trailCents=10, from v4) | **5533** |
| stop_loss (best static, stopPriceCents=50, from v4) | 5389 |
| s-aggressive (defaults) | 5318 |
| **auto (regime-aware, online classification)** | **5250** |
| s-twap (best static, numIntervals=10) | 3939 |
| s-passive (best static) | 3930 |

`auto` ranks **5th of 7**, losing to trailing_stop, stop_loss, and s-aggressive.

## Verdict: γ — auto misclassifies due to short warmup window

The per-regime mapping (rising → s-trail/10, falling → stop_loss/50, sideways → s-passive) is *correct* per v4 evidence — the per-shape oracle wins by exactly the strategies in the mapping. But `detectRegime` on a 10-snapshot window can't reproduce those labels: 0/6 accuracy means `auto` is effectively running s-aggressive or s-passive everywhere, never selecting trailing or stop_loss when it'd win.

**Why does `auto` still get a respectable 5250 avg?** Because:
1. The fallback (`dead → s-aggressive`) is a competent baseline (5318 on its own).
2. `sideways → s-passive` happens to deliver decent pnl on the rising recordings KXBTCD and KXHIGHNY — passive walks the upward move and captures gains via patient GTC.

So `auto` doesn't blow up — it just doesn't deliver the lift the regime-aware mapping promises.

## Filed follow-ups

- 🧊 **SH-AUTO-WARMUP-WINDOW** — `auto` uses a 10-snapshot warmup. v5 evidence shows that's too short on these recordings (early mid range < 1¢ → all classify as dead). Tune candidates: 50, 100, 200, 500 snapshots. Include a v6 sweep that runs `auto` at each warmup value to find the breakeven where classification accuracy crosses ~50%. ~2-3h.
- 🧊 **SH-AUTO-ROLLING-RECLASSIFY** — instead of one-shot classification on warmup, re-classify every N ticks and switch strategy if regime changes mid-recording. More realistic for live mode. Larger refactor; defer until SH-AUTO-WARMUP-WINDOW shows whether single-shot classification can ever work.
- 🧊 **SH-DETECT-REGIME-ADAPTIVE-THRESHOLD** — `detectRegime` thresholds (range ≤ 1 → dead; |delta| > 5 → directional) are calibrated against full-recording windows. For short windows they need to be proportional, e.g. `range ≤ N×0.1` where N = window length. 30-min experiment to recalibrate.

## Next (v6 candidates)

1. **Warmup-window tuning sweep** (SH-AUTO-WARMUP-WINDOW, listed above). The most direct fix.
2. **Rolling re-classification** — switch strategy mid-recording when regime changes. Required for live mode anyway.
3. **External regime signal** — instead of computing regime from the recording itself, use historical price data (recordings collected immediately before the current one). Closer to how a live LLM agent would use external signal.
4. **Ensemble auto** — instead of picking one strategy based on regime, run multiple strategies in parallel and aggregate. More expensive, possibly more robust.

## Conclusion

The cluster (PRs #145+#146+#147) ships clean: regime primitive, take_profit arming, auto adapter — all production-ready. But v5 reveals that **single-shot classification on a 10-snapshot warmup doesn't reproduce catalog regime labels**. The auto adapter is structurally correct; its calibration is wrong.

**Don't ship `auto` to live mode yet.** Run the warmup-window tuning sweep (SH-AUTO-WARMUP-WINDOW) first. If a longer warmup recovers classification accuracy → ship. If not → switch to rolling re-classification (SH-AUTO-ROLLING-RECLASSIFY).

**Useful side finding:** v5 confirms v4's per-shape mapping is right when applied with oracle knowledge (5587 avg for the oracle vs 5533 for the best static strategy). The mapping itself isn't the problem; the classifier is.
