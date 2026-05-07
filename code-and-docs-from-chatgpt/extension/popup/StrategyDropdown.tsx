/**
 * StrategyDropdown.tsx
 * Header dropdown that lets the operator pick which strategy to launch.
 * Replaces the implicit "exit current position" mode.
 */

import { STRATEGY_REGISTRY, listStrategyIds } from '../../engine-ts/src/strategies/registry';
import type { StrategyId, DangerLevel } from '../../engine-ts/src/strategies/registry';

// ── Helpers ──────────────────────────────────────────────────────────────────

export { STRATEGY_REGISTRY, listStrategyIds };
export type { StrategyId, DangerLevel };

export function dangerColor(level: DangerLevel): string {
  switch (level) {
    case 'high':   return '#b91c1c';
    case 'medium': return '#b45309';
    case 'low':    return '#15803d';
  }
}

export function dangerLabel(level: DangerLevel): string {
  switch (level) {
    case 'high':   return '⚠ HIGH';
    case 'medium': return '~ MED';
    case 'low':    return '✓ LOW';
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface StrategyDropdownProps {
  selected: StrategyId | '';
  onChange: (id: StrategyId) => void;
}

export function StrategyDropdown({ selected, onChange }: StrategyDropdownProps) {
  const ids = listStrategyIds();

  return (
    <div
      data-testid="strategy-dropdown-wrapper"
      style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      <label
        htmlFor="strategy-select"
        style={{ fontSize: 11, color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}
      >
        Strategy
      </label>
      <select
        id="strategy-select"
        data-testid="strategy-select"
        value={selected}
        onChange={(e) => onChange(e.target.value as StrategyId)}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: 12,
          fontFamily: 'system-ui, sans-serif',
          borderRadius: 4,
          border: '1px solid #d1d5db',
          background: '#fff',
        }}
        aria-label="Select strategy"
      >
        <option value="">— select strategy —</option>
        {ids.map((id) => {
          const meta = STRATEGY_REGISTRY[id];
          return (
            <option key={id} value={id} data-danger={meta.dangerLevel}>
              {meta.displayName}
              {meta.dangerLevel === 'high' ? ' ⚠' : meta.dangerLevel === 'medium' ? ' ~' : ''}
            </option>
          );
        })}
      </select>
      {/* Danger chip rendered below dropdown when a high/medium strategy is selected */}
      {selected !== '' && STRATEGY_REGISTRY[selected].dangerLevel !== 'low' && (
        <div
          data-testid="danger-chip"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: 10,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 700,
            color: '#fff',
            background: dangerColor(STRATEGY_REGISTRY[selected].dangerLevel),
            marginTop: 2,
            alignSelf: 'flex-start',
          }}
        >
          {dangerLabel(STRATEGY_REGISTRY[selected].dangerLevel)}
          {' '}
          {STRATEGY_REGISTRY[selected].shortDescription.slice(0, 40)}
          {STRATEGY_REGISTRY[selected].shortDescription.length > 40 ? '…' : ''}
        </div>
      )}
    </div>
  );
}
