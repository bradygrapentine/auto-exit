# TUI Smoke

## Manual run

```bash
cd code-and-docs-from-chatgpt/engine-ts
LIVE_TUI=1 npx vitest run test/tui-app.test.tsx -t "live smoke"
```

Renders each tab against your active credentials profile. Read-only.

> Note: There is no `smoke:tui` npm script — run the command above directly. This avoids a merge conflict with the parallel MCP-smoke branch that owns `package.json`.

## What it catches

- Crash on tab switch (component error boundary failure).
- Account tab failing to load credentials.
- Any tab that throws during initial render.

## What it doesn't catch

- Visual regressions (layout, colors).
- Real keyboard interaction in a real terminal.
- Tabs that render fine but fetch wrong data — that's the MCP smoke's job.

## When to run

- Before merging anything that touches `src/tui/`.
- After bumping ink or react.

## When to delete this test

When the TUI is replaced. This is interim infra — don't grow it.
