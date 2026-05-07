/**
 * SH-COMPOSE workflow definition validator.
 *
 * Rejects everything outside the closed sets defined in types.ts. Catches
 * structural errors (missing initialState, unknown next, unknown event/action
 * kinds) and zero-event self-cycles before a definition reaches the engine.
 */
import {
  ACTION_TYPES,
  EVENT_MATCHER_KINDS,
  MAX_TRANSITIONS_DEFAULT,
  MAX_TRANSITIONS_HARD_CAP,
  PREDICATE_OPS,
  type Action,
  type EventMatcher,
  type SimplePredicate,
  type Transition,
  type WorkflowDefinition,
  type WorkflowState,
} from './types.js';

export type ValidateResult =
  | { ok: true; def: WorkflowDefinition }
  | { ok: false; errors: string[] };

export function validateWorkflow(input: unknown): ValidateResult {
  const errors: string[] = [];

  if (!isPlainObject(input)) {
    return { ok: false, errors: ['top-level value must be an object'] };
  }

  const id = input['id'];
  if (typeof id !== 'string' || id.length === 0) errors.push('id must be a non-empty string');

  const version = input['version'];
  if (typeof version !== 'number' || !Number.isFinite(version)) errors.push('version must be a finite number');

  const initialState = input['initialState'];
  if (typeof initialState !== 'string' || initialState.length === 0) errors.push('initialState must be a non-empty string');

  const maxTransitions = input['maxTransitions'];
  if (maxTransitions !== undefined) {
    if (typeof maxTransitions !== 'number' || !Number.isInteger(maxTransitions) || maxTransitions <= 0) {
      errors.push('maxTransitions must be a positive integer');
    } else if (maxTransitions > MAX_TRANSITIONS_HARD_CAP) {
      errors.push(`maxTransitions exceeds hard cap of ${MAX_TRANSITIONS_HARD_CAP}`);
    }
  }

  const states = input['states'];
  if (!Array.isArray(states) || states.length === 0) {
    errors.push('states must be a non-empty array');
    return { ok: false, errors };
  }

  const stateNames = new Set<string>();
  for (const s of states as unknown[]) {
    if (isPlainObject(s) && typeof s['name'] === 'string') stateNames.add(s['name'] as string);
  }

  if (typeof initialState === 'string' && !stateNames.has(initialState)) {
    errors.push(`initialState "${initialState}" not found in states`);
  }

  for (let i = 0; i < (states as unknown[]).length; i++) {
    validateState((states as unknown[])[i], i, stateNames, errors);
  }

  if (errors.length > 0) return { ok: false, errors };

  const def: WorkflowDefinition = {
    id: id as string,
    version: version as number,
    maxTransitions: (maxTransitions as number | undefined) ?? MAX_TRANSITIONS_DEFAULT,
    initialState: initialState as string,
    states: states as WorkflowState[],
  };
  return { ok: true, def };
}

function validateState(s: unknown, idx: number, stateNames: Set<string>, errors: string[]): void {
  const prefix = `states[${idx}]`;
  if (!isPlainObject(s)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (typeof s['name'] !== 'string' || (s['name'] as string).length === 0) {
    errors.push(`${prefix}.name must be a non-empty string`);
  }
  if (s['onEntry'] !== undefined) {
    if (!Array.isArray(s['onEntry'])) {
      errors.push(`${prefix}.onEntry must be an array of actions`);
    } else {
      (s['onEntry'] as unknown[]).forEach((a, i) => validateAction(a, `${prefix}.onEntry[${i}]`, errors));
    }
  }
  if (!Array.isArray(s['transitions'])) {
    errors.push(`${prefix}.transitions must be an array`);
    return;
  }
  (s['transitions'] as unknown[]).forEach((t, i) =>
    validateTransition(t, `${prefix}.transitions[${i}]`, s['name'] as string, stateNames, errors),
  );
}

function validateTransition(
  t: unknown,
  prefix: string,
  parentStateName: string,
  stateNames: Set<string>,
  errors: string[],
): void {
  if (!isPlainObject(t)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  validateEventMatcher(t['on'], `${prefix}.on`, parentStateName, errors);
  if (t['guard'] !== undefined) validatePredicate(t['guard'], `${prefix}.guard`, errors);
  if (!Array.isArray(t['actions'])) {
    errors.push(`${prefix}.actions must be an array`);
  } else {
    (t['actions'] as unknown[]).forEach((a, i) => validateAction(a, `${prefix}.actions[${i}]`, errors));
  }
  const next = t['next'];
  if (typeof next !== 'string' || next.length === 0) {
    errors.push(`${prefix}.next must be a non-empty string`);
  } else if (next !== 'TERMINAL' && !stateNames.has(next)) {
    errors.push(`${prefix}.next "${next}" does not match any state name (or 'TERMINAL')`);
  }
}

function validateEventMatcher(e: unknown, prefix: string, parentStateName: string, errors: string[]): void {
  if (!isPlainObject(e)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  const kind = e['kind'];
  if (typeof kind !== 'string' || !EVENT_MATCHER_KINDS.has(kind as EventMatcher['kind'])) {
    errors.push(`${prefix}.kind unknown: ${String(kind)}`);
    return;
  }
  if (kind === 'time_elapsed') {
    if (typeof e['durationMs'] !== 'number' || e['durationMs'] < 0) {
      errors.push(`${prefix}.durationMs must be non-negative number`);
    }
    // Reject zero-duration self-cycle (would create an immediate-fire loop).
    // Note: we don't know `next` here; the transition validator already enforces
    // next exists. Here we flag durationMs=0 specifically when paired with a
    // self-loop, which we detect via parentStateName at the transition level.
    // Implementation: stamp a marker the parent transition validator can use.
    // Simpler: just reject durationMs === 0 outright at this layer — no
    // legitimate use case for an immediately-firing time_elapsed transition.
    if (e['durationMs'] === 0) {
      errors.push(`${prefix}.durationMs=0 is not allowed (creates zero-event cycles)`);
    }
  }
  if (kind === 'time_at') {
    if (typeof e['timestamp'] !== 'number') errors.push(`${prefix}.timestamp must be a number`);
  }
  void parentStateName; // reserved for future cross-transition cycle analysis
}

function validateAction(a: unknown, prefix: string, errors: string[]): void {
  if (!isPlainObject(a)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  const type = a['type'];
  if (typeof type !== 'string' || !ACTION_TYPES.has(type as Action['type'])) {
    errors.push(`${prefix}.type unknown: ${String(type)}`);
    return;
  }
  // Per-type field shape validation kept light — engine layer validates final
  // payloads at execution time. Schema layer just ensures the discriminator.
  if (type === 'cancel_synthetic') {
    const sid = a['syntheticId'];
    const isStringId = typeof sid === 'string' && sid.length > 0;
    const isRef = isPlainObject(sid) && (sid as Record<string, unknown>)['ref'] === 'last_registered';
    if (!isStringId && !isRef) errors.push(`${prefix}.syntheticId must be string or {ref:'last_registered'}`);
  }
  if (type === 'run_strategy') {
    if (typeof a['strategy'] !== 'string') errors.push(`${prefix}.strategy must be a string`);
    if (!isPlainObject(a['params'])) errors.push(`${prefix}.params must be an object`);
  }
  if (type === 'alert') {
    const ch = a['channel'];
    if (ch !== 'log' && ch !== 'tui' && ch !== 'mcp') errors.push(`${prefix}.channel must be 'log'|'tui'|'mcp'`);
    if (typeof a['message'] !== 'string') errors.push(`${prefix}.message must be a string`);
  }
  if (type === 'set_var') {
    if (typeof a['key'] !== 'string' || (a['key'] as string).length === 0) errors.push(`${prefix}.key must be non-empty string`);
  }
}

function validatePredicate(p: unknown, prefix: string, errors: string[]): void {
  if (!isPlainObject(p)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if ('all' in p && Array.isArray(p['all'])) {
    (p['all'] as unknown[]).forEach((sub, i) => validatePredicate(sub, `${prefix}.all[${i}]`, errors));
    return;
  }
  if ('any' in p && Array.isArray(p['any'])) {
    (p['any'] as unknown[]).forEach((sub, i) => validatePredicate(sub, `${prefix}.any[${i}]`, errors));
    return;
  }
  if (typeof p['field'] !== 'string') {
    errors.push(`${prefix}.field must be a string`);
  }
  if (typeof p['op'] !== 'string' || !PREDICATE_OPS.has(p['op'] as never)) {
    errors.push(`${prefix}.op unknown: ${String((p as Record<string, unknown>)['op'])}`);
  }
  // value type-checking depends on op; keep light at schema layer.
  const op = p['op'];
  if (op === 'in' && !Array.isArray(p['value'])) errors.push(`${prefix}.value must be array for op 'in'`);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export type { Transition };
