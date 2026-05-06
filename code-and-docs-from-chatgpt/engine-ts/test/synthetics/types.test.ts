import { describe, it, expect } from 'vitest';
import type {
  Synthetic, SyntheticKind, SyntheticState, SyntheticParams,
  StopLossParams, TrailingStopState, TakeProfitParams, TakeProfitState,
  OcoState, JournalKind, WatcherConfig, SyntheticEvalResult,
} from '../../src/types.js';

describe('Synthetic types', () => {
  it('SyntheticKind enumerates v1 set', () => {
    const valid: SyntheticKind[] = [
      'stop_loss', 'stop_limit', 'trailing_stop', 'take_profit', 'oco', 'bracket',
    ];
    expect(valid).toHaveLength(6);
  });

  it('Synthetic carries id, kind, ticker, side, position, params, state, status', () => {
    const s: Synthetic = {
      id: 'syn-1', kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 100,
      params: { triggerPriceCents: 30 } as StopLossParams,
      state: {}, status: 'armed',
      createdAt: '2026-05-05T00:00:00Z',
      selfTradePrevention: 'taker_at_cross',
      autoCancelOnZeroPosition: true,
    };
    expect(s.kind).toBe('stop_loss');
    expect(s.status).toBe('armed');
  });

  it('TrailingStopState uses float peakBidCentsExact', () => {
    const st: TrailingStopState = { peakBidCentsExact: 4.7 };
    expect(st.peakBidCentsExact).toBeCloseTo(4.7);
  });

  it('TakeProfitState tracks firedRungIndices', () => {
    const st: TakeProfitState = { firedRungIndices: [0, 2] };
    expect(st.firedRungIndices).toEqual([0, 2]);
  });

  it('OcoState carries childIds and firedChildId', () => {
    const st: OcoState = { childIds: ['a', 'b'], firedChildId: 'a' };
    expect(st.childIds).toEqual(['a', 'b']);
  });

  it('JournalKind union includes all six synthetic events', () => {
    const kinds: JournalKind[] = [
      'synthetic_registered', 'synthetic_fire_pending',
      'synthetic_fired', 'synthetic_fire_failed',
      'synthetic_canceled', 'synthetic_state_update',
    ];
    expect(kinds).toHaveLength(6);
  });

  it('WatcherConfig holds adaptive cadence and orderbookDepth', () => {
    const w: WatcherConfig = {
      apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z',
      pollIntervalMs: 2000, nearTriggerCadenceMs: 250,
      nearTriggerThresholdCents: 3, idleIntervalMs: 10000,
      orderbookDepth: 20,
    };
    expect(w.orderbookDepth).toBe(20);
  });

  it('SyntheticEvalResult carries fire, reason, newState, cancelSiblings', () => {
    const r: SyntheticEvalResult = { fire: true, reason: 'x', cancelSiblings: ['y'] };
    expect(r.fire).toBe(true);
  });

  // Suppress unused-import lint warnings; these types are imported for compile-time coverage.
  it('imports compile', () => {
    const _params: SyntheticParams | undefined = undefined;
    const _state: SyntheticState | undefined = undefined;
    const _tp: TakeProfitParams | undefined = undefined;
    const _tps: TakeProfitState | undefined = undefined;
    expect(_params).toBeUndefined();
    expect(_state).toBeUndefined();
    expect(_tp).toBeUndefined();
    expect(_tps).toBeUndefined();
  });
});
