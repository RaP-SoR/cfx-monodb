# CFX MongoDB Wrapper — Full Documentation

## Overview
A secure, performant MongoDB wrapper for FiveM/RedM server resources. Targets Node 22 and MongoDB driver v7. Provides safe CRUD exports, pooled connections, structured logging, health checks, and automatic/manual index creation.

## Requirements
- FiveM/RedM runtime with Node 22 in your resource manifest: `node_version '22'`.
- A reachable MongoDB server.

## Installation
1) Place this resource as `cfx-mongodb` and add to `server.cfg`:
- ensure cfx-mongodb

2) Set configuration ConVars (see below) for environment, URLs, pool sizes, timeouts, and logging.

## Configuration (ConVars)
- `mongodb_env` — Environment name: `dev|prod|test` (default auto from hostname)
- `mongodb_dev_url` — Mongo URI for dev
- `mongodb_prod_url` — Mongo URI for prod
- `mongodb_test_url` — Mongo URI for test
- `mongodb_timeout` — Server selection timeout in ms (e.g., `5000`)
- `mongodb_max_pool` — Max pool size (clamped 0–50)
- `mongodb_min_pool` — Min pool size (clamped 0–20)
- `mongodb_log_level` — `error|warn|info|debug` (default `info`)
- `mongodb_init_indexes` — JSON map of collection → index specs (auto-create on startup)
  - Example: `{ "users": [ { "keys": { "email": 1 }, "options": { "unique": true } } ] }`
- `mongodb_slow_ms` — Warn on slow queries exceeding this duration in ms (default `200`)

## API Reference (Server Exports)
All exports return a table/object with at least `success`. On error: `{ success: false, error: string }`.

- `isConnected()` → `boolean`
- `connect(url, options?)` → override the URI/options at runtime (prefer ConVars)
- `getDb()` → internal DB reference (for advanced scenarios)
- `insert(collection, doc)` → `{ success: true, insertedId }`
- `find(collection, filter?)` → `{ success: true, data: T | null }`
- `findAll(collection, filter?, options?)` → `{ success: true, data: T[] }`
  - options: `{ projection?, sort?, limit?, skip? }` with safe defaults/clamps
- `findById(collection, id, projection?)` → `{ success: true, data: T | null }`
- `update(collection, filter, update|partial)` → `{ success: true, matchedCount, modifiedCount }`
- `delete(collection, filter)` → `{ success: true, deletedCount }`
- `count(collection, filter?)` → `{ success: true, data: number }`
- `ensureIndexes(collection, specs)` → create multiple indexes idempotently
- `health()` → `{ success: true, data: { ok: true, rttMs } }`
- `config()` → `{ success: true, data: { env, timeout, maxPoolSize, minPoolSize, logLevel } }`

## Indexing
- Automatic: provide `mongodb_init_indexes` JSON; indexes are created on startup.
- Manual: call `ensureIndexes('users', [ { keys: { email: 1 }, options: { unique: true } } ])`.
- Event: after connect + index init, the resource emits `cfx-mongodb:ready`.

## Logging & Health
- Log levels: `mongodb_log_level` controls verbosity. Debug adds timing logs and extra health details in server output.
- Slow queries: if duration > `mongodb_slow_ms`, a warning is logged; debug logs timings for all operations.
- Health: `health()` pings MongoDB and returns RTT; when debug, logs driver/server info.

## Usage Examples

TypeScript (other resource)
- on('cfx-mongodb:ready', async () => {
  - const h = await (exports as any)['cfx-mongodb'].health();
  - const ins = await (exports as any)['cfx-mongodb'].insert('users', { email: 'u@example.com', createdAt: Date.now() });
  - const one = await (exports as any)['cfx-mongodb'].find('users', { email: 'u@example.com' });
  - const many = await (exports as any)['cfx-mongodb'].findAll('users', { active: true }, { projection: { email: 1 }, sort: { createdAt: -1 }, limit: 50 });
  - const byId = await (exports as any)['cfx-mongodb'].findById('users', String(ins.insertedId), { email: 1 });
  - await (exports as any)['cfx-mongodb'].update('users', { email: 'u@example.com' }, { $set: { active: false } });
  - const cnt = await (exports as any)['cfx-mongodb'].count('users', { active: false });
  - await (exports as any)['cfx-mongodb'].delete('users', { email: 'u@example.com' });
  })

Lua (other resource)
- AddEventHandler('cfx-mongodb:ready', function()
  - local health = exports['cfx-mongodb']:health()
  - local ins = exports['cfx-mongodb']:insert('users', { email = 'u@example.com', createdAt = os.time() })
  - local one = exports['cfx-mongodb']:find('users', { email = 'u@example.com' })
  - local many = exports['cfx-mongodb']:findAll('users', { active = true }, { projection = { email = 1 }, sort = { createdAt = -1 }, limit = 50 })
  - local byId = exports['cfx-mongodb']:findById('users', tostring(ins.insertedId), { email = 1 })
  - exports['cfx-mongodb']:update('users', { email = 'u@example.com' }, { ['$set'] = { active = false } })
  - local cnt = exports['cfx-mongodb']:count('users', { active = false })
  - exports['cfx-mongodb']:delete('users', { email = 'u@example.com' })
  end)

## Development
- Build: `yarn build`
- Type-check: `yarn tsc`
- Lint: `yarn lint`

## CI & Releases
- Branch matrices for `node16` and `node22`.
- Main-only release workflow publishes `dist/` artifact; push tag `vX.Y.Z` to create a GitHub Release.

## Troubleshooting
- “Cannot set property navigator of object global”: ensure Vite is SSR for Node (already configured) and no browser polyfills are introduced.
- Type errors with CitizenFX types: `tsconfig.json` includes only `@citizenfx/server` for server-side builds.
- Connection fails: verify URI, firewall, and timeouts; check logs at `mongodb_log_level=debug`.

## Changelog
- See `CHANGES.md` for a human-readable summary of recent changes.
