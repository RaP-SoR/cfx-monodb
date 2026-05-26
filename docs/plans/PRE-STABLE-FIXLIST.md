# Pre-stable fixlist — build, docs, bugs

> **Purpose:** Single checklist from “examples done” through bug-fix tour to `main` / `v1.0.0`.  
> **Manual practice test:** deferred until after this list is green (see [PRE-STABLE-ROADMAP.md](PRE-STABLE-ROADMAP.md)).

---

## Phase order

```text
[A] Examples + SF-3 docs          ← this pass
[B] Cleanup (stubs, thin scripts)
[C] Verification (commands below)
[D] Bug-fix tour (items under “Open bugs”)
[E] Manual practice test          ← later
[F] dev → main, tag v1.0.0
```

---

## A — Examples & documentation

| ID | Item | Status |
|----|------|--------|
| A1 | SF-3 collection-name rule in `lua/patterns.md` + `typescript/patterns.md` | ✅ |
| A2 | Insert validation note in patterns (both langs) | ✅ |
| A3 | Anti-patterns: dynamic collection, batch abuse → SECURITY.md | ✅ |
| A4 | API.md insert limitation row (no “unvalidated insert”) | ✅ |
| A5 | `yarn doc-audit` export ↔ doc matrix | ✅ 2026-05-27 |

---

## B — Cleanup

| ID | Item | Status |
|----|------|--------|
| B1 | Remove root example stubs (`docs/examples/server.*`, root manifests) | ✅ |
| B2 | Remove `scripts/gate.sh`, `scripts/scout.sh` (use `yarn gate` / `yarn scout`) | ✅ |
| B3 | Keep: `scout.mjs`, `doc-audit.mjs`, `pack-*.sh`, `seed-test-data.mjs`, `bench-crud.mjs` | ✅ |
| B4 | Legacy redirects in `docs/examples/README.md` (root paths) | ✅ already |

---

## C — Verification commands

Run locally (Windows: use repo root with `yarn`):

| Check | Command | Last run | Result |
|-------|---------|----------|--------|
| Lint | `yarn lint` | 2026-05-27 | ✅ |
| Types | `yarn tsc` | 2026-05-27 | ✅ |
| Unit tests | `yarn test` | 2026-05-27 | ✅ 130 |
| Build | `yarn build` | 2026-05-27 | ✅ |
| **Gate (all above)** | **`yarn gate`** | 2026-05-27 | ✅ |
| Doc audit | `yarn doc-audit` | 2026-05-27 | ✅ 16 exports listed |
| Integration (needs `TEST_MONGODB_URI`) | `yarn test:integration` | | skip locally — CI |
| CI integration workflow | GitHub `integration.yml` | | ⬜ confirm green |

**Perf tools (optional, not gate):**

```bash
yarn seed:test-data
yarn bench:crud
```

---

## D — Open bugs / fixes

_Populate from failed checks or manual review. Close with commit + test._

| ID | Severity | Area | Description | Status |
|----|----------|------|-------------|--------|
| — | — | — | _None filed yet — run Phase C first_ | |

---

## E — Pre-merge checklist (stable)

- [ ] All Phase C checks green (integration on CI at minimum)
- [ ] Phase D empty or all items closed
- [ ] [QUALITY-AUDIT-2026.md](QUALITY-AUDIT-2026.md) stable criteria met
- [ ] [CHANGELOG.md](../CHANGELOG.md) Unreleased → v1.0.0
- [ ] Manual practice test (user) — **after** D
- [ ] Merge `dev` → `main`, tag `v1.0.0`, push tag

---

## References

| Doc | Topic |
|-----|-------|
| [PRE-STABLE-ROADMAP.md](PRE-STABLE-ROADMAP.md) | Timeline |
| [SECURITY-FIXES-PLAN.md](SECURITY-FIXES-PLAN.md) | SF-1…6 |
| [DOCUMENTATION-AUDIT-2026.md](../DOCUMENTATION-AUDIT-2026.md) | Consumer doc matrix |
