/**
 * venue/router.ts — W4.4 SOR scaffold.
 *
 * v1 stub: keeps a registry of registered venues, returns the
 * first-registered for any ticker. SOR pricing logic (compare
 * effective prices across venues, route to the best, fall back
 * when depth is consumed) is a follow-up — the v1 contract is
 * just "there's a Router; runners go through it instead of newing
 * KalshiClient directly when multi-venue lands."
 *
 * Today no callsite uses Router — KalshiClient is constructed
 * directly. This module exists so the plumbing is in place when
 * a second venue is added.
 */

import type { VenueClient, VenueName } from './types.js';

export class Router {
  private clients: Map<VenueName, VenueClient> = new Map();

  register(client: VenueClient): void {
    this.clients.set(client.venueName, client);
  }

  /** v1: returns the first registered venue. SOR pricing comes later. */
  pickVenue(_ticker: string): VenueClient {
    const list = [...this.clients.values()];
    if (list.length === 0) {
      throw new Error('Router: no venues registered. Call register() first.');
    }
    return list[0]!;
  }

  /** Lookup by venue name. Returns null when not registered. */
  getVenue(name: VenueName): VenueClient | null {
    return this.clients.get(name) ?? null;
  }

  /** Number of registered venues. */
  size(): number {
    return this.clients.size;
  }
}
