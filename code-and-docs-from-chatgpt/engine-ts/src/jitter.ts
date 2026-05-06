/**
 * Anti-gaming jitter helpers — randomize chunk sizes and inter-iteration delays
 * within bounded percentages. Used by S4 stealth and any other loop-based
 * strategy that wants a non-deterministic footprint.
 *
 * `rng` defaults to Math.random; tests pass a deterministic stub.
 */
export interface JitterConfig {
  chunkSizePct: number;   // e.g. 0.15 → ±15%
  loopDelayPct: number;   // e.g. 0.30 → ±30%
}

type Rng = () => number;

function signed(rng: Rng): number {
  return rng() * 2 - 1;
}

export function jitterChunkSize(base: number, cfg: JitterConfig, rng: Rng = Math.random): number {
  if (cfg.chunkSizePct === 0) return base;
  const factor = 1 + signed(rng) * cfg.chunkSizePct;
  return Math.max(1, Math.round(base * factor));
}

export function jitterDelay(baseMs: number, cfg: JitterConfig, rng: Rng = Math.random): number {
  if (cfg.loopDelayPct === 0) return baseMs;
  const factor = 1 + signed(rng) * cfg.loopDelayPct;
  return Math.max(0, Math.round(baseMs * factor));
}
