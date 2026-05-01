# Live Resume / Journal Pipeline Test (deferred — user must green-light)

The crash-safe-resume code path (`src/journal.ts` + `ExitRunner.resumeFromJournal`)
has been tested only against `MockKalshiClient`. It has never been exercised
against the live Kalshi API. Live shapes have already diverged from our
assumptions in several places (signing path, _fp suffixes, time_in_force enum)
so it's plausible the resume path has latent bugs only visible against real
responses.

**This test is destructive-by-design** — it deliberately kills the engine
mid-iteration. It must not run without explicit user authorization, and only
on a small chunk size that any errant fill leaves a manageable footprint.

## Procedure

1. **Tiny test config.** `chunkSize: 100`, `positionSize: 100`, `maxOrders: 1`,
   `safetySubmittedMultiple: 1.1` (cap = 110 max submitted). Single chunk only.
2. **Use IoC** so any successful order is terminal — resume on a non-IoC GTC
   order would over-test the failure mode.
3. **Engine starts in terminal 1.** Tail the journal in terminal 2:
   `tail -F ~/.kalshi-exit-assistant/jobs/*.jsonl`.
4. **POST /start** with `dryRun: false`.
5. **Immediately Ctrl-C the engine** — try to land the kill between
   `order_placed` and `order_reconciled` lines in the journal. Realistically
   the iteration is fast (~50ms), so the kill may land before or after; either
   way the journal records what landed.
6. **Inspect the journal** in `~/.kalshi-exit-assistant/jobs/<jobId>.jsonl`:
   - If `order_placed` exists but no `order_reconciled` → resume target.
   - If both exist → no resume needed; just verify position state via
     capture-readonly.
7. **Restart the engine** with `--resume <jobId>` (server route TBD —
   currently /resume on the HTTP server, accepts {jobId, config}).
8. **POST /resume** with the captured jobId. Engine should:
   - Read the journal
   - Find the dangling `order_placed`
   - GET that order from Kalshi
   - Reconcile fill state into the in-memory remaining
   - Append `resume_reconciled`
   - Continue or terminate based on remaining
9. **Verify via capture-readonly** that position state matches what the
   journal reports.

## Failure modes to watch for

- `getOrder` against a real order_id returns a different shape than mock —
  parser may misread fillCount (we fixed this case already, but resume calls
  it from a different path).
- Journal file write was not flushed before Ctrl-C — resume sees an empty or
  truncated journal and treats as "no pending" (correct behavior, but
  destructive of the actual order on Kalshi). Mitigation: always
  capture-readonly after a Ctrl-C to manually reconcile.
- Resume finds an order that's already `filled` on Kalshi — engine should
  recognize this and decrement remaining, not re-place.

## Why this is deferred

- Requires a live trade to exist, which means committing to a small loss.
- Footgun risk: a bug in resume could re-place an already-filled order,
  doubling the trade.
- Expected value of catching a bug: high (resume is one of the more complex
  code paths).
- Acceptable cost of running: ~$1-2 of fees + spread on a 100-share P1 trade.

User must explicitly authorize before this runs. Document the decision in the
PR description if executed.
