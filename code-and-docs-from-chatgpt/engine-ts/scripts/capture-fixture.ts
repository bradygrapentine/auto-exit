#!/usr/bin/env -S npx tsx
/**
 * Live-capture a market snapshot for use as a replay/E2E fixture.
 *
 * Pulls the current orderbook for a ticker and writes a self-describing JSON
 * fixture that the replay tests can load as if it were a recorded scenario.
 *
 * Usage:
 *   npx tsx scripts/capture-fixture.ts --ticker KXFOO --side yes --size 10 \
 *       --out test/fixtures/replay/KXFOO.json
 *
 * Note: Kalshi does NOT expose historical orderbooks — only the current snapshot.
 * Use this for going-forward captures of markets you intend to trade later.
 */

import fs from 'node:fs';
import path from 'node:path';
import { KalshiClient } from '../src/kalshiClient.js';
import { decideLosingExitOrder, projectFullExit } from '../src/pricing.js';
import type { ExitConfig, Side } from '../src/types.js';

interface Args {
  ticker: string;
  side: Side;
  size: number;
  out: string;
  depth: number;
}

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = { depth: 10 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--ticker') { out.ticker = next; i++; }
    else if (a === '--side') { out.side = next as Side; i++; }
    else if (a === '--size') { out.size = Number(next); i++; }
    else if (a === '--out') { out.out = next; i++; }
    else if (a === '--depth') { out.depth = Number(next); i++; }
  }
  if (!out.ticker || !out.side || !out.size || !out.out) {
    throw new Error('usage: --ticker <T> --side <yes|no> --size <N> --out <path> [--depth 10]');
  }
  if (out.side !== 'yes' && out.side !== 'no') throw new Error('--side must be yes or no');
  return out as Args;
}

function buildConfig(ticker: string, side: Side, size: number): ExitConfig {
  return {
    baseUrl: process.env.KALSHI_BASE_URL ?? 'https://api.elections.kalshi.com/trade-api/v2',
    localServerPort: 0,
    marketTicker: ticker,
    heldSide: side,
    positionSize: size,
    chunkSize: size,
    floorPriceCents: 1,
    orderbookDepth: 20,
    minLevelSize: 1,
    tailSweepThreshold: 0,
    minAdaptiveChunk: 1,
    maxOrders: 5,
    loopDelayMs: 0,
    dryRun: true,
    killSwitchPath: '',
    apiKeyEnv: 'KALSHI_ACCESS_KEY',
    privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = buildConfig(args.ticker, args.side, args.size);
  const client = new KalshiClient(cfg);
  const orderbook = await client.getOrderbook(args.ticker, args.depth);
  const decision = decideLosingExitOrder(orderbook, args.size, cfg);
  const sideLevels = args.side === 'yes' ? orderbook.yes : orderbook.no;
  const projection = projectFullExit(sideLevels, args.size, cfg);

  const fixture = {
    capturedAt: new Date().toISOString(),
    ticker: args.ticker,
    side: args.side,
    positionSize: args.size,
    orderbook,
    decision,
    projection: {
      totalSharesFilled: projection.totalSharesFilled,
      totalGrossDollars: projection.totalGrossDollars,
      totalFeesDollars: projection.totalFeesDollars,
      netDollars: projection.netDollars,
      avgPriceCents: projection.avgPriceCents,
      feeRatio: projection.feeRatio,
      hitsMaxOrders: projection.hitsMaxOrders,
      unfillableAtAnyBid: projection.unfillableAtAnyBid,
    },
  };

  const outAbs = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, JSON.stringify(fixture, null, 2) + '\n', 'utf8');
  console.log(`wrote fixture: ${outAbs}`);
  console.log(`  decision: ${decision.chunkSize} @ $${decision.priceDollars} (${decision.reason})`);
  console.log(`  projection: gross=$${projection.totalGrossDollars} fees=$${projection.totalFeesDollars} net=$${projection.netDollars}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
