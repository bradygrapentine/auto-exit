# Multi-Ticker Scanner + Fly.io Deploy Cluster

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Deploy a recording-only scanner to Fly.io that polls 50 Kalshi tickers across 6 categories (10 hot at 500ms, 40 standard at 2s) and writes NDJSON snapshots to a Fly volume. Local `kea recording sync` pulls cumulative data on demand for SH-BACKTEST replay.

**Architecture:**
- **Engine side** (Track A): standalone `kea record start --tickers-file <path>` CLI subcommand wrapping the existing `Recorder` (Phase A shipped #97). Multi-ticker orchestrator runs N recorders concurrently with per-ticker cadence. `discover-tickers.ts` auto-samples diverse tickers from `/markets`. `kea recording sync` is a thin rsync wrapper for pulling from VPS to local.
- **Ops side** (Track B): Dockerfile builds the engine, Fly.io config provisions a 5GB volume + secrets for the research-account Kalshi keypair, deploys to one machine.

**Phasing:**
- **Track A** (engine — single Sonnet agent): CLI + multi-ticker orchestrator + discover script + sync wrapper + tests. Branch `feat/scanner/engine`.
- **Track B** (ops — single Sonnet agent): Dockerfile + fly.toml + deploy README + secrets stub. Branch `feat/scanner/ops`.
- **Phase D**: backlog sync + actual deploy invocation (manual; user runs `fly deploy` once both PRs merge and they've added their research-account API keys).

Both tracks dispatchable in parallel — disjoint files. Track B's Dockerfile targets a CLI surface defined by Track A; if A merges first, B's image will build correctly from main. If B merges first, the deploy is a no-op until A lands.

**Hard non-goals:**
- WebSocket streaming (deferred — track-B agent should briefly investigate Kalshi WS API as part of deploy README, document findings, but ship REST-only).
- Trade-prints endpoint capture (follow-up).
- Auto-deploy from CI on merge (manual `fly deploy` for now).

---

## Track A — Engine (recording CLI + orchestrator)

**Owned files:**
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/cli.ts` — add `kea record start --tickers-file <path>` subcommand, `kea record discover [--out <path>]`, `kea record sync --from <host:path>`.
- Create: `code-and-docs-from-chatgpt/engine-ts/src/backtest/multiTickerRecorder.ts` — `createMultiTickerRecorder({tickers: TickerEntry[], dir, client})` runs N recorders with tiered cadence. `TickerEntry = {ticker, cadenceMs}`.
- Create: `code-and-docs-from-chatgpt/engine-ts/src/backtest/discover.ts` — `discoverTickers({client, perCategory: 8, hotPerCategory: 2}): Promise<TickerEntry[]>`. Pulls `/markets?status=open`, groups by ticker prefix → category (NFL/political/weather/entertainment/economics/crypto), samples top-N by volume per category, marks top 2 per category as hot (500ms) and rest as standard (2s).
- Create: `code-and-docs-from-chatgpt/engine-ts/src/backtest/sync.ts` — wraps `rsync -avz --partial <remote> <local>`; reads remote host from env or CLI flag.
- Test: `test/backtest/multiTickerRecorder.test.ts`, `test/backtest/discover.test.ts`.

**Ticker file shape (input to `record start`):**
```json
{
  "tickers": [
    { "ticker": "KXNFL-26-DAL", "cadenceMs": 500 },
    { "ticker": "KXPRES-28", "cadenceMs": 2000 }
  ],
  "discoveredAt": "2026-05-07T..."
}
```

**Hard non-goals:**
- No watcher integration (existing watcher already wired to recorder in Phase A).
- No new MCP tools.
- No trade-prints capture.
- No WebSocket transport.

**Verify:** `npx vitest run` passes; `npx tsc --noEmit` clean.

**Branch:** `feat/scanner/engine`. PR `--base main`.

---

## Track B — Ops (Dockerfile + Fly.io)

**Owned files:**
- Create: `Dockerfile` (at repo root) — Node 20 alpine; copies `code-and-docs-from-chatgpt/engine-ts/`; runs `npm ci && npm run build`; default CMD `node dist/cli.js record start --tickers-file /data/tickers.json --recordings-dir /data/recordings`.
- Create: `fly.toml` (at repo root) — single 256MB shared-cpu-1x machine, region `iad`, mounts a 5GB volume at `/data`, sets app name placeholder `auto-exit-scanner`.
- Create: `.dockerignore` (at repo root) — excludes `node_modules`, `.git`, `worktrees/`, `.claude/`, `dist/`.
- Create: `deploy/README.md` — step-by-step:
  1. Create a separate Kalshi research account; generate API keypair.
  2. `fly auth signup` / `fly auth login`.
  3. `fly launch --no-deploy` (uses existing fly.toml).
  4. `fly volumes create scanner_data --size 5 --region iad`.
  5. `fly secrets set KALSHI_API_KEY_ID=... KALSHI_API_PRIVATE_KEY="$(cat key.pem)"`.
  6. Bootstrap tickers: locally run `kea record discover --out /tmp/tickers.json`, copy to volume on first deploy via `fly ssh console -C "echo $TICKERS_JSON > /data/tickers.json"`.
  7. `fly deploy`.
  8. Verify: `fly logs` shows `recording N tickers...`.
  9. Pull data: locally `kea record sync --from <fly-host>:/data/recordings/`.

**WebSocket investigation note:** in `deploy/README.md`, document a 30-min follow-up spike — try connecting to Kalshi's WS endpoint, see if `orderbook_delta` channel works with the research account's keypair. If yes, file a follow-up story `SH-SCANNER-WS` to switch primary transport. **Do not block this cluster on WS.**

**Hard non-goals:**
- No CI auto-deploy on merge (manual `fly deploy`).
- No multi-region deploys (single iad machine fine).
- No monitoring/alerting setup (defer to Phase 2).
- No CLI changes (Track A owns those).

**Verify:**
- `docker build -t auto-exit-scanner .` succeeds locally (or document if requires Docker not installed).
- `fly.toml` validates with the official schema.

**Branch:** `feat/scanner/ops`. PR `--base main`.
