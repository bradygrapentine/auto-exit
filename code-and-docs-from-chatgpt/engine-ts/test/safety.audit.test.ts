import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function withTempHome<T>(fn: (dir: string) => Promise<T> | T): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-audit-'));
  const prev = process.env.KEA_HOME;
  process.env.KEA_HOME = dir;
  return Promise.resolve()
    .then(() => fn(dir))
    .finally(() => {
      if (prev === undefined) delete process.env.KEA_HOME;
      else process.env.KEA_HOME = prev;
      fs.rmSync(dir, { recursive: true, force: true });
    });
}

async function importSafety() {
  return import('../src/safety.js');
}

describe('safety audit log', () => {
  it('setSafety writes a safety_config_changed audit line', async () => {
    await withTempHome(async (dir) => {
      const { setSafety } = await importSafety();
      setSafety({ floorPriceCents: 5 });
      const auditFile = path.join(dir, 'safety.audit.jsonl');
      expect(fs.existsSync(auditFile)).toBe(true);
      const lines = fs.readFileSync(auditFile, 'utf8').trim().split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(1);
      const entry = JSON.parse(lines[lines.length - 1]);
      expect(entry.kind).toBe('safety_config_changed');
      expect(entry.data.action).toBe('setSafety');
      expect(entry.ts).toBeTruthy();
    });
  });

  it('addForbiddenTicker writes a safety_config_changed audit line', async () => {
    await withTempHome(async (dir) => {
      const { addForbiddenTicker } = await importSafety();
      addForbiddenTicker('KXAUDIT', 'test audit', 'cli');
      const auditFile = path.join(dir, 'safety.audit.jsonl');
      const lines = fs.readFileSync(auditFile, 'utf8').trim().split('\n');
      const entry = JSON.parse(lines[lines.length - 1]);
      expect(entry.kind).toBe('safety_config_changed');
      expect(entry.data.action).toBe('addForbiddenTicker');
      expect(entry.data.ticker).toBe('KXAUDIT');
    });
  });
});
