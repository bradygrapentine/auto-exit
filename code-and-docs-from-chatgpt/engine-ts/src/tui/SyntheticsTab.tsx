import React, { useState } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import { getWatcher, isWatcherInitialized } from '../watcherSingleton.js';
import type {
  Synthetic, SyntheticKind,
  StopLossParams, StopLimitParams, TrailingStopParams,
  TakeProfitParams, OcoParams, BracketParams,
  TimeStopParams, StepTrailParams,
  TrailingStopState, TakeProfitState,
} from '../types.js';
import type { RegisterArgs } from '../synthetics/types.js';

// ── Wizard state machine ─────────────────────────────────────────────────────

type WizardStep =
  | { step: 'kind' }
  | { step: 'params'; kind: SyntheticKind; fields: Record<string, string>; fieldIdx: number }
  | { step: 'confirm'; args: RegisterArgs }
  | { step: 'done'; id: string }
  | { step: 'error'; message: string };

const KINDS: SyntheticKind[] = [
  'stop_loss', 'stop_limit', 'trailing_stop',
  'take_profit', 'oco', 'bracket',
  'time_stop', 'step_trail',
];

const KIND_LABELS: Record<SyntheticKind, string> = {
  stop_loss: 'Stop Loss',
  stop_limit: 'Stop Limit',
  trailing_stop: 'Trailing Stop',
  take_profit: 'Take Profit',
  oco: 'OCO (One-Cancels-Other)',
  bracket: 'Bracket',
  time_stop: 'Time Stop',
  step_trail: 'Step Trail',
};

/** Fields to collect per kind, with display labels. */
function kindFields(kind: SyntheticKind): Array<{ key: string; label: string; placeholder: string }> {
  switch (kind) {
    case 'stop_loss':
      return [
        { key: 'ticker', label: 'Ticker', placeholder: 'e.g. KXBTC-25-50000' },
        { key: 'side', label: 'Side (yes/no)', placeholder: 'yes' },
        { key: 'positionSize', label: 'Position size', placeholder: '10' },
        { key: 'triggerPriceCents', label: 'Trigger price (¢)', placeholder: '30' },
      ];
    case 'stop_limit':
      return [
        { key: 'ticker', label: 'Ticker', placeholder: 'e.g. KXBTC-25-50000' },
        { key: 'side', label: 'Side (yes/no)', placeholder: 'yes' },
        { key: 'positionSize', label: 'Position size', placeholder: '10' },
        { key: 'triggerPriceCents', label: 'Trigger price (¢)', placeholder: '30' },
        { key: 'limitPriceCents', label: 'Limit price (¢)', placeholder: '28' },
        { key: 'size', label: 'Order size', placeholder: '10' },
      ];
    case 'trailing_stop':
      return [
        { key: 'ticker', label: 'Ticker', placeholder: 'e.g. KXBTC-25-50000' },
        { key: 'side', label: 'Side (yes/no)', placeholder: 'yes' },
        { key: 'positionSize', label: 'Position size', placeholder: '10' },
        { key: 'trailCents', label: 'Trail distance (¢)', placeholder: '5' },
      ];
    case 'take_profit':
      return [
        { key: 'ticker', label: 'Ticker', placeholder: 'e.g. KXBTC-25-50000' },
        { key: 'side', label: 'Side (yes/no)', placeholder: 'yes' },
        { key: 'positionSize', label: 'Position size', placeholder: '10' },
        { key: 'triggerPriceCents', label: 'Trigger price (¢)', placeholder: '70' },
      ];
    case 'oco':
      return [
        { key: 'ticker', label: 'Ticker', placeholder: 'e.g. KXBTC-25-50000' },
        { key: 'side', label: 'Side (yes/no)', placeholder: 'yes' },
        { key: 'positionSize', label: 'Position size', placeholder: '10' },
        { key: 'leg1TriggerCents', label: 'Leg 1 trigger price (¢)', placeholder: '70' },
        { key: 'leg2TriggerCents', label: 'Leg 2 trigger price (¢)', placeholder: '30' },
      ];
    case 'bracket':
      return [
        { key: 'ticker', label: 'Ticker', placeholder: 'e.g. KXBTC-25-50000' },
        { key: 'side', label: 'Side (yes/no)', placeholder: 'yes' },
        { key: 'positionSize', label: 'Position size', placeholder: '10' },
        { key: 'takeProfitCents', label: 'Take-profit price (¢)', placeholder: '70' },
        { key: 'stopLossCents', label: 'Stop-loss price (¢)', placeholder: '30' },
      ];
    case 'time_stop':
      return [
        { key: 'ticker', label: 'Ticker', placeholder: 'e.g. KXBTC-25-50000' },
        { key: 'side', label: 'Side (yes/no)', placeholder: 'yes' },
        { key: 'positionSize', label: 'Position size', placeholder: '10' },
        { key: 'deadlineTimestamp', label: 'Deadline (ISO 8601)', placeholder: '2026-12-31T23:59:59Z' },
        { key: 'exitIfBelowCents', label: 'Exit if below (¢, optional)', placeholder: '50' },
      ];
    case 'step_trail':
      return [
        { key: 'ticker', label: 'Ticker', placeholder: 'e.g. KXBTC-25-50000' },
        { key: 'side', label: 'Side (yes/no)', placeholder: 'yes' },
        { key: 'positionSize', label: 'Position size', placeholder: '10' },
        { key: 'trailCents', label: 'Trail distance (¢)', placeholder: '5' },
        { key: 'stepCents', label: 'Step size (¢)', placeholder: '1' },
      ];
  }
}

function buildRegisterArgs(kind: SyntheticKind, fields: Record<string, string>): RegisterArgs {
  const ticker = fields['ticker'] ?? '';
  const side = (fields['side'] ?? 'yes') as 'yes' | 'no';
  const positionSize = Number(fields['positionSize'] ?? '1');

  switch (kind) {
    case 'stop_loss': {
      const p: StopLossParams = { triggerPriceCents: Number(fields['triggerPriceCents'] ?? '0') };
      return { kind, ticker, side, positionSize, params: p };
    }
    case 'stop_limit': {
      const p: StopLimitParams = {
        triggerPriceCents: Number(fields['triggerPriceCents'] ?? '0'),
        limitPriceCents: Number(fields['limitPriceCents'] ?? '0'),
        size: Number(fields['size'] ?? positionSize),
      };
      return { kind, ticker, side, positionSize, params: p };
    }
    case 'trailing_stop': {
      const p: TrailingStopParams = { trailCents: Number(fields['trailCents'] ?? '0') };
      return { kind, ticker, side, positionSize, params: p };
    }
    case 'take_profit': {
      const p: TakeProfitParams = { triggerPriceCents: Number(fields['triggerPriceCents'] ?? '0') };
      return { kind, ticker, side, positionSize, params: p };
    }
    case 'oco': {
      const p: OcoParams = {
        legs: [
          { kind: 'take_profit', params: { triggerPriceCents: Number(fields['leg1TriggerCents'] ?? '0') } },
          { kind: 'stop_loss', params: { triggerPriceCents: Number(fields['leg2TriggerCents'] ?? '0') } },
        ],
      };
      return { kind, ticker, side, positionSize, params: p };
    }
    case 'bracket': {
      const p: BracketParams = {
        takeProfitCents: Number(fields['takeProfitCents'] ?? '0'),
        stopLossCents: Number(fields['stopLossCents'] ?? '0'),
      };
      return { kind, ticker, side, positionSize, params: p };
    }
    case 'time_stop': {
      const exitIfBelow = fields['exitIfBelowCents'];
      const p: TimeStopParams = {
        deadlineTimestamp: fields['deadlineTimestamp'] ?? new Date().toISOString(),
        ...(exitIfBelow ? { exitIfBelowCents: Number(exitIfBelow) } : {}),
      };
      return { kind, ticker, side, positionSize, params: p };
    }
    case 'step_trail': {
      const p: StepTrailParams = {
        trailCents: Number(fields['trailCents'] ?? '0'),
        stepCents: Number(fields['stepCents'] ?? '1'),
      };
      return { kind, ticker, side, positionSize, params: p };
    }
  }
}

// ── Param summary helpers ────────────────────────────────────────────────────

function paramsSummary(s: Synthetic): string {
  switch (s.kind) {
    case 'stop_loss': {
      const p = s.params as StopLossParams;
      return `trigger=${p.triggerPriceCents}¢`;
    }
    case 'stop_limit': {
      const p = s.params as StopLimitParams;
      return `trigger=${p.triggerPriceCents}¢ limit=${p.limitPriceCents}¢`;
    }
    case 'trailing_stop': {
      const p = s.params as TrailingStopParams;
      return `trail=${p.trailCents}¢`;
    }
    case 'take_profit': {
      const p = s.params as TakeProfitParams;
      if (p.rungs && p.rungs.length > 0) {
        return `rungs=[${p.rungs.map(r => r.priceCents).join(',')}]`;
      }
      return `TP=${p.triggerPriceCents ?? '?'}¢`;
    }
    case 'oco': {
      const p = s.params as OcoParams;
      const [a, b] = p.legs;
      return `leg1=${a.kind} leg2=${b.kind}`;
    }
    case 'bracket': {
      const p = s.params as BracketParams;
      return `TP=${p.takeProfitCents}¢ SL=${p.stopLossCents}¢`;
    }
    case 'time_stop': {
      const p = s.params as TimeStopParams;
      return p.exitIfBelowCents != null
        ? `deadline=${p.deadlineTimestamp} below=${p.exitIfBelowCents}¢`
        : `deadline=${p.deadlineTimestamp}`;
    }
    case 'step_trail': {
      const p = s.params as StepTrailParams;
      return `trail=${p.trailCents}¢ step=${p.stepCents}¢`;
    }
    default:
      return '';
  }
}

function stateSummary(s: Synthetic): string {
  if (s.kind === 'trailing_stop') {
    const st = s.state as Partial<TrailingStopState>;
    if (st.peakBidCentsExact != null) return `peak: ${st.peakBidCentsExact}¢`;
  }
  if (s.kind === 'take_profit') {
    const st = s.state as Partial<TakeProfitState>;
    if (st.firedRungIndices && st.firedRungIndices.length > 0) {
      return `fired rungs: [${st.firedRungIndices.join(',')}]`;
    }
  }
  return '';
}

function statusColor(status: Synthetic['status']): 'green' | 'yellow' | 'gray' | 'red' {
  switch (status) {
    case 'armed': return 'green';
    case 'fired': return 'yellow';
    case 'canceled': return 'gray';
    case 'fire_failed': return 'red';
  }
}

function padRight(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

// ── Main component ───────────────────────────────────────────────────────────

export function SyntheticsTab(): JSX.Element {
  const [cursor, setCursor] = useState(0);
  const [wizard, setWizard] = useState<WizardStep | null>(null);
  const [kindCursor, setKindCursor] = useState(0);
  const [msg, setMsg] = useState<string | undefined>();
  const [inputBuffer, setInputBuffer] = useState('');

  const stdinInfo = useStdin();
  const isInteractive = stdinInfo.isRawModeSupported;

  const initialized = isWatcherInitialized();
  const synthetics: Synthetic[] = initialized ? getWatcher().list() : [];

  useInput(
    (input, key) => {
      // ── wizard mode ──────────────────────────────────────────────────────
      if (wizard !== null) {
        if (wizard.step === 'kind') {
          if (key.upArrow) setKindCursor(c => Math.max(0, c - 1));
          else if (key.downArrow) setKindCursor(c => Math.min(KINDS.length - 1, c + 1));
          else if (key.return) {
            const kind = KINDS[kindCursor];
            const fields: Record<string, string> = {};
            setWizard({ step: 'params', kind, fields, fieldIdx: 0 });
            setInputBuffer('');
          } else if (key.escape) {
            setWizard(null);
          }
          return;
        }

        if (wizard.step === 'params') {
          const { kind, fields, fieldIdx } = wizard;
          const defs = kindFields(kind);

          if (key.escape) {
            setWizard({ step: 'kind' });
            setInputBuffer('');
            return;
          }
          if (key.return) {
            // Save current field value and advance.
            const currentField = defs[fieldIdx];
            if (currentField) {
              const updated = { ...fields, [currentField.key]: inputBuffer };
              if (fieldIdx < defs.length - 1) {
                setWizard({ step: 'params', kind, fields: updated, fieldIdx: fieldIdx + 1 });
                setInputBuffer('');
              } else {
                // All fields filled — go to confirm.
                const args = buildRegisterArgs(kind, updated);
                setWizard({ step: 'confirm', args });
                setInputBuffer('');
              }
            }
            return;
          }
          if (key.backspace || key.delete) {
            setInputBuffer(b => b.slice(0, -1));
            return;
          }
          // Printable character.
          if (input && input.length === 1 && input >= ' ') {
            setInputBuffer(b => b + input);
          }
          return;
        }

        if (wizard.step === 'confirm') {
          if (key.escape) {
            setWizard({ step: 'kind' });
            setInputBuffer('');
            return;
          }
          if (key.return || input === 'y' || input === 'Y') {
            try {
              const id = getWatcher().register(wizard.args);
              setWizard({ step: 'done', id });
              setMsg(`Registered ${id}`);
              setTimeout(() => {
                setWizard(null);
                setMsg(undefined);
              }, 2000);
            } catch (e) {
              setWizard({ step: 'error', message: e instanceof Error ? e.message : String(e) });
            }
            return;
          }
          if (input === 'n' || input === 'N') {
            setWizard(null);
            setInputBuffer('');
          }
          return;
        }

        if (wizard.step === 'done' || wizard.step === 'error') {
          if (key.return || key.escape) {
            setWizard(null);
            setInputBuffer('');
          }
          return;
        }

        return; // defensive
      }

      // ── list mode ────────────────────────────────────────────────────────
      if (key.upArrow) {
        setCursor(c => Math.max(0, c - 1));
      } else if (key.downArrow) {
        setCursor(c => Math.min(Math.max(0, synthetics.length - 1), c + 1));
      } else if (input === 'c' || input === 'C') {
        if (!initialized) return;
        const s = synthetics[cursor];
        if (s && s.status === 'armed') {
          try {
            getWatcher().cancel(s.id);
            setMsg(`Canceled ${s.id.slice(0, 12)}`);
          } catch (e) {
            setMsg(e instanceof Error ? e.message : String(e));
          }
        }
      } else if (input === 'n' || input === 'N') {
        if (!initialized) return;
        setWizard({ step: 'kind' });
        setKindCursor(0);
        setInputBuffer('');
      }
    },
    { isActive: isInteractive },
  );

  // ── Wizard rendering ─────────────────────────────────────────────────────

  if (wizard !== null) {
    return (
      <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="cyan" flexDirection="column">
        <Text bold color="cyan">New Synthetic Wizard</Text>

        {wizard.step === 'kind' && (
          <Box marginTop={1} flexDirection="column">
            <Text>Select kind:</Text>
            {KINDS.map((k, i) => (
              <Box key={k}>
                <Text color={i === kindCursor ? 'cyan' : undefined}>
                  {i === kindCursor ? '▶ ' : '  '}
                </Text>
                <Text inverse={i === kindCursor}>{KIND_LABELS[k]}</Text>
              </Box>
            ))}
            <Box marginTop={1}><Text color="gray">[↑↓] select   [enter] confirm   [esc] cancel</Text></Box>
          </Box>
        )}

        {wizard.step === 'params' && (() => {
          const { kind, fields, fieldIdx } = wizard;
          const defs = kindFields(kind);
          return (
            <Box marginTop={1} flexDirection="column">
              <Text bold>{KIND_LABELS[kind]}</Text>
              {defs.map((d, i) => {
                const done = i < fieldIdx;
                const active = i === fieldIdx;
                const val = done ? (fields[d.key] ?? '') : active ? inputBuffer : '';
                return (
                  <Box key={d.key}>
                    <Text color={done ? 'green' : active ? 'cyan' : 'gray'}>
                      {padRight(d.label + ':', 28)}
                    </Text>
                    {active ? (
                      <Text>{val}<Text color="cyan">█</Text></Text>
                    ) : done ? (
                      <Text color="green">{val}</Text>
                    ) : (
                      <Text color="gray">{d.placeholder}</Text>
                    )}
                  </Box>
                );
              })}
              <Box marginTop={1}><Text color="gray">[type] edit field   [enter] next   [backspace] delete   [esc] back</Text></Box>
            </Box>
          );
        })()}

        {wizard.step === 'confirm' && (
          <Box marginTop={1} flexDirection="column">
            <Text bold>Confirm new synthetic:</Text>
            <Box marginTop={1} borderStyle="single" paddingX={1} flexDirection="column">
              <Text color="gray">{JSON.stringify(wizard.args, null, 2)}</Text>
            </Box>
            <Box marginTop={1}><Text color="gray">[y/enter] submit   [n/esc] cancel</Text></Box>
          </Box>
        )}

        {wizard.step === 'done' && (
          <Box marginTop={1} flexDirection="column">
            <Text color="green">Registered!</Text>
            <Text color="gray">id: {(wizard as { step: 'done'; id: string }).id}</Text>
          </Box>
        )}

        {wizard.step === 'error' && (
          <Box marginTop={1} flexDirection="column">
            <Text color="red">Error: {(wizard as { step: 'error'; message: string }).message}</Text>
            <Box marginTop={1}><Text color="gray">[enter/esc] dismiss</Text></Box>
          </Box>
        )}
      </Box>
    );
  }

  // ── Uninitialized state ──────────────────────────────────────────────────

  if (!initialized) {
    return (
      <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="gray" flexDirection="column">
        <Text color="gray">Watcher daemon not running. Run <Text bold>`kea watch start`</Text> to begin.</Text>
      </Box>
    );
  }

  // ── Group synthetics by ticker ───────────────────────────────────────────

  const byTicker = new Map<string, Synthetic[]>();
  for (const s of synthetics) {
    const arr = byTicker.get(s.ticker) ?? [];
    arr.push(s);
    byTicker.set(s.ticker, arr);
  }

  // Flat row index → synthetic (for cursor navigation).
  const flatRows: Synthetic[] = [];
  for (const rows of byTicker.values()) {
    for (const s of rows) flatRows.push(s);
  }
  const safeCursor = Math.min(cursor, Math.max(0, flatRows.length - 1));

  return (
    <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="white" flexDirection="column">
      <Text bold>Synthetics ({synthetics.length})</Text>

      {synthetics.length === 0 ? (
        <Box marginTop={1}><Text color="gray">No synthetics armed.</Text></Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Text color="gray">
              {'  '}
              {padRight('id', 14)}
              {padRight('kind', 14)}
              {padRight('params', 30)}
              {padRight('state', 20)}
              {padRight('status', 12)}
              {'parent'}
            </Text>
          </Box>
          {Array.from(byTicker.entries()).map(([ticker, rows]) => (
            <Box key={ticker} flexDirection="column">
              <Box marginTop={1}>
                <Text bold color="cyan">{ticker}</Text>
              </Box>
              {rows.map((s) => {
                const flatIdx = flatRows.indexOf(s);
                const selected = flatIdx === safeCursor;
                const ps = paramsSummary(s);
                const ss = stateSummary(s);
                return (
                  <Box key={s.id}>
                    <Text color={selected ? 'cyan' : undefined}>{selected ? '▶ ' : '  '}</Text>
                    <Text inverse={selected}>{padRight(truncate(s.id, 12), 14)}</Text>
                    <Text>{padRight(s.kind, 14)}</Text>
                    <Text>{padRight(truncate(ps, 28), 30)}</Text>
                    <Text color="gray">{padRight(truncate(ss, 18), 20)}</Text>
                    <Text color={statusColor(s.status)}>{padRight(s.status, 12)}</Text>
                    <Text color="gray">{s.parentId ? truncate(s.parentId, 12) : ''}</Text>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      )}

      {msg && <Box marginTop={1}><Text color="green">{msg}</Text></Box>}
      <Box marginTop={1}>
        <Text color="gray">[↑↓] select   [c] cancel selected   [n] new synthetic   [1-4/a/5/6] tabs   [q] quit</Text>
      </Box>
    </Box>
  );
}
