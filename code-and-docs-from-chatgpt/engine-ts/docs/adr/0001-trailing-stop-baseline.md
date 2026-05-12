# ADR-0001 — Keep `trailing_stop` (trailCents=10) as the recommended exit-strategy baseline

**Date:** 2026-05-11
**Status:** Accepted (provisional — revisit after queue-aware fill model lands)
**Backlog row resolved:** `SH-STRATEGY-BASELINE-REVISIT`

## Context

`code-and-docs-from-chatgpt/README.md` and the user-level `CLAUDE.md` both recommend `trailing_stop` with `trailCents: 10` as the default exit strategy for operators. The `2026-05-11-strategy-comparison-v3.1.md` sweep (gross proceeds) showed `trailing_stop` was NOT in the top half against the 117-recording expanded set; `s-twap (numIntervals=10, intervalMinutes=1)` led at 3242¢ avg vs trailing_stop's 2760¢. The `SH-STRATEGY-BASELINE-REVISIT` backlog row asked whether to change the baseline.

The follow-up `2026-05-11-strategy-comparison-v3.2.md` sweep — same grid, but run after PR #186 changed the harness to subtract cost basis from `pnl_cents` — shifts the picture again:

| Strategy | Overall avg net pnl¢ | Rising | Falling | Sideways |
|---|---:|---:|---:|---:|
| s-twap (10×1m) | **−838** | +158 | −989 | −1027 |
| s-passive (chunk=100, walk=1) | −849 | +141 | −988 | −1043 |
| s-aggressive | −1169 | −135 | −1071 | −1448 |
| **trailing_stop (trailCents=1)** | **−1217** | −347 | −1018 | −1475 |
| trailing_stop (trailCents=10) | _not best within family_ | | | |
| stop_loss (50) | −1421 | −106 | −1027 | −1874 |
| bracket (target=50, stop=20) | −1818 | −106 | −1875 | −2222 |
| take_profit (40) | −3698 | −1817 | −4288 | −3961 |

Three observations:

1. **Almost every cell is net-negative.** Cost basis = first-tick mid is pessimistic: you'd never realistically enter at the recording's open. Real operators enter when they have an edge, not at random.
2. **Slow execution wins relative ranking.** `s-twap` and `s-passive` are within 1% of each other and beat the trailing-stop family by ~400¢ on a 100-contract position.
3. **Naive fill model over-rewards passive.** Resting GTC orders fill whenever the recorded book has matching liquidity at limit price, with no queue-position penalty. So `s-passive`'s lead is partly an artifact.

## Decision

**Keep `trailing_stop trailCents=10` as the recommended baseline.** Do not change CLAUDE.md or README.md at this time.

Rationale:

- **The v3.2 data does not clearly favor a change.** The two strategies that beat trailing_stop in the data (`s-twap`, `s-passive`) both depend on fill-realism assumptions that are known to be optimistic for passive execution. A queue-aware fill model could flip the ranking again.
- **First-tick-mid cost basis is the wrong proxy for operator behavior.** The absolute pnl is too pessimistic; the ranking is what matters.
- **`trailing_stop` has operational simplicity that the sweep can't measure.** "Set and forget" with one parameter vs. `s-twap`'s "split into N intervals over M minutes" requires more setup, can be interrupted mid-flight, and represents a longer commitment.
- **Inside the trailing-stop family, `trailCents=1` did beat `trailCents=10` on the v3.2 data**, but the gap is within the noise floor introduced by the fill model. Not enough signal to change the recommended trail width yet.

## Consequences

- The README and CLAUDE.md guidance remain unchanged.
- New backlog row filed: `SH-FILL-REALISM-QUEUE-AWARE` — implement a queue-position-tracked fill model in `src/backtest/fillSimulator.ts` so passive GTC orders pay a realistic queue penalty. After it ships, re-run v3.3 and re-evaluate this ADR.
- Operators picking a strategy for a specific position should still consider `s-twap` or `s-passive` for slow, patient exits in rising or sideways markets — the data supports those as alternatives, just not as the default.

## Revisit when

- Queue-aware fill model lands (tracked in `SH-FILL-REALISM-QUEUE-AWARE`).
- OR live fills accumulate enough to back-fit cost basis to actual entries and re-run with realistic basis distribution.
- OR sweep includes recordings with operator-typical entry points (e.g. enter when probability crosses a threshold, not at recording start).
