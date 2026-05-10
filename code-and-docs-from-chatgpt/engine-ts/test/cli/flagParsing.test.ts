/**
 * flagParsing.test.ts — SH-AGGRESSIVE-CLI-FLAG-PARSING
 *
 * Pin parseFlags' contract for the three boolean forms operators use, plus
 * boolFlag's tolerance over them. The 2026-05-09 MOVVA aggressive call was
 * filed because `--one-tick-in true` allegedly resolved to false; tests
 * here lock the behaviour down.
 */

import { describe, it, expect } from 'vitest';
import { parseFlags, boolFlag } from '../../src/cli.js';

describe('parseFlags — boolean forms', () => {
  it.each([
    [['--one-tick-in'],          { 'one-tick-in': 'true' }],
    [['--one-tick-in=true'],     { 'one-tick-in': 'true' }],
    [['--one-tick-in', 'true'],  { 'one-tick-in': 'true' }],
    [['--one-tick-in=false'],    { 'one-tick-in': 'false' }],
    [['--one-tick-in', 'false'], { 'one-tick-in': 'false' }],
    [[],                         {}],
  ])('parses %j as %j', (argv, expected) => {
    expect(parseFlags(argv)).toMatchObject(expected);
  });

  it('does NOT mangle the key when = is present', () => {
    const out = parseFlags(['--one-tick-in=true']);
    expect(out['one-tick-in']).toBe('true');
    expect(out['one-tick-in=true']).toBeUndefined();
  });

  it('handles multiple flags including mixed forms', () => {
    const out = parseFlags(['--ticker', 'KX-A', '--one-tick-in=true', '--side', 'no']);
    expect(out.ticker).toBe('KX-A');
    expect(out['one-tick-in']).toBe('true');
    expect(out.side).toBe('no');
  });
});

describe('boolFlag', () => {
  it('returns default when flag absent', () => {
    expect(boolFlag({}, 'x')).toBe(false);
    expect(boolFlag({}, 'x', true)).toBe(true);
  });

  it.each([
    ['true', true],
    ['TRUE', true],
    ['1', true],
    ['yes', true],
    ['false', false],
    ['FALSE', false],
    ['0', false],
    ['no', false],
  ])('parses %s as %j', (val, expected) => {
    expect(boolFlag({ x: val }, 'x')).toBe(expected);
  });

  it('falls back to default for unknown values', () => {
    expect(boolFlag({ x: 'maybe' }, 'x', true)).toBe(true);
    expect(boolFlag({ x: 'maybe' }, 'x', false)).toBe(false);
  });
});
