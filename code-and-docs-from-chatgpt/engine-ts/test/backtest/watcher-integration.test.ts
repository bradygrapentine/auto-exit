import { describe, it, expect, vi } from 'vitest';
import { Watcher } from '../../src/watcher.js';
import type { Recorder } from '../../src/backtest/types.js';
import type { KalshiClientLike, Orderbook } from '../../src/types.js';

const BOOK: Orderbook = {
  yes: [{ priceCents: 50, size: 100 }],
  no: [{ priceCents: 51, size: 80 }],
};

function makeClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async () => BOOK),
    getPosition: vi.fn(async () => ({ ticker: 'KXTEST', side: 'yes', quantity: 10 })),
  } as any;
}

function makeRecorder(): Recorder & { calls: number } {
  let calls = 0;
  return {
    get calls() { return calls; },
    appendSnapshot: vi.fn(() => { calls++; }),
    appendPosition: vi.fn(),
    appendFill: vi.fn(),
    close: vi.fn(),
  };
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

describe('Watcher + Recorder integration', () => {
  it('calls appendSnapshot once per tick when recorder is injected', async () => {
    const client = makeClient();
    const recorder = makeRecorder();
    const w = new Watcher(client, baseCfg, undefined, recorder);
    w.register({
      kind: 'stop_loss', ticker: 'KXTEST', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 30 },
    });

    await w.tick();

    expect(recorder.appendSnapshot).toHaveBeenCalledTimes(1);
    // Called with the Orderbook from the client
    const [obArg] = (recorder.appendSnapshot as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(obArg).toEqual(BOOK);
  });

  it('calls appendSnapshot once per ticker per tick (two tickers → two calls)', async () => {
    const client = makeClient();
    const recorder = makeRecorder();
    const w = new Watcher(client, baseCfg, undefined, recorder);
    w.register({
      kind: 'stop_loss', ticker: 'KXTEST-A', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 30 },
    });
    w.register({
      kind: 'stop_loss', ticker: 'KXTEST-B', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 30 },
    });

    await w.tick();

    expect(recorder.appendSnapshot).toHaveBeenCalledTimes(2);
  });

  it('without recorder, no appendSnapshot calls and watcher behavior unchanged', async () => {
    const client = makeClient();
    const w = new Watcher(client, baseCfg); // no recorder
    w.register({
      kind: 'stop_loss', ticker: 'KXTEST', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 30 },
    });

    // Should not throw and should still fetch orderbook normally
    const result = await w.tick();
    expect(result.armedCount).toBe(1);
    expect(client.getOrderbook).toHaveBeenCalledTimes(1);
  });

  it('without recorder, no recording side effects on idle tick', async () => {
    const client = makeClient();
    const w = new Watcher(client, baseCfg);
    // No synthetics registered — idle tick
    const result = await w.tick();
    expect(result.armedCount).toBe(0);
    expect(client.getOrderbook).not.toHaveBeenCalled();
  });

  it('recorder is not called when there are no armed synthetics (idle tick)', async () => {
    const client = makeClient();
    const recorder = makeRecorder();
    const w = new Watcher(client, baseCfg, undefined, recorder);
    // No synthetics — books map is empty, loop over books does nothing
    await w.tick();
    expect(recorder.appendSnapshot).not.toHaveBeenCalled();
  });
});
