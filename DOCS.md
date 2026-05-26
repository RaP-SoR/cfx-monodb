# CFX MongoDB Wrapper — Full Documentation

> **Canonical API:** [docs/API.md](docs/API.md)  
> **Agent navigation:** [SEARCH-MAP.md](SEARCH-MAP.md)

## Overview

Secure MongoDB wrapper for FiveM/RedM. TypeScript source compiled to `dist/index.js`. Targets **Node 22** and **MongoDB driver v7**. Safe CRUD exports, pooled connections, structured logging, health checks, index creation.

## Requirements

- FiveM/RedM with `node_version '22'` in `fxmanifest.lua`
- **Node 22 only** — no support for embedded Node 16/18 (outdated, security-critical package chains on RedM)
- Reachable MongoDB server
- Node 22.x for local development

## Installation

1. Resource folder: `cfx-mongodb`
2. `server.cfg`: `ensure cfx-mongodb`
3. Configure ConVars (below)

## Configuration (ConVars)

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

Full contract: **[docs/API.md](docs/API.md)**

### Response envelope

All CRUD exports return `{ success: boolean, ... }`. On error: `{ success: false, error: string }`. **Exports never throw.**

### Core exports

| Export | Returns (success) |
|--------|-------------------|
| `insert(collection, doc)` | `{ success: true, insertedId: string }` |
| `find(collection, filter?)` | `{ success: true, data: doc }` |
| `findAll(collection, filter?, options?)` | `{ success: true, data: doc[] }` |
| `update(collection, filter, update)` | `{ success: true, modifiedCount, matchedCount }` |
| `delete(collection, filter)` | `{ success: true, deletedCount }` |
| `count(collection, filter?)` | `{ success: true, data: number }` |
| `getVersion()` | `"1.0.1"` (Semver string) |

### findAll options

`{ limit?, skip?, sort?, projection? }` — defaults: limit 100, skip 0.

### Extended exports

`isConnected`, `connect`, `disconnect`, `ensureIndexes`, `health`, `config`

## CTFFramework

Required exports: `find`, `findAll`, `insert`, `update`, `delete`, `count`, `getVersion`.

Framework checks:
- Update success: `(modifiedCount ?? 0) > 0`
- Delete success: `deletedCount === 1`
- `insertedId` must be plain string

## Events

| Event | When |
|-------|------|
| `cfx-mongodb:ready` | After connect + index init — **use this before CRUD** |
| `cfx-mongodb:connected` | After connect attempt |

## Usage Examples

### TypeScript

```typescript
on('cfx-mongodb:ready', async () => {
  const version = await exports['cfx-mongodb'].getVersion();
  const ins = await exports['cfx-mongodb'].insert('users', { email: 'u@example.com' });
  const one = await exports['cfx-mongodb'].find('users', { email: 'u@example.com' });
  const many = await exports['cfx-mongodb'].findAll('users', { active: true }, { limit: 50, sort: { createdAt: -1 } });
  await exports['cfx-mongodb'].update('users', { _id: ins.insertedId }, { $set: { active: false } });
  await exports['cfx-mongodb'].delete('users', { _id: ins.insertedId });
});
```

### Lua

```lua
AddEventHandler('cfx-mongodb:ready', function()
  local version = exports['cfx-mongodb']:getVersion()
  local ins = exports['cfx-mongodb']:insert('users', { email = 'u@example.com' })
  local one = exports['cfx-mongodb']:find('users', { email = 'u@example.com' })
  exports['cfx-mongodb']:update('users', { _id = ins.insertedId }, { ['$set'] = { active = false } })
  exports['cfx-mongodb']:delete('users', { _id = ins.insertedId })
end)
```

## Development

```bash
yarn build
yarn tsc
yarn lint
```

## Troubleshooting

- Connection fails: check URI, firewall, `mongodb_log_level debug`, call `health()`
- Navigator errors: ensure Vite SSR build (see `vite.config.mjs`)
- Wrong Node version: confirm `node_version '22'` in manifest

## Changelog

See [CHANGES.md](CHANGES.md)
