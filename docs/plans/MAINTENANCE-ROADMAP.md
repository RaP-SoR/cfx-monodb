# Maintenance Roadmap — cfx-mongodb

> **Status:** Planning (post-refactor, on `dev`)  
> **Last updated:** 2026-05-26  
> **No release target yet** — execute in phases, merge to `dev` incrementally.

After Waves 1–4 (refactor, TS6, docs consolidation), three tracks remain:

| Track | Focus | Priority |
|-------|-------|----------|
| **A** | Repo cleanup & restructure | High — quick wins |
| **B** | In-code documentation (TSDoc) | Medium |
| **C** | Performance & query observability | Separate epic — design first |

---

## Track A — Cleanup & restructure

### A1. Remove obsolete worktree scripts

Refactor is merged; branches and worktrees are gone. **Delete:**

| File | Reason |
|------|--------|
| `scripts/setup-worktrees-wave1.ps1` | Wave 1 manual fallback — `/multitask` replaces this |
| `scripts/setup-worktrees-wave1.sh` | Same |
| `scripts/setup-worktrees-wave3.ps1` | W3C parallel handlers — done |
| `scripts/setup-worktrees-wave4.ps1` | W4 — done |

**Keep:** empty `scripts/` folder or add future utility scripts (e.g. `scripts/check-docs-links.mjs`) if useful.

**Update references after delete:**

- `docs/AI-STACK.md` — remove worktree script row
- `docs/refactor/README.md` — mark manual worktree section as *removed* or archive-only
- `docs/refactor/REFACTOR-STATUS.md` — check off worktree cleanup

### A2. Archive refactor orchestration artifacts

Refactor docs are **historical value**, not day-to-day navigation.

**Option (recommended):** move `docs/refactor/` → `docs/archive/refactor/`

| Keep in active docs | Move to archive |
|---------------------|-----------------|
| `docs/README.md`, `API.md`, `ARCHITECTURE.md`, `GUIDE.md` | `WAVE-*-SPEC.md`, multitask prompts |
| `docs/SEARCH-MAP.md`, `CHANGELOG.md` | `REFACTOR-STATUS.md` (final snapshot) |
| `docs/examples/*` | `INTERFACES.md` (target shapes — merge useful parts into ARCHITECTURE first) |

**Cursor artifacts:**

| Artifact | Action |
|----------|--------|
| `.cursor/rules/refactor-boundaries.mdc` | **Delete** — branches `refactor/w*` no longer exist |
| `.cursor/skills/refactor-orchestrator/SKILL.md` | **Archive** → `docs/archive/refactor-orchestrator-SKILL.md` or delete |
| `AGENTS.md` | Remove refactor-orchestrator from “Start here” |
| `docs/AI-STACK.md` | Remove active refactor / worktree section; one-line link to archive |

### A3. ESLint / tooling hygiene

| Item | Action |
|------|--------|
| `.eslintignore` | Migrate ignores into `eslint.config.mjs` (ESLint 9 warning in CI) |
| `@citizenfx/client` in devDependencies | Audit — server-only resource may not need client types |
| `docs/refactor` grep in skills | Point to archive paths only |

### A4. Restructure proposal (final `docs/` tree)

```
docs/
  README.md              # hub
  API.md
  ARCHITECTURE.md        # + lifecycle diagrams
  GUIDE.md
  CHANGELOG.md
  SEARCH-MAP.md
  AI-STACK.md
  examples/
  plans/
    MAINTENANCE-ROADMAP.md   # this file
    OBSERVABILITY-PLAN.md    # Track C detail
  archive/
    refactor/                # WAVE specs, status board, README
```

### A5. Track A checklist

- [ ] Delete 4 worktree scripts
- [ ] Move `docs/refactor/` → `docs/archive/refactor/`
- [ ] Delete `refactor-boundaries.mdc`
- [ ] Slim `AGENTS.md` + `AI-STACK.md`
- [ ] Fix broken internal links (grep `docs/refactor`, `scripts/setup-worktrees`)
- [ ] Optional: merge `INTERFACES.md` useful bits into `ARCHITECTURE.md`, then drop duplicate

**Gate:** `yarn tsc && yarn test && yarn build && yarn lint` (no runtime changes expected)

**Estimated effort:** ~1–2 hours

---

## Track B — In-code documentation audit

### Current state

| Area | JSDoc/TSDoc | External doc |
|------|-------------|--------------|
| `src/types/api.ts` | Good — consumer types | `docs/API.md` |
| `src/api/handlers/*.ts` | None | `docs/API.md` + examples |
| `src/api/withDb.ts` | None | implied in ARCHITECTURE |
| `src/validateQuery.ts` | None | API security section |
| `src/connector.ts` | None | ARCHITECTURE |
| `src/services/indexService.ts` | None | GUIDE ConVars |
| `src/utils.ts` | None | — |
| `src/responses.ts` | None | API envelope |
| `src/config.ts` | None | GUIDE + API |

**Principle:** `docs/API.md` remains the **consumer contract**. In-code docs target **maintainers and agents**, not duplicate the API reference.

### What to document (priority order)

1. **Module headers** (`@file` / block comment) on:
   - `withDb.ts` — envelope pipeline, never throws
   - `validateQuery.ts` — denylist scope, not a sandbox
   - `connector.ts` — singleton, DbProvider
   - `indexService.ts` — limits (50 collections, 20 indexes)
   - `registerExports.ts` — wiring only

2. **Public functions** (TSDoc `@param` / `@returns`) on:
   - `withDb`, `normalizeIdFilter`
   - `ensureIndexesForCollection`, `ensureIndexesFromConvar`
   - `validateFilter`, `validateUpdate`
   - `redactMongoUri`, `formatError`

3. **Do not** TSDoc every export handler inline — keeps handlers thin; link to `docs/API.md` in module header instead.

4. **Optional tooling** (later):
   - `typedoc` → `docs/generated/` (CI artifact, not committed) — only if team wants HTML API from types
   - ESLint `eslint-plugin-jsdoc` — enforce on `src/api/**`, `src/services/**` only

### Skill update

Extend `.cursor/skills/cfx-mongodb/SKILL.md`:

- When editing pipeline/security modules → add/update TSDoc
- Handlers → behavior change updates `docs/API.md` + examples, not handler comments

### Track B checklist

- [ ] Define TSDoc standard in `AGENTS.md` (5–10 lines)
- [ ] Document priority modules (list above)
- [ ] Add `docs/examples/patterns.md` optional — CTFFramework checks, filters (from prior review)
- [ ] Optional: one test that `api.ts` exports match manifest (already have contract test)

**Estimated effort:** ~2–3 hours

---

## Track C — Performance & query observability

**Separate plan:** [OBSERVABILITY-PLAN.md](OBSERVABILITY-PLAN.md)

Summary:

- **First target:** MySQL-style **slow query warnings** (`mongodb_perf_enabled`, `mongodb_perf_slow_ms`) — ConVar-gated, default off
- **UI & full monitoring:** deferred — finalize plan later
- **Production (100+):** perf ConVars aus unless admin consciously enables slow-query logging
- **Staging (~10–20):** slow log useful for tuning; UI comes later

Execute Track C **after** Track A; implement **C1 only** first.

---

## Suggested execution order

```
Track A (cleanup)  →  merge
Track B (TSDoc)    →  merge   } can overlap B with A docs-only
Track C design     →  review OBSERVABILITY-PLAN.md
Track C implement  →  separate branch, ConVar-gated, tests
```

No `main` release until you explicitly want one; all tracks target `dev`.

---

## Out of scope (explicit)

- GitHub Wiki (repo docs are source of truth)
- Aggregation / transaction support via exports
- Bundling a web UI inside `cfx-mongodb` for production servers
- Force-push or `main` merge
