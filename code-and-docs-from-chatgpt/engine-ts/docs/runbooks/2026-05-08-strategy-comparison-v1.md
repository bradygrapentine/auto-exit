# Strategy comparison sweep v1

**Date:** 2026-05-08
**Predecessor:** PR #132 (SH-FILL-SIM-DIRECTIONAL), #134 (CLI ticker plumbing), #135 (SH-PASSIVE-SPREAD-LOGIC filed)
**Script:** `scripts/strategy-sweep.mjs` (one-off; safe to delete)

## Setup

- 8 strategies × 3 recordings = 24 cells.
- `initialPosition: { side: 'yes', quantity: 100 }`, sell-side exit.
- Recordings:
  - **KXINXU (S&P hourly)** — 5566 snapshots, skewed yes-side `[14, 34, 35, 37, 47, 48, 50, 51, 52, 55]`.
  - **KXBTCD (BTC daily)** — ~1MB, healthier book.
  - **KXFEDDECISION 27JUN-C25** — event-driven, ~1MB.
- Strategy params: defaults where reasonable, no recording-specific tuning.

## Results

| Recording | Strategy | pnl¢ | fills | rate | avg slip¢ | exit s | MAE¢ | MFE¢ | error |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| KXINXU (S&P hourly) | s-aggressive | 5326 | 1 | 100% | 0 | 0 | 5326 | 5326 |  |
| KXINXU (S&P hourly) | s-passive | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXINXU (S&P hourly) | s-twap (2 intervals) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXINXU (S&P hourly) | s-trail (trail=5) | — | — | — | — | — | — | — | S-trail: positionSize must be > 0 |
| KXINXU (S&P hourly) | trailing_stop (trail=5) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXINXU (S&P hourly) | take_profit (target=75) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXINXU (S&P hourly) | stop_loss (stop=30) | 5326 | 1 | 100% | 0 | 0 | 5326 | 5326 |  |
| KXINXU (S&P hourly) | bracket (75/30) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXBTCD (BTC daily) | s-aggressive | 1315 | 1 | 100% | -3 | 0 | 1315 | 1315 |  |
| KXBTCD (BTC daily) | s-passive | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXBTCD (BTC daily) | s-twap (2 intervals) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXBTCD (BTC daily) | s-trail (trail=5) | — | — | — | — | — | — | — | S-trail: positionSize must be > 0 |
| KXBTCD (BTC daily) | trailing_stop (trail=5) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXBTCD (BTC daily) | take_profit (target=75) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXBTCD (BTC daily) | stop_loss (stop=30) | 1315 | 1 | 100% | -3 | 0 | 1315 | 1315 |  |
| KXBTCD (BTC daily) | bracket (75/30) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXFEDDECISION (27JUN-C25) | s-aggressive | 7 | 1 | 1% | -37 | — | 7 | 7 |  |
| KXFEDDECISION (27JUN-C25) | s-passive | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXFEDDECISION (27JUN-C25) | s-twap (2 intervals) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXFEDDECISION (27JUN-C25) | s-trail (trail=5) | — | — | — | — | — | — | — | S-trail: positionSize must be > 0 |
| KXFEDDECISION (27JUN-C25) | trailing_stop (trail=5) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXFEDDECISION (27JUN-C25) | take_profit (target=75) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |
| KXFEDDECISION (27JUN-C25) | stop_loss (stop=30) | 372 | 1 | 100% | -41 | 0 | 372 | 372 |  |
| KXFEDDECISION (27JUN-C25) | bracket (75/30) | 0 | 0 | 0% | 0 | — | 0 | 0 |  |

## Findings

**1. Only aggressive-style strategies fill across these recordings.** s-aggressive and stop_loss(stop=30) produce identical numbers per recording — both ultimately invoke the IoC sweep against the resting yes book. Every other strategy returns 0 fills on all 3 recordings. That includes s-passive, s-twap, s-trail (errors first), trailing_stop, take_profit, and bracket.

**2. SH-PASSIVE-SPREAD-LOGIC is universal, not KXINXU-specific.** s-passive returns 0 fills on KXBTCD and KXFEDDECISION too — every recording in this sweep break_loops on tick 1. This argues for proposed fix path (a) or (c) in the backlog ticket: synthesize bestBid from yes-side levels when no-side is empty/thin, OR skip the spread check on tick 1 before any order has been posted. NOT (b) — the failure isn't a tunable knob, it's a systemic gating bug.

**3. New finding — watcher synthetics (trailing_stop, take_profit, bracket) never fire on these recordings.** They all return 0 fills, no errors. Two possibilities: (i) the trigger conditions genuinely don't fire on this data (KXINXU mid stays at 55¢; trailing_stop at trail=5 never sees a 5¢ drop), or (ii) the watcher framework has a bug post-PR-#132 (e.g. the `yes_price=99 → 1` flip in watcherAdapter.ts:91 broke something downstream). Need a focused test: pick a recording where price MOVES, run trailing_stop with trail=1, see if it fires. **Filing as 🧊 SH-WATCHER-FILL-AUDIT.**

**4. New finding — s-trail errors with `positionSize must be > 0`.** The harness's `remainingQty` (sourced from `initialPosition.quantity`) isn't being threaded into the s-trail watcher adapter's `buildSTrailArgs` call. The adapter likely reads `params.size` instead of using the harness-provided remainingQty. **Filing as 🧊 SH-S-TRAIL-POSITIONSIZE.**

**5. Aggressive's slippage is recording-shape-dependent.** −37¢ on KXFEDDECISION and −3¢ on KXBTCD vs ≈0 on KXINXU. The KXINXU "0 slippage" is not because aggressive is well-priced there — it's because mid is 55¢ and aggressive fills at 55¢ (the highest yes level). On KXFEDDECISION, mid is presumably far from the lowest-priced yes level, so a sweep that lands on the highest yes bid produces large slippage relative to mid. **This is correct fill semantics but an open strategy-design question** — is "aggressive sell" supposed to hit the bid (cross the spread upward) or take whatever's in the yes book? Captured under the existing 🧊 S-AGGRESSIVE-PRICE-DISCOVERY follow-up.

**6. Passive trade-off vs. aggressive can't be evaluated yet.** The whole point of comparison sweeps is to see when passive's posting-and-waiting beats aggressive's slippage. Until SH-PASSIVE-SPREAD-LOGIC ships, passive is structurally unable to post any orders, and we have no data on passive vs. aggressive trade-offs.

## Next

Triage decision per the plan:

1. **Highest leverage: SH-PASSIVE-SPREAD-LOGIC.** Findings 2 + 6 say this is the bottleneck blocking all passive strategy comparisons. ~3-4h fix; backlog ticket already filed (PR #135). Pick fix path (a) — synthesize bestBid from highest yes-side level when no-side is empty.
2. **Second: SH-WATCHER-FILL-AUDIT.** Need to confirm whether 0 fills on watcher synthetics is genuine "trigger never fired" or a regression from PR #132. Will scope after a focused trail=1 test on a moving recording. ~1-2h investigation.
3. **Third: SH-S-TRAIL-POSITIONSIZE.** Small fix; 30 min. Worth doing alongside #1 since both sit in the passive/watcher path.
4. **Defer: S-AGGRESSIVE-PRICE-DISCOVERY** until passive comparison data exists.
5. **Defer: SH-SCANNER-SYNC-FIX-2.** 89 recordings is enough data; manual sync works.

Recommendation: queue SH-PASSIVE-SPREAD-LOGIC + SH-S-TRAIL-POSITIONSIZE + SH-WATCHER-FILL-AUDIT as the next implementation cluster. After they land, re-run this sweep — it should show passive vs. aggressive trade-offs for the first time.
