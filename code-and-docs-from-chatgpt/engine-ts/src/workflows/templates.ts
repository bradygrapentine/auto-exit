/**
 * SH-COMPOSE Phase C — 8 prebuilt workflow templates.
 *
 * Each template is a WorkflowDefinition exported as a JSON literal.
 * All templates are validated at module load via validateWorkflow(); any
 * malformed definition throws at boot with a descriptive error message.
 *
 * Template IDs (stable — used as keys in CLI/MCP/HTTP):
 *   continuous-trailing
 *   take-profit-then-trail
 *   stop-then-rotate
 *   bracket-and-roll
 *   scale-out-then-rearm
 *   time-decay-stop-loss
 *   drawdown-then-flatten
 *   profit-target-then-iceberg
 *
 * Design notes:
 * - Templates use only the closed-set EventMatcher / Action / SimplePredicate
 *   types from Phase A (types.ts). No Turing-complete escapes.
 * - Synthetic payloads inside register_synthetic actions carry a `_templateHint`
 *   field. The watcher layer ignores unknown fields; this is documentation only.
 * - Each template is parameterized via `set_var` onEntry actions that callers
 *   can override post-registration by injecting synthetic events.
 *
 * See spec: docs/superpowers/specs/2026-05-05-strategy-composition.md §4.2.
 */

import { validateWorkflow } from './validate.js';
import type { WorkflowDefinition } from './types.js';

// ── boot-time validation helper ───────────────────────────────────────────────

function assertTemplate(raw: unknown, name: string): WorkflowDefinition {
  const result = validateWorkflow(raw);
  if (!result.ok) {
    throw new Error(
      `[workflows/templates] Template "${name}" failed validation at module load:\n  ${result.errors.join('\n  ')}`,
    );
  }
  return result.def;
}

// ── 1. continuous-trailing ────────────────────────────────────────────────────
//
// Register a trailing stop on the initial position. When the synthetic fires
// (partial or full fill), immediately register a fresh trailing stop on the
// residual with the same trail params. Self-loop until TERMINAL guard fires.
//
// States: ARMED → (synthetic_fired) → ARMED (loop) or TERMINAL when
// vars.remainingContracts hits 0 (guard: field=remainingContracts op=lte value=0).
//
// Note: the guard checking remainingContracts=0 is on the TERMINAL transition.
// The default loop transition re-arms. Callers must update remainingContracts
// via set_var in the external event payload or through a companion policy.

const continuousTrailingRaw = {
  id: 'continuous-trailing',
  version: 1,
  maxTransitions: 200,
  initialState: 'ARMED',
  states: [
    {
      name: 'ARMED',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'trailing_stop',
            _templateHint: 'arm-trailing-stop',
            trailCents: 5,
            side: 'yes',
          },
        },
      ],
      transitions: [
        {
          // When position fully exhausted: terminate
          on: { kind: 'synthetic_fired' },
          guard: { field: 'remainingContracts', op: 'lte', value: 0 },
          actions: [
            { type: 'alert', channel: 'log', message: 'continuous-trailing: position exhausted → TERMINAL' },
          ],
          next: 'TERMINAL',
        },
        {
          // Re-arm trailing stop on residual
          on: { kind: 'synthetic_fired' },
          actions: [
            { type: 'alert', channel: 'log', message: 'continuous-trailing: synthetic fired, re-arming trail on residual' },
          ],
          next: 'ARMED',
        },
      ],
    },
    {
      name: 'TERMINAL',
      transitions: [],
    },
  ],
};

// ── 2. take-profit-then-trail ─────────────────────────────────────────────────
//
// Register a take-profit synthetic. On TP fill, cancel TP and arm a trailing
// stop on the residual. On trailing stop fire, terminate.
//
// States: TAKE_PROFIT → TRAILING → TERMINAL

const takeProfitThenTrailRaw = {
  id: 'take-profit-then-trail',
  version: 1,
  maxTransitions: 50,
  initialState: 'TAKE_PROFIT',
  states: [
    {
      name: 'TAKE_PROFIT',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'take_profit',
            _templateHint: 'arm-take-profit',
            targetPriceCents: 80,
            side: 'yes',
          },
        },
      ],
      transitions: [
        {
          on: { kind: 'synthetic_fired', syntheticKind: 'take_profit' },
          actions: [
            { type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } },
            { type: 'alert', channel: 'log', message: 'take-profit-then-trail: TP hit, switching to trailing stop' },
          ],
          next: 'TRAILING',
        },
      ],
    },
    {
      name: 'TRAILING',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'trailing_stop',
            _templateHint: 'arm-trailing-stop-post-tp',
            trailCents: 5,
            side: 'yes',
          },
        },
      ],
      transitions: [
        {
          on: { kind: 'synthetic_fired', syntheticKind: 'trailing_stop' },
          actions: [
            { type: 'alert', channel: 'log', message: 'take-profit-then-trail: trailing stop fired → TERMINAL' },
          ],
          next: 'TERMINAL',
        },
      ],
    },
    {
      name: 'TERMINAL',
      transitions: [],
    },
  ],
};

// ── 3. stop-then-rotate ───────────────────────────────────────────────────────
//
// Arm a stop-loss on the current position. When stop fires (loss exit), run
// S-roll strategy to rotate into a correlated position.
//
// States: STOP_ARMED → ROTATING → TERMINAL

const stopThenRotateRaw = {
  id: 'stop-then-rotate',
  version: 1,
  maxTransitions: 50,
  initialState: 'STOP_ARMED',
  states: [
    {
      name: 'STOP_ARMED',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'stop_loss',
            _templateHint: 'arm-stop-loss',
            triggerPriceCents: 30,
            side: 'yes',
          },
        },
      ],
      transitions: [
        {
          on: { kind: 'synthetic_fired', syntheticKind: 'stop_loss' },
          actions: [
            { type: 'alert', channel: 'log', message: 'stop-then-rotate: stop-loss fired, rotating position' },
            {
              type: 'run_strategy',
              strategy: 'S-roll',
              params: { _templateHint: 'rotate-on-stop' },
            },
          ],
          next: 'ROTATING',
        },
      ],
    },
    {
      name: 'ROTATING',
      transitions: [
        {
          on: { kind: 'fill_received' },
          actions: [
            { type: 'alert', channel: 'log', message: 'stop-then-rotate: rotation fill received → TERMINAL' },
          ],
          next: 'TERMINAL',
        },
      ],
    },
    {
      name: 'TERMINAL',
      transitions: [],
    },
  ],
};

// ── 4. bracket-and-roll ───────────────────────────────────────────────────────
//
// Arm a bracket (TP + stop). When TP fires → cancel stop, roll to new bracket.
// When stop fires → cancel TP, terminate. Implements "rolling bracket" pattern.
//
// States: BRACKETED → ROLLING → BRACKETED (loop) | TERMINAL

const bracketAndRollRaw = {
  id: 'bracket-and-roll',
  version: 1,
  maxTransitions: 100,
  initialState: 'BRACKETED',
  states: [
    {
      name: 'BRACKETED',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'bracket',
            _templateHint: 'arm-bracket',
            takeProfitCents: 80,
            stopLossCents: 30,
            side: 'yes',
          },
        },
      ],
      transitions: [
        {
          // TP hit → roll bracket up
          on: { kind: 'synthetic_fired', syntheticKind: 'take_profit' },
          actions: [
            { type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } },
            { type: 'alert', channel: 'log', message: 'bracket-and-roll: TP hit, rolling bracket' },
          ],
          next: 'ROLLING',
        },
        {
          // Stop hit → exit
          on: { kind: 'synthetic_fired', syntheticKind: 'stop_loss' },
          actions: [
            { type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } },
            { type: 'alert', channel: 'log', message: 'bracket-and-roll: stop-loss hit → TERMINAL' },
          ],
          next: 'TERMINAL',
        },
      ],
    },
    {
      name: 'ROLLING',
      onEntry: [
        {
          type: 'run_strategy',
          strategy: 'S-roll',
          params: { _templateHint: 'roll-bracket' },
        },
      ],
      transitions: [
        {
          on: { kind: 'fill_received' },
          actions: [
            { type: 'alert', channel: 'log', message: 'bracket-and-roll: roll fill received, re-bracketing' },
          ],
          next: 'BRACKETED',
        },
      ],
    },
    {
      name: 'TERMINAL',
      transitions: [],
    },
  ],
};

// ── 5. scale-out-then-rearm ───────────────────────────────────────────────────
//
// Scale out a portion via a take-profit synthetic. On fill, re-arm a fresh
// take-profit at a higher price on the residual. Self-loop until guard says
// remainingContracts <= 0.
//
// States: SCALING → SCALING (loop) | TERMINAL

const scaleOutThenRearmRaw = {
  id: 'scale-out-then-rearm',
  version: 1,
  maxTransitions: 200,
  initialState: 'SCALING',
  states: [
    {
      name: 'SCALING',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'take_profit',
            _templateHint: 'scale-out-tp-rung',
            targetPriceCents: 70,
            side: 'yes',
          },
        },
      ],
      transitions: [
        {
          // Position exhausted → terminate
          on: { kind: 'synthetic_fired', syntheticKind: 'take_profit' },
          guard: { field: 'remainingContracts', op: 'lte', value: 0 },
          actions: [
            { type: 'alert', channel: 'log', message: 'scale-out-then-rearm: position exhausted → TERMINAL' },
          ],
          next: 'TERMINAL',
        },
        {
          // Partial fill → re-arm at same or higher target
          on: { kind: 'synthetic_fired', syntheticKind: 'take_profit' },
          actions: [
            { type: 'alert', channel: 'log', message: 'scale-out-then-rearm: TP fill, re-arming on residual' },
          ],
          next: 'SCALING',
        },
      ],
    },
    {
      name: 'TERMINAL',
      transitions: [],
    },
  ],
};

// ── 6. time-decay-stop-loss ───────────────────────────────────────────────────
//
// As expiry approaches, tighten the stop-loss. Three time bands: early (>72h),
// mid (24–72h), final (<24h). Each tightening cancels the old stop and arms a
// tighter one. On any stop fire, TERMINAL.
//
// States: EARLY → MID → FINAL → TERMINAL
// Time transitions driven by time_elapsed events (72h, 48h, 24h relative to start).

const timeDecayStopLossRaw = {
  id: 'time-decay-stop-loss',
  version: 1,
  maxTransitions: 50,
  initialState: 'EARLY',
  states: [
    {
      name: 'EARLY',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'stop_loss',
            _templateHint: 'early-wide-stop',
            triggerPriceCents: 25,
            side: 'yes',
          },
        },
        { type: 'alert', channel: 'log', message: 'time-decay-stop-loss: EARLY — wide stop armed' },
      ],
      transitions: [
        {
          on: { kind: 'synthetic_fired', syntheticKind: 'stop_loss' },
          actions: [{ type: 'alert', channel: 'log', message: 'time-decay-stop-loss: stop fired in EARLY → TERMINAL' }],
          next: 'TERMINAL',
        },
        {
          // Advance to MID after 72 hours
          on: { kind: 'time_elapsed', durationMs: 259200000 },
          actions: [
            { type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } },
            { type: 'alert', channel: 'log', message: 'time-decay-stop-loss: 72h elapsed, tightening stop → MID' },
          ],
          next: 'MID',
        },
      ],
    },
    {
      name: 'MID',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'stop_loss',
            _templateHint: 'mid-stop',
            triggerPriceCents: 35,
            side: 'yes',
          },
        },
        { type: 'alert', channel: 'log', message: 'time-decay-stop-loss: MID — tighter stop armed' },
      ],
      transitions: [
        {
          on: { kind: 'synthetic_fired', syntheticKind: 'stop_loss' },
          actions: [{ type: 'alert', channel: 'log', message: 'time-decay-stop-loss: stop fired in MID → TERMINAL' }],
          next: 'TERMINAL',
        },
        {
          // Advance to FINAL after another 48 hours
          on: { kind: 'time_elapsed', durationMs: 172800000 },
          actions: [
            { type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } },
            { type: 'alert', channel: 'log', message: 'time-decay-stop-loss: 48h more elapsed, tightening → FINAL' },
          ],
          next: 'FINAL',
        },
      ],
    },
    {
      name: 'FINAL',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'stop_loss',
            _templateHint: 'final-tight-stop',
            triggerPriceCents: 45,
            side: 'yes',
          },
        },
        { type: 'alert', channel: 'log', message: 'time-decay-stop-loss: FINAL — tight stop armed (<24h)' },
      ],
      transitions: [
        {
          on: { kind: 'synthetic_fired', syntheticKind: 'stop_loss' },
          actions: [{ type: 'alert', channel: 'log', message: 'time-decay-stop-loss: stop fired in FINAL → TERMINAL' }],
          next: 'TERMINAL',
        },
        {
          on: { kind: 'time_elapsed', durationMs: 86400000 },
          actions: [
            { type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } },
            { type: 'run_strategy', strategy: 'S-losing', params: { _templateHint: 'expiry-forced-exit' } },
            { type: 'alert', channel: 'log', message: 'time-decay-stop-loss: expiry deadline hit, forced exit → TERMINAL' },
          ],
          next: 'TERMINAL',
        },
      ],
    },
    {
      name: 'TERMINAL',
      transitions: [],
    },
  ],
};

// ── 7. drawdown-then-flatten ──────────────────────────────────────────────────
//
// Monitor for a configurable drawdown from peak. On drawdown threshold breach
// (synthetic_fired for stop_loss), run S-aggressive to flatten the position
// immediately.
//
// States: WATCHING → FLATTENING → TERMINAL

const drawdownThenFlattenRaw = {
  id: 'drawdown-then-flatten',
  version: 1,
  maxTransitions: 50,
  initialState: 'WATCHING',
  states: [
    {
      name: 'WATCHING',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'trailing_stop',
            _templateHint: 'drawdown-trailing-stop',
            trailCents: 10,
            side: 'yes',
          },
        },
        { type: 'alert', channel: 'log', message: 'drawdown-then-flatten: WATCHING — drawdown guard armed' },
      ],
      transitions: [
        {
          on: { kind: 'synthetic_fired', syntheticKind: 'trailing_stop' },
          actions: [
            {
              type: 'run_strategy',
              strategy: 'S-aggressive',
              params: { _templateHint: 'flatten-on-drawdown', reason: 'drawdown_breach' },
            },
            { type: 'alert', channel: 'log', message: 'drawdown-then-flatten: drawdown breached, flattening position' },
          ],
          next: 'FLATTENING',
        },
      ],
    },
    {
      name: 'FLATTENING',
      transitions: [
        {
          on: { kind: 'fill_received' },
          actions: [{ type: 'alert', channel: 'log', message: 'drawdown-then-flatten: flatten fill received → TERMINAL' }],
          next: 'TERMINAL',
        },
      ],
    },
    {
      name: 'TERMINAL',
      transitions: [],
    },
  ],
};

// ── 8. profit-target-then-iceberg ─────────────────────────────────────────────
//
// Wait for a configurable profit target fill (take_profit synthetic fires).
// Then distribute the remaining position via S-iceberg (patient ladder exit).
//
// States: WAITING_TP → ICEBERGING → TERMINAL

const profitTargetThenIcebergRaw = {
  id: 'profit-target-then-iceberg',
  version: 1,
  maxTransitions: 50,
  initialState: 'WAITING_TP',
  states: [
    {
      name: 'WAITING_TP',
      onEntry: [
        {
          type: 'register_synthetic',
          synthetic: {
            kind: 'take_profit',
            _templateHint: 'profit-target-tp',
            targetPriceCents: 75,
            side: 'yes',
          },
        },
        { type: 'alert', channel: 'log', message: 'profit-target-then-iceberg: WAITING_TP — take-profit armed' },
      ],
      transitions: [
        {
          on: { kind: 'synthetic_fired', syntheticKind: 'take_profit' },
          actions: [
            { type: 'cancel_synthetic', syntheticId: { ref: 'last_registered' } },
            {
              type: 'run_strategy',
              strategy: 'S-iceberg',
              params: { _templateHint: 'iceberg-residual-after-tp' },
            },
            { type: 'alert', channel: 'log', message: 'profit-target-then-iceberg: TP hit, launching iceberg on residual' },
          ],
          next: 'ICEBERGING',
        },
      ],
    },
    {
      name: 'ICEBERGING',
      transitions: [
        {
          on: { kind: 'fill_received' },
          actions: [{ type: 'alert', channel: 'log', message: 'profit-target-then-iceberg: iceberg fill → TERMINAL' }],
          next: 'TERMINAL',
        },
      ],
    },
    {
      name: 'TERMINAL',
      transitions: [],
    },
  ],
};

// ── Module-load validation ────────────────────────────────────────────────────

export const CONTINUOUS_TRAILING = assertTemplate(continuousTrailingRaw, 'continuous-trailing');
export const TAKE_PROFIT_THEN_TRAIL = assertTemplate(takeProfitThenTrailRaw, 'take-profit-then-trail');
export const STOP_THEN_ROTATE = assertTemplate(stopThenRotateRaw, 'stop-then-rotate');
export const BRACKET_AND_ROLL = assertTemplate(bracketAndRollRaw, 'bracket-and-roll');
export const SCALE_OUT_THEN_REARM = assertTemplate(scaleOutThenRearmRaw, 'scale-out-then-rearm');
export const TIME_DECAY_STOP_LOSS = assertTemplate(timeDecayStopLossRaw, 'time-decay-stop-loss');
export const DRAWDOWN_THEN_FLATTEN = assertTemplate(drawdownThenFlattenRaw, 'drawdown-then-flatten');
export const PROFIT_TARGET_THEN_ICEBERG = assertTemplate(profitTargetThenIcebergRaw, 'profit-target-then-iceberg');

/** Ordered map of all prebuilt templates by id. */
export const WORKFLOW_TEMPLATES: ReadonlyMap<string, WorkflowDefinition> = new Map([
  [CONTINUOUS_TRAILING.id, CONTINUOUS_TRAILING],
  [TAKE_PROFIT_THEN_TRAIL.id, TAKE_PROFIT_THEN_TRAIL],
  [STOP_THEN_ROTATE.id, STOP_THEN_ROTATE],
  [BRACKET_AND_ROLL.id, BRACKET_AND_ROLL],
  [SCALE_OUT_THEN_REARM.id, SCALE_OUT_THEN_REARM],
  [TIME_DECAY_STOP_LOSS.id, TIME_DECAY_STOP_LOSS],
  [DRAWDOWN_THEN_FLATTEN.id, DRAWDOWN_THEN_FLATTEN],
  [PROFIT_TARGET_THEN_ICEBERG.id, PROFIT_TARGET_THEN_ICEBERG],
]);

/** Returns all template definitions as a sorted array (by id). */
export function listTemplates(): WorkflowDefinition[] {
  return [...WORKFLOW_TEMPLATES.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Returns a single template by id, or undefined. */
export function getTemplate(id: string): WorkflowDefinition | undefined {
  return WORKFLOW_TEMPLATES.get(id);
}
