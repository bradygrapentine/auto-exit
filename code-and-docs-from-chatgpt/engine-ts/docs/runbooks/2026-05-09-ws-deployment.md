# SH-SCANNER-WS — Fly deployment runbook

**Status:** WS transport rolled out to `auto-exit-scanner` Fly app on 2026-05-09. Toggleable via env var; rollback is a one-liner.

## Architecture

The Fly scanner runs `node dist/cli.js record start` from the Dockerfile entrypoint. Transport is controlled by env var `KEA_SCANNER_TRANSPORT`:

- Unset or `rest` → REST polling (default; pre-existing behavior)
- `ws` → WebSocket (`--transport ws`) per SH-SCANNER-WS

## Deploy

CI auto-deploys on push to `main` via `.github/workflows/fly-deploy.yml`. To switch the running scanner to WS:

```bash
flyctl secrets set KEA_SCANNER_TRANSPORT=ws -a auto-exit-scanner
```

This triggers a Fly machine restart with the new env var. (If the env var were set before this PR landed, the old image would have ignored it — back-compat.)

## Verify

```bash
flyctl logs -a auto-exit-scanner | head -20
```

Look for `[bootstrap] transport=ws (Kalshi orderbook_delta WebSocket)` and `[scanner] transport=ws (Kalshi orderbook_delta WebSocket)`.

After ~5 minutes, pull a recent recording for a sanity check:

```bash
flyctl machine exec <machine-id> -a auto-exit-scanner "sh -c 'wc -l /data/recordings/*.ndjson | tail -3'"
```

Snapshot counts should be on the same order of magnitude as REST (per-ticker cadence is preserved).

## Rollback

Two options; both fast:

1. **Unset the env var** (preserves the new image):
   ```bash
   flyctl secrets unset KEA_SCANNER_TRANSPORT -a auto-exit-scanner
   ```
   Restarts in `rest` mode.

2. **Revert the deploy commit** if the issue is in the WS code itself:
   ```bash
   git revert <commit> && git push origin main
   ```
   CI redeploys.

## Monitoring (24h)

Watch for:

- **Reconnect storms:** any `disconnect:` lines in logs more often than every ~30s. The recorder backs off 250ms→30s; if storms persist there's likely a Kalshi-side issue and rollback is appropriate.
- **Stale tickers:** `resync failed:` lines indicate the staleness fallback is firing — usually fine for sparse markets, but if dense tickers show up here it's a bug.
- **File growth:** `flyctl machine exec` `du -sh /data/recordings` should grow at a similar rate to before. If much smaller, snapshots aren't being emitted.

If any of these fire repeatedly: rollback via env var, file findings, debug locally.

## Cost / data quality expectations

- **Kalshi API load:** WS uses one persistent connection vs N per-ticker REST polls every cadenceMs. Should reduce request count by orders of magnitude.
- **Tick resolution:** WS captures every book change; REST samples at cadenceMs only. Expect more fine-grained orderbook history in WS recordings.
- **Disk usage:** synthesized snapshots are emitted at the configured cadenceMs (same rate as REST), so file size should be similar.

## Files

- `Dockerfile` — entrypoint reads `KEA_SCANNER_TRANSPORT`
- `code-and-docs-from-chatgpt/engine-ts/src/wsClient.ts` — WS auth + framing
- `code-and-docs-from-chatgpt/engine-ts/src/wsBookTracker.ts` — book reconstruction
- `code-and-docs-from-chatgpt/engine-ts/src/backtest/wsRecorder.ts` — Recorder integration
- `code-and-docs-from-chatgpt/engine-ts/scripts/ws-spike.mjs` — repro probe for Kalshi-API changes
