/**
 * ProfileSelector.tsx — SP1.7
 * Header-slot component: fetches /whoami, renders profile dropdown + demo/prod badge.
 *
 * POST /whoami returns 501 until a real profile system exists; that case renders
 * a disabled dropdown (graceful fallback).
 */

import { useState, useEffect } from 'react';

const ENGINE_BASE = 'http://localhost:7777';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WhoAmIResponse {
  active: string;
  available: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function fetchWhoAmI(
  fetchFn: typeof fetch = fetch,
  serverUrl = ENGINE_BASE,
): Promise<{ data: WhoAmIResponse | null; error: string | null }> {
  try {
    const res = await fetchFn(`${serverUrl}/whoami`);
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    const data = await res.json() as WhoAmIResponse;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function switchProfile(
  profile: string,
  fetchFn: typeof fetch = fetch,
  serverUrl = ENGINE_BASE,
): Promise<{ data: WhoAmIResponse | null; error: string | null; notImplemented?: boolean }> {
  try {
    const res = await fetchFn(`${serverUrl}/whoami`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });
    if (res.status === 501) return { data: null, error: null, notImplemented: true };
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    const data = await res.json() as WhoAmIResponse;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Returns 'prod' badge color (red) when active profile name includes 'prod'. */
export function resolveBadgeStyle(active: string): React.CSSProperties {
  const isProd = active.toLowerCase().includes('prod');
  return {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    background: isProd ? '#dc2626' : '#16a34a',
    marginLeft: 6,
    verticalAlign: 'middle',
  };
}

export function resolveBadgeLabel(active: string): string {
  return active.toLowerCase().includes('prod') ? 'prod' : 'demo';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  serverUrl?: string;
  fetchFn?: typeof fetch;
}

export function ProfileSelector({
  serverUrl = ENGINE_BASE,
  fetchFn = fetch,
}: Props) {
  const [whoami, setWhoami]     = useState<WhoAmIResponse | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchWhoAmI(fetchFn, serverUrl).then(({ data, error }) => {
      setWhoami(data);
      setError(error);
    });
  }, [fetchFn, serverUrl]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const profile = e.target.value;
    if (!profile || profile === whoami?.active) return;
    setSwitching(true);
    const { data, error: switchErr, notImplemented } = await switchProfile(profile, fetchFn, serverUrl);
    setSwitching(false);
    if (notImplemented) {
      // server stub: refresh to confirm active unchanged
      const refresh = await fetchWhoAmI(fetchFn, serverUrl);
      if (refresh.data) setWhoami(refresh.data);
    } else if (data) {
      setWhoami(data);
      setError(null);
    } else if (switchErr) {
      setError(switchErr);
    }
  }

  // Graceful fallback: 404 / 501 / network error → inert "no profile" state
  if (error || !whoami) {
    return (
      <div
        data-testid="profile-selector"
        style={{
          padding: '4px 8px',
          borderBottom: '1px solid #e5e7eb',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span data-testid="profile-badge-fallback">no profile</span>
      </div>
    );
  }

  return (
    <div
      data-testid="profile-selector"
      style={{
        padding: '4px 8px',
        borderBottom: '1px solid #e5e7eb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <label htmlFor="profile-dropdown" style={{ color: '#6b7280' }}>Profile:</label>
      <select
        id="profile-dropdown"
        data-testid="profile-dropdown"
        value={whoami.active}
        onChange={handleChange}
        disabled={switching || whoami.available.length <= 1}
        style={{ fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3, padding: '1px 4px' }}
      >
        {whoami.available.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <span data-testid="profile-badge" style={resolveBadgeStyle(whoami.active)}>
        {resolveBadgeLabel(whoami.active)}
      </span>
    </div>
  );
}
