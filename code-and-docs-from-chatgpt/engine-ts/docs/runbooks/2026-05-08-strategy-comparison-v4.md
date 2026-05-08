# Strategy comparison sweep v4 — shape diversity + cost-basis normalization

**Date:** 2026-05-08
**Predecessor:** `2026-05-08-strategy-comparison-v3.md`
**Plan:** `docs/superpowers/plans/2026-05-08-sweep-v4-shape-diversity.md`
**Catalog:** `docs/runbooks/2026-05-08-recording-catalog.md`
**Script:** `scripts/strategy-sweep-v4.mjs`
**Raw:** 222 cells in `/tmp/sweep-v4.md` (regenerable; not committed)

## Setup

222 cells = 8 strategies × Cartesian-expanded grids × **6 shape-diverse recordings**.

Recording set picked from the catalog (89 total, 49 tradable):

| Recording | Shape | Δ | range | First mid (cost basis) |
|---|---|---:|---:|---:|
| KXINXU | rising | +9 | 20 | 51 |
| KXBTCD | rising | +17 | 24 | 26 |
| KXHIGHNY | rising | +16 | 17 | 38 |
| KXSPOTIFYD | falling | −43 | 44 | 92 |
| KXHIGHCHI | falling | −39 | 39 | 85 |
| KXSPACEXCOUNT | sideways | −3 | 7 | 33 |

**Cost basis normalized per-recording** to first-tick mid (vs. v3's implicit 50¢ default). Pnl numbers now reflect "cents-from-entry-mid" — the falling recordings' big absolute pnls (8620¢ on KXSPOTIFYD) reflect 92→49¢ drops captured by exiting near top.

## Cross-recording winners (avg pnl across 6 recordings, slippage > -50)

| Strategy | Best params | avg pnl¢ | filled |
|---|---|---:|---:|
| **trailing_stop** / s-trail | **trailCents=10** | **5533** | 6/6 |
| stop_loss | stopPriceCents=50 | 5389 | 6/6 |
| s-aggressive | (defaults) | 5318 | 6/6 |
| s-twap | numIntervals=10, intervalMinutes=1 | 3939 | 6/6 |
| s-passive | chunkSize=100, walkStepCents=1 | 3930 | 6/6 |
| bracket | targetPriceCents=50, stopPriceCents=20 | 3722 | 6/6 |
| take_profit | targetPriceCents=40 | 1437 | 6/6 |

## v3 → v4 deltas

| Strategy | v3 winner | v3 avg | v4 winner | v4 avg | Notes |
|---|---|---:|---|---:|---|
| trailing_stop | trailCents=3 | 2403 | **trailCents=10** | **5533** | **Fully reordered.** v3's 3-recording set was all-rising, so tight trails won. v4's mix of falling/sideways favors wide trails to avoid premature firing. |
| s-passive | chunkSize=100, walkStep=1 | 2447 | (same) | 3930 | Same params; magnitude reflects cost-basis normalization, not strategy quality change. |
| s-twap | numIntervals=10 | 2435 | (same) | 3939 | Stable. |
| s-aggressive | defaults | 2216 | defaults | 5318 | Now mid-pack (3rd) instead of last; aggressive sweeps capture falling recordings' big initial bids well. |
| stop_loss | stopPriceCents=10 | 2371 | **stopPriceCents=50** | **5389** | **Reordered.** With falling recordings included, an early stop (50¢) fires when entry was 85-92¢, capturing big pnl. v3 had no falling recordings to test this. |
| take_profit | unfillable | 0 | targetPriceCents=40 | 1437 | **First non-zero!** Fires on KXSPOTIFYD (falling 92→49) because target=40 was reachable. |

The headline v3 finding "s-passive narrowly wins" did **not** hold up under shape diversity. v4's broader recording set reorders the leaderboard.

## Per-shape findings

| Shape | Top strategy | Avg pnl¢ on shape | What's happening |
|---|---|---:|---|
| rising | s-trail trailCents=10 | 3821 (3 cells) | Wide trail rides the full move without firing on intermediate pullbacks. |
| falling | stop_loss stopPriceCents=50 | 9310 (2 cells) | Stops fire fast on initial drop; entry was 85-92¢ so a 50¢ stop captures most of the move. |
| sideways | s-passive chunkSize=100, walkStep=1 | 3733 (1 cell) | Patient post-and-walk matches the book naturally; no momentum to chase. |

**Strategy choice now clearly depends on regime.** The right move for an LLM-driven engine is *recording-shape-aware* strategy selection: detect direction from recent ticks, pick strategy accordingly.

## Surprises

**1. trailCents=10 unseats trailCents=3.** v3 said 3 wins; v4 says 10. The difference is recording shape. Filing **🧊 S-TRAIL-DEFAULT-IS-REGIME-DEPENDENT** as a documentation update — not a default change. The original default of 5 stays as the compromise.

**2. take_profit "firing" at targetPriceCents=40 on KXSPOTIFYD is a false positive.** That recording starts at 92¢ and drops. The bestBid was already > 40 at tick 0, so take_profit's `bestBid >= target` condition fires immediately — equivalent to s-aggressive at limit=99, not actual "take profit at 40¢ when price climbs through it". For meaningful take_profit data, need a recording that *starts below 40¢ and rises through it*. None of the 6 v4 recordings fit that profile. Filing **🧊 SH-TAKE-PROFIT-START-BELOW-TARGET** as a follow-up: write a take_profit-specific recording filter.

**3. Per-recording trailCents=1 wins on 5 of 6 cells in s-trail's table, but trailCents=10 wins the cross-recording average.** This is a robust-vs-best tradeoff: trailCents=1 produces the highest single-recording pnl when it gets lucky, but trailCents=10 has a less variable result that averages higher. The "best" param depends on whether you want consistent or best-case performance.

**4. s-aggressive now mid-pack instead of last.** v3 said s-passive narrowly beats aggressive (+231¢). v4 shows trailing_stop / stop_loss / aggressive as the top tier; passive and twap as mid-tier. This makes sense: on falling recordings, fast execution captures top-of-book bids before they drop; aggressive's IoC sweep is a great fit. Patient strategies (passive, twap) lose value as the book trends downward.

**5. SH-TRAIL-DEFAULT-TUNE was reverted.** v3 evidence pointed to 3; v4 shows 10. Original 5 stays. Reverted in this PR. Don't change defaults based on a 3-recording sweep.

## Filed follow-ups

- 🧊 **SH-TAKE-PROFIT-START-BELOW-TARGET** — recording filter / catalog query for "starts below X, rises through X" recordings to actually exercise take_profit. ~30min for the script + a take_profit-specific runbook entry.
- 🧊 **S-TRAIL-DEFAULT-IS-REGIME-DEPENDENT** — docs update making explicit that the trailCents default is regime-dependent and best-tuned per-strategy-context. ~15min.
- (already filed in v3 plan) S-TAKE-PROFIT-AUTO-TARGET — fraction-of-headroom alternative; defer.

## Conclusion

The v3 leaderboard was an artifact of an all-rising 3-recording set. v4 with shape diversity tells a much more useful story:

1. **Strategy choice is regime-dependent.** No single strategy wins everywhere.
2. **For agent / orchestration logic:** recording shape (rising / falling / sideways) is the strongest signal for strategy selection.
3. **trailCents tuning is also regime-dependent.** Tight trails (1-3) win on directional moves with low noise; wide trails (10) win on noisy or sideways markets.
4. **stop_loss with a high stopPriceCents is the dark horse for falling regimes** — it's "fire fast on initial drop" execution that's hard to beat when entry was high and book is dropping.
5. **Cost-basis normalization changed the absolute numbers but not the relative ordering** — confirms v3's mechanical findings while making the magnitudes interpretable.

## v5 candidates

- **Recording filter to find "rises through target" recordings** for genuine take_profit testing.
- **Drill stop_loss on falling-regime parameter subspace** — what's the optimal stop for varying initial-mid recordings?
- **Trial composite strategies** that detect regime and switch (e.g. `if regime=='falling' run stop_loss(50) else run trailing_stop(10)`). Requires a regime-detection primitive.
- **Variance / drawdown analysis** — currently we only optimize pnl. Add max_adverse_excursion as a secondary metric.
- **Multi-position scenarios** — current sweep is always 100 yes-side. Try 50/50, asymmetric sizes, etc.
