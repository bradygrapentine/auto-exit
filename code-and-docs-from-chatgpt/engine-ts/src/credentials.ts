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
