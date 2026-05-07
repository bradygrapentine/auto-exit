/**
 * Tests for WorkflowEngine — event-driven state machine runner.
 *
 * ≥18 tests as required by the plan §B.1.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkflowEngine } from '../../src/workflows/engine.js';
import { WorkflowJournal } from '../../src/workflows/journal.js';
import type { WorkflowDefinition } from '../../src/workflows/types.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeTmpJournal(): WorkflowJournal {
  const dir = mkdtempSync(join(tmpdir(), 'wf-engine-'));
  return new WorkflowJournal(join(dir, 'workflows.ndjson'));
}

interface EngineSpies {
  registerSyntheticFn: ReturnType<typeof vi.fn>;
  cancelSyntheticFn: ReturnType<typeof vi.fn>;
  runStrategyFn: ReturnType<typeof vi.fn>;
  alertFn: ReturnType<typeof vi.fn>;
  journal: WorkflowJournal;
  engine: WorkflowEngine;
}

function makeEngine(journalOverride?: WorkflowJournal): EngineSpies {
  const journal = journalOverride ?? makeTmpJournal();
  let synCounter = 0;
  const registerSyntheticFn = vi.fn(async (_syn: unknown) => `syn-${++synCounter}`);
  const cancelSyntheticFn = vi.fn(async (_id: string) => {});
  const runStrategyFn = vi.fn(async (_s: string, _p: Record<string, unknown>) => {});
  const alertFn = vi.fn(async (_ch: string, _msg: string) => {});
  const engine = new WorkflowEngine({
    journal,
    registerSyntheticFn,
    cancelSyntheticFn,
    runStrategyFn,
    alertFn,
  });
  return { registerSyntheticFn, cancelSyntheticFn, runStrategyFn, alertFn, journal, engine };
}

/** Minimal valid 2-state workflow: IDLE → DONE on fill_received */
function simpleDef(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    id: 'test-wf',
    version: 1,
    initialState: 'IDLE',
    states: [
      {
        name: 'IDLE',
        transitions: [{ on: { kind: 'fill_received' }, actions: [], next: 'DONE' }],
      },
      {
        name: 'DONE',
        transitions: [],
      },
    ],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('WorkflowEngine', () => {
  // Test 1: register validates def via Phase A — invalid throws
  it('register throws on invalid workflow definition', () => {
    const { engine } = makeEngine();
    expect(() =>
      engine.register({ id: '', version: 1, initialState: 'X', states: [] } as unknown as WorkflowDefinition),
    ).toThrow();
  });

  // Test 2: register persists workflow_started and seeds in-memory instance
  it('register persists workflow_started and seeds in-memory instance', () => {
    const { engine, journal } = makeEngine();
    const { instanceId } = engine.register(simpleDef());
    expect(instanceId).toBeTruthy();
    const instances = engine.list();
    expect(instances).toHaveLength(1);
    expect(instances[0].instanceId).toBe(instanceId);
    expect(instances[0].status).toBe('active');
    expect(instances[0].currentState).toBe('IDLE');
    const entries = journal.readAll();
    expect(entries.some((e) => e.kind === 'workflow_started')).toBe(true);
  });

  // Test 3: handleEvent matching transition advances state
  it('handleEvent: matching transition advances currentState', async () => {
    const { engine } = makeEngine();
    const { instanceId } = engine.register(simpleDef());
    await engine.handleEvent({ kind: 'fill_received' });
    const inst = engine.get(instanceId)!;
    expect(inst.currentState).toBe('DONE');
    expect(inst.transitionCount).toBe(1);
  });

  // Test 4: handleEvent non-matching event is ignored
  it('handleEvent: non-matching event is ignored', async () => {
    const { engine } = makeEngine();
    const { instanceId } = engine.register(simpleDef());
    await engine.handleEvent({ kind: 'synthetic_fired', syntheticId: 'x' });
    const inst = engine.get(instanceId)!;
    expect(inst.currentState).toBe('IDLE');
    expect(inst.transitionCount).toBe(0);
  });

  // Test 5: first-match-wins ordering when multiple transitions declared
  it('first-match-wins: first matching transition takes priority', async () => {
    const { engine } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'fmw-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            { on: { kind: 'fill_received' }, actions: [], next: 'STATE_A' },
            { on: { kind: 'fill_received' }, actions: [], next: 'STATE_B' },
          ],
        },
        { name: 'STATE_A', transitions: [] },
        { name: 'STATE_B', transitions: [] },
      ],
    };
    const { instanceId } = engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' });
    expect(engine.get(instanceId)?.currentState).toBe('STATE_A');
  });

  // Test 6: onEntry actions run after transition to new state
  it('onEntry actions run after transition into new state', async () => {
    const { engine, alertFn } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'entry-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [{ on: { kind: 'fill_received' }, actions: [], next: 'ARMED' }],
        },
        {
          name: 'ARMED',
          onEntry: [{ type: 'alert', channel: 'log', message: 'entered ARMED' }],
          transitions: [],
        },
      ],
    };
    engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' });
    expect(alertFn).toHaveBeenCalledWith('log', 'entered ARMED');
  });

  // Test 7: register_synthetic action calls injected fn with synth config
  it('register_synthetic action calls registerSyntheticFn', async () => {
    const { engine, registerSyntheticFn } = makeEngine();
    const synConfig = { kind: 'stop_loss', ticker: 'KX-1' };
    const def: WorkflowDefinition = {
      id: 'reg-syn-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            {
              on: { kind: 'fill_received' },
              actions: [{ type: 'register_synthetic', synthetic: synConfig }],
              next: 'DONE',
            },
          ],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' });
    expect(registerSyntheticFn).toHaveBeenCalledWith(synConfig);
  });

  // Test 8: cancel_synthetic with {ref:'last_registered'} resolves to last register's id
  it('cancel_synthetic last_registered resolves to most-recent register id', async () => {
    const { engine, cancelSyntheticFn } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'cancel-last-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            {
              on: { kind: 'fill_received' },
              actions: [
                { type: 'register_synthetic', synthetic: { kind: 'stop_loss' } },
              ],
              next: 'ARMED',
            },
          ],
        },
        {
          name: 'ARMED',
          transitions: [
            {
              on: { kind: 'synthetic_canceled' },
              actions: [{ type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } }],
              next: 'DONE',
            },
          ],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' });
    await engine.handleEvent({ kind: 'synthetic_canceled' });
    expect(cancelSyntheticFn).toHaveBeenCalledWith('syn-1');
  });

  // Test 9: run_strategy action calls injected fn
  it('run_strategy action calls runStrategyFn with strategy name + params', async () => {
    const { engine, runStrategyFn } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'run-strat-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            {
              on: { kind: 'fill_received' },
              actions: [{ type: 'run_strategy', strategy: 's1_passive', params: { size: 10 } }],
              next: 'DONE',
            },
          ],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' });
    expect(runStrategyFn).toHaveBeenCalledWith('s1_passive', { size: 10 });
  });

  // Test 10: alert action calls injected alertFn with channel + message
  it('alert action calls alertFn with channel and message', async () => {
    const { engine, alertFn } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'alert-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            {
              on: { kind: 'fill_received' },
              actions: [{ type: 'alert', channel: 'mcp', message: 'fill detected' }],
              next: 'DONE',
            },
          ],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' });
    expect(alertFn).toHaveBeenCalledWith('mcp', 'fill detected');
  });

  // Test 11: set_var action mutates instance.vars
  it('set_var action mutates instance vars', async () => {
    const { engine } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'setvar-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            {
              on: { kind: 'fill_received' },
              actions: [{ type: 'set_var', key: 'fillPrice', value: 55 }],
              next: 'DONE',
            },
          ],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    const { instanceId } = engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' });
    expect(engine.get(instanceId)?.vars['fillPrice']).toBe(55);
  });

  // Test 12: predicate guard blocks transition when false
  it('predicate guard blocks transition when guard evaluates false', async () => {
    const { engine } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'guard-block-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            {
              on: { kind: 'fill_received' },
              guard: { field: 'event.side', op: 'eq', value: 'yes' },
              actions: [],
              next: 'DONE',
            },
          ],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    const { instanceId } = engine.register(def);
    await engine.handleEvent({ kind: 'fill_received', side: 'no' });
    expect(engine.get(instanceId)?.currentState).toBe('IDLE'); // blocked
  });

  // Test 13: predicate guard allows transition when true
  it('predicate guard allows transition when guard evaluates true', async () => {
    const { engine } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'guard-allow-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            {
              on: { kind: 'fill_received' },
              guard: { field: 'event.side', op: 'eq', value: 'yes' },
              actions: [],
              next: 'DONE',
            },
          ],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    const { instanceId } = engine.register(def);
    await engine.handleEvent({ kind: 'fill_received', side: 'yes' });
    expect(engine.get(instanceId)?.currentState).toBe('DONE');
  });

  // Test 14: transitionCount enforced — exceeds max → halt + workflow_halted_runaway
  it('transitionCount cap: exceeding maxTransitions halts instance with workflow_halted_runaway', async () => {
    const { engine, journal } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'runaway-test',
      version: 1,
      maxTransitions: 2,
      initialState: 'A',
      states: [
        {
          name: 'A',
          transitions: [{ on: { kind: 'fill_received' }, actions: [], next: 'B' }],
        },
        {
          name: 'B',
          transitions: [{ on: { kind: 'fill_received' }, actions: [], next: 'A' }],
        },
      ],
    };
    const { instanceId } = engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' }); // A→B, count=1
    await engine.handleEvent({ kind: 'fill_received' }); // B→A, count=2
    // 3rd event: count is at cap, should halt
    await engine.handleEvent({ kind: 'fill_received' });
    const inst = engine.get(instanceId)!;
    expect(inst.status).toBe('halted');
    expect(inst.haltReason).toMatch(/runaway/);
    const entries = journal.readAll();
    expect(entries.some((e) => e.kind === 'workflow_halted_runaway')).toBe(true);
  });

  // Test 15: TERMINAL state stops further transitions; instance.status='terminal'
  it('TERMINAL next: instance reaches terminal status and stops transitions', async () => {
    const { engine } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'terminal-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [{ on: { kind: 'fill_received' }, actions: [], next: 'TERMINAL' }],
        },
      ],
    };
    const { instanceId } = engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' });
    const inst = engine.get(instanceId)!;
    expect(inst.status).toBe('terminal');
    // Further events are no-ops
    await engine.handleEvent({ kind: 'fill_received' });
    expect(engine.get(instanceId)?.transitionCount).toBe(1);
  });

  // Test 16: cancel() marks halted + journals workflow_canceled
  it('cancel() marks instance halted and journals workflow_canceled', () => {
    const { engine, journal } = makeEngine();
    const { instanceId } = engine.register(simpleDef());
    engine.cancel(instanceId);
    const inst = engine.get(instanceId)!;
    expect(inst.status).toBe('halted');
    expect(inst.haltReason).toBe('canceled');
    const entries = journal.readAll();
    expect(entries.some((e) => e.kind === 'workflow_canceled')).toBe(true);
  });

  // Test 17: Idle-when-empty: handleEvent with no instances is fast no-op
  it('idle-when-empty: handleEvent returns immediately when no active instances', async () => {
    const { engine, registerSyntheticFn } = makeEngine();
    // No instances registered
    const start = Date.now();
    await engine.handleEvent({ kind: 'fill_received' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
    expect(registerSyntheticFn).not.toHaveBeenCalled();
  });

  // Test 18: replayFromJournal reconstructs active instances + currentState + vars
  it('replayFromJournal reconstructs active instances after engine writes journal', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'wf-replay-'));
    const journalPath = join(dir, 'workflows.ndjson');
    const journal = new WorkflowJournal(journalPath);
    const { engine } = makeEngine(journal);

    const def: WorkflowDefinition = {
      id: 'replay-test',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            {
              on: { kind: 'fill_received' },
              actions: [{ type: 'set_var', key: 'ticker', value: 'KX-1' }],
              next: 'ARMED',
            },
          ],
        },
        { name: 'ARMED', transitions: [] },
      ],
    };
    const { instanceId } = engine.register(def);
    await engine.handleEvent({ kind: 'fill_received' });

    // Replay via the journal
    const map = journal.replayFromJournal(journalPath);
    expect(map.size).toBe(1);
    const replayed = map.get(instanceId)!;
    expect(replayed).toBeDefined();
    expect(replayed.currentState).toBe('ARMED');
    expect(replayed.status).toBe('active');
    expect(replayed.transitionCount).toBe(1);
  });

  // Test 19: list() returns all instances
  it('list() returns all registered instances', () => {
    const { engine } = makeEngine();
    engine.register(simpleDef({ id: 'wf-a' }));
    engine.register(simpleDef({ id: 'wf-b' }));
    expect(engine.list()).toHaveLength(2);
  });

  // Test 20: get() returns undefined for unknown instanceId
  it('get() returns undefined for unknown instanceId', () => {
    const { engine } = makeEngine();
    expect(engine.get('nonexistent')).toBeUndefined();
  });

  // Test 21: cancel() on unknown instanceId is a no-op (no throw)
  it('cancel() on unknown instanceId does not throw', () => {
    const { engine } = makeEngine();
    expect(() => engine.cancel('no-such-id')).not.toThrow();
  });

  // Test 22: cancel_synthetic with unknown ref journals failure
  it('cancel_synthetic with no last_registered journals action_failed without throwing', async () => {
    const { engine, journal } = makeEngine();
    const def: WorkflowDefinition = {
      id: 'cancel-no-last',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [
            {
              on: { kind: 'fill_received' },
              actions: [{ type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } }],
              next: 'DONE',
            },
          ],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    engine.register(def);
    // Should not throw even though no synthetic was registered first
    await expect(engine.handleEvent({ kind: 'fill_received' })).resolves.toBeUndefined();
    const entries = journal.readAll();
    expect(entries.some((e) => e.kind === 'workflow_action_failed')).toBe(true);
  });

  // Test 23: multiple instances process events independently
  it('multiple instances each process events independently', async () => {
    const { engine } = makeEngine();
    const defA: WorkflowDefinition = {
      id: 'wf-multi-a',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [{ on: { kind: 'fill_received', ticker: 'A-1' }, actions: [], next: 'DONE' }],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    const defB: WorkflowDefinition = {
      id: 'wf-multi-b',
      version: 1,
      initialState: 'IDLE',
      states: [
        {
          name: 'IDLE',
          transitions: [{ on: { kind: 'fill_received', ticker: 'B-1' }, actions: [], next: 'DONE' }],
        },
        { name: 'DONE', transitions: [] },
      ],
    };
    const { instanceId: idA } = engine.register(defA);
    const { instanceId: idB } = engine.register(defB);
    await engine.handleEvent({ kind: 'fill_received', ticker: 'A-1' });
    expect(engine.get(idA)?.currentState).toBe('DONE');
    expect(engine.get(idB)?.currentState).toBe('IDLE'); // not matched
  });
});
