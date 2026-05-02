import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    // Ensure extension/popup files (outside engine-ts root) resolve react/react-dom
    // from engine-ts/node_modules rather than relative to their own directory.
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
  },
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**', 'worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/cli.ts',          // tiny entrypoint, no logic
        'src/server.ts',       // HTTP plumbing covered indirectly via integration; not unit-tested
        'src/tui.tsx',         // tiny entrypoint that just renders <App />
        'src/**/*.d.ts',
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
