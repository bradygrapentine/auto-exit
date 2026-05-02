import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ExitRunner } from '../src/exitRunner.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { ExitConfig, Orderbook } from '../src/types.js';

function withTempHome<T>(fn: (dir: string) => Promise<T> | T): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-er-safety-'));
  const prev = process.env.KEA_HOME;
  process.env.KEA_HOME = dir;
  return Promise.resolve()
    .then(() => fn(dir))
    .finally(() => {
      if (prev === undefined) delete process.env.KEA_HOME;
      else process.env.KEA_HOME = prev;
      fs.rmSync(dir, { recursive: true, force: true });
    });
}

const fatBook: Orderbook = {
  yes: [{ priceCents: 5, size: 10000 }],
  no: [{ priceCents: 5, size: 10000 }],
};

const baseCfg: ExitConfig = {
  baseUrl: 'https://example.test',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 10,
  chunkSize: 5,
  floorPriceCents: 0,
  orderbookDepth: 20,
  minLevelSize: 1,
  tailSweepThreshold: 0,
  minAdaptiveChunk: 1,
  maxOrders: 5,
  loopDelayMs: 0,
  dryRun: true,
  killSwitchPath: './STOP_DOES_NOT_EXIST',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
  reconcilePollMs: 0,
  reconcileMaxPolls: 1,
};

describe('ExitRunner safety integration', () => {
  it('throws if marketTicker is in safety.forbiddenTickers', async () => {
    await withTempHome(async () => {
      const { addForbiddenTicker } = await import('../src/safety.js');
      addForbiddenTicker('KXTEST', 'blocked', 'cli');

      const mock = new MockKalshiClient({
        orderbookSnapshots: [fatBook],
        behaviors: [{ fillCount: 10 }],
      });
      const runner = new ExitRunner(baseCfg, mock);
      await expect(runner.run()).rejects.toThrow(/forbiddenTickers/);
    });
  });

  it('writes safety_loaded journal entry at run() start', async () => {
    await withTempHome(async (dir) => {
      const mock = new MockKalshiClient({
        orderbookSnapshots: [fatBook, fatBook],
        behaviors: [{ fillCount: 10 }],
      });
      const runner = new ExitRunner(baseCfg, mock, { keaHome: dir });
      await runner.run();

      // Find the journal file
      const jobsDir = path.join(dir, 'jobs');
      const files = fs.readdirSync(jobsDir);
      expect(files.length).toBeGreaterThan(0);
      const journal = fs.readFileSync(path.join(jobsDir, files[0]), 'utf8');
      const entries = journal.trim().split('\n').map((l) => JSON.parse(l));
      const safetyLoaded = entries.find((e) => e.kind === 'safety_loaded');
      expect(safetyLoaded).toBeDefined();
      expect(safetyLoaded.data).toMatchObject({
        safetySubmittedMultiple: expect.any(Number),
        floorPriceCents: expect.any(Number),
        tailSweepThreshold: expect.any(Number),
        forbiddenCount: expect.any(Number),
      });
    });
  });
});
