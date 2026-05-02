import { describe, it, expect, beforeEach } from 'vitest';
import {
  savePreset,
  loadPresets,
  deletePreset,
  loadPreset,
  type Preset,
  type StorageBackend,
} from '../../../extension/popup/presets';

function memStorage(): StorageBackend {
  const store: Record<string, unknown> = {};
  return {
    get: async (keys) => Object.fromEntries(keys.map((k) => [k, store[k]])),
    set: async (items) => {
      Object.assign(store, items);
    },
    remove: async (keys) => {
      keys.forEach((k) => delete store[k]);
    },
  };
}

const PRESET_A: Preset = {
  name: 'alpha',
  ticker: 'KX-BTCUSD',
  side: 'yes',
  size: 100,
  chunkSize: 10,
  dryRun: false,
};

const PRESET_B: Preset = {
  name: 'beta',
  ticker: 'KX-ETHUSDT',
  side: 'no',
  size: 50,
  chunkSize: 5,
  dryRun: true,
};

describe('presets storage helpers', () => {
  let storage: StorageBackend;

  beforeEach(() => {
    storage = memStorage();
  });

  it('save a preset → loadPresets returns it', async () => {
    await savePreset(storage, PRESET_A);
    const all = await loadPresets(storage);
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(PRESET_A);
  });

  it('save two presets → loadPresets returns both', async () => {
    await savePreset(storage, PRESET_A);
    await savePreset(storage, PRESET_B);
    const all = await loadPresets(storage);
    expect(all).toHaveLength(2);
    expect(all.map((p) => p.name)).toContain('alpha');
    expect(all.map((p) => p.name)).toContain('beta');
  });

  it('save preset with same name upserts, total count stays same', async () => {
    await savePreset(storage, PRESET_A);
    const updated: Preset = { ...PRESET_A, ticker: 'KX-NEWMKT', size: 200 };
    await savePreset(storage, updated);
    const all = await loadPresets(storage);
    expect(all).toHaveLength(1);
    expect(all[0].ticker).toBe('KX-NEWMKT');
    expect(all[0].size).toBe(200);
  });

  it('deletePreset removes it; loadPreset returns null afterwards', async () => {
    await savePreset(storage, PRESET_A);
    await savePreset(storage, PRESET_B);
    await deletePreset(storage, 'alpha');
    const all = await loadPresets(storage);
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('beta');
    const gone = await loadPreset(storage, 'alpha');
    expect(gone).toBeNull();
  });

  it('loadPreset returns the correct preset by name', async () => {
    await savePreset(storage, PRESET_A);
    await savePreset(storage, PRESET_B);
    const found = await loadPreset(storage, 'beta');
    expect(found).toEqual(PRESET_B);
  });

  it('no secret fields: apiKey stripped on round-trip', async () => {
    // Cast to bypass TS — simulates a caller passing extra runtime fields
    const withSecret = { ...PRESET_A, apiKey: 'super-secret' } as unknown as Preset;
    await savePreset(storage, withSecret);
    const loaded = await loadPreset(storage, 'alpha');
    expect(loaded).not.toBeNull();
    expect((loaded as Record<string, unknown>)['apiKey']).toBeUndefined();
    // All legit fields still present
    expect(loaded!.ticker).toBe(PRESET_A.ticker);
  });

  it('loadPresets returns empty array when nothing stored', async () => {
    const all = await loadPresets(storage);
    expect(all).toEqual([]);
  });
});
