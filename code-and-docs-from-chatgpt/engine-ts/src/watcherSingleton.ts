/**
 * Module-level Watcher singleton — accessed by CLI, MCP, and HTTP routes.
 *
 * Mirrors the `safety.ts` getter pattern. Call `initWatcher()` once at
 * process startup (typically from `runWatcherDaemon` or the CLI's
 * `kea watch start` entry). Subsequent calls to `getWatcher()` return
 * the same instance until `resetWatcherForTests()` is invoked.
 *
 * In tests, prefer `setWatcherForTests(w)` to inject a pre-built Watcher
 * with a mock client + temp-file journal.
 */
import type { Watcher } from './watcher.js';

let instance: Watcher | undefined;

export function setWatcherForTests(w: Watcher | undefined): void {
  instance = w;
}

export function resetWatcherForTests(): void {
  instance = undefined;
}

export function getWatcher(): Watcher {
  if (!instance) {
    throw new Error('Watcher singleton not initialized. Call initWatcher() or setWatcherForTests() first.');
  }
  return instance;
}

export function isWatcherInitialized(): boolean {
  return instance !== undefined;
}

export function initWatcher(w: Watcher): void {
  if (instance) {
    throw new Error('Watcher singleton already initialized');
  }
  instance = w;
}
