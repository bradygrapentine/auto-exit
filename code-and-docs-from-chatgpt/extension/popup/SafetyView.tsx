/**
 * SafetyView.tsx — SP1.8
 * Safety tab: renders read-only safety config + forbidden ticker list with add/remove.
 *
 * Pattern: SyntheticsView.tsx (list + fetch helpers exported for tests),
 *          ConfirmModal.tsx (confirm before destructive action).
 */

import { useState, useEffect } from 'react';

const ENGINE_BASE = 'http://localhost:7777';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ForbiddenEntry {
  ticker: string;
  reason: string;
  addedAt: string;
  addedBy: string;
}

export interface SafetyConfig {
  version: number;
  safetySubmittedMultiple: number;
  floorPriceCents: number;
  tailSweepThreshold: number;
  forbiddenTickers: ForbiddenEntry[];
  maxLossPerTickerDollars?: number;
  dailyCircuitBreakerDollars?: number;
  concentrationLimitPct?: number;
}

// ── Helpers (exported for tests) ──────────────────────────────────────────────

export async function fetchSafety(
  fetchFn: typeof fetch = fetch,
  serverUrl = ENGINE_BASE,
): Promise<{ data: SafetyConfig | null; error: string | null }> {
  try {
    const res = await fetchFn(`${serverUrl}/safety`);
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    const envelope = await res.json() as { ok: boolean; safety: SafetyConfig };
    return { data: envelope.safety ?? null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function addForbidden(
  ticker: string,
  reason: string,
  fetchFn: typeof fetch = fetch,
  serverUrl = ENGINE_BASE,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const res = await fetchFn(`${serverUrl}/safety/forbidden/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, reason }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      return { ok: false, error: body.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function removeForbidden(
  ticker: string,
  fetchFn: typeof fetch = fetch,
  serverUrl = ENGINE_BASE,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const res = await fetchFn(`${serverUrl}/safety/forbidden/${encodeURIComponent(ticker)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      return { ok: false, error: body.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Format cents as $X.XX */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Format optional dollar value; undefined → '—' */
export function formatOptionalDollars(val: number | undefined): string {
  if (val == null) return '—';
  return `$${val.toFixed(2)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  serverUrl?: string;
  fetchFn?: typeof fetch;
}

export function SafetyView({
  serverUrl = ENGINE_BASE,
  fetchFn = fetch,
}: Props) {
  const [safety, setSafety]         = useState<SafetyConfig | null>(null);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [addTicker, setAddTicker]   = useState('');
  const [addReason, setAddReason]   = useState('');
  const [addError, setAddError]     = useState<string | null>(null);
  const [addBusy, setAddBusy]       = useState(false);
  const [confirmTicker, setConfirmTicker] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function load() {
    const { data, error } = await fetchSafety(fetchFn, serverUrl);
    setSafety(data);
    setLoadError(error);
  }

  useEffect(() => { load(); }, [fetchFn, serverUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    const t = addTicker.trim().toUpperCase();
    const r = addReason.trim();
    if (!t || !r) { setAddError('Ticker and reason are required.'); return; }
    setAddBusy(true);
    setAddError(null);
    const { ok, error } = await addForbidden(t, r, fetchFn, serverUrl);
    setAddBusy(false);
    if (!ok) { setAddError(error ?? 'Failed'); return; }
    setAddTicker('');
    setAddReason('');
    await load();
  }

  async function handleRemoveConfirmed() {
    if (!confirmTicker) return;
    const ticker = confirmTicker;
    setConfirmTicker(null);
    setRemoveError(null);
    const { ok, error } = await removeForbidden(ticker, fetchFn, serverUrl);
    if (!ok) { setRemoveError(`${ticker}: ${error ?? 'Failed'}`); return; }
    await load();
  }

  if (loadError) {
    return (
      <div data-testid="safety-view" style={{ padding: 12, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
        <div data-testid="safety-load-error" style={{ color: '#dc2626' }}>Failed to load safety config: {loadError}</div>
      </div>
    );
  }

  if (!safety) {
    return (
      <div data-testid="safety-view" style={{ padding: 12, fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#6b7280' }}>
        Loading…
      </div>
    );
  }

  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f3f4f6' };
  const labelStyle: React.CSSProperties = { color: '#6b7280' };
  const valueStyle: React.CSSProperties = { fontWeight: 500 };

  return (
    <div data-testid="safety-view" style={{ padding: 12, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      {/* Read-only safety config */}
      <div data-testid="safety-config-panel" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>Safety Config</div>
        <div style={rowStyle}><span style={labelStyle}>Safety multiple</span><span style={valueStyle}>{safety.safetySubmittedMultiple.toFixed(2)}×</span></div>
        <div style={rowStyle}><span style={labelStyle}>Floor price</span><span style={valueStyle}>{formatCents(safety.floorPriceCents)}</span></div>
        <div style={rowStyle}><span style={labelStyle}>Tail sweep threshold</span><span style={valueStyle}>{safety.tailSweepThreshold}</span></div>
        <div style={rowStyle}><span style={labelStyle}>Max loss/ticker</span><span style={valueStyle}>{formatOptionalDollars(safety.maxLossPerTickerDollars)}</span></div>
        <div style={rowStyle}><span style={labelStyle}>Daily circuit breaker</span><span style={valueStyle}>{formatOptionalDollars(safety.dailyCircuitBreakerDollars)}</span></div>
        <div style={rowStyle}><span style={labelStyle}>Concentration limit</span><span style={valueStyle}>{safety.concentrationLimitPct != null ? `${safety.concentrationLimitPct}%` : '—'}</span></div>
      </div>

      {/* Forbidden tickers list */}
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>Forbidden Tickers</div>
      {safety.forbiddenTickers.length === 0 ? (
        <div data-testid="forbidden-empty" style={{ color: '#9ca3af', marginBottom: 10 }}>No forbidden tickers.</div>
      ) : (
        <div data-testid="forbidden-list" style={{ marginBottom: 10 }}>
          {safety.forbiddenTickers.map((entry) => (
            <div
              key={entry.ticker}
              data-testid={`forbidden-row-${entry.ticker}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{entry.ticker}</span>
                <span style={{ color: '#6b7280', marginLeft: 6 }}>{entry.reason}</span>
              </div>
              <button
                data-testid={`remove-btn-${entry.ticker}`}
                onClick={() => setConfirmTicker(entry.ticker)}
                style={{ fontSize: 11, padding: '1px 6px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 3, cursor: 'pointer', color: '#b91c1c' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {removeError && (
        <div data-testid="remove-error" style={{ color: '#dc2626', marginBottom: 6, fontSize: 12 }}>{removeError}</div>
      )}

      {/* Confirm remove modal */}
      {confirmTicker && (
        <div
          data-testid="remove-confirm-modal"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 4, padding: 10, marginBottom: 10 }}
        >
          <div style={{ marginBottom: 8 }}>Remove <strong>{confirmTicker}</strong> from forbidden list?</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              data-testid="confirm-remove-yes"
              onClick={handleRemoveConfirmed}
              style={{ padding: '3px 10px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 12 }}
            >
              Remove
            </button>
            <button
              data-testid="confirm-remove-cancel"
              onClick={() => setConfirmTicker(null)}
              style={{ padding: '3px 10px', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 3, cursor: 'pointer', fontSize: 12 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add forbidden ticker form */}
      <div data-testid="add-forbidden-form" style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>Add Forbidden Ticker</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            data-testid="add-ticker-input"
            type="text"
            placeholder="Ticker (e.g. KXABC)"
            value={addTicker}
            onChange={(e) => setAddTicker(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 3, padding: '3px 6px', fontSize: 12 }}
          />
          <input
            data-testid="add-reason-input"
            type="text"
            placeholder="Reason"
            value={addReason}
            onChange={(e) => setAddReason(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 3, padding: '3px 6px', fontSize: 12 }}
          />
          {addError && (
            <div data-testid="add-error" style={{ color: '#dc2626', fontSize: 11 }}>{addError}</div>
          )}
          <button
            data-testid="add-forbidden-btn"
            onClick={handleAdd}
            disabled={addBusy || !addTicker.trim() || !addReason.trim()}
            style={{
              padding: '4px 10px',
              background: addBusy ? '#9ca3af' : '#1d4ed8',
              color: '#fff',
              border: 'none',
              borderRadius: 3,
              cursor: addBusy ? 'not-allowed' : 'pointer',
              fontSize: 12,
              alignSelf: 'flex-start',
            }}
          >
            {addBusy ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
