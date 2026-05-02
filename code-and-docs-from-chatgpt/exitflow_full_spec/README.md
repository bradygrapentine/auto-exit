# Future feature ideas (from ChatGPT scaffold)

This directory was originally a 10-doc ChatGPT spec. Most of it duplicated
or contradicted the real engine implementation, so it was pruned. What
remains are the two docs that point at *new* directions worth exploring,
not yet started.

## Surviving docs

- **`arb.md`** — cross-market arbitrage. Detect `YES_A + NO_B < 1` across
  related markets, execute dual-leg with IoC. Genuinely new direction
  beyond the losing-exit MVP.
- **`llm_advisor.md`** — structured-output strategy advisor. Engine emits
  state, advisor returns recommendation. No execution control. Could
  inform manual decision-making before a sell run.

## What was removed and why

- `api.md`, `schemas.md`, `execution_engine.md` — described shapes that did
  not match Kalshi reality (`bids/asks` instead of `yes/no`, single-field
  `price` instead of `*_price_dollars` strings, generic state machine
  instead of the real iterative loop with reconcile + journal).
- `architecture.md`, `errors.md`, `extension.md`, `tests.md` — high-level
  generic outlines redundant with the live code and existing docs.

Source of truth for the engine remains `engine-ts/src/` and
`docs/LOSING_EXIT_ALGORITHM.md`.
