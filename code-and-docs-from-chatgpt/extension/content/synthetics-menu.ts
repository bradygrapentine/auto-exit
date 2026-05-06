/**
 * synthetics-menu.ts — content script
 * Injects a right-click context menu on Kalshi position rows.
 * On click: opens an in-page modal; submits to http://localhost:7777/synthetics/register.
 */

import { detectPositionSizeFromDOM } from './position-detector';

// ── Types ────────────────────────────────────────────────────────────────────

export type SyntheticKind = 'trailing_stop' | 'stop_loss' | 'take_profit' | 'bracket';

interface MenuConfig {
  kind: SyntheticKind;
  label: string;
}

const MENU_ITEMS: MenuConfig[] = [
  { kind: 'trailing_stop', label: 'Place trailing stop' },
  { kind: 'stop_loss',     label: 'Place stop-loss' },
  { kind: 'take_profit',   label: 'Place take-profit' },
  { kind: 'bracket',       label: 'Place bracket' },
];

const ENGINE_BASE = 'http://localhost:7777';

// ── DOM helpers ──────────────────────────────────────────────────────────────

function getPositionRows(doc: Document = document): Element[] {
  // Kalshi renders position rows with data-position-size or .position-row
  const byAttr = Array.from(doc.querySelectorAll('[data-position-size]'));
  if (byAttr.length > 0) return byAttr;
  return Array.from(doc.querySelectorAll('.position-row, [data-testid="position-row"]'));
}

function getTickerFromRow(row: Element): string {
  const tickerEl =
    row.querySelector('[data-ticker]') ??
    row.querySelector('.market-ticker') ??
    row.querySelector('[data-testid="market-ticker"]');
  return tickerEl?.textContent?.trim() ?? '';
}

function getSideFromRow(row: Element): 'yes' | 'no' {
  const sideEl =
    row.querySelector('[data-side]') ??
    row.querySelector('.position-side');
  const text = sideEl?.textContent?.trim().toLowerCase() ?? '';
  return text === 'no' ? 'no' : 'yes';
}

// ── Context menu ─────────────────────────────────────────────────────────────

let activeMenu: HTMLElement | null = null;
let activeModal: HTMLElement | null = null;

export function removeActiveMenu(): void {
  activeMenu?.remove();
  activeMenu = null;
}

export function removeActiveModal(): void {
  activeModal?.remove();
  activeModal = null;
}

function buildMenu(
  items: MenuConfig[],
  x: number,
  y: number,
  row: Element,
  doc: Document = document,
): HTMLElement {
  const menu = doc.createElement('div');
  menu.id = 'kea-synthetics-menu';
  Object.assign(menu.style, {
    position:        'fixed',
    top:             `${y}px`,
    left:            `${x}px`,
    background:      '#fff',
    border:          '1px solid #d1d5db',
    borderRadius:    '6px',
    boxShadow:       '0 4px 16px rgba(0,0,0,0.15)',
    zIndex:          '2147483647',
    padding:         '4px 0',
    minWidth:        '180px',
    fontFamily:      'system-ui, sans-serif',
    fontSize:        '13px',
  });

  items.forEach(({ kind, label }) => {
    const item = doc.createElement('div');
    item.setAttribute('data-kea-kind', kind);
    item.textContent = label;
    Object.assign(item.style, {
      padding:  '7px 14px',
      cursor:   'pointer',
      color:    '#111827',
    });
    item.addEventListener('mouseover', () => { item.style.background = '#f3f4f6'; });
    item.addEventListener('mouseout',  () => { item.style.background = ''; });
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      removeActiveMenu();
      openModal(kind, row, doc);
    });
    menu.appendChild(item);
  });

  return menu;
}

// ── Modal ────────────────────────────────────────────────────────────────────

function fieldRow(
  doc: Document,
  labelText: string,
  input: HTMLInputElement,
): HTMLElement {
  const row = doc.createElement('div');
  Object.assign(row.style, { marginBottom: '10px' });
  const lbl = doc.createElement('label');
  Object.assign(lbl.style, { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '3px' });
  lbl.textContent = labelText;
  row.appendChild(lbl);
  row.appendChild(input);
  return row;
}

function makeInput(doc: Document, type: string, placeholder: string, value = ''): HTMLInputElement {
  const inp = doc.createElement('input');
  inp.type = type;
  inp.placeholder = placeholder;
  inp.value = value;
  Object.assign(inp.style, {
    width:        '100%',
    padding:      '5px 8px',
    border:       '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize:     '13px',
    boxSizing:    'border-box',
  });
  return inp;
}

export function buildModalFields(
  kind: SyntheticKind,
  doc: Document,
  defaultSize: string,
): { container: HTMLElement; getPayload: (ticker: string, side: 'yes' | 'no') => Record<string, unknown> } {
  const container = doc.createElement('div');
  let getPayload: (ticker: string, side: 'yes' | 'no') => Record<string, unknown>;

  if (kind === 'trailing_stop') {
    const trailInput  = makeInput(doc, 'number', 'e.g. 5', '');
    const sizeInput   = makeInput(doc, 'number', 'contracts', defaultSize);
    container.appendChild(fieldRow(doc, 'Trail amount (cents)', trailInput));
    container.appendChild(fieldRow(doc, 'Size (contracts)', sizeInput));
    getPayload = (ticker, side) => ({
      kind,
      ticker,
      side,
      positionSize: Number(sizeInput.value) || 0,
      params: { trailAmountCents: Number(trailInput.value) || 0 },
    });

  } else if (kind === 'stop_loss') {
    const triggerInput = makeInput(doc, 'number', 'e.g. 30', '');
    const sizeInput    = makeInput(doc, 'number', 'contracts', defaultSize);
    container.appendChild(fieldRow(doc, 'Trigger price (cents)', triggerInput));
    container.appendChild(fieldRow(doc, 'Size (contracts)', sizeInput));
    getPayload = (ticker, side) => ({
      kind,
      ticker,
      side,
      positionSize: Number(sizeInput.value) || 0,
      params: { triggerPriceCents: Number(triggerInput.value) || 0 },
    });

  } else if (kind === 'take_profit') {
    const triggerInput = makeInput(doc, 'number', 'e.g. 80', '');
    const sizeInput    = makeInput(doc, 'number', 'contracts', defaultSize);
    container.appendChild(fieldRow(doc, 'Trigger price (cents)', triggerInput));
    container.appendChild(fieldRow(doc, 'Size (contracts)', sizeInput));
    getPayload = (ticker, side) => ({
      kind,
      ticker,
      side,
      positionSize: Number(sizeInput.value) || 0,
      params: { triggerPriceCents: Number(triggerInput.value) || 0 },
    });

  } else {
    // bracket
    const stopInput   = makeInput(doc, 'number', 'e.g. 30', '');
    const profitInput = makeInput(doc, 'number', 'e.g. 80', '');
    const sizeInput   = makeInput(doc, 'number', 'contracts', defaultSize);
    container.appendChild(fieldRow(doc, 'Stop price (cents)', stopInput));
    container.appendChild(fieldRow(doc, 'Profit price (cents)', profitInput));
    container.appendChild(fieldRow(doc, 'Size (contracts)', sizeInput));
    getPayload = (ticker, side) => ({
      kind,
      ticker,
      side,
      positionSize: Number(sizeInput.value) || 0,
      params: {
        stopPriceCents:   Number(stopInput.value) || 0,
        profitPriceCents: Number(profitInput.value) || 0,
      },
    });
  }

  return { container, getPayload };
}

export async function submitSynthetic(
  payload: Record<string, unknown>,
  fetchFn: typeof fetch = fetch,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const res = await fetchFn(`${ENGINE_BASE}/synthetics/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const json = await res.json() as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: String(json['error'] ?? res.statusText) };
    return { ok: true, id: String(json['id'] ?? '') };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function openModal(kind: SyntheticKind, row: Element, doc: Document = document): void {
  removeActiveModal();

  const ticker = getTickerFromRow(row);
  const side   = getSideFromRow(row);
  const sizeResult = detectPositionSizeFromDOM(doc as Document);
  const defaultSize = sizeResult.kind === 'found' ? String(sizeResult.size) : '';

  const kindLabel: Record<SyntheticKind, string> = {
    trailing_stop: 'Trailing Stop',
    stop_loss:     'Stop-Loss',
    take_profit:   'Take-Profit',
    bracket:       'Bracket',
  };

  const overlay = doc.createElement('div');
  overlay.id = 'kea-modal-overlay';
  Object.assign(overlay.style, {
    position:        'fixed',
    inset:           '0',
    background:      'rgba(0,0,0,0.4)',
    zIndex:          '2147483646',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
  });

  const modal = doc.createElement('div');
  modal.id = 'kea-synthetic-modal';
  Object.assign(modal.style, {
    background:   '#fff',
    borderRadius: '8px',
    padding:      '20px',
    minWidth:     '300px',
    maxWidth:     '380px',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.2)',
    fontFamily:   'system-ui, sans-serif',
    fontSize:     '13px',
    color:        '#111827',
  });

  const title = doc.createElement('h3');
  title.textContent = `Place ${kindLabel[kind]}`;
  Object.assign(title.style, { margin: '0 0 14px', fontSize: '15px', color: '#1f2937' });
  modal.appendChild(title);

  const { container: fields, getPayload } = buildModalFields(kind, doc, defaultSize);
  modal.appendChild(fields);

  // Status message area
  const statusEl = doc.createElement('div');
  statusEl.id = 'kea-modal-status';
  Object.assign(statusEl.style, { marginBottom: '10px', fontSize: '12px', minHeight: '16px' });
  modal.appendChild(statusEl);

  // Buttons
  const btnRow = doc.createElement('div');
  Object.assign(btnRow.style, { display: 'flex', gap: '8px', justifyContent: 'flex-end' });

  const cancelBtn = doc.createElement('button');
  cancelBtn.id = 'kea-modal-cancel';
  cancelBtn.textContent = 'Cancel';
  Object.assign(cancelBtn.style, {
    padding: '6px 14px', borderRadius: '4px',
    border: '1px solid #d1d5db', background: '#f9fafb',
    cursor: 'pointer', fontSize: '13px',
  });
  cancelBtn.addEventListener('click', removeActiveModal);

  const submitBtn = doc.createElement('button');
  submitBtn.id = 'kea-modal-submit';
  submitBtn.textContent = 'Arm';
  Object.assign(submitBtn.style, {
    padding: '6px 14px', borderRadius: '4px',
    border: 'none', background: '#1d4ed8',
    color: '#fff', cursor: 'pointer', fontSize: '13px',
  });

  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    statusEl.textContent = 'Submitting…';
    statusEl.style.color = '#6b7280';

    const payload = getPayload(ticker, side);
    const result = await submitSynthetic(payload);

    if (result.ok) {
      statusEl.textContent = `Armed (id: ${result.id ?? '?'})`;
      statusEl.style.color = '#16a34a';
      submitBtn.style.display = 'none';
      cancelBtn.textContent = 'Close';
    } else {
      statusEl.textContent = `Error: ${result.error ?? 'unknown'}`;
      statusEl.style.color = '#dc2626';
      submitBtn.disabled = false;
    }
  });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(submitBtn);
  modal.appendChild(btnRow);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) removeActiveModal();
  });
  overlay.appendChild(modal);

  activeModal = overlay;
  doc.body.appendChild(overlay);
}

// ── Attach right-click handlers ──────────────────────────────────────────────

function attachMenuToRow(row: Element, doc: Document = document): void {
  row.addEventListener('contextmenu', (e: Event) => {
    const me = e as MouseEvent;
    me.preventDefault();
    removeActiveMenu();

    const menu = buildMenu(MENU_ITEMS, me.clientX, me.clientY, row, doc);
    activeMenu = menu;
    doc.body.appendChild(menu);

    // Close on outside click
    const outside = (ev: Event) => {
      if (!menu.contains(ev.target as Node)) {
        removeActiveMenu();
        doc.removeEventListener('click', outside);
      }
    };
    doc.addEventListener('click', outside);
  });
}

function observePositionRows(doc: Document = document): void {
  function attach(root: Document | Element = doc): void {
    getPositionRows(doc).forEach((row) => {
      if (!row.hasAttribute('data-kea-attached')) {
        row.setAttribute('data-kea-attached', '1');
        attachMenuToRow(row, doc);
      }
    });
  }

  attach();

  const observer = new MutationObserver(() => attach());
  observer.observe(doc.body, { childList: true, subtree: true });
}

// ── Entry point (runs in real content-script context) ────────────────────────
/* c8 ignore next 3 */
if (typeof window !== 'undefined' && typeof chrome !== 'undefined') {
  observePositionRows(document);
}

// Exported for tests
export { observePositionRows, attachMenuToRow, buildMenu, openModal, MENU_ITEMS };
