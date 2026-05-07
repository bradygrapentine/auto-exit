/**
 * DefaultPolicyEngine — position-detection subscriber with an if→then rule set.
 *
 * Each policy maps a SimplePredicate condition to a list of Actions.
 * Policies apply at most once per (ticker, side) position — re-detection of
 * the same position does not re-fire.  The rule set is persisted atomically to
 * $KEA_HOME/policies.json, mirroring the safety.ts pattern.
 *
 * See spec: docs/superpowers/specs/2026-05-05-strategy-composition.md §3.3.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Action, SimplePredicate, EvaluationContext } from './types.js';

// ── path helpers ──────────────────────────────────────────────────────────────

function keaHome(): string {
  return process.env['KEA_HOME'] ?? path.join(os.homedir(), '.kalshi-exit-assistant');
}

function policiesPath(override?: string): string {
  return override ?? path.join(keaHome(), 'policies.json');
}

// ── domain types ──────────────────────────────────────────────────────────────

/** A detected position passed to handlePositionDetected. */
export interface DetectedPosition {
  ticker: string;
  side: 'yes' | 'no';
  [key: string]: unknown;
}

/**
 * A single policy rule.
 *
 * `applyOncePerPosition` is always `true` at v1 — policies fire at most once
 * per (ticker, side) pair regardless of how many times the same position is
 * reported.
 */
export interface Policy {
  id: string;
  condition: SimplePredicate;
  action: Action[];
  applyOncePerPosition: true;
}

// ── file I/O ──────────────────────────────────────────────────────────────────

interface PersistedPolicies {
  version: 1;
  policies: Policy[];
}

function readPoliciesFile(filePath: string): Policy[] | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    try {
      const parsed = JSON.parse(raw) as PersistedPolicies;
      if (parsed.version !== 1) {
        throw new Error(`Unsupported policies.json version: ${String(parsed.version)}`);
      }
      return parsed.policies;
    } catch (parseErr) {
      throw new Error(
        `policies.json is corrupt: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

function writePoliciesFileAtomic(policies: Policy[], filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.tmp`;
  const data: PersistedPolicies = { version: 1, policies };
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, filePath);
}

// ── constructor deps ──────────────────────────────────────────────────────────

export interface PolicyEngineDeps {
  predicateEval: (p: SimplePredicate, ctx: EvaluationContext) => boolean;
  registerSyntheticFn: (synthetic: unknown) => void;
  runStrategyFn: (strategy: string, params: Record<string, unknown>) => void;
  alertFn: (channel: 'log' | 'tui' | 'mcp', message: string) => void;
  now: () => number;
  /** Override persistence path (useful in tests). */
  persistencePath?: string;
}

// ── engine ────────────────────────────────────────────────────────────────────

export class DefaultPolicyEngine {
  private readonly deps: PolicyEngineDeps;
  private readonly filePath: string;

  /** In-memory rule set. Source of truth after construction. */
  private policies: Policy[];

  /**
   * Tracks which (policyId, ticker:side) pairs have already fired so the same
   * position cannot trigger a policy more than once.
   * Key: `${policyId}|${ticker}:${side}`
   */
  private readonly applied = new Set<string>();

  constructor(deps: PolicyEngineDeps) {
    this.deps = deps;
    this.filePath = policiesPath(deps.persistencePath);
    // Load persisted policies or start with empty set.
    this.policies = readPoliciesFile(this.filePath) ?? [];
  }

  // ── management API ──────────────────────────────────────────────────────────

  addPolicy(p: Policy): void {
    if (this.policies.some((existing) => existing.id === p.id)) {
      throw new Error(`Policy with id "${p.id}" already exists`);
    }
    this.policies = [...this.policies, p];
    writePoliciesFileAtomic(this.policies, this.filePath);
  }

  removePolicy(id: string): boolean {
    const next = this.policies.filter((p) => p.id !== id);
    if (next.length === this.policies.length) return false;
    this.policies = next;
    writePoliciesFileAtomic(this.policies, this.filePath);
    return true;
  }

  listPolicies(): readonly Policy[] {
    return this.policies;
  }

  // ── event handling ──────────────────────────────────────────────────────────

  /**
   * Evaluate every policy against the detected position.  For each match,
   * execute all actions unless this (policy, ticker, side) has already fired.
   */
  handlePositionDetected(position: DetectedPosition): void {
    if (this.policies.length === 0) return;

    const ctx: EvaluationContext = {
      event: position as unknown as Record<string, unknown>,
      vars: {},
    };

    for (const policy of this.policies) {
      const appliedKey = `${policy.id}|${position.ticker}:${position.side}`;
      if (this.applied.has(appliedKey)) continue;

      const matches = this.deps.predicateEval(policy.condition, ctx);
      if (!matches) continue;

      this.applied.add(appliedKey);
      for (const action of policy.action) {
        this.executeAction(action);
      }
    }
  }

  // ── internal ───────────────────────────────────────────────────────────────

  private executeAction(action: Action): void {
    switch (action.type) {
      case 'register_synthetic':
        this.deps.registerSyntheticFn(action.synthetic);
        break;
      case 'run_strategy':
        this.deps.runStrategyFn(action.strategy, action.params);
        break;
      case 'alert':
        this.deps.alertFn(action.channel, action.message);
        break;
      case 'cancel_synthetic':
      case 'set_var':
        // Not dispatched to external callbacks at policy layer (v1).
        break;
    }
  }
}
