/**
 * sIceberg.test.ts — TDD suite for S13 Iceberg runner.
 *
 * All exchange I/O is injected via postOrderInvoke / getOrderStatusInvoke /
 * cancelOrderInvoke so no real network is required. Journal is mocked with
 * vi.spyOn() to assert journal ordering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  IcebergRunner,
  buildSIcebergArgs,
} from '../../src/strategies/sIceberg.js';
import type {
  S13Config,
  PostOrderInvoke,
  GetOrderStatusInvoke,
  CancelOrderInvoke,
} from '../../src/strategies/sIceberg.js';
import { Journal } from '../../src/journal.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

let orderCounter = 0;

function makeOrderId(): string {
  return `order-${++orderCounter}`;
}

/**
 * Build a postOrderInvoke that always resolves with a unique order ID.
 */
function makePostOrder(): PostOrderInvoke {
  return vi.fn().mockImplementation(() => Promise.resolve(makeOrderId()));
}

/**
 * Build a getOrderStatusInvoke that immediately reports the full slice as filled.
 */
function makeGetStatusImmediate(sliceQty: number): GetOrderStatusInvoke {
  return vi.fn().mockImplementation(() =>
    Promise.resolve({ filled: sliceQty, remaining: 0 }),
  );
}

/**
 * Build a getOrderStatusInvoke that reports `filled` / `remaining` based on a
 * fixed per-slice fill amount.
 */
function makeGetStatusFixed(filledPerSlice: number): GetOrderStatusInvoke {
  return vi.fn().mockImplementation((_orderId: string) =>
    Promise.resolve({ filled: filledPerSlice, remaining: 0 }),
  );
}

function makeCancelOrder(): CancelOrderInvoke {
  return vi.fn().mockResolvedValue(undefined);
}

function makeJournalSpy(keaHome = '/tmp/s13-test-home'): Journal {
  const j = new Journal('test-job-id', keaHome);
  vi.spyOn(j, 'append');
  return j;
}

const BASE_CONFIG: Omit<S13Config, 'postOrderInvoke' | 'getOrderStatusInvoke' | 'cancelOrderInvoke'> = {
  ticker: 'TEST-TICKER',
  side: 'yes',
  size: 100,
  visibleSize: 10,
  priceCents: 55,
  sleepMs: () => Promise.resolve(),
  pollIntervalMs: 0,
  keaHome: '/tmp/s13-test-home',
  jobId: 'test-job-id',
};

function makeConfig(overrides?: Partial<S13Config>): S13Config {
  const postOrderInvoke = makePostOrder();
  const getOrderStatusInvoke = makeGetStatusFixed(overrides?.visibleSize ?? BASE_CONFIG.visibleSize);
  const cancelOrderInvoke = makeCancelOrder();
  return {
    ...BASE_CONFIG,
    postOrderInvoke,
    getOrderStatusInvoke,
    cancelOrderInvoke,
    ...overrides,
  };
}

// ── 1. buildSIcebergArgs validation ──────────────────────────────────────────

describe('buildSIcebergArgs — validation', () => {
  it('accepts valid args', () => {
    expect(() =>
      buildSIcebergArgs({ ticker: 'T', side: 'yes', size: 100, visibleSize: 10, priceCents: 50 }),
    ).not.toThrow();
  });

  it('rejects size <= 0', () => {
    expect(() =>
      buildSIcebergArgs({ ticker: 'T', side: 'yes', size: 0, visibleSize: 1, priceCents: 50 }),
    ).toThrow(/size/);
  });

  it('rejects visibleSize > size', () => {
    expect(() =>
      buildSIcebergArgs({ ticker: 'T', side: 'yes', size: 10, visibleSize: 11, priceCents: 50 }),
    ).toThrow(/visibleSize/);
  });

  it('rejects visibleSize < 1', () => {
    expect(() =>
      buildSIcebergArgs({ ticker: 'T', side: 'yes', size: 10, visibleSize: 0, priceCents: 50 }),
    ).toThrow(/visibleSize/);
  });

  it('rejects priceCents = 0', () => {
    expect(() =>
      buildSIcebergArgs({ ticker: 'T', side: 'yes', size: 10, visibleSize: 5, priceCents: 0 }),
    ).toThrow(/priceCents/);
  });

  it('rejects priceCents = 100', () => {
    expect(() =>
      buildSIcebergArgs({ ticker: 'T', side: 'yes', size: 10, visibleSize: 5, priceCents: 100 }),
    ).toThrow(/priceCents/);
  });

  it('rejects invalid side', () => {
    expect(() =>
      buildSIcebergArgs({
        ticker: 'T',
        side: 'buy' as never,
        size: 10,
        visibleSize: 5,
        priceCents: 50,
      }),
    ).toThrow(/side/);
  });

  it('accepts side="no"', () => {
    expect(() =>
      buildSIcebergArgs({ ticker: 'T', side: 'no', size: 100, visibleSize: 10, priceCents: 50 }),
    ).not.toThrow();
  });
});

// ── 2. Happy path: 1000/50 → 20 slices ───────────────────────────────────────

describe('IcebergRunner — happy path 1000/50 → 20 slices', () => {
  it('posts exactly 20 slices and returns cumulativeFilled=1000', async () => {
    const postOrder = vi.fn().mockImplementation(() => Promise.resolve(makeOrderId()));
    const getStatus = vi.fn().mockResolvedValue({ filled: 50, remaining: 0 });
    const cancelOrder = makeCancelOrder();

    const runner = new IcebergRunner({
      ...BASE_CONFIG,
      size: 1000,
      visibleSize: 50,
      postOrderInvoke: postOrder,
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: cancelOrder,
    });

    const result = await runner.run();

    expect(result.reason).toBe('complete');
    expect(result.cumulativeFilled).toBe(1000);
    expect(result.slices).toBe(20);
    expect(postOrder).toHaveBeenCalledTimes(20);
  });
});

// ── 3. Final partial slice: 100/30 → [30,30,30,10] ───────────────────────────

describe('IcebergRunner — partial final slice 100/30', () => {
  it('posts 4 slices with last slice = 10', async () => {
    const sliceSizes: number[] = [];
    const postOrder: PostOrderInvoke = vi.fn().mockImplementation((qty) => {
      sliceSizes.push(qty);
      return Promise.resolve(makeOrderId());
    });

    // getStatus must return the qty that was posted (variable per slice)
    let callIndex = 0;
    const getStatus: GetOrderStatusInvoke = vi.fn().mockImplementation((_id) => {
      const qty = sliceSizes[callIndex++] ?? 0;
      return Promise.resolve({ filled: qty, remaining: 0 });
    });

    const runner = new IcebergRunner({
      ...BASE_CONFIG,
      size: 100,
      visibleSize: 30,
      postOrderInvoke: postOrder,
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: makeCancelOrder(),
    });

    const result = await runner.run();

    expect(result.reason).toBe('complete');
    expect(result.cumulativeFilled).toBe(100);
    expect(result.slices).toBe(4);
    expect(sliceSizes).toEqual([30, 30, 30, 10]);
  });
});

// ── 4. visibleSize === size → single post ─────────────────────────────────────

describe('IcebergRunner — visibleSize === size', () => {
  it('posts exactly 1 slice', async () => {
    const postOrder = makePostOrder();
    const getStatus: GetOrderStatusInvoke = vi.fn().mockResolvedValue({ filled: 50, remaining: 0 });

    const runner = new IcebergRunner({
      ...BASE_CONFIG,
      size: 50,
      visibleSize: 50,
      postOrderInvoke: postOrder,
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: makeCancelOrder(),
    });

    const result = await runner.run();

    expect(result.slices).toBe(1);
    expect(result.cumulativeFilled).toBe(50);
    expect(result.reason).toBe('complete');
  });
});

// ── 5. Stop mid-slice cancels pending order ───────────────────────────────────

describe('IcebergRunner — stop mid-slice', () => {
  it('cancels pending order and returns caller_stopped', async () => {
    let slicePosted = 0;
    const postOrder: PostOrderInvoke = vi.fn().mockImplementation(() => {
      slicePosted += 1;
      return Promise.resolve('order-stop-test');
    });

    const cancelOrder = makeCancelOrder();
    let runner: IcebergRunner;

    // getStatus will trigger stop on first call
    const getStatus: GetOrderStatusInvoke = vi.fn().mockImplementation(async (_id) => {
      // Stop the runner on the very first poll — simulating stop mid-slice
      runner.stop();
      return { filled: 0, remaining: 10 };
    });

    runner = new IcebergRunner({
      ...BASE_CONFIG,
      size: 100,
      visibleSize: 10,
      postOrderInvoke: postOrder,
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: cancelOrder,
    });

    const result = await runner.run();

    expect(result.reason).toBe('caller_stopped');
    expect(cancelOrder).toHaveBeenCalledTimes(1);
    expect(cancelOrder).toHaveBeenCalledWith('order-stop-test');
    expect(slicePosted).toBe(1);
  });
});

// ── 6. Stop before first slice ────────────────────────────────────────────────

describe('IcebergRunner — stop before first slice', () => {
  it('posts nothing and returns caller_stopped', async () => {
    const postOrder = makePostOrder();
    const cancelOrder = makeCancelOrder();
    const getStatus = makeGetStatusFixed(10);

    const runner = new IcebergRunner({
      ...BASE_CONFIG,
      postOrderInvoke: postOrder,
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: cancelOrder,
    });

    runner.stop();
    const result = await runner.run();

    expect(result.reason).toBe('caller_stopped');
    expect(result.cumulativeFilled).toBe(0);
    expect(postOrder).not.toHaveBeenCalled();
    expect(cancelOrder).not.toHaveBeenCalled();
  });
});

// ── 7. cancelOrderInvoke called exactly once on stop mid-slice ────────────────

describe('IcebergRunner — cancelOrderInvoke called once on stop', () => {
  it('calls cancelOrderInvoke exactly once', async () => {
    const cancelOrder = makeCancelOrder();
    let runner: IcebergRunner;

    const getStatus: GetOrderStatusInvoke = vi.fn().mockImplementation(async () => {
      runner.stop();
      return { filled: 0, remaining: 10 };
    });

    runner = new IcebergRunner({
      ...BASE_CONFIG,
      size: 100,
      visibleSize: 10,
      postOrderInvoke: makePostOrder(),
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: cancelOrder,
    });

    await runner.run();
    expect(cancelOrder).toHaveBeenCalledTimes(1);
  });
});

// ── 8. Journal order: posted then filled ──────────────────────────────────────

describe('IcebergRunner — journal order', () => {
  it('journals iceberg_started, iceberg_slice_posted, iceberg_slice_filled, iceberg_finished in order', async () => {
    const j = makeJournalSpy();
    const appendSpy = j.append as ReturnType<typeof vi.spyOn>;

    const postOrder: PostOrderInvoke = vi.fn().mockResolvedValue('ord-001');
    const getStatus: GetOrderStatusInvoke = vi.fn().mockResolvedValue({ filled: 10, remaining: 0 });

    const runner = new IcebergRunner(
      {
        ...BASE_CONFIG,
        size: 10,
        visibleSize: 10,
        postOrderInvoke: postOrder,
        getOrderStatusInvoke: getStatus,
        cancelOrderInvoke: makeCancelOrder(),
      },
      j,
    );

    await runner.run();

    const kinds = appendSpy.mock.calls.map((c) => c[0] as string);
    expect(kinds).toEqual([
      'iceberg_started',
      'iceberg_slice_posted',
      'iceberg_slice_filled',
      'iceberg_finished',
    ]);
  });
});

// ── 9. Total cumulative equals size ──────────────────────────────────────────

describe('IcebergRunner — total cumulative equals size', () => {
  it('cumulativeFilled exactly equals size on complete', async () => {
    const SIZE = 75;
    const VISIBLE = 25;

    const postOrder = makePostOrder();
    let sliceIndex = 0;
    const getStatus: GetOrderStatusInvoke = vi.fn().mockImplementation(() => {
      sliceIndex += 1;
      return Promise.resolve({ filled: VISIBLE, remaining: 0 });
    });

    const runner = new IcebergRunner({
      ...BASE_CONFIG,
      size: SIZE,
      visibleSize: VISIBLE,
      postOrderInvoke: postOrder,
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: makeCancelOrder(),
    });

    const result = await runner.run();
    expect(result.cumulativeFilled).toBe(SIZE);
  });
});

// ── 10. Side params passed through ───────────────────────────────────────────

describe('IcebergRunner — side params', () => {
  it('passes side to postOrderInvoke correctly for "no"', async () => {
    const postOrder: PostOrderInvoke = vi.fn().mockResolvedValue('order-no');
    const getStatus: GetOrderStatusInvoke = vi.fn().mockResolvedValue({ filled: 20, remaining: 0 });

    const runner = new IcebergRunner({
      ...BASE_CONFIG,
      side: 'no',
      size: 20,
      visibleSize: 20,
      postOrderInvoke: postOrder,
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: makeCancelOrder(),
    });

    await runner.run();

    expect(postOrder).toHaveBeenCalledWith(20, 'no', BASE_CONFIG.priceCents);
  });

  it('passes side to postOrderInvoke correctly for "yes"', async () => {
    const postOrder: PostOrderInvoke = vi.fn().mockResolvedValue('order-yes');
    const getStatus: GetOrderStatusInvoke = vi.fn().mockResolvedValue({ filled: 20, remaining: 0 });

    const runner = new IcebergRunner({
      ...BASE_CONFIG,
      side: 'yes',
      size: 20,
      visibleSize: 20,
      postOrderInvoke: postOrder,
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: makeCancelOrder(),
    });

    await runner.run();

    expect(postOrder).toHaveBeenCalledWith(20, 'yes', BASE_CONFIG.priceCents);
  });
});

// ── 11. Immediate repost after fill ──────────────────────────────────────────

describe('IcebergRunner — immediate repost', () => {
  it('reposts without extra delay between slices', async () => {
    const postOrder: PostOrderInvoke = vi.fn().mockImplementation(() =>
      Promise.resolve(makeOrderId()),
    );
    const getStatus: GetOrderStatusInvoke = vi.fn().mockResolvedValue({ filled: 10, remaining: 0 });
    const sleepMs = vi.fn().mockResolvedValue(undefined);

    const runner = new IcebergRunner({
      ...BASE_CONFIG,
      size: 30,
      visibleSize: 10,
      postOrderInvoke: postOrder,
      getOrderStatusInvoke: getStatus,
      cancelOrderInvoke: makeCancelOrder(),
      sleepMs,
    });

    await runner.run();

    // sleepMs is only called during polling (once per slice fill cycle at pollIntervalMs)
    // 3 slices × 1 poll each = 3 sleep calls (all during polling, none as inter-slice delay)
    expect(postOrder).toHaveBeenCalledTimes(3);
    // sleepMs count equals number of polls
    expect(sleepMs).toHaveBeenCalledTimes(3);
  });
});
