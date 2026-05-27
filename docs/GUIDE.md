# CFX MongoDB Wrapper — Guide

> **Canonical API:** [API.md](API.md)  
> **Installation & ConVars (start here):** [CONFIGURATION.md](CONFIGURATION.md)  
> **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)  
> **Agent navigation:** [SEARCH-MAP.md](SEARCH-MAP.md)

## Overview

Secure MongoDB wrapper for FiveM/RedM. TypeScript source compiled to `dist/index.js`. Targets **Node 22** and **MongoDB driver v7**. Safe CRUD exports, pooled connections, structured logging, health checks, index creation.

Handler modules live under `src/api/handlers/*`; wiring in `src/api/registerExports.ts` (see [ARCHITECTURE.md](ARCHITECTURE.md)).

## Requirements

- FiveM/RedM with `node_version '22'` in `fxmanifest.lua`
- **Node 22 only** — no support for embedded Node 16/18
- Reachable MongoDB server
- Node 22.x for local development (`engines: >=22.0.0 <23`)

## Installation

**Full walkthrough:** [CONFIGURATION.md](CONFIGURATION.md) (ConVars, dev/prod profiles, multi-developer `exec` + gitignore).

1. Resource folder: `cfx-mongodb`
2. `server.cfg`: `ensure cfx-mongodb` + MongoDB ConVars (or `exec mongodb.local.cfg`)
3. Wait for `cfx-mongodb:ready` before CRUD from other resources

## Configuration (ConVars)

> **Recommended:** configure connection **once** via ConVars — consumers never call `connect()`.  
> Profile templates: [examples/config/](examples/config/) · Details: [CONFIGURATION.md](CONFIGURATION.md)

| ConVar | Description |
|--------|-------------|
| `mongodb_env` | `dev`, `prod`, `test` (default from hostname) |
| `mongodb_dev_url` | Dev MongoDB URI |
| `mongodb_prod_url` | Prod MongoDB URI |
| `mongodb_test_url` | Test MongoDB URI |
| `mongodb_timeout` | Server selection timeout (ms) |
| `mongodb_max_pool` | Max pool size (0–50) |
| `mongodb_min_pool` | Min pool size (0–20) |
| `mongodb_log_level` | `error`, `warn`, `info`, `debug` |
| `mongodb_init_indexes` | JSON map: collection → index specs |

Example index ConVar:

```json
{ "users": [ { "keys": { "email": 1 }, "options": { "unique": true } } ] }
```

## API Reference

Full contract: **[API.md](API.md)**

Language examples: **[examples/lua/use-cases.md](examples/lua/use-cases.md)** · **[examples/typescript/use-cases.md](examples/typescript/use-cases.md)** (FiveM account/character/vehicle flows; every export) · [lua/](examples/lua/README.md) / [typescript/](examples/typescript/README.md)

### Response envelope

All CRUD exports return `{ success: boolean, ... }`. On error: `{ success: false, error: string }`. **Exports never throw.**

### Core exports

| Export | Returns (success) |
|--------|-------------------|
| `insert(collection, doc)` | `{ success: true, insertedId: string }` |
| `find(collection, filter?)` | `{ success: true, data: doc \| null }` — **not found → `data: null`** |
| `findById(collection, id, projection?)` | `{ success: true, data: doc \| null }` |
| `findAll(collection, filter?, options?)` | `{ success: true, data: doc[] }` |
| `update(collection, filter, update)` | `{ success: true, modifiedCount, matchedCount }` |
| `delete(collection, filter)` | `{ success: true, deletedCount }` or `{ success: false, error }` if not found |
| `count(collection, filter?)` | `{ success: true, data: number }` |
| `getVersion()` | `"1.0.1-dev"` on dev branch · `"1.0.1"` stable (Semver string, no envelope) |

### findAll options

`{ limit?, skip?, sort?, projection? }` — defaults: limit 100, skip 0.

### Extended exports

`isConnected`, `connect`, `disconnect`, `ensureIndexes`, `health`, `config`, `getDb` (internal — see API.md)

## CTFFramework

Required exports: `find`, `findAll`, `insert`, `update`, `delete`, `count`, `getVersion`.

Framework checks:

- Update success: `(modifiedCount ?? 0) > 0`
- Delete success: `deletedCount === 1`
- `insertedId` must be plain string
- `find` / `findById` not found: `{ success: true, data: null }`

## Events

| Event | When |
|-------|------|
| `cfx-mongodb:ready` | After connect + index init — **use before CRUD** |
| `cfx-mongodb:connected` | After connect attempt (`TriggerEvent`, server-local) |

Consumer resources: **`on(...)`** (TS) or **`AddEventHandler`** (Lua). Not `emitNet`.

## Development

```bash
yarn install
yarn build
yarn tsc
yarn test
yarn lint
```

## Troubleshooting

- Connection fails: check URI, firewall, `mongodb_log_level debug`, call `health()`
- Wrong Node version: confirm `node_version '22'` in manifest
- Consumer timing: ensure `cfx-mongodb:ready` fired before CRUD
- Slow queries: enable `mongodb_perf_enabled 1` and tune `mongodb_perf_slow_ms` (default 100). Warnings appear at `warn` level — set `mongodb_log_level warn` or lower. For verbose staging logs add `mongodb_perf_log_all 1` and `mongodb_log_level debug`. Production: leave perf off unless consciously diagnosing latency.
- Aggregates without console tailing: `exports['cfx-mongodb']:getQueryStats()` (sync) — ring buffer size via `mongodb_perf_buffer` (default 100).

## Changelog

See [CHANGELOG.md](CHANGELOG.md)
