CitizenFX (FiveM/RedM) MongoDB TypeScript Wrapper

## Documentation

| Doc | Audience |
|-----|----------|
| [docs/API.md](docs/API.md) | **External API** — CTFFramework contract, all exports |
| [SEARCH-MAP.md](SEARCH-MAP.md) | AI agents & maintainers — navigation map |
| [AGENTS.md](AGENTS.md) | Cursor/CI contributor guidelines |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Runtime, lifecycle, build |
| [docs/AI-STACK.md](docs/AI-STACK.md) | AI skills, rules, workflows |
| [DOCS.md](DOCS.md) | Full human-readable guide |
| [doc-typescript.md](doc-typescript.md) / [doc-lua.md](doc-lua.md) | Language examples |

## Overview

Lightweight MongoDB wrapper for FiveM/RedM server resources. Other resources access MongoDB **only via FiveM exports** — no direct driver access.

- Node **22** runtime (`node_version '22'` in `fxmanifest.lua`)
- MongoDB driver **v7**
- Query validation, pooled connections, logging, index helpers
- CTFFramework-compatible response envelope (`success`, `insertedId` as string, `modifiedCount`, `deletedCount`, `getVersion`)

## Requirements

- FiveM/RedM with Node **22 only** (`node_version '22'` in `fxmanifest.lua`)
- **No support** for FiveM/RedM Node 16/18 — outdated dependency chains with known security issues
- MongoDB server reachable from game server
- Node 22.x locally for development (`engines: >=22.0.0 <23`)

## Quick Start (server.cfg)

```
ensure cfx-mongodb
set mongodb_env dev
set mongodb_dev_url mongodb://localhost:27017/ctf_dev
set mongodb_timeout 5000
set mongodb_log_level info
```

Wait for `cfx-mongodb:ready` before calling CRUD exports from other resources.

## Core Exports

See [docs/API.md](docs/API.md) for full reference.

- `insert`, `find`, `findAll`, `update`, `delete`, `count`, `getVersion`
- `isConnected`, `connect`, `disconnect`
- `ensureIndexes`, `health`, `config`

## Development

```bash
yarn install
yarn build
yarn tsc
yarn lint
```

## Examples

- TypeScript: `examples/server.ts`, `examples/typescript.md`
- Lua: `examples/server.lua`, `examples/lua.md`

Changelog: [CHANGES.md](CHANGES.md)
