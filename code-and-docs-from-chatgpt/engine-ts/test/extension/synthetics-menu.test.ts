/**
 * synthetics-menu.test.ts
 * Tests for content/synthetics-menu.ts: context menu, modal, and fetch logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildMenu,
  buildModalFields,
  submitSynthetic,
  MENU_ITEMS,
  removeActiveMenu,
  removeActiveModal,
  type SyntheticKind,
} from '../../../extension/content/synthetics-menu';

// ── Minimal DOM mock (not jsdom — pure object mocks to match existing pattern) ──

function makeElement(tag: string) {
  const style: Record<string, string> = {};
  const attrs: Record<string, string> = {};
  const children: ReturnType<typeof makeElement>[] = [];
  const listeners: Record<string, ((e: Event) => void)[]> = {};

  const el: any = {
    tagName: tag.toUpperCase(),
    style,
    id: '',
    textContent: '',
    disabled: false,
    type: '',
    placeholder: '',
    value: '',
    children,
    getAttribute: (k: string) => attrs[k] ?? null,
    setAttribute: (k: string, v: string) => { attrs[k] = v; },
    hasAttribute: (k: string) => k in attrs,
    removeAttribute: (k: string) => { delete attrs[k]; },
    appendChild: (child: any) => { children.push(child); return child; },
    remove: () => {},
    contains: (_: any) => false,
    addEventListener: (ev: string, fn: (e: Event) => void) => {
      listeners[ev] ??= [];
      listeners[ev].push(fn);
    },
    dispatchEvent: (ev: Event) => {
      (listeners[ev.type] ?? []).forEach((fn) => fn(ev));
    },
    _listeners: listeners,
    _attrs: attrs,
  };
  return el;
}

function makeDoc() {
  const body = makeElement('body');
  const created: ReturnType<typeof makeElement>[] = [];

  const doc: any = {
    body,
    createElement: (tag: string) => {
      const el = makeElement(tag);
      created.push(el);
      return el;
    },
    querySelector: (_: string) => null,
    querySelectorAll: (_: string) => [],
    addEventListener: (_ev: string, _fn: (e: Event) => void) => {},
    removeEventListener: (_ev: string, _fn: (e: Event) => void) => {},
    _created: created,
  };
  return doc;
}

// ── buildMenu ─────────────────────────────────────────────────────────────────

describe('buildMenu', () => {
  it('creates a div with 4 child menu items', () => {
    const doc = makeDoc();
    const row = makeElement('div');
    const menu = buildMenu(MENU_ITEMS, 100, 200, row, doc as Document);
    expect(menu.tagName).toBe('DIV');
    expect(menu.id).toBe('kea-synthetics-menu');
    expect(menu.children.length).toBe(4);
  });

  it('menu items have correct data-kea-kind attributes', () => {
    const doc = makeDoc();
    const row = makeElement('div');
    const menu = buildMenu(MENU_ITEMS, 0, 0, row, doc as Document);
    const kinds = menu.children.map((c: any) => c._attrs['data-kea-kind']);
    expect(kinds).toEqual(['trailing_stop', 'stop_loss', 'take_profit', 'bracket']);
  });

  it('menu items have correct labels', () => {
    const doc = makeDoc();
    const row = makeElement('div');
    const menu = buildMenu(MENU_ITEMS, 0, 0, row, doc as Document);
    const labels = menu.children.map((c: any) => c.textContent);
    expect(labels).toContain('Place stop-loss');
    expect(labels).toContain('Place trailing stop');
    expect(labels).toContain('Place take-profit');
    expect(labels).toContain('Place bracket');
  });

  it('positions menu at given x/y', () => {
    const doc = makeDoc();
    const row = makeElement('div');
    const menu = buildMenu(MENU_ITEMS, 55, 77, row, doc as Document);
    expect(menu.style['top']).toBe('77px');
    expect(menu.style['left']).toBe('55px');
  });
});

// ── buildModalFields ──────────────────────────────────────────────────────────

describe('buildModalFields', () => {
  const kinds: SyntheticKind[] = ['stop_loss', 'take_profit', 'trailing_stop', 'bracket'];

  kinds.forEach((kind) => {
    it(`${kind}: getPayload returns correct kind`, () => {
      const doc = makeDoc();
      const { getPayload } = buildModalFields(kind, doc as Document, '100');
      const payload = getPayload('KX-TEST', 'yes');
      expect(payload['kind']).toBe(kind);
      expect(payload['ticker']).toBe('KX-TEST');
      expect(payload['side']).toBe('yes');
    });
  });

  it('stop_loss payload includes triggerPriceCents', () => {
    const doc = makeDoc();
    const { container, getPayload } = buildModalFields('stop_loss', doc as Document, '50');
    // Find the trigger input (first created number input)
    const inputs = doc._created.filter((el: any) => el.type === 'number');
    inputs[0].value = '35';
    inputs[1].value = '50';
    const payload = getPayload('KX-A', 'no');
    expect((payload['params'] as any).triggerPriceCents).toBe(35);
    expect(payload['positionSize']).toBe(50);
    expect(container).toBeDefined();
  });

  it('trailing_stop payload includes trailAmountCents', () => {
    const doc = makeDoc();
    const { getPayload } = buildModalFields('trailing_stop', doc as Document, '20');
    const inputs = doc._created.filter((el: any) => el.type === 'number');
    inputs[0].value = '8';
    inputs[1].value = '20';
    const payload = getPayload('KX-B', 'yes');
    expect((payload['params'] as any).trailAmountCents).toBe(8);
  });

  it('bracket payload includes stopPriceCents and profitPriceCents', () => {
    const doc = makeDoc();
    const { getPayload } = buildModalFields('bracket', doc as Document, '10');
    const inputs = doc._created.filter((el: any) => el.type === 'number');
    inputs[0].value = '25';
    inputs[1].value = '75';
    inputs[2].value = '10';
    const payload = getPayload('KX-C', 'yes');
    expect((payload['params'] as any).stopPriceCents).toBe(25);
    expect((payload['params'] as any).profitPriceCents).toBe(75);
  });
});

// ── submitSynthetic ───────────────────────────────────────────────────────────

describe('submitSynthetic', () => {
  it('success → returns ok:true with id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: () => Promise.resolve({ id: 'syn-abc123' }),
    });
    const result = await submitSynthetic(
      { kind: 'stop_loss', ticker: 'KX-X', side: 'yes', positionSize: 10, params: { triggerPriceCents: 30 } },
      mockFetch as unknown as typeof fetch,
    );
    expect(result.ok).toBe(true);
    expect(result.id).toBe('syn-abc123');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7777/synthetics/register',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('submits correct JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: () => Promise.resolve({ id: 'syn-1' }),
    });
    const payload = { kind: 'stop_loss', ticker: 'KX-T', side: 'yes', positionSize: 5, params: { triggerPriceCents: 40 } };
    await submitSynthetic(payload, mockFetch as unknown as typeof fetch);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual(payload);
  });

  it('HTTP error → returns ok:false with error message', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok:         false,
      statusText: 'Bad Request',
      json:       () => Promise.resolve({ error: 'invalid params' }),
    });
    const result = await submitSynthetic({ kind: 'stop_loss' }, mockFetch as unknown as typeof fetch);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('invalid params');
  });

  it('network error → returns ok:false with error message', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('connection refused'));
    const result = await submitSynthetic({ kind: 'stop_loss' }, mockFetch as unknown as typeof fetch);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('connection refused');
  });
});

// ── removeActiveMenu / removeActiveModal ──────────────────────────────────────

describe('removeActiveMenu and removeActiveModal', () => {
  it('removeActiveMenu does not throw when nothing active', () => {
    expect(() => removeActiveMenu()).not.toThrow();
  });

  it('removeActiveModal does not throw when nothing active', () => {
    expect(() => removeActiveModal()).not.toThrow();
  });
});
