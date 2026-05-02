import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ExitConfig } from '../src/types.js';

function withTempHome<T>(fn: (dir: string) => Promise<T> | T): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-safety-'));
  const prev = process.env.KEA_HOME;
  process.env.KEA_HOME = dir;
  return Promise.resolve()
    .then(() => fn(dir))
    .finally(() => {
      if (prev === undefined) delete process.env.KEA_HOME;
      else process.env.KEA_HOME = prev;
      fs.rmSync(dir, { recursive: true, force: true });
    });
}

// Re-import inside each test to pick up the updated KEA_HOME
async function importSafety() {
  const mod = await import('../src/safety.js');
  return mod;
}

describe('getSafety — defaults when no file', () => {
  it('returns DEFAULTS when safety.json absent', async () => {
    await withTempHome(async () => {
      const { getSafety } = await importSafety();
      const s = getSafety();
      expect(s.version).toBe(1);
      expect(s.safetySubmittedMultiple).toBe(1.1);
      expect(s.floorPriceCents).toBe(0);
      expect(s.tailSweepThreshold).toBe(0);
      expect(s.forbiddenTickers).toEqual([]);
    });
  });
});

describe('setSafety — persists valid values', () => {
  it('round-trips scalar fields', async () => {
    await withTempHome(async () => {
      const { setSafety, getSafety } = await importSafety();
      setSafety({ safetySubmittedMultiple: 1.15, floorPriceCents: 5, tailSweepThreshold: 50 });
      const s = getSafety();
      expect(s.safetySubmittedMultiple).toBe(1.15);
      expect(s.floorPriceCents).toBe(5);
      expect(s.tailSweepThreshold).toBe(50);
    });
  });

  it('rejects safetySubmittedMultiple out of bounds (too high)', async () => {
    await withTempHome(async () => {
      const { setSafety } = await importSafety();
      expect(() => setSafety({ safetySubmittedMultiple: 1.3 })).toThrow(/safetySubmittedMultiple/);
    });
  });

  it('rejects safetySubmittedMultiple out of bounds (too low)', async () => {
    await withTempHome(async () => {
      const { setSafety } = await importSafety();
      expect(() => setSafety({ safetySubmittedMultiple: 0.9 })).toThrow(/safetySubmittedMultiple/);
    });
  });

  it('rejects floorPriceCents out of bounds', async () => {
    await withTempHome(async () => {
      const { setSafety } = await importSafety();
      expect(() => setSafety({ floorPriceCents: 100 })).toThrow(/floorPriceCents/);
    });
  });

  it('rejects tailSweepThreshold out of bounds', async () => {
    await withTempHome(async () => {
      const { setSafety } = await importSafety();
      expect(() => setSafety({ tailSweepThreshold: 2_000_000 })).toThrow(/tailSweepThreshold/);
    });
  });
});

describe('setSafety — atomic write durability', () => {
  it('leaves prior file intact when tmp path is pre-occupied by dir', async () => {
    await withTempHome(async (dir) => {
      const { setSafety, getSafety } = await importSafety();
      setSafety({ floorPriceCents: 5 });
      const before = fs.readFileSync(path.join(dir, 'safety.json'), 'utf8');

      // Block the tmp path so rename fails
      const tmp = path.join(dir, 'safety.json.tmp');
      fs.mkdirSync(tmp);
      try {
        expect(() => setSafety({ floorPriceCents: 10 })).toThrow();
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }

      const after = fs.readFileSync(path.join(dir, 'safety.json'), 'utf8');
      expect(after).toBe(before);
      expect(getSafety().floorPriceCents).toBe(5);
    });
  });
});

describe('getSafety — corrupt file handling', () => {
  it('throws with "corrupt" message when safety.json is invalid JSON', async () => {
    await withTempHome(async (dir) => {
      fs.writeFileSync(path.join(dir, 'safety.json'), '{ invalid json', 'utf8');
      const { getSafety } = await importSafety();
      expect(() => getSafety()).toThrow(/corrupt/);
    });
  });
});

describe('addForbiddenTicker / listForbidden / removeForbiddenTicker', () => {
  it('add → list → remove round-trip', async () => {
    await withTempHome(async () => {
      const { addForbiddenTicker, listForbidden, removeForbiddenTicker } = await importSafety();
      const entry = addForbiddenTicker('KXTEST-1', 'do not touch', 'cli');
      expect(entry.ticker).toBe('KXTEST-1');
      expect(entry.reason).toBe('do not touch');
      expect(entry.addedBy).toBe('cli');
      expect(entry.addedAt).toBeTruthy();

      const list = listForbidden();
      expect(list).toHaveLength(1);
      expect(list[0].ticker).toBe('KXTEST-1');

      removeForbiddenTicker('KXTEST-1');
      expect(listForbidden()).toHaveLength(0);
    });
  });

  it('rejects empty reason', async () => {
    await withTempHome(async () => {
      const { addForbiddenTicker } = await importSafety();
      expect(() => addForbiddenTicker('KXTEST-2', '', 'cli')).toThrow('reason is required');
    });
  });

  it('rejects duplicate ticker', async () => {
    await withTempHome(async () => {
      const { addForbiddenTicker } = await importSafety();
      addForbiddenTicker('KXTEST-3', 'first', 'cli');
      expect(() => addForbiddenTicker('KXTEST-3', 'second', 'cli')).toThrow(/already on forbidden list/);
    });
  });

  it('removeForbiddenTicker is no-op on unknown ticker', async () => {
    await withTempHome(async () => {
      const { removeForbiddenTicker, listForbidden } = await importSafety();
      // Should not throw
      expect(() => removeForbiddenTicker('DOES-NOT-EXIST')).not.toThrow();
      expect(listForbidden()).toHaveLength(0);
    });
  });

  it('removeForbiddenTicker returns true when removed, false when not found', async () => {
    await withTempHome(async () => {
      const { addForbiddenTicker, removeForbiddenTicker } = await importSafety();
      addForbiddenTicker('KXTEST-R', 'test', 'cli');
      expect(removeForbiddenTicker('KXTEST-R')).toBe(true);
      expect(removeForbiddenTicker('KXTEST-R')).toBe(false);
    });
  });
});

describe('mergeIntoExitConfig — guard-rail merge', () => {
  const baseCfg: ExitConfig = {
    baseUrl: 'https://example.test',
    localServerPort: 0,
    marketTicker: 'KXTEST',
    heldSide: 'yes',
    positionSize: 10,
    chunkSize: 5,
    floorPriceCents: 0,
    orderbookDepth: 20,
    minLevelSize: 1,
    tailSweepThreshold: 0,
    minAdaptiveChunk: 1,
    maxOrders: 10,
    loopDelayMs: 0,
    dryRun: true,
    killSwitchPath: '',
    apiKeyEnv: 'KALSHI_ACCESS_KEY',
    privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
    safetySubmittedMultiple: 1.5,
    forbiddenTickers: ['EXISTING'],
  };

  it('tightens safetySubmittedMultiple to safety value when config is looser', async () => {
    await withTempHome(async () => {
      const { setSafety, mergeIntoExitConfig } = await importSafety();
      setSafety({ safetySubmittedMultiple: 1.1 });
      const merged = mergeIntoExitConfig({ ...baseCfg, safetySubmittedMultiple: 1.5 });
      expect(merged.safetySubmittedMultiple).toBe(1.1);
    });
  });

  it('keeps config safetySubmittedMultiple when tighter than safety', async () => {
    await withTempHome(async () => {
      const { setSafety, mergeIntoExitConfig } = await importSafety();
      setSafety({ safetySubmittedMultiple: 1.2 });
      const merged = mergeIntoExitConfig({ ...baseCfg, safetySubmittedMultiple: 1.0 });
      expect(merged.safetySubmittedMultiple).toBe(1.0);
    });
  });

  it('tightens floorPriceCents to safety value when config is lower', async () => {
    await withTempHome(async () => {
      const { setSafety, mergeIntoExitConfig } = await importSafety();
      setSafety({ floorPriceCents: 10 });
      const merged = mergeIntoExitConfig({ ...baseCfg, floorPriceCents: 2 });
      expect(merged.floorPriceCents).toBe(10);
    });
  });

  it('unions forbiddenTickers from config and safety', async () => {
    await withTempHome(async () => {
      const { addForbiddenTicker, mergeIntoExitConfig } = await importSafety();
      addForbiddenTicker('SAFETY-TICKER', 'blocked', 'cli');
      const merged = mergeIntoExitConfig({ ...baseCfg, forbiddenTickers: ['EXISTING'] });
      expect(merged.forbiddenTickers).toContain('EXISTING');
      expect(merged.forbiddenTickers).toContain('SAFETY-TICKER');
    });
  });

  it('accepts a direct safety arg, bypassing file read', async () => {
    const { mergeIntoExitConfig } = await importSafety();
    const directSafety = {
      version: 1 as const,
      safetySubmittedMultiple: 1.05,
      floorPriceCents: 20,
      tailSweepThreshold: 100,
      forbiddenTickers: [{ ticker: 'DIRECT', reason: 'test', addedAt: '', addedBy: 'test' }],
    };
    const merged = mergeIntoExitConfig({ ...baseCfg, safetySubmittedMultiple: 1.5, floorPriceCents: 5 }, directSafety);
    expect(merged.safetySubmittedMultiple).toBe(1.05);
    expect(merged.floorPriceCents).toBe(20);
    expect(merged.forbiddenTickers).toContain('DIRECT');
  });
});
