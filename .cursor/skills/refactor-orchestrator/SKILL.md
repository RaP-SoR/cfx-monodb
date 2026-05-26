---
name: refactor-orchestrator
description: >-
  Orchestrate the cfx-mongodb staged refactor across parallel Cursor agents and
  git worktrees. Use when merging wave PRs, assigning agent briefings, updating
  REFACTOR-STATUS.md, or planning multi-agent execution on refactor/staged-hardening.
---

# Refactor Orchestrator — cfx-mongodb

You coordinate parallel agents. **You do not implement feature code** unless unblocking a merge conflict.

## Before every session

1. Read [docs/refactor/REFACTOR-STATUS.md](../../../docs/refactor/REFACTOR-STATUS.md)
2. Read the active wave spec (e.g. [WAVE-1-SPEC.md](../../../docs/refactor/WAVE-1-SPEC.md))
3. Confirm base branch: `refactor/staged-hardening`

## Your responsibilities

| Task | Action |
|------|--------|
| Assign work | Give each agent: branch, worktree path, owned files, model hint |
| Enforce boundaries | Reject PRs that touch files outside ownership |
| Merge train | Merge small PRs into `refactor/staged-hardening` every 1–2 h |
| Gate | After each merge: `yarn tsc && yarn test && yarn build` |
| Status board | Update `REFACTOR-STATUS.md` row → 🟢 + PR link |
| Unblock | Resolve merge conflicts; never bypass tests |

## Wave 1 — five agents (parallel)

| ID | Branch | Model hint | Owned files |
|----|--------|------------|-------------|
| W1A | `refactor/w1a-security` | Claude (security) | `validateQuery.ts`, `tests/validateQuery.test.ts` |
| W1B | `refactor/w1b-logging` | Codex / Composer Fast | `utils.ts`, `tests/utils.test.ts` |
| W1C | `refactor/w1c-cleanup` | Codex / Composer Fast | `index.ts`, `connector.ts`, `vite.config.mjs`, `package.json` |
| W2A | `refactor/w2a-manifest` | Composer Fast | `fxmanifest.lua`, `docs/API.md`, `SEARCH-MAP.md`, … |
| W2B | `refactor/w2b-types` | Sonnet | `src/types/api.ts`, `tests/api-contract.test.ts` |

Full specs: [WAVE-1-SPEC.md](../../../docs/refactor/WAVE-1-SPEC.md)

Suggested merge order: W1C → W1B → W1A → W2B → W2A (any order OK — no file overlap).

## Worktree setup

```powershell
.\scripts\setup-worktrees-wave1.ps1
```

One Cursor window per worktree. Orchestrator tab stays on main repo or `refactor/staged-hardening`.

## Agent briefing (copy to implementer tab)

```markdown
READ: docs/refactor/WAVE-1-SPEC.md (your section), AGENTS.md, .cursor/skills/cfx-mongodb/SKILL.md
BRANCH: refactor/w1X-...
OWNED FILES ONLY: (from spec)
FORBIDDEN: (from spec)
DONE: yarn tsc && yarn test && yarn build → commit → notify orchestrator
DO NOT MERGE YOURSELF
```

## PR review checklist

- [ ] Diff scope matches agent ownership
- [ ] No CTFFramework breaking changes without `CHANGES.md`
- [ ] `insertedId` still string; exports never throw
- [ ] Tests added/updated for changed behavior
- [ ] Gate green

## Model routing

| Work type | Model |
|-----------|-------|
| Security / validation depth | Claude Sonnet or Opus |
| Boilerplate, cleanup, docs sync | Codex / Composer Fast |
| Type design, interfaces | Claude Sonnet |
| Merge conflict in `exports.ts` | Claude Opus (Wave 2+) — single owner only |

## When Wave 1 is complete

1. Run full gate on `refactor/staged-hardening`
2. Mark Wave 1 🟢 in `REFACTOR-STATUS.md`
3. Create `docs/refactor/WAVE-2-SPEC.md` (export pipeline — `withDb`, wire `redactMongoUri`)
4. Do **not** merge to `dev` until all planned waves complete or explicit milestone agreed

## Invariants (never break)

From `.cursor/skills/cfx-mongodb/SKILL.md`:

- Exports never throw
- `insertedId` always string
- `node_version '22'` in fxmanifest
- Edit `src/`, never `dist/`

## Additional resources

- [docs/refactor/README.md](../../../docs/refactor/README.md)
- [INTERFACES.md](../../../docs/refactor/INTERFACES.md) — Wave 2–3 target shapes
- [docs/AI-STACK.md](../../../docs/AI-STACK.md)
