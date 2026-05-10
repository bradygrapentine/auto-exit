# SH-WATCH v2 — Buy-side synthetics

> **Status:** spec slice. Not implementation-ready. Scopes the v2 surface
> against the v1 watcher to identify what code can be reused vs. what
> needs new evaluators/integration. **Implementation deferred** — file
> when a real entry-side use case surfaces (operator request, scanner
> integration, or a strategy that needs auto-arming on momentum/dip
> signals).

**Goal.** Extend the SH-WATCH synthetic-order surface (v1 — exit-side
only, shipped 2026-05-06 per BACKLOG.md:1537) with three buy-side
synthetic kinds and one composite. v1 already delivers the daemon,
journal, NDJSON persistence, evaluator registry, fire pipeline, and CLI
/ MCP / TUI / extension surfaces. v2 is a thin extension along the same
seams, not a new system.

**Non-goals.** No new daemon mechanics. No journal changes beyond a
`SyntheticKind` enum extension and one new `JournalKind`. No new
persistence format. No new transports. No portfolio-level synthetics
(`S-portfolio-stop` from the v1 spec §5 stays deferred to v3).

## v1 surface to reuse

The v1 watcher already provides everything v2 needs along these seams.
Confirmed against current code 2026-05-09:

- **Daemon + poll loop** — `src/watcher.ts`. Per-ticker adaptive cadence
  (250ms near trigger / 2s default / 10s idle) and the `tick()` evaluator
  dispatch are kind-agnostic. v2 just adds new `SyntheticKind` strings.
- **Journal** — `~/.kalshi-exit-assistant/watchers.ndjson`. Three-phase
  fire (`fire_pending` → invoke → `fired` / `fire_failed`) and the
  on-disk schema are kind-agnostic. v2 reuses unchanged.
- **Evaluator registry** — `src/synthetics/index.ts` (`EvaluatorMap`).
  Each evaluator is a `(synthetic, book, now?) => SyntheticEvalResult`.
  v2 adds three entries.
- **Invoke pipeline** — `src/synthetics/invoke.ts`. Wraps the dispatched
  strategy. The new entry strategies dispatch through the same hook;
  signature change limited to allowing a `BuyConfig` payload alongside
  the existing exit `ExitConfig`.
- **CLI/MCP/HTTP/TUI/extension surfaces** — register/list/get/cancel are
  kind-agnostic; v2 inherits them with no surface changes once
  `SyntheticKind` is extended.
- **`BuyRunner`** (`src/buyRunner.ts`) — fully implemented entry primitive.
  v2 invokers call it directly with prefilled `BuyConfig`s.

## v2 scope

Three new `SyntheticKind`s + one composite:

| Kind | Trigger | Action |
|---|---|---|
| `buy_stop` | `topYesAskCents ≥ triggerPriceCents` (breakout) | Invoke `BuyRunner` with operator-supplied size + price ceiling |
| `buy_dip` | `topYesAskCents ≤ peakAsk − dipCents` (peak-tracked retrace) | Invoke `BuyRunner` with operator-supplied size + price ceiling |
| `scaled_entry` | Per-rung `topYesAskCents ≤ rung.priceCents` | Invoke `BuyRunner` for that rung's size; mark rung filled in state |
| `bracket_entry` (composite) | Either `buy_stop` OR `buy_dip` child fires | Sibling-cancel; on entry fill, optionally arm an exit-side `bracket` over the resulting position |

`buy_stop` and `buy_dip` are direct mirrors of v1's `take_profit` (single
trigger) and `trailing_stop` (peak-tracked threshold). `scaled_entry` is
a buy-side analog of v1 multi-rung `take_profit`. `bracket_entry` is a
new composite type — the existing v1 `bracket` is exit-side
(stop-loss + take-profit on a held position); `bracket_entry` is
entry-side (two ways into a position; whichever fires first cancels the
other).

## Why this composes cleanly with v1

v1's surface is shaped around two seams that work for both directions:

1. **Evaluator** is `(synthetic, book, now?) => result`. Direction-
   agnostic — a buy_stop evaluator looks at `book.yes` for asks the same
   way `take_profit` looks at `book.yes` for bids; only the comparison
   operator differs.
2. **Invoker** is "fire payload → run something." v1 fires `ExitRunner`;
   v2 fires `BuyRunner`. The dispatch table in `invoke.ts` widens by
   one branch per new kind.

The composite case (`bracket_entry`) reuses v1's `bracket` sibling-
cancel mechanics (`parentId` on children, `bracket.ts` evaluator
expansion at register time). Only the children's kinds change.

## Open questions to resolve before implementation

1. **Position-size source.** Buy synthetics fire when there's no
   position yet. v1 evaluators read `positionSize` from the synthetic
   itself (set at register time, decremented on partial fires). v2 buy
   synthetics should follow the same convention, but `autoCancelOnZeroPosition`
   doesn't apply (there's no held position to track) — confirm the flag
   is ignored or set to `false` by default for buy kinds.

2. **Price-ceiling vs. trigger-price semantics.** A `buy_stop` triggers
   at a price; `BuyRunner` accepts a `maxPriceCents` ceiling. Are these
   the same value, or does the synthetic supply a separate ceiling
   above the trigger to allow some slip? Probably separate — operator
   may want "trigger at 60 but accept up to 62 if book moves while we
   fire." Add `maxPriceCents` to params alongside `triggerPriceCents`.

3. **Peak-tracking for `buy_dip`.** v1's `trailing_stop` tracks `peakBid`
   in synthetic state. `buy_dip` needs `peakAsk` — same mechanic, just
   the other side. Confirm the state schema allows arbitrary tracking
   fields per kind, or whether we need a typed `BuyDipState`.

4. **Scaled-entry rung exhaustion.** When all rungs of a `scaled_entry`
   have filled, what's the terminal state — `fired` (treats the whole
   ladder as one fire) or `fired` per rung with the parent staying
   `armed` until the last rung fires? v1's multi-rung `take_profit`
   uses the latter — confirm same convention.

5. **Forbidden-ticker policy.** v1's exit synthetics assume the operator
   intends to exit a held position; forbidden-ticker enforcement happens
   at registration. For buy synthetics, the same enforcement applies but
   the failure mode is different (operator can't enter, vs. operator
   can't exit a held position). No code change — just confirm error
   message wording is sensible for the buy direction.

6. **Auto-cancel on book-walk-away.** A `buy_dip` synthetic with no
   timeout could sit armed forever if the market never retraces. Should
   buy synthetics get a default `expiresAt` (e.g. T+24h) to prevent
   stale registrations? Operationally low-stakes for v2; deferral OK.

## Surface impact

**`src/types.ts`.** Extend `SyntheticKind`:

```ts
export type SyntheticKind =
  | 'stop_loss' | 'stop_limit' | 'trailing_stop'
  | 'take_profit' | 'oco' | 'bracket'
  | 'time_stop' | 'step_trail'
  // v2 — buy-side synthetics
  | 'buy_stop' | 'buy_dip' | 'scaled_entry' | 'bracket_entry';
```

Add per-kind param interfaces (`BuyStopParams`, `BuyDipParams`,
`ScaledEntryParams`, `BracketEntryParams`) — mirroring the existing
v1 param interfaces.

**`src/synthetics/`.** Four new files:

- `buyStop.ts` — evaluator + state.
- `buyDip.ts` — evaluator + peak-ask tracking.
- `scaledEntry.ts` — multi-rung evaluator (mirrors `takeProfit.ts`).
- `bracketEntry.ts` — composite (mirrors `bracket.ts` but children
  are buy-side).

Plus dispatch entries in `index.ts`.

**`src/synthetics/invoke.ts`.** Add a branch routing buy kinds to
`BuyRunner` instead of `ExitRunner`. Approximately:

```ts
const isBuyKind = (k: SyntheticKind) =>
  k === 'buy_stop' || k === 'buy_dip' || k === 'scaled_entry' || k === 'bracket_entry';

if (isBuyKind(synthetic.kind)) {
  await new BuyRunner(client, buildBuyConfig(synthetic, fireResult)).run();
} else {
  await new ExitRunner(client, buildExitConfig(synthetic, fireResult)).run();
}
```

**`src/cli.ts`.** No changes — `kea watch register --kind <k>` is
already kind-agnostic. New kinds Just Work via the param schema.

**MCP / HTTP / TUI / extension.** No changes — surfaces enumerate
`SyntheticKind` from types; extending the union extends the dropdown.

**Tests.** Per-evaluator unit tests + 1-2 end-to-end fire tests through
the watcher loop (mirroring v1's pattern in `test/watcher.test.ts`).

## Cost estimate

~2 days for v2:
- 0.5 day — type extensions + 4 evaluator files
- 0.5 day — invoke pipeline branching + BuyRunner config building
- 0.5 day — per-evaluator unit tests + watcher integration test
- 0.5 day — strategy presets (`S-buy-stop`, `S-buy-dip`,
  `S-scaled-entry`, `S-bracket-entry`) as thin wrappers in
  `src/strategies/`

No daemon, journal, persistence, CLI, or transport work needed.

## Sequencing

Implementation slice order:

1. Type extensions (`SyntheticKind` + four param interfaces)
2. `buyStop.ts` + tests (simplest — single trigger, mirror of
   `takeProfit` single-trigger path)
3. `buyDip.ts` + tests (peak-tracking; mirror of `trailingStop`)
4. `scaledEntry.ts` + tests (multi-rung; mirror of `takeProfit`
   multi-rung)
5. `invoke.ts` BuyRunner branch
6. `bracketEntry.ts` (composite; depends on the three above)
7. Strategy presets

Each slice is independently committable. PR per slice, or one PR
covering 1-5 if dispatched in parallel.

## Trigger condition for de-thaw

This spec sits 🧊 until one of:

- **Operator request.** Direct ask for a buy-side synthetic during a
  live session.
- **Scanner integration.** SH-SCANNER-WS surfaces a momentum / dip
  signal that wants auto-arming as a buy synthetic.
- **Backtest validation result.** A backtest sweep shows a measurable
  edge for a buy-stop / buy-dip strategy that justifies productionizing
  the entry-side primitive.

Until then, the v1 surface (exit-side only) is sufficient — operators
enter via `kea strategy <buy>` directly, and the missing automation gap
hasn't been load-bearing.
