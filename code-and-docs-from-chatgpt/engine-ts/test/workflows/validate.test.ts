import { describe, it, expect } from 'vitest';
import { validateWorkflow } from '../../src/workflows/validate.js';
import { MAX_TRANSITIONS_DEFAULT, MAX_TRANSITIONS_HARD_CAP } from '../../src/workflows/types.js';

const minimal = {
  id: 'wf-1',
  version: 1,
  initialState: 'idle',
  states: [
    {
      name: 'idle',
      transitions: [
        {
          on: { kind: 'synthetic_fired', ticker: 'KX-1' },
          actions: [{ type: 'alert', channel: 'log', message: 'fired' }],
          next: 'TERMINAL',
        },
      ],
    },
  ],
};

describe('validateWorkflow — happy path', () => {
  it('accepts a minimal valid workflow', () => {
    const r = validateWorkflow(minimal);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.def.id).toBe('wf-1');
      expect(r.def.maxTransitions).toBe(MAX_TRANSITIONS_DEFAULT);
    }
  });

  it('preserves explicit maxTransitions when provided', () => {
    const r = validateWorkflow({ ...minimal, maxTransitions: 100 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.def.maxTransitions).toBe(100);
  });
});

describe('validateWorkflow — top-level rejections', () => {
  it('rejects non-object input', () => {
    expect(validateWorkflow(null).ok).toBe(false);
    expect(validateWorkflow('not-a-workflow').ok).toBe(false);
  });

  it('rejects empty id', () => {
    const r = validateWorkflow({ ...minimal, id: '' });
    expect(r.ok).toBe(false);
  });

  it('rejects non-numeric version', () => {
    const r = validateWorkflow({ ...minimal, version: 'v1' });
    expect(r.ok).toBe(false);
  });

  it('rejects empty states array', () => {
    const r = validateWorkflow({ ...minimal, states: [] });
    expect(r.ok).toBe(false);
  });

  it('rejects initialState pointing to nonexistent state', () => {
    const r = validateWorkflow({ ...minimal, initialState: 'ghost' });
    expect(r.ok).toBe(false);
  });

  it('rejects maxTransitions exceeding hard cap', () => {
    const r = validateWorkflow({ ...minimal, maxTransitions: MAX_TRANSITIONS_HARD_CAP + 1 });
    expect(r.ok).toBe(false);
  });

  it('rejects maxTransitions zero or negative', () => {
    expect(validateWorkflow({ ...minimal, maxTransitions: 0 }).ok).toBe(false);
    expect(validateWorkflow({ ...minimal, maxTransitions: -5 }).ok).toBe(false);
  });
});

describe('validateWorkflow — transition rejections', () => {
  it('rejects transition next pointing to nonexistent state', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [{ on: { kind: 'synthetic_fired' }, actions: [], next: 'ghost' }],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(false);
  });

  it('accepts transition next === "TERMINAL"', () => {
    expect(validateWorkflow(minimal).ok).toBe(true);
  });

  it('rejects unknown EventMatcher kind', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [{ on: { kind: 'unknown_event' }, actions: [], next: 'TERMINAL' }],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(false);
  });

  it('rejects unknown Action type', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [
            {
              on: { kind: 'synthetic_fired' },
              actions: [{ type: 'self_destruct' }],
              next: 'TERMINAL',
            },
          ],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(false);
  });
});

describe('validateWorkflow — zero-event cycles', () => {
  it('rejects time_elapsed with durationMs=0', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [{ on: { kind: 'time_elapsed', durationMs: 0 }, actions: [], next: 'idle' }],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(false);
  });

  it('accepts time_elapsed with durationMs > 0', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [{ on: { kind: 'time_elapsed', durationMs: 1000 }, actions: [], next: 'idle' }],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(true);
  });
});

describe('validateWorkflow — predicate rejections', () => {
  it('rejects unknown predicate op', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [
            {
              on: { kind: 'synthetic_fired' },
              guard: { field: 'event.ticker', op: 'matches', value: 'KX-' },
              actions: [],
              next: 'TERMINAL',
            },
          ],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(false);
  });

  it('accepts nested all/any predicates', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [
            {
              on: { kind: 'synthetic_fired' },
              guard: {
                all: [
                  { field: 'event.ticker', op: 'eq', value: 'KX-1' },
                  { any: [{ field: 'event.priceCents', op: 'gte', value: 50 }] },
                ],
              },
              actions: [],
              next: 'TERMINAL',
            },
          ],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(true);
  });

  it('rejects op=in with non-array value', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [
            {
              on: { kind: 'synthetic_fired' },
              guard: { field: 'event.ticker', op: 'in', value: 'KX-1' },
              actions: [],
              next: 'TERMINAL',
            },
          ],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(false);
  });
});

describe('validateWorkflow — action shape', () => {
  it('rejects cancel_synthetic without valid syntheticId', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [
            {
              on: { kind: 'synthetic_fired' },
              actions: [{ type: 'cancel_synthetic', syntheticId: 42 }],
              next: 'TERMINAL',
            },
          ],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(false);
  });

  it('accepts cancel_synthetic with last_registered ref', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [
            {
              on: { kind: 'synthetic_fired' },
              actions: [{ type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } }],
              next: 'TERMINAL',
            },
          ],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(true);
  });

  it('rejects alert with unknown channel', () => {
    const wf = {
      ...minimal,
      states: [
        {
          name: 'idle',
          transitions: [
            {
              on: { kind: 'synthetic_fired' },
              actions: [{ type: 'alert', channel: 'sms', message: 'hi' }],
              next: 'TERMINAL',
            },
          ],
        },
      ],
    };
    expect(validateWorkflow(wf).ok).toBe(false);
  });
});
