# Documentation — cfx-mongodb

Entry point for humans and agents. **Canonical API contract:** [API.md](API.md).

## Core

| Document | Purpose |
|----------|---------|
| [API.md](API.md) | External export contract (CTFFramework) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Runtime, lifecycle, module layout after refactor |
| [GUIDE.md](GUIDE.md) | Overview, troubleshooting |
| [CONFIGURATION.md](CONFIGURATION.md) | **Installation, ConVars, dev/prod, multi-developer profiles** |
| [CHANGELOG.md](CHANGELOG.md) | Version and wave history |
| [SEARCH-MAP.md](SEARCH-MAP.md) | Task → file navigation (read first for agents) |
| [AI-STACK.md](AI-STACK.md) | Cursor skills, rules, agent workflows |
| [CHECKLIST.md](CHECKLIST.md) | **Pre-push / PR checklist** — `yarn gate`, `yarn scout` |

## Examples

| Document | Purpose |
|----------|---------|
| [DOCUMENTATION-AUDIT-2026.md](DOCUMENTATION-AUDIT-2026.md) | **Export ↔ docs audit** (coverage matrix, limitations) |
| [examples/README.md](examples/README.md) | Examples hub + reading order |
| [examples/lua/use-cases.md](examples/lua/use-cases.md) | FiveM flows, all exports (Lua) |
| [examples/lua/queries.md](examples/lua/queries.md) | Query cookbook, JOIN analogy, time zones |
| [examples/sample-resource/](examples/sample-resource/README.md) | Copyable multi-file Lua consumer |
| [examples/typescript/](examples/typescript/README.md) | TypeScript mirror of the above |

Manifests: [lua/fxmanifest-lua-example.lua](examples/lua/fxmanifest-lua-example.lua), [typescript/fxmanifest-ts-example.lua](examples/typescript/fxmanifest-ts-example.lua).

## Plans & archive

| Document | Purpose |
|----------|---------|
| [plans/MAINTENANCE-ROADMAP.md](plans/MAINTENANCE-ROADMAP.md) | Post-refactor cleanup, TSDoc, observability |
| [plans/OBSERVABILITY-PLAN.md](plans/OBSERVABILITY-PLAN.md) | Slow-query logging design (Track C) |
| [plans/SCHEMA-VERSIONING-PLAN.md](plans/SCHEMA-VERSIONING-PLAN.md) | Schema version ledger (Track D, design) |
| [plans/IDEAS-BACKLOG.md](plans/IDEAS-BACKLOG.md) | Collected ideas — implement later if needed |
| [plans/QUALITY-AUDIT-2026.md](plans/QUALITY-AUDIT-2026.md) | Quality scores — Audit 2 ~86%; J+K before stable |
| [plans/PARALLEL-REVIEW-WORKFLOW.md](plans/PARALLEL-REVIEW-WORKFLOW.md) | **Pre-stable:** zwei Agent-Reviews (Integration + Logging) |
| [plans/INTEGRATION-REVIEW-PLAN.md](plans/INTEGRATION-REVIEW-PLAN.md) | Track J — real Mongo / CI |
| [plans/LOGGING-REVIEW-PLAN.md](plans/LOGGING-REVIEW-PLAN.md) | Track K — logging policy & tests |
| [archive/refactor/README.md](archive/refactor/README.md) | Multi-agent refactor playbook (Waves 1–4, archived) |
| [archive/refactor/REFACTOR-STATUS.md](archive/refactor/REFACTOR-STATUS.md) | Final status board — merged to `dev` |

## Root (repo)

| Document | Purpose |
|----------|---------|
| [../README.md](../README.md) | Project overview & quick start |
| [../AGENTS.md](../AGENTS.md) | Contributor / Cursor guidelines |
