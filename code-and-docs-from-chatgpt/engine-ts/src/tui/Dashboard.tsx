import React, { useEffect, useState, useCallback } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { fetchBalance, fetchPositions, fetchRestingOrders, type BalanceData, type PositionRow, type RestingOrderRow } from './api.js';

interface State {
  balance?: BalanceData;
  positions: PositionRow[];
  resting: RestingOrderRow[];
  loading: boolean;
  error?: string;
  lastRefresh?: Date;
}

export function Dashboard() {
  const { exit } = useApp();
  const [state, setState] = useState<State>({ positions: [], resting: [], loading: true });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const [balance, positions, resting] = await Promise.all([fetchBalance(), fetchPositions(), fetchRestingOrders()]);
      setState({ balance, positions, resting, loading: false, lastRefresh: new Date() });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : String(err) }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30_000); // auto-refresh every 30s
    return () => clearInterval(t);
  }, [refresh]);

  // Guard against non-TTY stdin (piping/redirecting): ink's useInput requires raw mode,
  // which throws on non-TTY. Skip the keyboard hook when stdin isn't interactive.
  const isTTY = Boolean(process.stdin.isTTY);
  useInput(
    (input) => {
      if (input === 'q' || input === 'Q') exit();
      if (input === 'r' || input === 'R') refresh();
    },
    { isActive: isTTY },
  );

  // Stack panels vertically on narrow terminals; side-by-side when wide enough
  // for both tables (positions ~75 chars, resting ~60 chars + borders + gap).
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const sideBySide = cols >= 140;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header state={state} />
      <Box flexDirection={sideBySide ? 'row' : 'column'} marginTop={1}>
        <Box flexDirection="column" {...(sideBySide ? { width: '60%', marginRight: 2 } : {})}>
          <PositionsPanel positions={state.positions} loading={state.loading} />
        </Box>
        <Box flexDirection="column" {...(sideBySide ? { width: '40%' } : { marginTop: 1 })}>
          <RestingPanel resting={state.resting} loading={state.loading} />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}

function Header({ state }: { state: State }) {
  const ts = state.lastRefresh ? state.lastRefresh.toISOString().slice(11, 19) + 'Z' : '—';
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">kea — Kalshi Exit Assistant</Text>
        <Text color="gray">refreshed {ts}</Text>
      </Box>
      <Box marginTop={0}>
        {state.loading ? (
          <Text color="yellow">loading…</Text>
        ) : state.error ? (
          <Text color="red">error: {state.error}</Text>
        ) : state.balance ? (
          <Text>
            balance <Text bold color="green">${state.balance.balanceDollars.toFixed(2)}</Text>
            {'  '}portfolio value <Text bold>${state.balance.portfolioValueDollars.toFixed(2)}</Text>
          </Text>
        ) : (
          <Text color="gray">—</Text>
        )}
      </Box>
    </Box>
  );
}

function PositionsPanel({ positions, loading }: { positions: PositionRow[]; loading: boolean }) {
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
            <Text color="gray">{padRight('ticker', 38)}{padLeft('qty', 10)}{padRight(' side', 6)}{padLeft('exposure_$', 11)}{padLeft('rest', 5)}</Text>
          </Box>
          {positions.map((p) => (
            <Box key={p.ticker}>
              <Text>{padRight(truncate(p.ticker, 36), 38)}</Text>
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

function Footer() {
  return (
    <Box marginTop={1}>
      <Text color="gray">[r] refresh   [q] quit   (auto-refresh every 30s)</Text>
    </Box>
  );
}

function padRight(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}
function padLeft(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : ' '.repeat(n - s.length) + s;
}
function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
