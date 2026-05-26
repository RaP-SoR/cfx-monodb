# Documentation — cfx-mongodb

Entry point for humans and agents. **Canonical API contract:** [API.md](API.md).

## Core

| Document | Purpose |
|----------|---------|
| [API.md](API.md) | External export contract (CTFFramework) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Runtime, lifecycle, module layout after refactor |
| [GUIDE.md](GUIDE.md) | Installation, ConVars, troubleshooting |
| [CHANGELOG.md](CHANGELOG.md) | Version and wave history |
| [SEARCH-MAP.md](SEARCH-MAP.md) | Task → file navigation (read first for agents) |
| [AI-STACK.md](AI-STACK.md) | Cursor skills, rules, agent workflows |

## Examples

| Document | Code |
|----------|------|
| [examples/typescript.md](examples/typescript.md) | [examples/server.ts](examples/server.ts) |
| [examples/lua.md](examples/lua.md) | [examples/server.lua](examples/server.lua) |

Sample manifests: [fxmanifest-ts-example.lua](examples/fxmanifest-ts-example.lua), [fxmanifest-lua-example.lua](examples/fxmanifest-lua-example.lua).

## Refactor (historical)

| Document | Purpose |
|----------|---------|
| [refactor/README.md](refactor/README.md) | Multi-agent playbook (Waves 1–4) |
| [refactor/REFACTOR-STATUS.md](refactor/REFACTOR-STATUS.md) | Status board — merged to `dev` |
| [plans/MAINTENANCE-ROADMAP.md](plans/MAINTENANCE-ROADMAP.md) | Post-refactor cleanup, TSDoc, observability |

## Root (repo)

| Document | Purpose |
|----------|---------|
| [../README.md](../README.md) | Project overview & quick start |
| [../AGENTS.md](../AGENTS.md) | Contributor / Cursor guidelines |
