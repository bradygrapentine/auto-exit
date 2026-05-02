# CI Secrets — Wire MCP smoke + harness to live Kalshi

Until these secrets are set, the `mcp-smoke.yml` workflow runs but every smoke/harness step exits 0 with `skipped: no Kalshi credentials configured`. Setting them activates real-account drift detection on every PR that touches the relevant source files, and nightly via cron.

## Required secrets

| Name | Value |
|---|---|
| `KALSHI_PROD_ACCESS_KEY` | The access key id from `kea whoami` (full key, not last-4). |
| `KALSHI_PROD_PRIVATE_KEY` | Contents of the RSA PEM file at the `keyPath` in your prod profile (entire `-----BEGIN ... END-----` block, including newlines). |

Both come from your prod profile. Confirm with `kea whoami`.

## Setup steps

1. Get the values locally:
   ```bash
   cd code-and-docs-from-chatgpt/engine-ts
   kea whoami                           # confirm baseUrl says [PROD]
   cat ~/.kalshi-exit-assistant/credentials.json | jq -r '.profiles.prod.keyId'
   cat $(cat ~/.kalshi-exit-assistant/credentials.json | jq -r '.profiles.prod.keyPath')
   ```
2. GitHub → repo Settings → Secrets and variables → Actions → New repository secret.
3. Paste each value. The PEM secret should include the `BEGIN`/`END` lines verbatim — no quoting, no base64.
4. Trigger a verification run: Actions → mcp-smoke → Run workflow → main.
5. The `smoke` job should report 9 PASS (or PASS/SKIP if positions are empty), 0 FAIL. The `harness` job should report 9 cases with no drift and latency under 5s each.

## What runs after setup

- **Every PR** that touches `src/mcp.ts`, `src/tui/api.ts`, `src/credentials.ts`, `src/replay.ts`, `src/journal.ts`, `src/exitRunner.ts`, `scripts/mcp-smoke*.ts`, or `test/harness/**`: runs `smoke` then `harness`.
- **Nightly at 12:00 UTC on main**: runs both jobs, auto-commits the updated rolling p95 to `test/harness/latency/p95.json` with `[skip ci]`.
- **Manual trigger**: workflow_dispatch on Actions tab.

## Rotating the key

When you regenerate the Kalshi RSA key:
1. Update locally: `kea login --profile prod --key-id <new-id> --key-file <new.pem>` (overwrites profile).
2. Update both repo secrets to match.
3. Verify: re-trigger the workflow and confirm `kea_whoami` line shows the new last-4.

## Revoking

Delete both secrets in repo settings. Workflow keeps running but every step skips.

## Forks

PRs from forks do not receive secrets — workflow runs with empty env, every step skips gracefully. This is the intended behavior. Do not switch the trigger to `pull_request_target` to fix this; that exposes secrets to fork-author code.
