import { useState } from 'react';
import { ConfirmModal } from './ConfirmModal';
import { TickerField } from './TickerField';

interface AppState {
  ticker: string;
  side: 'yes' | 'no';
  size: number;
  dryRun: boolean;
  showConfirmModal: boolean;
}

export function App() {
  const [state, setState] = useState<AppState>({
    ticker: '',
    side: 'yes',
    size: 1000,
    dryRun: true,
    showConfirmModal: false,
  });

  function handleDryRunToggle(value: boolean) {
    if (!value) {
      // switching to live mode — show modal first
      setState(s => ({ ...s, showConfirmModal: true }));
    } else {
      setState(s => ({ ...s, dryRun: true, showConfirmModal: false }));
    }
  }

  function handleConfirm() {
    setState(s => ({ ...s, dryRun: false, showConfirmModal: false }));
  }

  function handleCancel() {
    setState(s => ({ ...s, dryRun: true, showConfirmModal: false }));
  }

  return (
    <div>
      <TickerField
        detectedTicker={null}
        value={state.ticker}
        onChange={(v) => setState(s => ({ ...s, ticker: v }))}
        onUseDetected={() => {}}
      />
      <label>
        <input
          type="checkbox"
          checked={!state.dryRun}
          onChange={(e) => handleDryRunToggle(!e.target.checked)}
        />
        Live mode
      </label>
      {state.showConfirmModal && (
        <ConfirmModal
          ticker={state.ticker}
          side={state.side}
          size={state.size}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
