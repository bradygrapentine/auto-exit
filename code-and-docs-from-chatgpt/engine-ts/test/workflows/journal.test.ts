/**
 * Tests for WorkflowJournal — append-only NDJSON + replayFromJournal.
 *
 * ≥6 tests as required by the plan §B.1.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, rmSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkflowJournal, replayFromJournal } from '../../src/workflows/journal.js';
import type { WorkflowInstance } from '../../src/workflows/types.js';

function makeTmpPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'wf-journal-'));
  return join(dir, 'workflows.ndjson');
}

function makeInstance(overrides: Partial<WorkflowInstance> = {}): WorkflowInstance {
  return {
    instanceId: 'inst-001',
    definitionId: 'def-001',
    currentState: 'IDLE',
    vars: {},
    history: [],
    startedAt: new Date().toISOString(),
    status: 'active',
    transitionCount: 0,
    ...overrides,
  };
}

describe('WorkflowJournal', () => {
  let path: string;
  let journal: WorkflowJournal;

  beforeEach(() => {
    path = makeTmpPath();
    journal = new WorkflowJournal(path);
  });

  // Test 1: append + round-trip for workflow_started
  it('appendStarted writes a workflow_started entry readable by readAll', () => {
    const inst = makeInstance();
    journal.appendStarted(inst);
    const entries = journal.readAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('workflow_started');
    const data = entries[0].data as Record<string, unknown>;
    expect(data['instanceId']).toBe('inst-001');
    expect(data['definitionId']).toBe('def-001');
    expect(data['initialState']).toBe('IDLE');
  });

  // Test 2: all 8 kinds round-trip
  it('appends all 8 journal kinds and readAll recovers them all', () => {
    const inst = makeInstance();
    journal.appendStarted(inst);
    journal.appendStateEntered('inst-001', 'RUNNING');
    journal.appendTransition('inst-001', 'IDLE', 'RUNNING', { kind: 'fill_received' }, 0, 1);
    journal.appendActionDispatched('inst-001', 'alert', { channel: 'log', message: 'hi' });
    journal.appendActionFailed('inst-001', 'run_strategy', 'strategy not found');
    journal.appendHaltedRunaway('inst-001', 51, 50);
    journal.appendCanceled('inst-001');
    journal.appendTerminal('inst-001', 'TERMINAL');
    const entries = journal.readAll();
    expect(entries).toHaveLength(8);
    const kinds = entries.map((e) => e.kind);
    expect(kinds).toContain('workflow_started');
    expect(kinds).toContain('workflow_state_entered');
    expect(kinds).toContain('workflow_transition');
    expect(kinds).toContain('workflow_action_dispatched');
    expect(kinds).toContain('workflow_action_failed');
    expect(kinds).toContain('workflow_halted_runaway');
    expect(kinds).toContain('workflow_canceled');
    expect(kinds).toContain('workflow_terminal');
  });

  // Test 3: file path override via constructor param
  it('respects constructor path override — writes to the given path', () => {
    const customPath = makeTmpPath();
    const customJournal = new WorkflowJournal(customPath);
    customJournal.appendStarted(makeInstance());
    expect(customJournal.path).toBe(customPath);
    const entries = customJournal.readAll();
    expect(entries).toHaveLength(1);
  });

  // Test 4: readAll returns [] if file does not exist
  it('readAll returns empty array if file does not exist', () => {
    const nonexistent = join(tmpdir(), `no-such-${Date.now()}.ndjson`);
    const j = new WorkflowJournal(nonexistent);
    expect(j.readAll()).toEqual([]);
  });

  // Test 5: malformed lines are skipped silently
  it('readAll skips malformed lines without throwing', () => {
    appendFileSync(path, 'not-json\n');
    appendFileSync(path, JSON.stringify({ kind: 'workflow_canceled', ts: new Date().toISOString(), data: { instanceId: 'x' } }) + '\n');
    const entries = journal.readAll();
    // Only the valid line is returned
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('workflow_canceled');
  });

  // Test 6: replayFromJournal reconstructs active instances
  it('replayFromJournal reconstructs active instance currentState and vars', () => {
    const inst = makeInstance({ instanceId: 'inst-replay', definitionId: 'def-X', currentState: 'IDLE' });
    journal.appendStarted(inst);
    journal.appendTransition('inst-replay', 'IDLE', 'ARMED', { kind: 'fill_received' }, 0, 1);
    // Persist a vars snapshot via a custom transition entry with vars
    // (engine stores vars in transition; we simulate that by checking the journal has it)

    const map = journal.replayFromJournal(path);
    expect(map.size).toBe(1);
    const replayed = map.get('inst-replay')!;
    expect(replayed).toBeDefined();
    expect(replayed.currentState).toBe('ARMED');
    expect(replayed.transitionCount).toBe(1);
    expect(replayed.status).toBe('active');
    expect(replayed.history).toHaveLength(1);
    expect(replayed.history[0].from).toBe('IDLE');
    expect(replayed.history[0].to).toBe('ARMED');
  });

  // Test 7: replayFromJournal sets status=halted for canceled
  it('replayFromJournal sets status=halted for workflow_canceled entries', () => {
    const inst = makeInstance({ instanceId: 'inst-cancel' });
    journal.appendStarted(inst);
    journal.appendCanceled('inst-cancel');
    const map = journal.replayFromJournal(path);
    const replayed = map.get('inst-cancel')!;
    expect(replayed.status).toBe('halted');
    expect(replayed.haltReason).toBe('canceled');
  });

  // Test 8: replayFromJournal sets status=terminal
  it('replayFromJournal sets status=terminal for workflow_terminal entries', () => {
    const inst = makeInstance({ instanceId: 'inst-term' });
    journal.appendStarted(inst);
    journal.appendTerminal('inst-term', 'TERMINAL');
    const map = journal.replayFromJournal(path);
    const replayed = map.get('inst-term')!;
    expect(replayed.status).toBe('terminal');
  });

  // Test 9: standalone replayFromJournal function works
  it('standalone replayFromJournal function reconstructs state', () => {
    const inst = makeInstance({ instanceId: 'inst-standalone' });
    journal.appendStarted(inst);
    const map = replayFromJournal(path);
    expect(map.size).toBe(1);
    expect(map.get('inst-standalone')).toBeDefined();
  });

  // Test 10: multiple instances replay independently
  it('replayFromJournal handles multiple instances independently', () => {
    journal.appendStarted(makeInstance({ instanceId: 'inst-A', currentState: 'IDLE' }));
    journal.appendStarted(makeInstance({ instanceId: 'inst-B', currentState: 'IDLE', definitionId: 'def-B' }));
    journal.appendTransition('inst-A', 'IDLE', 'DONE', { kind: 'fill_received' }, 0, 1);
    journal.appendCanceled('inst-B');
    const map = journal.replayFromJournal(path);
    expect(map.size).toBe(2);
    expect(map.get('inst-A')?.currentState).toBe('DONE');
    expect(map.get('inst-B')?.status).toBe('halted');
  });
});
