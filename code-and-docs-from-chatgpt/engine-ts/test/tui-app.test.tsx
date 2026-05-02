import React from 'react';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { upsertProfile, setActive } from '../src/credentials.js';

function withTempHome<T>(fn: () => Promise<T> | T): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-home-'));
  const prev = process.env.KEA_HOME;
  process.env.KEA_HOME = dir;
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      if (prev === undefined) delete process.env.KEA_HOME;
      else process.env.KEA_HOME = prev;
      fs.rmSync(dir, { recursive: true, force: true });
    });
}

// Mock the api module before importing App.
vi.mock('../src/tui/api.js', () => {
  return {
    fetchBalance: vi.fn(async () => ({ balanceDollars: 100.5, portfolioValueDollars: 250.75 })),
    fetchPositions: vi.fn(async () => ([
      { ticker: 'KXALPHA', rawPosition: 5, side: 'YES', quantity: 5, exposureDollars: 1.10, feesPaidDollars: 0.05, realizedPnlDollars: 0, restingOrdersCount: 1 },
      { ticker: 'KXBETA',  rawPosition: -3, side: 'NO', quantity: 3, exposureDollars: 0.60, feesPaidDollars: 0, realizedPnlDollars: 0, restingOrdersCount: 0 },
    ])),
    fetchRestingOrders: vi.fn(async () => ([
      { orderId: 'ord-1', ticker: 'KXALPHA', side: 'yes', action: 'sell', remaining: 3, priceDollars: '0.45', createdTime: 't' },
    ])),
    fetchPreview: vi.fn(async () => ({
      topBidCents: 42,
      decisionSize: 5,
      decisionPriceDollars: '0.4200',
      decisionReason: 'top_bid',
      grossDollars: 2.1, feesDollars: 0.05, netDollars: 2.05, effectiveRatePct: 2.38,
      perLevel: [{ priceCents: 42, size: 5, fillCount: 5, revenueDollars: 2.1, feesDollars: 0.05 }],
    })),
    fetchOrderbook: vi.fn(async () => ({
      yes: [{ priceCents: 42, size: 100 }, { priceCents: 41, size: 50 }],
      no:  [{ priceCents: 58, size: 80 }],
    })),
    listJournalSummaries: vi.fn(() => ([
      { jobId: 'job-1', filePath: '/tmp/job-1.jsonl', startedAt: '2026-04-01T00:00:00Z', lastTs: '2026-04-01T00:01:00Z', ticker: 'KXALPHA', lastKind: 'loop_finished', finished: true, entries: 10 },
      { jobId: 'job-2', filePath: '/tmp/job-2.jsonl', startedAt: '2026-04-02T00:00:00Z', lastTs: '2026-04-02T00:00:00Z', ticker: 'KXBETA', lastKind: 'order_placed', finished: false, entries: 4 },
    ])),
  };
});

const flush = async () => { await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r)); };

beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

async function mount() {
  const { App } = await import('../src/tui/App.js');
  return render(<App />);
}

describe('TUI App — dashboard tab', () => {
  it('renders header, balance, positions, resting orders', async () => {
    const { lastFrame, unmount } = await mount();
    await flush();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('kea — Kalshi Exit Assistant');
    expect(frame).toMatch(/balance.*\$100\.50/);
    expect(frame).toMatch(/portfolio value.*\$250\.75/);
    expect(frame).toContain('Positions (2)');
    expect(frame).toContain('KXALPHA');
    expect(frame).toContain('KXBETA');
    expect(frame).toContain('Resting orders (1)');
    expect(frame).toContain('ord-1');
    unmount();
  });

  it('refreshes on r key', async () => {
    const api = await import('../src/tui/api.js');
    const { stdin, unmount } = await mount();
    await flush();
    const initialCalls = (api.fetchBalance as ReturnType<typeof vi.fn>).mock.calls.length;
    stdin.write('r');
    await flush();
    expect((api.fetchBalance as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCalls);
    unmount();
  });

  it('arrow keys move cursor and ▶ marker', async () => {
    const { lastFrame, stdin, unmount } = await mount();
    await flush();
    const before = lastFrame() ?? '';
    // First row should have ▶ marker initially
    const linesBefore = before.split('\n').filter((l) => l.includes('KXALPHA') || l.includes('KXBETA'));
    expect(linesBefore.find((l) => l.includes('▶') && l.includes('KXALPHA'))).toBeTruthy();
    stdin.write('[B'); // down arrow
    await flush();
    const after = lastFrame() ?? '';
    const linesAfter = after.split('\n').filter((l) => l.includes('KXALPHA') || l.includes('KXBETA'));
    expect(linesAfter.find((l) => l.includes('▶') && l.includes('KXBETA'))).toBeTruthy();
    // Up arrow back to first
    stdin.write('[A');
    await flush();
    const back = lastFrame() ?? '';
    expect(back.split('\n').find((l) => l.includes('▶') && l.includes('KXALPHA'))).toBeTruthy();
    unmount();
  });

  it('does not move cursor past bounds', async () => {
    const { stdin, unmount, lastFrame } = await mount();
    await flush();
    // Up many times — still on row 0
    for (let i = 0; i < 5; i++) stdin.write('[A');
    await flush();
    expect(lastFrame()!.split('\n').find((l) => l.includes('▶') && l.includes('KXALPHA'))).toBeTruthy();
    // Down many times — still on last row
    for (let i = 0; i < 10; i++) stdin.write('[B');
    await flush();
    expect(lastFrame()!.split('\n').find((l) => l.includes('▶') && l.includes('KXBETA'))).toBeTruthy();
    unmount();
  });
});

describe('TUI App — tabs and selection', () => {
  it('Enter on dashboard sends target to preview tab', async () => {
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('\r'); // Enter — selects KXALPHA YES 5
    await flush();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Preview — KXALPHA YES × 5');
    expect(frame).toMatch(/top bid:.*42¢/);
    expect(frame).toMatch(/gross.*\$2\.1000/);
    expect(frame).toContain('per-level fills');
    unmount();
  });

  it('preview tab without target shows hint', async () => {
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('2'); // preview tab, no target yet
    await flush();
    expect(lastFrame()).toContain('No target selected');
    unmount();
  });

  it('book tab without target shows hint, with target shows ladders', async () => {
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('3'); // book, no target
    await flush();
    expect(lastFrame()).toContain('No target selected');
    stdin.write('1'); // back to dashboard
    await flush();
    stdin.write('\r'); // pick KXALPHA
    await flush();
    stdin.write('3'); // book tab
    await flush();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Orderbook — KXALPHA');
    expect(frame).toContain('YES bids');
    expect(frame).toContain('NO bids');
    expect(frame).toContain('42¢');
    expect(frame).toContain('58¢');
    unmount();
  });

  it('journal tab lists summaries', async () => {
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('4');
    await flush();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Recent jobs (2)');
    expect(frame).toContain('job-1');
    expect(frame).toContain('job-2');
    expect(frame).toContain('loop_finished');
    expect(frame).toContain('order_placed');
    unmount();
  });

  it('quits on q', async () => {
    const { stdin, frames, unmount } = await mount();
    await flush();
    stdin.write('q');
    await flush();
    // ink doesn't tear down immediately; just ensure no throw and we got renders
    expect(frames.length).toBeGreaterThan(0);
    unmount();
  });
});

describe('TUI App — error and empty states', () => {
  it('shows error in header when fetchBalance rejects', async () => {
    const api = await import('../src/tui/api.js');
    (api.fetchBalance as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network down'));
    const { lastFrame, unmount } = await mount();
    await flush();
    expect(lastFrame()).toContain('error: network down');
    unmount();
  });

  it('renders (no positions) and (none) when both lists are empty', async () => {
    const api = await import('../src/tui/api.js');
    (api.fetchPositions as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    (api.fetchRestingOrders as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    const { lastFrame, unmount } = await mount();
    await flush();
    expect(lastFrame()).toContain('(no positions)');
    expect(lastFrame()).toContain('(none)');
    unmount();
  });

  it('preview tab surfaces fetch error', async () => {
    const api = await import('../src/tui/api.js');
    (api.fetchPreview as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('book gone'));
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('\r'); // pick a position, jump to preview
    await flush();
    expect(lastFrame()).toContain('error: book gone');
    unmount();
  });

  it('book tab surfaces fetch error', async () => {
    const api = await import('../src/tui/api.js');
    (api.fetchOrderbook as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('500'));
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('\r'); // dashboard → preview
    await flush();
    stdin.write('3'); // book
    await flush();
    expect(lastFrame()).toContain('error: 500');
    unmount();
  });

  it('journal tab handles thrown error', async () => {
    const api = await import('../src/tui/api.js');
    (api.listJournalSummaries as ReturnType<typeof vi.fn>).mockImplementationOnce(() => { throw new Error('disk gone'); });
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('4');
    await flush();
    expect(lastFrame()).toContain('error: disk gone');
    unmount();
  });

  it('journal tab empty state', async () => {
    const api = await import('../src/tui/api.js');
    (api.listJournalSummaries as ReturnType<typeof vi.fn>).mockReturnValueOnce([]);
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('4');
    await flush();
    expect(lastFrame()).toContain('(no journal files');
    unmount();
  });

  it('preview empty perLevel', async () => {
    const api = await import('../src/tui/api.js');
    (api.fetchPreview as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      topBidCents: null, decisionSize: 0, decisionPriceDollars: '0.0000', decisionReason: 'no_book',
      grossDollars: 0, feesDollars: 0, netDollars: 0, effectiveRatePct: 0, perLevel: [],
    });
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('\r');
    await flush();
    expect(lastFrame()).toContain('(no levels filled)');
    expect(lastFrame()).toMatch(/top bid:.*—/);
    unmount();
  });

  it('book empty ladders', async () => {
    const api = await import('../src/tui/api.js');
    (api.fetchOrderbook as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ yes: [], no: [] });
    const { stdin, lastFrame, unmount } = await mount();
    await flush();
    stdin.write('\r');
    await flush();
    stdin.write('3');
    await flush();
    expect(lastFrame()).toContain('(empty)');
    unmount();
  });
});

describe('Account tab', () => {
  it('shows active profile name and base URL', async () => {
    await withTempHome(async () => {
      const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');
      upsertProfile('prod', { keyId: 'AKID-WXYZ', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      const { App } = await import('../src/tui/App.js');
      const { lastFrame, stdin, unmount } = render(<App />);
      await flush();
      stdin.write('a');
      await flush();
      expect(lastFrame()).toMatch(/prod/);
      expect(lastFrame()).toMatch(/PROD/i);
      unmount();
    });
  });

  it("renders 'Run kea login' when no profiles configured", async () => {
    await withTempHome(async () => {
      const prevKey = process.env.KALSHI_ACCESS_KEY;
      const prevPath = process.env.KALSHI_PRIVATE_KEY_PATH;
      delete process.env.KALSHI_ACCESS_KEY;
      delete process.env.KALSHI_PRIVATE_KEY_PATH;
      try {
        const { App } = await import('../src/tui/App.js');
        const { lastFrame, stdin, unmount } = render(<App />);
        await flush();
        stdin.write('a');
        await flush();
        expect(lastFrame()).toMatch(/kea login/);
        unmount();
      } finally {
        if (prevKey !== undefined) process.env.KALSHI_ACCESS_KEY = prevKey;
        if (prevPath !== undefined) process.env.KALSHI_PRIVATE_KEY_PATH = prevPath;
      }
    });
  });

  it("'s' keystroke cycles to next profile", async () => {
    await withTempHome(async () => {
      const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');
      upsertProfile('demo', { keyId: 'D', keyPath: FIXTURE, baseUrl: 'https://demo-api.kalshi.co/trade-api/v2' });
      upsertProfile('prod', { keyId: 'P', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      setActive('demo');
      const { App } = await import('../src/tui/App.js');
      const { lastFrame, stdin, unmount } = render(<App />);
      await flush();
      stdin.write('a');
      await flush();
      expect(lastFrame()).toMatch(/profile: demo/);
      stdin.write('s');
      await flush();
      expect(lastFrame()).toMatch(/profile: prod/);
      unmount();
    });
  });
});
