# Kalshi Exit Assistant (KEA)

KEA automates exit and hedge execution for Kalshi binary-option **Positions** using order-book-aware strategies, EV-driven prioritization, and configurable safety guard-rails.

## Language

### Position & valuation

**Position**:
A holding of `N` contracts on one Kalshi market and one **Side** (`yes` or `no`). The unit KEA reasons about for exits.
_Avoid_: holding, contract (a contract is one unit; a position is N of them)

**Side**:
The contract leg held — `yes` or `no`. Determines which book side prices the **Position** and whether **Mid Probability** maps directly or as `1 − midProb`.

**Mid Probability**:
The agent's private belief, in [0, 1], that the YES contract resolves to $1. Distinct from the market-implied probability read off bid/ask.
_Avoid_: probability (always qualify), confidence

**Mark-to-Bid**:
A **Position**'s value if liquidated immediately at the top-of-book bid for its **Side**: `contracts × bid_cents / 100`. The realistic floor.
_Avoid_: mark, current value, market value

**EV Hold**:
Probability-weighted terminal payoff from holding the **Position** to resolution. For a YES side: `size × midProb × $1`; for a NO side, the win probability is `1 − midProb`.
_Avoid_: expected value (always qualify), fair value

**Overvalued**:
The condition `Mark-to-Bid > EV Hold`. The dollar gap is the **Portfolio Plan** ranking signal.
_Avoid_: profitable (different — that's vs. **Cost Basis**)

**Cost Basis**:
Average price paid to acquire the **Position**, in cents. Used for unrealized P&L reporting.

### Execution style

**Aggressive**:
A crossing limit order (typically Immediate-or-Cancel) that takes available liquidity now. Fast, taker fees, slippage.
_Avoid_: market order (Kalshi has no market-order type), taker

**Passive**:
A resting GTC limit at or away from the top-of-book, waiting for incoming flow. Every KEA order is technically a limit — **Passive** vs **Aggressive** describes whether the order rests or crosses, not the order type.
_Avoid_: limit order (drops the resting/crossing distinction), maker

**Harvest**:
The patient liquidation strategy — post resting limits across multiple price levels to minimize slippage. Composed of one or more **Limit Ladders**.
_Avoid_: passive exit, scaling out (different concept)

**Tail Sweep**:
The final **Aggressive** order that liquidates whatever **Harvest** couldn't fill, hitting remaining book depth above a **Floor Price**.
_Avoid_: cleanup, mop-up

**Limit Ladder**:
A multi-rung placement of separate GTC limits at distinct price levels (e.g. 50 @ 26¢, 40 @ 25¢). The mechanism a **Harvest** uses.
_Avoid_: ladder (always qualify), staircase

**Chunking**:
Splitting one logical order into smaller submitted sizes posted in sequence to reduce signaling and preserve depth. Composes with **Limit Ladder** — each rung can itself be chunked.

**Scale-out**:
A planned partial-exit sequence in tranches at price triggers (e.g. 25% at 26¢, 20% at 24¢) — locks gains while keeping residual exposure.

### Synthetics & control

**Synthetic**:
A registered conditional order that watches market state and fires an exit or hedge when its trigger condition is met. Four sub-types: stop-loss, bracket, OCO, trailing-stop. Lifecycle: `armed` → `fired` | `fire_failed` | `canceled`.
_Avoid_: trigger, conditional order, alert

**Watcher**:
The runtime loop that ticks each **Synthetic** against current book state and invokes its fire callback when the trigger condition is met. Persists every state transition to the **Watcher Journal**.

**Watcher Journal**:
The append-only event log of every **Synthetic** registration, fire, fire_failure, and cancellation. Source of truth for replay.

**Floor Price**:
The configured per-strategy minimum price below which **Aggressive** orders (including a **Tail Sweep**) refuse to execute. A **Safety Guard-Rail**.

**Portfolio Plan**:
The ranked exit-sequence artifact emitted across multiple **Positions**, sorted by overvalued dollars and annotated with a recommended execution style per position.
_Avoid_: strategy, schedule

**Safety Guard-Rail**:
A configurable hard limit that blocks orders violating it — **Floor Price**, max submitted multiple, forbidden tickers. Audit-logged on every check.
_Avoid_: safety check, guardrail (one word — be consistent)

## Relationships

- A **Position** is **Overvalued** when **Mark-to-Bid** > **EV Hold**; the gap drives **Portfolio Plan** ranking.
- **Mid Probability** feeds **EV Hold**; for a NO **Side**, the win probability is `1 − midProb`.
- A **Harvest** is built from one or more **Limit Ladders**; each rung may use **Chunking**.
- A **Tail Sweep** runs after a **Harvest** to clear residual size with **Aggressive** execution above the **Floor Price**.
- A **Synthetic** is ticked by the **Watcher**; every transition writes to the **Watcher Journal**.
- A **Synthetic** that fires submits an order subject to **Safety Guard-Rails** before reaching the exchange.
- The **Portfolio Plan** assigns each **Position** an execution style: **Passive** (harvest) or **Aggressive** (sweep).

## Example dialogue

> **Dev:** "We're long this YES contract at 18¢ and the bid's now 26¢. Should we exit **Aggressive** or **Harvest**?"
> **Domain expert:** "Compare **Mark-to-Bid** to **EV Hold** first — if **Mid Probability** is 0.30, EV hold is 30¢, so it's not **Overvalued** even though we're up vs **Cost Basis**. Hold. If mid prob were 0.20, EV hold is 20¢ and mark-to-bid 26¢ — **Overvalued** by 6¢ — then check book depth: thin book wants **Harvest** with **Chunking**, deep book takes **Aggressive**, with a **Tail Sweep** above the **Floor Price** if the harvest stalls. If the goal is to peel off 25% at each price trigger and keep residual exposure, that's **Scale-out**, not **Harvest**."

## Flagged ambiguities

- **"Profitable" vs "Overvalued"** — Resolved: profitable means above **Cost Basis**; overvalued means **Mark-to-Bid** > **EV Hold**. KEA optimizes for the latter.
- **"Winning exit" → "Scale-out"** — Resolved: "winning exit" is deprecated; use **Scale-out** for planned tranche exits at price triggers.
- **"Dry-run" vs "preview"** — Same concept: simulated execution without live orders. Dry-run is the CLI flag; preview is the UI label. Same concept; pick per surface.
- **Maker vs taker fees** — Cost model assumes taker fees; actual Kalshi schedule may offer 0% maker on some contracts. Sensitivity not yet parameterized in **Portfolio Plan** ranking.
- **Losing-only vs profitable exits** — README emphasizes losing-position exits; the **Scale-out** spec describes profitable harvesting. Resolved: KEA applies to both — the trigger is **Overvalued**, regardless of P&L sign.
