# Scale-Out Strategy — KXMOVVAREDISTRICT-26APR21-YES-P4 (NO side, ~46.5k contracts)

**Date:** 2026-05-02 (v2 — reframed after operator review)
**Status:** PROPOSED — for review. **Do not execute.**
**Backlog reference:** primarily **W2.4 — Scale-out ladder** (`BACKLOG.md:166`), with passive-fill semantics borrowed from **W2.1 — Winning exit** (`:107`). Algorithm sketch: `code-and-docs-from-chatgpt/docs/WINNING_EXIT_ALGORITHM.md`.

## Setup (from operator)

- **Contract is NOT yet settled.** Resolution date in ticker (`26APR21`) is administrative — the underlying vote is not certified yet because of a pending legal/protest proceeding. Certification expected "next week" (≈2026-05-09 per operator). NO pays $1 if certification fails / the contested outcome flips; current market prices that probability at ~28%.
- **Cost basis ~7¢ → current NO bid 28¢** = ~$0.21/contract unrealized profit (~$9.7k on 46k contracts at the *mark*, less the cost of harvesting).
- **Operator preference:** scale out a **partial** position now to lock in some profit; hold the residual to resolution. Don't rush. If only ~30% can be exited at favorable prices, that's fine — leave the rest to settle. (This is most appropriate when the contract is NOT pinned at 95+% — at 28%, the market is still pricing meaningful uncertainty, so harvesting all of it would walk down the book and give up a lot of optionality.)

## Live orderbook (read 2026-05-02 ~15:00Z, top 5 each side)

| YES bids (= "NO asks" at 100 − price) | NO bids |
|---|---|
| 71¢ × 4 | 28¢ × 3,220 |
| 70¢ × 10 | 27¢ × 222 |
| 69¢ × 351 | 25¢ × 1,096 |
| 68¢ × 1,000 | 24¢ × 289 |
| 67¢ × 54 | 21¢ × 2,012 |

YES top + NO top = 99 → 1¢ implied spread. Total visible NO bid liquidity ≥ 21¢ ≈ 6,839 contracts; below 21¢ the visible book is empty.

## Sweep-now baseline (computed, not estimated)

Sweeping all 46,486 contracts NOW against the visible book:
- 3,220 × 28¢ + 222 × 27¢ + 1,096 × 25¢ + 289 × 24¢ + 2,012 × 21¢ = **$1,727.42 from the visible 6,839 contracts**
- Remaining 39,647 contracts: no visible bids. Would require dark/replenishing liquidity at much lower prices to fill at all.

A taker-style market sweep is therefore **strictly inferior** to a patient harvest. Even an optimistic 12¢ avg fill on the 39,647 residual = $4,758 → total ~$6,485 gross. The previous version's $5–7k baseline implicitly assumed deep dark liquidity that is not visible.

## Strategy — patient scale-out, no Phase B sweep

### Targets (revised)

- **Primary harvest target:** 10,000–15,000 contracts (≈22–32% of position) at average fill ≥ 25¢.
- **Stretch:** up to 20,000 contracts if the book stays cooperative without price collapse.
- **Residual: hold to resolution.** Settles at $1 (full ~$30k+ payout) if NO wins; $0 if it loses.
- **Hard stop:** if Phase A drives the top NO bid below 22¢ for more than 10 minutes, halt — the strategy is signaling the book and giving away alpha.

### Phase A — Slow patient drip

1. Compute current top-of-book NO bid `B`. Default chunk size = `min(500, 25% × top-of-book bid size)`. Never exceed 25% of visible top-bid size.
2. Post **NO sell @ `B + 1¢` GTC** (e.g. 29¢ when top bid is 28¢) — if and only if `B + 1¢ ≤ (100 − YES top bid)` (don't cross the spread).
3. Timebox: **120s ± 30s jitter**.
4. Filled? Pause **45s ± 15s jitter** before posting next chunk. Never two chunks in flight.
5. Unfilled? Cancel, drop **1¢**, repost at the new top bid.
6. After **5,000 contracts cumulative**, pause **5 minutes**. Let the book repopulate, reduce size signal.
7. Continue until **harvest target hit** OR **floor reached** OR **kill condition triggered**.

### Floor and kill conditions

- **Phase A floor: 24¢.** This is the lowest price with confirmed multi-level visible liquidity (24¢ × 289 + 25¢ × 1,096). Below 24¢, halt and reassess. Do **not** continue into 21¢ or below — that's giving up profit relative to holding to resolution.
- **Kill switch:** any single fill at < 22¢ aborts the entire run, regardless of phase. Operator must explicitly resume.
- **Stale-quote guard:** before each post, confirm orderbook age < 30s and book has refreshed since last poll. If `kalshiClient.fetchOrderbook` is returning identical state for >2 minutes, halt — the venue may be in pre-settlement freeze.

### No Phase B sweep

The previous version's Phase B was a 12k IoC sweep contingent on book depth. Removed because:
1. Operator explicitly said "don't rush."
2. Visible book past 24¢ is too thin to sweep without giving up >5¢ per contract.
3. The "hold to resolution" alternative on the residual has positive EV at current 28% pricing.

### No active hedge

Operator did not request a hedge on the residual. Document explicitly does NOT propose one.

## Expected value (corrected, with explicit assumptions)

Let `f` = Phase A fill rate at 24-26¢ avg. Let `p` = probability NO settles at $1 (operator's read: market prices ~28%; operator believes higher post-certification, but using market consensus as conservative baseline).

| Scenario | Phase A gross | Residual settles | Total gross | Net (after fees) |
|---|---|---|---|---|
| `f`=15k @ 25¢, NO wins (p=0.28) | $3,750 | 31.5k × $1 = $31,500 | $35,250 | ~$34,800 |
| `f`=15k @ 25¢, NO loses (p=0.72) | $3,750 | $0 | $3,750 | ~$3,500 |
| `f`=10k @ 24¢, NO wins | $2,400 | 36.5k × $1 = $36,500 | $38,900 | ~$38,500 |
| `f`=10k @ 24¢, NO loses | $2,400 | $0 | $2,400 | ~$2,200 |

**Probability-weighted EV (15k harvest, market p=0.28):**
0.28 × $34,800 + 0.72 × $3,500 = $9,744 + $2,520 = **~$12,260 EV**

Compare against:
- **Hold-to-resolution-only EV:** 0.28 × $46,486 + 0.72 × $0 = **~$13,016**
- **Sweep-now-fully EV:** ~$1,727 visible + uncertain residual fills, no chance at $46k payout = **likely ~$2-6k**

**The patient scale-out is roughly EV-neutral vs. pure hold,** trading ~$750 of expected value for the certainty of locking in ~$3.5k in any scenario. That's reasonable risk reduction for a thinly-traded, legally-uncertain settlement event.

If operator's private estimate of `p` is meaningfully higher than 28% (e.g. 40-50% based on the legal proceeding context), pure hold dominates and the harvest target should shrink further (5-10k, just enough to cover cost basis + fees). The sensitivity flips at roughly `p > 0.30` vs the patient strategy.

## Fee assumption

**Phase A is passive (resting GTC).** Kalshi's fee schedule charges different rates for maker (rest) vs taker (cross) fills; the engine's `pricing.ts:35` formula is taker-assumed. Net numbers above subtract a flat 1.5% maker estimate ($75 on 15k harvest at 25¢). **Confirm Kalshi's current maker rate for this contract before execution** — could be as low as 0%, in which case net is ~$75 higher per scenario.

## Risks (revised)

1. **Stale orderbook / pre-settlement freeze.** Resolution is paused but not canceled; Kalshi may freeze the book closer to certification. Phase A must check book freshness each iteration and halt if stale.
2. **Vote certification surprise.** If certification arrives early or unexpectedly, the residual settles immediately. Phase A in flight at that moment may have orders that reject or fill at distressed prices. Mitigation: subscribe to a news/calendar trigger if available; otherwise, accept this as a known risk.
3. **Adverse selection.** Even at 500-lot chunks, repeated patterns are visible. Anti-gaming jitter (size ±25%, timebox ±30s, pause ±15s) is required. Larger jitter than the v1 strategy.
4. **Engine doesn't support this today.** `exitRunner` has no `winning` mode, no scale-out orchestration, no jitter primitive, no orderbook-relative chunk sizing, no stale-book guard. **Required backlog work: W2.1 + W2.4 + W3.2 + a new "stale-book" safety check.** Estimate: 3–4 days.
5. **Kill-switch lag.** File-based kill switch is checked at iteration start (`exitRunner.ts`). An in-flight 120s GTC order ignores it for up to 120s. Mitigation: make Phase A iterations short (≤ 60s timebox + 45s pause = ≤ 105s reaction time) and add an explicit cancel-on-kill check inside the reconcile loop.

## What was wrong in v1 (preserved here for review trail)

- Framed as full-exit (W2.1) when operator wants partial-exit (W2.4 + W2.1 semantics).
- Arithmetic error: $7,200 + $2,400 + $4,500 = **$14,100**, not $13,500 as v1 stated.
- Sweep-now baseline of $5–7k was unsupported; computed value is $1,727 from visible book.
- Floor at 18¢ was 3 ticks below the lowest visible bid (21¢) — gave away 6¢ × 46k = up to $2,800 of avoidable downside.
- Phase B step said "sweep 4,000" but allocated 12,000 with no loop — silent 8k discrepancy.
- Best/worst framing ignored the dominant risk variable (Phase A fill rate); v2 uses an explicit EV table with probability weights.
- Maker vs taker fee not addressed.
- 5,000-lot chunks broadcasted "large seller" on a book whose top bid is 3,220.

## Open questions for review

1. Is `p ≈ 28%` (market consensus) the right baseline, or does operator's private read justify a higher EV calc?
2. 24¢ Phase A floor — too tight (limits fills), too loose (gives up profit), or right?
3. Is the 5,000-contract pause threshold sufficient anti-gaming, or should we go even smaller (2,500)?
4. Should the strategy add an opt-in **partial hedge** (buy a small YES position to lock in P&L on the residual)? Operator said no, but this is the natural alpha-extraction move if `p` is uncertain.
5. Should Phase A target be expressed as `% of visible book absorbed` rather than absolute contract count? E.g. "harvest until I've absorbed 50% of NO bids ≥ 24¢" — more dynamic, less sensitive to book changes.

## Implementation gap (cannot execute today)

This strategy proposes a `scale-out-patient` mode that does not exist in the engine. To execute:
- **W2.1** (winning exit, passive-first) — required.
- **W2.4** (scale-out ladder) — adapt for partial-exit-then-hold instead of multi-rung-price-targets.
- **W3.2** (anti-gaming jitter on chunk + timebox) — required.
- **New: stale-book safety check** in `exitRunner` — fetch orderbook, compare hash/age, halt if static for >N seconds.
- **New: maker-fee path** in `pricing.ts` — `pricing.ts:35` is taker-only.

Estimated effort: 3–4 engineering days plus mutation-test coverage in the harness's currently-empty mutation suite.
