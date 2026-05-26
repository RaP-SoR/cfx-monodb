# Data & performance validation plan (step 2)

> **Status:** 📋 Planned — **after** [SECURITY-FIXES-PLAN.md](SECURITY-FIXES-PLAN.md) and manual smoke  
> **Audience:** Any consumer (accounts, characters, inventories) — not framework-specific  
> **Goal:** Reproduce load scenarios without hand-written update loops in live framework code

---

## Problem

Unit tests use **mocks** — they prove envelopes and validation, not MongoDB latency under batch work.

Real questions:

- Load **200 items** and update fields — hang or acceptable RTT?
- Account → characters → vehicles dependency chain — N+1 query pattern?
- Repeated `findAll` on startup — pool and slow-query warnings?

These belong in **step 2**, not the v1.0.0 security gate.

---

## Phased approach

### Phase P1 — Manual scripts (developer-run)

| Deliverable | Purpose |
|-------------|---------|
| `scripts/seed-test-data.mjs` | Insert sample accounts/characters/items into `cfx_mongodb_test` |
| `scripts/bench-crud.mjs` | Run N inserts / finds / updates; print timings |
| `tests/fixtures/` or JSON in script | Shared dataset shape (license, char slots, items) |

**Run:**

```bash
export TEST_MONGODB_URI=mongodb://127.0.0.1:27017/cfx_mongodb_test
node scripts/seed-test-data.mjs
node scripts/bench-crud.mjs --updates 200
```

Scripts are **opt-in** — not in `yarn gate`.

### Phase P2 — Integration tests (CI optional)

| Test | Assert |
|------|--------|
| `tests/integration/batch-update.test.ts` | 200 docs insert + 200 `update` exports &lt; threshold (generous, e.g. 30s total) |
| Reuse `tests/integration/setup.ts` | Same URI as Track J |

Flaky thresholds → start as **manual CI** (`workflow_dispatch`) before required check.

### Phase P3 — Observability in staging

- `mongodb_perf_enabled 1`, `mongodb_perf_slow_ms` tuned
- `getQueryStats` after bench — document p95 in CHANGELOG or bench output

---

## Dataset sketch (accounts / characters)

Minimal cross-resource shape (names illustrative):

```text
accounts:  { _id, license, email?, createdAt }
characters: { _id, accountId, name, slot, job, ... }
items:      { _id, characterId, name, count, metadata? }
```

Scripts create:

- 10 accounts × 3 characters × 50 items → 1500 item docs for inventory stress
- Or flat 200 docs in one collection for simple update bench

Consumers map their own schema — fixtures are **examples**, not schema enforcement.

---

## Success criteria

| Criterion | Met when |
|-----------|----------|
| Reproducible seed | One command populates test DB |
| 200-update scenario | Script or integration test runs without manual framework |
| Documented | README in `scripts/` or `tests/integration/README.md` |
| Not blocking v1.0.0 | Can ship stable before P2 is green |

---

## References

- [INTEGRATION-REVIEW-PLAN.md](INTEGRATION-REVIEW-PLAN.md) — Track J baseline
- [IDEAS-BACKLOG.md](IDEAS-BACKLOG.md) § Track H
- [SECURITY.md](../SECURITY.md) — abuse boundaries
