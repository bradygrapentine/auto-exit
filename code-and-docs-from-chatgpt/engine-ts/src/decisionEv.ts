/**
 * decisionEv.ts — pure EV computation for discrete decision actions.
 *
 * No I/O, no side effects. Agent supplies all market state via inputs.
 * Sits alongside harvestPlanner.ts as part of the SH-RECOMMENDER stack.
 */

export type DecisionContext = {
  position?: { side: 'yes' | 'no'; size: number; costBasisCents: number };
  ticker: string;
  bidCents: number;
  askCents: number;
  midProbability: number;    // agent's belief (0..1)
  feesEstimateCents?: number;
  timeToCloseHours?: number;
};

export type DecisionAction =
  | 'enter-yes'
  | 'enter-no'
  | 'hold'
  | 'exit-aggressive'
  | 'exit-passive'
  | 'scale-out-50'
  | 'scale-out-25'
  | 'no-action';

/**
 * Compute the expected dollar payoff for a given action under the agent's
 * midProbability belief.
 *
 * Payout convention: Kalshi binary contract pays $1.00 (100 cents) on YES.
 * All internal arithmetic is in cents; return value is converted to dollars.
 *
 * @throws {RangeError} if midProbability is outside [0, 1]
 * @throws {Error} if an exit/scale-out action is requested without a position
 */
export function computeDecisionEV(
  ctx: DecisionContext,
  action: DecisionAction,
): { evDollars: number; rationale: string } {
  const { midProbability, bidCents, askCents, feesEstimateCents = 0, position } = ctx;

  // Validation
  if (midProbability < 0 || midProbability > 1) {
    throw new RangeError(`midProbability must be in [0, 1]; got ${midProbability}`);
  }

  const payoutCents = 100; // Kalshi YES contract pays 100¢ on resolution

  switch (action) {
    case 'enter-yes': {
      // EV(enter-yes) = midProbability × $1.00 − askCents/100 − fees
      // Interpretation: pay askCents to enter; receive 100¢ if YES resolves.
      const grossEv = midProbability * payoutCents;
      const netEvCents = grossEv - askCents - feesEstimateCents;
      const evDollars = netEvCents / 100;
      return {
        evDollars,
        rationale:
          `enter-yes: p×$1 − ask − fees = ${midProbability.toFixed(3)}×$1.00 − $${(askCents / 100).toFixed(2)} − $${(feesEstimateCents / 100).toFixed(2)} = $${evDollars.toFixed(4)}`,
      };
    }

    case 'enter-no': {
      // EV(enter-no) = (1 − midProbability) × $1.00 − (100 − bidCents)/100 − fees
      // Entering NO costs (100 - bid) cents; pays out if NO resolves.
      const noAskCents = payoutCents - bidCents; // implied NO ask
      const grossEv = (1 - midProbability) * payoutCents;
      const netEvCents = grossEv - noAskCents - feesEstimateCents;
      const evDollars = netEvCents / 100;
      return {
        evDollars,
        rationale:
          `enter-no: (1−p)×$1 − noAsk − fees = ${(1 - midProbability).toFixed(3)}×$1.00 − $${(noAskCents / 100).toFixed(2)} − $${(feesEstimateCents / 100).toFixed(2)} = $${evDollars.toFixed(4)}`,
      };
    }

    case 'hold': {
      // EV(hold) = size × (midProbability × payout − costBasis)
      // Holding earns the expected terminal payout minus what you already paid.
      if (!position) {
        throw new Error(`action 'hold' requires a position`);
      }
      const { size, costBasisCents: cb, side } = position;
      // For YES side: terminal payout if wins = 100¢; for NO side: wins when NO resolves.
      const winProb = side === 'yes' ? midProbability : 1 - midProbability;
      const grossEv = size * winProb * payoutCents;
      const netEvCents = grossEv - cb;
      const evDollars = netEvCents / 100;
      return {
        evDollars,
        rationale:
          `hold: size×(winProb×$1 − costBasis) = ${size}×(${winProb.toFixed(3)}×$1.00 − $${(cb / 100).toFixed(2)}) = $${evDollars.toFixed(4)}`,
      };
    }

    case 'exit-aggressive': {
      // EV(exit-aggressive) = size × bidCents/100 − fees
      // Selling aggressively = taking the bid price immediately.
      if (!position) {
        throw new Error(`action 'exit-aggressive' requires a position`);
      }
      const { size, side } = position;
      // For YES: sell at bidCents. For NO: sell at (100 - askCents) = implied NO bid.
      const exitPriceCents = side === 'yes' ? bidCents : payoutCents - askCents;
      const grossRevenueCents = size * exitPriceCents;
      const netRevenueCents = grossRevenueCents - feesEstimateCents;
      const evDollars = netRevenueCents / 100;
      return {
        evDollars,
        rationale:
          `exit-aggressive: size×bid − fees = ${size}×$${(exitPriceCents / 100).toFixed(2)} − $${(feesEstimateCents / 100).toFixed(2)} = $${evDollars.toFixed(4)}`,
      };
    }

    case 'exit-passive': {
      // EV(exit-passive) = size × midCents/100 − fees
      // Passive exit posts at mid (expected fill between bid and ask).
      if (!position) {
        throw new Error(`action 'exit-passive' requires a position`);
      }
      const { size, side } = position;
      const midCents = (bidCents + askCents) / 2;
      const exitPriceCents = side === 'yes' ? midCents : payoutCents - midCents;
      const grossRevenueCents = size * exitPriceCents;
      const netRevenueCents = grossRevenueCents - feesEstimateCents;
      const evDollars = netRevenueCents / 100;
      return {
        evDollars,
        rationale:
          `exit-passive: size×mid − fees = ${size}×$${(exitPriceCents / 100).toFixed(2)} − $${(feesEstimateCents / 100).toFixed(2)} = $${evDollars.toFixed(4)}`,
      };
    }

    case 'scale-out-50': {
      // EV(scale-out-50) = EV(exit-aggressive) on 50% of position
      // Half position sold aggressively; remaining half held.
      if (!position) {
        throw new Error(`action 'scale-out-50' requires a position`);
      }
      const halfSize = Math.floor(position.size / 2);
      const halfCtx: DecisionContext = {
        ...ctx,
        position: { ...position, size: halfSize },
      };
      const halfEv = computeDecisionEV(halfCtx, 'exit-aggressive');
      const evDollars = halfEv.evDollars;
      return {
        evDollars,
        rationale:
          `scale-out-50: exit-aggressive on 50% (${halfSize} of ${position.size}) → $${evDollars.toFixed(4)}`,
      };
    }

    case 'scale-out-25': {
      // EV(scale-out-25) = EV(exit-aggressive) on 25% of position
      if (!position) {
        throw new Error(`action 'scale-out-25' requires a position`);
      }
      const quarterSize = Math.floor(position.size / 4);
      const quarterCtx: DecisionContext = {
        ...ctx,
        position: { ...position, size: quarterSize },
      };
      const quarterEv = computeDecisionEV(quarterCtx, 'exit-aggressive');
      const evDollars = quarterEv.evDollars;
      return {
        evDollars,
        rationale:
          `scale-out-25: exit-aggressive on 25% (${quarterSize} of ${position.size}) → $${evDollars.toFixed(4)}`,
      };
    }

    case 'no-action': {
      // EV(no-action) = $0.00 (do nothing, no change in expected value)
      return {
        evDollars: 0,
        rationale: 'no-action: no trade placed; EV contribution = $0.00',
      };
    }

    default: {
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${String(_exhaustive)}`);
    }
  }
}
