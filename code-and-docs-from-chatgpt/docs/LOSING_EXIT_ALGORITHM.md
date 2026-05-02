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

`order_placed` is journaled before reconciliation. On `/resume`, engine reads the journal, calls `getOrder` for any orphaned order, reconciles fill state, and avoids double-submission. Live-validated 2026-05-01.

## Runtime safety bounds

- `safetySubmittedMultiple` caps total submitted shares at `positionSize × multiple`. Defends against parser misreads that would re-submit executed orders.
- `forbiddenTickers` lets users name positions the engine must never touch (off-limits holdings).
