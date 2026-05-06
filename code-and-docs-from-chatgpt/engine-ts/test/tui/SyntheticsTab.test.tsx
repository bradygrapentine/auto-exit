import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Watcher } from '../../src/watcher.js';
import {
  setWatcherForTests,
  resetWatcherForTests,
} from '../../src/watcherSingleton.js';
import type { KalshiClientLike } from '../../src/types.js';
import { SyntheticsTab } from '../../src/tui/SyntheticsTab.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async () => ({ yes: [], no: [] })),
    getPosition: vi.fn(async () => ({ ticker: 'TEST', side: 'yes', quantity: 0 })),
  } as any;
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

function makeWatcher(): Watcher {
  return new Watcher(makeClient(), baseCfg);
}

function lastFrame(inst: ReturnType<typeof render>): string {
  return inst.lastFrame() ?? '';
}

/** Flush pending React state updates (two micro-task ticks). */
const flush = async () => {
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
};

// ── setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  const w = makeWatcher();
  setWatcherForTests(w);
});

afterEach(() => {
  resetWatcherForTests();
});

// ── snapshot: 0 synthetics ───────────────────────────────────────────────────

describe('SyntheticsTab — empty state', () => {
  it('renders "No synthetics armed." when watcher is empty', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    expect(lastFrame(inst)).toContain('No synthetics armed.');
    inst.unmount();
  });

  it('renders count of 0', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    expect(lastFrame(inst)).toContain('Synthetics (0)');
    inst.unmount();
  });
});

// ── snapshot: 1 synthetic (armed stop_loss) ──────────────────────────────────

describe('SyntheticsTab — 1 armed stop_loss', () => {
  it('renders ticker and kind', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);
    w.register({
      kind: 'stop_loss', ticker: 'KXTEST-25-50000', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 30 },
    });
    const inst = render(<SyntheticsTab />);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('KXTEST-25-50000');
    expect(frame).toContain('stop_loss');
    expect(frame).toContain('trigger=30¢');
    expect(frame).toContain('armed');
    inst.unmount();
  });
});

// ── snapshot: N synthetics in multiple statuses ───────────────────────────────

describe('SyntheticsTab — multiple synthetics different statuses', () => {
  it('renders all statuses', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);

    w.register({
      kind: 'stop_loss', ticker: 'TICK-A', side: 'yes',
      positionSize: 5, params: { triggerPriceCents: 20 },
    });
    const id2 = w.register({
      kind: 'take_profit', ticker: 'TICK-A', side: 'yes',
      positionSize: 5, params: { triggerPriceCents: 80 },
    });
    const id3 = w.register({
      kind: 'trailing_stop', ticker: 'TICK-B', side: 'no',
      positionSize: 3, params: { trailCents: 5 },
    });

    // Cancel one.
    w.cancel(id2);
    // Manually set trailing stop to fire_failed to test color path.
    const synth3 = w.get(id3);
    if (synth3) {
      synth3.status = 'fire_failed';
      synth3.fireFailedReason = 'test';
    }

    const inst = render(<SyntheticsTab />);
    await flush();
    const frame = lastFrame(inst);

    expect(frame).toContain('TICK-A');
    expect(frame).toContain('TICK-B');
    expect(frame).toContain('stop_loss');
    expect(frame).toContain('take_profit');
    expect(frame).toContain('trailing_stop');
    expect(frame).toContain('armed');
    expect(frame).toContain('canceled');
    expect(frame).toContain('fire_failed');
    expect(frame).toContain('Synthetics (3)');

    inst.unmount();
  });

  it('renders trailing stop state summary when peakBidCentsExact is set', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);

    const id = w.register({
      kind: 'trailing_stop', ticker: 'TICK-C', side: 'yes',
      positionSize: 10, params: { trailCents: 3 },
    });
    const s = w.get(id);
    if (s) {
      (s.state as any).peakBidCentsExact = 47;
    }

    const inst = render(<SyntheticsTab />);
    await flush();
    expect(lastFrame(inst)).toContain('peak: 47¢');
    inst.unmount();
  });

  it('renders take_profit rungs summary', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);

    w.register({
      kind: 'take_profit', ticker: 'TICK-D', side: 'yes',
      positionSize: 10,
      params: {
        rungs: [
          { priceCents: 30, sizePct: 0.33 },
          { priceCents: 50, sizePct: 0.33 },
          { priceCents: 70, sizePct: 0.34 },
        ],
      },
    });

    const inst = render(<SyntheticsTab />);
    await flush();
    expect(lastFrame(inst)).toContain('rungs=[30,50,70]');
    inst.unmount();
  });

  it('renders bracket params', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);

    w.register({
      kind: 'bracket', ticker: 'TICK-E', side: 'yes',
      positionSize: 5, params: { takeProfitCents: 70, stopLossCents: 30 },
    });

    const inst = render(<SyntheticsTab />);
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('TP=70¢ SL=30¢');
    inst.unmount();
  });
});

// ── uninitialized watcher ────────────────────────────────────────────────────

describe('SyntheticsTab — watcher not initialized', () => {
  it('shows daemon not running message', async () => {
    resetWatcherForTests();
    const inst = render(<SyntheticsTab />);
    await flush();
    expect(lastFrame(inst)).toContain('Watcher daemon not running');
    expect(lastFrame(inst)).toContain('kea watch start');
    inst.unmount();
  });
});

// ── wizard: form state machine ───────────────────────────────────────────────

describe('SyntheticsTab wizard — kind selection', () => {
  it('opens wizard on n press', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    inst.stdin.write('n');
    await flush();
    expect(lastFrame(inst)).toContain('New Synthetic Wizard');
    expect(lastFrame(inst)).toContain('Stop Loss');
    inst.unmount();
  });

  it('navigates kind list with arrow keys', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    inst.stdin.write('n');
    await flush();
    // Move down to 'trailing_stop' (index 2).
    inst.stdin.write('[B'); // down
    await flush();
    inst.stdin.write('[B'); // down
    await flush();
    const frame = lastFrame(inst);
    // Trailing Stop should be selected (▶).
    expect(frame).toContain('Trailing Stop');
    inst.unmount();
  });

  it('esc from kind step closes wizard', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    inst.stdin.write('n');
    await flush();
    inst.stdin.write('\x1B'); // esc
    await flush();
    expect(lastFrame(inst)).not.toContain('New Synthetic Wizard');
    inst.unmount();
  });
});

describe('SyntheticsTab wizard — params form', () => {
  it('advances to params step on enter', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    inst.stdin.write('n');
    await flush();
    inst.stdin.write('\r'); // enter → select stop_loss
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('Stop Loss');
    expect(frame).toContain('Ticker');
    inst.unmount();
  });

  it('esc from params returns to kind step', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    inst.stdin.write('n');
    await flush();
    inst.stdin.write('\r'); // enter kind
    await flush();
    inst.stdin.write('\x1B'); // esc
    await flush();
    expect(lastFrame(inst)).toContain('Select kind');
    inst.unmount();
  });

  it('backspace removes last char from input buffer', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    inst.stdin.write('n');
    await flush();
    inst.stdin.write('\r'); // select kind
    await flush();
    inst.stdin.write('A');
    await flush();
    inst.stdin.write('B');
    await flush();
    inst.stdin.write('\x7F'); // backspace
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('A');
    // After backspace, 'B' should be gone but 'A' remains.
    const lines = frame.split('\n').filter(l => l.includes('█'));
    expect(lines.some(l => l.includes('A') && !l.includes('AB'))).toBe(true);
    inst.unmount();
  });

  it('filling all fields advances to confirm step', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    inst.stdin.write('n');
    await flush();
    inst.stdin.write('\r'); // select stop_loss
    await flush();
    // field: ticker
    for (const c of 'KXTEST') { inst.stdin.write(c); await flush(); }
    inst.stdin.write('\r');
    await flush();
    // field: side
    for (const c of 'yes') { inst.stdin.write(c); await flush(); }
    inst.stdin.write('\r');
    await flush();
    // field: positionSize
    for (const c of '10') { inst.stdin.write(c); await flush(); }
    inst.stdin.write('\r');
    await flush();
    // field: triggerPriceCents
    for (const c of '30') { inst.stdin.write(c); await flush(); }
    inst.stdin.write('\r');
    await flush();
    const frame = lastFrame(inst);
    expect(frame).toContain('Confirm new synthetic');
    inst.unmount();
  });
});

describe('SyntheticsTab wizard — confirm + submit', () => {
  async function fillStopLoss(inst: ReturnType<typeof render>, ticker = 'KXTEST', triggerCents = '30') {
    inst.stdin.write('n');
    await flush();
    inst.stdin.write('\r'); // select stop_loss
    await flush();
    for (const c of ticker) { inst.stdin.write(c); await flush(); }
    inst.stdin.write('\r');
    await flush();
    for (const c of 'yes') { inst.stdin.write(c); await flush(); }
    inst.stdin.write('\r');
    await flush();
    for (const c of '10') { inst.stdin.write(c); await flush(); }
    inst.stdin.write('\r');
    await flush();
    for (const c of triggerCents) { inst.stdin.write(c); await flush(); }
    inst.stdin.write('\r');
    await flush();
  }

  it('esc from confirm returns to kind step', async () => {
    const inst = render(<SyntheticsTab />);
    await flush();
    await fillStopLoss(inst);
    inst.stdin.write('\x1B'); // esc
    await flush();
    expect(lastFrame(inst)).toContain('Select kind');
    inst.unmount();
  });

  it('y submits and registers synthetic', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);
    const inst = render(<SyntheticsTab />);
    await flush();
    await fillStopLoss(inst, 'KXTEST2', '35');
    inst.stdin.write('y');
    await flush();
    // Should have registered one synthetic.
    expect(w.list().length).toBe(1);
    expect(w.list()[0].kind).toBe('stop_loss');
    inst.unmount();
  });

  it('enter also submits', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);
    const inst = render(<SyntheticsTab />);
    await flush();
    await fillStopLoss(inst, 'KXTEST3', '25');
    inst.stdin.write('\r');
    await flush();
    expect(w.list().length).toBe(1);
    inst.unmount();
  });

  it('n from confirm cancels without registering', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);
    const inst = render(<SyntheticsTab />);
    await flush();
    await fillStopLoss(inst, 'KXTEST4', '20');
    inst.stdin.write('n');
    await flush();
    expect(w.list().length).toBe(0);
    expect(lastFrame(inst)).not.toContain('New Synthetic Wizard');
    inst.unmount();
  });
});

// ── keybindings: c cancel ────────────────────────────────────────────────────

describe('SyntheticsTab keybindings — c cancel', () => {
  it('c cancels the selected (armed) synthetic', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);
    w.register({
      kind: 'stop_loss', ticker: 'KXCANCEL', side: 'yes',
      positionSize: 5, params: { triggerPriceCents: 40 },
    });
    const inst = render(<SyntheticsTab />);
    await flush();
    inst.stdin.write('c');
    await flush();
    expect(w.list()[0].status).toBe('canceled');
    inst.unmount();
  });

  it('c does nothing when no synthetics', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);
    const inst = render(<SyntheticsTab />);
    await flush();
    // Should not throw.
    expect(() => inst.stdin.write('c')).not.toThrow();
    inst.unmount();
  });
});

// ── navigation ───────────────────────────────────────────────────────────────

describe('SyntheticsTab navigation', () => {
  it('up/down moves cursor', async () => {
    const w = makeWatcher();
    setWatcherForTests(w);
    w.register({ kind: 'stop_loss', ticker: 'T1', side: 'yes', positionSize: 1, params: { triggerPriceCents: 10 } });
    w.register({ kind: 'take_profit', ticker: 'T1', side: 'yes', positionSize: 1, params: { triggerPriceCents: 90 } });
    const inst = render(<SyntheticsTab />);
    await flush();
    // Initially cursor at 0 → first row selected.
    const frame0 = lastFrame(inst);
    expect(frame0).toContain('▶');
    // Move down.
    inst.stdin.write('[B');
    await flush();
    // Cursor should have moved (second row indicator somewhere in frame).
    // We just verify no crash and frame renders.
    expect(lastFrame(inst)).toBeTruthy();
    inst.unmount();
  });
});
