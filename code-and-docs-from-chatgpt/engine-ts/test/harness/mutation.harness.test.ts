import { describe, beforeAll } from 'vitest';
import { loadActive } from '../../src/credentials.js';

describe.runIf(process.env.HARNESS === '1' && process.env.HARNESS_SUITE === 'mutation')('MCP mutation harness', () => {
  beforeAll(() => {
    const a = loadActive();
    if (!a.baseUrl.includes('demo')) {
      throw new Error(
        `mutation suite refuses to run against non-demo baseUrl '${a.baseUrl}'. Run \`kea use demo\` first.`,
      );
    }
  });

  // No mutation tests yet — the engine doesn't expose mutating MCP tools.
  // When mutating tools land (e.g., kea_place_order, kea_cancel_order, kea_run_exit),
  // add tests here. Each must:
  //   - Use a small fixed quantity on a low-volume demo market.
  //   - Reverse its own effect in a finally block (cancel placed orders, etc).
  //   - Run serially within this describe block — never parallel.
});
