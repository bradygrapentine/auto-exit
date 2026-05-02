# Account Connect — Design Spec

**Date:** 2026-05-01
**Status:** Approved (brainstorm complete)

## Problem

Today, Kalshi credentials are read from environment variables (`KALSHI_ACCESS_KEY`, `KALSHI_PRIVATE_KEY_PATH`, `KALSHI_BASE_URL`) at five call sites: `accountClient.ts`, `kalshiClient.ts`, `tui/api.ts`, `cli.ts`, `mcp.ts`. There is no first-time onboarding flow, no way to switch demo↔prod without exporting different env vars, and no way to see which environment is currently active.

Target user: anyone running the TUI/MCP locally, including first-time users with zero env vars set.

## Goals

- First-time users can connect without setting env vars.
- Switching demo↔prod is a single command or TUI keystroke.
- TUI and MCP can both surface the active profile (read-only; no secret entry in those surfaces).
- Existing env-var users keep working unchanged.

## Non-goals

- OS keychain integration (RSA private key file is the real sensitive material; the key ID is closer to a username).
- Encrypted-at-rest credentials with passphrases.
- Mutating MCP tools that touch credentials.

## Storage

`$KEA_HOME/credentials.json`, `chmod 0o600`. `KEA_HOME` defaults to `~/.kalshi-exit-assistant` (already used elsewhere in the codebase).

```json
{
  "active": "prod",
  "profiles": {
    "demo": {
      "keyId": "...",
      "keyPath": "/abs/path.pem",
      "baseUrl": "https://demo-api.kalshi.co/trade-api/v2"
    },
    "prod": {
      "keyId": "...",
      "keyPath": "/abs/path.pem",
      "baseUrl": "https://api.elections.kalshi.com/trade-api/v2"
    }
  }
}
```

Atomic write: write to `credentials.json.tmp`, `fs.rename` over the target. Mode `0o600` set on creation.

## Components

### `src/credentials.ts` (new, ~120 LOC)

```ts
type Profile = { keyId: string; keyPath: string; baseUrl: string };
type Credentials = { active: string; profiles: Record<string, Profile> };
type ActiveCredentials = Profile & { profileName: string };

class KeaNotConfiguredError extends Error {}

function loadActive(): ActiveCredentials;          // file → env fallback → throw
function listProfiles(): string[];
function getActive(): string | null;
function setActive(name: string): void;
function upsertProfile(name: string, profile: Profile): void;
function removeProfile(name: string): void;
function validateKeyFile(path: string): Promise<void>; // fs.access + crypto.createPrivateKey parse
```

- File-load order in `loadActive()`: credentials file → env vars → throw `KeaNotConfiguredError`.
- `validateKeyFile` uses Node's `crypto.createPrivateKey` to confirm a parseable RSA key. Never logs file contents.
- On load, if file mode is not `0o600`, fix in place and warn (don't refuse).

### CLI subcommands (extend `src/cli.ts`)

| Command | Behavior |
|---|---|
| `kea login [--profile <name>] [--key-id <id>] [--key-file <path>] [--base-url <url>]` | Flags + prompts for missing fields. Defaults `--profile` to `prod`. Default `--base-url` chosen from profile name (`prod` → prod URL, `demo` → demo URL). Validates key file before saving. |
| `kea use <profile>` | Sets active profile. |
| `kea whoami` | Prints active profile name, key ID **last-4 only**, base URL. |
| `kea logout [--profile <name>] [--all]` | Removes profile(s). |

### TUI panel (extend `src/tui/`)

- New "Account" tab (or footer indicator).
- Shows active profile name and base URL.
- Keystroke `s` cycles to next profile (calls `setActive`, then `loadActive` to refresh).
- If no profiles configured, shows: `Run \`kea login\` to connect.`
- Read-only — no secret entry in TUI.

### MCP tool (extend `src/mcp.ts`)

- `kea_whoami` — returns `{ activeProfile, keyIdLast4, baseUrl, isDemo }`.
- Read-only. No secrets in response.

## Data flow

**First-time connect**
1. User runs `kea login`.
2. CLI prompts: profile name → key id → key file path → base URL (default offered).
3. `validateKeyFile()` parses RSA. On failure, re-prompt the path.
4. `upsertProfile` writes `credentials.json` atomically with `0o600`. If file is new, this profile becomes active.
5. Print `kea whoami` summary.

**Switching env**
- CLI: `kea use prod` → updates `active` field, prints new `whoami`.
- TUI: press `s` → same call, panel refreshes.
- Other long-running processes pick up the change next time they call `loadActive()`.

**Read path (every API call)**
- All five call sites replace `process.env.KALSHI_*` reads with `credentials.loadActive()`.
- Private key file is read fresh per signing call (matches current `kalshiClient.ts:135` behavior); never cached in memory beyond a single request.

**MCP `kea_whoami`**
- `loadActive()` → `{ activeProfile, keyIdLast4: keyId.slice(-4), baseUrl, isDemo: baseUrl.includes('demo') }`.

## Error handling

| Condition | Behavior |
|---|---|
| No file, no env vars | `KeaNotConfiguredError`: `"No Kalshi credentials configured. Run \`kea login\` to connect."` |
| File present, `active` profile missing from `profiles` | `"Active profile '<name>' not found. Run \`kea use <profile>\` or \`kea login\`."` |
| Key file unreadable / not RSA on `kea login` | Re-prompt path. |
| Key file unreadable / not RSA at runtime | Surface underlying error with profile name. |
| Concurrent writes (TUI switching while CLI logs in) | Atomic tmp+rename; last writer wins. Acceptable for single-user local tool. |
| File mode not `0o600` on load | Fix in place, log warning. |

## Logging discipline

- `keyId` is only ever printed as last-4 chars (`...AB12`).
- Key file path is OK to print.
- File contents are never logged.
- Unit test asserts no log line contains the full key id.

## Backward compatibility

Existing users with `KALSHI_*` env vars set keep working: `loadActive()` falls back to env when no credentials file exists. Documented rule: **file takes precedence over env.**

## Testing

### `test/credentials.test.ts` (new)
- Round-trip: `upsertProfile` → `loadActive` returns same fields.
- File mode is `0o600` after write.
- Atomic write: simulated failure mid-write leaves prior file intact.
- Env-var fallback when file absent.
- `KeaNotConfiguredError` when neither file nor env present.
- `setActive` to unknown profile throws.
- `validateKeyFile` accepts real RSA PEM fixture, rejects garbage.
- Log redaction: spy on `console.*`, assert no full `keyId` printed anywhere.

### `test/cli.test.ts` (extend)
- `kea login` with all flags writes correct file.
- `kea whoami` shows last-4 only.
- `kea use` flips active.
- `kea logout` removes profile.

### `test/mcp.test.ts` (extend)
- `kea_whoami` returns expected shape.
- Response never includes raw key id.

### `test/tui/App.test.tsx` (extend)
- Account tab renders active profile.
- `s` key calls `setActive`.
- No-creds state shows help message.

### Out of scope
- No e2e against real Kalshi for the connect flow — credentials file is filesystem-only.
