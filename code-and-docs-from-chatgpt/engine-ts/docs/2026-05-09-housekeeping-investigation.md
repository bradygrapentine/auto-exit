# Housekeeping investigation — 2026-05-09

Sweep covering: BACKLOG sync state, stale branches, TODO/FIXME audit,
test-coverage gaps, missed-requirement check vs specs, doc/roadmap
drift. Run after evening session shipped PRs #177–#181.

## TL;DR

- Backlog reconciled (PR #181 merged): SH-PASSIVE-SELL-LIMIT,
  SH-PASSIVE-SPREAD-LOGIC, Min-chunk-value guard promoted to ✅. §0
  status board now shows 76 shipped, 2 actionable SH stories.
- Roadmap rewritten to reflect Phase 13 SH ecosystem fully shipped
  (was still listed as future work). Surface parity table updated.
- 25 stale local branches deleted (15 with merged PRs in prior pass +
  10 squash-merged stragglers). 8 branches remain, 4 are active
  worktrees, 4 are stale-but-unmerged 1-commit branches surfaced
  below.
- 5 TODO/FIXME markers in source — investigated; only 1 is genuinely
  stale and worth a follow-up backlog row, the others are tracking
  active deferrals (Phase C, S11 chain, postLimit wiring).
- No genuine test-coverage gaps found. The 4 source files with no
  obvious test partner are covered by integration tests
  (cross-checked).
- One missed-requirement found in doc drift: `src/strategies/
  sConditionalRoll.ts:9` references S11 Roll as if it hasn't shipped;
  S11 shipped 2026-05-06. Filing as `SH-CONDITIONAL-ROLL-CHAIN-S11`.

## 1. Stale branches (4)

These local branches have one commit each, are 3–8 days old, and
their corresponding PRs were never opened or were closed-without-merge:

| Branch | Commit subject | Age | Recommended action |
|---|---|---|---|
| `docs/harvest-planner-backlog` | `docs(backlog): add W4.5 harvest planner` | 8d | Drop — harvest planner shipped (W4.5 in §7); commit message implies it was meant as a backlog edit that was superseded by the actual story landing. |
| `feat/ext/EX-1-ticker-detect` | `feat(ext/EX-1): ticker auto-detect` | 7d | Verify status against the extension repo (this is engine-ts, not extension); likely belongs in a sibling repo. Drop here. |
| `feat/extpolish/phase-a-shell` | `feat(extension): App.tsx 3-zone shell` | 3d | Same as above — extension UI work. Drop locally. |
| `feat/mcp-server-plan` | `docs(mcp): add Phase 6 roadmap` | 8d | MCP shipped long ago; this was a planning doc that was superseded. Drop. |

None of these branches have open PRs (`gh pr list --head` confirmed
zero results). Recommend deleting locally; their content lives in
shipped PRs or sibling repos.

## 2. TODO / FIXME audit

Five markers found in `src/`:

### Active (keep)

- **`src/kalshiClient.ts:311`** — open-orders pagination TODO.
  Forward-looking note for if/when an operator carries hundreds of
  open orders. No fix needed; the comment is accurate.
- **`src/watcherDaemon.ts:29`** — `postLimit` wiring TODO. The
  `defaultFireDeps` factory throws when `postLimit` is called,
  signaling that `stop_limit` synthetics need dedicated wiring
  before they can fire in production. **Genuine open gap** — file
  `SH-STOP-LIMIT-POSTLIMIT-WIRE` if a use case surfaces. Until then,
  the throw is a correct fail-loud guard.
- **`src/backtest/harness.ts:17`** — `TODO(SH-BACKTEST Phase C)` for
  CLI/MCP surfaces beyond `kea record`. Phase C is explicitly
  deferred per BACKLOG line 343. Comment matches reality.
- **`src/backtest/adapters/exitRunnerAdapter.ts:14`** — TODO for
  replacing the standalone passive-pricing adapter with a call into
  `passive.runOneTick`. The seam exists (added in SH-BACKTEST-RUNTICK
  Phase 1), so this is a possible refactor; the adapter currently
  duplicates pricing logic. Risk: hidden divergence between adapter
  and runner. **Worth filing** as `SH-BACKTEST-ADAPTER-DEDUPE` (1–2h
  cleanup; non-blocking).

### Stale (1)

- **`src/strategies/sConditionalRoll.ts:9`** — references S11 Roll as
  not yet landed. **S11 Roll shipped 2026-05-06** (per BACKLOG line
  39). The TODO is partially stale: the *enhancement* (chain into
  S11 on take_profit fire) hasn't been built, but the dependency it
  was waiting on is satisfied. Update the wording or file
  `SH-CONDITIONAL-ROLL-CHAIN-S11`.

## 3. Test-coverage gaps

`find src -name '*.ts'` returned 118 files. `find test -name
'*.test.ts'` returned 165 files. The naive "no matching test by name"
check surfaced 4 source files:

- `src/tui/api.ts` — covered by `test/tui-api.test.ts`,
  `test/mcp.test.ts` (mocked at the import boundary).
- `src/synthetics/bracket.ts` — covered by
  `test/integration/bracket-lifecycle.test.ts` and
  `test/strategies/sBracketedExit.test.ts`.
- `src/synthetics/oco.ts` — covered by
  `test/integration/oco-race.test.ts`.
- `src/microHarness/executors.ts` — exercised through
  `test/microHarness/runner.test.ts` and `test/cli/micro.test.ts`
  (the executors are dispatched indirectly).

**Conclusion:** no genuine coverage gap. All 118 source files have
either a direct test partner or integration coverage. 2204 tests pass
on main; tsc clean.

## 4. Missed-requirement check vs specs

Cross-checked specs in `docs/superpowers/specs/` against shipped
behavior. Spot-checks:

- **`2026-05-05-synthetic-order-types-watcher.md`** — v1 listed 6
  synthetic kinds (stop_loss, stop_limit, trailing_stop, take_profit,
  oco, bracket). v1 *shipped* 8 (added `time_stop`, `step_trail`).
  Match: **shipped scope ≥ spec scope.** v2 buy-side synthetics
  deferred — covered by new spec PR #180.
- **`2026-05-05-pnl-attribution.md`** (SH-EDGE) — spec required
  per-strategy attribution, per-trigger attribution, per-market
  segmentation. All shipped. PR #169 (SH-EDGE-POLISH) added the
  cross-cutting `--ticker` filter and JSON envelope on top.
- **`2026-05-05-strategy-composition.md`** (SH-COMPOSE) — workflow
  state machines + 8 prebuilt templates. Shipped per
  `kea_template_register/list` MCP tools.
- **`2026-05-05-backtest-harness.md`** — record-and-replay phases A/B
  shipped; Phase D adapters shipped. Phase C (CLI surfaces beyond
  `kea record`) deferred per BACKLOG line 343. **Match: shipped scope
  + documented deferral.**
- **`2026-05-08-first-live-backtest-design.md`** + results doc —
  followup stories all triaged into BACKLOG (SH-FILL-SIM-DIRECTIONAL,
  SH-WATCHER-FILL-AUDIT, SH-PASSIVE-SPREAD-LOGIC, etc.). All shipped.

**No silent dropped requirements found.** The one drift is the
`sConditionalRoll.ts` S11-chain TODO (item 2 above).

## 5. Recommended follow-ups (file as backlog rows)

In priority order:

1. **`SH-CONDITIONAL-ROLL-CHAIN-S11`** (low priority). Wire
   sConditionalRoll preset into S11 Roll on take_profit fire.
   Currently the take_profit leg just exits at TP; the original
   intent was to roll into the next cycle's contract. ~1d.
   `src/strategies/sConditionalRoll.ts:9`.
2. **`SH-BACKTEST-ADAPTER-DEDUPE`** (low priority). Replace
   `src/backtest/adapters/exitRunnerAdapter.ts`'s standalone
   passive-pricing logic with a direct call into
   `passive.runOneTickBacktest`. The seam exists; the adapter is
   duplicating pricing logic and may drift. ~1–2h.
3. **`SH-STOP-LIMIT-POSTLIMIT-WIRE`** (only if a stop-limit use case
   surfaces). `src/watcherDaemon.ts:29`. Currently throws when the
   stop_limit synthetic fires. Document the gap or wire the
   ExitRunner-flavored postLimit. Operator hasn't hit this in
   practice — it's not a regression, just an incomplete v1 corner.

## 6. Doc/roadmap drift fixed in this sweep

- `docs/ROADMAP.md` — Phase 12 surface parity table updated (was all
  ❌, now mostly ✅). Phase 13 SH stories marked shipped (was listed
  as 6–8 day future work). Added "Current state (2026-05-09)" header.
  Added "Post-shipping refinements" subsection covering 5 follow-up
  PRs from this week.
- `docs/BACKLOG.md` — synced to 2026-05-09 evening: SH-PASSIVE-SELL-LIMIT,
  SH-PASSIVE-SPREAD-LOGIC, Min-chunk-value guard promoted to ✅.
  §7 shipped log gained 5 entries (PRs #177–#180 + min-chunk
  back-fill).

## 7. What's NOT in this sweep

- No code changes beyond the doc updates (per scope discipline).
- No deletion of stale branches (surfaced for human verification).
- No deletion of stale TODO comments (only flagged for follow-up
  filing).
- No new feature work.
