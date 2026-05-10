# Micro-execution loop runbook

**Status:** v1 shipped 2026-05-09 (`feat/sh-micro-execution-loop`).
**Story:** SH-MICRO-EXECUTION-LOOP — small-size live execution + sweep + SH-EDGE integration.

## What this is

A live-execution validation harness. Picks a strategy × ticker, runs N trials at strict per-trial caps, and journals each as a Fire that SH-EDGE attributes automatically. Useful for:

- Smoke-testing a newly shipped strategy against a real (cheap) ticker before scaling.
- Bench-marking a parameter change (e.g. `walkStepCents: 1` vs `walkStepCents: 0.5`).
- Building enough validated trials per (strategy × ticker) cell that `kea edge --strategy ... --since today` produces signal.

## When NOT to use it

- **On a position you actively hold.** This harness opens NEW positions; it is not for harvesting existing ones. Use `kea strategy ...` directly for harvest.
- **On news/event tickers without a sleep gap.** The 30s default `perTrialDelayMs` is calibrated for liquid markets; on thin event tickers, increase to 120s+.
- **As a substitute for backtesting.** This is the *last* validation step, after backtests pass.

## Caps (operator-approved 2026-05-09)

| Cap | Value | Override |
|---|---|---|
| Per-trial notional | **$0.10–$1.00** | `--max-notional` per trial; can lower below safety.json cap |
| Daily aggregate notional | **$2.50** | `safety.json:microHarness.dailyAggregateCapDollars` |
| Confirmation | **MANDATORY TTY** every trial | none — no skip flag, no auto-confirm |

The harness refuses to run if stdin is not a TTY. A sweep prompts for every single trial; the operator types the ticker symbol back to confirm each one.

## Setup

Edit `~/.kalshi-exit-assistant/safety.json` and add the `microHarness` block:

```jsonc
{
  "version": 1,
  "safetySubmittedMultiple": 1.1,
  "floorPriceCents": 0,
  "tailSweepThreshold": 0,
  "forbiddenTickers": [],
  "microHarness": {
    "perTrialCapDollars": 1.00,
    "dailyAggregateCapDollars": 2.50,
    "tickerAllowlist": ["KXBTC*", "KXETH*"]
  }
}
```

`tickerAllowlist` is glob-matched (`*` wildcard, exact strings allowed). Anything outside the allowlist is rejected at the gate — no override.

## Usage

### Single trial

```sh
kea micro trial \
  --ticker KXBTC-26MAY09 \
  --side yes \
  --strategy s-passive \
  --max-notional 0.50 \
  --intent "smoke: walkStep=1 baseline" \
  --params '{"size": 1, "walkStepCents": 1}'
```

The harness prints the trial config, prompts for the ticker symbol to confirm, then runs `runPassive` under the trial id. Both the harness's `micro_trial_started`/`finished` entries and the strategy's `loop_started`/`order_*` entries land under the same jobId, so SH-EDGE attributes the resulting fire automatically.

### Sweep

```sh
kea micro sweep --plan sweep.json
```

`sweep.json`:

```json
{
  "cells": [
    { "strategy": "s-passive", "ticker": "KXBTC-26MAY09", "side": "yes",
      "params": { "size": 1, "walkStepCents": 1 }, "trialsPerCell": 5 },
    { "strategy": "s-passive", "ticker": "KXBTC-26MAY09", "side": "yes",
      "params": { "size": 1, "walkStepCents": 0.5 }, "trialsPerCell": 5 }
  ],
  "perTrialDelayMs": 30000,
  "maxNotionalDollars": 0.20,
  "intent": "walkStep parameter sweep — 2026-05-09"
}
```

Sweep semantics:
- Hard abort on safety-gate rejection (caps / allowlist / missing config).
- Soft continue on operator decline or strategy failure — the rest of the sweep proceeds.
- Every trial prompts for confirmation. Operator can decline a single trial without aborting the sweep.

### Status

```sh
kea micro status
```

Prints today's started/finished trials and total notional spent today (UTC).

## Reading sweep results

After the sweep finishes, the harness prints a thin summary (run / done / rejected / failed counts per cell). The actual edge breakdown comes from SH-EDGE:

```sh
kea edge --strategy s-passive --since today
```

That output is the per-strategy breakdown (entry slippage vs benchmark, exit fill quality, realized PnL where attribution is available). Use it to compare two parameter cells directly: same ticker, same window, different param set.

## Rollback / kill-switch

Delete the `microHarness` block from `safety.json`. Every gate call returns `no_micro_safety_config` and refuses to run. No code change needed.

## Worked example

*(To be filled in after the first real sweep — see Sub-story 3 wrap-up.)*

## Strategies wired in v1

| Strategy | Status |
|---|---|
| `s-passive` | ✅ wired |
| `s-aggressive` | ✅ wired (uses Sub-story 2 liveness gate by default; opt out via `params.livenessCheckEnabled: false`) |
| `s-trail` | ⏳ v1.1 |
| `s-twap` | ⏳ v1.1 |
| `s-auto` | ⏳ v1.1 |

Use `kea strategy <name>` directly for the unwired strategies.
