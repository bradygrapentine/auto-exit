# Engine Strategy Library

The engine owns *how* orders are executed. The agent (LLM via MCP, or a human via CLI/TUI) owns
*whether* to trade, *which side*, *how much*, and *which strategy*. This division is strict: no
strategy encodes return-multiple targets, portfolio-ranking logic, or entry-condition guards —
those are agent decisions. The engine receives a request with a named strategy + parameters and
executes it mechanically.

Strategies are **side-parameterized** where the same execution logic applies to both buying and
selling. S1 passive, S2 aggressive, S3 TWAP, S4 stealth, S5 pair, and S8 limit ladder all take
`side: 'buy' | 'sell'` rather than existing as paired buy/sell variants. S6, S7, S9, S10, S11,
S16 are sell-specific or composition patterns; S12–S15 are special modes. This collapsed the prior
W2/EW2 split into 16 unified strategies.

All strategies respect `safety.json` guards (position floor/ceiling, `safetySubmittedMultiple`
runaway guard, concentration caps from W1.3 where applicable). Individual strategies note
additional per-strategy constraints below. Implementation status tracks against Phase 7 of
[BACKLOG.md](./BACKLOG.md) (section "S — Strategy library (unified, side-parameterized)").

---

## How to choose a strategy

Start here. Answer the first applicable question and follow the branch.

- **Need to be flat immediately?** News event, panic, thesis invalidated.
  → **S2 aggressive**. No resting orders; single IoC for full size.

- **Need to flip direction (exit + open opposite)?**
  → **S9 stop-and-reverse** (composes two S2 calls internally).

- **High conviction, no time pressure, want to earn the spread?**
  → **S1 passive**. Post-and-walk, tighten one tick per timebox.

- **Large size, many hours, want to spread execution over time?**
  - No concern about showing footprint → **S3 TWAP**.
  - Want to hide total remaining behind one visible quote → **S13 iceberg**.
  - Worried about signaling (informed flow suspected) → **S4 stealth**.

- **Want to take partial profits at multiple price targets?**
  - Active (price-triggered, each rung uses passive fill) → **S7 scale-out ladder**.
  - Passive (pre-placed multi-rung GTCs, walk away) → **S8 limit ladder**.

- **Market approaching expiry? Book thinning, price converged near $1 or $0?**
  - Hours to expiry, standard slippage acceptable → **S6 pre-resolution arb**.
  - Position must be gone before contract closes; escalate as clock compresses → **S16 time-to-expiry emergency**.

- **Multi-leg position (spread, hedge, range bet)?**
  - Same-market YES + NO for terminal-value arb → **S14 cross-resolution basis arb**.
  - Different tickers, need atomic progress → **S5 pair / multi-leg**.

- **Rolling into the next contract cycle?**
  → **S11 roll** (S1 passive exit + S2 aggressive entry on next ticker).

- **Need $X in cash by a deadline, have several positions to sell?**
  → **S10 cash-raise sequencer**. Agent supplies the ordered list; engine halts when target met.

- **Want to provide liquidity and harvest spread on a stable wide-spread market?**
  → **S12 liquidity-providing** (two-sided market making).

- **Want passive fill first, then sweep remainder?**
  → **S15 GTC-prepend then sweep** (passive window → S2 on remainder).

---

## Strategies

### S1 — Passive (post-and-walk, side-parameterized)

**Purpose.** Harvest passive flow by posting inside the spread and walking toward mid if unfilled.

**When to use.** High conviction, low urgency. Winning exits where collapsing your own price is a
concern. Patient entries where crossing the spread is unnecessary. Works for both buys and sells;
use S2 if speed outweighs price.

**Agent inputs.**
```
{
  ticker: string,
  side: "buy" | "sell",
  size: number,
  maxPriceCents?: number,   // sell: floor; buy: ceiling
  minPriceCents?: number,   // buy only
  passiveTimeboxMs?: number // default 60000
}
```

**Behavior.** Read bid/ask. If spread < 1¢, fall through to S2 aggressive. Post one chunk GTC at
`ask − 1¢` (sell) or `bid + 1¢` (buy). Wait `passiveTimeboxMs`. Cancel unfilled remainder; next
iteration shifts one tick toward the spread. Repeat until filled or floor/ceiling hit.

**Safety guards.** `safety.json` floor/ceiling always applies. `safetySubmittedMultiple` caps
total submitted vs position size. Spread collapse → automatic S2 fallback.

**Status.** 🧊 Planned. Phase 7. Dependency: W1.5 buy primitive (buy side).

**Example call.**
```
kea_strategy_run({
  strategy: "passive",
  ticker: "KXFOO-26APR21-YES",
  side: "sell",
  size: 5000,
  maxPriceCents: 75
})
```

---

### S2 — Aggressive (cross-the-spread, max speed)

**Purpose.** Execute immediately, price is secondary to speed.

**When to use.** News-driven exit. Fresh conviction entry that needs to fill before the market
moves. Any situation where being in/out *now* matters more than 1–2¢ of slippage. Also used as a
building block inside S9, S11, S15, S16.

**Agent inputs.**
```
{
  ticker: string,
  side: "buy" | "sell",
  size: number
}
```

**Behavior.** One IoC order for the full `size` at `bid` (sell) / `ask` (buy), or one tick into
the book for slightly better fill behavior. No chunking, no adaptive sizing, no inter-iter delay.

**Safety guards.** `safetySubmittedMultiple` still applies as runaway guard. CLI requires
`--confirm aggressive`; TUI requires 2-keystroke confirm; extension requires modal.

**Status.** 🧊 Planned. Phase 7. Dependency: W1.5 buy primitive (buy side). ~4 hours after W1.5.

**Example call.**
```
kea_strategy_run({
  strategy: "aggressive",
  ticker: "KXFOO-26APR21-YES",
  side: "sell",
  size: 5000
})
```

---

### S3 — TWAP (time-sliced, side-parameterized)

**Purpose.** Spread large execution over time; predictable average price regardless of intraday
moves.

**When to use.** Large position, no urgency, want smooth execution over hours or days. When
minimizing market impact matters more than capturing a specific price level. Does not hide
footprint (use S4 stealth or S13 iceberg if anti-signaling matters).

**Agent inputs.**
```
{
  ticker: string,
  side: "buy" | "sell",
  size: number,
  intervalMinutes: number,
  numIntervals: number
}
```

**Behavior.** Computes per-interval target = `size / numIntervals`. Runs one S1 passive chunk per
interval. Pauses overnight (configurable session window). Applies `safety.json` floor/ceiling per
chunk. Sets up daemon-mode scaffolding that W4.1 trigger layer reuses.

**Safety guards.** Per-chunk floor/ceiling from `safety.json`. Session window prevents overnight
execution unless explicitly enabled.

**Status.** 🧊 Planned. Phase 7. Dependency: S1 passive, W1.5 buy primitive.

**Example call.**
```
kea_strategy_run({
  strategy: "twap",
  ticker: "KXFOO-26APR21-YES",
  side: "sell",
  size: 10000,
  intervalMinutes: 30,
  numIntervals: 8
})
```

---

### S4 — Stealth (anti-signaling, side-parameterized)

**Purpose.** Accumulate or liquidate without revealing a recognizable execution pattern.

**When to use.** Agent suspects informed flow or wants to build/unwind a position without tipping
intent to other participants. Standard chunking prints a visible pattern in the tape; stealth
randomizes both size and timing to obscure it. Slower than S3 — use only when anti-signaling
matters.

**Agent inputs.**
```
{
  ticker: string,
  side: "buy" | "sell",
  size: number,
  maxPriceCents?: number,   // sell floor
  minPriceCents?: number    // buy ceiling
}
```

**Behavior.** Small randomized chunks (50–200 shares regardless of `chunkSize` config). Random
inter-chunk delay (5–60s). No resting orders — resting would expose remaining size. Composes W3.2
jitter primitive.

**Safety guards.** `safety.json` floor/ceiling per chunk. No chunk exceeds 200 shares by design.

**Status.** 🧊 Planned. Phase 7. Dependency: W3.2 jitter primitive (gating per Codex C
2026-05-02), W1.5 buy primitive.

**Example call.**
```
kea_strategy_run({
  strategy: "stealth",
  ticker: "KXFOO-26APR21-YES",
  side: "buy",
  size: 3000,
  minPriceCents: 40
})
```

---

### S5 — Pair / multi-leg (atomic, side-parameterized)

**Purpose.** Execute multiple legs atomically — no leg outpaces others beyond a skew threshold.

**When to use.** Spreading across two tickers, hedging, or opening/closing a range bet where
partial execution re-introduces the risk you're trying to remove. Also used as a primitive inside
S14 (basis arb).

**Agent inputs.**
```
{
  legs: [
    { ticker: string, side: "buy" | "sell", size: number }
    // ... additional legs
  ],
  legSkewPct?: number  // default 10
}
```

**Behavior.** Runs all legs in parallel under one job-id, shared journal. Enforces
atomicity-of-progress: if any leg's book becomes unfillable, halts *all* legs and surfaces to
agent. No leg outpaces others by more than `legSkewPct`.

**Safety guards.** W1.3 concentration cap applies to any leg that opens a position.
`safetySubmittedMultiple` per leg.

**Status.** 🧊 Planned. Phase 7. Dependency: W1.5 buy primitive, W1.2 TCA for skew impact.

---

### S6 — Pre-resolution arbitrage exit

**Purpose.** Exit a position hours from resolution when the book is thin and passive gets nothing.

**When to use.** Market is hours from resolution; mid has converged near $1 or $0; a few cents of
spread remain. Standard passive execution finds no crosses; standard aggressive overpays slippage.
The *decision* that this situation exists is agent-side (check `timeToCloseHours < 24` and
`midToTerminal < 5¢`). A W4.1 trigger named `pre-resolution-window` can encode that condition.

**Agent inputs.**
```
{
  ticker: string,
  side: "sell",
  size: number,
  arbTimeboxMs?: number
}
```

**Behavior.** Aggressive IoC at `bid + 1¢` (giving up one tick to fill). If no fill within
`arbTimeboxMs`, escalates to `bid` and sweeps. Small chunks to preserve price discovery; high
floor (won't sweep into the deep tail).

**Safety guards.** `safety.json` floor still binds — engine will not sweep below floor regardless
of resolution proximity.

**Status.** 🧊 Planned. Phase 7.

---

### S7 — Scale-out ladder (rung-driven partial exits)

**Purpose.** Take partial size off at multiple price levels, agent-supplied rung table, no baked-in defaults.

**When to use.** Selling into strength in stages. Agent supplies the exact rung table
(`priceCents`, `sizePct` per rung) — no return-multiple defaults live in the engine. Each rung
fires S1 passive semantics when its price threshold is crossed.

**Agent inputs.**
```
{
  ticker: string,
  side: "sell",
  size: number,
  rungs: [{ priceCents: number, sizePct: number }]
}
```

**Behavior.** Active polling loop checks price every N seconds against rung thresholds. When a
rung price is reached, fires S1 passive for that rung's `sizePct` of total size. After W4.1
lands, the polling loop is replaced by `profit-target` triggers — same rung config, cleaner
runtime.

**Safety guards.** Each rung's S1 run inherits `safety.json` floor/ceiling.

**Status.** 🧊 Planned. Phase 7. Dependency: S1 passive. W4.1 is upgrade path, not blocker.

---

### S8 — Limit ladder (passive multi-rung GTC, side-parameterized)

**Purpose.** Pre-place orders at multiple price points and walk away.

**When to use.** Expecting mean-reversion, or willing to average in/out at specific levels.
Distinct from S7 scale-out: S7 is *active* (polls price, fires rungs as they're hit); S8 is
*passive* (upfront multi-GTC placement, no iteration, relies on resume to reconcile fills). Use
S8 when you want to set-and-forget across a session.

**Agent inputs.**
```
{
  ticker: string,
  side: "buy" | "sell",
  rungs: [{ priceCents: number, sizePct: number }]
}
```

**Behavior.** Posts each rung as a GTC at start. Monitors fills. Journals each fill. No iteration
loop after placement; resume reconciles fills on next session.

**Safety guards.** `safety.json` floor/ceiling per rung. W1.3 concentration cap applies on buy side.

**Status.** 🧊 Planned. Phase 7. Dependency: W1.5 buy primitive.

---

### S9 — Stop-and-reverse

**Purpose.** Exit current position and open opposite in one atomic sequence.

**When to use.** Thesis flipped. Agent wants to go from long to short (or vice versa) without
separately managing two operations. Composed of two S2 aggressive calls under one journal.

**Agent inputs.**
```
{
  ticker: string,
  currentSide: "buy" | "sell",
  currentSize: number,
  targetSide: "buy" | "sell",
  targetSize: number
}
```

**Behavior.** Phase 1: S2 aggressive exit of existing position. Phase 2: S2 aggressive open of
opposite side. Single journal covers both phases.

**Safety guards.** W1.3 pre-trade risk applies to the open leg. `safetySubmittedMultiple` per phase.

**Status.** 🧊 Planned. Phase 7. Dependency: S2 aggressive, W1.3 pre-trade risk, W1.5 buy primitive.

---

### S10 — Cash-raise sequencer

**Purpose.** Sell multiple positions in order until a cash target is met by a deadline.

**When to use.** Need $X in cash by a specific time. Agent (or W4.3 portfolio sequencer) supplies
the pre-ranked ordered list of `{ ticker, size, strategyName }`. Engine executes sequentially and
halts when the target is met — no ranking math inside the engine.

**Agent inputs.**
```
{
  positions: [{ ticker: string, size: number, strategyName: string }],
  targetCashDollars: number,
  deadlineTimestamp: number
}
```

**Behavior.** Executes positions in list order using the named strategy for each. Halts when
`targetCashDollars` is reached or `deadlineTimestamp` passes. Journals each sub-execution under
the parent job-id.

**Safety guards.** Each sub-execution inherits its strategy's `safety.json` guards.

**Status.** 🧊 Planned. Phase 7. Dependency: S1 and/or S2.

---

### S11 — Roll (exit current + open next cycle)

**Purpose.** Exit an expiring contract and open the equivalent position in the next cycle.

**When to use.** Thesis still holds but contract is expiring. Roll into the next cycle's equivalent
without going flat. Phase 1 uses S1 passive to minimize self-impact on exit; Phase 2 uses S2
aggressive to open the new position promptly.

**Agent inputs.**
```
{
  currentTicker: string,
  currentSize: number,
  targetTicker: string,
  targetSize: number,
  targetSide: "buy" | "sell"
}
```

**Behavior.** Phase 1: S1 passive sell of current position. Phase 2: S2 aggressive open of target
ticker. Single journal.

**Safety guards.** W1.3 concentration cap applies to the open leg.

**Status.** 🧊 Planned. Phase 7. Dependency: S1, S2, W1.3, W1.5.

---

### S12 — Liquidity-providing (two-sided market making)

**Purpose.** Make markets on a stable wide-spread market — post both sides, harvest fills, manage
inventory toward a target.

**When to use.** Stable market with persistent wide spread where passive posting on both sides is
profitable. Agent supplies `targetInventory` and `maxInventory`. Not suitable for fast-moving or
resolving markets.

**Agent inputs.**
```
{
  ticker: string,
  targetInventory: number,
  maxInventory: number,
  quoteOffsetCents: number
}
```

**Behavior.** Maintains two resting GTCs (one bid, one ask), cancels and reposts on book moves
(uses W3.3 peg-to-mid when available). When inventory hits `maxInventory` on one side, cuts that
side and reposts opposite aggressively to flatten back toward `targetInventory`.

**Safety guards.** `maxInventory` hard cap. W1.3 concentration cap. Scope-risk flag: complex state
machine; watch for inventory-rule creep during implementation.

**Status.** 🧊 Planned. Phase 7. Dependency: W1.5 buy primitive, W3.3 peg-to-mid (preferred).

---

### S13 — Iceberg (single visible quote)

**Purpose.** Execute large size with only a `visibleSize` slice showing in the order book at any time.

**When to use.** Accumulating or liquidating a large position without revealing total size to other
participants. Distinct from S4 stealth: stealth varies chunk *size and timing*; iceberg hides
total remaining behind a *fixed visible quote* at a target price.

**Agent inputs.**
```
{
  ticker: string,
  side: "buy" | "sell",
  size: number,
  visibleSize: number,
  priceCents: number
}
```

**Behavior.** Posts `visibleSize` GTC at `priceCents`. On fill, immediately reposts another
`visibleSize` at the same price. Continues until full `size` is filled or agent cancels. Total
remaining is never visible to the book.

**Safety guards.** `safety.json` floor/ceiling applies to `priceCents` at start.
`safetySubmittedMultiple` caps total exposure.

**Status.** 🧊 Planned (NEW, added 2026-05-02). Phase 7. Dependency: W1.5 buy primitive.

---

### S14 — Cross-resolution basis arbitrage

**Purpose.** Lock a risk-free payoff by simultaneously buying YES and NO on the same market when
their combined cost is below $1.

**When to use.** YES at Xc + NO at Yc where X + Y < 100. Terminal payoff is $1 per pair; cost is
(X + Y)¢; spread is (100 − X − Y)¢ locked in at execution. Agent verifies the arb exists before
invoking. Engine hard-fails if the arb closes mid-execution (total cost ≥ $1 per pair).

**Agent inputs.**
```
{
  ticker: string,
  budgetDollars: number
}
```

**Behavior.** Simultaneously buys YES at best ask + NO at best ask in proportional sizes. Shares
atomicity-of-progress with S5 pair — both buys advance together. Halts if combined fill cost
crosses $1/pair.

**Safety guards.** Hard abort if arb collapses mid-fill. W1.3 concentration cap applies.

**Status.** 🧊 Planned (NEW, added 2026-05-02). Phase 7. Dependency: W1.5, S5 multi-leg primitive.

---

### S15 — GTC-prepend then sweep (hybrid passive→aggressive)

**Purpose.** Earn passive pricing for a configurable window, then sweep remainder aggressively.

**When to use.** Markets with moderate natural flow where a passive window can capture top-of-book
pricing, but completion must be guaranteed. Balances price quality (passive window) with fill
certainty (aggressive sweep). Reduces expected slippage vs pure S2 while guaranteeing fill unlike
pure S1.

**Agent inputs.**
```
{
  ticker: string,
  side: "buy" | "sell",
  size: number,
  prependWindowMs: number
}
```

**Behavior.** Phase 1: post one GTC at `ask − 1¢` (sell) / `bid + 1¢` (buy) for full size. Wait
`prependWindowMs`. Phase 2: cancel unfilled portion (must complete before sweep starts, else
resting GTC could fill mid-cancel and double-execute). Phase 3: run S2 aggressive on remainder.

**Safety guards.** Cancel-before-sweep sequenced atomically. `safety.json` floor/ceiling applies
throughout.

**Status.** 🧊 Planned (promoted from Other deferred, 2026-05-02). Phase 7. Dependency: S1, S2, W1.5.

---

### S16 — Time-to-expiry emergency unwind

**Purpose.** Clock-driven escalation — increasing urgency as contract close approaches.

**When to use.** Position must be gone before contract closes, and the book may freeze as expiry
nears. Agent supplies the contract close timestamp; engine owns the escalation schedule. Distinct
from S2 (operator-triggered speed) and W4.1 stop-loss (price-triggered). S16 is *time-triggered*.

**Agent inputs.**
```
{
  ticker: string,
  side: "sell",
  size: number,
  contractCloseTimestamp: number
}
```

**Behavior.** Schedules increasing-urgency chunks against time remaining:
- T-60min: S1 passive
- T-30min: S7-style ladder (multi-rung partial exits)
- T-10min: S2 aggressive
- T-2min: crosses any available bid regardless of floor

**Safety guards.** `safetySubmittedMultiple` still binds at every stage. Floor suspension only
kicks in at T-2min; all earlier stages respect `safety.json` floor.

**Status.** 🧊 Planned (NEW, added 2026-05-02). Phase 7. Dependency: S1, S2, S7.

---

## Common patterns

Strategies compose. Common multi-strategy sequences:

**Stop-and-reverse = S2 sell + S2 buy (S9)**
```
// Thesis flipped: was long, now want short
kea_strategy_run({ strategy: "stop-and-reverse", ticker: "...", currentSide: "buy",
  currentSize: 2000, targetSide: "sell", targetSize: 2000 })
```

**Roll = S1 sell + S2 buy on different ticker (S11)**
```
// Contract expiring; same thesis, next cycle
kea_strategy_run({ strategy: "roll", currentTicker: "KXFOO-26APR25-YES",
  targetTicker: "KXFOO-26MAY25-YES", currentSize: 3000, targetSize: 3000, targetSide: "buy" })
```

**Trigger-armed exit = W4.1 trigger fires S1/S2/S3/etc.**
```
// Stop-loss: when mid drops below 30¢, run S2 aggressive sell
kea_trigger_arm({ type: "stop-loss", ticker: "...", thresholdCents: 30,
  strategy: "aggressive", side: "sell", size: 5000 })
```

**Basis arb = S14 (buys both legs of S5 pair internally)**
```
// YES at 58¢, NO at 40¢ → 2¢ arb locked
kea_strategy_run({ strategy: "basis-arb", ticker: "KXFOO-26APR21", budgetDollars: 500 })
```

**Cash raise = S10 sequencing multiple S1/S2 calls**
```
// Sell three positions in priority order until $2000 cash raised
kea_strategy_run({ strategy: "cash-raise", targetCashDollars: 2000,
  deadlineTimestamp: 1746000000,
  positions: [
    { ticker: "KXFOO-YES", size: 1000, strategyName: "passive" },
    { ticker: "KXBAR-YES", size: 2000, strategyName: "aggressive" },
    { ticker: "KXBAZ-YES", size: 500,  strategyName: "passive" }
  ]
})
```

**Hybrid fill = S15 (passive window → S2 on remainder)**
```
// 30s passive window, then sweep whatever's left
kea_strategy_run({ strategy: "prepend-then-sweep", ticker: "...",
  side: "sell", size: 4000, prependWindowMs: 30000 })
```
