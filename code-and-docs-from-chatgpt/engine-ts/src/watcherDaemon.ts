/**
 * watcherDaemon — long-running CLI driver for the Watcher.
 *
 * Wires KalshiClient + WatcherJournal + Watcher + invokeFire together,
 * replays from journal at startup, then enters the Watcher's tick loop.
 * SIGTERM/SIGINT triggers a graceful stop().
 *
 * For tests, `runWatcherDaemon` accepts pre-built deps so you can drive
 * the loop with a mock client and a temp-file journal.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Synthetic, KalshiClientLike, ExitConfig, WatcherConfig } from './types.js';
import { KalshiClient } from './kalshiClient.js';
import { Watcher, type FireDeps, type FireHook } from './watcher.js';
import { WatcherJournal } from './watcherJournal.js';
import { invokeFire, buildExitConfig } from './synthetics/invoke.js';
import { ExitRunner } from './exitRunner.js';

export interface WatcherDaemonDeps {
  client: KalshiClientLike;
  journal: WatcherJournal;
  config: WatcherConfig;
  fireDeps?: Partial<FireDeps>;
}

/**
 * Default fire-deps using ExitRunner for runExit and a stop_limit
 * postLimit (TODO: real postLimit lands with stop_limit's order placement
 * path — for now postLimit throws when called, signaling stop_limit
 * synthetics need the dedicated wiring before they fire in production).
 */
export function defaultFireDeps(client: KalshiClientLike, template: Partial<ExitConfig>): FireDeps {
  return {
    runExit: async (cfg: ExitConfig) => {
      const runner = new ExitRunner(cfg);
      return runner.run();
    },
    postLimit: async () => {
      throw new Error('postLimit wiring not implemented yet — stop_limit synthetic cannot fire in this build');
    },
    buildExitConfig: (s: Synthetic) => buildExitConfig(s, template),
  };
}

export function buildDaemon(deps: WatcherDaemonDeps): { watcher: Watcher; start: () => Promise<void>; stop: () => void } {
  const watcher = new Watcher(deps.client, deps.config, deps.journal);
  watcher.replayFromJournal();

  const fireDeps: FireDeps = {
    ...defaultFireDeps(deps.client, deps.config.exitConfigTemplate ?? {}),
    ...deps.fireDeps,
  };

  const fireHook: FireHook = (s, reason) => invokeFire(s, fireDeps);
  watcher.setFireHook(fireHook);

  return {
    watcher,
    start: () => watcher.start(),
    stop: () => watcher.stop(),
  };
}

/** Production entrypoint — builds a real KalshiClient + journal from WatcherConfig. */
export function runWatcherDaemon(config: WatcherConfig): { watcher: Watcher; start: () => Promise<void>; stop: () => void } {
  const journalPath = config.watcherJournalPath ?? join(homedir(), '.kalshi-exit-assistant', 'watchers.ndjson');
  const journal = new WatcherJournal(journalPath);

  // KalshiClient needs an ExitConfig — build a minimal stub from the watcher config.
  const stubExitCfg = {
    ...(config.exitConfigTemplate ?? {}),
    baseUrl: config.baseUrl,
    apiKeyEnv: config.apiKeyEnv,
    privateKeyPathEnv: config.privateKeyPathEnv,
  } as ExitConfig;
  const client = new KalshiClient(stubExitCfg);

  const daemon = buildDaemon({ client, journal, config });

  const onSignal = () => daemon.stop();
  process.on('SIGTERM', onSignal);
  process.on('SIGINT', onSignal);

  return daemon;
}
