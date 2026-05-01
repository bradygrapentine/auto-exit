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

## Fixed chunk by default

Fixed 500-share chunks are the simplest and most predictable V1 behavior. Mild adaptive chunking is available but off by default.
