# Synthetic Order Types via Per-Position Watcher (Spec)

**Status:** Draft, 2026-05-05
**Author:** Brady (with Claude Code)
**Story ID (proposed):** SH-WATCH (one shared-track story, supersedes the SH-2.5/2.7/3 sequence in the strategy-trigger-pairings doc as the *first* slice — that broader vision remains the long-term north star).
**Related:** `2026-05-05-strategy-trigger-pairings.md` (long-term three-layer engine), `BACKLOG.md` SH-3 (trigger daemon), `harvestPlanner.ts`, `exitRunner.ts`, `buyRunner.ts`.

---

## 1. Goal

Bring **standard stock-market order types** — trailing stop, stop-loss, stop-limit, take-profit, OCO, bracket — to Kalshi by simulating them client-side on top of the only primitives Kalshi natively exposes (`limit` + `market` + GTC/IOC/FOK).

These synthetics serve **two audiences in parallel:**

1. **End-user / operator (first-class UI feature).** Synthetic order types are exposed directly in the TUI, MCP, and extension as a standalone product capability — "Kalshi doesn't have trailing stops; auto-exit does." A user places a trailing stop on a position the same way they'd place one in Robinhood or IBKR. This is the headline feature; the value proposition is filling a gap Kalshi itself doesn't fill.
2. **Internal building block for exit strategies.** The same synthetic primitives compose into new auto-exit strategies (S-trail, S-bracketed-exit, etc. — see §5). The strategy library reuses the same evaluator code; no duplication.

Each synthetic order is owned by a lightweight **per-position watcher** that polls a single ticker, evaluates one trigger condition, and fires the appropriate execution path when crossed. Watchers are independent, idle-when-empty, and persist across restarts.

**Non-goal for this story:** continuous market analysis, regime classification, EV-edge math, multi-ticker engine, full SH-3 trigger daemon. Those remain on the long-term roadmap (see strategy-trigger-pairings doc) and may layer on top of this once it's running.

## 2. Why this matters — Kalshi native gap (validated 2026-05-05)

Direct read of Kalshi's OpenAPI spec at `docs.kalshi.com/openapi.yaml` (`CreateOrderRequest` schema, validated 2026-05-05):

- **`type` enum:** `limit` | `market`. Two values.
- **`time_in_force` enum:** `fill_or_kill` | `good_till_canceled` | `immediate_or_cancel`. Three values.
- **Modifiers available:** `expiration_ts` (GTT auto-cancel), `client_order_id`, `self_trade_prevention_type`, `reduce_only`, `yes_price_dollars` / `no_price_dollars`.
- **Not in the schema:** stop-loss, stop-limit, trailing-stop, take-profit, conditional, triggered, bracket, OCO. Zero references.

Kalshi gives you a primitive limit book. Every "stop"-style order TradFi traders expect must be built client-side. Today auto-exit doesn't have any of them — operators must watch positions manually (e.g., today's KXMETGALA-26-LAD, where the algo's edge was lost because the floor pinned before manual intervention).

This story closes that gap.

## 3. Architecture — per-position watcher

```
┌──────────────────────────────────────────────────────────────┐
│  kea watch (CLI / daemon)                                     │
│                                                                │
│  Maintains a registry of active synthetics:                    │
│    [ { id, ticker, type, params, state } , ... ]               │
│                                                                │
│  For each, runs an independent watcher loop:                   │
│    poll(ticker, intervalMs) → orderbook                        │
│    evaluate(synthetic, orderbook) → fired? | new state        │
│    if fired: launch strategy (S-losing / S7 / S2 / etc.)       │
│    persist(state) → .kea/watchers.ndjson                       │
│                                                                │
│  Idle-when-empty: zero registered → daemon sleeps,             │
│  no API calls. Wake on register/start.                         │
└──────────────────────────────────────────────────────────────┘
```

**Properties:**

- **One watcher per (ticker, synthetic-id)**. Two synthetics on the same ticker share the poll, not duplicate it.
- **Adaptive cadence**: default 2s; faster (250ms–1s) for synthetics nearing trigger; slower (5–10s) when far from threshold or in dormant markets. Configurable per synthetic.
- **Crash-safe state**: append-only NDJSON journal at `~/.kalshi-exit-assistant/watchers.ndjson`. On restart, replay → resurrect watchers → resume polling.
- **Strategy invocation**: when triggered, the watcher invokes an existing engine entry point (`exitRunner.run()`, `buyRunner.run()`, etc.) with the appropriate config. The synthetic chooses the *execution algorithm*, not just the firing price.
- **No multi-ticker analysis**, no regime classifier, no "live data engine" surface. This is a focused per-position primitive.
- **Audit**: every fire writes a `'synthetic_fired'` JournalKind entry compatible with the existing journal/replay format.

## 4. Synthetic order types (v1 set)

Each is a small evaluator over `(orderbook, state, params) → { fire: bool, state' }`. Implementations live in `src/synthetics/<name>.ts`.

### 4.1 Stop-loss
- **Params:** `triggerPriceCents`, `executionStrategy` (default `S-losing`), optional `executionParams`.
- **Evaluate:** if `topYesBidCents ≤ triggerPriceCents` → fire.
- **Fires:** invoke `S-losing` (or specified strategy) with full position size.

### 4.2 Stop-limit
- **Params:** `triggerPriceCents`, `limitPriceCents`, `size`.
- **Evaluate:** if `topYesBidCents ≤ triggerPriceCents` → fire.
- **Fires:** post a passive `limit` GTC at `limitPriceCents`. (Doesn't escalate; classic stop-limit semantics.)

### 4.3 Trailing stop **(headline feature)**
- **Params:** `trailCents`, `executionStrategy` (default `S-losing`), optional `floorPriceCents` (clamp).
- **State:** `peakBidCents` (initialized to current top bid).
- **Evaluate per tick:**
  - Update `peakBidCents = max(peakBidCents, topYesBidCents)`.
  - Compute `stopPrice = max(peakBidCents − trailCents, floorPriceCents ?? 1)`.
  - If `topYesBidCents ≤ stopPrice` → fire.
- **Fires:** invoke `S-losing` with full position.
- **Variant — chandelier/ATR trail:** `trailCents` replaced by `trailMultiplier × realizedRange`, where `realizedRange` is computed from the watcher's local orderbook history window (still single-ticker). v1 ships fixed-cents trail; ATR variant is v2.

### 4.4 Take-profit
- **Params:** `triggerPriceCents`, `executionStrategy` (default `S7` scale-out, fall back to `S1` passive), optional rung table.
- **Evaluate:** if `topYesBidCents ≥ triggerPriceCents` → fire.
- **Fires:** invoke take-profit strategy (rung-driven if rungs supplied).

### 4.5 OCO (one-cancels-other)
- **Params:** `legs: [synthetic, synthetic]` — typically a stop-loss + take-profit pair.
- **Behavior:** both watchers run in parallel; first to fire cancels the sibling and unregisters it.
- **Use case:** "exit at either +20¢ profit or −10¢ loss, whichever first."

### 4.6 Bracket
- **Params:** `entry: { strategy, params }`, `takeProfit: { triggerPriceCents }`, `stopLoss: { triggerPriceCents }`.
- **Behavior:** fire entry strategy; on entry fill, register OCO over (take-profit + stop-loss) with the filled size. One armed unit covers the whole position lifecycle.
- **Use case:** Kalshi-native version of "set entry + auto-manage exits."

## 5. New strategies unlocked

Once synthetics exist, new strategies fall out naturally — they're just synthetics with prefilled defaults or compositions. Some are net-new in this codebase (no equivalent in S1–S16):

### Exit strategies

- **S-trail (Trailing exit)** — synthetic 4.3 with `trailCents` configured to operator preference. Lets winners run; auto-locks gains. Today's most-asked-for missing primitive.
- **S-chandelier (ATR-trailing exit)** — v2 of S-trail; trail distance scales with realized range. For high-vol Kalshi markets where fixed-cents trail whips out.
- **S-step-trail (Discretized trail)** — trail moves up only when peak crosses configured rung (e.g., every 5¢). Less whipsaw in choppy markets near 50¢.
- **S-time-stop (Deadline-based stop)** — exit if `topYesBidCents` hasn't crossed `targetPriceCents` by `deadlineTimestamp`. "Get me out if this isn't working by Tuesday."
- **S-bracketed-exit (Take-profit + stop-loss bundle)** — synthetic 4.6 wrapped around an existing position. Set-and-forget management.
- **S-conditional-roll** — at `T-N hours`, evaluate `topYesBidCents`; if in target zone, fire `S11 Roll`; else fire `S-losing`. Branches on price near expiry.

### Entry strategies (auto-exit currently has only `buyRunner` — no triggered entries)

- **S-buy-stop (Breakout entry)** — buy when `topYesAskCents ≥ triggerPriceCents`. Momentum entry; auto-exit currently can't do this.
- **S-buy-dip (Retrace entry)** — buy when `topYesAskCents ≤ peakAsk − dipCents`. Mean-reversion entry.
- **S-scaled-entry (DCA ladder)** — limit-ladder for buys; pre-place at multiple price levels, fill as bids reach each rung. (Mirror of S8 for entries.)

### Portfolio / meta strategies

- **S-portfolio-stop** — single synthetic that watches *aggregate* mark-to-bid across N positions; fires `S10 cash-raise` (or full liquidation) if total drawdown exceeds X%. Meta risk-control. Requires watcher to subscribe to multiple tickers; flagged for v2.

## 6. File-touch boundary

**New files:**
- `src/watcher.ts` — daemon registry, poll loop, dispatch.
- `src/synthetics/stopLoss.ts`
- `src/synthetics/stopLimit.ts`
- `src/synthetics/trailingStop.ts`
- `src/synthetics/takeProfit.ts`
- `src/synthetics/oco.ts`
- `src/synthetics/bracket.ts`
- `src/synthetics/index.ts` — registry / dispatch table.
- `src/watcherJournal.ts` — NDJSON persistence for watcher state.
- `test/watcher.test.ts` — synthetic price walks for each type.
- `test/synthetics/*.test.ts` — per-synthetic unit tests.

**Modified files:**
- `src/types.ts` — add `Synthetic`, `SyntheticState`, `SyntheticKind`, `WatcherConfig`, `'synthetic_fired'` JournalKind.
- `src/cli.ts` — add `kea watch start`, `kea watch register`, `kea watch list`, `kea watch cancel <id>`, `kea watch status`.
- `src/index.ts` (MCP server) — add tools `kea_synthetic_register`, `kea_synthetic_list`, `kea_synthetic_cancel`, `kea_synthetic_get`.

**No changes to:**
- `exitRunner.ts`, `buyRunner.ts` — they're invoked unchanged.
- `harvestPlanner.ts`, `safety.ts`, `runnerUtils.ts` — untouched.

**Follow-up stories (carved out, sequenced after SH-WATCH lands):**
- `SH-WATCH-tui` — TUI surface: synthetics tab listing active watchers per position with type, params, current state (e.g. peak for trailing stops), trigger countdown, manual cancel. New synthetic from a position row.
- `SH-WATCH-ext` — extension surface: per-position right-click "place trailing stop / stop-loss / take-profit" menu; live indicator badge when a synthetic is armed; toast on fire.
- `SH-WATCH-mcp-rich` — richer MCP tool set beyond the basic register/list/cancel/get (e.g. `kea_synthetic_preview` to dry-run a trigger, `kea_bracket_arm` convenience tool).

## 7. Tasks

- [ ] Add types to `src/types.ts` (`Synthetic`, `SyntheticState`, `SyntheticKind`, `WatcherConfig`, `'synthetic_fired'` JournalKind).
- [ ] Implement `src/watcher.ts` daemon loop with adaptive cadence + idle-when-empty.
- [ ] Implement six synthetic evaluators in `src/synthetics/*.ts`.
- [ ] Implement `src/watcherJournal.ts` (append-only, replay-on-start).
- [ ] Wire fire → `exitRunner.run()` / `buyRunner.run()` invocation paths.
- [ ] CLI subcommands: `kea watch {start, register, list, cancel, status}`.
- [ ] MCP tools mirroring CLI subcommands (4 tools).
- [ ] Per-synthetic unit tests with synthetic price walks (≥ 3 scenarios per synthetic).
- [ ] Integration test: register synthetic → simulate price walk → assert correct strategy invoked with correct params.
- [ ] Crash-recovery test: kill watcher mid-poll → restart → confirm all watchers resurrected.
- [ ] OCO atomicity test: race two siblings, confirm exactly one fires.
- [ ] `npm test && npm run typecheck && npm run lint` green.
- [ ] Spec review pass.
- [ ] Code review pass.

## 8. Internal parallelism

After types land, three Sonnet dispatches in parallel:

- **Dispatch A:** stop-loss + stop-limit + take-profit (the three simplest evaluators) + watcher daemon skeleton.
- **Dispatch B:** trailing stop (state machine + peak tracking) + OCO (sibling-cancel mechanic).
- **Dispatch C:** bracket (compositional, depends on OCO) + watcherJournal + crash-recovery test. Lands last.

CLI + MCP wiring done in main session after dispatches merge.

## 9. Out of scope (explicit non-goals)

- Continuous market analysis / regime classifier / EV-edge live computation — see long-term doc.
- Multi-ticker portfolio analytics — `S-portfolio-stop` shape is sketched but deferred to v2.
- News-feed / external thesis-flip signals.
- TUI surfaces for synthetics (separate story).
- ATR / volatility-adaptive trailing — v2 of S-trail.
- Pre-trade risk hooks on synthetic-fired orders (already exist in SH-2 layer; the watcher just calls runners that already invoke risk checks).

## 10. Resolved design decisions (from 2026-05-05 review)

1. **Default poll cadence**: open. Default 2s with adaptive override (250ms when within ~3¢ of trigger, 5–10s when far off / dormant). Revisit after first real-world fires inform what's actually needed; cadence is configurable per synthetic so tuning post-ship is cheap.
2. **Auto-cancel on zero position** — **YES.** Default `autoCancelOnZeroPosition: true`. If the operator manually exits a position the watcher is monitoring, the watcher detects `quantity == 0` on next poll and unregisters itself. Cleanup is automatic.
3. **Multiple synthetics on one position** — **YES, explicitly allowed.** Operators can stack (e.g. trailing stop + ceiling take-profit + hard floor stop-loss). Watchers on the same ticker share the poll. OCO is the only construct that introduces sibling-cancel semantics; otherwise stacked synthetics are independent.
4. **Self-trade prevention** — **default `taker_at_cross`.** All synthetic-fired orders pass `self_trade_prevention_type: "taker_at_cross"` unless the synthetic config explicitly overrides. Errs on safety: cancels the incoming taker rather than executing against another of the operator's own resting orders.
5. **Replay journal format** — **separate `watchers.ndjson`.** Different lifecycle (long-lived vs per-job), different consumers (watcher daemon vs exit/buy runners). Co-locates with existing journal at `~/.kalshi-exit-assistant/watchers.ndjson`.
6. **Naming** — **"synthetic"** order types. Honest about what they are (we're synthesizing types Kalshi doesn't natively offer). CLI surface: `kea watch ...`. Type field on each: `syntheticKind: 'stop_loss' | 'stop_limit' | 'trailing_stop' | 'take_profit' | 'oco' | 'bracket'`.

## 11. Roadmap

**Phase 1 — Core (this story, SH-WATCH)**
Watcher daemon + six synthetic evaluators + CLI + basic MCP tools + crash-safe journal. No UI surfaces. Internally usable; LLM operator can register synthetics via MCP today.

**Phase 2 — User-facing surfaces (SH-WATCH-tui, SH-WATCH-ext, SH-WATCH-mcp-rich)**
Make synthetic order types a first-class product feature visible everywhere the operator already lives:
- **TUI**: synthetics tab listing active watchers per position; current state (peak for trailing stops), trigger countdown, manual cancel, "place new synthetic" wizard from a position row.
- **Extension (Kalshi web overlay)**: per-position right-click "place trailing stop / stop-loss / take-profit / bracket" menu; live armed-badge on positions with active synthetics; in-page toast on fire.
- **MCP rich tools**: `kea_synthetic_preview` (dry-run a trigger), `kea_bracket_arm` (convenience for the compositional case), `kea_trailing_status` (live peak/distance readout).
These ship value to humans, not just to the strategy library.

**Phase 3 — Strategy library integration (folds into existing Phase 7 / S-library plan)**
Wire the new synthetics into composed strategies (S-trail, S-bracketed-exit, S-time-stop, S-conditional-roll, S-buy-stop, S-buy-dip, S-scaled-entry). Each is a thin wrapper over one or more synthetics with prefilled defaults.

**Phase 4 — Long-term: continuous engine (the strategy-trigger-pairings vision)**
Once watchers have run for a while and we have empirical data on what fires when, revisit the three-layer continuous-engine architecture in `2026-05-05-strategy-trigger-pairings.md`. Build only the analysis modules that watcher experience proves are needed. Expand to multi-ticker (`S-portfolio-stop`), regime classification, EV-edge live, and SH-3 trigger daemon — but justified by data, not by guess.

## 12. Recommended next steps

1. Review this spec; confirm the v1 set of six synthetics, the new-strategies inventory, and the resolved design decisions.
2. Land Phase 1 as `SH-WATCH` ahead of (or in lieu of) SH-3 in the shared-track plan.
3. Schedule Phase 2 surfaces immediately after — the headline feature only feels real to a user once they can place a trailing stop from the UI.
