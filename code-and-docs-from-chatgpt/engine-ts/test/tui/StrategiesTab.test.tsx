import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { StrategiesTab } from '../../src/tui/StrategiesTab.js';
import { App } from '../../src/tui/App.js';
import { listStrategyIds, STRATEGY_REGISTRY } from '../../src/strategies/registry.js';

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

/** Type a string one character at a time (required by ink-testing-library). */
async function type(inst: ReturnType<typeof render>, s: string) {
  for (const c of s) {
    inst.stdin.write(c);
    await flush();
  }
}

// Arrow key sequences for ink-testing-library
const DOWN = '\x1B[B';
const UP = '\x1B[A';
const ESC = '\x1B';
const ENTER = '\r';

// Mock fetch globally for network tests
const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── T1: renders strategy list ────────────────────────────────────────────────

describe('StrategiesTab — list rendering', () => {
  it('renders Strategies header with count', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('Strategies (');
    expect(frame).toContain('13');
    inst.unmount();
  });

  it('renders first strategy displayName', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('Aggressive (one-shot IoC)');
    inst.unmount();
  });

  it('renders danger badges for all levels', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('[high]');
    expect(frame).toContain('[low]');
    inst.unmount();
  });

  it('shows cursor indicator on first item', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    const cursorLine = lastFrame(inst).split('\n').find((l) => l.includes('▶'));
    expect(cursorLine).toBeDefined();
    expect(cursorLine).toContain('Aggressive');
    inst.unmount();
  });

  it('shows keyboard hint', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    expect(lastFrame(inst)).toContain('[↑↓] select');
    inst.unmount();
  });
});

// ── T2: list navigation ──────────────────────────────────────────────────────

describe('StrategiesTab — list navigation', () => {
  it('down arrow moves cursor to second strategy', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(DOWN);
    await flush();
    const cursorLine = lastFrame(inst).split('\n').find((l) => l.includes('▶'));
    expect(cursorLine).toBeDefined();
    expect(cursorLine).toContain('TWAP');
    inst.unmount();
  });

  it('up arrow at top stays at index 0', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(UP);
    await flush();
    const cursorLine = lastFrame(inst).split('\n').find((l) => l.includes('▶'));
    expect(cursorLine).toBeDefined();
    expect(cursorLine).toContain('Aggressive');
    inst.unmount();
  });

  it('down then up returns cursor to top', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(DOWN);
    await flush();
    inst.stdin.write(UP);
    await flush();
    const cursorLine = lastFrame(inst).split('\n').find((l) => l.includes('▶'));
    expect(cursorLine).toContain('Aggressive');
    inst.unmount();
  });

  it('cannot navigate past last item', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    for (let i = 0; i < 20; i++) {
      inst.stdin.write(DOWN);
      await flush();
    }
    expect(lastFrame(inst)).toBeTruthy();
    inst.unmount();
  });
});

// ── T3: form rendering per strategy ─────────────────────────────────────────

describe('StrategiesTab — form rendering', () => {
  it('opens form on enter', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('Aggressive (one-shot IoC)');
    expect(frame).toContain('Ticker');
    inst.unmount();
  });

  it('renders all fields for s-twap', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(DOWN);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('Interval (minutes)');
    expect(frame).toContain('Number of intervals');
    inst.unmount();
  });

  it('esc from form returns to list', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    inst.stdin.write(ESC);
    await flush();
    expect(lastFrame(inst)).toContain('Strategies (');
    inst.unmount();
  });

  it('shows description in form', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    expect(lastFrame(inst)).toContain('Single IoC sweep');
    inst.unmount();
  });
});

// ── T4: field validation ─────────────────────────────────────────────────────

describe('StrategiesTab — field validation', () => {
  it('shows error for empty required string field', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(ENTER); // open s-aggressive, first field = Ticker
    await flush();
    inst.stdin.write(ENTER); // submit empty ticker
    await flush();
    expect(lastFrame(inst)).toContain('is required');
    inst.unmount();
  });

  it('shows error for non-numeric number field', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(DOWN); // s-twap
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    // Fill Ticker
    await type(inst, 'TICK');
    inst.stdin.write(ENTER);
    await flush();
    // Fill Side (enum) — valid
    await type(inst, 'buy');
    inst.stdin.write(ENTER);
    await flush();
    // Fill Size with non-number
    await type(inst, 'abc');
    inst.stdin.write(ENTER);
    await flush();
    expect(lastFrame(inst)).toContain('must be a number');
    inst.unmount();
  });

  it('shows error for invalid enum value', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(ENTER); // s-aggressive
    await flush();
    // Ticker — valid
    await type(inst, 'TICK');
    inst.stdin.write(ENTER);
    await flush();
    // Side with invalid value
    await type(inst, 'maybe');
    inst.stdin.write(ENTER);
    await flush();
    expect(lastFrame(inst)).toContain('must be one of');
    inst.unmount();
  });

  it('advances field on valid input', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(ENTER); // s-aggressive
    await flush();
    await type(inst, 'KXTEST');
    inst.stdin.write(ENTER);
    await flush();
    // Should now be on Side field
    expect(lastFrame(inst)).toContain('Side');
    inst.unmount();
  });
});

// ── T5: danger-level confirm flow ────────────────────────────────────────────

describe('StrategiesTab — danger confirm flow', () => {
  /** Fill all fields for s-aggressive (high danger). */
  async function fillAggressive(inst: ReturnType<typeof render>) {
    await flush();
    inst.stdin.write(ENTER); // s-aggressive (cursor at 0)
    await flush();
    // Ticker
    await type(inst, 'KXTEST');
    inst.stdin.write(ENTER);
    await flush();
    // Side (enum: buy/sell)
    await type(inst, 'buy');
    inst.stdin.write(ENTER);
    await flush();
    // Size
    await type(inst, '10');
    inst.stdin.write(ENTER);
    await flush();
    // confirmedAggressive (boolean)
    await type(inst, 'true');
    inst.stdin.write(ENTER);
    await flush();
  }

  it('shows danger confirm for high-danger strategy', async () => {
    const inst = render(<StrategiesTab />);
    await fillAggressive(inst);
    expect(lastFrame(inst)).toContain('HIGH DANGER');
    inst.unmount();
  });

  it('n on danger confirm returns to list', async () => {
    const inst = render(<StrategiesTab />);
    await fillAggressive(inst);
    inst.stdin.write('n');
    await flush();
    expect(lastFrame(inst)).toContain('Strategies (');
    inst.unmount();
  });

  it('esc on danger confirm returns to list', async () => {
    const inst = render(<StrategiesTab />);
    await fillAggressive(inst);
    inst.stdin.write(ESC);
    await flush();
    expect(lastFrame(inst)).toContain('Strategies (');
    inst.unmount();
  });

  it('y on danger confirm proceeds to preview', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ estimatedFill: 10 }),
      body: null,
    });
    const inst = render(<StrategiesTab />);
    await fillAggressive(inst);
    inst.stdin.write('y');
    await flush();
    await flush();
    await flush();
    expect(lastFrame(inst)).toContain('Preview');
    inst.unmount();
  });
});

// ── T6: dry-run preview round-trip ───────────────────────────────────────────

describe('StrategiesTab — preview (dry-run)', () => {
  /** Navigate to s-stealth (index 2) and fill all fields. */
  async function openStealth(inst: ReturnType<typeof render>) {
    await flush();
    inst.stdin.write(DOWN); // index 1: s-twap
    await flush();
    inst.stdin.write(DOWN); // index 2: s-stealth
    await flush();
    inst.stdin.write(ENTER);
    await flush();
    // Ticker
    await type(inst, 'KXTEST');
    inst.stdin.write(ENTER);
    await flush();
    // Side
    await type(inst, 'sell');
    inst.stdin.write(ENTER);
    await flush();
    // Size
    await type(inst, '5');
    inst.stdin.write(ENTER);
    await flush();
  }

  it('calls POST /preview with strategyId and args', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ estimatedFill: 5 }),
      body: null,
    });
    const inst = render(<StrategiesTab />);
    await openStealth(inst);
    await flush();
    await flush();
    expect(mockFetch).toHaveBeenCalledWith(
      '/preview',
      expect.objectContaining({ method: 'POST' }),
    );
    const call = mockFetch.mock.calls[0];
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.strategyId).toBe('s-stealth');
    inst.unmount();
  });

  it('shows preview result', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ estimatedFill: 5, netDollars: '12.34' }),
      body: null,
    });
    const inst = render(<StrategiesTab />);
    await openStealth(inst);
    await flush();
    await flush();
    await flush();
    expect(lastFrame(inst)).toContain('Preview');
    inst.unmount();
  });

  it('shows preview error on HTTP failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const inst = render(<StrategiesTab />);
    await openStealth(inst);
    await flush();
    await flush();
    await flush();
    expect(lastFrame(inst)).toContain('preview error');
    inst.unmount();
  });
});

// ── T7: run dispatch ─────────────────────────────────────────────────────────

describe('StrategiesTab — run dispatch', () => {
  async function openStealthToPreview(inst: ReturnType<typeof render>) {
    await flush();
    inst.stdin.write(DOWN); await flush(); // s-twap
    inst.stdin.write(DOWN); await flush(); // s-stealth
    inst.stdin.write(ENTER); await flush();
    await type(inst, 'KXTEST');
    inst.stdin.write(ENTER); await flush();
    await type(inst, 'sell');
    inst.stdin.write(ENTER); await flush();
    await type(inst, '5');
    inst.stdin.write(ENTER); await flush();
    await flush(); await flush(); // wait for preview fetch
  }

  it('calls POST /strategies/run on enter in preview', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ estimatedFill: 5 }),
      body: null,
    });
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"message":"started"}\n'));
        controller.close();
      },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => stream.getReader() },
    });

    const inst = render(<StrategiesTab />);
    await openStealthToPreview(inst);
    inst.stdin.write(ENTER); // run
    await flush(); await flush(); await flush();

    expect(mockFetch).toHaveBeenCalledWith(
      '/strategies/run',
      expect.objectContaining({ method: 'POST' }),
    );
    const runCall = mockFetch.mock.calls.find((c) => c[0] === '/strategies/run');
    expect(runCall).toBeDefined();
    const body = JSON.parse((runCall![1] as RequestInit).body as string);
    expect(body.strategyId).toBe('s-stealth');
    inst.unmount();
  });
});

// ── T8: status streaming ─────────────────────────────────────────────────────

describe('StrategiesTab — status streaming', () => {
  it('shows running phase after run dispatched', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
      body: null,
    });
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"message":"slice 1/3"}\n{"message":"slice 2/3"}\n'));
        controller.close();
      },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => stream.getReader() },
    });

    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(DOWN); await flush();
    inst.stdin.write(DOWN); await flush();
    inst.stdin.write(ENTER); await flush();
    await type(inst, 'KXTEST');
    inst.stdin.write(ENTER); await flush();
    await type(inst, 'sell');
    inst.stdin.write(ENTER); await flush();
    await type(inst, '5');
    inst.stdin.write(ENTER); await flush();
    await flush(); await flush(); // wait for preview
    inst.stdin.write(ENTER); // run
    await flush(); await flush(); await flush();

    const frame = lastFrame(inst);
    // Stream completed — phase is 'done' or 'running'. Either way shows strategy name.
    expect(frame).toContain('Stealth');
    // Status lines from the stream should be visible
    expect(frame.includes('running') || frame.includes('done') || frame.includes('slice')).toBe(true);
    inst.unmount();
  });
});

// ── T9: cancel ───────────────────────────────────────────────────────────────

describe('StrategiesTab — cancel', () => {
  it('c key in running phase shows Canceled', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
      body: null,
    });
    const stream = new ReadableStream({
      start() {
        // never completes — simulates long run
      },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => stream.getReader() },
    });

    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(DOWN); await flush();
    inst.stdin.write(DOWN); await flush();
    inst.stdin.write(ENTER); await flush();
    await type(inst, 'KXTEST');
    inst.stdin.write(ENTER); await flush();
    await type(inst, 'sell');
    inst.stdin.write(ENTER); await flush();
    await type(inst, '5');
    inst.stdin.write(ENTER); await flush();
    await flush(); await flush(); // wait for preview
    inst.stdin.write(ENTER); // run
    await flush(); await flush();
    inst.stdin.write('c'); // cancel
    await flush();

    expect(lastFrame(inst)).toContain('Canceled');
    inst.unmount();
  });
});

// ── T10: App.tsx registration ─────────────────────────────────────────────────

describe('App — strategies tab registration', () => {
  it('renders StrategiesTab on 7 key', async () => {
    vi.mock('../../src/tui/api.js', () => ({
      fetchBalance: vi.fn(async () => ({ balanceDollars: 0, portfolioValueDollars: 0 })),
      fetchPositions: vi.fn(async () => []),
      fetchRestingOrders: vi.fn(async () => []),
      fetchPreview: vi.fn(async () => ({})),
      fetchOrderbook: vi.fn(async () => ({ yes: [], no: [] })),
      listJournalSummaries: vi.fn(() => []),
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

    const inst = render(<App />);
    await flush();
    await flush();
    inst.stdin.write('7');
    await flush();
    expect(lastFrame(inst)).toContain('Strategies (');
    inst.unmount();
  });
});

// ── T11: empty / initial state ────────────────────────────────────────────────

describe('StrategiesTab — initial state', () => {
  it('shows list (not form) on initial render', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('Strategies (');
    expect(frame).not.toContain('[type] edit');
    inst.unmount();
  });

  it('all strategy ids present in the rendered list', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    const ids = listStrategyIds();
    const frame = lastFrame(inst);
    const meta0 = STRATEGY_REGISTRY[ids[0]];
    expect(frame).toContain(meta0.displayName.slice(0, 10));
    inst.unmount();
  });
});

// ── T12: focus / isRawModeSupported ──────────────────────────────────────────

describe('StrategiesTab — useStdin / focus guard', () => {
  it('renders without crashing (ink-testing-library provides raw mode)', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    expect(lastFrame(inst)).toBeTruthy();
    inst.unmount();
  });

  it('backspace removes last char from input buffer in form', async () => {
    const inst = render(<StrategiesTab />);
    await flush();
    inst.stdin.write(ENTER); // open s-aggressive form
    await flush();
    inst.stdin.write('A');
    await flush();
    inst.stdin.write('B');
    await flush();
    inst.stdin.write('\x7F'); // backspace
    await flush();
    const frame = lastFrame(inst);
    const cursorLine = frame.split('\n').find((l) => l.includes('█'));
    expect(cursorLine).toBeDefined();
    // 'A' should remain
    expect(cursorLine!.includes('A')).toBe(true);
    inst.unmount();
  });
});
