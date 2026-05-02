import { describe, it, expect } from 'vitest';
import { diffKeys } from './runner.js';

describe('diffKeys', () => {
  it('detects added fields', () => {
    const a = { properties: { x: { type: 'number' } } };
    const b = { properties: { x: { type: 'number' }, y: { type: 'string' } } };
    expect(diffKeys(a, b)).toEqual(['+ y']);
  });
  it('detects removed fields', () => {
    const a = { properties: { x: { type: 'number' }, y: { type: 'string' } } };
    const b = { properties: { x: { type: 'number' } } };
    expect(diffKeys(a, b)).toEqual(['- y']);
  });
  it('detects type changes', () => {
    const a = { properties: { x: { type: 'number' } } };
    const b = { properties: { x: { type: 'string' } } };
    expect(diffKeys(a, b)).toEqual(['~ x: number -> string']);
  });
  it('returns empty for identical schemas', () => {
    const a = { properties: { x: { type: 'number' } } };
    expect(diffKeys(a, a)).toEqual([]);
  });
});
