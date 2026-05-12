FROM node:20-alpine

# rsync needed for `kea record sync` pull command
RUN apk add --no-cache rsync

WORKDIR /app

# Install deps first (layer cache)
COPY code-and-docs-from-chatgpt/engine-ts/package*.json ./code-and-docs-from-chatgpt/engine-ts/

WORKDIR /app/code-and-docs-from-chatgpt/engine-ts

# Install all deps (including devDeps) so tsc + tsx are available at build time
RUN npm ci

# Copy source and compile
COPY code-and-docs-from-chatgpt/engine-ts/ ./
RUN npm run build

# Prune devDeps after build (tsx is a devDep; dist/cli.js runs under node directly)
RUN npm prune --production

VOLUME /data
ENV KEA_HOME=/data

# Optional sidecar: HTTPS download server for /data (enabled when DL_TOKEN is set).
COPY deploy/dl-server.mjs /app/dl-server.mjs

# Bootstrap script: translate Fly secret env-var names to what loadActive() expects,
# write the inline PEM secret to a file, optionally fork the download sidecar,
# then exec the scanner.
RUN printf '%s\n' \
  '#!/bin/sh' \
  'set -e' \
  'mkdir -p /etc/kalshi' \
  'printf "%s" "$KALSHI_API_PRIVATE_KEY" > /etc/kalshi/key.pem' \
  'chmod 600 /etc/kalshi/key.pem' \
  'export KALSHI_ACCESS_KEY="$KALSHI_API_KEY_ID"' \
  'export KALSHI_PRIVATE_KEY_PATH=/etc/kalshi/key.pem' \
  'if [ -n "$DL_TOKEN" ]; then' \
  '  echo "[bootstrap] DL_TOKEN set — starting download sidecar on :8080"' \
  '  node /app/dl-server.mjs &' \
  'fi' \
  'if [ ! -f /data/tickers.json ]; then' \
  '  echo "[bootstrap] /data/tickers.json missing — running auto-discover..."' \
  '  node dist/cli.js record discover --out /data/tickers.json' \
  '  echo "[bootstrap] discover complete."' \
  'fi' \
  'TRANSPORT_FLAG=""' \
  'if [ "${KEA_SCANNER_TRANSPORT:-rest}" = "ws" ]; then' \
  '  TRANSPORT_FLAG="--transport ws"' \
  '  echo "[bootstrap] transport=ws (Kalshi orderbook_delta WebSocket)"' \
  'else' \
  '  echo "[bootstrap] transport=rest (default REST polling)"' \
  'fi' \
  'exec node dist/cli.js record start --tickers-file /data/tickers.json --recordings-dir /data/recordings $TRANSPORT_FLAG' \
  > /usr/local/bin/scanner-entrypoint.sh \
  && chmod +x /usr/local/bin/scanner-entrypoint.sh

CMD ["/usr/local/bin/scanner-entrypoint.sh"]
