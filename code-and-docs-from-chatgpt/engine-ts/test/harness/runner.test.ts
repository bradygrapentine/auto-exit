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

  it('detects added field inside array items', () => {
    const a = { type: 'array', items: { type: 'object', properties: { x: { type: 'string' } } } };
    const b = { type: 'array', items: { type: 'object', properties: { x: { type: 'string' }, y: { type: 'number' } } } };
    expect(diffKeys(a, b)).toEqual(['+ [].y']);
  });

  it('detects enum widening (enum -> string)', () => {
    const aWrapped = { properties: { kind: { type: 'string', enum: ['a', 'b'] } } };
    const bWrapped = { properties: { kind: { type: 'string' } } };
    expect(diffKeys(aWrapped, bWrapped)).toEqual(['~ kind: enum -> string']);
  });

  it('detects drift inside array items (top-level array schema)', () => {
    const a = { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } } } };
    const b = { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, extra: { type: 'boolean' } } } };
    const result = diffKeys(a, b);
    expect(result).toContain('+ [].extra');
  });
});
