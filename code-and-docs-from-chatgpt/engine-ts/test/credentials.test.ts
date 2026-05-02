import { describe, it, expect } from 'vitest';
import { KeaNotConfiguredError, validateKeyFile } from '../src/credentials.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

describe('KeaNotConfiguredError', () => {
  it('extends Error with name set', () => {
    const e = new KeaNotConfiguredError('nope');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('KeaNotConfiguredError');
    expect(e.message).toBe('nope');
  });
});

describe('validateKeyFile', () => {
  it('accepts a real RSA PEM', async () => {
    const fixture = path.resolve(__dirname, 'fixtures/test-rsa.pem');
    await expect(validateKeyFile(fixture)).resolves.toBeUndefined();
  });

  it('rejects missing file', async () => {
    await expect(validateKeyFile('/no/such/file.pem')).rejects.toThrow();
  });

  it('rejects garbage content', async () => {
    const tmp = path.join(os.tmpdir(), `kea-bad-${Date.now()}.pem`);
    fs.writeFileSync(tmp, 'not a key');
    try {
      await expect(validateKeyFile(tmp)).rejects.toThrow();
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});
