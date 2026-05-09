#!/usr/bin/env node
/**
 * ws-spike.mjs — SH-SCANNER-WS Task 1 (viability spike)
 *
 * READ-ONLY probe of Kalshi's WS API. Does NOT place orders. Subscribes to
 * `orderbook_delta` for one tier-A ticker (KXBTC-...) and one tier-C ticker
 * (KXMET..., political/political-adjacent), accumulates 60s of deltas, then
 * pulls a parallel REST orderbook snapshot for cross-check.
 *
 * Outputs to stdout (and writes a JSON summary to /tmp/ws-spike-summary.json).
 * Five questions answered:
 *  Q1  Auth handshake works?
 *  Q2  One socket per N tickers?
 *  Q3  Delta payload shape captured (first 10 messages)
 *  Q4  Reconnect semantics (do nothing here; observe behavior on disconnect)
 *  Q5  Reconstructed top-of-book vs REST after 60s
 *
 * No deps beyond Node built-ins (http/https/crypto). Raw upgrade handshake
 * because Node's spec WebSocket constructor doesn't accept custom headers.
 */

import https from 'node:https';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── Config ──────────────────────────────────────────────────────────────────
const REST_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
const WS_HOST   = 'api.elections.kalshi.com';
const WS_PATH   = '/trade-api/ws/v2';
const PROBE_DURATION_MS = 60_000;
const MAX_LOG_DELTAS = 10;

// Adjust these to known-active tickers if defaults aren't open.
const TICKERS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const DEFAULT_TICKERS = ['KXBTCD-26MAY09H1700', 'KXMET-26MAY']; // user can override via argv

// ── Load credentials (matches src/credentials.ts shape) ─────────────────────
const KEA_HOME = process.env.KEA_HOME ?? path.join(os.homedir(), '.kalshi-exit-assistant');
const credsPath = path.join(KEA_HOME, 'credentials.json');
if (!fs.existsSync(credsPath)) {
  console.error(`No credentials.json at ${credsPath}. Run \`kea login\` first.`);
  process.exit(2);
}
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
const active = creds.profiles?.[creds.active];
if (!active?.keyId || !active?.keyPath) {
  console.error('credentials.json missing keyId or keyPath for active profile');
  process.exit(2);
}
const apiKey = active.keyId;
const privateKey = fs.readFileSync(active.keyPath, 'utf8');

// ── Sign helper (matches src/accountClient.ts) ──────────────────────────────
function sign(method, fullPath) {
  const ts = Date.now().toString();
  const message = ts + method.toUpperCase() + fullPath;
  const sig = crypto.sign('RSA-SHA256', Buffer.from(message), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }).toString('base64');
  return {
    'KALSHI-ACCESS-KEY': apiKey,
    'KALSHI-ACCESS-TIMESTAMP': ts,
    'KALSHI-ACCESS-SIGNATURE': sig,
  };
}

// ── REST: pull orderbook snapshot for cross-check ───────────────────────────
async function fetchOrderbook(ticker, depth = 10) {
  const ep = `/markets/${ticker}/orderbook?depth=${depth}`;
  const url = REST_BASE + ep;
  const baseUrlPath = new URL(REST_BASE).pathname.replace(/\/$/, '');
  const headers = sign('GET', baseUrlPath + ep);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${await res.text().catch(() => '')}` };
  }
  return await res.json();
}

// ── Raw WebSocket upgrade with auth headers ─────────────────────────────────
function connectWs() {
  return new Promise((resolve, reject) => {
    const headers = sign('GET', WS_PATH);
    const wsKey = crypto.randomBytes(16).toString('base64');
    const req = https.request({
      host: WS_HOST,
      path: WS_PATH,
      method: 'GET',
      headers: {
        ...headers,
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': wsKey,
      },
    });
    req.on('upgrade', (res, socket) => {
      // Successful 101 — return the raw socket
      resolve({ status: res.statusCode, headers: res.headers, socket });
    });
    req.on('response', (res) => {
      // Non-upgrade response (auth fail, etc.)
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        reject(new Error(`Upgrade rejected: ${res.statusCode} ${body.slice(0, 500)}`));
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Minimal WebSocket frame parser/encoder (text frames only) ───────────────
function encodeFrame(opcode, payload) {
  const header = [0x80 | (opcode & 0x0f)]; // FIN + opcode
  const mask = crypto.randomBytes(4);
  if (payload.length < 126) header.push(0x80 | payload.length);
  else if (payload.length < 65536) {
    header.push(0x80 | 126, (payload.length >> 8) & 0xff, payload.length & 0xff);
  } else {
    header.push(0x80 | 127);
    for (let i = 7; i >= 0; i--) header.push(Number((BigInt(payload.length) >> BigInt(i * 8)) & 0xffn));
  }
  const masked = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
  return Buffer.concat([Buffer.from(header), mask, masked]);
}

function encodeTextFrame(text) {
  return encodeFrame(0x1, Buffer.from(text, 'utf8'));
}

function encodePongFrame(payload) {
  return encodeFrame(0xa, payload);
}

function parseFrames(buffer, onMessage, onClose, onPing) {
  let offset = 0;
  while (offset < buffer.length) {
    if (buffer.length - offset < 2) break;
    const b0 = buffer[offset];
    const b1 = buffer[offset + 1];
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) === 0x80;
    let len = b1 & 0x7f;
    let cur = offset + 2;
    if (len === 126) { if (buffer.length - cur < 2) break; len = buffer.readUInt16BE(cur); cur += 2; }
    else if (len === 127) { if (buffer.length - cur < 8) break; len = Number(buffer.readBigUInt64BE(cur)); cur += 8; }
    if (masked) cur += 4;
    if (buffer.length - cur < len) break;
    const payload = buffer.slice(cur, cur + len);
    if (opcode === 0x1) onMessage(payload.toString('utf8'));
    else if (opcode === 0x8) onClose(payload);
    else if (opcode === 0x9) onPing(payload);
    offset = cur + len;
  }
  return offset;
}

// ── Main probe ──────────────────────────────────────────────────────────────
async function main() {
  const tickers = TICKERS.length > 0 ? TICKERS : DEFAULT_TICKERS;
  console.log(`[spike] tickers: ${tickers.join(', ')}`);
  console.log('[spike] connecting to', `wss://${WS_HOST}${WS_PATH}`);

  let upgrade;
  try {
    upgrade = await connectWs();
  } catch (err) {
    console.error('[spike] Q1 — auth failed:', err.message);
    fs.writeFileSync('/tmp/ws-spike-summary.json', JSON.stringify({ q1AuthOk: false, error: err.message }, null, 2));
    process.exit(1);
  }
  console.log(`[spike] Q1 — upgrade ok: ${upgrade.status}`);

  const { socket } = upgrade;
  let buf = Buffer.alloc(0);
  const deltasByTicker = new Map();
  // Reconstructed book state: ticker → side → priceDollars → sizeFp
  const books = new Map();
  function ensureTicker(t) {
    if (!books.has(t)) books.set(t, { yes: new Map(), no: new Map() });
    return books.get(t);
  }
  let firstMessages = [];
  let messageCount = 0;
  let firstMessageAt = null;

  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    const consumed = parseFrames(
      buf,
      (text) => {
        messageCount++;
        if (firstMessageAt === null) firstMessageAt = Date.now();
        if (firstMessages.length < MAX_LOG_DELTAS) firstMessages.push(text.slice(0, 1000));
        try {
          const msg = JSON.parse(text);
          const t = msg?.msg?.market_ticker;
          if (t) {
            if (!deltasByTicker.has(t)) deltasByTicker.set(t, 0);
            deltasByTicker.set(t, deltasByTicker.get(t) + 1);
            const book = ensureTicker(t);
            if (msg.type === 'orderbook_snapshot') {
              for (const side of ['yes', 'no']) {
                const arr = msg.msg[`${side}_dollars_fp`] ?? [];
                book[side].clear();
                for (const [price, size] of arr) book[side].set(price, parseFloat(size));
              }
            } else if (msg.type === 'orderbook_delta') {
              const side = msg.msg.side;
              const price = msg.msg.price_dollars;
              const delta = parseFloat(msg.msg.delta_fp);
              const cur = book[side].get(price) ?? 0;
              const next = cur + delta;
              if (Math.abs(next) < 1e-6) book[side].delete(price);
              else book[side].set(price, next);
            }
          }
        } catch { /* keep raw */ }
      },
      (payload) => {
        console.log('[spike] close frame:', payload.toString('utf8'));
      },
      (payload) => {
        socket.write(encodePongFrame(payload));
      },
    );
    if (consumed > 0) buf = buf.slice(consumed);
  });

  socket.on('close', () => console.log('[spike] socket closed'));
  socket.on('error', (e) => console.error('[spike] socket error:', e.message));

  // Subscribe
  const sub = JSON.stringify({
    id: 1,
    cmd: 'subscribe',
    params: { channels: ['orderbook_delta'], market_tickers: tickers },
  });
  socket.write(encodeTextFrame(sub));
  console.log('[spike] subscribed');

  await new Promise((r) => setTimeout(r, PROBE_DURATION_MS));

  // Fetch REST snapshot and compare top-10 to reconstructed book
  const crossCheck = {};
  for (const t of tickers) {
    const rest = await fetchOrderbook(t, 10);
    const book = books.get(t);
    const wsTopBySide = {};
    if (book) {
      for (const side of ['yes', 'no']) {
        wsTopBySide[side] = [...book[side].entries()]
          .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
          .slice(0, 10)
          .map(([p, s]) => [p, s.toFixed(2)]);
      }
    }
    const restYes = rest?.orderbook_fp?.yes_dollars ?? [];
    const restNo  = rest?.orderbook_fp?.no_dollars ?? [];
    function compare(ws, rest) {
      const matches = ws.filter((row, i) => rest[i] && rest[i][0] === row[0] && Math.abs(parseFloat(rest[i][1]) - parseFloat(row[1])) < 0.5).length;
      return { wsCount: ws.length, restCount: rest.length, matchedTopN: matches };
    }
    crossCheck[t] = {
      yes: compare(wsTopBySide.yes ?? [], restYes),
      no:  compare(wsTopBySide.no  ?? [], restNo),
    };
  }

  socket.end();

  const summary = {
    q1AuthOk: true,
    upgradeStatus: upgrade.status,
    upgradeHeaders: upgrade.headers,
    durationMs: PROBE_DURATION_MS,
    totalMessages: messageCount,
    firstMessageLatencyMs: firstMessageAt ? firstMessageAt - (Date.now() - PROBE_DURATION_MS) : null,
    deltasByTicker: Object.fromEntries(deltasByTicker),
    firstMessagesSample: firstMessages,
    crossCheck,
    tickers,
  };
  fs.writeFileSync('/tmp/ws-spike-summary.json', JSON.stringify(summary, null, 2));
  console.log(`[spike] DONE. Summary at /tmp/ws-spike-summary.json. Messages: ${messageCount}, by ticker: ${JSON.stringify(Object.fromEntries(deltasByTicker))}`);
  process.exit(0);
}

main().catch((e) => { console.error('[spike] fatal:', e); process.exit(1); });
