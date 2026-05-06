/**
 * SyntheticsView.tsx — popup tab
 * Polls /synthetics/list every 5s, renders active synthetics table, cancel action.
 */

import { useState, useEffect } from 'react';

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

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  serverUrl?: string;
  fetchFn?: typeof fetch;
  pollIntervalMs?: number;
}

export function SyntheticsView({
  serverUrl: _url = ENGINE_BASE,
  fetchFn = fetch,
  pollIntervalMs = POLL_INTERVAL_MS,
}: Props) {
  const [rows, setRows]           = useState<SyntheticRow[] | null>(null);
  const [daemonDown, setDaemonDown] = useState(false);
  const [canceling, setCanceling]   = useState<Set<string>>(new Set());

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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (rows === null) {
    return (
      <div style={{ padding: '12px', fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#6b7280' }}>
        Loading…
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div style={{ padding: '12px', fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#6b7280' }}>
        No synthetics armed.
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
    <div style={{ padding: '8px', fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
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
  );
}
