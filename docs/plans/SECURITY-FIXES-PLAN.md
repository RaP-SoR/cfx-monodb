# Security fixes plan (pre-stable)

> **Prerequisite:** [SECURITY.md](../SECURITY.md) — ✅ concept finalized 2026-05-27  
> **When:** **Next** — before manual smoke and `dev` → `main` / `v1.0.0`  
> **Scope:** Small, behavior-safe hardening — no new exports unless necessary

---

## Decision log

| ID | Fix | Priority | Breaking? | Default recommendation |
|----|-----|----------|-----------|------------------------|
| **SF-1** | Call `validateDocument()` on `insert` payload | **P0** | Low* | ✅ Done |
| **SF-2** | Tests: insert rejects `$where` / depth overflow in document | **P0** | No | ✅ Done |
| **SF-3** | Document collection-name rule in examples (no code change) | **P1** | No | ✅ Done — `lua/` + `typescript/` patterns |
| **SF-4** | `config()` uses `getLogLevel()` not raw ConVar | **P2** | No | ✅ Done |
| **SF-5** | Tiered limits / caller context | **P3** | Maybe | **Defer** post-stable — design below |
| **SF-6** | `connect()` return envelope instead of throw/event-only | **P3** | Yes | **Defer** — documented advanced API |

\*Insert payloads that relied on forbidden operators would start failing — acceptable for security.

---

## SF-1 + SF-2 — Insert validation

**Files:** `src/api/handlers/write.ts`, `tests/handlers/write.test.ts` (or `tests/exports.test.ts`)

**Change:**

```typescript
// insert handler, before insertOne:
validateDocument(document as Record<string, unknown>);
```

**Tests:**

- Insert plain doc → success (unchanged)
- Insert `{ $where: "..." }` top-level or nested → `{ success: false, error }`
- Insert doc exceeding MAX_DEPTH / MAX_KEYS → error envelope

**Docs:** API.md limitations row — remove “no validateDocument on insert” after ship.

---

## SF-3 — Collection name hygiene (docs only)

Add to [patterns.md](../examples/lua/patterns.md) and TS mirror:

- Collection names are **literals** in source (`"players"`, `"accounts"`)
- Never `collectionName = clientInput`

No runtime validation in v1.0.0 (would break dynamic multi-tenant patterns some servers use intentionally).

---

## SF-4 — config() log level (optional)

**File:** `src/api/handlers/admin.ts`  
**Change:** `logLevel: getLogLevel()` instead of raw `GetConvar("mongodb_log_level")`  
**Test:** invalid ConVar → `config().data.logLevel === "info"`

---

## Verification gate (before stable)

```bash
yarn gate
yarn test:integration   # if Mongo available / CI green
```

Manual smoke (maintainer): one insert/find/update/delete cycle from a **non-framework** test resource or `docs/examples/sample-resource/`.

---

## SF-5 — Tiered limits / caller context (deferred, design sketch)

**Problem:** Player inventory path and 15‑minute autosave both hammer exports; one global rate limit would break legitimate system jobs.

**Possible directions (post-stable, pick one if needed):**

| Approach | Pros | Cons |
|----------|------|------|
| **Consumer wrappers only** | Flexible tiers (player/system/admin) | Every resource rolls own limits |
| **Core: `GetInvokingResource()` quotas** | Per-resource ConVar map | Does not distinguish player vs system inside same resource |
| **Core: optional export arg `context`** | Explicit `player` \| `system` | Spoofable by any resource — honor system only if you trust callers |
| **Separate resources** | `my-game` vs `my-autosave` — quota by resource name | Ops overhead |

**Recommendation for cfx-mongodb:** stay **consumer-first** for v1.x; add **observability** (`GetInvokingResource` in perf logs) before hard quotas. See [SECURITY.md](../SECURITY.md#caller-context--workload-tiers).

If core quotas are added later:

- **Off by default** — no behavior change until ConVars set
- **Tuned in `server.cfg`** — e.g. optional max exports/sec per resource name (JSON ConVar or prefixed keys)
- **Never mandatory** — operators can leave disabled or set high for load testing

Consumer resources remain free to implement stricter caps in **their own** code or ConVars.

---

## Out of scope (v1.0.0)

- Per-resource export ACL (mandatory)
- MongoDB field-level encryption
- Automatic query planner / index advisor
- WAF or IP rate limiting
- Client-side validation (impossible — server resource only)
- Mandatory global rate limits (optional ConVar only, post-stable)

---

## After stable

Revisit **SF-5** only if production shows abuse from a trusted resource loop. Revisit **SF-6** if programmatic `connect()` becomes a supported public API.
