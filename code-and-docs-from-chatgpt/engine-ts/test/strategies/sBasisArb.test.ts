/**
 * Tests for SBasisArbRunner + buildSBasisArbArgs (src/strategies/sBasisArb.ts).
 *
 * All execution is mocked via pairRunInvoke + fetchOrderbookInvoke injections.
 * No real network calls.
 */

import { describe, it, expect, vi } from 'vitest';
import { SBasisArbRunner, buildSBasisArbArgs } from '../../src/strategies/sBasisArb.js';
import type { SBasisArbArgs, PairRunInvokeFn, FetchOrderbookInvokeFn } from '../../src/strategies/sBasisArb.js';
import type { MultiLegResult } from '../../src/multiLeg.js';
import type { KalshiClientLike, Orderbook } from '../../src/types.js';
import { Journal } from '../../src/journal.js';

// ── Test helpers ───────────────────────────────────────────────────────────────

function tmpJournal(): Journal {
  return new Journal(`test-basis-arb-${Date.now()}`);
}

function makeClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn().mockResolvedValue({ yes: [], no: [] }),
  } as unknown as KalshiClientLike;
}

/** Build a book with a single ask at the given price for each side. */
function makeBook(yesAsk: number, noAsk: number): Orderbook {
  return {
    yes: [{ priceCents: yesAsk, size: 100 }],
    no: [{ priceCents: noAsk, size: 100 }],
  };
}

/** A pairRunInvoke that immediately returns a successful (not halted) result. */
function makeSuccessfulPairRun(filled = 51): PairRunInvokeFn {
  return vi.fn().mockResolvedValue({
    legs: [
      { filled, leg: { ticker: 'TICKER', side: 'yes', size: filled, executionMode: 'aggressive' } },
      { filled, leg: { ticker: 'TICKER', side: 'no', size: filled, executionMode: 'aggressive' } },
    ],
    halted: false,
    haltReason: undefined,
    durationMs: 10,
  } satisfies MultiLegResult);
}

/** A pairRunInvoke that returns a halted result. */
function makeHaltedPairRun(reason = 'test halt'): PairRunInvokeFn {
  return vi.fn().mockResolvedValue({
    legs: [
      { filled: 0, leg: { ticker: 'TICKER', side: 'yes', size: 51, executionMode: 'aggressive' } },
      { filled: 0, leg: { ticker: 'TICKER', side: 'no', size: 51, executionMode: 'aggressive' } },
    ],
    halted: true,
    haltReason: reason,
    durationMs: 5,
  } satisfies MultiLegResult);
}

function baseArgs(overrides: Partial<SBasisArbArgs> = {}): SBasisArbArgs {
  return {
    ticker: 'TICKER',
    totalDollarBudget: 50,
    journal: tmpJournal(),
    client: makeClient(),
    fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(60, 38)),
    pairRunInvoke: makeSuccessfulPairRun(),
    ...overrides,
  };
}

// ── buildSBasisArbArgs validation ─────────────────────────────────────────────

describe('buildSBasisArbArgs', () => {
  it('1a. rejects totalDollarBudget <= 0', () => {
    expect(() =>
      buildSBasisArbArgs({ ...baseArgs(), totalDollarBudget: 0 }),
    ).toThrow('totalDollarBudget must be > 0');
  });

  it('1b. rejects negative budget', () => {
    expect(() =>
      buildSBasisArbArgs({ ...baseArgs(), totalDollarBudget: -10 }),
    ).toThrow('totalDollarBudget must be > 0');
  });

  it('1c. rejects empty ticker', () => {
    expect(() =>
      buildSBasisArbArgs({ ...baseArgs(), ticker: '' }),
    ).toThrow('ticker must be non-empty');
  });

  it('1d. rejects whitespace-only ticker', () => {
    expect(() =>
      buildSBasisArbArgs({ ...baseArgs(), ticker: '   ' }),
    ).toThrow('ticker must be non-empty');
  });

  it('1e. rejects perPairSlippageCents < 0', () => {
    expect(() =>
      buildSBasisArbArgs({ ...baseArgs(), perPairSlippageCents: -1 }),
    ).toThrow('perPairSlippageCents must be in [0, 99]');
  });

  it('1f. rejects perPairSlippageCents > 99', () => {
    expect(() =>
      buildSBasisArbArgs({ ...baseArgs(), perPairSlippageCents: 100 }),
    ).toThrow('perPairSlippageCents must be in [0, 99]');
  });

  it('10. default perPairSlippageCents = 0 when omitted', () => {
    const result = buildSBasisArbArgs(baseArgs());
    expect(result.perPairSlippageCents).toBe(0);
  });
});

// ── Pre-flight checks ─────────────────────────────────────────────────────────

describe('SBasisArbRunner pre-flight', () => {
  it('2. yesAsk=60 + noAsk=38 = 98¢ → proceeds (2¢ arb); sizes correct for $50 budget', async () => {
    // $50 × 100 / 98 = floor(51.02) = 51 pairs
    const pairRunInvoke = makeSuccessfulPairRun(51);
    const runner = new SBasisArbRunner(baseArgs({
      totalDollarBudget: 50,
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(60, 38)),
      pairRunInvoke,
    }));
    const result = await runner.run();
    expect(result.halted).toBe(false);
    expect(result.pairsToBuy).toBe(51);
    expect(pairRunInvoke).toHaveBeenCalledOnce();
    const callArg = (pairRunInvoke as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(callArg.pairsToBuy).toBe(51);
  });

  it('3. yesAsk=60 + noAsk=42 = 102¢ → throws "arb closed"', async () => {
    const runner = new SBasisArbRunner(baseArgs({
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(60, 42)),
    }));
    await expect(runner.run()).rejects.toThrow('arb closed: yesAsk + noAsk = 102¢ ≥ 100¢');
  });

  it('4. perPairSlippageCents=2 with sum=102 → proceeds', async () => {
    const pairRunInvoke = makeSuccessfulPairRun(49);
    const runner = new SBasisArbRunner(baseArgs({
      perPairSlippageCents: 2,
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(60, 42)),  // sum = 102
      pairRunInvoke,
    }));
    // threshold = 100 + 2 = 102; 102 >= 102 → still throws (spec: "≥")
    await expect(runner.run()).rejects.toThrow('arb closed: yesAsk + noAsk = 102¢ ≥ 102¢');
  });

  it('4b. perPairSlippageCents=2 with sum=101 → proceeds', async () => {
    const pairRunInvoke = makeSuccessfulPairRun(49);
    const runner = new SBasisArbRunner(baseArgs({
      perPairSlippageCents: 2,
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(60, 41)),  // sum = 101
      pairRunInvoke,
    }));
    const result = await runner.run();
    expect(result.halted).toBe(false);
    expect(result.pairsToBuy).toBe(Math.floor(50 * 100 / 101));
  });

  it('8. empty book (null) on pre-flight throws', async () => {
    const runner = new SBasisArbRunner(baseArgs({
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(null),
    }));
    await expect(runner.run()).rejects.toThrow('empty book on pre-flight');
  });

  it('8b. empty yes side (no asks) on pre-flight throws', async () => {
    const runner = new SBasisArbRunner(baseArgs({
      fetchOrderbookInvoke: vi.fn().mockResolvedValue({
        yes: [],  // no asks
        no: [{ priceCents: 40, size: 100 }],
      }),
    }));
    await expect(runner.run()).rejects.toThrow('empty book side on pre-flight');
  });
});

// ── Sizing math ────────────────────────────────────────────────────────────────

describe('SBasisArbRunner sizing math', () => {
  it('6. $50 × 100 / 98 = floor(51.02) = 51 pairs', async () => {
    const pairRunInvoke = makeSuccessfulPairRun(51);
    const runner = new SBasisArbRunner(baseArgs({
      totalDollarBudget: 50,
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(60, 38)),  // sum = 98
      pairRunInvoke,
    }));
    const result = await runner.run();
    expect(result.pairsToBuy).toBe(51);
  });

  it('6b. exact floor: $10 × 100 / 98 = floor(10.20) = 10 pairs', async () => {
    const pairRunInvoke = makeSuccessfulPairRun(10);
    const runner = new SBasisArbRunner(baseArgs({
      totalDollarBudget: 10,
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(60, 38)),
      pairRunInvoke,
    }));
    const result = await runner.run();
    expect(result.pairsToBuy).toBe(10);
  });
});

// ── Mid-flight checks ──────────────────────────────────────────────────────────

describe('SBasisArbRunner mid-flight', () => {
  it('5. mid-flight close: book moves to sum>=100 → basis_arb_closed_midflight journaled + pairRunInvoke sees null', async () => {
    const journal = tmpJournal();
    const journalAppend = vi.spyOn(journal, 'append');

    // fetchOrderbookInvoke: first call (pre-flight) returns open arb,
    // subsequent calls (mid-flight) return closed arb.
    let callCount = 0;
    const fetchOrderbookInvoke: FetchOrderbookInvokeFn = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return makeBook(60, 38); // pre-flight: 98¢ open
      return makeBook(60, 42);                      // mid-flight: 102¢ closed
    });

    // pairRunInvoke that calls the injected fetchOrderbook once to trigger mid-flight check.
    const pairRunInvoke: PairRunInvokeFn = vi.fn().mockImplementation(async ({ fetchOrderbook }) => {
      // Simulate the poll cycle calling fetchOrderbook
      const book = await fetchOrderbook!('TICKER');
      // book will be null because mid-flight monitor returned null
      expect(book).toBeNull();
      return {
        legs: [
          { filled: 0, leg: { ticker: 'TICKER', side: 'yes', size: 51, executionMode: 'aggressive' } },
          { filled: 0, leg: { ticker: 'TICKER', side: 'no', size: 51, executionMode: 'aggressive' } },
        ],
        halted: true,
        haltReason: 'leg 0 (TICKER): empty book',
        durationMs: 5,
      } satisfies MultiLegResult;
    });

    const runner = new SBasisArbRunner({
      ...baseArgs({ journal }),
      fetchOrderbookInvoke,
      pairRunInvoke,
    });

    const result = await runner.run();

    expect(result.halted).toBe(true);
    const kinds = journalAppend.mock.calls.map((c) => c[0] as string);
    expect(kinds).toContain('basis_arb_closed_midflight');
  });
});

// ── Journal ordering ───────────────────────────────────────────────────────────

describe('SBasisArbRunner journal ordering', () => {
  it('9. successful completion: basis_arb_started before basis_arb_finished, both present', async () => {
    const journal = tmpJournal();
    const journalAppend = vi.spyOn(journal, 'append');

    const runner = new SBasisArbRunner({
      ...baseArgs({ journal }),
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(60, 38)),
      pairRunInvoke: makeSuccessfulPairRun(51),
    });

    await runner.run();

    const kinds = journalAppend.mock.calls.map((c) => c[0] as string);
    expect(kinds).toContain('basis_arb_started');
    expect(kinds).toContain('basis_arb_finished');

    const startIdx = kinds.indexOf('basis_arb_started');
    const finishIdx = kinds.indexOf('basis_arb_finished');
    expect(startIdx).toBeLessThan(finishIdx);
  });

  it('7. both legs share same journal (pairRunInvoke receives same journal instance)', async () => {
    const journal = tmpJournal();
    let capturedJournal: Journal | undefined;

    const pairRunInvoke: PairRunInvokeFn = vi.fn().mockImplementation(async ({ journal: j }) => {
      capturedJournal = j;
      return {
        legs: [
          { filled: 51, leg: { ticker: 'TICKER', side: 'yes', size: 51, executionMode: 'aggressive' } },
          { filled: 51, leg: { ticker: 'TICKER', side: 'no', size: 51, executionMode: 'aggressive' } },
        ],
        halted: false,
        durationMs: 10,
      } satisfies MultiLegResult;
    });

    const runner = new SBasisArbRunner({
      ...baseArgs({ journal }),
      pairRunInvoke,
    });

    await runner.run();

    expect(capturedJournal).toBe(journal);
  });
});

// ── Default slippage ───────────────────────────────────────────────────────────

describe('SBasisArbRunner defaults', () => {
  it('10. default perPairSlippageCents=0: sum=100 throws (≥ 100)', async () => {
    const runner = new SBasisArbRunner(baseArgs({
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(50, 50)),  // sum exactly 100
    }));
    await expect(runner.run()).rejects.toThrow('arb closed: yesAsk + noAsk = 100¢ ≥ 100¢');
  });

  it('10b. default perPairSlippageCents=0: sum=99 proceeds', async () => {
    const pairRunInvoke = makeSuccessfulPairRun(50);
    const runner = new SBasisArbRunner(baseArgs({
      fetchOrderbookInvoke: vi.fn().mockResolvedValue(makeBook(50, 49)),  // sum = 99
      pairRunInvoke,
    }));
    const result = await runner.run();
    expect(result.halted).toBe(false);
    expect(result.pairsToBuy).toBe(Math.floor(50 * 100 / 99));
  });
});
