# Phase D Validation Results

**Date:** 2026-05-08 (post-Phase-D)
**Predecessor:** `2026-05-08-first-live-backtest-results.md`
**Phase D PRs:** #128 (Watcher framework), #129 (passive runOneTickBacktest), #130 (s-trail + 4 synthetic adapters)

## Re-run setup

Same recording: `~/.kea/recordings/KXINXU-26MAY08H1600-T7324.9999-20260508.ndjson` (S&P 500 hourly, 5566 snapshots, 56→75¢ mid range).

## Results

| Strategy | pnl_cents | fill_count | fill_rate | Notes |
|---|---:|---:|---:|---|
| s-passive (Phase D) | 0 | 0 | 0.0 | **Still 0 fills** — see "passive sell-side limit issue" below |
| trailing_stop | +131 | 1 | 1.0 | Fired + sold @14¢ via 99¢-aggressive sweep (same as s-aggressive in PR #127) |

## What worked

- ✅ **All 5 new strategy IDs resolve cleanly** through `harness.ts:resolveAdapter` (verified by harness.test.ts at PR #130).
- ✅ **Watcher framework drives synthetics correctly** — trailing_stop registered, evaluated each tick, fired when condition met, fireHook placed sell on replay client. End-to-end watcher path confirmed.
- ✅ **Phase D Task 1's mechanical fix is correct** — `runOneTickBacktest` posts ONE GTC per tick and tracks it across ticks (no inner-walk-loop cancellation). Verified via 9 unit tests + tightened `passiveAdapter.test.ts` regression.

## What still doesn't work — and why

**`s-passive` still reports 0 fills against this recording.** The Phase D fix addressed a real bug (production runOneTick's inner walk loop cancelled GTCs before next-tick fill could occur), but a deeper issue surfaces against KXINXU's actual book shape:

1. KXINXU's yes side at 00:00 has prices `[12¢, 13¢, 18¢, 19¢, 20¢, 21¢, 26¢, 37¢, 38¢, 39¢]` — heavily skewed.
2. passive computes `bestAskCents = yesAsks[0].priceCents = 12` (lowest yes-side level — actually the lowest YES BID, since Kalshi's orderbook stores yes-side BIDS, not asks).
3. For sell, `iterPrice = bestAskCents - walkStepCents = 11`.
4. passive posts a yes-sell GTC at limit **11¢**.
5. Replay client's naive fill model (`fillSimulator.ts:222`): walks yes-side levels ASCENDING, takes any with `priceCents <= maxPrice` (limit=11). All levels are ≥12 → 0 fills.

There are two separable issues here:

- **(A) `bestAskCents` naming bug.** The variable name implies a Kalshi ASK, but the value is `yesAsks[0]` — the lowest yes-side LEVEL, which is a BID under Kalshi conventions. Production runOneTick has the same logic, suggesting either (i) the variable is intentionally named after what it would be if Kalshi quoted asks separately, or (ii) the production code has been wrong for a while and the live runs work because the Kalshi exchange itself accepts the GTC and matches against the actual ask side internally — making the limit price effectively a floor, not a hit price.
- **(B) `simulateFill` sell-side semantics.** The fill model walks levels ASCENDING regardless of order side. For BUY this is right (lowest ask first). For SELL, the operator hits the highest BID first, then walks down. Walking ascending on a sell yields *worst-price-first* — and combined with the `p <= maxPrice` filter, sells with low limit prices fail to match even when the book is full of crossing bids.

Both (A) and (B) are pre-existing — Phase D didn't introduce them. PR #130's `trailing_stop` works around them by posting at limit=99¢, which forces the `p <= 99` filter to include every yes-side level → fills at the lowest yes price (still a wrong-direction sell-side fill, but at least non-zero).

## Bugs filed

**SH-FILL-SIM-DIRECTIONAL** — `simulateFill` walks book levels ascending for both buy and sell. Buy is correct (lowest ask first). Sell should walk DESCENDING (highest bid first) so the operator gets the best-available price. Current behavior is "worst-price for seller" — strategies that bypass the issue with limit=99 succeed but at unrealistically low fill prices; strategies with limit at or near best-bid (passive) fail to match entirely.

**SH-PASSIVE-SELL-LIMIT** — `passive.runOneTick` (and `runOneTickBacktest`) compute `iterPrice = bestAskCents - walkStepCents` for SELL. With Kalshi's orderbook structure (yes-side stores yes BIDS), `bestAskCents` is the lowest yes BID, not a true ask. The result is a sell limit BELOW all available yes bids — works in production because Kalshi matches at the actual best bid regardless of how low the limit is, but fails in backtest's naive fill model. Either: (a) rename variables and use a true best-bid for sell-side limit calculation, or (b) accept that production-mode and backtest-mode passive use different pricing semantics.

## Bottom line

✅ **Phase D's stated scope is complete.** All 5 new strategy IDs resolve and run; the framework is sound; the runOneTickBacktest mechanical fix is correct.

🟡 **End-to-end fill realism for passive is still blocked**, but by issues that pre-existed Phase D and are in the fill simulator + production passive pricing — separate refactors. Both filed as backlog stories.

📊 **Real-data signal from this validation:**
- Aggressive-style strategies (any with limit=99) execute on KXINXU but at the worst possible sell price (~12¢ vs 39¢ best yes bid). This is a fill-simulator quirk, not a strategy-quality signal.
- Passive cannot be evaluated on this recording until SH-FILL-SIM-DIRECTIONAL or SH-PASSIVE-SELL-LIMIT lands.
- The harness's CounterfactualReport is structurally correct — once fill realism is fixed, comparison tables will yield real strategic signal.
