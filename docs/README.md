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

| Document | Code |
|----------|------|
| [examples/patterns.md](examples/patterns.md) | CTFFramework success checks, filters, pagination |
| [examples/typescript.md](examples/typescript.md) | [examples/server.ts](examples/server.ts) |
| [examples/lua.md](examples/lua.md) | [examples/server.lua](examples/server.lua) |

Sample manifests: [fxmanifest-ts-example.lua](examples/fxmanifest-ts-example.lua), [fxmanifest-lua-example.lua](examples/fxmanifest-lua-example.lua).

## Plans & archive

| Document | Purpose |
|----------|---------|
| [plans/MAINTENANCE-ROADMAP.md](plans/MAINTENANCE-ROADMAP.md) | Post-refactor cleanup, TSDoc, observability |
| [plans/OBSERVABILITY-PLAN.md](plans/OBSERVABILITY-PLAN.md) | Slow-query logging design (Track C) |
| [plans/SCHEMA-VERSIONING-PLAN.md](plans/SCHEMA-VERSIONING-PLAN.md) | Schema version ledger (Track D, design) |
| [plans/IDEAS-BACKLOG.md](plans/IDEAS-BACKLOG.md) | Collected ideas — implement later if needed |
| [plans/QUALITY-AUDIT-2026.md](plans/QUALITY-AUDIT-2026.md) | **Quality baseline (~72%)** — compare on next audit |
| [archive/refactor/README.md](archive/refactor/README.md) | Multi-agent refactor playbook (Waves 1–4, archived) |
| [archive/refactor/REFACTOR-STATUS.md](archive/refactor/REFACTOR-STATUS.md) | Final status board — merged to `dev` |

## Root (repo)

| Document | Purpose |
|----------|---------|
| [../README.md](../README.md) | Project overview & quick start |
| [../AGENTS.md](../AGENTS.md) | Contributor / Cursor guidelines |
