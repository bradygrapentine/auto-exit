import http from 'node:http';
import { loadConfig, mergeConfig, parseArgs } from './config.js';
import { ExitRunner } from './exitRunner.js';
import type { ExitConfig, ExitConfigPatch, JobStatus } from './types.js';

const { configPath } = parseArgs();
const baseConfig = loadConfig(configPath);
let activeRunner: ExitRunner | null = null;
let lastStatus: JobStatus | null = null;

function json(res: http.ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

async function readJson(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function effectiveConfig(patch?: Partial<ExitConfigPatch>): ExitConfig {
  return mergeConfig(baseConfig, patch ?? {});
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {});
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true, name: 'kalshi-exit-assistant-local-engine', running: activeRunner?.getStatus().running ?? false });
    }

    if (req.method === 'GET' && url.pathname === '/status') {
      return json(res, 200, activeRunner?.getStatus() ?? lastStatus ?? { running: false, stopped: true, events: [] });
    }

    if (req.method === 'POST' && url.pathname === '/preview') {
      const body = await readJson(req);
      const config = effectiveConfig(body.config);
      const runner = new ExitRunner({ ...config, dryRun: true });
      const preview = await runner.previewOnce();
      return json(res, 200, { ok: true, config: { ...config, dryRun: true }, ...preview });
    }

    if (req.method === 'POST' && url.pathname === '/start') {
      if (activeRunner?.getStatus().running) return json(res, 409, { ok: false, error: 'A job is already running' });
      const body = await readJson(req);
      const config = effectiveConfig(body.config);
      activeRunner = new ExitRunner(config);
      activeRunner.run().then((status) => { lastStatus = status; }).catch((err) => { console.error(err); });
      return json(res, 202, { ok: true, jobId: activeRunner.jobId, status: activeRunner.getStatus() });
    }

    if (req.method === 'POST' && url.pathname === '/resume') {
      if (activeRunner?.getStatus().running) return json(res, 409, { ok: false, error: 'A job is already running' });
      const body = await readJson(req);
      if (!body.jobId || typeof body.jobId !== 'string') {
        return json(res, 400, { ok: false, error: 'jobId is required' });
      }
      const config = effectiveConfig(body.config);
      activeRunner = new ExitRunner(config, undefined, { resumeFromJobId: body.jobId });
      activeRunner.run().then((status) => { lastStatus = status; }).catch((err) => { console.error(err); });
      return json(res, 202, { ok: true, jobId: activeRunner.jobId, status: activeRunner.getStatus() });
    }

    if (req.method === 'POST' && url.pathname === '/stop') {
      activeRunner?.stop('stop_requested_from_extension');
      return json(res, 200, { ok: true, status: activeRunner?.getStatus() ?? lastStatus });
    }

    if (req.method === 'POST' && url.pathname === '/preflight') {
      const body = await readJson(req);
      const config = effectiveConfig(body.config);
      const runner = new ExitRunner(config);
      const position = await runner.preflight();
      return json(res, 200, { ok: true, observed: position, requested: { ticker: config.marketTicker, side: config.heldSide, quantity: config.positionSize } });
    }

    return json(res, 404, { ok: false, error: 'not_found' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(res, 500, { ok: false, error: msg });
  }
});

server.listen(baseConfig.localServerPort, () => {
  console.log(`Kalshi Exit Assistant local engine listening on http://127.0.0.1:${baseConfig.localServerPort}`);
});
