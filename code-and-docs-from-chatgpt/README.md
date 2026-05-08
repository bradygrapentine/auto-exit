# Kalshi Exit Assistant — Local MVP

Local-first MVP for exiting a preselected losing Kalshi YES/NO position.

## What is included

- `engine-ts/` — TypeScript CLI + local HTTP bridge.
- `extension/` — complete loadable Chrome extension that talks to the local engine.
- `docs/` — roadmap, architecture, UI, and premium feature notes.

## V1 strategy

Kept in V1:

- full-depth cumulative pricing
- tiny-liquidity filter
- final tail sweep
- fixed chunk by default, optional mild adaptive chunking
- dry-run default
- one selected market + one selected side only

Not in V1:

- winning exits as live execution
- cloud backend
- account system
- payment layer
- predictive/variance model

## Recommended baseline exit strategy

For general-purpose exit on losing yes-side positions, use **`trailing_stop` with `trailCents: 10`** (a watcher synthetic). This recommendation is grounded in the 2026-05-08 backtest cluster across 6 shape-diverse recordings:

- **5533¢ avg pnl** across rising / falling / sideways books — beats `s-aggressive` (5318) by ≈4% and matches the per-shape oracle within 1%.
- See `engine-ts/docs/runbooks/2026-05-08-strategy-comparison-v4.md` and `engine-ts/docs/runbooks/2026-05-08-auto-calibration-v6-v7.md` for the supporting data.
- The regime-aware `auto` strategy (`engine-ts/src/backtest/adapters/autoAdapter.ts`) was evaluated as an alternative; on these recordings it never beat `trailing_stop`. Available as opt-in for experimentation but not recommended as a default.

Override per-call via the engine's strategy parameter; this is a recommendation, not a hardcoded default.

### When to opt into `auto`

The `auto` strategy (regime-aware, with optional rolling re-classification) was evaluated against the same recording set + synthesized multi-regime variants. Findings:

- **Average lift over `trailing_stop trailCents=10`: +0.6%** — within noise. Not worth choosing as a default.
- **+6.7% lift on rising→falling and rising→sideways→falling** synthetic recordings, where auto's first-tick classification picks `s-passive` (sideways) and captures slow upward drift before the reversal.
- **Rolling re-classification (`reclassifyInterval > 0`) currently adds zero** — the chosen inner strategies fill before mid-recording switching can take effect. Rolling machinery is preserved for future scenarios with slow-execution strategies (see SH-SLOW-EXECUTION-STRATEGY).

**Use `auto` when:** you expect the position's first ~200 ticks to be a slow upward drift that will reverse later. The agent's choice; not the default.

**Use `trailing_stop trailCents=10` otherwise.** This is the engine's recommended baseline.

## Quick start

```bash
cd engine-ts
npm install
npm run server -- --config ./config.example.json
```

Then load the extension:

1. Open Chrome `chrome://extensions`
2. Enable Developer Mode
3. Click Load unpacked
4. Select the `extension/` folder
5. Open a Kalshi market page
6. Use Preview first

## Safety

Keep `dryRun: true` while testing. The local engine requires explicit market ticker, side, and position size. Chunk size is capped at 500 in server validation.
