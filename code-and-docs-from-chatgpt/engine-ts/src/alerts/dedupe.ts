/**
 * Alert deduplication — prevents the same synthetic from re-firing during its cooldown window.
 *
 * State is held in memory and persisted to disk on flush() for crash-resume.
 * Pure `shouldDedupe` is kept side-effect-free for easy unit testing.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { homedir } from 'node:os';

export const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const STATE_PATH = `${homedir()}/.kalshi-exit-assistant/alert-state.json`;

/** In-memory map: syntheticId → lastFiredEpochMs */
const _lastFired = new Map<string, number>();
let _loaded = false;

/** Pure function — no side effects. Safe for unit tests without touching disk. */
export function shouldDedupe(
  syntheticId: string,
  nowMs: number,
  cooldownMs: number,
  lastFiredMap: ReadonlyMap<string, number>,
): boolean {
  const last = lastFiredMap.get(syntheticId);
  if (last === undefined) return false;
  return nowMs - last < cooldownMs;
}

/** Load persisted state from disk (called once on first access). */
export function loadState(path: string = STATE_PATH): void {
  if (!existsSync(path)) return;
  try {
    const raw = readFileSync(path, 'utf-8');
    const obj = JSON.parse(raw) as Record<string, number>;
    for (const [id, ts] of Object.entries(obj)) {
      if (typeof ts === 'number') _lastFired.set(id, ts);
    }
  } catch {
    // corrupt file — start fresh
  }
}

/** Persist current in-memory state to disk. Call on graceful shutdown. */
export function flushState(path: string = STATE_PATH): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const obj: Record<string, number> = {};
  for (const [id, ts] of _lastFired.entries()) obj[id] = ts;
  writeFileSync(path, JSON.stringify(obj, null, 2), { mode: 0o600 });
}

/**
 * Record a fire and return whether this fire is a dedupe hit.
 * Side-effecting version that uses the module-level map.
 */
export function checkAndRecord(
  syntheticId: string,
  nowMs: number = Date.now(),
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
): boolean {
  if (!_loaded) {
    loadState();
    _loaded = true;
  }
  if (shouldDedupe(syntheticId, nowMs, cooldownMs, _lastFired)) return true;
  _lastFired.set(syntheticId, nowMs);
  return false;
}

/** Exposed for testing: reset module-level state. */
export function _resetStateForTest(): void {
  _lastFired.clear();
  _loaded = false;
}

/** Exposed for testing: inject entries directly. */
export function _setLastFiredForTest(syntheticId: string, epochMs: number): void {
  _lastFired.set(syntheticId, epochMs);
}
