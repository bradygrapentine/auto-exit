import { describe, it, expect } from 'vitest';
import { KeaNotConfiguredError, validateKeyFile, upsertProfile, loadActive, getActive, listProfiles } from '../src/credentials.js';
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

function withTempHome<T>(fn: () => Promise<T> | T): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-home-'));
  const prev = process.env.KEA_HOME;
  process.env.KEA_HOME = dir;
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      process.env.KEA_HOME = prev;
      fs.rmSync(dir, { recursive: true, force: true });
    });
}

const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');

describe('credentials file round-trip', () => {
  it('upsertProfile then loadActive returns same fields', async () => {
    await withTempHome(async () => {
      upsertProfile('prod', { keyId: 'AKID-PROD-WXYZ', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      const active = loadActive();
      expect(active.profileName).toBe('prod');
      expect(active.keyId).toBe('AKID-PROD-WXYZ');
      expect(active.keyPath).toBe(FIXTURE);
      expect(active.baseUrl).toBe('https://api.elections.kalshi.com/trade-api/v2');
    });
  });

  it('file mode is 0o600 after write', async () => {
    await withTempHome(async () => {
      upsertProfile('demo', { keyId: 'X', keyPath: FIXTURE, baseUrl: 'https://demo-api.kalshi.co/trade-api/v2' });
      const stat = fs.statSync(path.join(process.env.KEA_HOME!, 'credentials.json'));
      expect(stat.mode & 0o777).toBe(0o600);
    });
  });

  it('listProfiles and getActive', async () => {
    await withTempHome(async () => {
      upsertProfile('demo', { keyId: 'D', keyPath: FIXTURE, baseUrl: 'https://demo-api.kalshi.co/trade-api/v2' });
      upsertProfile('prod', { keyId: 'P', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      expect(listProfiles().sort()).toEqual(['demo', 'prod']);
      expect(getActive()).toBe('demo'); // first inserted becomes active
    });
  });

  it('throws KeaNotConfiguredError when no file and no env', async () => {
    await withTempHome(async () => {
      const prevKey = process.env.KALSHI_ACCESS_KEY;
      const prevPath = process.env.KALSHI_PRIVATE_KEY_PATH;
      delete process.env.KALSHI_ACCESS_KEY;
      delete process.env.KALSHI_PRIVATE_KEY_PATH;
      try {
        expect(() => loadActive()).toThrow(KeaNotConfiguredError);
      } finally {
        if (prevKey) process.env.KALSHI_ACCESS_KEY = prevKey;
        if (prevPath) process.env.KALSHI_PRIVATE_KEY_PATH = prevPath;
      }
    });
  });

  it('falls back to env when file absent', async () => {
    await withTempHome(async () => {
      process.env.KALSHI_ACCESS_KEY = 'ENVKEY';
      process.env.KALSHI_PRIVATE_KEY_PATH = FIXTURE;
      try {
        const active = loadActive();
        expect(active.profileName).toBe('env');
        expect(active.keyId).toBe('ENVKEY');
        expect(active.keyPath).toBe(FIXTURE);
      } finally {
        delete process.env.KALSHI_ACCESS_KEY;
        delete process.env.KALSHI_PRIVATE_KEY_PATH;
      }
    });
  });
});
