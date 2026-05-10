# Track 2 — Min-chunk-value guard implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the Kalshi $0.01-per-fill minimum-fee tax from ballooning the effective fee rate to ~100% on cheap-market dust trades. Add a `minChunkValueDollars` config field; refuse to emit any chunk whose `chunk_size × decision.priceCentsExact / 100` falls below it. Make sure the runner cleanly skips zero-chunk decisions instead of submitting `count: 0` to Kalshi.

**Architecture:**
1. One field on `ExitConfig` (`minChunkValueDollars?: number`).
2. One guard in `decideLosingExitOrder` (`pricing.ts`) that returns `chunkSize: 0` with a stable `reason` constant when the threshold trips.
3. **One runner-side change** in `exitRunner.ts` — extend the existing `BreakLoopOutcome` reason union (`exitRunner.ts:12`) with a new `'chunk_too_small'` arm, log a `chunk_too_small_for_fee_threshold` info entry via the existing `this.log(...)` method (`exitRunner.ts:60`, signature `(level, message, data?)`), and add a branch in `runOneTick` (the function around `exitRunner.ts:351`) that returns `{ kind: 'break_loop', reason: 'chunk_too_small' }` when `decision.chunkSize === 0`. The runner's loop driver (`run()` at line ~519) already terminates cleanly on `kind: 'break_loop'`. Verified during plan review (2026-05-09): there is currently NO short-circuit on chunk size, so without this change a zero-chunk decision becomes a `count: 0` createOrder call that Kalshi rejects.

**No new `JournalKind` strings.** The existing `safety_submitted_cap_reached`-style log entry pattern (see `exitRunner.ts:367`) is the model: append a structured log via `this.log('info', '...', { reason, remaining, priceCentsExact })` BEFORE returning the `break_loop`. We use the same pattern with a new log message string `'chunk_too_small_for_fee_threshold'` — this is a free-form log message, not a `JournalKind` union member, so no `types.ts` union changes.

**Tech stack:** TypeScript engine + vitest. No new dependencies.

**Why this is non-trivial despite small surface:** the guard has to fire *after* the chunk size has been chosen and the price has been picked, otherwise the operator gets a misleading `priceDecision` in the journal. It also has to (a) play nicely with `tailSweepThreshold`, which is its own "stop emitting" branch with different intent, and (b) interact correctly with `chooseChunkSize`'s pre-existing ability to return zero when `remaining = 0` — that's a different cause and shouldn't be re-attributed to the new reason.

**Pre-flight verification (already done during plan review, do NOT repeat):**

- `types.ts:111` — `PriceDecision.reason` is typed as `string`, NOT a literal union. Adding a new sentinel value does not require any type-union update; just use a `const`.
- `types.ts:140` — `JobStatus` does NOT have a `terminationReason` field. The runner's break path uses `BreakLoopOutcome` returned from `runOneTick`, NOT a status-mutation pattern.
- `exitRunner.ts:12` — `BreakLoopOutcome` reason is a literal union: `'kill_switch' | 'max_orders' | 'safety_cap' | 'gtc_resting' | 'stop_requested'`. Adding `'chunk_too_small'` extends this union (one-line change).
- `exitRunner.ts:351–388` — calls `decideLosingExitOrder` then unconditionally builds + creates an order. There is NO existing zero-chunk early return.
- `exitRunner.ts:367` — the safety-cap break is the model pattern: `this.log('error', 'safety_submitted_cap_reached', {...}); return { kind: 'break_loop', reason: 'safety_cap' };`. Mirror this for chunk-too-small.
- `test/pricing.test.ts:8` — uses a single hand-built `cfg: ExitConfig` fixture; there is NO `makePricingConfig` helper. New tests must either reuse `cfg` (overriding fields per case) or introduce a small inline `withCfg(...)` helper at the top of the new describe block.

---

## Prior art / context

- `pricing.ts:180` — `decideLosingExitOrder(orderbook, remainingPosition, config) → PriceDecision`.
- `pricing.ts:185` — `chunkSize` chosen via `chooseChunkSize`.
- `pricing.ts:187–195` — early return for tail-sweep below threshold (returns `chunkSize` as chosen, `priceCents = floorPriceCents`, `reason: 'final_tail_sweep'`).
- `pricing.ts:198` — `selectExecutablePrice` returns the rest of the decision; line 199 spreads it into the result.
- BACKLOG.md "Min-chunk-value guard" row (line ~1041) specs the math: refuse `chunk × decision.priceCentsExact / 100 < minChunkValueDollars`. Default 0.15.

The runner consumes `PriceDecision` and calls `buildSellPayload(config, decision)` (`pricing.ts:202`). We need the runner to recognize "guard fired" and break the loop with a clear reason rather than placing a $0.01-fee order.

---

## Decision: how does the guard signal "skip"?

Two real options:

1. **Return `chunkSize: 0` with a stable `reason` string.** Aligned with the existing decision shape; the runner has to learn to short-circuit on zero. Runner change is small (~10 LOC + one test) and is in scope for this plan.

2. **Throw an `EngineSkip` exception.** More Pythonic but invasive — every runner has to learn a new exception class. Skipping.

**Choose option 1.** Use the constant `CHUNK_TOO_SMALL_REASON = 'chunk_too_small_for_fee_threshold'` exported from `pricing.ts`; the runner imports it and branches on equality.

---

## File structure

- Modify: `code-and-docs-from-chatgpt/engine-ts/src/types.ts` — 1 field on `ExitConfig`. (`PriceDecision.reason` is already `string`; no union to touch.)
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/pricing.ts` — export `CHUNK_TOO_SMALL_REASON` constant + add the guard.
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/exitRunner.ts` — short-circuit on `decision.chunkSize === 0` before `buildSellPayload`/`createOrder`; journal `chunk_skipped` with the reason; break the loop with status `complete`.
- Modify: `code-and-docs-from-chatgpt/engine-ts/test/pricing.test.ts` — new pricing-side tests (reuse existing `cfg` fixture).
- Modify: `code-and-docs-from-chatgpt/engine-ts/test/exitRunner.test.ts` (or wherever ExitRunner integration tests live; identify in Task 2.4) — one new test asserting zero-chunk decisions short-circuit.

Nothing new in CLI, MCP, or backtest harness.

---

## Task 2.1 — Lock the spec with a failing test (~30 min)

**Files:**
- Test: `test/pricing.test.ts`

- [ ] **Step 1:** At the top of a new `describe('SH-MIN-CHUNK')` block, add an inline helper that overrides the existing `cfg` fixture (which is hand-built at line 8) per case:

  ```ts
  // Reuse the existing top-of-file `cfg: ExitConfig`. Override per case.
  function withCfg(overrides: Partial<ExitConfig>): ExitConfig {
    return { ...cfg, ...overrides };
  }
  ```

- [ ] **Step 2: Write the failing tests**
  ```ts
  import { CHUNK_TOO_SMALL_REASON } from '../src/pricing.js';

  describe('SH-MIN-CHUNK — minChunkValueDollars guard', () => {
    it('refuses chunks below minChunkValueDollars', () => {
      const config = withCfg({ chunkSize: 1, minChunkValueDollars: 0.15, heldSide: 'yes' });
      // Top yes-bid at 1¢ → chunk value = 1 × 0.01 = $0.01 ≪ $0.15.
      const book: Orderbook = {
        yes: [{ priceCents: 1, size: 100 }],
        no: [{ priceCents: 99, size: 100 }],
      };
      const decision = decideLosingExitOrder(book, 1, config);
      expect(decision.chunkSize).toBe(0);
      expect(decision.reason).toBe(CHUNK_TOO_SMALL_REASON);
      expect(Number.isFinite(decision.priceCents)).toBe(true);
    });

    it('does NOT fire when chunk value is comfortably above threshold', () => {
      const config = withCfg({ chunkSize: 100, minChunkValueDollars: 0.15, heldSide: 'yes' });
      const book: Orderbook = { yes: [{ priceCents: 50, size: 200 }], no: [] };
      const decision = decideLosingExitOrder(book, 100, config);
      expect(decision.chunkSize).toBe(100); // 100 × 0.50 = $50.00 ≫ threshold
      expect(decision.reason).not.toBe(CHUNK_TOO_SMALL_REASON);
    });

    it('uses default minChunkValueDollars=0.15 when unset', () => {
      const config = withCfg({ chunkSize: 1, heldSide: 'yes' });
      // minChunkValueDollars left undefined; engine defaults to 0.15.
      const book: Orderbook = { yes: [{ priceCents: 5, size: 100 }], no: [] };
      // 1 × $0.05 = $0.05 < default 0.15 → guard fires.
      const decision = decideLosingExitOrder(book, 1, config);
      expect(decision.reason).toBe(CHUNK_TOO_SMALL_REASON);
    });

    it('disables when minChunkValueDollars=0', () => {
      const config = withCfg({ chunkSize: 1, minChunkValueDollars: 0, heldSide: 'yes' });
      const book: Orderbook = { yes: [{ priceCents: 5, size: 100 }], no: [] };
      const decision = decideLosingExitOrder(book, 1, config);
      expect(decision.chunkSize).toBe(1);
      expect(decision.reason).not.toBe(CHUNK_TOO_SMALL_REASON);
    });

    it('does not fire on tail-sweep path — tail-sweep uses floor price by design', () => {
      // When remaining <= tailSweepThreshold, the tail-sweep branch returns
      // first with reason 'final_tail_sweep' BEFORE the new guard runs.
      const config = withCfg({
        chunkSize: 1, tailSweepThreshold: 5, minChunkValueDollars: 0.15, heldSide: 'yes',
      });
      const book: Orderbook = { yes: [{ priceCents: 1, size: 100 }], no: [] };
      const decision = decideLosingExitOrder(book, 3, config); // remaining < threshold
      expect(decision.reason).toBe('final_tail_sweep');
    });

    it('does NOT mis-attribute when chooseChunkSize returns 0 (remaining=0)', () => {
      // chooseChunkSize → Math.min(config.chunkSize, remaining=0) = 0.
      // Guard precondition `chunkSize > 0` MUST prevent re-attributing to
      // CHUNK_TOO_SMALL_REASON. The decision should keep whatever reason
      // the existing path produces (verify via assertion that the new
      // reason is NOT used).
      const config = withCfg({ chunkSize: 100, minChunkValueDollars: 0.15, heldSide: 'yes' });
      const book: Orderbook = { yes: [{ priceCents: 50, size: 200 }], no: [] };
      const decision = decideLosingExitOrder(book, 0, config);
      expect(decision.reason).not.toBe(CHUNK_TOO_SMALL_REASON);
    });
  });
  ```

- [ ] **Step 3: Run — expect 5 failing tests** (one passes — the "comfortably above" case — once chooseChunkSize returns 100 with a healthy book; that's fine, it's a regression-pin).

  ```sh
  npx vitest run test/pricing.test.ts
  ```

## Task 2.2 — Add the type field (~5 min)

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add to `ExitConfig`** (insert near other minimum-related fields, e.g. after `minLevelSize`):

  ```ts
  /**
   * Min chunk notional ($). Refuses to emit any decision where
   * `chunkSize × priceCentsExact / 100 < minChunkValueDollars`. Defends
   * against Kalshi's $0.01-per-fill minimum fee, which balloons the
   * effective rate on cheap-market dust trades. Default 0.15. Set to 0
   * to disable.
   */
  minChunkValueDollars?: number;
  ```

- [ ] **Step 2: tsc clean** — `npx tsc --noEmit`. `PriceDecision.reason` is already typed as `string` (`types.ts:111`), so no further type changes are needed. Tests will fail until pricing.ts is updated; that's Task 2.3.

## Task 2.3 — Implement the guard in pricing.ts (~25 min)

**Files:**
- Modify: `src/pricing.ts`

- [ ] **Step 1: Export the constant + default at the top of the file**
  ```ts
  export const CHUNK_TOO_SMALL_REASON = 'chunk_too_small_for_fee_threshold';
  const DEFAULT_MIN_CHUNK_VALUE_DOLLARS = 0.15;
  ```

- [ ] **Step 2: Add the guard with a `chunkSize > 0` precondition.** Insert immediately AFTER `selectExecutablePrice` returns (`pricing.ts:198–199`), so the price has already been chosen:

  ```ts
  const price = selectExecutablePrice(sideLevels, chunkSize, config.floorPriceCents, config.minLevelSize);

  // Re-attribute only when the chunk is genuinely above zero. chooseChunkSize
  // can produce zero (remaining=0) for unrelated reasons; that case keeps
  // its existing reason rather than getting masked by CHUNK_TOO_SMALL_REASON.
  if (chunkSize > 0) {
    const minChunkValue = config.minChunkValueDollars ?? DEFAULT_MIN_CHUNK_VALUE_DOLLARS;
    if (minChunkValue > 0) {
      const chunkValueDollars = chunkSize * price.priceCentsExact / 100;
      if (chunkValueDollars < minChunkValue) {
        return { ...price, chunkSize: 0, reason: CHUNK_TOO_SMALL_REASON };
      }
    }
  }

  return { chunkSize, ...price };
  ```

  Note: keeping `priceCents` populated (rather than zeroing it) preserves journal-trace usefulness — the operator can see what the engine would have priced at and judge whether to lower the threshold.

- [ ] **Step 3: Verify the spread.** `selectExecutablePrice`'s return type — confirm it includes `priceCents`, `priceCentsExact`, `priceDollars`, `cumulativeSizeAtPrice` (and only those, else the `...price` spread duplicates work in Step 2). One quick read of `pricing.ts:165` (the function signature near `selectExecutablePrice`) before pasting.

- [ ] **Step 4: Order matters.** The tail-sweep branch (`pricing.ts:187–195`) returns *before* `selectExecutablePrice`, so the guard correctly does NOT apply there — verified by Task 2.1's tail-sweep test.

## Task 2.4 — Run pricing tests; check for fixture breakage (~15 min)

- [ ] **Step 1: All 5 new tests pass**
  ```sh
  npx vitest run test/pricing.test.ts
  ```

- [ ] **Step 2: tsc clean**
  ```sh
  npx tsc --noEmit
  ```

- [ ] **Step 3: If any existing test breaks**, the most likely cause is a pre-existing fixture that expected a non-zero chunk on a low-price book. Decide per case: tighten the fixture's price or set `minChunkValueDollars: 0` on that fixture (the guard becomes opt-out for any test that doesn't care).

## Task 2.5 — Add the runner short-circuit (~30 min)

**Files:**
- Modify: `src/exitRunner.ts`
- Modify: `test/exitRunner.test.ts` (or whichever file contains existing ExitRunner integration tests; identify with `grep -l "new ExitRunner\|ExitRunner.run" test/`)

- [ ] **Step 1: Extend the BreakLoopOutcome union.** At `exitRunner.ts:12`, add `'chunk_too_small'` to the reason literal union:

  ```ts
  | { kind: 'break_loop'; reason: 'kill_switch' | 'max_orders' | 'safety_cap' | 'gtc_resting' | 'stop_requested' | 'chunk_too_small' };
  ```

- [ ] **Step 2: Locate the call site.** `runOneTick` at `exitRunner.ts:351` calls `decideLosingExitOrder`; line 352 calls `buildSellPayload`; line 388 calls `createOrder`. The short-circuit must land between 351 and 352.

- [ ] **Step 3: Add the short-circuit using the existing safety-cap break pattern (`exitRunner.ts:367`)**:

  ```ts
  import { CHUNK_TOO_SMALL_REASON } from './pricing.js';
  // ...
  const decision = decideLosingExitOrder(orderbook, this.status.remaining, this.config);
  if (decision.chunkSize === 0) {
    if (decision.reason === CHUNK_TOO_SMALL_REASON) {
      this.log('info', 'chunk_too_small_for_fee_threshold', {
        reason: decision.reason,
        remaining: this.status.remaining,
        priceCentsExact: decision.priceCentsExact,
      });
      return { kind: 'break_loop', reason: 'chunk_too_small' };
    }
    // Defensive: any other zero-chunk return path (none today) — log + break.
    this.log('warn', 'unexpected_zero_chunk', {
      reason: decision.reason,
      remaining: this.status.remaining,
    });
    return { kind: 'break_loop', reason: 'chunk_too_small' };
  }
  const payload = buildSellPayload(this.config, decision);
  ```

  - `this.log` writes to the structured logger (verified existing pattern at `exitRunner.ts:367`); no `JournalKind` union changes needed since these are log-message strings, not journal kinds.
  - The `run()` loop driver at `exitRunner.ts:540` already handles `outcome.kind === 'break_loop'` by breaking out cleanly — no additional run-side change required.

- [ ] **Step 4: Add an integration test**
  ```ts
  it('SH-MIN-CHUNK: zero-chunk decision breaks the loop without calling createOrder', async () => {
    // Fixture: 1¢ top bid, chunkSize 1, minChunkValueDollars 0.15.
    // Pricing layer returns chunkSize=0 + CHUNK_TOO_SMALL_REASON; runner
    // must NOT call createOrder, must complete with no fills.
    const client = makeMockClient({ /* book with 1¢ yes bid */ });
    const runner = new ExitRunner(client, makeConfig({
      chunkSize: 1, minChunkValueDollars: 0.15, /* etc */
    }));
    const result = await runner.run();
    expect(client.createOrder).not.toHaveBeenCalled();
    expect(result.filledTotal).toBe(0);
    expect(result.remaining).toBeGreaterThan(0); // dust still there but skipped
  });
  ```

  Adapt to whatever mock client / config builder the existing `exitRunner.test.ts` (or equivalent integration suite) uses. The JobResult shape returned by `run()` exposes `filledTotal` and `remaining` (verify via `grep -nA 3 "interface JobStatus" code-and-docs-from-chatgpt/engine-ts/src/types.ts`); both make robust assertion targets.

- [ ] **Step 4: Run**
  ```sh
  npx vitest run test/exitRunner.test.ts
  npx vitest run    # full suite
  ```

## Task 2.6 — Commit + PR (~10 min)

- [ ] **Step 1: Stage + commit**
  ```sh
  git commit -m "feat(engine/SH-MIN-CHUNK): minChunkValueDollars guard + runner skip

  pricing.ts: refuse chunks where chunkSize × priceCentsExact / 100 falls
  below minChunkValueDollars. Default \$0.15 covers Kalshi's \$0.01-per-fill
  minimum-fee tax where effective rate spikes to ~100% on cheap-market
  dust. Returns a stable PriceDecision with chunkSize=0 and reason=
  CHUNK_TOO_SMALL_REASON. chooseChunkSize-returns-0 (remaining=0) is NOT
  re-attributed via a chunkSize > 0 precondition.

  exitRunner.ts: short-circuit on decision.chunkSize === 0 BEFORE
  buildSellPayload/createOrder. Journals 'chunk_skipped' with the
  decision reason and breaks the loop with status complete. Without
  this, a zero-chunk decision becomes a count: 0 createOrder rejected
  by Kalshi.

  Tail-sweep path (final_tail_sweep) returns earlier and is unaffected
  — operator opt-in to dust-clear math.

  Default 0.15 is operator-overridable via config; set to 0 to disable."
  ```

- [ ] **Step 2: Open PR + auto-merge** following project flow.

## Sub-story wrap-up

- [ ] **Step 1: Promote** SH-MIN-CHUNK-VALUE-GUARD in BACKLOG.md (deferred per Track 1's policy — let backlog-sync handle it post-merge).

---

## Out of scope

- Surfacing `chunk_too_small_for_fee_threshold` in `kea report` summaries — the data is in the journal; aggregation is Track 3 territory.
- Per-strategy override of `minChunkValueDollars` — currently a single config field is enough; revisit if a strategy needs a different default.
- Buy-side analog — `pricing.ts:202+` is `buildSellPayload`; entry path doesn't have an equivalent guard yet, but BACKLOG row is sell-side specifically. File a follow-up if buy-side dust shows up in journals.

## Self-review

- ✅ Spec: each task has files, code, tests, expected output.
- ✅ Tests written before implementation (Task 2.1 first).
- ✅ The "tail-sweep takes priority" decision is captured in a test.
- ✅ Runner-side compatibility verified before claiming the change is safe (Task 2.5).
- ⚠️ The plan does NOT modify any existing test fixtures preemptively. If Task 2.4 finds breakage, that's the signal the chosen default conflicts with existing behavior — investigate at that point rather than touching fixtures up front.
- ⚠️ Total cost estimate (revised after plan review): ~2.5h. Pricing-side ~90 min (Tasks 2.1–2.4). Runner-side ~30 min (Task 2.5). PR/merge ~30 min. The runner-side change is now in scope, not deferred — the original plan's "verify the runner already handles it" was wrong; verification during plan review showed `exitRunner.ts:351–388` does NOT short-circuit on zero chunks.
