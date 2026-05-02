import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const pemPath = path.join(os.tmpdir(), `kea-tui-test-key-${Date.now()}.pem`);
let keaHomeDir: string;

beforeAll(() => {
  fs.writeFileSync(pemPath, privateKey.export({ type: 'pkcs8', format: 'pem' }) as string);
  process.env.KALSHI_ACCESS_KEY = 'test-access-key';
  process.env.KALSHI_PRIVATE_KEY_PATH = pemPath;
  keaHomeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-tui-home-'));
  process.env.KEA_HOME = keaHomeDir;
});

afterAll(() => {
  fs.rmSync(pemPath);
  fs.rmSync(keaHomeDir, { recursive: true, force: true });
  delete process.env.KALSHI_ACCESS_KEY;
  delete process.env.KALSHI_PRIVATE_KEY_PATH;
  delete process.env.KEA_HOME;
  delete process.env.KALSHI_BASE_URL;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => handler(url, init)));
}

describe('tui/api fetchBalance', () => {
  it('parses cents → dollars and signs the request', async () => {
    const { fetchBalance } = await import('../src/tui/api.js');
    let seenHeaders: Record<string, string> | undefined;
    mockFetch(async (url, init) => {
      expect(url).toBe('https://api.elections.kalshi.com/trade-api/v2/portfolio/balance');
      seenHeaders = init?.headers as Record<string, string>;
      return new Response(JSON.stringify({ balance: 12345, portfolio_value: 67890 }), { status: 200 });
    });
    const out = await fetchBalance();
    expect(out).toEqual({ balanceDollars: 123.45, portfolioValueDollars: 678.9 });
    expect(seenHeaders!['KALSHI-ACCESS-KEY']).toBe('test-access-key');
    expect(seenHeaders!['KALSHI-ACCESS-SIGNATURE']).toBeTruthy();
    expect(seenHeaders!['KALSHI-ACCESS-TIMESTAMP']).toBeTruthy();
  });

  it('throws on non-2xx', async () => {
    const { fetchBalance } = await import('../src/tui/api.js');
    mockFetch(async () => new Response('boom', { status: 500 }));
    await expect(fetchBalance()).rejects.toThrow(/HTTP 500/);
  });

  it('throws when env credentials are missing (no api key)', async () => {
    const saved = process.env.KALSHI_ACCESS_KEY;
    delete process.env.KALSHI_ACCESS_KEY;
    try {
      const { fetchBalance } = await import('../src/tui/api.js');
      mockFetch(async () => new Response('{}', { status: 200 }));
      await expect(fetchBalance()).rejects.toThrow(/No Kalshi credentials configured/);
    } finally {
      process.env.KALSHI_ACCESS_KEY = saved;
    }
  });

  it('throws when env credentials are missing (no key path)', async () => {
    const saved = process.env.KALSHI_PRIVATE_KEY_PATH;
    delete process.env.KALSHI_PRIVATE_KEY_PATH;
    try {
      const { fetchBalance } = await import('../src/tui/api.js');
      mockFetch(async () => new Response('{}', { status: 200 }));
      await expect(fetchBalance()).rejects.toThrow(/No Kalshi credentials configured/);
    } finally {
      process.env.KALSHI_PRIVATE_KEY_PATH = saved;
    }
  });

  it('honors KALSHI_BASE_URL override', async () => {
    process.env.KALSHI_BASE_URL = 'https://demo-api.kalshi.co/trade-api/v2/';
    try {
      const { fetchBalance } = await import('../src/tui/api.js');
      mockFetch(async (url) => {
        expect(url).toBe('https://demo-api.kalshi.co/trade-api/v2//portfolio/balance');
        return new Response(JSON.stringify({ balance: 0, portfolio_value: 0 }), { status: 200 });
      });
      await fetchBalance();
    } finally {
      delete process.env.KALSHI_BASE_URL;
    }
  });
});

describe('tui/api uses loadActive credentials', () => {
  it('signs requests with credentials-file profile (no env vars)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-home-'));
    const prevHome = process.env.KEA_HOME;
    const prevKey = process.env.KALSHI_ACCESS_KEY;
    const prevPath = process.env.KALSHI_PRIVATE_KEY_PATH;
    process.env.KEA_HOME = dir;
    delete process.env.KALSHI_ACCESS_KEY;
    delete process.env.KALSHI_PRIVATE_KEY_PATH;
    try {
      const { upsertProfile } = await import('../src/credentials.js');
      upsertProfile('prod', { keyId: 'TUIKEY', keyPath: pemPath, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ balance: 1500, portfolio_value: 0 }), { status: 200 }));
      vi.stubGlobal('fetch', fetchSpy);
      const { fetchBalance } = await import('../src/tui/api.js');
      const r = await fetchBalance();
      expect(r.balanceDollars).toBe(15);
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers['KALSHI-ACCESS-KEY']).toBe('TUIKEY');
    } finally {
      if (prevHome !== undefined) process.env.KEA_HOME = prevHome; else delete process.env.KEA_HOME;
      if (prevKey !== undefined) process.env.KALSHI_ACCESS_KEY = prevKey; else delete process.env.KALSHI_ACCESS_KEY;
      if (prevPath !== undefined) process.env.KALSHI_PRIVATE_KEY_PATH = prevPath; else delete process.env.KALSHI_PRIVATE_KEY_PATH;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('tui/api fetchPositions', () => {
  it('maps YES and NO sides, filters zero quantities, prefers position_fp over position', async () => {
    const { fetchPositions } = await import('../src/tui/api.js');
    mockFetch(async () => new Response(JSON.stringify({
      market_positions: [
        { ticker: 'A', position_fp: '5.00', market_exposure_dollars: '1.10', fees_paid_dollars: '0.05', realized_pnl_dollars: '0.20', resting_orders_count: 1 },
        { ticker: 'B', position: -3, market_exposure_dollars: '0.60' },
        { ticker: 'C', position_fp: '0' },
      ],
    }), { status: 200 }));
    const rows = await fetchPositions();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ ticker: 'A', side: 'YES', quantity: 5, exposureDollars: 1.1, feesPaidDollars: 0.05, realizedPnlDollars: 0.2, restingOrdersCount: 1 });
    expect(rows[1]).toMatchObject({ ticker: 'B', side: 'NO', quantity: 3 });
  });

  it('treats missing market_positions as empty array', async () => {
    const { fetchPositions } = await import('../src/tui/api.js');
    mockFetch(async () => new Response('{}', { status: 200 }));
    expect(await fetchPositions()).toEqual([]);
  });

  it('defaults missing fields safely', async () => {
    const { fetchPositions } = await import('../src/tui/api.js');
    mockFetch(async () => new Response(JSON.stringify({ market_positions: [{ position_fp: '1' }] }), { status: 200 }));
    const rows = await fetchPositions();
    expect(rows[0]).toMatchObject({ ticker: '', exposureDollars: 0, restingOrdersCount: 0 });
  });
});

describe('tui/api fetchRestingOrders', () => {
  it('filters status=resting and falls back yes/no price', async () => {
    const { fetchRestingOrders } = await import('../src/tui/api.js');
    mockFetch(async () => new Response(JSON.stringify({
      orders: [
        { order_id: 'a', ticker: 'TKR1', side: 'yes', action: 'sell', remaining_count_fp: '10', yes_price_dollars: '0.45', created_time: 't1', status: 'resting' },
        { order_id: 'b', ticker: 'TKR2', side: 'no',  action: 'sell', count_fp: '7', no_price_dollars: '0.10', status: 'resting' },
        { order_id: 'c', status: 'canceled' },
      ],
    }), { status: 200 }));
    const orders = await fetchRestingOrders();
    expect(orders).toHaveLength(2);
    expect(orders[0]).toMatchObject({ orderId: 'a', priceDollars: '0.45', remaining: 10, createdTime: 't1' });
    expect(orders[1]).toMatchObject({ orderId: 'b', priceDollars: '0.10', remaining: 7 });
  });

  it('treats missing orders as empty array', async () => {
    const { fetchRestingOrders } = await import('../src/tui/api.js');
    mockFetch(async () => new Response('{}', { status: 200 }));
    expect(await fetchRestingOrders()).toEqual([]);
  });

  it('exercises full ?? fallback chains when fields are absent', async () => {
    const { fetchRestingOrders } = await import('../src/tui/api.js');
    mockFetch(async () => new Response(JSON.stringify({
      orders: [
        // Missing remaining_count_fp AND count_fp → 0; missing yes_/no_price → ''
        { status: 'resting' },
      ],
    }), { status: 200 }));
    const orders = await fetchRestingOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ orderId: '', ticker: '', remaining: 0, priceDollars: '' });
  });
});

describe('tui/api fetchPositions ?? fallbacks', () => {
  it('falls back to 0 when both position_fp and position are absent', async () => {
    const { fetchPositions } = await import('../src/tui/api.js');
    mockFetch(async () => new Response(JSON.stringify({
      market_positions: [{ ticker: 'NOPOS' }, { ticker: 'NEG', position: -2 }],
    }), { status: 200 }));
    const rows = await fetchPositions();
    // NOPOS has 0 → filtered out. NEG remains.
    expect(rows.map((r) => r.ticker)).toEqual(['NEG']);
  });
});

describe('tui/api fetchPreview / fetchOrderbook', () => {
  function orderbookResponse() {
    return JSON.stringify({
      orderbook: {
        yes: [[20, 100], [19, 50]],
        no:  [[10, 200], [9, 80]],
      },
    });
  }

  it('runs previewOnce for yes side', async () => {
    const { fetchPreview } = await import('../src/tui/api.js');
    mockFetch(async (url) => {
      expect(url).toContain('/markets/KXFOO/orderbook');
      return new Response(orderbookResponse(), { status: 200 });
    });
    const r = await fetchPreview('KXFOO', 'yes', 5);
    expect(typeof r.topBidCents === 'number' || r.topBidCents === null).toBe(true);
    expect(r.decisionSize).toBeGreaterThan(0);
    expect(typeof r.decisionPriceDollars).toBe('string');
    expect(typeof r.grossDollars).toBe('number');
    expect(Array.isArray(r.perLevel)).toBe(true);
  });

  it('runs previewOnce for no side (covers no-side branch)', async () => {
    const { fetchPreview } = await import('../src/tui/api.js');
    mockFetch(async () => new Response(orderbookResponse(), { status: 200 }));
    const r = await fetchPreview('KXBAR', 'no', 3);
    expect(r).toBeDefined();
    expect(typeof r.netDollars).toBe('number');
  });

  it('handles empty book (topBidCents null)', async () => {
    const { fetchPreview } = await import('../src/tui/api.js');
    mockFetch(async () => new Response(JSON.stringify({ orderbook: { yes: [], no: [] } }), { status: 200 }));
    const r = await fetchPreview('EMPTY', 'yes', 1);
    expect(r.topBidCents).toBeNull();
    expect(r.perLevel).toEqual([]);
  });

  it('fetchOrderbook passes ticker and depth', async () => {
    const { fetchOrderbook } = await import('../src/tui/api.js');
    let seenUrl = '';
    mockFetch(async (url) => {
      seenUrl = url;
      return new Response(orderbookResponse(), { status: 200 });
    });
    const ob = await fetchOrderbook('KXBAZ', 5);
    expect(seenUrl).toContain('/markets/KXBAZ/orderbook');
    expect(seenUrl).toContain('depth=5');
    expect(Array.isArray(ob.yes)).toBe(true);
    expect(Array.isArray(ob.no)).toBe(true);
  });

  it('fetchOrderbook uses default depth=10', async () => {
    const { fetchOrderbook } = await import('../src/tui/api.js');
    let seenUrl = '';
    mockFetch(async (url) => { seenUrl = url; return new Response(orderbookResponse(), { status: 200 }); });
    await fetchOrderbook('KXBAZ');
    expect(seenUrl).toContain('depth=10');
  });
});

describe('tui/api listJournalSummaries', () => {
  let altHome: string;
  beforeEach(() => {
    altHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-jrn-'));
    process.env.KEA_HOME = altHome;
  });
  afterEach(() => {
    fs.rmSync(altHome, { recursive: true, force: true });
    process.env.KEA_HOME = keaHomeDir;
  });

  it('returns empty when jobs dir does not exist', async () => {
    const { listJournalSummaries } = await import('../src/tui/api.js');
    expect(listJournalSummaries()).toEqual([]);
  });

  it('falls back to homedir-derived KEA_HOME when env unset', async () => {
    delete process.env.KEA_HOME;
    const homeSpy = vi.spyOn(os, 'homedir').mockReturnValue(altHome);
    try {
      const { listJournalSummaries } = await import('../src/tui/api.js');
      expect(listJournalSummaries()).toEqual([]);
    } finally {
      homeSpy.mockRestore();
      process.env.KEA_HOME = keaHomeDir;
    }
  });

  it('summarises jsonl files: ticker fallbacks, finished flag, sort by lastTs desc, limit', async () => {
    const jobs = path.join(altHome, 'jobs');
    fs.mkdirSync(jobs, { recursive: true });
    // Job A: data.ticker direct
    fs.writeFileSync(path.join(jobs, 'a.jsonl'), [
      JSON.stringify({ ts: '2026-04-01T00:00:00Z', kind: 'started', data: { ticker: 'KXAAA' } }),
      JSON.stringify({ ts: '2026-04-01T00:01:00Z', kind: 'loop_finished', data: {} }),
      'this is malformed json',
      '',
    ].join('\n'));
    // Job B: data.config.marketTicker fallback, not finished
    fs.writeFileSync(path.join(jobs, 'b.jsonl'),
      JSON.stringify({ ts: '2026-04-02T00:00:00Z', kind: 'started', data: { config: { marketTicker: 'KXBBB' } } }) + '\n' +
      JSON.stringify({ ts: '2026-04-02T00:05:00Z', kind: 'order_placed', data: {} }) + '\n');
    // Job C: no ticker info → '—'
    fs.writeFileSync(path.join(jobs, 'c.jsonl'),
      JSON.stringify({ ts: '2026-03-01T00:00:00Z', kind: 'started', data: {} }) + '\n');
    // Empty file — should be skipped
    fs.writeFileSync(path.join(jobs, 'empty.jsonl'), '');
    // Non-jsonl ignored
    fs.writeFileSync(path.join(jobs, 'note.txt'), 'ignore me');

    const { listJournalSummaries } = await import('../src/tui/api.js');
    const rows = listJournalSummaries(2); // exercise limit
    expect(rows).toHaveLength(2);
    expect(rows[0].jobId).toBe('b'); // newest lastTs
    expect(rows[0].ticker).toBe('KXBBB');
    expect(rows[0].finished).toBe(false);
    expect(rows[1].jobId).toBe('a');
    expect(rows[1].finished).toBe(true);
    expect(rows[1].ticker).toBe('KXAAA');

    const all = listJournalSummaries();
    expect(all).toHaveLength(3);
    const c = all.find((r) => r.jobId === 'c')!;
    expect(c.ticker).toBe('—');
  });

  it('skips files that throw on read', async () => {
    const jobs = path.join(altHome, 'jobs');
    fs.mkdirSync(jobs, { recursive: true });
    fs.writeFileSync(path.join(jobs, 'good.jsonl'),
      JSON.stringify({ ts: '2026-05-01', kind: 'k', data: { ticker: 'X' } }) + '\n');
    // Make readFileSync throw for one specific file via a spy
    const origRead = fs.readFileSync;
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation((p, opts) => {
      if (typeof p === 'string' && p.endsWith('good.jsonl')) throw new Error('eperm');
      return origRead(p as string, opts as { encoding: BufferEncoding });
    });
    try {
      const { listJournalSummaries } = await import('../src/tui/api.js');
      const rows = listJournalSummaries();
      expect(rows.find((r) => r.jobId === 'good')).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });
});
