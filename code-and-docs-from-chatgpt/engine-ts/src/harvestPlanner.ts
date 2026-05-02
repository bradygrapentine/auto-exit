/**
 * harvestPlanner.ts — pure EV-weighted harvest vs hold analysis.
 *
 * No I/O, no side effects. All math operates on the inputs and orderbook snapshot.
 */

import type {
  HarvestPlannerInput,
  HarvestPlannerOutput,
  RiskReductionRow,
  Orderbook,
} from './types.js';

/** Days between two ISO8601 date strings (from → to). Returns 0 if from >= to. */
function daysBetween(from: Date, toISO: string): number {
  const to = new Date(toISO);
  const diffMs = to.getTime() - from.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
}

function buildRiskReductionTable(
  position: number,
  costBasisCents: number,
  marketP: number,
  privateP: number,
  payout: number,
): RiskReductionRow[] {
  const rows: RiskReductionRow[] = [];

  const fractions: Array<{ label: '10%' | '25%' | '50%' | '75%'; f: number }> = [
    { label: '10%', f: 0.10 },
    { label: '25%', f: 0.25 },
    { label: '50%', f: 0.50 },
    { label: '75%', f: 0.75 },
  ];

  for (const { label, f } of fractions) {
    const harvestQty = Math.ceil(position * f);
    const cashLocked = harvestQty * marketP * payout / 100;
    const evGiveUp = harvestQty * (privateP - marketP) * payout / 100;
    const sigmaReduction = harvestQty / position;
    rows.push({ fraction: label, harvestQty, cashLocked, evGiveUp, sigmaReduction });
  }

  // no-loss-floor: harvest enough to recover costBasisCents + fees
  const feesEstimate = position * marketP * payout / 100 * 0.015;
  const breakEvenRevenueCents = costBasisCents + feesEstimate * 100;
  const rawQty = breakEvenRevenueCents / (marketP * payout);
  const noLossQty = Math.max(0, Math.min(position, Math.ceil(rawQty)));
  const noLossCashLocked = noLossQty * marketP * payout / 100;
  const noLossEvGiveUp = noLossQty * (privateP - marketP) * payout / 100;
  const noLossSigma = position > 0 ? noLossQty / position : 0;
  rows.push({
    fraction: 'no-loss-floor',
    harvestQty: noLossQty,
    cashLocked: noLossCashLocked,
    evGiveUp: noLossEvGiveUp,
    sigmaReduction: noLossSigma,
  });

  return rows;
}

function computeGammaProxy(orderbook: Orderbook): { spread: number; gammaProxy: number } {
  // Best bid on YES side
  const yesBids = [...orderbook.yes].sort((a, b) => b.priceCents - a.priceCents);
  // Best ask on YES side = best bid on NO side (since NO bid + YES bid ≈ 100)
  const noAsks = [...orderbook.no].sort((a, b) => b.priceCents - a.priceCents);

  const topBid = yesBids[0]?.priceCents ?? 0;
  // YES ask = 100 - best NO bid
  const topAsk = noAsks[0] != null ? 100 - noAsks[0].priceCents : 100;

  const spread = (topAsk - topBid) / 100;

  // Visible book depth: sum of sizes at best 3 bid levels
  const visibleDepth = yesBids.slice(0, 3).reduce((acc, lvl) => acc + lvl.size, 0);

  const gammaProxy = Math.max(0, spread * visibleDepth);
  return { spread, gammaProxy };
}

export function computeHarvestPlan(
  input: HarvestPlannerInput,
  orderbook: Orderbook,
): HarvestPlannerOutput {
  const payout = input.payoutCents ?? 100;
  const { position, marketP, privateP, costBasisCents } = input;

  // EV crossover: the price at which EV(harvest) = EV(hold) is exactly privateP
  const pStar = privateP;

  // EV table (dollars)
  const evHold = position * (privateP * payout / 100);
  const evHarvestNow = position * (marketP * payout / 100);
  const evPatientScaleOut = position * (0.5 * (marketP + privateP) * payout / 100);

  const harvestIsEvPositive = marketP >= pStar;

  // Risk reduction table
  const riskReductionTable = buildRiskReductionTable(
    position, costBasisCents, marketP, privateP, payout,
  );

  // Greeks
  const delta = marketP;

  let thetaPerDay: number | undefined;
  if (input.catalystExpectedDate) {
    const daysToExpiry = daysBetween(new Date(), input.catalystExpectedDate);
    if (daysToExpiry > 0) {
      thetaPerDay = (privateP - marketP) * payout / 100 * position / daysToExpiry;
    }
  }

  const { gammaProxy } = computeGammaProxy(orderbook);

  // Suggested strategies
  let suggestedStrategies: string[];
  if (marketP >= 0.90) {
    suggestedStrategies = ['S7 scale-out', 'gamma scalp into expiry'];
  } else if (harvestIsEvPositive) {
    suggestedStrategies = ['S1 passive'];
  } else if (privateP > marketP) {
    suggestedStrategies = ['S1 passive at limit', 'hold'];
  } else {
    suggestedStrategies = ['S7 scale-out', 'cut position'];
  }

  return {
    pStar,
    evHold,
    evHarvestNow,
    evPatientScaleOut,
    harvestIsEvPositive,
    riskReductionTable,
    greeks: {
      delta,
      ...(thetaPerDay !== undefined ? { thetaPerDay } : {}),
      gammaProxy,
    },
    suggestedStrategies,
  };
}
