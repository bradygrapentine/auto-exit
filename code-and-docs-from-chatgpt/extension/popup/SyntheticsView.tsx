/**
 * SyntheticsView.tsx — popup tab
 * Polls /synthetics/list every 5s, renders active synthetics table, cancel action.
 */

import { useState, useEffect } from 'react';
import { getActiveTabTicker } from './getActiveTabTicker.js';

const ENGINE_BASE = 'http://localhost:7777';
const POLL_INTERVAL_MS = 5_000;

// ── Types ────────────────────────────────────────────────────────────────────

export type SyntheticStatus = 'armed' | 'fired' | 'canceled' | 'fire_failed';

export interface SyntheticRow {
  id: string;
  kind: string;
  ticker: string;
  side: 'yes' | 'no';
  status: SyntheticStatus;
  positionSize: number;
  params: Record<string, unknown>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function paramsSummary(params: Record<string, unknown>): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

export function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function fetchSynthetics(
  fetchFn: typeof fetch = fetch,
): Promise<{ data: SyntheticRow[] | null; error: string | null }> {
  try {
    const res = await fetchFn(`${ENGINE_BASE}/synthetics/list`);
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    const json = await res.json() as { synthetics?: SyntheticRow[] } | SyntheticRow[];
    const rows = Array.isArray(json) ? json : (json as { synthetics?: SyntheticRow[] }).synthetics ?? [];
    return { data: rows, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function cancelSynthetic(
  id: string,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const res = await fetchFn(`${ENGINE_BASE}/synthetics/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export interface RegisterPayload {
  kind: 'stop_loss' | 'take_profit' | 'trailing_stop';
  ticker: string;
  side: 'yes' | 'no';
  positionSize: number;
  params: Record<string, number>;
}

export async function registerSynthetic(
  payload: RegisterPayload,
  fetchFn: typeof fetch = fetch,
): Promise<{ id: string | null; error: string | null }> {
  try {
    const res = await fetchFn(`${ENGINE_BASE}/synthetics/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      return { id: null, error: body.error ?? `HTTP ${res.status}` };
    }
    const json = await res.json() as { id?: string };
    return { id: json.id ?? null, error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  serverUrl?: string;
  fetchFn?: typeof fetch;
  pollIntervalMs?: number;
  /** Override active-tab ticker resolution (test seam). Returns null when no Kalshi tab. */
  activeTabTickerFn?: () => Promise<string | null>;
}

type CreateKind = 'stop_loss' | 'take_profit' | 'trailing_stop';

interface CreateFormState {
  kind: CreateKind;
  ticker: string;
  side: 'yes' | 'no';
  positionSize: string;
  /** Used for stop_loss / take_profit. */
  triggerPriceCents: string;
  /** Used for trailing_stop. */
  trailCents: string;
}

const INITIAL_FORM: CreateFormState = {
  kind: 'stop_loss',
  ticker: '',
  side: 'yes',
  positionSize: '',
  triggerPriceCents: '',
  trailCents: '',
};

export function SyntheticsView({
  serverUrl: _url = ENGINE_BASE,
  fetchFn = fetch,
  pollIntervalMs = POLL_INTERVAL_MS,
  activeTabTickerFn = getActiveTabTicker,
}: Props) {
  const [rows, setRows]           = useState<SyntheticRow[] | null>(null);
  const [daemonDown, setDaemonDown] = useState(false);
  const [canceling, setCanceling]   = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState<CreateFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detectedTicker, setDetectedTicker] = useState<string | null>(null);

  // Resolve active-tab ticker when the create form first opens, so the ticker
  // input auto-prefills with the market the user is looking at.
  useEffect(() => {
    if (!showCreate) return;
    let alive = true;
    activeTabTickerFn().then((t) => {
      if (!alive) return;
      setDetectedTicker(t);
      setForm((f) => (f.ticker === '' && t ? { ...f, ticker: t } : f));
    });
    return () => { alive = false; };
  }, [showCreate, activeTabTickerFn]);

  async function handleCreate(): Promise<void> {
    const positionSize = parseInt(form.positionSize, 10);
    if (!form.ticker || !Number.isFinite(positionSize) || positionSize <= 0) {
      setSubmitError('Ticker and position size are required.');
      return;
    }
    let params: Record<string, number>;
    if (form.kind === 'trailing_stop') {
      const trail = parseInt(form.trailCents, 10);
      if (!Number.isFinite(trail) || trail <= 0) {
        setSubmitError('Trail distance (¢) must be a positive integer.');
        return;
      }
      params = { trailCents: trail };
    } else {
      const trig = parseInt(form.triggerPriceCents, 10);
      if (!Number.isFinite(trig) || trig <= 0 || trig >= 100) {
        setSubmitError('Trigger price (¢) must be between 1 and 99.');
        return;
      }
      params = { triggerPriceCents: trig };
    }
    setSubmitting(true);
    setSubmitError(null);
    const { id, error } = await registerSynthetic(
      { kind: form.kind, ticker: form.ticker, side: form.side, positionSize, params },
      fetchFn,
    );
    setSubmitting(false);
    if (error || !id) {
      setSubmitError(error ?? 'Register failed');
      return;
    }
    // Reset on success and close the form so the new row appears in the next poll.
    setForm(INITIAL_FORM);
    setShowCreate(false);
  }

  useEffect(() => {
    let alive = true;

    async function poll() {
      const { data, error } = await fetchSynthetics(fetchFn);
      if (!alive) return;
      if (error !== null) {
        setDaemonDown(true);
        setRows(null);
      } else {
        setDaemonDown(false);
        setRows(data);
      }
    }

    poll();
    const id = setInterval(poll, pollIntervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [fetchFn, pollIntervalMs]);

  async function handleCancel(id: string) {
    setCanceling((s) => new Set(s).add(id));
    await cancelSynthetic(id, fetchFn);
    // Refresh immediately after cancel
    const { data, error } = await fetchSynthetics(fetchFn);
    if (error === null) setRows(data);
    setCanceling((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  // ── Daemon down ────────────────────────────────────────────────────────────
  if (daemonDown) {
    return (
      <div style={{ padding: '12px', fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
        <div style={{ color: '#dc2626', marginBottom: 4 }}>Watcher daemon not running.</div>
        <div style={{ color: '#6b7280' }}>
          Run <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>kea watch start</code>
        </div>
      </div>
    );
  }

  // ── Create form (shared across loading/empty/table) ───────────────────────
  const createBar = (
    <div style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
      {!showCreate ? (
        <button
          data-kea-new-trigger
          onClick={() => setShowCreate(true)}
          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #1d4ed8', background: '#fff', color: '#1d4ed8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
        >
          + New trigger
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>New trigger</strong>
            <button onClick={() => { setShowCreate(false); setSubmitError(null); }} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>✕</button>
          </div>
          <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ width: 70, color: '#6b7280' }}>Kind</span>
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as CreateKind })}
              style={{ flex: 1 }}
            >
              <option value="stop_loss">stop_loss</option>
              <option value="take_profit">take_profit</option>
              <option value="trailing_stop">trailing_stop</option>
            </select>
          </label>
          <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ width: 70, color: '#6b7280' }}>Ticker</span>
            <input
              data-kea-new-ticker
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              placeholder={detectedTicker ?? 'KX...'}
              style={{ flex: 1 }}
            />
            {detectedTicker && form.ticker !== detectedTicker && (
              <button
                onClick={() => setForm({ ...form, ticker: detectedTicker })}
                style={{ padding: '0 6px', fontSize: 11, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', borderRadius: 3 }}
                title={`Use detected ticker ${detectedTicker}`}
              >
                use detected
              </button>
            )}
          </label>
          <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ width: 70, color: '#6b7280' }}>Side</span>
            <select
              value={form.side}
              onChange={(e) => setForm({ ...form, side: e.target.value as 'yes' | 'no' })}
              style={{ flex: 1 }}
            >
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
          <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ width: 70, color: '#6b7280' }}>Size</span>
            <input
              type="number"
              value={form.positionSize}
              onChange={(e) => setForm({ ...form, positionSize: e.target.value })}
              placeholder="contracts"
              style={{ flex: 1 }}
            />
          </label>
          {form.kind === 'trailing_stop' ? (
            <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ width: 70, color: '#6b7280' }}>Trail (¢)</span>
              <input
                type="number"
                value={form.trailCents}
                onChange={(e) => setForm({ ...form, trailCents: e.target.value })}
                placeholder="5"
                style={{ flex: 1 }}
              />
            </label>
          ) : (
            <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ width: 70, color: '#6b7280' }}>Trigger (¢)</span>
              <input
                type="number"
                value={form.triggerPriceCents}
                onChange={(e) => setForm({ ...form, triggerPriceCents: e.target.value })}
                placeholder="30"
                style={{ flex: 1 }}
              />
            </label>
          )}
          {submitError && <div style={{ color: '#dc2626', fontSize: 11 }}>{submitError}</div>}
          <button
            data-kea-submit-trigger
            disabled={submitting}
            onClick={handleCreate}
            style={{ padding: '4px 10px', borderRadius: 4, border: 0, background: submitting ? '#93c5fd' : '#1d4ed8', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            {submitting ? 'Registering…' : 'Register'}
          </button>
        </div>
      )}
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (rows === null) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
        {createBar}
        <div style={{ padding: '12px', color: '#6b7280' }}>Loading…</div>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
        {createBar}
        <div style={{ padding: '12px', color: '#6b7280' }}>No synthetics armed.</div>
      </div>
    );
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  const statusColor: Record<string, string> = {
    armed:       '#1d4ed8',
    fired:       '#16a34a',
    canceled:    '#6b7280',
    fire_failed: '#dc2626',
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
      {createBar}
      <div style={{ padding: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
            <th style={{ textAlign: 'left', padding: '4px 6px' }}>ID</th>
            <th style={{ textAlign: 'left', padding: '4px 6px' }}>Kind</th>
            <th style={{ textAlign: 'left', padding: '4px 6px' }}>Ticker</th>
            <th style={{ textAlign: 'left', padding: '4px 6px' }}>Side</th>
            <th style={{ textAlign: 'left', padding: '4px 6px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '4px 6px' }}>Params</th>
            <th style={{ padding: '4px 6px' }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '4px 6px', fontFamily: 'monospace' }}>{truncateId(row.id)}</td>
              <td style={{ padding: '4px 6px' }}>{row.kind}</td>
              <td style={{ padding: '4px 6px' }}>{row.ticker}</td>
              <td style={{ padding: '4px 6px' }}>{row.side}</td>
              <td style={{ padding: '4px 6px', color: statusColor[row.status] ?? '#111827', fontWeight: 600 }}>
                {row.status}
              </td>
              <td style={{ padding: '4px 6px', color: '#374151', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {paramsSummary(row.params)}
              </td>
              <td style={{ padding: '4px 6px' }}>
                {row.status === 'armed' && (
                  <button
                    data-kea-cancel={row.id}
                    disabled={canceling.has(row.id)}
                    onClick={() => handleCancel(row.id)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 3,
                      border: '1px solid #d1d5db',
                      background: canceling.has(row.id) ? '#f3f4f6' : '#fff',
                      cursor: canceling.has(row.id) ? 'not-allowed' : 'pointer',
                      fontSize: 11,
                      color: '#374151',
                    }}
                  >
                    {canceling.has(row.id) ? '…' : 'Cancel'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
