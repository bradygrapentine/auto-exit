# SH-EDGE — per-strategy edge dashboard introduction

**Status:** v1 shipped 2026-05-09. Spec: `docs/superpowers/specs/2026-05-05-pnl-attribution.md`.

## What it does

Reads `${KEA_HOME}/jobs/*.jsonl` journals and produces a snapshot decomposing every fire's realized P&L into:

- **Entry edge** — how much better than arrival mid we got our entry fill
- **Exit edge** — how much better than the immediate-exit benchmark we got our exit fill
- **Market drift** — how the mid moved between entry and exit decisions
- **Slippage** — sum of TCA slippage across all chunks
- **Trigger quality** — how close our exit was to the optimal-hindsight peak/trough within the trigger window
- **Residual** — anything not attributed by the additive model

## Surfaces

- **CLI:** `node dist/cli.js edge [--since YYYY-MM-DD] [--strategy S] [--trigger T] [--market C] [--param P] [--min-notional $]`
- **MCP:** `kea_edge_summary { since?, until? }`, `kea_edge_per_strategy { strategy, since? }`
- **TUI:** Edge tab (`9` or `e` from the dashboard)

All three surfaces share the same pipeline (`src/edge/pipeline.ts`) and produce the same snapshot shape. They differ only in rendering.

## How to read the report

### Default summary

One row per strategy. Sort key: `Avg/Fire` (avg edge per fire). Columns:

| Field | Means |
|---|---|
| Fires | n fires attributed to this strategy in the lookback window |
| TotalPnL | Sum of realized P&L across all fires for the strategy |
| Avg/Fire | TotalPnL / Fires |
| Sharpe | TotalPnL / stdev(per-fire P&L). Above 1.0 is decent for our regime |
| EntryEdge | Total entry-edge component across fires |
| ExitEdge | Total exit-edge component |
| Drift | Total market-drift component (this is "what happened to me, not because of me") |
| Slip | TCA slippage |

If a strategy shows **n < 5 fires**, treat its average as noise.

### Trigger histogram (`--trigger`)

For each trigger kind: how many fires were too-early (exited above optimum), on-time (within $0.01/share), too-late. A bimodal distribution is a sign your trigger params are mismatched to the market regime.

### Parameter sensitivity (`--param trailCents`)

For one trigger param, the edge curve as a function of value. Used to tune trail distance, take-profit threshold, etc.

## Resolution enrichment (Task 7)

By default, fires whose markets haven't yet settled are marked-to-mid. Pass a `MarketResolutionFetcher` to `generateSnapshot()` (programmatic API) to enrich resolved fires with their actual settlement price (0 or 100 cents). The CLI does NOT enable this by default — requires Kalshi REST credentials and adds latency. To turn it on for an analysis run, write a small script that imports `pipeline.ts` directly and supplies a fetcher.

The cache lives at `${KEA_HOME}/edge-snapshots/resolutions.json` and is append-only (a resolved market never un-resolves).

## Caveats / known gaps

- **`strategy: 'unknown'` for many fires.** Most engine entry points don't include `strategy` in `loop_started.data`. Until that's fixed (SH-EDGE-LOOP-STRATEGY-FIELD), edge-by-strategy aggregation is incomplete.
- **Mock/test journals dominate counts.** Anything with ticker `KXTEST` is dry-run / development noise and should be filtered out for real analysis. Use `--min-notional` and inspect ticker breakdowns.
- **30-day default lookback** matches the spec. Earlier journals may be missing fields the pipeline depends on (older recordings predate `tca` entries).
- **Residuals.** A non-zero residual means the additive attribution didn't fully reconcile. Spot-check `--strategy <name>` rows where `|residual| > $1 × fires`.

## Smoke commands

```bash
# Full report, last 30 days
node dist/cli.js edge

# Trigger fire-quality histogram
node dist/cli.js edge --trigger trailing_stop

# Parameter sensitivity for trail distance
node dist/cli.js edge --param trailCents

# Market segmentation
node dist/cli.js edge --market

# Drill into one strategy
node dist/cli.js edge --strategy s-trail
```

## Reproducing the smoke validation that landed v1

On 2026-05-09 against `~/.kalshi-exit-assistant/jobs/` (~18k files, ~5k fires after `joinFires`):

- Ran `node dist/cli.js edge --since 2026-04-01 --min-notional 0`
- Result: 5,233 fires, dominated by `KXTEST` mock-journal noise; `unknown` strategy bucket (loop_started missing strategy field)
- No NaN, no crashes, all components computed
- Filed follow-ups: **SH-EDGE-LOOP-STRATEGY-FIELD** (populate `strategy` in `loop_started.data`), **SH-EDGE-FILTER-MOCK-JOURNALS** (skip `KXTEST` and dryRun=true entries by default)
