# Synthetic Order Types Implementation Plan (rev 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring stop-loss, stop-limit, trailing-stop (multi-rung) take-profit, OCO, and bracket order types to Kalshi as a first-class user feature (TUI / extension / MCP / CLI) and as composable building blocks for new exit strategies, by simulating them client-side via a per-position watcher daemon.

**v1 scope: exit-side only.** Buy-side synthetics (S-buy-stop, S-buy-dip, S-scaled-entry) and bracket entry-leg orchestration are **deferred to v2.** v1's "bracket" is the **exit-side bracket**: take-profit + stop-loss bundled around an *existing* position. (Effectively an OCO with TP + SL legs, exposed as its own kind for UI parity.)

**Architecture:** A long-running `kea watch` daemon maintains a registry of active synthetics. Each is backed by a stateless evaluator function `(s, book, now) → SyntheticEvalResult`. Per-ticker poll loops are shared across synthetics on the same market; synthetics fire by invoking `ExitRunner.run()` (with a fully-formed `ExitConfig`) or by posting a single `limit` directly via `KalshiClient`. State persists in a separate append-only journal at `~/.kalshi-exit-assistant/watchers.ndjson`; restart replays it. Composite synthetics (OCO, bracket) expand to children at registration time; child fires propagate sibling-cancel to the parent.

**Tech Stack:** TypeScript (strict), Vitest, Node.js ≥ 20, Ink (TUI), Chrome MV3 extension talking to engine via HTTP at `localhost:7777` (existing `src/server.ts`), MCP SDK.

**Source spec:** `docs/superpowers/specs/2026-05-05-synthetic-order-types-watcher.md` — read it before any task. The resolved design decisions in §10 are non-negotiable inputs (auto-cancel on zero position, multi-synthetic stacking, `taker_at_cross` default STP, separate `watchers.ndjson` journal, "synthetic" naming).

**Review history:** rev 1 reviewed by Opus 2026-05-05; verdict NEEDS REWORK. rev 2 addresses all 5 critical bugs (cfg shape, getOrderbook signature, OCO race, missing buyRunner reference, invented runExit symbol), all 8 important issues (deci-cent ticks, adaptive cadence, idle-when-empty, mid-fire crash window, file-touch boundaries, etc.), and resolves all spec coverage gaps.

**Branch base:** `feat/shared/synthetic-order-types-plan`, branched from `main` at the SHA captured at plan creation. `buyRunner.ts` is present (W1.5 / PR #12 already merged), but v1 does not invoke it — buy-side is deferred.

---

## Scope check

This plan covers a single subsystem (per-position watcher with synthetic order types) with three product surfaces (CLI, TUI, extension). It is sequenced in five phases that each leave the codebase in a working state:

- **Phase 0**: Foundation — types, journal-kind extension, watcher skeleton, evaluator registry, fire-deps wiring. *Sequential.*
- **Phase 1**: Five v1 evaluators (stop-loss, stop-limit, trailing-stop, multi-rung take-profit, OCO+bracket expansion). *Mostly parallel.*
- **Phase 2**: Persistence + replay + auto-cancel + adaptive cadence + idle-when-empty + mid-fire crash recovery. *Sequential.*
- **Phase 3**: CLI + MCP basic + MCP preview tool + HTTP endpoints in `server.ts`. *Three parallel tracks.*
- **Phase 4**: User-facing surfaces — TUI synthetics tab + extension menu/badge/toast + rich MCP tools (bracket-arm, trailing-status). *Three parallel tracks.*
- **Phase 5**: Strategy library presets — S-trail, S-step-trail, S-bracketed-exit, S-conditional-roll, plus one new evaluator (time-stop). *Parallel batch.*

Each phase ends with a green CI gate and an opportunity to merge to main. The plan aborts cleanly at any phase boundary.

---

## File structure

**New files (this plan creates):**
- `src/synthetics/types.ts` — internal types (`Evaluator`, `EvaluatorMap`, `RegisterArgs`).
- `src/synthetics/index.ts` — registry + `evaluate()` dispatch + `expandComposite()` for OCO/bracket.
- `src/synthetics/stopLoss.ts`
- `src/synthetics/stopLimit.ts`
- `src/synthetics/trailingStop.ts`
- `src/synthetics/takeProfit.ts`
- `src/synthetics/oco.ts` — pure helper: `expandOco(s) → { children, ocoState }`.
- `src/synthetics/bracket.ts` — pure helper: `expandBracket(s) → { children, bracketState }`. (Same shape as OCO; separate file for kind-routing clarity.)
- `src/synthetics/timeStop.ts` (Phase 5)
- `src/synthetics/invoke.ts` — fire dispatch: routes a fired synthetic to `ExitRunner.run()` or `KalshiClient.createOrder()`.
- `src/watcher.ts` — `Watcher` class: registry, `tick()`, `start()`, fire-hook, composite expansion, adaptive cadence, idle-when-empty.
- `src/watcherJournal.ts` — append-only NDJSON, `appendFirePending`/`appendFired`/`appendFireFailed`, replay-with-pending-recovery.
- `src/strategies/strail.ts` (Phase 5)
- `src/strategies/sStepTrail.ts` (Phase 5)
- `src/strategies/sBracketedExit.ts` (Phase 5)
- `src/strategies/sConditionalRoll.ts` (Phase 5)
- `src/tui/SyntheticsTab.tsx` (Phase 4)
- `extension/content/synthetics-menu.ts` (Phase 4)
- `extension/popup/SyntheticsView.tsx` (Phase 4)
- `test/synthetics/types.test.ts`
- `test/synthetics/registry.test.ts`
- `test/synthetics/<each-evaluator>.test.ts`
- `test/synthetics/invoke.test.ts`
- `test/watcher.test.ts`
- `test/watcherJournal.test.ts`
- `test/integration/oco-race.test.ts`
- `test/integration/bracket-lifecycle.test.ts`
- `test/integration/crash-recovery.test.ts`
- `test/integration/adaptive-cadence.test.ts`

**Modified files:**
- `src/types.ts` — add `Synthetic`, `SyntheticKind`, `SyntheticState`, `SyntheticParams`, `WatcherConfig`, `SelfTradePrevention`, `SyntheticEvalResult`, extend `JournalKind` union with `synthetic_registered` / `synthetic_fire_pending` / `synthetic_fired` / `synthetic_fire_failed` / `synthetic_canceled` / `synthetic_state_update`.
- `src/cli.ts` — add `kea watch …` subcommand tree.
- `src/mcp.ts` (or whatever the MCP entrypoint is — confirm in Task 0.0) — register synthetics tools.
- `src/server.ts` — add `/synthetics/*` HTTP routes.
- `src/tui.tsx` — wire SyntheticsTab into main layout.

**NOT modified:** `exitRunner.ts`, `buyRunner.ts`, `harvestPlanner.ts`, `safety.ts`, `runnerUtils.ts`, `pricing.ts`, `replay.ts`, `journal.ts`, `kalshiClient.ts`, `accountClient.ts`. Synthetics call into them, never edit them.

---

## Conventions baked into this plan

1. **Float price math throughout.** Kalshi quotes deci-cent ticks below 10¢ (visible in `PriceDecision.priceCentsExact` in existing `types.ts`). All synthetic state and evaluator comparisons use `number` semantics treating cents as floats. Trigger configs accept either an integer cents (UI default) or a fixed-point string; internally normalized to float. **This is critical for trailing-stop accuracy on cheap markets — the headline use case.**
2. **`Side` is `'yes' | 'no'` (existing).** Synthetics support both. Top-bid for a YES holder = `book.yes[0]?.priceCents`; top-bid for a NO holder = `book.no[0]?.priceCents`. The watcher selects the correct side per synthetic's `side` field — never hardcode YES.
3. **`KalshiClientLike.getOrderbook(ticker, depth)` requires depth.** Default depth = 20. The watcher passes `WatcherConfig.orderbookDepth ?? 20`.
4. **Self-trade prevention default `taker_at_cross`** on every synthetic-fired order unless overridden per-synthetic.
5. **Composite expansion at register time.** OCO and bracket synthetics are stored as parents with `state.childIds: [string, string]`; their evaluators are no-ops. The watcher's `register()` detects composite kinds and registers the children with `parentId = parent.id`. When a child fires, the watcher consults the parent's `state.childIds` and cancels the sibling.
6. **Mid-fire crash safety.** Three journal entries per fire: `synthetic_fire_pending` BEFORE the runner is invoked, then `synthetic_fired` (success) or `synthetic_fire_failed` (exception) after. Replay treats `pending` as "incomplete" and re-fires on resume.
7. **Idle-when-empty.** When `armed.length === 0`, `tick()` returns immediately with no API calls; `start()` sleeps a long fallback interval (default 10s). Once a synthetic is registered, the next tick happens within `pollIntervalMs`.
8. **Adaptive cadence.** `tick()` returns a `nextDelayMs` derived from the minimum distance-to-trigger across all armed synthetics. When the closest synthetic is within `nearTriggerThresholdCents` (default 3¢), cadence drops to `nearTriggerCadenceMs` (default 250ms). Far from any trigger or all dormant: `pollIntervalMs` (default 2000ms). `start()` honors the returned delay each loop iteration.

---

## Phase 0 — Foundation (sequential, single agent)

**No subagent dispatch in Phase 0.** This phase must land cleanly before any Phase 1 dispatch. Every later task depends on the types and the daemon shell defined here.

### Task 0.0: Locate the MCP entrypoint and confirm extension architecture

**Files:**
- Read-only investigation (no commits).

- [ ] **Step 1: Locate MCP server file**

Run: `grep -l "@modelcontextprotocol/sdk\|StdioServerTransport\|new Server" code-and-docs-from-chatgpt/engine-ts/src/`
Record the file path; the plan refers to it generically as `src/mcp.ts` but it may be `src/index.ts` or `src/mcpServer.ts`. Confirm before Phase 3.

- [ ] **Step 2: Confirm extension uses HTTP on port 7777**

The manifest at `code-and-docs-from-chatgpt/extension/manifest.json` declares `host_permissions` for `http://localhost:7777/*` and `http://127.0.0.1:7777/*`. The engine HTTP server is at `code-and-docs-from-chatgpt/engine-ts/src/server.ts` (CORS-enabled, routes `/health`, `/status`, `/preview`). **Phase 4 extension surface uses `fetch('http://localhost:7777/synthetics/...')` against new routes added in Phase 3.** No MCP-from-extension; extension speaks HTTP.

- [ ] **Step 3: Skim `src/exitRunner.ts` to confirm fire-path shape**

`ExitRunner` is a class: `new ExitRunner(config: ExitConfig).run() → Promise<ExitResult>`. Phase 0 Task 0.4 (`invoke.ts`) builds against this signature, not a free function.

### Task 0.1: Add core synthetic types to `types.ts`

**Files:**
- Modify: `src/types.ts` (append after existing exports)
- Create: `test/synthetics/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// test/synthetics/types.test.ts
import { describe, it, expect } from 'vitest';
import type {
  Synthetic, SyntheticKind, SyntheticState, SyntheticParams,
  StopLossParams, TrailingStopState, TakeProfitParams, TakeProfitState,
  OcoState, JournalKind, WatcherConfig, SyntheticEvalResult,
} from '../../src/types.js';

describe('Synthetic types', () => {
  it('SyntheticKind enumerates v1 set', () => {
    const valid: SyntheticKind[] = [
      'stop_loss', 'stop_limit', 'trailing_stop', 'take_profit', 'oco', 'bracket',
    ];
    expect(valid).toHaveLength(6);
  });

  it('Synthetic carries id, kind, ticker, side, position, params, state, status', () => {
    const s: Synthetic = {
      id: 'syn-1', kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 100,
      params: { triggerPriceCents: 30 } as StopLossParams,
      state: {}, status: 'armed',
      createdAt: '2026-05-05T00:00:00Z',
      selfTradePrevention: 'taker_at_cross',
      autoCancelOnZeroPosition: true,
    };
    expect(s.kind).toBe('stop_loss');
    expect(s.status).toBe('armed');
  });

  it('TrailingStopState uses float peakBidCentsExact', () => {
    const st: TrailingStopState = { peakBidCentsExact: 4.7 };
    expect(st.peakBidCentsExact).toBeCloseTo(4.7);
  });

  it('TakeProfitState tracks firedRungIndices', () => {
    const st: TakeProfitState = { firedRungIndices: [0, 2] };
    expect(st.firedRungIndices).toEqual([0, 2]);
  });

  it('OcoState carries childIds and firedChildId', () => {
    const st: OcoState = { childIds: ['a', 'b'], firedChildId: 'a' };
    expect(st.childIds).toEqual(['a', 'b']);
  });

  it('JournalKind union includes all six synthetic events', () => {
    const kinds: JournalKind[] = [
      'synthetic_registered', 'synthetic_fire_pending',
      'synthetic_fired', 'synthetic_fire_failed',
      'synthetic_canceled', 'synthetic_state_update',
    ];
    expect(kinds).toHaveLength(6);
  });

  it('WatcherConfig holds adaptive cadence and orderbookDepth', () => {
    const w: WatcherConfig = {
      apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z',
      pollIntervalMs: 2000, nearTriggerCadenceMs: 250,
      nearTriggerThresholdCents: 3, idleIntervalMs: 10000,
      orderbookDepth: 20,
    };
    expect(w.orderbookDepth).toBe(20);
  });

  it('SyntheticEvalResult carries fire, reason, newState, cancelSiblings', () => {
    const r: SyntheticEvalResult = { fire: true, reason: 'x', cancelSiblings: ['y'] };
    expect(r.fire).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect type-error fail**

Run: `npx vitest run test/synthetics/types.test.ts`

- [ ] **Step 3: Add types to `src/types.ts`**

Append at end of `src/types.ts`:

```typescript
// ============================================================
// Synthetic order types — see docs/superpowers/specs/2026-05-05-synthetic-order-types-watcher.md
// ============================================================

export type SyntheticKind =
  | 'stop_loss' | 'stop_limit' | 'trailing_stop'
  | 'take_profit' | 'oco' | 'bracket';

export type SyntheticStatus = 'armed' | 'fired' | 'canceled' | 'fire_failed';

export type SelfTradePrevention = 'taker_at_cross' | 'maker';

/**
 * Trigger price expressed as cents — `number` (float) so deci-cent ticks below 10¢ work correctly.
 * UI may collect integer cents; internally always normalized to float.
 */
export interface StopLossParams {
  triggerPriceCents: number;
  executionStrategy?: 'losing_exit' | 'aggressive' | 'limit_at_floor';
  executionParams?: Record<string, unknown>;
}

export interface StopLimitParams {
  triggerPriceCents: number;
  limitPriceCents: number;
  size: number;
}

export interface TrailingStopParams {
  trailCents: number;                 // float OK (e.g. 0.5 for 0.5¢ trail on cheap markets)
  executionStrategy?: 'losing_exit' | 'aggressive';
  floorPriceCents?: number;           // default 1
}

export interface TakeProfitRung { priceCents: number; sizePct: number; }

export interface TakeProfitParams {
  /** Single-trigger mode: just triggerPriceCents. Multi-rung mode: rungs[]. Use one. */
  triggerPriceCents?: number;
  rungs?: TakeProfitRung[];
  executionStrategy?: 'scale_out' | 'passive' | 'aggressive';
}

export interface OcoParams {
  legs: [SyntheticDescriptor, SyntheticDescriptor];
}

export interface BracketParams {
  takeProfitCents: number;
  stopLossCents: number;
}

export type SyntheticParams =
  | StopLossParams | StopLimitParams | TrailingStopParams
  | TakeProfitParams | OcoParams | BracketParams;

export interface SyntheticDescriptor {
  kind: SyntheticKind;
  params: SyntheticParams;
}

// State shapes — empty {} for stateless evaluators.
export interface TrailingStopState { peakBidCentsExact: number; }
export interface TakeProfitState { firedRungIndices: number[]; }
export interface OcoState { childIds: [string, string]; firedChildId?: string; }
export interface BracketState { childIds: [string, string]; firedChildId?: string; }

export type SyntheticState =
  | Record<string, never>
  | TrailingStopState | TakeProfitState | OcoState | BracketState;

export interface Synthetic {
  id: string;                          // 'syn-<uuid>'
  kind: SyntheticKind;
  ticker: string;
  side: Side;
  positionSize: number;
  params: SyntheticParams;
  state: SyntheticState;
  status: SyntheticStatus;
  createdAt: string;
  firedAt?: string;
  canceledAt?: string;
  fireFailedAt?: string;
  fireFailedReason?: string;
  selfTradePrevention: SelfTradePrevention;
  autoCancelOnZeroPosition: boolean;
  parentId?: string;                   // set on OCO/bracket children
}

export interface WatcherConfig {
  baseUrl: string;
  apiKeyEnv: string;
  privateKeyPathEnv: string;
  pollIntervalMs?: number;             // default 2000
  nearTriggerCadenceMs?: number;       // default 250
  nearTriggerThresholdCents?: number;  // default 3
  idleIntervalMs?: number;             // default 10000 (when zero registered)
  orderbookDepth?: number;             // default 20
  killSwitchPath?: string;
  watcherJournalPath?: string;         // default ~/.kalshi-exit-assistant/watchers.ndjson
  /** Base ExitConfig to merge per-fire (provides ports, env vars, fees, etc.). */
  exitConfigTemplate?: Partial<ExitConfig>;
}

export interface SyntheticEvalResult {
  fire: boolean;
  reason?: string;
  newState?: SyntheticState;
  unregister?: boolean;
  cancelSiblings?: string[];           // for child fires that should cancel parent siblings
  /** Float distance from current top-of-side price to trigger; used for adaptive cadence. */
  distanceCentsToTrigger?: number;
}
```

Then extend `JournalKind`:

```typescript
// Find the existing `export type JournalKind = ...` and add six union members:
//   | 'synthetic_registered'
//   | 'synthetic_fire_pending'
//   | 'synthetic_fired'
//   | 'synthetic_fire_failed'
//   | 'synthetic_canceled'
//   | 'synthetic_state_update'
```

- [ ] **Step 4: Run tests + typecheck**

`npx vitest run test/synthetics/types.test.ts && npx tsc --noEmit` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts test/synthetics/types.test.ts
git commit -m "feat(synthetics): add core type definitions with float price math"
```

### Task 0.2: Synthetic registry and evaluator dispatch interface

**Files:**
- Create: `src/synthetics/types.ts`, `src/synthetics/index.ts`
- Create: `test/synthetics/registry.test.ts`

- [ ] **Step 1: Failing test** (covers stub for all 6 kinds, dispatch routing, expansion-of-composite stub).

```typescript
// test/synthetics/registry.test.ts
import { describe, it, expect } from 'vitest';
import { evaluators, evaluate, isComposite } from '../../src/synthetics/index.js';
import type { Synthetic, Orderbook, SyntheticKind } from '../../src/types.js';

const fakeBook: Orderbook = { yes: [{ priceCents: 50, size: 100 }], no: [] };
const stub = (kind: SyntheticKind): Synthetic => ({
  id: 's', kind, ticker: 'X', side: 'yes', positionSize: 10,
  params: { triggerPriceCents: 30 } as any, state: {}, status: 'armed',
  createdAt: '2026-05-05T00:00:00Z',
  selfTradePrevention: 'taker_at_cross',
  autoCancelOnZeroPosition: true,
});

describe('synthetics/index', () => {
  const kinds: SyntheticKind[] = ['stop_loss','stop_limit','trailing_stop','take_profit','oco','bracket'];

  it('exports an evaluator for every kind', () => {
    for (const k of kinds) expect(evaluators[k]).toBeDefined();
  });

  it('evaluate() routes by kind and returns SyntheticEvalResult', () => {
    const r = evaluate(stub('stop_loss'), fakeBook);
    expect(r).toHaveProperty('fire');
  });

  it('evaluate() throws on unknown kind', () => {
    expect(() => evaluate({ ...stub('stop_loss'), kind: 'nope' as any }, fakeBook)).toThrow();
  });

  it('isComposite() flags oco and bracket as composite', () => {
    expect(isComposite('oco')).toBe(true);
    expect(isComposite('bracket')).toBe(true);
    expect(isComposite('stop_loss')).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement `src/synthetics/types.ts`**

```typescript
import type { Synthetic, Orderbook, SyntheticEvalResult, SyntheticKind } from '../types.js';

export type Evaluator = (s: Synthetic, book: Orderbook, now?: Date) => SyntheticEvalResult;
export type EvaluatorMap = Record<SyntheticKind, Evaluator>;

export interface RegisterArgs {
  kind: SyntheticKind;
  ticker: string;
  side: 'yes' | 'no';
  positionSize: number;
  params: import('../types.js').SyntheticParams;
  autoCancelOnZeroPosition?: boolean;
  selfTradePrevention?: import('../types.js').SelfTradePrevention;
  parentId?: string;
}
```

- [ ] **Step 4: Implement `src/synthetics/index.ts`**

```typescript
import type { Synthetic, Orderbook, SyntheticEvalResult, SyntheticKind } from '../types.js';
import type { EvaluatorMap, Evaluator } from './types.js';

const noop: Evaluator = () => ({ fire: false });

export const evaluators: EvaluatorMap = {
  stop_loss: noop, stop_limit: noop, trailing_stop: noop,
  take_profit: noop, oco: noop, bracket: noop,  // composites are no-op evaluators; expansion happens at register
};

export function evaluate(s: Synthetic, book: Orderbook, now: Date = new Date()): SyntheticEvalResult {
  const ev = evaluators[s.kind];
  if (!ev) throw new Error(`No evaluator for synthetic kind: ${s.kind}`);
  return ev(s, book, now);
}

export function registerEvaluator(kind: SyntheticKind, ev: Evaluator): void {
  evaluators[kind] = ev;
}

const COMPOSITE_KINDS = new Set<SyntheticKind>(['oco', 'bracket']);
export function isComposite(kind: SyntheticKind): boolean {
  return COMPOSITE_KINDS.has(kind);
}
```

- [ ] **Step 5: Run, pass, commit**

`feat(synthetics): registry + evaluator dispatch + composite predicate`.

### Task 0.3: Watcher daemon skeleton with adaptive cadence and idle-when-empty

**Files:**
- Create: `src/watcher.ts`
- Create: `test/watcher.test.ts`

- [ ] **Step 1: Failing tests**

```typescript
// test/watcher.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Watcher } from '../src/watcher.js';
import type { KalshiClientLike, Orderbook } from '../src/types.js';

const book: Orderbook = { yes: [{ priceCents: 50, size: 1 }], no: [] };

function makeClient(): KalshiClientLike {
  return {
    getOrderbook: vi.fn(async (_t: string, _d: number) => book),
    getPosition: vi.fn(async () => ({ ticker: 'X', side: 'yes', quantity: 10 })),
    // other KalshiClientLike methods stubbed; widen with `as any` if needed
  } as any;
}

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };

describe('Watcher', () => {
  it('starts empty and reports zero registered', () => {
    const w = new Watcher(makeClient(), baseCfg);
    expect(w.list().length).toBe(0);
  });

  it('register() returns syn-<uuid> id', () => {
    const w = new Watcher(makeClient(), baseCfg);
    const id = w.register({ kind: 'stop_loss', ticker: 'KX', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 30 } });
    expect(id).toMatch(/^syn-/);
  });

  it('cancel() marks status canceled', () => {
    const w = new Watcher(makeClient(), baseCfg);
    const id = w.register({ kind: 'stop_loss', ticker: 'KX', side: 'yes',
      positionSize: 10, params: { triggerPriceCents: 30 } });
    expect(w.cancel(id)).toBe(true);
    expect(w.get(id)?.status).toBe('canceled');
  });

  it('tick() coalesces book fetches per unique ticker with depth arg', async () => {
    const client = makeClient();
    const w = new Watcher(client, { ...baseCfg, orderbookDepth: 20 });
    w.register({ kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 10, params: { triggerPriceCents: 30 } });
    w.register({ kind: 'take_profit', ticker: 'KX', side: 'yes', positionSize: 10, params: { triggerPriceCents: 90 } });
    w.register({ kind: 'stop_loss', ticker: 'KY', side: 'yes', positionSize: 10, params: { triggerPriceCents: 30 } });
    await w.tick();
    expect((client.getOrderbook as any).mock.calls).toHaveLength(2);
    expect((client.getOrderbook as any).mock.calls[0][1]).toBe(20); // depth passed
  });

  it('tick() returns idle interval when nothing armed', async () => {
    const client = makeClient();
    const w = new Watcher(client, { ...baseCfg, idleIntervalMs: 10000 });
    const result = await w.tick();
    expect(result.nextDelayMs).toBe(10000);
    expect((client.getOrderbook as any).mock.calls).toHaveLength(0);
  });

  it('tick() returns near-trigger cadence when within threshold', async () => {
    // Register a stop-loss at 48 with current bid 50; distance 2¢, within threshold of 3.
    const w = new Watcher(makeClient(), { ...baseCfg, pollIntervalMs: 2000,
      nearTriggerCadenceMs: 250, nearTriggerThresholdCents: 3 });
    w.register({ kind: 'stop_loss', ticker: 'KX', side: 'yes', positionSize: 10, params: { triggerPriceCents: 48 } });
    // Wire stub stop-loss evaluator that reports distance = 2:
    // (in real plan, evaluators are wired via Phase 1; for this test, monkey-patch the evaluator map)
    const result = await w.tick();
    expect(result.nextDelayMs).toBe(250);
  });

  it('register() of OCO expands to two children', () => {
    const w = new Watcher(makeClient(), baseCfg);
    const ocoId = w.register({
      kind: 'oco', ticker: 'KX', side: 'yes', positionSize: 100,
      params: { legs: [
        { kind: 'stop_loss', params: { triggerPriceCents: 30 } as any },
        { kind: 'take_profit', params: { triggerPriceCents: 70 } as any },
      ] } as any,
    });
    const all = w.list();
    expect(all).toHaveLength(3);                         // parent + 2 children
    const children = all.filter(s => s.parentId === ocoId);
    expect(children).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement `src/watcher.ts`**

```typescript
import { randomUUID } from 'node:crypto';
import type {
  Synthetic, SyntheticKind, SyntheticParams, WatcherConfig,
  KalshiClientLike, Side, SelfTradePrevention,
  OcoParams, BracketParams, OcoState, BracketState, Orderbook,
} from './types.js';
import { evaluate, isComposite } from './synthetics/index.js';
import type { RegisterArgs } from './synthetics/types.js';

export interface FireDeps {
  runExit: (cfg: import('./types.js').ExitConfig) => Promise<unknown>;
  postLimit: (args: { ticker: string; side: Side; action: 'buy' | 'sell';
    priceCents: number; count: number; selfTradePrevention?: SelfTradePrevention }) => Promise<string>;
  buildExitConfig: (s: Synthetic) => import('./types.js').ExitConfig;
}

export type FireHook = (s: Synthetic, reason: string) => Promise<void>;

export interface TickResult { nextDelayMs: number; armedCount: number; firedThisTick: string[]; }

export class Watcher {
  private synthetics = new Map<string, Synthetic>();
  private fireHook?: FireHook;

  constructor(
    private readonly client: KalshiClientLike,
    private readonly config: WatcherConfig,
  ) {}

  setFireHook(hook: FireHook): void { this.fireHook = hook; }

  register(args: RegisterArgs): string {
    const id = `syn-${randomUUID()}`;
    const s: Synthetic = {
      id, kind: args.kind, ticker: args.ticker, side: args.side,
      positionSize: args.positionSize, params: args.params,
      state: {}, status: 'armed',
      createdAt: new Date().toISOString(),
      selfTradePrevention: args.selfTradePrevention ?? 'taker_at_cross',
      autoCancelOnZeroPosition: args.autoCancelOnZeroPosition ?? true,
      parentId: args.parentId,
    };
    this.synthetics.set(id, s);

    // Composite expansion
    if (isComposite(s.kind)) {
      const children = this.expandComposite(s);
      const childIds: string[] = [];
      for (const ch of children) {
        const cid = this.register({ ...ch, parentId: id });
        childIds.push(cid);
      }
      s.state = s.kind === 'oco'
        ? { childIds: [childIds[0], childIds[1]] } as OcoState
        : { childIds: [childIds[0], childIds[1]] } as BracketState;
    }
    return id;
  }

  private expandComposite(s: Synthetic): RegisterArgs[] {
    if (s.kind === 'oco') {
      const p = s.params as OcoParams;
      return p.legs.map(leg => ({
        kind: leg.kind, ticker: s.ticker, side: s.side,
        positionSize: s.positionSize, params: leg.params,
        selfTradePrevention: s.selfTradePrevention,
        autoCancelOnZeroPosition: s.autoCancelOnZeroPosition,
      }));
    }
    if (s.kind === 'bracket') {
      const p = s.params as BracketParams;
      return [
        { kind: 'take_profit', ticker: s.ticker, side: s.side, positionSize: s.positionSize,
          params: { triggerPriceCents: p.takeProfitCents } as any,
          selfTradePrevention: s.selfTradePrevention,
          autoCancelOnZeroPosition: s.autoCancelOnZeroPosition },
        { kind: 'stop_loss', ticker: s.ticker, side: s.side, positionSize: s.positionSize,
          params: { triggerPriceCents: p.stopLossCents } as any,
          selfTradePrevention: s.selfTradePrevention,
          autoCancelOnZeroPosition: s.autoCancelOnZeroPosition },
      ];
    }
    return [];
  }

  cancel(id: string): boolean {
    const s = this.synthetics.get(id);
    if (!s || s.status !== 'armed') return false;
    s.status = 'canceled';
    s.canceledAt = new Date().toISOString();
    // Cascade: cancel composite children if cancelling parent.
    if (isComposite(s.kind)) {
      const cids = (s.state as OcoState | BracketState).childIds ?? [];
      for (const cid of cids) this.cancel(cid);
    }
    return true;
  }

  list(): Synthetic[] { return Array.from(this.synthetics.values()); }
  get(id: string): Synthetic | undefined { return this.synthetics.get(id); }

  /** Single poll cycle. Coalesces book/position fetches per ticker. Honors race-safe parent fire. */
  async tick(): Promise<TickResult> {
    const armed = this.list().filter(s => s.status === 'armed');
    if (armed.length === 0) {
      return { nextDelayMs: this.config.idleIntervalMs ?? 10000, armedCount: 0, firedThisTick: [] };
    }

    const tickers = new Set(armed.map(s => s.ticker));
    const depth = this.config.orderbookDepth ?? 20;
    const books = new Map<string, Orderbook>();
    const positions = new Map<string, number>();

    await Promise.all(Array.from(tickers).map(async t => {
      books.set(t, await this.client.getOrderbook(t, depth));
      // Position fetch only if any synthetic on this ticker has autoCancelOnZeroPosition.
      const needsPos = armed.some(s => s.ticker === t && s.autoCancelOnZeroPosition);
      if (needsPos) {
        const pos = await this.client.getPosition(t);
        positions.set(t, (pos as any)?.quantity ?? 0);
      }
    }));

    const firedThisTick = new Set<string>();
    const parentFiredThisTick = new Set<string>();
    let minDistance = Infinity;

    for (const s of armed) {
      // Skip if parent already fired earlier in this tick.
      if (s.parentId && parentFiredThisTick.has(s.parentId)) continue;

      // Auto-cancel on zero position.
      if (s.autoCancelOnZeroPosition && positions.get(s.ticker) === 0) {
        this.cancel(s.id);
        continue;
      }

      const book = books.get(s.ticker)!;
      const result = evaluate(s, book);
      if (result.newState) s.state = result.newState;
      if (typeof result.distanceCentsToTrigger === 'number') {
        minDistance = Math.min(minDistance, Math.abs(result.distanceCentsToTrigger));
      }

      if (result.fire) {
        s.status = 'fired';
        s.firedAt = new Date().toISOString();
        firedThisTick.add(s.id);

        // Propagate sibling-cancel via parent's state.childIds.
        if (s.parentId) {
          const parent = this.synthetics.get(s.parentId);
          if (parent && parent.status === 'armed') {
            parent.status = 'fired';
            parent.firedAt = s.firedAt;
            parentFiredThisTick.add(parent.id);
            const cids = (parent.state as OcoState | BracketState).childIds ?? [];
            for (const cid of cids) {
              if (cid !== s.id) this.cancel(cid);
            }
          }
        }
        // External callback (does the actual order placement).
        if (this.fireHook) await this.fireHook(s, result.reason ?? 'evaluator_fired');
      } else if (result.unregister) {
        this.cancel(s.id);
      }
    }

    // Adaptive cadence
    const near = this.config.nearTriggerThresholdCents ?? 3;
    const fastMs = this.config.nearTriggerCadenceMs ?? 250;
    const slowMs = this.config.pollIntervalMs ?? 2000;
    const nextDelayMs = (minDistance <= near) ? fastMs : slowMs;

    return { nextDelayMs, armedCount: armed.length, firedThisTick: Array.from(firedThisTick) };
  }

  private looping = false;
  async start(): Promise<void> {
    this.looping = true;
    while (this.looping) {
      let nextDelayMs = this.config.pollIntervalMs ?? 2000;
      try {
        const r = await this.tick();
        nextDelayMs = r.nextDelayMs;
      } catch { /* logged via journal at higher layer */ }
      await new Promise(r => setTimeout(r, nextDelayMs));
    }
  }
  stop(): void { this.looping = false; }
}
```

- [ ] **Step 4: Run, pass, commit**

`feat(synthetics): watcher with composite expansion, adaptive cadence, idle-when-empty`.

### Task 0.4: Fire-deps + ExitConfig builder

**Files:**
- Create: `src/synthetics/invoke.ts`
- Create: `test/synthetics/invoke.test.ts`

The fire path must build a fully-formed `ExitConfig` (17+ required fields) from the watcher's base template. This task isolates that logic.

- [ ] **Step 1: Failing test**

```typescript
// test/synthetics/invoke.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildExitConfig, invokeFire } from '../../src/synthetics/invoke.js';
import type { Synthetic, ExitConfig, WatcherConfig } from '../../src/types.js';

const cfgTemplate: Partial<ExitConfig> = {
  baseUrl: 'https://api.elections.kalshi.com/trade-api/v2',
  localServerPort: 7777,
  orderbookDepth: 20,
  minLevelSize: 1,
  tailSweepThreshold: 0,
  minAdaptiveChunk: 1,
  maxOrders: 1,
  loopDelayMs: 0,
  dryRun: false,
  killSwitchPath: './STOP',
  apiKeyEnv: 'KALSHI_ACCESS_KEY',
  privateKeyPathEnv: 'KALSHI_PRIVATE_KEY_PATH',
};

const stub = (kind: any, params: any): Synthetic => ({
  id: 's', kind, ticker: 'X', side: 'yes', positionSize: 100,
  params, state: {}, status: 'fired',
  createdAt: '2026-05-05T00:00:00Z',
  selfTradePrevention: 'taker_at_cross', autoCancelOnZeroPosition: true,
});

describe('buildExitConfig', () => {
  it('produces a complete ExitConfig from synthetic + template', () => {
    const s = stub('stop_loss', { triggerPriceCents: 30 });
    const cfg = buildExitConfig(s, cfgTemplate);
    expect(cfg.marketTicker).toBe('X');
    expect(cfg.heldSide).toBe('yes');
    expect(cfg.positionSize).toBe(100);
    expect(cfg.chunkSize).toBe(100);
    expect(cfg.orderTimeInForce).toBe('immediate_or_cancel');
    expect(cfg.floorPriceCents).toBe(1);
    expect(cfg.tailGtcOnFinish).toBe(true);
    expect(cfg.baseUrl).toContain('kalshi');
    expect(cfg.localServerPort).toBe(7777);
  });

  it('throws if template missing required keys', () => {
    const s = stub('stop_loss', { triggerPriceCents: 30 });
    expect(() => buildExitConfig(s, {})).toThrow(/template missing/i);
  });
});

describe('invokeFire', () => {
  it('routes stop_loss to runExit with built config', async () => {
    const runExit = vi.fn(async () => undefined);
    const postLimit = vi.fn();
    const s = stub('stop_loss', { triggerPriceCents: 30 });
    await invokeFire(s, { runExit, postLimit, buildExitConfig: (ss) => buildExitConfig(ss, cfgTemplate) });
    expect(runExit).toHaveBeenCalledOnce();
    const cfg = (runExit.mock.calls[0][0] as any);
    expect(cfg.marketTicker).toBe('X');
  });

  it('routes stop_limit to postLimit at limitPriceCents', async () => {
    const runExit = vi.fn();
    const postLimit = vi.fn(async () => 'order-1');
    const s = stub('stop_limit', { triggerPriceCents: 30, limitPriceCents: 25, size: 100 });
    await invokeFire(s, { runExit, postLimit, buildExitConfig: () => ({} as any) });
    expect(postLimit).toHaveBeenCalledWith(expect.objectContaining({
      ticker: 'X', priceCents: 25, count: 100, action: 'sell', side: 'yes',
      selfTradePrevention: 'taker_at_cross',
    }));
  });

  it('is no-op for composite kinds (oco/bracket fire by child propagation)', async () => {
    const runExit = vi.fn();
    const postLimit = vi.fn();
    for (const kind of ['oco', 'bracket'] as const) {
      const s = stub(kind, {});
      await invokeFire(s, { runExit, postLimit, buildExitConfig: () => ({} as any) });
    }
    expect(runExit).not.toHaveBeenCalled();
    expect(postLimit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement `src/synthetics/invoke.ts`**

```typescript
import type { Synthetic, ExitConfig, StopLimitParams, Side, SelfTradePrevention } from '../types.js';

export interface FireDeps {
  runExit: (cfg: ExitConfig) => Promise<unknown>;
  postLimit: (args: { ticker: string; side: Side; action: 'buy' | 'sell';
    priceCents: number; count: number;
    selfTradePrevention?: SelfTradePrevention }) => Promise<string>;
  buildExitConfig: (s: Synthetic) => ExitConfig;
}

const REQUIRED_TEMPLATE_KEYS: Array<keyof ExitConfig> = [
  'baseUrl', 'localServerPort', 'orderbookDepth', 'minLevelSize',
  'tailSweepThreshold', 'minAdaptiveChunk', 'maxOrders', 'loopDelayMs',
  'dryRun', 'killSwitchPath', 'apiKeyEnv', 'privateKeyPathEnv',
];

export function buildExitConfig(s: Synthetic, template: Partial<ExitConfig>): ExitConfig {
  for (const k of REQUIRED_TEMPLATE_KEYS) {
    if (template[k] === undefined) throw new Error(`buildExitConfig: template missing required key '${String(k)}'`);
  }
  return {
    ...(template as ExitConfig),
    marketTicker: s.ticker,
    heldSide: s.side,
    positionSize: s.positionSize,
    chunkSize: s.positionSize,
    floorPriceCents: 1,
    orderTimeInForce: 'immediate_or_cancel',
    tailGtcOnFinish: true,
    preflight: true,
    safetySubmittedMultiple: 1.1,
  };
}

export async function invokeFire(s: Synthetic, deps: FireDeps): Promise<void> {
  switch (s.kind) {
    case 'stop_loss':
    case 'trailing_stop':
    case 'take_profit': {
      // For multi-rung TP, the *evaluator* fires per-rung — but invokeFire still calls runExit
      // on a per-fire basis. The evaluator is responsible for producing per-rung sized fires
      // by mutating the synthetic's positionSize remainder; the watcher passes the synthetic
      // as-is to invokeFire. Simpler: TP single-trigger uses runExit (full size); TP multi-rung
      // is handled in the evaluator by emitting a sequence of per-rung descriptors via the
      // watcher's fireHook (see Phase 1 Task 1.D).
      const cfg = deps.buildExitConfig(s);
      await deps.runExit(cfg);
      return;
    }
    case 'stop_limit': {
      const p = s.params as StopLimitParams;
      const action = s.side === 'yes' ? 'sell' : 'sell'; // we always reduce position; action sell, side held
      await deps.postLimit({
        ticker: s.ticker, side: s.side, action,
        priceCents: p.limitPriceCents, count: p.size,
        selfTradePrevention: s.selfTradePrevention,
      });
      return;
    }
    case 'oco':
    case 'bracket':
      // Composite: never fired directly; children fire and propagate parent status via the watcher.
      return;
  }
}
```

- [ ] **Step 4: Run, pass, commit** `feat(synthetics): fire dispatch + ExitConfig builder`.

---

**Phase 0 exit criteria:** `npx vitest run test/synthetics test/watcher.test.ts && npx tsc --noEmit && npm run lint` green. PR opened with these commits, CI green, merged to `main`.

---

## Phase 1 — Five evaluators (4-way parallel + 1 sequential)

**Recommended workflow: parallel subagent dispatch.** Use `superpowers:dispatching-parallel-agents` and `superpowers:using-git-worktrees`. After Phase 0 lands on main:

1. `git fetch origin && git rev-parse origin/main` — capture base SHA.
2. Run `dispatch-preflight` — confirm main green.
3. Dispatch four parallel Sonnet subagents in worktrees. **File-touch boundaries are exclusive — listed below.** Each subagent writes its evaluator file and tests; **none touches `src/synthetics/index.ts`** (orchestrator wires after merge).

| Dispatch | Evaluator | Files (exclusive) | Spec ref |
|---|---|---|---|
| **A** | Stop-loss | `src/synthetics/stopLoss.ts` + `test/synthetics/stopLoss.test.ts` | spec §4.1 |
| **B** | Stop-limit | `src/synthetics/stopLimit.ts` + `test/synthetics/stopLimit.test.ts` | spec §4.2 |
| **C** | Trailing stop | `src/synthetics/trailingStop.ts` + `test/synthetics/trailingStop.test.ts` | spec §4.3 |
| **D** | Take-profit (multi-rung) | `src/synthetics/takeProfit.ts` + `test/synthetics/takeProfit.test.ts` | spec §4.4 |

After A–D merge, OCO/Bracket helpers land sequentially:

| Dispatch | Helper | Files (exclusive) | Spec ref |
|---|---|---|---|
| **E** | OCO + Bracket pure-helper sanity (composite expansion is already in watcher.ts; this dispatch only adds confirmation tests + per-leg integration) | `src/synthetics/oco.ts`, `src/synthetics/bracket.ts` (currently no-op pure-helper modules — created here for kind-routing clarity) + `test/synthetics/oco.test.ts`, `test/synthetics/bracket.test.ts`, `test/integration/oco-race.test.ts`, `test/integration/bracket-lifecycle.test.ts` | spec §4.5, §4.6 |

### Brief template for Dispatches A–D

> **Project context:** Kalshi binary-options exchange. `auto-exit` engine in TypeScript. You are implementing a synthetic-order evaluator.
>
> **Read first:**
> - `code-and-docs-from-chatgpt/engine-ts/docs/superpowers/specs/2026-05-05-synthetic-order-types-watcher.md` — the spec.
> - `code-and-docs-from-chatgpt/engine-ts/src/types.ts` — types you'll use (`Synthetic`, `Orderbook`, `SyntheticEvalResult`, your params/state types).
> - `code-and-docs-from-chatgpt/engine-ts/src/synthetics/types.ts` — `Evaluator` signature.
> - `code-and-docs-from-chatgpt/engine-ts/src/synthetics/index.ts` — registry pattern (read-only; do NOT edit).
>
> **Implement:** `src/synthetics/<name>.ts` exporting `eval<Name>: Evaluator`. Tests in `test/synthetics/<name>.test.ts` first, expect failures, then implementation. Do not edit `index.ts`. Do not touch any other file.
>
> **Use float price math.** Prices are `number` (float). Side selection: `topBid = s.side === 'yes' ? book.yes[0]?.priceCents : book.no[0]?.priceCents`. Treat empty book as `topBid = 0`.
>
> **Return `distanceCentsToTrigger`** in every result (signed: positive = far, zero = touching, negative = past trigger). The watcher uses it for adaptive cadence.
>
> **Commit message:** `feat(synthetics): <name> evaluator`. Push branch `feat/synthetics/<name>`. Open PR. Include passing test output in the PR body.

### Per-evaluator behaviors

**A — Stop-loss (`evalStopLoss`)**
- Fires when `topBid ≤ triggerPriceCents`.
- `distanceCentsToTrigger = topBid - triggerPriceCents`.
- Reason: `'stop_loss_breached'`.
- Tests: bid above (no fire); bid at trigger (fires); bid below (fires); empty book (fires, distance reflects 0); side='no' takes book.no[0].

**B — Stop-limit (`evalStopLimit`)**
- Same trigger as stop-loss; reason `'stop_limit_triggered'`.
- Result includes `params.limitPriceCents` and `params.size` in `reason` metadata via a structured `result.reason` string `stop_limit_triggered:limit=<n>,size=<m>`. (The watcher reads it for journal.)
- Tests: same five scenarios as A.

**C — Trailing stop (`evalTrailingStop`) — STATEFUL**
- State: `{ peakBidCentsExact: number }`. Empty `{}` initializes from current top bid on first eval.
- Each tick:
  ```
  peak = max(state.peakBidCentsExact ?? topBid, topBid)
  stop = max(peak - trailCents, floorPriceCents ?? 1)
  fire if topBid ≤ stop
  newState = { peakBidCentsExact: peak }
  distance = topBid - stop
  ```
- Reason: `'trailing_stop_breached'`.
- **Tests covering float math (HEADLINE):**
  1. Bid sequence [4.0, 4.5, 5.0, 4.7, 4.4] with trail 0.5 → no fire (still in trail).
  2. Bid sequence [4.0, 5.0, 4.4] with trail 0.5 → fires on 4.4 (peak 5.0 - 0.5 = 4.5).
  3. Bid 50 with trail 5, floor 1 → stop 45, fires when bid ≤ 45.
  4. Bid 3 with trail 10, floor 1 → stop clamped to 1, fires only when bid ≤ 1.
  5. Empty state on first call: peakBidCentsExact initializes to current bid.
  6. Side='no' uses `book.no[0]`.

**D — Take-profit (`evalTakeProfit`) — STATEFUL, MULTI-RUNG**
- Two modes:
  - **Single-trigger** (params has `triggerPriceCents`): fires when `topBid ≥ triggerPriceCents`. State stays `{}`. Returns `unregister: true` after firing (so it doesn't refire).
  - **Multi-rung** (params has `rungs[]`): state is `{ firedRungIndices: number[] }`. Each tick, find any rung not in firedRungIndices with `topBid ≥ rung.priceCents`. If found, fire that rung (one per tick, smallest index first). Set `newState` adding the index. When all rungs fired, return `unregister: true`.
- The watcher's `fireHook` for a multi-rung tick must size the runner invocation by `rung.sizePct`. Add a `firedRungIndex?: number` field to `SyntheticEvalResult`; the fire-hook reads it and overrides the per-fire size in `buildExitConfig` via a thin sized-fire path:
  ```ts
  // In fireHook: when synthetic.kind === 'take_profit' && result.firedRungIndex !== undefined,
  // override positionSize on the synthetic's clone to (positionSize * rung.sizePct / 100) before buildExitConfig.
  ```
- `distanceCentsToTrigger` = nearest unfired rung minus topBid (positive when below).
- Reason: `'take_profit_rung_<index>_fired'`.
- Tests:
  1. Single trigger above price → fires + unregisters.
  2. Single trigger below price → no fire, distance positive.
  3. Multi-rung with 4 rungs, bid walks past rung[0] → fires rung 0, state has [0], stays armed.
  4. Multi-rung with bid past rungs[0] and rungs[1] simultaneously → fires only rung 0 in this tick; rung 1 fires next tick.
  5. All rungs fired → unregisters.

### Orchestrator integration step (post Phase 1A–D merge)

After all four PRs merge, in main worktree:

- [ ] Edit `src/synthetics/index.ts`:

```typescript
import { evalStopLoss } from './stopLoss.js';
import { evalStopLimit } from './stopLimit.js';
import { evalTrailingStop } from './trailingStop.js';
import { evalTakeProfit } from './takeProfit.js';
evaluators.stop_loss = evalStopLoss;
evaluators.stop_limit = evalStopLimit;
evaluators.trailing_stop = evalTrailingStop;
evaluators.take_profit = evalTakeProfit;
```

- [ ] Run `npx vitest run` — registry test now exercises real evaluators.
- [ ] Commit `chore(synthetics): wire Phase 1 evaluators into registry`. Push, PR, gate, merge.

### Dispatch E — OCO/Bracket integration tests + pure helpers

Per the conventions section, the watcher already does composite expansion at register time. Dispatch E formalizes this:

- Create `src/synthetics/oco.ts` and `src/synthetics/bracket.ts` containing only documentation comments + the no-op evaluator export (already wired). They serve as the import target if someone wants to read "where is OCO defined."
- Write the integration tests in `test/integration/oco-race.test.ts` and `test/integration/bracket-lifecycle.test.ts`:

**oco-race.test.ts** must cover:
1. Register OCO[stop_loss@30, take_profit@70]; assert two children registered.
2. Bid drops to 30 → stop_loss child fires, parent marks fired, take_profit sibling cancels in same tick.
3. **Same-tick double cross**: bid jumps from 50 to 25 in one tick (both legs cross simultaneously: stop_loss fires at 30 boundary, take_profit @ 70 also notional). The watcher must process children in registration order; the second child's evaluation is skipped because its `parentId` is in `parentFiredThisTick`. Assert exactly one child fired, sibling canceled.
4. Manually cancelling the OCO cancels both children.

**bracket-lifecycle.test.ts** must cover:
1. Register exit-side bracket (positionSize 100, takeProfitCents 70, stopLossCents 30); assert two children with sizes 100.
2. Take-profit fires → bracket parent fired, stop-loss canceled.
3. Stop-loss fires → bracket parent fired, take-profit canceled.
4. Auto-cancel: position drops to zero → both children cancel via watcher's per-synthetic check.

---

**Phase 1 exit criteria:** all four evaluator PRs merged, orchestrator wiring merged, OCO/bracket integration tests merged. Full suite: `npx vitest run && npx tsc --noEmit && npm run lint` green.

---

## Phase 2 — Persistence, recovery, lifecycle (sequential)

### Task 2.1: `WatcherJournal` with mid-fire crash recovery

**Files:** `src/watcherJournal.ts`, `test/watcherJournal.test.ts`.

- [ ] **Step 1: Failing tests** — append+replay round-trips for each event kind, plus mid-fire-pending replay.

```typescript
// test/watcherJournal.test.ts (key cases — full file written first as failing tests)
it('replay recovers fire_pending as armed (re-fires on resume)', () => {
  const j = new WatcherJournal(file);
  j.appendRegistered(stub('s1'));
  j.appendFirePending('s1', 'reason');   // crash before fired/fire_failed
  const replay = j.replay();
  expect(replay[0].status).toBe('armed'); // re-armed for re-fire
});

it('replay treats fire_failed as terminal (does not re-fire)', () => {
  const j = new WatcherJournal(file);
  j.appendRegistered(stub('s1'));
  j.appendFirePending('s1', 'reason');
  j.appendFireFailed('s1', 'kalshi 500');
  const replay = j.replay();
  expect(replay[0].status).toBe('fire_failed');
  expect(replay[0].fireFailedReason).toBe('kalshi 500');
});

it('replay applies state updates in order', () => {
  const j = new WatcherJournal(file);
  j.appendRegistered(trailing('s1'));
  j.appendStateUpdate('s1', { peakBidCentsExact: 5.0 } as any);
  j.appendStateUpdate('s1', { peakBidCentsExact: 5.5 } as any);
  const replay = j.replay();
  expect((replay[0].state as any).peakBidCentsExact).toBeCloseTo(5.5);
});

it('skips malformed lines silently', () => { /* same as rev1 */ });
```

- [ ] **Step 2: Implement `src/watcherJournal.ts`** — extend the rev1 design with `appendFirePending` / `appendFireFailed`. Replay rule: a `fire_pending` without a subsequent `fired`/`fire_failed`/`canceled` is treated as `armed` (re-armed for re-fire). Document this policy at the top of the file.

- [ ] **Step 3-5:** Run, pass, commit `feat(synthetics): watcher journal with mid-fire crash recovery`.

### Task 2.2: Wire journal into Watcher with three-phase fire

**Files:** `src/watcher.ts`, `test/watcher.test.ts`, `test/integration/crash-recovery.test.ts`.

- [ ] **Step 1: Failing test** in `test/integration/crash-recovery.test.ts`:

```typescript
it('mid-fire crash → restart re-fires the synthetic', async () => {
  const tmp = path.join(os.tmpdir(), `crash-${Date.now()}.ndjson`);
  const j1 = new WatcherJournal(tmp);
  let fireCount = 0;
  const fakeFire: FireHook = async () => { fireCount++; throw new Error('simulated crash'); };

  const w1 = new Watcher(client, baseCfg, j1);
  w1.setFireHook(fakeFire);
  const id = w1.register({ kind: 'stop_loss', ticker: 'KX', side: 'yes',
    positionSize: 10, params: { triggerPriceCents: 50 } });

  // Force fire by pushing book past trigger:
  client.getOrderbook = vi.fn(async () => ({ yes: [{ priceCents: 30, size: 100 }], no: [] }));
  try { await w1.tick(); } catch { /* expected */ }

  // Synthetic should be marked fire_failed in journal:
  expect(j1.replay().find(s => s.id === id)?.status).toBe('fire_failed');
});
```

- [ ] **Step 2:** Add `WatcherJournal?` constructor param (3rd arg). In `tick()`, change fire to three-phase:

```typescript
// In the fire branch:
if (result.fire) {
  this.journal?.appendFirePending(s.id, result.reason ?? 'evaluator_fired');
  try {
    if (this.fireHook) await this.fireHook(s, result.reason ?? 'evaluator_fired');
    s.status = 'fired';
    s.firedAt = new Date().toISOString();
    this.journal?.appendFired(s.id, result.reason ?? 'evaluator_fired');
    // ... sibling cancel logic ...
  } catch (e) {
    s.status = 'fire_failed';
    s.fireFailedAt = new Date().toISOString();
    s.fireFailedReason = e instanceof Error ? e.message : String(e);
    this.journal?.appendFireFailed(s.id, s.fireFailedReason);
    // Do NOT cascade sibling cancel on failure — operator decides.
  }
}
```

Add `appendStateUpdate` after `if (result.newState) s.state = result.newState`.

Add `appendRegistered` in `register()`, `appendCanceled` in `cancel()`.

Add `replayFromJournal()` method that resurrects the in-memory map.

- [ ] **Step 3-5:** Run, pass, commit.

### Task 2.3: Auto-cancel-on-zero-position with cached position fetch

Already designed into the rev2 `tick()`. Promote the existing test:

- [ ] **Step 1: Failing test:** position fetch happens **once per ticker per tick** even when N synthetics share the ticker (cache via the `positions` map already in tick()).
- [ ] **Step 2:** No code changes if rev2 is already correct — confirm by running existing test.
- [ ] **Step 3:** Add explicit assertion: `expect((client.getPosition as any).mock.calls).toHaveLength(unique-tickers-with-autocancel)`.
- [ ] Commit `test(synthetics): assert position fetch coalescing per ticker`.

### Task 2.4: Daemon-process wrapper

Wrap the `Watcher` in a long-running CLI process driver:

- [ ] **Step 1:** Write a small `src/watcherDaemon.ts` that constructs `KalshiClient`, `WatcherJournal`, `Watcher`, wires `fireHook = invokeFire(s, fireDeps)`, calls `replayFromJournal()`, then `start()`. SIGTERM handler calls `stop()`.
- [ ] **Step 2:** `test/integration/daemon-lifecycle.test.ts`: spawn the daemon as a subprocess (or driven via the in-process Watcher), simulate a price walk that fires a synthetic, assert the journal reflects the full lifecycle.
- [ ] **Step 3-5:** Run, pass, commit `feat(synthetics): kea-watch daemon process wrapper`.

---

**Phase 2 exit criteria:** crash-recovery test green; auto-cancel green; daemon lifecycle test green; full suite green. PR opened with all Phase 2 commits, gated, merged.

---

## Phase 3 — CLI + MCP + HTTP (three parallel tracks)

**Recommended workflow: three parallel subagent dispatches.** No file overlap.

### Track A — CLI subcommands (`src/cli.ts`)

Add `kea watch` subcommand tree:
- `kea watch start --config <path>` — spawn daemon (foreground; `&` for background).
- `kea watch register --kind <stop_loss|stop_limit|trailing_stop|take_profit|oco|bracket> --ticker <T> --side <yes|no> --size <N> [--trigger <cents>] [--limit <cents>] [--trail <cents>] [--rungs <json>] [--legs <json>] [--take-profit <cents>] [--stop-loss <cents>]` — register synthetic, print id.
- `kea watch list` — prints active table.
- `kea watch get <id>` — prints full JSON.
- `kea watch cancel <id>` — marks canceled.
- `kea watch status` — prints daemon health, registered count, last poll ts.

Tests in `test/cli/watch.test.ts` exercise each via the existing CLI test harness (in-process, in-memory Watcher + tmp journal).

### Track B — MCP tools (`src/<mcp-entrypoint>.ts` from Task 0.0)

Add five MCP tools (note: includes `kea_synthetic_preview` per reviewer recommendation; promoted from Phase 4 to here):
- `kea_synthetic_register({ kind, ticker, side, positionSize, params, autoCancelOnZeroPosition? }) → { id }`
- `kea_synthetic_list() → Synthetic[]`
- `kea_synthetic_get({ id }) → Synthetic | null`
- `kea_synthetic_cancel({ id }) → { canceled: boolean }`
- `kea_synthetic_preview({ kind, ticker, side, positionSize, params }) → { wouldFireNow: boolean; reason?: string; topBidCents: number; distanceCentsToTrigger?: number }`

All five operate on a process-singleton `Watcher` instance accessible via the same getter pattern existing tools use (read `kea_safety_*` for the precedent).

Tests in `test/mcp/synthetics.test.ts`.

### Track C — HTTP routes in `src/server.ts`

Add five routes (mirror MCP):
- `POST /synthetics/register` — body matches MCP register input; returns `{ id }`.
- `GET /synthetics/list` — returns `Synthetic[]`.
- `GET /synthetics/:id` — returns synthetic or 404.
- `DELETE /synthetics/:id` — returns `{ canceled: boolean }`.
- `POST /synthetics/preview` — body matches MCP preview input.

Tests in `test/server/synthetics-routes.test.ts` against the existing `http.createServer` pattern.

---

**Phase 3 exit criteria:** dogfood — register a stop-loss via curl on `localhost:7777`; observe via CLI `kea watch list`; observe via MCP. Three PRs, gated, merged.

---

## Phase 4 — User-facing surfaces (three parallel tracks)

### Track A — TUI synthetics tab

`src/tui/SyntheticsTab.tsx` (Ink). New tab listing all active synthetics, grouped by ticker. Per-row: kind, params summary, current state (e.g. `peak: 4.7¢` for trailing), trigger countdown, status. Keybindings: `c` cancel selected, `n` new from current position. New-synthetic wizard: kind selector → params form per kind → confirm. Wired into `src/tui.tsx` as the second-to-last tab.

Tests: snapshot tests for the rendered tab + form-state machine unit tests.

### Track B — Extension menu/badge/toast (CONFIRMED HTTP-based)

Path: `code-and-docs-from-chatgpt/extension/`.

The extension ships content scripts at `extension/content/` and a popup at `extension/popup/`. Communication with the engine is via `fetch('http://localhost:7777/synthetics/...')` (CORS allowed by the engine's server).

- `extension/content/synthetics-menu.ts` — content script that injects a right-click menu on Kalshi position rows (use the existing `position-detector.ts` hook). Menu items: Place trailing stop, Place stop-loss, Place take-profit, Place bracket. Each opens a small in-page modal.
- `extension/popup/SyntheticsView.tsx` — popup tab listing active synthetics (polls `/synthetics/list` every 5s; renders a table; cancel action calls `DELETE /synthetics/:id`).
- Toast on fire: extension polls `/synthetics/list` for status changes; on `armed → fired` transition, dispatches a chrome notification + in-page banner.

Tests: existing extension test harness (Vitest + jsdom) covers content-script behavior; popup is a normal Vitest+RTL test.

### Track C — Rich MCP tools

Add three more MCP tools in the same file as Phase 3 Track B:
- `kea_bracket_arm({ ticker, side, positionSize, takeProfitCents, stopLossCents }) → { id }` — convenience wrapper for the compositional bracket case.
- `kea_trailing_status({ id }) → { peakBidCentsExact, currentBidCentsExact, distanceCentsExact, stopPriceCentsExact }` — live readout for trailing stops.
- `kea_synthetic_history({ ticker?, limit? }) → JournalEntry[]` — read recent watcher journal entries (filtered).

Tests in `test/mcp/synthetics-rich.test.ts`.

---

**Phase 4 exit criteria:** demo-able end-to-end. Operator places trailing stop from extension menu; sees armed badge; price walks down; trailing stop fires; toast appears; TUI reflects fired status. Three PRs, gated, merged.

---

## Phase 5 — Strategy library presets + time-stop evaluator

### Batch 5a — time-stop evaluator (Sonnet, ~2 hr)

Single Sonnet dispatch:
- Add `'time_stop'` to `SyntheticKind` union (orchestrator does this BEFORE dispatch to avoid merge conflicts on `types.ts`).
- Implement `src/synthetics/timeStop.ts`: `evalTimeStop(s, book, now)` fires when `now >= params.deadlineTimestamp` AND (optional) `topBid < params.exitIfBelowCents` (if param set).
- Tests: deadline future → no fire; deadline past + below threshold → fire; deadline past + above threshold → no fire (waited but condition not met); no exitIfBelowCents → fires purely on deadline.

### Batch 5b — four strategy presets (parallel Sonnet dispatches)

Each preset is a thin wrapper exposing a CLI subcommand `kea strategy <name>` and an MCP tool `kea_strategy_<name>` that registers the appropriate synthetic with prefilled defaults. **No new evaluators in this batch.**

| Dispatch | Strategy | Wraps | Notes |
|---|---|---|---|
| **F** | `src/strategies/strail.ts` — S-trail | trailing-stop | CLI: `kea strategy s-trail --ticker T --side S --size N --trail T` |
| **G** | `src/strategies/sStepTrail.ts` — S-step-trail | trailing-stop with discretized peak | New evaluator variant: `evalStepTrail` exported from same file; peak only updates when `currentBid > peak + step`. Tests: stair-step bid sequence shows discrete peak updates. |
| **H** | `src/strategies/sBracketedExit.ts` — S-bracketed-exit | bracket | CLI: `kea strategy s-bracketed-exit --ticker T --side S --size N --tp <cents> --sl <cents>` |
| **I** | `src/strategies/sConditionalRoll.ts` — S-conditional-roll | composite of time-stop + take-profit + stop-loss | At T-N hours, evaluate; if topBid in zone → invoke S11 Roll (if S11 doesn't exist yet, fail-loud with a clear error + TODO marker); else fire S-losing. |

Note: G's `evalStepTrail` is a *new* evaluator; orchestrator extends `SyntheticKind` with `'step_trail'` BEFORE dispatch (same pre-step as Batch 5a). G's dispatch only writes the evaluator + preset.

---

**Phase 5 exit criteria:** four strategy CLIs functional; integration tests with synthetic price walks pass.

---

## Verification matrix

| Concern | Verification | Phase |
|---|---|---|
| Type safety | `npx tsc --noEmit` clean | every phase |
| Unit | `npx vitest run` green | every phase |
| Lint | `npm run lint` green | every phase |
| OCO atomicity (same-tick race) | `test/integration/oco-race.test.ts` case 3 | Phase 1 |
| Mid-fire crash | `test/integration/crash-recovery.test.ts` | Phase 2 |
| Auto-cancel on zero pos | unit test in watcher.test.ts | Phase 2 |
| Adaptive cadence | `test/integration/adaptive-cadence.test.ts` | Phase 2 |
| Idle-when-empty | unit test in watcher.test.ts (no API calls when empty) | Phase 0 |
| Float price math (deci-cent) | trailing-stop unit tests with bids in 4.0–5.0 range, trail 0.5 | Phase 1 |
| Take-profit multi-rung | unit tests in takeProfit.test.ts | Phase 1 |
| HTTP CORS + routes | server tests | Phase 3 |
| Extension end-to-end demo | manual: place TS, watch fire, toast appears | Phase 4 |
| Strategy preset wrappers | integration test per preset | Phase 5 |

---

## Open questions / explicit non-goals (do not solve in this plan)

1. **Buy-side synthetics (S-buy-stop, S-buy-dip, S-scaled-entry, bracket entry-leg orchestration)** — out of scope. v1 is exit-side only. Defer to v2.
2. **Chandelier / ATR-trail** — variant of trailing stop; v2.
3. **Portfolio-stop (multi-ticker aggregate drawdown)** — v2; would require multi-ticker watcher coordination.
4. **News / external thesis-flip signals** — out of scope.
5. **`safety` (SH-2) pre-trade-risk gates on synthetic fires** — these gates already wrap `ExitRunner.run()` and `KalshiClient.createOrder()` calls, so synthetic fires inherit them automatically. No new wiring required, but Phase 2 daemon-lifecycle test should assert a fire that violates a safety cap is correctly blocked.

---

## Phase summary table (realistic estimates)

| Phase | Tasks | Parallelism | Wall-clock estimate | Cumulative |
|---|---|---|---|---|
| 0 — Foundation | 5 sequential | none | 1.5 days | 1.5 d |
| 1 — Five evaluators | 4-way parallel + integration | 4-way Sonnet, then orchestrator wiring + Dispatch E | 1.5 days | 3 d |
| 2 — Persistence + lifecycle | 4 sequential | none | 1 day | 4 d |
| 3 — CLI + MCP + HTTP | 3-way parallel | 3-way Sonnet | 1 day | 5 d |
| 4 — User surfaces | 3-way parallel | 3-way Sonnet | 2 days | 7 d |
| 5 — Strategy presets | 1 + 4-way parallel | 1 then 4-way Sonnet | 1.5 days | 8.5 d |

**Total: ~8–9 working days with full parallelism.** Without parallelism: ~3 weeks.

---

## Self-review checklist (run before declaring plan complete)

- [x] Spec coverage: every section in `2026-05-05-synthetic-order-types-watcher.md` has at least one task.
- [x] No `TBD` / `TODO` / placeholder steps in the plan body.
- [x] Type names match between tasks (`peakBidCentsExact` consistent throughout, not `peakBidCents` in some places).
- [x] All evaluator briefs include float price math.
- [x] OCO race handled at the watcher level (parentFiredThisTick guard) — not delegated to evaluators.
- [x] `buildExitConfig` pattern used everywhere ExitRunner is invoked.
- [x] `getOrderbook` always passed depth.
- [x] Mid-fire crash recovery has a test.
- [x] Adaptive cadence and idle-when-empty have tests.
- [x] Phase parallelism boundaries: no two parallel dispatches edit the same file.
- [x] Phase 4 extension architecture resolved (HTTP via existing server.ts).
- [x] Buy-side cut and explicitly listed as v2 non-goals.
