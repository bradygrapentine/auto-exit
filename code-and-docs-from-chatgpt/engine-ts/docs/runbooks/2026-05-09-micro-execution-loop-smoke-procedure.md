# Micro-execution loop — first live smoke procedure

**Status:** procedure for the operator-driven follow-up to PR #165 (SH-MICRO-EXECUTION-LOOP).
**Story:** SH-MICRO-LIVE-SMOKE.
**Sibling runbook:** `2026-05-09-micro-execution-loop.md` (general usage).

This file documents the *first* live trial through the harness. It exists separately from the general runbook so the worked-example output below survives once the harness becomes routine.

## Why a separate procedure

The harness's safety gates (caps, allowlist, MANDATORY TTY) and journal wiring (trial id == jobId, SH-EDGE attribution) have only been exercised under unit tests with mocked clients. The first live trial is the one that confirms — under real Kalshi auth, real market data, real journal flush — that:

1. `safety.json:microHarness` reads correctly and the gate accepts.
2. `defaultConfirm` reads from a real TTY and the operator can approve.
3. The strategy runner's existing journal entries land under the trial id.
4. `kea edge --since today` picks up the new fire automatically.

Any of these failing means we caught it at $0.10 instead of $50.

## Pre-flight

1. **Edit safety.json.** Add the `microHarness` block — see general runbook §Setup. Set `perTrialCapDollars: 1.00`, `dailyAggregateCapDollars: 2.50`, and an `tickerAllowlist` containing the ticker you'll smoke against (recommend: a liquid, low-volatility ticker like `KXBTC*`).

2. **Confirm allowlist match.**

   ```sh
   kea safety get
   ```

   The output should show the new `microHarness` block.

3. **Choose ticker + side.** Pick a YES side on a liquid ticker mid-spread between, say, 30¢ and 70¢ — the goal is a benign fill, not a directional bet. $0.10 notional ≈ a single contract at any reasonable price.

4. **Choose strategy params.** Start with `s-passive`, `size: 1`, `walkStepCents: 1`. Defaults for everything else.

## The trial

```sh
kea micro trial \
  --ticker KXBTC-26MAYDD \
  --side yes \
  --strategy s-passive \
  --max-notional 0.10 \
  --intent "first-live-smoke validation harness 2026-05-09" \
  --params '{"size":1,"action":"buy","walkStepCents":1}'
```

The harness will:
- Run `gateTrial`. If it rejects, fix safety.json and retry.
- Print the trial config and prompt: `Type the ticker (KXBTC-26MAYDD) to confirm, or anything else to abort:`
- Type the ticker exactly. Anything else aborts cleanly.
- Open the journal under the trial id, then dispatch to `runPassive`.

**Watch for:**
- Order placement journal entry (`order_placed`).
- Reconciliation entry (`order_reconciled`) with a fill or rest.
- Final `micro_trial_finished` with `status: "complete"`.

## Verify

1. **Journal exists.**

   ```sh
   ls "$KEA_HOME/jobs/" | grep micro-
   ```

   You should see one new `micro-…` directory.

2. **Trial entry present.**

   ```sh
   kea journal --job <trialId> | head -20
   ```

3. **SH-EDGE picked it up.**

   ```sh
   kea edge --since today
   ```

   The new fire should appear in the per-strategy breakdown.

4. **Status command works.**

   ```sh
   kea micro status
   ```

   Today's notional spent should equal $0.10.

## If anything fails

| Failure | What to do |
|---|---|
| Gate rejects with `no_micro_safety_config` | Re-check `safety.json` — is the `microHarness` key present? |
| Gate rejects with `ticker_not_allowlisted` | Add the ticker pattern to `tickerAllowlist` |
| TTY prompt doesn't appear | Confirm `process.stdin.isTTY` — running under a non-interactive shell breaks the gate by design |
| Strategy errors (auth / 4xx / 5xx) | The trial is journaled `failed`. Same diagnostic flow as `kea strategy passive`. |
| `kea edge` doesn't show the fire | Confirm `loop_started` entries landed under the trial id (jobId match). If absent, the executor's `jobId: trialId` wiring broke. |

## Worked example (fill in after first run)

```
Date:           [yyyy-mm-dd]
Ticker:         [...]
Strategy:       s-passive
Notional:       $0.10
Size:           1 contract
Fill:           [...]¢
Slippage vs mid: [...]¢
Trial id:       [...]
Fire id:        [...]
Notes:          [anything surprising]
```

## After validation

Once one trial works end-to-end:

1. Run a small parameter sweep (5 trials × 2 cells) per the general runbook §Sweep — total exposure $1.00 well under the $2.50 daily cap.
2. Add the worked-example block to the general runbook.
3. Promote SH-MICRO-LIVE-SMOKE to ✅ in BACKLOG.md.
