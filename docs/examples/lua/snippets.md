# Lua snippets — cfx-mongodb

> **FiveM flows (account, character, garage):** [use-cases.md](use-cases.md)  
> API: [../../API.md](../../API.md) · Patterns: [patterns.md](patterns.md) · Queries: [queries.md](queries.md) · Tour: [server.lua](server.lua)

| Export | Snippet below | Real scenario |
|--------|:-------------:|---------------|
| `find` | ✓ | [use-cases § A](use-cases.md#flow-a--player-joins-load-account) |
| `findById` | ✓ | [use-cases § B](use-cases.md#flow-b--select-character) |
| `findAll` | ✓ | [use-cases § C](use-cases.md#flow-c--garage-list-vehicles) |
| `insert` | ✓ | [use-cases § B/F](use-cases.md#flow-b--select-character) |
| `update` | ✓ | [use-cases § D/E/G](use-cases.md#flow-d--save-character-on-logout) |
| `delete` | ✓ | [use-cases § delete](use-cases.md#delete) |
| `count` | ✓ | [use-cases § B](use-cases.md#flow-b--select-character) |
| `getVersion` / `isConnected` / `health` / `config` | ✓ | [use-cases § reference](use-cases.md#export-reference-quick-copy) |
| `ensureIndexes` | ✓ | [use-cases § ensureIndexes](use-cases.md#ensureindexes) |
| `getQueryStats` | — | [use-cases § getQueryStats](use-cases.md#getquerystats) |
| `connect` / `disconnect` / `getDb` | — | [use-cases § advanced](use-cases.md#connect--disconnect) |

Requires FiveM Node **22**. Wait for `cfx-mongodb:ready` before CRUD.

Each section: **what the export is for**, then minimal Lua. FiveM stories: [use-cases.md](use-cases.md).

## Operator keys in Lua

**What this does:** Explains Lua table syntax for Mongo operators (`$` keys).

Mongo operators start with `$`. In Lua tables, use **bracket keys**:

```lua
{ level = { ['$gt'] = 5 } }
{ ['$set'] = { name = 'Ada' } }
```

## Configuration (server.cfg)

**What this does:** Connect Mongo once for the whole server — consumer resources do not call `connect()`.

> ConVars only — see [../../CONFIGURATION.md](../../CONFIGURATION.md) · [../config/](../config/)

```cfg
exec mongodb.local.cfg
set mongodb_env dev
set mongodb_dev_url mongodb://localhost:27017/ctf_dev
ensure cfx-mongodb
```

## Events (server)

**What this does:** Subscribe to server-local lifecycle events — do not use `emitNet` for these.

```lua
local mongoReady = false

AddEventHandler('cfx-mongodb:ready', function()
  mongoReady = true
  print('[my-resource] MongoDB ready')
end)

AddEventHandler('cfx-mongodb:connected', function(success)
  print('[my-resource] MongoDB connected:', success)
end)

local function waitMongoReady()
  while not mongoReady do Wait(100) end
end
```

| Event | When |
|-------|------|
| `cfx-mongodb:ready` | After connect + index init — **before CRUD** |
| `cfx-mongodb:connected` | After successful connect |

## Connection & diagnostics

**What this does:** Check link status, version, ping, and safe config snapshot.

```lua
local isConnected = exports['cfx-mongodb']:isConnected()
local version = exports['cfx-mongodb']:getVersion()
local health = exports['cfx-mongodb']:health()
local cfg = exports['cfx-mongodb']:config()
```

## Insert

**What this does:** Create a new document; keep `insertedId` (string) for later lookups.

```lua
local result = exports['cfx-mongodb']:insert('players', {
  identifier = 'steam:123456789',
  name = 'John Smith',
  level = 10,
})

if result.success then
  print('Inserted ID:', result.insertedId)
else
  print('Error:', result.error)
end
```

## Find one

**What this does:** Load a single row by filter, or by id — `data == nil` means not found (not an error).

```lua
local player = exports['cfx-mongodb']:find('players', {
  identifier = 'steam:123456789',
})

if not player.success then
  print('Error:', player.error)
elseif player.data == nil then
  print('No matching document')
else
  print('Found:', player.data.name)
end

local byId = exports['cfx-mongodb']:findById('players', insertedId, { name = 1 })
if byId.success and byId.data then
  print('By ID:', byId.data.name)
end
```

## FindAll

**What this does:** Load many rows with optional sort, limit, skip, projection.

```lua
local all = exports['cfx-mongodb']:findAll('players')

local filtered = exports['cfx-mongodb']:findAll(
  'players',
  { level = { ['$gt'] = 5 } },
  { sort = { level = -1 }, limit = 10, skip = 0, projection = { name = 1 } }
)
```

More operators: [queries.md](queries.md).

## Update / delete / count

**What this does:** `update` patches fields; `delete` removes one doc; `count` returns a number only.

```lua
local updated = exports['cfx-mongodb']:update(
  'players',
  { _id = '674a1b2c3d4e5f6789012345' },
  { ['$set'] = { level = 11 } }
)

local deleted = exports['cfx-mongodb']:delete('players', {
  _id = '674a1b2c3d4e5f6789012345',
})

local total = exports['cfx-mongodb']:count('players', { active = true })
```

## ensureIndexes (manual)

**What this does:** Create DB indexes from your resource when `ready` fires.

```lua
exports['cfx-mongodb']:ensureIndexes('users', {
  { keys = { email = 1 }, options = { unique = true } },
})
```

## Return values (summary)

| Export | Success |
|--------|---------|
| `insert` | `{ success = true, insertedId = string }` |
| `find` / `findById` | `{ success = true, data = table \| nil }` |
| `findAll` | `{ success = true, data = table[] }` |
| `update` | `{ success = true, modifiedCount, matchedCount }` |
| `delete` | `{ success = true, deletedCount }` or not-found error |
| `count` | `{ success = true, data = number }` |
| `getVersion` | string (no envelope) |
| `health` | `{ success = true, data = { ok, rttMs } }` |

On error: `{ success = false, error = 'message' }` — exports never throw.

### Advanced / internal

`getDb`, `connect`, `disconnect` bypass envelope and query validation — trusted server only. See [../../API.md](../../API.md).
