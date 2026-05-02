#!/usr/bin/env -S npx tsx
/**
 * kea — Kalshi Exit Assistant CLI
 *
 * Wraps the ExitRunner / KalshiClient with human-readable output. Use as the
 * primary UI for the MVP (no Chrome extension or HTTP server required).
 *
 * Run: `npx tsx src/cli.ts <command> [args]`
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { KalshiClient } from './kalshiClient.js';
import { KalshiAccountClient } from './accountClient.js';
import { ExitRunner } from './exitRunner.js';
import { loadConfig } from './config.js';
import {
  loadActive,
  redactKeyId,
  upsertProfile,
  setActive,
  removeProfile,
  listProfiles,
  validateKeyFile,
  defaultBaseUrlFor,
  KeaNotConfiguredError,
} from './credentials.js';
import readline from 'node:readline/promises';
import type { ExitConfig, Orderbook } from './types.js';

// ── argv parsing ─────────────────────────────────────────────────────────────
function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i += 1;
      } else {
        out[key] = 'true';
      }
    }
  }
  return out;
}

function die(msg: string): never {
  process.stderr.write(`✗ ${msg}\n`);
  process.exit(1);
}

function ok(msg: string): void {
  process.stdout.write(`✓ ${msg}\n`);
}

// ── format helpers ────────────────────────────────────────────────────────────
function fmtCents(cents: number): string {
  return cents < 1 ? `${cents.toFixed(1)}¢` : `${cents.toFixed(2)}¢`;
}

function fmtDollars(d: number): string {
  return `$${d.toFixed(2)}`;
}

function fmtBook(book: Orderbook): string {
  const yes = [...book.yes].sort((a, b) => b.priceCents - a.priceCents);
  const no = [...book.no].sort((a, b) => b.priceCents - a.priceCents);
  const lines: string[] = [];
  lines.push('  YES bids (sells fill these)        NO bids (= YES asks 1−price)');
  const rows = Math.max(yes.length, no.length, 1);
  for (let i = 0; i < rows; i += 1) {
    const y = yes[i] ? `${fmtCents(yes[i].priceCents).padStart(6)}  ${String(yes[i].size).padStart(10)}` : '          —          ';
    const n = no[i] ? `${fmtCents(no[i].priceCents).padStart(6)}  ${String(no[i].size).padStart(10)}` : '          —          ';
    lines.push(`  ${y}      ${n}`);
  }
  return lines.join('\n');
}

// ── commands ──────────────────────────────────────────────────────────────────

async function cmdPreview(flags: Record<string, string>) {
  if (!flags.config) die('preview requires --config <path>');
  const config = loadConfig(flags.config);
  const runner = new ExitRunner(config);
  const preview = await runner.previewOnce();

  process.stdout.write(`\nticker: ${config.marketTicker}  side: ${config.heldSide}  position: ${config.positionSize}\n`);
  const tif = config.orderTimeInForce ?? 'immediate_or_cancel';
  process.stdout.write(`chunkSize: ${config.chunkSize}  maxOrders: ${config.maxOrders}  TIF: ${tif}\n\n`);

  process.stdout.write(`orderbook (depth ${config.orderbookDepth}):\n`);
  process.stdout.write(fmtBook(preview.orderbook) + '\n\n');

  process.stdout.write(`first chunk decision:\n`);
  process.stdout.write(`  size: ${preview.decision.chunkSize}  price: ${preview.decision.priceDollars} (${fmtCents(preview.decision.priceCentsExact)})  reason: ${preview.decision.reason}\n\n`);

  const p = preview.projection;
  process.stdout.write(`projection (full exit):\n`);
  process.stdout.write(`  shares fillable:     ${p.totalSharesFilled} / ${config.positionSize}\n`);
  process.stdout.write(`  unfillable shares:   ${p.unfillableAtAnyBid}\n`);
  process.stdout.write(`  estimated chunks:    ${p.estimatedChunks}${p.hitsMaxOrders ? ' (HITS maxOrders cap)' : ''}\n`);
  process.stdout.write(`  gross revenue:       ${fmtDollars(p.totalGrossDollars)}\n`);
  process.stdout.write(`  estimated fees:      ${fmtDollars(p.totalFeesDollars)}\n`);
  process.stdout.write(`  estimated net:       ${fmtDollars(p.netDollars)}\n`);
  process.stdout.write(`  effective fee rate:  ${(p.feeRatio * 100).toFixed(2)}%\n`);
  process.stdout.write(`  avg fill price:      ${fmtCents(p.avgPriceCents)}\n\n`);

  if (p.fills.length > 0) {
    process.stdout.write(`fills (per-level breakdown):\n`);
    for (const f of p.fills) {
      process.stdout.write(`  ${String(f.shares).padStart(8)}  @ ${fmtCents(f.priceCents).padStart(6)}  gross=${fmtDollars(f.grossDollars).padStart(8)}  fee=${fmtDollars(f.feeDollars).padStart(6)}\n`);
    }
  }
}

async function cmdBook(flags: Record<string, string>) {
  if (!flags.ticker) die('book requires --ticker <T>');
  const depth = Number(flags.depth ?? 20);
  const config = makeMinimalConfig(flags.ticker);
  const client = new KalshiClient(config);
  const book = await client.getOrderbook(flags.ticker, depth);
  process.stdout.write(`\norderbook for ${flags.ticker} (depth ${depth}):\n`);
  process.stdout.write(fmtBook(book) + '\n');
}

async function cmdPositions(flags: Record<string, string>) {
  const config = makeMinimalConfig(flags.ticker ?? 'KX_PLACEHOLDER');
  const account = new KalshiAccountClient(config);
  // accountClient.getPosition throws if not held; for listing we hit the raw endpoint.
  const reqPath = '/portfolio/positions';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await fetch(config.baseUrl + reqPath, { headers: (account as any).authHeaders('GET', reqPath) });
  if (r.status !== 200) die(`positions HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json() as { market_positions?: Array<Record<string, unknown>> };
  let positions = (j.market_positions ?? []).filter((p) => Number.parseFloat(String(p.position_fp ?? p.position ?? 0)) !== 0);
  if (flags.ticker) positions = positions.filter((p) => p.ticker === flags.ticker);
  printPositions(positions);
}

function printPositions(positions: Array<Record<string, unknown>>) {
  if (positions.length === 0) {
    process.stdout.write('(no positions)\n');
    return;
  }
  process.stdout.write('\nticker                                              position    side  exposure_$    rest_orders\n');
  for (const p of positions) {
    const raw = Number.parseFloat(String(p.position_fp ?? p.position ?? 0));
    const side = raw > 0 ? 'YES' : 'NO ';
    const qty = Math.abs(raw).toFixed(2);
    const t = String(p.ticker).padEnd(50);
    const ex = String(p.market_exposure_dollars ?? '?').padStart(10);
    const rest = String(p.resting_orders_count ?? 0).padStart(3);
    process.stdout.write(`${t}  ${qty.padStart(10)}  ${side}  ${ex}      ${rest}\n`);
  }
}

async function cmdResting(flags: Record<string, string>) {
  const config = makeMinimalConfig(flags.ticker ?? 'KX_PLACEHOLDER');
  const account = new KalshiAccountClient(config);
  const reqPath = '/portfolio/orders';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await fetch(config.baseUrl + reqPath, { headers: (account as any).authHeaders('GET', reqPath) });
  if (r.status !== 200) die(`orders HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json() as { orders?: Array<Record<string, string>> };
  let orders = (j.orders ?? []).filter((o) => o.status === 'resting');
  if (flags.ticker) orders = orders.filter((o) => o.ticker === flags.ticker);
  if (orders.length === 0) {
    process.stdout.write('(no resting orders)\n');
    return;
  }
  process.stdout.write('\norder_id                                  ticker                                              side  action  count    price       created\n');
  for (const o of orders) {
    process.stdout.write(`${String(o.order_id).padEnd(40)}  ${String(o.ticker).padEnd(50)}  ${String(o.side).padEnd(4)}  ${String(o.action).padEnd(6)}  ${String(o.remaining_count_fp ?? o.count_fp ?? '?').padStart(7)}  ${String(o.yes_price_dollars ?? o.no_price_dollars ?? '?').padStart(8)}  ${o.created_time}\n`);
  }
}

async function cmdCancelResting(flags: Record<string, string>) {
  if (!flags['order-id']) die('cancel-resting requires --order-id <id>');
  const config = makeMinimalConfig('KX_PLACEHOLDER');
  const account = new KalshiAccountClient(config);
  const orderPath = `/portfolio/orders/${flags['order-id']}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await fetch(config.baseUrl + orderPath, { method: 'DELETE', headers: (account as any).authHeaders('DELETE', orderPath) });
  if (r.status !== 200) die(`cancel HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  ok(`canceled order ${flags['order-id']}`);
}

async function cmdStart(flags: Record<string, string>) {
  if (!flags.config) die('start requires --config <path>');
  const config = loadConfig(flags.config);
  if (config.dryRun !== false) {
    process.stderr.write('  (dryRun=true — no live orders will be placed)\n');
  }
  const runner = new ExitRunner(config);
  process.stdout.write(`jobId: ${runner.jobId}\n`);
  process.stdout.write(`ticker: ${config.marketTicker}  positionSize: ${config.positionSize}  chunkSize: ${config.chunkSize}\n\n`);
  const status = await runner.run();
  process.stdout.write(`\n=== final status ===\n`);
  process.stdout.write(`filled: ${status.filledTotal}  remaining: ${status.remaining}  fees: ${fmtDollars(status.feesIncurredDollars)}\n`);
  process.stdout.write(`orders attempted: ${status.ordersAttempted}  canceled total: ${status.canceledTotal}\n`);
  if (status.lastError) process.stdout.write(`lastError: ${status.lastError}\n`);
}

async function cmdResume(flags: Record<string, string>) {
  if (!flags.config || !flags.job) die('resume requires --config <path> --job <id>');
  const config = loadConfig(flags.config);
  const runner = new ExitRunner(config, undefined, { resumeFromJobId: flags.job });
  process.stdout.write(`resuming jobId ${flags.job}\n`);
  const status = await runner.run();
  process.stdout.write(`\nfilled: ${status.filledTotal}  remaining: ${status.remaining}\n`);
  if (status.lastError) process.stdout.write(`lastError: ${status.lastError}\n`);
}

async function cmdJournal(flags: Record<string, string>) {
  if (!flags.job) die('journal requires --job <id>');
  const home = process.env.KEA_HOME ?? path.join(os.homedir(), '.kalshi-exit-assistant');
  const journalPath = path.join(home, 'jobs', `${flags.job}.jsonl`);
  if (!fs.existsSync(journalPath)) die(`journal not found: ${journalPath}`);
  const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n');
  for (const line of lines) {
    try {
      const e = JSON.parse(line) as { ts: string; kind: string; data: unknown };
      process.stdout.write(`${e.ts}  ${e.kind.padEnd(22)}  ${JSON.stringify(e.data).slice(0, 200)}\n`);
    } catch {
      process.stdout.write(line + '\n');
    }
  }
}

function cmdWhoami(): void {
  try {
    const a = loadActive();
    const isDemo = a.baseUrl.includes('demo');
    process.stdout.write(`profile: ${a.profileName}${a.profileName === 'env' ? ' (env vars)' : ''}\n`);
    process.stdout.write(`key id : ${redactKeyId(a.keyId)}\n`);
    process.stdout.write(`baseUrl: ${a.baseUrl}${isDemo ? '  [DEMO]' : '  [PROD]'}\n`);
  } catch (e) {
    if (e instanceof KeaNotConfiguredError) die(e.message);
    throw e;
  }
}

async function promptIfMissing(label: string, current: string | undefined, fallback?: string): Promise<string> {
  if (current) return current;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(fallback ? `${label} [${fallback}]: ` : `${label}: `)).trim();
    return answer || fallback || '';
  } finally {
    rl.close();
  }
}

async function cmdLogin(flags: Record<string, string>): Promise<void> {
  const profile = await promptIfMissing('profile name', flags.profile, 'prod');
  if (!profile) die('profile name required');
  const keyId = await promptIfMissing('access key id', flags['key-id']);
  if (!keyId) die('key id required');
  const keyFile = await promptIfMissing('path to RSA private key', flags['key-file']);
  if (!keyFile) die('key file required');
  await validateKeyFile(keyFile);
  const baseUrl = flags['base-url'] ?? defaultBaseUrlFor(profile);
  upsertProfile(profile, { keyId, keyPath: keyFile, baseUrl });
  ok(`saved profile '${profile}'`);
  cmdWhoami();
}

function cmdUse(rest: string[]): void {
  const name = rest[0];
  if (!name) die('usage: kea use <profile>');
  setActive(name);
  cmdWhoami();
}

function cmdLogout(flags: Record<string, string>): void {
  if (flags.all === 'true') {
    for (const name of listProfiles()) removeProfile(name);
    ok('removed all profiles');
    return;
  }
  const name = flags.profile;
  if (!name) die('usage: kea logout --profile <name> | --all');
  removeProfile(name);
  ok(`removed profile '${name}'`);
}

function cmdHelp() {
  process.stdout.write(`
kea — Kalshi Exit Assistant CLI

Read-only commands (no money moves):
  preview --config <path>            Project the full exit: gross, fees, net, per-level fills
  book --ticker <T> [--depth N]      Display orderbook
  positions [--ticker <T>]           List held positions
  resting [--ticker <T>]             List our resting orders
  journal --job <id>                 Print a job's journal

Mutating commands (live):
  start --config <path>              Run an exit
  resume --job <id> --config <path>  Resume a journaled job
  cancel-resting --order-id <id>     Cancel a specific resting order

Env required for live commands:
  KALSHI_ACCESS_KEY                  access key id
  KALSHI_PRIVATE_KEY_PATH            absolute path to RSA private key
  KALSHI_BASE_URL                    e.g. https://api.elections.kalshi.com/trade-api/v2
`);
}

// ── helpers ───────────────────────────────────────────────────────────────────

function tryLoadBaseUrl(): string {
  try { return loadActive().baseUrl; }
  catch { return process.env.KALSHI_BASE_URL ?? 'https://api.elections.kalshi.com/trade-api/v2'; }
}

function makeMinimalConfig(ticker: string): ExitConfig {
  return {
    baseUrl: tryLoadBaseUrl(),
    localServerPort: 0,
    marketTicker: ticker,
    heldSide: 'yes',
    positionSize: 1,
    chunkSize: 1,
    floorPriceCents: 0,
    orderbookDepth: 20,
    minLevelSize: 1,
    tailSweepThreshold: 0,
    minAdaptiveChunk: 1,
    maxOrders: 1,
    loopDelayMs: 0,
    dryRun: true,
    killSwitchPath: '',
    apiKeyEnv: 'KALSHI_ACCESS_KEY',
    privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  };
}

// ── dispatch ──────────────────────────────────────────────────────────────────
export async function runCli(argv: string[]): Promise<void> {
  const command = argv[0] ?? 'help';
  const rest = argv.slice(1);
  const flags = parseFlags(rest);

  switch (command) {
    case 'preview': return cmdPreview(flags);
    case 'book': return cmdBook(flags);
    case 'positions': return cmdPositions(flags);
    case 'resting': return cmdResting(flags);
    case 'cancel-resting': return cmdCancelResting(flags);
    case 'start': return cmdStart(flags);
    case 'resume': return cmdResume(flags);
    case 'journal': return cmdJournal(flags);
    case 'whoami': return cmdWhoami();
    case 'login': return cmdLogin(flags);
    case 'use': return cmdUse(rest.filter((x) => !x.startsWith('--')));
    case 'logout': return cmdLogout(flags);
    case 'help':
    case '--help':
    case '-h': return cmdHelp();
    default:
      process.stderr.write(`unknown command: ${command}\n\n`);
      cmdHelp();
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2)).catch((err) => {
    process.stderr.write(`✗ ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
