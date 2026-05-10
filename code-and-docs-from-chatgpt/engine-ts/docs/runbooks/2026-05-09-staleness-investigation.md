# Top-of-book staleness investigation — MOVVAREDISTRICT 2026-05-09

**Trigger:** real-money harvest of 8,891 NO contracts on
`KXMOVVAREDISTRICT-26APR21-YES-P4` produced $5,093.01 net cash vs $8,294.06
projected — a 38% miss.

**Filed as:** SH-DEPTH-WALK-STALE-SNAPSHOT (backlog).

## TL;DR

The 12,336-contract bid at 93.8¢ NO that the projection targeted **was real
liquidity**, not phantom. It existed continuously for 14+ hours. It was pulled
at exactly **15:04:55 UTC**, **5 minutes 18 seconds before our IoC** arrived
at 15:10:13 UTC. Top of book collapsed from 93.9¢ → 91.1¢ in one snapshot.
Our IoC walked through what was actually there: VWAP 58.67¢, fills spanning
91.1¢ down to 35¢.

## Investigation procedure

Pulled the live recording from the Fly volume via `flyctl machine exec`
(WireGuard tunnel was down — see SH-SCANNER-SYNC-FIX-2 path), gunzipped to
`/tmp/movva-fresh.ndjson` (31,185 snapshots covering 2026-05-09 00:14 →
21:28 UTC), and ran two analysis scripts:

```sh
node code-and-docs-from-chatgpt/engine-ts/scripts/phantom-liquidity-analysis.mjs
node code-and-docs-from-chatgpt/engine-ts/scripts/phantom-liquidity-pinpoint.mjs
```

## Findings

### 1. The bid was persistent for 14h+

| Time (UTC) | 93.8¢ size |
|---|---:|
| 00:14:36 | 12,560 (initial appearance) |
| 04:46:42 | 12,396 (small rebalance, −104) |
| 15:04:55 | 0 (full disappearance) |

Only 3 transitions in 14h+. Size variance: 12,296 → 12,560. Definitely a
single market-maker quote, refreshed but not actively traded against.

### 2. The disappearance was abrupt, before our trade

Minute-by-minute trace from the recording:

| ts (UTC) | 93.8¢ size | top NO bid |
|---|---:|---:|
| 15:00:02 | 12,336 | 93.90¢ |
| 15:01:00 | 12,336 | 93.90¢ |
| 15:02:02 | 12,336 | 93.90¢ |
| 15:03:00 | 12,336 | 93.90¢ |
| 15:04:00 | 12,336 | 93.90¢ |
| **15:05:00** | **0** | **91.10¢** |
| 15:06:01 | 0 | 91.10¢ |
| 15:07:01 | 0 | 91.10¢ |
| 15:08:02 | 0 | 91.10¢ |
| 15:09:00 | 0 | 91.10¢ |
| 15:10:01 | 0 | 91.10¢ |
| **15:10:13 ← our IoC fires** | | |
| 15:11:02 | 0 | 42.00¢ (we ate the 91¢ band) |

Precise pull moment: **2026-05-09T15:04:55.661Z**.

### 3. It was independent of our session

We hadn't authorized the trade yet at 15:04:55 (the user's "yes" came after
that). Read-only API queries don't broadcast trader activity. The pull was
internal to the market maker's own logic — risk threshold, quote-refresh
cycle, signal we're not privy to, or scheduled withdrawal.

### 4. Same pattern is recurring

Live book ~21:30 UTC same day:
- Top NO bid: 90.6¢ × 387 contracts (much thinner than morning)
- **Fat 9,737-contract bid resting at 88¢**

That bid faces identical staleness risk. Any projection targeting it can
be invalidated in seconds by a similar pull.

## Lessons

1. **Live-snapshot depth-walk projections are unreliable for orders sized
   to consume top-of-book.** Even with current data (seconds old), a
   single-MM bid can vanish between projection and execution.

2. **Recording-based "patient" estimates are more conservative AND closer
   to reality.** The 18h MOVVA backtest's "patient passive @ 94¢" outcome
   (96.33% / 26,956 fills) reflected what genuinely traded over a long
   window. The static-snapshot "skim @ 93.81¢" was a moment-in-time
   outlier that didn't survive contact with execution latency.

3. **For future harvests on similar markets:** prefer a sub-order strategy
   (e.g. 1k contracts at a time, monitor each fill VWAP, halt if quality
   degrades) over a single large IoC. Trade-off: more fees, far less
   exposure to a single book-collapse event.

4. **Pre-trade liveness check** before any large IoC: re-query the
   orderbook seconds before submission, compare to projection assumptions,
   abort if top-of-book has materially shifted. Cheap to add, would have
   caught this one.

## Reproducing the analysis

The two analysis scripts are reusable for any future harvest investigation
on a recorded market. Inputs: an `.ndjson` recording covering before and
after the trade. Outputs: transition events, ±N snapshot comparison around
trade time, minute-by-minute trace.

## Fix shipped — 2026-05-09

`SH-DEPTH-WALK-STALE-SNAPSHOT` landed on branch `feat/sh-depth-walk-liveness`:

1. **Pure liveness primitive** (`src/preTradeLiveness.ts`). `checkLiveness(projection, freshBook)` returns `{ ok: true }` or rejects with `bid_shifted` / `size_collapsed` / `side_empty` and the specific drift. Defaults: max 1¢ shift, max 50% size shrink at the projected level. No I/O.

2. **AggressiveRunner gate** (`src/aggressive.ts`). For trades >= `livenessGateSize` (default 100 contracts), the runner re-fetches the orderbook between projection and `createOrder`, calls `checkLiveness`, and breaks the loop with `reason: 'liveness_rejected:<reason>'` + journals `aggressive_liveness_rejected` if stale. Operators can pass pre-computed `livenessAssumptions` (e.g. from a harvest-planner that ran minutes earlier) or opt out via `livenessCheckEnabled: false` for backtests.

3. **Harvest-planner risk notes** (`src/harvestPlanner.ts`). When the YES bid side has a fat top (`topSize / meanRest > 5×` over the next 4 levels, or the top is the only visible level), `HarvestPlannerOutput.riskNotes` includes a concrete warning naming the size, price, and the SH-DEPTH-WALK ticket. The CLI prints these under a "Risk notes" section.

Replay test: a projection of 12,336@93¢ vs a fresh book of [[91¢, 5_000]] now returns `{ ok: false, reason: 'bid_shifted' | 'size_collapsed' }` instead of walking through. The MOVVA-replay aggressive test (12,000@93¢ → 100@93¢) returns `liveness_rejected:size_collapsed`; `createOrder` is never called.
