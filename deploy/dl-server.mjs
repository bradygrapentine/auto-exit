// Sidecar HTTPS download server for the Fly scanner volume.
//
// Off by default. Enable by setting DL_TOKEN as a Fly secret; the scanner
// entrypoint forks this process in the background when DL_TOKEN is set.
//
// Routes:
//   GET /health                                              → 200 "ok"
//   GET /download   (Authorization: Bearer $DL_TOKEN)        → tar.gz stream of /data/{recordings,tickers.json}
//   GET /purge      (Authorization: Bearer $DL_TOKEN, ?confirm=yes)
//                                                            → rm -rf /data/recordings, returns count purged
//
// Designed for one-off operator pulls when `fly ssh`/`fly proxy` are blocked
// by local-network TLS interception. Stream-only; never buffers the tarball.

import http from 'node:http';
import { spawn } from 'node:child_process';
import { rm, readdir } from 'node:fs/promises';
import path from 'node:path';

const PORT = Number(process.env.DL_PORT ?? 8080);
const TOKEN = process.env.DL_TOKEN;
const DATA_DIR = process.env.KEA_HOME ?? '/data';

if (!TOKEN) {
  console.error('[dl-server] DL_TOKEN unset — refusing to start');
  process.exit(1);
}

function auth(req) {
  const h = req.headers['authorization'];
  return typeof h === 'string' && h === `Bearer ${TOKEN}`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (!auth(req)) {
    res.writeHead(401, { 'content-type': 'text/plain' });
    res.end('unauthorized');
    return;
  }
  if (req.method === 'GET' && url.pathname === '/download') {
    res.writeHead(200, {
      'content-type': 'application/gzip',
      'content-disposition': 'attachment; filename="scanner-data.tar.gz"',
    });
    const tar = spawn('tar', ['-czf', '-', '-C', DATA_DIR, 'recordings', 'tickers.json'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    tar.stderr.on('data', (d) => console.error('[dl-server] tar:', d.toString().trim()));
    tar.stdout.pipe(res);
    tar.on('exit', (code) => {
      if (code !== 0) console.error('[dl-server] tar exited', code);
    });
    req.on('close', () => tar.kill('SIGTERM'));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/purge') {
    if (url.searchParams.get('confirm') !== 'yes') {
      res.writeHead(400, { 'content-type': 'text/plain' });
      res.end('add ?confirm=yes to actually purge');
      return;
    }
    const recDir = path.join(DATA_DIR, 'recordings');
    let count = 0;
    try {
      const entries = await readdir(recDir);
      count = entries.length;
      await rm(recDir, { recursive: true, force: true });
    } catch (err) {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end(`purge failed: ${err.message}`);
      return;
    }
    console.log(`[dl-server] purged ${count} entries from ${recDir}`);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ purged: count, path: recDir }));
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[dl-server] listening on :${PORT}`);
});
