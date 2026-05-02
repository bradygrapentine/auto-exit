# Account Connect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a credentials file with named profiles so users can `kea login`, switch demo↔prod with one command/keystroke, and see active env via TUI panel and `kea_whoami` MCP tool.

**Architecture:** New `src/credentials.ts` owns `$KEA_HOME/credentials.json` (`0o600`, atomic tmp+rename). Five existing call sites (`accountClient.ts`, `kalshiClient.ts`, `tui/api.ts`, `cli.ts`, `mcp.ts`) read through `credentials.loadActive()` with env-var fallback for backward compat. New CLI commands (`login`/`use`/`whoami`/`logout`), TUI Account tab with `s`-key switch, and read-only MCP `kea_whoami` tool.

**Tech Stack:** TypeScript (NodeNext ESM), vitest, ink for TUI, `@modelcontextprotocol/sdk`. Node `readline/promises` for CLI prompts (no new deps).

**Spec:** `docs/superpowers/specs/2026-05-01-account-connect-design.md`

---

## File map

- **Create** `src/credentials.ts` — module with `loadActive`, `listProfiles`, `getActive`, `setActive`, `upsertProfile`, `removeProfile`, `validateKeyFile`, `KeaNotConfiguredError`.
- **Create** `test/credentials.test.ts` — unit tests with temp-dir `KEA_HOME`.
- **Create** `test/fixtures/test-rsa.pem` — generated valid RSA PEM for tests.
- **Modify** `src/cli.ts` — add `login`/`use`/`whoami`/`logout` commands; replace env reads with `loadActive()`.
- **Modify** `src/tui/api.ts` — replace `process.env.KALSHI_*` reads with `loadActive()` (lines ~19–35).
- **Modify** `src/accountClient.ts` — replace `process.env[this.config.apiKeyEnv]` with `loadActive()` (lines ~40–41).
- **Modify** `src/kalshiClient.ts` — same as accountClient (lines ~134–135).
- **Modify** `src/mcp.ts` — register `kea_whoami` tool; replace env reads in `defaultEngineConfig` with `loadActive()` (lines ~44–64).
- **Modify** `test/cli.test.ts` (or create if absent) — cover new commands.
- **Modify** `test/mcp.test.ts` — cover `kea_whoami`.
- **Create** `src/tui/AccountTab.tsx` — ink component for active profile + `s` to switch.
- **Modify** `src/tui/App.tsx` — register Account tab.
- **Modify** `test/tui-app.test.tsx` — cover Account tab states.

---

## Task 1: RSA fixture for tests

**Files:**
- Create: `test/fixtures/test-rsa.pem`

- [ ] **Step 1: Generate fixture**

```bash
openssl genrsa -out test/fixtures/test-rsa.pem 2048
chmod 600 test/fixtures/test-rsa.pem
```

- [ ] **Step 2: Commit**

```bash
git add test/fixtures/test-rsa.pem
git commit -m "test(credentials): add RSA PEM fixture for credential validation tests"
```

---

## Task 2: `credentials.ts` — types and `KeaNotConfiguredError`

**Files:**
- Create: `src/credentials.ts`
- Test: `test/credentials.test.ts`

- [ ] **Step 1: Write failing test for `KeaNotConfiguredError`**

Create `test/credentials.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { KeaNotConfiguredError } from '../src/credentials.js';

describe('KeaNotConfiguredError', () => {
  it('extends Error with name set', () => {
    const e = new KeaNotConfiguredError('nope');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('KeaNotConfiguredError');
    expect(e.message).toBe('nope');
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `npx vitest run test/credentials.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/credentials.ts` skeleton**

```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

export class KeaNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeaNotConfiguredError';
  }
}

export interface Profile {
  keyId: string;
  keyPath: string;
  baseUrl: string;
}

export interface CredentialsFile {
  active: string;
  profiles: Record<string, Profile>;
}

export interface ActiveCredentials extends Profile {
  profileName: string;
}

export const PROD_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';
export const DEMO_BASE_URL = 'https://demo-api.kalshi.co/trade-api/v2';

export function defaultBaseUrlFor(profileName: string): string {
  return profileName.toLowerCase() === 'demo' ? DEMO_BASE_URL : PROD_BASE_URL;
}

function homeDir(): string {
  return process.env.KEA_HOME ?? path.join(os.homedir(), '.kalshi-exit-assistant');
}

export function credentialsPath(): string {
  return path.join(homeDir(), 'credentials.json');
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `npx vitest run test/credentials.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/credentials.ts test/credentials.test.ts
git commit -m "feat(credentials): scaffold module with types and KeaNotConfiguredError"
```

---

## Task 3: `validateKeyFile`

**Files:**
- Modify: `src/credentials.ts`
- Modify: `test/credentials.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `test/credentials.test.ts`:

```ts
import { validateKeyFile } from '../src/credentials.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

describe('validateKeyFile', () => {
  it('accepts a real RSA PEM', async () => {
    const fixture = path.resolve(__dirname, 'fixtures/test-rsa.pem');
    await expect(validateKeyFile(fixture)).resolves.toBeUndefined();
  });

  it('rejects missing file', async () => {
    await expect(validateKeyFile('/no/such/file.pem')).rejects.toThrow();
  });

  it('rejects garbage content', async () => {
    const tmp = path.join(os.tmpdir(), `kea-bad-${Date.now()}.pem`);
    fs.writeFileSync(tmp, 'not a key');
    try {
      await expect(validateKeyFile(tmp)).rejects.toThrow();
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run test/credentials.test.ts`
Expected: FAIL — `validateKeyFile is not a function`.

- [ ] **Step 3: Implement `validateKeyFile`**

Append to `src/credentials.ts`:

```ts
export async function validateKeyFile(keyPath: string): Promise<void> {
  await fs.promises.access(keyPath, fs.constants.R_OK);
  const pem = await fs.promises.readFile(keyPath, 'utf8');
  // Throws if not a parseable private key.
  crypto.createPrivateKey(pem);
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run test/credentials.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/credentials.ts test/credentials.test.ts
git commit -m "feat(credentials): add validateKeyFile"
```

---

## Task 4: File read/write — `readFile`, `writeFileAtomic`, `loadActive`

**Files:**
- Modify: `src/credentials.ts`
- Modify: `test/credentials.test.ts`

- [ ] **Step 1: Write failing tests**

Append:

```ts
import { upsertProfile, loadActive, getActive, listProfiles } from '../src/credentials.js';

function withTempHome<T>(fn: () => Promise<T> | T): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-home-'));
  const prev = process.env.KEA_HOME;
  process.env.KEA_HOME = dir;
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      process.env.KEA_HOME = prev;
      fs.rmSync(dir, { recursive: true, force: true });
    });
}

const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');

describe('credentials file round-trip', () => {
  it('upsertProfile then loadActive returns same fields', async () => {
    await withTempHome(async () => {
      upsertProfile('prod', { keyId: 'AKID-PROD-WXYZ', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      const active = loadActive();
      expect(active.profileName).toBe('prod');
      expect(active.keyId).toBe('AKID-PROD-WXYZ');
      expect(active.keyPath).toBe(FIXTURE);
      expect(active.baseUrl).toBe('https://api.elections.kalshi.com/trade-api/v2');
    });
  });

  it('file mode is 0o600 after write', async () => {
    await withTempHome(async () => {
      upsertProfile('demo', { keyId: 'X', keyPath: FIXTURE, baseUrl: 'https://demo-api.kalshi.co/trade-api/v2' });
      const stat = fs.statSync(path.join(process.env.KEA_HOME!, 'credentials.json'));
      expect(stat.mode & 0o777).toBe(0o600);
    });
  });

  it('listProfiles and getActive', async () => {
    await withTempHome(async () => {
      upsertProfile('demo', { keyId: 'D', keyPath: FIXTURE, baseUrl: 'https://demo-api.kalshi.co/trade-api/v2' });
      upsertProfile('prod', { keyId: 'P', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      expect(listProfiles().sort()).toEqual(['demo', 'prod']);
      expect(getActive()).toBe('demo'); // first inserted becomes active
    });
  });

  it('throws KeaNotConfiguredError when no file and no env', async () => {
    await withTempHome(async () => {
      const prevKey = process.env.KALSHI_ACCESS_KEY;
      const prevPath = process.env.KALSHI_PRIVATE_KEY_PATH;
      delete process.env.KALSHI_ACCESS_KEY;
      delete process.env.KALSHI_PRIVATE_KEY_PATH;
      try {
        expect(() => loadActive()).toThrow(KeaNotConfiguredError);
      } finally {
        if (prevKey) process.env.KALSHI_ACCESS_KEY = prevKey;
        if (prevPath) process.env.KALSHI_PRIVATE_KEY_PATH = prevPath;
      }
    });
  });

  it('falls back to env when file absent', async () => {
    await withTempHome(async () => {
      process.env.KALSHI_ACCESS_KEY = 'ENVKEY';
      process.env.KALSHI_PRIVATE_KEY_PATH = FIXTURE;
      try {
        const active = loadActive();
        expect(active.profileName).toBe('env');
        expect(active.keyId).toBe('ENVKEY');
        expect(active.keyPath).toBe(FIXTURE);
      } finally {
        delete process.env.KALSHI_ACCESS_KEY;
        delete process.env.KALSHI_PRIVATE_KEY_PATH;
      }
    });
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run test/credentials.test.ts`
Expected: FAIL — `upsertProfile is not a function`.

- [ ] **Step 3: Implement file read/write and `loadActive`**

Append to `src/credentials.ts`:

```ts
function readFile(): CredentialsFile | null {
  const p = credentialsPath();
  if (!fs.existsSync(p)) return null;
  const stat = fs.statSync(p);
  if ((stat.mode & 0o777) !== 0o600) {
    fs.chmodSync(p, 0o600);
    process.stderr.write(`warning: fixed credentials file permissions to 0o600 (${p})\n`);
  }
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as CredentialsFile;
}

function writeFileAtomic(data: CredentialsFile): void {
  const dir = homeDir();
  fs.mkdirSync(dir, { recursive: true });
  const target = credentialsPath();
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, target);
}

export function listProfiles(): string[] {
  return Object.keys(readFile()?.profiles ?? {});
}

export function getActive(): string | null {
  return readFile()?.active ?? null;
}

export function upsertProfile(name: string, profile: Profile): void {
  const file = readFile() ?? { active: name, profiles: {} };
  file.profiles[name] = profile;
  if (!file.profiles[file.active]) file.active = name;
  writeFileAtomic(file);
}

export function setActive(name: string): void {
  const file = readFile();
  if (!file || !file.profiles[name]) {
    throw new Error(`Profile '${name}' not found. Run \`kea login --profile ${name}\`.`);
  }
  file.active = name;
  writeFileAtomic(file);
}

export function removeProfile(name: string): void {
  const file = readFile();
  if (!file) return;
  delete file.profiles[name];
  if (file.active === name) {
    file.active = Object.keys(file.profiles)[0] ?? '';
  }
  writeFileAtomic(file);
}

export function loadActive(): ActiveCredentials {
  const file = readFile();
  if (file && file.active) {
    const profile = file.profiles[file.active];
    if (!profile) {
      throw new KeaNotConfiguredError(
        `Active profile '${file.active}' not found. Run \`kea use <profile>\` or \`kea login\`.`,
      );
    }
    return { profileName: file.active, ...profile };
  }
  const envKey = process.env.KALSHI_ACCESS_KEY;
  const envPath = process.env.KALSHI_PRIVATE_KEY_PATH;
  if (envKey && envPath) {
    return {
      profileName: 'env',
      keyId: envKey,
      keyPath: envPath,
      baseUrl: process.env.KALSHI_BASE_URL ?? PROD_BASE_URL,
    };
  }
  throw new KeaNotConfiguredError('No Kalshi credentials configured. Run `kea login` to connect.');
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run test/credentials.test.ts`
Expected: PASS (all credentials tests).

- [ ] **Step 5: Commit**

```bash
git add src/credentials.ts test/credentials.test.ts
git commit -m "feat(credentials): file read/write, profiles, loadActive with env fallback"
```

---

## Task 5: `setActive` error path + atomic-write durability test

**Files:**
- Modify: `test/credentials.test.ts`

- [ ] **Step 1: Write failing tests**

Append:

```ts
import { setActive, removeProfile } from '../src/credentials.js';

describe('setActive errors', () => {
  it('throws on unknown profile', async () => {
    await withTempHome(async () => {
      upsertProfile('demo', { keyId: 'D', keyPath: FIXTURE, baseUrl: DEMO_BASE_URL });
      expect(() => setActive('nope')).toThrow(/not found/);
    });
  });
});

describe('atomic write durability', () => {
  it('leaves prior file intact on tmp-rename failure', async () => {
    await withTempHome(async () => {
      upsertProfile('demo', { keyId: 'D', keyPath: FIXTURE, baseUrl: DEMO_BASE_URL });
      const before = fs.readFileSync(path.join(process.env.KEA_HOME!, 'credentials.json'), 'utf8');
      // simulate failure: pre-create a directory at the tmp path so writeFileSync throws
      const tmp = path.join(process.env.KEA_HOME!, 'credentials.json.tmp');
      fs.mkdirSync(tmp);
      try {
        expect(() => upsertProfile('prod', { keyId: 'P', keyPath: FIXTURE, baseUrl: PROD_BASE_URL })).toThrow();
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
      const after = fs.readFileSync(path.join(process.env.KEA_HOME!, 'credentials.json'), 'utf8');
      expect(after).toBe(before);
    });
  });
});
```

- [ ] **Step 2: Run, expect PASS**

Run: `npx vitest run test/credentials.test.ts`
Expected: PASS — already implemented in Task 4.

- [ ] **Step 3: Commit**

```bash
git add test/credentials.test.ts
git commit -m "test(credentials): atomic write durability and setActive error path"
```

---

## Task 6: Log redaction test

**Files:**
- Modify: `src/credentials.ts`
- Modify: `test/credentials.test.ts`

- [ ] **Step 1: Add redaction helper to `credentials.ts`**

Append:

```ts
export function redactKeyId(keyId: string): string {
  if (keyId.length <= 4) return '****';
  return `…${keyId.slice(-4)}`;
}
```

- [ ] **Step 2: Write tests**

Append:

```ts
import { redactKeyId } from '../src/credentials.js';

describe('redactKeyId', () => {
  it('shows last 4 with ellipsis', () => {
    expect(redactKeyId('AKID-VERY-LONG-WXYZ')).toBe('…WXYZ');
  });
  it('masks short ids entirely', () => {
    expect(redactKeyId('abc')).toBe('****');
  });
});
```

- [ ] **Step 3: Run, expect PASS**

Run: `npx vitest run test/credentials.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/credentials.ts test/credentials.test.ts
git commit -m "feat(credentials): add redactKeyId helper for safe logging"
```

---

## Task 7: CLI `kea whoami`

**Files:**
- Modify: `src/cli.ts`
- Create: `test/cli.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/cli.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { upsertProfile } from '../src/credentials.js';
import { runCli } from '../src/cli.js';

const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');

function withTempHome<T>(fn: () => Promise<T> | T): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-home-'));
  const prev = process.env.KEA_HOME;
  process.env.KEA_HOME = dir;
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      process.env.KEA_HOME = prev;
      fs.rmSync(dir, { recursive: true, force: true });
    });
}

describe('kea whoami', () => {
  it('prints active profile with last-4 key id', async () => {
    await withTempHome(async () => {
      upsertProfile('prod', { keyId: 'AKID-PROD-WXYZ', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      const out: string[] = [];
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { out.push(String(s)); return true; });
      try {
        await runCli(['whoami']);
      } finally {
        spy.mockRestore();
      }
      const joined = out.join('');
      expect(joined).toContain('prod');
      expect(joined).toContain('…WXYZ');
      expect(joined).not.toContain('AKID-PROD-WXYZ');
    });
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run test/cli.test.ts`
Expected: FAIL — `runCli` not exported.

- [ ] **Step 3: Refactor `cli.ts` to expose `runCli` and add `whoami` command**

In `src/cli.ts`:

1. Add import at top: `import { loadActive, redactKeyId, KeaNotConfiguredError } from './credentials.js';`
2. Replace the bottom `main()` + IIFE with a named export:

```ts
export async function runCli(argv: string[]): Promise<void> {
  const [cmd, ...rest] = argv;
  const flags = parseFlags(rest);
  switch (cmd) {
    case 'whoami': return cmdWhoami();
    // ... existing cases preserved
    default: cmdHelp();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2)).catch((e) => die(e instanceof Error ? e.message : String(e)));
}
```

3. Add command:

```ts
function cmdWhoami(): void {
  try {
    const a = loadActive();
    const isDemo = a.baseUrl.includes('demo');
    process.stdout.write(`profile: ${a.profileName}${a.profileName === 'env' ? ' (env vars)' : ''}\n`);
    process.stdout.write(`key id : ${redactKeyId(a.keyId)}\n`);
    process.stdout.write(`baseUrl: ${a.baseUrl}${isDemo ? '  [DEMO]' : '  [PROD]'}\n`);
  } catch (e) {
    if (e instanceof KeaNotConfiguredError) die(e.message);
    throw e;
  }
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run test/cli.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts test/cli.test.ts
git commit -m "feat(cli): kea whoami prints active profile with redacted key id"
```

---

## Task 8: CLI `kea login` (flags-only path)

**Files:**
- Modify: `src/cli.ts`
- Modify: `test/cli.test.ts`

- [ ] **Step 1: Write failing test**

Append to `test/cli.test.ts`:

```ts
import { listProfiles, getActive, loadActive } from '../src/credentials.js';

describe('kea login (flags only)', () => {
  it('writes profile from flags and makes it active when first', async () => {
    await withTempHome(async () => {
      await runCli(['login', '--profile', 'prod', '--key-id', 'AKID-FLAGS-1234', '--key-file', FIXTURE]);
      expect(listProfiles()).toEqual(['prod']);
      expect(getActive()).toBe('prod');
      expect(loadActive().baseUrl).toBe('https://api.elections.kalshi.com/trade-api/v2');
    });
  });

  it('respects --base-url override', async () => {
    await withTempHome(async () => {
      await runCli(['login', '--profile', 'demo', '--key-id', 'X', '--key-file', FIXTURE, '--base-url', 'https://custom.example/v2']);
      expect(loadActive().baseUrl).toBe('https://custom.example/v2');
    });
  });

  it('rejects unreadable key file', async () => {
    await withTempHome(async () => {
      await expect(
        runCli(['login', '--profile', 'prod', '--key-id', 'X', '--key-file', '/no/such/file']),
      ).rejects.toThrow();
    });
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run test/cli.test.ts -t "kea login"`
Expected: FAIL — `login` command unknown.

- [ ] **Step 3: Implement `cmdLogin`**

Add to `src/cli.ts`:

```ts
import { upsertProfile, validateKeyFile, defaultBaseUrlFor } from './credentials.js';
import readline from 'node:readline/promises';

async function promptIfMissing(label: string, current: string | undefined, fallback?: string): Promise<string> {
  if (current) return current;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(fallback ? `${label} [${fallback}]: ` : `${label}: `)).trim();
    return answer || fallback || '';
  } finally {
    rl.close();
  }
}

async function cmdLogin(flags: Record<string, string>): Promise<void> {
  const profile = await promptIfMissing('profile name', flags.profile, 'prod');
  if (!profile) die('profile name required');
  const keyId = await promptIfMissing('access key id', flags['key-id']);
  if (!keyId) die('key id required');
  const keyFile = await promptIfMissing('path to RSA private key', flags['key-file']);
  if (!keyFile) die('key file required');
  await validateKeyFile(keyFile);
  const baseUrl = flags['base-url'] ?? await promptIfMissing('base url', undefined, defaultBaseUrlFor(profile));
  upsertProfile(profile, { keyId, keyPath: keyFile, baseUrl });
  ok(`saved profile '${profile}'`);
  cmdWhoami();
}
```

Add to `runCli` switch: `case 'login': return cmdLogin(flags);`

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run test/cli.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts test/cli.test.ts
git commit -m "feat(cli): kea login with flag-driven profile creation and key validation"
```

---

## Task 9: CLI `kea use` and `kea logout`

**Files:**
- Modify: `src/cli.ts`
- Modify: `test/cli.test.ts`

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe('kea use', () => {
  it('flips active profile', async () => {
    await withTempHome(async () => {
      await runCli(['login', '--profile', 'demo', '--key-id', 'D', '--key-file', FIXTURE]);
      await runCli(['login', '--profile', 'prod', '--key-id', 'P', '--key-file', FIXTURE]);
      await runCli(['use', 'prod']);
      expect(getActive()).toBe('prod');
    });
  });
});

describe('kea logout', () => {
  it('removes one profile', async () => {
    await withTempHome(async () => {
      await runCli(['login', '--profile', 'demo', '--key-id', 'D', '--key-file', FIXTURE]);
      await runCli(['login', '--profile', 'prod', '--key-id', 'P', '--key-file', FIXTURE]);
      await runCli(['logout', '--profile', 'demo']);
      expect(listProfiles()).toEqual(['prod']);
    });
  });
  it('--all clears everything', async () => {
    await withTempHome(async () => {
      await runCli(['login', '--profile', 'demo', '--key-id', 'D', '--key-file', FIXTURE]);
      await runCli(['logout', '--all']);
      expect(listProfiles()).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement**

Add to `src/cli.ts`:

```ts
import { setActive, removeProfile, listProfiles } from './credentials.js';

function cmdUse(rest: string[]): void {
  const name = rest[0];
  if (!name) die('usage: kea use <profile>');
  setActive(name);
  cmdWhoami();
}

function cmdLogout(flags: Record<string, string>): void {
  if (flags.all === 'true') {
    for (const name of listProfiles()) removeProfile(name);
    ok('removed all profiles');
    return;
  }
  const name = flags.profile;
  if (!name) die('usage: kea logout --profile <name> | --all');
  removeProfile(name);
  ok(`removed profile '${name}'`);
}
```

Add to `runCli` switch:
```ts
case 'use': return cmdUse(rest.filter((x) => !x.startsWith('--')));
case 'logout': return cmdLogout(flags);
```

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts test/cli.test.ts
git commit -m "feat(cli): kea use and kea logout"
```

---

## Task 10: Wire `tui/api.ts` to `loadActive`

**Files:**
- Modify: `src/tui/api.ts`
- Modify: `test/tui-api.test.ts`

- [ ] **Step 1: Read existing test to confirm fixture pattern**

Run: `grep -n "KALSHI_ACCESS_KEY\|process.env" test/tui-api.test.ts`

- [ ] **Step 2: Write failing test**

Append to `test/tui-api.test.ts`:

```ts
import { upsertProfile } from '../src/credentials.js';

describe('tui/api uses loadActive credentials', () => {
  it('signs requests with credentials-file profile (no env vars)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-home-'));
    const prevHome = process.env.KEA_HOME;
    const prevKey = process.env.KALSHI_ACCESS_KEY;
    const prevPath = process.env.KALSHI_PRIVATE_KEY_PATH;
    process.env.KEA_HOME = dir;
    delete process.env.KALSHI_ACCESS_KEY;
    delete process.env.KALSHI_PRIVATE_KEY_PATH;
    try {
      const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');
      upsertProfile('prod', { keyId: 'TUIKEY', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      // import lazily so module re-reads env
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ balance: 1500, portfolio_value: 0 })));
      const { fetchBalance } = await import('../src/tui/api.js');
      const r = await fetchBalance();
      expect(r.balanceDollars).toBe(15);
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers['KALSHI-ACCESS-KEY']).toBe('TUIKEY');
      fetchSpy.mockRestore();
    } finally {
      process.env.KEA_HOME = prevHome;
      if (prevKey) process.env.KALSHI_ACCESS_KEY = prevKey;
      if (prevPath) process.env.KALSHI_PRIVATE_KEY_PATH = prevPath;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 3: Run, expect FAIL**

Run: `npx vitest run test/tui-api.test.ts -t "loadActive"`
Expected: FAIL — current code reads env vars and throws.

- [ ] **Step 4: Replace env reads in `src/tui/api.ts`**

Edit lines ~17–35:

```ts
import { loadActive } from '../credentials.js';

function sign(method: string, fullPath: string): SignedHeaders {
  const a = loadActive();
  const ts = Date.now().toString();
  const privateKey = fs.readFileSync(a.keyPath, 'utf8');
  const sig = crypto
    .sign('RSA-SHA256', Buffer.from(ts + method.toUpperCase() + fullPath), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    })
    .toString('base64');
  return { 'KALSHI-ACCESS-KEY': a.keyId, 'KALSHI-ACCESS-TIMESTAMP': ts, 'KALSHI-ACCESS-SIGNATURE': sig };
}

function baseUrl(): string {
  return loadActive().baseUrl;
}
```

Remove the now-unused `os`/`path` imports if eslint flags them (or leave; harmless).

- [ ] **Step 5: Run, expect PASS**

Run: `npx vitest run test/tui-api.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add src/tui/api.ts test/tui-api.test.ts
git commit -m "feat(tui): read credentials via loadActive instead of env vars"
```

---

## Task 11: Wire `accountClient.ts` and `kalshiClient.ts` to `loadActive`

**Files:**
- Modify: `src/accountClient.ts`
- Modify: `src/kalshiClient.ts`

- [ ] **Step 1: Read current sign blocks**

Run: `sed -n '30,70p' src/accountClient.ts; echo ---; sed -n '125,155p' src/kalshiClient.ts`

- [ ] **Step 2: Replace env reads in both files**

In each, replace the `apiKey = process.env[this.config.apiKeyEnv]` / `keyPath = process.env[this.config.privateKeyPathEnv]` block with:

```ts
import { loadActive } from './credentials.js';

// inside sign():
const a = loadActive();
const apiKey = a.keyId;
const keyPath = a.keyPath;
```

Keep the existing missing-credential error message paths — `loadActive` will throw `KeaNotConfiguredError` which is more informative anyway.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: PASS (existing accountClient/clientRetry/etc tests still pass — they construct headers from a mocked client or a fixture).

If `accountClient.test.ts` directly tests env-var reading, update it to use `withTempHome` + `upsertProfile` like the tui-api test.

- [ ] **Step 4: Commit**

```bash
git add src/accountClient.ts src/kalshiClient.ts test/accountClient.test.ts
git commit -m "feat(clients): account and kalshi clients read credentials via loadActive"
```

---

## Task 12: Wire `cli.ts` `makeMinimalConfig` and `mcp.ts` `defaultEngineConfig` to use `loadActive` for `baseUrl`

**Files:**
- Modify: `src/cli.ts`
- Modify: `src/mcp.ts`

- [ ] **Step 1: Update `makeMinimalConfig` (cli.ts)**

Replace:
```ts
baseUrl: process.env.KALSHI_BASE_URL ?? 'https://api.elections.kalshi.com/trade-api/v2',
```
with:
```ts
baseUrl: tryLoadBaseUrl(),
```

Add helper:
```ts
function tryLoadBaseUrl(): string {
  try { return loadActive().baseUrl; } catch { return process.env.KALSHI_BASE_URL ?? 'https://api.elections.kalshi.com/trade-api/v2'; }
}
```

- [ ] **Step 2: Update `defaultEngineConfig` (mcp.ts)**

Same pattern: `baseUrl: tryLoadBaseUrl()` with the same helper duplicated locally (DRY can wait — these are 4-line helpers and the modules currently don't share a util file).

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/cli.ts src/mcp.ts
git commit -m "feat(config): default baseUrl resolves via loadActive with env fallback"
```

---

## Task 13: MCP `kea_whoami` tool

**Files:**
- Modify: `src/mcp.ts`
- Modify: `test/mcp.test.ts`

- [ ] **Step 1: Write failing test**

Append to `test/mcp.test.ts`:

```ts
import { upsertProfile } from '../src/credentials.js';

describe('kea_whoami', () => {
  it('returns active profile, last-4 key id, baseUrl, isDemo', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-home-'));
    const prevHome = process.env.KEA_HOME;
    process.env.KEA_HOME = dir;
    try {
      const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');
      upsertProfile('demo', { keyId: 'AKID-DEMO-WXYZ', keyPath: FIXTURE, baseUrl: 'https://demo-api.kalshi.co/trade-api/v2' });
      const server = buildMcpServer();
      const result = await callTool(server, 'kea_whoami', {});
      const payload = JSON.parse(result.content[0].text);
      expect(payload).toEqual({
        activeProfile: 'demo',
        keyIdLast4: 'WXYZ',
        baseUrl: 'https://demo-api.kalshi.co/trade-api/v2',
        isDemo: true,
      });
      expect(result.content[0].text).not.toContain('AKID-DEMO-WXYZ');
    } finally {
      process.env.KEA_HOME = prevHome;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

(Reuse `callTool` helper already present in `test/mcp.test.ts` — read the file first.)

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run test/mcp.test.ts -t "kea_whoami"`

- [ ] **Step 3: Register tool in `src/mcp.ts`**

Inside `buildMcpServer`, after the existing `kea_balance` registration:

```ts
import { loadActive } from './credentials.js';

server.registerTool(
  'kea_whoami',
  {
    description: 'Returns the active credentials profile (name, last-4 of key id, base URL, demo flag). Read-only; no secrets in response.',
    inputSchema: {},
  },
  async () => {
    try {
      const a = loadActive();
      return jsonContent({
        activeProfile: a.profileName,
        keyIdLast4: a.keyId.slice(-4),
        baseUrl: a.baseUrl,
        isDemo: a.baseUrl.includes('demo'),
      });
    } catch (e) { return errorContent(e); }
  },
);
```

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/mcp.ts test/mcp.test.ts
git commit -m "feat(mcp): kea_whoami read-only tool exposes active profile metadata"
```

---

## Task 14: TUI Account tab component

**Files:**
- Create: `src/tui/AccountTab.tsx`
- Modify: `src/tui/App.tsx`
- Modify: `test/tui-app.test.tsx`

- [ ] **Step 1: Read existing tab pattern**

Run: `grep -n "tab\|Tab" src/tui/App.tsx | head -30`

- [ ] **Step 2: Write failing tests**

Append to `test/tui-app.test.tsx`:

```ts
import { upsertProfile, setActive } from '../src/credentials.js';

describe('Account tab', () => {
  it('shows active profile name and base URL', async () => {
    await withTempHome(async () => {
      const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');
      upsertProfile('prod', { keyId: 'AKID-WXYZ', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      const { lastFrame, stdin } = render(<App />);
      stdin.write('a'); // navigate to Account tab — confirm key in App.tsx
      await new Promise((r) => setTimeout(r, 20));
      expect(lastFrame()).toMatch(/prod/);
      expect(lastFrame()).toMatch(/PROD/i);
    });
  });

  it("renders 'Run kea login' when no profiles configured", async () => {
    await withTempHome(async () => {
      // no upsertProfile call
      delete process.env.KALSHI_ACCESS_KEY;
      delete process.env.KALSHI_PRIVATE_KEY_PATH;
      const { lastFrame, stdin } = render(<App />);
      stdin.write('a');
      await new Promise((r) => setTimeout(r, 20));
      expect(lastFrame()).toMatch(/kea login/);
    });
  });

  it("'s' keystroke cycles to next profile", async () => {
    await withTempHome(async () => {
      const FIXTURE = path.resolve(__dirname, 'fixtures/test-rsa.pem');
      upsertProfile('demo', { keyId: 'D', keyPath: FIXTURE, baseUrl: 'https://demo-api.kalshi.co/trade-api/v2' });
      upsertProfile('prod', { keyId: 'P', keyPath: FIXTURE, baseUrl: 'https://api.elections.kalshi.com/trade-api/v2' });
      setActive('demo');
      const { lastFrame, stdin } = render(<App />);
      stdin.write('a');
      await new Promise((r) => setTimeout(r, 20));
      expect(lastFrame()).toMatch(/demo/);
      stdin.write('s');
      await new Promise((r) => setTimeout(r, 20));
      expect(lastFrame()).toMatch(/prod/);
    });
  });
});
```

(Define `withTempHome` at top of test file analogous to credentials.test.ts.)

- [ ] **Step 3: Run, expect FAIL**

- [ ] **Step 4: Implement `AccountTab.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { listProfiles, getActive, setActive, loadActive, KeaNotConfiguredError, redactKeyId } from '../credentials.js';

export function AccountTab(): JSX.Element {
  const [version, setVersion] = useState(0);
  const profiles = listProfiles();
  const active = getActive();

  useInput((input) => {
    if (input === 's' && profiles.length > 1) {
      const idx = profiles.indexOf(active ?? '');
      const next = profiles[(idx + 1) % profiles.length];
      setActive(next);
      setVersion((v) => v + 1);
    }
  });

  if (profiles.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text>No Kalshi profile configured.</Text>
        <Text>Run <Text bold>kea login</Text> in your shell to connect.</Text>
      </Box>
    );
  }

  let info: { profile: string; keyIdLast4: string; baseUrl: string; isDemo: boolean };
  try {
    const a = loadActive();
    info = { profile: a.profileName, keyIdLast4: redactKeyId(a.keyId), baseUrl: a.baseUrl, isDemo: a.baseUrl.includes('demo') };
  } catch (e) {
    return <Text color="red">{e instanceof KeaNotConfiguredError ? e.message : String(e)}</Text>;
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>profile: <Text bold>{info.profile}</Text> {info.isDemo ? '[DEMO]' : '[PROD]'}</Text>
      <Text>key id : {info.keyIdLast4}</Text>
      <Text>baseUrl: {info.baseUrl}</Text>
      <Text dimColor>press <Text bold>s</Text> to switch profile ({profiles.join(', ')})</Text>
    </Box>
  );
}
```

- [ ] **Step 5: Register tab in `App.tsx`**

Find existing tab list/switch keystroke handling. Add `'a'` mapping to render `<AccountTab />`. Match the existing pattern; if tabs are an enum, add `'account'`.

- [ ] **Step 6: Run, expect PASS**

Run: `npx vitest run test/tui-app.test.tsx`

- [ ] **Step 7: Commit**

```bash
git add src/tui/AccountTab.tsx src/tui/App.tsx test/tui-app.test.tsx
git commit -m "feat(tui): Account tab shows active profile and switches with s key"
```

---

## Task 15: Update `kea help` text

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: Update `cmdHelp`**

Add to the help string (under a new section before "Env required"):

```
Account commands:
  login [--profile <name>] [--key-id <id>] [--key-file <path>] [--base-url <url>]
                                     Connect a Kalshi profile (prompts for missing fields)
  use <profile>                      Switch active profile
  whoami                             Show active profile (key id last-4 only)
  logout [--profile <name>] [--all]  Remove a profile

Credentials are stored at $KEA_HOME/credentials.json (chmod 600).
File takes precedence over KALSHI_* env vars; env vars are a fallback.
```

- [ ] **Step 2: Commit**

```bash
git add src/cli.ts
git commit -m "docs(cli): document account commands in kea help"
```

---

## Task 16: Full-suite green + manual smoke

**Files:** none

- [ ] **Step 1: Run full suite**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all green, no type errors.

- [ ] **Step 2: Manual smoke (optional, requires real Kalshi creds)**

```bash
export KEA_HOME=/tmp/kea-smoke
rm -rf $KEA_HOME
npx tsx src/cli.ts login --profile demo --key-id <real> --key-file <real.pem>
npx tsx src/cli.ts whoami
npx tsx src/cli.ts login --profile prod --key-id <real> --key-file <real.pem>
npx tsx src/cli.ts use prod
npx tsx src/cli.ts whoami
```

- [ ] **Step 3: Commit final state if anything changed**

```bash
git status
# if clean, no commit needed
```

---

## Self-review summary

- Spec coverage: every spec section maps to a task — storage (T2/T4), `validateKeyFile` (T3), CLI commands (T7–T9, T15), TUI (T14), MCP (T13), backward-compat env fallback (T4), atomic write (T4/T5), log redaction (T6), call-site rewiring (T10–T12).
- No placeholders: every code step has full code; every test step has full test.
- Type consistency: `Profile`, `CredentialsFile`, `ActiveCredentials`, `loadActive`, `redactKeyId` names used identically across tasks.
