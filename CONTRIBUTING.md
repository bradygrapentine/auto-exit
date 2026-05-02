# Contributing

## Workflow

```
feat/* | fix/* | docs/* | ci/*  →  PR  →  CI green  →  squash-merge to main
```

Direct pushes to `main` are blocked. Every change goes through a PR.

## Branches

- `feat/<slug>` — new functionality
- `fix/<slug>` — bug fixes
- `docs/<slug>` — docs only
- `ci/<slug>` — workflows / build / tooling
- `chore/<slug>` — dep bumps, refactors, housekeeping

## Required CI checks

Branch protection blocks merge until both pass:

- `ci / test` — `npx tsc --noEmit` + `vitest run` (~2s)
- `mcp-smoke / smoke` — read-only live MCP smoke against prod Kalshi (~1s)

`mcp-smoke / harness` runs on every PR but is informational, not required (still surfaces drift in the PR check list).

Required-secret behavior: when `KALSHI_PROD_*` secrets aren't configured, smoke and harness exit 0 with `skipped: no Kalshi credentials configured`. See `code-and-docs-from-chatgpt/engine-ts/docs/runbooks/ci-secrets.md`.

## Local pre-flight

Before opening a PR:

```bash
cd code-and-docs-from-chatgpt/engine-ts
npx tsc --noEmit
npm test
npm run smoke:mcp                 # needs `kea login` profile
HARNESS=1 npm run harness:read-only
```

If any are red locally, don't push.

## Commit messages

Conventional-commits-ish. Lower-case type, no period:

```
feat(scope): short summary
fix(scope): short summary
docs(scope): short summary
ci(scope): short summary
test(scope): short summary
```

Multi-commit PRs are fine; squash-merge collapses them. Use regular merge commits only when preserving the granular history matters (large feature merges).

## Opening a PR

```bash
git checkout -b feat/<slug>
# work, commit
git push -u origin feat/<slug>
gh pr create --fill
```

Wait for CI green. Then:

```bash
gh pr merge --auto --squash
```

If CI is red, fix in additional commits on the same branch — don't force-push the existing commits unless rebasing for a clean review.

## Rebasing vs merging from main

Branch protection requires up-to-date with `main` before merging. If `main` advances while your PR is open:

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease
```

`--force-with-lease` (not plain `--force`) — rejects the push if someone else committed to your branch.

## Live testing against Kalshi

The smoke and harness hit **prod** Kalshi read-only. They never place orders. The harness `mutation` suite is gated to demo-only (`baseUrl === DEMO_BASE_URL`) and currently has no test cases — when mutating MCP tools land, all mutation tests must run against demo.

`kea login --profile <demo|prod>` switches the active profile. `kea use <profile>` flips between configured profiles.

## Worktrees for parallel work

For multi-track work (parallel subagents, independent feature tracks):

```bash
git worktree add -b feat/<slug> worktrees/<slug> main
ln -s $(pwd)/code-and-docs-from-chatgpt/engine-ts/node_modules \
      worktrees/<slug>/code-and-docs-from-chatgpt/engine-ts/node_modules
```

Worktrees go inside the project (`worktrees/<slug>`), not as siblings.
