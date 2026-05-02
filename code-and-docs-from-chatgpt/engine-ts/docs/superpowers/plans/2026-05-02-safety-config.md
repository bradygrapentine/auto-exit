# Safety Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist safety guards (`safetySubmittedMultiple`, `floorPriceCents`, `tailSweepThreshold`, `forbiddenTickers`) in `$KEA_HOME/safety.json` with atomic writes, expose read+write surfaces over MCP and TUI, merge values into every exit job at start, and journal every mutation for forensics.

**Architecture:** New `src/safety.ts` mirrors the `credentials.ts` pattern (atomic tmp+rename, `0o600`, `$KEA_HOME`-rooted). Safety values are *guard rails*: at `exitRunner.run()` entry the engine merges safety.json into the passed `ExitConfig` such that the cap can only tighten (`min` for multipliers, `max` for floors, `union` for forbidden tickers). Five new MCP tools (`kea_safety_get`, `kea_safety_set`, `kea_forbidden_list`, `kea_forbidden_add`, `kea_forbidden_remove`) and a TUI Safety tab read/write the file. Every mutation appends a `safety_config_changed` entry to the journal of any active job (or a daemon-level audit log when no job is running).

**Tech Stack:** TypeScript (NodeNext ESM), vitest, ink for TUI, `@modelcontextprotocol/sdk`. No new deps.

---

## File map

- **Create** `src/safety.ts` — module: types + `loadSafety`, `getSafety`, `setSafety`, `listForbidden`, `addForbiddenTicker`, `removeForbiddenTicker`, `mergeIntoExitConfig`.
- **Create** `test/safety.test.ts` — unit tests with temp-dir `KEA_HOME`.
- **Modify** `src/types.ts` — add `'safety_config_changed'` to `JournalKind` union; add `SafetyConfig` type.
- **Modify** `src/exitRunner.ts` — call `mergeIntoExitConfig` at start of `run()`; emit `safety_loaded` journal entry.
- **Modify** `src/cli.ts` — add `kea safety get/set` and `kea forbidden add/remove/list` subcommands.
- **Modify** `src/mcp.ts` — register five write tools alongside existing read-only tools.
- **Modify** `test/mcp.test.ts` — cover the five new tools.
- **Create** `src/tui/SafetyTab.tsx` — ink component listing values + forbidden tickers, with add/remove flow.
- **Modify** `src/tui/App.tsx` — register Safety tab.
- **Modify** `test/tui-app.test.tsx` — cover Safety tab states.

---

## Task 1: `SafetyConfig` type + journal kind

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add `SafetyConfig` interface and `ForbiddenEntry` type**

```typescript
// in src/types.ts, after ExitConfig:

export interface ForbiddenEntry {
  ticker: string;
  reason: string;
  addedAt: string;     // ISO 8601
  addedBy: string;     // 'cli' | 'mcp' | 'tui' | actor identity
}

export interface SafetyConfig {
  /** Hard upper bound on safetySubmittedMultiple. Per-job config may set lower; never higher. */
  safetySubmittedMultiple: number;     // default 1.1
  /** Hard lower bound on floorPriceCents. Per-job config may set higher; never lower. */
  floorPriceCents: number;             // default 0
  /** Hard lower bound on tailSweepThreshold. Per-job config may set higher; never lower. */
  tailSweepThreshold: number;          // default 0
  /** Tickers the engine must never touch. Unioned with per-job forbiddenTickers. */
  forbidden: ForbiddenEntry[];
  /** Schema version for forward compat. */
  version: 1;
}
```

- [ ] **Step 2: Add `'safety_config_changed'` and `'safety_loaded'` to `JournalKind`**

Locate `JournalKind` union in `src/types.ts` and add both literals. If the union is `type JournalKind = 'order_placed' | ...`, append `| 'safety_config_changed' | 'safety_loaded'`.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "types(safety): add SafetyConfig + journal kinds"
```

---

## Task 2: `safety.ts` — read/write skeleton

**Files:**
- Create: `src/safety.ts`
- Test: `test/safety.test.ts`

- [ ] **Step 1: Write failing test for default load (no file present)**

```typescript
// test/safety.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getSafety } from '../src/safety.js';

let tmpHome: string;
beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-safety-'));
  process.env.KEA_HOME = tmpHome;
});
afterEach(() => {
  delete process.env.KEA_HOME;
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

describe('safety: defaults when no file', () => {
  it('returns built-in defaults', () => {
    const s = getSafety();
    expect(s.version).toBe(1);
    expect(s.safetySubmittedMultiple).toBe(1.1);
    expect(s.floorPriceCents).toBe(0);
    expect(s.tailSweepThreshold).toBe(0);
    expect(s.forbidden).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/safety.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `safety.ts` skeleton**

```typescript
// src/safety.ts
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { SafetyConfig, ForbiddenEntry } from './types.js';

const DEFAULTS: SafetyConfig = {
  version: 1,
  safetySubmittedMultiple: 1.1,
  floorPriceCents: 0,
  tailSweepThreshold: 0,
  forbidden: [],
};

const HARD_BOUNDS = {
  safetySubmittedMultipleMin: 1.0,
  safetySubmittedMultipleMax: 1.2,
  floorPriceCentsMin: 0,
  floorPriceCentsMax: 99,
  tailSweepThresholdMin: 0,
  tailSweepThresholdMax: 1_000_000,
};

function homeDir(): string {
  return process.env.KEA_HOME ?? path.join(os.homedir(), '.kalshi-exit-assistant');
}

export function safetyPath(): string {
  return path.join(homeDir(), 'safety.json');
}

function readFile(): SafetyConfig | null {
  try {
    const raw = fs.readFileSync(safetyPath(), 'utf8');
    const parsed = JSON.parse(raw) as SafetyConfig;
    if (parsed.version !== 1) {
      throw new Error(`Unsupported safety.json version: ${parsed.version}`);
    }
    return parsed;
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

function writeFileAtomic(data: SafetyConfig): void {
  const dir = homeDir();
  fs.mkdirSync(dir, { recursive: true });
  const target = safetyPath();
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, target);
}

export function getSafety(): SafetyConfig {
  return readFile() ?? structuredClone(DEFAULTS);
}

export { HARD_BOUNDS };
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run test/safety.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/safety.ts test/safety.test.ts
git commit -m "feat(safety): module skeleton with getSafety + defaults"
```

---

## Task 3: `setSafety` with bounds validation

**Files:**
- Modify: `src/safety.ts`
- Test: `test/safety.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// append to test/safety.test.ts
import { setSafety } from '../src/safety.js';

describe('setSafety: bounds', () => {
  it('persists in-bounds values', () => {
    setSafety({ safetySubmittedMultiple: 1.05 });
    expect(getSafety().safetySubmittedMultiple).toBe(1.05);
  });

  it('rejects safetySubmittedMultiple > 1.2', () => {
    expect(() => setSafety({ safetySubmittedMultiple: 1.5 })).toThrow(/safetySubmittedMultiple/);
  });

  it('rejects safetySubmittedMultiple < 1.0', () => {
    expect(() => setSafety({ safetySubmittedMultiple: 0.9 })).toThrow(/safetySubmittedMultiple/);
  });

  it('rejects floorPriceCents > 99', () => {
    expect(() => setSafety({ floorPriceCents: 100 })).toThrow(/floorPriceCents/);
  });

  it('atomic write — does not corrupt on bad input', () => {
    setSafety({ floorPriceCents: 5 });
    try { setSafety({ floorPriceCents: 999 }); } catch { /* expected */ }
    expect(getSafety().floorPriceCents).toBe(5);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run test/safety.test.ts`
Expected: FAIL — `setSafety is not a function`.

- [ ] **Step 3: Implement `setSafety`**

```typescript
// in src/safety.ts
export function setSafety(patch: Partial<Omit<SafetyConfig, 'version' | 'forbidden'>>): SafetyConfig {
  const current = getSafety();
  const next: SafetyConfig = { ...current, ...patch };

  if (
    next.safetySubmittedMultiple < HARD_BOUNDS.safetySubmittedMultipleMin ||
    next.safetySubmittedMultiple > HARD_BOUNDS.safetySubmittedMultipleMax
  ) {
    throw new Error(
      `safetySubmittedMultiple must be in [${HARD_BOUNDS.safetySubmittedMultipleMin}, ${HARD_BOUNDS.safetySubmittedMultipleMax}]`,
    );
  }
  if (
    next.floorPriceCents < HARD_BOUNDS.floorPriceCentsMin ||
    next.floorPriceCents > HARD_BOUNDS.floorPriceCentsMax
  ) {
    throw new Error(`floorPriceCents must be in [0, 99]`);
  }
  if (
    next.tailSweepThreshold < HARD_BOUNDS.tailSweepThresholdMin ||
    next.tailSweepThreshold > HARD_BOUNDS.tailSweepThresholdMax
  ) {
    throw new Error(`tailSweepThreshold must be in [0, 1_000_000]`);
  }

  writeFileAtomic(next);
  return next;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run test/safety.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/safety.ts test/safety.test.ts
git commit -m "feat(safety): setSafety with hard-bound validation + atomic write"
```

---

## Task 4: forbidden-list mutators

**Files:**
- Modify: `src/safety.ts`
- Test: `test/safety.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// append to test/safety.test.ts
import { addForbiddenTicker, removeForbiddenTicker, listForbidden } from '../src/safety.js';

describe('forbidden tickers', () => {
  it('adds with reason + actor + timestamp', () => {
    addForbiddenTicker('FOO-P4', 'leg of pair trade', 'cli');
    const list = listForbidden();
    expect(list).toHaveLength(1);
    expect(list[0].ticker).toBe('FOO-P4');
    expect(list[0].reason).toBe('leg of pair trade');
    expect(list[0].addedBy).toBe('cli');
    expect(list[0].addedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('rejects empty reason', () => {
    expect(() => addForbiddenTicker('BAR', '', 'cli')).toThrow(/reason/);
  });

  it('rejects duplicate', () => {
    addForbiddenTicker('FOO-P4', 'r1', 'cli');
    expect(() => addForbiddenTicker('FOO-P4', 'r2', 'cli')).toThrow(/already/);
  });

  it('removes by ticker', () => {
    addForbiddenTicker('FOO-P4', 'r', 'cli');
    removeForbiddenTicker('FOO-P4');
    expect(listForbidden()).toEqual([]);
  });

  it('remove of non-existent is a no-op', () => {
    expect(() => removeForbiddenTicker('NOPE')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run test/safety.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement mutators**

```typescript
// in src/safety.ts
export function listForbidden(): ForbiddenEntry[] {
  return getSafety().forbidden;
}

export function addForbiddenTicker(ticker: string, reason: string, addedBy: string): ForbiddenEntry {
  if (!ticker.trim()) throw new Error('ticker is required');
  if (!reason.trim()) throw new Error('reason is required (audit trail)');
  const current = getSafety();
  if (current.forbidden.some((e) => e.ticker === ticker)) {
    throw new Error(`ticker ${ticker} already on forbidden list`);
  }
  const entry: ForbiddenEntry = {
    ticker,
    reason: reason.trim(),
    addedAt: new Date().toISOString(),
    addedBy,
  };
  writeFileAtomic({ ...current, forbidden: [...current.forbidden, entry] });
  return entry;
}

export function removeForbiddenTicker(ticker: string): void {
  const current = getSafety();
  const next = current.forbidden.filter((e) => e.ticker !== ticker);
  if (next.length === current.forbidden.length) return; // no-op
  writeFileAtomic({ ...current, forbidden: next });
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run test/safety.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/safety.ts test/safety.test.ts
git commit -m "feat(safety): forbidden-ticker add/remove/list with audit fields"
```

---

## Task 5: `mergeIntoExitConfig` — guard-rail merge

**Files:**
- Modify: `src/safety.ts`
- Test: `test/safety.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// append to test/safety.test.ts
import { mergeIntoExitConfig } from '../src/safety.js';
import type { ExitConfig } from '../src/types.js';

const baseConfig: ExitConfig = {
  marketTicker: 'FOO-YES-P1',
  heldSide: 'yes',
  positionSize: 1000,
  chunkSize: 500,
  maxOrders: 5,
  floorPriceCents: 0,
  tailSweepThreshold: 0,
  safetySubmittedMultiple: 1.1,
  forbiddenTickers: ['FOO-YES-P4'],
} as ExitConfig;

describe('mergeIntoExitConfig: guard rails', () => {
  it('caps safetySubmittedMultiple to the lower of (config, safety)', () => {
    setSafety({ safetySubmittedMultiple: 1.05 });
    const merged = mergeIntoExitConfig({ ...baseConfig, safetySubmittedMultiple: 1.1 });
    expect(merged.safetySubmittedMultiple).toBe(1.05);
  });

  it('floorPriceCents takes the MAX (floor can only rise)', () => {
    setSafety({ floorPriceCents: 1 });
    const merged = mergeIntoExitConfig({ ...baseConfig, floorPriceCents: 0 });
    expect(merged.floorPriceCents).toBe(1);
  });

  it('tailSweepThreshold takes the MAX', () => {
    setSafety({ tailSweepThreshold: 50 });
    const merged = mergeIntoExitConfig({ ...baseConfig, tailSweepThreshold: 0 });
    expect(merged.tailSweepThreshold).toBe(50);
  });

  it('forbiddenTickers is a union (deduped)', () => {
    addForbiddenTicker('GLOBAL-NEVER', 'compliance', 'cli');
    const merged = mergeIntoExitConfig(baseConfig);
    expect(new Set(merged.forbiddenTickers)).toEqual(new Set(['FOO-YES-P4', 'GLOBAL-NEVER']));
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run test/safety.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement merge**

```typescript
// in src/safety.ts
import type { ExitConfig } from './types.js';

export function mergeIntoExitConfig(config: ExitConfig): ExitConfig {
  const safety = getSafety();
  const cfgMultiple = config.safetySubmittedMultiple ?? Infinity;
  const cfgForbidden = config.forbiddenTickers ?? [];
  const safetyForbidden = safety.forbidden.map((e) => e.ticker);

  return {
    ...config,
    safetySubmittedMultiple: Math.min(cfgMultiple, safety.safetySubmittedMultiple),
    floorPriceCents: Math.max(config.floorPriceCents, safety.floorPriceCents),
    tailSweepThreshold: Math.max(config.tailSweepThreshold, safety.tailSweepThreshold),
    forbiddenTickers: Array.from(new Set([...cfgForbidden, ...safetyForbidden])),
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run test/safety.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/safety.ts test/safety.test.ts
git commit -m "feat(safety): mergeIntoExitConfig — guard rails only tighten"
```

---

## Task 6: Wire `exitRunner` to merge safety + journal load

**Files:**
- Modify: `src/exitRunner.ts`
- Test: `test/exitRunner.safety.test.ts` (new)

- [ ] **Step 1: Write failing test for forbidden union enforcement**

```typescript
// test/exitRunner.safety.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ExitRunner } from '../src/exitRunner.js';
import { addForbiddenTicker } from '../src/safety.js';
import { MockKalshiClient } from '../src/mockKalshiClient.js';

let tmpHome: string;
beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-runner-safety-'));
  process.env.KEA_HOME = tmpHome;
});
afterEach(() => {
  delete process.env.KEA_HOME;
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

describe('exitRunner: safety merge', () => {
  it('refuses to run if marketTicker is in safety.forbidden', async () => {
    addForbiddenTicker('FOO-YES-P1', 'do not touch', 'test');
    const client = new MockKalshiClient();
    const runner = new ExitRunner(client, {
      marketTicker: 'FOO-YES-P1',
      heldSide: 'yes',
      positionSize: 100,
      chunkSize: 50,
      maxOrders: 2,
      floorPriceCents: 0,
      tailSweepThreshold: 0,
      dryRun: true,
    } as any);
    await expect(runner.run()).rejects.toThrow(/forbidden/);
  });

  it('writes safety_loaded entry to journal at start', async () => {
    const client = new MockKalshiClient();
    const runner = new ExitRunner(client, {
      marketTicker: 'BAR-YES-P1',
      heldSide: 'yes',
      positionSize: 10,
      chunkSize: 10,
      maxOrders: 1,
      floorPriceCents: 0,
      tailSweepThreshold: 0,
      dryRun: true,
    } as any);
    await runner.run();
    const entries = runner.journal.readAll();
    expect(entries.some((e) => e.kind === 'safety_loaded')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run test/exitRunner.safety.test.ts`
Expected: FAIL.

- [ ] **Step 3: Modify `exitRunner.run()` to merge + journal**

In `src/exitRunner.ts`, at the top of `run()` (after journal init, before main loop):

```typescript
import { mergeIntoExitConfig, getSafety } from './safety.js';

// ... inside run():
const safetySnapshot = getSafety();
this.journal.append('safety_loaded', {
  safetySubmittedMultiple: safetySnapshot.safetySubmittedMultiple,
  floorPriceCents: safetySnapshot.floorPriceCents,
  tailSweepThreshold: safetySnapshot.tailSweepThreshold,
  forbiddenCount: safetySnapshot.forbidden.length,
});
this.config = mergeIntoExitConfig(this.config);

// existing forbidden-tickers guard already checks this.config.forbiddenTickers — leave it as-is.
```

If `this.config` is `readonly`, drop the `readonly` modifier on `ExitRunner.config` or introduce a `mergedConfig` field that downstream methods read instead. Match whichever shape is least invasive in the file.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run test/exitRunner.safety.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: full suite green (no regressions).

- [ ] **Step 6: Commit**

```bash
git add src/exitRunner.ts test/exitRunner.safety.test.ts
git commit -m "feat(exitRunner): merge safety.json into config + journal safety_loaded"
```

---

## Task 7: CLI commands — `kea safety` and `kea forbidden`

**Files:**
- Modify: `src/cli.ts`
- Test: `test/cli.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// append to test/cli.test.ts
import { execaCommand } from 'execa'; // or whatever runner the existing CLI tests use
// ... use the same harness pattern as kea login tests

describe('kea safety', () => {
  it('safety get prints current values', async () => {
    const { stdout } = await runCli(['safety', 'get']);
    expect(stdout).toContain('safetySubmittedMultiple');
  });

  it('safety set updates a single field', async () => {
    await runCli(['safety', 'set', '--floor-price-cents', '1']);
    const { stdout } = await runCli(['safety', 'get']);
    expect(stdout).toContain('floorPriceCents: 1');
  });
});

describe('kea forbidden', () => {
  it('add requires --reason', async () => {
    const { exitCode, stderr } = await runCli(['forbidden', 'add', 'FOO-P4']);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('reason');
  });

  it('add then list shows the ticker', async () => {
    await runCli(['forbidden', 'add', 'FOO-P4', '--reason', 'pair leg']);
    const { stdout } = await runCli(['forbidden', 'list']);
    expect(stdout).toContain('FOO-P4');
    expect(stdout).toContain('pair leg');
  });

  it('remove drops the ticker', async () => {
    await runCli(['forbidden', 'add', 'FOO-P4', '--reason', 'pair leg']);
    await runCli(['forbidden', 'remove', 'FOO-P4']);
    const { stdout } = await runCli(['forbidden', 'list']);
    expect(stdout).not.toContain('FOO-P4');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run test/cli.test.ts`
Expected: FAIL.

- [ ] **Step 3: Add subcommands in `src/cli.ts`**

Mirror the existing subcommand pattern (find how `login`/`whoami`/`use`/`logout` are dispatched). Add:

```typescript
// in cli.ts dispatcher:
case 'safety': return runSafetyCommand(args);
case 'forbidden': return runForbiddenCommand(args);

// implementations:
import {
  getSafety, setSafety,
  addForbiddenTicker, removeForbiddenTicker, listForbidden,
} from './safety.js';

function runSafetyCommand(args: string[]): void {
  const sub = args[0];
  if (sub === 'get') {
    const s = getSafety();
    console.log(`safetySubmittedMultiple: ${s.safetySubmittedMultiple}`);
    console.log(`floorPriceCents: ${s.floorPriceCents}`);
    console.log(`tailSweepThreshold: ${s.tailSweepThreshold}`);
    console.log(`forbiddenCount: ${s.forbidden.length}`);
    return;
  }
  if (sub === 'set') {
    const patch: Record<string, number> = {};
    for (let i = 1; i < args.length; i += 2) {
      const k = args[i].replace(/^--/, '');
      const v = Number(args[i + 1]);
      const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      patch[camel] = v;
    }
    const next = setSafety(patch);
    console.log('updated safety.json');
    console.log(JSON.stringify(next, null, 2));
    return;
  }
  console.error('usage: kea safety get | kea safety set --<field> <value>');
  process.exit(2);
}

function runForbiddenCommand(args: string[]): void {
  const sub = args[0];
  if (sub === 'list') {
    for (const e of listForbidden()) {
      console.log(`${e.ticker}\t${e.addedAt}\t${e.addedBy}\t${e.reason}`);
    }
    return;
  }
  if (sub === 'add') {
    const ticker = args[1];
    const reasonIdx = args.indexOf('--reason');
    const reason = reasonIdx >= 0 ? args[reasonIdx + 1] : '';
    if (!reason) {
      console.error('--reason is required');
      process.exit(2);
    }
    addForbiddenTicker(ticker, reason, 'cli');
    console.log(`added ${ticker}`);
    return;
  }
  if (sub === 'remove') {
    removeForbiddenTicker(args[1]);
    console.log(`removed ${args[1]}`);
    return;
  }
  console.error('usage: kea forbidden list | add <ticker> --reason <r> | remove <ticker>');
  process.exit(2);
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run test/cli.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts test/cli.test.ts
git commit -m "feat(cli): kea safety + kea forbidden subcommands"
```

---

## Task 8: MCP write tools

**Files:**
- Modify: `src/mcp.ts`
- Test: `test/mcp.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// append to test/mcp.test.ts — use the same in-process MCP harness as kea_whoami tests

describe('kea_safety_get', () => {
  it('returns current safety values', async () => {
    const out = await callTool('kea_safety_get', {});
    expect(out.safetySubmittedMultiple).toBe(1.1);
  });
});

describe('kea_safety_set', () => {
  it('updates and persists', async () => {
    await callTool('kea_safety_set', { floorPriceCents: 1 });
    const after = await callTool('kea_safety_get', {});
    expect(after.floorPriceCents).toBe(1);
  });
  it('rejects out-of-bounds', async () => {
    await expect(callTool('kea_safety_set', { safetySubmittedMultiple: 2.0 }))
      .rejects.toThrow(/safetySubmittedMultiple/);
  });
});

describe('kea_forbidden_add / list / remove', () => {
  it('add requires reason', async () => {
    await expect(callTool('kea_forbidden_add', { ticker: 'FOO', reason: '' }))
      .rejects.toThrow(/reason/);
  });
  it('round trip', async () => {
    await callTool('kea_forbidden_add', { ticker: 'FOO-P4', reason: 'pair leg' });
    const list = await callTool('kea_forbidden_list', {});
    expect(list.forbidden.map((e: any) => e.ticker)).toContain('FOO-P4');
    await callTool('kea_forbidden_remove', { ticker: 'FOO-P4' });
    const after = await callTool('kea_forbidden_list', {});
    expect(after.forbidden.map((e: any) => e.ticker)).not.toContain('FOO-P4');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run test/mcp.test.ts`
Expected: FAIL.

- [ ] **Step 3: Register the five tools in `src/mcp.ts`**

Add alongside existing tool definitions (mirror `kea_whoami` registration shape):

```typescript
import {
  getSafety, setSafety,
  addForbiddenTicker, removeForbiddenTicker, listForbidden,
} from './safety.js';

// kea_safety_get
server.tool('kea_safety_get', 'Read current safety guards.', {}, async () => {
  return { content: [{ type: 'text', text: JSON.stringify(getSafety()) }] };
});

// kea_safety_set
server.tool(
  'kea_safety_set',
  'Update safety guards. Hard-bounded server-side: safetySubmittedMultiple ∈ [1.0, 1.2], floorPriceCents ∈ [0, 99], tailSweepThreshold ∈ [0, 1_000_000].',
  {
    safetySubmittedMultiple: z.number().optional(),
    floorPriceCents: z.number().optional(),
    tailSweepThreshold: z.number().optional(),
  },
  async (args) => {
    const next = setSafety(args);
    return { content: [{ type: 'text', text: JSON.stringify(next) }] };
  },
);

// kea_forbidden_list
server.tool('kea_forbidden_list', 'List forbidden tickers with audit metadata.', {}, async () => {
  return { content: [{ type: 'text', text: JSON.stringify({ forbidden: listForbidden() }) }] };
});

// kea_forbidden_add
server.tool(
  'kea_forbidden_add',
  'Add a ticker to the forbidden list. Reason is required for the audit log.',
  { ticker: z.string().min(1), reason: z.string().min(1) },
  async ({ ticker, reason }) => {
    const entry = addForbiddenTicker(ticker, reason, 'mcp');
    return { content: [{ type: 'text', text: JSON.stringify(entry) }] };
  },
);

// kea_forbidden_remove
server.tool(
  'kea_forbidden_remove',
  'Remove a ticker from the forbidden list.',
  { ticker: z.string().min(1) },
  async ({ ticker }) => {
    removeForbiddenTicker(ticker);
    return { content: [{ type: 'text', text: JSON.stringify({ removed: ticker }) }] };
  },
);
```

If the registration shape in the file differs (e.g. raw `tools` array), adapt — the principle is: same shape as the existing `kea_whoami` registration.

- [ ] **Step 4: Update header docstring listing tools**

Add the five new names to the comment block at the top of `src/mcp.ts`.

- [ ] **Step 5: Run tests to verify pass**

Run: `npx vitest run test/mcp.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/mcp.ts test/mcp.test.ts
git commit -m "feat(mcp): safety_get/set + forbidden_list/add/remove tools"
```

---

## Task 9: TUI Safety tab

**Files:**
- Create: `src/tui/SafetyTab.tsx`
- Modify: `src/tui/App.tsx`
- Test: `test/tui-app.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// append to test/tui-app.test.tsx — mirror Account-tab test pattern

it('Safety tab renders current values', async () => {
  const { lastFrame, stdin } = renderApp();
  // navigate to Safety tab — assume keys 1..N for tabs; pick the next free index
  stdin.write('S'); // or whatever tab key is assigned
  await flushFrames();
  expect(lastFrame()).toContain('safetySubmittedMultiple');
  expect(lastFrame()).toContain('Forbidden');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run test/tui-app.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Create `SafetyTab.tsx`**

```tsx
// src/tui/SafetyTab.tsx
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { getSafety, listForbidden, removeForbiddenTicker } from '../safety.js';
import type { SafetyConfig, ForbiddenEntry } from '../types.js';

export const SafetyTab: React.FC = () => {
  const [safety, setSafetyState] = useState<SafetyConfig>(getSafety());
  const [cursor, setCursor] = useState(0);

  const refresh = () => setSafetyState(getSafety());

  useInput((input, key) => {
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(safety.forbidden.length - 1, c + 1));
    if (input === 'd' && safety.forbidden[cursor]) {
      removeForbiddenTicker(safety.forbidden[cursor].ticker);
      refresh();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Safety guards (read-only here; edit via `kea safety set` or MCP)</Text>
      <Text>safetySubmittedMultiple: {safety.safetySubmittedMultiple}</Text>
      <Text>floorPriceCents: {safety.floorPriceCents}</Text>
      <Text>tailSweepThreshold: {safety.tailSweepThreshold}</Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Forbidden tickers (d = remove highlighted)</Text>
        {safety.forbidden.length === 0 && <Text dimColor>(none)</Text>}
        {safety.forbidden.map((e: ForbiddenEntry, i: number) => (
          <Text key={e.ticker} inverse={i === cursor}>
            {e.ticker} — {e.reason} — {e.addedBy} @ {e.addedAt}
          </Text>
        ))}
      </Box>
    </Box>
  );
};
```

- [ ] **Step 4: Register in `App.tsx`**

Add the tab next to Account. Mirror the existing tab-registration pattern (find how Account was added in the account-connect plan).

- [ ] **Step 5: Run test to verify pass**

Run: `npx vitest run test/tui-app.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/tui/SafetyTab.tsx src/tui/App.tsx test/tui-app.test.tsx
git commit -m "feat(tui): Safety tab — view guards, list/remove forbidden tickers"
```

---

## Task 10: `safety_config_changed` audit journal

**Files:**
- Modify: `src/safety.ts`
- Test: `test/safety.audit.test.ts` (new)

The CLI/MCP/TUI mutators all converge on `setSafety` / `addForbiddenTicker` / `removeForbiddenTicker`. Wire a single audit-log append at that layer instead of at each surface.

- [ ] **Step 1: Write failing test**

```typescript
// test/safety.audit.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { setSafety, addForbiddenTicker } from '../src/safety.js';

let tmpHome: string;
beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-audit-'));
  process.env.KEA_HOME = tmpHome;
});
afterEach(() => {
  delete process.env.KEA_HOME;
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

describe('safety audit log', () => {
  it('writes safety_config_changed lines for setSafety', () => {
    setSafety({ floorPriceCents: 1 });
    const log = fs.readFileSync(path.join(tmpHome, 'safety.audit.jsonl'), 'utf8').trim().split('\n');
    expect(log).toHaveLength(1);
    const entry = JSON.parse(log[0]);
    expect(entry.kind).toBe('safety_config_changed');
    expect(entry.data.patch.floorPriceCents).toBe(1);
  });

  it('writes a line for forbidden add', () => {
    addForbiddenTicker('FOO-P4', 'pair', 'cli');
    const log = fs.readFileSync(path.join(tmpHome, 'safety.audit.jsonl'), 'utf8').trim().split('\n');
    expect(log).toHaveLength(1);
    const entry = JSON.parse(log[0]);
    expect(entry.data.action).toBe('forbidden_add');
    expect(entry.data.ticker).toBe('FOO-P4');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run test/safety.audit.test.ts`
Expected: FAIL.

- [ ] **Step 3: Append-only audit writer in `safety.ts`**

```typescript
// in src/safety.ts
function auditLogPath(): string {
  return path.join(homeDir(), 'safety.audit.jsonl');
}

function audit(kind: 'safety_config_changed', data: unknown): void {
  fs.mkdirSync(homeDir(), { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), kind, data }) + '\n';
  fs.appendFileSync(auditLogPath(), line, { mode: 0o600 });
}

// in setSafety, AFTER writeFileAtomic(next):
audit('safety_config_changed', { action: 'set', patch });

// in addForbiddenTicker, AFTER writeFileAtomic:
audit('safety_config_changed', { action: 'forbidden_add', ticker, reason, addedBy });

// in removeForbiddenTicker, AFTER writeFileAtomic (only when actually removed):
audit('safety_config_changed', { action: 'forbidden_remove', ticker });
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run test/safety.audit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/safety.ts test/safety.audit.test.ts
git commit -m "feat(safety): append-only audit log for every mutation"
```

---

## Task 11: End-to-end smoke + docs

**Files:**
- Modify: `docs/LOSING_EXIT_ALGORITHM.md`
- Modify: `docs/ROADMAP.md` (already updated separately by this story; verify)

- [ ] **Step 1: Manual smoke** — start TUI, add forbidden ticker via CLI, verify TUI lists it, run a dry-run exit job pointed at that ticker, confirm it refuses with `forbidden`.

- [ ] **Step 2: Document in `LOSING_EXIT_ALGORITHM.md`** — append a section "Safety persistence":

```markdown
## Safety persistence (`$KEA_HOME/safety.json`)

Hard guard rails that *only tighten* per-job config:

| Field | Effect at job start |
|---|---|
| `safetySubmittedMultiple` | `min(config, safety)` |
| `floorPriceCents` | `max(config, safety)` |
| `tailSweepThreshold` | `max(config, safety)` |
| `forbidden[]` | unioned with `forbiddenTickers` |

Surfaces:
- CLI: `kea safety get/set`, `kea forbidden add/remove/list`
- MCP: `kea_safety_get/set`, `kea_forbidden_list/add/remove`
- TUI: Safety tab

Every mutation appends to `safety.audit.jsonl`. The exitRunner emits a
`safety_loaded` journal entry at job start so replay can reconstruct exactly
which guards were active.
```

- [ ] **Step 3: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs(safety): document safety.json + audit log + journal hook"
```

---

## Self-review checklist

- ✅ All 5 follow-on items covered: persist (T2-4), MCP write (T8), TUI Safety tab (T9), reload semantics (T6 — merge at job start, in-flight unaffected), audit trail (T10 audit log + T6 `safety_loaded`).
- ✅ Type names consistent: `SafetyConfig`, `ForbiddenEntry`, `mergeIntoExitConfig`, `addForbiddenTicker` used the same in every task.
- ✅ No placeholders — every step shows the code or the exact command.
- ✅ TDD ordering (failing test → impl → pass) preserved per task.
- ✅ Frequent commits — one per task.
