import { useState } from 'react';
import { StrategyView, type ExecutionSummary } from './StrategyView';
import { SummaryCard } from './SummaryCard';

type Tab = 'strategies' | 'safety';

/**
 * Popup shell — 3-zone layout.
 *
 *   ProfileSlot     header  — SP1.7 fills (account/profile switcher)
 *   TabBar          tabs    — Strategies | Safety
 *     StrategyView          — Strategies tab
 *     SafetySlot            — SP1.8 fills (safety panel + forbidden tickers)
 *   SummarySlot     footer  — SP1.5 fills (post-completion summary card)
 *
 * Slot placeholders return null until their owning Phase B PR fills them in.
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
  // SP1.7 replaces this with <ProfileSelector />.
  return <div data-testid="profile-slot" />;
}

function SafetySlot() {
  // SP1.8 replaces this with <SafetyView />.
  return <div data-testid="safety-slot" />;
}

function SummarySlot({ summary }: { summary: ExecutionSummary | null }) {
  return (
    <div data-testid="summary-slot" data-has-summary={summary != null}>
      <SummaryCard summary={summary} />
    </div>
  );
}
