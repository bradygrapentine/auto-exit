/**
 * WorkflowEngine — event-driven state machine runner.
 *
 * Subscribes to incoming events, evaluates all active workflow instances,
 * advances state on first matching transition, executes declared actions,
 * and persists lifecycle events to WorkflowJournal.
 *
 * Anti-runaway: transitionCount cap (default 50, hard 500). Exceeding it halts
 * the instance and journals workflow_halted_runaway.
 *
 * Idle-when-empty: handleEvent is a fast no-op when no instances are active.
 *
 * See spec: docs/superpowers/specs/2026-05-05-strategy-composition.md §3.2.
 */
import { randomUUID } from 'node:crypto';
import {
  MAX_TRANSITIONS_HARD_CAP,
  MAX_TRANSITIONS_DEFAULT,
  type WorkflowDefinition,
  type WorkflowInstance,
  type Action,
  type EventMatcher,
  type WorkflowState,
} from './types.js';
import { validateWorkflow } from './validate.js';
import { evaluatePredicate } from './predicate.js';
import type { WorkflowJournal } from './journal.js';

// ── Injectable callback types ─────────────────────────────────────────────────

export type RegisterSyntheticFn = (synthetic: unknown) => string | Promise<string>;
export type CancelSyntheticFn = (syntheticId: string) => void | Promise<void>;
export type RunStrategyFn = (strategy: string, params: Record<string, unknown>) => void | Promise<void>;
export type AlertFn = (channel: 'log' | 'tui' | 'mcp', message: string) => void | Promise<void>;

// ── Engine constructor options ────────────────────────────────────────────────

export interface WorkflowEngineOptions {
  journal: WorkflowJournal;
  predicateEval?: typeof evaluatePredicate;
  registerSyntheticFn: RegisterSyntheticFn;
  cancelSyntheticFn: CancelSyntheticFn;
  runStrategyFn: RunStrategyFn;
  alertFn: AlertFn;
  now?: () => number;
  sleepMs?: (ms: number) => Promise<void>;
}

// ── Per-instance runtime metadata ─────────────────────────────────────────────

interface InstanceMeta {
  maxTransitions: number;
  lastRegisteredSyntheticId?: string;
}

// ── WorkflowEngine ────────────────────────────────────────────────────────────

export class WorkflowEngine {
  private readonly journal: WorkflowJournal;
  private readonly predicateEval: typeof evaluatePredicate;
  private readonly registerSyntheticFn: RegisterSyntheticFn;
  private readonly cancelSyntheticFn: CancelSyntheticFn;
  private readonly runStrategyFn: RunStrategyFn;
  private readonly alertFn: AlertFn;
  private readonly now: () => number;
  // sleepMs kept for forward-compat (not used in pure event-driven path)
  private readonly _sleepMs: (ms: number) => Promise<void>;

  /** In-memory instance map keyed by instanceId. */
  private readonly instances = new Map<string, WorkflowInstance>();
  /** Per-instance runtime metadata (maxTransitions, lastRegisteredSyntheticId). */
  private readonly meta = new Map<string, InstanceMeta>();
  /** Definition map for state lookup by currentState name. */
  private readonly definitions = new Map<string, WorkflowDefinition>();

  constructor(opts: WorkflowEngineOptions) {
    this.journal = opts.journal;
    this.predicateEval = opts.predicateEval ?? evaluatePredicate;
    this.registerSyntheticFn = opts.registerSyntheticFn;
    this.cancelSyntheticFn = opts.cancelSyntheticFn;
    this.runStrategyFn = opts.runStrategyFn;
    this.alertFn = opts.alertFn;
    this.now = opts.now ?? (() => Date.now());
    this._sleepMs = opts.sleepMs ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Register a new workflow instance.
   * Validates the definition, seeds in-memory state, and journals workflow_started.
   * Throws if the definition is invalid.
   */
  register(definition: WorkflowDefinition): { instanceId: string } {
    const result = validateWorkflow(definition);
    if (!result.ok) {
      throw new Error(`Invalid workflow definition: ${result.errors.join('; ')}`);
    }
    const def = result.def;
    const instanceId = randomUUID();
    const instance: WorkflowInstance = {
      instanceId,
      definitionId: def.id,
      currentState: def.initialState,
      vars: {},
      history: [],
      startedAt: new Date(this.now()).toISOString(),
      status: 'active',
      transitionCount: 0,
    };
    const maxT = Math.min(def.maxTransitions ?? MAX_TRANSITIONS_DEFAULT, MAX_TRANSITIONS_HARD_CAP);
    this.instances.set(instanceId, instance);
    this.meta.set(instanceId, { maxTransitions: maxT });
    this.definitions.set(instanceId, def);
    this.journal.appendStarted(instance);
    return { instanceId };
  }

  /**
   * Handle an incoming event. Evaluates all active instances and advances
   * state on the first matching transition (first-match-wins per declaration order).
   * Idle-when-empty: returns immediately if no active instances.
   */
  async handleEvent(event: Record<string, unknown>): Promise<void> {
    // Idle-when-empty fast path
    const activeInstances = [...this.instances.values()].filter((i) => i.status === 'active');
    if (activeInstances.length === 0) return;

    for (const instance of activeInstances) {
      await this.processInstanceEvent(instance, event);
    }
  }

  /** Cancel an active instance. Marks halted and journals workflow_canceled. */
  cancel(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    instance.status = 'halted';
    instance.haltReason = 'canceled';
    this.journal.appendCanceled(instanceId);
  }

  /** Return all instances (read-only copies). */
  list(): WorkflowInstance[] {
    return [...this.instances.values()].map((i) => ({ ...i, vars: { ...i.vars }, history: [...i.history] }));
  }

  /** Return a specific instance by id (read-only copy), or undefined. */
  get(instanceId: string): WorkflowInstance | undefined {
    const inst = this.instances.get(instanceId);
    if (!inst) return undefined;
    return { ...inst, vars: { ...inst.vars }, history: [...inst.history] };
  }

  // ── Event processing ────────────────────────────────────────────────────────

  private async processInstanceEvent(
    instance: WorkflowInstance,
    event: Record<string, unknown>,
  ): Promise<void> {
    if (instance.status !== 'active') return;

    const def = this.definitions.get(instance.instanceId);
    if (!def) return;

    const stateObj = def.states.find((s) => s.name === instance.currentState);
    if (!stateObj) return;

    // Check runaway BEFORE evaluating transitions
    const meta = this.meta.get(instance.instanceId)!;
    if (instance.transitionCount >= meta.maxTransitions) {
      instance.status = 'halted';
      instance.haltReason = `runaway: exceeded ${meta.maxTransitions} transitions`;
      this.journal.appendHaltedRunaway(instance.instanceId, instance.transitionCount, meta.maxTransitions);
      return;
    }

    // Evaluate transitions in declared order; first match wins
    const ctx = { event, vars: instance.vars };
    for (let i = 0; i < stateObj.transitions.length; i++) {
      const transition = stateObj.transitions[i];

      // Check event matches
      if (!this.matchesEvent(event, transition.on)) continue;

      // Check guard predicate
      if (transition.guard !== undefined) {
        if (!this.predicateEval(transition.guard, ctx)) continue;
      }

      // Match found — advance state
      const from = instance.currentState;
      const to = transition.next;

      instance.transitionCount += 1;

      this.journal.appendTransition(
        instance.instanceId,
        from,
        to === 'TERMINAL' ? 'TERMINAL' : to,
        transition.on,
        i,
        instance.transitionCount,
      );

      // Execute transition actions
      await this.executeActions(instance, transition.actions, meta);

      if (to === 'TERMINAL') {
        instance.currentState = 'TERMINAL';
        instance.status = 'terminal';
        instance.history.push({ from, to: 'TERMINAL', on: transition.on, firedAt: new Date(this.now()).toISOString() });
        this.journal.appendTerminal(instance.instanceId, 'TERMINAL');
        return;
      }

      // Advance to next state
      instance.history.push({ from, to, on: transition.on, firedAt: new Date(this.now()).toISOString() });
      instance.currentState = to;

      // Run onEntry actions for new state
      const nextStateObj = def.states.find((s) => s.name === to);
      if (nextStateObj?.onEntry && nextStateObj.onEntry.length > 0) {
        this.journal.appendStateEntered(instance.instanceId, to);
        await this.executeActions(instance, nextStateObj.onEntry, meta);
      }

      // Check runaway after transition
      if (instance.transitionCount >= meta.maxTransitions) {
        instance.status = 'halted';
        instance.haltReason = `runaway: exceeded ${meta.maxTransitions} transitions`;
        this.journal.appendHaltedRunaway(instance.instanceId, instance.transitionCount, meta.maxTransitions);
      }

      // First match wins — stop evaluating remaining transitions
      return;
    }
  }

  // ── Event matching ──────────────────────────────────────────────────────────

  private matchesEvent(event: Record<string, unknown>, matcher: EventMatcher): boolean {
    if (event['kind'] !== matcher.kind) return false;

    switch (matcher.kind) {
      case 'synthetic_fired': {
        if (matcher.syntheticId !== undefined && event['syntheticId'] !== matcher.syntheticId) return false;
        if (matcher.syntheticKind !== undefined && event['syntheticKind'] !== matcher.syntheticKind) return false;
        if (matcher.ticker !== undefined && event['ticker'] !== matcher.ticker) return false;
        return true;
      }
      case 'synthetic_canceled': {
        if (matcher.syntheticId !== undefined && event['syntheticId'] !== matcher.syntheticId) return false;
        return true;
      }
      case 'fill_received': {
        if (matcher.ticker !== undefined && event['ticker'] !== matcher.ticker) return false;
        if (matcher.side !== undefined && event['side'] !== matcher.side) return false;
        return true;
      }
      case 'time_elapsed': {
        // time_elapsed matches when event carries a durationMs >= matcher.durationMs
        const evDur = event['durationMs'];
        if (typeof evDur !== 'number') return false;
        return evDur >= matcher.durationMs;
      }
      case 'time_at': {
        const evTs = event['timestamp'];
        if (typeof evTs !== 'number') return false;
        return evTs >= matcher.timestamp;
      }
      default:
        return false;
    }
  }

  // ── Action execution ────────────────────────────────────────────────────────

  private async executeActions(
    instance: WorkflowInstance,
    actions: Action[],
    meta: InstanceMeta,
  ): Promise<void> {
    for (const action of actions) {
      await this.executeAction(instance, action, meta);
    }
  }

  private async executeAction(
    instance: WorkflowInstance,
    action: Action,
    meta: InstanceMeta,
  ): Promise<void> {
    const instanceId = instance.instanceId;
    try {
      switch (action.type) {
        case 'register_synthetic': {
          const syntheticId = await this.registerSyntheticFn(action.synthetic);
          meta.lastRegisteredSyntheticId = syntheticId;
          this.journal.appendActionDispatched(instanceId, 'register_synthetic', { syntheticId });
          break;
        }
        case 'cancel_synthetic': {
          let resolvedId: string;
          if (typeof action.syntheticId === 'string') {
            resolvedId = action.syntheticId;
          } else if (action.syntheticId.ref === 'last_registered') {
            if (!meta.lastRegisteredSyntheticId) {
              this.journal.appendActionFailed(instanceId, 'cancel_synthetic', 'no last_registered synthetic id available');
              return;
            }
            resolvedId = meta.lastRegisteredSyntheticId;
          } else {
            this.journal.appendActionFailed(instanceId, 'cancel_synthetic', 'unknown syntheticId ref');
            return;
          }
          await this.cancelSyntheticFn(resolvedId);
          this.journal.appendActionDispatched(instanceId, 'cancel_synthetic', { syntheticId: resolvedId });
          break;
        }
        case 'run_strategy': {
          await this.runStrategyFn(action.strategy, action.params);
          this.journal.appendActionDispatched(instanceId, 'run_strategy', { strategy: action.strategy });
          break;
        }
        case 'alert': {
          await this.alertFn(action.channel, action.message);
          this.journal.appendActionDispatched(instanceId, 'alert', { channel: action.channel, message: action.message });
          break;
        }
        case 'set_var': {
          instance.vars[action.key] = action.value;
          this.journal.appendActionDispatched(instanceId, 'set_var', { key: action.key, value: action.value });
          break;
        }
        default: {
          const exhaustive: never = action;
          this.journal.appendActionFailed(instanceId, (exhaustive as Action).type, 'unknown action type');
        }
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.journal.appendActionFailed(instanceId, action.type, reason);
    }
  }

  // ── State accessor helpers ───────────────────────────────────────────────────

  private getStateObj(def: WorkflowDefinition, stateName: string): WorkflowState | undefined {
    return def.states.find((s) => s.name === stateName);
  }
}
