/**
 * Workflow module barrel export + module-level singletons.
 *
 * Mirrors `src/watcherSingleton.ts` pattern.
 *
 * WorkflowEngine singleton:
 *   - Call `initWorkflowEngine(engine)` once at process startup.
 *   - Subsequent calls to `getWorkflowEngine()` return the same instance.
 *   - Tests inject via `setWorkflowEngineForTests(engine)`.
 *
 * DefaultPolicyEngine singleton:
 *   - Call `initPolicyEngine(engine)` once at process startup.
 *   - Tests inject via `setPolicyEngineForTests(engine)`.
 */

export * from './types.js';
export * from './validate.js';
export * from './predicate.js';
export * from './engine.js';
export * from './journal.js';
export * from './policies.js';
export * from './templates.js';

import type { WorkflowEngine } from './engine.js';
import type { DefaultPolicyEngine } from './policies.js';

// ── WorkflowEngine singleton ──────────────────────────────────────────────────

let workflowEngineInstance: WorkflowEngine | undefined;

export function setWorkflowEngineForTests(e: WorkflowEngine | undefined): void {
  workflowEngineInstance = e;
}

export function resetWorkflowEngineForTests(): void {
  workflowEngineInstance = undefined;
}

export function getWorkflowEngine(): WorkflowEngine {
  if (!workflowEngineInstance) {
    throw new Error(
      'WorkflowEngine singleton not initialized. Call initWorkflowEngine() or setWorkflowEngineForTests() first.',
    );
  }
  return workflowEngineInstance;
}

export function isWorkflowEngineInitialized(): boolean {
  return workflowEngineInstance !== undefined;
}

export function initWorkflowEngine(e: WorkflowEngine): void {
  if (workflowEngineInstance) {
    throw new Error('WorkflowEngine singleton already initialized');
  }
  workflowEngineInstance = e;
}

// ── DefaultPolicyEngine singleton ─────────────────────────────────────────────

let policyEngineInstance: DefaultPolicyEngine | undefined;

export function setPolicyEngineForTests(e: DefaultPolicyEngine | undefined): void {
  policyEngineInstance = e;
}

export function resetPolicyEngineForTests(): void {
  policyEngineInstance = undefined;
}

export function getPolicyEngine(): DefaultPolicyEngine {
  if (!policyEngineInstance) {
    throw new Error(
      'DefaultPolicyEngine singleton not initialized. Call initPolicyEngine() or setPolicyEngineForTests() first.',
    );
  }
  return policyEngineInstance;
}

export function isPolicyEngineInitialized(): boolean {
  return policyEngineInstance !== undefined;
}

export function initPolicyEngine(e: DefaultPolicyEngine): void {
  if (policyEngineInstance) {
    throw new Error('DefaultPolicyEngine singleton already initialized');
  }
  policyEngineInstance = e;
}
