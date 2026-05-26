# Pre-stable roadmap → `main` / v1.0.0

> **Product stance:** Universal CFX MongoDB resource (Lua + TS). Framework tests are **post-stable**, not blockers.  
> **After stable:** maintenance mode — small fixes only unless a concrete need appears.

---

## Timeline (revised 2026-05-27)

```text
[1] Security concept + SF-1/2/4     ← ✅ done
[2] Perf validation tools           ← ✅ done (seed, bench, batch integration test)
[3] Examples + SF-3 docs            ← ✅ patterns, cleanup stubs
[4] Fixlist + full build/test       ← PRE-STABLE-FIXLIST.md (gate, doc-audit, CI)
[5] Bug-fix tour                    ← from fixlist “Open bugs”
[6] Manual practice test            ← deferred — user runs after [5]
[7] dev → main, tag v1.0.1          ← stable ZIP + .tgz
```

Track progress: **[PRE-STABLE-FIXLIST.md](PRE-STABLE-FIXLIST.md)**

---

## Step 1 — Security concept ✅

| Item | Doc | Status |
|------|-----|--------|
| Trust model, gaps, consumer checklist, caller tiers | [SECURITY.md](../SECURITY.md) | ✅ Finalized 2026-05-27 |
| Concrete fixes list | [SECURITY-FIXES-PLAN.md](SECURITY-FIXES-PLAN.md) | SF-1/2/3/4 done |
| Perf/datasets | [DATA-PERF-VALIDATION-PLAN.md](DATA-PERF-VALIDATION-PLAN.md) | ✅ tools shipped |

---

## Step 2 — Security fixes ✅

- ✅ **SF-1 + SF-2** — `validateDocument` on insert + tests
- ✅ **SF-3** — collection-name + insert notes in `lua/` + `typescript/` patterns
- ✅ **SF-4** — `config()` effective log level

---

## Step 2b — Perf validation tools ✅

- ✅ `yarn seed:test-data`
- ✅ `yarn bench:crud`
- ✅ `tests/integration/batch-update.test.ts`

---

## Step 3 — Examples + documentation ✅

Per [examples-docs skill](../../.cursor/skills/examples-docs/SKILL.md):

- SF-3 in both `patterns.md`
- Root example stubs removed; canonical paths under `lua/` and `typescript/`
- `yarn doc-audit` as part of Step 4

---

## Step 4 — Fixlist + verification

| Check | Command / workflow |
|-------|-------------------|
| Full local gate | `yarn gate` |
| Doc matrix | `yarn doc-audit` |
| Wire protocol | `integration.yml` green on GitHub |
| Optional local integration | `TEST_MONGODB_URI=... yarn test:integration` |

File bugs in [PRE-STABLE-FIXLIST.md](PRE-STABLE-FIXLIST.md) → Step 5.

---

## Step 5 — Bug-fix tour

Work through **Open bugs** in the fixlist until Phase C is green and the table is empty.

---

## Step 6 — Manual practice test (later)

Your existing checks (account load, character load, dependencies). Can use:

- [examples/sample-resource/](../examples/sample-resource/README.md)
- Or any ESX/QBCore/custom resource

Not required to be CTFFramework. Run **after** bug-fix tour, **before** merge to `main`.

---

## Step 7 — Stable release

1. Merge `dev` → `main`
2. Tag `v1.0.1` on `main` (CI enforces stable channel)
3. GitHub Release: ZIP + types `.tgz`
4. Update [CHANGELOG.md](../CHANGELOG.md) — v1.0.1 on main

---

## Explicitly not in v1.0.0

- New exports or aggregation API
- npmjs.org publish (GitHub `.tgz` remains enough for TS types)
- Framework-specific automation
- Full load bench in required CI
- Schema versioning (Track D)
- SF-5 / SF-6 (post-stable)

---

## References

| Doc | Topic |
|-----|-------|
| [PRE-STABLE-FIXLIST.md](PRE-STABLE-FIXLIST.md) | Build checklist + bug list |
| [QUALITY-AUDIT-2026.md](QUALITY-AUDIT-2026.md) | Audit 3 ~92% |
| [DOCUMENTATION-AUDIT-2026.md](../DOCUMENTATION-AUDIT-2026.md) | Consumer docs ~95% |
| [CONFIGURATION.md](../CONFIGURATION.md) | Install & ConVars |
