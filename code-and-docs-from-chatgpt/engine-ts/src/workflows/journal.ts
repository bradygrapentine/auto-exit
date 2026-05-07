/**
 * WorkflowJournal — append-only NDJSON log for workflow lifecycle events.
 *
 * Default path: ~/.kalshi-exit-assistant/workflows.ndjson
 * Override via KEA_HOME env var or explicit constructor param.
 *
 * Journal kinds are cast via jk() so this file does NOT need to modify
 * the shared types.ts JournalKind union.
 *
 * Malformed lines are skipped silently on replay (crash-safe).
 *
 * See spec: docs/superpowers/specs/2026-05-05-strategy-composition.md §4.
 */
import { appendFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { WorkflowInstance, EventMatcher } from './types.js';

// ── Journal entry types ───────────────────────────────────────────────────────

export type WorkflowJournalKind =
  | 'workflow_started'
  | 'workflow_state_entered'
  | 'workflow_transition'
  | 'workflow_action_dispatched'
  | 'workflow_action_failed'
  | 'workflow_halted_runaway'
  | 'workflow_canceled'
  | 'workflow_terminal';

export interface WorkflowJournalEntry {
  ts: string;
  kind: WorkflowJournalKind;
  data: unknown;
}

// ── Replay-facing subset of WorkflowInstance ─────────────────────────────────

export interface ReplayInstance {
  instanceId: string;
  definitionId: string;
  currentState: string;
  vars: Record<string, unknown>;
  history: WorkflowInstance['history'];
  startedAt: string;
  status: WorkflowInstance['status'];
  haltReason?: string;
  transitionCount: number;
}

// ── Path helper ───────────────────────────────────────────────────────────────

function defaultPath(): string {
  const home = process.env['KEA_HOME'] ?? join(homedir(), '.kalshi-exit-assistant');
  return join(home, 'workflows.ndjson');
}

// ── WorkflowJournal class ─────────────────────────────────────────────────────

export class WorkflowJournal {
  private readonly filePath: string;

  constructor(pathOverride?: string) {
    this.filePath = pathOverride ?? defaultPath();
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  /** Absolute path to the NDJSON file (useful for tests / inspection). */
  get path(): string {
    return this.filePath;
  }

  private write(entry: WorkflowJournalEntry): void {
    appendFileSync(this.filePath, JSON.stringify(entry) + '\n', { mode: 0o600, encoding: 'utf8' });
  }

  appendStarted(instance: WorkflowInstance): void {
    this.write({
      ts: new Date().toISOString(),
      kind: 'workflow_started',
      data: {
        instanceId: instance.instanceId,
        definitionId: instance.definitionId,
        initialState: instance.currentState,
        startedAt: instance.startedAt,
        vars: instance.vars,
      },
    });
  }

  appendStateEntered(instanceId: string, stateName: string): void {
    this.write({
      ts: new Date().toISOString(),
      kind: 'workflow_state_entered',
      data: { instanceId, stateName },
    });
  }

  appendTransition(
    instanceId: string,
    from: string,
    to: string,
    on: EventMatcher,
    transitionIndex: number,
    transitionCount: number,
  ): void {
    this.write({
      ts: new Date().toISOString(),
      kind: 'workflow_transition',
      data: { instanceId, from, to, on, transitionIndex, transitionCount },
    });
  }

  appendActionDispatched(instanceId: string, actionType: string, outcome: unknown): void {
    this.write({
      ts: new Date().toISOString(),
      kind: 'workflow_action_dispatched',
      data: { instanceId, actionType, outcome },
    });
  }

  appendActionFailed(instanceId: string, actionType: string, reason: string): void {
    this.write({
      ts: new Date().toISOString(),
      kind: 'workflow_action_failed',
      data: { instanceId, actionType, reason },
    });
  }

  appendHaltedRunaway(instanceId: string, transitionCount: number, maxTransitions: number): void {
    this.write({
      ts: new Date().toISOString(),
      kind: 'workflow_halted_runaway',
      data: { instanceId, transitionCount, maxTransitions },
    });
  }

  appendCanceled(instanceId: string): void {
    this.write({
      ts: new Date().toISOString(),
      kind: 'workflow_canceled',
      data: { instanceId },
    });
  }

  appendTerminal(instanceId: string, finalState: string): void {
    this.write({
      ts: new Date().toISOString(),
      kind: 'workflow_terminal',
      data: { instanceId, finalState },
    });
  }

  /**
   * Read all raw entries from the NDJSON file.
   * Malformed lines are skipped silently.
   */
  readAll(): WorkflowJournalEntry[] {
    if (!existsSync(this.filePath)) return [];
    const raw = readFileSync(this.filePath, 'utf-8');
    const result: WorkflowJournalEntry[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line) as WorkflowJournalEntry;
        if (e && typeof e === 'object' && 'kind' in e) result.push(e);
      } catch {
        // malformed — skip silently
      }
    }
    return result;
  }

  /**
   * Reconstruct in-memory WorkflowInstance map from journal for resume.
   *
   * Replay semantics:
   * - workflow_started seeds the instance
   * - workflow_transition advances currentState + increments transitionCount
   * - workflow_action_dispatched / workflow_state_entered — informational only
   * - workflow_halted_runaway sets status='halted' + haltReason
   * - workflow_canceled sets status='halted' + haltReason='canceled'
   * - workflow_terminal sets status='terminal'
   * - set_var actions are re-applied via vars snapshot stored in transition data
   *
   * NOTE: vars mutations from set_var are NOT replayed from action entries
   * because those are informational. Instead, the engine should persist vars
   * in workflow_transition data. This replay uses the vars stored in
   * workflow_transition entries (if present) or falls back to the initial vars.
   */
  replayFromJournal(filePath?: string): Map<string, WorkflowInstance> {
    const path = filePath ?? this.filePath;
    const instances = new Map<string, WorkflowInstance>();

    if (!existsSync(path)) return instances;

    const entries: WorkflowJournalEntry[] = [];
    for (const line of readFileSync(path, 'utf-8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line) as WorkflowJournalEntry;
        if (e && typeof e === 'object' && 'kind' in e) entries.push(e);
      } catch {
        // malformed — skip silently
      }
    }

    for (const entry of entries) {
      const data = entry.data as Record<string, unknown>;
      const instanceId = data['instanceId'] as string | undefined;
      if (!instanceId) continue;

      switch (entry.kind) {
        case 'workflow_started': {
          instances.set(instanceId, {
            instanceId,
            definitionId: data['definitionId'] as string,
            currentState: data['initialState'] as string,
            vars: (data['vars'] as Record<string, unknown>) ?? {},
            history: [],
            startedAt: data['startedAt'] as string,
            status: 'active',
            transitionCount: 0,
          });
          break;
        }
        case 'workflow_transition': {
          const inst = instances.get(instanceId);
          if (!inst) break;
          inst.currentState = data['to'] as string;
          inst.transitionCount = (data['transitionCount'] as number) ?? inst.transitionCount + 1;
          // Restore vars if snapshot was persisted alongside transition
          if (data['vars']) inst.vars = data['vars'] as Record<string, unknown>;
          inst.history.push({
            from: data['from'] as string,
            to: data['to'] as string,
            on: data['on'] as EventMatcher,
            firedAt: entry.ts,
          });
          break;
        }
        case 'workflow_halted_runaway': {
          const inst = instances.get(instanceId);
          if (inst) {
            inst.status = 'halted';
            inst.haltReason = `runaway: exceeded ${data['maxTransitions']} transitions`;
          }
          break;
        }
        case 'workflow_canceled': {
          const inst = instances.get(instanceId);
          if (inst) {
            inst.status = 'halted';
            inst.haltReason = 'canceled';
          }
          break;
        }
        case 'workflow_terminal': {
          const inst = instances.get(instanceId);
          if (inst) inst.status = 'terminal';
          break;
        }
        // workflow_state_entered, workflow_action_dispatched, workflow_action_failed
        // are informational — no state mutation needed during replay
      }
    }

    return instances;
  }
}

/**
 * Standalone replayFromJournal function for convenience.
 * Reads the given path (or default) and returns the instance map.
 */
export function replayFromJournal(filePath?: string): Map<string, WorkflowInstance> {
  const j = new WorkflowJournal(filePath);
  return j.replayFromJournal(filePath);
}
