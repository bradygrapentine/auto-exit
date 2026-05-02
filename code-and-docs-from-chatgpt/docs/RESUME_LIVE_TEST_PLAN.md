# Live Resume / Journal Pipeline Test — EXECUTED 2026-05-01 ✓

The crash-safe-resume code path (`src/journal.ts` + `ExitRunner.resumeFromJournal`)
was tested live against the Kalshi prod API on 2026-05-01. **Passed.**

## Outcome

- **JobId of resume target:** `1777682074894-c2cb`
- **Ticker:** KXMOVVAREDISTRICT-26APR21-YES-P1 (existing position, no buy step needed)
- **Trade size:** 100 shares @ 0.8¢ IoC
- Engine was killed after `order_placed` was written to the journal but before
  `order_reconciled`. On restart with `/resume`, engine read the journal, called
  `getOrder` against Kalshi, observed `status=filled, filled=100`, wrote
  `resume_reconciled`, and exited cleanly. **`submittedTotal=0` on the resume
  run** — proving no double-submission of the already-filled order.

Final position math reconciled exactly: pre-test 94,996.51 → post-test 94,896.51,
matching the observed fill from the orphan order.

## What this validated

The main unknown — whether live Kalshi `getOrder` responses parse correctly when
called from the resume code path — is now confirmed. Mock-only coverage is no
longer the gating risk.

## Methodology — superseded the original IoC + Ctrl-C race

The original plan called for IoC orders + manually Ctrl-C'ing the engine to
land between `order_placed` and `order_reconciled`. That window is ~50ms on a
fast IoC fill — essentially impossible to hit reliably.

**What worked instead:** added a test-only `deliberatePauseAfterPlaceMs` config
knob to `ExitRunner` (see `src/exitRunner.ts`). When set, it sleeps the configured
ms between writing `order_placed` to the journal and starting `reconcileOrder`.
Set to 30000ms, this opens a deterministic 30-second window for the kill. The
flag defaults to 0 — set it only in test configs, never production.

## Procedure (as executed)

1. **Test config** (`config.local.resume-test-p1.json`):
   - `positionSize: 100`, `chunkSize: 100`, `maxOrders: 1`
   - `safetySubmittedMultiple: 1.1` → 110-share hard cap
   - `forbiddenTickers: ["KXMOVVAREDISTRICT-26APR21-YES-P4"]`
   - `deliberatePauseAfterPlaceMs: 30000`
   - `preflight: true`, `dryRun: false`
2. Start engine with that config. POST `/start`. Engine writes `order_placed`
   then enters the 30s pause.
3. Poll `/status` for the `deliberate_pause_after_place` event. Once seen, kill
   the server PID immediately (`lsof -ti:7777 | xargs kill -9`).
4. Verify journal at `~/.kalshi-exit-assistant/jobs/<jobId>.jsonl`: `order_placed`
   present, `order_reconciled` absent.
5. Edit config: `deliberatePauseAfterPlaceMs: 0` (so the live loop after resume
   doesn't also pause).
6. Restart server with same config.
7. POST `/resume` with `{ "jobId": "<captured>" }`.
8. Engine: reads journal → `getOrder(orderId)` → reconciles fill → writes
   `resume_reconciled` → continues loop (already at remaining=0) → exits.
9. Verify position via capture-readonly.

## Cost of the test as executed

- Two real attempts (first kill missed the window with an 8s pause; bumped to
  30s and caught it on the second).
- Each attempt sold 100 P1 shares at 0.8¢ — receiving ~$0.75 net per attempt.
- **Net result: +$1.50 to balance, -200 P1 shares**, plus one orphan reconcile
  successfully tested. Resume test on a held position is *cash-positive*; the
  only "cost" is incidentally exiting more of the position.

## Failure modes that did not materialize

- ✗ Did NOT happen: `getOrder` response shape mismatch on real Kalshi data.
  Parser handled `_fp` suffixes correctly (already covered by fixture-pinned
  tests, but now also exercised live).
- ✗ Did NOT happen: resume re-placed an already-filled order. The
  `submittedTotal: 0` on the resume run is the proof.
- ✗ Did NOT happen: journal write was lost mid-Ctrl-C. The append-only JSONL
  with synchronous writes survives `kill -9`.

## When to run again

This is now a regression test — re-run if any of these change materially:
- `parseOrderResponse` signature/keys in `src/kalshiClient.ts`
- The journal entry shape for `order_placed`
- Kalshi's `/portfolio/orders/<id>` response (rare, but has happened — see
  `_fp` suffix migration)
- `ExitRunner.resumeFromJournal` logic

The deterministic-pause methodology is now the reference approach.
