import React, { useState } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import {
  STRATEGY_REGISTRY,
  listStrategyIds,
  type StrategyId,
  type StrategyMetadata,
  type StrategyFieldDescriptor,
} from '../strategies/registry.js';

// ── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | { phase: 'list' }
  | { phase: 'form'; strategyId: StrategyId; fields: Record<string, string>; fieldIdx: number; errors: Record<string, string> }
  | { phase: 'confirm-danger'; strategyId: StrategyId; args: Record<string, unknown> }
  | { phase: 'preview'; strategyId: StrategyId; args: Record<string, unknown>; loading: boolean; result?: unknown; error?: string }
  | { phase: 'running'; strategyId: StrategyId; args: Record<string, unknown>; status: string[]; done: boolean; error?: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function padRight(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

function dangerColor(level: StrategyMetadata['dangerLevel']): 'green' | 'yellow' | 'red' {
  switch (level) {
    case 'low': return 'green';
    case 'medium': return 'yellow';
    case 'high': return 'red';
  }
}

/** Convert raw string field values to typed args for submission. */
function parseArgs(
  fields: StrategyFieldDescriptor[],
  values: Record<string, string>,
): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = values[f.name] ?? String(f.defaultValue ?? '');
    if (raw === '' && !f.required) continue;
    switch (f.kind) {
      case 'number':
        args[f.name] = Number(raw);
        break;
      case 'boolean':
        args[f.name] = raw === 'true' || raw === '1' || raw === 'yes';
        break;
      case 'array':
        try { args[f.name] = JSON.parse(raw); } catch { args[f.name] = raw; }
        break;
      default:
        args[f.name] = raw;
    }
  }
  return args;
}

/** Validate a single field value. Returns error string or null. */
function validateField(f: StrategyFieldDescriptor, value: string): string | null {
  if (f.required && value.trim() === '') return `${f.label} is required`;
  if (value === '') return null;
  switch (f.kind) {
    case 'number':
      if (isNaN(Number(value))) return `${f.label} must be a number`;
      break;
    case 'boolean':
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase()))
        return `${f.label} must be true/false`;
      break;
    case 'enum':
      if (f.enumValues && !f.enumValues.includes(value))
        return `${f.label} must be one of: ${f.enumValues.join(', ')}`;
      break;
    case 'array':
      try { JSON.parse(value); } catch { return `${f.label} must be valid JSON`; }
      break;
  }
  return null;
}

/** Placeholder hint per field kind. */
function fieldPlaceholder(f: StrategyFieldDescriptor): string {
  if (f.defaultValue !== undefined) return String(f.defaultValue);
  switch (f.kind) {
    case 'number': return '0';
    case 'boolean': return 'true';
    case 'enum': return (f.enumValues ?? [])[0] ?? '';
    case 'array': return '[]';
    default: return '';
  }
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DangerBadge({ level }: { level: StrategyMetadata['dangerLevel'] }): JSX.Element {
  return <Text color={dangerColor(level)}>[{level}]</Text>;
}

// ── Main component ───────────────────────────────────────────────────────────

export function StrategiesTab(): JSX.Element {
  const ids = listStrategyIds();
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<Phase>({ phase: 'list' });
  const [inputBuffer, setInputBuffer] = useState('');
  const [msg, setMsg] = useState<string | undefined>();

  const stdinInfo = useStdin();
  const isInteractive = stdinInfo.isRawModeSupported;

  useInput(
    (input, key) => {
      // ── List phase ───────────────────────────────────────────────────────
      if (phase.phase === 'list') {
        if (key.upArrow) {
          setCursor((c) => Math.max(0, c - 1));
        } else if (key.downArrow) {
          setCursor((c) => Math.min(ids.length - 1, c + 1));
        } else if (key.return) {
          const id = ids[cursor];
          if (id) {
            const meta = STRATEGY_REGISTRY[id];
            const initial: Record<string, string> = {};
            for (const f of meta.fields) {
              if (f.defaultValue !== undefined) initial[f.name] = String(f.defaultValue);
            }
            setPhase({ phase: 'form', strategyId: id, fields: initial, fieldIdx: 0, errors: {} });
            setInputBuffer(initial[meta.fields[0]?.name ?? ''] ?? '');
          }
        }
        return;
      }

      // ── Form phase ───────────────────────────────────────────────────────
      if (phase.phase === 'form') {
        const { strategyId, fields, fieldIdx, errors } = phase;
        const meta = STRATEGY_REGISTRY[strategyId];
        const fieldDefs = meta.fields;

        if (key.escape) {
          setPhase({ phase: 'list' });
          setInputBuffer('');
          return;
        }

        if (key.return) {
          const currentField = fieldDefs[fieldIdx];
          if (!currentField) return;
          const err = validateField(currentField, inputBuffer);
          if (err) {
            setPhase({ ...phase, errors: { ...errors, [currentField.name]: err } });
            return;
          }
          const updatedFields = { ...fields, [currentField.name]: inputBuffer };
          if (fieldIdx < fieldDefs.length - 1) {
            const nextField = fieldDefs[fieldIdx + 1];
            const nextDefault = updatedFields[nextField.name] ?? (nextField.defaultValue !== undefined ? String(nextField.defaultValue) : '');
            setPhase({ phase: 'form', strategyId, fields: updatedFields, fieldIdx: fieldIdx + 1, errors: {} });
            setInputBuffer(nextDefault);
          } else {
            // All fields filled — build args
            const args = parseArgs(fieldDefs, updatedFields);
            if (meta.dangerLevel === 'high') {
              setPhase({ phase: 'confirm-danger', strategyId, args });
            } else {
              setPhase({ phase: 'preview', strategyId, args, loading: true });
              runPreview(strategyId, args).then((result) => {
                setPhase((prev) =>
                  prev.phase === 'preview' ? { ...prev, loading: false, result } : prev,
                );
              }).catch((err) => {
                setPhase((prev) =>
                  prev.phase === 'preview' ? { ...prev, loading: false, error: String(err) } : prev,
                );
              });
            }
            setInputBuffer('');
          }
          return;
        }

        if (key.backspace || key.delete) {
          setInputBuffer((b) => b.slice(0, -1));
          return;
        }

        if (input && input.length === 1 && input >= ' ') {
          setInputBuffer((b) => b + input);
        }
        return;
      }

      // ── Confirm danger phase ──────────────────────────────────────────────
      if (phase.phase === 'confirm-danger') {
        if (key.escape || input === 'n' || input === 'N') {
          setPhase({ phase: 'list' });
          return;
        }
        if (input === 'y' || input === 'Y' || key.return) {
          const { strategyId, args } = phase;
          setPhase({ phase: 'preview', strategyId, args, loading: true });
          runPreview(strategyId, args).then((result) => {
            setPhase((prev) =>
              prev.phase === 'preview' ? { ...prev, loading: false, result } : prev,
            );
          }).catch((err) => {
            setPhase((prev) =>
              prev.phase === 'preview' ? { ...prev, loading: false, error: String(err) } : prev,
            );
          });
          return;
        }
        return;
      }

      // ── Preview phase ────────────────────────────────────────────────────
      if (phase.phase === 'preview') {
        if (phase.loading) return; // wait
        if (key.escape || input === 'q' || input === 'Q') {
          setPhase({ phase: 'list' });
          return;
        }
        if (key.return || input === 'r' || input === 'R') {
          // Run
          const { strategyId, args } = phase;
          const statusLines: string[] = ['Starting…'];
          setPhase({ phase: 'running', strategyId, args, status: statusLines, done: false });
          runStrategy(strategyId, args, (line) => {
            setPhase((prev) =>
              prev.phase === 'running'
                ? { ...prev, status: [...prev.status, line] }
                : prev,
            );
          }).then(() => {
            setPhase((prev) =>
              prev.phase === 'running' ? { ...prev, done: true } : prev,
            );
            setMsg('Strategy completed');
          }).catch((err) => {
            setPhase((prev) =>
              prev.phase === 'running' ? { ...prev, done: true, error: String(err) } : prev,
            );
          });
          return;
        }
        return;
      }

      // ── Running phase ────────────────────────────────────────────────────
      if (phase.phase === 'running') {
        if (input === 'c' || input === 'C') {
          setPhase((prev) =>
            prev.phase === 'running' ? { ...prev, done: true, error: 'Canceled by user' } : prev,
          );
          return;
        }
        if ((input === 'q' || input === 'Q' || key.escape) && phase.done) {
          setPhase({ phase: 'list' });
          return;
        }
        return;
      }
    },
    { isActive: isInteractive },
  );

  // ── Render ────────────────────────────────────────────────────────────────

  // List phase
  if (phase.phase === 'list') {
    return (
      <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="white" flexDirection="column">
        <Text bold>Strategies ({ids.length})</Text>
        <Box marginTop={1} flexDirection="column">
          {ids.map((id, i) => {
            const meta = STRATEGY_REGISTRY[id];
            const selected = i === cursor;
            return (
              <Box key={id}>
                <Text color={selected ? 'cyan' : undefined}>{selected ? '▶ ' : '  '}</Text>
                <Text inverse={selected}>{padRight(meta.displayName, 40)}</Text>
                <Text> </Text>
                <DangerBadge level={meta.dangerLevel} />
              </Box>
            );
          })}
        </Box>
        {msg && <Box marginTop={1}><Text color="green">{msg}</Text></Box>}
        <Box marginTop={1}>
          <Text color="gray">[↑↓] select   [enter] open form   [1-4/a/5-7] tabs   [q] quit</Text>
        </Box>
      </Box>
    );
  }

  // Form phase
  if (phase.phase === 'form') {
    const { strategyId, fields, fieldIdx, errors } = phase;
    const meta = STRATEGY_REGISTRY[strategyId];
    return (
      <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="cyan" flexDirection="column">
        <Box>
          <Text bold color="cyan">{meta.displayName}</Text>
          <Text> </Text>
          <DangerBadge level={meta.dangerLevel} />
        </Box>
        <Text color="gray">{meta.shortDescription}</Text>
        <Box marginTop={1} flexDirection="column">
          {meta.fields.map((f, i) => {
            const done = i < fieldIdx;
            const active = i === fieldIdx;
            const val = done ? (fields[f.name] ?? '') : active ? inputBuffer : '';
            const err = errors[f.name];
            return (
              <Box key={f.name} flexDirection="column">
                <Box>
                  <Text color={done ? 'green' : active ? 'cyan' : 'gray'}>
                    {padRight(f.label + ':', 32)}
                  </Text>
                  {active ? (
                    <Text>{val}<Text color="cyan">█</Text></Text>
                  ) : done ? (
                    <Text color="green">{val}</Text>
                  ) : (
                    <Text color="gray">{fieldPlaceholder(f)}</Text>
                  )}
                  {f.kind === 'enum' && active && (
                    <Text color="gray"> ({(f.enumValues ?? []).join('/')})</Text>
                  )}
                </Box>
                {active && f.helpText && (
                  <Text color="gray">  hint: {f.helpText}</Text>
                )}
                {err && <Text color="red">  ! {err}</Text>}
              </Box>
            );
          })}
        </Box>
        <Box marginTop={1}>
          <Text color="gray">[type] edit   [enter] next   [backspace] delete   [esc] back to list</Text>
        </Box>
      </Box>
    );
  }

  // Confirm danger phase
  if (phase.phase === 'confirm-danger') {
    const meta = STRATEGY_REGISTRY[phase.strategyId];
    return (
      <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="red" flexDirection="column">
        <Text bold color="red">⚠  HIGH DANGER — {meta.displayName}</Text>
        <Text color="yellow">This strategy is marked dangerous. Review args before proceeding.</Text>
        <Box marginTop={1} borderStyle="single" paddingX={1} flexDirection="column">
          <Text color="gray">{JSON.stringify(phase.args, null, 2)}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">[y/enter] proceed to preview   [n/esc] cancel</Text>
        </Box>
      </Box>
    );
  }

  // Preview phase
  if (phase.phase === 'preview') {
    const meta = STRATEGY_REGISTRY[phase.strategyId];
    return (
      <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="white" flexDirection="column">
        <Text bold>Preview — {meta.displayName}</Text>
        {phase.loading ? (
          <Text color="yellow">loading preview…</Text>
        ) : phase.error ? (
          <Text color="red">preview error: {phase.error}</Text>
        ) : (
          <Box marginTop={1} flexDirection="column">
            <Text color="gray">{JSON.stringify(phase.result, null, 2)}</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text color="gray">
            {phase.loading ? 'waiting…' : '[enter/r] run   [esc/q] back to list'}
          </Text>
        </Box>
      </Box>
    );
  }

  // Running phase
  if (phase.phase === 'running') {
    const meta = STRATEGY_REGISTRY[phase.strategyId];
    const lastLines = phase.status.slice(-10);
    return (
      <Box marginTop={1} paddingX={1} borderStyle="round" borderColor={phase.done ? (phase.error ? 'red' : 'green') : 'yellow'} flexDirection="column">
        <Text bold>{meta.displayName} — {phase.done ? (phase.error ? 'error' : 'done') : 'running…'}</Text>
        <Box marginTop={1} flexDirection="column">
          {lastLines.map((line, i) => (
            <Text key={i} color="gray">{line}</Text>
          ))}
        </Box>
        {phase.error && <Box marginTop={1}><Text color="red">{phase.error}</Text></Box>}
        <Box marginTop={1}>
          <Text color="gray">
            {phase.done ? '[q/esc] back to list' : '[c] cancel'}
          </Text>
        </Box>
      </Box>
    );
  }

  return <Text>Unknown phase</Text>;
}

// ── Network helpers (POST /preview and /strategies/run) ──────────────────────

async function runPreview(
  strategyId: StrategyId,
  args: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch('/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategyId, args }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function runStrategy(
  strategyId: StrategyId,
  args: Record<string, unknown>,
  onStatus: (line: string) => void,
): Promise<void> {
  const res = await fetch('/strategies/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategyId, args }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Stream /status updates from the response body (newline-delimited JSON).
  const reader = res.body?.getReader();
  if (!reader) {
    onStatus('No response body — fire-and-forget mode.');
    return;
  }
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed);
        onStatus(typeof event.message === 'string' ? event.message : trimmed);
      } catch {
        onStatus(trimmed);
      }
    }
  }
}
