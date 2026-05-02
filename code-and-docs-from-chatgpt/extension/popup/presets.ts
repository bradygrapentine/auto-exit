export interface Preset {
  name: string;
  ticker: string;
  side: 'yes' | 'no';
  size: number;
  chunkSize: number;
  dryRun: boolean;
}

// Storage interface that matches chrome.storage.local shape
export interface StorageBackend {
  get(keys: string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

const STORAGE_KEY = 'kea_presets';

// Fields that must never be persisted
const SECRET_FIELDS = new Set(['apiKey', 'token', 'secret', 'password', 'credential']);

function sanitize(preset: Preset): Preset {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(preset)) {
    if (!SECRET_FIELDS.has(k)) {
      result[k] = v;
    }
  }
  return result as Preset;
}

export async function loadPresets(storage: StorageBackend): Promise<Preset[]> {
  const data = await storage.get([STORAGE_KEY]);
  const raw = data[STORAGE_KEY];
  if (!Array.isArray(raw)) return [];
  return raw as Preset[];
}

export async function savePreset(storage: StorageBackend, preset: Preset): Promise<void> {
  const clean = sanitize(preset);
  const existing = await loadPresets(storage);
  const idx = existing.findIndex((p) => p.name === clean.name);
  if (idx >= 0) {
    existing[idx] = clean;
  } else {
    existing.push(clean);
  }
  await storage.set({ [STORAGE_KEY]: existing });
}

export async function deletePreset(storage: StorageBackend, name: string): Promise<void> {
  const existing = await loadPresets(storage);
  const filtered = existing.filter((p) => p.name !== name);
  await storage.set({ [STORAGE_KEY]: filtered });
}

export async function loadPreset(storage: StorageBackend, name: string): Promise<Preset | null> {
  const existing = await loadPresets(storage);
  return existing.find((p) => p.name === name) ?? null;
}
