import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_BASE_URL } from '../../src/credentials.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface HarnessCase {
  name: string;
  schema: z.ZodTypeAny;
  argsResolver?: (state: Record<string, unknown>) => Record<string, unknown> | null;
  args?: Record<string, unknown>;
}

export interface HarnessResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  ms: number;
  drift?: string[];        // fields present in response but not in baseline (or vice-versa)
  schemaError?: string;
  latencyExceeded?: { budgetMs: number; actualMs: number };
}

const BASELINES_DIR = path.resolve(__dirname, 'baselines');
const LATENCY_FILE = path.resolve(__dirname, 'latency', 'p95.json');

/**
 * Guard that ensures the active profile targets the canonical Kalshi demo URL.
 * Throws on any non-exact match — prevents substring tricks like
 * `https://demo.evil.example/api`.
 */
export function assertDemoBaseUrl(baseUrl: string): void {
  if (baseUrl !== DEMO_BASE_URL) {
    throw new Error(
      `mutation suite refuses to run against baseUrl '${baseUrl}'. Expected canonical Kalshi demo (${DEMO_BASE_URL}). Run \`kea use demo\` first.`,
    );
  }
}

export async function spawnClient(): Promise<{ client: Client; close: () => Promise<void> }> {
  const transport = new StdioClientTransport({ command: 'npx', args: ['tsx', 'src/mcp.ts'] });
  const client = new Client({ name: 'mcp-harness', version: '0.1.0' }, { capabilities: {} });
  await client.connect(transport);
  return { client, close: () => client.close() };
}

export async function runCase(client: Client, c: HarnessCase, state: Record<string, unknown>): Promise<HarnessResult> {
  const args = c.argsResolver ? c.argsResolver(state) : (c.args ?? {});
  if (args === null) return { name: c.name, status: 'SKIP', ms: 0 };

  const t0 = Date.now();
  let parsed: unknown;
  try {
    const r = await client.callTool({ name: c.name, arguments: args });
    const text = (r.content?.[0] as { text: string } | undefined)?.text ?? '';
    parsed = JSON.parse(text);
  } catch (e) {
    return { name: c.name, status: 'FAIL', ms: Date.now() - t0, schemaError: e instanceof Error ? e.message : String(e) };
  }
  const ms = Date.now() - t0;

  // Schema validation
  const validation = c.schema.safeParse(parsed);
  if (!validation.success) {
    return { name: c.name, status: 'FAIL', ms, schemaError: validation.error.toString() };
  }

  // Drift detection — diff structural keys against baseline JSON Schema.
  const baselinePath = path.join(BASELINES_DIR, `${c.name}.json`);
  let drift: string[] = [];
  if (fs.existsSync(baselinePath)) {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    drift = diffKeys(baseline, zodToJsonSchema(c.schema));
  }

  // Latency budget
  const budgets = fs.existsSync(LATENCY_FILE) ? JSON.parse(fs.readFileSync(LATENCY_FILE, 'utf8')) : {};
  const budgetMs = budgets[c.name]?.budgetMs ?? 5000;
  if (ms > budgetMs) {
    return { name: c.name, status: 'FAIL', ms, drift, latencyExceeded: { budgetMs, actualMs: ms } };
  }

  return { name: c.name, status: drift.length === 0 ? 'PASS' : 'FAIL', ms, drift };
}

// Recursive structural diff between two JSON-Schema-ish objects. Returns paths
// that differ (added/removed/type-changed). Conservative — false positives on
// noisy fields are addressed by widening the schema, not by ignoring.
export function diffKeys(a: unknown, b: unknown, prefix = ''): string[] {
  // Implementation: walk `properties`, `items`, `type`. Report:
  //   `+ path.to.field` (in b not in a)
  //   `- path.to.field` (in a not in b)
  //   `~ path.to.field: <typeA> -> <typeB>` (type mismatch)
  const out: string[] = [];
  const ao = (a ?? {}) as Record<string, unknown>;
  const bo = (b ?? {}) as Record<string, unknown>;
  const aProps = (ao.properties ?? {}) as Record<string, unknown>;
  const bProps = (bo.properties ?? {}) as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(aProps), ...Object.keys(bProps)]);
  for (const k of allKeys) {
    const ak = aProps[k] as Record<string, unknown> | undefined;
    const bk = bProps[k] as Record<string, unknown> | undefined;
    const subPath = prefix ? `${prefix}.${k}` : k;
    if (!ak) { out.push(`+ ${subPath}`); continue; }
    if (!bk) { out.push(`- ${subPath}`); continue; }
    if (ak.type !== bk.type) out.push(`~ ${subPath}: ${ak.type} -> ${bk.type}`);
    if (ak.type === 'object' || bk.type === 'object') out.push(...diffKeys(ak, bk, subPath));
  }
  return out;
}

export function recordLatency(name: string, ms: number): void {
  const file = LATENCY_FILE;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const entry = data[name] ?? { samples: [], budgetMs: 5000 };
  entry.samples.push(ms);
  if (entry.samples.length > 30) entry.samples = entry.samples.slice(-30);
  // p95 of samples
  const sorted = [...entry.samples].sort((x: number, y: number) => x - y);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 5000;
  entry.budgetMs = Math.max(p95 * 2, 1000); // at least 1s budget
  data[name] = entry;
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
