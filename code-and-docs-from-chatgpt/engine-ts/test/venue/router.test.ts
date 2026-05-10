/**
 * test/venue/router.test.ts — W4.4 SOR scaffold
 *
 * Pin Router contract: empty throws; single registered returns;
 * lookup by name; size accessor.
 */

import { describe, it, expect } from 'vitest';
import { Router } from '../../src/venue/router.js';
import type { VenueClient } from '../../src/venue/types.js';

function fakeVenue(name: VenueClient['venueName']): VenueClient {
  return {
    venueName: name,
    getOrderbook: async () => ({ yes: [], no: [] }),
    getOrder: async () => { throw new Error('stub'); },
    getPosition: async () => ({ ticker: 'X', side: 'yes', quantity: 0 }),
    getRestingOrderCount: async () => 0,
    findOrderByClientOrderId: async () => null,
    createOrder: async () => { throw new Error('stub'); },
    cancelOrder: async () => { throw new Error('stub'); },
  };
}

describe('Router', () => {
  it('throws on pickVenue when empty', () => {
    const r = new Router();
    expect(() => r.pickVenue('KX-A')).toThrow(/no venues registered/);
  });

  it('returns the only registered venue', () => {
    const r = new Router();
    const k = fakeVenue('kalshi');
    r.register(k);
    expect(r.pickVenue('KX-A')).toBe(k);
    expect(r.size()).toBe(1);
  });

  it('returns first-registered when multiple are present (v1: SOR pricing deferred)', () => {
    const r = new Router();
    const k = fakeVenue('kalshi');
    const p = fakeVenue('polymarket');
    r.register(k);
    r.register(p);
    expect(r.pickVenue('KX-A')).toBe(k); // first-registered wins until SOR ships
    expect(r.size()).toBe(2);
  });

  it('getVenue looks up by name', () => {
    const r = new Router();
    const k = fakeVenue('kalshi');
    r.register(k);
    expect(r.getVenue('kalshi')).toBe(k);
    expect(r.getVenue('polymarket')).toBeNull();
  });

  it('register replaces same-name venue', () => {
    const r = new Router();
    r.register(fakeVenue('kalshi'));
    const second = fakeVenue('kalshi');
    r.register(second);
    expect(r.getVenue('kalshi')).toBe(second);
    expect(r.size()).toBe(1);
  });
});
