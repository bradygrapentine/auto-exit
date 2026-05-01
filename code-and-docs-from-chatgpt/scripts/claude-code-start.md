# Claude Code start prompt

You are working on Kalshi Exit Assistant, a local-first execution assistant for exiting a preselected losing Kalshi YES/NO position.

First objectives:

1. Inspect `engine-ts/src` and `extension/dist`.
2. Run tests in `engine-ts`.
3. Start the local server with dry-run config.
4. Load the Chrome extension unpacked.
5. Verify `/health`, `/preview`, `/start`, `/stop`, and `/status` flows.
6. Do not enable live order placement until payload shape and orderbook parsing are verified.

Important safety constraints:

- Keep dry-run default true.
- Keep chunk size capped at 500.
- Only operate on explicitly selected `marketTicker` and `heldSide`.
- Preserve `reduce_only: true`.
- Do not add predictive trading or variance modeling to losing-exit V1.

Next hardening tasks:

- Implement real fill reconciliation before decrementing remaining position in live mode.
- Add cancel/retry and partial fill handling.
- Add structured logs to disk.
- Add confirmation modal in extension before dryRun=false start.
