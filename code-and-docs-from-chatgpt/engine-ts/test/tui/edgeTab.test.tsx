import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { EdgeTab } from '../../src/tui/EdgeTab.js';
import { App } from '../../src/tui/App.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Mock api ──────────────────────────────────────────────────────────────────

const mockFetchEdgeSummary = vi.fn();
const mockFetchEdgePerStrategy = vi.fn();

vi.mock('../../src/tui/api.js', () => ({
  fetchBalance: vi.fn(async () => ({ balanceDollars: 0, portfolioValueDollars: 0 })),
  fetchPositions: vi.fn(async () => []),
  fetchRestingOrders: vi.fn(async () => []),
  fetchPreview: vi.fn(async () => ({})),
  fetchOrderbook: vi.fn(async () => ({ yes: [], no: [] })),
  listJournalSummaries: vi.fn(() => []),
  listTcaJobs: vi.fn(() => []),
  readTcaEntries: vi.fn(() => []),
  fetchPortfolioPlan: vi.fn(async () => []),
  fetchEdgeSummary: (...args: unknown[]) => mockFetchEdgeSummary(...args),
  fetchEdgePerStrategy: (...args: unknown[]) => mockFetchEdgePerStrategy(...args),
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
  mockFetchEdgeSummary.mockReset();
  mockFetchEdgePerStrategy.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── sample data ───────────────────────────────────────────────────────────────

const sampleSummaries = [
  {
    strategy: 'S-trail',
    category: 'nfl',
    fires: 12,
    realizedDollars: 45.50,
    vsPassiveHoldDollars: 12.00,
    vsImmediateExitDollars: 8.50,
    avgEdgePerFire: 3.79,
  },
  {
    strategy: 'S-passive',
    category: 'political',
    fires: 5,
    realizedDollars: -3.20,
    vsPassiveHoldDollars: -1.00,
    vsImmediateExitDollars: -0.50,
    avgEdgePerFire: -0.64,
  },
];

const sampleFires = [
  {
    fireId: 'fire-001',
    entryEdgeDollars: 2.50,
    exitEdgeDollars: 1.20,
    timingEdgeDollars: 0.30,
    triggerEdgeDollars: 0.10,
    feesDollars: -0.30,
    residualDollars: -0.01,
  },
];

// ── T1: empty state ───────────────────────────────────────────────────────────

describe('EdgeTab — empty state', () => {
  it('shows empty state when no summaries', async () => {
    mockFetchEdgeSummary.mockResolvedValue([]);
    const inst = render(<EdgeTab />);
    await flush();
    expect(lastFrame(inst)).toContain('No fires yet — run some strategies first.');
    inst.unmount();
  });

  it('shows loading initially', async () => {
    // Never resolves
    mockFetchEdgeSummary.mockReturnValue(new Promise(() => {}));
    const inst = render(<EdgeTab />);
    await flush();
    expect(lastFrame(inst)).toContain('loading');
    inst.unmount();
  });

  it('shows error on fetch failure', async () => {
    mockFetchEdgeSummary.mockRejectedValue(new Error('server down'));
    const inst = render(<EdgeTab />);
    await flush();
    await flush();
    expect(lastFrame(inst)).toContain('error');
    inst.unmount();
  });
});

// ── T2: strategy list ─────────────────────────────────────────────────────────

describe('EdgeTab — strategy list', () => {
  it('lists strategy names sorted by edge-per-fire', async () => {
    mockFetchEdgeSummary.mockResolvedValue(sampleSummaries);
    const inst = render(<EdgeTab />);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('S-trail');
    expect(frame).toContain('S-passive');
    inst.unmount();
  });

  it('cursor on first strategy by default', async () => {
    mockFetchEdgeSummary.mockResolvedValue(sampleSummaries);
    const inst = render(<EdgeTab />);
    await flush();
    const cursorLine = lastFrame(inst).split('\n').find((l) => l.includes('▶'));
    expect(cursorLine).toBeDefined();
    expect(cursorLine).toContain('S-trail');
    inst.unmount();
  });

  it('down arrow moves cursor to second strategy', async () => {
    mockFetchEdgeSummary.mockResolvedValue(sampleSummaries);
    const inst = render(<EdgeTab />);
    await flush();
    inst.stdin.write(DOWN);
    await flush();
    const cursorLine = lastFrame(inst).split('\n').find((l) => l.includes('▶'));
    expect(cursorLine).toContain('S-passive');
    inst.unmount();
  });
});

// ── T3: market category filter ────────────────────────────────────────────────

describe('EdgeTab — market filter', () => {
  it('m key cycles to nfl category', async () => {
    mockFetchEdgeSummary.mockResolvedValue(sampleSummaries);
    const inst = render(<EdgeTab />);
    await flush();
    // starts at 'all', one press → 'nfl'
    inst.stdin.write('m');
    await flush();
    expect(lastFrame(inst)).toContain('[nfl]');
    inst.unmount();
  });

  it('filters to matching category', async () => {
    mockFetchEdgeSummary.mockResolvedValue(sampleSummaries);
    const inst = render(<EdgeTab />);
    await flush();
    // cycle to 'nfl'
    inst.stdin.write('m');
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('S-trail');
    // political strategy should be hidden
    expect(frame).not.toContain('S-passive');
    inst.unmount();
  });
});

// ── T4: drill-down ────────────────────────────────────────────────────────────

describe('EdgeTab — drill-down', () => {
  it('enter opens fire decomposition for selected strategy', async () => {
    mockFetchEdgeSummary.mockResolvedValue(sampleSummaries);
    mockFetchEdgePerStrategy.mockResolvedValue(sampleFires);
    const inst = render(<EdgeTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('S-trail');
    expect(frame).toContain('fire-001');
    inst.unmount();
  });

  it('b key returns to list from drill-down', async () => {
    mockFetchEdgeSummary.mockResolvedValue(sampleSummaries);
    mockFetchEdgePerStrategy.mockResolvedValue(sampleFires);
    const inst = render(<EdgeTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    await flush();
    inst.stdin.write('b');
    await flush();
    expect(lastFrame(inst)).toContain('S-trail');
    expect(lastFrame(inst)).not.toContain('fire-001');
    inst.unmount();
  });
});

// ── T5: App wiring ────────────────────────────────────────────────────────────

describe('EdgeTab — App wiring', () => {
  it('TabBar shows edge item', async () => {
    mockFetchEdgeSummary.mockResolvedValue([]);
    const inst = render(<App />);
    await flush();
    expect(lastFrame(inst)).toContain('edge');
    inst.unmount();
  });
});
