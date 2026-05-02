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
  // Guard: zero position → all rows are zero (avoids harvestQty / position = NaN)
  if (position === 0) {
    const fractionLabels: RiskReductionRow['fraction'][] = ['10%', '25%', '50%', '75%', 'no-loss-floor'];
    return fractionLabels.map((fraction) => ({
      fraction,
      harvestQty: 0,
      cashLocked: 0,
      evGiveUp: 0,
      sigmaReduction: 0,
    }));
  }

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

  // no-loss-floor: harvest enough to recover costBasisCents + fees (closed-form, no circularity)
  let noLossFloor: RiskReductionRow;
  if (marketP === 0) {
    // Bid is zero — cannot recover cost basis by harvesting; harvest everything, cash = 0
    noLossFloor = {
      fraction: 'no-loss-floor',
      harvestQty: position,
      cashLocked: 0,
      evGiveUp: 0,
      sigmaReduction: 1,
    };
  } else {
    // Solve: noLossQty × marketP × payout/100 × (1 - 0.015) >= costBasisCents / 100
    const netPricePerContract = (marketP * payout / 100) * (1 - 0.015);
    const noLossQty = Math.max(0, Math.min(position, Math.ceil((costBasisCents / 100) / netPricePerContract)));
    const noLossCashLocked = noLossQty * marketP * payout / 100;
    const noLossEvGiveUp = noLossQty * (privateP - marketP) * payout / 100;
    const noLossSigma = noLossQty / position;
    noLossFloor = {
      fraction: 'no-loss-floor',
      harvestQty: noLossQty,
      cashLocked: noLossCashLocked,
      evGiveUp: noLossEvGiveUp,
      sigmaReduction: noLossSigma,
    };
  }
  rows.push(noLossFloor);

  return rows;
}

function computeGammaProxy(orderbook: Orderbook): { spread: number; gammaProxy: number } {
  // Best bid on YES side
  const yesBids = [...orderbook.yes].sort((a, b) => b.priceCents - a.priceCents);
  // Best ask on YES side = best bid on NO side (since NO bid + YES bid ≈ 100)
  const noAsks = [...orderbook.no].sort((a, b) => b.priceCents - a.priceCents);

  // Keep both sides in raw cents, divide once — avoids mixed-unit bug
  const topBidCents = yesBids[0] != null ? yesBids[0].priceCents : 0;
  // YES ask = 100 - best NO bid (in cents)
  const topAskCents = noAsks[0] != null ? (100 - noAsks[0].priceCents) : 100;
  const spreadCents = Math.max(0, topAskCents - topBidCents);
  const spread = spreadCents / 100; // now in probability space (0–1)

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
  // Patient scale-out EV: assumes gradual exit averaging between current bid (marketP)
  // and private estimate (privateP) — models drip selling as price converges to privateP
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
      thetaPerDay = (privateP - marketP) * payout / 100 / daysToExpiry;  // per-contract, like delta
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
