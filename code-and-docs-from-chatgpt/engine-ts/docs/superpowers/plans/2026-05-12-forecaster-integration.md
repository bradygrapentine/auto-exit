# Forecaster integration — orderbook scraping, backtest, and live orchestration

**Date:** 2026-05-12
**Status:** Draft — awaiting approval
**Author:** Claude (Opus 4.7)

## Goal

Use the existing Kalshi Exit Assistant (KEA) as the execution layer for two
sibling forecaster projects (`~/projects/oil-forecaster`,
`~/projects/weather-forecaster`). For the next 1–3 months while the forecasters
train, KEA scrapes orderbook data for their target markets so we can backtest
exit strategies on those specific markets before going live. When the
forecasters are ready, a scheduled agent reads each report, opens KEA, and
registers entry + exit strategies via the MCP.

## What's already in place vs what needs building

Reviewer caught two false "already exists" claims in the first draft. Corrected table — anything in the **Gap** column is new work for Phase 1.

| Capability | Where | Status | Gap |
|---|---|---|---|
| Multi-ticker orderbook recorder | `engine-ts/src/backtest/multiTickerRecorder.ts` | ✅ Exists | None |
| Recording format + replay | `engine-ts/src/backtest/{recorder,loader,replayClient}.ts` | ✅ Exists | None |
| Backtest harness | `engine-ts/src/backtest/harness.ts` + `sweep.ts` | ✅ Exists | None |
| `kea record start` CLI | `src/cli.ts` + `multiTickerRecorder` | ✅ Exists | None |
| `kea record discover` CLI | `src/backtest/discover.ts` | ⚠️ Partial — category-volume heuristic only (top-K series per category, hotPerCategory cadence flag) | **Does NOT read forecaster configs.** Need new `discover-from-forecasters` subcommand (see Phase 1 task 2). |
| `kea record sync` CLI | `src/backtest/sync.ts` | ⚠️ Partial — `fly ssh console -C "tar czf -"` piped to local `tar xzf` | **No rsync, no `--delete-after-sync`, no per-file ack.** Needs manifest-based atomic protocol (Phase 1 task 4). |
| Fly.io deploy runbook | `deploy/README.md` | ✅ Exists | None — runbook is followed verbatim |
| MCP surface | `engine-ts/src/mcp.ts` | ✅ Exists | None (Phase 3 only) |
| Strategy/synthetic library | `engine-ts/src/strategies/`, `engine-ts/src/synthetics/` | ✅ Exists | None |

Phase 1 has **three new implementation tasks** (discover-from-forecasters, manifest-based sync, remote-cleanup primitive) plus deploy/retention wiring. It is not pure config.

## Forecaster surface area

### oil-forecaster

- **Series:** `KXWTI` (WTI front-month daily settle)
- **Strikes:** $87.99–$109.99 at $1 increments (13 strikes per event), live event example `KXWTI-26MAY12`
- **Forecast cadence:** on-demand `oilfc forecast` + 30-min `scan-tick` daemon
- **Reports:** `~/projects/oil-forecaster/data/reports/{ISO-timestamp}.html`
- **Structured output alongside HTML:** `data/forecasts/{date}.jsonl` — per-strike `P(>=K)`, Kalshi yes_mid, edge, Brier score
- **Strike config:** `configs/strikes.yaml`

### weather-forecaster

- **Series:** `KXHIGHNY`, `KXHIGHCHI`, `KXHIGHPHIL`, `KXHIGHMIA`, `KXHIGHLAX`, `KXHIGHDEN` (6 cities)
- **Brackets:** 10–12 thresholds per city (≈60–72 markets/day)
- **Forecast cadence:** on-demand `wxfc forecast` + 15-min `scan-daemon`
- **Reports:** `~/projects/weather-forecaster/data/reports/{date}.html`
- **Structured output:** `data/forecasts/{date}.jsonl` (per-bracket probabilities + Kelly $ stake), `data/scans/{date}.jsonl` (orderbook snapshots), `data/realized/{date}.json`
- **Bracket config:** `configs/thresholds.yaml`

The weather forecaster *already* pulls Kalshi orderbook snapshots into
`data/scans/`. We will NOT duplicate that — KEA's recorder runs on the
research-account keypair against full per-tick depth, separately from the
forecaster's ad-hoc snapshots. The forecaster's scans stay where they are.

## Phase 1 — Scrape orderbook data for forecaster markets

**Goal:** Continuously record orderbook depth for every market the two
forecasters care about, deployed to Fly.io, for the 1–3 month training window.

### Storage math (with actual measurements)

Sampled three existing recordings on 2026-05-12:

| Recording | Snaps | Bytes | B/snap |
|---|---:|---:|---:|
| `KXETHD-26MAY0817-T2209.99-20260510.ndjson` | 1,970 | 311,296 | **158** |
| `KXSPACEXCOUNT-26MAY-12-20260508.ndjson` | 23,204 | 9,062,345 | **390** |
| `KXNASDAQ100U-26MAY08H1600-T28199.99-20260512.ndjson` | 250 | 42,000 | **168** |

Observed range: **158–390 B/snapshot**, mean ~240 B. Reviewer's depth-10
800–1200 B assumption was not borne out by the existing data.

Cadence × ticker count:

- KXWTI: 13 strikes × 500ms during oil hours (6.5h) + 2s off-hours (17.5h)
  ≈ **1.0M snaps/day**
- KXHIGH*: ~72 markets × 1.5s × 24h ≈ **4.1M snaps/day**
- Total: ~5.1M snaps/day

Daily storage estimate (forecaster-only):
- Low (158 B/snap): **0.81 GB/day**
- Mean (240 B/snap): **1.23 GB/day**
- High (390 B/snap): **2.0 GB/day**

Including the broader `discover` ticker set (~75 additional markets at
1.5s cadence, per the existing scanner's category-volume policy):
**roughly 2× the forecaster-only numbers, so 1.6–4.0 GB/day**, ~150–360 GB
over 90 days locally. Fly hot retention tightened from 7 → 5 days to
keep the 10 GB volume comfortable. Verify with `wc -c` on the first
week's recordings — if mean B/snap exceeds 500, compress NDJSON on
rotation or shrink retention further.

### Tasks

1. **Cadence policy.**
   Token bucket 15 req/sec shared (conservative; existing recorder defaults
   30 but we share the budget). Per-ticker cadence: KXWTI hot 500ms during
   oil hours, 2s off-hours. KXHIGH* standard 1.5s. Document in
   `engine-ts/docs/runbooks/2026-05-12-forecaster-tickers.md` and verify
   no 429s in `fly logs` after 24h.
2. **NEW WORK: `kea record discover-from-forecasters` subcommand.**
   Owned file: new `engine-ts/src/backtest/discoverForecasters.ts`. CLI
   wiring in `src/cli.ts`. **Read-only access to sibling forecaster repos**
   — must NOT edit anything under `~/projects/oil-forecaster/` or
   `~/projects/weather-forecaster/`. Behavior:
   - Reads `~/projects/oil-forecaster/configs/strikes.yaml`, expands the
     KXWTI strike grid (optionally ±5 strikes beyond the configured range
     for insurance against price drift), calls Kalshi `/events?series_ticker=KXWTI&status=open`,
     filters markets by strike membership.
   - Reads `~/projects/weather-forecaster/configs/thresholds.yaml`, iterates
     `(city, bracket)`, calls `/events?series_ticker=KXHIGH{NY,CHI,PHIL,MIA,LAX,DEN}&status=open`,
     filters markets by bracket membership.
   - **Joins each ticker entry with the forecaster's current conviction
     band** (read latest row from `data/forecasts/{date}.jsonl`) and stores
     it in a sidecar `tickers.metadata.json` next to `tickers.json`. Phase
     2 sweep depends on conviction being recorded at scrape time; expensive
     to backfill.
   - Writes a partial `tickers.forecaster.json` in `multiTickerRecorder`
     format (forecaster markets only, with conviction metadata). The
     **daily Fly cron runs `kea record discover` FIRST** (existing
     category-volume heuristic, broad market coverage — BTC/ETH/Fed/NBA/etc.)
     to produce `tickers.discover.json`, then runs
     `kea record discover-from-forecasters` to produce
     `tickers.forecaster.json`. A new `kea record merge-tickers` step
     unions the two into the final `tickers.json` consumed by
     `multiTickerRecorder`. Forecaster entries override discover entries
     on key collision (so conviction metadata wins).
   - **Rationale:** broader market coverage gives Phase 2 a cross-market
     baseline to compare forecaster-market strategy performance against.
     Disabling discover to make room for forecasters would lose useful
     data already being collected.
3. **Wire forecaster tickers into the already-running scanner.**
   The `auto-exit-scanner` Fly app is **already deployed and running** in
   region `iad` (verified 2026-05-12 via `fly status -a auto-exit-scanner`)
   on **WebSocket transport** (`SH-SCANNER-WS` shipped 2026-05-09 via PRs
   #159–#162; `KEA_SCANNER_TRANSPORT=ws` env var, zero HTTP 429s in
   production). No new deploy needed — we add the forecaster tickers to
   the existing `tickers.json` on the running app's volume. Mechanism:
   - Daily Fly cron runs the new `discover-from-forecasters` +
     `merge-tickers` commands and writes the result to `/data/tickers.json`.
   - Recorder reloads `tickers.json` on file-mtime change (verify this
     exists in `multiTickerRecorder.ts`; if not, the daily cron triggers
     `fly deploy` or a machine restart). If a reload mechanism isn't there
     already, that's a small task to add.
   - Volume already provisioned via `SH-SCANNER-WS` deploy; check whether
     it's already 10 GB or still 5 GB and extend if needed.
   Cost stays ~$2–4/mo (machine + volume already running for the broader
   scanner, no incremental cost from adding forecaster tickers).
4. **NEW WORK: manifest-based atomic sync with remote cleanup.**
   Current `sync.ts` is tar-pipe over `fly ssh console`. Extend it (or
   write `syncAtomic.ts`) with this protocol:
   1. On the Fly machine: emit `find /data/recordings -type f -name '*.ndjson'
      -printf '%P\t%s\t%T@\n'` → call this the **remote manifest** (path,
      size, mtime). No sha256 — tar-pipe is a single stream and a second
      remote `sha256sum` pass would double the wall-clock; byte-size +
      file-count is the integrity gate.
   2. Stream the tar into a fresh staging dir `${localDir}.staging-<ts>/`.
      Verify post-extract: file count matches the manifest, every file's
      byte size matches the manifest. Mismatch → abort, leave staging dir
      for inspection, exit non-zero.
   3. **Directory-level atomic swap** (not per-file rename):
      - `mv ${localDir} ${localDir}.prev-<ts>` (if it exists)
      - `mv ${localDir}.staging-<ts> ${localDir}`
      - On any error mid-swap, restore `${localDir}.prev-<ts>` → `${localDir}`
        and exit non-zero. (Per-file rename had a partial-state window;
        directory rename is atomic on the same filesystem.)
      - After successful swap, merge any pre-existing per-file content from
        `.prev-<ts>` that isn't in the new dir (handles overlap-window
        downloads). Then delete `.prev-<ts>`.
   4. **Only after** steps 1–3 succeed: `fly ssh console -C "find
      /data/recordings -type f -name '*.ndjson' -mtime +7 -delete"`
      (controlled by `--delete-remote-older-than-days N`, default off;
      operator opts in once the protocol is verified on a real day).
   5. Write a local `sync-receipt-<timestamp>.json` capturing manifest +
      result. Skipped/failed files surface in non-zero exit code.
   Anti-pattern guard: a partial extract with a successful exit is a
   data-loss bug. Tests must cover (a) mid-stream tar abort
   (b) full local disk during staging extract (c) byte-size mismatch
   (d) crash between the two `mv` calls in step 3.
5. **Pull-down schedule.**
   Nightly `launchd` job on the user's laptop runs `kea record sync
   --delete-remote-older-than-days 7` once the protocol from task 4 has
   been operator-verified on a single day's data. Until then, default to
   pull-without-delete.
6. **Kill switch.**
   `fly ssh console -C "touch /data/PAUSE"` → recorder loop checks for
   `/data/PAUSE` once per cadence tick and skips its poll. Add a `kea
   record pause` / `record resume` CLI as a convenience. Acceptance:
   pausing produces zero new snapshots within 30s; trading-account
   `kea_balance` MCP call latency unaffected (the scraper uses a
   separate research keypair, but this is the explicit verification).

### Acceptance (concrete, command-checkable)

- `fly status` reports `state: started`; `fly logs --no-tail` last 5 min
  contains zero `429` lines.
- `tickers.json` regenerates daily — `fly ssh console -C "stat -c %Y
  /data/tickers.json"` shows mtime within 26 h.
- After 30 calendar days from deploy:
  - **Primary gate (continuous coverage):** new
    `kea record coverage --since 30d --max-gap-seconds 600` returns exit
    code 0. Failure prints the largest gap per ticker. This is the
    acceptance signal — file existence alone is insufficient (a 200-byte
    file passes a count check but represents no real coverage).
  - **Secondary sanity check:** `find ~/.kalshi-exit-assistant/recordings/forecaster
    -name '*.ndjson' -mtime -30 | wc -l` returns ≥ (#tickers × 30 × 0.95).
    Informational only — coverage check is the gate.
- `kea record sync --dry-run` on the most recent day exits 0 with manifest
  file-count and total-bytes matching post-extract.
- Kill switch: `kea record pause` followed by `fly logs` shows the loop
  message `PAUSE detected, skipping tick` within 30 s.

### Scope contract (Phase 1)

- **Files owned (write access):** `engine-ts/src/backtest/discoverForecasters.ts`,
  `engine-ts/src/backtest/syncAtomic.ts` (or extension of `sync.ts`),
  `engine-ts/src/cli.ts` (add subcommands), `engine-ts/src/backtest/retention.ts`
  (cleanup primitive only), `deploy/README.md` (cleanup-flag docs only),
  `engine-ts/docs/runbooks/2026-05-12-forecaster-tickers.md`.
- **Read-only access:** `~/projects/oil-forecaster/configs/strikes.yaml`,
  `~/projects/weather-forecaster/configs/thresholds.yaml`, the forecasters'
  `data/forecasts/{date}.jsonl` outputs. **No edits to sibling repos under
  any circumstance** — including "while I'm here, normalize the schema."
  If a forecaster config format is unworkable, surface the issue and stop.
- **Out of scope for Phase 1:** any MCP changes, any strategy library
  changes, any backtest harness changes (Phase 2), any live trading
  surface (Phase 3), the WebSocket spike (see Open Questions).

### Open questions

- **Kalshi WebSocket spike (`SH-SCANNER-WS`).** Sub-hour spike to test
  `orderbook_delta`. Not required for Phase 1. Deferred unless the user
  explicitly opts in.

## Phase 2 — Backtest exit strategies on forecaster markets

**Goal:** Once Phase 1 has ≥30 days of recordings, run the existing backtest
harness against forecaster-market recordings and rank exit strategies. Output:
an ADR-style decision per market category (oil, weather) on which exit
strategy + trigger config to use live.

### Tasks

1. **Recording catalog filter.**
   Extend `engine-ts/src/backtest/list.ts` (or a new `catalog-forecaster.ts`)
   to filter recordings by `KXWTI*` and `KXHIGH*` and tag them with the
   forecaster's contemporaneous probability + recommended side (joined from
   `data/forecasts/{date}.jsonl`). This is the dataset the harness consumes.
2. **Sweep parameters.**
   Reuse `engine-ts/src/backtest/sweep.ts` — sweep `trailing_stop trailCents
   ∈ {5,10,15,20}`, `s_twap`, `s_iceberg`, `s_passive` (the v3.3 sweep
   strategies). Keep `fillModel: 'queue_aware'` (now default per ADR-0001).
3. **Entry assumption.**
   For each recording, simulate buying at the forecaster-recommended side
   at the first-tick mid (or at the forecaster's Kelly-stake-implied price),
   then run the exit strategy. Net PnL semantics from PR #186.
4. **Per-category report.**
   Generate `engine-ts/docs/runbooks/2026-XX-XX-forecaster-strategy-sweep.md`
   — one runbook per market category, table of `(strategy, params) → net PnL,
   hit rate, mean holding time`. Decide baselines via ADR.
5. **Strategy/trigger pairing.**
   Every recommended strategy must ship paired with a trigger config (per
   project convention). Document the pairing in the ADR.

### Acceptance

- Sweep runbook(s) report **≥100 fills per `(strategy, params)` cell**.
  Cells below 100 are dropped from the recommendation set, not "flagged"
  — they don't appear in the final table. (Verified by `engine-ts`
  unit count column in the runbook.)
- Two new ADRs land. **Numbers reserved against `docs/adr/` at the time of
  writing:** current state has only `0001-trailing-stop-baseline.md`, so
  next free numbers are 0002 and 0003. Confirm via `ls docs/adr/` before
  filing — if other ADRs land in between, increment.
- `docs/adr/0002-forecaster-oil-exit-baseline.md` and
  `docs/adr/0003-forecaster-weather-exit-baseline.md` each name an exit
  strategy + trigger pair.
- Backlog row `SH-FORECASTER-BACKTEST` flipped to ✅ Done.

### Open questions

- **Forecaster confidence signal.** Should the chosen exit strategy depend on
  the forecaster's conviction band? E.g. high-conviction weather forecast →
  more patient `s_passive`; low-conviction → faster `trailing_stop`. Sweep
  with conviction band as a dimension; pick after seeing data.
- **Cross-category transfer.** If KXWTI's best baseline differs sharply from
  KXHIGH*'s, that's a finding for the strategy library; flag and discuss.

## Phase 3 — Live orchestration via scheduled agent + MCP

**Goal:** When forecaster training is complete (≥1–3 months in, calibration
report green), wire a scheduled agent that reads the latest forecaster HTML
report, opens KEA, registers entries + exits via the MCP, and lets the engine
run.

### Architecture sketch

```
[launchd / Fly cron]
    └─> wxfc forecast / oilfc forecast    (existing CLIs)
         └─> writes data/forecasts/{date}.jsonl + data/reports/{date}.html
              └─> [Claude Code skill: forecaster-trade] reads JSONL
                   ├─> for each row above edge threshold:
                   │     ├─> kea_balance / kea_safety_get (sanity)
                   │     ├─> kea_preview (entry — aggressive or passive limit)
                   │     ├─> kea_strategy_run / kea_strategy_limit_ladder (entry)
                   │     ├─> kea_synthetic_register (exit — trailing_stop per ADR-0002/-0003)
                   │     └─> kea_journal_list (write decision to journal)
                   └─> writes summary to engine-ts/docs/runbooks/{date}-live-session.md
```

### Tasks

1. **New skill: `forecaster-trade`.**
   Project-level skill at
   `~/projects/auto-exit/.claude/skills/forecaster-trade/SKILL.md`. Reads the
   most recent `data/forecasts/{date}.jsonl` from each forecaster, filters
   to rows where `edge ≥ threshold` (configurable per forecaster, default
   from each forecaster's docs), and emits a sequence of MCP calls.
   - Pre-flight: `kea_balance`, `kea_safety_get`, `kea_forbidden_list`.
   - Per row: `kea_preview` → user-confirm gate OR auto-execute below dollar
     cap → `kea_strategy_run` (entry) + `kea_synthetic_register` (exit pair
     per ADR).
   - Post: write a runbook entry summarizing what was attempted, what filled.
2. **Schedule — active-session-only; late-session settles are manual.**
   The global `~/.claude/CLAUDE.md` "No Overnight Plans" rule forbids
   unattended overnight automation and **cannot be overridden by this
   plan**. Phase 3 schedule fires `/forecaster-trade` only during the
   user's active trading window (9am–5pm ET) and only when a Claude Code
   session is attached. **Late-session events outside that window
   (e.g. weather highs that settle near 6pm ET) are handled manually by
   the user from the HTML report.** The agent does not extend its window
   for them. This is an accepted limitation of the no-overnight rule, not
   a TODO to revisit. If the user wants automated late-session execution,
   that's a separate decision about the no-overnight rule itself — file
   it before changing this plan.
3. **Safety guardrails.**
   - Hard dollar cap per market, per session (env var or config row).
   - `forbiddenTickers` list pre-populated for anything the user wants to
     blacklist.
   - Mutation MCP tools gated to demo until the user explicitly flips a
     "live" flag (matches existing `DEMO_BASE_URL` discipline).
   - All preview → execute steps logged to the journal for replay.
4. **Manual-override path.**
   The HTML report stays human-readable; user can ignore the agent and
   trade manually from the report. Agent is additive, not mandatory.

### Acceptance

- Dry-run mode: `/forecaster-trade --preview` shows the full sequence of MCP
  calls without executing.
- Live mode behind explicit env flag.
- Every session writes a runbook entry; the journal-replay tool can
  reconstruct decisions.

### Open questions

- **Entry strategy.** The forecasters recommend a *direction* and a Kelly
  stake but don't specify entry tactics. Default: `s_passive` limit at the
  current bid+1¢ for `edge > 5¢` opportunities, `s_aggressive` IoC at the
  ask for `edge > 15¢`. Refine after Phase 2 data.
- **Multiple forecasts per day.** Weather forecaster scans every 15 min — do
  we re-enter on updated forecasts, or commit to one entry per market per
  day? Default: one entry, then synthetics handle exit; agent skips markets
  with open positions.
- **Co-existence with manual trading.** If the user trades manually from the
  HTML report, the agent must not double-up. Pre-flight checks open
  positions and resting orders; skips any ticker with non-zero exposure.

## Risks

| Risk | Mitigation |
|---|---|
| Forecaster ticker config drift (new cities, new strike grids) | Daily `discover-from-forecasters` rerun + diff against previous day's tickers.json |
| Kalshi rate-limiting from over-eager polling | Existing token bucket + `KEA_SCANNER_RATE_PER_SEC` env var; start conservative (15 req/s shared) |
| Fly volume disk full | Retention policy + weekly `fly volumes show` check; gzip rotation in `retention.ts` if needed |
| Forecaster HTML/JSONL format changes break the parser | Skill consumes structured JSONL, not HTML; pin to schema version and warn on diff |
| Live agent fires mid-resolution on a market that just settled | Pre-flight `kea_orderbook` check rejects markets with `status != open` |
| Drift between research-account scraper and trading-account execution | Use SAME Kalshi API URL (prod vs demo gated explicitly); document base URL per phase |

## Sequencing

```
NOW         → Phase 1 deploy + first 30 days of recording (mostly passive)
+30 days    → Phase 2 sweep + ADRs (a few focused work-sessions)
+60–90 days → Phase 3 live agent (only after forecasters report green calibration)
```

Phase 1 and the forecaster training run in parallel; Phase 2 and Phase 3 are
gated on data and calibration respectively.

## Backlog rows to add

When this plan is approved, `/backlog-sync` should add the rows below to
`code-and-docs-from-chatgpt/docs/BACKLOG.md`. **Confirm no collisions first**
via `grep '^- SH-FORECASTER\|^- SH-SCANNER-WS' code-and-docs-from-chatgpt/docs/BACKLOG.md`
— if any ID already exists, increment with `-V2` or similar.

- `SH-FORECASTER-DISCOVER` — ticker discovery from forecaster configs (Phase 1.2)
- `SH-FORECASTER-TICKER-MERGE` — merge `discover` + `discover-from-forecasters` into final `tickers.json` (Phase 1.2)
- `SH-FORECASTER-SYNC-ATOMIC` — manifest-based atomic sync + remote cleanup (Phase 1.4)
- `SH-FORECASTER-DEPLOY` — Fly.io deploy for forecaster ticker set (Phase 1.3)
- `SH-FORECASTER-COVERAGE` — `kea record coverage` CLI (Phase 1 acceptance)
- `SH-FORECASTER-KILL-SWITCH` — `/data/PAUSE` sentinel + `kea record pause/resume` (Phase 1.6)
- `SH-FORECASTER-BACKTEST` — sweep + ADRs (Phase 2)
- `SH-FORECASTER-LIVE-AGENT` — `/forecaster-trade` skill (Phase 3)

~~`SH-SCANNER-WS`~~ — already shipped 2026-05-09 (PRs #159–#162); recorder
is on WebSocket transport in production.

## Open decisions for user

1. ~~Reuse `auto-exit-scanner` Fly app or new app?~~ **Decided 2026-05-12: reuse** (cost + per-account rate budget).
2. ~~Volume sizing & retention.~~ **Decided 2026-05-12: extend to 10 GB + manifest-based atomic sync with `--delete-remote-older-than-days 7`** (full archive lives on the local laptop; protocol detailed in Phase 1 task 4).
3. ~~Record conviction band alongside each recording for Phase 2 sweep.~~ **Decided 2026-05-12: yes** — `discoverForecasters.ts` writes a `tickers.metadata.json` sidecar; cheap now, expensive to backfill.
4. ~~Record `KXWTI` strikes outside the forecaster's grid.~~ **Decided 2026-05-12: yes, ±5 strikes beyond the configured range** as insurance against price drift.
5. ~~WebSocket spike (`SH-SCANNER-WS`).~~ **Already shipped 2026-05-09** (PRs #159–#162); scanner runs on WS transport in production. No spike needed.
6. ~~Live-agent confirmation gate.~~ **Deferred to Phase 3** — out of scope now; we're focused on data gathering during the forecaster training window.
