# Winning Exit Algorithm Design

Winning exits should be a separate mode because the objective changes.

Losing exit: take executable liquidity quickly.
Winning exit: avoid collapsing price while still exiting.

## Passive-first approach

1. Read bid/ask.
2. If spread is wide, post inside spread near the ask.
3. Timebox the passive order.
4. If unfilled, cancel and fallback toward bid.
5. Repeat by chunk.

## Example

If holding YES:

```text
YES bid: 94¢
YES ask: 97¢
```

A balanced winning exit could post:

```text
Sell YES at 96¢
```

Then fallback to 95¢ or 94¢ if not filled.

## V1 status

Designed but not live. Validate losing exits first.
