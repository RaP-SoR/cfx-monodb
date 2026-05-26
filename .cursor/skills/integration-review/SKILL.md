---
name: integration-review
description: >-
  Review and implement cfx-mongodb integration testing (Track J) — real MongoDB
  in CI, tests/integration/, crud roundtrip. Use when improving the ~8% integration
  audit score, adding test:integration, or integration.yml. Do not change logging policy.
---

# Integration review — cfx-mongodb (Track J)

## Read first

1. [docs/plans/INTEGRATION-REVIEW-PLAN.md](../../../docs/plans/INTEGRATION-REVIEW-PLAN.md)
2. [docs/plans/PARALLEL-REVIEW-WORKFLOW.md](../../../docs/plans/PARALLEL-REVIEW-WORKFLOW.md)

## Scope

- Real MongoDB tests (`tests/integration/`)
- CI job (`.github/workflows/integration.yml`)
- `yarn test:integration` — **not** in default `yarn test`

**Out of scope:** logging policy (Track K), perf UI, Framework smoke, schema D.

## Review mode (default)

1. Confirm all current tests use mocks (`tests/helpers/mock-db.ts`).
2. Fill **Review findings** in INTEGRATION-REVIEW-PLAN.md.
3. Recommend J1 vs J2 first slice.
4. Do **not** implement until user says `implement J1` / `J2`.

## Implement mode

- Keep unit tests fast — integration gated separately.
- Use test DB `cfx_mongodb_test`, cleanup collections in `afterAll`.
- Skip integration locally if `TEST_MONGODB_URI` unset (document in README).
- Run `yarn gate` before finish; integration job separate from unit gate initially.

## Target

Integration audit score **≥70%** — real Mongo CRUD in CI required for stable `v1.0.0`.
