import { useState } from 'react';
import { StrategyView, type ExecutionSummary } from './StrategyView';
import { ProfileSelector } from './ProfileSelector';
import { SafetyView } from './SafetyView';
import { SummaryCard } from './SummaryCard';

type Tab = 'strategies' | 'safety';

/**
 * Popup shell — 3-zone layout.
 *
 *   ProfileSlot     header  — SP1.7 (account/profile switcher)
 *   TabBar          tabs    — Strategies | Safety
 *     StrategyView          — Strategies tab
 *     SafetySlot            — SP1.8 (safety panel + forbidden tickers)
 *   SummarySlot     footer  — SP1.5 (post-completion summary card)
 */
export function App() {
  const [tab, setTab] = useState<Tab>('strategies');
  const [summary, setSummary] = useState<ExecutionSummary | null>(null);

  return (
    <div data-testid="popup-app" style={{ display: 'flex', flexDirection: 'column', minWidth: 360 }}>
      <ProfileSlot />
      <TabBar tab={tab} onTabChange={setTab} />
      <main>
        {tab === 'strategies' && <StrategyView onComplete={setSummary} />}
        {tab === 'safety' && <SafetySlot />}
      </main>
      <SummarySlot summary={summary} />
    </div>
  );
}

function TabBar({ tab, onTabChange }: { tab: Tab; onTabChange: (t: Tab) => void }) {
  const baseBtn: React.CSSProperties = {
    flex: 1,
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  };
  const activeBtn: React.CSSProperties = { ...baseBtn, background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8' };
  return (
    <nav data-testid="tab-bar" style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
      <button
        data-testid="tab-strategies"
        onClick={() => onTabChange('strategies')}
        aria-pressed={tab === 'strategies'}
        style={tab === 'strategies' ? activeBtn : baseBtn}
      >
        Strategies
      </button>
      <button
        data-testid="tab-safety"
        onClick={() => onTabChange('safety')}
        aria-pressed={tab === 'safety'}
        style={tab === 'safety' ? activeBtn : baseBtn}
      >
        Safety
      </button>
    </nav>
  );
}

function ProfileSlot() {
  return <ProfileSelector />;
}

function SafetySlot() {
  return <SafetyView />;
}

function SummarySlot({ summary }: { summary: ExecutionSummary | null }) {
  return (
    <div data-testid="summary-slot" data-has-summary={summary != null}>
      <SummaryCard summary={summary} />
    </div>
  );
}
