# ExitFlow / ExitEngine – Full Engineering Spec

> ⚠️ **Read this before treating any of these docs as authoritative.**
>
> These specs were drafted by ChatGPT *without* knowledge of the project's
> current state. Cross-check against `engine-ts/src/` before using anything in
> here as a contract — several documents describe shapes that do not match the
> live Kalshi API or the existing implementation.

This package contains implementation-ready specifications:
- Architecture
- Data schemas
- State machines
- API contracts
- Error handling
- Test plans

## What's accurate vs. what's aspirational

**Aspirational future modules** (not yet built — fair to use as starting point):
- `arb.md` — cross-market arbitrage (YES_A + NO_B < 1). Genuinely new direction.
- `llm_advisor.md` — structured-output advisor. Genuinely new direction.

**Re-specs of existing code** (do NOT treat as authoritative — see source of truth):
- `execution_engine.md` — describes a generic core loop + state machine that
  does not match `src/exitRunner.ts`. The real loop is iterative with reconcile
  polling, journal-based crash-safe resume, runtime safety caps, IoC + GTC
  modes, and an auto-adaptive chunking heuristic. See
  `docs/LOSING_EXIT_ALGORITHM.md` for the actual algorithm.
- `schemas.md` — `OrderBook { bids, asks }` is wrong. Kalshi's orderbook is
  `{ yes, no }` arrays where **both are bids** (asks are implicit via opposite
  side; only BUYs cross opposite-side bids to mint pairs). `Position { size }`
  is wrong; Kalshi uses `position_fp` (signed string; positive=YES,
  negative=NO). See `engine-ts/src/types.ts` and `accountClient.ts`.
- `api.md` — `placeOrder { price, action: BUY|SELL }` is wrong.
  Kalshi requires `yes_price_dollars` / `no_price_dollars` (FixedPointDollars
  strings), a `time_in_force` enum, and `reduce_only` only when
  `time_in_force === 'immediate_or_cancel'`. See `src/pricing.ts::buildSellPayload`.
- `architecture.md`, `extension.md`, `errors.md`, `tests.md` — high-level and
  not contradictory, but also not load-bearing.

Source of truth for the engine: `engine-ts/src/`. Start there.

Original line: "Designed for direct use in agentic development (Claude Code)."
That's accurate for the future-features docs (arb, llm_advisor). For the
re-spec docs, agentic implementation against them would produce code that
mismatches the real Kalshi API.
