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

export async function validateKeyFile(keyPath: string): Promise<void> {
  await fs.promises.access(keyPath, fs.constants.R_OK);
  const pem = await fs.promises.readFile(keyPath, 'utf8');
  // Throws if not a parseable private key.
  crypto.createPrivateKey(pem);
}

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
  if (Object.keys(file.profiles).length === 0) {
    // Empty file would leave loadActive() with active='' and no profiles, which
    // is a confusing intermediate state. Unlink so env-var fallback kicks in cleanly.
    fs.unlinkSync(credentialsPath());
    return;
  }
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

export function redactKeyId(keyId: string): string {
  if (keyId.length <= 4) return '****';
  return `…${keyId.slice(-4)}`;
}
