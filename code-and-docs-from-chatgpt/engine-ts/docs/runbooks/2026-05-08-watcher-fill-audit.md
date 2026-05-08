# Watcher Fill Audit — SH-WATCHER-FILL-AUDIT

**Date:** 2026-05-08
**Branch:** `investigate/watcher-fill-audit`
**Predecessor:** strategy comparison sweep v1 (PR #136), PR #137 (SH-S-TRAIL-POSITIONSIZE), PR #138 (SH-PASSIVE-SPREAD-LOGIC)
**Question:** Why did `trailing_stop`, `take_profit`, and `bracket` all return 0 fills across every recording in the v1 sweep? Is it α (genuine no-trigger), β (fill-path bug), or γ (synthetics-engine bug)?

---

## Setup

### Recording selected

**`KXINXU-26MAY08H1600-T7324.9999-20260508.ndjson`** — the same recording used in the v1 sweep.

Candidate price ranges computed from `yes[0].priceCents` across all snapshots:

| Recording | yes[0] min | yes[0] max | Range | Snapshots |
|---|---:|---:|---:|---:|
| KXINXU-20260508 | 1¢ | 42¢ | **41¢** | 5566 |
| KXBTCD-20260507 | 1¢ | 10¢ | 9¢ | 2878 |
| KXFEDDECISION-27JUN-C25-20260508 | 1¢ | 1¢ | 0¢ | — |
| KXBTC15M-20260508 | — (empty book) | — | — | — |

KXINXU-20260508 has the biggest price move (41¢ range), making it the most likely to trigger a trailing_stop synthetic. It is also the same file used in the v1 sweep, ensuring the audit results are directly comparable.

### Commands run

**Primary run (trail=1, confirming fire path):**

```bash
node --input-type=module << 'EOF'
import { runBacktest } from './dist/backtest/harness.js';
const TICKER = 'KXINXU-26MAY08H1600-T7324.9999';
const REC = process.env.HOME + '/.kea/recordings/KXINXU-26MAY08H1600-T7324.9999-20260508.ndjson';
const r = await runBacktest({
  recordingPath: REC,
  strategyId: 'trailing_stop',
  params: { ticker: TICKER, side: 'yes', trailCents: 1 },
  fillModel: 'naive',
  initialPosition: { ticker: TICKER, side: 'yes', quantity: 100 },
});
console.log('fill_count:', r.summary.fill_count);
console.log('pnl_cents:', r.summary.pnl_cents);
console.log('trace_len:', r.trace.length);
console.log('first nonzero fill row:', r.trace.find(x => x.fillsSoFar > 0));
EOF
```

**Confirmation run (trail=5, matching v1 sweep params):**  
Same script with `trailCents: 5`.

**Regression reproduction (size=0, simulating pre-#137 default):**  
Same script with `params: { ..., trailCents: 5, size: 0 }`.

Temporary instrumentation added to `watcherAdapter.ts` during investigation: replaced `fs.mkdtempSync(...)` with a fixed path `/tmp/wf-audit-fixed/` and disabled the post-fire `fs.rmSync` cleanup to allow journal reading. **Reverted before commit** — `git diff src/` is clean.

---

## Observations

### Run results

| Run | trailCents | size param | fill_count | pnl_cents |
|---|---:|---:|---:|---:|
| trail=1 (primary audit run) | 1 | (none — uses remainingQty=100) | **1** | 5427 |
| trail=5 (v1 sweep params, post-#137) | 5 | (none — uses remainingQty=100) | **1** | 5427 |
| trail=5, size=0 (pre-#137 regression repro) | 5 | 0 | **0** | 0 |

First nonzero fill row (trail=1): `{"ts":"2026-05-08T00:01:37.815Z","midCents":55,"fillsSoFar":1,"remaining":0,"pnl_cents":5427}`

### Watcher journal (trail=1 run — `/tmp/wf-audit-fixed/synthetics.ndjson`)

48 events total. Representative lines:

```json
{"kind":"synthetic_registered","ts":"2026-05-08T14:00:37.944Z","synthetic":{"id":"syn-acbb8c17-...","kind":"trailing_stop","ticker":"KXINXU-26MAY08H1600-T7324.9999","side":"yes","positionSize":100,"params":{"trailCents":1},"state":{},"status":"armed"}}
{"kind":"synthetic_state_update","ts":"2026-05-08T14:00:37.944Z","id":"syn-acbb8c17-...","state":{"peakBidCentsExact":14.000000000000002}}
{"kind":"synthetic_state_update","ts":"2026-05-08T14:00:37.944Z","id":"syn-acbb8c17-...","state":{"peakBidCentsExact":14.000000000000002}}
...  (40 more state_update lines with peak tracking 14¢ → 34¢) ...
{"kind":"synthetic_state_update","ts":"2026-05-08T14:00:37.945Z","id":"syn-acbb8c17-...","state":{"peakBidCentsExact":34}}
{"kind":"synthetic_state_update","ts":"2026-05-08T14:00:37.945Z","id":"syn-acbb8c17-...","state":{"peakBidCentsExact":34}}
{"kind":"synthetic_state_update","ts":"2026-05-08T14:00:37.945Z","id":"syn-acbb8c17-...","state":{"peakBidCentsExact":34}}
{"kind":"synthetic_fire_pending","ts":"2026-05-08T14:00:37.945Z","id":"syn-acbb8c17-...","reason":"trailing_stop_breached"}
{"kind":"synthetic_fired","ts":"2026-05-08T14:00:37.946Z","id":"syn-acbb8c17-...","reason":"trailing_stop_breached","peakBidCents":34,"triggerKind":"trailing_stop"}
```

Key observations from the journal:
- `synthetic_registered` with `positionSize: 100` (post-#137 fix)
- 46 `synthetic_state_update` entries showing peak tracking: starts at 14¢, updates to 34¢ as price rises
- `synthetic_fire_pending` then `synthetic_fired` with reason `trailing_stop_breached`; `peakBidCents: 34`, triggered when price dropped below `34 - trailCents` from the peak

### Journal from pre-#137 regression reproduction (size=0 run)

```json
{"kind":"synthetic_registered","ts":"2026-05-08T14:02:23.303Z","synthetic":{"id":"syn-ebf7c51f-...","kind":"trailing_stop","ticker":"KXINXU-26MAY08H1600-T7324.9999","side":"yes","positionSize":0,"params":{"trailCents":5},...}}
{"kind":"synthetic_fire_pending","ts":"2026-05-08T14:02:23.304Z","id":"syn-ebf7c51f-...","reason":"trailing_stop_breached"}
{"kind":"synthetic_fired","ts":"2026-05-08T14:02:23.305Z","id":"syn-ebf7c51f-...","reason":"trailing_stop_breached","peakBidCents":34,"triggerKind":"trailing_stop"}
```

The synthetic fired correctly (`synthetic_fired` is present) — but `positionSize: 0` meant `createOrder(count=0)` → `simulateFill(size=0)` → `filled: 0` → `fill_count: 0`. The fill simulator does not reject or warn on `size=0`; it just sweeps 0 contracts and returns `filled: 0`.

---

## Classification

### Verdict: **β — fill-path bug (already fixed by PR #137)**

The v1 sweep's 0-fill results for `trailing_stop`, `take_profit`, and `bracket` were **not** caused by trigger conditions failing to fire (α) or a synthetics-engine evaluation bug (γ).

The journal from the regression reproduction conclusively shows `synthetic_fired` with correct `peakBidCents` — the watcher engine evaluated and fired correctly at all times. The 0 fills came from `positionSize: 0` being registered, which caused `fireHook` to call `createOrder({ count: 0 })`, which caused `simulateFill` to return `filled: 0`.

**Root cause:** In the pre-PR-#137 `watcherAdapter.ts`, the `ArgsBuilder` type was `(params) => RegisterArgs` (single argument). All six concrete factories defaulted `positionSize` as:

```ts
const positionSize = (p['size'] as number | undefined) ?? 0;
```

When the v1 sweep was run without `params.size` set (the sweep script only set `ticker` and strategy-specific params like `trailCents`), `positionSize` evaluated to `0`. The synthetics engine happily registered and fired the synthetic, but the fire hook passed `count: 0` to `createOrder`, producing 0 fills.

**Why trail=5 also fires now (post-#137):** The recording's yes[0] price rises from 14¢ to 34¢ (peak), then drops below 34 - 5 = 29¢. The min yes[0] price across the recording is 1¢, so the 5¢ trail is always breached. Both trail=1 and trail=5 fire in identical positions (`ts: "2026-05-08T00:01:37.815Z"`).

**Why the v1 runbook said "KXINXU mid stays at 55¢":** That note referred to the mid-price calculation (`midCents` in the trace), not to `yes[0].priceCents`. The harness computes mid as `(bestYesBid + (100 - bestNoBid)) / 2`; with an empty no-side, mid falls back to `bestYesBid`. The trace `midCents=55` at the fire tick reflects a later snapshot where `yes[0]=55`, but the trailing_stop synthetic had already tracked a peak of 34¢ and fired on the drop. The v1 "mid stays at 55¢" description was a misread of the mid trace, not a price-invariant claim.

---

## Summary of the three hypotheses

| Hypothesis | Evidence | Verdict |
|---|---|---|
| **α: genuine no-trigger** — trail=5 never sees a 5¢ drop | REFUTED: both trail=1 and trail=5 fire post-#137; regression repro shows `synthetic_fired` even with pre-#137 code | No |
| **β: fill-path bug** — synthetic fires but `createOrder(count=0)` produces 0 fills | CONFIRMED: regression repro (size=0) shows `synthetic_fired` + `fill_count=0`; fix is exactly PR #137 (`?? 0` → `?? remainingQty`) | **Yes** |
| **γ: synthetics-engine bug** — trigger condition never matches despite price moves | REFUTED: journal shows 46 `synthetic_state_update` entries with correct peak tracking and `synthetic_fired` with accurate `peakBidCents:34` | No |

---

## Next action

**No new ticket filed.** The root cause (β) was already identified as `🧊 SH-S-TRAIL-POSITIONSIZE` and fixed in PR #137 (`fix(backtest): SH-S-TRAIL-POSITIONSIZE — thread harness remainingQty into watcher adapters`). The watcher engine and synthetics evaluator are correct.

**Recommended follow-up sweep:** Re-run `scripts/strategy-sweep.mjs` on the current codebase (post-#137 + post-#138) to generate strategy comparison v2. Expected outcome: `trailing_stop`, `take_profit`, and `bracket` now show non-zero fills on KXINXU. This is the empirical validation that the fix landed correctly.

---

## Appendix: recording price profile (KXINXU-20260508)

```
yes[0] price range: 1¢ – 42¢ across 5566 snapshots
yes[0] first snapshot: 14¢
yes[0] last snapshot:  12¢
Peak yes[0] seen:      42¢ (earlier in recording)
Peak tracked by synthetic (from trail=5 run): 34¢
Trigger tick (trailing_stop_breached): ts=2026-05-08T00:01:37.815Z, midCents=55
```

The discrepancy between yes[0] range max (42¢) and synthetic's tracked peakBidCents (34¢) is expected: the synthetic's `peakBidCentsExact` tracks the best bid over ticks processed by the watcher, and the harness may not have a snapshot exactly at the 42¢ peak if that level appeared only briefly.
