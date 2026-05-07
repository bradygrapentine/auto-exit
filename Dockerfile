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

CMD ["node", "dist/cli.js", "record", "start", "--tickers-file", "/data/tickers.json", "--recordings-dir", "/data/recordings"]
