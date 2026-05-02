# Roadmap: CLI First → Local Extension → SaaS

## Phase 0 — CLI proof ✅

Validated:

- ✅ API auth (PSS signing, full-path message)
- ✅ orderbook parsing (`_fp` suffix, deci-cent ticks below 10¢)
- ✅ full-depth cumulative pricing
- ✅ order payload shape (FixedPointDollars strings, IoC + GTC)
- ✅ dry-run execution logs
- ✅ tiny live-size test (Phase 1: 5,000 P1 shares exited cleanly; smoke + resume tests since)

## Phase 1 — Local engine bridge ✅

- ✅ local HTTP server on `127.0.0.1:7777`
- ✅ `/health` `/preview` `/start` `/stop` `/status` `/preflight` `/resume`
- ✅ Chrome extension messaging to local server

## Phase 2 — Extension polish (in progress)

Remaining work:

- auto-detect market ticker more robustly
- optionally read position size from page if available
- add confirmation modal for live mode
- better progress bar
- execution summary report
- persistent saved presets

## Phase 3 — Engine hardening ✅

All shipped:

- ✅ true fill reconciliation before decrementing remaining size
- ✅ cancel/retry handling (`reconcileMaxPolls`, `cancelOnStale`)
- ✅ partial fill support
- ✅ position refresh from Kalshi account endpoint (`preflight`)
- ✅ structured logs to disk (append-only JSONL journal)
- ✅ crash-safe resume (live-validated — see `RESUME_LIVE_TEST_PLAN.md`)
- ✅ test adapter with mock orderbooks (`MockKalshiClient`)
- ✅ runtime safety cap (`safetySubmittedMultiple`) + forbidden-tickers guard
- ✅ auto-adaptive chunking (heuristic-based, no flag needed)

## Phase 4 — Winning exits

Add passive-first winning exit mode:

- post near ask
- timebox only for winning exits
- fallback toward bid
- optional laddering

## Phase 5 — Product/SaaS

Keep execution local. Monetize:

- license key
- premium presets
- reports
- alerts
- analytics
- extension polish

Avoid cloud custody/execution in early versions.
