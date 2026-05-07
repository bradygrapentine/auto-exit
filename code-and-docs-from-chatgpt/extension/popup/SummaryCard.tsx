// SP1.5: Post-completion execution summary card.
// Renders once StrategyView fires onComplete; dismissable locally.

import { useState } from 'react';
import type { ExecutionSummary } from './StrategyView';
import { STRATEGY_REGISTRY } from '../../engine-ts/src/strategies/registry';

// ── Pure helpers (exported for testing) ──────────────────────────────────────

/** Format milliseconds as human-friendly string: "1m 23s" or "45s". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/** Compute fill rate as 0–100 integer percent. Returns 0 if initialPosition is 0. */
export function computeFillRate(filledTotal: number, initialPosition: number): number {
  if (initialPosition === 0) return 0;
  return Math.min(100, Math.round((filledTotal / initialPosition) * 100));
}

/** Build markdown summary string for clipboard. */
export function buildMarkdownSummary(summary: ExecutionSummary): string {
  const meta = STRATEGY_REGISTRY[summary.strategyId];
  const displayName = meta?.displayName ?? summary.strategyId;
  const fillRate = computeFillRate(summary.filledTotal, summary.initialPosition);
  return [
    `## Execution Summary`,
    ``,
    `- **Strategy:** ${displayName}`,
    `- **Job ID:** ${summary.jobId}`,
    `- **Filled:** ${summary.filledTotal} / ${summary.initialPosition} (${fillRate}%)`,
    `- **Orders attempted:** ${summary.ordersAttempted}`,
    `- **Duration:** ${formatDuration(summary.durationMs)}`,
  ].join('\n');
}

/** Get display name from registry, falling back to strategyId. */
export function getDisplayName(strategyId: string): string {
  const meta = STRATEGY_REGISTRY[strategyId as keyof typeof STRATEGY_REGISTRY];
  return meta?.displayName ?? strategyId;
}

// ── Component ────────────────────────────────────────────────────────────────

interface SummaryCardProps {
  summary: ExecutionSummary | null;
  /** Injected clipboard writer for testing. Defaults to navigator.clipboard.writeText. */
  clipboardWriteFn?: (text: string) => Promise<void>;
}

export function SummaryCard({ summary, clipboardWriteFn }: SummaryCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!summary || dismissed) return null;

  const displayName = getDisplayName(summary.strategyId);
  const fillRate = computeFillRate(summary.filledTotal, summary.initialPosition);
  const isPartialFill = summary.filledTotal < summary.initialPosition;

  const handleCopy = async () => {
    const text = buildMarkdownSummary(summary);
    const writer = clipboardWriteFn ?? ((t: string) => navigator.clipboard.writeText(t));
    await writer(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: 360,
    padding: '10px 12px',
    borderTop: '1px solid #e5e7eb',
    background: '#f9fafb',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const labelStyle: React.CSSProperties = { color: '#6b7280' };

  const valueStyle: React.CSSProperties = { fontWeight: 600, color: '#111827' };

  const negativeValueStyle: React.CSSProperties = {
    ...valueStyle,
    color: '#dc2626',
  };

  const buttonRow: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    marginTop: 4,
  };

  const btnBase: React.CSSProperties = {
    flex: 1,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 500,
  };

  return (
    <div data-testid="summary-card" style={cardStyle}>
      {/* Header row */}
      <div style={{ ...rowStyle }}>
        <span data-testid="summary-strategy-name" style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 13 }}>
          {displayName}
        </span>
        <span data-testid="summary-job-id" style={{ color: '#9ca3af', fontSize: 10 }}>
          {summary.jobId}
        </span>
      </div>

      {/* Fill row */}
      <div style={rowStyle}>
        <span style={labelStyle}>Filled</span>
        <span
          data-testid="summary-fill"
          style={isPartialFill ? negativeValueStyle : valueStyle}
        >
          {summary.filledTotal} / {summary.initialPosition} ({fillRate}%)
        </span>
      </div>

      {/* Orders attempted */}
      <div style={rowStyle}>
        <span style={labelStyle}>Orders attempted</span>
        <span data-testid="summary-orders-attempted" style={valueStyle}>
          {summary.ordersAttempted}
        </span>
      </div>

      {/* Duration */}
      <div style={rowStyle}>
        <span style={labelStyle}>Duration</span>
        <span data-testid="summary-duration" style={valueStyle}>
          {formatDuration(summary.durationMs)}
        </span>
      </div>

      {/* Action buttons */}
      <div style={buttonRow}>
        <button
          data-testid="summary-copy-btn"
          onClick={handleCopy}
          style={btnBase}
        >
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        <button
          data-testid="summary-dismiss-btn"
          onClick={() => setDismissed(true)}
          style={{ ...btnBase, color: '#6b7280' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
