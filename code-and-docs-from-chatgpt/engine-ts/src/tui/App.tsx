import React, { useEffect, useState, useCallback } from 'react';
import { Box, Text, useApp, useInput, useStdin, useStdout } from 'ink';
import {
  fetchBalance, fetchPositions, fetchRestingOrders, fetchPreview, fetchOrderbook, listJournalSummaries,
  type BalanceData, type PositionRow, type RestingOrderRow, type PreviewResult, type JournalSummary,
} from './api.js';
import type { Orderbook } from '../types.js';
import { AccountTab } from './AccountTab.js';
import { SafetyTab } from './SafetyTab.js';
import { SyntheticsTab } from './SyntheticsTab.js';
import { StrategiesTab } from './StrategiesTab.js';

type Tab = 'dashboard' | 'preview' | 'book' | 'journal' | 'account' | 'synthetics' | 'safety' | 'strategies';

interface DashboardState {
  balance?: BalanceData;
  positions: PositionRow[];
  resting: RestingOrderRow[];
  loading: boolean;
  error?: string;
  lastRefresh?: Date;
  cursor: number; // selected position index
}

interface DetailTarget { ticker: string; side: 'yes' | 'no'; size: number; }

export function App() {
  const { exit } = useApp();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [target, setTarget] = useState<DetailTarget | undefined>();
  const [dash, setDash] = useState<DashboardState>({ positions: [], resting: [], loading: true, cursor: 0 });

  const refreshDashboard = useCallback(async () => {
    setDash((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const [balance, positions, resting] = await Promise.all([fetchBalance(), fetchPositions(), fetchRestingOrders()]);
      setDash((s) => ({
        ...s, balance, positions, resting, loading: false, lastRefresh: new Date(),
        cursor: Math.min(s.cursor, Math.max(0, positions.length - 1)),
      }));
    } catch (err) {
      setDash((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : String(err) }));
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
    const t = setInterval(refreshDashboard, 30_000);
    return () => clearInterval(t);
  }, [refreshDashboard]);

  // Guard useInput against non-raw-mode stdin (piping, redirected, test harness).
  // ink's useStdin reports whether the bound stdin supports raw mode; this is the
  // right signal in both production (real TTY) and ink-testing-library (mock stdin).
  const stdinInfo = useStdin();
  const isInteractive = stdinInfo.isRawModeSupported;
  useInput(
    (input, key) => {
      if (input === 'q' || input === 'Q') { exit(); return; }
      if (input === '1') setTab('dashboard');
      else if (input === '2') setTab('preview');
      else if (input === '3') setTab('book');
      else if (input === '4') setTab('journal');
      else if (input === 'a' || input === 'A') setTab('account');
      else if (input === '6') setTab('synthetics');
      else if (input === '5') setTab('safety');
      else if (input === '7') setTab('strategies');
      else if (input === 'r' || input === 'R') refreshDashboard();
      else if (tab === 'dashboard') {
        if (key.upArrow) setDash((s) => ({ ...s, cursor: Math.max(0, s.cursor - 1) }));
        else if (key.downArrow) setDash((s) => ({ ...s, cursor: Math.min(s.positions.length - 1, s.cursor + 1) }));
        else if (key.return) {
          const p = dash.positions[dash.cursor];
          if (p) {
            setTarget({ ticker: p.ticker, side: p.side === 'YES' ? 'yes' : 'no', size: Math.floor(p.quantity) });
            setTab('preview');
          }
        }
      }
    },
    { isActive: isInteractive },
  );

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header dash={dash} tab={tab} target={target} />
      <TabBar tab={tab} />
      {tab === 'dashboard' && <DashboardView state={dash} />}
      {tab === 'preview' && <PreviewView target={target} />}
      {tab === 'book' && <BookView target={target} />}
      {tab === 'journal' && <JournalView />}
      {tab === 'account' && <AccountTab />}
      {tab === 'synthetics' && <SyntheticsTab />}
      {tab === 'safety' && <SafetyTab />}
      {tab === 'strategies' && <StrategiesTab />}
      <Footer tab={tab} />
    </Box>
  );
}

// ── Header / tab bar / footer ───────────────────────────────────────────────

function Header({ dash, tab, target }: { dash: DashboardState; tab: Tab; target?: DetailTarget }) {
  const ts = dash.lastRefresh ? dash.lastRefresh.toISOString().slice(11, 19) + 'Z' : '—';
  const focus = (tab === 'preview' || tab === 'book') && target
    ? `  →  ${target.ticker} ${target.side.toUpperCase()} ${target.size}`
    : '';
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">kea — Kalshi Exit Assistant{focus}</Text>
        <Text color="gray">refreshed {ts}</Text>
      </Box>
      <Box>
        {dash.loading && !dash.balance ? (
          <Text color="yellow">loading…</Text>
        ) : dash.error ? (
          <Text color="red">error: {dash.error}</Text>
        ) : dash.balance ? (
          <Text>
            balance <Text bold color="green">${dash.balance.balanceDollars.toFixed(2)}</Text>
            {'  '}portfolio value <Text bold>${dash.balance.portfolioValueDollars.toFixed(2)}</Text>
          </Text>
        ) : <Text color="gray">—</Text>}
      </Box>
    </Box>
  );
}

function TabBar({ tab }: { tab: Tab }) {
  const item = (n: string, label: string, t: Tab) => (
    <Text color={tab === t ? 'cyan' : 'gray'} bold={tab === t}>
      {tab === t ? `[${n} ${label}]` : ` ${n} ${label} `}
    </Text>
  );
  return (
    <Box marginTop={1}>
      {item('1', 'dashboard', 'dashboard')}<Text> </Text>
      {item('2', 'preview', 'preview')}<Text> </Text>
      {item('3', 'book', 'book')}<Text> </Text>
      {item('4', 'journal', 'journal')}<Text> </Text>
      {item('a', 'account', 'account')}<Text> </Text>
      {item('6', 'synthetics', 'synthetics')}<Text> </Text>
      {item('5', 'safety', 'safety')}<Text> </Text>
      {item('7', 'strategies', 'strategies')}
    </Box>
  );
}

function Footer({ tab }: { tab: Tab }) {
  const hint = tab === 'dashboard'
    ? '[↑↓] select   [enter] preview selected   [r] refresh   [1-4/a/5/6] tabs   [q] quit'
    : tab === 'account'
    ? '[s] switch profile   [1-4/a/5/6] tabs   [q] quit'
    : tab === 'synthetics'
    ? '[↑↓] select   [c] cancel   [n] new   [1-4/a/5/6] tabs   [q] quit'
    : tab === 'safety'
    ? '[↑↓] select   [d] remove ticker   [1-4/a/5-7] tabs   [q] quit'
    : tab === 'strategies'
    ? '[↑↓] select   [enter] open   [1-4/a/5-7] tabs   [q] quit'
    : '[1-4/a/5-7] tabs   [r] refresh   [q] quit';
  return (
    <Box marginTop={1}><Text color="gray">{hint}</Text></Box>
  );
}

// ── Dashboard tab ───────────────────────────────────────────────────────────

function DashboardView({ state }: { state: DashboardState }) {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const sideBySide = cols >= 140;
  return (
    <Box flexDirection={sideBySide ? 'row' : 'column'} marginTop={1}>
      <Box flexDirection="column" {...(sideBySide ? { width: '60%', marginRight: 2 } : {})}>
        <PositionsPanel positions={state.positions} loading={state.loading} cursor={state.cursor} />
      </Box>
      <Box flexDirection="column" {...(sideBySide ? { width: '40%' } : { marginTop: 1 })}>
        <RestingPanel resting={state.resting} loading={state.loading} />
      </Box>
    </Box>
  );
}

function PositionsPanel({ positions, loading, cursor }: { positions: PositionRow[]; loading: boolean; cursor: number }) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={1}>
      <Text bold>Positions ({positions.length})</Text>
      {loading && positions.length === 0 ? (
        <Text color="gray">loading…</Text>
      ) : positions.length === 0 ? (
        <Text color="gray">(no positions)</Text>
      ) : (
        <>
          <Box>
            <Text color="gray">  {padRight('ticker', 38)}{padLeft('qty', 10)}{padRight(' side', 6)}{padLeft('exposure_$', 11)}{padLeft('rest', 5)}</Text>
          </Box>
          {positions.map((p, i) => (
            <Box key={p.ticker}>
              <Text color={i === cursor ? 'cyan' : undefined}>{i === cursor ? '▶ ' : '  '}</Text>
              <Text inverse={i === cursor}>{padRight(truncate(p.ticker, 36), 38)}</Text>
              <Text>{padLeft(p.quantity.toFixed(2), 10)}</Text>
              <Text color={p.side === 'YES' ? 'green' : 'magenta'}>{padRight(' ' + p.side, 6)}</Text>
              <Text>{padLeft(`$${p.exposureDollars.toFixed(2)}`, 11)}</Text>
              <Text color={p.restingOrdersCount > 0 ? 'yellow' : 'gray'}>{padLeft(String(p.restingOrdersCount), 5)}</Text>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

function RestingPanel({ resting, loading }: { resting: RestingOrderRow[]; loading: boolean }) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={1}>
      <Text bold>Resting orders ({resting.length})</Text>
      {loading && resting.length === 0 ? (
        <Text color="gray">loading…</Text>
      ) : resting.length === 0 ? (
        <Text color="gray">(none)</Text>
      ) : (
        <>
          <Box>
            <Text color="gray">{padRight('ticker', 30)}{padRight('side/act', 11)}{padRight('count', 9)}{padRight('price', 9)}</Text>
          </Box>
          {resting.map((o) => (
            <Box key={o.orderId} flexDirection="column">
              <Box>
                <Text>{padRight(o.ticker.slice(0, 28), 30)}</Text>
                <Text>{padRight(`${o.side}/${o.action}`, 11)}</Text>
                <Text>{padRight(o.remaining.toFixed(2), 9)}</Text>
                <Text>{padRight(`$${o.priceDollars}`, 9)}</Text>
              </Box>
              <Text color="gray">  id {o.orderId}</Text>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

// ── Preview tab ─────────────────────────────────────────────────────────────

function PreviewView({ target }: { target?: DetailTarget }) {
  const [data, setData] = useState<PreviewResult | undefined>();
  const [err, setErr] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!target) return;
    setLoading(true); setErr(undefined);
    try { setData(await fetchPreview(target.ticker, target.side, target.size)); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [target]);

  useEffect(() => { load(); }, [load]);

  if (!target) {
    return (
      <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="gray" flexDirection="column">
        <Text color="gray">No target selected. Go to dashboard (1), highlight a position with ↑↓, press Enter.</Text>
      </Box>
    );
  }

  return (
    <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="white" flexDirection="column">
      <Text bold>Preview — {target.ticker} {target.side.toUpperCase()} × {target.size}</Text>
      {loading ? (
        <Text color="yellow">loading…</Text>
      ) : err ? (
        <Text color="red">error: {err}</Text>
      ) : !data ? (
        <Text color="gray">—</Text>
      ) : (
        <>
          <Box marginTop={1}><Text>top bid: <Text bold>{data.topBidCents != null ? `${data.topBidCents}¢` : '—'}</Text>{'   '}decision: <Text bold>{data.decisionSize} @ ${data.decisionPriceDollars}</Text> ({data.decisionReason})</Text></Box>
          <Box marginTop={1}>
            <Text>gross <Text bold color="green">${data.grossDollars.toFixed(4)}</Text>   fees <Text color="red">${data.feesDollars.toFixed(4)}</Text>   net <Text bold>${data.netDollars.toFixed(4)}</Text>   eff. rate <Text>{data.effectiveRatePct.toFixed(2)}%</Text></Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text bold>per-level fills</Text>
            <Box><Text color="gray">{padLeft('price', 8)}{padLeft('size', 8)}{padLeft('fill', 8)}{padLeft('revenue', 12)}{padLeft('fees', 10)}</Text></Box>
            {data.perLevel.length === 0 && <Text color="gray">(no levels filled)</Text>}
            {data.perLevel.map((l, i) => (
              <Box key={i}>
                <Text>{padLeft(`${l.priceCents}¢`, 8)}</Text>
                <Text>{padLeft(String(l.size), 8)}</Text>
                <Text>{padLeft(String(l.fillCount), 8)}</Text>
                <Text>{padLeft(`$${l.revenueDollars.toFixed(4)}`, 12)}</Text>
                <Text>{padLeft(`$${l.feesDollars.toFixed(4)}`, 10)}</Text>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

// ── Book tab ────────────────────────────────────────────────────────────────

function BookView({ target }: { target?: DetailTarget }) {
  const [book, setBook] = useState<Orderbook | undefined>();
  const [err, setErr] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!target) return;
    setLoading(true); setErr(undefined);
    try { setBook(await fetchOrderbook(target.ticker, 10)); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [target]);

  useEffect(() => { load(); }, [load]);

  if (!target) {
    return (
      <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="gray" flexDirection="column">
        <Text color="gray">No target selected. Go to dashboard (1), highlight a position, press Enter.</Text>
      </Box>
    );
  }

  return (
    <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="white" flexDirection="column">
      <Text bold>Orderbook — {target.ticker}</Text>
      {loading ? <Text color="yellow">loading…</Text>
        : err ? <Text color="red">error: {err}</Text>
        : !book ? <Text color="gray">—</Text>
        : (
          <Box marginTop={1} flexDirection="row">
            <Box flexDirection="column" marginRight={4}>
              <Text bold color="green">YES bids</Text>
              <Box><Text color="gray">{padLeft('price', 8)}{padLeft('size', 8)}</Text></Box>
              {book.yes.length === 0 && <Text color="gray">(empty)</Text>}
              {book.yes.map((l, i) => (
                <Box key={i}><Text>{padLeft(`${l.priceCents}¢`, 8)}</Text><Text>{padLeft(String(l.size), 8)}</Text></Box>
              ))}
            </Box>
            <Box flexDirection="column">
              <Text bold color="magenta">NO bids</Text>
              <Box><Text color="gray">{padLeft('price', 8)}{padLeft('size', 8)}</Text></Box>
              {book.no.length === 0 && <Text color="gray">(empty)</Text>}
              {book.no.map((l, i) => (
                <Box key={i}><Text>{padLeft(`${l.priceCents}¢`, 8)}</Text><Text>{padLeft(String(l.size), 8)}</Text></Box>
              ))}
            </Box>
          </Box>
        )}
    </Box>
  );
}

// ── Journal tab ─────────────────────────────────────────────────────────────

function JournalView() {
  const [rows, setRows] = useState<JournalSummary[]>([]);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    try { setRows(listJournalSummaries(20)); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }, []);

  return (
    <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="white" flexDirection="column">
      <Text bold>Recent jobs ({rows.length})</Text>
      {err ? <Text color="red">error: {err}</Text>
        : rows.length === 0 ? <Text color="gray">(no journal files in $KEA_HOME/jobs)</Text>
        : (
          <>
            <Box><Text color="gray">{padRight('jobId', 22)}{padRight('ticker', 32)}{padRight('lastTs', 22)}{padRight('lastKind', 16)}{padLeft('n', 5)}</Text></Box>
            {rows.map((r) => (
              <Box key={r.jobId}>
                <Text>{padRight(r.jobId, 22)}</Text>
                <Text>{padRight(truncate(r.ticker, 30), 32)}</Text>
                <Text>{padRight(r.lastTs.slice(0, 19), 22)}</Text>
                <Text color={r.finished ? 'green' : 'yellow'}>{padRight(r.lastKind, 16)}</Text>
                <Text>{padLeft(String(r.entries), 5)}</Text>
              </Box>
            ))}
          </>
        )}
    </Box>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────

function padRight(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}
function padLeft(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : ' '.repeat(n - s.length) + s;
}
function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
