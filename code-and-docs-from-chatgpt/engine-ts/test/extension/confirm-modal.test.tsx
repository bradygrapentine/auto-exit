import { describe, it, expect } from 'vitest';
import { isConfirmEnabled } from '../../../extension/popup/ConfirmModal';

describe('isConfirmEnabled', () => {
  it('exact match → enabled', () => {
    expect(isConfirmEnabled('KX-BTCUSD', 'KX-BTCUSD')).toBe(true);
  });

  it('wrong string → disabled', () => {
    expect(isConfirmEnabled('KX-WRONG', 'KX-BTCUSD')).toBe(false);
  });

  it('empty string → disabled', () => {
    expect(isConfirmEnabled('', 'KX-BTCUSD')).toBe(false);
  });

  it('case mismatch → enabled (case-insensitive)', () => {
    expect(isConfirmEnabled('kx-btcusd', 'KX-BTCUSD')).toBe(true);
  });

  it('leading/trailing whitespace trimmed → enabled', () => {
    expect(isConfirmEnabled('  KX-BTCUSD  ', 'KX-BTCUSD')).toBe(true);
  });

  it('whitespace-only string → disabled', () => {
    expect(isConfirmEnabled('   ', 'KX-BTCUSD')).toBe(false);
  });
});
