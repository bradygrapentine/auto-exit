/**
 * marketCategory.ts — ticker-prefix → market category mapping.
 *
 * Pure function: no I/O, no side effects.
 */

export type MarketCategory = 'nfl' | 'entertainment' | 'political' | 'weather' | 'other';

// Longest-prefix-first table; first match wins.
const PREFIX_TABLE: Array<[string, MarketCategory]> = [
  ['KXNFL',     'nfl'],
  ['KXMETGALA', 'entertainment'],
  ['KXEMMY',    'entertainment'],
  ['KXOSCAR',   'entertainment'],
  ['KXPRES',    'political'],
  ['KXSEN',     'political'],
  ['KXHOUSE',   'political'],
  ['KXTEMP',    'weather'],
  ['KXSNOW',    'weather'],
];

/**
 * Categorize a Kalshi market ticker by its prefix.
 *
 * Comparison is case-insensitive. Unrecognized prefixes → 'other'.
 */
export function categorizeTicker(ticker: string): MarketCategory {
  const upper = ticker.toUpperCase();
  for (const [prefix, category] of PREFIX_TABLE) {
    if (upper.startsWith(prefix)) return category;
  }
  return 'other';
}
