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
