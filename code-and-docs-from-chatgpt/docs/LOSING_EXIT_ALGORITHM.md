# Losing Exit Algorithm

Objective: exit a preselected losing YES/NO position before it resolves to $0.

Priority order:

1. execution certainty
2. speed
3. opportunistic recovery value
4. simplicity

## Full-depth cumulative pricing

Example book:

```text
3¢: 100 shares
2¢: 700 shares
1¢: 10,000 shares
```

For a 500-share chunk, the engine places one 500-share sell at 2¢ because 3¢ alone cannot fill the chunk, but 3¢ + 2¢ can.

## Tiny-liquidity filter

Ignore levels below `minLevelSize` so dust levels do not distort the price.

## Final tail sweep

When remaining position is below `tailSweepThreshold`, sell at floor price immediately.

## Auto-adaptive chunking

`chooseChunkSize` decides per book shape (set `mildAdaptive` in config to override):

- **Fat top** (`topSize ≥ 5 × chunkSize`): use fixed `chunkSize`. Adaptive adds no value when top-of-book swallows the chunk.
- **Thin top + cliff** (`topSize < 5 × chunkSize` AND next-level price drop ≥ 0.2¢): size chunk to `floor(topSize × 0.8)`. Avoids sweeping into worse prices on a single order.
- **Otherwise** (single-level book, or thin top with shallow gap): use fixed `chunkSize`. Sweep cost is bounded by one tick.

Heuristic only ever shrinks chunks — never grows beyond `chunkSize`. Worst case is no-op vs fixed mode.

## Order modes

- **IoC (default)**: marketable-only sell. Fills what crosses, cancels remainder. Safe losing-exit.
- **GTC** (`orderTimeInForce: 'good_till_canceled'`): post one resting sell at limit, exit loop. Combine with `gtcMinPriceDollars` for "never below X¢" drip-exits.

## Crash-safe resume

### Pre-call order_intent (W1.4)

Before calling `createOrder`, the engine writes an `order_intent` journal entry containing the full payload and `clientOrderId`. After `createOrder` returns successfully, the normal `order_placed` entry is appended.

This two-entry protocol closes the crash window where the process could be killed between `createOrder` returning and `order_placed` being written. Without it, the order would exist on Kalshi with no journal trace — `pendingOrders()` would miss it, `remaining` would never be decremented, and an orphaned live order would persist.

### Resume phases

On `/resume`, the engine runs two reconcile phases:

1. **Intent reconcile (`pendingIntents`)**: finds `order_intent` entries with no matching `order_placed` (i.e. the crash window was hit). For each, calls `findOrderByClientOrderId` on Kalshi:
   - **Found**: synthesizes an `order_placed` entry with the discovered `orderId`, then falls through to phase 2.
   - **Not found**: logs a warning; treats as never-placed (no fill credit, no decrement).

2. **Placed reconcile (`pendingOrders`)**: the existing path — finds `order_placed` entries with no `order_reconciled`, calls `getOrder`, reconciles fill/cancel state.

After both phases, `computeFilledTotal()` recomputes `remaining` from journal fills so the live loop picks up accurately.

## Runtime safety bounds

- `safetySubmittedMultiple` caps total submitted shares at `positionSize × multiple`. Defends against parser misreads that would re-submit executed orders.
- `forbiddenTickers` lets users name positions the engine must never touch (off-limits holdings).
