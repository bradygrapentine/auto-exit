#!/usr/bin/env -S npx tsx
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  BalanceSchema, PositionsSchema, RestingOrdersSchema, OrderbookSchema,
  PreviewSchema, JournalListSchema, JournalReadSchema, ReplaySchema, WhoamiSchema,
} from './mcp-smoke-schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASELINES_DIR = path.resolve(__dirname, '..', 'test', 'harness', 'baselines');
fs.mkdirSync(BASELINES_DIR, { recursive: true });

const all: Record<string, unknown> = {
  kea_whoami: WhoamiSchema, kea_balance: BalanceSchema, kea_positions: PositionsSchema,
  kea_resting_orders: RestingOrdersSchema, kea_journal_list: JournalListSchema,
  kea_orderbook: OrderbookSchema, kea_preview: PreviewSchema,
  kea_journal_read: JournalReadSchema, kea_replay: ReplaySchema,
};
for (const [name, schema] of Object.entries(all)) {
  const json = zodToJsonSchema(schema as never);
  fs.writeFileSync(path.join(BASELINES_DIR, `${name}.json`), JSON.stringify(json, null, 2));
}
process.stdout.write(`wrote ${Object.keys(all).length} baselines to ${BASELINES_DIR}\n`);
