import { loadConfig, parseArgs } from './config.js';
import { ExitRunner } from './exitRunner.js';

async function main() {
  const { configPath } = parseArgs();
  const config = loadConfig(configPath);
  const runner = new ExitRunner(config);
  await runner.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
