/**
 * Safety guard-rail persistence.
 *
 * Reads/writes $KEA_HOME/safety.json using the same atomic tmp+rename pattern
 * as credentials.ts. Mode 0o600. All mutations append to safety.audit.jsonl.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ExitConfig, ForbiddenEntry, SafetyConfig } from './types.js';

// ── path helpers ─────────────────────────────────────────────────────────────

function keaHome(): string {
  return process.env['KEA_HOME'] ?? path.join(os.homedir(), '.kalshi-exit-assistant');
}

function safetyPath(): string {
  return path.join(keaHome(), 'safety.json');
}

function auditPath(): string {
  return path.join(keaHome(), 'safety.audit.jsonl');
}

// ── defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: SafetyConfig = {
  version: 1,
  safetySubmittedMultiple: 1.1,
  floorPriceCents: 0,
  tailSweepThreshold: 0,
  forbiddenTickers: [],
};

// ── file I/O ──────────────────────────────────────────────────────────────────

function readSafetyFile(): SafetyConfig | null {
  try {
    const raw = fs.readFileSync(safetyPath(), 'utf8');
    try {
      const parsed = JSON.parse(raw) as SafetyConfig;
      if (parsed.version !== 1) throw new Error(`Unsupported safety.json version: ${String(parsed.version)}`);
      return parsed;
    } catch (parseErr) {
      throw new Error(`safety.json is corrupt: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

function writeSafetyFileAtomic(data: SafetyConfig): void {
  const dir = keaHome();
  fs.mkdirSync(dir, { recursive: true });
  const target = safetyPath();
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, target);
}

function appendAudit(action: string, context: Record<string, unknown>): void {
  const dir = keaHome();
  fs.mkdirSync(dir, { recursive: true });
  const entry = { ts: new Date().toISOString(), kind: 'safety_config_changed', data: { action, ...context } };
  fs.appendFileSync(auditPath(), JSON.stringify(entry) + '\n', 'utf8');
}

// ── public API ────────────────────────────────────────────────────────────────

/** Returns persisted safety config or DEFAULTS when no file exists. */
export function getSafety(): SafetyConfig {
  return readSafetyFile() ?? { ...DEFAULTS };
}

/** Patch one or more scalar fields. Returns the updated config. */
export function setSafety(
  patch: Partial<Omit<SafetyConfig, 'version' | 'forbiddenTickers'>>,
): SafetyConfig {
  // Validate bounds
  if (patch.safetySubmittedMultiple !== undefined) {
    if (patch.safetySubmittedMultiple < 1.0 || patch.safetySubmittedMultiple > 1.2) {
      throw new RangeError('safetySubmittedMultiple must be in [1.0, 1.2]');
    }
  }
  if (patch.floorPriceCents !== undefined) {
    if (patch.floorPriceCents < 0 || patch.floorPriceCents > 99) {
      throw new RangeError('floorPriceCents must be in [0, 99]');
    }
  }
  if (patch.tailSweepThreshold !== undefined) {
    if (patch.tailSweepThreshold < 0 || patch.tailSweepThreshold > 1_000_000) {
      throw new RangeError('tailSweepThreshold must be in [0, 1_000_000]');
    }
  }

  const current = getSafety();
  const updated: SafetyConfig = { ...current, ...patch };
  writeSafetyFileAtomic(updated);
  appendAudit('setSafety', { patch });
  return updated;
}

export function listForbidden(): ForbiddenEntry[] {
  return getSafety().forbiddenTickers;
}

export function addForbiddenTicker(
  ticker: string,
  reason: string,
  addedBy: string,
): ForbiddenEntry {
  if (!reason || reason.trim() === '') {
    throw new Error('reason is required');
  }
  const current = getSafety();
  if (current.forbiddenTickers.some((e) => e.ticker === ticker)) {
    throw new Error(`ticker ${ticker} already on forbidden list`);
  }
  const entry: ForbiddenEntry = { ticker, reason, addedAt: new Date().toISOString(), addedBy };
  const updated: SafetyConfig = {
    ...current,
    forbiddenTickers: [...current.forbiddenTickers, entry],
  };
  writeSafetyFileAtomic(updated);
  appendAudit('addForbiddenTicker', { ticker, reason, addedBy });
  return entry;
}

export function removeForbiddenTicker(ticker: string): boolean {
  const current = getSafety();
  const next = current.forbiddenTickers.filter((e) => e.ticker !== ticker);
  if (next.length === current.forbiddenTickers.length) return false;
  writeSafetyFileAtomic({ ...current, forbiddenTickers: next });
  appendAudit('removeForbiddenTicker', { ticker });
  return true;
}

/**
 * Merge persisted safety guard-rails into a job ExitConfig.
 * Guard-rails can only tighten: min for multipliers, max for floors, union for forbidden.
 */
export function mergeIntoExitConfig(config: ExitConfig, safety?: SafetyConfig): ExitConfig {
  const s = safety ?? getSafety();
  const merged: ExitConfig = {
    ...config,
    safetySubmittedMultiple: Math.min(
      config.safetySubmittedMultiple ?? Infinity,
      s.safetySubmittedMultiple,
    ),
    floorPriceCents: Math.max(config.floorPriceCents, s.floorPriceCents),
    tailSweepThreshold: Math.max(config.tailSweepThreshold, s.tailSweepThreshold),
    forbiddenTickers: Array.from(
      new Set([
        ...(config.forbiddenTickers ?? []),
        ...s.forbiddenTickers.map((e) => e.ticker),
      ]),
    ),
  };
  return merged;
}
