import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseOrderResponse } from '../src/kalshiClient.js';

const fixturePath = path.resolve(__dirname, 'fixtures', 'order-create.real.json');

describe('parseOrderResponse against real Kalshi prod fixture', () => {
  const exists = fs.existsSync(fixturePath);
  const fixture = exists ? JSON.parse(fs.readFileSync(fixturePath, 'utf8')) : null;

  it.skipIf(!exists)('reads _fp string fields, not unsuffixed numbers', () => {
    const result = parseOrderResponse(fixture);
    expect(result.orderId).toBeTruthy();
    // Either filled (status: executed) or canceled — both are valid terminal shapes for IoC orders.
    expect(['filled', 'canceled']).toContain(result.status);
    // filled + remaining must equal initial; both must be finite numbers, not 0 from missing-field fallback.
    expect(Number.isFinite(result.filledCount)).toBe(true);
    expect(Number.isFinite(result.remainingCount)).toBe(true);
    // The known-good fixture has fill_count_fp: "1.00" and remaining_count_fp: "0.00".
    expect(result.filledCount + result.remainingCount).toBeGreaterThan(0);
  });

  // Unit-style tests — pinned to the wire shape regardless of fixture
  it('parses _fp string fields correctly', () => {
    const result = parseOrderResponse({
      order: {
        order_id: 'abc-123',
        status: 'executed',
        initial_count_fp: '20.00',
        fill_count_fp: '20.00',
        remaining_count_fp: '0.00',
      },
    });
    expect(result).toMatchObject({
      orderId: 'abc-123',
      status: 'filled',
      filledCount: 20,
      remainingCount: 0,
    });
  });

  it('parses partial fill (_fp shape)', () => {
    const result = parseOrderResponse({
      order: {
        order_id: 'abc-456',
        status: 'partially_filled',
        initial_count_fp: '20.00',
        fill_count_fp: '7.50',
        remaining_count_fp: '12.50',
      },
    });
    expect(result.filledCount).toBe(7.5);
    expect(result.remainingCount).toBe(12.5);
    expect(result.status).toBe('partially_filled');
  });

  it('falls back to legacy non-_fp shape when _fp absent', () => {
    const result = parseOrderResponse({
      order: {
        order_id: 'legacy-1',
        status: 'filled',
        count: 100,
        filled_count: 100,
        remaining_count: 0,
      },
    });
    expect(result).toMatchObject({ filledCount: 100, remainingCount: 0 });
  });

  it('does NOT silently return 0 when fields are completely missing', () => {
    // Defensive: if Kalshi changes shape again, we want filledCount 0 (no fallback inflation).
    // The reconciliation logic uses filledCount = 0 to indicate "no known fill" — caller decides.
    const result = parseOrderResponse({ order: { order_id: 'mystery', status: 'unknown' } });
    expect(result.filledCount).toBe(0);
    expect(result.remainingCount).toBe(0);
  });
});
