/**
 * whoami-safety-routes.test.ts
 * Integration tests for SP1.7 /whoami and SP1.8 /safety/* routes.
 */

import http from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer } from '../../src/server.js';
import type { ExitConfig } from '../../src/types.js';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock safety module to avoid real filesystem I/O
vi.mock('../../src/safety.js', () => ({
  getSafety: vi.fn(() => ({
    version: 1,
    safetySubmittedMultiple: 1.1,
    floorPriceCents: 5,
    tailSweepThreshold: 0,
    forbiddenTickers: [],
  })),
  addForbiddenTicker: vi.fn((ticker: string, reason: string, addedBy: string) => ({
    ticker,
    reason,
    addedAt: '2026-01-01T00:00:00Z',
    addedBy,
  })),
  removeForbiddenTicker: vi.fn((_ticker: string) => true),
}));

// ── Setup ────────────────────────────────────────────────────────────────────

const exitCfg: ExitConfig = {
  baseUrl: 'https://test.example',
  localServerPort: 0,
  marketTicker: 'KX',
  heldSide: 'yes',
  positionSize: 10,
  chunkSize: 5,
  floorPriceCents: 1,
  orderbookDepth: 20,
  dryRun: true,
};

let server: http.Server;
let base: string;

beforeEach(async () => {
  server = createServer(exitCfg);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as { port: number };
  base = `http://127.0.0.1:${addr.port}`;
});

afterEach(async () => {
  vi.clearAllMocks();
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

async function post(path: string, body: unknown) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function del(path: string) {
  return fetch(`${base}${path}`, { method: 'DELETE' });
}

// ── GET /whoami ───────────────────────────────────────────────────────────────

describe('GET /whoami', () => {
  it('returns 200 with active=default and available=[default]', async () => {
    const res = await fetch(`${base}/whoami`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.active).toBe('default');
    expect(body.available).toEqual(['default']);
  });
});

// ── POST /whoami ──────────────────────────────────────────────────────────────

describe('POST /whoami', () => {
  it('returns 501 not implemented', async () => {
    const res = await post('/whoami', { profile: 'prod' });
    expect(res.status).toBe(501);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/not implemented/i);
  });
});

// ── GET /safety ───────────────────────────────────────────────────────────────

describe('GET /safety', () => {
  it('returns 200 with safety config', async () => {
    const res = await fetch(`${base}/safety`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.safety.version).toBe(1);
    expect(body.safety.safetySubmittedMultiple).toBe(1.1);
    expect(Array.isArray(body.safety.forbiddenTickers)).toBe(true);
  });
});

// ── POST /safety/forbidden/add ────────────────────────────────────────────────

describe('POST /safety/forbidden/add', () => {
  it('returns 200 with entry on valid request', async () => {
    const res = await post('/safety/forbidden/add', { ticker: 'KXABC', reason: 'test reason' });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.entry.ticker).toBe('KXABC');
    expect(body.entry.reason).toBe('test reason');
  });

  it('returns 400 when ticker is missing', async () => {
    const res = await post('/safety/forbidden/add', { reason: 'no ticker' });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/ticker/);
  });

  it('returns 400 when reason is missing', async () => {
    const res = await post('/safety/forbidden/add', { ticker: 'KXABC' });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/reason/);
  });

  it('returns 400 on invalid JSON', async () => {
    const res = await fetch(`${base}/safety/forbidden/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    expect(res.status).toBe(400);
  });

  it('passes addedBy=extension to addForbiddenTicker', async () => {
    const { addForbiddenTicker } = await import('../../src/safety.js');
    await post('/safety/forbidden/add', { ticker: 'KXABC', reason: 'r' });
    expect(addForbiddenTicker).toHaveBeenCalledWith('KXABC', 'r', 'extension');
  });
});

// ── DELETE /safety/forbidden/:ticker ─────────────────────────────────────────

describe('DELETE /safety/forbidden/:ticker', () => {
  it('returns 200 when ticker removed', async () => {
    const res = await del('/safety/forbidden/KXABC');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.removed).toBe(true);
  });

  it('returns 404 when ticker not on list', async () => {
    const { removeForbiddenTicker } = await import('../../src/safety.js');
    (removeForbiddenTicker as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
    const res = await del('/safety/forbidden/UNKNOWN');
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/UNKNOWN/);
  });

  it('decodes URL-encoded ticker', async () => {
    const { removeForbiddenTicker } = await import('../../src/safety.js');
    await del('/safety/forbidden/KX%2FABC');
    expect(removeForbiddenTicker).toHaveBeenCalledWith('KX/ABC');
  });
});
