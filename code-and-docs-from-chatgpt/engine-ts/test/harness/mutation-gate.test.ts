import { describe, it, expect } from 'vitest';
import { DEMO_BASE_URL } from '../../src/credentials.js';
import { assertDemoBaseUrl } from './runner.js';

describe('assertDemoBaseUrl', () => {
  it('throws on prod URL', () => {
    expect(() =>
      assertDemoBaseUrl('https://api.elections.kalshi.com/trade-api/v2'),
    ).toThrow(/Expected canonical Kalshi demo/);
  });

  it('throws on substring-trick URL (demo.malicious.example)', () => {
    expect(() =>
      assertDemoBaseUrl('https://demo.malicious.example/api'),
    ).toThrow(/Expected canonical Kalshi demo/);
  });

  it('does NOT throw on canonical demo URL', () => {
    expect(() => assertDemoBaseUrl(DEMO_BASE_URL)).not.toThrow();
  });
});
