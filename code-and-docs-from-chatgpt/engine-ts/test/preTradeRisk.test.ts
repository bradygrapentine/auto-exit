import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ExitConfig, Orderbook } from '../src/types.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function withTempHome<T>(fn: (dir: string) => Promise<T> | T): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-ptrade-'));
  const prev = process.env['KEA_HOME'];
  process.env['KEA_HOME'] = dir;
  return Promise.resolve()
    .then(() => fn(dir))
    .finally(() => {
      if (prev === undefined) delete process.env['KEA_HOME'];
      else process.env['KEA_HOME'] = prev;
      fs.rmSync(dir, { recursive: true, force: true });
    });
}

// Write realized_loss entries to audit log for dailyCircuitBreaker tests
function writeAuditEntries(dir: string, entries: Array<{ lossAmount: number; date: string }>): void {
  const lines = entries.map((e) =>
    JSON.stringify({
      ts: new Date().toISOString(),
      kind: 'realized_loss',
      data: { action: 'realized_loss', ticker: 'KXTEST', lossAmount: e.lossAmount, date: e.date },
    }),
  );
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'safety.audit.jsonl'), lines.join('\n') + '\n', 'utf8');
}

// ── Unit tests for checkPreTradeRisk ─────────────────────────────────────────

describe('checkPreTradeRisk', () => {
  it('1. maxLoss — throws when sizeDollars exceeds limit', async () => {
    await withTempHome(async () => {
      const { checkPreTradeRisk, PreTradeRiskError } = await import('../src/safety.js');
      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 200,
          portfolioNAVDollars: 0,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            maxLossPerTickerDollars: 100,
          },
        }),
      ).rejects.toThrow(PreTradeRiskError);

      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 200,
          portfolioNAVDollars: 0,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            maxLossPerTickerDollars: 100,
          },
        }),
      ).rejects.toMatchObject({ check: 'maxLoss' });
    });
  });

  it('2. maxLoss — resolves when sizeDollars within limit', async () => {
    await withTempHome(async () => {
      const { checkPreTradeRisk } = await import('../src/safety.js');
      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 50,
          portfolioNAVDollars: 0,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            maxLossPerTickerDollars: 100,
          },
        }),
      ).resolves.toBeUndefined();
    });
  });

  it('3. dailyCircuitBreaker — passes when realized losses < limit', async () => {
    await withTempHome(async (dir) => {
      const today = new Date().toISOString().slice(0, 10);
      writeAuditEntries(dir, [
        { lossAmount: 50, date: today },
        { lossAmount: 30, date: today },
      ]); // total = 80, limit = 100
      const { checkPreTradeRisk } = await import('../src/safety.js');
      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 10,
          portfolioNAVDollars: 0,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            dailyLossCircuitBreakerDollars: 100,
          },
        }),
      ).resolves.toBeUndefined();
    });
  });

  it('4. dailyCircuitBreaker — throws when realized losses exceed limit', async () => {
    await withTempHome(async (dir) => {
      const today = new Date().toISOString().slice(0, 10);
      writeAuditEntries(dir, [
        { lossAmount: 60, date: today },
        { lossAmount: 50, date: today },
      ]); // total = 110, limit = 100
      const { checkPreTradeRisk, PreTradeRiskError } = await import('../src/safety.js');
      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 10,
          portfolioNAVDollars: 0,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            dailyLossCircuitBreakerDollars: 100,
          },
        }),
      ).rejects.toThrow(PreTradeRiskError);

      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 10,
          portfolioNAVDollars: 0,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            dailyLossCircuitBreakerDollars: 100,
          },
        }),
      ).rejects.toMatchObject({ check: 'dailyCircuitBreaker' });
    });
  });

  it('5. concentration — throws when position exceeds concentration limit', async () => {
    await withTempHome(async () => {
      const { checkPreTradeRisk, PreTradeRiskError } = await import('../src/safety.js');
      // 60 / 100 = 60% > 50%
      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 60,
          portfolioNAVDollars: 100,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            maxPositionConcentrationPct: 50,
          },
        }),
      ).rejects.toThrow(PreTradeRiskError);

      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 60,
          portfolioNAVDollars: 100,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            maxPositionConcentrationPct: 50,
          },
        }),
      ).rejects.toMatchObject({ check: 'concentration' });
    });
  });

  it('6. concentration — passes when within limit', async () => {
    await withTempHome(async () => {
      const { checkPreTradeRisk } = await import('../src/safety.js');
      // 40 / 100 = 40% < 50%
      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 40,
          portfolioNAVDollars: 100,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            maxPositionConcentrationPct: 50,
          },
        }),
      ).resolves.toBeUndefined();
    });
  });

  it('7. concentration — passes unconditionally when NAV=0', async () => {
    await withTempHome(async () => {
      const { checkPreTradeRisk } = await import('../src/safety.js');
      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 99999,
          portfolioNAVDollars: 0,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
            maxPositionConcentrationPct: 1,
          },
        }),
      ).resolves.toBeUndefined();
    });
  });

  it('8. all checks pass when no limits set', async () => {
    await withTempHome(async () => {
      const { checkPreTradeRisk } = await import('../src/safety.js');
      await expect(
        checkPreTradeRisk({
          ticker: 'KXTEST',
          sizeDollars: 999999,
          portfolioNAVDollars: 1,
          safety: {
            version: 1,
            safetySubmittedMultiple: 1.1,
            floorPriceCents: 0,
            tailSweepThreshold: 0,
            forbiddenTickers: [],
          },
        }),
      ).resolves.toBeUndefined();
    });
  });
});

// ── Integration test: exitRunner refuses when maxLoss breached ────────────────

describe('ExitRunner pre-trade risk integration', () => {
  it('9. refuses to start when maxLossPerTickerDollars exceeded', async () => {
    await withTempHome(async () => {
      // positionSize=1000 × $0.50 = $500 notional; limit=1 → should reject
      const { ExitRunner } = await import('../src/exitRunner.js');
      const { MockKalshiClient } = await import('../src/mockKalshiClient.js');
      const { PreTradeRiskError, setSafety } = await import('../src/safety.js');

      setSafety({ maxLossPerTickerDollars: 1 });

      const fatBook: Orderbook = {
        yes: [{ priceCents: 50, size: 10000 }],
        no: [{ priceCents: 50, size: 10000 }],
      };
      const mock = new MockKalshiClient({
        orderbookSnapshots: [fatBook],
        behaviors: [{ fillCount: 1000 }],
      });

      const cfg: ExitConfig = {
        baseUrl: 'https://example.test',
        localServerPort: 0,
        marketTicker: 'KXTEST',
        heldSide: 'yes',
        positionSize: 1000,
        chunkSize: 500,
        floorPriceCents: 0,
        orderbookDepth: 20,
        minLevelSize: 1,
        tailSweepThreshold: 0,
        minAdaptiveChunk: 1,
        maxOrders: 10,
        loopDelayMs: 0,
        dryRun: false,
        killSwitchPath: './NO_KILL_SWITCH',
        apiKeyEnv: 'KALSHI_ACCESS_KEY',
        privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
      };

      const runner = new ExitRunner(cfg, mock);
      const status = await runner.run();
      // PreTradeRiskError is caught by the runner's try/catch → loop_error
      expect(status.lastError).toMatch(/maxLossPerTickerDollars/);
    });
  });
});
