---
name: logging-review
description: >-
  Review and harden cfx-mongodb logging (Track K) — log levels, redaction, policy
  docs, tests for utils.log. Use when improving the ~62% logging audit score or
  auditing console.log and filter PII in logs. Do not add integration tests.
---

# Logging review — cfx-mongodb (Track K)

## Read first

1. [docs/plans/LOGGING-REVIEW-PLAN.md](../../../docs/plans/LOGGING-REVIEW-PLAN.md)
2. [docs/plans/PARALLEL-REVIEW-WORKFLOW.md](../../../docs/plans/PARALLEL-REVIEW-WORKFLOW.md)

## Scope

- `src/utils.ts` — `log()`, `getLogLevel()`
- All `log()` / `console.*` call sites in `src/`
- **`docs/LOGGING.md`** (create in K1)
- **`tests/log.test.ts`** (create in K2)

**Out of scope:** perf ring buffer/UI (OBSERVABILITY-PLAN), integration tests (Track J).

## Review mode (default)

1. Grep `log(` and `console.` in `src/`.
2. Complete inventory table in LOGGING-REVIEW-PLAN.md.
3. Flag PII risks (filter values in debug logs in `write.ts`).
4. Do **not** implement until user says `implement K1` / `K2`.

## Implement mode

- All `src/` output via `log()` — no stray `console.log`.
- Debug filter logs: **keys only** by default.
- Tests for level filtering and URI redaction in log paths.
- Run `yarn gate` before finish.

## Target

Logging audit score **≥80%** — policy doc + tests required for stable `v1.0.0`.
