# MCP Regression Harness

## Suites

| Suite | Command | Risk | Cadence |
|---|---|---|---|
| read-only | `npm run harness:read-only` | none | nightly + on PR + manual |
| mutation | `npm run harness:mutation` | small (demo-only, fixed qty) | manual only, after kea use demo |

## What it checks

- **Schema validity** — response parses against the Zod schema in `scripts/mcp-smoke-schemas.ts`.
- **Schema drift** — diff between live response shape and `test/harness/baselines/<tool>.json`. Any added/removed/type-changed field surfaces.
- **Latency budget** — current run > 2× rolling p95 (last 30 runs) fails. Initial budget 5s.

## When schema drift shows up

1. Investigate: was Kalshi's response shape actually changed? Check their changelog or their release notes channel.
2. If yes:
   - Update the Zod schema in `scripts/mcp-smoke-schemas.ts`.
   - Update the parser if the field maps into our domain types.
   - Run `npm run harness:update-baselines` to regenerate baselines.
   - Commit all three together.
3. If no: parser regression. Fix the parser. Don't touch the baseline.

## When latency fails

- Check Kalshi's status page first.
- If their latency is normal: profile our request signing / fetch path.
- If their latency is degraded: re-run after their incident clears. The auto-commit job updates p95 nightly so a sustained shift in their latency will widen the budget within ~30 days.

## Mutation suite

Refuses to run unless `loadActive().baseUrl` contains "demo". This is hard-coded in `test/harness/mutation.harness.test.ts`. **Do not weaken this gate.**

To add a mutation test (when mutation tools exist):
1. `kea use demo` (or `kea login --profile demo`).
2. Pick a low-volume demo market.
3. Test must reverse its own effect in `finally` (cancel orders, log a journal note).
4. Run `npm run harness:mutation` — never CI by default.

## CI

- PR: `harness` job runs after `smoke` job, on changes to `src/`, `scripts/`, `test/harness/`.
- Main: nightly at 12:00 UTC. Auto-commits updated `p95.json` with `[skip ci]`.

## When to bump the dependency on Kalshi

If `@modelcontextprotocol/sdk` ships a major version, run `harness:read-only` against the new version before merging. Bumps in `zod` should be no-ops; bumps in `zod-to-json-schema` regenerate baselines (`harness:update-baselines`) and re-commit.
