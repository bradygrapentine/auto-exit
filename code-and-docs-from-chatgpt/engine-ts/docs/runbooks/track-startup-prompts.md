# Track Startup Prompts (4-terminal parallel build)

Paste-ready prompts for kicking off each of the 4 parallel sessions defined in `engine-ts/docs/superpowers/plans/2026-05-02-parallel-coordination.md`. Run **shared** first; the other 3 wait for the shared interface freeze announcement in `.claude/track-status/shared.md`.

---

## Cross-session conventions (every session)

- Use `model: "sonnet"` as default implementer; the orchestrating Opus session does dispatch + review only.
- Codex adversarial review (`codex:codex-rescue` skill) is mandatory before merge.
- Worktrees inside the project: `worktrees/track-<name>/`. Never as siblings or in `~/worktrees/`.
- Symlink `node_modules` from main checkout into the worktree's `engine-ts/` to avoid reinstalls.
- Each session writes `.claude/track-status/<track>.md` after every PR open/merge: `Current PR: #N (<title>) | Next: <story-id>`. Other sessions read these to coordinate.
- File-touch matrix in `parallel-coordination.md` is the contract — never edit a file outside your owned set without a coord issue.
- Shared PRs always merge first when in conflict; other tracks rebase.
- Branch protection requires `test` + `smoke` checks. Auto-merge via `gh pr merge --auto --squash` (attempt once; if rejected, hand off — don't retry).

---

## Terminal 1 — `shared` track (starts first)

```
I'm the SHARED-services session in a 4-terminal parallel build. My job is to land the unblock work first (W1.4 journal bug, W1.1 safety persistence, W4.5 harvest planner, W1.5 buy primitive) so the other 3 tracks can fan out.

Read in order:
1. CONTRIBUTING.md — branch + PR + CI workflow
2. code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-parallel-coordination.md — file-touch matrix; I own the surfaces listed under "shared owns"
3. code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-shared-services-unblock.md — the unblock plan (4 items, mostly parallel)
4. code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-track-shared.md — ongoing shared work after unblock

Dispatch policy: Sonnet implements (general-purpose subagent with model: "sonnet"), I orchestrate, full Opus subagent only on sticky blockers (2+ Sonnet attempts failed). Codex review mandatory before merge.

Setup:
  git worktree add -b feat/shared/unblock-batch1 worktrees/track-shared main
  ln -s $(pwd)/code-and-docs-from-chatgpt/engine-ts/node_modules worktrees/track-shared/code-and-docs-from-chatgpt/engine-ts/node_modules
  mkdir -p .claude/track-status

Status file: .claude/track-status/shared.md updated each PR with current item + next.

Start with the unblock plan. Item 1 (W1.4 journal pre-call ordering bug) is critical-fix and goes first; items 2-4 (W1.1, W4.5, W1.5) parallelize after W1.4 lands. Open one PR per item. Cross-post the frozen interface contract (TS types) in the PR description so other tracks can code against it.

Sync point with other 3 tracks: when all 4 unblock items are merged on main, post a single "shared interface freeze" announcement in .claude/track-status/shared.md.

Confirm setup, then start with W1.4.
```

---

## Terminal 2 — `engine` track

```
I'm the ENGINE-track session in a 4-terminal parallel build. My job is the S1–S16 strategy library, W3 cross-cutting refinements, and W4.2 + W4.4 optimizer/router work — all under src/ (excluding src/tui/ which belongs to tui-mcp).

Read in order:
1. CONTRIBUTING.md
2. code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-parallel-coordination.md — confirm I own the engine src/ files listed; no cross-track edits
3. code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-track-engine.md — ordered story list EN-1 through EN-18

Dispatch policy: Sonnet implements (general-purpose subagent with model: "sonnet"), I orchestrate, full Opus subagent only on sticky blockers. Codex review mandatory before merge.

Setup:
  git worktree add -b feat/engine/EN-1-<slug> worktrees/track-engine main
  ln -s $(pwd)/code-and-docs-from-chatgpt/engine-ts/node_modules worktrees/track-engine/code-and-docs-from-chatgpt/engine-ts/node_modules
  mkdir -p .claude/track-status

Status file: .claude/track-status/engine.md.

GATE: I cannot start until shared-track posts "interface freeze done" in .claude/track-status/shared.md. Specifically, I need: (a) buyRunner from W1.5 for entry-side strategies, (b) safety.json schema from W1.1 for safety merge in run() entry, (c) order_intent from W1.4 for journaling. Wait until those are on main.

Once unblocked: start with the next EN-N in the plan. PR per story. Each PR coordinates with shared track via the announced interface — do not modify shared-owned files; if I need a contract change, open an issue tagged "shared-coord" and wait.

Confirm setup + gate status. If shared isn't done yet, sleep until status flips green.
```

---

## Terminal 3 — `ext` track

```
I'm the EXT-track session in a 4-terminal parallel build. My job is the Chrome extension under code-and-docs-from-chatgpt/extension/ — popup polish, content scripts, DOM scraping, page UI surfaces (SP1.x stories + EX-7..11 strategy/trigger/safety panels).

Read in order:
1. CONTRIBUTING.md
2. code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-parallel-coordination.md — I own extension/ exclusively
3. code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-track-ext.md — story list EX-1 through EX-11

Dispatch policy: Sonnet implements (general-purpose subagent with model: "sonnet"), I orchestrate, full Opus subagent only on sticky blockers. Codex review mandatory before merge.

Setup:
  git worktree add -b feat/ext/EX-1-<slug> worktrees/track-ext main
  ln -s $(pwd)/code-and-docs-from-chatgpt/engine-ts/node_modules worktrees/track-ext/code-and-docs-from-chatgpt/engine-ts/node_modules
  mkdir -p .claude/track-status

Status file: .claude/track-status/ext.md.

GATE: extension stories that DON'T depend on shared (e.g., SP1.1 ticker auto-detect, SP1.4 progress bar polish) can start NOW even before shared lands. Extension stories that DO depend on shared (EX-8 SafetyPanel reads W1.1 contract; EX-9/10 strategy/trigger pickers need W4.5 / S library) must wait for the shared-track interface freeze announcement in .claude/track-status/shared.md.

Start with the next EX-N from the plan that has no shared-track dependency. PR per story. Never touch src/ — that's engine + tui-mcp + shared territory; if I need a server endpoint, open an issue tagged "shared-coord".

Confirm setup + first unblocked story.
```

---

## Terminal 4 — `tui-mcp` track

```
I'm the TUI-MCP-track session in a 4-terminal parallel build. My job is everything under src/tui/ and src/mcp.ts — Ink components, MCP tool registration, what-if panels, strategy/trigger launchers, SafetyTab consumer, kea_harvest_planner MCP surface.

Read in order:
1. CONTRIBUTING.md
2. code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-parallel-coordination.md — I own src/tui/ and src/mcp.ts; do not touch other src/
3. code-and-docs-from-chatgpt/engine-ts/docs/superpowers/plans/2026-05-02-track-tui-mcp.md — story list TM-1 through TM-8

Dispatch policy: Sonnet implements (general-purpose subagent with model: "sonnet"), I orchestrate, full Opus subagent only on sticky blockers. Codex review mandatory before merge.

Setup:
  git worktree add -b feat/tui-mcp/TM-1-<slug> worktrees/track-tui-mcp main
  ln -s $(pwd)/code-and-docs-from-chatgpt/engine-ts/node_modules worktrees/track-tui-mcp/code-and-docs-from-chatgpt/engine-ts/node_modules
  mkdir -p .claude/track-status

Status file: .claude/track-status/tui-mcp.md.

GATE: most TM stories depend on shared interfaces — TM-1/SP2.1 needs S library + W4.5 frozen; TM-3 trigger CRUD needs W4.1; TM-8 SafetyTab needs W1.1 contract. Wait for shared-track interface freeze in .claude/track-status/shared.md before starting any of these. TM stories that ONLY add MCP read-only tools or pure-TUI cosmetics may start sooner — check the dependency declaration per story.

Once unblocked: start with the next TM-N. PR per story. If I need a new safety.json field or new strategy, open an issue tagged "shared-coord"; never modify shared-owned files.

Confirm setup + first unblocked story.
```
