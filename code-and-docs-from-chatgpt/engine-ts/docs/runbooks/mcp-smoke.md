# MCP Smoke

## Manual run

```bash
cd code-and-docs-from-chatgpt/engine-ts
npm run smoke:mcp
```

Uses the active credentials profile (`kea whoami` to confirm). Read-only — zero mutation risk.

## Reading the report

- ✓ green = tool returned a response that matches the Zod schema in `scripts/mcp-smoke-schemas.ts`.
- ✗ red = response shape mismatch or subprocess error. Failure detail line names the field path.
- – yellow = skipped because no fixture available (e.g. `kea_orderbook` skipped when you have zero positions), or no credentials configured.

## When a schema fails

1. Inspect the actual response: `npx tsx -e 'import { fetchBalance } from "./src/tui/api.js"; fetchBalance().then(console.log)'`
2. If Kalshi added or renamed a field, update the schema in `scripts/mcp-smoke-schemas.ts` to match.
3. If our parser dropped or mistyped a field, fix the parser and add a unit test.
4. Re-run smoke until green.

## No credentials

When `~/.kalshi-exit-assistant/credentials.json` is absent and no `KALSHI_ACCESS_KEY` / `KALSHI_PRIVATE_KEY_PATH` env vars are set, credential-dependent tools (`kea_whoami`, `kea_balance`, `kea_positions`, `kea_resting_orders`) will show `– SKIP no credentials` and the runner exits 0. Tools that don't need credentials (`kea_journal_list`, `kea_journal_read`, `kea_replay`) still run if journals exist.

To run a full smoke pass, configure credentials via `kea login` or set env vars:

```bash
KALSHI_ACCESS_KEY=<key-id> KALSHI_PRIVATE_KEY_PATH=~/.kalshi-exit-assistant/prod.pem npm run smoke:mcp
```

## CI

Runs on every PR that touches `mcp.ts`, `tui/api.ts`, `credentials.ts`, or smoke scripts. Manually triggerable via Actions → mcp-smoke → Run workflow.

Secrets required in repo settings: `KALSHI_PROD_ACCESS_KEY`, `KALSHI_PROD_PRIVATE_KEY`.
