import { describe, it, expect, beforeEach } from 'vitest';
import {
  initWatcher, getWatcher, isWatcherInitialized,
  resetWatcherForTests, setWatcherForTests,
} from '../src/watcherSingleton.js';
import { Watcher } from '../src/watcher.js';

const baseCfg = { apiKeyEnv: 'X', privateKeyPathEnv: 'Y', baseUrl: 'z' };
const fakeClient = {
  getOrderbook: async () => ({ yes: [], no: [] }),
  getPosition: async () => ({ ticker: 'X', side: 'yes', quantity: 0 }),
} as any;

beforeEach(() => resetWatcherForTests());

describe('watcherSingleton', () => {
  it('getWatcher() throws before init', () => {
    expect(() => getWatcher()).toThrow(/not initialized/);
    expect(isWatcherInitialized()).toBe(false);
  });

  it('initWatcher() sets the singleton; getWatcher() returns it', () => {
    const w = new Watcher(fakeClient, baseCfg);
    initWatcher(w);
    expect(isWatcherInitialized()).toBe(true);
    expect(getWatcher()).toBe(w);
  });

  it('initWatcher() throws on double-init', () => {
    initWatcher(new Watcher(fakeClient, baseCfg));
    expect(() => initWatcher(new Watcher(fakeClient, baseCfg))).toThrow(/already initialized/);
  });

  it('setWatcherForTests() bypasses init guard for testing', () => {
    const w = new Watcher(fakeClient, baseCfg);
    setWatcherForTests(w);
    expect(getWatcher()).toBe(w);
    setWatcherForTests(undefined);
    expect(isWatcherInitialized()).toBe(false);
  });
});
