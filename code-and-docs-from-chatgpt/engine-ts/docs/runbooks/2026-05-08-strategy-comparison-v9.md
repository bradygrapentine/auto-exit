# Strategy Sweep v9 — Final Auto Rolling Re-classify Verdict

**Date:** 2026-05-08
**Predecessor:** v8 multi-regime synthesis (`2026-05-08-multiregime-v8.md`)
**Plan:** `docs/superpowers/plans/2026-05-08-auto-followups-cluster.md`
**Scripts:** `scripts/strategy-sweep-v9.mjs`

## Setup

The v8 verdict left rolling re-classify (`reclassifyInterval > 0`) with zero measured value but didn't formally close the question. Two reasons rolling might not have fired in v8:

1. **No real multi-regime recordings.** The 4 v8 recordings were synthesized by concatenating real recordings with rebased timestamps — artificial seams, not organic regime transitions. Addressed by Task 2 (SH-REAL-MULTIREGIME-RECORDING) which scanned all 89 recordings via rolling-window regime detection. Found exactly 1 real V-shape: `KXNASDAQ100U-26MAY08H1600-T28199.99-20260508` (3471 snapshots, dead→falling→sideways→rising→dead).
2. **Inner strategies fill before mid-execution switching can fire.** Addressed by Task 3 (SH-SLOW-EXECUTION-STRATEGY, PR #151) which changed auto's sideways→s-passive mapping to `chunkSize: 2` (label `s-passive-slow`). A 100-share fill now spans hundreds of GTC posts — plenty of room for rolling re-classify to fire.

With both blockers removed, v9 sweeps `reclassifyInterval ∈ {0, 100, 300, 500}` against the real V-shape + v8's 4 synthetics.

| Strategy | Params |
|---|---|
| trailing_stop (baseline) | trailCents=10 |
| auto | warmupTicks=200, thresholdMode=fixed, reclassifyInterval ∈ {0, 100, 300, 500}, hysteresisTicks=3 |

5 recordings × (1 + 4) = 25 cells.

## Per-recording results

| Recording | trailing_stop | auto rci=0 | auto rci=100 | auto rci=300 | auto rci=500 | rci>0 lift over rci=0 |
|---|---:|---:|---:|---:|---:|---:|
| KXNASDAQ100U (real V) | **7062** | 0 | 0 | 0 | 0 | — |
| rising→falling | 1410 | 1643 | 1643 | 1643 | 1643 | **0.0%** |
| falling→rising | 8726 | 8620 | 8620 | 8620 | 8620 | **0.0%** |
| rising→sideways→falling | 1410 | 1643 | 1643 | 1643 | 1643 | **0.0%** |
| sideways→rising→sideways | 3438 | 3438 | 3438 | 3438 | 3438 | **0.0%** |

## Cross-recording averages

| Strategy | avg pnl¢ | lift vs trailing |
|---|---:|---:|
| trailing_stop trailCents=10 | **4409** | — |
| auto reclassifyInterval=0 | 3069 | -30.4% |
| auto reclassifyInterval=100 | 3069 | -30.4% |
| auto reclassifyInterval=300 | 3069 | -30.4% |
| auto reclassifyInterval=500 | 3069 | -30.4% |

## Decision criterion (from plan)

> ≥5% lift of any rci > 0 over rci=0 on at least one cell → keep rolling re-classify; else deprecate.

**Result: 0.0% lift on every recording. Not a single cell crosses any positive bar.**

## Verdict: 🔴 DEPRECATE rolling re-classify

This closes the rolling re-classify question. Three independent investigations (v7 calibration, v8 multi-regime synthesis, v9 with real V-shape + slow-execution) all reach the same answer: rolling adds exactly zero pnl. The mechanism does not pay rent.

## Surprises

**1. Auto produces 0 fills on the real V-shape recording.** With `s-passive-slow` (chunkSize=2), auto classifies KXNASDAQ100U as sideways at warmup and posts a passive walk that never completes within the 3471-tick recording. Trailing_stop captures 7062¢; auto gives up that entire pnl. **The slow-execution change made auto strictly worse on real recordings.** This is the inverse of the intended outcome — slow execution was meant to give rolling room to fire, but in practice it just leaves the position un-exited.

**2. Auto still beats trailing_stop on synthetic rising-prefixed seams** (1643 vs 1410, +16.5% on rising→falling and rising→sideways→falling). Same finding as v8: auto's sideways classification with passive walk happens to capture the slow upward drift. Not a function of rolling — a function of single-shot classification choosing a different inner strategy.

**3. Cross-recording auto avg is now -30% vs trailing.** The v8 number was +0.6%. The slow-execution change tanked auto's average performance because the real recording's 0-fill outcome dominates. **Auto with `s-passive-slow` is worse than auto was before Task 3.**

## Action items

### Now (this PR)

- 🔴 **Mark `reclassifyInterval` as `@deprecated`** in `autoAdapter.ts` JSDoc with a pointer to this runbook.
- 🔴 **Remove `reclassifyInterval` from auto's recommended params** in any docs that suggest values.

### Filed follow-ups

- 🧊 **SH-AUTO-SIDEWAYS-REVERT** — revert the `chunkSize: 2` slow-walk on sideways and restore `chunkSize: 100`. Slow-execution made auto strictly worse on real recordings without producing any rolling lift in exchange. The Task 3 hypothesis was wrong; revert is cheap. ~15min.
- 🧊 **SH-AUTO-SINGLE-SHOT-SIMPLIFY** — once rolling code is removed, simplify autoAdapter to single-shot only. Drop `makeInnerForRegime` helper, drop tick counters, drop hysteresis. Smaller surface area. ~1h.

### Wider conclusion

`auto` itself is a single-shot regime classifier. It's a useful **building block** with the narrow opt-in already documented in the README (rising→reversal scenarios). It is not — and after v9 will not pretend to be — a continuously adapting strategy. Rolling re-classify was the only feature that promised continuous adaptation, and it never delivered.

## Conclusion

Three sweeps, three identical answers. Rolling re-classify is dead code. Ship the deprecation, file the simplification follow-up, and stop investigating.
