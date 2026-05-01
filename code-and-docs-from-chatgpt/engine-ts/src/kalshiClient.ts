import fs from 'node:fs';
import crypto from 'node:crypto';
import type {
  ExitConfig,
  KalshiClientLike,
  OrderPayload,
  OrderResult,
  OrderStatus,
  Orderbook,
  PriceLevel,
} from './types.js';

function dollarsToCents(value: string | number): number {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Math.round(n * 100);
}

function parseLevel(raw: unknown): PriceLevel | null {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const price = raw[0];
  const size = raw[1];
  const priceCents = typeof price === 'string' && price.includes('.') ? dollarsToCents(price) : Number(price);
  const parsedSize = typeof size === 'string' ? Number.parseFloat(size) : Number(size);
  if (!Number.isFinite(priceCents) || !Number.isFinite(parsedSize)) return null;
  return { priceCents, size: parsedSize };
}

export function parseOrderbookResponse(json: any): Orderbook {
  const ob = json.orderbook_fp ?? json.orderbook ?? json;
  const yesRaw = ob.yes_dollars ?? ob.yes ?? [];
  const noRaw = ob.no_dollars ?? ob.no ?? [];
  const yes = yesRaw.map(parseLevel).filter(Boolean) as PriceLevel[];
  const no = noRaw.map(parseLevel).filter(Boolean) as PriceLevel[];
  return { yes, no };
}

function mapStatus(raw: string | undefined): OrderStatus {
  switch ((raw ?? '').toLowerCase()) {
    case 'filled':
    case 'executed':
      return 'filled';
    case 'canceled':
    case 'cancelled':
      return 'canceled';
    case 'partially_filled':
    case 'partial':
      return 'partially_filled';
    case 'resting':
    case 'open':
    case 'new':
    case 'pending':
      return 'resting';
    default:
      return 'unknown';
  }
}

export function parseOrderResponse(json: any): OrderResult {
  const order = json?.order ?? json ?? {};
  const orderId = String(order.order_id ?? order.id ?? '');
  const requested = Number(order.count ?? order.size ?? 0);
  const remainingCount = Number(order.remaining_count ?? order.remaining ?? requested);
  const filledCount = Number.isFinite(order.filled_count)
    ? Number(order.filled_count)
    : Math.max(0, requested - remainingCount);
  return {
    orderId,
    status: mapStatus(order.status),
    filledCount,
    remainingCount,
    raw: json,
  };
}

export class KalshiClient implements KalshiClientLike {
  constructor(private config: ExitConfig) {}

  private authHeaders(method: string, path: string): Record<string, string> {
    const apiKey = process.env[this.config.apiKeyEnv];
    const keyPath = process.env[this.config.privateKeyPathEnv];
    if (!apiKey || !keyPath) throw new Error(`Missing ${this.config.apiKeyEnv} or ${this.config.privateKeyPathEnv}`);
    const timestamp = Date.now().toString();
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    const message = timestamp + method.toUpperCase() + path;
    const signature = crypto.sign('RSA-SHA256', Buffer.from(message), privateKey).toString('base64');
    return { 'KALSHI-ACCESS-KEY': apiKey, 'KALSHI-ACCESS-TIMESTAMP': timestamp, 'KALSHI-ACCESS-SIGNATURE': signature };
  }

  async getOrderbook(ticker: string, depth: number): Promise<Orderbook> {
    const path = `/markets/${ticker}/orderbook?depth=${depth}`;
    const res = await fetch(this.config.baseUrl + path, { headers: this.authHeaders('GET', path) });
    if (!res.ok) throw new Error(`Orderbook request failed: ${res.status} ${await res.text()}`);
    return parseOrderbookResponse(await res.json());
  }

  async createOrder(payload: OrderPayload): Promise<OrderResult> {
    const path = '/portfolio/orders';
    const res = await fetch(this.config.baseUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders('POST', path) },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Create order failed: ${res.status} ${await res.text()}`);
    return parseOrderResponse(await res.json());
  }

  async getOrder(orderId: string): Promise<OrderResult> {
    const path = `/portfolio/orders/${orderId}`;
    const res = await fetch(this.config.baseUrl + path, { headers: this.authHeaders('GET', path) });
    if (!res.ok) throw new Error(`Get order failed: ${res.status} ${await res.text()}`);
    return parseOrderResponse(await res.json());
  }

  async cancelOrder(orderId: string): Promise<OrderResult> {
    const path = `/portfolio/orders/${orderId}`;
    const res = await fetch(this.config.baseUrl + path, {
      method: 'DELETE',
      headers: this.authHeaders('DELETE', path),
    });
    if (!res.ok) throw new Error(`Cancel order failed: ${res.status} ${await res.text()}`);
    return parseOrderResponse(await res.json());
  }
}
