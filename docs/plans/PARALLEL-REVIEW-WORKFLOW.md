# Parallel review workflow — Integration & Logging

> **Status:** Planning (pre-stable)  
> **Context:** Audit 2 rated **Integration ~8%** and **Logging ~62%** — too low for **`v1.0.0` stable** on `main`.  
> **Goal:** Two **independent review agents** → two implementation plans → work **in parallel** or sequentially.

---

## Why two agents?

| Track | Score (Audit 2) | Problem |
|-------|-----------------|---------|
| **Integration** | ~8% | All 118 tests use **mock DB** — no real MongoDB, no CI integration job |
| **Logging** | ~62% | Ad-hoc `console.*`, no `log()` tests, redaction not verified at all call sites |

These areas have **minimal overlap** (integration touches driver + exports; logging touches `utils`, connector, handlers). Splitting reviews avoids one mega-agent and allows parallel implementation.

---

## Workflow overview

```text
                    ┌─────────────────────┐
                    │  You (coordinator)   │
                    └──────────┬──────────┘
           ┌───────────────────┼───────────────────┐
           ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│ Agent INTEGRATION    │              │ Agent LOGGING        │
│ (readonly review)    │              │ (readonly review)    │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                       │
           ▼                                       ▼
   INTEGRATION-REVIEW-PLAN.md              LOGGING-REVIEW-PLAN.md
   (findings + phased impl)                 (findings + phased impl)
           │                                       │
           └───────────────────┬───────────────────┘
                               ▼
                    Implement J1–J4 / K1–K4
                    (parallel or one after another)
                               ▼
                    Audit 3 → Integration ≥70%, Logging ≥80%
                               ▼
                    stable v1.0.0 on main
```

---

## How to start each agent (Cursor)

### Agent 1 — Integration review

**Mode:** Ask or Agent with **readonly** if you only want the plan first.

**Prompt (copy):**

```text
Read docs/plans/INTEGRATION-REVIEW-PLAN.md and docs/plans/PARALLEL-REVIEW-WORKFLOW.md.

Task: Integration track review ONLY — do not change logging code.

1. Inventory current tests/CI — confirm everything is mock-based.
2. Propose integration test layers (real Mongo in CI, scope, files).
3. Fill in "Review findings" section in INTEGRATION-REVIEW-PLAN.md with concrete gaps and priorities.
4. Refine phased implementation J1–J4 with effort estimates.
5. Do NOT implement yet unless I say "implement J1".

Output: summary of findings + recommended first slice (J1 or J2).
```

**Skill (optional):** `.cursor/skills/integration-review/SKILL.md`

---

### Agent 2 — Logging review

**Prompt (copy):**

```text
Read docs/plans/LOGGING-REVIEW-PLAN.md and docs/plans/PARALLEL-REVIEW-WORKFLOW.md.

Task: Logging track review ONLY — do not add integration tests.

1. Grep all log/console sites in src/ — build inventory table.
2. Check redaction (URI, filters, documents), level consistency, config bypass (config.ts console.log).
3. Fill in "Review findings" in LOGGING-REVIEW-PLAN.md.
4. Refine phased implementation K1–K4.
5. Do NOT implement yet unless I say "implement K1".

Output: summary + recommended first slice (usually K1 inventory + K2 policy tests).
```

**Skill (optional):** `.cursor/skills/logging-review/SKILL.md`

---

## Coordination rules

| Rule | Reason |
|------|--------|
| **Separate branches optional** | `dev/integration-j*` vs `dev/logging-k*` — merge to `dev` when gate green |
| **`yarn gate` before merge** | Both tracks touch core paths |
| **No stable tag** until Audit 3 targets met | Integration ≥70%, Logging ≥80% (see below) |
| **Conflicts** | Rare — if both touch `withDb.ts`, merge logging first (K3 structured prefix) then integration tests |

---

## Target scores (Audit 3 — stable gate)

| Bereich | Audit 2 | **Ziel stable** | Minimal deliverable |
|---------|---------|-----------------|---------------------|
| Integration / E2E | 8% | **≥70%** | Real-Mongo CI smoke + 1 CRUD roundtrip suite |
| Logging & Fehler | 62% | **≥80%** | Policy + tests + no credential leaks + unified `log()` |

Framework-Smoke (live FiveM) remains **optional** — real Mongo in CI is the integration baseline.

---

## After both plans are filled

1. Pick order: **parallel** (two agents implement J2 + K2) or **sequential** (Integration first if driver bugs feared).
2. Update [QUALITY-AUDIT-2026.md](QUALITY-AUDIT-2026.md) Audit 3 row when done.
3. Then: `dev → main`, tag **`v1.0.0`**.

---

## References

| Doc | Track |
|-----|--------|
| [INTEGRATION-REVIEW-PLAN.md](INTEGRATION-REVIEW-PLAN.md) | J |
| [LOGGING-REVIEW-PLAN.md](LOGGING-REVIEW-PLAN.md) | K |
| [QUALITY-AUDIT-2026.md](QUALITY-AUDIT-2026.md) | Scores |
| [OBSERVABILITY-PLAN.md](OBSERVABILITY-PLAN.md) | Perf (separate from logging policy) |
