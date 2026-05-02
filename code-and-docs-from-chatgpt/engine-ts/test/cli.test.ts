import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { upsertProfile, listProfiles, getActive, loadActive } from '../src/credentials.js';
import { runCli } from '../src/cli.js';

const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');

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

describe('kea whoami', () => {
  it('prints active profile with last-4 key id', async () => {
    await withTempHome(async () => {
      upsertProfile('prod', { keyId: 'AKID-PROD-WXYZ', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      const out: string[] = [];
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { out.push(String(s)); return true; });
      try {
        await runCli(['whoami']);
      } finally {
        spy.mockRestore();
      }
      const joined = out.join('');
      expect(joined).toContain('prod');
      expect(joined).toContain('…WXYZ');
      expect(joined).not.toContain('AKID-PROD-WXYZ');
    });
  });
});

describe('kea login (flags only)', () => {
  it('writes profile from flags and makes it active when first', async () => {
    await withTempHome(async () => {
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      try {
        await runCli(['login', '--profile', 'prod', '--key-id', 'AKID-FLAGS-1234', '--key-file', FIXTURE]);
      } finally {
        spy.mockRestore();
      }
      expect(listProfiles()).toEqual(['prod']);
      expect(getActive()).toBe('prod');
      expect(loadActive().baseUrl).toBe('https://api.elections.kalshi.com/trade-api/v2');
    });
  });

  it('respects --base-url override', async () => {
    await withTempHome(async () => {
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      try {
        await runCli(['login', '--profile', 'demo', '--key-id', 'X', '--key-file', FIXTURE, '--base-url', 'https://custom.example/v2']);
      } finally {
        spy.mockRestore();
      }
      expect(loadActive().baseUrl).toBe('https://custom.example/v2');
    });
  });

  it('rejects unreadable key file', async () => {
    await withTempHome(async () => {
      await expect(
        runCli(['login', '--profile', 'prod', '--key-id', 'X', '--key-file', '/no/such/file']),
      ).rejects.toThrow();
    });
  });
});

describe('kea use', () => {
  it('flips active profile', async () => {
    await withTempHome(async () => {
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      try {
        await runCli(['login', '--profile', 'demo', '--key-id', 'D', '--key-file', FIXTURE]);
        await runCli(['login', '--profile', 'prod', '--key-id', 'P', '--key-file', FIXTURE]);
        await runCli(['use', 'prod']);
      } finally {
        spy.mockRestore();
      }
      expect(getActive()).toBe('prod');
    });
  });
});

describe('kea safety', () => {
  it('kea safety get prints defaults', async () => {
    await withTempHome(async () => {
      const out: string[] = [];
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { out.push(String(s)); return true; });
      try {
        await runCli(['safety', 'get']);
      } finally { spy.mockRestore(); }
      const joined = out.join('');
      expect(joined).toContain('safetySubmittedMultiple');
      expect(joined).toContain('1.1');
      expect(joined).toContain('floorPriceCents');
    });
  });

  it('kea safety set updates floor and prints result', async () => {
    await withTempHome(async () => {
      const out: string[] = [];
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { out.push(String(s)); return true; });
      try {
        await runCli(['safety', 'set', '--floor-price-cents', '10']);
      } finally { spy.mockRestore(); }
      const joined = out.join('');
      expect(joined).toContain('10');
    });
  });
});

describe('kea forbidden', () => {
  it('kea forbidden list is empty initially', async () => {
    await withTempHome(async () => {
      const out: string[] = [];
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { out.push(String(s)); return true; });
      try {
        await runCli(['forbidden', 'list']);
      } finally { spy.mockRestore(); }
      expect(out.join('')).toContain('(no forbidden tickers)');
    });
  });

  it('kea forbidden add + list + remove round-trip', async () => {
    await withTempHome(async () => {
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      try {
        await runCli(['forbidden', 'add', 'KXCLI', '--reason', 'cli test']);
        const out: string[] = [];
        const spy2 = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { out.push(String(s)); return true; });
        try {
          await runCli(['forbidden', 'list']);
        } finally { spy2.mockRestore(); }
        expect(out.join('')).toContain('KXCLI');
        await runCli(['forbidden', 'remove', 'KXCLI']);
      } finally { spy.mockRestore(); }
    });
  });
});

describe('kea report', () => {
  it('prints TCA slippage table for a job with tca entries', async () => {
    await withTempHome(async () => {
      // Write a fake journal with 2 tca entries
      const jobId = 'report-test-job';
      const jobs = path.join(process.env.KEA_HOME!, 'jobs');
      fs.mkdirSync(jobs, { recursive: true });
      const entry1 = { ts: new Date().toISOString(), kind: 'tca', data: { jobId, ticker: 'KXTEST', side: 'sell', chunkIndex: 0, arrivalMidCents: 70, executedPriceCents: 69, slippageCents: -1, chunkSize: 200, depthTier: 1 } };
      const entry2 = { ts: new Date().toISOString(), kind: 'tca', data: { jobId, ticker: 'KXTEST', side: 'sell', chunkIndex: 1, arrivalMidCents: 70, executedPriceCents: 68, slippageCents: -2, chunkSize: 200, depthTier: 1 } };
      fs.writeFileSync(path.join(jobs, `${jobId}.jsonl`), JSON.stringify(entry1) + '\n' + JSON.stringify(entry2) + '\n');

      const out: string[] = [];
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { out.push(String(s)); return true; });
      try {
        await runCli(['report', jobId]);
      } finally {
        spy.mockRestore();
      }
      const joined = out.join('');
      expect(joined).toContain('arrivalMid');
      expect(joined).toContain('slippage');
      expect(joined).toContain('KXTEST');
      expect(joined).toContain('Chunks: 2');
    });
  });

  it('prints "No TCA entries found" for a job without tca entries', async () => {
    await withTempHome(async () => {
      const jobId = 'no-tca-job';
      const jobs = path.join(process.env.KEA_HOME!, 'jobs');
      fs.mkdirSync(jobs, { recursive: true });
      fs.writeFileSync(path.join(jobs, `${jobId}.jsonl`),
        JSON.stringify({ ts: new Date().toISOString(), kind: 'loop_started', data: {} }) + '\n');

      const out: string[] = [];
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { out.push(String(s)); return true; });
      try {
        await runCli(['report', jobId]);
      } finally {
        spy.mockRestore();
      }
      expect(out.join('')).toContain('No TCA entries found');
    });
  });
});

describe('kea logout', () => {
  it('removes one profile', async () => {
    await withTempHome(async () => {
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      try {
        await runCli(['login', '--profile', 'demo', '--key-id', 'D', '--key-file', FIXTURE]);
        await runCli(['login', '--profile', 'prod', '--key-id', 'P', '--key-file', FIXTURE]);
        await runCli(['logout', '--profile', 'demo']);
      } finally {
        spy.mockRestore();
      }
      expect(listProfiles()).toEqual(['prod']);
    });
  });
  it('--all clears everything', async () => {
    await withTempHome(async () => {
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      try {
        await runCli(['login', '--profile', 'demo', '--key-id', 'D', '--key-file', FIXTURE]);
        await runCli(['logout', '--all']);
      } finally {
        spy.mockRestore();
      }
      expect(listProfiles()).toEqual([]);
    });
  });
});
