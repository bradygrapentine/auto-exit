/**
 * Templates test — verifies all 8 prebuilt workflow templates:
 *   - Load without throwing (boot-time validateWorkflow passes)
 *   - Have correct id, version, initialState, and non-empty states
 *   - WORKFLOW_TEMPLATES registry contains all 8 entries
 *   - listTemplates() returns sorted array of length 8
 *   - getTemplate() returns by id, undefined for unknown
 */

import { describe, expect, it } from 'vitest';
import {
  CONTINUOUS_TRAILING,
  TAKE_PROFIT_THEN_TRAIL,
  STOP_THEN_ROTATE,
  BRACKET_AND_ROLL,
  SCALE_OUT_THEN_REARM,
  TIME_DECAY_STOP_LOSS,
  DRAWDOWN_THEN_FLATTEN,
  PROFIT_TARGET_THEN_ICEBERG,
  WORKFLOW_TEMPLATES,
  listTemplates,
  getTemplate,
} from '../../src/workflows/templates.js';
import { validateWorkflow } from '../../src/workflows/validate.js';

const ALL_TEMPLATES = [
  CONTINUOUS_TRAILING,
  TAKE_PROFIT_THEN_TRAIL,
  STOP_THEN_ROTATE,
  BRACKET_AND_ROLL,
  SCALE_OUT_THEN_REARM,
  TIME_DECAY_STOP_LOSS,
  DRAWDOWN_THEN_FLATTEN,
  PROFIT_TARGET_THEN_ICEBERG,
];

const EXPECTED_IDS = [
  'continuous-trailing',
  'take-profit-then-trail',
  'stop-then-rotate',
  'bracket-and-roll',
  'scale-out-then-rearm',
  'time-decay-stop-loss',
  'drawdown-then-flatten',
  'profit-target-then-iceberg',
];

describe('workflow templates — boot-time load', () => {
  it('exports exactly 8 templates', () => {
    expect(ALL_TEMPLATES).toHaveLength(8);
  });

  it('all 8 templates are valid WorkflowDefinitions (re-validate)', () => {
    for (const def of ALL_TEMPLATES) {
      const result = validateWorkflow(def);
      expect(result.ok, `Template "${def.id}" failed re-validation: ${result.ok ? '' : result.errors.join('; ')}`).toBe(true);
    }
  });

  it('each template has expected id', () => {
    const actualIds = ALL_TEMPLATES.map((t) => t.id).sort();
    expect(actualIds).toEqual([...EXPECTED_IDS].sort());
  });

  it('each template has version 1', () => {
    for (const def of ALL_TEMPLATES) {
      expect(def.version, `Template "${def.id}" version`).toBe(1);
    }
  });

  it('each template has at least 2 states (active + TERMINAL)', () => {
    for (const def of ALL_TEMPLATES) {
      expect(def.states.length, `Template "${def.id}" states count`).toBeGreaterThanOrEqual(2);
    }
  });

  it('each template has a TERMINAL state with empty transitions', () => {
    for (const def of ALL_TEMPLATES) {
      const terminal = def.states.find((s) => s.name === 'TERMINAL');
      expect(terminal, `Template "${def.id}" missing TERMINAL state`).toBeDefined();
      expect(terminal!.transitions, `Template "${def.id}" TERMINAL has transitions`).toHaveLength(0);
    }
  });

  it('initialState is present in states', () => {
    for (const def of ALL_TEMPLATES) {
      const names = def.states.map((s) => s.name);
      expect(names, `Template "${def.id}" initialState not found`).toContain(def.initialState);
    }
  });

  it('initialState is not TERMINAL', () => {
    for (const def of ALL_TEMPLATES) {
      expect(def.initialState, `Template "${def.id}" initialState must not be TERMINAL`).not.toBe('TERMINAL');
    }
  });
});

describe('workflow templates — WORKFLOW_TEMPLATES registry', () => {
  it('contains all 8 template ids', () => {
    expect(WORKFLOW_TEMPLATES.size).toBe(8);
    for (const id of EXPECTED_IDS) {
      expect(WORKFLOW_TEMPLATES.has(id), `Registry missing "${id}"`).toBe(true);
    }
  });

  it('each registry entry matches its exported constant', () => {
    expect(WORKFLOW_TEMPLATES.get('continuous-trailing')).toBe(CONTINUOUS_TRAILING);
    expect(WORKFLOW_TEMPLATES.get('take-profit-then-trail')).toBe(TAKE_PROFIT_THEN_TRAIL);
    expect(WORKFLOW_TEMPLATES.get('stop-then-rotate')).toBe(STOP_THEN_ROTATE);
    expect(WORKFLOW_TEMPLATES.get('bracket-and-roll')).toBe(BRACKET_AND_ROLL);
    expect(WORKFLOW_TEMPLATES.get('scale-out-then-rearm')).toBe(SCALE_OUT_THEN_REARM);
    expect(WORKFLOW_TEMPLATES.get('time-decay-stop-loss')).toBe(TIME_DECAY_STOP_LOSS);
    expect(WORKFLOW_TEMPLATES.get('drawdown-then-flatten')).toBe(DRAWDOWN_THEN_FLATTEN);
    expect(WORKFLOW_TEMPLATES.get('profit-target-then-iceberg')).toBe(PROFIT_TARGET_THEN_ICEBERG);
  });
});

describe('workflow templates — listTemplates()', () => {
  it('returns array of length 8', () => {
    expect(listTemplates()).toHaveLength(8);
  });

  it('is sorted by id', () => {
    const listed = listTemplates();
    const ids = listed.map((t) => t.id);
    expect(ids).toEqual([...ids].sort());
  });
});

describe('workflow templates — getTemplate()', () => {
  it('returns template for known id', () => {
    for (const id of EXPECTED_IDS) {
      const t = getTemplate(id);
      expect(t, `getTemplate("${id}")`).toBeDefined();
      expect(t!.id).toBe(id);
    }
  });

  it('returns undefined for unknown id', () => {
    expect(getTemplate('nonexistent-template')).toBeUndefined();
    expect(getTemplate('')).toBeUndefined();
  });
});

describe('individual template shapes', () => {
  it('continuous-trailing: initial state is ARMED, re-arms on synthetic_fired', () => {
    const def = CONTINUOUS_TRAILING;
    expect(def.initialState).toBe('ARMED');
    const armed = def.states.find((s) => s.name === 'ARMED')!;
    expect(armed.onEntry).toBeDefined();
    expect(armed.onEntry!.some((a) => a.type === 'register_synthetic')).toBe(true);
    // Has self-loop transition (next = 'ARMED')
    const selfLoop = armed.transitions.find((t) => t.next === 'ARMED');
    expect(selfLoop).toBeDefined();
    expect(selfLoop!.on.kind).toBe('synthetic_fired');
  });

  it('take-profit-then-trail: TAKE_PROFIT → TRAILING → TERMINAL', () => {
    const def = TAKE_PROFIT_THEN_TRAIL;
    const stateNames = def.states.map((s) => s.name);
    expect(stateNames).toContain('TAKE_PROFIT');
    expect(stateNames).toContain('TRAILING');
    expect(stateNames).toContain('TERMINAL');
    const tp = def.states.find((s) => s.name === 'TAKE_PROFIT')!;
    expect(tp.transitions[0]?.next).toBe('TRAILING');
  });

  it('stop-then-rotate: STOP_ARMED → ROTATING → TERMINAL', () => {
    const def = STOP_THEN_ROTATE;
    const stateNames = def.states.map((s) => s.name);
    expect(stateNames).toContain('STOP_ARMED');
    expect(stateNames).toContain('ROTATING');
    expect(stateNames).toContain('TERMINAL');
  });

  it('bracket-and-roll: BRACKETED → ROLLING → BRACKETED (loop)', () => {
    const def = BRACKET_AND_ROLL;
    const bracketed = def.states.find((s) => s.name === 'BRACKETED')!;
    expect(bracketed.transitions.some((t) => t.next === 'ROLLING')).toBe(true);
    const rolling = def.states.find((s) => s.name === 'ROLLING')!;
    expect(rolling.transitions.some((t) => t.next === 'BRACKETED')).toBe(true);
  });

  it('scale-out-then-rearm: SCALING self-loops', () => {
    const def = SCALE_OUT_THEN_REARM;
    const scaling = def.states.find((s) => s.name === 'SCALING')!;
    expect(scaling.transitions.some((t) => t.next === 'SCALING')).toBe(true);
  });

  it('time-decay-stop-loss: 3 time-band states + TERMINAL', () => {
    const def = TIME_DECAY_STOP_LOSS;
    const stateNames = def.states.map((s) => s.name);
    expect(stateNames).toContain('EARLY');
    expect(stateNames).toContain('MID');
    expect(stateNames).toContain('FINAL');
    expect(stateNames).toContain('TERMINAL');
    // time_elapsed transitions connect the bands
    const early = def.states.find((s) => s.name === 'EARLY')!;
    const timeTransition = early.transitions.find((t) => t.on.kind === 'time_elapsed');
    expect(timeTransition).toBeDefined();
    expect(timeTransition!.next).toBe('MID');
  });

  it('drawdown-then-flatten: WATCHING → FLATTENING → TERMINAL', () => {
    const def = DRAWDOWN_THEN_FLATTEN;
    const watching = def.states.find((s) => s.name === 'WATCHING')!;
    expect(watching.transitions[0]?.on.kind).toBe('synthetic_fired');
    const stratAction = watching.transitions[0]?.actions.find((a) => a.type === 'run_strategy');
    expect(stratAction).toBeDefined();
  });

  it('profit-target-then-iceberg: WAITING_TP → ICEBERGING → TERMINAL', () => {
    const def = PROFIT_TARGET_THEN_ICEBERG;
    const waiting = def.states.find((s) => s.name === 'WAITING_TP')!;
    expect(waiting.transitions[0]?.on.kind).toBe('synthetic_fired');
    const icebergAction = waiting.transitions[0]?.actions.find(
      (a) => a.type === 'run_strategy' && (a as { strategy: string }).strategy === 'S-iceberg',
    );
    expect(icebergAction).toBeDefined();
  });
});
