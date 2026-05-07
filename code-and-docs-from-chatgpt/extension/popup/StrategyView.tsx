/**
 * StrategyView.tsx
 * Renders a form for the selected strategy from STRATEGY_REGISTRY.
 * Auto-prefills ticker/size from TickerField/SizeField where applicable.
 * Submit → POST /strategies/run. High-danger strategies gate behind ConfirmModal.
 * Post-submit status streaming via StatusView.
 */

import { useState } from 'react';
import { STRATEGY_REGISTRY, listStrategyIds } from '../../engine-ts/src/strategies/registry';
import type { StrategyId, StrategyFieldDescriptor } from '../../engine-ts/src/strategies/registry';
import { StrategyDropdown } from './StrategyDropdown';
import { TickerField } from './TickerField';
import { SizeField } from './SizeField';
import { ConfirmModal } from './ConfirmModal';
import { StatusView, type TerminalStatus } from './StatusView';

export interface ExecutionSummary {
  strategyId: StrategyId;
  jobId: string;
  filledTotal: number;
  initialPosition: number;
  ordersAttempted: number;
  durationMs: number;
}

const ENGINE_BASE = 'http://localhost:7777';

// ── Types ────────────────────────────────────────────────────────────────────

export type FieldValues = Record<string, string>;

// ── Pure helpers (exported for testing) ──────────────────────────────────────

/** Build POST body from field values + strategy id. */
export function buildRunPayload(
  strategyId: StrategyId,
  fieldValues: FieldValues,
): Record<string, unknown> {
  const meta = STRATEGY_REGISTRY[strategyId];
  const payload: Record<string, unknown> = { strategyId };
  for (const field of meta.fields) {
    const raw = fieldValues[field.name] ?? '';
    if (raw === '' && !field.required) continue;
    if (field.kind === 'number') {
      payload[field.name] = raw === '' ? undefined : Number(raw);
    } else if (field.kind === 'boolean') {
      payload[field.name] = raw === 'true' || raw === '1';
    } else {
      payload[field.name] = raw;
    }
  }
  return payload;
}

/** Validate required fields — returns array of missing field names. */
export function missingRequired(
  meta: ReturnType<typeof STRATEGY_REGISTRY[StrategyId]['fields'][number] extends infer F ? () => F : never> extends never
    ? never
    : { fields: StrategyFieldDescriptor[] },
  fieldValues: FieldValues,
): string[] {
  return meta.fields
    .filter((f) => f.required && !(fieldValues[f.name] ?? '').trim())
    .map((f) => f.name);
}

/** POST to /strategies/run. Returns jobId from response. */
export async function postStrategyRun(
  payload: Record<string, unknown>,
  serverUrl: string = ENGINE_BASE,
  fetchFn: typeof fetch = fetch,
): Promise<{ jobId: string | null; error: string | null }> {
  try {
    const res = await fetchFn(`${serverUrl}/strategies/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { jobId: null, error: `HTTP ${res.status}` };
    const json = await res.json() as { jobId?: string };
    return { jobId: json.jobId ?? 'dispatched', error: null };
  } catch (err) {
    return { jobId: null, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Field renderer ────────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  detectedTicker,
  detectedSize,
}: {
  field: StrategyFieldDescriptor;
  value: string;
  onChange: (v: string) => void;
  detectedTicker?: string | null;
  detectedSize?: number | null;
}) {
  const base: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '4px 6px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
  };

  // ticker + size get the prefill components
  if (field.name === 'ticker') {
    return (
      <TickerField
        detectedTicker={detectedTicker ?? null}
        value={value}
        onChange={onChange}
        onUseDetected={() => detectedTicker && onChange(detectedTicker)}
      />
    );
  }
  if (field.name === 'size') {
    return (
      <SizeField
        detectedSize={detectedSize ?? null}
        ambiguous={false}
        value={value}
        onChange={onChange}
        onUseDetected={() => detectedSize != null && onChange(String(detectedSize))}
      />
    );
  }

  if (field.kind === 'enum' && field.enumValues) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} style={base}>
        <option value="">— select —</option>
        {field.enumValues.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    );
  }
  if (field.kind === 'boolean') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} style={base}>
        <option value="">— select —</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  if (field.kind === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.helpText ?? field.label}
        style={base}
      />
    );
  }
  // string / array — text input
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.helpText ?? field.label}
      style={base}
    />
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface StrategyViewProps {
  /** Externally detected ticker from the Kalshi page (passed down from App). */
  detectedTicker?: string | null;
  /** Externally detected position size. */
  detectedSize?: number | null;
  /** Allow injection of serverUrl + fetchFn for tests. */
  serverUrl?: string;
  fetchFn?: typeof fetch;
  /** Initial strategy selection (for testing). */
  initialStrategy?: StrategyId | '';
  /** Fired once when the post-submit status stream reaches terminal state. */
  onComplete?: (summary: ExecutionSummary) => void;
}

export function StrategyView({
  detectedTicker = null,
  detectedSize = null,
  serverUrl = ENGINE_BASE,
  fetchFn = fetch,
  initialStrategy = '',
  onComplete,
}: StrategyViewProps) {
  const [selectedId, setSelectedId]       = useState<StrategyId | ''>(initialStrategy);
  const [fieldValues, setFieldValues]     = useState<FieldValues>({});
  const [showConfirm, setShowConfirm]     = useState(false);
  const [jobId, setJobId]                 = useState<string | null>(null);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [submitting, setSubmitting]       = useState(false);

  const ids = listStrategyIds();
  const meta = selectedId !== '' ? STRATEGY_REGISTRY[selectedId] : null;

  function handleStrategyChange(id: StrategyId) {
    setSelectedId(id);
    setFieldValues({});   // reset fields on strategy change
    setJobId(null);
    setSubmitError(null);
  }

  function setField(name: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  }

  async function doSubmit() {
    if (!selectedId || selectedId === '') return;
    setSubmitting(true);
    setSubmitError(null);
    const payload = buildRunPayload(selectedId, fieldValues);
    const { jobId: id, error } = await postStrategyRun(payload, serverUrl, fetchFn);
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
    } else {
      setJobId(id);
    }
  }

  function handleSubmitClick() {
    if (!meta) return;
    if (meta.dangerLevel === 'high') {
      setShowConfirm(true);
    } else {
      doSubmit();
    }
  }

  function handleConfirmRun() {
    setShowConfirm(false);
    doSubmit();
  }

  const tickerValue = fieldValues['ticker'] ?? (detectedTicker ?? '');
  const sizeValue   = fieldValues['size']   ?? (detectedSize != null ? String(detectedSize) : '');

  // Seed detected values into fieldValues on first render via initial state
  // (we use tickerValue/sizeValue derived above rather than mutating state)

  return (
    <div
      data-testid="strategy-view"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 10,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        maxWidth: 360,   // panel is narrow
        overflowX: 'hidden',
      }}
    >
      {/* Dropdown */}
      <StrategyDropdown selected={selectedId} onChange={handleStrategyChange} />

      {/* Per-strategy form */}
      {meta && (
        <div
          data-testid="strategy-form"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {meta.fields.map((field) => {
            // For ticker/size, use derived prefill values
            const rawVal = field.name === 'ticker'
              ? tickerValue
              : field.name === 'size'
                ? sizeValue
                : (fieldValues[field.name] ?? (field.defaultValue != null ? String(field.defaultValue) : ''));

            return (
              <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label
                  htmlFor={`field-${field.name}`}
                  style={{ fontSize: 11, color: '#6b7280' }}
                >
                  {field.label}
                  {field.required && <span style={{ color: '#dc2626' }}> *</span>}
                </label>
                <FieldInput
                  field={field}
                  value={rawVal}
                  onChange={(v) => setField(field.name, v)}
                  detectedTicker={detectedTicker}
                  detectedSize={detectedSize}
                />
                {field.helpText && (
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{field.helpText}</span>
                )}
              </div>
            );
          })}

          {/* Submit */}
          <button
            data-testid="run-button"
            onClick={handleSubmitClick}
            disabled={submitting}
            style={{
              marginTop: 4,
              padding: '6px 12px',
              borderRadius: 4,
              border: 'none',
              background: meta.dangerLevel === 'high' ? '#b91c1c' : '#1d4ed8',
              color: '#fff',
              fontSize: 12,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {submitting ? 'Launching…' : `Run ${meta.displayName}`}
          </button>

          {submitError && (
            <div
              data-testid="submit-error"
              style={{ color: '#dc2626', fontSize: 11 }}
            >
              Error: {submitError}
            </div>
          )}
        </div>
      )}

      {/* No strategy selected empty state */}
      {!meta && (
        <div
          data-testid="empty-state"
          style={{ color: '#9ca3af', fontSize: 12, padding: '8px 0' }}
        >
          Select a strategy above to get started.
        </div>
      )}

      {/* Live status stream */}
      {jobId && (
        <div data-testid="status-view-wrapper">
          <StatusView
            jobId={jobId}
            serverUrl={serverUrl}
            onTerminal={(t: TerminalStatus) => {
              if (selectedId !== '' && onComplete) {
                onComplete({
                  strategyId: selectedId,
                  jobId: t.jobId,
                  filledTotal: t.filledTotal,
                  initialPosition: t.initialPosition,
                  ordersAttempted: t.ordersAttempted,
                  durationMs: t.durationMs,
                });
              }
            }}
          />
        </div>
      )}

      {/* High-danger confirm modal */}
      {showConfirm && meta && (
        <ConfirmModal
          ticker={tickerValue}
          side={fieldValues['side'] ?? 'yes'}
          size={Number(sizeValue) || 0}
          onConfirm={handleConfirmRun}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
