import fs from 'node:fs';
import type { ExitConfig, ExitConfigPatch } from './types.js';

export function loadConfig(path: string): ExitConfig {
  return JSON.parse(fs.readFileSync(path, 'utf8')) as ExitConfig;
}

export function mergeConfig(base: ExitConfig, patch: Partial<ExitConfigPatch>): ExitConfig {
  const merged = { ...base, ...patch } as ExitConfig;
  if (!merged.marketTicker) throw new Error('marketTicker is required');
  if (merged.heldSide !== 'yes' && merged.heldSide !== 'no') throw new Error('heldSide must be yes or no');
  if (!Number.isFinite(merged.positionSize) || merged.positionSize <= 0) throw new Error('positionSize must be positive');
  if (!Number.isFinite(merged.chunkSize) || merged.chunkSize <= 0) throw new Error('chunkSize must be positive');
  if (merged.chunkSize > 500) throw new Error('chunkSize must be <= 500 for V1 safety');
  return merged;
}

export function parseArgs(defaultConfig = './config.example.json'): { configPath: string } {
  const idx = process.argv.indexOf('--config');
  return { configPath: idx >= 0 ? process.argv[idx + 1] : defaultConfig };
}
