# Operator end-to-end runbook

**Audience.** You just cloned the repo. You want to go from "nothing installed" to "I ran a fully-attributed live validation trial" in under 30 minutes.

**Scope.** This walks through the eight things every operator does. For depth on any one, follow the cross-link to its dedicated runbook (table at the bottom).

## Quick reference

```sh
# State
kea balance                                    # cash, NAV
kea positions                                  # holdings
kea resting                                    # open orders
kea book --ticker KX...                        # one ticker's order book

# Decide
kea plan <ticker> --position N --cost-basis-cents C --market-p X --private-p Y

# Execute (one of):
kea strategy passive   --ticker T --side S --action sell --size N
kea strategy aggressive --ticker T --side S --action sell --size N
kea micro trial --ticker T --side S --strategy s-passive --max-notional 0.50 \
  --intent "first smoke" --params '{"size":1,"action":"sell"}'

# Observe
kea report <jobId>                              # TCA for one job
kea edge --since today                          # per-strategy attribution
kea micro status                                # today's harness trials

# Safety
kea safety get                                  # current limits
kea safety set --max-loss-per-ticker 50        # set per-ticker loss cap
kea forbidden add KXMOVVA-26 "legal flagged"    # ticker-level kill
echo "STOP" > ./STOP                            # killswitch file
```

---

## 1. Setup (~5 min)

```sh
cd code-and-docs-from-chatgpt/engine-ts
npm install
npm run build           # produces dist/
node dist/cli.js login  # or: alias kea="node $(pwd)/dist/cli.js"
```

`kea login` prompts for the Kalshi key id, the path to your private key file, and the API base URL. Multiple profiles supported via `--profile`.

```sh
kea use <profile>       # switch active profile
kea whoami              # show active profile (key id last-4 only)
kea logout              # remove profile
```

**Watch for:** if `kea whoami` says "no active profile," the login didn't persist — re-run with `--profile <name>`.

## 2. Daily workflow — state at a glance (~3 min)

```sh
kea balance        # cash, NAV (used by SH-2 risk gates)
kea positions      # all held positions across markets
kea resting        # open orders not yet filled / canceled
kea book --ticker KXBTC-26MAY09 --depth 10    # one ticker's order book
```

`balance` and `positions` are the inputs to every other command. Run them at the start of any session.

## 3. Decision support (~5 min)

```sh
kea plan KXMOVVA-26-LAD --position 100 --cost-basis-cents 4500 --market-p 0.72 --private-p 0.80
```

Output sections:
- **EV analysis:** `pStar` (the EV crossover), `evHold` / `evHarvestNow` / `evPatientScaleOut`, and whether harvest is currently EV-positive.
- **Greeks:** `delta = marketP`, `theta/day` (if catalyst date supplied), `gammaProxy = spread × visible_depth`.
- **Risk reduction table:** per-fraction (10/25/50/75% + no-loss-floor) cash locked, EV given up, and σ reduction.
- **Risk notes** (SH-DEPTH-WALK-STALE-SNAPSHOT): warns if the projection depends on a single fat top-of-book bid that may be pulled before execution.

**Watch for:** if `private-p > pStar`, every harvest is EV-negative — read the risk-reduction table to decide whether variance reduction is worth the EV cost.

Cross-link: `engine-ts/docs/runbooks/2026-05-09-staleness-investigation.md` for the MOVVA incident that motivated risk notes.

## 4. Strategy execution (~5 min)

Pick a strategy:

| Strategy | When | Cost |
|---|---|---|
| `s-passive` (post-and-walk) | normal exit, willing to sit on book | low fees, time risk |
| `s-aggressive` (one-shot IoC) | urgent, accept the spread | one-tick or full-spread cost |
| `s-twap` (time-sliced) | large size, want average price | spread + impact |
| `s-trail` (trailing stop) | trend-following exit | watcher-driven |

```sh
kea strategy passive --ticker KXBTC-26MAY09 --side yes --action sell --size 100 \
  --walk-step-cents 1
```

The runner journals every step under `${KEA_HOME}/jobs/<jobId>.jsonl`. Watch for:
- `loop_started` — runner accepted the config
- `order_intent` → `order_placed` → `order_reconciled` — one fill round-trip
- `loop_finished` — terminal state with `remaining`, `filledTotal`

**For aggressive (>= 100 contracts):** the runner re-fetches the orderbook between projection and submission and aborts with `liveness_rejected:<reason>` if the top bid shifted past tolerance — this is the post-MOVVA depth-walk staleness check (PR #164).

## 5. Synthetics (triggers) (~3 min)

```sh
kea watch register --ticker KXBTC-26MAY09 --kind stop_loss \
  --side yes --size 100 --price-cents 60 --action sell
kea watch list
kea watch cancel <syntheticId>
```

Supported kinds: `stop_loss`, `stop_limit`, `trailing_stop`, `take_profit`, `oco`, `bracket`, `time_stop`, `step_trail`. The watcher daemon polls the book and fires the registered action when the trigger condition is met.

**Watch for:** triggers persist in the watcher's journal. If the daemon isn't running (`kea watch start`), nothing fires. Check `kea watch list --status armed` before relying on a stop.

## 6. Validation harness (~5 min)

For first-time strategy validation at small notional:

```sh
kea micro trial --ticker KXBTC-26MAY09 --side yes --strategy s-passive \
  --max-notional 0.50 --intent "first smoke" --params '{"size":1,"action":"sell"}'
```

The harness enforces:
- Per-trial cap (default $1.00, configurable in `safety.json:microHarness`)
- Daily aggregate cap ($2.50)
- **Mandatory TTY confirmation per trial** (no skip flag, no auto-confirm)
- Ticker allowlist glob match

Sweeps run N trials per (strategy × ticker × params) cell:

```sh
kea micro sweep --plan ./sweep.json
kea micro status              # today's trials
kea micro status --json       # agent-consumable
```

Cross-link: `engine-ts/docs/runbooks/2026-05-09-micro-execution-loop.md` (general usage), `engine-ts/docs/runbooks/2026-05-09-micro-execution-loop-smoke-procedure.md` (first live trial).

## 7. Observability (~3 min)

```sh
kea report <jobId>                            # TCA for one job (slippage per chunk)
kea report <jobId> --ticker KXA-26 --json     # filtered + JSON envelope

kea edge --since today                        # per-strategy edge breakdown
kea edge --strategy s-passive                 # drill into one strategy
kea edge --ticker KXBTC-26MAY09 --json        # ticker-filtered + JSON
```

`kea report` shows execution quality (slippage vs arrival mid). `kea edge` shows strategy quality (per-fire P&L decomposition: entry edge, exit edge, market drift, slippage).

Cross-link: `engine-ts/docs/runbooks/2026-05-09-edge-introduction.md`.

## 8. Safety / kill-switch (~2 min)

```sh
kea safety get                                              # current config
kea safety set --max-loss-per-ticker-dollars 50            # SH-2 risk gate
kea safety set --daily-loss-circuit-breaker-dollars 200    # daily realized-loss cap
kea forbidden add KXMOVVA-26 "legal flagged"               # ticker-level kill
kea forbidden remove KXMOVVA-26
```

**Killswitch file** (`./STOP` at the engine's CWD by default): if it exists, every runner exits immediately with `kind: 'break_loop', reason: 'kill_switch'`. Use this as the panic button:

```sh
echo "STOP" > ./STOP    # halt
rm ./STOP               # resume
```

`safety.json` lives at `${KEA_HOME}/safety.json` (default `~/.kalshi-exit-assistant/safety.json`). All mutations append to `safety.audit.jsonl` for audit.

---

## Where to read more

| Topic | Runbook |
|---|---|
| Pre-trade liveness check (post-MOVVA) | `2026-05-09-staleness-investigation.md` |
| `kea edge` walkthrough | `2026-05-09-edge-introduction.md` |
| `kea micro` general usage | `2026-05-09-micro-execution-loop.md` |
| `kea micro` first live trial procedure | `2026-05-09-micro-execution-loop-smoke-procedure.md` |
| Backlog (open work / shipped log) | `code-and-docs-from-chatgpt/docs/BACKLOG.md` |

## Common pitfalls

- **`kea` not on PATH.** Use `node dist/cli.js ...` or alias. There's no global install step.
- **Profile not set.** `kea whoami` is your check; if it says "no active profile" any read/write call to Kalshi will fail with auth errors.
- **Forbidden ticker.** If the engine refuses to start with "ticker is in forbiddenTickers," check `kea forbidden list`.
- **Killswitch file left over.** If runners exit immediately, look for a stray `./STOP`.
- **`KEA_HOME` mismatch.** Tests and one-offs sometimes set `KEA_HOME` to a temp dir; if you can't find your journals, `echo $KEA_HOME` and check.
- **Watcher daemon not running.** Triggers don't fire on their own — you need `kea watch start` somewhere.
