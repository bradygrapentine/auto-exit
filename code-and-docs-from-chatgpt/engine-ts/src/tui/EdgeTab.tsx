import React, { useEffect, useState, useCallback } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import { fetchEdgeSummary, fetchEdgePerStrategy, type EdgeStrategySummary, type EdgeFireRow } from './api.js';

type MarketCategory = 'all' | 'nfl' | 'political' | 'entertainment' | 'weather' | 'other';
const CATEGORIES: MarketCategory[] = ['all', 'nfl', 'political', 'entertainment', 'weather', 'other'];

// ── helpers ──────────────────────────────────────────────────────────────────

function padRight(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}
function padLeft(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : ' '.repeat(n - s.length) + s;
}
function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
function fmtDollars(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return `${sign}$${v.toFixed(2)}`;
}

// ── Strategy list view ────────────────────────────────────────────────────────

function StrategyListView({
  rows,
  cursor,
  category,
}: {
  rows: EdgeStrategySummary[];
  cursor: number;
  category: MarketCategory;
}) {
  const filtered = category === 'all' ? rows : rows.filter((r) => r.category === category);

  if (filtered.length === 0) {
    return (
      <Box marginTop={1} paddingX={1} flexDirection="column">
        <Text color="gray">No fires yet — run some strategies first.</Text>
      </Box>
    );
  }

  return (
    <Box marginTop={1} paddingX={1} flexDirection="column">
      <Box>
        <Text color="gray">
          {padRight('Strategy', 20)}
          {padLeft('Fires', 7)}
          {padLeft('Realized $', 12)}
          {padLeft('vs Hold', 10)}
          {padLeft('vs Immed', 10)}
          {padLeft('Avg edge/fire', 15)}
        </Text>
      </Box>
      {filtered.map((r, i) => {
        const isSelected = filtered[cursor] ? filtered[cursor].strategy === r.strategy : i === cursor;
        return (
          <Box key={r.strategy}>
            <Text color={isSelected ? 'cyan' : undefined}>{isSelected ? '▶ ' : '  '}</Text>
            <Text inverse={isSelected}>{padRight(truncate(r.strategy, 18), 20)}</Text>
            <Text>{padLeft(String(r.fires), 7)}</Text>
            <Text color={r.realizedDollars >= 0 ? 'green' : 'red'}>{padLeft(fmtDollars(r.realizedDollars), 12)}</Text>
            <Text color={r.vsPassiveHoldDollars >= 0 ? 'green' : 'red'}>{padLeft(fmtDollars(r.vsPassiveHoldDollars), 10)}</Text>
            <Text color={r.vsImmediateExitDollars >= 0 ? 'green' : 'red'}>{padLeft(fmtDollars(r.vsImmediateExitDollars), 10)}</Text>
            <Text color={r.avgEdgePerFire >= 0 ? 'green' : 'red'}>{padLeft(fmtDollars(r.avgEdgePerFire), 15)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Drill-down detail view ────────────────────────────────────────────────────

function FireDetailView({
  strategy,
  rows,
  loading,
  error,
}: {
  strategy: string;
  rows: EdgeFireRow[];
  loading: boolean;
  error?: string;
}) {
  return (
    <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="white" flexDirection="column">
      <Text bold>Edge decomposition — {strategy}</Text>
      {loading ? (
        <Text color="yellow">loading…</Text>
      ) : error ? (
        <Text color="red">error: {error}</Text>
      ) : rows.length === 0 ? (
        <Text color="gray">No per-fire data available.</Text>
      ) : (
        <>
          <Box marginTop={1}>
            <Text color="gray">
              {padRight('Fire', 20)}
              {padLeft('Entry', 10)}
              {padLeft('Exit', 10)}
              {padLeft('Timing', 10)}
              {padLeft('Trigger', 10)}
              {padLeft('Fees', 8)}
              {padLeft('Residual', 10)}
            </Text>
          </Box>
          {rows.map((r, i) => (
            <Box key={i}>
              <Text>{padRight(truncate(r.fireId, 18), 20)}</Text>
              <Text color={r.entryEdgeDollars >= 0 ? 'green' : 'red'}>{padLeft(fmtDollars(r.entryEdgeDollars), 10)}</Text>
              <Text color={r.exitEdgeDollars >= 0 ? 'green' : 'red'}>{padLeft(fmtDollars(r.exitEdgeDollars), 10)}</Text>
              <Text color={r.timingEdgeDollars >= 0 ? 'green' : 'red'}>{padLeft(fmtDollars(r.timingEdgeDollars), 10)}</Text>
              <Text color={r.triggerEdgeDollars >= 0 ? 'green' : 'red'}>{padLeft(fmtDollars(r.triggerEdgeDollars), 10)}</Text>
              <Text color="red">{padLeft(fmtDollars(r.feesDollars), 8)}</Text>
              <Text color="gray">{padLeft(fmtDollars(r.residualDollars), 10)}</Text>
            </Box>
          ))}
        </>
      )}
      <Box marginTop={1}><Text color="gray">[b] back to list</Text></Box>
    </Box>
  );
}

// ── EdgeTab ───────────────────────────────────────────────────────────────────

export function EdgeTab() {
  const [rows, setRows] = useState<EdgeStrategySummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | undefined>();
  const [cursor, setCursor] = useState(0);
  const [category, setCategory] = useState<MarketCategory>('all');
  const [detail, setDetail] = useState<{ strategy: string; rows: EdgeFireRow[]; loading: boolean; error?: string } | null>(null);

  const stdinInfo = useStdin();
  const isInteractive = stdinInfo.isRawModeSupported;

  const loadSummary = useCallback(async () => {
    setLoadingList(true);
    setListError(undefined);
    try {
      const data = await fetchEdgeSummary();
      setRows(data);
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const filteredRows = category === 'all' ? rows : rows.filter((r) => r.category === category);

  useInput(
    (input, key) => {
      if (detail) {
        if (input === 'b' || input === 'B') { setDetail(null); return; }
        return;
      }
      if (input === 'm' || input === 'M') {
        setCategory((c) => {
          const idx = CATEGORIES.indexOf(c);
          return CATEGORIES[(idx + 1) % CATEGORIES.length];
        });
        setCursor(0);
        return;
      }
      if (key.upArrow) {
        setCursor((c) => Math.max(0, c - 1));
        return;
      }
      if (key.downArrow) {
        setCursor((c) => Math.min(Math.max(0, filteredRows.length - 1), c + 1));
        return;
      }
      if (key.return) {
        const selected = filteredRows[cursor];
        if (!selected) return;
        const strategy = selected.strategy;
        setDetail({ strategy, rows: [], loading: true });
        fetchEdgePerStrategy(strategy)
          .then((fires) => setDetail({ strategy, rows: fires, loading: false }))
          .catch((e) => setDetail({ strategy, rows: [], loading: false, error: e instanceof Error ? e.message : String(e) }));
        return;
      }
    },
    { isActive: isInteractive },
  );

  return (
    <Box flexDirection="column">
      <Box marginTop={1} gap={2}>
        {CATEGORIES.map((cat) => (
          <Text key={cat} color={category === cat ? 'cyan' : 'gray'} bold={category === cat}>
            {category === cat ? `[${cat}]` : ` ${cat} `}
          </Text>
        ))}
      </Box>

      {detail ? (
        <FireDetailView
          strategy={detail.strategy}
          rows={detail.rows}
          loading={detail.loading}
          error={detail.error}
        />
      ) : loadingList ? (
        <Box marginTop={1} paddingX={1}><Text color="yellow">loading…</Text></Box>
      ) : listError ? (
        <Box marginTop={1} paddingX={1}><Text color="red">error: {listError}</Text></Box>
      ) : (
        <StrategyListView rows={rows} cursor={cursor} category={category} />
      )}

      <Box marginTop={1}>
        <Text color="gray">[↑↓] select   [enter] drill-down   [m] cycle market   [b] back   [1-9/e] tabs   [q] quit</Text>
      </Box>
    </Box>
  );
}
