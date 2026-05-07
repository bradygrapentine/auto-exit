import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { ReportsTab } from '../../src/tui/ReportsTab.js';
import { App } from '../../src/tui/App.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function lastFrame(inst: ReturnType<typeof render>): string {
  return inst.lastFrame() ?? '';
}

const flush = async () => {
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
};

const DOWN = '\x1B[B';
const UP = '\x1B[A';
const ENTER = '\r';
const ESC = '\x1B';

// ── Mock api helpers ─────────────────────────────────────────────────────────

const mockListTcaJobs = vi.fn();
const mockReadTcaEntries = vi.fn();
const mockFetchPortfolioPlan = vi.fn();
const mockFetch = vi.fn();

vi.mock('../../src/tui/api.js', () => ({
  fetchBalance: vi.fn(async () => ({ balanceDollars: 0, portfolioValueDollars: 0 })),
  fetchPositions: vi.fn(async () => []),
  fetchRestingOrders: vi.fn(async () => []),
  fetchPreview: vi.fn(async () => ({})),
  fetchOrderbook: vi.fn(async () => ({ yes: [], no: [] })),
  listJournalSummaries: vi.fn(() => []),
  listTcaJobs: (...args: unknown[]) => mockListTcaJobs(...args),
  readTcaEntries: (...args: unknown[]) => mockReadTcaEntries(...args),
  fetchPortfolioPlan: (...args: unknown[]) => mockFetchPortfolioPlan(...args),
}));

vi.mock('../../src/credentials.js', () => ({
  listProfiles: vi.fn(() => ['default']),
  getActive: vi.fn(() => 'default'),
  setActive: vi.fn(),
  loadActive: vi.fn(() => ({ profileName: 'default', keyId: 'abcd1234', baseUrl: 'https://demo', privateKeyPath: '' })),
  KeaNotConfiguredError: class extends Error {},
  redactKeyId: vi.fn((k: string) => k.slice(-4)),
}));

vi.mock('../../src/safety.js', () => ({
  getSafety: vi.fn(() => ({ safetySubmittedMultiple: 1, floorPriceCents: 0, tailSweepThreshold: 0, forbiddenTickers: [] })),
  removeForbiddenTicker: vi.fn(),
}));

vi.mock('../../src/watcherSingleton.js', () => ({
  isWatcherInitialized: vi.fn(() => false),
  getWatcher: vi.fn(() => ({ list: () => [] })),
}));

beforeEach(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
  mockListTcaJobs.mockReset();
  mockReadTcaEntries.mockReset();
  mockFetchPortfolioPlan.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── T1: TCA view — empty state ────────────────────────────────────────────────

describe('ReportsTab — TCA empty state', () => {
  it('shows "no completed jobs" when no tca jobs', async () => {
    mockListTcaJobs.mockReturnValue([]);
    const inst = render(<ReportsTab />);
    await flush();
    expect(lastFrame(inst)).toContain('no completed jobs with TCA data');
    inst.unmount();
  });

  it('renders TCA tab as active by default', async () => {
    mockListTcaJobs.mockReturnValue([]);
    const inst = render(<ReportsTab />);
    await flush();
    expect(lastFrame(inst)).toContain('[t TCA]');
    inst.unmount();
  });

  it('renders sub-view toggle hints', async () => {
    mockListTcaJobs.mockReturnValue([]);
    const inst = render(<ReportsTab />);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('[t] TCA');
    expect(frame).toContain('[p] portfolio');
    inst.unmount();
  });
});

// ── T2: TCA view — job list ───────────────────────────────────────────────────

describe('ReportsTab — TCA job list', () => {
  const sampleJobs = [
    { jobId: 'job-2024-01', filePath: '/tmp/job-2024-01.jsonl', ticker: 'KXTEST-24', side: 'sell', tcaChunks: 3 },
    { jobId: 'job-2024-02', filePath: '/tmp/job-2024-02.jsonl', ticker: 'KXOTHER', side: 'buy', tcaChunks: 5 },
  ];

  it('lists jobIds', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    const inst = render(<ReportsTab />);
    await flush();
    expect(lastFrame(inst)).toContain('job-2024-01');
    inst.unmount();
  });

  it('shows chunk count', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    const inst = render(<ReportsTab />);
    await flush();
    expect(lastFrame(inst)).toContain('3');
    inst.unmount();
  });

  it('cursor on first item by default', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    const inst = render(<ReportsTab />);
    await flush();
    const cursorLine = lastFrame(inst).split('\n').find((l) => l.includes('▶'));
    expect(cursorLine).toBeDefined();
    expect(cursorLine).toContain('job-2024-01');
    inst.unmount();
  });

  it('down arrow moves cursor to second job', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    const inst = render(<ReportsTab />);
    await flush();
    inst.stdin.write(DOWN);
    await flush();
    const cursorLine = lastFrame(inst).split('\n').find((l) => l.includes('▶'));
    expect(cursorLine).toContain('job-2024-02');
    inst.unmount();
  });

  it('up arrow at top stays at index 0', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    const inst = render(<ReportsTab />);
    await flush();
    inst.stdin.write(UP);
    await flush();
    const cursorLine = lastFrame(inst).split('\n').find((l) => l.includes('▶'));
    expect(cursorLine).toContain('job-2024-01');
    inst.unmount();
  });
});

// ── T3: TCA detail view ───────────────────────────────────────────────────────

describe('ReportsTab — TCA detail', () => {
  const sampleJobs = [
    { jobId: 'job-abc', filePath: '/tmp/job-abc.jsonl', ticker: 'KXTEST', side: 'sell', tcaChunks: 2 },
  ];
  const sampleChunks = [
    { chunkIndex: 0, arrivalMidCents: 55.0, executedPriceCents: 53.0, slippageCents: -2.0, chunkSize: 10 },
    { chunkIndex: 1, arrivalMidCents: 54.0, executedPriceCents: 52.5, slippageCents: -1.5, chunkSize: 10 },
  ];

  it('opens detail on enter', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    mockReadTcaEntries.mockReturnValue(sampleChunks);
    const inst = render(<ReportsTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('TCA —');
    expect(frame).toContain('KXTEST');
    inst.unmount();
  });

  it('shows chunk rows in detail', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    mockReadTcaEntries.mockReturnValue(sampleChunks);
    const inst = render(<ReportsTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    const frame = lastFrame(inst);
    // chunk 1 and 2 indexes
    expect(frame).toContain('1');
    expect(frame).toContain('2');
    inst.unmount();
  });

  it('shows avg slippage', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    mockReadTcaEntries.mockReturnValue(sampleChunks);
    const inst = render(<ReportsTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    expect(lastFrame(inst)).toContain('Avg slippage');
    inst.unmount();
  });

  it('esc returns to list', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    mockReadTcaEntries.mockReturnValue(sampleChunks);
    const inst = render(<ReportsTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    inst.stdin.write(ESC);
    await flush();
    expect(lastFrame(inst)).toContain('TCA jobs with data');
    inst.unmount();
  });

  it('b key returns to list', async () => {
    mockListTcaJobs.mockReturnValue(sampleJobs);
    mockReadTcaEntries.mockReturnValue(sampleChunks);
    const inst = render(<ReportsTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    inst.stdin.write('b');
    await flush();
    expect(lastFrame(inst)).toContain('TCA jobs with data');
    inst.unmount();
  });
});

// ── T4: Portfolio view ────────────────────────────────────────────────────────

describe('ReportsTab — portfolio view', () => {
  it('shows empty state when no positions', async () => {
    mockListTcaJobs.mockReturnValue([]);
    const inst = render(<ReportsTab positions={[]} />);
    await flush();
    inst.stdin.write('p');
    await flush();
    expect(lastFrame(inst)).toContain('no positions known');
    inst.unmount();
  });

  it('shows portfolio plan entries when positions provided', async () => {
    mockListTcaJobs.mockReturnValue([]);
    const planEntries = [
      { rank: 1, ticker: 'KXTEST', side: 'yes' as const, size: 10, markToBidDollars: 5.0, evHoldDollars: 4.5, overvaluedDollars: 0.5, recommendedStrategy: 'aggressive' as const },
    ];
    mockFetchPortfolioPlan.mockResolvedValue(planEntries);
    const positions = [{ ticker: 'KXTEST', side: 'yes' as const, size: 10 }];
    const inst = render(<ReportsTab positions={positions} />);
    await flush();
    inst.stdin.write('p');
    await flush();
    await flush();
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('KXTEST');
    expect(frame).toContain('aggressive');
    inst.unmount();
  });

  it('shows loading while fetching', async () => {
    mockListTcaJobs.mockReturnValue([]);
    // Never resolves — stays loading
    mockFetchPortfolioPlan.mockReturnValue(new Promise(() => {}));
    const positions = [{ ticker: 'KXTEST', side: 'yes' as const, size: 10 }];
    const inst = render(<ReportsTab positions={positions} />);
    await flush();
    inst.stdin.write('p');
    await flush();
    expect(lastFrame(inst)).toContain('loading');
    inst.unmount();
  });

  it('shows error on fetch failure', async () => {
    mockListTcaJobs.mockReturnValue([]);
    mockFetchPortfolioPlan.mockRejectedValue(new Error('network error'));
    const positions = [{ ticker: 'KXTEST', side: 'yes' as const, size: 10 }];
    const inst = render(<ReportsTab positions={positions} />);
    await flush();
    inst.stdin.write('p');
    await flush();
    await flush();
    await flush();
    expect(lastFrame(inst)).toContain('error');
    inst.unmount();
  });

  it('p key switches to portfolio view', async () => {
    mockListTcaJobs.mockReturnValue([]);
    const inst = render(<ReportsTab />);
    await flush();
    inst.stdin.write('p');
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('[p portfolio]');
    inst.unmount();
  });

  it('t key switches back to TCA view', async () => {
    mockListTcaJobs.mockReturnValue([]);
    const inst = render(<ReportsTab />);
    await flush();
    inst.stdin.write('p');
    await flush();
    inst.stdin.write('t');
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('[t TCA]');
    inst.unmount();
  });
});

// ── T5: App registration ──────────────────────────────────────────────────────

describe('App — reports tab registration', () => {
  it('renders ReportsTab on 8 key', async () => {
    mockListTcaJobs.mockReturnValue([]);
    const inst = render(<App />);
    await flush();
    await flush();
    inst.stdin.write('8');
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('[t TCA]');
    inst.unmount();
  });

  it('TabBar shows reports item', async () => {
    mockListTcaJobs.mockReturnValue([]);
    const inst = render(<App />);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('reports');
    inst.unmount();
  });
});
