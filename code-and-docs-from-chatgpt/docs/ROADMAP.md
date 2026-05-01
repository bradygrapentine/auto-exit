# Roadmap: CLI First → Local Extension → SaaS

## Phase 0 — CLI proof

Validate the hard part locally:

- API auth
- orderbook parsing
- full-depth cumulative pricing
- order payload shape
- dry-run execution logs
- tiny live-size test

## Phase 1 — Local engine bridge

Added in this package:

- local HTTP server on `127.0.0.1:7777`
- `/health`
- `/preview`
- `/start`
- `/stop`
- `/status`
- Chrome extension messaging to local server

## Phase 2 — Extension polish

Next work:

- auto-detect market ticker more robustly
- optionally read position size from page if available
- add confirmation modal for live mode
- better progress bar
- execution summary report
- persistent saved presets

## Phase 3 — Engine hardening

Before any broader release:

- true fill reconciliation before decrementing remaining size
- cancel/retry handling
- partial fill support
- position refresh from Kalshi account endpoint
- structured logs to disk
- crash-safe resume
- test adapter with mock orderbooks

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
