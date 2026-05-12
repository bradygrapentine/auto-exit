# Forecaster scanner deploy — operator runbook

**Story:** `SH-FORECASTER-DEPLOY` (Phase 1 of the forecaster-integration plan).
**Prereqs:** PRs #191 (slice 1) and #193 (slice 2) merged to main; latest `kea` CLI built locally (`npm run build` in `engine-ts/`).
**Audience:** the operator (Brady) on the local machine. Most steps need your laptop + `fly` + `kea` creds.

This runbook turns the new CLI primitives (discovery + atomic sync + coverage + kill switch) into a live data pipeline against the already-running `auto-exit-scanner` Fly app.

---

## Step 0 — Confirm starting state

```sh
fly status -a auto-exit-scanner
fly volumes list -a auto-exit-scanner
fly secrets list -a auto-exit-scanner
```

Expected:
- machine `state: started`, last updated within the last hour
- volume `scanner_data` present (size will be 5 GB unless previously extended)
- `KALSHI_API_KEY_ID` + `KALSHI_API_PRIVATE_KEY` set (per `deploy/README.md`)

Local prereq: `kea record discover-from-forecasters --help` should print usage. If it errors, rebuild:

```sh
cd code-and-docs-from-chatgpt/engine-ts
npm run build
```

---

## Step 1 — Extend the volume from 5 GB → 10 GB

The default Fly volume from the original scanner deploy is 5 GB. Forecaster tickers ~doubles the daily storage; with 7-day hot retention we want ≥10 GB headroom.

```sh
# Get the volume id
VOL_ID="$(fly volumes list -a auto-exit-scanner --json | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")"

# Extend in-place (no machine downtime)
fly volumes extend "$VOL_ID" --size 10 -a auto-exit-scanner

# Verify
fly volumes list -a auto-exit-scanner
```

Cost delta: ~$0.75/mo (5 GB → 10 GB at $0.15/GB/mo on Fly volumes).

---

## Step 2 — First-run verification of `sync-atomic`

**Before** you trust the atomic protocol enough to enable remote cleanup, run it once in observe-only mode (no `--delete-remote-older-than-days`).

```sh
# Pull a fresh manifest-verified snapshot to a scratch dir
kea record sync-atomic \
  --fly-app auto-exit-scanner \
  --remote /data/recordings \
  --to /tmp/forecaster-sync-test
```

Expected JSON output includes:
- `filesTransferred` == `manifestFiles` (verification passed)
- `bytesTransferred` > 0
- `remoteCleanupAttempted: false` (we didn't ask for it)

Cross-check the file count matches the live volume:

```sh
fly ssh console -a auto-exit-scanner -C "find /data/recordings -name '*.ndjson' -type f | wc -l"
ls /tmp/forecaster-sync-test/*.ndjson | wc -l
# Numbers should match.
```

If verification fails (`syncAtomic` exits non-zero), the staging dir under `/tmp/forecaster-sync-test.staging-*` is left in place for inspection — DO NOT proceed to step 3 until you understand the mismatch.

---

## Step 3 — Install the daily discover cron locally

The discover pipeline runs on the operator's machine (uses your local Kalshi creds + sibling-repo configs) and pushes the merged ticker file to the Fly volume.

```sh
# Smoke test once, with SKIP_RESTART=1 so the running scanner isn't disrupted
SKIP_RESTART=1 ./deploy/forecaster-discover-cron.sh
tail -50 ~/.kea/forecaster-discover/logs/forecaster-discover-*.log

# Inspect the merged ticker file
python3 -c "import json; d=json.load(open('$HOME/.kea/forecaster-discover/staging/tickers.json')); print('count:', len(d['tickers'])); print('first 3:', d['tickers'][:3])"
```

Expected: ≥100 tickers including KXWTI-* and KXHIGH*-* entries.

When you're satisfied, schedule via launchd. Save this plist as `~/Library/LaunchAgents/com.bradygrapentine.kea.forecaster-discover.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.bradygrapentine.kea.forecaster-discover</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>/Users/bradygrapentine/projects/auto-exit/deploy/forecaster-discover-cron.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>9</integer>
    <key>Minute</key><integer>15</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>/Users/bradygrapentine/.kea/forecaster-discover/logs/launchd-stdout.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/bradygrapentine/.kea/forecaster-discover/logs/launchd-stderr.log</string>
</dict>
</plist>
```

Activate:

```sh
launchctl load ~/Library/LaunchAgents/com.bradygrapentine.kea.forecaster-discover.plist
launchctl list | grep forecaster-discover    # confirm registered
```

Trigger one real run (with restart enabled) to confirm end-to-end:

```sh
launchctl start com.bradygrapentine.kea.forecaster-discover
sleep 30
fly logs -a auto-exit-scanner | tail -20    # expect "tracking <N> tickers" line within ~30s of restart
```

---

## Step 4 — Flip the nightly pull to atomic + remote cleanup

This is the step that lets Fly's 10 GB volume hold only the hot 7-day window while your laptop keeps the full 90-day archive. **Do not enable until Step 2 succeeded.**

Create a second launchd plist for the nightly pull (or extend Step 3's pipeline — separate is simpler):

```xml
<key>ProgramArguments</key>
<array>
  <string>/bin/bash</string>
  <string>-c</string>
  <string>/usr/local/bin/kea record sync-atomic --fly-app auto-exit-scanner --to /Users/bradygrapentine/.kalshi-exit-assistant/recordings/forecaster --delete-remote-older-than-days 7 >> /Users/bradygrapentine/.kea/forecaster-discover/logs/nightly-sync.log 2>&1</string>
</array>
<key>StartCalendarInterval</key>
<dict>
  <key>Hour</key><integer>3</integer>
  <key>Minute</key><integer>30</integer>
</dict>
```

Run-once smoke before scheduling:

```sh
kea record sync-atomic \
  --fly-app auto-exit-scanner \
  --to ~/.kalshi-exit-assistant/recordings/forecaster \
  --delete-remote-older-than-days 7
```

Inspect `remoteCleanupDeletedCount` in the result — it should be 0 on first run (nothing is yet older than 7 days). Confirm again with:

```sh
fly ssh console -a auto-exit-scanner -C "find /data/recordings -mtime +7 -name '*.ndjson' | wc -l"
# 0
```

---

## Step 5 — 30-day acceptance gate

After 30 days of continuous run, the primary acceptance signal is `kea record coverage`:

```sh
kea record coverage \
  --recordings-dir ~/.kalshi-exit-assistant/recordings/forecaster \
  --since 30d \
  --max-gap-seconds 600
echo "exit: $?"
```

Pass: exit 0, header `coverage: OK — <N> ticker(s), threshold=600s`.
Fail: exit 1, per-ticker max-gap list. Investigate any ticker whose gap exceeds 10 min (Fly maintenance, recorder crash, Kalshi WS disconnect not handled).

Once green, flip `SH-FORECASTER-BACKTEST` (Phase 2) to 🟢 in `BACKLOG.md` and start the sweep.

---

## Kill switch (use anytime)

If the recorder needs to be silenced fast — e.g. you notice 429s from the trading-account perspective, or you want to do destructive ops on the volume:

```sh
kea record pause                  # touches /data/PAUSE on the Fly volume
fly logs -a auto-exit-scanner | grep -i pause    # confirms recorder is skipping writes
# ...do whatever...
kea record resume                 # removes /data/PAUSE
```

Pause check is cached for 2s, so resume takes effect within ~2s.

---

## Rollback

| Problem | Rollback |
|---|---|
| Volume extend failed | `fly volumes extend` is idempotent; re-run. If allocator is wedged, contact Fly support. |
| Discover cron writes bad tickers.json | Cron has a sanity floor: `TICKER_COUNT < 50` aborts before push. If it slips through, `fly ssh console -C "rm /data/tickers.json"` then redeploy a known-good version: `fly ssh console -C "cat > /data/tickers.json" < ~/.kea/forecaster-discover/staging/<prior-good>.json`. |
| Atomic sync verifies but data looks wrong | The staging dir is preserved on verification failure under `<localDir>.staging-<ts>/`. Inspect manually; do NOT proceed with cleanup. |
| Recorder OOM / volume full | `kea record pause`; SSH in; manually `find /data/recordings -mtime +N -delete` (verify before pressing return); `kea record resume`. |
| WS transport regression | Per the `SH-SCANNER-WS` shipped notes: `flyctl secrets unset KEA_SCANNER_TRANSPORT -a auto-exit-scanner` reverts to REST polling. |

---

## What's NOT in this runbook

- Phase 2 (backtest sweep + ADRs) — gated on 30 days of forecaster recordings.
- Phase 3 (`forecaster-trade` skill + live execution) — gated on Phase 2 ADRs + forecaster calibration green. Late-session weather settles (~6pm ET) accepted as manual per the global No-Overnight-Plans rule.
- Conviction-band sidecar consumption — the metadata is already written by `discover-from-forecasters`; Phase 2 sweep is the first consumer.
