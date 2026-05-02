# Winning Exit Strategy — KXMOVVAREDISTRICT-26APR21-YES-P4 (NO side, ~46.5k contracts)

**Date:** 2026-05-02
**Status:** PROPOSED — for review. **Do not execute.**
**Backlog reference:** W2.1 — Winning exit (passive-first), `BACKLOG.md:107`. Algorithm design: `code-and-docs-from-chatgpt/docs/WINNING_EXIT_ALGORITHM.md`.

## Position snapshot

| Field | Value |
|---|---|
| Ticker | `KXMOVVAREDISTRICT-26APR21-YES-P4` |
| Held side | NO |
| Quantity | 46,485.99 contracts |
| Cost-basis exposure | $3,252.88 (≈ **7¢/contract** average) |
| Fees paid to date | $210.34 |
| Resting orders | 0 |
| Resolution | 2026-04-21 (per ticker date — past or imminent; verify before any execution) |

## Live orderbook (read at 2026-05-02 ~15:00Z, top 5 each side)

| YES bids (= NO asks at 100 − price) | NO bids |
|---|---|
| 71¢ × 4 | 28¢ × 3,220 |
| 70¢ × 10 | 27¢ × 222 |
| 69¢ × 351 | 25¢ × 1,096 |
| 68¢ × 1,000 | 24¢ × 289 |
| 67¢ × 54 | 21¢ × 2,012 |

YES top + NO top = 71 + 28 = 99 → 1¢ implied spread (tight).

## What "winning" means here

Cost basis 7¢ → mid roughly 28¢ NO bid → unrealized **+21¢/contract = ~$9,762 unrealized profit** before any exit cost. The objective is to harvest as much of that as possible without crushing the price by sweeping the book.

The book is **thin past the top level**: only 3,220 at 28¢, then 222 at 27¢, etc. Sweeping all 46,485 NO at market would walk far down (likely past 21¢ and into nothing) — destroying most of the unrealized profit.

## Proposed exit plan — passive-first, layered, time-boxed

### Constraints baked in (from `safety.json` + this strategy)

- **Floor price:** 18¢ NO. Below this, halt and reassess. (Justification: book has visible NO bids at ≥18¢ for several thousand contracts before going thin; below 18¢ the residual is mostly noise.)
- **Max orders / iteration:** 1 resting order at a time (avoid stacking visible signal).
- **Max participation rate:** 25% of visible top-of-book NO bid size per chunk (don't take more than 25% of any one level when crossing).
- **Daily quantity cap:** 12,000 contracts/day (≈ 26% of position) — slow drip across multiple sessions.
- **Kill switch:** any single fill at < 15¢ aborts the run.

### Phase A — Passive harvest at favorable prices (target: 30k of 46.5k)

1. Compute mid: `(YES_top_bid + NO_top_bid) / 2`. Currently mid ≈ 28.5 / 71.5 (NO/YES). Wide spread = no rush.
2. Post **NO sell @ 30¢ × 5,000 contracts GTC** (1¢ above current best NO bid; equivalent to "sell at 30 in NO terms").
3. Timebox: 90 seconds.
4. If filled: post next chunk at same price (30¢) — book may have absorbed but the bid behind it persists.
5. If unfilled after timebox: cancel, drop 1¢, repost at 29¢.
6. Continue stepping down 1¢ at a time until filled or floor reached.
7. After **15,000 contracts filled** (Phase A.1 milestone), pause 5 minutes — let the book repopulate, reduce signal of large seller.
8. Resume. Repeat until 30,000 cumulative or floor 18¢ hit.

### Phase B — IoC sweep on the residual (16k — only if Phase A succeeds)

Once the patient 30k is harvested, the residual 16k can take a more aggressive posture:
1. Read book.
2. If NO best bid ≥ 22¢ AND visible cumulative NO bid size ≥ 4,000 across top 3 levels: IoC sweep at `floor = 18¢` for 4,000 chunks.
3. Else: revert to passive Phase A logic on remaining size, accept that residual may sit through resolution.

### Phase C — Hold-to-resolution fallback

If `timeToResolutionHours < 24` and book is illiquid (no NO bid ≥ 18¢ for 5+ minutes):
- Stop posting. The contract resolves on 2026-04-21. NO pays $1 if event does NOT occur.
- Hold residual to settlement. **Required check:** verify which outcome the user expects (NO winning = full $1 payout; NO losing = $0).

## Expected outcome (rough envelope, NOT a forecast)

Assuming book persistence and ~70% Phase A fill at avg 24¢ (estimating 6¢ avg slippage from posted price), 25% Phase B fill at avg 20¢, 5% residual:
- Phase A: 30k × 24¢ = $7,200
- Phase B: 12k × 20¢ = $2,400
- Phase C residual: 4.5k × {0¢ or 100¢} = depends on resolution outcome

**Best case (NO wins at resolution):** ~$7,200 + $2,400 + $4,500 − fees = **~$13,500 gross, ~$12,800 net.**
**Worst case (NO loses, residual = $0):** ~$7,200 + $2,400 − fees = **~$9,200 net.**
**Compared to market-sweep-now estimate (~$5–7k):** the patient strategy is +$3k–$6k expected value.

These numbers are sensitive to book depth assumption — re-validate against `kea_preview` immediately before Phase A starts.

## Risks

1. **Adverse selection.** Posting 5k chunks signals to the book that a large seller exists. Mitigation: 5-minute pauses every 15k, anti-gaming jitter (±15s on timebox, ±10% on chunk size).
2. **Resolution surprise.** If the event resolves before Phase A completes, residual settles at $1 or $0 — strategy must monitor `timeToResolution` and shift to Phase C automatically.
3. **News-driven price collapse.** If NO bid drops below 18¢ floor mid-run, the strategy halts. Operator must reassess (panic exit if news genuinely changed the outcome probability; resume if it's noise).
4. **Engine doesn't currently support `winning` mode.** Today's `exitRunner` only does losing-exit IoC sweep. To execute this strategy, **W2.1 must be built first** (≈1.5 days per backlog estimate).
5. **No live testing of winning-exit logic.** The smoke + harness only cover read-only paths. Mutation tests for winning-exit need to land alongside W2.1.

## Open questions for review

- Floor at 18¢ — too aggressive (gives away 10¢ of cushion) or too conservative (leaves money in the residual)?
- Daily cap at 12k — does this match the operator's risk tolerance and time horizon?
- Should Phase B exist at all, or is "patient Phase A → hold-to-resolution" cleaner?
- Anti-gaming jitter — how much randomization is appropriate (chunk-size ±10% vs ±25%; timebox ±15s vs ±60s)?
- Is a TWAP overlay (W2.5) more appropriate for the Phase A drip than a passive-repost loop?

## Implementation status

This document is a **strategy proposal**. The engine cannot execute it today:
- `exitRunner` doesn't have a `winning` mode.
- `safety.json` has no per-position daily-cap field.
- No anti-gaming jitter primitive (W3.2).

To execute: ship W2.1 (winning exit mode) and W3.2 (jitter). Estimated 2 days combined per backlog.
