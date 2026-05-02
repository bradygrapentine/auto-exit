import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { diffKeys, recordLatency } from './runner.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

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

describe('recordLatency', () => {
  let tmpFile: string;

  beforeEach(() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-latency-'));
    tmpFile = path.join(dir, 'p95.json');
  });

  afterEach(() => {
    fs.rmSync(path.dirname(tmpFile), { recursive: true, force: true });
  });

  it('keeps budgetMs at 5000 with fewer than 20 samples', () => {
    for (let i = 0; i < 5; i++) {
      recordLatency('foo', 100, tmpFile);
    }
    const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    expect(data['foo'].budgetMs).toBe(5000);
    expect(data['foo'].samples).toHaveLength(5);
  });

  it('switches to p95-based budget at 20+ samples', () => {
    // 25 samples all at 100ms → p95 = 100ms → budgetMs = max(200, 1000) = 1000
    for (let i = 0; i < 25; i++) {
      recordLatency('bar', 100, tmpFile);
    }
    const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    // budget should be p95-based: max(100 * 2, 1000) = 1000
    expect(data['bar'].budgetMs).toBe(1000);
    expect(data['bar'].budgetMs).not.toBe(5000);
  });
});
