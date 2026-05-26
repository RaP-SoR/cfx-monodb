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

> **Status:** 🔴 Template — run Integration agent to complete.

### Inventory checklist

- [ ] List all code paths that talk to real driver (`connector.ts`, `withDb` → collection methods)
- [ ] Confirm zero tests import `mongodb` against live URI today
- [ ] CI: document missing `services: mongodb` or Testcontainers step
- [ ] Document flakiness risks (timing, port, Atlas vs local)

### Known gaps (pre-review seed)

| ID | Gap | Severity |
|----|-----|----------|
| J-G1 | No real connect/disconnect test | High |
| J-G2 | No CRUD roundtrip on real collection | High |
| J-G3 | `ensureIndexes` / `createIndexes` not integration-tested | Medium |
| J-G4 | ConVar profile selection (`mongodb_env`) not tested end-to-end | Medium |
| J-G5 | No CI job — integration only manual | High |
| J-G6 | FiveM runtime not covered (acceptable post-J3) | Low |

### Agent notes

_(Findings from readonly review go here.)_

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

### J1 — Review & scaffold (~2–4 h)

- [ ] Finalize findings table above
- [ ] Choose runner: **GitHub `services: mongodb`** vs **Testcontainers** vs **mongodb-memory-server** (document tradeoff)
- [ ] Add `tests/integration/README.md` + skip if no URI (local dev optional)
- [ ] Add `yarn test:integration` script (does not run in default `yarn test`)

**Recommendation seed:** GitHub Actions `services: mongo:7` + `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/cfx_mongodb_test` — simple, no FiveM needed.

### J2 — Core integration tests (~4–8 h)

- [ ] `connector.test.ts` — connect, ping, disconnect, reconnect
- [ ] `crud-roundtrip.test.ts` — insert → find → update → delete → count via **exports pipeline** or `withDb` + real db
- [ ] Unique test DB / collection prefix — cleanup in `afterAll`
- [ ] Timeout guards — fail fast if Mongo down

### J3 — CI integration job (~2–4 h)

- [ ] `.github/workflows/integration.yml` — on push `dev`/`main`, `workflow_dispatch`
- [ ] Start Mongo 7 service container
- [ ] `yarn test:integration` — **required** for merge to `main` (optional on `dev` first week)
- [ ] Badge/note in README or CONFIGURATION

### J4 — Extended coverage (optional, post-stable)

- [ ] Index integration test (`ensureIndexesForCollection`)
- [ ] Parallel load smoke (light, not full Track H)
- [ ] Document manual Framework smoke checklist (link only)

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
