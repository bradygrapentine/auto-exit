import fs from 'node:fs';
import crypto from 'node:crypto';
import type {
  ExitConfig,
  KalshiClientLike,
  OrderPayload,
  OrderResult,
  OrderStatus,
  Orderbook,
  Position,
  PriceLevel,
} from './types.js';
import { KalshiAccountClient } from './accountClient.js';
import { withRetry, HttpError, NonRetryableError, parseRetryAfterMs, computeBackoffMs } from './retry.js';

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

/** Fetch-compatible interface for injection in tests. */
export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Perform a fetch call and convert HTTP errors into typed HttpError / NonRetryableError.
 * Returns the Response on success (2xx).
 */
async function fetchChecked(fetchFn: FetchFn, url: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetchFn(url, init);
  } catch (err) {
    // Network-level error — rethrow as plain Error so withRetry can handle it.
    throw err instanceof Error ? err : new Error(String(err));
  }
  if (res.ok) return res;

  const status = res.status;
  if (status === 429) {
    const retryAfterMs = parseRetryAfterMs(res.headers.get('Retry-After'));
    // Read body to avoid connection leak, then throw
    await res.text().catch(() => '');
    throw new HttpError(status, retryAfterMs, `HTTP 429 Too Many Requests`);
  }
  if (status >= 400 && status < 500) {
    const body = await res.text().catch(() => '');
    throw new NonRetryableError(status, `HTTP ${status}: ${body}`);
  }
  // 5xx
  const body = await res.text().catch(() => '');
  throw new HttpError(status, undefined, `HTTP ${status}: ${body}`);
}

export class KalshiClient implements KalshiClientLike {
  private accountClient: KalshiAccountClient;
  private readonly fetchFn: FetchFn;

  constructor(private config: ExitConfig, fetchFn?: FetchFn) {
    this.accountClient = new KalshiAccountClient(config);
    this.fetchFn = fetchFn ?? (globalThis.fetch as FetchFn);
  }

  private authHeaders(method: string, path: string): Record<string, string> {
    const apiKey = process.env[this.config.apiKeyEnv];
    const keyPath = process.env[this.config.privateKeyPathEnv];
    if (!apiKey || !keyPath) throw new Error(`Missing ${this.config.apiKeyEnv} or ${this.config.privateKeyPathEnv}`);
    const timestamp = Date.now().toString();
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    const message = timestamp + method.toUpperCase() + path;
    // Kalshi v2 uses RSA-PSS (not PKCS#1 v1.5) with SHA-256 + salt length = digest length.
    const signature = crypto.sign('RSA-SHA256', Buffer.from(message), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    }).toString('base64');
    return { 'KALSHI-ACCESS-KEY': apiKey, 'KALSHI-ACCESS-TIMESTAMP': timestamp, 'KALSHI-ACCESS-SIGNATURE': signature };
  }

  async getOrderbook(ticker: string, depth: number): Promise<Orderbook> {
    return withRetry(async () => {
      const path = `/markets/${ticker}/orderbook?depth=${depth}`;
      const res = await fetchChecked(
        this.fetchFn,
        this.config.baseUrl + path,
        { headers: this.authHeaders('GET', path) },
      );
      return parseOrderbookResponse(await res.json());
    });
  }

  async getOrder(orderId: string): Promise<OrderResult> {
    return withRetry(async () => {
      const path = `/portfolio/orders/${orderId}`;
      const res = await fetchChecked(
        this.fetchFn,
        this.config.baseUrl + path,
        { headers: this.authHeaders('GET', path) },
      );
      return parseOrderResponse(await res.json());
    });
  }

  async cancelOrder(orderId: string): Promise<OrderResult> {
    return withRetry(async () => {
      const path = `/portfolio/orders/${orderId}`;
      const res = await fetchChecked(
        this.fetchFn,
        this.config.baseUrl + path,
        { method: 'DELETE', headers: this.authHeaders('DELETE', path) },
      );
      return parseOrderResponse(await res.json());
    });
  }

  /**
   * Search for an order by client_order_id via GET /portfolio/orders?client_order_id=<id>.
   * Returns the OrderResult if found, null otherwise.
   */
  private async findOrderByClientOrderId(clientOrderId: string): Promise<OrderResult | null> {
    const path = `/portfolio/orders?client_order_id=${encodeURIComponent(clientOrderId)}`;
    let res: Response;
    try {
      res = await this.fetchFn(this.config.baseUrl + path, { headers: this.authHeaders('GET', path) });
    } catch {
      return null; // network error during dedup check — treat as not found
    }
    if (!res.ok) return null;
    let json: any;
    try {
      json = await res.json();
    } catch {
      return null;
    }
    // Kalshi returns either { orders: [...] } or a single order object
    const orders: any[] = json?.orders ?? (json?.order ? [json] : []);
    if (orders.length === 0) return null;
    return parseOrderResponse(orders[0]);
  }

  // NOTE: createOrder uses its own fixed retry knobs (maxAttempts=4, baseMs=200, maxMs=4000)
  // and does NOT currently honor RetryOptions. Future work to wire RetryOptions through here.
  async createOrder(payload: OrderPayload): Promise<OrderResult> {
    const path = '/portfolio/orders';
    let attempt = 0;
    const maxAttempts = 4;
    const baseMs = 200;
    const maxMs = 4000;

    let lastErr: unknown;
    while (attempt < maxAttempts) {
      try {
        const res = await fetchChecked(
          this.fetchFn,
          this.config.baseUrl + path,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...this.authHeaders('POST', path) },
            body: JSON.stringify(payload),
          },
        );
        return parseOrderResponse(await res.json());
      } catch (err) {
        lastErr = err;

        // 4xx (non-429) — fail fast, no retry
        if (err instanceof NonRetryableError) throw err;

        const isNetworkError = !(err instanceof HttpError);
        const is5xx = err instanceof HttpError && err.status >= 500;
        const is429 = err instanceof HttpError && err.status === 429;

        if (!isNetworkError && !is5xx && !is429) throw err;

        // On network error OR 5xx: the POST may have landed server-side — check by cloid before retrying
        if (isNetworkError || is5xx) {
          const existing = await this.findOrderByClientOrderId(payload.client_order_id);
          if (existing) return existing; // order landed; treat as success
        }

        if (attempt === maxAttempts - 1) break;

        // Compute delay using shared computeBackoffMs helper (caps jitter within maxMs)
        let delayMs: number;
        if (is429) {
          const httpErr = err as HttpError;
          delayMs = httpErr.retryAfterMs !== undefined
            ? httpErr.retryAfterMs
            : computeBackoffMs(attempt, baseMs, maxMs, true);
        } else {
          delayMs = computeBackoffMs(attempt, baseMs, maxMs, true);
        }

        await new Promise<void>((r) => setTimeout(r, delayMs));
        attempt++;
      }
    }
    throw lastErr;
  }

  async getPosition(ticker: string): Promise<Position> {
    return this.accountClient.getPosition(ticker);
  }
}
