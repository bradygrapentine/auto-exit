import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { KalshiAccountClient, parsePositionsResponse } from '../src/accountClient.js';
import type { ExitConfig } from '../src/types.js';

// Generate a real RSA keypair so the signer doesn't error.
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const pemPath = path.join(os.tmpdir(), `kea-test-key-${Date.now()}.pem`);
beforeAll(() => {
  fs.writeFileSync(pemPath, privateKey.export({ type: 'pkcs8', format: 'pem' }) as string);
  process.env.KEA_TEST_KEY = 'test-access-key';
  process.env.KEA_TEST_KEY_PATH = pemPath;
});
afterAll(() => {
  fs.rmSync(pemPath);
  delete process.env.KEA_TEST_KEY;
  delete process.env.KEA_TEST_KEY_PATH;
});

const cfg: ExitConfig = {
  baseUrl: 'https://api.elections.kalshi.com/trade-api/v2',
  localServerPort: 7777,
  marketTicker: 'KXTEST',
  heldSide: 'yes',
  positionSize: 100,
  chunkSize: 20,
  floorPriceCents: 1,
  orderbookDepth: 20,
  minLevelSize: 1,
  tailSweepThreshold: 0,
  mildAdaptive: false,
  minAdaptiveChunk: 1,
  maxOrders: 5,
  loopDelayMs: 0,
  dryRun: true,
  killSwitchPath: './STOP',
  apiKeyEnv: 'KEA_TEST_KEY',
  privateKeyPathEnv: 'KEA_TEST_KEY_PATH',
};

describe('parsePositionsResponse edge cases', () => {
  it('parses position_fp as float string', () => {
    const got = parsePositionsResponse(
      { market_positions: [{ ticker: 'X', position_fp: '12.50' }] },
      'X',
    );
    expect(got).toEqual({ ticker: 'X', side: 'yes', quantity: 12.5 });
  });

  it('treats null and missing market_positions as empty', () => {
    expect(() => parsePositionsResponse(null, 'X')).toThrow(/No position held/);
    expect(() => parsePositionsResponse({ market_positions: null }, 'X')).toThrow();
  });

  it('rejects when position_fp is non-numeric string', () => {
    expect(() => parsePositionsResponse(
      { market_positions: [{ ticker: 'X', position_fp: 'NaN' }] },
      'X',
    )).toThrow(/No position held/);
  });
});

describe('KalshiAccountClient.getPosition (mocked fetch)', () => {
  it('signs the request, calls /portfolio/positions (no query), filters client-side', async () => {
    const fetchSpy = vi.fn(async (url: string, init?: RequestInit) => {
      // Verify the URL has no query string and includes the expected path
      expect(url).toBe('https://api.elections.kalshi.com/trade-api/v2/portfolio/positions');
      // Verify the auth headers are present
      const headers = init?.headers as Record<string, string>;
      expect(headers['KALSHI-ACCESS-KEY']).toBe('test-access-key');
      expect(headers['KALSHI-ACCESS-SIGNATURE']).toBeTruthy();
      expect(headers['KALSHI-ACCESS-TIMESTAMP']).toBeTruthy();
      return new Response(JSON.stringify({
        market_positions: [
          { ticker: 'OTHER', position_fp: '50.00' },
          { ticker: 'KXTEST', position_fp: '100.00' },
        ],
      }), { status: 200 });
    });
    const original = globalThis.fetch;
    globalThis.fetch = fetchSpy as any;
    try {
      const client = new KalshiAccountClient(cfg);
      const got = await client.getPosition('KXTEST');
      expect(got).toEqual({ ticker: 'KXTEST', side: 'yes', quantity: 100 });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('throws on non-200 response', async () => {
    const fetchSpy = vi.fn(async () => new Response('forbidden', { status: 403 }));
    const original = globalThis.fetch;
    globalThis.fetch = fetchSpy as any;
    try {
      const client = new KalshiAccountClient(cfg);
      await expect(client.getPosition('KXTEST')).rejects.toThrow(/getPosition failed: 403/);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('throws when env vars are unset', async () => {
    const k = process.env.KEA_TEST_KEY;
    delete process.env.KEA_TEST_KEY;
    try {
      const client = new KalshiAccountClient(cfg);
      await expect(client.getPosition('KXTEST')).rejects.toThrow(/Missing/);
    } finally {
      process.env.KEA_TEST_KEY = k;
    }
  });
});
