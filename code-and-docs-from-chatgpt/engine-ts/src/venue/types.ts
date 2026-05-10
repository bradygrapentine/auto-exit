/**
 * venue/types.ts — W4.4 SOR scaffold (multi-venue abstraction).
 *
 * `VenueClient` is the portable subset of trading-venue client surface
 * that the runners depend on. KalshiClient implements it directly;
 * future Polymarket/PredictIt adapters will implement the same surface.
 *
 * Runner-side calls verified during plan review (2026-05-09): all 7
 * methods below are exercised by `exitRunner.ts`, `buyRunner.ts`,
 * `aggressive.ts`, `passive.ts`. The Kalshi-specific
 * `listMarkets/listSeries/listEvents/fetchBalanceDollars` are kept off
 * this interface — they're discovery/account helpers the runners don't
 * depend on.
 *
 * v1 scope: this is a TYPING SEAM ONLY. SOR adds zero runtime
 * functionality; KalshiClient remains the only registered venue. The
 * Polymarket adapter + Router-driven dispatch is a follow-up that
 * needs an auth/API spike before scoping cleanly.
 */

import type { Orderbook, OrderPayload, OrderResult, Position } from '../types.js';

export type VenueName = 'kalshi' | 'polymarket' | 'predictit';

export interface VenueClient {
  /** Stable venue identifier — used by Router to key registrations. */
  readonly venueName: VenueName;

  // Read surface
  getOrderbook(ticker: string, depth: number): Promise<Orderbook>;
  getOrder(orderId: string): Promise<OrderResult>;
  getPosition(ticker: string): Promise<Position>;
  getRestingOrderCount(ticker: string): Promise<number>;
  findOrderByClientOrderId(clientOrderId: string): Promise<OrderResult | null>;

  // Write surface
  createOrder(payload: OrderPayload): Promise<OrderResult>;
  cancelOrder(orderId: string): Promise<OrderResult>;
}
