#!/usr/bin/env node
/**
 * Synthesize a multi-regime recording by concatenating segments from existing
 * recordings, rebasing timestamps so they're monotonic and overriding the
 * ticker to a synthetic name.
 *
 * Usage:
 *   node scripts/synthesize-multiregime.mjs \
 *     --out /path/to/out.ndjson \
 *     --ticker KXSYNTH-rising-falling \
 *     --segments rec1.ndjson,rec2.ndjson[,rec3.ndjson...]
 *
 * The seam between segments is artificial — interpret findings as directional
 * signal, not production guarantees.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as readline from 'node:readline';

const REC_DIR = path.join(os.homedir(), '.kea/recordings');

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) args[a.slice(2)] = process.argv[++i];
  }
  if (!args.out) throw new Error('--out required');
  if (!args.ticker) throw new Error('--ticker required');
  if (!args.segments) throw new Error('--segments required (comma-separated)');
  args.segments = args.segments.split(',');
  return args;
}

async function* readSnapshots(file) {
  const rl = readline.createInterface({ input: fs.createReadStream(path.join(REC_DIR, file)), crlfDelay: Infinity });
  for await (const line of rl) {
    const t = line.trim();
    if (!t) continue;
    let entry;
    try { entry = JSON.parse(t); } catch { continue; }
    if (entry.kind === 'snapshot') yield entry;
  }
}

function isoToMs(ts) { return new Date(ts).getTime(); }
function msToIso(ms) { return new Date(ms).toISOString(); }

(async () => {
  const args = parseArgs();
  const outStream = fs.createWriteStream(args.out);

  let lastWrittenMs = 0;
  let totalWritten = 0;

  for (let segIdx = 0; segIdx < args.segments.length; segIdx++) {
    const seg = args.segments[segIdx];
    process.stderr.write(`[synth] reading ${seg}\n`);
    let segOriginMs = null;
    let snapsThisSeg = 0;
    for await (const entry of readSnapshots(seg)) {
      const origMs = isoToMs(entry.ts);
      if (segOriginMs === null) segOriginMs = origMs;
      // Rebased ts: segOriginMs anchored 1ms after last segment ended.
      const offsetMs = origMs - segOriginMs;
      const baseMs = segIdx === 0 ? origMs : (lastWrittenMs + 1);
      if (segIdx === 0 && lastWrittenMs === 0) lastWrittenMs = baseMs - 1;
      const newMs = (segIdx === 0 ? origMs : baseMs + offsetMs);
      const out = { ...entry, ts: msToIso(newMs), ticker: args.ticker };
      outStream.write(JSON.stringify(out) + '\n');
      lastWrittenMs = newMs;
      snapsThisSeg++;
      totalWritten++;
    }
    process.stderr.write(`[synth]   wrote ${snapsThisSeg} snapshots from ${seg}\n`);
  }
  outStream.end();
  process.stderr.write(`[synth] total: ${totalWritten} snapshots → ${args.out}\n`);
})();
