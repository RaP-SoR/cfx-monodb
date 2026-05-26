# Integration review & implementation plan (Track J)

> **Agent:** Integration review (see [PARALLEL-REVIEW-WORKFLOW.md](PARALLEL-REVIEW-WORKFLOW.md))  
> **Audit 2 score:** ~**8%** — **blocker for stable `v1.0.0`**  
> **Target Audit 3:** **≥70%**

---

## Current state (baseline)

| What exists | Limit |
|-------------|--------|
| **118 Vitest tests** | `createMockDb` / mock collections — **no MongoDB wire protocol** |
| **`tests/api-contract.test.ts`** | Manifest ↔ exports — still mocked |
| **`build.yml` / `release.yml`** | lint, tsc, unit test, build — **no integration job** |
| **Framework smoke** | ⏸️ deferred by team |

**Gap:** We never verify `MongoClient.connect`, real `insertOne`/`findOne`, index creation, or ConVar URL resolution against a live server.

---

## Review findings (agent fills this section)

> **Status:** ✅ Readonly review complete (2026-05-26). No `src/` or test implementation yet.

### Inventory checklist

- [x] **List all code paths that talk to real driver** — see [Driver inventory](#driver-inventory) below
- [x] **Confirm zero tests hit live MongoDB** — all **118** Vitest tests are mock-based; `yarn test` passes in **~1.3 s** with no server
- [x] **CI: no integration job** — `build.yml` and `release.yml` run `yarn test` only; no `services:`, no `integration.yml`
- [x] **Flakiness risks documented** — see [Flakiness risks](#flakiness-risks) below

#### Driver inventory

Only **`src/connector.ts`** instantiates `MongoClient` and opens the wire protocol:

| Layer | File | Real driver calls |
|-------|------|-------------------|
| Connect/disconnect | `src/connector.ts` | `new MongoClient()`, `client.connect()`, `client.db()`, `client.close()` |
| Startup | `src/bootstrap.ts` | `mongodb.connect()` → connector; `ensureIndexesFromConvar(db)` |
| Config (feeds connector) | `src/config.ts` | ConVar resolution at module load (`mongodb_env`, `mongodb_*_url`, pool/timeout) — no wire |
| Pipeline | `src/api/withDb.ts` | `provider.getDb()` then `op(db)` — no direct driver import |
| Read exports | `src/api/handlers/read.ts` | `collection.find()`, `findOne()`, `countDocuments()` |
| Write exports | `src/api/handlers/write.ts` | `insertOne()`, `updateOne()`, `deleteOne()` |
| Admin exports | `src/api/handlers/admin.ts` | `db.command({ ping: 1 })`, `ensureIndexesForCollection()` |
| Lifecycle exports | `src/api/handlers/lifecycle.ts` | `MongoDBConnector.connect()` / `disconnect()` |
| Indexes | `src/services/indexService.ts` | `collection.createIndexes()` |
| Helpers (no wire) | `src/utils.ts`, `normalizeIdFilter.ts`, `validateQuery.ts` | `ObjectId` / types only |

**Singleton note:** `MongoDBConnector.getInstance()` is process-global — integration tests must reset or use a dedicated test harness to avoid cross-test pollution.

#### Unit test inventory (all mock-based)

| File | Tests | Mock strategy |
|------|------:|-----------------|
| `tests/validateQuery.test.ts` | 22 | Pure functions — no `Db` |
| `tests/utils.test.ts` | 11 | URI strings only — no `Db` |
| `tests/perf.test.ts` | 11 | In-memory perf buffer — no `Db` |
| `tests/normalizeIdFilter.test.ts` | 4 | `ObjectId` helper — no wire |
| `tests/withDb.test.ts` | 5 | `{} as Db` stub + `makeProvider()` |
| `tests/indexService.test.ts` | 6 | Inline `vi.fn()` `Db` / `createIndexes` |
| `tests/bootstrap.test.ts` | 6 | `vi.mock("../src/connector")` + mock indexService |
| `tests/handlers/lifecycle.test.ts` | 5 | `vi.mock("../../src/connector")` + `createMockConnector` |
| `tests/handlers/read.test.ts` | 6 | `createMockCollection` via `registerWithDb` |
| `tests/handlers/write.test.ts` | 5 | `createMockCollection` via `registerWithDb` |
| `tests/handlers/admin.test.ts` | 8 | `createMockDb` / `createMockCollection` |
| `tests/exports.test.ts` | 19 | `createMockCollection` via `registerWithDb` |
| `tests/api-contract.test.ts` | 10 | `createMockDb` / `createMockConnector` |
| **Total** | **118** | **`tests/helpers/mock-db.ts`** — shared `createMockDb`, `createMockCollection`, `createMockConnector` |

**`mongodb` package in tests:** imports are limited to `ObjectId` (serialization tests) and `type Db` casts. **Zero** calls to `MongoClient.connect()` or a live URI. Lifecycle tests pass URI strings to **mocked** `connector.connect` only (`tests/handlers/lifecycle.test.ts`).

**Missing:** `tests/integration/` directory, `yarn test:integration` script (`package.json` has only `test` / `gate`).

#### CI review

| Workflow | Triggers | Mongo? | Steps |
|----------|----------|--------|-------|
| `.github/workflows/build.yml` | push/PR `main`, `dev` | ❌ | lint → tsc → **`yarn test`** → build |
| `.github/workflows/release.yml` | tags, push `dev`/`main`, dispatch | ❌ | lint → tsc → **`yarn test`** → build → pack |

No `services: mongodb`, no Testcontainers, no `TEST_MONGODB_URI` env, no separate integration workflow.

#### Flakiness risks

| Risk | Mitigation for J2/J3 |
|------|----------------------|
| **Singleton connector** state leaks between tests | Dedicated integration setup: fresh connect/disconnect per suite or reset instance |
| **`serverSelectionTimeoutMS`** (2–10 s from ConVars) | Override with short timeout in integration `setup.ts` (e.g. 3000 ms) |
| **Port / service startup** on GHA | Use `services: mongo:7`; health-check with retry before tests |
| **Atlas / auth URIs** in local dev | CI uses fixed `mongodb://127.0.0.1:27017/cfx_mongodb_test`; skip locally if `TEST_MONGODB_URI` unset |
| **Collection name collisions** | Prefix collections with `it_<timestamp>` or UUID; `drop()` in `afterAll` |
| **Parallel Vitest workers** | Run integration with `pool: forks` + `maxWorkers: 1` or file-level serial |

### Known gaps (with evidence)

| ID | Gap | Severity | Evidence |
|----|-----|----------|----------|
| J-G1 | No real connect/disconnect test | **High** | `connector.ts` is never imported in tests without `vi.mock`. `bootstrap.test.ts` mocks the entire connector module. |
| J-G2 | No CRUD roundtrip on real collection | **High** | All handler/export tests use `createMockCollection` returning resolved `vi.fn()` values — driver serialization, `_id` round-trip, and duplicate-key errors are untested on wire. |
| J-G3 | `ensureIndexes` / `createIndexes` not integration-tested | **Medium** | `indexService.test.ts` mocks `createIndexes`; real unique-index conflicts and index listing never exercised. |
| J-G4 | ConVar profile selection (`mongodb_env`) not tested end-to-end | **Medium** | `config.ts` reads ConVars at import time; `tests/setup.ts` stubs `GetConvar` to defaults only. No test verifies dev/prod/test URL selection → real connect. |
| J-G5 | No CI job — integration only manual | **High** | Both workflows stop at `yarn test` (mock suite). Releases can ship without any Mongo validation. |
| J-G6 | FiveM runtime not covered | **Low** (accepted) | Vitest stubs `on`, `TriggerEvent`, `GetConvar`. Embedded Node 22 + resource lifecycle deferred — acceptable per plan. |

### Agent notes

**Prioritized recommendations (P0 → P2):**

1. **P0 — J2 core slice first:** `connector.test.ts` (connect → ping → disconnect → reconnect) + `crud-roundtrip.test.ts` through **`registerWithDb`-style real connector** or direct `withDb` + exports. This closes J-G1 and J-G2 — highest audit impact.
2. **P0 — J1 scaffold in same PR:** Add `tests/integration/setup.ts`, `yarn test:integration` (`vitest run tests/integration`), skip when `TEST_MONGODB_URI` unset. Keep default `yarn test` / `yarn gate` unchanged.
3. **P1 — J3 CI:** New `integration.yml` with GitHub **`services: mongo:7`** (see runner choice below). Required check on `main` after one green week on `dev`.
4. **P1 — J4 indexes:** `indexes.test.ts` for `ensureIndexesForCollection` unique constraint + listIndexes — closes J-G3.
5. **P2 — ConVar E2E:** Separate test file with dynamic import after stubbing `GetConvar` for `mongodb_env=test` — closes J-G4; trickier due to `config.ts` module-load timing.

**Mongo CI runner choice (recommended: GitHub Services):**

| Option | Verdict | Rationale for this repo |
|--------|---------|-------------------------|
| **GitHub `services: mongo:7`** | ✅ **Recommended** | Zero new deps; matches `mongodb@7`; URI `mongodb://127.0.0.1:27017/...` aligns with config defaults; fast startup; sufficient for connect + CRUD + indexes |
| **Testcontainers** | ⚠️ Optional later | Adds `@testcontainers/mongodb` + Docker pull latency; justified only if multi-service matrix (replica set, auth) needed — not required for v1.0.0 |
| **mongodb-memory-server** | ❌ Avoid | In-memory ≠ production Mongo for indexes/auth; heavy binary download; conflicts with “real wire protocol” goal |

**Suggested CI snippet (J3):**

```yaml
services:
  mongo:
    image: mongo:7
    ports:
      - 27017:27017
env:
  TEST_MONGODB_URI: mongodb://127.0.0.1:27017/cfx_mongodb_test
```

**Do not bundle into `build.yml` initially** — keeps PR feedback fast (~1.3 s unit vs ~10–20 s integration).

---

## Target architecture

```text
tests/
  unit/              ← existing *.test.ts (mock) — keep as fast default
  integration/       ← NEW — real Mongo, gated
    setup.ts         ← URI from env / Testcontainers
    connector.test.ts
    crud-roundtrip.test.ts
    indexes.test.ts
```

**CI:**

```text
build.yml          → unit tests only (fast, every push)
integration.yml    → optional job: Mongo service + yarn test:integration
```

**Local:**

```bash
# Requires MongoDB on localhost or TEST_MONGODB_URI
yarn test:integration
```

---

## Implementation phases

> Effort estimates assume one developer familiar with the repo. Unit suite must stay **118+ tests, &lt;30 s** after each phase.

### J1 — Review & scaffold (~2–3 h) ✅ review done; ~1.5 h implementation remaining

- [x] Finalize findings table above (readonly review 2026-05-26)
- [x] Choose runner: **GitHub `services: mongo:7`** (see Agent notes — Testcontainers deferred, memory-server rejected)
- [ ] Add `tests/integration/README.md` + skip if `TEST_MONGODB_URI` unset (local dev optional)
- [ ] Add `vitest.integration.config.mjs` (or `include: tests/integration/**` + `maxWorkers: 1`)
- [ ] Add `tests/integration/setup.ts` — read `TEST_MONGODB_URI`, fail fast with clear message in CI
- [ ] Add `yarn test:integration` script — **not** in `yarn test` or `yarn gate`

**Deliverable:** Empty or smoke `setup.test.ts` that pings Mongo when URI present; `yarn gate` unchanged.

### J2 — Core integration tests (~5–7 h)

- [ ] `connector.test.ts` — connect, `db.command({ ping: 1 })`, disconnect, reconnect with new URL
- [ ] `crud-roundtrip.test.ts` — insert → find → findById → update → delete → count via export handlers + real `MongoDBConnector`
- [ ] Unique test DB `cfx_mongodb_test`, collection prefix `it_` — `drop()` in `afterAll`
- [ ] Timeout guards — `serverSelectionTimeoutMS: 3000` in test options; suite timeout 30 s
- [ ] Verify `insertedId` string serialization and `ObjectId` filter round-trip on real docs

**Deliverable:** Closes J-G1 + J-G2; enough for **~50–60%** integration audit score.

### J3 — CI integration job (~2–3 h)

- [ ] `.github/workflows/integration.yml` — on push `dev`/`main`, `workflow_dispatch`
- [ ] `services: mongo:7` + `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/cfx_mongodb_test`
- [ ] `yarn test:integration` — optional required check on `dev` week 1, then **required for merge to `main`**
- [ ] Note in `docs/CONFIGURATION.md` or README (local Mongo / skip behavior)

**Deliverable:** Closes J-G5; real Mongo green on CI → **≥70%** audit target.

### J4 — Extended coverage (~3–5 h, optional post-stable)

- [ ] `indexes.test.ts` — `ensureIndexesForCollection` + duplicate-key conflict on real collection
- [ ] `health` export ping RTT smoke on real server
- [ ] ConVar profile test (`mongodb_env=test`) — dynamic import pattern (J-G4)
- [ ] Light parallel insert smoke (5–10 docs, not Track H bench)
- [ ] Link manual Framework smoke checklist (no automation)

**Total estimated effort:** J1 impl + J2 + J3 ≈ **8–13 h** to stable gate; J4 adds **3–5 h**.

---

## Success criteria (Audit 3)

| Criterion | Met when |
|-----------|----------|
| Real Mongo in CI | `integration.yml` green on `dev` |
| CRUD roundtrip | ≥1 test file passes on CI |
| Local opt-in | `yarn test:integration` documented |
| Score | Integration **≥70%** in audit table |
| Unit suite | Still **118+** mock tests, `<30s` |

---

## Out of scope (Track J)

- Full FiveM embedded Node E2E in CI
- Framework smoke automation
- Load bench (Track H)
- Schema versioning (Track D)

---

## References

- [tests/helpers/mock-db.ts](../../tests/helpers/mock-db.ts) — what we replace *in addition to*, not instead of
- [connector.ts](../../src/connector.ts)
- [withDb.ts](../../src/api/withDb.ts)
