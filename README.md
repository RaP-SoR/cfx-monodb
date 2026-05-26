CitizenFX (FiveM/RedM) MongoDB TypeScript Wrapper

## Documentation

| Doc | Audience |
|-----|----------|
| [docs/README.md](docs/README.md) | **Documentation hub** — start here |
| [docs/API.md](docs/API.md) | External API — CTFFramework contract |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Runtime, lifecycle, module layout |
| [docs/GUIDE.md](docs/GUIDE.md) | Installation, ConVars, troubleshooting |
| [docs/SEARCH-MAP.md](docs/SEARCH-MAP.md) | AI agents & maintainers — navigation |
| [docs/examples/typescript.md](docs/examples/typescript.md) / [lua.md](docs/examples/lua.md) | Language examples |
| [AGENTS.md](AGENTS.md) | Cursor/CI contributor guidelines |

Changelog: [docs/CHANGELOG.md](docs/CHANGELOG.md)

## Overview

Lightweight MongoDB wrapper for FiveM/RedM server resources. Other resources access MongoDB **only via FiveM exports** — no direct driver access.

- Node **22** runtime (`node_version '22'` in `fxmanifest.lua`)
- MongoDB driver **v7**, TypeScript **6**
- Handler-based architecture (`src/api/handlers/*`)
- Query validation, pooled connections, index helpers
- CTFFramework-compatible response envelope

## Requirements

- FiveM/RedM with Node **22 only**
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

- `insert`, `find`, `findById`, `findAll`, `update`, `delete`, `count`, `getVersion`
- `isConnected`, `connect`, `disconnect`
- `ensureIndexes`, `health`, `config`

## Development

```bash
yarn install
yarn build
yarn tsc
yarn test
yarn lint
```

## Examples

- [docs/examples/typescript.md](docs/examples/typescript.md) · [server.ts](docs/examples/server.ts)
- [docs/examples/lua.md](docs/examples/lua.md) · [server.lua](docs/examples/server.lua)
