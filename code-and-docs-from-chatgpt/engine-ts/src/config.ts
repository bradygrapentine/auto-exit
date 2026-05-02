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
  // Bumped from 500 → 2000 on 2026-05-01 after extensive live validation across
  // Phase 1 + smoke + resume tests. The safetySubmittedMultiple cap below is the
  // real protection; chunkSize is just an upper bound on per-order size.
  if (merged.chunkSize > 2000) throw new Error('chunkSize must be <= 2000');
  if (!Number.isFinite(merged.maxOrders) || merged.maxOrders <= 0) throw new Error('maxOrders must be positive');
  if (merged.maxOrders > 100) throw new Error('maxOrders must be <= 100; raise floorPriceCents/chunkSize instead');
  // Sanity bound — protects against parser/fill misreads where the engine retries executed orders.
  // Total possible submitted volume = chunkSize * maxOrders. Cap it at positionSize * multiple.
  const multiple = merged.safetySubmittedMultiple ?? 1.5;
  if (multiple < 1) throw new Error('safetySubmittedMultiple must be >= 1');
  const maxSubmittable = merged.chunkSize * merged.maxOrders;
  const cap = merged.positionSize * multiple;
  if (maxSubmittable > cap) {
    throw new Error(
      `safety: chunkSize(${merged.chunkSize}) * maxOrders(${merged.maxOrders}) = ${maxSubmittable} ` +
      `exceeds positionSize(${merged.positionSize}) * safetySubmittedMultiple(${multiple}) = ${cap}. ` +
      `Lower maxOrders or chunkSize, or raise safetySubmittedMultiple if you genuinely need many retries.`,
    );
  }
  // forbiddenTickers — refuse to run against listed positions
  const forbidden = merged.forbiddenTickers ?? [];
  if (forbidden.includes(merged.marketTicker)) {
    throw new Error(
      `marketTicker '${merged.marketTicker}' is in forbiddenTickers — engine refuses to run against this ticker`,
    );
  }
  return merged;
}

export function parseArgs(defaultConfig = './config.example.json'): { configPath: string } {
  const idx = process.argv.indexOf('--config');
  return { configPath: idx >= 0 ? process.argv[idx + 1] : defaultConfig };
}
