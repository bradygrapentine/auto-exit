/**
 * SH-COMPOSE workflow definition types.
 *
 * Restricted-on-purpose schema: closed sets for EventMatcher, Action, and
 * SimplePredicate prevent Turing-completeness. Anything more expressive than
 * what's defined here belongs in the strategy library (S-*) and is invoked
 * via run_strategy.
 *
 * See spec: docs/superpowers/specs/2026-05-05-strategy-composition.md §3.1.
 */

export type EventMatcher =
  | { kind: 'synthetic_fired'; syntheticId?: string; syntheticKind?: string; ticker?: string }
  | { kind: 'synthetic_canceled'; syntheticId?: string }
  | { kind: 'fill_received'; ticker?: string; side?: 'yes' | 'no' }
  | { kind: 'time_elapsed'; durationMs: number }
  | { kind: 'time_at'; timestamp: number };

export type EventMatcherKind = EventMatcher['kind'];

export const EVENT_MATCHER_KINDS: ReadonlySet<EventMatcherKind> = new Set([
  'synthetic_fired',
  'synthetic_canceled',
  'fill_received',
  'time_elapsed',
  'time_at',
]);

export type Action =
  | { type: 'register_synthetic'; synthetic: unknown }
  | { type: 'cancel_synthetic'; syntheticId: string | { ref: 'last_registered' } }
  | { type: 'run_strategy'; strategy: string; params: Record<string, unknown> }
  | { type: 'alert'; channel: 'log' | 'tui' | 'mcp'; message: string }
  | { type: 'set_var'; key: string; value: unknown };

export type ActionType = Action['type'];

export const ACTION_TYPES: ReadonlySet<ActionType> = new Set([
  'register_synthetic',
  'cancel_synthetic',
  'run_strategy',
  'alert',
  'set_var',
]);

export type LeafPredicate =
  | { field: string; op: 'eq' | 'neq' | 'in'; value: unknown }
  | { field: string; op: 'gte' | 'lte' | 'gt' | 'lt'; value: number };

export type SimplePredicate =
  | LeafPredicate
  | { all: SimplePredicate[] }
  | { any: SimplePredicate[] };

export type PredicateOp = 'eq' | 'neq' | 'in' | 'gte' | 'lte' | 'gt' | 'lt';

export const PREDICATE_OPS: ReadonlySet<PredicateOp> = new Set(['eq', 'neq', 'in', 'gte', 'lte', 'gt', 'lt']);

export interface Transition {
  on: EventMatcher;
  guard?: SimplePredicate;
  actions: Action[];
  next: string | 'TERMINAL';
}

export interface WorkflowState {
  name: string;
  onEntry?: Action[];
  transitions: Transition[];
}

export interface WorkflowDefinition {
  id: string;
  version: number;
  /** Hard cap 500; default 50 when omitted. */
  maxTransitions?: number;
  initialState: string;
  states: WorkflowState[];
}

export const MAX_TRANSITIONS_HARD_CAP = 500;
export const MAX_TRANSITIONS_DEFAULT = 50;

export interface WorkflowInstance {
  instanceId: string;
  definitionId: string;
  currentState: string;
  vars: Record<string, unknown>;
  history: Array<{ from: string; to: string; on: EventMatcher; firedAt: string }>;
  startedAt: string;
  status: 'active' | 'terminal' | 'halted';
  haltReason?: string;
  transitionCount: number;
}

export interface EvaluationContext {
  event?: Record<string, unknown>;
  vars: Record<string, unknown>;
}
