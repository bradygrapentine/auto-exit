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

/**
 * Read-only scanner: walks open markets, fetches orderbooks, surfaces ones whose
 * shape would actually exercise the auto-adaptive chunking path (thin top YES bid
 * + cliff to next level). Used to find a candidate for a small live test.
 *
 * Criteria: top YES bid size < 50, AND (top.priceCents - next.priceCents) >= 0.2¢,
 * AND top YES bid <= 30¢ (so a $2 buy is feasible).
 */
async function findThinCliff(scanLimit: number) {
  checkEnv();
  console.log(`→ scanning up to ${scanLimit} open markets for thin-top + cliff YES books`);

  let cursor: string | undefined;
  let scanned = 0;
  let preFilterPassed = 0;
  let orderbooksFetched = 0;
  let twoPlusLevels = 0;
  const candidates: Array<{
    ticker: string;
    yesBid: number;
    yesAsk: number;
    topSize: number;
    nextPrice: number;
    nextSize: number;
    cliffCents: number;
    title?: string;
  }> = [];

  while (scanned < scanLimit) {
    const pageSize = Math.min(200, scanLimit - scanned);
    const qs = `?status=open&limit=${pageSize}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');
    const res = await call('GET', `/markets${qs}`);
    if (res.status !== 200) die(`markets list HTTP ${res.status}: ${res.raw.slice(0, 200)}`);
    const markets = res.json?.markets ?? [];
    cursor = res.json?.cursor;
    if (markets.length === 0) break;

    // Pre-filter on the cheap fields before fetching orderbooks.
    // Kalshi returns yes_bid_dollars as a string ("0.0500") and volume_fp as a numeric string.
    const cheapAndActive = markets.filter((m: any) => {
      const ybStr = m.yes_bid_dollars ?? m.yes_bid;
      const yb = typeof ybStr === 'string' ? Number.parseFloat(ybStr) * 100 : Number(ybStr);
      const vol = Number.parseFloat(String(m.volume_fp ?? m.volume ?? 0));
      return Number.isFinite(yb) && yb >= 0.5 && yb <= 30 && vol > 0;
    });

    preFilterPassed += cheapAndActive.length;
    for (const m of cheapAndActive) {
      const ticker = String(m.ticker);
      try {
        const ob = await call('GET', `/markets/${ticker}/orderbook?depth=10`);
        if (ob.status !== 200) continue;
        orderbooksFetched += 1;
        // YES bids live under orderbook.yes (deci-cent ints) or orderbook_fp.yes_dollars (string $).
        const root = ob.json?.orderbook ?? ob.json?.orderbook_fp ?? ob.json ?? {};
        const yesRaw = root.yes_dollars ?? root.yes ?? [];
        if (!Array.isArray(yesRaw) || yesRaw.length < 2) continue;
        // Each entry: [price, size]. Price is dollar-string for *_dollars, integer cents for *_fp/yes.
        const isDollars = Boolean(root.yes_dollars);
        const levels = yesRaw
          .map((row: any[]) => {
            const p = isDollars ? Number.parseFloat(String(row[0])) * 100 : Number(row[0]);
            return { priceCents: p, size: Number(row[1]) };
          })
          .filter((l) => Number.isFinite(l.priceCents) && l.priceCents > 0 && l.size > 0)
          .sort((a, b) => b.priceCents - a.priceCents);
        if (levels.length < 2) continue;
        twoPlusLevels += 1;
        const top = levels[0];
        const next = levels[1];
        const cliff = top.priceCents - next.priceCents;
        if (top.size < 50 && cliff >= 0.2) {
          const yesBidCents = (() => {
            const s = m.yes_bid_dollars ?? m.yes_bid;
            return typeof s === 'string' ? Number.parseFloat(s) * 100 : Number(s);
          })();
          const yesAskCents = (() => {
            const s = m.yes_ask_dollars ?? m.yes_ask;
            return typeof s === 'string' ? Number.parseFloat(s) * 100 : Number(s);
          })();
          candidates.push({
            ticker,
            yesBid: yesBidCents,
            yesAsk: yesAskCents,
            topSize: top.size,
            nextPrice: next.priceCents,
            nextSize: next.size,
            cliffCents: cliff,
            title: m.title ?? m.subtitle,
          });
        }
      } catch {
        // ignore single-market errors, keep scanning
      }
    }

    scanned += markets.length;
    if (!cursor) break;
  }

  console.log(`\nscanned ${scanned} | pre-filter passed ${preFilterPassed} | books fetched ${orderbooksFetched} | books with 2+ levels ${twoPlusLevels} | matched ${candidates.length}`);
  if (candidates.length === 0) {
    console.log('  (no candidates — try larger --limit, or markets shape changed)');
    return;
  }

  // Rank: prefer cheaper markets (smaller $2 trade overhead), bigger cliff, smaller top.
  candidates.sort((a, b) => b.cliffCents - a.cliffCents || a.topSize - b.topSize || a.yesBid - b.yesBid);

  console.log('\nticker                                              top      next         cliff   yes_ask  title');
  for (const c of candidates.slice(0, 20)) {
    const t = c.ticker.padEnd(50);
    const top = `${c.topSize}@${c.yesBid}¢`.padStart(8);
    const next = `${c.nextSize}@${c.nextPrice.toFixed(1)}¢`.padStart(11);
    const cliff = `${c.cliffCents.toFixed(1)}¢`.padStart(5);
    const ask = `${c.yesAsk}¢`.padStart(7);
    console.log(`${t} ${top} ${next}   ${cliff}   ${ask}  ${(c.title ?? '').slice(0, 50)}`);
  }
  saveFixture('thin-cliff-candidates.real.json', candidates);
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
    case 'find-thin-cliff':
      await findThinCliff(args.limit ? Number(args.limit) : 400);
      break;
    default:
      console.log('commands:\n  ping\n  list-open [--limit N]\n  capture-readonly --ticker <T>\n  place-rest-test --ticker <T>\n  find-thin-cliff [--limit N]');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('✗', err);
  process.exit(1);
});
