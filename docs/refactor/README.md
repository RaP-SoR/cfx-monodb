# Staged Refactor — Multi-Agent Playbook

Orchestrated hardening and architecture refactor on branch `refactor/staged-hardening`.

## Documents

| File | Purpose |
|------|---------|
| [REFACTOR-STATUS.md](REFACTOR-STATUS.md) | Living board — wave/agent/branch/PR status |
| [WAVE-1-SPEC.md](WAVE-1-SPEC.md) | Wave 1: security, logging, cleanup (5 parallel agents) |
| [INTERFACES.md](INTERFACES.md) | Shared types for Wave 2–3 (read-only until merged) |

## Quick start — native Cursor (recommended)

Cursor **3.2+** can run parallel agents with automatic git worktrees in the **Agents Window** — you do **not** need five separate IDE windows.

1. Open **Agents Window** (`Cmd/Ctrl+Shift+P` → “Agents Window”, or Cursor sidebar).
2. Base branch: stay on or checkout `refactor/staged-hardening`.
3. Start Wave 1 with **`/multitask`** and paste the Wave 1 orchestrator prompt (below).
4. Cursor spawns **async subagents**, each in an isolated **`/worktree`** branch.
5. Review diffs in the Agents grid; merge into `refactor/staged-hardening` when green.

### Wave 1 `/multitask` orchestrator prompt (copy into Agents Window)

```markdown
Execute Wave 1 of docs/refactor/WAVE-1-SPEC.md on branch refactor/staged-hardening.

Use /multitask: spawn 5 parallel subagents, each in its own /worktree branch:

- W1A refactor/w1a-security — recursive validateQuery (Claude). Files: src/validateQuery.ts, tests/validateQuery.test.ts
- W1B refactor/w1b-logging — redactMongoUri, formatError (Codex). Files: src/utils.ts, tests/utils.test.ts
- W1C refactor/w1c-cleanup — dead code, await disconnect (Codex). Files: index.ts, connector.ts, vite.config.mjs, package.json
- W2A refactor/w2a-manifest — fxmanifest + docs sync (Codex). Files: fxmanifest.lua, docs/API.md, SEARCH-MAP.md, …
- W2B refactor/w2b-types — src/types/api.ts + contract test (Sonnet). Files: src/types/api.ts, tests/api-contract.test.ts

Each subagent: read WAVE-1-SPEC section, yarn tsc && yarn test && yarn build, commit, do NOT merge.
I (orchestrator) will merge into refactor/staged-hardening.
```

Requires Cursor plan with parallel agents / Multitask Mode. Subagents run in background; you get notified when each completes.

## Fallback — manual worktrees (optional)

If `/multitask` or Agents Window is unavailable on your plan:

```powershell
.\scripts\setup-worktrees-wave1.ps1
```

Then open each worktree folder in a separate window, or use Agents Window with `/worktree` per task manually.

## Orchestrator skill

Load `.cursor/skills/refactor-orchestrator/SKILL.md` in the orchestrator tab (no code edits — merge train only).

## Merge train

Target branch for all wave PRs: **`refactor/staged-hardening`**

After all waves complete → single PR `refactor/staged-hardening` → `dev`.
