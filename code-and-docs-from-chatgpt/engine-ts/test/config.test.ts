import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig, mergeConfig, parseArgs } from '../src/config.js';
import type { ExitConfig } from '../src/types.js';

const baseCfg: ExitConfig = {
  baseUrl: 'https://example.test',
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
  apiKeyEnv: 'KEY',
  privateKeyPathEnv: 'KEY_PATH',
};

describe('loadConfig', () => {
  it('reads and parses a JSON config file', () => {
    const tmp = path.join(os.tmpdir(), `kea-cfg-${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(baseCfg));
    try {
      const got = loadConfig(tmp);
      expect(got.marketTicker).toBe('KXTEST');
      expect(got.heldSide).toBe('yes');
    } finally {
      fs.rmSync(tmp);
    }
  });
});

describe('mergeConfig validation', () => {
  it('passes through a valid config unchanged', () => {
    const merged = mergeConfig(baseCfg, {});
    expect(merged.marketTicker).toBe('KXTEST');
  });

  it('applies a patch over base', () => {
    const merged = mergeConfig(baseCfg, { marketTicker: 'KXOTHER', heldSide: 'no', positionSize: 200 });
    expect(merged.marketTicker).toBe('KXOTHER');
    expect(merged.heldSide).toBe('no');
    expect(merged.positionSize).toBe(200);
  });

  it('rejects empty marketTicker', () => {
    expect(() => mergeConfig(baseCfg, { marketTicker: '' as string, heldSide: 'yes', positionSize: 100 })).toThrow(/marketTicker/);
  });

  it('rejects invalid heldSide', () => {
    expect(() => mergeConfig({ ...baseCfg, heldSide: 'maybe' as any }, {} as any)).toThrow(/heldSide/);
  });

  it('rejects non-positive positionSize', () => {
    expect(() => mergeConfig(baseCfg, { positionSize: 0 } as any)).toThrow(/positionSize/);
    expect(() => mergeConfig(baseCfg, { positionSize: -1 } as any)).toThrow(/positionSize/);
    expect(() => mergeConfig(baseCfg, { positionSize: NaN } as any)).toThrow(/positionSize/);
  });

  it('rejects non-positive chunkSize', () => {
    expect(() => mergeConfig({ ...baseCfg, chunkSize: 0 }, {} as any)).toThrow(/chunkSize/);
    expect(() => mergeConfig({ ...baseCfg, chunkSize: -5 }, {} as any)).toThrow(/chunkSize/);
  });

  it('rejects chunkSize > 2000', () => {
    expect(() => mergeConfig({ ...baseCfg, chunkSize: 2001 }, {} as any)).toThrow(/<= 2000/);
  });

  it('rejects non-positive maxOrders', () => {
    expect(() => mergeConfig({ ...baseCfg, maxOrders: 0 }, {} as any)).toThrow(/maxOrders must be positive/);
  });

  it('rejects maxOrders > 100', () => {
    expect(() => mergeConfig({ ...baseCfg, maxOrders: 101, positionSize: 1_000_000 }, {} as any)).toThrow(/<= 100/);
  });

  it('rejects safetySubmittedMultiple < 1', () => {
    expect(() => mergeConfig({ ...baseCfg, safetySubmittedMultiple: 0.5 }, {} as any)).toThrow(/safetySubmittedMultiple/);
  });

  it('rejects when chunkSize * maxOrders > positionSize * multiple', () => {
    // 20 * 5 = 100, positionSize 50, multiple 1.5 = cap 75. 100 > 75 → throws.
    expect(() => mergeConfig({ ...baseCfg, positionSize: 50 }, {} as any)).toThrow(/safety/);
  });

  it('accepts when safetySubmittedMultiple is raised to compensate', () => {
    expect(() => mergeConfig({ ...baseCfg, positionSize: 50, safetySubmittedMultiple: 3 }, {} as any)).not.toThrow();
  });

  it('rejects when marketTicker is in forbiddenTickers', () => {
    expect(() => mergeConfig(
      { ...baseCfg, marketTicker: 'OFFLIMITS', forbiddenTickers: ['OFFLIMITS'] },
      {} as any,
    )).toThrow(/forbiddenTickers/);
  });

  it('rejects when patch sets marketTicker to a forbidden value', () => {
    expect(() => mergeConfig(
      { ...baseCfg, forbiddenTickers: ['OFFLIMITS'] },
      { marketTicker: 'OFFLIMITS', heldSide: 'yes', positionSize: 100 } as any,
    )).toThrow(/forbiddenTickers/);
  });

  it('passes through when forbiddenTickers is empty / undefined', () => {
    expect(() => mergeConfig({ ...baseCfg, forbiddenTickers: [] }, {} as any)).not.toThrow();
    expect(() => mergeConfig({ ...baseCfg, forbiddenTickers: undefined as any }, {} as any)).not.toThrow();
  });
});

describe('parseArgs', () => {
  it('returns default when --config not present', () => {
    const original = process.argv.slice();
    process.argv = ['node', 'script.js'];
    try {
      const { configPath } = parseArgs('./fallback.json');
      expect(configPath).toBe('./fallback.json');
    } finally {
      process.argv = original;
    }
  });

  it('returns the value after --config', () => {
    const original = process.argv.slice();
    process.argv = ['node', 'script.js', '--config', './my.json'];
    try {
      const { configPath } = parseArgs();
      expect(configPath).toBe('./my.json');
    } finally {
      process.argv = original;
    }
  });
});
