# Ideas Backlog — cfx-mongodb

> **Status:** Ideas only — **implement later if needed**  
> **Last updated:** 2026-05-26  
> **Completed tracks:** A (cleanup), B (TSDoc), C1 (slow query), C2 (`getQueryStats`)

Sammlung offener Ideen aus Planung und Review. Nichts hier ist committed to ship — Priorität und Scope klären wir, wenn ein Thema konkret wird.

---

## How to use this doc

| Status | Meaning |
|--------|---------|
| 💡 Idea | Not designed in detail or design exists but no go |
| 📋 Planned | Design doc exists — see link |
| ⏸️ Deferred | Explicitly later / only if needed |
| ✅ Done | Shipped on `dev` |

When an idea becomes work: link PR/issue, move to CHANGELOG, remove or mark done here.

---

## 1. Schema versioning (Track D)

**Status:** 📋 Planned — [SCHEMA-VERSIONING-PLAN.md](SCHEMA-VERSIONING-PLAN.md)  
**Priority:** High *if* CTFFramework needs repeatable schema steps on deploy

**Idea:** Shared ledger `_cfx_schema_versions` — `(resource, scope) → version` (integer).  
**Core offers:** `getSchemaVersion`, `setSchemaVersion` (small exports).  
**Consumer owns:** migration logic (backfill, field renames) on `cfx-mongodb:ready`.

**Not in scope for now:** automatic document transforms, Flyway-style runner in core.

**Open decisions:** explicit `resource` param vs `GetInvokingResource()`; allow downgrade ConVar.

---

## 2. Full migrations / migration runner

**Status:** ⏸️ Deferred — only if schema ledger (§1) is not enough

**Idea:** Optional sibling resource `cfx-mongodb-migrate` — file-based `migrations/001_*.ts`, up/down, lock.  
**Why deferred:** Domänenwissen gehört in Consumer; Core soll dünn bleiben.

**Trigger to revisit:** CTFFramework hat >N manuelle Migration-Scripts pro Release.

---

## 3. CI / build pipeline & pre-built releases (GitHub)

**Status:** 💡 Idea — detail in [QUALITY-AUDIT-2026.md](QUALITY-AUDIT-2026.md) Track I  
**Source:** Post-track discussion + distribution UX

**Today:** CI on push `dev`/`main` — lint, tsc, test, build; uploads `dist/` artifact (maintainers only).

**Gap:** Server operators must clone + `yarn build` — bad DX.

**Idea (Track I):**

- `release.yml` with `workflow_dispatch` and/or tag `v*` on `dev` — **no merge to `main` required**
- Output: GitHub Release ZIP with `dist/`, `fxmanifest.lua`, `package.json`, prod `node_modules/` (mongodb)
- Consumer: download → extract to `resources/cfx-mongodb` → ConVars → `ensure`

**Related:** `main` behind `dev` — irrelevant for single-consumer internal use until external users appear.

---

## 4. Tests — improve & extend

**Status:** 💡 Idea  
**Current:** 89 Vitest tests (mock DB, contract sync, perf, validateQuery)

**Ideas:**

| Area | Idea |
|------|------|
| Coverage | Handlers edge cases, `schemaService` when D1 exists |
| Integration | Optional CI job vs real MongoDB (docker service) |
| Contract | Stricter drift check API.md ↔ handlers |
| Perf | Regression thresholds (flake risk — optional manual dispatch) |
| E2E FiveM | Smoke on dev server — manual checklist |

**Trigger:** Before `main` release or after schema versioning export.

---

## 5. ESLint & TypeScript definitions for consumers

**Status:** 💡 Idea  
**Source:** Post-track — other modules/projects should type against cfx-mongodb

**Ideas:**

| Item | Idea |
|------|------|
| **Published types** | Export `src/types/api.ts` (+ responses) as package or `types/` in repo |
| **`.d.ts` bundle** | `yarn build:types` → consumable from CTFFramework monorepo |
| **ESLint** | Share config or `eslint-plugin`-style rules for export envelope usage |
| **Consumer DX** | Document `CfxMongoResult<T>`, `CFX_MONGODB_EXPORTS`, new types as they ship |

**Overlap:** Track D3 in schema plan — types for `getSchemaVersion` when implemented.

---

## 6. Observability — UI & monitoring (Track C3+)

**Status:** ⏸️ Deferred — [OBSERVABILITY-PLAN.md](OBSERVABILITY-PLAN.md)

**Done:** C1 slow query log, C2 `getQueryStats` ring buffer.

**Later if needed:**

- Admin NUI/CEF (`mongodb_perf_ui`) — staging only
- `tools/query-dashboard/` localhost dev
- CI perf bench vs real Mongo

---

## 9. Consumer integration & config profiles

**Status:** ✅ Documented — [CONFIGURATION.md](../CONFIGURATION.md)

ConVar-first connection; `exec mongodb.local.cfg` + gitignore for multi-dev teams (`.env`-like workflow without runtime `.env`). Programmatic `connect()` remains advanced/optional.

---

## 10. Docs & examples (optional)

**Status:** ⏸️ Deferred

| Item | Notes |
|------|-------|
| `docs/examples/patterns.md` | CTFFramework success checks, filter patterns (Track B optional) |
| Schema examples | When Track D ships |
| OpenAPI/JSON schema | Machine-readable contract for codegen |

---

## 8. API / runtime (low priority ideas)

**Status:** 💡 Idea — not requested

| Item | Notes |
|------|------|
| Aggregation / transactions via exports | Explicitly out of scope in roadmap |
| `GetInvokingResource()` in perf logs | Privacy vs debug value |
| `@citizenfx/client` in devDependencies | Audit — server-only resource |
| Typedoc HTML | CI artifact, not committed |

---

## Suggested order *when* we implement

```
1. Track I  — pre-built release ZIP from CI (dev tag)   — best DX for server deploy
2. Track E  — scout + checklist (after push, no PR required)
3. Track F  — docs / examples / TSDoc headers
4. Track G  — test depth
5. Track H  — load bench (optional)
6. Backlog  — Schema D, types publish, C3 UI
```

---

## References

| Doc | Topic |
|-----|-------|
| [MAINTENANCE-ROADMAP.md](MAINTENANCE-ROADMAP.md) | Tracks A–D overview |
| [SCHEMA-VERSIONING-PLAN.md](SCHEMA-VERSIONING-PLAN.md) | Track D design |
| [OBSERVABILITY-PLAN.md](OBSERVABILITY-PLAN.md) | Track C3+ design |

---

## Changelog of this backlog

| Date | Change |
|------|--------|
| 2026-05-26 | Quality audit baseline; Track I pre-built releases; solo-team workflow |
