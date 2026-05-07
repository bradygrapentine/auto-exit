import { StrategyView } from './StrategyView';

// SP2.3: replaced implicit losing-exit dispatch with full strategy launcher.
// StrategyView owns ticker prefill, form fields, danger-level confirm, and status streaming.
export function App() {
  return (
    <div>
      <StrategyView />
    </div>
  );
}
