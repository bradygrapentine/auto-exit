/**
 * Shared strategy registry — metadata + per-strategy field descriptors consumed
 * by the TUI strategy picker (SP2.2), the extension strategy picker (SP2.3),
 * and any future surface that needs to render strategy-launching forms.
 *
 * Note: SH-WATCH presets (s-trail, s-step-trail, s-bracketed-exit,
 * s-conditional-roll) are intentionally absent — those are synthetic-watcher
 * arms, not one-shot launchers. They live in the SyntheticsTab flow.
 */

export type StrategyId =
  | 's-aggressive'
  | 's-twap'
  | 's-stealth'
  | 's-pair'
  | 's-pre-resolution-arb'
  | 's-limit-ladder'
  | 's-stop-and-reverse'
  | 's-cash-raise'
  | 's-roll'
  | 's-iceberg'
  | 's-basis-arb'
  | 's-prepend-then-sweep'
  | 's-time-emergency'
  | 's-market-make';

export type DangerLevel = 'low' | 'medium' | 'high';
export type FieldKind = 'string' | 'number' | 'enum' | 'boolean' | 'array';

export interface StrategyFieldDescriptor {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  enumValues?: readonly string[];
  defaultValue?: unknown;
  helpText?: string;
}

export interface StrategyMetadata {
  id: StrategyId;
  displayName: string;
  shortDescription: string;
  fields: StrategyFieldDescriptor[];
  dangerLevel: DangerLevel;
}

const COMMON_TICKER: StrategyFieldDescriptor = {
  name: 'ticker',
  label: 'Ticker',
  kind: 'string',
  required: true,
};
const COMMON_SIDE: StrategyFieldDescriptor = {
  name: 'side',
  label: 'Side',
  kind: 'enum',
  required: true,
  enumValues: ['buy', 'sell'] as const,
};
const COMMON_SIZE: StrategyFieldDescriptor = {
  name: 'size',
  label: 'Size (contracts)',
  kind: 'number',
  required: true,
};

export const STRATEGY_REGISTRY: Readonly<Record<StrategyId, StrategyMetadata>> = {
  's-aggressive': {
    id: 's-aggressive',
    displayName: 'Aggressive (one-shot IoC)',
    shortDescription: 'Single IoC sweep across the spread for full size.',
    dangerLevel: 'high',
    fields: [
      COMMON_TICKER,
      COMMON_SIDE,
      COMMON_SIZE,
      {
        name: 'confirmedAggressive',
        label: 'Confirmed aggressive',
        kind: 'boolean',
        required: true,
        helpText: 'Must be true to bypass the confirmation gate.',
      },
    ],
  },
  's-twap': {
    id: 's-twap',
    displayName: 'TWAP (time-sliced passive)',
    shortDescription: 'Slice size across N intervals, S1 passive each slice.',
    dangerLevel: 'low',
    fields: [
      COMMON_TICKER,
      COMMON_SIDE,
      COMMON_SIZE,
      { name: 'intervalMinutes', label: 'Interval (minutes)', kind: 'number', required: true },
      { name: 'numIntervals', label: 'Number of intervals', kind: 'number', required: true },
    ],
  },
  's-stealth': {
    id: 's-stealth',
    displayName: 'Stealth (jittered IoC chunks)',
    shortDescription: 'Anti-signaling: small randomized chunks, randomized delays, no resting.',
    dangerLevel: 'low',
    fields: [COMMON_TICKER, COMMON_SIDE, COMMON_SIZE],
  },
  's-pair': {
    id: 's-pair',
    displayName: 'Pair / multi-leg (atomic)',
    shortDescription: 'Run multiple legs in parallel with skew throttle + halt-all on unfillable.',
    dangerLevel: 'medium',
    fields: [
      {
        name: 'legs',
        label: 'Legs (ticker, side, size, executionMode)',
        kind: 'array',
        required: true,
        helpText: 'At least 2 legs; no duplicate (ticker, side) pairs.',
      },
      {
        name: 'legSkewPct',
        label: 'Leg skew threshold (0..1)',
        kind: 'number',
        required: false,
        defaultValue: 0.1,
      },
    ],
  },
  's-pre-resolution-arb': {
    id: 's-pre-resolution-arb',
    displayName: 'Pre-resolution arbitrage exit',
    shortDescription: 'Phase 1 IoC at bid+1¢ giving up one tick; phase 2 sweeps remainder.',
    dangerLevel: 'high',
    fields: [
      COMMON_TICKER,
      COMMON_SIDE,
      COMMON_SIZE,
      { name: 'arbTimeboxMs', label: 'Phase 1 timebox (ms)', kind: 'number', required: true },
      { name: 'floorPriceCents', label: 'Floor price (cents)', kind: 'number', required: true },
    ],
  },
  's-limit-ladder': {
    id: 's-limit-ladder',
    displayName: 'Limit ladder (passive multi-rung GTC)',
    shortDescription: 'Post each rung as GTC at start; relies on resume to reconcile.',
    dangerLevel: 'low',
    fields: [
      COMMON_TICKER,
      COMMON_SIDE,
      {
        name: 'rungs',
        label: 'Rungs (priceCents, sizePct)',
        kind: 'array',
        required: true,
        helpText: 'Sum of sizePct must be ≤ 100.',
      },
    ],
  },
  's-stop-and-reverse': {
    id: 's-stop-and-reverse',
    displayName: 'Stop-and-reverse',
    shortDescription: 'Phase 1 aggressive close + phase 2 aggressive open of opposite side.',
    dangerLevel: 'medium',
    fields: [
      { name: 'currentTicker', label: 'Current ticker', kind: 'string', required: true },
      { name: 'currentSide', label: 'Current side', kind: 'enum', required: true, enumValues: ['yes', 'no'] as const },
      { name: 'currentSize', label: 'Current size', kind: 'number', required: true },
      { name: 'targetTicker', label: 'Target ticker', kind: 'string', required: true },
      { name: 'targetSide', label: 'Target side', kind: 'enum', required: true, enumValues: ['yes', 'no'] as const },
      { name: 'targetSize', label: 'Target size', kind: 'number', required: true },
      { name: 'confirmedReverse', label: 'Confirmed reverse', kind: 'boolean', required: true },
    ],
  },
  's-cash-raise': {
    id: 's-cash-raise',
    displayName: 'Cash-raise sequencer',
    shortDescription: 'Sequential sells in agent-supplied order until target cash met or deadline.',
    dangerLevel: 'low',
    fields: [
      {
        name: 'positions',
        label: 'Positions (ticker, side, size, strategyName)',
        kind: 'array',
        required: true,
      },
      { name: 'targetCashDollars', label: 'Target cash ($)', kind: 'number', required: true },
      { name: 'deadlineEpochMs', label: 'Deadline (epoch ms)', kind: 'number', required: true },
    ],
  },
  's-roll': {
    id: 's-roll',
    displayName: 'Roll (passive close + aggressive open)',
    shortDescription: 'Phase 1 S1 passive close current; phase 2 S2 aggressive open target.',
    dangerLevel: 'medium',
    fields: [
      { name: 'currentTicker', label: 'Current ticker', kind: 'string', required: true },
      { name: 'currentSide', label: 'Current side', kind: 'enum', required: true, enumValues: ['yes', 'no'] as const },
      { name: 'currentSize', label: 'Current size', kind: 'number', required: true },
      { name: 'targetTicker', label: 'Target ticker', kind: 'string', required: true },
      { name: 'targetSide', label: 'Target side', kind: 'enum', required: true, enumValues: ['yes', 'no'] as const },
      { name: 'targetSize', label: 'Target size', kind: 'number', required: true },
      { name: 'confirmedRoll', label: 'Confirmed roll', kind: 'boolean', required: true },
    ],
  },
  's-iceberg': {
    id: 's-iceberg',
    displayName: 'Iceberg (single visible quote)',
    shortDescription: 'Hide total size behind a visibleSize GTC; auto-repost on fill.',
    dangerLevel: 'low',
    fields: [
      COMMON_TICKER,
      COMMON_SIDE,
      COMMON_SIZE,
      { name: 'visibleSize', label: 'Visible size', kind: 'number', required: true },
      { name: 'priceCents', label: 'Price (cents)', kind: 'number', required: true },
    ],
  },
  's-basis-arb': {
    id: 's-basis-arb',
    displayName: 'Basis arbitrage (YES + NO atomic buy)',
    shortDescription: 'Buy YES + NO of same ticker when yesAsk + noAsk < 100.',
    dangerLevel: 'medium',
    fields: [
      COMMON_TICKER,
      { name: 'totalDollarBudget', label: 'Total budget ($)', kind: 'number', required: true },
      {
        name: 'perPairSlippageCents',
        label: 'Per-pair slippage tolerance (cents)',
        kind: 'number',
        required: false,
        defaultValue: 0,
      },
    ],
  },
  's-prepend-then-sweep': {
    id: 's-prepend-then-sweep',
    displayName: 'GTC prepend then sweep',
    shortDescription: 'Phase 1 GTC at ask−1¢ for full size; phase 2 S2 sweep remainder.',
    dangerLevel: 'low',
    fields: [
      COMMON_TICKER,
      COMMON_SIDE,
      COMMON_SIZE,
      { name: 'prependWindowMs', label: 'Prepend window (ms)', kind: 'number', required: true },
    ],
  },
  's-time-emergency': {
    id: 's-time-emergency',
    displayName: 'Time-to-expiry emergency unwind',
    shortDescription: 'Clock-driven escalation: T-60 S1 → T-30 S7 → T-10 S2 → T-2 cross-any. Sell-only.',
    dangerLevel: 'high',
    fields: [
      COMMON_TICKER,
      COMMON_SIZE,
      { name: 'contractCloseEpochMs', label: 'Contract close (epoch ms)', kind: 'number', required: true },
    ],
  },
  's-market-make': {
    id: 's-market-make',
    displayName: 'Market making (two-sided GTC)',
    shortDescription: 'Maintain bid + ask GTCs inside the spread; flatten when inventory hits maxInventory.',
    dangerLevel: 'medium',
    fields: [
      COMMON_TICKER,
      { name: 'targetInventory', label: 'Target inventory', kind: 'number', required: true },
      { name: 'maxInventory', label: 'Max inventory (must be > targetInventory)', kind: 'number', required: true },
      { name: 'quoteOffsetCents', label: 'Quote offset inside spread (cents)', kind: 'number', required: true },
    ],
  },
};

export function getStrategyMeta(id: StrategyId): StrategyMetadata {
  const meta = STRATEGY_REGISTRY[id];
  if (!meta) throw new Error(`Unknown strategy id: ${String(id)}`);
  return meta;
}

export function listStrategyIds(): StrategyId[] {
  return Object.keys(STRATEGY_REGISTRY) as StrategyId[];
}
