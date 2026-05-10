/**
 * executors.ts — SH-MICRO-EXECUTION-LOOP §3.4 (CLI wiring)
 *
 * Maps `MicroTrialConfig.strategy` → existing strategy runner. Keeps the
 * harness composable: each executor just shapes params into the runner's
 * config and calls `run()`. The runner already journals the canonical
 * `loop_started` / `order_*` entries that SH-EDGE consumes.
 *
 * v1 wires `s-passive` and `s-aggressive` only. Other strategies throw
 * with a clear message — the operator can run them via `kea strategy ...`
 * directly until they're ported here.
 */

import { run as runPassive } from '../passive.js';
import { AggressiveRunner } from '../aggressive.js';
import { KalshiClient } from '../kalshiClient.js';
import { makeMinimalConfig } from '../cli.js';
import type { Journal } from '../journal.js';
import type { MicroTrialConfig } from './trial.js';
import type { StrategyExecResult } from './runner.js';
import type { PassiveConfig } from '../passive.js';
import type { AggressiveConfig } from '../aggressive.js';

function num(v: unknown, label: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`micro-harness: param '${label}' must be a finite number; got ${String(v)}`);
  }
  return v;
}

async function execPassive(config: MicroTrialConfig, _journal: Journal): Promise<StrategyExecResult> {
  const params = config.params;
  const size = num(params['size'], 'size');
  // PassiveConfig.side is the trade direction (buy/sell), not yes/no.
  const action = (params['action'] as 'buy' | 'sell') ?? 'sell';
  const passiveConfig: PassiveConfig = {
    ticker: config.ticker,
    side: action,
    size,
    jobId: config.trialId, // align with trialId so SH-EDGE attribution works
    walkStepCents: typeof params['walkStepCents'] === 'number' ? params['walkStepCents'] : undefined,
    chunkSize: typeof params['chunkSize'] === 'number' ? params['chunkSize'] : undefined,
    passiveTimeboxMs: typeof params['passiveTimeboxMs'] === 'number' ? params['passiveTimeboxMs'] : undefined,
    loopDelayMs: typeof params['loopDelayMs'] === 'number' ? params['loopDelayMs'] : undefined,
  };
  const client = new KalshiClient(makeMinimalConfig(config.ticker));
  const result = await runPassive(client, passiveConfig);
  return { filled: result.filled, status: 'complete' };
}

async function execAggressive(config: MicroTrialConfig, _journal: Journal): Promise<StrategyExecResult> {
  const params = config.params;
  const size = num(params['size'], 'size');
  const aggressiveConfig: AggressiveConfig = {
    ticker: config.ticker,
    side: config.side,
    action: (params['action'] as 'buy' | 'sell') ?? 'sell',
    size,
    confirmedAggressive: true,
    oneTickIn: params['oneTickIn'] === true,
    // Liveness check on by default (Sub-story 2). Operator can disable for
    // very small validation trials by passing { livenessCheckEnabled: false }.
    livenessCheckEnabled: params['livenessCheckEnabled'] !== false,
  };
  const client = new KalshiClient(makeMinimalConfig(config.ticker));
  const result = await new AggressiveRunner(client, aggressiveConfig).run();
  return { filled: result.filled, status: 'complete' };
}

export async function executeStrategy(
  config: MicroTrialConfig,
  journal: Journal,
): Promise<StrategyExecResult> {
  switch (config.strategy) {
    case 's-passive': return execPassive(config, journal);
    case 's-aggressive': return execAggressive(config, journal);
    case 's-trail':
    case 's-twap':
    case 's-auto':
      throw new Error(
        `micro-harness: strategy '${config.strategy}' is not yet wired. Run via 'kea strategy ${config.strategy.slice(2)}' directly until v1.1.`,
      );
    default: {
      // Exhaustive check — TypeScript narrows away covered cases.
      const _exhaustive: never = config.strategy;
      throw new Error(`micro-harness: unknown strategy ${String(_exhaustive)}`);
    }
  }
}
