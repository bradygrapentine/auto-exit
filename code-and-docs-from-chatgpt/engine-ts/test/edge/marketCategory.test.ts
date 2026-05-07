/**
 * marketCategory.test.ts — prefix table coverage for categorizeTicker.
 */

import { describe, it, expect } from 'vitest';
import { categorizeTicker } from '../../src/edge/marketCategory.js';

describe('categorizeTicker', () => {
  it('maps KXNFL tickers to nfl', () => {
    expect(categorizeTicker('KXNFL-2024-WC-KC')).toBe('nfl');
    expect(categorizeTicker('kxnfl-anything')).toBe('nfl');  // case-insensitive
  });

  it('maps KXMETGALA to entertainment', () => {
    expect(categorizeTicker('KXMETGALA-2025')).toBe('entertainment');
  });

  it('maps KXEMMY to entertainment', () => {
    expect(categorizeTicker('KXEMMY-2024-BESTDRAMA')).toBe('entertainment');
  });

  it('maps KXOSCAR to entertainment', () => {
    expect(categorizeTicker('KXOSCAR-BESTPICTURE')).toBe('entertainment');
  });

  it('maps KXPRES to political', () => {
    expect(categorizeTicker('KXPRES-2024-D')).toBe('political');
  });

  it('maps KXSEN to political', () => {
    expect(categorizeTicker('KXSEN-GA-2024')).toBe('political');
  });

  it('maps KXHOUSE to political', () => {
    expect(categorizeTicker('KXHOUSE-CA05')).toBe('political');
  });

  it('maps KXTEMP to weather', () => {
    expect(categorizeTicker('KXTEMP-NYC-JAN')).toBe('weather');
  });

  it('maps KXSNOW to weather', () => {
    expect(categorizeTicker('KXSNOW-CHI-DEC')).toBe('weather');
  });

  it('returns other for unknown prefix', () => {
    expect(categorizeTicker('KXCRYPTO-BTC')).toBe('other');
    expect(categorizeTicker('UNKNOWN')).toBe('other');
    expect(categorizeTicker('')).toBe('other');
  });

  it('KXMETGALA beats KXPRES (longer prefix wins)', () => {
    // Ensure prefix ordering doesn't misclassify
    expect(categorizeTicker('KXMETGALA')).toBe('entertainment');
  });
});
