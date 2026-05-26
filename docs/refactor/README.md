# Staged Refactor — Multi-Agent Playbook

Orchestrated hardening and architecture refactor on branch `refactor/staged-hardening`.

## Documents

| File | Purpose |
|------|---------|
| [REFACTOR-STATUS.md](REFACTOR-STATUS.md) | Living board — wave/agent/branch/PR status |
| [WAVE-1-SPEC.md](WAVE-1-SPEC.md) | Wave 1: security, logging, cleanup (5 parallel agents) |
| [WAVE-2-SPEC.md](WAVE-2-SPEC.md) | Wave 2: withDb pipeline + find semantics (2 sequential agents) |
| [WAVE-3-SPEC.md](WAVE-3-SPEC.md) | Wave 3: bootstrap, IndexService, handler split (2 + 3 + 1 agents) |
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

## Wave 2 — sequential (2 agents, not parallel)

Wave 2 touches `exports.ts` — run **W2A first**, merge, then **W2B**. Do not parallelize both.

### Wave 2 `/multitask` orchestrator prompt

```
/multitask

Wave 2 for cfx-mongodb on refactor/staged-hardening. SEQUENTIAL — not parallel.

DECISION (confirmed): find not-found → { success: true, data: null } (breaking). Document in CHANGES.md.

STEP 1 — Subagent W2A (merge before Step 2):
Branch: refactor/w2a-pipeline-infra
Read docs/refactor/WAVE-2-SPEC.md section W2A.
Create: src/types/dbProvider.ts, src/api/withDb.ts, src/api/normalizeIdFilter.ts + tests.
Do NOT edit exports.ts. Gate: yarn tsc && yarn test && yarn build.
Commit: refactor(w2a): add withDb pipeline and normalizeIdFilter
STOP — notify orchestrator for merge before Step 2.

(After W2A merged — orchestrator re-runs with Step 2 only)

STEP 2 — Subagent W2B:
Branch: refactor/w2b-exports-pipeline
Read WAVE-2-SPEC W2B. Refactor exports.ts to use withDb + normalizeIdFilter.
Wire redactMongoUri in connector logs. Fix find not-found semantics.
Resolve it.todo in tests/api-contract.test.ts. Update docs/API.md + CHANGES.md.
Replace emitNet with TriggerEvent in connect/disconnect.
Gate: yarn tsc && yarn test && yarn build && yarn lint
Commit: refactor(w2b): wire withDb pipeline and align find not-found semantics
```

## Wave 3 — staged architecture split

**Order:** W3A → W3B → (W3C1 + W3C2 + W3C3 parallel) → W3D

Full spec: [WAVE-3-SPEC.md](WAVE-3-SPEC.md)

### Wave 3 Step 1 — `/multitask` (W3A bootstrap only)

```
/multitask

Wave 3 STEP 1 — cfx-mongodb on refactor/staged-hardening.

Read docs/refactor/WAVE-3-SPEC.md section W3A.
Read AGENTS.md and .cursor/skills/cfx-mongodb/SKILL.md.

Branch: refactor/w3a-bootstrap (use /worktree)

Tasks:
- Create src/bootstrap.ts — move onResourceStart/Stop from index.ts
- index.ts becomes: import "./bootstrap"
- Remove registerExports() from connector.ts connect()
- Call registerExports(connector) from bootstrap after connect()
- MongoDBConnector implements DbProvider

FORBIDDEN: src/api/handlers/*, shrinking exports.ts

Gate: yarn tsc && yarn test && yarn build && yarn lint
Commit: refactor(w3a): extract bootstrap and decouple connector from exports
Do NOT merge — notify orchestrator.
```

### Wave 3 Step 2 — `/multitask` (W3B IndexService, after W3A merge)

```
/multitask

Wave 3 STEP 2 — after W3A merged.

Read docs/refactor/WAVE-3-SPEC.md section W3B.

Branch: refactor/w3b-index-service (use /worktree)

Create src/services/indexService.ts + tests/indexService.test.ts
Wire bootstrap.ts and ensureIndexes export to IndexService.
Dedupe index init logic.

Gate: yarn tsc && yarn test && yarn build
Commit: refactor(w3b): add IndexService and dedupe index initialization
Do NOT merge — notify orchestrator.
```

### Wave 3 Step 3 — `/multitask` (3 parallel handler agents, after W3B merge)

```
/multitask

Wave 3 STEP 3 — spawn 3 PARALLEL subagents after W3B merged.
Read docs/refactor/WAVE-3-SPEC.md sections W3C1/W3C2/W3C3.

Subagent W3C1 — branch refactor/w3c1-handlers-read
Create ONLY src/api/handlers/read.ts
Move find, findAll, findById, count from exports.ts into registerReadHandlers().
Do NOT edit exports.ts or other handler files.

Subagent W3C2 — branch refactor/w3c2-handlers-write
Create ONLY src/api/handlers/write.ts
Move insert, update, delete into registerWriteHandlers().

Subagent W3C3 — branch refactor/w3c3-handlers-ops
Create ONLY src/api/handlers/admin.ts and src/api/handlers/lifecycle.ts
Move health, config, ensureIndexes, getVersion, connect, disconnect, isConnected, getDb.

Each: yarn tsc && yarn test && yarn build, commit, do NOT merge.
```

Optional worktrees: `.\scripts\setup-worktrees-wave3.ps1`

### Wave 3 Step 4 — `/multitask` (W3D wiring, after W3C1/2/3 merge)

```
/multitask

Wave 3 STEP 4 — after W3C1, W3C2, W3C3 merged.

Read docs/refactor/WAVE-3-SPEC.md section W3D.

Branch: refactor/w3d-register-exports (use /worktree)

Create src/api/registerExports.ts wiring all handler register functions.
Shrink src/exports.ts to re-export shim only.
Update SEARCH-MAP.md, docs/ARCHITECTURE.md, CHANGES.md.

Gate: yarn tsc && yarn test && yarn build && yarn lint
Commit: refactor(w3d): split exports into handler modules and registerExports wiring
Do NOT merge — notify orchestrator.
```

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
