# Scanner Deploy — Fly.io

Manual deploy runbook for the multi-ticker Kalshi scanner. Run this once both
`feat/scanner/engine` and `feat/scanner/ops` have merged to main.

---

## Prerequisites

### 1. Separate Kalshi research account

Create a dedicated Kalshi account for data collection (keep it separate from
your trading account so balance stays $0 and there is no risk of accidental
orders).

Generate an RSA API keypair for that account:
- See Kalshi docs: https://trading-api.kalshi.com/docs#section/Authentication
- Kalshi API key management: log in → Settings → API Keys → Generate new key.
- Save the key ID and private key PEM file locally.

### 2. flyctl installed

```sh
curl -L https://fly.io/install.sh | sh
```

---

## Step-by-step deploy

### Step 1 — Authenticate

```sh
# New account:
fly auth signup

# Existing account:
fly auth login
```

### Step 2 — Initialize app (first time only)

Use the existing `fly.toml` at repo root. Do NOT let `fly launch` regenerate it.

```sh
# From repo root:
fly launch --no-deploy --copy-config
```

If prompted whether to overwrite `fly.toml`, choose **No**.

### Step 3 — Create persistent volume

```sh
fly volumes create scanner_data --size 5 --region iad
```

This is a 5 GB volume mounted at `/data` inside the machine. NDJSON snapshots
accumulate here between restarts.

### Step 4 — Set secrets

```sh
fly secrets set \
  KALSHI_API_KEY_ID=<your-research-account-key-id> \
  KALSHI_API_PRIVATE_KEY="$(cat /path/to/research-key.pem)"
```

Secrets are encrypted at rest and injected as env vars at runtime.

### Step 5 — Bootstrap tickers file (first deploy only)

After `feat/scanner/engine` merges, generate the tickers list locally:

```sh
kea record discover --out /tmp/tickers.json
```

Copy it onto the volume before the first deploy:

```sh
fly ssh console -C "mkdir -p /data"
fly ssh console -C "cat > /data/tickers.json" < /tmp/tickers.json
```

Verify:

```sh
fly ssh console -C "cat /data/tickers.json | head -5"
```

### Step 6 — Deploy

```sh
# From repo root:
fly deploy
```

First deploy builds the Docker image (1-3 min on Fly builders), pushes it, and
starts the machine.

### Step 7 — Verify

```sh
fly logs
```

Expected output within 30 seconds:

```
[scanner] tracking 50 tickers (12 hot, 38 standard)
[scanner] KXNFL-26-DAL cadence=500ms
...
```

Check machine status:

```sh
fly status
```

### Step 8 — Pull recordings locally

```sh
kea record sync \
  --from auto-exit-scanner.fly.dev:/data/recordings/ \
  --to ~/.kalshi-exit-assistant/recordings/
```

Run this on demand to pull incremental NDJSON data for SH-BACKTEST replay.
The sync uses `rsync --partial` so interrupted transfers resume cleanly.

---

## Redeploying after code changes

```sh
git pull origin main
fly deploy
```

Fly performs a rolling restart — the old machine stays up until the new image is
healthy.

---

## Costs

| Resource | Size | Est. monthly |
|---|---|---|
| shared-cpu-1x machine | 256 MB RAM | ~$1.94 |
| Persistent volume | 5 GB | ~$0.50 |
| **Total** | | **~$2–4/mo** |

Fly's hobby plan includes a free allowance that may cover this entirely
depending on usage. See https://fly.io/docs/about/pricing/ for current rates.

---

## WebSocket investigation TODO (30-min spike)

**Do not block the initial deploy on this.** Ship REST-only first.

When ready, try connecting to Kalshi's WebSocket endpoint with the
research-account keypair:

```
wss://api.elections.kalshi.com/trade-api/ws/v2
```

(Verify this URL in Kalshi's API docs — it may change.)

Subscribe to the `orderbook_delta` channel for one ticker:

```json
{
  "id": 1,
  "cmd": "subscribe",
  "params": {
    "channels": ["orderbook_delta"],
    "market_tickers": ["KXNFL-26-DAL"]
  }
}
```

Authentication: send the `Authorization: Bearer <token>` header or the
`login` message depending on which method Kalshi's WS API accepts (check docs).

**If it works:** file a follow-up story `SH-SCANNER-WS` to switch the
primary transport from REST polling to WS `orderbook_delta` + `ticker`
channels. This would reduce Kalshi API load and improve tick resolution
for hot tickers.

**If it fails or requires a paid account:** document the blocker in
`SH-SCANNER-WS` and keep REST polling.

---

## Troubleshooting

**Machine crashes on start** — `fly logs` will show the Node error. Most likely
cause before `feat/scanner/engine` merges: `dist/cli.js` does not export the
`record start` subcommand yet. Wait for that PR.

**Volume not found** — Run `fly volumes list` and confirm `scanner_data` exists
in region `iad`. Re-run Step 3 if missing.

**Secrets missing** — `fly secrets list` shows key names (not values). Re-run
Step 4 if `KALSHI_API_KEY_ID` is absent.

**rsync fails on `kea record sync`** — Fly machines are not always SSH-reachable
from outside without `fly proxy`. Alternative: `fly ssh sftp get` for one-off
pulls, or use `fly proxy 2222:22` and point rsync at `localhost:2222`.
