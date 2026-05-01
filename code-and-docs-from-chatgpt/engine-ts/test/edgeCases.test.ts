import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ExitRunner } from '../src/exitRunner.js';
import { Journal } from '../src/journal.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';
import type { ExitConfig, KalshiClientLike, Orderbook, OrderResult, Position } from '../src/types.js';

const cfg: ExitConfig = {
  baseUrl: 'https://example.test',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 100,
  chunkSize: 50,
  floorPriceCents: 1,
  orderbookDepth: 20,
  minLevelSize: 1,
  tailSweepThreshold: 0,
  mildAdaptive: false,
  minAdaptiveChunk: 1,
  maxOrders: 5,
  loopDelayMs: 0,
  reconcilePollMs: 0,
  reconcileMaxPolls: 1,
  cancelOnStale: true,
  dryRun: false,
  killSwitchPath: '',
  apiKeyEnv: 'X',
  privateKeyPathEnv: 'Y',
  safetySubmittedMultiple: 1.5,
};

const fatBook: Orderbook = { yes: [{ priceCents: 5, size: 10000 }], no: [] };

describe('kill switch path', () => {
  it('halts the loop when STOP file exists', async () => {
    const tmpStop = path.join(os.tmpdir(), `kea-stop-${Date.now()}`);
    fs.writeFileSync(tmpStop, '');
    try {
      const mock = new MockKalshiClient({
        orderbookSnapshots: Array.from({ length: 5 }, () => fatBook),
        behaviors: [{ fillCount: 50 }],
      });
      const runner = new ExitRunner({ ...cfg, killSwitchPath: tmpStop }, mock);
      const status = await runner.run();
      expect(status.events.some((e) => e.message === 'kill_switch_found')).toBe(true);
      expect(status.ordersAttempted).toBe(0); // nothing should have been submitted
    } finally {
      fs.rmSync(tmpStop);
    }
  });

  it('runs normally when killSwitchPath is empty', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook],
      behaviors: [{ fillCount: 50 }, { fillCount: 50 }],
    });
    const runner = new ExitRunner({ ...cfg, killSwitchPath: '' }, mock);
    const status = await runner.run();
    expect(status.events.some((e) => e.message === 'kill_switch_found')).toBe(false);
    expect(status.filledTotal).toBe(100);
  });
});

class ThrowingClient implements KalshiClientLike {
  constructor(public throwOnGetOrder = false) {}
  async getOrderbook(): Promise<Orderbook> { return fatBook; }
  async createOrder(): Promise<OrderResult> { throw new Error('not exercised'); }
  async getOrder(): Promise<OrderResult> {
    if (this.throwOnGetOrder) throw new Error('simulated transient getOrder failure');
    return { orderId: 'x', status: 'filled', filledCount: 50, remainingCount: 0 };
  }
  async cancelOrder(): Promise<OrderResult> {
    return { orderId: 'x', status: 'canceled', filledCount: 0, remainingCount: 50 };
  }
  async getPosition(): Promise<Position> { return { ticker: 'KXTEST', side: 'yes', quantity: 100 }; }
}

describe('resume path tolerates getOrder failures', () => {
  it('logs resume_get_order_failed and continues when getOrder throws on a pending order', async () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-resume-'));
    const jobId = 'test-job-resume-fail';
    const journal = new Journal(jobId, tmpHome);
    journal.append('loop_started', {});
    journal.append('order_placed', {
      orderId: 'pending-1',
      payload: {
        ticker: 'KXTEST', action: 'sell', side: 'yes', count: 50, type: 'limit',
        reduce_only: true, time_in_force: 'immediate_or_cancel',
        client_order_id: 'cloid-1', yes_price_dollars: '0.0500',
      },
      decisionRequested: 50,
    });

    try {
      const client = new ThrowingClient(true);
      const runner = new ExitRunner(cfg, client, { resumeFromJobId: jobId, keaHome: tmpHome });
      const status = await runner.run();
      expect(status.events.some((e) => e.message === 'resume_get_order_failed')).toBe(true);
    } finally {
      fs.rmSync(tmpHome, { recursive: true });
    }
  });
});

class RestingThenCancelFailClient implements KalshiClientLike {
  public attempts = 0;
  async getOrderbook(): Promise<Orderbook> { return fatBook; }
  async createOrder(): Promise<OrderResult> {
    return { orderId: 'order-1', status: 'resting', filledCount: 0, remainingCount: 50 };
  }
  async getOrder(): Promise<OrderResult> {
    return { orderId: 'order-1', status: 'resting', filledCount: 0, remainingCount: 50 };
  }
  async cancelOrder(): Promise<OrderResult> {
    this.attempts += 1;
    throw new Error('cancel network blip');
  }
  async getPosition(): Promise<Position> { return { ticker: 'KXTEST', side: 'yes', quantity: 100 }; }
}

describe('reconcile cancel failure path', () => {
  it('logs cancel_failed and proceeds (does not crash the loop)', async () => {
    const client = new RestingThenCancelFailClient();
    const runner = new ExitRunner({ ...cfg, maxOrders: 1 }, client);
    const status = await runner.run();
    expect(status.events.some((e) => e.message === 'cancel_failed')).toBe(true);
    expect(client.attempts).toBe(1);
  });
});

describe('previewOnce direct call', () => {
  it('returns orderbook + decision + payload without placing an order', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [fatBook] });
    const runner = new ExitRunner(cfg, mock);
    const out = await runner.previewOnce();
    expect(out.orderbook.yes.length).toBeGreaterThan(0);
    expect(out.decision.chunkSize).toBe(50);
    expect(out.payload.ticker).toBe('KXTEST');
    expect(mock.events).not.toContain('createOrder');
  });
});

describe('runner.stop() halts the loop', () => {
  it('sets stopRequested and aborts before next iteration', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: Array.from({ length: 5 }, () => fatBook),
      behaviors: Array.from({ length: 5 }, () => ({ fillCount: 0 })),
    });
    const runner = new ExitRunner({ ...cfg, loopDelayMs: 50 }, mock);
    const promise = runner.run();
    // stop after first iteration kicks off
    setTimeout(() => runner.stop('test_stop'), 5);
    const status = await promise;
    expect(status.events.some((e) => e.message === 'test_stop')).toBe(true);
    expect(status.stopped).toBe(true);
  });
});

describe('forbiddenTickers runtime guard', () => {
  it('refuses to start the loop when marketTicker is in forbiddenTickers', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [fatBook] });
    const runner = new ExitRunner(
      { ...cfg, marketTicker: 'OFFLIMITS', forbiddenTickers: ['OFFLIMITS', 'OTHER'] },
      mock,
    );
    await expect(runner.run()).rejects.toThrow(/forbiddenTickers/);
    expect(mock.events).not.toContain('createOrder');
  });

  it('runs normally when marketTicker is not in forbiddenTickers', async () => {
    const mock = new MockKalshiClient({
      orderbookSnapshots: [fatBook, fatBook],
      behaviors: [{ fillCount: 50 }, { fillCount: 50 }],
    });
    const runner = new ExitRunner(
      { ...cfg, marketTicker: 'KXTEST', forbiddenTickers: ['SOMETHING_ELSE'] },
      mock,
    );
    const status = await runner.run();
    expect(status.filledTotal).toBe(100);
  });
});

describe('preflight clamp warning', () => {
  it('clamps positionSize when observed quantity is smaller than configured', async () => {
    const mock = new MockKalshiClient({ orderbookSnapshots: [fatBook] });
    mock.setPosition('KXTEST', 'yes', 30); // configured 100, observed 30 → clamp to 30
    const runner = new ExitRunner({ ...cfg, preflight: true, positionSize: 100, chunkSize: 30 }, mock);
    await runner.preflight();
    const status = runner.getStatus();
    expect(status.events.some((e) => e.message === 'position_clamped')).toBe(true);
    expect(status.initialPosition).toBe(30);
    expect(status.remaining).toBe(30);
  });
});
