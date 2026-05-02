interface ProgressBarProps {
  filled: number;
  total: number;
  chunksPlaced: number;
  feesIncurred?: number;
  elapsedMs?: number;
}

export function computeProgress(filled: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((filled / total) * 100));
}

export function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function ProgressBar({ filled, total, chunksPlaced, feesIncurred, elapsedMs }: ProgressBarProps) {
  const pct = computeProgress(filled, total);
  return (
    <div>
      <div style={{ background: '#334155', borderRadius: 4, height: 8 }}>
        <div style={{ width: `${pct}%`, background: '#22c55e', borderRadius: 4, height: 8, transition: 'width 0.3s' }} />
      </div>
      <div>{filled} of {total} filled ({pct}%)</div>
      <div>Chunks: {chunksPlaced}</div>
      {feesIncurred !== undefined && <div>Fees: ${feesIncurred.toFixed(2)}</div>}
      {elapsedMs !== undefined && <div>Elapsed: {formatElapsed(elapsedMs)}</div>}
    </div>
  );
}
