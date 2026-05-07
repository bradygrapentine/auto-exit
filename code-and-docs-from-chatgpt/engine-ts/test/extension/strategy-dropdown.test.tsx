/**
 * strategy-dropdown.test.tsx
 * Tests for extension/popup/StrategyDropdown.tsx.
 *
 * Pattern: logic-only exports — no jsdom/react-dom. Matches the convention used
 * in confirm-modal.test.tsx and synthetics-view.test.tsx.
 */

import { describe, it, expect } from 'vitest';
import {
  dangerColor,
  dangerLabel,
  STRATEGY_REGISTRY,
  listStrategyIds,
} from '../../../extension/popup/StrategyDropdown';
import type { StrategyId, DangerLevel } from '../../../extension/popup/StrategyDropdown';

// ── dangerColor ───────────────────────────────────────────────────────────────

describe('dangerColor', () => {
  it('high → red', () => {
    expect(dangerColor('high')).toBe('#b91c1c');
  });

  it('medium → amber', () => {
    expect(dangerColor('medium')).toBe('#b45309');
  });

  it('low → green', () => {
    expect(dangerColor('low')).toBe('#15803d');
  });
});

// ── dangerLabel ───────────────────────────────────────────────────────────────

describe('dangerLabel', () => {
  it('high → ⚠ HIGH', () => {
    expect(dangerLabel('high')).toBe('⚠ HIGH');
  });

  it('medium → ~ MED', () => {
    expect(dangerLabel('medium')).toBe('~ MED');
  });

  it('low → ✓ LOW', () => {
    expect(dangerLabel('low')).toBe('✓ LOW');
  });
});

// ── Registry shape via re-export ──────────────────────────────────────────────

describe('STRATEGY_REGISTRY re-export', () => {
  it('has exactly 14 entries', () => {
    const ids = listStrategyIds();
    expect(ids).toHaveLength(14);
  });

  it('dropdown would render 14 option elements (ids array length)', () => {
    expect(listStrategyIds().length).toBe(14);
  });

  it('all strategies have a displayName', () => {
    for (const id of listStrategyIds()) {
      expect(STRATEGY_REGISTRY[id].displayName).toBeTruthy();
    }
  });

  it('danger badges: 3 high, 5 medium, 6 low', () => {
    const counts: Record<DangerLevel, number> = { high: 0, medium: 0, low: 0 };
    for (const id of listStrategyIds()) {
      counts[STRATEGY_REGISTRY[id].dangerLevel]++;
    }
    expect(counts.high).toBe(3);
    expect(counts.medium).toBe(5);
    expect(counts.low).toBe(6);
  });

  it('s-aggressive is dangerLevel high', () => {
    expect(STRATEGY_REGISTRY['s-aggressive'].dangerLevel).toBe('high');
  });

  it('s-pre-resolution-arb is dangerLevel high', () => {
    expect(STRATEGY_REGISTRY['s-pre-resolution-arb'].dangerLevel).toBe('high');
  });

  it('s-time-emergency is dangerLevel high', () => {
    expect(STRATEGY_REGISTRY['s-time-emergency'].dangerLevel).toBe('high');
  });

  it('s-twap is dangerLevel low', () => {
    expect(STRATEGY_REGISTRY['s-twap'].dangerLevel).toBe('low');
  });

  it('s-pair is dangerLevel medium', () => {
    expect(STRATEGY_REGISTRY['s-pair'].dangerLevel).toBe('medium');
  });

  it('option label suffix: high strategies get ⚠ suffix indicator', () => {
    const highIds = listStrategyIds().filter(
      (id) => STRATEGY_REGISTRY[id].dangerLevel === 'high',
    );
    // All 3 high entries should have ⚠ in their dangerLabel
    for (const id of highIds) {
      expect(dangerLabel(STRATEGY_REGISTRY[id].dangerLevel)).toContain('⚠');
    }
  });

  it('IDs in listStrategyIds() match the STRATEGY_REGISTRY keys', () => {
    const ids = listStrategyIds();
    for (const id of ids) {
      expect(STRATEGY_REGISTRY[id]).toBeDefined();
      expect(STRATEGY_REGISTRY[id].id).toBe(id);
    }
  });
});

// ── Keyboard / accessibility concern: deterministic order ─────────────────────

describe('listStrategyIds determinism', () => {
  it('returns same order on repeated calls (keyboard nav is stable)', () => {
    const a = listStrategyIds() as StrategyId[];
    const b = listStrategyIds() as StrategyId[];
    expect(a).toEqual(b);
  });
});
