# Wave 3 Spec — Architecture split

**Target merge branch:** `refactor/staged-hardening`  
**Prerequisite:** Wave 2 complete (`b6cc3f1` or later)

Wave 3 removes structural debt: circular deps, god-file `exports.ts`, duplicated index logic.

**Strategy:** 2 sequential foundation agents, then **3 parallel** handler agents, then 1 wiring agent.

---

## Target structure (end state)

```
src/
  index.ts                 # import "./bootstrap" only
  bootstrap.ts               # lifecycle, connect, ready event, index init
  connector.ts               # MongoClient only — no registerExports
  exports.ts                 # re-export shim: export { registerExports } from "./api/registerExports"
  services/
    indexService.ts          # ensureIndexesForCollection, ensureIndexesFromConvar
  api/
    registerExports.ts       # wiring only — calls handler register functions
    withDb.ts                # (Wave 2)
    normalizeIdFilter.ts     # (Wave 2)
    handlers/
      read.ts                # find, findAll, findById, count
      write.ts               # insert, update, delete
      admin.ts               # health, config, ensureIndexes, getVersion
      lifecycle.ts           # connect, disconnect, isConnected, getDb
```

---

## Global rules

1. **No behavior changes** unless fixing obvious bugs — gate must stay 63/63 tests green.
2. Exports never throw; CTFFramework fields unchanged.
3. Gate: `yarn tsc && yarn test && yarn build && yarn lint`
4. Update `SEARCH-MAP.md`, `docs/ARCHITECTURE.md`, `CHANGES.md` when structure changes.
5. Read `docs/refactor/INTERFACES.md` and `.cursor/skills/cfx-mongodb/SKILL.md`.

---

## Merge train overview

```
W3A (bootstrap)  →  merge  →  W3B (index service)  →  merge
       ↓
  W3C1 + W3C2 + W3C3  (parallel handlers)
       ↓ merge any order
  W3D (registerExports + shim + docs)
```

---

## Agent W3A — Bootstrap & connector decoupling

**Branch:** `refactor/w3a-bootstrap`  
**Model:** Claude Sonnet (architecture)  
**Merge first — blocks everything else**

### OWNS

| File | Action |
|------|--------|
| `src/bootstrap.ts` | **new** — move lifecycle from `index.ts` |
| `src/index.ts` | thin entry: `import "./bootstrap"` |
| `src/connector.ts` | remove `registerExports()` call; implement `DbProvider` explicitly |
| `tests/bootstrap.test.ts` | **new** optional — smoke test index init hook |

### MUST NOT TOUCH

- `src/exports.ts` (W3D)
- `src/api/handlers/*` (W3C)

### Tasks

1. Move `onResourceStart` / `onResourceStop` handlers to `bootstrap.ts`.
2. Keep index-init logic in bootstrap **for now** (W3B extracts to IndexService).
3. Remove `import { registerExports } from "./exports"` from `connector.ts`.
4. Call `registerExports(connector)` from `bootstrap.ts` **after** successful `connect()` (same order as today).
5. `MongoDBConnector` satisfies `DbProvider` from `src/types/dbProvider.ts`.
6. Resolve circular import: `connector` must not import `exports`.

### Acceptance

- [ ] No circular dep connector ↔ exports
- [ ] `cfx-mongodb:ready` still fires after connect
- [ ] All tests green

**Commit:** `refactor(w3a): extract bootstrap and decouple connector from exports`

---

## Agent W3B — IndexService

**Branch:** `refactor/w3b-index-service`  
**Model:** Codex / Composer Fast  
**Depends on:** W3A merged

### OWNS

| File | Action |
|------|--------|
| `src/services/indexService.ts` | **new** |
| `tests/indexService.test.ts` | **new** |
| `src/bootstrap.ts` | replace inline index loop with `ensureIndexesFromConvar(db)` |
| `src/exports.ts` | **only** `ensureIndexes` export body — extract call to service (minimal touch) |

### Tasks

1. Implement per `INTERFACES.md`:
   - `ensureIndexesForCollection(db, collectionName, specs): Promise<number>`
   - `ensureIndexesFromConvar(db): Promise<void>` using `parseInitIndexes()` from utils
2. Replace duplicated index logic in bootstrap and `ensureIndexes` export.
3. Keep limits: 50 collections, 20 indexes per collection (from utils/bootstrap).

### Acceptance

- [ ] Single source of truth for index creation
- [ ] Tests for indexService with mock db
- [ ] All tests green

**Commit:** `refactor(w3b): add IndexService and dedupe index initialization`

---

## Agents W3C1 / W3C2 / W3C3 — Handler extraction (parallel)

**Run after W3B merged.** Three subagents in parallel — **no shared files**.

### W3C1 — Read handlers

**Branch:** `refactor/w3c1-handlers-read`  
**Model:** Codex

**Create only:** `src/api/handlers/read.ts`

Export function:
```typescript
export function registerReadHandlers(
  provider: DbProvider,
  register: (name: string, fn: Function) => void
): void;
```

Move: `find`, `findAll`, `findById`, `count` from `exports.ts` — **identical behavior**.

**FORBIDDEN:** `exports.ts`, `registerExports.ts`, other handler files

---

### W3C2 — Write handlers

**Branch:** `refactor/w3c2-handlers-write`  
**Model:** Codex

**Create only:** `src/api/handlers/write.ts`

Move: `insert`, `update`, `delete`

**FORBIDDEN:** same as W3C1

---

### W3C3 — Admin + lifecycle handlers

**Branch:** `refactor/w3c3-handlers-ops`  
**Model:** Codex

**Create only:**
- `src/api/handlers/admin.ts` — `health`, `config`, `ensureIndexes`, `getVersion`
- `src/api/handlers/lifecycle.ts` — `connect`, `disconnect`, `isConnected`, `getDb`

**FORBIDDEN:** same as W3C1

### W3C acceptance (each)

- [ ] New file only (+ optional co-located test)
- [ ] Uses `withDb`, `normalizeIdFilter`, `validateFilter` as today
- [ ] `exports.ts` unchanged until W3D

---

## Agent W3D — Wiring + shim + docs

**Branch:** `refactor/w3d-register-exports`  
**Model:** Claude Sonnet (integration)  
**Depends on:** W3C1 + W3C2 + W3C3 merged

### OWNS

| File | Action |
|------|--------|
| `src/api/registerExports.ts` | **new** — wire all handler register functions |
| `src/exports.ts` | shrink to shim: `export { registerExports } from "./api/registerExports"` |
| `SEARCH-MAP.md`, `docs/ARCHITECTURE.md`, `CHANGES.md` | update module graph |
| `tests/exports.test.ts` | adjust imports if needed (should still import from `../src/exports`) |

### Tasks

1. `registerExports(provider)` calls:
   - `registerReadHandlers`
   - `registerWriteHandlers`
   - `registerAdminHandlers`
   - `registerLifecycleHandlers`
2. Keep final `log("info", "Exports registered...")` in registerExports.
3. Verify import path in tests unchanged (`from "../src/exports"`).

### Acceptance

- [ ] `exports.ts` ≤ 5 lines (shim)
- [ ] No handler logic left in shim
- [ ] 63/63 tests, lint, build green
- [ ] Docs updated

**Commit:** `refactor(w3d): split exports into handler modules and registerExports wiring`

---

## File ownership matrix (Wave 3)

| File | W3A | W3B | W3C1 | W3C2 | W3C3 | W3D |
|------|-----|-----|------|------|------|-----|
| bootstrap.ts | ✅ | ✅ | | | | |
| connector.ts | ✅ | | | | | |
| index.ts | ✅ | | | | | |
| services/indexService.ts | | ✅ | | | | |
| handlers/read.ts | | | ✅ | | | |
| handlers/write.ts | | | | ✅ | | |
| handlers/admin/lifecycle.ts | | | | | ✅ | |
| api/registerExports.ts | | | | | | ✅ |
| exports.ts (shim) | | touch ensureIndexes only | | | | ✅ |

---

## Wave 3 complete checklist

- [ ] W3A → W3B → W3C1/2/3 → W3D merged
- [ ] Gate green (63+ tests)
- [ ] `REFACTOR-STATUS.md` Wave 3 → 🟢
- [ ] Wave 4 spec ready (TS6 + contract hardening)
