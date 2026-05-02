# Engine backlog

Last `/backlog-sync`: 2026-05-01

| Status | Count |
|--------|-------|
| 🧊 Deferred | 6 |
| ✅ Shipped (this log) | 3 |

Features deferred until a concrete need surfaces. Don't build speculatively.

## 🧊 Refill-rate harvest mode

**Trigger:** market where another participant (MM or bot) keeps refreshing the
top bid level after we take it. Current engine harvests these refills via the
normal iteration loop, but doesn't *recognize* the refill pattern or adapt
pacing to it.

**Proposed behavior:**
- Track top-level (priceCents, size) across consecutive iterations.
- If the same priceCents reappears with comparable size after a fill, classify
  as "refilling level" and:
  - Drop `loopDelayMs` to 0 (race other snipers).
  - Set chunkSize to match the refilled level depth (don't ask for more than
    refills, don't leave shares for the next sniper).
  - Log `refill_detected` with rate (refills/sec) for observability.
- Exit refill mode when (a) level disappears for N iterations or (b)
  `maxOrders` reached.

**Open questions:**
- How aggressive is too aggressive — at some point the engine becomes the
  thing other people are racing against.
- Cancel-replace at the same price to jump the queue: separate feature, much
  more complex (real GTC management loop, not one-shot resting).
- What signals false positives (e.g. a single MM cycling, vs. genuinely deep
  hidden liquidity)?

**Cost to build:** ~1 day. Touches `pricing.ts` (chunk sizing), `exitRunner.ts`
(loop pacing + state across iterations), new test fixtures simulating refill.

**Why deferred:** P1 book doesn't refill — it just sits. Build when a real
market presents the refill pattern; spec'ing against a hypothetical book is
how you get the wrong abstraction.

## 🧊 GTC-prepend before IoC sweep ("post-then-sweep")

**Idea:** before the IoC main loop runs, post a single GTC at our side's ask
(or one tick under) for the full position. Wait `prependGtcWindowMs`. Cancel
unfilled portion. Decrement remaining by what filled. Then run the existing
IoC loop for the rest.

**Upside:** capture top-of-ask pricing for any shares that fill during the
window. On a market with active buyer flow, this can be meaningful — e.g.
P1 had ~30k shares of 24h volume and a 0.4¢ spread; even partial capture at
ask price would have added $30-100 to a 95k-share exit.

**When it's worth it:** large position + decent natural volume + patience
(minutes to hours). When isn't: dust, urgent exits, dead markets.

**Risks:**
- Time cost; market can move adversely during the wait
- Another seller can undercut your resting offer, taking flow
- Race conditions: cancel must complete before IoC starts, else the sweep
  could double-execute against a resting GTC that fills mid-cancel

**Cost to build:** ~1 day. New config knobs, pre-loop posting + cancel logic
in `exitRunner.run()`, integration tests for fill-during-window and
cancel-failed-during-window cases.

**Why deferred:** existing IoC + tail-GTC covers the high-value cases (fast
exit + passive remainder). Prepend-GTC is a strategy lever, not a missing
feature; build it when you have a specific exit where the math says yes.

## 🧊 Min-chunk-value guard (avoid the $0.01-per-fill minimum tax)

**Problem:** Kalshi rounds taker fees UP to $0.01 per fill. For a chunk worth
less than ~$0.15, the formula fee is below $0.01, so the minimum binds and
the effective fee rate balloons. Worst case: 1 share × 1¢ = $0.01 trade pays
$0.01 fee = 100% fee rate.

**Proposal:** new config `minChunkValueDollars: number` (default 0.15).
`decideLosingExitOrder` refuses to emit a chunk where
`chunk × decision.priceCentsExact / 100 < minChunkValueDollars`. Engine
logs `chunk_too_small_for_fee_threshold` and falls through to next iter (or
stops if remaining is the same shape).

**Where this matters:** tail-sweep + cancel-stale loops on cheap markets,
fractional remainders, and any exit where chunkSize × bid_price falls under
the threshold.

**Where it doesn't:** our P1 chunks were 2000 shares × 0.1-0.8¢ = $2-16 per
chunk, well above $0.15. Already fine.

**Cost:** ~2 hours. One pricing.ts change + 3 test cases.

**Why deferred:** P1 didn't trigger the failure mode. Build when a future
exit hits a cheap-market dust scenario where the per-fill minimum is the
dominant cost.

## 🧊 Single-shot capture-and-execute scanner

**Trigger:** the multi-market test (2026-05-01, see `MULTIMARKET_TEST_REPORT.md`)
revealed that interesting book shapes — especially thin-top + cliff — evaporate
between scan and execute. Two-poll workflows (scan, then human reviews, then
buy/sell) are too slow.

**Proposed:** `kea autotest --shape thin-cliff --budget 2 --depth-floor 100`
that does in one pass:
1. Stream-scan the open markets endpoint
2. As soon as a market matching `--shape` is found AND its book still meets
   the criteria on a re-fetch, immediately:
3. Buy a small position via crossable IoC (sized to `--budget`)
4. Run the engine sell against it (same script, no human gate)
5. Capture pre/post and exit

**What this validates that nothing else can:** auto-adaptive thin+cliff
behavior live, since manually-paced workflows can't catch these books.

**Cost to build:** ~3-4 hours. New CLI subcommand, hardcoded shape detectors,
automated buy primitive (could be a reusable `kea buy` subcommand). Tests
mostly trivial since most of it is plumbing existing primitives.

**Why deferred:** opportunistic by definition — only matters when a
candidate book actually appears. Build before the next attempt at
multi-market validation, not as urgent infrastructure.

## 🧊 Multi-market validation sweep — DEFERRED INDEFINITELY

**Original plan:** test the engine across 4 market characteristic buckets
(cheap-tail, mid-priced, high-priced, thin-cliff) for projection accuracy
and fee-curve validation. See `MULTIMARKET_TEST_REPORT.md` for the 2026-05-01
attempt.

**Why deferred indefinitely:** structural Kalshi reality. A 10,000-market
scan returned only 2 markets with two-sided liquidity. The cheap-tail
(1-3¢) and high-priced (80-95¢) market types don't exist on demand —
they require specific event calendars (major political events, etc).

**Re-trigger this when:** a major event with deep-tail markets is active
(election, supreme court ruling, etc.) — at that point a fresh scan
might find 4+ usable candidates simultaneously.

**Cost to re-run:** ~2 hours of execution + report writing. Code already
exists; just needs market conditions.

## 🧊 Cancel-replace GTC drip mode

**Trigger:** posting GTC at top-of-book and re-quoting when undercut. Different
from current GTC (one-shot, exit loop after placement).

**Cost:** ~1 day. New loop variant that polls book + own order, cancels and
re-posts on adverse moves.

**Why deferred:** No concrete use case yet. Current GTC is a "leave it and
come back" tool, which fits the user's pattern.

## ✅ Shipped

- **2026-05-01 — Auto-adaptive chunking.** `mildAdaptive` is now optional. When
  omitted, `chooseChunkSize` auto-decides: fat top (≥ 5× chunkSize) → fixed;
  thin top + cliff (next level ≥ 0.2¢ below) → adaptive; else fixed. Explicit
  `true`/`false` still work as overrides. See `pricing.ts::shouldAutoAdapt`,
  `safetyCap.test.ts`, `autoAdaptive.integration.test.ts`. Live smoke on P1
  confirmed non-regression.

- **2026-05-01 — Tail-GTC on finish.** `tailGtcOnFinish: true` posts a single
  resting GTC sell for any leftover shares when the IoC main loop ends with
  remaining > 0. Default price is one tick under our ask (derived from top
  opposite-side bid); `tailGtcPriceDollars` overrides. Includes a
  resting-orders guard (skips if `restingOrdersCount > 0`) to prevent
  double-posting across re-runs. Live-validated draining 1,386 P1 shares.
  See `exitRunner.ts::postTailGtcOrder`, `tailGtc.test.ts`.

- **2026-05-01 — Fee-aware preview + status.** `projectFullExit` walks the
  book level-by-level and returns gross/fees/net/feeRatio/chunks/unfillable
  with per-segment breakdown. Surfaced via `/preview`. `JobStatus.feesIncurredDollars`
  accumulates actuals from each order's `taker_fees_dollars`. Validated
  against current P1 book (7.56% feeRatio, matches structural rate). See
  `pricing.ts::projectFullExit`, `feeAware.test.ts`. (Optional `maxFeeRatio`
  refuse-to-start gate not built — would be separate item.)
