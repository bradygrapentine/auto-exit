# Engine backlog

Last `/backlog-sync`: 2026-05-01

| Status | Count |
|--------|-------|
| 🧊 Deferred | 3 |
| ✅ Shipped (this log) | 2 |

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
