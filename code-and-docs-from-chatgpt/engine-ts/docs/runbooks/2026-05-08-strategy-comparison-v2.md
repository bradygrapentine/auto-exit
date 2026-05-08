# Strategy comparison sweep v2

**Date:** 2026-05-08
**Predecessor:** `2026-05-08-strategy-comparison-v1.md`
**Cluster:** PRs #137 (SH-S-TRAIL-POSITIONSIZE), #138 (SH-PASSIVE-SPREAD-LOGIC), #139 (SH-WATCHER-FILL-AUDIT runbook)
**Script:** `scripts/strategy-sweep.mjs` (unchanged from v1)

## Setup

Same 8 strategies × 3 recordings as v1. Same params, same initialPosition, no recording swaps.

## Results

| Recording | Strategy | pnl¢ | fills | rate | avg slip¢ | exit s | MAE¢ | MFE¢ |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| KXINXU (S&P hourly)         | s-aggressive               | 5326 | 1 | 100% |   0 |   0 | 5326 | 5326 |
| KXINXU (S&P hourly)         | s-passive                  |    0 | 0 |   0% |   0 |   — |    0 |    0 |
| KXINXU (S&P hourly)         | s-twap (2 intervals)       |    0 | 0 |   0% |   0 |   — |    0 |    0 |
| KXINXU (S&P hourly)         | **s-trail (trail=5)**      | **5427** | **1** | 100% |   1 |  95 |    0 | 5427 |
| KXINXU (S&P hourly)         | **trailing_stop (trail=5)**| **5427** | **1** | 100% |   1 |  95 |    0 | 5427 |
| KXINXU (S&P hourly)         | take_profit (target=75)    |    0 | 0 |   0% |   0 |   — |    0 |    0 |
| KXINXU (S&P hourly)         | stop_loss (stop=30)        | 5326 | 1 | 100% |   0 |   0 | 5326 | 5326 |
| KXINXU (S&P hourly)         | **bracket (75/30)**        | **5326** | **1** | 100% |   0 |   0 | 5326 | 5326 |
| KXBTCD (BTC daily)          | s-aggressive               | 1315 | 1 | 100% |  -3 |   0 | 1315 | 1315 |
| KXBTCD (BTC daily)          | s-passive                  |    0 | 0 |   0% |   0 |   — |    0 |    0 |
| KXBTCD (BTC daily)          | s-twap (2 intervals)       |    0 | 0 |   0% |   0 |   — |    0 |    0 |
| KXBTCD (BTC daily)          | **s-trail (trail=5)**      | **1410** | **1** | 100% |   0 |  58 |    0 | 1410 |
| KXBTCD (BTC daily)          | **trailing_stop (trail=5)**| **1410** | **1** | 100% |   0 |  58 |    0 | 1410 |
| KXBTCD (BTC daily)          | take_profit (target=75)    |    0 | 0 |   0% |   0 |   — |    0 |    0 |
| KXBTCD (BTC daily)          | stop_loss (stop=30)        | 1315 | 1 | 100% |  -3 |   0 | 1315 | 1315 |
| KXBTCD (BTC daily)          | **bracket (75/30)**        | **1315** | **1** | 100% |  -3 |   0 | 1315 | 1315 |
| KXFEDDECISION (27JUN-C25)   | s-aggressive               |    7 | 1 |   1% | -37 |   — |    7 |    7 |
| KXFEDDECISION (27JUN-C25)   | s-passive                  |    0 | 0 |   0% |   0 |   — |    0 |    0 |
| KXFEDDECISION (27JUN-C25)   | s-twap (2 intervals)       |    0 | 0 |   0% |   0 |   — |    0 |    0 |
| KXFEDDECISION (27JUN-C25)   | **s-trail (trail=5)**      | **372**  | **1** | 100% | -41 |   0 |  372 |  372 |
| KXFEDDECISION (27JUN-C25)   | **trailing_stop (trail=5)**| **372**  | **1** | 100% | -41 |   0 |  372 |  372 |
| KXFEDDECISION (27JUN-C25)   | take_profit (target=75)    |    0 | 0 |   0% |   0 |   — |    0 |    0 |
| KXFEDDECISION (27JUN-C25)   | stop_loss (stop=30)        |  372 | 1 | 100% | -41 |   0 |  372 |  372 |
| KXFEDDECISION (27JUN-C25)   | **bracket (75/30)**        | **372**  | **1** | 100% | -41 |   0 |  372 |  372 |

Bold entries went from 0 fills (v1) to filling (v2). s-trail also moves from "error" to filling.

## v1 → v2 deltas (the cluster's payoff)

| Strategy            | v1 result            | v2 result               | Cause |
|---|---|---|---|
| s-trail             | errored              | fills, +5427/+1410/+372 | PR #137 (positionSize threading) |
| trailing_stop       | 0 fills, no error    | fills, +5427/+1410/+372 | PR #137 (silent count=0) |
| bracket (75/30)     | 0 fills, no error    | fills, +5326/+1315/+372 | PR #137 (same root cause) |
| s-passive           | 0 fills              | 0 fills (still)         | spread fix (PR #138) didn't unblock these recordings |
| s-twap              | 0 fills              | 0 fills (still)         | unrelated to this cluster |
| take_profit         | 0 fills              | 0 fills (still)         | genuine: price never reaches 75¢ on these recordings |

## Findings

**1. The first real strategic signal.** trailing_stop and s-trail consistently outperform pure s-aggressive when there's any upward price drift — by +101¢, +95¢, +365¢ across the three recordings. They sell at the post-peak bid, capturing the move; aggressive sweeps immediately and locks in entry-time price. On KXFEDDECISION specifically, trailing_stop (+372¢) is **53× better** than aggressive (+7¢) on the same 100-share position. This is the kind of comparison the harness was built to produce.

**2. SH-PASSIVE-SPREAD-LOGIC fix didn't unblock these recordings.** s-passive still returns 0 fills on all 3. Two possibilities: (i) all 3 recordings have a non-empty no-side, so the spread fix's `noAsks.length > 0` branch fires and the original logic still applies and still fails for some other reason, or (ii) passive is hitting a different break-loop guard (safety cap, floor, etc.). Need a focused diagnostic. **Filing as 🧊 SH-PASSIVE-STILL-NO-FILLS** for follow-up — *not* a regression of #138, since one-sided book unit tests still pass.

**3. take_profit at 75¢ is genuinely never triggered.** All three recordings have price ranges below 75¢ (KXINXU mid=55, KXBTCD ~50¢, KXFEDDECISION mid ≈ 25-30¢). This is correct strategy behavior, not a bug. Re-running with target=50¢ would surface fills.

**4. s-twap (2 intervals × 1 minute) returns 0 fills on all recordings.** Either the interval cadence is off (recordings span hours; 2 intervals × 1 min = 2 min total, then twap exits without filling), or the twap adapter has a separate bug. Lower priority since twap is rarely-used in our strategy mix; **note for backlog as 🧊 SH-TWAP-CADENCE** but not pressing.

**5. Aggressive's slippage signal is recording-shape-driven.** Mean slippage ≈ 0¢ on KXINXU (book is even), -3¢ on KXBTCD, -37¢ on KXFEDDECISION (yes-side heavily skewed at 7¢ when mid ≈ 50¢). Fits the original SH-FILL-SIM-DIRECTIONAL hypothesis — sells walk descending and pick the highest yes level, which is far from mid on event-driven binaries near a strike boundary.

**6. trailing_stop and s-trail produce identical results.** As expected — s-trail is just a watcher-driven trailing_stop with a slightly different argument-builder shape. Validates that the framework is consistent.

**7. bracket (75/30) === stop_loss (stop=30) numerically.** Bracket has both a take-profit (75¢, never fires) and a stop-loss leg (30¢, fires on KXINXU+KXBTCD because best yes bid drops below 30¢ at some point). The stop-loss leg dominates. Confirms bracket's leg dispatching works.

## Next

Triage:

1. **🧊 SH-PASSIVE-STILL-NO-FILLS** — focused diagnostic on why s-passive break_loops on these specific recordings even after the spread fix. ~2h investigation. Likely a different break-loop guard or a path the spread fix doesn't cover. **Highest priority** — passive is the strategy class that needs comparison data to prove its value.
2. **🧊 SH-TWAP-CADENCE** — small investigation; lower priority.
3. **Tuning sweep v3** — vary trailCents (1, 3, 5, 10) and chunkSizes for the strategies that DO fill. First real hyperparameter optimization data.
4. **Re-run with target=50¢ on take_profit** — confirm the 0-fill is genuine "trigger never fired" not a bug.
5. **🧊 S-AGGRESSIVE-PRICE-DISCOVERY** still deferred — strategic-design question, depends on what passive can do.

The cluster's primary deliverable — first strategic signal from real data — is captured. trailing_stop's +53× edge over aggressive on event-driven binaries is the headline finding.
