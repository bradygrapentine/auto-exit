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
  if (patch.maxPositionConcentrationPct !== undefined) {
    if (patch.maxPositionConcentrationPct < 0 || patch.maxPositionConcentrationPct > 100) {
      throw new RangeError('maxPositionConcentrationPct must be in [0, 100]');
    }
  }
  if (patch.maxLossPerTickerDollars !== undefined && patch.maxLossPerTickerDollars <= 0) {
    throw new RangeError('maxLossPerTickerDollars must be > 0');
  }
  if (patch.dailyLossCircuitBreakerDollars !== undefined && patch.dailyLossCircuitBreakerDollars <= 0) {
    throw new RangeError('dailyLossCircuitBreakerDollars must be > 0');
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

// ── Pre-trade risk checks ─────────────────────────────────────────────────────

/**
 * In-process mutex for the circuit-breaker check.
 * Serializes concurrent calls so the read-tally-check sequence is atomic
 * within a single Node.js process. NOT cross-process safe (no file lock).
 */
let circuitBreakerLock: Promise<void> = Promise.resolve();

export class PreTradeRiskError extends Error {
  constructor(
    public readonly check: 'maxLoss' | 'dailyCircuitBreaker' | 'concentration',
    message: string,
  ) {
    super(message);
    this.name = 'PreTradeRiskError';
    Object.setPrototypeOf(this, PreTradeRiskError.prototype);
  }
}

/**
 * Throws PreTradeRiskError if any configured pre-trade limit is breached.
 * Call at the start of run() before placing any orders.
 *
 * @param ticker              - market ticker being traded
 * @param sizeDollars         - projected notional value of the intended trade
 * @param portfolioNAVDollars - current total portfolio NAV; pass 0 to skip concentration check
 * @param safety              - safety config (defaults to getSafety() if omitted)
 */
export async function checkPreTradeRisk(params: {
  ticker: string;
  sizeDollars: number;
  portfolioNAVDollars: number;
  safety?: SafetyConfig;
}): Promise<void> {
  const { ticker, sizeDollars, portfolioNAVDollars } = params;
  const safety = params.safety ?? getSafety();

  // 1. maxLossPerTickerDollars
  if (safety.maxLossPerTickerDollars !== undefined) {
    if (sizeDollars > safety.maxLossPerTickerDollars) {
      throw new PreTradeRiskError(
        'maxLoss',
        `projected loss of $${sizeDollars.toFixed(2)} exceeds maxLossPerTickerDollars ($${safety.maxLossPerTickerDollars.toFixed(2)}) for ${ticker}`,
      );
    }
  }

  // 2. dailyLossCircuitBreakerDollars
  if (safety.dailyLossCircuitBreakerDollars !== undefined) {
    let releaseLock!: () => void;
    const lockAcquired = new Promise<void>(resolve => { releaseLock = resolve; });
    circuitBreakerLock = circuitBreakerLock.then(() => lockAcquired);
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
      let totalRealizedLoss = 0;
      try {
        // TODO: stream from end of file when safety.audit.jsonl exceeds 1MB
        const raw = fs.readFileSync(auditPath(), 'utf8');
        for (const line of raw.split('\n')) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line) as { kind?: string; data?: { action?: string; date?: string; lossAmount?: number } };
            if (
              entry.kind === 'realized_loss' &&
              entry.data?.action === 'realized_loss' &&
              entry.data?.date === today &&
              typeof entry.data?.lossAmount === 'number'
            ) {
              totalRealizedLoss += entry.data.lossAmount;
            }
          } catch {
            // skip malformed lines
          }
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        // ENOENT = no audit file yet — totalRealizedLoss stays 0
      }
      if (totalRealizedLoss > safety.dailyLossCircuitBreakerDollars) {
        throw new PreTradeRiskError(
          'dailyCircuitBreaker',
          `daily realized losses $${totalRealizedLoss.toFixed(2)} exceed dailyLossCircuitBreakerDollars ($${safety.dailyLossCircuitBreakerDollars.toFixed(2)})`,
        );
      }
    } finally {
      releaseLock();
    }
  }

  // 3. maxPositionConcentrationPct
  if (safety.maxPositionConcentrationPct !== undefined && portfolioNAVDollars > 0) {
    const concentrationPct = (sizeDollars / portfolioNAVDollars) * 100;
    if (concentrationPct > safety.maxPositionConcentrationPct) {
      throw new PreTradeRiskError(
        'concentration',
        `position size $${sizeDollars.toFixed(2)} is ${concentrationPct.toFixed(1)}% of NAV ($${portfolioNAVDollars.toFixed(2)}), exceeds limit ${safety.maxPositionConcentrationPct}%`,
      );
    }
  }
}

/**
 * Append a realized_loss entry to the audit log.
 * Call at end of run() when fill result indicates a net loss vs floor price.
 */
export function appendRealizedLoss(params: {
  ticker: string;
  lossAmount: number;
}): void {
  const today = new Date().toISOString().slice(0, 10);
  const entry = {
    ts: new Date().toISOString(),
    kind: 'realized_loss',
    data: {
      action: 'realized_loss',
      ticker: params.ticker,
      lossAmount: params.lossAmount,
      date: today,
    },
  };
  const dir = keaHome();
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(auditPath(), JSON.stringify(entry) + '\n', 'utf8');
}

// ── Exit config merge ─────────────────────────────────────────────────────────

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
