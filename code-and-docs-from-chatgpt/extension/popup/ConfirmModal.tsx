import { useState } from 'react';

export interface ConfirmModalProps {
  ticker: string;
  side: string;
  size: number;
  projectedGross?: number | null;
  projectedFee?: number | null;
  projectedNet?: number | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function isConfirmEnabled(typed: string, ticker: string): boolean {
  if (!typed.trim()) return false;
  return typed.trim().toLowerCase() === ticker.trim().toLowerCase();
}

export function ConfirmModal({
  ticker,
  side,
  size,
  projectedGross,
  projectedFee,
  projectedNet,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [typed, setTyped] = useState('');
  const enabled = isConfirmEnabled(typed, ticker);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 24,
          minWidth: 300,
          maxWidth: 400,
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        }}
      >
        <h3 style={{ margin: '0 0 12px', color: '#b91c1c' }}>Switch to Live Mode</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#374151' }}>
          Real orders will be submitted. Review the parameters below before confirming.
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px 4px 0', color: '#6b7280' }}>Ticker</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{ticker || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px 4px 0', color: '#6b7280' }}>Side</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{side}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px 4px 0', color: '#6b7280' }}>Size</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{size}</td>
            </tr>
            {projectedGross != null && (
              <tr>
                <td style={{ padding: '4px 8px 4px 0', color: '#6b7280' }}>Projected Gross</td>
                <td style={{ padding: '4px 0' }}>{projectedGross}</td>
              </tr>
            )}
            {projectedFee != null && (
              <tr>
                <td style={{ padding: '4px 8px 4px 0', color: '#6b7280' }}>Fee</td>
                <td style={{ padding: '4px 0' }}>{projectedFee}</td>
              </tr>
            )}
            {projectedNet != null && (
              <tr>
                <td style={{ padding: '4px 8px 4px 0', color: '#6b7280' }}>Projected Net</td>
                <td style={{ padding: '4px 0', fontWeight: 600 }}>{projectedNet}</td>
              </tr>
            )}
          </tbody>
        </table>

        <p style={{ margin: '0 0 6px', fontSize: 13, color: '#374151' }}>
          Type <strong>{ticker}</strong> to confirm:
        </p>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={ticker}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '6px 8px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            fontSize: 13,
            marginBottom: 16,
          }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!enabled}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              border: 'none',
              background: enabled ? '#b91c1c' : '#fca5a5',
              color: '#fff',
              cursor: enabled ? 'pointer' : 'not-allowed',
              fontSize: 13,
            }}
          >
            Confirm Live Mode
          </button>
        </div>
      </div>
    </div>
  );
}
