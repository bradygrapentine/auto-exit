# Alerts Layer — Synthetics That Notify Instead Of Fire (Spec)

**Status:** Draft, 2026-05-05
**Author:** Brady (with Claude Code)
**Story ID (proposed):** SH-ALERTS (sequenced after SH-WATCH; reuses watcher infra).
**Related:** `2026-05-05-synthetic-order-types-watcher.md` (SH-WATCH — watcher daemon, evaluator pattern, journal). `2026-05-05-strategy-trigger-pairings.md` (long-term three-layer engine). `BACKLOG.md` SH-3.

---

## 1. Goal

Bring **conditional notifications** to Kalshi positions and watchlist tickers — "ping me when X happens" — using the same per-position watcher daemon SH-WATCH ships. Same poll loop, same evaluator pattern, same NDJSON journal. Different terminal action: instead of invoking `exitRunner.run()` / `buyRunner.run()`, the watcher invokes an `AlertHook` that delivers a notification through a configured channel (webhook, desktop, email, browser-extension toast).

The decision **stays with the operator.** The system watches; the human decides.

## 2. Why this matters — the labor outsourced

Synthetics (SH-WATCH) commit the operator to a decision *in advance*: "if YES bid drops to 42¢, sell." That's the right shape when the operator already knows what they'd do. Many situations don't fit that shape:

- **Decision-reserving observation.** "I want to know when KXMETGALA-LAD top YES bid drops below 5¢, but I'll decide *then* whether to add, exit, or hold — depends on context I can't preconfigure." A synthetic stop-loss is wrong here; an alert is right.
- **Watchlist surveillance** without a position. "Ping when basis-arb opens on any market in my watchlist." No position exists yet, so `autoCancelOnZeroPosition` (SH-WATCH §10 decision 2, line 195) doesn't apply — alerts are the natural surface.
- **Risk dashboards.** "Notify when my portfolio mark-to-bid drawdown exceeds 10%." Operator wants the heads-up, not an automated unwind.
- **Thesis-flip prompts.** "Tell me if this market trades through my entry by 8¢" — a manual review trigger, not a stop.

Synthetics and alerts are **complementary, not redundant.** Operators want both. The same condition (e.g. "top YES bid ≤ 42¢") can be wired as a synthetic *or* an alert; the operator chooses commitment vs. reservation per case.

This is also the **lowest-friction observability win** before the long-term continuous engine in `strategy-trigger-pairings.md` lands. Alerts ship value the day the watcher daemon does.

## 3. Architecture — alert as a watcher with an `AlertHook` terminal action

The alerts layer is **not a new daemon.** It's a new terminal-action shape on the SH-WATCH watcher. Mirrors the architecture in SH-WATCH §3 (lines 36–63).

```
┌──────────────────────────────────────────────────────────────┐
│  kea watch (SH-WATCH daemon — unchanged loop)                 │
│                                                                │
│  Registry now holds two registered-entity shapes:              │
│    Synthetic { id, ticker, kind, params, action: 'fire' }      │
│    Alert     { id, ticker, kind, params, action: 'notify',     │
│                channels: [...], cooldownMs, dedupKey }         │
│                                                                │
│  poll(ticker, intervalMs) → orderbook                          │
│  evaluate(entity, orderbook) → fired? | new state              │
│    if fired && action == 'fire':   strategy runner (SH-WATCH)  │
│    if fired && action == 'notify': AlertHook.deliver(channels) │
│  persist(state) → .kea/watchers.ndjson                         │
└──────────────────────────────────────────────────────────────┘
```

**Properties (inherited from SH-WATCH §3 lines 56–63):**

- One watcher per `(ticker, entity-id)`. Synthetics and alerts on the same ticker share the poll.
- Adaptive cadence (lines 58–59): default 2s; faster near trigger, slower when far.
- Crash-safe: same `watchers.ndjson` journal (lines 60, 198). Alerts replay-resurrect identically.
- Idle-when-empty: zero registered entities → daemon sleeps.
- Audit: a new `'alert_fired'` JournalKind entry mirrors `'synthetic_fired'` (lines 63, 143, 158).

**Properties unique to alerts:**

- **Terminal action is `AlertHook.deliver()`**, not a runner invocation. Hook signature: `(alert, snapshot) → Promise<DeliveryResult>`.
- **Multi-channel fan-out per fire.** A single alert may target webhook + desktop simultaneously. Failures are per-channel; one channel failing doesn't block the others.
- **Cooldown + dedup state lives on the alert** (not on the channel). See §9 design decisions.
- **No position required.** Watchlist alerts (e.g. basis-arb scanner) attach to a ticker independent of `quantity`. The `autoCancelOnZeroPosition` rule from SH-WATCH §10 decision 2 (line 195) is opt-in for alerts, default `false`.

## 4. v1 alert types

Mirrors the SH-WATCH v1 set (§4, lines 65–102). Each is a small evaluator over `(orderbook, state, params) → { fired: bool, state' }`. Evaluators live in `src/alerts/<name>.ts`. **Where the evaluator math is identical to a synthetic, we reuse the synthetic's evaluator function** — the difference is purely the terminal action wiring.

### 4.1 Price-cross alert (mirrors SH-WATCH §4.1 stop-loss, lines 69–73)
- **Params:** `direction: 'below' | 'above'`, `triggerPriceCents`, `side: 'yes' | 'no'`, `priceSource: 'top_bid' | 'top_ask' | 'mid'`.
- **Evaluate:** if observed price crosses `triggerPriceCents` in the configured direction → fire.
- **Notify payload:** ticker, observed price, threshold, direction, timestamp, link to Kalshi market.
- **Use case:** "ping when KXMETGALA-LAD top YES bid drops below 5¢."

### 4.2 Trailing-distance alert (mirrors SH-WATCH §4.3 trailing stop, lines 79–87)
- **Params:** `trailCents`, `direction: 'fall_from_peak' | 'rise_from_trough'`, `side`.
- **State:** `peakBidCents` / `troughBidCents`.
- **Evaluate:** identical math to trailing-stop (line 82–86); fires when observed price moves `trailCents` against the running extreme.
- **Notify payload:** peak/trough seen, current price, distance, watch duration.
- **Use case:** "tell me when YES bid has fallen 8¢ from its peak this session" — a thesis-flip prompt.

### 4.3 Take-profit alert (mirrors SH-WATCH §4.4, lines 89–92)
- **Params:** `triggerPriceCents`, `side`.
- **Evaluate:** if `topYesBidCents ≥ triggerPriceCents` → fire (or `≤` for shorts).
- **Notify payload:** unrealized P&L if a position exists, else just price/threshold.
- **Use case:** "ping me when this trades through 80¢ so I can decide whether to scale out manually."

### 4.4 Time-based alert (new shape — no exact SH-WATCH equivalent; see S-time-stop, line 113)
- **Params:** `deadlineTimestamp`, optional `condition` (e.g. "and price still below targetPriceCents").
- **Evaluate:** if `now ≥ deadline` and (optional) `condition` holds → fire.
- **Notify payload:** condition state at deadline, price, time-to-resolution.
- **Use case:** "at T-30min on this market, ping me with current price and my mark." Heads-up for pre-event de-risking review (the gamma-scalping pre-event sleeve from MEMORY).

### 4.5 Basis-arb-opens alert (new — alert-only; no synthetic counterpart in SH-WATCH v1)
- **Params:** `tickers: [...]` (set or watchlist ref), `minSpreadCents`.
- **Evaluate:** for each ticker pair / complementary contract, compute basis (YES bid + NO bid - 100¢ floor; or rung-vs-leg basis); if `|basis| ≥ minSpreadCents` → fire.
- **Notify payload:** which tickers, computed basis, both legs' top-of-book.
- **Use case:** "ping when basis-arb opens on any market in my watchlist." Watchlist surveillance shape; no position required, `autoCancelOnZeroPosition: false`.
- **Note:** this is the one v1 alert with no synthetic mirror; SH-WATCH §4 didn't include a multi-ticker basis evaluator. The watcher poll loop handles it by registering the alert across each constituent ticker and aggregating in the evaluator.

### 4.6 Mark-to-bid drawdown alert (new — alert-only; portfolio-meta shape)
- **Params:** `scope: 'position' | 'portfolio'`, `drawdownPct` or `drawdownCents`, optional `costBasisOverride`.
- **State:** rolling peak mark-to-bid value.
- **Evaluate:** compute current MTB; if `(peakMTB - currentMTB) / peakMTB ≥ drawdownPct` → fire.
- **Notify payload:** peak MTB, current MTB, drawdown %, contributing positions (portfolio scope).
- **Use case:** "notify when my position's mark-to-bid drawdown exceeds 10%." Portfolio scope is the alert-layer analog to `S-portfolio-stop` (SH-WATCH line 125), but observation-only — no automatic cash-raise. Multi-ticker; flagged as v1 *position*-scope, *portfolio*-scope deferred to v2 alongside the SH-WATCH portfolio-stop work.

**v1 set summary (six alerts):** price-cross, trailing-distance, take-profit, time-based, basis-arb-opens, mark-to-bid drawdown (position scope).

## 5. Delivery channels

An `AlertHook` fans out to one or more channels. v1 ships **two** to keep surface area small; the rest are scaffolded behind feature flags.

### 5.1 Webhook (v1)
- Generic POST to a configured URL with a JSON payload (alert id, type, ticker, observed values, snapshot, timestamp).
- Slack and Discord both accept generic webhook POSTs with a `text` field; v1 ships a single webhook adapter with a Slack/Discord-compatible payload shape and a configurable URL list.
- Per-channel timeout (default 5s) and retry (1 retry on 5xx; no retry on 4xx) to avoid blocking the watcher poll.
- Auth: bearer-token header optional; URLs may carry signed paths (Slack/Discord style).

### 5.2 Desktop notification via local daemon (v1)
- Delivered through a small local notify shim. macOS: `osascript display notification` shellout; Linux: `notify-send`; Windows: deferred.
- Synchronous best-effort; failures logged but never block the watcher loop.
- Click-through opens the Kalshi market URL in the default browser (best-effort).

### 5.3 Email (v2)
- SMTP via env-configured relay or a transactional API (Postmark/Resend) — choice deferred.
- Higher latency tolerance; batchable digest mode for non-urgent alerts.

### 5.4 Browser extension toast (v2)
- The auto-exit Chrome extension already overlays Kalshi pages (see EX-1/EX-2, EX-3, EX-6 in recent commits).
- An `alert_fired` event from the watcher daemon → extension via the existing message channel → in-page toast on the relevant market.
- Sequenced after `SH-WATCH-ext` (SH-WATCH lines 152–153) since it shares the extension messaging surface.

**v1 ships channels 5.1 + 5.2.** v2 layers email + extension toast.

## 6. File-touch boundary

Mirrors the SH-WATCH file-touch boundary (§6, lines 127–149); strictly additive where possible.

**New files:**
- `src/alerts/index.ts` — registry / dispatch table for alert evaluators (parallels `src/synthetics/index.ts`, line 137).
- `src/alerts/priceCross.ts`
- `src/alerts/trailingDistance.ts`
- `src/alerts/takeProfit.ts`
- `src/alerts/timeBased.ts`
- `src/alerts/basisArbOpens.ts`
- `src/alerts/markToBidDrawdown.ts`
- `src/alerts/hook.ts` — `AlertHook` interface, fan-out logic, per-channel timeout/retry.
- `src/alerts/channels/webhook.ts` — Slack/Discord-compatible POST.
- `src/alerts/channels/desktop.ts` — local notify shim (mac/linux).
- `src/alerts/channels/index.ts` — channel registry.
- `src/alerts/dedup.ts` — cooldown + dedup-key state.
- `test/alerts/*.test.ts` — per-evaluator unit tests with synthetic price walks (mirrors SH-WATCH line 140).
- `test/alerts/channels.test.ts` — channel timeout/retry/fan-out tests.

**Modified files (extending SH-WATCH surfaces):**
- `src/types.ts` — add `Alert`, `AlertState`, `AlertKind`, `AlertChannel`, `AlertHookConfig`, `'alert_fired'` JournalKind. (SH-WATCH already adds `Synthetic*` types here per line 143.)
- `src/watcher.ts` — extend the registry to hold `Synthetic | Alert` discriminated by `action` field; route fired entities to runner-vs-hook. (SH-WATCH owns this file per line 130; alerts extend it.)
- `src/watcherJournal.ts` — same NDJSON, new entry kinds (`alert_registered`, `alert_fired`, `alert_cancelled`). (SH-WATCH owns per line 138.)
- `src/cli.ts` — add `kea alert {register, list, cancel, status, snooze, mute}` subcommands (parallels `kea watch ...`, lines 144).
- `src/index.ts` (MCP server) — add tools `kea_alert_register`, `kea_alert_list`, `kea_alert_cancel`, `kea_alert_get`, `kea_alert_snooze`. Mirrors SH-WATCH MCP surface (line 145).

**Reuse (no new copy):**
- The trailing-distance and price-cross evaluators **import the synthetic evaluator math** from `src/synthetics/trailingStop.ts` and `src/synthetics/stopLoss.ts` — the difference is purely terminal action. Avoids duplicate state-machine code.

**No changes to:**
- `exitRunner.ts`, `buyRunner.ts`, `harvestPlanner.ts`, `safety.ts`, `runnerUtils.ts` — alerts never invoke runners (matches SH-WATCH line 148).

## 7. Phased rollout

**Decision: SH-ALERTS is its own story sequenced *after* SH-WATCH lands.** Not a Phase-6 of SH-WATCH. Reasons:

1. SH-WATCH file-touch boundary is already non-trivial (11 new files, 3 modified). Bundling alerts grows the diff past comfortable review size.
2. Alerts add a separate concern (channel delivery, retries, dedup, cooldown) that wants its own test surface and review pass.
3. The watcher daemon and journal need to be observed in the wild (decisions 1, 5 of SH-WATCH §10 — cadence and journal format — are explicitly "revisit after first real-world fires") before extending. Letting SH-WATCH bake one cycle de-risks alerts.

**Phase 1 — Core (SH-ALERTS, this story).** Six alert evaluators, two channels (webhook + desktop), CLI + MCP tools, dedup/cooldown/snooze. Internally usable by LLM operator immediately.

**Phase 2 — Extension toast + email** (`SH-ALERTS-ext`, `SH-ALERTS-email`). Folds into the same Phase 2 timeframe as `SH-WATCH-ext` since it shares messaging surface.

**Phase 3 — Alert→synthetic upgrade button.** UI affordance that converts an alert into a synthetic with the same params (alerts/synthetics are unified at the registry level — see §9 decision 4 — so this is metadata-only). Lets operators "graduate" a watched condition once they're ready to commit a decision in advance.

**Phase 4 — Continuous-engine integration.** Once the long-term `strategy-trigger-pairings.md` analysis modules exist, alerts become the natural notify-only surface for any analysis output (regime flip, EV-edge crossing, etc.). Alerts layer is the OBSERVE-ONLY tier of that three-layer engine.

## 8. Resolved design decisions

1. **Rate limiting / dedup.** Each alert carries a `dedupKey` (default: `${alertId}:${roundedPriceTier}`). The watcher tracks `lastFiredAt` per key in `watchers.ndjson`. A new fire with the same key inside `cooldownMs` is **suppressed** (logged as `alert_suppressed`, not delivered). Default `cooldownMs: 60_000`. Prevents the classic "price oscillates around threshold and pages 40 times in 30 seconds" failure mode.

2. **Cooldown after fire.** Default `cooldownMs: 5 * 60_000` (5 min) for price-cross / take-profit / drawdown alerts. Trailing-distance alerts use `cooldownMs: 0` because the state-machine reset (peak/trough re-anchoring) already de-bounces. Time-based alerts auto-unregister after firing once. Per-alert override allowed.

3. **Snooze.** First-class operator action: `kea alert snooze <id> <duration>` and `kea_alert_snooze` MCP tool. Sets `snoozeUntil` on the alert; evaluator continues running but `AlertHook.deliver()` short-circuits while `now < snoozeUntil`. Avoids "I know, I know, stop pinging me" frustration during volatile sessions. Snooze is preferable to mute because it auto-expires.

4. **Alert ↔ trigger toggle on the same condition.** Alerts and synthetics are unified at the registry level via the discriminated `action: 'fire' | 'notify'` field on each entry. This means:
   - Same evaluator math (price-cross, trailing-distance, take-profit) backs both.
   - Operators can convert alert → synthetic (or vice versa) via `kea alert promote <id>` / `kea watch demote <id>` without re-entering params. Pure metadata flip + re-anchor of state.
   - A single condition can be registered as **both** simultaneously (different ids) — e.g. an alert at 50¢ ("heads up") and a synthetic stop-loss at 42¢ ("auto-exit"). Both run, each with its own cooldown and journal entry.

5. **Multi-channel fan-out semantics.** Channels in an alert's `channels: [...]` array all fire on each trigger. A failed channel does **not** prevent other channels from firing and does **not** count as "didn't fire" for cooldown purposes — the fire happened, cooldown engages, the channel just had a delivery failure (logged + retried per channel).

6. **Auto-cancel on zero position — opt-in for alerts (inverted from synthetics).** SH-WATCH defaults `autoCancelOnZeroPosition: true` (line 195). Alerts default to `false` because watchlist surveillance and basis-arb scanners explicitly attach to tickers without positions. Operator opts in per-alert when registering a position-attached alert.

7. **Journal format — same `watchers.ndjson`.** Same file as SH-WATCH (line 198); new entry kinds (`alert_registered`, `alert_fired`, `alert_suppressed`, `alert_snoozed`, `alert_cancelled`). Single replay path on daemon restart.

8. **Naming.** `kea alert ...` CLI (parallel to `kea watch ...`). `alertKind: 'price_cross' | 'trailing_distance' | 'take_profit' | 'time_based' | 'basis_arb_opens' | 'mtb_drawdown'`. Story id `SH-ALERTS`.

## 9. Open questions

1. **Webhook payload schema versioning.** Should v1 ship a versioned envelope (`{v: 1, kind: 'alert_fired', ...}`) so future schema changes don't break operator-side Zapier/Make automations? Lean yes; cheap to add.

2. **Desktop click-through to extension vs. browser.** When the operator clicks a desktop notification, should it open the Kalshi market in their default browser (simple, v1) or message the auto-exit extension to scroll/highlight the relevant market in an existing tab (richer, depends on extension tab discovery)? v1 ships browser-open; richer behavior tracks `SH-ALERTS-ext`.

3. **Portfolio-scope drawdown alert.** Position-scope is straightforward and ships in v1. Portfolio-scope requires the watcher to subscribe to N tickers and aggregate — same dependency as SH-WATCH's `S-portfolio-stop` (line 125). Should portfolio-scope drawdown alert ship as part of SH-ALERTS v1 or wait for the SH-WATCH multi-ticker work? Lean **defer to v2** to keep SH-ALERTS shippable.

4. **Alert-on-fill / alert-on-cancel.** Alerts that fire on lifecycle events of operator orders (a fill happens; a GTC cancels). Different shape — not a watcher-poll evaluator; subscribes to journal events instead. Likely a separate sub-shape (`OrderEventAlert`) deferred to v2 unless trivial.

5. **Mute vs. snooze.** §8 decision 3 ships snooze. Do we also need indefinite mute? Lean no — `kea alert cancel` covers indefinite-stop; snooze covers temporary. Avoids three states (active / snoozed / muted) that confuse operators.

6. **Per-channel rate limiting.** Webhook providers (Slack at 1 msg/sec/channel) may rate-limit before our cooldown kicks. Should the channel adapter implement its own queue/backoff, or trust operator-side cooldown tuning? Lean trust-cooldown for v1; revisit if rate-limit errors show up.

7. **Snapshot freshness in payload.** Alert payloads include the orderbook snapshot at fire time. If the channel delivery is retried after a 5xx, the payload may now be 30+ seconds stale. Re-snapshot on retry, or ship the original? Lean ship-original with a `snapshotAt` timestamp; the operator can re-query.

## 10. Roadmap position

In the long-term three-layer engine sketched in `2026-05-05-strategy-trigger-pairings.md`:

- **Layer 1 (analysis / observation):** alerts live here. Notify-only surfaces.
- **Layer 2 (commitment):** synthetics (SH-WATCH) live here. Pre-committed automated decisions.
- **Layer 3 (continuous strategy engine):** the long-term north star. Composes layer 1 signals + layer 2 commitments.

SH-ALERTS is the cleanest first slice of layer 1 because it reuses SH-WATCH infra wholesale and ships visible operator value (Slack pings, desktop notifs) on the day it lands. It's also the platform the long-term continuous-engine analysis modules will plug into when they exist — every new analysis output is "just another alert evaluator."

**Sequence summary:**
1. SH-WATCH lands (Phase 1, six synthetics + watcher daemon).
2. SH-WATCH bakes one cycle in real use (validate cadence + journal — SH-WATCH §10 decisions 1, 5).
3. SH-ALERTS lands (this story).
4. SH-WATCH-tui / SH-WATCH-ext / SH-ALERTS-ext / SH-ALERTS-email layer in parallel.
5. Long-term continuous engine builds on top, contributing new alert evaluators as analysis matures.

## 11. Recommended next steps

1. Review this spec; confirm the v1 set of six alert types, the channels-v1 selection (webhook + desktop), and the resolved design decisions in §8.
2. Sequence SH-ALERTS in `BACKLOG.md` immediately after SH-WATCH; do not bundle.
3. Phase 1 implementation plan to be drafted separately (test-driven; one Phase-1 plan doc per the writing-plans skill).
