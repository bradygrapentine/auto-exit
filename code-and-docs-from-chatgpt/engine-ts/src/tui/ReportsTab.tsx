import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import {
  listTcaJobs, readTcaEntries, fetchPortfolioPlan,
  type TcaJobSummary, type TcaChunkRow, type PortfolioPlanEntry,
} from './api.js';

type ReportView = 'tca' | 'portfolio';

function padRight(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}
function padLeft(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : ' '.repeat(n - s.length) + s;
}
function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
function fmtCents(c: number): string {
  return `${c.toFixed(1)}¢`;
}

// ── TCA sub-view ─────────────────────────────────────────────────────────────

function TcaView() {
  const [jobs, setJobs] = useState<TcaJobSummary[]>([]);
  const [cursor, setCursor] = useState(0);
  const [chunks, setChunks] = useState<TcaChunkRow[] | undefined>();
  const [err, setErr] = useState<string | undefined>();
  const [view, setView] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    try { setJobs(listTcaJobs()); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }, []);

  const stdinInfo = useStdin();
  const isInteractive = stdinInfo.isRawModeSupported;

  useInput(
    (input, key) => {
      if (view === 'list') {
        if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
        else if (key.downArrow) setCursor((c) => Math.min(jobs.length - 1, c + 1));
        else if (key.return && jobs[cursor]) {
          try {
            setChunks(readTcaEntries(jobs[cursor].filePath));
            setView('detail');
          } catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
          }
        } else if (input === 'q' || key.escape) { /* parent handles q */ }
      } else {
        if (key.escape || input === 'b') { setView('list'); setChunks(undefined); }
      }
    },
    { isActive: isInteractive },
  );

  if (err) {
    return (
      <Box marginTop={1} flexDirection="column">
        <Text color="red">error: {err}</Text>
      </Box>
    );
  }

  if (view === 'detail' && chunks !== undefined && jobs[cursor]) {
    const job = jobs[cursor];
    const avgSlippage = chunks.length > 0
      ? chunks.reduce((s, c) => s + c.slippageCents, 0) / chunks.length
      : 0;
    return (
      <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="white" paddingX={1}>
        <Text bold>TCA — {truncate(job.jobId, 30)}  {job.ticker} {job.side.toUpperCase()}</Text>
        <Box marginTop={1}>
          <Text color="gray">
            {padLeft('chunk', 6)}{'  '}{padLeft('arrivalMid', 11)}{'  '}{padLeft('executed', 9)}{'  '}{padLeft('slippage', 9)}{'  '}{padLeft('size', 6)}
          </Text>
        </Box>
        {chunks.length === 0 ? (
          <Text color="gray">(no chunk entries)</Text>
        ) : (
          chunks.map((c, i) => (
            <Box key={i}>
              <Text>{padLeft(String(c.chunkIndex + 1), 6)}</Text>
              <Text>{'  '}{padLeft(fmtCents(c.arrivalMidCents), 11)}</Text>
              <Text>{'  '}{padLeft(fmtCents(c.executedPriceCents), 9)}</Text>
              <Text color={c.slippageCents >= 0 ? 'red' : 'green'}>
                {'  '}{padLeft((c.slippageCents >= 0 ? '+' : '') + fmtCents(c.slippageCents), 9)}
              </Text>
              <Text>{'  '}{padLeft(String(c.chunkSize), 6)}</Text>
            </Box>
          ))
        )}
        <Box marginTop={1}>
          <Text>Avg slippage: <Text bold color={avgSlippage >= 0 ? 'red' : 'green'}>
            {(avgSlippage >= 0 ? '+' : '') + fmtCents(avgSlippage)}
          </Text>{'  '}chunks: <Text bold>{chunks.length}</Text></Text>
        </Box>
        <Box marginTop={1}><Text color="gray">[esc/b] back to list</Text></Box>
      </Box>
    );
  }

  return (
    <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="white" paddingX={1}>
      <Text bold>TCA jobs with data ({jobs.length})</Text>
      {jobs.length === 0 ? (
        <Text color="gray">no completed jobs with TCA data</Text>
      ) : (
        <>
          <Box>
            <Text color="gray">
              {'  '}{padRight('jobId', 24)}{padRight('ticker', 20)}{padLeft('chunks', 7)}{'  '}{padRight('side', 6)}
            </Text>
          </Box>
          {jobs.map((j, i) => (
            <Box key={j.jobId}>
              <Text color={i === cursor ? 'cyan' : undefined}>{i === cursor ? '▶ ' : '  '}</Text>
              <Text inverse={i === cursor}>{padRight(truncate(j.jobId, 22), 24)}</Text>
              <Text>{padRight(truncate(j.ticker, 18), 20)}</Text>
              <Text>{padLeft(String(j.tcaChunks), 7)}</Text>
              <Text>{'  '}{padRight(j.side, 6)}</Text>
            </Box>
          ))}
          <Box marginTop={1}><Text color="gray">[↑↓] select   [enter] detail</Text></Box>
        </>
      )}
    </Box>
  );
}

// ── Portfolio sub-view ───────────────────────────────────────────────────────

function PortfolioView({ positions }: { positions: { ticker: string; side: 'yes' | 'no'; size: number }[] }) {
  const [plan, setPlan] = useState<PortfolioPlanEntry[] | undefined>();
  const [err, setErr] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (positions.length === 0) return;
    setLoading(true);
    fetchPortfolioPlan(positions)
      .then((p) => { setPlan(p); setLoading(false); })
      .catch((e) => { setErr(e instanceof Error ? e.message : String(e)); setLoading(false); });
  }, [positions]);

  if (positions.length === 0) {
    return (
      <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="white" paddingX={1}>
        <Text bold>Portfolio plan</Text>
        <Text color="gray">no positions known — go to dashboard (1) to load positions</Text>
      </Box>
    );
  }

  return (
    <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="white" paddingX={1}>
      <Text bold>Portfolio plan ({positions.length} positions)</Text>
      {loading ? (
        <Text color="yellow">loading…</Text>
      ) : err ? (
        <Text color="red">error: {err}</Text>
      ) : !plan || plan.length === 0 ? (
        <Text color="gray">—</Text>
      ) : (
        <>
          <Box>
            <Text color="gray">
              {padLeft('rank', 5)}{'  '}{padRight('ticker', 30)}{'  '}{padRight('side', 5)}{'  '}{padLeft('size', 6)}{'  '}{padLeft('mark$', 9)}{'  '}{padLeft('ev$', 9)}{'  '}{padLeft('over$', 9)}{'  '}{padRight('strategy', 10)}
            </Text>
          </Box>
          {plan.map((e) => (
            <Box key={e.ticker}>
              <Text>{padLeft(String(e.rank), 5)}</Text>
              <Text>{'  '}{padRight(truncate(e.ticker, 28), 30)}</Text>
              <Text>{'  '}{padRight(e.side.toUpperCase(), 5)}</Text>
              <Text>{'  '}{padLeft(String(e.size), 6)}</Text>
              <Text>{'  '}{padLeft(`$${e.markToBidDollars.toFixed(2)}`, 9)}</Text>
              <Text>{'  '}{padLeft(`$${e.evHoldDollars.toFixed(2)}`, 9)}</Text>
              <Text color={e.overvaluedDollars >= 0 ? 'green' : 'red'}>
                {'  '}{padLeft(`$${e.overvaluedDollars.toFixed(2)}`, 9)}
              </Text>
              <Text color={e.recommendedStrategy === 'aggressive' ? 'red' : 'yellow'}>
                {'  '}{padRight(e.recommendedStrategy, 10)}
              </Text>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

// ── Main ReportsTab ──────────────────────────────────────────────────────────

interface ReportsTabProps {
  positions?: { ticker: string; side: 'yes' | 'no'; size: number }[];
}

export function ReportsTab({ positions = [] }: ReportsTabProps) {
  const [reportView, setReportView] = useState<ReportView>('tca');

  const stdinInfo = useStdin();
  const isInteractive = stdinInfo.isRawModeSupported;

  useInput(
    (input) => {
      if (input === 't' || input === 'T') setReportView('tca');
      else if (input === 'p' || input === 'P') setReportView('portfolio');
    },
    { isActive: isInteractive },
  );

  return (
    <Box flexDirection="column">
      <Box marginTop={1} gap={2}>
        <Text color={reportView === 'tca' ? 'cyan' : 'gray'} bold={reportView === 'tca'}>
          {reportView === 'tca' ? '[t TCA]' : ' t TCA '}
        </Text>
        <Text color={reportView === 'portfolio' ? 'cyan' : 'gray'} bold={reportView === 'portfolio'}>
          {reportView === 'portfolio' ? '[p portfolio]' : ' p portfolio '}
        </Text>
      </Box>
      {reportView === 'tca' && <TcaView />}
      {reportView === 'portfolio' && <PortfolioView positions={positions} />}
      <Box marginTop={1}><Text color="gray">[t] TCA   [p] portfolio   [1-8] tabs   [q] quit</Text></Box>
    </Box>
  );
}
