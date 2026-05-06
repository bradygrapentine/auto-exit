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
import { getSafety, setSafety, listForbidden, addForbiddenTicker, removeForbiddenTicker } from './safety.js';
import { computeHarvestPlan } from './harvestPlanner.js';
import { Journal } from './journal.js';
import readline from 'node:readline/promises';
import type { ExitConfig, Orderbook, RiskReductionRow, TcaEntry, WatcherConfig } from './types.js';
import { getWatcher, isWatcherInitialized, initWatcher } from './watcherSingleton.js';
import { runWatcherDaemon } from './watcherDaemon.js';
import { buildSAggressiveOpts } from './strategies/sAggressive.js';
import { AggressiveRunner } from './aggressive.js';
import { buildSStealthArgs } from './strategies/sStealth.js';
import { StealthRunner } from './strategies/sStealth.js';
import { buildSLimitLadderArgs } from './strategies/sLimitLadder.js';
import { LimitLadderRunner } from './limitLadder.js';
import { SStopAndReverseRunner } from './strategies/sStopAndReverse.js';
import { SRollRunner } from './strategies/sRoll.js';
import { buildSPrependThenSweepArgs, SPrependThenSweepRunner } from './strategies/sPrependThenSweep.js';

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

// ── plan command ──────────────────────────────────────────────────────────────

async function cmdPlan(ticker: string | undefined, flags: Record<string, string>): Promise<void> {
  if (!ticker) die('plan requires <ticker>');
  if (!flags['position']) die('plan requires --position <n>');
  if (!flags['cost-basis-cents']) die('plan requires --cost-basis-cents <n>');
  if (!flags['market-p']) die('plan requires --market-p <f>');
  if (!flags['private-p']) die('plan requires --private-p <f>');
  if (!flags['catalyst-type']) die('plan requires --catalyst-type soft|hard');

  const position = Number(flags['position']);
  const costBasisCents = Number(flags['cost-basis-cents']);
  const marketP = Number(flags['market-p']);
  const privateP = Number(flags['private-p']);
  const catalystType = flags['catalyst-type'] as 'soft' | 'hard';
  const catalystExpectedDate = flags['catalyst-date'];
  const payoutCents = flags['payout-cents'] ? Number(flags['payout-cents']) : undefined;

  if (!Number.isInteger(position) || position <= 0) die('--position must be a positive integer');
  if (marketP < 0 || marketP > 1) die('--market-p must be between 0 and 1');
  if (privateP < 0 || privateP > 1) die('--private-p must be between 0 and 1');
  if (catalystType !== 'soft' && catalystType !== 'hard') die('--catalyst-type must be soft or hard');

  const config = makeMinimalConfig(ticker);
  const client = new KalshiClient(config);
  const orderbook = await client.getOrderbook(ticker, 10);

  const plan = computeHarvestPlan(
    { ticker, side: 'sell', position, costBasisCents, marketP, privateP, catalystType, catalystExpectedDate, payoutCents },
    orderbook,
  );

  const out = process.stdout.write.bind(process.stdout);

  out(`\nharvest plan for ${ticker}\n`);
  out(`${'─'.repeat(50)}\n`);
  out(`position:       ${position} contracts\n`);
  out(`cost basis:     ${fmtDollars(costBasisCents / 100)} (${costBasisCents}¢ total)\n`);
  out(`marketP:        ${(marketP * 100).toFixed(1)}%\n`);
  out(`privateP:       ${(privateP * 100).toFixed(1)}%\n`);
  out(`catalyst:       ${catalystType}${catalystExpectedDate ? ` (${catalystExpectedDate})` : ''}\n`);
  out(`\n`);

  out(`EV analysis\n`);
  out(`  pStar (EV crossover):  ${(plan.pStar * 100).toFixed(1)}%\n`);
  out(`  EV hold all:           ${fmtDollars(plan.evHold)}\n`);
  out(`  EV harvest now:        ${fmtDollars(plan.evHarvestNow)}\n`);
  out(`  EV patient scale-out:  ${fmtDollars(plan.evPatientScaleOut)}\n`);
  out(`  harvest EV-positive?   ${plan.harvestIsEvPositive ? 'YES' : 'NO'} (marketP ${plan.harvestIsEvPositive ? '>=' : '<'} pStar)\n`);
  out(`\n`);

  out(`Greeks\n`);
  out(`  delta:        ${plan.greeks.delta.toFixed(4)}\n`);
  if (plan.greeks.thetaPerDay !== undefined) {
    out(`  theta/day:    ${fmtDollars(plan.greeks.thetaPerDay)}\n`);
  }
  out(`  gamma proxy:  ${plan.greeks.gammaProxy.toFixed(4)}\n`);
  out(`\n`);

  out(`Risk reduction table\n`);
  out(`| fraction      | qty | cash locked | EV give-up | sigma reduction |\n`);
  out(`|---------------|-----|-------------|------------|-----------------|\n`);
  for (const row of plan.riskReductionTable) {
    const r = row as RiskReductionRow;
    out(
      `| ${r.fraction.padEnd(13)} | ${String(r.harvestQty).padStart(3)} | ${fmtDollars(r.cashLocked).padStart(11)} | ${fmtDollars(r.evGiveUp).padStart(10)} | ${(r.sigmaReduction * 100).toFixed(1).padStart(13)}% |\n`,
    );
  }
  out(`\n`);

  out(`Suggested strategies: ${plan.suggestedStrategies.join(', ')}\n`);
}

// ── report command ────────────────────────────────────────────────────────────

function cmdReport(positional: string[]): void {
  const jobId = positional[0];
  if (!jobId) die('report requires <jobId>');

  const journal = new Journal(jobId);
  const entries = journal.readAll();
  const tcaEntries = entries
    .filter((e) => e.kind === 'tca')
    .map((e) => e.data as Omit<TcaEntry, 'kind' | 'ts'>);

  if (tcaEntries.length === 0) {
    process.stdout.write(`TCA Report — ${jobId}\nNo TCA entries found.\n`);
    return;
  }

  const ticker = tcaEntries[0]?.ticker ?? 'unknown';
  const side = tcaEntries[0]?.side ?? 'unknown';

  process.stdout.write(`\nTCA Report — ${jobId}\n`);
  process.stdout.write(`Ticker: ${ticker}\n`);
  process.stdout.write(`Side: ${side}\n`);
  process.stdout.write(`Chunks: ${tcaEntries.length}\n\n`);

  const header = `${'Chunk'.padStart(5)}  ${'arrivalMid'.padStart(10)}  ${'executed'.padStart(8)}  ${'slippage'.padStart(8)}  ${'size'.padStart(6)}`;
  process.stdout.write(header + '\n');
  process.stdout.write(`${'─'.repeat(header.length)}\n`);

  for (const e of tcaEntries) {
    const idx = String(e.chunkIndex + 1).padStart(5);
    const mid = fmtCents(e.arrivalMidCents).padStart(10);
    const exec = fmtCents(e.executedPriceCents).padStart(8);
    const slip = (e.slippageCents >= 0 ? '+' : '') + fmtCents(e.slippageCents);
    process.stdout.write(`${idx}  ${mid}  ${exec}  ${slip.padStart(8)}  ${String(e.chunkSize).padStart(6)}\n`);
  }

  const avgSlippage = tcaEntries.reduce((s, e) => s + e.slippageCents, 0) / tcaEntries.length;
  const totalFeesDollars = entries
    .filter((e) => e.kind === 'loop_finished' || e.kind === 'buy_loop_finished')
    .reduce((s, e) => {
      const d = e.data as { feesIncurredDollars?: number };
      return s + (d?.feesIncurredDollars ?? 0);
    }, 0);

  process.stdout.write(`\nAvg slippage: ${(avgSlippage >= 0 ? '+' : '') + fmtCents(avgSlippage)}\n`);
  if (totalFeesDollars > 0) {
    process.stdout.write(`Total fees est: ${fmtDollars(totalFeesDollars)}\n`);
  }
  process.stdout.write('\n');
}

// ── watch commands ────────────────────────────────────────────────────────────

async function cmdWatch(subcommand: string | undefined, rest: string[], flags: Record<string, string>): Promise<void> {
  if (!subcommand || subcommand === 'start') {
    // kea watch start [--config <path>]
    if (!flags.config) die('watch start requires --config <path>');
    const raw = JSON.parse(fs.readFileSync(flags.config, 'utf8')) as WatcherConfig;
    const daemon = runWatcherDaemon(raw);
    initWatcher(daemon.watcher);
    process.stdout.write('started kea-watch daemon\n');
    await daemon.start();
    return;
  }

  if (subcommand === 'register') {
    const kind = flags.kind;
    if (!kind) die('watch register requires --kind <stop_loss|stop_limit|trailing_stop|take_profit|oco|bracket>');
    const ticker = flags.ticker;
    if (!ticker) die('watch register requires --ticker <T>');
    const side = flags.side as 'yes' | 'no';
    if (side !== 'yes' && side !== 'no') die('watch register requires --side yes|no');
    const size = Number(flags.size);
    if (!flags.size || isNaN(size) || size <= 0) die('watch register requires --size <N>');
    const autoCancelOnZeroPosition = flags['no-auto-cancel'] !== 'true';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let params: any;
    switch (kind) {
      case 'stop_loss':
      case 'take_profit': {
        if (flags.rungs) {
          params = { rungs: JSON.parse(flags.rungs) };
        } else {
          if (!flags.trigger) die(`watch register --kind ${kind} requires --trigger <cents>`);
          params = { triggerPriceCents: Number(flags.trigger) };
        }
        break;
      }
      case 'stop_limit': {
        if (!flags.trigger) die('watch register --kind stop_limit requires --trigger <cents>');
        if (!flags.limit) die('watch register --kind stop_limit requires --limit <cents>');
        params = { triggerPriceCents: Number(flags.trigger), limitPriceCents: Number(flags.limit), size };
        break;
      }
      case 'trailing_stop': {
        if (!flags.trail) die('watch register --kind trailing_stop requires --trail <cents>');
        params = { trailCents: Number(flags.trail) };
        break;
      }
      case 'oco': {
        if (!flags.legs) die('watch register --kind oco requires --legs <json>');
        params = { legs: JSON.parse(flags.legs) };
        break;
      }
      case 'bracket': {
        if (!flags['take-profit']) die('watch register --kind bracket requires --take-profit <cents>');
        if (!flags['stop-loss']) die('watch register --kind bracket requires --stop-loss <cents>');
        params = { takeProfitCents: Number(flags['take-profit']), stopLossCents: Number(flags['stop-loss']) };
        break;
      }
      default:
        die(`unknown synthetic kind: ${kind}`);
    }

    const id = getWatcher().register({
      kind: kind as any,
      ticker,
      side,
      positionSize: size,
      params,
      autoCancelOnZeroPosition,
    });
    process.stdout.write(`${id}\n`);
    return;
  }

  if (subcommand === 'list') {
    const synthetics = isWatcherInitialized() ? getWatcher().list() : [];
    if (synthetics.length === 0) {
      process.stdout.write('(no synthetics registered)\n');
      return;
    }
    const header = `${'id'.padEnd(42)}  ${'kind'.padEnd(16)}  ${'ticker'.padEnd(40)}  ${'side'.padEnd(4)}  ${'size'.padStart(6)}  status`;
    process.stdout.write(header + '\n');
    process.stdout.write(`${'─'.repeat(header.length)}\n`);
    for (const s of synthetics) {
      process.stdout.write(
        `${s.id.padEnd(42)}  ${s.kind.padEnd(16)}  ${s.ticker.padEnd(40)}  ${s.side.padEnd(4)}  ${String(s.positionSize).padStart(6)}  ${s.status}\n`,
      );
    }
    return;
  }

  if (subcommand === 'get') {
    const id = rest.find((x) => !x.startsWith('--') && x !== subcommand);
    if (!id) die('watch get requires <id>');
    const s = getWatcher().get(id);
    if (!s) {
      process.stdout.write('not found\n');
      return;
    }
    process.stdout.write(JSON.stringify(s, null, 2) + '\n');
    return;
  }

  if (subcommand === 'cancel') {
    const id = rest.find((x) => !x.startsWith('--') && x !== subcommand);
    if (!id) die('watch cancel requires <id>');
    const canceled = getWatcher().cancel(id);
    if (canceled) {
      process.stdout.write(`canceled ${id}\n`);
    } else {
      process.stdout.write(`not found or already terminal: ${id}\n`);
    }
    return;
  }

  if (subcommand === 'status') {
    const initialized = isWatcherInitialized();
    let registeredCount = 0;
    let armedCount = 0;
    let firedCount = 0;
    let canceledCount = 0;
    if (initialized) {
      const all = getWatcher().list();
      registeredCount = all.length;
      armedCount = all.filter((s) => s.status === 'armed').length;
      firedCount = all.filter((s) => s.status === 'fired').length;
      canceledCount = all.filter((s) => s.status === 'canceled').length;
    }
    process.stdout.write(JSON.stringify({
      initialized,
      registeredCount,
      armedCount,
      firedCount: firedCount,
      canceledCount,
    }, null, 2) + '\n');
    return;
  }

  die(`unknown watch subcommand: ${subcommand}`);
}

function cmdHelp() {
  process.stdout.write(`
kea — Kalshi Exit Assistant CLI

Account commands:
  login [--profile <name>] [--key-id <id>] [--key-file <path>] [--base-url <url>]
                                     Connect a Kalshi profile (prompts for missing fields)
  use <profile>                      Switch active profile
  whoami                             Show active profile (key id last-4 only)
  logout [--profile <name>] [--all]  Remove a profile

Credentials are stored at $KEA_HOME/credentials.json (chmod 600).
File takes precedence over KALSHI_* env vars; env vars are a fallback.

Read-only commands (no money moves):
  preview --config <path>            Project the full exit: gross, fees, net, per-level fills
  book --ticker <T> [--depth N]      Display orderbook
  positions [--ticker <T>]           List held positions
  resting [--ticker <T>]             List our resting orders
  journal --job <id>                 Print a job's journal
  report <jobId>                     Print TCA (slippage) report for a completed job
  plan <ticker> --position <n> --cost-basis-cents <n> --market-p <f> --private-p <f>
       --catalyst-type soft|hard [--catalyst-date <ISO>] [--payout-cents <n>]
                                     EV harvest vs hold analysis: EV table, risk-reduction, Greeks

Mutating commands (live):
  start --config <path>              Run an exit
  resume --job <id> --config <path>  Resume a journaled job
  cancel-resting --order-id <id>     Cancel a specific resting order

Env fallback (used only when no profile is configured via \`kea login\`):
  KALSHI_ACCESS_KEY                  access key id
  KALSHI_PRIVATE_KEY_PATH            absolute path to RSA private key
  KALSHI_BASE_URL                    e.g. https://api.elections.kalshi.com/trade-api/v2
`);
}

// ── safety commands ───────────────────────────────────────────────────────────

function cmdSafety(subcommand: string | undefined, flags: Record<string, string>): void {
  if (!subcommand || subcommand === 'get') {
    const s = getSafety();
    process.stdout.write(`safetySubmittedMultiple: ${s.safetySubmittedMultiple}\n`);
    process.stdout.write(`floorPriceCents:         ${s.floorPriceCents}\n`);
    process.stdout.write(`tailSweepThreshold:      ${s.tailSweepThreshold}\n`);
    process.stdout.write(`forbiddenTickers:        ${s.forbiddenTickers.length}\n`);
    return;
  }
  if (subcommand === 'set') {
    const patch: Parameters<typeof setSafety>[0] = {};
    if (flags['safety-submitted-multiple'] !== undefined) {
      patch.safetySubmittedMultiple = Number(flags['safety-submitted-multiple']);
    }
    if (flags['floor-price-cents'] !== undefined) {
      patch.floorPriceCents = Number(flags['floor-price-cents']);
    }
    if (flags['tail-sweep-threshold'] !== undefined) {
      patch.tailSweepThreshold = Number(flags['tail-sweep-threshold']);
    }
    if (Object.keys(patch).length === 0) {
      console.error('error: no fields specified. Use --floor-price-cents, --safety-submitted-multiple, or --tail-sweep-threshold');
      process.exit(2);
    }
    const updated = setSafety(patch);
    ok(`safety updated`);
    process.stdout.write(`safetySubmittedMultiple: ${updated.safetySubmittedMultiple}\n`);
    process.stdout.write(`floorPriceCents:         ${updated.floorPriceCents}\n`);
    process.stdout.write(`tailSweepThreshold:      ${updated.tailSweepThreshold}\n`);
    return;
  }
  die(`unknown safety subcommand: ${subcommand}`);
}

function cmdForbidden(subcommand: string | undefined, positional: string[], flags: Record<string, string>): void {
  if (!subcommand || subcommand === 'list') {
    const entries = listForbidden();
    if (entries.length === 0) {
      process.stdout.write('(no forbidden tickers)\n');
      return;
    }
    for (const e of entries) {
      process.stdout.write(`${e.ticker.padEnd(40)}  ${e.addedBy.padEnd(5)}  ${e.addedAt.slice(0, 19)}  ${e.reason}\n`);
    }
    return;
  }
  if (subcommand === 'add') {
    const ticker = positional[0];
    if (!ticker) die('usage: kea forbidden add <ticker> --reason <r>');
    const reason = flags.reason;
    if (!reason) die('--reason is required');
    const entry = addForbiddenTicker(ticker, reason, 'cli');
    ok(`added ${entry.ticker} to forbidden list`);
    return;
  }
  if (subcommand === 'remove') {
    const ticker = positional[0];
    if (!ticker) die('usage: kea forbidden remove <ticker>');
    const removed = removeForbiddenTicker(ticker);
    if (removed) ok(`removed ${ticker} from forbidden list`);
    else process.stdout.write(`${ticker} was not on the forbidden list — no change\n`);
    return;
  }
  die(`unknown forbidden subcommand: ${subcommand}`);
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

// ── strategy commands ────────────────────────────────────────────────────────

async function cmdStrategyAggressive(flags: Record<string, string>): Promise<void> {
  if (!flags.ticker) die('strategy aggressive requires --ticker <T>');
  if (!flags.side) die('strategy aggressive requires --side yes|no');
  if (!flags.action) die('strategy aggressive requires --action buy|sell');
  if (!flags.size) die('strategy aggressive requires --size <N>');
  const config = buildSAggressiveOpts({
    ticker: flags.ticker,
    side: flags.side as 'yes' | 'no',
    action: flags.action as 'buy' | 'sell',
    size: Number(flags.size),
    confirmedAggressive: true,
    oneTickIn: flags['one-tick-in'] === 'true',
  });
  const client = new KalshiClient(makeMinimalConfig(config.ticker));
  const result = await new AggressiveRunner(client, config).run();
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

async function cmdStrategyStealth(flags: Record<string, string>): Promise<void> {
  if (!flags.ticker) die('strategy stealth requires --ticker <T>');
  if (!flags.side) die('strategy stealth requires --side yes|no');
  if (!flags.action) die('strategy tealth requires --action buy|sell');
  if (!flags.size) die('strategy stealth requires --size <N>');
  if (!flags['price-cents']) die('strategy stealth requires --price-cents <N>');
  const s4config = buildSStealthArgs({
    ticker: flags.ticker,
    side: flags.side as 'yes' | 'no',
    action: flags.action as 'buy' | 'sell',
    size: Number(flags.size),
    priceCents: Number(flags['price-cents']),
    baseChunkSize: flags['base-chunk-size'] !== undefined ? Number(flags['base-chunk-size']) : undefined,
    baseDelayMs: flags['base-delay-ms'] !== undefined ? Number(flags['base-delay-ms']) : undefined,
    jitterChunkSizePct: flags['jitter-chunk-size-pct'] !== undefined ? Number(flags['jitter-chunk-size-pct']) : undefined,
    jitterDelayPct: flags['jitter-delay-pct'] !== undefined ? Number(flags['jitter-delay-pct']) : undefined,
    safetySubmittedMultiple: flags['safety-submitted-multiple'] !== undefined ? Number(flags['safety-submitted-multiple']) : undefined,
    jobId: flags['job-id'],
  });
  const client = new KalshiClient(makeMinimalConfig(s4config.ticker));
  const result = await new StealthRunner(client, s4config).run();
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

async function cmdStrategyLimitLadder(flags: Record<string, string>): Promise<void> {
  if (!flags.ticker) die('strategy limit-ladder requires --ticker <T>');
  if (!flags.side) die('strategy limit-ladder requires --side yes|no');
  if (!flags.action) die('strategy limit-ladder requires --action buy|sell');
  if (!flags['total-size']) die('strategy limit-ladder requires --total-size <N>');
  if (!flags.rungs) die('strategy limit-ladder requires --rungs <JSON array of {priceCents,sizePct}>');
  let rungs: Array<{ priceCents: number; sizePct: number }>;
  try { rungs = JSON.parse(flags.rungs); } catch { die('--rungs must be valid JSON array'); }
  const s8config = buildSLimitLadderArgs({
    ticker: flags.ticker,
    side: flags.side as 'yes' | 'no',
    action: flags.action as 'buy' | 'sell',
    totalSize: Number(flags['total-size']),
    rungs,
    jobId: flags['job-id'],
  });
  const client = new KalshiClient(makeMinimalConfig(s8config.ticker));
  const result = await new LimitLadderRunner(client, s8config).run();
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

async function cmdStrategyStopAndReverse(flags: Record<string, string>): Promise<void> {
  if (!flags.ticker) die('strategy stop-and-reverse requires --ticker <T>');
  if (!flags['close-side']) die('strategy stop-and-reverse requires --close-side yes|no');
  if (!flags['close-size']) die('strategy stop-and-reverse requires --close-size <N>');
  if (!flags['open-side']) die('strategy stop-and-reverse requires --open-side yes|no');
  if (!flags['open-size']) die('strategy stop-and-reverse requires --open-size <N>');
  const client = new KalshiClient(makeMinimalConfig(flags.ticker));
  const result = await new SStopAndReverseRunner(client, {
    ticker: flags.ticker,
    closeSide: flags['close-side'] as 'yes' | 'no',
    closeSize: Number(flags['close-size']),
    openSide: flags['open-side'] as 'yes' | 'no',
    openSize: Number(flags['open-size']),
    confirmedReverse: true,
    oneTickIn: flags['one-tick-in'] === 'true',
  }).run();
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

async function cmdStrategyRoll(flags: Record<string, string>): Promise<void> {
  if (!flags['current-ticker']) die('strategy roll requires --current-ticker <T>');
  if (!flags['current-side']) die('strategy roll requires --current-side yes|no');
  if (!flags['current-size']) die('strategy roll requires --current-size <N>');
  if (!flags['target-ticker']) die('strategy roll requires --target-ticker <T>');
  if (!flags['target-side']) die('strategy roll requires --target-side yes|no');
  if (!flags['target-size']) die('strategy roll requires --target-size <N>');
  const client = new KalshiClient(makeMinimalConfig(flags['current-ticker']));
  const result = await new SRollRunner(client, {
    currentTicker: flags['current-ticker'],
    currentSide: flags['current-side'] as 'yes' | 'no',
    currentSize: Number(flags['current-size']),
    targetTicker: flags['target-ticker'],
    targetSide: flags['target-side'] as 'yes' | 'no',
    targetSize: Number(flags['target-size']),
    confirmedRoll: true,
    oneTickIn: flags['one-tick-in'] === 'true',
  }).run();
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

async function cmdStrategyPrependThenSweep(flags: Record<string, string>): Promise<void> {
  if (!flags.ticker) die('strategy prepend-then-sweep requires --ticker <T>');
  if (!flags.side) die('strategy prepend-then-sweep requires --side yes|no');
  if (!flags.action) die('strategy prepend-then-sweep requires --action buy|sell');
  if (!flags.size) die('strategy prepend-then-sweep requires --size <N>');
  if (!flags['prepend-window-ms']) die('strategy prepend-then-sweep requires --prepend-window-ms <N>');
  const s15config = buildSPrependThenSweepArgs({
    ticker: flags.ticker,
    side: flags.side as 'yes' | 'no',
    action: flags.action as 'buy' | 'sell',
    size: Number(flags.size),
    prependWindowMs: Number(flags['prepend-window-ms']),
    confirmedPrepend: true,
    oneTickIn: flags['one-tick-in'] === 'true',
  });
  const client = new KalshiClient(makeMinimalConfig(s15config.ticker));
  const result = await new SPrependThenSweepRunner(client, s15config).run();
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

async function cmdStrategy(subcommand: string | undefined, rest: string[], flags: Record<string, string>): Promise<void> {
  switch (subcommand) {
    case 'aggressive': return cmdStrategyAggressive(flags);
    case 'stealth': return cmdStrategyStealth(flags);
    case 'limit-ladder': return cmdStrategyLimitLadder(flags);
    case 'stop-and-reverse': return cmdStrategyStopAndReverse(flags);
    case 'roll': return cmdStrategyRoll(flags);
    case 'prepend-then-sweep': return cmdStrategyPrependThenSweep(flags);
    default:
      die(`unknown strategy subcommand: ${subcommand ?? '(none)'}. Valid: aggressive, stealth, limit-ladder, stop-and-reverse, roll, prepend-then-sweep`);
  }
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
    case 'safety': {
      const sub = rest.find((x) => !x.startsWith('--'));
      return cmdSafety(sub, flags);
    }
    case 'forbidden': {
      const sub = rest.find((x) => !x.startsWith('--'));
      const positional = rest.filter((x) => !x.startsWith('--') && x !== sub);
      return cmdForbidden(sub, positional, flags);
    }
    case 'plan': {
      const ticker = rest.find((x) => !x.startsWith('--'));
      return cmdPlan(ticker, flags);
    }
    case 'report': {
      const positional = rest.filter((x) => !x.startsWith('--'));
      return cmdReport(positional);
    }
    case 'watch': {
      const sub = rest.find((x) => !x.startsWith('--'));
      return cmdWatch(sub, rest, flags);
    }
    case 'strategy': {
      const sub = rest.find((x) => !x.startsWith('--'));
      return cmdStrategy(sub, rest, flags);
    }
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
