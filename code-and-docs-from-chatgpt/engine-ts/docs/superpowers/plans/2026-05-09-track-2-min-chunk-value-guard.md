# Track 2 — Min-chunk-value guard implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the Kalshi $0.01-per-fill minimum-fee tax from ballooning the effective fee rate to ~100% on cheap-market dust trades. Add a `minChunkValueDollars` config field; refuse to emit any chunk whose `chunk_size × decision.priceCentsExact / 100` falls below it.

**Architecture:** One field on `ExitConfig`, one guard in `decideLosingExitOrder` (`pricing.ts`), one new journal kind for observability (`chunk_too_small_for_fee_threshold`). No changes to runners — the existing `loop_finished` exit path on a no-op decision already handles the "engine returns 0-chunk decision" case via the `tailSweepThreshold` semantic.

**Tech stack:** TypeScript engine + vitest. No new dependencies.

**Why this is non-trivial despite small surface:** the guard has to fire *after* the chunk size has been chosen and *before* the decision is returned, otherwise the operator gets a misleading `priceDecision` in the journal. It also needs to play nicely with `tailSweepThreshold` — both are "stop emitting" guards but for different reasons. The decision shape `chunkSize: 0` doesn't currently exist in the type; we'd have to change the return shape OR introduce a new sentinel `reason`.

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

Three options:

1. **Add a `chunk_too_small` reason.** Return `chunkSize: 0, priceCents: floorPriceCents, reason: 'chunk_too_small_for_fee_threshold'`. Runners already check `chunkSize <= 0` in some paths (`pricing.ts:68`).

2. **Throw.** Crashy, doesn't let the runner journal the skip cleanly.

3. **Return `chunkSize: 0` with a stable existing reason like `final_tail_sweep`.** Wrong — masks the actual cause and pollutes the tail-sweep stats.

**Choose option 1.** Aligns with existing `reason` enum, runners can branch on `decision.reason` to journal `chunk_too_small_for_fee_threshold` and break the loop.

The runner change is *not* in scope for this plan — but Task 2.5 verifies the existing exit-runner already handles `chunkSize <= 0` gracefully (it does, at `exitRunner.ts` near "decision.chunkSize <= 0 break"). If verification finds it doesn't, file a follow-up rather than expanding this plan.

---

## File structure

- Modify: `code-and-docs-from-chatgpt/engine-ts/src/types.ts` (1 field on `ExitConfig`, 1 entry in the `reason` union).
- Modify: `code-and-docs-from-chatgpt/engine-ts/src/pricing.ts` (the guard).
- Modify: `code-and-docs-from-chatgpt/engine-ts/test/pricing.test.ts` (new tests).
- Add (optional): `code-and-docs-from-chatgpt/engine-ts/src/types.ts` JournalKind union — new kind `chunk_too_small_for_fee_threshold` (only if verifying Task 2.5 shows the runner needs to journal it via existing `loop_finished`-with-reason patterns; otherwise no journal change).

Nothing new in CLI, MCP, or backtest harness — guard sits in pricing where every consumer already routes through.

---

## Task 2.1 — Lock the spec with a failing test (~30 min)

**Files:**
- Test: `test/pricing.test.ts`

- [ ] **Step 1: Write the failing test**
  ```ts
  it('refuses chunks below minChunkValueDollars (SH-MIN-CHUNK)', () => {
    const config = makePricingConfig({
      chunkSize: 1,                    // 1 contract
      minChunkValueDollars: 0.15,      // standard default
      heldSide: 'yes',
    });
    // Top yes-bid at 1¢ → chunk value = 1 × 0.01 = $0.01 ≪ $0.15.
    const book: Orderbook = {
      yes: [{ priceCents: 1, size: 100 }],
      no: [{ priceCents: 99, size: 100 }],
    };
    const decision = decideLosingExitOrder(book, 1, config);
    expect(decision.chunkSize).toBe(0);
    expect(decision.reason).toBe('chunk_too_small_for_fee_threshold');
    // priceCents must still be a sensible scalar so journal serialization doesn't blow up.
    expect(Number.isFinite(decision.priceCents)).toBe(true);
  });

  it('does NOT fire when chunk value is comfortably above threshold', () => {
    const config = makePricingConfig({
      chunkSize: 100,
      minChunkValueDollars: 0.15,
      heldSide: 'yes',
    });
    const book: Orderbook = { yes: [{ priceCents: 50, size: 200 }], no: [] };
    const decision = decideLosingExitOrder(book, 100, config);
    expect(decision.chunkSize).toBe(100); // 100 × 0.50 = $50.00 ≫ threshold
    expect(decision.reason).not.toBe('chunk_too_small_for_fee_threshold');
  });

  it('uses default minChunkValueDollars=0.15 when unset', () => {
    const config = makePricingConfig({ chunkSize: 1, heldSide: 'yes' });
    expect(config.minChunkValueDollars).toBeUndefined();
    const book: Orderbook = { yes: [{ priceCents: 5, size: 100 }], no: [] };
    // 1 × $0.05 = $0.05 < default 0.15 → guard fires.
    const decision = decideLosingExitOrder(book, 1, config);
    expect(decision.reason).toBe('chunk_too_small_for_fee_threshold');
  });

  it('does not fire on tail-sweep path — tail-sweep uses floor price by design', () => {
    // When remaining <= tailSweepThreshold, the tail-sweep branch returns first
    // with reason 'final_tail_sweep' BEFORE the chunk-value guard runs. This
    // is intentional: the tail-sweep is the operator's last-ditch dust-clear,
    // and they've explicitly accepted the fee math by setting the threshold.
    const config = makePricingConfig({
      chunkSize: 1,
      tailSweepThreshold: 5,
      minChunkValueDollars: 0.15,
      heldSide: 'yes',
    });
    const book: Orderbook = { yes: [{ priceCents: 1, size: 100 }], no: [] };
    const decision = decideLosingExitOrder(book, 3, config); // remaining < threshold
    expect(decision.reason).toBe('final_tail_sweep');
  });
  ```

- [ ] **Step 2: Run — confirm 4 failing tests** (`expected 0, got 1` etc).

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

- [ ] **Step 2: Add to `PriceDecision.reason` union** (`types.ts`, search for the existing `reason` union — likely around the `PriceDecision` interface):

  ```ts
  reason: ... | 'chunk_too_small_for_fee_threshold' | ...;
  ```

- [ ] **Step 3: tsc — `npx tsc --noEmit`** must remain clean. Existing callsites that pattern-match on `reason` won't fail because `chunk_too_small...` is a NEW arm.

## Task 2.3 — Implement the guard (~20 min)

**Files:**
- Modify: `src/pricing.ts`

- [ ] **Step 1: Define the default constant near the top of the file**
  ```ts
  const DEFAULT_MIN_CHUNK_VALUE_DOLLARS = 0.15;
  ```

- [ ] **Step 2: Add the guard immediately AFTER `selectExecutablePrice` returns** (`pricing.ts:198–199`), so the price has already been chosen:

  ```ts
  const price = selectExecutablePrice(sideLevels, chunkSize, config.floorPriceCents, config.minLevelSize);
  const minChunkValue = config.minChunkValueDollars ?? DEFAULT_MIN_CHUNK_VALUE_DOLLARS;
  if (minChunkValue > 0) {
    const chunkValueDollars = chunkSize * price.priceCentsExact / 100;
    if (chunkValueDollars < minChunkValue) {
      return {
        chunkSize: 0,
        priceCents: price.priceCents,
        priceCentsExact: price.priceCentsExact,
        priceDollars: price.priceDollars,
        reason: 'chunk_too_small_for_fee_threshold',
        cumulativeSizeAtPrice: price.cumulativeSizeAtPrice,
      };
    }
  }
  return { chunkSize, ...price };
  ```

  Note: keeping `priceCents` populated (rather than zeroing it) preserves journal-trace usefulness — the operator can see what the engine would have priced at and judge whether to lower the threshold.

- [ ] **Step 3: Order matters.** The tail-sweep branch (lines 187–195) returns *before* `selectExecutablePrice`, so the guard correctly does NOT apply there — verified by Task 2.1's fourth test case.

## Task 2.4 — Run tests, fix any regressions (~15 min)

- [ ] **Step 1: All four new tests pass**
  ```sh
  npx vitest run test/pricing.test.ts
  ```

- [ ] **Step 2: Full suite remains green**
  ```sh
  npx vitest run
  ```
  Expected: pre-existing test count + 4 new tests, all green.

- [ ] **Step 3: tsc clean**
  ```sh
  npx tsc --noEmit
  ```

- [ ] **Step 4: If any existing test breaks**, the most likely cause is a pre-existing fixture that expected a non-zero chunk on a low-price book. Decide per case: tighten the fixture's price or set `minChunkValueDollars: 0` on that fixture (the guard becomes opt-out for any test that doesn't care).

## Task 2.5 — Verify runner already handles `chunkSize: 0` (~10 min)

**Files:** read-only — `src/exitRunner.ts`, `src/passive.ts`, `src/aggressive.ts`.

- [ ] **Step 1: Search**
  ```sh
  grep -n "chunkSize <= 0\|decision.reason\|chunkSize === 0" code-and-docs-from-chatgpt/engine-ts/src/exitRunner.ts code-and-docs-from-chatgpt/engine-ts/src/passive.ts code-and-docs-from-chatgpt/engine-ts/src/aggressive.ts
  ```
  Expected: ExitRunner has a branch that breaks the loop on `decision.chunkSize <= 0`.

- [ ] **Step 2: If absent — file a follow-up, do NOT expand this plan.** A 0-chunk decision returned to a runner that doesn't handle it would just produce a 0-share createOrder, which Kalshi would reject. Filing a follow-up keeps Track 2 to its specced cost.

## Task 2.6 — Commit + PR (~10 min)

- [ ] **Step 1: Stage + commit**
  ```sh
  git commit -m "feat(pricing/SH-MIN-CHUNK): minChunkValueDollars guard

  Refuse to emit any chunk whose value (chunkSize × priceCentsExact /
  100) falls below minChunkValueDollars. Default \$0.15 — covers the
  Kalshi \$0.01-per-fill minimum fee threshold where the effective fee
  rate would otherwise spike to ~100% on cheap-market dust.

  Returns a stable PriceDecision with chunkSize=0 and reason=
  'chunk_too_small_for_fee_threshold' so the runner's existing 0-chunk
  break path triggers cleanly. Tail-sweep path returns earlier and is
  unaffected by design — operator opt-in to dust-clear math.

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
- ⚠️ Total cost estimate: ~90 min if no surprises. Skew up to 2.5h if the runner doesn't already handle 0-chunk gracefully (Task 2.5 follow-up).
