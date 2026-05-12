#!/bin/bash
# forecaster-discover-cron.sh
#
# Daily discover pipeline for the auto-exit-scanner Fly app. Runs LOCALLY on
# the operator's machine (not on the Fly machine) — uses the operator's local
# Kalshi creds via the kea CLI, then uploads the merged ticker file to the
# Fly volume and triggers a machine restart so the running recorder picks up
# the new tickers.
#
# Pipeline:
#   1. kea record discover              → tickers.discover.json    (broad, category-volume)
#   2. kea record discover-from-forecasters → tickers.forecaster.json (KXWTI + KXHIGH*)
#   3. kea record merge-tickers         → tickers.json             (union, forecaster wins on collision)
#   4. fly ssh console -C "cat > ..."   → /data/tickers.json on the Fly volume
#   5. fly machine restart              → recorder reloads from new tickers.json
#
# Idempotent: re-running on the same day overwrites prior outputs cleanly.
# Logs to $LOG_DIR/forecaster-discover-<YYYYMMDD>.log.
#
# Env overrides:
#   FLY_APP                     default: auto-exit-scanner
#   KEA_BIN                     default: kea (must be in PATH)
#   STAGING_DIR                 default: ~/.kea/forecaster-discover/staging
#   LOG_DIR                     default: ~/.kea/forecaster-discover/logs
#   KEA_FORECASTER_OIL_ROOT     default: ~/projects/oil-forecaster
#   KEA_FORECASTER_WEATHER_ROOT default: ~/projects/weather-forecaster
#   SKIP_RESTART=1              skip the fly machine restart (useful for dry-runs)

set -euo pipefail

FLY_APP="${FLY_APP:-auto-exit-scanner}"
KEA_BIN="${KEA_BIN:-kea}"
STAGING_DIR="${STAGING_DIR:-$HOME/.kea/forecaster-discover/staging}"
LOG_DIR="${LOG_DIR:-$HOME/.kea/forecaster-discover/logs}"

mkdir -p "$STAGING_DIR" "$LOG_DIR"

TODAY="$(date -u +%Y%m%d)"
LOG_FILE="$LOG_DIR/forecaster-discover-$TODAY.log"

log() {
  local msg="[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  echo "$msg" | tee -a "$LOG_FILE"
}

log "start: cron run for FLY_APP=$FLY_APP"

DISCOVER_OUT="$STAGING_DIR/tickers.discover.json"
FORECASTER_OUT="$STAGING_DIR/tickers.forecaster.json"
MERGED_OUT="$STAGING_DIR/tickers.json"

log "step 1: kea record discover → $DISCOVER_OUT"
"$KEA_BIN" record discover --out "$DISCOVER_OUT" >> "$LOG_FILE" 2>&1

log "step 2: kea record discover-from-forecasters → $FORECASTER_OUT"
"$KEA_BIN" record discover-from-forecasters --out "$FORECASTER_OUT" >> "$LOG_FILE" 2>&1

log "step 3: kea record merge-tickers → $MERGED_OUT"
"$KEA_BIN" record merge-tickers --inputs "$DISCOVER_OUT,$FORECASTER_OUT" --out "$MERGED_OUT" >> "$LOG_FILE" 2>&1

TICKER_COUNT="$(python3 -c "import json; d=json.load(open('$MERGED_OUT')); print(len(d.get('tickers',[])))")"
log "merged ticker count: $TICKER_COUNT"

# Sanity floor — never push a tickers.json that's suspiciously short.
# Forecaster series alone (~73 markets) + broad discover (~50) should be ≥100.
if [ "$TICKER_COUNT" -lt 50 ]; then
  log "ABORT: merged ticker count $TICKER_COUNT < 50 — refusing to push to Fly"
  exit 1
fi

log "step 4: upload merged tickers to fly:$FLY_APP:/data/tickers.json"
fly ssh console -a "$FLY_APP" -C "cat > /data/tickers.json" < "$MERGED_OUT" >> "$LOG_FILE" 2>&1
log "upload complete"

if [ "${SKIP_RESTART:-0}" = "1" ]; then
  log "SKIP_RESTART=1 set; skipping fly machine restart"
else
  log "step 5: fly machine restart (recorder picks up new tickers.json)"
  fly machine list -a "$FLY_APP" --json | python3 -c "
import json, sys
for m in json.load(sys.stdin):
    if m.get('state') == 'started':
        print(m['id'])
" | while read -r MACHINE_ID; do
    log "restarting machine $MACHINE_ID"
    fly machine restart "$MACHINE_ID" -a "$FLY_APP" >> "$LOG_FILE" 2>&1
  done
fi

log "done"
