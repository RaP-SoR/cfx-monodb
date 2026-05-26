# Wave 1 Spec — Security, Hygiene, Contract (5 parallel agents)

**Target merge branch:** `refactor/staged-hardening`  
**No behavior breaking changes** to CTFFramework required exports unless documented in `CHANGES.md`.

### How to run (Cursor native)

Prefer **Agents Window + `/multitask`**: one orchestrator message spawns 5 parallel subagents, each in an auto-created **`/worktree`**. See [README.md](README.md) for the copy-paste orchestrator prompt.

Manual multi-window worktrees (`scripts/setup-worktrees-wave1.ps1`) are **fallback only**.

---

## Global rules (all Wave 1 agents)

1. **Only edit files listed under your agent** — see ownership table below.
2. Do **not** merge your own branch — open a PR or notify orchestrator.
3. Finish with: `yarn tsc && yarn test && yarn build` (add `yarn lint` if you touched linted files).
4. Exports must **never throw** — return `{ success: false, error }` (unchanged in Wave 1).
5. Read first: `AGENTS.md`, `.cursor/skills/cfx-mongodb/SKILL.md`, `docs/API.md`.

---

## File ownership (no overlap)

| Agent | OWNS | MUST NOT TOUCH |
|-------|------|----------------|
| **W1A** | `src/validateQuery.ts`, `tests/validateQuery.test.ts` | `exports.ts`, `connector.ts`, `utils.ts` |
| **W1B** | `src/utils.ts`, `tests/utils.test.ts` | `exports.ts`, `validateQuery.ts` |
| **W1C** | `src/index.ts`, `src/connector.ts`, `vite.config.mjs`, `package.json`, `yarn.lock` | `exports.ts`, `validateQuery.ts`, `utils.ts` |
| **W2A** | `fxmanifest.lua`, `docs/API.md`, `SEARCH-MAP.md`, `doc-lua.md`, `doc-typescript.md`, `CHANGES.md` | `src/*.ts` except none |
| **W2B** | `src/types/api.ts` (new), `tests/api-contract.test.ts` (new) | `exports.ts`, `fxmanifest.lua` |

---

## Agent W1A — Recursive query validation (Security)

**Recommended model:** Claude Sonnet / Opus (security reasoning)

### Tasks

1. Replace shallow key-only validation with **recursive** walk of filter/update/document objects.
2. Extend `DENY_OPERATORS` with at minimum: `$expr`, `$jsonSchema`.
3. Add limits (suggested defaults):
   - `MAX_DEPTH = 8`
   - `MAX_KEYS = 100` (total nodes visited)
4. Export helpers if needed: `validateFilter`, `validateUpdate`, `validateDocument` (for future insert validation).
5. Add `tests/validateQuery.test.ts` covering:
   - Top-level `$where` blocked (regression)
   - `{ $or: [{ $where: "..." }] }` blocked
   - `{ $and: [{ $function: { ... } }] }` blocked
   - Nested depth exceeded → error
   - Valid queries: `{ $and: [{ name: "x" }] }`, `{ $set: { a: 1 } }` on update path

### Acceptance

- [ ] All new unit tests pass
- [ ] Existing `tests/exports.test.ts` unchanged and green
- [ ] No changes outside owned files

---

## Agent W1B — Logging & credential redaction

**Recommended model:** Composer Fast / Codex

### Tasks

1. Add `redactMongoUri(uri: string): string`
   - Mask user/password: `mongodb://user:pass@host` → `mongodb://***:***@host`
   - Handle `mongodb+srv://` the same way
2. Add `formatError(err: unknown): string` — safe string for export envelopes
3. Add `tests/utils.test.ts` with URI redaction cases
4. Do **not** wire into `exports.ts` yet (Wave 2) — only implement utilities

### Acceptance

- [ ] `redactMongoUri` never leaks credentials in test fixtures
- [ ] Existing tests green
- [ ] No changes outside owned files

---

## Agent W1C — Dead code & dependency cleanup

**Recommended model:** Composer Fast / Codex

### Tasks

1. Remove unused import `registerExports` from `src/index.ts`
2. Remove unused `getAllCollections()` from `src/connector.ts` (or export + manifest — **prefer remove**)
3. `vite.config.mjs`: delete unused `polyfillCode` **or** inject it properly — pick one, document in comment
4. Remove `ts-node` from `package.json` dependencies
5. Remove `@citizenfx/client` from devDependencies (server-only resource)
6. Fix `package.json` `"main"` → `"dist/index.js"`
7. **Bugfix:** in `connector.connect()`, `await` the `disconnect()` call when reconnecting with new URL
8. Run `yarn install` if lockfile changes

### Acceptance

- [ ] `yarn tsc && yarn test && yarn build` green
- [ ] No changes outside owned files

---

## Agent W2A — Manifest & docs sync

**Recommended model:** Composer Fast (docs) + human review for API wording

### Tasks

1. Add missing exports to `fxmanifest.lua` `server_exports`:
   - `ensureIndexes`
   - `health`
   - `config`
2. Sync export list in `docs/API.md` and `SEARCH-MAP.md`
3. Mark `getDb`, `connect`, `disconnect` as **Advanced / Internal** with security warning
4. Clarify events: server uses `TriggerEvent`; document `cfx-mongodb:ready` and `cfx-mongodb:connected`
5. Add Wave 1 entry to `CHANGES.md` (docs/manifest sync, no runtime break)

### Acceptance

- [ ] Every implemented export is in manifest OR explicitly marked internal in API.md
- [ ] No TypeScript source changes

---

## Agent W2B — Public API types & contract test scaffold

**Recommended model:** Claude Sonnet (types) or Codex

### Tasks

1. Create `src/types/api.ts` with consumer-facing types:
   - `CfxMongoResult<T>`, `CfxMongoInsertResult`, `CfxMongoUpdateResult`, `CfxMongoDeleteResult`
   - Export name constants array `CFX_MONGODB_EXPORTS` matching intended manifest list
2. Create `tests/api-contract.test.ts`:
   - Assert export names in code registry match `CFX_MONGODB_EXPORTS` (use export-registry helper after Wave 2 wiring, or static list for now)
   - Placeholder test documenting known inconsistency: `find` vs `findById` not-found semantics
3. Do **not** change `exports.ts` behavior in Wave 1

### Acceptance

- [ ] Types compile under `yarn tsc`
- [ ] Contract test file runs (may use `@todo` for full registry sync until Wave 2)

---

## Agent briefing template (copy-paste per Cursor tab)

```markdown
You are agent W1A (Security) for cfx-mongodb staged refactor.

READ FIRST:
- docs/refactor/WAVE-1-SPEC.md (section W1A)
- AGENTS.md
- .cursor/skills/cfx-mongodb/SKILL.md

BRANCH: refactor/w1a-security
WORKTREE: ../worktrees/cfx-mongodb/w1a

OWNED FILES ONLY:
- src/validateQuery.ts
- tests/validateQuery.test.ts

FORBIDDEN: exports.ts, connector.ts, utils.ts, docs/*

WHEN DONE:
1. yarn tsc && yarn test && yarn build
2. Commit with message: refactor(w1a): recursive validateQuery with depth limits
3. Do NOT merge — notify orchestrator

Implement exactly per WAVE-1-SPEC acceptance criteria.
```

---

## Orchestrator merge checklist

After each agent PR:

- [ ] Diff only touches owned files
- [ ] CI/gate green on agent branch
- [ ] Merge into `refactor/staged-hardening`
- [ ] Update `docs/refactor/REFACTOR-STATUS.md`
- [ ] Notify next agent to rebase worktree if needed: `git pull origin refactor/staged-hardening`
