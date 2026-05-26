# Pre-stable roadmap → `main` / v1.0.0

> **Product stance:** Universal CFX MongoDB resource (Lua + TS). Framework tests are **post-stable**, not blockers.  
> **After stable:** maintenance mode — small fixes only unless a concrete need appears.

---

## Timeline

```text
[1] Security concept          ← SECURITY.md + plans (this pass)
[2] Security fixes            ← SECURITY-FIXES-PLAN (SF-1…)
[3] Manual practice test      ← your account/char flows, any resource
[4] CI green                  ← integration.yml + yarn gate
[5] dev → main, tag v1.0.0    ← stable ZIP + .tgz

        ─── after stable (batch) ───

[6] Examples + SF-3 docs      ← examples-docs skill / merge
[7] Framework test            ← when framework params settle
```

---

## Step 1 — Security concept ✅

| Item | Doc | Status |
|------|-----|--------|
| Trust model, gaps, consumer checklist, caller tiers | [SECURITY.md](../SECURITY.md) | ✅ Finalized 2026-05-27 |
| Concrete fixes list | [SECURITY-FIXES-PLAN.md](SECURITY-FIXES-PLAN.md) | Ready for SF-1/SF-2 |
| Perf/datasets (later) | [DATA-PERF-VALIDATION-PLAN.md](DATA-PERF-VALIDATION-PLAN.md) | Step 2 |

**Exit:** ✅ Concept signed off — limits are operator choice (ConVar / consumer code); implement SF-1/SF-2 next.

---

## Step 2 — Security fixes ✅ (SF-1, SF-2, SF-4)

Implemented per [SECURITY-FIXES-PLAN.md](SECURITY-FIXES-PLAN.md):

- ✅ **SF-1 + SF-2** — `validateDocument` on insert + tests (130 unit tests)
- ✅ **SF-4** — `config()` effective log level
- 📋 **SF-3** — collection-name examples — **deferred** to examples-docs skill / later merge

```bash
yarn scout
```

**Next:** Step 3 manual practice test.

---

## Step 2b — Perf validation tools ✅

Per [DATA-PERF-VALIDATION-PLAN.md](DATA-PERF-VALIDATION-PLAN.md) (not blocking stable):

- ✅ `yarn seed:test-data` — accounts / characters / items + 200 bench docs
- ✅ `yarn bench:crud` — driver sequential updates
- ✅ `tests/integration/batch-update.test.ts` — 200 export updates (&lt;30s)

Consumer **examples** (SF-3) deferred until after stable.

---

## Step 3 — Manual practice test

Your existing checks (account load, character load, dependencies). Can use:

- [examples/sample-resource/](../examples/sample-resource/README.md)
- Or any ESX/QBCore/custom resource

Not required to be CTFFramework. Document pass/fail in PR or personal checklist.

---

## Step 4 — CI

| Check | Command / workflow |
|-------|------------------|
| Unit + build | `yarn gate` |
| Wire protocol | `integration.yml` green on GitHub |

---

## Step 5 — Stable release

1. Merge `dev` → `main`
2. Tag `v1.0.0` on `main` (CI enforces stable channel)
3. GitHub Release: ZIP + types `.tgz`
4. Update [CHANGELOG.md](../CHANGELOG.md) — move Unreleased → v1.0.0

---

## Explicitly not in v1.0.0

- New exports or aggregation API
- npmjs.org publish (GitHub `.tgz` remains enough for TS types)
- Framework-specific automation
- Full load bench in required CI
- Schema versioning (Track D)

---

## References

| Doc | Topic |
|-----|-------|
| [QUALITY-AUDIT-2026.md](QUALITY-AUDIT-2026.md) | Audit 3 ~92% |
| [DOCUMENTATION-AUDIT-2026.md](../DOCUMENTATION-AUDIT-2026.md) | Consumer docs ~95% |
| [CONFIGURATION.md](../CONFIGURATION.md) | Install & ConVars |
