import { describe, it, expect } from 'vitest';
import { KeaNotConfiguredError } from '../src/credentials.js';

describe('KeaNotConfiguredError', () => {
  it('extends Error with name set', () => {
    const e = new KeaNotConfiguredError('nope');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('KeaNotConfiguredError');
    expect(e.message).toBe('nope');
  });
});
