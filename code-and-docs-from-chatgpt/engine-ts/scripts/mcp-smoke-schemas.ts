import { z } from 'zod';

// kea_whoami
export const WhoamiSchema = z.object({
  activeProfile: z.string(),
  keyIdLast4: z.string().length(4),
  baseUrl: z.string().url(),
  isDemo: z.boolean(),
});

// kea_balance
export const BalanceSchema = z.object({
  balanceDollars: z.number(),
  portfolioValueDollars: z.number(),
});

// kea_positions — array of position rows
export const PositionRowSchema = z.object({
  ticker: z.string(),
  rawPosition: z.number(),
  side: z.enum(['YES', 'NO']),
  quantity: z.number().nonnegative(),
  exposureDollars: z.number(),
  feesPaidDollars: z.number(),
  realizedPnlDollars: z.number(),
  restingOrdersCount: z.number().nonnegative(),
});
export const PositionsSchema = z.array(PositionRowSchema);

// kea_resting_orders — array
export const RestingOrderSchema = z.object({
  orderId: z.string(),
  ticker: z.string(),
  side: z.string(),
  action: z.string(),
  remaining: z.number().nonnegative(),
  priceDollars: z.string(),
  createdTime: z.string(),
});
export const RestingOrdersSchema = z.array(RestingOrderSchema);

// kea_orderbook
export const OrderbookSchema = z.object({
  yes: z.array(z.object({ priceCents: z.number(), size: z.number() })),
  no: z.array(z.object({ priceCents: z.number(), size: z.number() })),
});

// kea_preview — shape from src/tui/api.ts PreviewResult
// NOTE: plan's schema (ticker/heldSide/positionSize) was incorrect vs real impl.
// Actual shape: topBidCents | null, decisionSize, decisionPriceDollars, etc.
export const PreviewSchema = z.object({
  topBidCents: z.number().nullable(),
  decisionSize: z.number(),
  decisionPriceDollars: z.string(),
  decisionReason: z.string(),
  grossDollars: z.number(),
  feesDollars: z.number(),
  netDollars: z.number(),
  effectiveRatePct: z.number(),
  perLevel: z.array(z.object({
    priceCents: z.number(),
    size: z.number(),
    fillCount: z.number(),
    revenueDollars: z.number(),
    feesDollars: z.number(),
  })),
}).passthrough();

// kea_journal_list — array of JournalSummary rows
// NOTE: plan had { jobId, startedAt, status } — actual shape differs (no status field).
export const JournalSummarySchema = z.object({
  jobId: z.string(),
  filePath: z.string(),
  startedAt: z.string(),
  lastTs: z.string(),
  ticker: z.string(),
  lastKind: z.string(),
  finished: z.boolean(),
  entries: z.number(),
}).passthrough();
export const JournalListSchema = z.array(JournalSummarySchema);

// kea_journal_read — returns { jobId, entries: JournalEntry[] }
// NOTE: plan had z.array(...) but actual response is an object with jobId + entries.
export const JournalReadSchema = z.object({
  jobId: z.string(),
  entries: z.array(z.object({
    ts: z.string(),
    kind: z.string(),
    data: z.unknown(),
  }).passthrough()),
});

// kea_replay — replay summary object
// Fields match mcp.ts:213-228 jsonContent return value exactly.
export const ReplaySchema = z.object({
  jobId: z.string(),
  ticker: z.string(),
  side: z.enum(['yes', 'no']),
  initialPosition: z.number(),
  replayed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  mismatches: z.array(z.object({
    ts: z.string(),
    orderId: z.string(),
    recordedDecision: z.unknown(),
    recomputedDecision: z.unknown(),
    diff: z.array(z.string()),
  })),
  allMatch: z.boolean(),
});
