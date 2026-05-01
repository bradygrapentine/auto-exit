import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parsePositionsResponse } from '../src/accountClient.js';

const fixturePath = path.resolve(__dirname, 'fixtures', 'positions.real.json');

describe('parsePositionsResponse against real prod fixture', () => {
  const exists = fs.existsSync(fixturePath);
  const fixture = exists ? JSON.parse(fs.readFileSync(fixturePath, 'utf8')) : null;

  it.skipIf(!exists)('parses a long YES holding (positive position_fp)', () => {
    const got = parsePositionsResponse(fixture, 'KXMOVVAREDISTRICT-26APR21-YES-P1');
    expect(got.side).toBe('yes');
    expect(got.quantity).toBeGreaterThan(0);
    expect(got.ticker).toBe('KXMOVVAREDISTRICT-26APR21-YES-P1');
  });

  it.skipIf(!exists)('parses a short YES holding as effectively NO (negative position_fp)', () => {
    const got = parsePositionsResponse(fixture, 'KXMOVVAREDISTRICT-26APR21-YES-P4');
    expect(got.side).toBe('no');
    expect(got.quantity).toBeGreaterThan(0);
  });

  it.skipIf(!exists)('throws when position_fp is "0.00"', () => {
    expect(() => parsePositionsResponse(fixture, 'KXNBA1STTEAM-26-LDON')).toThrow(/No position held/);
  });

  it.skipIf(!exists)('throws when ticker is not in the response', () => {
    expect(() => parsePositionsResponse(fixture, 'NOPE-NOT-REAL')).toThrow(/No position held/);
  });

  // Unit-style tests (do not need the fixture, run regardless)
  it('handles position field as a number (legacy shape)', () => {
    const got = parsePositionsResponse(
      { market_positions: [{ ticker: 'X', position: -500 }] },
      'X',
    );
    expect(got).toEqual({ ticker: 'X', side: 'no', quantity: 500 });
  });

  it('handles missing market_positions array', () => {
    expect(() => parsePositionsResponse({}, 'X')).toThrow(/No position held/);
  });
});
