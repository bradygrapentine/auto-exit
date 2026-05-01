# Local Extension Bridge

The extension does not store API keys or place orders directly.

Architecture:

```text
Chrome extension panel
  → background service worker
  → http://127.0.0.1:7777
  → local TypeScript engine
  → Kalshi API
```

## Endpoints

### GET /health

Checks that the local engine is online.

### POST /preview

Runs one dry-run orderbook decision and returns:

- orderbook
- price decision
- proposed order payload

### POST /start

Starts the local losing-exit loop using the config supplied by the extension.

### POST /stop

Requests stop.

### GET /status

Returns current job status and recent events.

## Why this design

- no public deployment required
- no cloud execution risk
- no browser-held private key
- extension is just a control panel
- local engine remains testable from CLI
