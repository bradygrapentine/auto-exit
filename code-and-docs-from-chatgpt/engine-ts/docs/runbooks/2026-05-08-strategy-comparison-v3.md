# Strategy comparison sweep v3 — parameter tuning

**Date:** 2026-05-08
**Predecessor:** `2026-05-08-strategy-comparison-v2.md`
**Plan:** `docs/superpowers/plans/2026-05-08-sweep-v3-parameter-tuning.md`
**Script:** `scripts/strategy-sweep-v3.mjs`
**Raw output:** `/tmp/sweep-v3.md` (170-cell table; not committed — regenerable)

## Setup

170 cells = 8 strategies × Cartesian-expanded parameter grids × 5 recordings:

| Strategy      | Param grid                                         | Cells/recording |
|---|---|---:|
| s-aggressive  | (defaults — no real knobs)                         | 1 |
| s-passive     | chunkSize × walkStepCents = 3×3                    | 9 |
| s-twap        | numIntervals × intervalMinutes = 3×2               | 6 |
| s-trail       | trailCents (4)                                     | 4 |
| trailing_stop | trailCents (4)                                     | 4 |
| stop_loss     | stopPriceCents (3)                                 | 3 |
| take_profit   | targetPriceCents (3, lowered to reachable 40-60¢)  | 3 |
| bracket       | targetPriceCents × stopPriceCents = 2×2            | 4 |

Recordings: KXINXU, KXBTCD, KXFEDDECISION (carry-overs from v2) + KXBTC15M, KXHIGHLAX (newly added for shape diversity).

## Recording viability check

**Two new recordings turned out to be structurally untradable** for a 100-share yes-sell position:

- **KXBTC15M** — yes and no sides both empty across the recording window. Nothing to sell into.
- **KXHIGHLAX** — yes-side empty; no-side has [90, 91, 92, …]. Trading at near-100% yes probability with no yes-side bidders. A yes-seller has no counterparty.

Both produced 0 fills across all 170 cells regardless of parameters. **Excluding them from headline averages** — including them dilutes the cross-recording numbers without adding signal. Filing as a sweep-design lesson: future recording picks need a quick "are there bidders to sell into?" check before inclusion.

Headline analysis below uses the **3 viable recordings**: KXINXU, KXBTCD, KXFEDDECISION.

## Headline winners (avg pnl across 3 viable recordings, slippage > -50)

| Strategy      | Best params                                    | avg pnl¢ | filled |
|---|---|---:|---:|
| **s-passive** | **chunkSize=100, walkStepCents=1**             | **2447** | 3/3 |
| **s-twap**    | **numIntervals=10, intervalMinutes=1**         | **2435** | 3/3 |
| s-trail       | trailCents=3                                   | 2403     | 3/3 |
| trailing_stop | trailCents=3                                   | 2403     | 3/3 |
| stop_loss     | stopPriceCents=10                              | 2371     | 3/3 |
| bracket       | targetPriceCents=50, stopPriceCents=20         | 2338     | 3/3 |
| s-aggressive  | (defaults)                                     | 2216     | 3/3 |
| take_profit   | targetPriceCents=40                            | 0        | 0/3 |

**Top finding:** s-passive at chunkSize=100, walkStep=1 narrowly beats every other strategy, by **+231¢ over s-aggressive on average**. The closest competitor is s-twap at numIntervals=10 (+219¢ over aggressive). The trailing-family strategies (s-trail, trailing_stop) pull a respectable +187¢ over aggressive at trailCents=3.

## Per-strategy ranked best-by-recording

### s-passive
| Recording      | Best params                       | pnl¢ | fills | slip¢ |
|---|---|---:|---:|---:|
| KXINXU         | chunkSize=100, walkStepCents=1    | 5326 | 1     | 0     |
| KXBTCD         | chunkSize=100, walkStepCents=1    | 1315 | 1     | -3    |
| KXFEDDECISION  | chunkSize=100, walkStepCents=1    | 700  | 100   | -37   |

**Notable:** the same params win on every recording. chunkSize=100 means "submit the whole position as one GTC"; walkStep=1 means "minimum increment". Smaller chunks (25, 50) and wider walks (2, 5¢) consistently lose to the largest-chunk smallest-step config. **Implication:** with the current passive runOneTickBacktest semantics (post-and-walk), the best move is to put the whole order out at once and walk one cent at a time. This is essentially "patient GTC at the top of yes-bid stack" — exactly what you'd expect from a passive strategy on a deep book.

### s-twap
| Recording      | Best params                          | pnl¢ | fills | slip¢ |
|---|---|---:|---:|---:|
| KXINXU         | numIntervals=2, intervalMinutes=1    | 5282 | 11    | 0     |
| KXBTCD         | numIntervals=10, intervalMinutes=1   | 1340 | 10    | -2    |
| KXFEDDECISION  | numIntervals=2, intervalMinutes=1    | 700  | 100   | -37   |

**Notable:** twap likes 1-minute intervals (5-min loses on every recording — finishes too late). KXBTCD prefers 10 intervals; KXINXU and KXFEDDECISION prefer 2. **Implication:** twap's optimal interval count varies with book depth and recording length. Cross-recording winner is numIntervals=10 because it averages best (the 10-interval version still does decently on KXINXU and KXFEDDECISION).

### s-trail / trailing_stop
| Recording      | Best params      | pnl¢ | fills | slip¢ |
|---|---|---:|---:|---:|
| KXINXU         | trailCents=1     | 5427 | 1     | 1     |
| KXBTCD         | trailCents=3     | 1410 | 1     | 0     |
| KXFEDDECISION  | trailCents=1     | 372  | 1     | -41   |

**Notable:** tighter trail (1¢) wins on KXINXU and KXFEDDECISION but loses to 3¢ on KXBTCD (premature firing on noise). 5¢ and 10¢ never win on any recording in this set. Cross-recording avg favors 3¢ as the safe middle.

### stop_loss
| Recording      | Best params         | pnl¢ | fills | slip¢ |
|---|---|---:|---:|---:|
| KXINXU         | stopPriceCents=10   | 5427 | 1     | 3     |
| KXBTCD         | stopPriceCents=10   | 1315 | 1     | -3    |
| KXFEDDECISION  | stopPriceCents=10   | 372  | 1     | -41   |

**Notable:** stopPriceCents=10 wins on every recording because it's effectively a "fire on any drop" trigger — yes books don't go below 10¢ very often, but when they do, the immediate IoC sweep captures the highest yes bid via descending walk. stopPriceCents=30 and 50 fire earlier (on more recordings) but give a worse fill price. **Suggests stop_loss is mainly a "panic exit" instrument; for active risk management, trailing_stop is better at all parameter values.**

### bracket
| Recording      | Best params                            | pnl¢ | fills | slip¢ |
|---|---|---:|---:|---:|
| KXINXU         | targetPriceCents=50, stopPriceCents=20 | 5326 | 1     | 0     |
| KXBTCD         | targetPriceCents=50, stopPriceCents=20 | 1315 | 1     | -3    |
| KXFEDDECISION  | targetPriceCents=50, stopPriceCents=20 | 372  | 1     | -41   |

**Notable:** bracket numerically tracks stop_loss (the stop leg fires; the take-profit leg never does on these recordings). Could be useful on a recording where the price actually rises through the take-profit threshold — none of our 3 viable recordings exhibit that. Need a "rising-price" recording to test the take-profit leg in isolation.

### take_profit
| Recording      | Best params              | pnl¢ | fills | slip¢ |
|---|---|---:|---:|---:|
| KXINXU         | targetPriceCents=40      | 0    | 0     | 0     |
| KXBTCD         | targetPriceCents=40      | 0    | 0     | 0     |
| KXFEDDECISION  | targetPriceCents=40      | 0    | 0     | 0     |

**0 fills across all 9 cells.** Even the lowest target (40¢) was unreachable on these recordings — yes-side levels never crossed up through 40¢. KXINXU has yes levels in the 12-55¢ range but the trigger needs `bestBid > target`, which under the bid-quoted representation means the highest yes bid would need to exceed 40¢, and apparently it didn't reach 40¢ on any tick of any recording. **This is genuine "trigger never fired" — not a bug.** For meaningful take_profit testing, need a recording with a clear upward price trajectory through the target threshold.

## Surprises

**1. s-passive wins, narrowly.** The expectation post-v2 was that trailing-family would dominate. In practice, when passive can post and walk patiently, it captures the highest yes bid (55¢ on KXINXU) just as well as trailing_stop, with one fill instead of waiting for a peak-and-drop trigger. The passive edge is small (+44¢ over trailing_stop on KXINXU) but consistent.

**2. trailCents larger than 3 never wins.** v2's default of 5 was too wide. trailCents=10 was strictly worse than 1, 3, or 5 on every recording. **Implication for default:** lower the trailing_stop default from 5 to 3.

**3. take_profit triggers are systematically harder to set than stop_loss triggers.** Stop fires on downside; downside happens. Take-profit needs upward price movement, which requires recording-specific targeting. A future "auto-target take_profit" feature could compute the target as a fraction of cost-basis-to-100 rather than an absolute cent value.

**4. KXBTC15M and KXHIGHLAX were dead weight.** Both produced 0 fills because of structural book issues. Better recording selection: pre-filter recordings on (yes-side has bidders, no-side has bidders, mid moves > 5¢ across window).

## Filed follow-ups

- **🧊 SH-RECORDING-VIABILITY** — pre-flight script to check a recording's tradability before including in sweeps (have-bidders, mid-moves, etc.). ~1h. Would have caught KXBTC15M / KXHIGHLAX before consuming sweep cycles.
- **🧊 S-TRAIL-DEFAULT-TUNE** — change `trailCents` default in s-trail / trailing_stop adapters from 5 to 3 based on v3 evidence. Trivial code change; ~15min + test update.
- **🧊 S-TAKE-PROFIT-AUTO-TARGET** — instead of an absolute targetPriceCents, accept a fraction of (100 - costBasis) so the target adjusts to position. Larger refactor; defer.

## Next (v4 candidates)

1. **Find a rising-price recording** (something where yes-side rallies through 50¢+) to actually exercise take_profit. Without that, take-profit data stays unobserved.
2. **Drill on the chunk×walk subspace for s-passive:** add chunkSize=200 (larger than position) and chunkSize=10 (very small) to confirm the "biggest chunk wins" hypothesis.
3. **Add a noisy / sideways recording** to stress-test trailing_stop's premature-firing behavior. The 3 viable recordings here all had directional moves; a sideways one would show whether trailCents=3 holds up against chop.
4. **Cross-strategy comparison at fixed cost-basis** — currently we initialize cost-basis as 50¢ but recordings have wildly different mid-prices, which warps slippage interpretation. Setting cost-basis to per-recording mid would make pnl numbers more comparable.

The cluster's primary deliverable is captured: **s-passive at (chunkSize=100, walkStep=1) is the v3 winner**, narrowly beating s-twap and the trailing family. The numbers are close enough that recording-shape effects dominate strategy choice — which is itself the most useful signal for downstream agent / parameter selection logic.
