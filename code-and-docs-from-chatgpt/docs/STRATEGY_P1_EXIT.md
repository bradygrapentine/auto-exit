# P1 Exit Strategy — KXMOVVAREDISTRICT-26APR21-YES-P1

## Position state (as of 2026-05-01)

| Field | Value |
|---|---|
| Ticker | `KXMOVVAREDISTRICT-26APR21-YES-P1` |
| Strike | "Yes by 0–3%" |
| Held side | YES (long) |
| Quantity | 100,196.51 shares |
| Cost basis (paid) | **$3,439.37** |
| Current best YES bid | $0.0090 (0.9¢) |
| Mark-to-bid value | ~$901.77 |
| Mark-to-bid loss vs cost | **−$2,537.60** (~74%) |
| Market closes | 2027-04-21 |

## Off-limits

`KXMOVVAREDISTRICT-26APR21-YES-P4` ("No * Yes, 3-6%") is **never** to be touched
by this engine. Hard-coded into `forbiddenTickers` in every exit config.

## Decision (locked)

Strategy **#3 — exit at market in phases.** Rationale:
- Holding to expiry gets $0 if YES doesn't reach 0–3% (the market currently
  prices that at <1% probability).
- Drip-GTC at higher prices (#2) requires GTC engine support and patience for
  buyers that may never arrive — the bid level has been depressed for a while.
- Phased market exit extracts ~$700–$900 net (price degrades as we eat through
  depth; fees ~7%) instead of $0 at expiry. Quick, mechanical, irreversible.

## Phased execution plan

Each phase uses `forbiddenTickers: ["KXMOVVAREDISTRICT-26APR21-YES-P4"]` and
`heldSide: "yes"`.

### Phase 1 — small live test (5% of position)

Validates the engine end-to-end with current parsers/safety guards under real
size, without committing the full position. ~$45 expected recovery.

Config: `config.local.exit-phase1.json`
- `positionSize`: 5000
- `chunkSize`: 500
- `maxOrders`: 10
- `safetySubmittedMultiple`: 1.1 (cap = 5500 max submitted)
- `floorPriceCents`: 0
- `tailSweepThreshold`: 0
- `preflight`: true
- `dryRun`: true initially; flip to false in the start patch

Expected outcome: 5,000 YES shares sold, mostly at 0.9¢ (top of book has
~1985 size at 0.9¢), some at 0.8¢/0.7¢/0.6¢ as depth gets eaten through.

### Phase 2 — bulk exit (after Phase 1 success)

Runs the remaining ~95,000 shares. Requires raising the hardcoded
`chunkSize <= 500` V1 safety cap to allow larger chunks (smaller chunks =
more orders = more fees, since Kalshi charges per-contract).

Config: `config.local.exit-phase2.json`
- `positionSize`: 95000 (or whatever is left after Phase 1)
- `chunkSize`: 2000 (requires raising the V1 cap, see code change in the same wave)
- `maxOrders`: 50
- `safetySubmittedMultiple`: 1.1 (cap = 104,500 max submitted)

### Phase 3 — tail sweep

Sells whatever remains (likely <100 shares due to fractional position 100196.51
having a leftover .51 plus rounding). Tiny fees, finalizes the exit.

Config: `config.local.exit-phase3.json`
- `positionSize`: <whatever remains>
- `chunkSize`: ≤ remaining
- `maxOrders`: 1
- `tailSweepThreshold`: <remaining> (sweeps at floor, takes whatever bid is there)

## Hard rules during exit

1. **Always run Preview before flipping `dryRun: false`.** Verify the price/payload
   match expectation; reject if anything looks off.
2. **Keep the kill switch armed.** `touch STOP` aborts mid-loop.
3. **Tail the journal in another terminal:** `tail -F ~/.kalshi-exit-assistant/jobs/*.jsonl`.
4. **Never exceed `safetySubmittedMultiple: 1.1`.** That's the runaway-protection
   line.
5. **Verify position decremented after each phase** via `capture-readonly` —
   compare `position_fp` before/after; P4's `position_fp` must remain unchanged.

## What success looks like

- ~$700–$900 actual net receive (gross sell value minus Kalshi fees)
- Realized loss on Kalshi reflects the ~74% mark vs. cost
- P1 position drops to 0 (or near-0 with fractional remainder)
- P4 position **unchanged**
