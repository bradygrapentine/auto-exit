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
  const p = safetyPath();
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as SafetyConfig;
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
  return readSafetyFile() ?? { ...DEFAULTS, forbiddenTickers: [] };
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

export function removeForbiddenTicker(ticker: string): void {
  const current = getSafety();
  const before = current.forbiddenTickers.length;
  const updated: SafetyConfig = {
    ...current,
    forbiddenTickers: current.forbiddenTickers.filter((e) => e.ticker !== ticker),
  };
  if (updated.forbiddenTickers.length === before) {
    // no-op: ticker not found
    return;
  }
  writeSafetyFileAtomic(updated);
  appendAudit('removeForbiddenTicker', { ticker });
}

/**
 * Merge persisted safety guard-rails into a job ExitConfig.
 * Guard-rails can only tighten: min for multipliers, max for floors, union for forbidden.
 */
export function mergeIntoExitConfig(config: ExitConfig): ExitConfig {
  const safety = getSafety();
  const merged: ExitConfig = {
    ...config,
    safetySubmittedMultiple: Math.min(
      config.safetySubmittedMultiple ?? Infinity,
      safety.safetySubmittedMultiple,
    ),
    floorPriceCents: Math.max(config.floorPriceCents, safety.floorPriceCents),
    tailSweepThreshold: Math.max(config.tailSweepThreshold, safety.tailSweepThreshold),
    forbiddenTickers: Array.from(
      new Set([
        ...(config.forbiddenTickers ?? []),
        ...safety.forbiddenTickers.map((e) => e.ticker),
      ]),
    ),
  };
  return merged;
}
