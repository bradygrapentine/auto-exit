# Execution Engine

## Core Loop
1. Fetch position
2. Fetch orderbook
3. Compute price via cumulative depth
4. Place order
5. Wait / check fill
6. Retry or continue

## State Machine

States:
- INIT
- FETCHING
- EXECUTING
- WAITING
- COMPLETE
- ERROR

Transitions:
INIT → FETCHING → EXECUTING → WAITING → EXECUTING / COMPLETE
ERROR → RETRY / ABORT

## Algorithms

### Cumulative Pricing
- Sum bid sizes until >= chunk size
- Use lowest price in that set

### Tail Sweep
- If remaining < chunkSize → force 1¢

### Tiny Liquidity Filter
- Ignore levels < threshold (e.g., 50 shares)
