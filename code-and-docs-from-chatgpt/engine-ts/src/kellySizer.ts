/**
 * kellySizer.ts — Kelly criterion position sizer.
 *
 * No I/O, no side effects. All outputs are deterministic given inputs.
 * Sits alongside harvestPlanner.ts as part of the SH-RECOMMENDER stack.
 *
 * Kelly formula for binary bets:
 *   f* = (p × b − q) / b
 *   where:
 *     b = (1 − market) / market   (odds of winning per dollar risked)
 *     p = edgeProbability          (agent's belief)
 *     q = 1 − p                    (agent's complementary probability)
 *
 * Half-Kelly (fractional = 0.5) is the industry default — reduces variance
 * at the cost of ~25% EV reduction.
 */

export type KellyContext = {
  edgeProbability: number;    // agent's p (their belief)
  marketProbability: number;  // implied from market price
  bankrollDollars: number;
  fractionalKelly?: number;   // default 0.5 (half-Kelly)
  maxPositionDollars?: number; // hard cap from safety.json
};

export type KellySizerOutput = {
  fullKellyFractionOfBankroll: number;
  recommendedFraction: number;   // = fullKelly × fractionalKelly
  recommendedDollars: number;    // capped by maxPositionDollars
  notes: string[];
};

/**
 * Compute a Kelly-optimal position size.
 *
 * @throws {RangeError} if probabilities are out of [0,1] or bankroll ≤ 0
 */
export function computeKellySize(ctx: KellyContext): KellySizerOutput {
  const {
    edgeProbability: p,
    marketProbability: market,
    bankrollDollars,
    fractionalKelly = 0.5,
    maxPositionDollars,
  } = ctx;

  // Validation
  if (p < 0 || p > 1) {
    throw new RangeError(`edgeProbability must be in [0, 1]; got ${p}`);
  }
  if (market < 0 || market > 1) {
    throw new RangeError(`marketProbability must be in [0, 1]; got ${market}`);
  }
  if (bankrollDollars <= 0) {
    throw new RangeError(`bankrollDollars must be positive; got ${bankrollDollars}`);
  }
  if (fractionalKelly < 0 || fractionalKelly > 1) {
    throw new RangeError(`fractionalKelly must be in [0, 1]; got ${fractionalKelly}`);
  }

  const notes: string[] = [];

  // Degenerate p values (0 or 1) — mathematically valid but practically unsafe
  if (p === 0) {
    notes.push('edgeProbability=0: zero probability of win; recommend 0');
    return {
      fullKellyFractionOfBankroll: 0,
      recommendedFraction: 0,
      recommendedDollars: 0,
      notes,
    };
  }
  if (p === 1) {
    notes.push('edgeProbability=1: degenerate certainty; recommend 0 (use limit order instead)');
    return {
      fullKellyFractionOfBankroll: 0,
      recommendedFraction: 0,
      recommendedDollars: 0,
      notes,
    };
  }

  // Market probability edge cases
  if (market <= 0 || market >= 1) {
    notes.push(`marketProbability=${market}: degenerate; recommend 0`);
    return {
      fullKellyFractionOfBankroll: 0,
      recommendedFraction: 0,
      recommendedDollars: 0,
      notes,
    };
  }

  // b = odds per dollar risked: win (1-market)/market dollars per dollar wagered
  const b = (1 - market) / market;
  const q = 1 - p;

  // f* = (p × b − q) / b
  const fStar = (p * b - q) / b;

  if (fStar <= 0) {
    notes.push('negative edge: edge ≤ market probability; recommend 0');
    return {
      fullKellyFractionOfBankroll: fStar,
      recommendedFraction: 0,
      recommendedDollars: 0,
      notes,
    };
  }

  // Apply fractional Kelly multiplier
  const recommendedFraction = fStar * fractionalKelly;
  let recommendedDollars = recommendedFraction * bankrollDollars;

  if (fractionalKelly < 1) {
    notes.push(`fractional Kelly (${fractionalKelly}): recommended fraction = ${recommendedFraction.toFixed(4)}`);
  }

  // Apply hard cap
  if (maxPositionDollars !== undefined && recommendedDollars > maxPositionDollars) {
    notes.push(`capped by maxPositionDollars ($${maxPositionDollars.toFixed(2)})`);
    recommendedDollars = maxPositionDollars;
  }

  return {
    fullKellyFractionOfBankroll: fStar,
    recommendedFraction,
    recommendedDollars,
    notes,
  };
}
