# Examples

Copy-paste starters for **consumer resources** (not part of the `cfx-mongodb` build).

## Files

| File | Description |
|------|-------------|
| [typescript.md](typescript.md) | TypeScript snippets per export |
| [lua.md](lua.md) | Lua snippets per export |
| [server.ts](server.ts) | Runnable TS tour (wait for `cfx-mongodb:ready`) |
| [server.lua](server.lua) | Runnable Lua tour (same flow) |
| [fxmanifest-ts-example.lua](fxmanifest-ts-example.lua) | Manifest for TS consumer |
| [fxmanifest-lua-example.lua](fxmanifest-lua-example.lua) | Manifest for Lua consumer |

## server.cfg order

```cfg
ensure cfx-mongodb
ensure your-consumer-resource
```

Consumer code must wait for **`cfx-mongodb:ready`** before CRUD — see `server.ts` / `server.lua`.

## Export coverage

Canonical contract: [../API.md](../API.md).

| Export | typescript.md | lua.md | server.ts / server.lua | Notes |
|--------|:-------------:|:------:|:----------------------:|-------|
| `insert` | ✓ | ✓ | ✓ | |
| `find` | ✓ | ✓ | ✓ | incl. not-found (`data: null`) |
| `findById` | ✓ | ✓ | ✓ | |
| `findAll` | ✓ | ✓ | ✓ | projection, sort, limit, skip |
| `update` | ✓ | ✓ | ✓ | `$set` by `_id` |
| `delete` | ✓ | ✓ | ✓ | incl. not-found error |
| `count` | ✓ | ✓ | ✓ | |
| `getVersion` | ✓ | ✓ | ✓ | |
| `ensureIndexes` | ✓ | ✓ | ✓ | |
| `health` | ✓ | ✓ | ✓ | |
| `config` | ✓ | ✓ | ✓ | |
| `isConnected` | ✓ | ✓ | ✓ | guard after `ready` |
| `connect` | ✓ | — | — | Advanced — ConVars preferred; see API.md |
| `disconnect` | — | — | — | Advanced — API.md only |
| `getDb` | ✓ | ✓ | — | Advanced — API.md + warning in guides |

**Not available via exports:** aggregation pipelines, transactions, change streams — use CRUD exports only, or `getDb` in trusted server code (discouraged).

## What the runnable samples demonstrate

1. Listen for `cfx-mongodb:ready` (not raw `onResourceStart` on the consumer alone).
2. Insert → find → findById → findAll → update → count → delete.
3. Wave 2 semantics: `find` missing doc → `{ success: true, data: null }`.
4. Delete with no match → `{ success: false, error: "Document not found" }`.
