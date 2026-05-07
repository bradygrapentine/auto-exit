/**
 * ReportsView.tsx — SP4.3 reports panel.
 *
 * Two cards:
 *   1. Last-job TCA card  — pulls most recent jobId with tca entries via
 *      GET /journal/list, then GET /journal/read?jobId=<id>.
 *      Renders chunks table + avg slippage. Empty state when no jobs.
 *   2. Portfolio plan card — POST /portfolio/plan with known positions.
 *      Renders ranked liquidation list. Empty state when no positions.
 *
 * Pattern: logic helpers are exported (injectable fetch) so tests can exercise
 * them without jsdom — matching the extension test convention.
 */

import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TcaChunk {
  chunkIndex: number;
  ticker: string;
  side: string;
  arrivalMidCents: number;
  executedPriceCents: number;
  slippageCents: number;
  chunkSize: number;
}

export interface TcaSummary {
  jobId: string;
  ticker: string;
  side: string;
  chunks: TcaChunk[];
  avgSlippageCents: number;
}

export interface PortfolioPlanEntry {
  rank: number;
  ticker: string;
  side: 'yes' | 'no';
  size: number;
  markToBidDollars: number;
  evHoldDollars: number;
  overvaluedDollars: number;
  recommendedStrategy: 'aggressive' | 'passive';
}

export interface PortfolioPlan {
  ranked: PortfolioPlanEntry[];
  totalRaiseableDollars: number;
}

interface JournalEntry {
  kind: string;
  ts: string;
  data: unknown;
}

interface JournalListItem {
  jobId: string;
  entries: number;
  finished: boolean;
}

// ── Fetch helpers (exported for testability) ──────────────────────────────────

const DEFAULT_SERVER = 'http://localhost:7070';

/**
 * Fetch list of recent jobs from /journal/list.
 * Returns null if the endpoint doesn't exist or on network error.
 */
export async function fetchJournalList(
  fetchFn: typeof fetch = fetch,
  serverUrl: string = DEFAULT_SERVER,
): Promise<{ data: JournalListItem[] | null; error: string | null }> {
  try {
    const res = await fetchFn(`${serverUrl}/journal/list`);
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    const body = await res.json() as { ok: boolean; jobs?: JournalListItem[]; error?: string };
    if (!body.ok) return { data: null, error: body.error ?? 'unknown error' };
    return { data: body.jobs ?? [], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Fetch full journal entries for a jobId from /journal/read.
 * Returns null on error.
 */
export async function fetchJournalRead(
  jobId: string,
  fetchFn: typeof fetch = fetch,
  serverUrl: string = DEFAULT_SERVER,
): Promise<{ data: JournalEntry[] | null; error: string | null }> {
  try {
    const res = await fetchFn(`${serverUrl}/journal/read?jobId=${encodeURIComponent(jobId)}`);
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    const body = await res.json() as { ok: boolean; entries?: JournalEntry[]; error?: string };
    if (!body.ok) return { data: null, error: body.error ?? 'unknown error' };
    return { data: body.entries ?? [], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * From raw journal entries, extract TCA chunks and compute avg slippage.
 * Returns null if no tca entries found.
 */
export function buildTcaSummary(jobId: string, entries: JournalEntry[]): TcaSummary | null {
  const chunks = entries
    .filter((e) => e.kind === 'tca')
    .map((e) => e.data as TcaChunk);
  if (chunks.length === 0) return null;
  const avgSlippageCents = chunks.reduce((s, c) => s + c.slippageCents, 0) / chunks.length;
  const first = chunks[0];
  return {
    jobId,
    ticker: first?.ticker ?? 'unknown',
    side: first?.side ?? 'unknown',
    chunks,
    avgSlippageCents,
  };
}

/**
 * POST /portfolio/plan with given positions + mock market data.
 */
export async function fetchPortfolioPlan(
  positions: Array<{ ticker: string; side: 'yes' | 'no'; size: number }>,
  fetchFn: typeof fetch = fetch,
  serverUrl: string = DEFAULT_SERVER,
): Promise<{ data: PortfolioPlan | null; error: string | null }> {
  if (positions.length === 0) return { data: null, error: null };
  // v1: mock bidByTicker and midProbabilities (50¢ / 0.5) so the plan renders
  const bidByTicker: Record<string, number> = {};
  const midProbabilities: Record<string, number> = {};
  for (const p of positions) {
    bidByTicker[p.ticker] = 50;
    midProbabilities[p.ticker] = 0.5;
  }
  try {
    const res = await fetchFn(`${serverUrl}/portfolio/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions, bidByTicker, midProbabilities }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      return { data: null, error: body.error ?? `HTTP ${res.status}` };
    }
    const body = await res.json() as { ok: boolean; plan?: PortfolioPlan; error?: string };
    if (!body.ok) return { data: null, error: body.error ?? 'unknown error' };
    return { data: body.plan ?? null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Format cents as a signed dollar string, e.g. +$0.03 or -$0.01 */
export function formatSlippage(cents: number): string {
  const sign = cents >= 0 ? '+' : '-';
  const abs = Math.abs(cents) / 100;
  return `${sign}$${abs.toFixed(2)}`;
}

// ── Sub-components (logic only, no render deps beyond React) ──────────────────

function card(children: React.ReactNode, testId: string): React.ReactNode {
  return (
    <div
      data-testid={testId}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: '10px 12px',
        marginBottom: 10,
        background: '#fafafa',
      }}
    >
      {children}
    </div>
  );
}

function cardTitle(text: string): React.ReactNode {
  return (
    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: '#111827' }}>
      {text}
    </div>
  );
}

function emptyState(msg: string, testId: string): React.ReactNode {
  return (
    <div data-testid={testId} style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
      {msg}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ReportsViewProps {
  serverUrl?: string;
  /** Injectable fetch for testing */
  fetchFn?: typeof fetch;
}

export function ReportsView({ serverUrl = DEFAULT_SERVER, fetchFn = fetch }: ReportsViewProps) {
  const [tca, setTca] = useState<TcaSummary | null>(null);
  const [tcaLoading, setTcaLoading] = useState(true);
  const [tcaError, setTcaError] = useState<string | null>(null);

  const [plan, setPlan] = useState<PortfolioPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);

  // Load TCA: list jobs → find first with tca entries → read
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTcaLoading(true);
      const { data: jobs, error: listErr } = await fetchJournalList(fetchFn, serverUrl);
      if (cancelled) return;
      if (listErr || !jobs) {
        setTcaError(listErr);
        setTcaLoading(false);
        return;
      }
      // Try jobs newest-first until we find one with tca entries
      for (const job of jobs) {
        const { data: entries, error: readErr } = await fetchJournalRead(job.jobId, fetchFn, serverUrl);
        if (cancelled) return;
        if (readErr || !entries) continue;
        const summary = buildTcaSummary(job.jobId, entries);
        if (summary) {
          setTca(summary);
          setTcaLoading(false);
          return;
        }
      }
      setTcaLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchFn, serverUrl]);

  // Load portfolio plan with mock positions (v1 — no live position fetch)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPlanLoading(true);
      // v1: no positions source — show empty state
      const { data, error } = await fetchPortfolioPlan([], fetchFn, serverUrl);
      if (cancelled) return;
      setPlan(data);
      setPlanError(error);
      setPlanLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchFn, serverUrl]);

  return (
    <div data-testid="reports-view" style={{ padding: '8px 10px', fontSize: 12 }}>
      {/* TCA Card */}
      {card(
        <>
          {cardTitle('Last-Job TCA')}
          {tcaLoading ? (
            <div data-testid="tca-loading" style={{ fontSize: 11, color: '#6b7280' }}>Loading…</div>
          ) : tcaError ? (
            emptyState('No completed jobs yet.', 'tca-empty')
          ) : tca ? (
            <div data-testid="tca-content">
              <div style={{ marginBottom: 4, color: '#374151' }}>
                <span style={{ fontWeight: 500 }}>{tca.ticker}</span>
                {' '}
                <span style={{ textTransform: 'uppercase', fontSize: 10, color: '#6b7280' }}>{tca.side}</span>
                {' — '}
                {tca.chunks.length} chunk{tca.chunks.length !== 1 ? 's' : ''}
              </div>
              <table
                data-testid="tca-table"
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}
              >
                <thead>
                  <tr style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'right', paddingRight: 6 }}>#</th>
                    <th style={{ textAlign: 'right', paddingRight: 6 }}>Arrival</th>
                    <th style={{ textAlign: 'right', paddingRight: 6 }}>Exec</th>
                    <th style={{ textAlign: 'right', paddingRight: 6 }}>Slip</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {tca.chunks.map((c) => (
                    <tr key={c.chunkIndex} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ textAlign: 'right', paddingRight: 6 }}>{c.chunkIndex + 1}</td>
                      <td style={{ textAlign: 'right', paddingRight: 6 }}>${(c.arrivalMidCents / 100).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', paddingRight: 6 }}>${(c.executedPriceCents / 100).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', paddingRight: 6, color: c.slippageCents < 0 ? '#dc2626' : '#059669' }}>
                        {formatSlippage(c.slippageCents)}
                      </td>
                      <td style={{ textAlign: 'right' }}>{c.chunkSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                data-testid="tca-avg-slippage"
                style={{ marginTop: 6, fontWeight: 500, color: tca.avgSlippageCents < 0 ? '#dc2626' : '#059669' }}
              >
                Avg slippage: {formatSlippage(tca.avgSlippageCents)}
              </div>
            </div>
          ) : (
            emptyState('No completed jobs yet.', 'tca-empty')
          )}
        </>,
        'tca-card',
      )}

      {/* Portfolio Plan Card */}
      {card(
        <>
          {cardTitle('Portfolio Exit Plan')}
          {planLoading ? (
            <div data-testid="plan-loading" style={{ fontSize: 11, color: '#6b7280' }}>Loading…</div>
          ) : planError ? (
            emptyState('Could not load portfolio plan.', 'plan-error')
          ) : plan && plan.ranked.length > 0 ? (
            <div data-testid="plan-content">
              <div style={{ marginBottom: 4, color: '#374151', fontSize: 11 }}>
                Raiseable: <strong>${plan.totalRaiseableDollars.toFixed(2)}</strong>
              </div>
              <table
                data-testid="plan-table"
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}
              >
                <thead>
                  <tr style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'right', paddingRight: 6 }}>#</th>
                    <th style={{ textAlign: 'left', paddingRight: 6 }}>Ticker</th>
                    <th style={{ textAlign: 'left', paddingRight: 6 }}>Side</th>
                    <th style={{ textAlign: 'right', paddingRight: 6 }}>Qty</th>
                    <th style={{ textAlign: 'left' }}>Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.ranked.map((entry) => (
                    <tr key={entry.ticker} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ textAlign: 'right', paddingRight: 6 }}>{entry.rank}</td>
                      <td style={{ paddingRight: 6 }}>{entry.ticker}</td>
                      <td style={{ paddingRight: 6, textTransform: 'uppercase', fontSize: 10 }}>{entry.side}</td>
                      <td style={{ textAlign: 'right', paddingRight: 6 }}>{entry.size}</td>
                      <td style={{ color: '#6b7280' }}>{entry.recommendedStrategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            emptyState('No positions to plan.', 'plan-empty')
          )}
        </>,
        'plan-card',
      )}
    </div>
  );
}
