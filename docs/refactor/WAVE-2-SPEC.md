# Wave 2 Spec — Export pipeline & API semantics

**Target merge branch:** `refactor/staged-hardening`  
**Prerequisite:** Wave 1 merged (integration HEAD `c370b0f` or later)

Wave 2 is **mostly sequential** — `exports.ts` is a single hotspot. Use **2 subagents** with merge between them, not 5 parallel.

---

## Decision (orchestrator — before spawning agents)

**`find` not-found semantics (breaking change):**

| Export | Current (Wave 1) | Target (Wave 2) |
|--------|------------------|-----------------|
| `find` | `{ success: false, error: "Document not found" }` | `{ success: true, data: null }` |
| `findById` | `{ success: true, data: null }` | unchanged |

Rationale: align with `findById`; distinguish "not found" from runtime errors.  
**Must document in `CHANGES.md`** before merge. CTFFramework callers that check only `success` on `find` need updating.

If breaking change is rejected, keep behavior and replace `it.todo` with a permanent documented test — Wave 2 still lands pipeline work.

---

## Global rules

1. Exports **never throw** — `withDb` returns envelopes only.
2. Use `log()` + `formatError()` + `redactMongoUri()` — no raw `console.*` in exports/connector connect paths.
3. Gate: `yarn tsc && yarn test && yarn build && yarn lint`
4. Read: `docs/refactor/INTERFACES.md`, `.cursor/skills/cfx-mongodb/SKILL.md`

---

## Agent W2A — Pipeline infrastructure (merge first)

**Recommended model:** Claude Sonnet (types) or Codex  
**Branch:** `refactor/w2a-pipeline-infra`

### OWNS (new + tests only)

| File | Purpose |
|------|---------|
| `src/types/dbProvider.ts` | `DbProvider` interface |
| `src/api/withDb.ts` | `withDb(provider, op)` envelope helper |
| `src/api/normalizeIdFilter.ts` | Central `_id` conversion |
| `tests/withDb.test.ts` | disconnected, success, error paths |
| `tests/normalizeIdFilter.test.ts` | ObjectId conversion |

### MUST NOT TOUCH

- `src/exports.ts`
- `src/connector.ts`

### withDb contract

```typescript
// Returns { success: true, data: T } | { success: false, error: string }
// - No db → error "Database not connected" (do not throw)
// - op throws → log("error", ...) + formatError(err)
// - Never throw to caller
```

### Acceptance

- [ ] Unit tests for `withDb` and `normalizeIdFilter` pass
- [ ] `exports.ts` unchanged
- [ ] Existing suite still green

**Commit:** `refactor(w2a): add withDb pipeline and normalizeIdFilter`

---

## Agent W2B — Wire exports + semantics + docs (merge second)

**Recommended model:** Codex for refactor volume; review find breaking change  
**Branch:** `refactor/w2b-exports-pipeline`  
**Depends on:** W2A merged into `refactor/staged-hardening`

### OWNS

| File | Changes |
|------|---------|
| `src/exports.ts` | Refactor all handlers to `withDb`; use `normalizeIdFilter`; `log` not `console` |
| `src/connector.ts` | `redactMongoUri()` on connection log lines only |
| `src/config.ts` | Fix timeout typing (remove `as unknown` casts in exports) |
| `tests/exports.test.ts` | Update `find` not-found expectation if breaking change approved |
| `tests/api-contract.test.ts` | Resolve `it.todo` → real test |
| `docs/API.md` | `find` not-found = `{ success: true, data: null }` |
| `CHANGES.md` | Breaking: find semantics |
| `doc-lua.md`, `doc-typescript.md` | find not-found examples |
| `src/types/api.ts` | Fix stale fxmanifest comment if needed |

### Tasks

1. Replace per-export try/catch boilerplate with `withDb`.
2. Replace duplicated `_id` logic with `normalizeIdFilter`.
3. `connect`/`disconnect`: replace `emitNet(..., source, ...)` with `TriggerEvent` (server-only).
4. Connection logs: `redactMongoUri(connectionString)`.
5. **`find` not-found:** return `{ success: true, data: null }` (if decision approved).
6. Remove stderr noise in tests where disconnected insert still logs (optional: mock console in test).

### MUST NOT TOUCH

- `src/validateQuery.ts` (Wave 1)
- `src/api/withDb.ts` except import usage

### Acceptance

- [ ] No `console.*` in `exports.ts`
- [ ] `it.todo` in api-contract resolved
- [ ] All tests pass (0 todo unless explicitly deferred)
- [ ] `yarn build` green
- [ ] CTFFramework fields unchanged: `insertedId` string, `modifiedCount`, `deletedCount`

**Commit:** `refactor(w2b): wire withDb pipeline and align find not-found semantics`

---

## Merge order

```
W2A (infra) → gate → W2B (exports + docs) → gate → Wave 2 complete
```

---

## `/multitask` orchestrator prompt (Wave 2)

See [README.md](README.md#wave-2-multitask-prompt) for copy-paste block.

---

## Wave 2 complete checklist

- [ ] W2A + W2B merged
- [ ] `yarn tsc && yarn test && yarn build && yarn lint` green
- [ ] `REFACTOR-STATUS.md` Wave 2 → 🟢
- [ ] Wave 3 spec ready (`WAVE-3-SPEC.md` — architecture split)
