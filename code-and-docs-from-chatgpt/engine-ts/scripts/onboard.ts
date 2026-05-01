#!/usr/bin/env -S npx tsx
// Onboarding helper. Hits Kalshi from your machine, captures real response shapes
// into test/fixtures/, and reports whether parsers in src/kalshiClient.ts match.
//
// Usage:
//   tsx scripts/onboard.ts ping
//   tsx scripts/onboard.ts capture-readonly --ticker <T>
//   tsx scripts/onboard.ts place-rest-test --ticker <T>
//
// Env required:
//   KALSHI_ACCESS_KEY         — access key id
//   KALSHI_PRIVATE_KEY_PATH   — absolute path to RSA private key .pem
//   KALSHI_BASE_URL           — defaults to https://demo-api.kalshi.com/trade-api/v2

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const BASE_URL = process.env.KALSHI_BASE_URL ?? 'https://demo-api.kalshi.com/trade-api/v2';
const ACCESS_KEY = process.env.KALSHI_ACCESS_KEY;
const KEY_PATH = process.env.KALSHI_PRIVATE_KEY_PATH;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, '..', 'test', 'fixtures');

function die(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function checkEnv() {
  if (!ACCESS_KEY) die('KALSHI_ACCESS_KEY is not set');
  if (!KEY_PATH) die('KALSHI_PRIVATE_KEY_PATH is not set');
  if (!fs.existsSync(KEY_PATH)) die(`Private key file not found at ${KEY_PATH}`);
}

function sign(method: string, requestPath: string): Record<string, string> {
  const ts = Date.now().toString();
  const message = ts + method.toUpperCase() + requestPath;
  const privateKey = fs.readFileSync(KEY_PATH!, 'utf8');
  // Kalshi v2 uses RSA-PSS (not PKCS#1 v1.5) with SHA-256 + salt length = digest length.
  const signature = crypto.sign('RSA-SHA256', Buffer.from(message), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }).toString('base64');
  return {
    'KALSHI-ACCESS-KEY': ACCESS_KEY!,
    'KALSHI-ACCESS-TIMESTAMP': ts,
    'KALSHI-ACCESS-SIGNATURE': signature,
  };
}

async function call(method: string, pathOnly: string, body?: unknown): Promise<{ status: number; json: any; raw: string }> {
  // pathOnly must include the /trade-api/v2 prefix? In Kalshi's signing scheme, the signed path is the full URL path.
  // Our BASE_URL already ends in /trade-api/v2 — derive the signed path from BASE_URL + pathOnly.
  const baseUrlObj = new URL(BASE_URL);
  const fullSignedPath = baseUrlObj.pathname + pathOnly;
  const headers: Record<string, string> = sign(method, fullSignedPath);
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(BASE_URL + pathOnly, init);
  const raw = await res.text();
  let json: any;
  try { json = JSON.parse(raw); } catch { json = null; }
  return { status: res.status, json, raw };
}

function saveFixture(name: string, data: unknown) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  const file = path.join(FIXTURES_DIR, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`  saved → ${path.relative(process.cwd(), file)}`);
}

function reportShape(label: string, json: any) {
  console.log(`\n--- ${label} top-level keys ---`);
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    for (const k of Object.keys(json)) {
      const v = (json as any)[k];
      const t = Array.isArray(v) ? `array(len=${v.length})` : typeof v;
      console.log(`  ${k}: ${t}`);
    }
  } else {
    console.log(`  (not an object; type=${Array.isArray(json) ? 'array' : typeof json})`);
  }
}

async function ping() {
  checkEnv();
  console.log(`→ GET ${BASE_URL}/portfolio/balance`);
  const { status, json, raw } = await call('GET', '/portfolio/balance');
  if (status !== 200) {
    console.error(`✗ HTTP ${status}`);
    console.error(raw.slice(0, 500));
    if (status === 401) console.error('\n→ 401 means signing format is wrong. The engine signs `timestamp+METHOD+path` with RSA-SHA256. If Kalshi changed it, edit src/kalshiClient.ts:authHeaders to match.');
    if (status === 404) console.error('\n→ 404 means the path is wrong. Check KALSHI_BASE_URL.');
    process.exit(1);
  }
  console.log(`✓ HTTP 200 — auth signing works`);
  console.log(`  balance JSON: ${JSON.stringify(json).slice(0, 200)}...`);
  saveFixture('balance.real.json', json);
}

async function captureReadonly(ticker: string) {
  checkEnv();

  console.log(`→ GET /markets/${ticker}/orderbook?depth=20`);
  const ob = await call('GET', `/markets/${ticker}/orderbook?depth=20`);
  if (ob.status !== 200) die(`orderbook returned HTTP ${ob.status}: ${ob.raw.slice(0, 300)}`);
  saveFixture('orderbook.real.json', ob.json);
  reportShape('orderbook', ob.json);

  console.log(`\n→ GET /portfolio/positions`);
  const pos = await call('GET', '/portfolio/positions');
  if (pos.status !== 200) die(`positions returned HTTP ${pos.status}: ${pos.raw.slice(0, 300)}`);
  saveFixture('positions.real.json', pos.json);
  reportShape('positions', pos.json);

  console.log(`\n→ GET /markets/${ticker}`);
  const m = await call('GET', `/markets/${ticker}`);
  if (m.status === 200) {
    saveFixture('market.real.json', m.json);
    reportShape('market', m.json);
  }

  console.log('\n✓ Read-only capture complete. Compare top-level keys against parser expectations:');
  console.log('  parseOrderbookResponse expects:  orderbook_fp | orderbook | (flat) → yes_dollars/yes, no_dollars/no');
  console.log('  KalshiAccountClient expects:     market_positions[] with { ticker, position }  (positive=YES, negative=NO)');
}

async function placeRestTest(ticker: string) {
  checkEnv();

  // The point: place a buy SO non-marketable it cannot fill (1¢ on a market trading well above), capture all 3 shapes, cancel.
  const cloid = `shadow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = {
    ticker,
    action: 'buy',
    side: 'yes',
    count: 1,
    type: 'limit',
    yes_price: 1,
    client_order_id: cloid,
  };
  console.log(`\n→ POST /portfolio/orders   (1 share, 1¢ buy, will rest — never marketable)`);
  console.log(`   payload: ${JSON.stringify(payload)}`);

  const created = await call('POST', '/portfolio/orders', payload);
  saveFixture('order-create.real.json', created.json ?? { _raw: created.raw });
  if (created.status >= 400) die(`create order returned HTTP ${created.status}: ${created.raw.slice(0, 500)}`);
  reportShape('order-create', created.json);

  // Pull the orderId
  const orderId = created.json?.order?.order_id ?? created.json?.order?.id ?? created.json?.order_id ?? created.json?.id;
  if (!orderId) {
    console.error('\n✗ Could not find order_id in create response. Saved fixture for inspection. Aborting before leaving a stray order.');
    process.exit(1);
  }
  console.log(`  orderId = ${orderId}`);

  console.log(`\n→ GET /portfolio/orders/${orderId}`);
  const got = await call('GET', `/portfolio/orders/${orderId}`);
  saveFixture('order-get.real.json', got.json ?? { _raw: got.raw });
  reportShape('order-get', got.json);

  // Also exercise the dedup endpoint we rely on for createOrder retry idempotency:
  console.log(`\n→ GET /portfolio/orders?client_order_id=${cloid}  (dedup lookup the engine uses)`);
  const byCloid = await call('GET', `/portfolio/orders?client_order_id=${encodeURIComponent(cloid)}`);
  saveFixture('order-by-cloid.real.json', byCloid.json ?? { _raw: byCloid.raw });
  reportShape('order-by-cloid', byCloid.json);

  console.log(`\n→ DELETE /portfolio/orders/${orderId}`);
  const canceled = await call('DELETE', `/portfolio/orders/${orderId}`);
  saveFixture('order-cancel.real.json', canceled.json ?? { _raw: canceled.raw });
  reportShape('order-cancel', canceled.json);
  if (canceled.status >= 400) {
    console.error(`\n⚠  cancel returned HTTP ${canceled.status} — verify on Kalshi dashboard that the order is gone, and cancel manually if not.`);
  } else {
    console.log('\n✓ Round-trip captured and order canceled.');
  }
}

async function listOpen(limit = 15) {
  checkEnv();
  console.log(`→ GET /markets?status=open&limit=${limit}`);
  const res = await call('GET', `/markets?status=open&limit=${limit}`);
  if (res.status !== 200) die(`markets list returned HTTP ${res.status}: ${res.raw.slice(0, 300)}`);
  const markets = res.json?.markets ?? [];
  if (markets.length === 0) {
    console.log('  (no open markets returned — try larger limit or check API)');
    return;
  }
  console.log(`\nticker                                         close_ts             yes_bid  yes_ask  volume`);
  for (const m of markets) {
    const ticker = String(m.ticker ?? '').padEnd(45);
    const close = m.close_time ?? m.expected_expiration_time ?? '?';
    const yb = String(m.yes_bid ?? '-').padStart(7);
    const ya = String(m.yes_ask ?? '-').padStart(7);
    const vol = String(m.volume ?? m.volume_24h ?? '-').padStart(7);
    console.log(`${ticker} ${String(close).padEnd(20)} ${yb}  ${ya}  ${vol}`);
  }
  saveFixture('markets-open.real.json', res.json);
}

async function main() {
  const cmd = process.argv[2];
  const args = Object.fromEntries(
    process.argv.slice(3).reduce<[string, string][]>((acc, _, i, arr) => {
      if (i % 2 === 0 && arr[i].startsWith('--')) acc.push([arr[i].slice(2), arr[i + 1]]);
      return acc;
    }, []),
  );

  console.log(`base url: ${BASE_URL}`);

  switch (cmd) {
    case 'ping':
      await ping();
      break;
    case 'capture-readonly':
      if (!args.ticker) die('--ticker <T> is required');
      await captureReadonly(args.ticker);
      break;
    case 'place-rest-test':
      if (!args.ticker) die('--ticker <T> is required');
      await placeRestTest(args.ticker);
      break;
    case 'list-open':
      await listOpen(args.limit ? Number(args.limit) : 15);
      break;
    default:
      console.log('commands:\n  ping\n  list-open [--limit N]\n  capture-readonly --ticker <T>\n  place-rest-test --ticker <T>');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('✗', err);
  process.exit(1);
});
